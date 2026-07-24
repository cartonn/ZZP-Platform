// Poolsamenvatting van het reactieveld op één opdracht — de "vorm van het veld" in één oogopslag
// voor de opdrachtgever op /kandidaten/vergelijk. De vergelijk-tabel laat per kandidaat de
// uitspringer zien, maar beantwoordt niet de aggregaatvraag die vóór het inzoomen telt: hoeveel
// reacties zijn er, waar ligt het matchniveau (mediaan + spreiding), hoeveel voldoen aan de eisen,
// en hoeveel kunnen op de startdatum starten. Staffing-dashboards (Temper/Pidz) tonen die
// veldvorm standaard zodat je snel weet of een pool diep genoeg is om uit te kiezen.
//
// Puur en deterministisch: geen DB, geen eigen klok, muteert de invoer niet. Leunt volledig op de
// al-afgeleide velden per kandidaat (matchScore/compliance/startFit) uit de bestaande motoren →
// geen tweede bron van waarheid, kan niet driften.

import { type ComplianceStatus } from "@/lib/matching";
import { type StartFit } from "@/lib/candidate-availability";

/** Eén kandidaat zoals hij meetelt in de veldsamenvatting. Alle velden komen uit bestaande motoren. */
export interface FieldCandidate {
  /** Matchscore 0–100, of null als (nog) niet berekend. */
  matchScore: number | null;
  /** Compliance op de vereiste certificaten, of null als de opdracht er geen eist / onbekend. */
  complianceStatus: ComplianceStatus | null;
  /** Beschikbaarheid op de startdatum; `undefined`/`"unknown"` als er geen oordeel mogelijk is. */
  startFit?: StartFit;
}

/** Verdeling van de matchscores over het veld (alleen kandidaten mét een score tellen mee). */
export interface MatchSpread {
  /** Mediane matchscore (robuuster dan gemiddelde), afgerond op een heel getal. */
  median: number;
  /** Laagste matchscore in het veld. */
  min: number;
  /** Hoogste matchscore in het veld. */
  max: number;
  /** Aantal kandidaten met een berekende matchscore. */
  count: number;
}

/** Een teller "X van Y" waarbij Y het aantal kandidaten is waarvoor het gegeven bekend is. */
export interface FieldCount {
  /** Aantal kandidaten dat aan het criterium voldoet. */
  count: number;
  /** Aantal kandidaten waarvoor het criterium beoordeelbaar is (de noemer). */
  known: number;
}

export interface ApplicantFieldSummary {
  /** Totaal aantal (actieve) kandidaten in het samengevatte veld. */
  total: number;
  /** Matchverdeling, of null als geen enkele kandidaat een score heeft. */
  match: MatchSpread | null;
  /** Volledig compliant (COMPLIANT) t.o.v. de kandidaten met een compliance-oordeel; null als geen. */
  compliant: FieldCount | null;
  /** Beschikbaar op de startdatum t.o.v. de kandidaten met een start-oordeel; null als geen. */
  availableOnStart: FieldCount | null;
}

/** Mediaan van een niet-lege lijst getallen (kopieert + sorteert; muteert de invoer niet). */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  // De fallbacks (`?? 0` / `?? upper`) zijn onbereikbaar voor een niet-lege lijst; ze zijn er
  // enkel om de strikte index-toegang (noUncheckedIndexedAccess) tevreden te stellen zonder `!`.
  const upper = sorted[mid] ?? 0;
  if (sorted.length % 2 !== 0) return upper;
  const lower = sorted[mid - 1] ?? upper;
  return (lower + upper) / 2;
}

/**
 * Vat het reactieveld samen. Geeft `null` bij minder dan twee kandidaten — met één reactie valt er
 * niets over een "veld" te zeggen (en de vergelijk-pagina toont dan sowieso een lege staat).
 *
 * Elke deelmaat heeft zijn eigen noemer: een kandidaat zonder matchscore telt niet mee in de
 * spreiding, een kandidaat zonder compliance-oordeel niet in de compliant-teller, enz. Zo is
 * "3 van 5 volledig compliant" altijd eerlijk (5 = kandidaten met een oordeel, niet het totaal).
 */
export function summarizeApplicantField(
  candidates: readonly FieldCandidate[],
): ApplicantFieldSummary | null {
  if (candidates.length < 2) return null;

  const scores = candidates.map((c) => c.matchScore).filter((s): s is number => s != null);

  const complianceKnown = candidates.filter((c) => c.complianceStatus != null);
  const startKnown = candidates.filter((c) => c.startFit != null && c.startFit !== "unknown");

  return {
    total: candidates.length,
    match:
      scores.length > 0
        ? {
            median: Math.round(median(scores)),
            min: Math.min(...scores),
            max: Math.max(...scores),
            count: scores.length,
          }
        : null,
    compliant:
      complianceKnown.length > 0
        ? {
            count: complianceKnown.filter((c) => c.complianceStatus === "COMPLIANT").length,
            known: complianceKnown.length,
          }
        : null,
    availableOnStart:
      startKnown.length > 0
        ? {
            count: startKnown.filter((c) => c.startFit === "available").length,
            known: startKnown.length,
          }
        : null,
  };
}
