// Opdrachtgever-spreiding (omzetconcentratie) voor de ZZP'er — een proactief, portefeuille-breed
// afhankelijkheidssignaal op /inzicht. Sterke afhankelijkheid van één opdrachtgever is zowel een
// bedrijfsrisico (valt die klant weg, dan valt een groot deel van de omzet weg) als een Wet-DBA-
// risicosignaal (schijnzelfstandigheid). Het platform signaleert en documenteert — het geeft GEEN
// juridisch advies (Besluit 2), dus elk gebruik gaat vergezeld van de DBA-disclaimer.
//
// Bewust dezelfde OMZET-basis + dezelfde afronding + dezelfde DBA-drempel als de admin DBA-monitor
// (`dba-monitor.ts revenueConcentrationPct`, gevoed uit de OMZET-grootboekregels): de proactieve
// ZZP-badge kan zo nooit driften of het admin-signaal tegenspreken. Read-only, geen mutaties.

import { prisma } from "@/lib/db";
import { getDbaThresholds } from "@/lib/platform-config";

/** Onder deze grens (maar onder de DBA-drempel) tonen we een "let op spreiding"-waarschuwing. */
export const CONCENTRATION_WATCH_PCT = 50;

/** Hoeveel opdrachtgevers we maximaal in de lijst tonen. */
export const CONCENTRATION_TOP_N = 4;

export type ConcentrationTone = "good" | "watch" | "concentrated";

export interface ClientRevenue {
  clientUserId: string;
  clientName: string;
  cents: number;
}

export interface ClientShare {
  clientUserId: string;
  clientName: string;
  cents: number;
  /** Aandeel (0–100, afgerond) t.o.v. de totale omzet — zelfde afronding als de DBA-monitor. */
  sharePct: number;
}

export interface ClientConcentration {
  totalCents: number;
  /** Aantal opdrachtgevers met positieve omzet. */
  clientCount: number;
  /** Grootste opdrachtgever (nooit null wanneer het geheel niet-null is). */
  top: ClientShare;
  /** Gesorteerd aflopend op omzet, maximaal `CONCENTRATION_TOP_N`. */
  shares: ClientShare[];
  tone: ConcentrationTone;
  /** true zodra het aandeel van de grootste opdrachtgever de DBA-drempel bereikt/overschrijdt. */
  crossesDbaThreshold: boolean;
  dbaThresholdPct: number;
}

/**
 * Vat de omzetverdeling over opdrachtgevers samen tot één afhankelijkheidssignaal.
 * `null` als er (nog) geen omzet is — dan tonen we niets misleidends. Eén betalende
 * opdrachtgever (100%) geeft bewust wél een signaal: dat is juist de sterkste afhankelijkheid.
 */
export function summarizeClientConcentration(
  revenues: readonly ClientRevenue[],
  dbaThresholdPct: number,
): ClientConcentration | null {
  const positive = revenues.filter((r) => r.cents > 0);
  const totalCents = positive.reduce((sum, r) => sum + r.cents, 0);
  if (totalCents <= 0) return null;

  const sorted = [...positive].sort((a, b) => b.cents - a.cents);
  const largest = sorted[0];
  if (!largest) return null;
  const toShare = (r: ClientRevenue): ClientShare => ({
    clientUserId: r.clientUserId,
    clientName: r.clientName,
    cents: r.cents,
    // Zelfde afronding als dba-monitor.ts `revenueConcentrationPct` → geen drift met het admin-signaal.
    sharePct: Math.round((r.cents / totalCents) * 100),
  });

  const top = toShare(largest);
  const crossesDbaThreshold = top.sharePct >= dbaThresholdPct;
  const tone: ConcentrationTone = crossesDbaThreshold
    ? "concentrated"
    : top.sharePct >= CONCENTRATION_WATCH_PCT
      ? "watch"
      : "good";

  return {
    totalCents,
    clientCount: positive.length,
    top,
    shares: sorted.slice(0, CONCENTRATION_TOP_N).map(toShare),
    tone,
    crossesDbaThreshold,
    dbaThresholdPct,
  };
}

/**
 * Bouwt de omzet-per-opdrachtgever voor de ingelogde ZZP'er uit de gerealiseerde OMZET-boekingen
 * (exact de bron die de DBA-monitor gebruikt) en vat die samen. Scoping op `ownerUserId` — een
 * ZZP'er ziet uitsluitend zijn eigen omzet. `null` zonder omzet.
 */
export async function getFreelancerClientConcentration(
  userId: string,
): Promise<ClientConcentration | null> {
  const [entries, thresholds] = await Promise.all([
    prisma.administrationEntry.findMany({
      where: { account: "OMZET", ownerUserId: userId, invoiceId: { not: null } },
      select: { creditCents: true, debitCents: true, invoiceId: true },
    }),
    getDbaThresholds(),
  ]);
  if (entries.length === 0) return null;

  // Herleid de opdrachtgever per factuur (AdministrationEntry heeft geen invoice-relatie).
  const invoiceIds = [...new Set(entries.map((e) => e.invoiceId).filter((x): x is string => !!x))];
  const invoices = invoiceIds.length
    ? await prisma.invoice.findMany({
        where: { id: { in: invoiceIds } },
        select: { id: true, counterpartyUserId: true },
      })
    : [];
  const invoiceClient = new Map(invoices.map((i) => [i.id, i.counterpartyUserId]));

  // Omzet in centen per opdrachtgever (credit-saldo), net als dba-monitor-task.ts.
  const centsByClient = new Map<string, number>();
  for (const e of entries) {
    const clientId = e.invoiceId ? invoiceClient.get(e.invoiceId) : null;
    if (!clientId) continue;
    centsByClient.set(clientId, (centsByClient.get(clientId) ?? 0) + e.creditCents - e.debitCents);
  }
  if (centsByClient.size === 0) return null;

  // Herleid een leesbare naam per opdrachtgever (Company.name → val terug op User.name → "Opdrachtgever").
  const clientIds = [...centsByClient.keys()];
  const [companies, users] = await Promise.all([
    prisma.company.findMany({
      where: { userId: { in: clientIds } },
      select: { userId: true, name: true },
    }),
    prisma.user.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } }),
  ]);
  const companyName = new Map(companies.map((c) => [c.userId, c.name]));
  const userName = new Map(users.map((u) => [u.id, u.name]));

  const revenues: ClientRevenue[] = clientIds.map((clientUserId) => ({
    clientUserId,
    clientName: companyName.get(clientUserId) ?? userName.get(clientUserId) ?? "Opdrachtgever",
    cents: centsByClient.get(clientUserId) ?? 0,
  }));

  return summarizeClientConcentration(revenues, thresholds.revenueConcentrationPct);
}
