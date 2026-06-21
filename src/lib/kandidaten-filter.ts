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

/** Filter de reacties op status; "" laat alles staan. Muteert de invoer niet. */
export function filterApplicationsByStatus<T extends { status: string }>(
  applications: readonly T[],
  status: "" | ApplicationStatus,
): T[] {
  return status ? applications.filter((a) => a.status === status) : [...applications];
}

/** Telling per status (alle statussen op 0 geïnitialiseerd) voor de tab-badges. */
export function countApplicationsByStatus<T extends { status: string }>(
  applications: readonly T[],
): Record<ApplicationStatus, number> {
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<
    ApplicationStatus,
    number
  >;
  for (const a of applications) {
    if (isApplicationStatus(a.status)) counts[a.status] += 1;
  }
  return counts;
}
