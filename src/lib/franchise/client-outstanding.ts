// Openstaand-bedrag per opdrachtgever voor de bemiddelaar (`/franchise/opdrachtgevers`). Pure,
// deterministische aggregatie over de reeds tenant-gescopet opgehaalde openstaande facturen — geen
// I/O, los getest. Voor een pool-manager is "welke klant heeft nu geld openstaan bij mijn ZZP'ers,
// en hoeveel daarvan is te laat?" het kern-cashflowsignaal: de betaalgedrag-chip geeft een
// kwalitatieve reputatie ("betaalt vaak laat"), maar niet het bedrag dat nú vaststaat. Hergebruikt
// bewust de canonieke aging-motor (`buildAgingReport`) zodat de bedragen en de zwaarste-bucket-
// classificatie exact overeenkomen met de `/openstaand`-pagina — geen tweede definitie, geen drift.

import {
  buildAgingReport,
  type OpenInvoice,
  type RelationSummary,
  type AgingBucketKey,
} from "@/lib/administration/aging";

/** Minimale openstaande-factuur-rij per opdrachtgever (uit de al tenant-gescopet opgehaalde rijen). */
export interface ClientOutstandingInvoice {
  /** Stabiele id van de opdrachtgever (Company) — groepeer-sleutel. */
  companyId: string;
  /** Totaalbedrag incl. btw van de openstaande factuur (integer-centen). */
  amountCents: number;
  /** Vervaldatum; `null` = geen datum → nooit "te laat". */
  dueAt: Date | null;
}

/** Openstaand-samenvatting per opdrachtgever (subset van de aging-relatie-rollup). */
export interface ClientOutstanding {
  totalOpenCents: number;
  overdueCents: number;
  overdueCount: number;
  worstBucket: AgingBucketKey;
}

/**
 * Openstaand per opdrachtgever, gegroepeerd op `companyId`. Retourneert een Map voor O(1)-lookup per
 * rij in de lijst. Draait de invoer door de canonieke `buildAgingReport` (bucket-classificatie +
 * te-laat-rollup) en projecteert de relatie-rollup terug op de company-id. `now` wordt geïnjecteerd
 * zodat de functie puur en testbaar blijft.
 */
export function clientOutstandingByCompany(
  invoices: readonly ClientOutstandingInvoice[],
  now: Date,
): Map<string, ClientOutstanding> {
  const openInvoices: OpenInvoice[] = invoices.map((inv, i) => ({
    id: `${inv.companyId}:${i}`,
    number: "",
    counterpartyName: inv.companyId, // naam is hier niet relevant; groeperen gebeurt op counterpartyId
    counterpartyId: inv.companyId,
    jobTitle: null,
    dueAt: inv.dueAt,
    amountCents: inv.amountCents,
    collaborationId: null,
    isCascade: false,
  }));

  const report = buildAgingReport(openInvoices, now);
  const map = new Map<string, ClientOutstanding>();
  for (const relation of report.relations) {
    if (relation.counterpartyId === null) continue;
    map.set(relation.counterpartyId, projectRelation(relation));
  }
  return map;
}

function projectRelation(relation: RelationSummary): ClientOutstanding {
  return {
    totalOpenCents: relation.totalOpenCents,
    overdueCents: relation.overdueCents,
    overdueCount: relation.overdueCount,
    worstBucket: relation.worstBucket,
  };
}

/** Pool-brede totalen: som over alle opdrachtgevers — voor het headline-cashflowsignaal. */
export interface PoolOutstandingTotals {
  totalOpenCents: number;
  overdueCents: number;
  overdueCount: number;
  /** Aantal opdrachtgevers met ≥1 te late openstaande post. */
  clientsOverdue: number;
}

/** Aggregeert de per-opdrachtgever-map naar pool-totalen (zelfde bron → geen drift met de lijst). */
export function poolOutstandingTotals(
  byCompany: ReadonlyMap<string, ClientOutstanding>,
): PoolOutstandingTotals {
  let totalOpenCents = 0;
  let overdueCents = 0;
  let overdueCount = 0;
  let clientsOverdue = 0;
  for (const client of byCompany.values()) {
    totalOpenCents += client.totalOpenCents;
    overdueCents += client.overdueCents;
    overdueCount += client.overdueCount;
    if (client.overdueCount > 0) clientsOverdue += 1;
  }
  return { totalOpenCents, overdueCents, overdueCount, clientsOverdue };
}
