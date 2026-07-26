// Gedeelde helpers voor de cascade-command-modules. Bevat de laagruimten, de persistentie-core,
// en de toegangscontrole-primitieven die door contract-, performance-, invoice-, payment- en
// dispute-commands worden gebruikt. Nooit rechtstreeks importeren vanuit applicatiecode —
// gebruik de barrel commands.ts of de specifieke command-modules.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { allocateInvoiceNumber, type PartyOwners } from "@/lib/administration/persist";
import { applyCascadeEffects } from "@/lib/cascade/apply";
import { type CascadeEffects } from "@/lib/cascade/types";
import { type DomainEventInput } from "@/lib/events";
import { type OrtSegment } from "@/lib/ort";
import { type InvoiceLifecycleState, type PerformanceState } from "@/lib/lifecycles";
import { type UserContact } from "@/lib/services/cascade-emails";

export class CascadeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CascadeError";
  }
}

export interface PersistResult {
  createdInvoiceId?: string;
}

/**
 * Schrijft het DomainEvent + de effecten + de idempotentie-marker atomair weg. De marker
 * (EventHandlerRun) zit in dezelfde transactie als de effecten: een crash laat nooit halve
 * administratie achter. `dedupeKey` voorkomt dubbele verwerking van hetzelfde logische event.
 */
export async function persistEventAndEffects(
  eventInput: DomainEventInput,
  effects: CascadeEffects,
  refs: {
    owners: PartyOwners;
    invoiceId?: string | null;
    performanceId?: string | null;
    correlationId?: string | null;
    /**
     * Wanneer gezet: her-verifieer BINNEN de effect-transactie dat de samenwerking niet net in
     * dispuut is geraakt. Dit dicht het TOCTOU-venster tussen de pre-transactionele
     * `assertNotDisputed`-lees en deze write — tussen beide zit planning-/laadwerk (en soms extra
     * queries), dus een dispuut dat in dat venster wordt geopend bevroor de cascade tot nu toe niet.
     * Nu rolt de effect-transactie terug (geld-/statuseffect wordt niet weggeschreven). Spiegelt de
     * in-transactie-herverificatie in samenwerkingen/actions.ts ("TOCTOU-dicht").
     */
    disputeGuardCollaborationId?: string | null;
    /**
     * Wanneer `true` (naast een gezette `disputeGuardCollaborationId`): her-verifieer BINNEN dezelfde
     * transactie-lees dat de samenwerking niet net terminaal (geannuleerd/afgerond) werd. Dicht het
     * TOCTOU-venster tussen de pre-transactionele `assertCollaborationNotTerminal`-lees en deze write —
     * bv. een DRAFT-prestatie die ná een annulering alsnog wordt ingediend. Rolt de effect-transactie
     * terug (geen forward-cascade-effect op een dode deal). Hergebruikt de dispuut-guard-lees (geen
     * extra query); de collab-id is per constructie dezelfde als `disputeGuardCollaborationId`.
     */
    terminalGuard?: boolean;
    /** Sta een AFGERONDE (COMPLETED) samenwerking toe (voor `confirmPayment`, dat afronding zélf als
     * effect produceert). CANCELLED blijft altijd geweigerd. */
    terminalGuardAllowCompleted?: boolean;
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
    disputeGuardCollaborationId?: string | null;
    terminalGuard?: boolean;
    terminalGuardAllowCompleted?: boolean;
  },
  opts?: { allocate?: { issuerKey: string; year: number; invoiceId: string } },
): Promise<PersistResult> {
  return prisma.$transaction(async (tx) => {
    // TOCTOU-grendel: her-verifieer binnen de transactie, vóór er iets wordt weggeschreven, dat de
    // samenwerking niet net (a) in dispuut ging of (b) terminaal (geannuleerd/afgerond) werd. Een
    // overgang die na de pre-check maar vóór deze commit gebeurde bevriest/blokkeert de cascade
    // alsnog — de hele transactie rolt terug, dus er ontstaat geen betaling/afronding/factuur-effect
    // op een samenwerking die intussen in dispuut ging of dood is. Eén lees dekt beide guards.
    if (refs.disputeGuardCollaborationId) {
      const col = await tx.collaboration.findUnique({
        where: { id: refs.disputeGuardCollaborationId },
        select: { disputedAt: true, status: true },
      });
      if (col?.disputedAt) {
        throw new CascadeError(
          "De samenwerking is bevroren wegens een open dispuut. Los het dispuut eerst op.",
        );
      }
      if (refs.terminalGuard && col) {
        const err = terminalCollaborationError(col.status, {
          allowCompleted: refs.terminalGuardAllowCompleted,
        });
        if (err) throw err;
      }
    }

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
export function assertParty(
  actor: Actor,
  freelancerUserId: string,
  clientUserId: string,
  // Anti-oracle (CWE-203): standaard onderscheidt deze melding "geen partij" van "niet gevonden",
  // maar op de gevoeligste (existentie-lekkende) paden geef je de resource-eigen "… niet gevonden."
  // mee, zodat een niet-partij het bestaan van andermans samenwerking niet kan aftasten. Symmetrisch
  // met de al-geünificeerde return-based approve/reject-commando's (#903).
  notFoundMessage = "Geen toegang tot deze samenwerking.",
): void {
  if (actor.role === "ADMIN") return;
  if (actor.id !== freelancerUserId && actor.id !== clientUserId) {
    throw new CascadeError(notFoundMessage);
  }
}

/** Bevriest de cascade zolang er een open dispuut is (§4 zijpad). */
export async function assertNotDisputed(collaborationId: string): Promise<void> {
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

/**
 * Pure bron van waarheid voor de terminale-status-rem: geeft de te werpen fout terug (of null) op
 * basis van de samenwerkingsstatus. Gedeeld door de pre-check (`assertCollaborationNotTerminal`) én
 * de in-transactie-grendel (`persistEventAndEffects` → `terminalGuard`) zodat bewoording en logica
 * niet driften. CANCELLED is altijd terminaal; COMPLETED alleen wanneer de caller het niet toestaat.
 */
export function terminalCollaborationError(
  status: string,
  opts?: { allowCompleted?: boolean },
): CascadeError | null {
  if (status === "CANCELLED") {
    return new CascadeError("De samenwerking is geannuleerd; deze actie is niet meer mogelijk.");
  }
  if (status === "COMPLETED" && !opts?.allowCompleted) {
    return new CascadeError("De samenwerking is afgerond; deze actie is niet meer mogelijk.");
  }
  return null;
}

/**
 * Weigert een forward-cascade-mutatie op een terminale (geannuleerde/afgeronde) samenwerking —
 * defense-in-depth, spiegelt `assertNotDisputed` als pre-transactionele lees. De annuleer-/afrond-rem
 * (symmetrisch, TOCTOU-dicht) sluit de bekende bereikbare route al af, maar deze systemische rem
 * beschermt tegen een (toekomstig) pad dat verweesd werk — een SUBMITTED-prestatie of open factuur —
 * op een dode deal achterlaat: goedkeuren/indienen/betalen mag de facturatiecascade dan niet alsnog
 * voortzetten. Een ontbrekende samenwerking valt op de bestaande "niet gevonden"-paden van de callers.
 */
export async function assertCollaborationNotTerminal(
  collaborationId: string,
  opts?: { allowCompleted?: boolean },
): Promise<void> {
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { status: true },
  });
  if (!col) return;
  const err = terminalCollaborationError(col.status, opts);
  if (err) throw err;
}

// --- Loaders ---------------------------------------------------------------

export interface LoadedPerformance {
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
export function parseOrtSegments(raw: string | null): OrtSegment[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrtSegment[]) : null;
  } catch {
    return null;
  }
}

export async function loadPerformance(performanceId: string): Promise<LoadedPerformance> {
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

export interface LoadedInvoice {
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

export async function loadCascadeInvoice(invoiceId: string): Promise<LoadedInvoice> {
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

export interface CollabMeta {
  jobTitle: string;
  freelancer: UserContact;
  client: UserContact;
}

export async function loadCollabMeta(collaborationId: string): Promise<CollabMeta | null> {
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

export function collabLink(collaborationId: string): string {
  const base = process.env.PLATFORM_URL ?? process.env.NEXTAUTH_URL ?? "";
  return `${base}/samenwerkingen/${collaborationId}`;
}
