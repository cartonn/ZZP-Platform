// Command-laag voor de cascade (PLATFORM_OVERHAUL.md §4). Elke command is de "actie"-stap van de
// mutatieketen (CLAUDE.md regel 2): auth/rol/ownership doet de aanroepende serveractie, hier volgt
// ownership-verificatie + load -> pure planner -> atomair wegschrijven (DomainEvent + effecten +
// idempotentie-marker) in één interactieve transactie. Niets wijzigt domeinstatus buiten dit pad om.
//
// De live Invoice/Collaboration-flow blijft werken; dit is de nieuwe, parallelle cascade.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { type DomainEventInput } from "@/lib/events";
import { allocateInvoiceNumber, type PartyOwners } from "@/lib/administration/persist";
import { getMailSender } from "@/lib/services/mail-sender";
import {
  type UserContact,
  buildContractSignedEmail,
  buildPerformanceSubmittedEmail,
  buildPerformanceApprovedEmail,
  buildPerformanceRejectedEmail,
  buildInvoiceSubmittedEmail,
  buildInvoiceApprovedEmail,
  buildInvoiceRejectedEmail,
  buildPaymentConfirmedEmail,
} from "@/lib/services/cascade-emails";
import { applyCascadeEffects } from "@/lib/cascade/apply";
import { type CascadeEffects } from "@/lib/cascade/types";
import {
  planContractSigned,
  planPerformanceSubmitted,
  planPerformanceApproved,
  planPerformanceRejected,
  planInvoiceSubmittedEvent,
  planInvoiceApprovedEvent,
  planInvoiceRejectedEvent,
  planPaymentConfirmedEvent,
  planInvoiceCreditedEvent,
} from "@/lib/cascade/handlers";
import { type CollaborationStatus } from "@/lib/enums";
import { type OrtSegment, resolveOrtRates } from "@/lib/ort";
import { type InvoiceLifecycleState, type PerformanceState } from "@/lib/lifecycles";
import { DEFAULT_PAYMENT_TERM_DAYS, DEFAULT_VAT_REGIME } from "@/lib/config";

export class CascadeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CascadeError";
  }
}

interface PersistResult {
  createdInvoiceId?: string;
}

/**
 * Schrijft het DomainEvent + de effecten + de idempotentie-marker atomair weg. De marker
 * (EventHandlerRun) zit in dezelfde transactie als de effecten: een crash laat nooit halve
 * administratie achter. `dedupeKey` voorkomt dubbele verwerking van hetzelfde logische event.
 */
async function persistEventAndEffects(
  eventInput: DomainEventInput,
  effects: CascadeEffects,
  refs: {
    owners: PartyOwners;
    invoiceId?: string | null;
    performanceId?: string | null;
    correlationId?: string | null;
  },
  opts?: { allocate?: { issuerKey: string; year: number; invoiceId: string } },
): Promise<PersistResult> {
  if (eventInput.dedupeKey) {
    const existing = await prisma.domainEvent.findUnique({
      where: { dedupeKey: eventInput.dedupeKey },
    });
    if (existing) return {}; // al verwerkt — idempotent
  }

  try {
    return await persistInTransaction(eventInput, effects, refs, opts);
  } catch (e) {
    // Race: tussen de pre-check en de create kan een concurrente request hetzelfde
    // dedupeKey al hebben weggeschreven. De @unique-constraint op DomainEvent.dedupeKey
    // dwingt idempotentie hard af; we vertalen die botsing naar dezelfde no-op als de
    // pre-check, zodat dubbele verwerking nooit als fout naar de gebruiker lekt.
    if (eventInput.dedupeKey && isUniqueDedupeViolation(e)) return {};
    throw e;
  }
}

/** Herkent een Prisma P2002 unique-constraint-botsing op DomainEvent.dedupeKey. */
export function isUniqueDedupeViolation(e: unknown): boolean {
  if (!e || typeof e !== "object" || !("code" in e)) return false;
  if ((e as { code?: unknown }).code !== "P2002") return false;
  const target = (e as { meta?: { target?: unknown } }).meta?.target;
  // target is meestal string[] (Postgres) of string (SQLite). Geen target → toch idempotent.
  if (Array.isArray(target)) return target.some((t) => String(t).includes("dedupeKey"));
  if (typeof target === "string") return target.includes("dedupeKey");
  return true;
}

async function persistInTransaction(
  eventInput: DomainEventInput,
  effects: CascadeEffects,
  refs: {
    owners: PartyOwners;
    invoiceId?: string | null;
    performanceId?: string | null;
    correlationId?: string | null;
  },
  opts?: { allocate?: { issuerKey: string; year: number; invoiceId: string } },
): Promise<PersistResult> {
  return prisma.$transaction(async (tx) => {
    const event = await tx.domainEvent.create({
      data: {
        type: eventInput.type,
        actorRole: eventInput.actorRole,
        actorId: eventInput.actorId ?? null,
        subjectType: eventInput.subjectType,
        subjectId: eventInput.subjectId,
        payload: JSON.stringify(eventInput.payload ?? {}),
        correlationId: eventInput.correlationId ?? null,
        dedupeKey: eventInput.dedupeKey ?? null,
      },
    });
    // Idempotentie-marker in dezelfde transactie als de effecten.
    await tx.eventHandlerRun.create({ data: { eventId: event.id, handler: "cascade" } });

    // Event C: ken het doorlopende factuurnummer per partij toe vóór het wegschrijven.
    if (opts?.allocate) {
      const { number } = await allocateInvoiceNumber(
        tx,
        opts.allocate.issuerKey,
        opts.allocate.year,
      );
      // Vul het toegekende nummer in de Invoice-statuswijziging.
      for (const sc of effects.statusChanges) {
        if (sc.entity === "Invoice" && sc.id === opts.allocate.invoiceId) {
          sc.set = {
            ...(sc.set ?? {}),
            partyInvoiceNumber: number,
            number: `${opts.allocate.issuerKey}:${number}`,
          };
        }
      }
    }

    const result = await applyCascadeEffects(tx, effects, {
      owners: refs.owners,
      invoiceId: refs.invoiceId ?? null,
      performanceId: refs.performanceId ?? null,
      correlationId: refs.correlationId ?? null,
      eventId: event.id,
    });
    return result;
  });
}

/** Beide partij-userIds van een samenwerking; werpt als de actor er geen partij van is. */
function assertParty(actor: Actor, freelancerUserId: string, clientUserId: string): void {
  if (actor.role === "ADMIN") return;
  if (actor.id !== freelancerUserId && actor.id !== clientUserId) {
    throw new CascadeError("Geen toegang tot deze samenwerking.");
  }
}

/** Bevriest de cascade zolang er een open dispuut is (§4 zijpad). */
async function assertNotDisputed(collaborationId: string): Promise<void> {
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { disputedAt: true },
  });
  if (col?.disputedAt) {
    throw new CascadeError(
      "De samenwerking is bevroren wegens een open dispuut. Los het dispuut eerst op.",
    );
  }
}

// --- Event A — Contract getekend -------------------------------------------
export async function signContract(actor: Actor, collaborationId: string): Promise<void> {
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
      job: { select: { title: true } },
    },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  assertParty(actor, col.freelancer.userId, col.company.userId);

  const effects = planContractSigned({
    collaborationId,
    status: col.status as CollaborationStatus,
    freelancerUserId: col.freelancer.userId,
    clientUserId: col.company.userId,
    jobTitle: col.job.title,
    actorId: actor.id,
  });

  await persistEventAndEffects(
    {
      type: "CONTRACT_SIGNED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Collaboration",
      subjectId: collaborationId,
      correlationId: collaborationId,
      dedupeKey: `contract-signed-${collaborationId}`,
    },
    effects,
    {
      owners: { FREELANCER: col.freelancer.userId, CLIENT: col.company.userId },
      correlationId: collaborationId,
    },
  );

  // Best-effort e-mail naar beide partijen.
  try {
    const meta = await loadCollabMeta(collaborationId);
    if (meta) {
      const mail = getMailSender();
      const link = collabLink(collaborationId);
      await mail.send(
        buildContractSignedEmail({ recipient: meta.freelancer, jobTitle: meta.jobTitle, link }),
      );
      await mail.send(
        buildContractSignedEmail({ recipient: meta.client, jobTitle: meta.jobTitle, link }),
      );
    }
  } catch {}
}

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

/** ZZP'er legt een concept-urenstaat/oplevering vast (nog geen event; pas indienen triggert B1). */
export async function createPerformance(
  actor: Actor,
  input: CreatePerformanceInput,
): Promise<string> {
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

// --- Event B2' — Prestatie afkeuren ----------------------------------------
export async function rejectPerformance(
  actor: Actor,
  performanceId: string,
  reason: string,
): Promise<void> {
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

// --- Event C — Factuur indienen --------------------------------------------
export async function submitInvoice(actor: Actor, invoiceId: string): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  if (actor.role !== "ADMIN" && actor.id !== inv.issuerUserId) {
    throw new CascadeError("Alleen de uitschrijver kan de factuur indienen.");
  }
  if (inv.collaborationId) await assertNotDisputed(inv.collaborationId);
  const effects = planInvoiceSubmittedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
    },
    partyInvoiceNumber: "", // wordt in de transactie door de allocator gezet
    clientUserId: inv.counterpartyUserId,
    now: new Date(),
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_SUBMITTED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
    { allocate: { issuerKey: inv.issuerKey, year: new Date().getFullYear(), invoiceId } },
  );

  // Best-effort e-mail naar de opdrachtgever.
  if (inv.collaborationId) {
    try {
      const meta = await loadCollabMeta(inv.collaborationId);
      if (meta) {
        await getMailSender().send(
          buildInvoiceSubmittedEmail({
            recipient: meta.client,
            freelancerName: meta.freelancer.name,
            jobTitle: meta.jobTitle,
            totalCents: inv.totalCents,
            link: collabLink(inv.collaborationId),
          }),
        );
      }
    } catch {}
  }
}

// --- Event D — Factuur goedkeuren ------------------------------------------
export async function approveInvoice(actor: Actor, invoiceId: string): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  if (actor.role !== "ADMIN" && actor.id !== inv.counterpartyUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de factuur goedkeuren.");
  }
  if (inv.collaborationId) await assertNotDisputed(inv.collaborationId);
  const effects = planInvoiceApprovedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
    },
    paymentTermDays: DEFAULT_PAYMENT_TERM_DAYS,
    freelancerUserId: inv.issuerUserId,
    now: new Date(),
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_APPROVED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
      // Eenmalige overgang (SUBMITTED→APPROVED): dedupeKey maakt een dubbele goedkeuring idempotent.
      dedupeKey: `invoice-approved-${invoiceId}`,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
  );

  // Best-effort e-mail naar de ZZP'er met het goedgekeurde bedrag en de vervaldatum.
  if (inv.collaborationId) {
    try {
      const meta = await loadCollabMeta(inv.collaborationId);
      if (meta) {
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + DEFAULT_PAYMENT_TERM_DAYS);
        await getMailSender().send(
          buildInvoiceApprovedEmail({
            recipient: meta.freelancer,
            jobTitle: meta.jobTitle,
            totalCents: inv.totalCents,
            dueAt,
            link: collabLink(inv.collaborationId),
          }),
        );
      }
    } catch {}
  }
}

// --- Event D' — Factuur afkeuren -------------------------------------------
export async function rejectInvoice(
  actor: Actor,
  invoiceId: string,
  reason: string,
): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  if (actor.role !== "ADMIN" && actor.id !== inv.counterpartyUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de factuur afkeuren.");
  }
  // Tijdens een dispuut bevriest de cascade — ook afkeuren is een transitie (§4 zijpad).
  if (inv.collaborationId) await assertNotDisputed(inv.collaborationId);
  const effects = planInvoiceRejectedEvent({
    invoiceId,
    lifecycleStatus: inv.lifecycleStatus,
    freelancerUserId: inv.issuerUserId,
    reason,
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_REJECTED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
    // Note: no allocate here — invoice rejected, number already assigned from submitInvoice
  );

  // Best-effort e-mail naar de ZZP'er met de reden.
  if (inv.collaborationId) {
    try {
      const meta = await loadCollabMeta(inv.collaborationId);
      if (meta) {
        await getMailSender().send(
          buildInvoiceRejectedEmail({
            recipient: meta.freelancer,
            jobTitle: meta.jobTitle,
            reason,
            link: collabLink(inv.collaborationId),
          }),
        );
      }
    } catch {}
  }
}

// --- Event E — Betaling bevestigen -----------------------------------------
export async function confirmPayment(actor: Actor, invoiceId: string): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  // Default (config): de ZZP'er bevestigt ontvangst. Opdrachtgever en admin mogen ook markeren.
  if (
    actor.role !== "ADMIN" &&
    actor.id !== inv.issuerUserId &&
    actor.id !== inv.counterpartyUserId
  ) {
    throw new CascadeError("Geen toegang tot deze factuur.");
  }
  if (!inv.collaborationId)
    throw new CascadeError("Factuur is niet aan een samenwerking gekoppeld.");
  await assertNotDisputed(inv.collaborationId);
  const col = await prisma.collaboration.findUnique({
    where: { id: inv.collaborationId },
    select: { id: true, status: true },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");

  const effects = planPaymentConfirmedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
      partyInvoiceNumber: inv.partyInvoiceNumber,
    },
    collaboration: { id: col.id, status: col.status as CollaborationStatus },
    freelancerUserId: inv.issuerUserId,
    clientUserId: inv.counterpartyUserId,
    now: new Date(),
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "PAYMENT_CONFIRMED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
      dedupeKey: `payment-confirmed-${invoiceId}`,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
  );

  // Best-effort e-mail naar beide partijen.
  try {
    const meta = await loadCollabMeta(inv.collaborationId);
    if (meta) {
      const mail = getMailSender();
      const link = collabLink(inv.collaborationId);
      const emailData = { jobTitle: meta.jobTitle, totalCents: inv.totalCents, link };
      await mail.send(buildPaymentConfirmedEmail({ recipient: meta.freelancer, ...emailData }));
      await mail.send(buildPaymentConfirmedEmail({ recipient: meta.client, ...emailData }));
    }
  } catch {}
}

// --- Zijpad — Creditfactuur ------------------------------------------------
export async function creditInvoice(
  actor: Actor,
  invoiceId: string,
  reason: string,
): Promise<void> {
  const inv = await loadCascadeInvoice(invoiceId);
  if (actor.role !== "ADMIN" && actor.id !== inv.issuerUserId) {
    throw new CascadeError("Alleen de uitschrijver kan een creditfactuur maken.");
  }
  const effects = planInvoiceCreditedEvent({
    invoice: {
      id: invoiceId,
      lifecycleStatus: inv.lifecycleStatus,
      subtotalCents: inv.subtotalCents,
      vatCents: inv.vatCents,
      totalCents: inv.totalCents,
      partyInvoiceNumber: inv.partyInvoiceNumber,
    },
    freelancerUserId: inv.issuerUserId,
    clientUserId: inv.counterpartyUserId,
    reason,
    actorId: actor.id,
  });
  await persistEventAndEffects(
    {
      type: "INVOICE_CREDITED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Invoice",
      subjectId: invoiceId,
      correlationId: inv.correlationId,
      // Eenmalige overgang: dedupeKey maakt een dubbele creditering idempotent.
      dedupeKey: `invoice-credited-${invoiceId}`,
    },
    effects,
    {
      owners: { FREELANCER: inv.issuerUserId, CLIENT: inv.counterpartyUserId },
      correlationId: inv.correlationId,
      invoiceId,
    },
  );
}

// --- Zijpad — Dispuut/escalatie --------------------------------------------
export async function openDispute(
  actor: Actor,
  collaborationId: string,
  reason: string,
): Promise<void> {
  if (!reason?.trim()) throw new CascadeError("Een dispuut vereist een toelichting.");
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
      job: { select: { title: true } },
    },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  assertParty(actor, col.freelancer.userId, col.company.userId);
  if (col.disputedAt) throw new CascadeError("Er is al een open dispuut.");

  const otherUserId =
    actor.id === col.freelancer.userId ? col.company.userId : col.freelancer.userId;
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.collaboration.update({
      where: { id: collaborationId },
      data: { disputedAt: new Date(), disputeReason: reason.trim() },
    }),
    prisma.domainEvent.create({
      data: {
        type: "DISPUTE_OPENED",
        actorRole: actor.role,
        actorId: actor.id,
        subjectType: "Collaboration",
        subjectId: collaborationId,
        payload: JSON.stringify({ reason: reason.trim() }),
        correlationId: collaborationId,
      },
    }),
    prisma.notification.create({
      data: {
        userId: otherUserId,
        type: "DISPUTE_OPENED",
        title: "Dispuut geopend",
        body: `Er is een dispuut geopend voor "${col.job.title}". De cascade is bevroren tot het is opgelost.`,
        link: `/samenwerkingen/${collaborationId}`,
      },
    }),
    ...admins.map((a) =>
      prisma.notification.create({
        data: {
          userId: a.id,
          type: "DISPUTE_OPENED",
          title: "Dispuut — bemiddeling nodig",
          body: `Dispuut bij "${col.job.title}": ${reason.trim()}`,
          link: `/samenwerkingen/${collaborationId}`,
        },
      }),
    ),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "DISPUTE_OPENED",
        entityType: "Collaboration",
        entityId: collaborationId,
        metadata: { reason: reason.trim() },
      }),
    }),
  ]);
}

/** Alleen het platform (admin) heft een dispuut op — daarna loopt de cascade weer. */
export async function resolveDispute(actor: Actor, collaborationId: string): Promise<void> {
  if (actor.role !== "ADMIN")
    throw new CascadeError("Alleen het platform kan een dispuut oplossen.");
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: { company: { select: { userId: true } }, freelancer: { select: { userId: true } } },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  if (!col.disputedAt) throw new CascadeError("Er is geen open dispuut.");

  await prisma.$transaction([
    prisma.collaboration.update({
      where: { id: collaborationId },
      data: { disputedAt: null, disputeReason: null },
    }),
    prisma.domainEvent.create({
      data: {
        type: "DISPUTE_RESOLVED",
        actorRole: actor.role,
        actorId: actor.id,
        subjectType: "Collaboration",
        subjectId: collaborationId,
        payload: "{}",
        correlationId: collaborationId,
      },
    }),
    prisma.notification.create({
      data: {
        userId: col.freelancer.userId,
        type: "DISPUTE_RESOLVED",
        title: "Dispuut opgelost",
        body: "Het dispuut is opgelost; je kunt het werkproces hervatten.",
        link: `/samenwerkingen/${collaborationId}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: col.company.userId,
        type: "DISPUTE_RESOLVED",
        title: "Dispuut opgelost",
        body: "Het dispuut is opgelost; je kunt het werkproces hervatten.",
        link: `/samenwerkingen/${collaborationId}`,
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "DISPUTE_RESOLVED",
        entityType: "Collaboration",
        entityId: collaborationId,
      }),
    }),
  ]);
}

// --- Loaders ---------------------------------------------------------------

interface LoadedPerformance {
  status: PerformanceState;
  type: "HOURS" | "MILESTONE";
  hours: number | null;
  rateCents: number | null;
  amountCents: number | null;
  ortSegments: OrtSegment[] | null;
  ortProfile: string | null;
  ortCustomRates: string | null;
  collaborationId: string;
  freelancerUserId: string;
  clientUserId: string;
}

/** Parse de opgeslagen ORT-segmenten (JSON-string) veilig terug naar een array. */
function parseOrtSegments(raw: string | null): OrtSegment[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrtSegment[]) : null;
  } catch {
    return null;
  }
}

async function loadPerformance(performanceId: string): Promise<LoadedPerformance> {
  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    include: {
      collaboration: {
        include: {
          freelancer: { select: { userId: true } },
          company: { select: { userId: true } },
        },
      },
    },
  });
  if (!perf) throw new CascadeError("Prestatie niet gevonden.");
  return {
    status: perf.status as PerformanceState,
    type: perf.type as "HOURS" | "MILESTONE",
    hours: perf.hours,
    rateCents: perf.rateCents,
    amountCents: perf.amountCents,
    ortSegments: parseOrtSegments(perf.ortSegments),
    ortProfile: perf.collaboration.ortProfile,
    ortCustomRates: perf.collaboration.ortCustomRates,
    collaborationId: perf.collaborationId,
    freelancerUserId: perf.collaboration.freelancer.userId,
    clientUserId: perf.collaboration.company.userId,
  };
}

interface LoadedInvoice {
  lifecycleStatus: InvoiceLifecycleState;
  issuerUserId: string;
  counterpartyUserId: string;
  issuerKey: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  partyInvoiceNumber: string | null;
  correlationId: string | null;
  collaborationId: string | null;
}

async function loadCascadeInvoice(invoiceId: string): Promise<LoadedInvoice> {
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) throw new CascadeError("Factuur niet gevonden.");
  if (
    !inv.lifecycleStatus ||
    inv.issuerUserId == null ||
    inv.counterpartyUserId == null ||
    inv.issuerKey == null ||
    inv.subtotalCents == null ||
    inv.vatCents == null
  ) {
    throw new CascadeError("Dit is geen cascade-factuur.");
  }
  return {
    lifecycleStatus: inv.lifecycleStatus as InvoiceLifecycleState,
    issuerUserId: inv.issuerUserId,
    counterpartyUserId: inv.counterpartyUserId,
    issuerKey: inv.issuerKey,
    subtotalCents: inv.subtotalCents,
    vatCents: inv.vatCents,
    totalCents: inv.totalCents,
    partyInvoiceNumber: inv.partyInvoiceNumber,
    correlationId: inv.correlationId,
    collaborationId: inv.collaborationId,
  };
}

// ─── E-mail helpers (best-effort — gooit nooit de cascade om) ───────────────

interface CollabMeta {
  jobTitle: string;
  freelancer: UserContact;
  client: UserContact;
}

async function loadCollabMeta(collaborationId: string): Promise<CollabMeta | null> {
  try {
    const col = await prisma.collaboration.findUnique({
      where: { id: collaborationId },
      select: {
        job: { select: { title: true } },
        freelancer: { select: { user: { select: { name: true, email: true } } } },
        company: { select: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!col) return null;
    return {
      jobTitle: col.job.title,
      freelancer: { name: col.freelancer.user.name ?? "", email: col.freelancer.user.email },
      client: { name: col.company.user.name ?? "", email: col.company.user.email },
    };
  } catch {
    return null;
  }
}

function collabLink(collaborationId: string): string {
  const base = process.env.PLATFORM_URL ?? process.env.NEXTAUTH_URL ?? "";
  return `${base}/samenwerkingen/${collaborationId}`;
}
