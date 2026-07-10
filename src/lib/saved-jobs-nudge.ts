// Actie-signaal per bewaarde, nog-open opdracht voor de ZZP'er. Op /opgeslagen beantwoordt dit de
// kernvraag "op welke bewaarde opdracht moet ik nog reageren, en wat heeft haast?": een opdracht
// bewaren zonder erop te reageren is een halve actie die stilletjes wegvalt. Concurrenten
// (Indeed/LinkedIn) tonen een "opgeslagen, nog niet gesolliciteerd"-nudge; wij maken dat startdatum-
// bewust zodat urgentie eerlijk is. Puur en deterministisch — afgeleid uit de al opgehaalde reactie-
// aanwezigheid + de onveranderlijke Job.startDate; geen I/O, geen schemawijziging.

// Binnen dit venster (hele dagen tot de startdatum) verdient een nog-onbeantwoorde bewaarde opdracht
// extra aandacht: reageren heeft dan haast, want de plek raakt bezet.
export const SAVED_JOB_START_SOON_DAYS = 10;

const MS_PER_DAY = 86_400_000;

export type SavedJobActionState =
  | "applied" //      Je hebt al gereageerd — geen actie meer nodig.
  | "open" //         Nog niet gereageerd; geen urgente startdatum.
  | "start_soon"; //  Nog niet gereageerd én de startdatum nadert (≤ venster).

export interface SavedJobActionInput {
  /** Of de ZZP'er al op déze opdracht heeft gereageerd. */
  hasApplied: boolean;
  /** Startdatum van de opdracht (onveranderlijk), of null als niet opgegeven. */
  startDate: Date | null;
}

export interface SavedJobAction {
  state: SavedJobActionState;
  /**
   * Hele dagen tot de startdatum (≥ 0), of null bij geen startdatum of een reeds verstreken start.
   * Alleen betekenisvol wanneer er nog niet gereageerd is; bij een verstreken start valt het
   * signaal terug op "open" (de opdracht staat nog open, de startdatum is kennelijk flexibel).
   */
  daysUntilStart: number | null;
}

/** Hele UTC-dagen tussen `now` en `startDate`; negatief als de start al verstreken is. */
function wholeDaysUntil(startDate: Date, now: Date): number {
  const startUTC = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  );
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((startUTC - todayUTC) / MS_PER_DAY);
}

/**
 * Bepaalt het actie-signaal voor één bewaarde, nog-open opdracht. `now` wordt geïnjecteerd zodat de
 * uitkomst reproduceerbaar is. Reageren is de eindstatus: zodra er gereageerd is, is er geen nudge
 * meer (state `applied`, geen aftelling). Zonder reactie telt de startdatum: binnen het venster
 * `start_soon`, anders `open`.
 */
export function summarizeSavedJobAction(input: SavedJobActionInput, now: Date): SavedJobAction {
  if (input.hasApplied) {
    return { state: "applied", daysUntilStart: null };
  }
  if (input.startDate) {
    const days = wholeDaysUntil(input.startDate, now);
    if (days >= 0) {
      return {
        state: days <= SAVED_JOB_START_SOON_DAYS ? "start_soon" : "open",
        daysUntilStart: days,
      };
    }
  }
  return { state: "open", daysUntilStart: null };
}

/**
 * Aantal bewaarde, nog-open opdrachten waarop nog niet is gereageerd (state ≠ `applied`) — de
 * top-regel "N nog niet beantwoord" op /opgeslagen. Muteert de invoer niet.
 */
export function countUnactedSavedJobs(actions: SavedJobAction[]): number {
  return actions.reduce((n, a) => (a.state === "applied" ? n : n + 1), 0);
}
