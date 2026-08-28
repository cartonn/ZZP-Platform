// Rol-gericht win-back-signaal voor de opdrachtgever: ZZP'ers die eerder betaalde uitgaven én
// afgerond werk opleverden, maar waar al maanden geen samenwerking meer mee liep. Een bekende, goed
// bevallen ZZP'er opnieuw inzetten is doorgaans sneller en veiliger dan een koude opdracht uitzetten
// en vreemden screenen. Het platform meet de uitgaven per ZZP'er al (client-spend-breakdown.ts) maar
// nooit de recency ervan. Exact het spiegelbeeld van de ZZP'er-widget "Klanten om opnieuw te
// benaderen" (dormant-clients.ts). Read-only inzicht — puur en deterministisch (klok geïnjecteerd)
// zodat het zonder DB testbaar is. Toont uitsluitend eigen, geaggregeerde cijfers.

import { prisma } from "@/lib/db";
import { type ClientSpendBreakdown } from "@/lib/client-spend-breakdown";

/** Een ZZP'er heet "slapend" zodra de laatste samenwerking langer dan dit geleden afrondde. */
export const DORMANT_FREELANCER_DAYS = 90;
const MS_PER_DAY = 86_400_000;
// Ruwe maand voor de "N maanden geleden"-tekst; kalenderprecisie voegt hier niets toe.
const DAYS_PER_MONTH = 30;

export interface DormantFreelancerInput {
  freelancerId: string;
  name: string;
  /** Betaalde uitgaven ooit aan deze ZZP'er (centen). Rangschikkingsbasis. */
  paidCents: number;
  /** Afrondmoment van de meest recente COMPLETED-samenwerking; `null` = geen afgeronde historie. */
  lastCompletedAt: Date | null;
  /** Loopt er nu een niet-terminale samenwerking (PROPOSED/ACTIVE)? Dan niet slapend. */
  hasActiveCollaboration: boolean;
}

export interface DormantFreelancerRow {
  freelancerId: string;
  name: string;
  paidCents: number;
  /** Dagen sinds de laatste afronding (≥ DORMANT_FREELANCER_DAYS). */
  daysSince: number;
  /** Afgeronde maanden sinds de laatste afronding (≥ 1), voor de UI-tekst. */
  monthsSince: number;
}

export interface DormantFreelancerSummary {
  rows: DormantFreelancerRow[];
  dormantCount: number;
  /** Betaalde uitgaven die in de slapende ZZP'ers "vastzitten" (som van paidCents). */
  dormantPaidCents: number;
}

const EMPTY: DormantFreelancerSummary = { rows: [], dormantCount: 0, dormantPaidCents: 0 };

/**
 * Pure aggregator: filtert de betaalde-uitgaven-ZZP'ers op "slapend" (afgeronde historie, geen lopende
 * samenwerking, laatste afronding DORMANT_FREELANCER_DAYS dagen of langer geleden) en sorteert op
 * uitgaven aflopend (dan op leeftijd aflopend). `now` wordt geïnjecteerd zodat de leeftijd
 * reproduceerbaar is. Een `lastCompletedAt` in de toekomst (data-ruis) levert een negatieve leeftijd
 * op en valt dus buiten de drempel — precies wat je wilt.
 */
export function summarizeDormantFreelancers(
  inputs: readonly DormantFreelancerInput[],
  now: Date = new Date(),
): DormantFreelancerSummary {
  const rows: DormantFreelancerRow[] = [];
  for (const f of inputs) {
    if (f.hasActiveCollaboration) continue;
    if (f.lastCompletedAt == null) continue;
    const daysSince = Math.floor((now.getTime() - f.lastCompletedAt.getTime()) / MS_PER_DAY);
    if (daysSince < DORMANT_FREELANCER_DAYS) continue;
    rows.push({
      freelancerId: f.freelancerId,
      name: f.name,
      paidCents: f.paidCents,
      daysSince,
      monthsSince: Math.max(1, Math.floor(daysSince / DAYS_PER_MONTH)),
    });
  }
  rows.sort((a, b) => b.paidCents - a.paidCents || b.daysSince - a.daysSince);
  return {
    rows,
    dormantCount: rows.length,
    dormantPaidCents: rows.reduce((sum, r) => sum + r.paidCents, 0),
  };
}

/**
 * Slapende ZZP'ers voor de ingelogde opdrachtgever. Bouwt voort op de reeds berekende
 * uitgaven-uitsplitsing (betaalde uitgaven per ZZP'er — dezelfde bron als de "Per ZZP'er"-widget, dus
 * geen drift) en verrijkt die met de samenwerking-recency uit één owner-veilige `Collaboration`-query
 * (gescoopt op de eigen opdrachtgever via de altijd-gevulde relatie `company.userId`, en begrensd tot
 * de ZZP'ers die daadwerkelijk uitgaven opleverden). Geen schema- of mutatie-oppervlak.
 */
export async function getDormantFreelancers(
  userId: string,
  breakdown: ClientSpendBreakdown,
  now: Date = new Date(),
): Promise<DormantFreelancerSummary> {
  if (breakdown.rows.length === 0) return EMPTY;

  const freelancerIds = breakdown.rows.map((r) => r.freelancerId);
  const collaborations = await prisma.collaboration.findMany({
    where: { company: { userId }, freelancerId: { in: freelancerIds } },
    select: { freelancerId: true, status: true, completedAt: true, endDate: true, updatedAt: true },
  });

  const active = new Set<string>();
  const lastCompleted = new Map<string, Date>();
  for (const col of collaborations) {
    if (col.status === "PROPOSED" || col.status === "ACTIVE") {
      active.add(col.freelancerId);
      continue;
    }
    if (col.status === "COMPLETED") {
      // completedAt is de canonieke afrondingsklok. Bewust een ándere terugval dan de repo-conventie
      // `completedAt ?? createdAt`: voor een recency-signaal is het eindmoment (endDate) een betere
      // benadering dan het startmoment (createdAt); updatedAt sluit de rij. Zo verliest een legacy
      // COMPLETED zonder stempel nooit z'n recency — niet "fixen" naar createdAt. Spiegelt exact de
      // terugval in dormant-clients.ts.
      const at = col.completedAt ?? col.endDate ?? col.updatedAt;
      const prev = lastCompleted.get(col.freelancerId);
      if (!prev || at.getTime() > prev.getTime()) lastCompleted.set(col.freelancerId, at);
    }
  }

  return summarizeDormantFreelancers(
    breakdown.rows.map((r) => ({
      freelancerId: r.freelancerId,
      name: r.name,
      paidCents: r.paidCents,
      lastCompletedAt: lastCompleted.get(r.freelancerId) ?? null,
      hasActiveCollaboration: active.has(r.freelancerId),
    })),
    now,
  );
}
