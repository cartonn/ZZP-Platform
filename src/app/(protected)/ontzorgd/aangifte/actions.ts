"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { hasEntitlement } from "@/lib/entitlements";
import { type LedgerEntry } from "@/lib/administration/overview";
import { type LedgerParty } from "@/lib/administration/ledger";
import { buildOntzorgOverview } from "@/lib/tax/ontzorg-overview";
import { assertTaxFilingTransition } from "@/lib/tax-filing/state";
import { getTaxFilingPartner, type TaxDossier } from "@/lib/tax-filing/partner";
import { DPA_VERSION, PARTNER_NAME } from "@/lib/tax-filing/config";
import {
  taxFilingKindSchema,
  mandateKindSchema,
  type PlanKey,
  type TaxFilingKind,
  type TaxFilingStatus,
} from "@/lib/enums";

export type FilingState = { error?: string } | undefined;

const startSchema = z.object({
  kind: taxFilingKindSchema,
  taxYear: z.coerce.number().int().min(2020).max(2100),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  mandateKind: mandateKindSchema,
  // Granulaire toestemming — elk los, geen voorgevinkte vakjes (AVG).
  consentDpa: z.literal("on"),
  consentShare: z.literal("on"),
  consentMandate: z.literal("on"),
});

async function planKeyFor(userId: string): Promise<PlanKey> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  return sub?.status === "ACTIVE" ? (sub.plan.key as PlanKey) : "FREE";
}

/** Bouwt het (geschatte) aangiftebedrag uit de eigen administratie. */
async function buildDossier(
  userId: string,
  kind: TaxFilingKind,
  taxYear: number,
  quarter: number,
): Promise<TaxDossier> {
  // unbounded-allow: eigenaar-scoped aggregatie voor aangifte
  const rows = await prisma.administrationEntry.findMany({ where: { ownerUserId: userId } });
  const entries: LedgerEntry[] = rows.map((r) => ({
    party: r.party as LedgerParty,
    account: r.account as LedgerEntry["account"],
    debitCents: r.debitCents,
    creditCents: r.creditCents,
    occurredAt: r.occurredAt,
  }));
  const hoursAgg = await prisma.performance.aggregate({
    _sum: { hours: true },
    where: {
      status: "APPROVED",
      type: "HOURS",
      collaboration: { freelancer: { userId } },
      approvedAt: {
        gte: new Date(Date.UTC(taxYear, 0, 1)),
        lte: new Date(Date.UTC(taxYear, 11, 31, 23, 59, 59)),
      },
    },
  });
  const o = buildOntzorgOverview({
    entries,
    directHours: Math.round(hoursAgg._sum.hours ?? 0),
    indirectHours: 0,
    now: new Date(Date.UTC(taxYear, 11, 31)),
  });
  const estimateCents = kind === "IB" ? o.incomeTax.totalCents : Math.max(0, o.vatBalanceCents);
  return {
    taxYear,
    kind,
    quarter,
    estimateCents,
    payload: {
      profitCents: o.profitCents,
      incomeTax: o.incomeTax,
      vatBalanceCents: o.vatBalanceCents,
    },
  };
}

/**
 * Start een aangifte-delegatie: controleert tier + granulaire toestemming, legt het verzoek vast
 * (status AKKOORD), en laat de partner direct een concept voorbereiden (→ CONCEPT_KLAAR).
 * De feitelijke indiening gebeurt pas na het definitieve akkoord van de klant.
 */
export async function startFiling(_prev: FilingState, formData: FormData): Promise<FilingState> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  if (actor.role !== "FREELANCER") return { error: "Alleen voor ZZP'ers." };

  // Server-side entitlement (CLAUDE.md regel 1): alleen Volledig Ontzorgd ontsluit dit.
  const planKey = await planKeyFor(actor.id);
  if (!hasEntitlement(planKey, "VOLLEDIG_ONTZORGD")) {
    return { error: "Aangifte-service hoort bij Volledig Ontzorgd. Upgrade je abonnement." };
  }

  const parsed = startSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Geef akkoord op alle drie de onderdelen om door te gaan." };
  }
  const { kind, taxYear, mandateKind } = parsed.data;
  const quarter = kind === "BTW" ? (parsed.data.quarter ?? 1) : 0; // IB = 0 (n.v.t.)

  const now = new Date();
  const dossier = await buildDossier(actor.id, kind, taxYear, quarter);
  const partner = getTaxFilingPartner();
  const concept = await partner.prepareConcept(dossier);

  // Aanmaken (AKKOORD) → partner neemt in behandeling → concept klaar. Statusovergangen gevalideerd.
  assertTaxFilingTransition("AKKOORD", "IN_BEHANDELING");
  assertTaxFilingTransition("IN_BEHANDELING", "CONCEPT_KLAAR");

  const request = await prisma.taxFilingRequest.upsert({
    where: { userId_taxYear_kind_quarter: { userId: actor.id, taxYear, kind, quarter } },
    update: {}, // bestaat al — niet dupliceren
    create: {
      userId: actor.id,
      taxYear,
      kind,
      quarter,
      status: "CONCEPT_KLAAR",
      partnerName: concept.partnerName ?? PARTNER_NAME,
      mandateKind,
      dpaAcceptedVersion: DPA_VERSION,
      consentShareAt: now,
      consentMandateAt: now,
      conceptAmountCents: concept.conceptAmountCents,
      conceptSharedAt: now,
    },
  });

  await audit({
    actorId: actor.id,
    action: "TAX_FILING_REQUESTED",
    entityType: "TaxFilingRequest",
    entityId: request.id,
    metadata: {
      kind,
      taxYear,
      quarter,
      mandateKind,
      partner: concept.partnerName,
      dpa: DPA_VERSION,
    },
  });

  revalidatePath("/ontzorgd/aangifte");
  return undefined;
}

/** Review-then-submit: de klant geeft definitief akkoord; de partner dient daarna in. */
export async function approveAndSubmit(requestId: string): Promise<void> {
  const actor = await requireActor();
  const req = await prisma.taxFilingRequest.findUnique({ where: { id: requestId } });
  if (!req || req.userId !== actor.id) throw new Error("Verzoek niet gevonden.");

  assertTaxFilingTransition(req.status as TaxFilingStatus, "INGEDIEND");
  const partner = getTaxFilingPartner();
  const sub = await partner.submit({
    taxYear: req.taxYear,
    kind: req.kind as TaxFilingKind,
    quarter: req.quarter,
    estimateCents: req.conceptAmountCents ?? 0,
    payload: {},
  });

  await prisma.taxFilingRequest.update({
    where: { id: requestId },
    data: {
      status: "INGEDIEND",
      clientApprovedAt: new Date(),
      submittedAt: new Date(),
      submissionRef: sub.submissionRef,
    },
  });
  await audit({
    actorId: actor.id,
    action: "TAX_FILING_SUBMITTED",
    entityType: "TaxFilingRequest",
    entityId: requestId,
    metadata: { ref: sub.submissionRef },
  });
  revalidatePath("/ontzorgd/aangifte");
}

/** Machtiging intrekken (intrekbaar, AVG). Mag alleen vóór indiening. */
export async function revokeFiling(requestId: string): Promise<void> {
  const actor = await requireActor();
  const req = await prisma.taxFilingRequest.findUnique({ where: { id: requestId } });
  if (!req || req.userId !== actor.id) throw new Error("Verzoek niet gevonden.");

  assertTaxFilingTransition(req.status as TaxFilingStatus, "INGETROKKEN");
  await prisma.taxFilingRequest.update({
    where: { id: requestId },
    data: { status: "INGETROKKEN", revokedAt: new Date() },
  });
  await audit({
    actorId: actor.id,
    action: "TAX_FILING_REVOKED",
    entityType: "TaxFilingRequest",
    entityId: requestId,
  });
  revalidatePath("/ontzorgd/aangifte");
}
