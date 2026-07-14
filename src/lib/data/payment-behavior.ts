import "server-only";
import { prisma } from "@/lib/db";
import {
  computePaymentBehavior,
  type PaymentBehavior,
  type PaymentRow,
} from "@/lib/payment-behavior";

// Maximumaantal betaalde facturen dat we ophalen per opdrachtgever. Beperkt de query-omvang
// en is ruim genoeg voor een representatief signaal.
const MAX_PAID_INVOICES = 25;

/**
 * Laadt de betaalgeschiedenis van een opdrachtgever (Company) en berekent het betaalgedrag-
 * signaal. Geeft alleen geaggregeerde statistieken terug — geen individuele factuurdata
 * van anderen is zichtbaar voor de aanroeper (privacy by design).
 *
 * Bronkeuze `paidAt`: `Invoice.updatedAt` bij status = "PAID". Zie `payment-behavior.ts` voor
 * de volledige onderbouwing.
 *
 * Scoping-verantwoordelijkheid (defense-in-depth): deze functie neemt een rauwe `companyId` zonder
 * eigen rol-/tenant-check en berekent de betaalreputatie van díe opdrachtgever. Het signaal is een
 * met-naam-tonbare reputatie over een derde (art. 30-verwerking `betaalgedrag-reputatie`); de aanroeper
 * MOET de opgevraagde opdrachtgever(s) daarom eerst scopen op wat de actor mag zien
 * (`visibleJobsWhere(actor)` voor de browse-lijst, of de eigen `Company` voor de reputatie-spiegel).
 * Roep dit nooit aan met een ongevalideerde, van buitenaf aangeleverde `companyId` (bv. direct uit een
 * API-parameter) — dat zou arbitraire-opdrachtgever-betaalreputatie kunnen blootstellen. Zie de
 * AVG-privacy-backlog (LAAG defense-in-depth).
 */
export async function getPaymentBehaviorForCompany(companyId: string): Promise<PaymentBehavior> {
  const invoices = await prisma.invoice.findMany({
    where: {
      collaboration: { companyId },
      status: "PAID",
    },
    select: {
      issuedAt: true,
      dueAt: true,
      updatedAt: true, // proxy voor paidAt — zie bronkeuze in payment-behavior.ts
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_PAID_INVOICES,
  });

  const rows: PaymentRow[] = invoices.map((inv) => ({
    issuedAt: inv.issuedAt,
    dueAt: inv.dueAt,
    paidAt: inv.updatedAt, // updatedAt springt mee bij status-update naar PAID
  }));

  return computePaymentBehavior(rows);
}

/**
 * Variant voor meerdere opdrachtgevers ineens (bv. de browse-opdrachtenlijst van een ZZP'er, waar elke
 * zichtbare opdracht een andere opdrachtgever kan hebben). De set is inherent klein (begrensd door de
 * gepagineerde, zichtbare opdrachten), dus we hergebruiken de single-variant per opdrachtgever — die
 * begrenst de fetch al met `take: MAX_PAID_INVOICES` op DB-niveau (geen onbegrensde findMany). De
 * queries lopen parallel. Geeft alleen geaggregeerde statistieken terug — geen individuele factuurdata
 * van anderen is zichtbaar voor de aanroeper (privacy by design). Spiegelt
 * `getClientResponsivenessForCompanies`.
 *
 * Scoping-verantwoordelijkheid (defense-in-depth): net als de single-variant neemt deze functie een
 * rauwe id-lijst zonder eigen rol-/tenant-check. De aanroeper MOET de `companyIds` eerst afleiden uit
 * wat de actor mag zien (de enige call-site scopet op `visibleJobsWhere(actor)`); geef hier nooit
 * ongevalideerde, van buitenaf aangeleverde id's aan door. Zie de AVG-privacy-backlog (LAAG).
 */
export async function getPaymentBehaviorForCompanies(
  companyIds: string[],
): Promise<Map<string, PaymentBehavior>> {
  const unique = [...new Set(companyIds)];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getPaymentBehaviorForCompany(id)] as const),
  );
  return new Map(entries);
}

/**
 * Betaalgedrag van de opdrachtgever zélf — de reputatie-spiegel die de opdrachtgever op
 * `/verplichtingen` ziet (dezelfde cijfers die ZZP'ers over hem zien op de opdracht-detailpagina).
 * Geeft `null` als de gebruiker geen bedrijfsprofiel heeft (dan is er niets te spiegelen).
 */
export async function getOwnPaymentBehaviorForClient(
  userId: string,
): Promise<PaymentBehavior | null> {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!company) return null;
  return getPaymentBehaviorForCompany(company.id);
}
