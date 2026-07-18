// Events B1 (prestatie indienen), B2 (goedkeuren), B2' (afkeuren) + concept-aanmaak en correctie.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { getMailSender } from "@/lib/services/mail-sender";
import {
  buildPerformanceSubmittedEmail,
  buildPerformanceApprovedEmail,
  buildPerformanceRejectedEmail,
} from "@/lib/services/cascade-emails";
import {
  planPerformanceSubmitted,
  planPerformanceApproved,
  planPerformanceRejected,
} from "@/lib/cascade/handlers";
import { type OrtSegment, resolveOrtRates } from "@/lib/ort";
import { DEFAULT_VAT_REGIME } from "@/lib/config";
import { MAX_PERFORMANCE_HOURS, MAX_MILESTONE_CENTS } from "@/lib/validation";
import {
  CascadeError,
  assertNotDisputed,
  assertCollaborationNotTerminal,
  persistEventAndEffects,
  loadPerformance,
  loadCollabMeta,
  collabLink,
} from "@/lib/cascade/commands-shared";
import { boundReason } from "@/lib/text-bounds";

// --- Urenstaat/oplevering aanmaken (concept) -------------------------------
export interface CreatePerformanceInput {
  collaborationId: string;
  type: "HOURS" | "MILESTONE";
  hours?: number | null;
  rateCents?: number | null;
  amountCents?: number | null;
  /** ORT-segmenten (zorg): uren per tijdscategorie; bepaalt het factuursubtotaal met toeslag. */
  ortSegments?: OrtSegment[] | null;
  /** Ruwe diensttijden (ADR-0005): bewaard zodat een afgekeurde prestatie inline te corrigeren is. */
  shifts?: { start: Date; end: Date }[] | null;
  milestoneTitle?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  description?: string;
}

/** Lokale `datetime-local`-string (yyyy-MM-ddTHH:mm) zodat de diensten zonder tijdzone-drift
 * exact terugvullen in het formulier (de invoer was óók lokale tijd). */
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Serialiseert ruwe diensten naar JSON voor opslag; null als er geen diensten zijn. */
function serializeShifts(shifts: { start: Date; end: Date }[] | null | undefined): string | null {
  if (!shifts || shifts.length === 0) return null;
  return JSON.stringify(
    shifts.map((s) => ({ start: toLocalInput(s.start), end: toLocalInput(s.end) })),
  );
}

/**
 * Harde bovengrens op uren/bedrag — server-side waarheid (CLAUDE.md regel 1), onafhankelijk van het
 * formulier. Dekt élk pad naar createPerformance/updatePerformance (handmatige urenstaat én de
 * CSV-diensten-import). Zonder deze grens overschrijdt het bij goedkeuring afgeleide factuurbedrag de
 * `Int`-kolom `totalCents` (int4) → Prisma-conversiefout → 500 i.p.v. een nette weigering.
 */
export function assertPerformanceWithinLimits(input: {
  type: "HOURS" | "MILESTONE";
  hours?: number | null;
  amountCents?: number | null;
}): void {
  if (input.type === "HOURS") {
    // Defense-in-depth (dekt élk pad: formulier, CSV-import, admin): een niet-eindig getal (NaN uit
    // een geknutselde/corrupte invoer) is noch `> MAX` noch onder de grens en zou anders als Float
    // persisteren en bij factuurafleiding een NaN-`totalCents` (Int) opleveren → 500 i.p.v. weigering.
    if (input.hours != null && !Number.isFinite(input.hours)) {
      throw new CascadeError("Het aantal uren is ongeldig.");
    }
    // Ondergrens: een negatief/nul aantal uren zou via performanceSubtotalCents een negatieve
    // factuur opleveren. Server-side waarheid (regel 1) — niet afhankelijk van de Zod-formuliercheck.
    // De `!= null`-guard bewaart het "niet ingevuld"-pad (null = concept zonder uren).
    if (input.hours != null && input.hours <= 0) {
      throw new CascadeError("Het aantal uren moet groter dan 0 zijn.");
    }
    if ((input.hours ?? 0) > MAX_PERFORMANCE_HOURS) {
      throw new CascadeError(
        `Het aantal uren is onrealistisch hoog (maximaal ${MAX_PERFORMANCE_HOURS} uur per urenstaat).`,
      );
    }
  } else {
    if (input.amountCents != null && !Number.isFinite(input.amountCents)) {
      throw new CascadeError("Het bedrag is ongeldig.");
    }
    // Ondergrens: een negatief/nul bedrag zou een negatieve factuur opleveren. Server-side waarheid
    // (regel 1) — niet afhankelijk van de Zod-formuliercheck. `!= null` bewaart het concept-pad.
    if (input.amountCents != null && input.amountCents <= 0) {
      throw new CascadeError("Het bedrag moet groter dan 0 zijn.");
    }
    if ((input.amountCents ?? 0) > MAX_MILESTONE_CENTS) {
      throw new CascadeError(
        "Het bedrag is onrealistisch hoog (maximaal € 1.000.000 per oplevering).",
      );
    }
  }
}

/** ZZP'er legt een concept-urenstaat/oplevering vast (nog geen event; pas indienen triggert B1). */
export async function createPerformance(
  actor: Actor,
  input: CreatePerformanceInput,
): Promise<string> {
  assertPerformanceWithinLimits(input);
  const col = await prisma.collaboration.findUnique({
    where: { id: input.collaborationId },
    include: { freelancer: { select: { userId: true } }, company: { select: { userId: true } } },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  if (actor.role !== "ADMIN" && actor.id !== col.freelancer.userId) {
    throw new CascadeError("Alleen de ZZP'er kan een prestatie vastleggen.");
  }
  if (col.status !== "ACTIVE") throw new CascadeError("De samenwerking is niet actief.");

  const perf = await prisma.performance.create({
    data: {
      collaborationId: input.collaborationId,
      type: input.type,
      status: "DRAFT",
      hours: input.type === "HOURS" ? (input.hours ?? null) : null,
      rateCents: input.type === "HOURS" ? (input.rateCents ?? null) : null,
      ortSegments:
        input.type === "HOURS" && input.ortSegments?.length
          ? JSON.stringify(input.ortSegments)
          : null,
      shifts: input.type === "HOURS" ? serializeShifts(input.shifts) : null,
      amountCents: input.type === "MILESTONE" ? (input.amountCents ?? null) : null,
      milestoneTitle: input.type === "MILESTONE" ? (input.milestoneTitle ?? null) : null,
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
      description: input.description ?? "",
      correlationId: input.collaborationId,
    },
  });
  return perf.id;
}

/**
 * Corrigeert de waarden van een nog niet-definitieve prestatie (alleen eigenaar; alleen DRAFT of
 * REJECTED). Overschrijft de invoer-/afgeleide velden vóór een (her)indiening. Emit géén event —
 * het PERFORMANCE_SUBMITTED-event valt op de daaropvolgende submitPerformance. Zie ADR-0005.
 */
export async function updatePerformance(
  actor: Actor,
  performanceId: string,
  input: Omit<CreatePerformanceInput, "collaborationId">,
): Promise<void> {
  assertPerformanceWithinLimits(input);
  const perf = await loadPerformance(performanceId);
  if (actor.role !== "ADMIN" && actor.id !== perf.freelancerUserId) {
    throw new CascadeError("Alleen de ZZP'er kan de prestatie aanpassen.");
  }
  if (perf.status !== "DRAFT" && perf.status !== "REJECTED") {
    throw new CascadeError("Alleen een concept of afgekeurde prestatie kan worden aangepast.");
  }
  await assertNotDisputed(perf.collaborationId);
  await prisma.performance.update({
    where: { id: performanceId },
    data: {
      type: input.type,
      hours: input.type === "HOURS" ? (input.hours ?? null) : null,
      rateCents: input.type === "HOURS" ? (input.rateCents ?? null) : null,
      ortSegments:
        input.type === "HOURS" && input.ortSegments?.length
          ? JSON.stringify(input.ortSegments)
          : null,
      shifts: input.type === "HOURS" ? serializeShifts(input.shifts) : null,
      amountCents: input.type === "MILESTONE" ? (input.amountCents ?? null) : null,
      milestoneTitle: input.type === "MILESTONE" ? (input.milestoneTitle ?? null) : null,
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
      description: input.description ?? "",
    },
  });
}

// --- Event B1 — Prestatie indienen -----------------------------------------
export async function submitPerformance(actor: Actor, performanceId: string): Promise<void> {
  const perf = await loadPerformance(performanceId);
  if (actor.role !== "ADMIN" && actor.id !== perf.freelancerUserId) {
    throw new CascadeError("Alleen de ZZP'er kan de prestatie indienen.");
  }
  await assertNotDisputed(perf.collaborationId);
  // Terminale-status-rem: een DRAFT-prestatie die vóór annulering is aangemaakt mag ná annulering
  // niet alsnog worden ingediend (weespad — `createPerformance` eist ACTIVE, `submitPerformance` deed
  // dat niet). Ook een afgeronde deal krijgt geen nieuw ingediend werk meer.
  await assertCollaborationNotTerminal(perf.collaborationId);
  const effects = planPerformanceSubmitted({
    performanceId,
    status: perf.status,
    performanceType: perf.type,
    collaborationId: perf.collaborationId,
    clientUserId: perf.clientUserId,
    now: new Date(),
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "PERFORMANCE_SUBMITTED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Performance",
      subjectId: performanceId,
      correlationId: perf.collaborationId,
    },
    effects,
    {
      owners: { FREELANCER: perf.freelancerUserId, CLIENT: perf.clientUserId },
      correlationId: perf.collaborationId,
      performanceId,
      disputeGuardCollaborationId: perf.collaborationId,
      terminalGuard: true,
    },
  );

  // Best-effort e-mail naar de opdrachtgever.
  try {
    const meta = await loadCollabMeta(perf.collaborationId);
    if (meta) {
      await getMailSender().send(
        buildPerformanceSubmittedEmail({
          recipient: meta.client,
          freelancerName: meta.freelancer.name,
          jobTitle: meta.jobTitle,
          link: collabLink(perf.collaborationId),
        }),
      );
    }
  } catch {}
}

// --- Event B2 — Prestatie goedkeuren -> concept-factuur --------------------
export async function approvePerformance(actor: Actor, performanceId: string): Promise<void> {
  const perf = await loadPerformance(performanceId);
  if (actor.role !== "ADMIN" && actor.id !== perf.clientUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de prestatie goedkeuren.");
  }
  await assertNotDisputed(perf.collaborationId);
  await assertCollaborationNotTerminal(perf.collaborationId);
  const effects = planPerformanceApproved({
    performance: {
      id: performanceId,
      status: perf.status,
      type: perf.type,
      hours: perf.hours,
      rateCents: perf.rateCents,
      amountCents: perf.amountCents,
      ortSegments: perf.ortSegments,
      ortRates: perf.ortSegments?.length
        ? resolveOrtRates({ ortProfile: perf.ortProfile, ortCustomRates: perf.ortCustomRates })
        : null,
      collaborationId: perf.collaborationId,
    },
    freelancerUserId: perf.freelancerUserId,
    clientUserId: perf.clientUserId,
    issuerKey: perf.freelancerUserId,
    vatRegime: DEFAULT_VAT_REGIME,
    correlationId: perf.collaborationId,
    now: new Date(),
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "PERFORMANCE_APPROVED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Performance",
      subjectId: performanceId,
      correlationId: perf.collaborationId,
      // Eenmalige overgang: dedupeKey maakt een dubbele goedkeuring een nette no-op i.p.v. een
      // P2002 op Invoice.performanceId (de concept-factuur wordt dan niet nogmaals aangemaakt).
      dedupeKey: `performance-approved-${performanceId}`,
    },
    effects,
    {
      owners: { FREELANCER: perf.freelancerUserId, CLIENT: perf.clientUserId },
      correlationId: perf.collaborationId,
      performanceId,
      disputeGuardCollaborationId: perf.collaborationId,
      terminalGuard: true,
    },
  );

  // Best-effort e-mail naar de ZZP'er.
  try {
    const meta = await loadCollabMeta(perf.collaborationId);
    if (meta) {
      await getMailSender().send(
        buildPerformanceApprovedEmail({
          recipient: meta.freelancer,
          jobTitle: meta.jobTitle,
          link: collabLink(perf.collaborationId),
        }),
      );
    }
  } catch {}
}

/**
 * Systeem-goedkeuring na het grace-venster: een ingediende prestatie die de opdrachtgever niet op
 * tijd beoordeelde wordt automatisch goedgekeurd, zodat de ZZP'er kan factureren ondanks een stille
 * opdrachtgever. Geen actor (SYSTEM/null in de audit). Spiegelt approvePerformance — dezelfde
 * factuur-cascade en dezelfde dedupeKey, dus een dubbele run is een nette no-op. Idempotent: een
 * prestatie die niet (meer) INGEDIEND is, wordt overgeslagen.
 */
export async function autoApprovePerformance(performanceId: string): Promise<void> {
  const perf = await loadPerformance(performanceId);
  if (perf.status !== "SUBMITTED") return; // alleen ingediende prestaties; idempotent
  await assertNotDisputed(perf.collaborationId);
  await assertCollaborationNotTerminal(perf.collaborationId);
  const effects = planPerformanceApproved({
    performance: {
      id: performanceId,
      status: perf.status,
      type: perf.type,
      hours: perf.hours,
      rateCents: perf.rateCents,
      amountCents: perf.amountCents,
      ortSegments: perf.ortSegments,
      ortRates: perf.ortSegments?.length
        ? resolveOrtRates({ ortProfile: perf.ortProfile, ortCustomRates: perf.ortCustomRates })
        : null,
      collaborationId: perf.collaborationId,
    },
    freelancerUserId: perf.freelancerUserId,
    clientUserId: perf.clientUserId,
    issuerKey: perf.freelancerUserId,
    vatRegime: DEFAULT_VAT_REGIME,
    correlationId: perf.collaborationId,
    now: new Date(),
    actorId: null,
  });
  await persistEventAndEffects(
    {
      type: "PERFORMANCE_APPROVED",
      actorRole: "SYSTEM",
      actorId: null,
      subjectType: "Performance",
      subjectId: performanceId,
      correlationId: perf.collaborationId,
      // Dezelfde dedupeKey als de handmatige goedkeuring: een prestatie kan nooit twee keer
      // worden goedgekeurd (geen dubbele concept-factuur), ongeacht wie/wat de overgang trekt.
      dedupeKey: `performance-approved-${performanceId}`,
    },
    effects,
    {
      owners: { FREELANCER: perf.freelancerUserId, CLIENT: perf.clientUserId },
      correlationId: perf.collaborationId,
      performanceId,
      disputeGuardCollaborationId: perf.collaborationId,
      terminalGuard: true,
    },
  );

  // Transparantie: beide partijen weten dat de goedkeuring automatisch (na het venster) gebeurde.
  try {
    await prisma.notification.createMany({
      data: [
        {
          userId: perf.clientUserId,
          type: "PERFORMANCE_AUTO_APPROVED",
          title: "Prestatie automatisch goedgekeurd",
          body: "Je hebt een ingediende prestatie niet op tijd beoordeeld; deze is nu automatisch goedgekeurd.",
          link: collabLink(perf.collaborationId),
        },
        {
          userId: perf.freelancerUserId,
          type: "PERFORMANCE_AUTO_APPROVED",
          title: "Je prestatie is automatisch goedgekeurd",
          body: "De opdrachtgever reageerde niet binnen het venster; je kunt nu factureren.",
          link: collabLink(perf.collaborationId),
        },
      ],
    });
  } catch {}

  // Best-effort e-mail naar de ZZP'er (zelfde mail als bij handmatige goedkeuring).
  try {
    const meta = await loadCollabMeta(perf.collaborationId);
    if (meta) {
      await getMailSender().send(
        buildPerformanceApprovedEmail({
          recipient: meta.freelancer,
          jobTitle: meta.jobTitle,
          link: collabLink(perf.collaborationId),
        }),
      );
    }
  } catch {}
}

// --- Event B2' — Prestatie afkeuren ----------------------------------------
export async function rejectPerformance(
  actor: Actor,
  performanceId: string,
  reason: string,
): Promise<void> {
  reason = boundReason(reason); // defense-in-depth: kap onbegrensde vrije tekst (PII/audit/notificatie)
  const perf = await loadPerformance(performanceId);
  if (actor.role !== "ADMIN" && actor.id !== perf.clientUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de prestatie afkeuren.");
  }
  // Tijdens een dispuut bevriest de cascade — ook afkeuren is een transitie (§4 zijpad).
  await assertNotDisputed(perf.collaborationId);
  const effects = planPerformanceRejected({
    performanceId,
    status: perf.status,
    freelancerUserId: perf.freelancerUserId,
    reason,
    now: new Date(),
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "PERFORMANCE_REJECTED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Performance",
      subjectId: performanceId,
      correlationId: perf.collaborationId,
    },
    effects,
    {
      owners: { FREELANCER: perf.freelancerUserId, CLIENT: perf.clientUserId },
      correlationId: perf.collaborationId,
      performanceId,
      disputeGuardCollaborationId: perf.collaborationId,
    },
  );

  // Best-effort e-mail naar de ZZP'er met de reden.
  try {
    const meta = await loadCollabMeta(perf.collaborationId);
    if (meta) {
      await getMailSender().send(
        buildPerformanceRejectedEmail({
          recipient: meta.freelancer,
          jobTitle: meta.jobTitle,
          reason,
          link: collabLink(perf.collaborationId),
        }),
      );
    }
  } catch {}
}
