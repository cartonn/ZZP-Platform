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

/**
 * Standaard-deadline per runner. Elke zelftest doet een externe round-trip; de meeste helpers hebben
 * een eigen HTTP-time-out, maar niet allemaal (de DB-`SELECT 1` via Prisma heeft géén query-time-out).
 * Zonder deze bovengrens zou één hangende integratie (bv. een verkeerd geconfigureerde Postgres die de
 * TCP-verbinding accepteert maar nooit antwoordt) de héle admin-sweep — en dus het go-live GO/NO-GO-
 * oordeel — oneindig laten blokkeren. 15 s is ruim boven een gezonde round-trip en ver onder een
 * proxy-/browser-time-out.
 */
export const DEFAULT_SWEEP_RUNNER_TIMEOUT_MS = 15_000;

/** Opties voor {@link runSelfTestSweep}. */
export interface SweepOptions {
  /**
   * Wall-clock-deadline per runner in ms. Een runner die niet binnen de deadline settelt wordt een
   * `fail` (→ NO-GO — de juiste go-live-posture: een zelftest die niet op tijd afrondt is géén GO).
   * Default {@link DEFAULT_SWEEP_RUNNER_TIMEOUT_MS}. Een waarde ≤ 0 schakelt de bovengrens uit.
   */
  timeoutMs?: number;
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

/** Sentinel: uniek object zodat een time-out nooit met een legitiem runner-resultaat botst. */
const TIMED_OUT = Symbol("sweep-runner-timeout");

/**
 * Draait één runner met een wall-clock-deadline. Settelt de runner (resolve óf reject) binnen de
 * deadline, dan wordt zijn uitkomst normaal verwerkt; anders wordt hij een veilige `fail`-entry met
 * `detail: "Time-out"`. De timer wordt altijd opgeruimd en de afgebroken runner-promise krijgt een
 * no-op-`catch` zodat een latere afwijzing geen unhandled rejection wordt.
 */
async function runOne(runner: SweepRunner, timeoutMs: number): Promise<SweepEntry> {
  const base = { key: runner.key, label: runner.label };

  // Nooit-afwijzende wrapper: vangt zowel resolve als reject, zodat een verlaten runner (na time-out)
  // geen unhandled rejection oplevert.
  const settled = runner.run().then(
    (result) => ({ ok: true as const, result }),
    (error) => ({ ok: false as const, error }),
  );

  if (!(timeoutMs > 0)) {
    const outcome = await settled;
    return outcome.ok
      ? {
          ...base,
          status: outcome.result.status,
          mode: outcome.result.mode,
          detail: outcome.result.detail,
        }
      : { ...base, status: "fail", mode: "onbekend", detail: safeSweepDetail(outcome.error) };
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
  });

  try {
    const outcome = await Promise.race([settled, deadline]);
    if (outcome === TIMED_OUT) {
      return { ...base, status: "fail", mode: "onbekend", detail: "Time-out" };
    }
    return outcome.ok
      ? {
          ...base,
          status: outcome.result.status,
          mode: outcome.result.mode,
          detail: outcome.result.detail,
        }
      : { ...base, status: "fail", mode: "onbekend", detail: safeSweepDetail(outcome.error) };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Draait alle runners (parallel) en vat ze samen. Elke runner heeft een eigen vangnet: een throw, een
 * afwijzing of het overschrijden van de per-runner-deadline wordt een `fail`-entry met een veilige
 * detail — één kapotte of hangende integratie zet nooit de hele sweep om en blokkeert de request niet
 * oneindig. De volgorde van de runners blijft in het rapport behouden.
 */
export async function runSelfTestSweep(
  runners: SweepRunner[],
  options: SweepOptions = {},
): Promise<SweepReport> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_SWEEP_RUNNER_TIMEOUT_MS;
  const entries = await Promise.all(runners.map((runner) => runOne(runner, timeoutMs)));
  return summarizeSweep(entries);
}
