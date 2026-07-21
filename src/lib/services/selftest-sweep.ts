// Go-live zelftest-sweep: draait alle *actieve, bijwerkingsveilige* connectiviteitszelftests in één
// keer en vat ze samen tot één GO/NO-GO-oordeel (admin-only, /admin/systeemstatus).
//
// Waarom: er zijn losse zelftests per integratie (opslag, database, rate-limit, verificatie,
// betaalprovider, upload-scanner, error-monitoring). Vóór go-live wil een beheerder in één klik
// bevestigen dat élke geconfigureerde integratie écht live-bereikbaar is, i.p.v. 7 knoppen te moeten
// klikken en het resultaat mentaal op te tellen. Dit is de live-tegenhanger van de statische
// `preflight`-CLI (die alleen de config-posture leest, geen echte round-trip doet).
//
// Deze module is PUUR en injecteerbaar: een lijst genormaliseerde runners in, één rapport uit. Geen
// I/O-globals, geen klok — deterministisch te testen. De aanroeper (server-actie) levert per
// integratie een `run()` die de bestaande zelftest-kern draait en het resultaat terugbrengt tot
// pass/fail/skipped + een korte, PII-/secret-vrije toelichting.
//
// Mail zit BEWUST niet in de sweep: die vereist een ontvangeradres en verstuurt een echte e-mail naar
// een persoon — dat hoort een bewuste, losse handeling te blijven (geen bulk-bijwerking).

/**
 * Uitkomst per integratie:
 * - `pass`    — actief én de round-trip slaagde.
 * - `fail`    — actief maar de round-trip faalde (blokkeert GO).
 * - `skipped` — draait op een veilige fallback/demo (niet geconfigureerd) — niets getest, geen vals groen.
 */
export type SweepEntryStatus = "pass" | "fail" | "skipped";

/** Eén integratie in de sweep. */
export interface SweepEntry {
  /** Stabiele sleutel (voor keys/tests/UI), bv. "storage", "db". */
  key: string;
  /** Nederlandse omschrijving van de integratie. */
  label: string;
  status: SweepEntryStatus;
  /** Actieve modus/driver (bv. "s3", "postgresql", "noop"). Geen sleutelwaarden. */
  mode: string;
  /** Korte, niet-gevoelige toelichting (error-naam of uitleg). */
  detail?: string;
}

/** Genormaliseerde uitkomst die een runner teruggeeft (zonder key/label — die staan op de runner). */
export interface SweepRunResult {
  status: SweepEntryStatus;
  mode: string;
  detail?: string;
}

/** Eén te draaien zelftest. `run()` mag nooit secrets teruggeven; werpt hij toch, dan wordt dat gevangen. */
export interface SweepRunner {
  key: string;
  label: string;
  run: () => Promise<SweepRunResult>;
}

/** GO wanneer geen enkele actieve zelftest faalde; NO-GO zodra er één faalt. */
export type SweepVerdict = "go" | "no-go";

export interface SweepReport {
  entries: SweepEntry[];
  counts: Record<SweepEntryStatus, number>;
  /** Aantal integraties dat daadwerkelijk een round-trip deed (pass + fail). */
  testedCount: number;
  /**
   * `no-go` zodra één actieve zelftest faalde. Anders `go` — ook als alles op een fallback draait
   * (dan is er niets getest; de UI toont testedCount zodat "go" niet als vals groen leest).
   */
  verdict: SweepVerdict;
}

/** Brengt een onbekende fout terug tot een korte, PII-/secret-vrije omschrijving (alleen de naam). */
export function safeSweepDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Vat een lijst genormaliseerde entries samen: telt per status en bepaalt het GO/NO-GO-oordeel.
 * Puur — geen I/O. De volgorde van `entries` blijft behouden.
 */
export function summarizeSweep(entries: SweepEntry[]): SweepReport {
  const counts: Record<SweepEntryStatus, number> = { pass: 0, fail: 0, skipped: 0 };
  for (const entry of entries) counts[entry.status] += 1;

  return {
    entries,
    counts,
    testedCount: counts.pass + counts.fail,
    // Eén gefaalde actieve zelftest volstaat voor NO-GO; overgeslagen (fallback) telt niet als fout.
    verdict: counts.fail > 0 ? "no-go" : "go",
  };
}

/**
 * Draait alle runners (parallel) en vat ze samen. Elke runner heeft een eigen vangnet: een throw of
 * een afwijzing wordt een `fail`-entry met een veilige detail — één kapotte integratie zet nooit de
 * hele sweep om. De volgorde van de runners blijft in het rapport behouden.
 */
export async function runSelfTestSweep(runners: SweepRunner[]): Promise<SweepReport> {
  const entries = await Promise.all(
    runners.map(async (runner): Promise<SweepEntry> => {
      try {
        const result = await runner.run();
        return {
          key: runner.key,
          label: runner.label,
          status: result.status,
          mode: result.mode,
          detail: result.detail,
        };
      } catch (error) {
        return {
          key: runner.key,
          label: runner.label,
          status: "fail",
          mode: "onbekend",
          detail: safeSweepDetail(error),
        };
      }
    }),
  );

  return summarizeSweep(entries);
}
