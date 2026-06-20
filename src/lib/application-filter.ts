// Pure filter-/tellogica voor de reactielijst van de ZZP'er (/reacties). Server-side waarheid: de
// pagina leest de filter uit de URL-searchParams en filtert de al opgehaalde reacties — geen
// client-state, deterministisch en los van het Prisma-model getest.
//
// De individuele statussen (NEW/VIEWED/SHORTLIST/ACCEPTED/REJECTED/WITHDRAWN) worden tot een handvol
// betekenisvolle groepen samengevat die aansluiten op de OutcomesSummary-buckets: "Lopend" = nog in
// behandeling (NEW/VIEWED/SHORTLIST), naast Geaccepteerd / Afgewezen / Ingetrokken.

import { type ApplicationStatus } from "@/lib/enums";

/** De filtergroepen op /reacties; "all" toont alles. */
export type ApplicationFilterGroup = "all" | "open" | "accepted" | "rejected" | "withdrawn";

/** Selecteerbare groepen (zonder "all"), in weergavevolgorde. */
export const APPLICATION_FILTER_GROUPS = [
  "open",
  "accepted",
  "rejected",
  "withdrawn",
] as const satisfies readonly Exclude<ApplicationFilterGroup, "all">[];

export const APPLICATION_FILTER_GROUP_LABEL: Record<ApplicationFilterGroup, string> = {
  all: "Alle",
  open: "Lopend",
  accepted: "Geaccepteerd",
  rejected: "Afgewezen",
  withdrawn: "Ingetrokken",
};

/** Minimale vorm die de filter nodig heeft — los van het Prisma-model zodat de helper puur blijft. */
export interface FilterableApplication {
  status: ApplicationStatus;
}

/** Brengt een reactiestatus terug naar zijn filtergroep (consistent met de OutcomesSummary-buckets). */
export function applicationGroup(
  status: ApplicationStatus,
): Exclude<ApplicationFilterGroup, "all"> {
  switch (status) {
    case "NEW":
    case "VIEWED":
    case "SHORTLIST":
      return "open";
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "WITHDRAWN":
      return "withdrawn";
  }
}

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function isGroup(v: string): v is Exclude<ApplicationFilterGroup, "all"> {
  return (APPLICATION_FILTER_GROUPS as readonly string[]).includes(v);
}

/** Leest de filter uit de ruwe searchParams; onbekende/ongeldige waarden vallen terug op "all". */
export function parseApplicationFilter(
  searchParams: Record<string, string | string[] | undefined>,
): ApplicationFilterGroup {
  const status = first(searchParams.status);
  return isGroup(status) ? status : "all";
}

/** Past de filter toe; behoudt de invoervolgorde, muteert de invoer niet. */
export function filterApplications<T extends FilterableApplication>(
  items: T[],
  group: ApplicationFilterGroup,
): T[] {
  if (group === "all") return items;
  return items.filter((app) => applicationGroup(app.status) === group);
}

export interface ApplicationGroupCount {
  group: Exclude<ApplicationFilterGroup, "all">;
  label: string;
  count: number;
}

export interface ApplicationGroupSummary {
  total: number;
  /** Alleen aanwezige groepen, in de canonieke APPLICATION_FILTER_GROUPS-volgorde. */
  groups: ApplicationGroupCount[];
}

/** Telt het totaal én per aanwezige groep. Muteert de invoer niet. */
export function summarizeApplicationGroups(
  items: readonly FilterableApplication[],
): ApplicationGroupSummary {
  const byGroup = new Map<Exclude<ApplicationFilterGroup, "all">, number>();
  for (const app of items) {
    const group = applicationGroup(app.status);
    byGroup.set(group, (byGroup.get(group) ?? 0) + 1);
  }
  const groups: ApplicationGroupCount[] = [];
  for (const group of APPLICATION_FILTER_GROUPS) {
    const count = byGroup.get(group);
    if (!count) continue;
    groups.push({ group, label: APPLICATION_FILTER_GROUP_LABEL[group], count });
  }
  return { total: items.length, groups };
}

/** Bouwt de query-params voor een filter-link; de standaard ("all") wordt weggelaten. */
export function applicationFilterParams(group: ApplicationFilterGroup): Record<string, string> {
  return group === "all" ? {} : { status: group };
}
