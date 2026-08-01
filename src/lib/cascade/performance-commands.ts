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
import {
  MAX_PERFORMANCE_HOURS,
  MAX_MILESTONE_CENTS,
  MAX_PERFORMANCE_RATE_CENTS,
} from "@/lib/validation";
import {
  CascadeError,
  OVERLAPPING_PERFORMANCE_MESSAGE,
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
  rateCents?: number | null;
  ortSegments?: OrtSegment[] | null;
}): void {
  if (input.type === "HOURS") {
    // Defense-in-depth (dekt élk pad: formulier, CSV-import, admin): een niet-eindig getal (NaN uit
    // een geknutselde/corrupte invoer) is noch `> MAX` noch onder de grens en zou anders als Float
    // persisteren en bij factuurafleiding een NaN-`totalCents` (Int) opleveren → 500 i.p.v. weigering.
    if (input.hours != null && !Number.isFinite(input.hours)) {
      throw new CascadeError("Het aantal uren is ongeldig.");
    }
    // Ondergrens op het uurtarief: een 0/negatief tarief (bv. een bindende samenwerking met
    // `Collaboration.rate = 0`) zou via performanceSubtotalCents een €0-factuur voor écht gewerkte
    // uren opleveren. Server-side waarheid (regel 1) — onafhankelijk van de Zod-formuliercheck, zodat
    // ook de CSV-import en toekomstige ingangen gedekt zijn. `!= null` bewaart het concept-pad (nog
    // geen tarief); een reeds-null tarief wordt vóór indienen al door validatePerformanceForm geweigerd.
    if (input.rateCents != null && !Number.isFinite(input.rateCents)) {
      throw new CascadeError("Het uurtarief is ongeldig.");
    }
    if (input.rateCents != null && input.rateCents <= 0) {
      throw new CascadeError("Het uurtarief moet groter dan 0 zijn.");
    }
    // Bovengrens op het uurtarief: de factuurbasis is `uren × rateCents`, dus de `hours`-cap alleen
    // borgt het afgeleide `totalCents` (int4) niet — een absurd hoog tarief (bv. een toekomstig admin-/
    // importpad) zou het bij goedkeuring laten overlopen → 500 i.p.v. een nette weigering. Server-side
    // waarheid (regel 1), zelfstandig i.p.v. afhankelijk van de €2.000/u-cap van collaborationProposalSchema.
    if (input.rateCents != null && input.rateCents > MAX_PERFORMANCE_RATE_CENTS) {
      throw new CascadeError("Het uurtarief is onrealistisch hoog (maximaal € 2.000 per uur).");
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
    // ORT-dimensie (zorg): zodra segmenten het factuursubtotaal bepalen loopt de bovengrens NIET via
    // `hours` maar via de som van de segment-uren (performanceSubtotalCents → ortSubtotalCents → uren ×
    // basistarief + toeslag). De grens hierboven op `hours` is dan blind voor de werkelijke factuurbasis:
    // een toekomstige caller die `ortSegments` levert zonder `hours` in lockstep te herberekenen zou een
    // absurd/NaN subtotaal (int4-overflow op de Int-kolom `totalCents` → 500 i.p.v. weigering) kunnen
    // introduceren. Valideer daarom de segment-som zelf — onafhankelijk van het formulier, symmetrisch met
    // de `hours`-grens en met dezelfde `MAX_PERFORMANCE_HOURS`-cap. (`computeOrt` weigert `< 0` al, maar met
    // een rauwe Error en NaN glipt door de `< 0`-check; hier weigeren we netjes vóór de write.)
    if (input.ortSegments && input.ortSegments.length > 0) {
      let segmentHoursSum = 0;
      for (const seg of input.ortSegments) {
        if (!Number.isFinite(seg.hours)) {
          throw new CascadeError("Het aantal uren is ongeldig.");
        }
        if (seg.hours < 0) {
          throw new CascadeError("Het aantal uren moet groter dan 0 zijn.");
        }
        segmentHoursSum += seg.hours;
      }
      if (segmentHoursSum <= 0) {
        throw new CascadeError("Het aantal uren moet groter dan 0 zijn.");
      }
      if (segmentHoursSum > MAX_PERFORMANCE_HOURS) {
        throw new CascadeError(
          `Het aantal uren is onrealistisch hoog (maximaal ${MAX_PERFORMANCE_HOURS} uur per urenstaat).`,
        );
      }
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
  // Dispuut-vries (symmetrisch met álle prestatie-siblings: update/submit/approve/autoApprove/reject).
  // Een open dispuut bevriest de cascade — dan mag er ook geen nieuwe concept-prestatie bijkomen die op
  // een bevroren deal naar (her)indiening leeft. De ACTIVE-check dekt terminale status, maar niet de
  // dispuut-vries (`disputedAt` gezet terwijl `status` ACTIVE blijft); vandaar de expliciete lees.
  await assertNotDisputed(input.collaborationId);

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
  // Anti-oracle (CWE-203): een actor die geen partij is bij deze prestatie krijgt exact dezelfde
  // "… niet gevonden."-melding als een onbekend id; alleen een echte partij aan de verkeerde kant
  // (de opdrachtgever) houdt de behulpzame rolmelding. Symmetrisch met approvePerformance (#903).
  if (
    actor.role !== "ADMIN" &&
    actor.id !== perf.freelancerUserId &&
    actor.id !== perf.clientUserId
  ) {
    throw new CascadeError("Prestatie niet gevonden.");
  }
  if (actor.role !== "ADMIN" && actor.id !== perf.freelancerUserId) {
    throw new CascadeError("Alleen de ZZP'er kan de prestatie aanpassen.");
  }
  if (perf.status !== "DRAFT" && perf.status !== "REJECTED") {
    throw new CascadeError("Alleen een concept of afgekeurde prestatie kan worden aangepast.");
  }
  await assertNotDisputed(perf.collaborationId);
  // Terminale-status-rem (symmetrisch met de forward-siblings, #825): een concept/afgekeurde prestatie
  // op een geannuleerde of afgeronde deal mag niet meer worden bijgewerkt — anders leeft er een
  // aanpasbaar weespad naar (her)indiening op een dode samenwerking.
  await assertCollaborationNotTerminal(perf.collaborationId);
  // Compound-guarded write (TOCTOU): de statuscheck hierboven leunt op de pre-transactionele lees
  // (loadPerformance) — tussen die lees en deze write kan een parallelle actie de prestatie al hebben
  // ingediend (REJECTED/DRAFT → SUBMITTED via submitPerformance). Zonder statusguard zou déze
  // veld-write dan alsnog op een SUBMITTED-rij landen (uren/tarief/bedrag stil overschreven, zónder
  // event, audit of her-notificatie — de opdrachtgever keurt vervolgens een bedrag goed dat hij nooit
  // zag). We guarden daarom op de exact geziene status (∈ {DRAFT, REJECTED}); flipte de rij in het
  // race-venster, dan count 0 → weiger. Zelfde patroon als de status-writes in apply.ts.
  const { count } = await prisma.performance.updateMany({
    where: { id: performanceId, status: perf.status },
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
  if (count !== 1) {
    throw new CascadeError(
      "De prestatie is intussen door een andere actie gewijzigd. Ververs de pagina en probeer het opnieuw.",
    );
  }
}

/**
 * Server-side backstop tegen dubbele facturatie (regel 1): weiger het indienen van een urenstaat waarvan
 * de periode overlapt met een reeds in de cascade levende urenstaat op dezelfde samenwerking. Zonder deze
 * rem kon een ZZP'er twee prestaties voor exact dezelfde gewerkte periode indienen — handmatig óf via de
 * CSV-diensten-import (die per regel createPerformance→submitPerformance draait) — en tweemaal uitbetaald
 * krijgen: elke prestatie draait haar eigen goedkeur→factuur→betaling-cascade. Alleen HOURS met een
 * volledige periode (begin én eind); zonder één van beide is overlap niet te bepalen → niet blokkeren.
 * Levend in de cascade = elke prestatie die concept (DRAFT) voorbij is en niet is afgekeurd (REJECTED),
 * dus SUBMITTED/APPROVED. De prestatie zelf wordt uitgesloten zodat opnieuw indienen na afkeuren mag.
 */
async function assertNoOverlappingHoursPerformance(performanceId: string): Promise<void> {
  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    select: { type: true, periodStart: true, periodEnd: true, collaborationId: true },
  });
  if (!perf || perf.type !== "HOURS") return;
  // Zonder begin- én eindtijd is overlap niet te bepalen — dan niet blokkeren (bewaart legitieme paden).
  if (perf.periodStart == null || perf.periodEnd == null) return;
  const overlap = await prisma.performance.findFirst({
    where: {
      collaborationId: perf.collaborationId,
      id: { not: performanceId }, // zelf-uitsluiting: dezelfde (afgekeurde) prestatie opnieuw indienen mag
      type: "HOURS",
      status: { notIn: ["REJECTED", "DRAFT"] }, // levend in de cascade: SUBMITTED/APPROVED
      // Overlap: bestaand.start < nieuw.eind EN bestaand.eind > nieuw.start (beide niet-null; een
      // bestaande prestatie zonder volledige periode valt buiten deze vergelijkingen en telt niet mee).
      periodStart: { lt: perf.periodEnd },
      periodEnd: { gt: perf.periodStart },
    },
    select: { id: true },
  });
  if (overlap) {
    // Geen ids lekken — enkel dat de periode al bezet is (gedeelde constante, identiek aan de in-tx-guard).
    throw new CascadeError(OVERLAPPING_PERFORMANCE_MESSAGE);
  }
}

// --- Event B1 — Prestatie indienen -----------------------------------------
export async function submitPerformance(actor: Actor, performanceId: string): Promise<void> {
  const perf = await loadPerformance(performanceId);
  // Anti-oracle (CWE-203): niet-partij → "… niet gevonden."; alleen de opdrachtgever (verkeerde kant)
  // houdt de rolmelding. Symmetrisch met approvePerformance (#903).
  if (
    actor.role !== "ADMIN" &&
    actor.id !== perf.freelancerUserId &&
    actor.id !== perf.clientUserId
  ) {
    throw new CascadeError("Prestatie niet gevonden.");
  }
  if (actor.role !== "ADMIN" && actor.id !== perf.freelancerUserId) {
    throw new CascadeError("Alleen de ZZP'er kan de prestatie indienen.");
  }
  await assertNotDisputed(perf.collaborationId);
  // Terminale-status-rem: een DRAFT-prestatie die vóór annulering is aangemaakt mag ná annulering
  // niet alsnog worden ingediend (weespad — `createPerformance` eist ACTIVE, `submitPerformance` deed
  // dat niet). Ook een afgeronde deal krijgt geen nieuw ingediend werk meer.
  await assertCollaborationNotTerminal(perf.collaborationId);
  // Anti-dubbelfacturatie: geen tweede urenstaat voor een reeds ingediende/goedgekeurde periode op deze
  // samenwerking. Pre-transactionele lees, symmetrisch met de dispuut-/terminale-siblings hierboven.
  await assertNoOverlappingHoursPerformance(performanceId);
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
      // In-transactie-herverificatie van de overlap-guard (TOCTOU-dicht): sluit het venster tussen de
      // pre-check hierboven en de SUBMITTED-write bij twee gelijktijdige submits op overlappende periodes.
      overlapGuardPerformanceId: performanceId,
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
  // Anti-oracle (CWE-203): een actor die geen partij is bij deze prestatie (noch ZZP'er, noch
  // opdrachtgever) mag niet via een afwijkende "wie mag dit"-melding het bestaan aftasten — geef
  // exact dezelfde melding als een onbekend id. Deze melding wordt door de useActionState-drawer
  // (`approvePerformanceState`) als returnwaarde aan de client getoond (niet door Next.js geredigeerd),
  // dus het verschil is productie-observeerbaar. Een echte partij (verkeerde kant) krijgt wél de
  // behulpzame rolmelding.
  if (
    actor.role !== "ADMIN" &&
    actor.id !== perf.freelancerUserId &&
    actor.id !== perf.clientUserId
  ) {
    throw new CascadeError("Prestatie niet gevonden.");
  }
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
  // Anti-oracle (CWE-203): niet-partij → identieke "niet gevonden"-melding (zie approvePerformance);
  // productie-observeerbaar via `rejectPerformanceState`. Partij-verkeerde-kant → rolmelding.
  if (
    actor.role !== "ADMIN" &&
    actor.id !== perf.freelancerUserId &&
    actor.id !== perf.clientUserId
  ) {
    throw new CascadeError("Prestatie niet gevonden.");
  }
  if (actor.role !== "ADMIN" && actor.id !== perf.clientUserId) {
    throw new CascadeError("Alleen de opdrachtgever kan de prestatie afkeuren.");
  }
  // Tijdens een dispuut bevriest de cascade — ook afkeuren is een transitie (§4 zijpad).
  await assertNotDisputed(perf.collaborationId);
  // Terminale-status-rem (symmetrisch met de forward-siblings, #825): afkeuren op een geannuleerde/
  // afgeronde samenwerking is een cascade-transitie op een dode deal en mag niet.
  await assertCollaborationNotTerminal(perf.collaborationId);
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
      terminalGuard: true,
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
