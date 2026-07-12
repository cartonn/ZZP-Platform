// Kans-/concurrentiesignaal voor de ZZP'er: hoeveel kandidaten reageerden al op een gepubliceerde
// opdracht, en — gecombineerd met de eigen matchscore — hoe sterk de ZZP'er ervoor staat en of snel
// handelen loont. Spiegelbeeld van het opdrachtgever-bereiksignaal (`job-reach.ts`): waar dat de
// vraagkant samenvat (hoeveel passende ZZP'ers bereikt de opdracht), vat dit de aanbodkant samen voor
// de ZZP'er die overweegt te reageren. Concurrenten (Temper/Pidz/Zorgwerk) vullen diensten "binnen
// uren"; wij maken de concurrentie vooraf verklaarbaar zodat de ZZP'er zijn tijd gericht besteedt.
// Pure functies, getest. Server-side is de waarheid (CLAUDE.md regel 1): de client toont het signaal,
// berekent het nooit zelf. Toont uitsluitend de geaggregeerde telling — nooit de scores of identiteit
// van andere kandidaten.

/** Vanaf hoeveel actieve reacties de concurrentie "matig" is. */
export const COMPETITION_MODERATE_MIN = 3;
/** Vanaf hoeveel actieve reacties de concurrentie "hoog" is. */
export const COMPETITION_HIGH_MIN = 8;
/** Matchscore vanaf wanneer de aansluiting "sterk" is (gelijk aan de match-/bereik-drempel, 70). */
export const COMPETITION_STRONG_SCORE = 70;
/** Matchscore vanaf wanneer de aansluiting "redelijk" is. */
export const COMPETITION_FAIR_SCORE = 50;

export type CompetitionLevel = "low" | "moderate" | "high";
export type ChanceLevel = "strong" | "fair" | "longshot";

export interface CompetitionInput {
  /** Aantal actieve (niet-ingetrokken) reacties van ándere ZZP'ers op de opdracht. */
  applicantCount: number;
  /** Eigen matchscore 0-100 uit de verklaarbare matchmotor; null wanneer onbekend. */
  myScore: number | null;
}

export interface CompetitionSummary {
  applicantCount: number;
  level: CompetitionLevel;
  /** Kansniveau o.b.v. de eigen matchscore; null wanneer de score onbekend is. */
  chance: ChanceLevel | null;
  /** Korte kop, bv. "Goede kans". */
  headline: string;
  /** Uitleg + sturingstip. */
  hint: string;
  /** Of snel reageren aantoonbaar loont (veel reacties terwijl de match niet kansloos is). */
  urgent: boolean;
}

/** Vertaal het aantal actieve reacties naar een concurrentieniveau. */
export function competitionLevel(applicantCount: number): CompetitionLevel {
  if (applicantCount >= COMPETITION_HIGH_MIN) return "high";
  if (applicantCount >= COMPETITION_MODERATE_MIN) return "moderate";
  return "low";
}

/** Vertaal de eigen matchscore naar een kansniveau; null wanneer de score onbekend is. */
export function chanceLevel(myScore: number | null): ChanceLevel | null {
  if (myScore == null) return null;
  if (myScore >= COMPETITION_STRONG_SCORE) return "strong";
  if (myScore >= COMPETITION_FAIR_SCORE) return "fair";
  return "longshot";
}

/**
 * Vat de concurrentie op een gepubliceerde opdracht samen voor de ZZP'er die overweegt te reageren.
 * Puur en deterministisch: combineert alleen de geaggregeerde reactietelling met de eigen matchscore.
 * Geen enkel gegeven van andere kandidaten lekt — alleen hun aantal telt mee.
 */
export function summarizeJobCompetition({
  applicantCount,
  myScore,
}: CompetitionInput): CompetitionSummary {
  const count = Math.max(0, Math.trunc(applicantCount));
  const level = competitionLevel(count);
  const chance = chanceLevel(myScore);
  // Snel reageren loont wanneer er veel belangstelling is én de match niet kansloos is.
  const urgent = level === "high" && chance !== "longshot";

  let headline: string;
  let hint: string;

  if (count === 0) {
    // Nog niemand reageerde: een nudge om de eerste te zijn, afgestemd op de eigen match.
    headline = "Wees de eerste";
    hint =
      chance === "strong"
        ? "Nog niemand reageerde en je bent een sterke match — een vroege reactie valt op."
        : chance === "longshot"
          ? "Nog niemand reageerde. Je match is nog beperkt; vul ontbrekende eisen aan om sterker te staan."
          : "Nog niemand reageerde op deze opdracht. Een vroege reactie valt op.";
    return { applicantCount: count, level, chance, headline, hint, urgent: false };
  }

  if (chance === null) {
    // Geen eigen score bekend: toon alleen de belangstelling.
    if (level === "high") {
      headline = "Veel belangstelling";
      hint = "Veel kandidaten reageerden al; snel reageren loont.";
    } else if (level === "moderate") {
      headline = "Enkele kandidaten";
      hint = "Een paar anderen reageerden al op deze opdracht.";
    } else {
      headline = "Weinig concurrentie";
      hint = "Nog weinig kandidaten reageerden — een goed moment om te reageren.";
    }
    return { applicantCount: count, level, chance, headline, hint, urgent };
  }

  if (chance === "strong") {
    if (level === "high") {
      headline = "Sterke match — reageer snel";
      hint =
        "Veel kandidaten reageerden al, maar jouw aansluiting is sterk. Snel reageren vergroot je kans.";
    } else {
      headline = "Goede kans";
      hint =
        level === "moderate"
          ? "Je bent een sterke match; enkele anderen reageerden ook."
          : "Je bent een sterke match en er is nog weinig concurrentie.";
    }
  } else if (chance === "fair") {
    if (level === "high") {
      headline = "Veel concurrentie";
      hint =
        "Veel kandidaten en je match is redelijk. Reageer snel en onderscheid je met een sterke motivatie.";
    } else {
      headline = "Reële kans";
      hint =
        level === "moderate"
          ? "Enkele anderen reageerden. Je match is redelijk; een sterke motivatie helpt."
          : "Weinig concurrentie en een redelijke match — een sterke motivatie maakt het verschil.";
    }
  } else {
    // longshot
    if (level === "low") {
      headline = "Kans bestaat";
      hint =
        "Weinig concurrentie, maar je match is nog beperkt. Vul ontbrekende eisen aan om sterker te staan.";
    } else {
      headline = "Beperkte kans";
      hint =
        level === "high"
          ? "Veel kandidaten en je match is nog beperkt; overweeg of deze opdracht echt bij je past."
          : "Je match is nog beperkt en er zijn al enkele reacties.";
    }
  }

  return { applicantCount: count, level, chance, headline, hint, urgent };
}

export type CompetitionChipTone = "urgent" | "info";

export interface CompetitionChip {
  /** Compacte tekst voor de lijstweergave, bv. "3 reacties" of "8 reacties · reageer snel". */
  label: string;
  /** Toon-emfase: "urgent" (snel reageren loont aantoonbaar) | "info" (neutrale telling). */
  tone: CompetitionChipTone;
}

/**
 * Compacte lijst-chip afgeleid uit de volledige samenvatting. Bedoeld voor de opdrachtenlijst waar de
 * ZZP'er triageert welke opdracht als eerste te pakken: toont uitsluitend wanneer er al ándere reacties
 * zijn (≥1) — de beslis-relevante informatie ("anderen concurreren hier al"). Bij 0 reacties geeft dit
 * `null` terug zodat de lijst rustig blijft (geen "wees de eerste"-ruis op elke lege opdracht; die nudge
 * hoort op de detailpagina). Puur en deterministisch; lekt geen enkel gegeven van andere kandidaten.
 */
export function competitionChip(summary: CompetitionSummary): CompetitionChip | null {
  if (summary.applicantCount < 1) return null;
  const base = `${summary.applicantCount} ${summary.applicantCount === 1 ? "reactie" : "reacties"}`;
  if (summary.urgent) {
    return { label: `${base} · reageer snel`, tone: "urgent" };
  }
  return { label: base, tone: "info" };
}
