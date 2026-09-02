import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/enums";

/**
 * Statusfilter voor de kandidaten-/reactielijst van de opdrachtgever (`/kandidaten`).
 * Pure logica los van de pagina zodat de grenzen (onbekende status, lege lijst, telling)
 * deterministisch testbaar zijn. Spiegelt het filter-idioom van `/prestaties` en `/diensten`.
 */

// Geordende tabs: "Alle" eerst, daarna de werkstroom-volgorde uit APPLICATION_STATUSES.
export const KANDIDATEN_FILTER_LABELS: Record<string, string> = {
  "": "Alle",
  NEW: "Nieuw",
  VIEWED: "Bekeken",
  SHORTLIST: "Shortlist",
  ACCEPTED: "Geaccepteerd",
  REJECTED: "Afgewezen",
  WITHDRAWN: "Ingetrokken",
};

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

/** Normaliseer een rauwe `?status=`-searchParam naar een geldige status of "" (alles). */
export function normalizeKandidatenFilter(raw: string | undefined): "" | ApplicationStatus {
  return raw && isApplicationStatus(raw) ? raw : "";
}

/**
 * Bouwt een `/kandidaten`-href die het statusfilter, een eventuele opdracht-scope (`?job=<id>`) én
 * de paginatie-cursor (`?cursor=<id>`) behoudt. Pure query-string-compositie zodat de statustabs bij
 * een op één opdracht gescoopte lijst binnen die scope blijven en "Meer laden" filter + scope
 * meeneemt. Lege waarden worden weggelaten (geen `?status=`). Een tab-href geeft géén cursor mee, zodat
 * wisselen van filter altijd bij de eerste pagina begint.
 */
export function buildKandidatenHref(opts: {
  status?: "" | ApplicationStatus;
  job?: string | null;
  cursor?: string | null;
}): string {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.job) params.set("job", opts.job);
  if (opts.cursor) params.set("cursor", opts.cursor);
  const qs = params.toString();
  return qs ? `/kandidaten?${qs}` : "/kandidaten";
}

/**
 * Vertaalt het statusfilter naar een Prisma-`where`-fragment. Het filteren gebeurt server-side in de
 * database — niet in het geheugen op een volledig geladen lijst — zodat `/kandidaten` per tab alleen
 * de rijen ophaalt die hij toont. "" (alle) levert een leeg fragment op.
 */
export function kandidatenStatusWhere(status: "" | ApplicationStatus): { status?: string } {
  return status ? { status } : {};
}

/**
 * Bouwt de tab-tellingen uit een `groupBy(["status"])`-resultaat. De database telt; de pagina laadt
 * daarvoor geen enkele reactie meer in het geheugen. Alle bekende statussen komen terug (op 0
 * geïnitialiseerd) zodat elke tab een getal heeft, en een onbekende status uit de database wordt
 * genegeerd in plaats van de pagina te laten crashen.
 */
export function statusCountsFromGroups(
  groups: readonly { status: string; _count: { _all: number } }[],
): Record<ApplicationStatus, number> {
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<
    ApplicationStatus,
    number
  >;
  for (const g of groups) {
    if (isApplicationStatus(g.status)) counts[g.status] += g._count._all;
  }
  return counts;
}

/** Totaal aantal reacties over alle statussen — de "Alle"-tab en de lege-staat-poort. */
export function totalFromStatusGroups(
  groups: readonly { status: string; _count: { _all: number } }[],
): number {
  return groups.reduce((sum, g) => sum + g._count._all, 0);
}
