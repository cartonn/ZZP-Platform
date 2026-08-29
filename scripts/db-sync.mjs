// Pure, testbare helpers voor de schema-synchronisatie bij de productiestart (scripts/start.mjs).
//
// Waarom apart: start.mjs is plain-JS die node rechtstreeks draait (geen bundling) en kan dus niet
// uit `@/lib` importeren. Deze .mjs-helpers zijn wél door vitest importeerbaar, zodat de retry-/
// classificatie-logica van de boot-schema-sync gedekt is met unit-tests i.p.v. ongetest in de
// boot-flow te leven — hetzelfde patroon als shutdown-config.mjs.
//
// PROBLEEM dat dit oplost: `prisma db push --skip-generate` draait bij ELKE (her)start. Een
// transiënte Postgres-onbereikbaarheid tijdens een Railway-redeploy of een DB-failover (de database
// is nog aan het opstarten, een connection-reset, een korte netwerk-partitie) liet de héle deploy
// spuriously falen — terwijl elke andere uitgaande call in deze codebase juist bounded retry+backoff
// heeft (fetch-timeout.ts, http-verify.ts). Deze helper geeft de boot-schema-sync dezelfde
// veerkracht.
//
// KRITISCH — de retry mag NOOIT een echt probleem maskeren: we proberen UITSLUITEND opnieuw bij een
// herkende TRANSIËNTE connectiefout. Een destructieve-schemawijziging-weigering (het bewuste
// ontbreken van `--accept-data-loss` in start.mjs, dat productiedata beschermt) of élke andere/
// onbekende fout faalt METEEN — anders zou de retry een schema- of dataverlies-probleem verbergen
// achter een paar minuten wachten.
import { spawnSync } from "node:child_process";
import { clampMs } from "./shutdown-config.mjs";

/** Het commando dat het schema idempotent op de database zet (bewust ZONDER --accept-data-loss). */
export const SCHEMA_SYNC_COMMAND = "npx prisma db push --skip-generate";

/**
 * Signalen in de Prisma-/driver-uitvoer die op een TRANSIËNTE connectiefout wijzen — de database is
 * (nog) niet bereikbaar, maar dat kan zich binnen seconden herstellen. Alleen hierop retryen.
 *  - P1001: Can't reach database server
 *  - P1002: database server was reached but timed out
 *  - P1008: Operations timed out
 *  - P1017: Server has closed the connection
 * Plus de rauwe socket-/DNS-fouten die onder die codes kunnen liggen.
 */
const TRANSIENT_SIGNALS = [
  "p1001",
  "p1002",
  "p1008",
  "p1017",
  "can't reach database server",
  "the database server",
  "econnrefused",
  "econnreset",
  "etimedout",
  "eai_again",
  "connection refused",
  "connection reset",
  "connection terminated",
  "timed out",
];

/**
 * Signalen die een FATALE, niet-transiënte fout markeren: hierop NOOIT retryen, ook niet als er
 * toevallig een transiënt-ogend woord in dezelfde uitvoer staat. De destructieve-wijziging-weigering
 * is het belangrijkste geval — die hoort de boot zichtbaar te laten falen (data-bescherming), niet
 * weg te wachten.
 */
const FATAL_SIGNALS = [
  "data loss",
  "accept-data-loss",
  "cannot be executed",
  "p1000", // authentication failed — retryen helpt niet
  "p1003", // database does not exist
  "p3006",
  "p3018",
];

/**
 * Classificeer een mislukte schema-sync op basis van de gecombineerde stdout+stderr.
 * FATALE signalen winnen altijd van transiënte (defensief: een data-loss-weigering mag nooit als
 * "transiënt" worden gelezen). Onbekende fouten → "fatal" (fail-fast; nooit een echt probleem achter
 * retries verbergen).
 * @param {string} output
 * @returns {"transient" | "fatal"}
 */
export function classifySchemaSyncFailure(output) {
  const haystack = (output ?? "").toLowerCase();
  if (FATAL_SIGNALS.some((s) => haystack.includes(s))) return "fatal";
  if (TRANSIENT_SIGNALS.some((s) => haystack.includes(s))) return "transient";
  return "fatal";
}

/**
 * Resolve de retry-parameters uit env, veilig geklemd zodat een verkeerd geplakte waarde de boot
 * nooit oneindig laat retryen of de backoff tot nul terugbrengt.
 *  - DB_SYNC_MAX_RETRIES  (default 5,     geklemd [0, 10])
 *  - DB_SYNC_RETRY_BASE_MS(default 1000,  geklemd [100, 30000])
 *  - DB_SYNC_RETRY_MAX_MS (default 16000, geklemd [base, 120000])
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ maxRetries: number, baseDelayMs: number, maxDelayMs: number }}
 */
export function resolveDbSyncRetry(env = process.env) {
  const maxRetries = clampMs(env.DB_SYNC_MAX_RETRIES, 5, 0, 10);
  const baseDelayMs = clampMs(env.DB_SYNC_RETRY_BASE_MS, 1000, 100, 30000);
  const maxDelayMs = clampMs(env.DB_SYNC_RETRY_MAX_MS, 16000, baseDelayMs, 120000);
  return { maxRetries, baseDelayMs, maxDelayMs };
}

/**
 * De backoff-vertraging (ms) vóór poging `attempt` (1-gebaseerd: attempt 1 is de eerste retry),
 * exponentieel vanaf base en geklemd op max.
 * @param {number} attempt
 * @param {number} baseDelayMs
 * @param {number} maxDelayMs
 * @returns {number}
 */
export function backoffDelayMs(attempt, baseDelayMs, maxDelayMs) {
  return Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
}

/** Default command-runner: draait het commando, streamt de uitvoer, en vangt 'm op voor classificatie. */
function defaultRunCapture(command) {
  const result = spawnSync(command, { shell: true, encoding: "utf8" });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  // spawnSync met een signaal (bv. killed) of een spawn-fout → geen exitcode; behandel als mislukt.
  const code = result.status ?? 1;
  return { code, output: `${stdout}${stderr}${result.error ? `\n${result.error.message}` : ""}` };
}

/**
 * Zet het schema op de database met begrensde retry op transiënte connectiefouten.
 * Faalt METEEN (gooit) bij een fatale/onbekende fout of zodra de retries uitgeput zijn. Bij succes
 * (exitcode 0) keert de functie stil terug.
 *
 * @param {object} [deps]
 * @param {(command: string) => { code: number, output: string }} [deps.runCapture]
 * @param {(ms: number) => Promise<void>} [deps.sleep]
 * @param {Record<string, string | undefined>} [deps.env]
 * @param {{ log?: Function, warn?: Function, error?: Function }} [deps.log]
 * @param {string} [deps.command]
 * @returns {Promise<void>}
 */
export async function syncSchema({
  runCapture = defaultRunCapture,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  env = process.env,
  log = console,
  command = SCHEMA_SYNC_COMMAND,
} = {}) {
  const { maxRetries, baseDelayMs, maxDelayMs } = resolveDbSyncRetry(env);
  const warn = (msg) => (log.warn ?? log.error ?? (() => {}))(msg);

  for (let attempt = 0; ; attempt += 1) {
    const { code, output } = runCapture(command);
    if (code === 0) return;

    const kind = classifySchemaSyncFailure(output);
    if (kind === "fatal") {
      throw new Error(
        "[db] schema-sync faalde met een niet-transiënte fout (geen retry). Controleer de uitvoer " +
          "hierboven — een destructieve schemawijziging faalt bewust zonder --accept-data-loss om " +
          "productiedata te beschermen.",
      );
    }

    if (attempt >= maxRetries) {
      throw new Error(
        `[db] schema-sync bleef transiënt falen na ${maxRetries} retries — database niet tijdig ` +
          "bereikbaar. Boot afgebroken.",
      );
    }

    const delay = backoffDelayMs(attempt + 1, baseDelayMs, maxDelayMs);
    warn(
      `[db] schema-sync: database (nog) niet bereikbaar (transiënt) — poging ${attempt + 1}/${maxRetries} ` +
        `over ${delay}ms opnieuw`,
    );
    await sleep(delay);
  }
}
