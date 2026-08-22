// Concurrentie-context ná het reageren, voor de ZZP'er op `/reacties`. Waar `job-competition.ts` de
// beslissing "reageer ik hierop?" ondersteunt (pre-application, op de opdrachtenlijst/-detail), helpt
// dit de vervolgvraag "blijf ik hierop wachten of kijk ik breder?" — de logische spanning op een nog-
// openstaande reactie. De ZZP'er ziet dan naast het wachttijd-signaal en de reactiebereidheid van de
// opdrachtgever ook hoeveel ándere kandidaten met hem concurreren, zodat hij zijn tijd gericht besteedt.
//
// Server-side is de waarheid (CLAUDE.md regel 1): de client toont het signaal, berekent het nooit zelf.
// Toont uitsluitend de geaggregeerde telling van andere kandidaten — nooit hun identiteit, scores of
// reacties. Puur en deterministisch, getest. De concurrentie-drempels komen uit `job-competition.ts`
// (`competitionLevel`) zodat de post-application-context niet drift van het pre-application-signaal.

import { type ApplicationStatus } from "@/lib/enums";
import { competitionLevel } from "@/lib/job-competition";

/** Toon van de context: bepaalt de emfase in de UI (rustig; nooit alarmerend). */
export type ApplicationCompetitionTone = "positive" | "neutral" | "caution";

export interface ApplicationCompetitionInput {
  /** Aantal actieve (niet-ingetrokken/afgewezen) reacties van ándere ZZP'ers op dezelfde opdracht. */
  otherApplicantCount: number;
  /** Status van de eigen reactie. Alleen nog-openstaande reacties krijgen context. */
  status: ApplicationStatus;
}

export interface ApplicationCompetitionNote {
  /** Compacte chip-tekst, bv. "Nog 7 andere kandidaten" of "Enige kandidaat". */
  label: string;
  /** Beslis-ondersteunende duiding: blijven wachten of breder kijken. */
  hint: string;
  tone: ApplicationCompetitionTone;
}

/** Statussen waarbij de reactie nog onbeslist openstaat en concurrentie-context relevant is. */
const OPEN_STATUSES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  "NEW",
  "VIEWED",
  "SHORTLIST",
]);

/** "N andere kandidaten" met correcte enkelvoud/meervoud. */
function otherCandidatesLabel(count: number): string {
  return `Nog ${count} ${count === 1 ? "andere kandidaat" : "andere kandidaten"}`;
}

/**
 * Vat de concurrentie op een nog-openstaande reactie samen voor de ZZP'er. Geeft `null` terug wanneer
 * context niet zinvol is: een reeds besliste reactie (ACCEPTED/REJECTED/WITHDRAWN) of een reactie die
 * al tot een samenwerking leidde — dan is "blijf wachten vs. breder kijken" niet meer aan de orde.
 *
 * Puur en deterministisch: leidt alleen af uit de geaggregeerde telling en de eigen status. Lekt geen
 * enkel gegeven van andere kandidaten — alleen hun aantal telt mee.
 */
export function summarizeApplicationCompetition({
  otherApplicantCount,
  status,
}: ApplicationCompetitionInput): ApplicationCompetitionNote | null {
  if (!OPEN_STATUSES.has(status)) return null;

  const count = Math.max(0, Math.trunc(otherApplicantCount));

  // Op de shortlist: de opdrachtgever overweegt je actief. Geruststellend geduid, ook bij veel
  // andere kandidaten — dit is de sterkste openstaande positie.
  if (status === "SHORTLIST") {
    if (count === 0) {
      return {
        label: "Enige op de shortlist",
        hint: "Je bent de enige kandidaat op de shortlist — een sterke uitgangspositie.",
        tone: "positive",
      };
    }
    return {
      label: otherCandidatesLabel(count),
      hint: `Je staat op de shortlist naast ${count === 1 ? "1 andere kandidaat" : `${count} andere kandidaten`}. De opdrachtgever weegt de selectie af.`,
      tone: "positive",
    };
  }

  if (count === 0) {
    return {
      label: "Enige kandidaat",
      hint: "Je bent tot nu toe de enige die reageerde — een goede uitgangspositie.",
      tone: "positive",
    };
  }

  const level = competitionLevel(count);
  const label = otherCandidatesLabel(count);

  if (level === "high") {
    return {
      label,
      hint: "Veel belangstelling voor deze opdracht. Verspreid je kansen ook over andere opdrachten.",
      tone: "caution",
    };
  }
  if (level === "moderate") {
    return {
      label,
      hint: "Enkele anderen reageerden ook. Houd ook andere passende opdrachten in de gaten.",
      tone: "neutral",
    };
  }
  return {
    label,
    hint: "Nog weinig concurrentie — je maakt een goede kans.",
    tone: "positive",
  };
}
