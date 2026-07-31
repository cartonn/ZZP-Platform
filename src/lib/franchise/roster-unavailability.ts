// Onbeschikbaarheid-signaal voor de bemiddelaar (franchiser) die een roster-ZZP'er wil voordragen op
// een dienst (`/franchise/diensten/[id]`). Naast het dubbele-boeking-signaal (overlap met een andere
// ACTIEVE samenwerking, `roster-double-booking.ts`) is er een tweede, onafhankelijke reden waarom een
// voordracht een verspilde ronde wordt: de ZZP'er heeft zichzelf via een `AvailabilityWindow` (type
// UNAVAILABLE) op de dienstdatum onbeschikbaar gemaakt (vakantie, ander werk, verlof). Draagt de
// bemiddelaar dan tóch voor, dan volgt er een uitnodiging + notificatie die de ZZP'er alsnog moet
// afwijzen. Dit spiegelt exact de opdrachtgever-zijde (`proposal-availability.ts`, #1005) — nu voor de
// bemiddelaar op de voordracht-lijst.
//
// Zuiver en deterministisch: geen I/O, geen impliciete tijd, muteert niets. Server-side blijft de
// waarheid — beschikbaarheid is een advies-signaal, geen harde poort: de ZZP'er beslist zelf bij het
// accepteren. Deze helper toont alleen, beslist nooit over toegang (CLAUDE.md regel 1).

/** Eén door de ZZP'er opgegeven beschikbaarheidsvenster (ruwe DB-vorm). */
export interface AvailabilityWindowInput {
  /** Begin van het venster (inclusief). */
  startDate: Date;
  /** Einde van het venster (inclusief). */
  endDate: Date;
  /** AvailabilityWindowType: AVAILABLE | LIMITED | UNAVAILABLE. */
  type: string;
}

export interface UnavailabilitySignal {
  /** Of de dienstdatum in een als UNAVAILABLE gemarkeerd venster valt. */
  conflict: boolean;
  /** Start (yyyy-mm-dd) van het vroegst-startende conflictvenster, of null. */
  windowStartISO: string | null;
  /** Einde (yyyy-mm-dd) van datzelfde venster, of null. */
  windowEndISO: string | null;
}

const NONE: UnavailabilitySignal = { conflict: false, windowStartISO: null, windowEndISO: null };

/**
 * Normaliseert een `Date` naar een dag-granulaire yyyy-mm-dd (UTC) sleutel. Zo vergelijken we op
 * kalenderdag i.p.v. op millisecondes — tijdzone-veilig en consistent met de opdrachtgever-zijde die
 * al op ISO-datum-granulariteit toetst (`proposal-availability.ts`). Ongeldige `Date` → null.
 */
function toDayKey(d: Date): string | null {
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Bepaalt of de ZZP'er zichzelf op de dienstdatum onbeschikbaar heeft gemaakt.
 *
 * Regels:
 * - `dienstStart == null` → geen conflict: zonder datum valt niets te bepalen (geen vals alarm).
 * - Alleen vensters met `type === "UNAVAILABLE"` tellen; AVAILABLE/LIMITED zijn geen harde blokkade.
 * - Een venster telt als conflict wanneer de dienstdag (yyyy-mm-dd) inclusief binnen
 *   `[startDate, endDate]` valt. Een venster met een einde vóór het begin (ongeldige range) wordt
 *   genegeerd — geen vals alarm op corrupte data.
 * - Bij meerdere conflictvensters kiezen we het vroegst-startende (deterministisch) voor het label.
 *
 * Muteert de invoer niet.
 */
export function detectUnavailability(input: {
  dienstStart: Date | null;
  windows: readonly AvailabilityWindowInput[];
}): UnavailabilitySignal {
  const { dienstStart, windows } = input;
  if (!dienstStart) return NONE;

  const dienstKey = toDayKey(dienstStart);
  if (dienstKey === null) return NONE;

  const conflicts = windows
    .filter((w) => w.type === "UNAVAILABLE")
    .map((w) => ({ startKey: toDayKey(w.startDate), endKey: toDayKey(w.endDate) }))
    .filter(
      (w): w is { startKey: string; endKey: string } =>
        w.startKey !== null && w.endKey !== null && w.startKey <= w.endKey,
    )
    .filter((w) => w.startKey <= dienstKey && dienstKey <= w.endKey)
    .sort((a, b) =>
      a.startKey === b.startKey
        ? a.endKey.localeCompare(b.endKey)
        : a.startKey.localeCompare(b.startKey),
    );

  const first = conflicts[0];
  if (!first) return NONE;

  return { conflict: true, windowStartISO: first.startKey, windowEndISO: first.endKey };
}
