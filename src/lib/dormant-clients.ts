// Rol-gericht win-back-signaal voor de ZZP'er: opdrachtgevers die eerder betaalde omzet opleverden,
// maar waar al maanden geen samenwerking meer mee liep. Herhaalwerk is doorgaans de goedkoopste nieuwe
// opdracht; het platform meet de omzet per opdrachtgever al (freelancer-revenue-breakdown.ts) maar
// nooit de recency ervan. Read-only inzicht — puur en deterministisch (klok geïnjecteerd) zodat het
// zonder DB testbaar is. Toont uitsluitend eigen, geaggregeerde cijfers — nooit data van andere ZZP'ers.

import { prisma } from "@/lib/db";
import { type FreelancerRevenueBreakdown } from "@/lib/freelancer-revenue-breakdown";

/** Een opdrachtgever heet "slapend" zodra de laatste samenwerking langer dan dit geleden afrondde. */
export const DORMANT_CLIENT_DAYS = 90;
const MS_PER_DAY = 86_400_000;
// Ruwe maand voor de "N maanden geleden"-tekst; kalenderprecisie voegt hier niets toe.
const DAYS_PER_MONTH = 30;

export interface DormantClientInput {
  companyId: string;
  name: string;
  /** Betaalde omzet ooit bij deze opdrachtgever (centen). Rangschikkingsbasis. */
  paidCents: number;
  /** Aandeel van de totale betaalde omzet (0–100, afgerond). */
  sharePct: number;
  /** Afrondmoment van de meest recente COMPLETED-samenwerking; `null` = geen afgeronde historie. */
  lastCompletedAt: Date | null;
  /** Loopt er nu een niet-terminale samenwerking (PROPOSED/ACTIVE)? Dan niet slapend. */
  hasActiveCollaboration: boolean;
}

export interface DormantClientRow {
  companyId: string;
  name: string;
  paidCents: number;
  sharePct: number;
  /** Dagen sinds de laatste afronding (≥ DORMANT_CLIENT_DAYS). */
  daysSince: number;
  /** Afgeronde maanden sinds de laatste afronding (≥ 1), voor de UI-tekst. */
  monthsSince: number;
}

export interface DormantClientSummary {
  rows: DormantClientRow[];
  dormantCount: number;
  /** Betaalde omzet die in de slapende klanten "vastzit" (som van paidCents). */
  dormantPaidCents: number;
}

const EMPTY: DormantClientSummary = { rows: [], dormantCount: 0, dormantPaidCents: 0 };

/**
 * Pure aggregator: filtert de betaalde-omzet-klanten op "slapend" (afgeronde historie, geen lopende
 * samenwerking, laatste afronding ouder dan DORMANT_CLIENT_DAYS) en sorteert op omzet aflopend
 * (dan op leeftijd aflopend). `now` wordt geïnjecteerd zodat de leeftijd reproduceerbaar is. Een
 * `lastCompletedAt` in de toekomst (data-ruis) levert een negatieve leeftijd op en valt dus buiten
 * de drempel — precies wat je wilt.
 */
export function summarizeDormantClients(
  inputs: readonly DormantClientInput[],
  now: Date = new Date(),
): DormantClientSummary {
  const rows: DormantClientRow[] = [];
  for (const c of inputs) {
    if (c.hasActiveCollaboration) continue;
    if (c.lastCompletedAt == null) continue;
    const daysSince = Math.floor((now.getTime() - c.lastCompletedAt.getTime()) / MS_PER_DAY);
    if (daysSince < DORMANT_CLIENT_DAYS) continue;
    rows.push({
      companyId: c.companyId,
      name: c.name,
      paidCents: c.paidCents,
      sharePct: c.sharePct,
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
 * Slapende opdrachtgevers voor de ingelogde ZZP'er. Bouwt voort op de reeds berekende
 * omzet-uitsplitsing (betaalde omzet per opdrachtgever — dezelfde bron als de widget, dus geen drift)
 * en verrijkt die met de samenwerking-recency uit één tenant-veilige `Collaboration`-query
 * (freelancer-gescoopt, begrensd tot de opdrachtgevers die daadwerkelijk omzet opleverden). Geen
 * schema- of mutatie-oppervlak.
 */
export async function getDormantClients(
  userId: string,
  breakdown: FreelancerRevenueBreakdown,
): Promise<DormantClientSummary> {
  if (breakdown.rows.length === 0) return EMPTY;

  const companyIds = breakdown.rows.map((r) => r.companyId);
  const collaborations = await prisma.collaboration.findMany({
    where: { freelancer: { userId }, companyId: { in: companyIds } },
    select: { companyId: true, status: true, completedAt: true, endDate: true, updatedAt: true },
  });

  const active = new Set<string>();
  const lastCompleted = new Map<string, Date>();
  for (const col of collaborations) {
    if (col.status === "PROPOSED" || col.status === "ACTIVE") {
      active.add(col.companyId);
      continue;
    }
    if (col.status === "COMPLETED") {
      // completedAt is de canonieke afrondingsklok; een legacy COMPLETED zonder stempel valt terug op
      // endDate en anders updatedAt, zodat recency nooit verloren gaat.
      const at = col.completedAt ?? col.endDate ?? col.updatedAt;
      const prev = lastCompleted.get(col.companyId);
      if (!prev || at.getTime() > prev.getTime()) lastCompleted.set(col.companyId, at);
    }
  }

  return summarizeDormantClients(
    breakdown.rows.map((r) => ({
      companyId: r.companyId,
      name: r.name,
      paidCents: r.paidCents,
      sharePct: r.sharePct,
      lastCompletedAt: lastCompleted.get(r.companyId) ?? null,
      hasActiveCollaboration: active.has(r.companyId),
    })),
  );
}
