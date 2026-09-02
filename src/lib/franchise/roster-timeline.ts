// Roosterbezetting-tijdlijn voor de bemiddelaar (franchiser). Het capaciteitsoverzicht
// (`roster-capacity.ts`) beantwoordt "wie kan ik NU inzetten?" en de vooruitblik
// (`roster-availability-forecast.ts`) "wie komt binnenkort vrij?". Deze module beantwoordt de
// dag-precieze planvraag ernaast: "wie is WANNEER beschikbaar?" — een raster met rosterrijen ×
// dagkolommen, elke cel afgeleid uit de zelf-opgegeven beschikbaarheidsvensters (`AvailabilityWindow`)
// én de lopende (ACTIVE) plaatsingen. Zo plant de bemiddelaar de komende twee weken in één oogopslag
// i.p.v. kaart-voor-kaart te raden (benchmark: rooster-/shiftplanning Temper/Zorgwerk/Pidz).
//
// Zuiver en deterministisch: geen I/O, geen impliciete tijd (elke `now` expliciet), muteert niets.
// Beschikbaarheid is een advies-signaal, geen harde poort — de ZZP'er beslist zelf bij het accepteren;
// deze helper toont alleen (CLAUDE.md regel 1, server-side blijft de waarheid).

/** Planhorizon: twee weken vooruit — ver genoeg om te plannen, dichtbij genoeg om actie te zijn. */
export const TIMELINE_HORIZON_DAYS = 14;

/**
 * Celtoestand, van "meest inzetbaar" naar "niet inzetbaar". De volgorde in dit array is de
 * precedentie bij samenval: een ingezette dag wint van een zelf-gemarkeerde afwezigheid (de plaatsing
 * is het harde operationele feit), afwezig wint van beperkt, beperkt van vrij.
 */
export const CELL_STATES = ["PLACED", "UNAVAILABLE", "LIMITED", "AVAILABLE"] as const;
export type CellState = (typeof CELL_STATES)[number];

/** Canonieke presentatie per celtoestand (label + korte celtekst). Los testbaar, één bron. */
export const CELL_META: Record<CellState, { label: string; short: string }> = {
  PLACED: { label: "Ingezet", short: "Ingezet" },
  UNAVAILABLE: { label: "Afwezig", short: "Afwezig" },
  LIMITED: { label: "Beperkt beschikbaar", short: "Beperkt" },
  AVAILABLE: { label: "Beschikbaar", short: "Vrij" },
};

/** Eén door de ZZP'er opgegeven beschikbaarheidsvenster (ruwe DB-vorm). */
export interface TimelineWindowInput {
  /** Begin van het venster (inclusief). */
  startDate: Date;
  /** Einde van het venster (inclusief). */
  endDate: Date;
  /** AvailabilityWindowType: AVAILABLE | LIMITED | UNAVAILABLE. */
  type: string;
}

/** Eén roster-ZZP'er als tijdlijn-invoer. */
export interface TimelineMemberInput {
  id: string;
  /** Weergavenaam (mag leeg zijn; de UI valt dan terug). */
  name: string;
  /** Zelf-opgegeven beschikbaarheidsvensters. */
  windows: readonly TimelineWindowInput[];
  /**
   * Einddatums van de lopende (ACTIVE) samenwerkingen. `null` = open einde: de plaatsing bezet de
   * hele horizon. Een plaatsing bezet vanaf vandaag t/m de einddatum (inclusief).
   */
  placementEnds: readonly (Date | null)[];
}

/** Eén kolomdag in de horizon. */
export interface TimelineDay {
  /** yyyy-mm-dd (UTC) — dag-granulaire sleutel, tijdzone-veilig en consistent met de zuster-helpers. */
  iso: string;
  /** UTC-middernacht van de dag (voor label-formattering in de UI). */
  date: Date;
  /** Zaterdag/zondag (UTC) — voor subtiele weekend-styling. */
  weekend: boolean;
}

/** Eén cel: de toestand van één ZZP'er op één dag. */
export interface TimelineCell {
  iso: string;
  state: CellState;
}

/** Eén rosterrij: een ZZP'er met zijn cel per horizon-dag. */
export interface TimelineRow {
  id: string;
  name: string;
  cells: TimelineCell[];
  /** Aantal dagen in de horizon dat de ZZP'er vrij inzetbaar is (celtoestand AVAILABLE). */
  availableDays: number;
}

export interface RosterTimeline {
  days: TimelineDay[];
  rows: TimelineRow[];
  /** Aantal vrij-inzetbare ZZP'ers per horizon-dag (uitgelijnd op `days`) — dunne dagen in één blik. */
  perDayAvailable: number[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Normaliseert een `Date` naar een dag-granulaire yyyy-mm-dd (UTC) sleutel — zo vergelijken we op
 * kalenderdag i.p.v. op millisecondes. Consistent met `roster-unavailability.ts` /
 * `proposal-availability.ts`. Ongeldige `Date` → null.
 */
function toDayKey(d: Date): string | null {
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

/** UTC-middernacht van de dag waarin `d` valt. */
function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Bouwt de horizon: `horizon` opeenvolgende dagen vanaf de UTC-dag van `now` (inclusief vandaag). */
function buildDays(now: Date, horizon: number): TimelineDay[] {
  const start = utcMidnight(now).getTime();
  const days: TimelineDay[] = [];
  for (let i = 0; i < horizon; i++) {
    const date = new Date(start + i * DAY_MS);
    const dow = date.getUTCDay(); // 0 = zondag, 6 = zaterdag
    days.push({ iso: date.toISOString().slice(0, 10), date, weekend: dow === 0 || dow === 6 });
  }
  return days;
}

/**
 * Bepaalt of een lopende plaatsing de dag `dayIso` bezet. Een `null`-einde is een open einde en bezet
 * elke dag; anders bezet de plaatsing t/m de einddag (inclusief) — een einde in het verleden bezet
 * geen enkele horizon-dag.
 */
function placementCoversDay(placementEnds: readonly (Date | null)[], dayIso: string): boolean {
  for (const end of placementEnds) {
    if (end == null) return true; // open einde → bezet de hele horizon
    const endKey = toDayKey(end);
    if (endKey !== null && dayIso <= endKey) return true;
  }
  return false;
}

/**
 * Zwaarste zelf-gemarkeerde venster-toestand op de dag `dayIso`: UNAVAILABLE wint van LIMITED; een
 * AVAILABLE-venster (of geen venster) laat de dag vrij. Vensters met een ongeldige range
 * (einde < begin) of een onbekend type worden genegeerd — geen vals signaal op corrupte data.
 */
function windowStateOnDay(
  windows: readonly TimelineWindowInput[],
  dayIso: string,
): "UNAVAILABLE" | "LIMITED" | null {
  let limited = false;
  for (const w of windows) {
    const startKey = toDayKey(w.startDate);
    const endKey = toDayKey(w.endDate);
    if (startKey === null || endKey === null || endKey < startKey) continue; // ongeldige range
    if (dayIso < startKey || dayIso > endKey) continue; // dag valt buiten het venster
    if (w.type === "UNAVAILABLE") return "UNAVAILABLE"; // zwaarste — direct beslissend
    if (w.type === "LIMITED") limited = true;
    // AVAILABLE (en onbekende typen) veranderen de vrije default niet.
  }
  return limited ? "LIMITED" : null;
}

/** De toestand van één ZZP'er op één dag, volgens de precedentie in `CELL_STATES`. */
function cellStateForDay(member: TimelineMemberInput, dayIso: string): CellState {
  if (placementCoversDay(member.placementEnds, dayIso)) return "PLACED";
  const w = windowStateOnDay(member.windows, dayIso);
  if (w === "UNAVAILABLE") return "UNAVAILABLE";
  if (w === "LIMITED") return "LIMITED";
  return "AVAILABLE";
}

/**
 * Bouwt de roosterbezetting-tijdlijn. Rijen worden gesorteerd op meest-inzetbaar eerst (meeste vrije
 * dagen), daarna op naam en id — deterministisch, en zet de best plaatsbare ZZP'ers bovenaan.
 */
export function buildRosterTimeline(
  members: readonly TimelineMemberInput[],
  now: Date = new Date(),
  horizon: number = TIMELINE_HORIZON_DAYS,
): RosterTimeline {
  const days = buildDays(now, Math.max(1, horizon));
  const perDayAvailable = new Array<number>(days.length).fill(0);

  const rows: TimelineRow[] = members.map((member) => {
    const cells: TimelineCell[] = [];
    let availableDays = 0;
    days.forEach((day, i) => {
      const state = cellStateForDay(member, day.iso);
      cells.push({ iso: day.iso, state });
      if (state === "AVAILABLE") {
        availableDays++;
        perDayAvailable[i]++;
      }
    });
    return { id: member.id, name: member.name, cells, availableDays };
  });

  rows.sort(
    (a, b) =>
      b.availableDays - a.availableDays ||
      a.name.localeCompare(b.name, "nl") ||
      a.id.localeCompare(b.id),
  );

  return { days, rows, perDayAvailable };
}
