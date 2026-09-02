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
 * Specifiek: is deze mislukking Prisma's data-loss-weigering (i.p.v. een andere fatale fout zoals
 * een authenticatiefout of een niet-uitvoerbare migratie)? Gebruikt door de EENMALIGE
 * transitie-stap (syncTransitionSchema hieronder) om `--accept-data-loss` uitsluitend voor dít
 * geval toe te staan — nooit als generieke bypass voor elke fatale fout.
 * @param {string | undefined} output
 * @returns {boolean}
 */
export function isDataLossFailure(output) {
  const haystack = (output ?? "").toLowerCase();
  return haystack.includes("data loss") || haystack.includes("accept-data-loss");
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

/** Standaard sleep-implementatie (echte timer); tests injecteren een eigen `sleep`. */
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  sleep = defaultSleep,
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
      // rawOutput blijft beschikbaar voor callers die zelf willen beslissen (zie
      // syncTransitionSchema hieronder) — de generieke boodschap/gedrag voor bestaande callers
      // verandert niet.
      const err = new Error(
        "[db] schema-sync faalde met een niet-transiënte fout (geen retry). Controleer de uitvoer " +
          "hierboven — een destructieve schemawijziging faalt bewust zonder --accept-data-loss om " +
          "productiedata te beschermen.",
      );
      err.rawOutput = output;
      throw err;
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

/** Het commando voor de eenmalige transitie-herpoging: dezelfde push, MET --accept-data-loss. */
export const TRANSITION_ACCEPT_DATA_LOSS_COMMAND = `${SCHEMA_SYNC_COMMAND} --accept-data-loss`;

/**
 * Wrapper rond `syncSchema`, UITSLUITEND voor de eenmalige DB-transitie-stap (zie
 * scripts/db-bootstrap-plan.mjs — "postgres, User-tabel aanwezig, geen _prisma_migrations"). Draait
 * eerst de normale, veilige push (identiek aan syncSchema). Weigert Prisma die specifiek omdat hij
 * het (mogelijk onterecht) als dataverlies classificeert — bv. een NIEUWE unique constraint op een
 * kolom zonder bestaande duplicaten, zoals `kvkNumber` op `Tenant` — dan gebeurt er ALLEEN iets
 * anders wanneer de operator dat expliciet heeft aangezet via `DB_TRANSITION_ACCEPT_DATA_LOSS=true`
 * (env.ts documenteert de vlag + waarschuwt zolang hij aanstaat):
 *   1. de volledige Prisma-waarschuwing wordt eerst LUID gelogd (zodat die niet onopgemerkt in een
 *      retry verdwijnt);
 *   2. dezelfde push draait opnieuw, nu MET --accept-data-loss.
 * Elke ANDERE fatale fout (auth, niet-uitvoerbare migratie, ...) — of de vlag staat uit — gedraagt
 * zich exact als syncSchema: gooit meteen, geen enkele retry met --accept-data-loss. De vlag is dus
 * nooit een generieke bypass voor "elke fatale fout", alleen voor déze specifieke, herkende
 * classificatie, en alleen in déze ene stap (nooit bij een gewone boot — zie db-bootstrap-plan.mjs).
 *
 * @param {object} [deps]
 * @param {(command: string) => { code: number, output: string }} [deps.runCapture]
 * @param {(ms: number) => Promise<void>} [deps.sleep]
 * @param {Record<string, string | undefined>} [deps.env]
 * @param {{ log?: Function, warn?: Function, error?: Function }} [deps.log]
 * @param {string} [deps.command]
 * @param {string} [deps.acceptDataLossCommand]
 * @returns {Promise<void>}
 */
export async function syncTransitionSchema({
  runCapture = defaultRunCapture,
  sleep = defaultSleep,
  env = process.env,
  log = console,
  command = SCHEMA_SYNC_COMMAND,
  acceptDataLossCommand = TRANSITION_ACCEPT_DATA_LOSS_COMMAND,
} = {}) {
  const warn = (msg) => (log.warn ?? log.error ?? (() => {}))(msg);

  try {
    await syncSchema({ runCapture, sleep, env, log, command });
    return; // Geen drift die als dataverlies werd gezien — niets bijzonders nodig.
  } catch (err) {
    const rawOutput = err && typeof err === "object" ? err.rawOutput : undefined;
    const acceptFlag = env.DB_TRANSITION_ACCEPT_DATA_LOSS === "true";
    if (!isDataLossFailure(rawOutput) || !acceptFlag) {
      // Niet ons geval (andere fatale fout / transiënte-retries al uitgeput), of de operator heeft
      // niet expliciet geaccepteerd — laat exact hetzelfde falen als syncSchema.
      throw err;
    }

    warn(
      "[db] transitie: db push weigerde vanwege mogelijk dataverlies. " +
        "DB_TRANSITION_ACCEPT_DATA_LOSS=true staat aan — de push draait opnieuw MET " +
        "--accept-data-loss. Waarschuwingen die hiermee worden geaccepteerd:\n" +
        `${rawOutput}`,
    );
    await syncSchema({ runCapture, sleep, env, log, command: acceptDataLossCommand });
  }
}
