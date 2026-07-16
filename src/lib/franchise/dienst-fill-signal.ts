// Vulbaar-signaal per open dienst voor de bemiddelaar (franchiser) op `/franchise/diensten`. Beantwoordt
// de kernvraag van de bemiddelaar bij een openstaande dienst direct: "kan ik dit NU vullen uit mijn
// eigen roster, of moet ik werven/verbreden?" Het telt de vrij-inzetbare roster-vakmensen (ACTIEF,
// beschikbaar én zonder lopende opdracht — dezelfde definitie als de roster-capaciteitstegel) die
// bovendien goed matchen op déze dienst (server-berekende matchscore ≥ drempel). Zo triageert de
// bemiddelaar in één oogopslag welke open dienst een druk-op-de-knop-voordracht is en welke echt
// aandacht (werving) vraagt — benchmark Pidz/Zorgwerk: de dichtstbijzijnde beschikbare match eerst.
//
// Server-side is de waarheid (CLAUDE.md regel 1): de inzetbaarheid + matchscore worden hier opnieuw,
// deterministisch berekend uit de tenant-gescopet opgehaalde roster-rijen; de client toont enkel het
// afgeleide getal. Read-only — geen mutatie, geen nieuw auth-oppervlak.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { type JobMatchSource, scoreJobForFreelancer } from "@/lib/matching";
import { plural } from "@/lib/plural";
import { isIdleReady } from "@/lib/franchise/roster-capacity";
import {
  type RosterFreelancerSource,
  candidateEngageability,
  rosterMatchSource,
} from "@/lib/franchise/dienst-voordracht";

/**
 * Drempel waarboven een match "geschikt" heet voor het lijst-signaal. Bewust wat strenger dan een
 * kale positieve match: het signaal moet een écht voordraagbare vakmens beloven, geen zwakke fit die
 * de bemiddelaar alsnog moet wegwuiven. Zelfde 0-100-schaal als de matchmotor.
 */
export const READY_MATCH_MIN_SCORE = 60;

export interface DienstFillSignal {
  /** Vrij-inzetbare roster-vakmensen die goed matchen (≥ drempel) — direct voordraagbaar. */
  readyMatches: number;
  /** Vrij-inzetbaar totaal (ongeacht match) — de capaciteit die je op deze dienst zou kunnen zetten. */
  idleReady: number;
}

/**
 * Pure kern: tel de vrij-inzetbare, goed-matchende roster-vakmensen voor één dienst. Elke ZZP'er krijgt
 * zijn inzetbaarheid (`computeEngageability` via `candidateEngageability`) en, alleen als hij vrij
 * inzetbaar is, zijn server-berekende matchscore (`scoreJobForFreelancer`, dezelfde motor als het
 * voordraag-scherm). Niet-vrije vakmensen tellen sowieso niet mee (wie werkt of aandacht vraagt is geen
 * inzetbare capaciteit) — dus scoren we die niet eens. Los van de DB-laag testbaar.
 */
export function computeDienstFill(
  job: JobMatchSource,
  roster: readonly RosterFreelancerSource[],
  now: Date = new Date(),
): DienstFillSignal {
  let readyMatches = 0;
  let idleReady = 0;
  for (const f of roster) {
    const eng = candidateEngageability(f, now);
    const idle = isIdleReady({
      engageabilityStatus: eng.status,
      availability: f.availability,
      activeCollaborations: f.activeCollaborations.length,
    });
    if (!idle) continue;
    idleReady += 1;
    const match = scoreJobForFreelancer(job, rosterMatchSource(f), now);
    if (match.score >= READY_MATCH_MIN_SCORE) readyMatches += 1;
  }
  return { readyMatches, idleReady };
}

/**
 * Eén compacte chip per open dienst, of `null` (geen chip → rustige lijst). We tonen alleen het
 * positieve "act now"-signaal: er staan vrij-inzetbare, geschikte vakmensen klaar om voor te dragen.
 * Bij geen geschikte vrije match blijft de lijst stil — de bemiddelaar ziet dan enkel de bestaande
 * "X dagen open"/aandacht-signalen en weet dat hij moet werven i.p.v. voordragen.
 */
export function dienstFillChip(
  signal: DienstFillSignal,
): { label: string; tone: "success" } | null {
  if (signal.readyMatches <= 0) return null;
  return {
    label: `${plural(signal.readyMatches, "geschikte vakmens", "geschikte vakmensen")} vrij`,
    tone: "success",
  };
}

/** De velden die de matchmotor + inzetbaarheid nodig hebben uit een roster-profiel (één select-vorm). */
const ROSTER_SELECT = {
  id: true,
  headline: true,
  bio: true,
  completeness: true,
  availability: true,
  hourlyRate: true,
  workMode: true,
  location: true,
  maxTravelMinutes: true,
  user: { select: { name: true, identityVerifiedAt: true, lastLoginAt: true } },
  skills: { select: { skillId: true } },
  industries: { select: { industryId: true } },
  availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
  credentials: { select: { type: true, status: true, expiresAt: true } },
  // Aantal ACTIEVE samenwerkingen (voor "vrij inzetbaar": 0 = geen lopende opdracht).
  _count: { select: { collaborations: { where: { status: "ACTIVE" } } } },
} as const;

/**
 * Bouwt per opgegeven dienst het vulbaar-signaal. Laadt het tenant-roster één keer (geen N+1) en de
 * match-velden van de opgegeven diensten (tenant-gescopet), en scoort puur in het geheugen. Geeft een
 * lege map bij een bemiddelaar zonder tenant of zonder diensten. Read-only.
 */
export async function getRosterFillSignals(
  actor: Actor,
  jobIds: readonly string[],
  now: Date = new Date(),
): Promise<Map<string, DienstFillSignal>> {
  return getRosterFillSignalsForTenant(actor.tenantId ?? null, jobIds, now);
}

/**
 * Zelfde loader, maar rechtstreeks op een tenant-id — voor aanroepers die alleen de tenant kennen (bv.
 * de next-action-enumerator, die per rol met een userId werkt). De Actor-variant hierboven delegeert
 * hiernaartoe zodat de tenant-scoping op één plek leeft.
 */
export async function getRosterFillSignalsForTenant(
  tenantId: string | null,
  jobIds: readonly string[],
  now: Date = new Date(),
): Promise<Map<string, DienstFillSignal>> {
  const result = new Map<string, DienstFillSignal>();
  if (!tenantId || jobIds.length === 0) return result;

  const [jobs, roster] = await Promise.all([
    prisma.job.findMany({
      // Tenant-scoping herbevestigd: alleen diensten binnen de eigen tenant (isolatie). De page geeft
      // al eigen dienst-ids door, maar we scopen defensief zodat de loader nooit een vreemde dienst scoort.
      where: { id: { in: [...jobIds] }, tenantId },
      select: {
        id: true,
        title: true,
        description: true,
        rateMin: true,
        rateMax: true,
        workMode: true,
        location: true,
        industryId: true,
        skills: { select: { skillId: true, required: true } },
        credentialRequirements: { select: { credentialType: true, required: true } },
      },
    }),
    // unbounded-allow: tenant-gescopet roster; beheerbaar volume (zelfde bron als /franchise/zzpers).
    prisma.freelancerProfile.findMany({ where: { tenantId }, select: ROSTER_SELECT }),
  ]);

  const sources: RosterFreelancerSource[] = roster.map((f) => ({
    ...f,
    // De pure kern telt alleen `activeCollaborations.length`; een array met de juiste lengte volstaat
    // (geen dubbele-boeking-detail nodig voor dit signaal).
    activeCollaborations: Array.from({ length: f._count.collaborations }, () => ({
      collaborationId: "",
      jobId: "",
      jobTitle: "",
      tenantId,
      startDate: null,
      endDate: null,
    })),
  }));

  for (const job of jobs) {
    result.set(job.id, computeDienstFill(job, sources, now));
  }
  return result;
}
