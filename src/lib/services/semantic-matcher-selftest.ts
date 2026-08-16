// Connectiviteits-/operationele zelftest voor de semantische-matching-driver (admin-only,
// /admin/systeemstatus).
//
// De systeemstatus toont de MODUS van de matcher (`local`/`pgvector`), maar bewijst niet dat een
// geselecteerde pgvector-driver écht operationeel is. Dat onderscheid is hier kritisch: selecteert een
// operator `SEMANTIC_MATCHER=pgvector` terwijl de DB-provisioning (extensie/embedding-kolom/index +
// embedding-pijplijn) nog ontbreekt, dan valt matching STIL terug op de lokale matcher — de relatedness-
// component draait dan niet op de bedoelde productie-driver zonder dat iets dat toont. Dat is dezelfde
// stille faalmodus die de rate-limit-/upload-scanner-/gelekt-wachtwoord-zelftests ook afvangen.
//
// Deze module is de tegenhanger van de opslag-/mail-/rate-limit-/verificatie-/betaal-/upload-scanner-/
// routing-/gelekt-wachtwoord-zelftests: puur en injecteerbaar (een spec in, een rapport uit; geen
// I/O-globals, geen klok) zodat het deterministisch te testen is. De aanroeper (server-actie) levert een
// `run()` die de geconfigureerde pgvector-driver zijn read-only `probe()` laat doen.
//
// Kernonderscheid: draait matching op de lokale matcher (`local`), dan is er niets externs om te testen
// en meldt de zelftest dat eerlijk (geen vals groen — de lokale matcher werkt altijd). Is pgvector
// geselecteerd maar NIET operationeel, dan is dat een fout (aandacht): voltooi de provisioning of zet
// SEMANTIC_MATCHER=local. Is pgvector operationeel maar levert de round-trip een onplausibele uitkomst
// (zelf-gelijkenis niet ~1, of geen discriminatie t.o.v. een ongerelateerd paar), dan telt dat als fout
// (gewijzigd/kapot contract) — net als de EICAR-/HIBP-detectiecheck bij de scanner/wachtwoord-controle.
//
// Geen secrets/PII in de uitvoer: alleen korte, niet-gevoelige toelichtingen + de driver-modus. De
// probe-teksten zijn vaste, generieke vaktermen — geen gebruikersgegeven.

import type { SemanticMatcherProbeResult } from "@/lib/services/semantic-matcher";

/** Actieve matcher-modus. Alleen `pgvector` doet een echte operationele probe; `local` = niets te testen. */
export type SemanticMatcherDriverMode = "local" | "pgvector";

/** Te testen matcher. `run` (de operationele probe) wordt alleen aangeroepen wanneer `active`. */
export interface SemanticMatcherProbeSpec {
  /** Staat een echte productie-driver aan (SEMANTIC_MATCHER=pgvector)? */
  active: boolean;
  /** Actieve modus (bv. "pgvector", "local"). Geen sleutelwaarden. */
  driverMode: SemanticMatcherDriverMode;
  /**
   * Read-only operationele probe tegen de geconfigureerde driver (via `PgVectorSemanticMatcher.probe`).
   * Alleen vereist/aangeroepen wanneer `active`.
   */
  run?: () => Promise<SemanticMatcherProbeResult>;
}

/** Uitkomst van de zelftest. */
export interface SemanticMatcherSelfTestReport {
  ok: boolean;
  /** Draait er een echte productie-driver? Zo niet: er is niets getest (geen vals groen). */
  active: boolean;
  /** Actieve matcher-modus. Geen sleutelwaarden. */
  driverMode: SemanticMatcherDriverMode;
  /** Korte, niet-gevoelige toelichting (uitkomst of fallback-uitleg). */
  detail?: string;
}

const INACTIVE_DETAIL =
  "Lokale in-memory matcher actief — deterministisch, werkt altijd; er is niets externs te testen.";
const NOT_OPERATIONAL_DETAIL =
  "pgvector geselecteerd maar niet operationeel — de DB-provisioning (extensie/embedding-kolom/index) staat nog open. Matching draait op de lokale fallback (geen stille nul-degradatie). Voltooi de provisioning of zet SEMANTIC_MATCHER=local.";
const OK_DETAIL =
  "Operationeel — pgvector antwoordde op een read-only gelijkenis-round-trip met een plausibele uitkomst.";
const BAD_CONTRACT_DETAIL =
  "pgvector is operationeel maar de gelijkenis-uitkomst klopt niet (zelf-gelijkenis niet ~1 of geen discriminatie t.o.v. een ongerelateerd paar) — controleer de embedding-pijplijn/het antwoord-contract.";

/**
 * Brengt een fout terug tot een korte, PII-/secret-vrije toelichting: uitsluitend de error-NAAM, nooit
 * een rauw bericht dat een host/endpoint/query zou kunnen bevatten.
 */
export function safeSemanticMatcherDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/** Bepaalt of een operationele probe-uitkomst een plausibel gelijkenis-contract laat zien. */
export function isPlausibleProbe(result: SemanticMatcherProbeResult): boolean {
  const self = result.selfScore;
  const cross = result.crossScore;
  if (typeof self !== "number" || typeof cross !== "number") return false;
  if (self < 0 || self > 1 || cross < 0 || cross > 1) return false;
  // Zelf-gelijkenis hoort ~1 te zijn en het ongerelateerde paar strikt lager (discriminatie).
  return self >= 0.9 && cross < self;
}

/**
 * Voert de zelftest uit. Draait matching op de lokale matcher (`local`, inactief), dan wordt dat eerlijk
 * als "niets getest" gerapporteerd (ok, met uitleg). Een actieve pgvector-driver draait zijn `run()` in
 * try/catch:
 * - `operational: false` → fout: geselecteerd maar niet operationeel (matching draait op de fallback).
 * - operationeel + plausibele round-trip → succes.
 * - operationeel + onplausibele round-trip → fout: gewijzigd/kapot contract.
 * Een actieve driver zonder `run` is een programmeerfout van de aanroeper en telt als fout.
 */
export async function runSemanticMatcherSelfTest(
  spec: SemanticMatcherProbeSpec,
): Promise<SemanticMatcherSelfTestReport> {
  const base = { active: spec.active, driverMode: spec.driverMode };

  if (!spec.active) {
    return { ...base, ok: true, detail: INACTIVE_DETAIL };
  }

  if (!spec.run) {
    return { ...base, ok: false, detail: "Geen probe beschikbaar voor deze driver." };
  }

  try {
    const result = await spec.run();
    if (!result.operational) {
      return { ...base, ok: false, detail: NOT_OPERATIONAL_DETAIL };
    }
    if (isPlausibleProbe(result)) {
      return { ...base, ok: true, detail: OK_DETAIL };
    }
    return { ...base, ok: false, detail: BAD_CONTRACT_DETAIL };
  } catch (error) {
    return { ...base, ok: false, detail: safeSemanticMatcherDetail(error) };
  }
}
