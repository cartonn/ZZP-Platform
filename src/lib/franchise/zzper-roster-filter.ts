/**
 * Pure filter-/sorteerlogica voor het franchise-ZZP'er-roster (`/franchise/zzpers`).
 *
 * Leaf-module zonder server- of prisma-imports zodat ze los testbaar is. De pagina haalt de
 * tenant-gescopete ZZP'ers op, verrijkt ze tot {@link RosterZzper} (beschikbaarheid + inzetbaarheid
 * + certificaat-waarschuwing) en filtert/sorteert ze hiermee. Server-side waarheid: het filter
 * beslist niets — het toont alleen een deelverzameling van wat de franchiser al mag zien.
 */

import { type EngageabilityStatus } from "@/lib/engageability";
import { isIdleReady } from "@/lib/franchise/roster-capacity";

export const ROSTER_AVAILABILITY_VALUES = ["AVAILABLE", "LIMITED", "UNAVAILABLE"] as const;
export type RosterAvailability = (typeof ROSTER_AVAILABILITY_VALUES)[number];

// Spiegelt de EngageabilityStatus-waarden; los gedefinieerd zodat dit een leaf-module blijft.
export const ROSTER_STATUS_VALUES = ["ACTIEF", "AANDACHT", "INACTIEF"] as const;

export const ROSTER_SORT_VALUES = ["recent", "name", "rate-asc", "rate-desc"] as const;
export type RosterSortKey = (typeof ROSTER_SORT_VALUES)[number];

/** Het geparste filter; `null` betekent "deze dimensie niet filteren". */
export interface RosterFilter {
  q: string;
  availability: RosterAvailability | null;
  status: EngageabilityStatus | null;
  onlyAlerts: boolean;
  /** Alleen vrij-inzetbare ZZP'ers (inzetbaar + beschikbaar + geen lopende opdracht). */
  onlyIdle: boolean;
  sort: RosterSortKey;
}

/** Minimale vorm waarop filter + sortering werken; de pagina levert deze velden aan. */
export interface RosterZzper {
  id: string;
  name: string;
  headline: string | null;
  location: string | null;
  skillLabels: string[];
  availability: string;
  engageabilityStatus: EngageabilityStatus;
  hasAlert: boolean;
  hourlyRate: number | null;
  /** Aantal lopende (ACTIVE) samenwerkingen; > 0 = nu ingezet (voor het `idle`-filter). */
  activeCollaborations: number;
}

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Leest het filter uit de (genormaliseerde) searchParams; onbekende waarden vallen weg naar `null`. */
export function parseRosterFilter(sp: Record<string, string | string[] | undefined>): RosterFilter {
  const availabilityRaw = first(sp.availability).trim().toUpperCase();
  const statusRaw = first(sp.status).trim().toUpperCase();
  const sortRaw = first(sp.sort).trim().toLowerCase();
  const alertsRaw = first(sp.alerts).trim().toLowerCase();
  const idleRaw = first(sp.idle).trim().toLowerCase();

  const availability = (ROSTER_AVAILABILITY_VALUES as readonly string[]).includes(availabilityRaw)
    ? (availabilityRaw as RosterAvailability)
    : null;
  const status = (ROSTER_STATUS_VALUES as readonly string[]).includes(statusRaw)
    ? (statusRaw as EngageabilityStatus)
    : null;
  const sort = (ROSTER_SORT_VALUES as readonly string[]).includes(sortRaw)
    ? (sortRaw as RosterSortKey)
    : "recent";

  return {
    q: first(sp.q).trim(),
    availability,
    status,
    onlyAlerts: alertsRaw === "1" || alertsRaw === "true",
    onlyIdle: idleRaw === "1" || idleRaw === "true",
    sort,
  };
}

/** Of een ZZP'er aan álle actieve filterdimensies voldoet (zoekt over naam + headline + locatie + skills). */
export function matchesRosterFilter(z: RosterZzper, f: RosterFilter): boolean {
  if (f.availability && z.availability !== f.availability) return false;
  if (f.status && z.engageabilityStatus !== f.status) return false;
  if (f.onlyAlerts && !z.hasAlert) return false;
  if (f.onlyIdle && !isIdleReady(z)) return false;
  if (f.q) {
    const needle = f.q.toLowerCase();
    const haystack =
      `${z.name} ${z.headline ?? ""} ${z.location ?? ""} ${z.skillLabels.join(" ")}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export function filterRoster<T extends RosterZzper>(items: T[], f: RosterFilter): T[] {
  return items.filter((z) => matchesRosterFilter(z, f));
}

// Deterministische eindtiebreaker zodat dezelfde invoer altijd dezelfde volgorde geeft.
function byNameThenId(a: RosterZzper, b: RosterZzper): number {
  return a.name.localeCompare(b.name, "nl") || a.id.localeCompare(b.id);
}

// Tarief-vergelijking met "geen tarief opgegeven" altijd achteraan, ongeacht de richting.
function compareRate(a: number | null, b: number | null, dir: "asc" | "desc"): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir === "asc" ? a - b : b - a;
}

/**
 * Pure, stabiele sortering over vooraf geladen kaartdata — testbaar zonder DB. "recent" behoudt de
 * server-volgorde (nieuwste eerst). Muteert de invoer niet.
 */
export function sortRoster<T extends RosterZzper>(items: T[], sort: RosterSortKey): T[] {
  const result = [...items];
  switch (sort) {
    case "recent":
      return result;
    case "name":
      return result.sort(byNameThenId);
    case "rate-asc":
      return result.sort(
        (a, b) => compareRate(a.hourlyRate, b.hourlyRate, "asc") || byNameThenId(a, b),
      );
    case "rate-desc":
      return result.sort(
        (a, b) => compareRate(a.hourlyRate, b.hourlyRate, "desc") || byNameThenId(a, b),
      );
  }
}

/** Of er een actieve filterdimensie is (voor de "wis filter"-affordance / lege-staat-tekst). */
export function isRosterFilterActive(f: RosterFilter): boolean {
  return f.q !== "" || f.availability !== null || f.status !== null || f.onlyAlerts || f.onlyIdle;
}
