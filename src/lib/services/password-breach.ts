// Gelekt-wachtwoord-controle (NIST 800-63B §5.1.1.2 / OWASP ASVS 2.1.7): weiger wachtwoorden die
// voorkomen in bekende datalekken. Voor een platform met gevoelige documenten (VOG, diploma's, ID)
// is credential stuffing met hergebruikte, gelekte wachtwoorden een van de grootste accountrisico's.
//
// PATROON (gelijk aan de opslag-/mail-/rate-limit-/scanner-seams): een pluggbare abstractie achter
// een env-vlag, standaard INERT (`noop`, huidig gedrag — de pilot verandert niet). Zet je
// `PASSWORD_BREACH_CHECK=hibp`, dan controleert de HIBP-adapter elk gekozen wachtwoord tegen de
// Have I Been Pwned "Pwned Passwords"-lijst — **sleutelloos** (gratis publieke API, geen account) en
// **k-anoniem**: alleen de eerste 5 tekens van de SHA-1-hash verlaten de server, nooit het wachtwoord
// zelf of de volledige hash (AVG-dataminimalisatie; een SHA-1-prefix is geen persoonsgegeven).
//
// FAIL-OPEN: kan de controle niet draaien (kanaal uit, netwerkfout, time-out, onverwacht antwoord),
// dan laat de caller het wachtwoord TOE (`skipped: true`). Een HIBP-storing mag registratie/
// wachtwoordwijziging nooit platleggen — beschikbaarheid boven een best-effort extra check.
//
// PUUR & INJECTEERBAAR: de HIBP-adapter neemt een `fetchImpl` zodat tests zonder netwerk draaien.

import { webcrypto } from "crypto";

import {
  fetchWithTimeout,
  resolveHttpTimeoutMs,
  DEFAULT_HTTP_TIMEOUT_MS,
} from "@/lib/services/fetch-timeout";

/** Uitkomst van een gelekt-wachtwoord-controle. */
export interface PasswordBreachResult {
  /** true = het wachtwoord komt voor in een bekende datalek-lijst → de caller weigert het. */
  breached: boolean;
  /**
   * true = de controle kon NIET worden uitgevoerd (kanaal `noop`, netwerkfout, time-out, ongeldig
   * antwoord). Fail-open: de caller laat het wachtwoord dan toe. `breached` is dan altijd `false`.
   */
  skipped: boolean;
  /** Aantal keer dat het wachtwoord in lekken voorkwam (0 als onbekend/skipped/niet gelekt). */
  count: number;
}

/** Foutmelding richting de gebruiker bij een gelekt wachtwoord (UI-taal = Nederlands). */
export const BREACHED_PASSWORD_MESSAGE =
  "Dit wachtwoord staat in een bekend datalek en is daardoor onveilig. Kies een ander, uniek wachtwoord.";

/** Pluggbare gelekt-wachtwoord-controle. */
export interface PasswordBreachChecker {
  /** Actieve modus/driver (bv. "noop", "hibp") — nooit een sleutelwaarde. */
  readonly mode: string;
  /** Controleert één wachtwoord. Werpt nooit: een fout wordt `skipped` (fail-open). */
  check(password: string): Promise<PasswordBreachResult>;
}

/** Fail-open resultaat: niets getest, wachtwoord toegestaan. */
const SKIPPED: PasswordBreachResult = { breached: false, skipped: true, count: 0 };

/** Default: geen controle (huidig gedrag). Elk wachtwoord passeert. */
export class NoopPasswordBreachChecker implements PasswordBreachChecker {
  readonly mode = "noop";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async check(_password: string): Promise<PasswordBreachResult> {
    return SKIPPED;
  }
}

/**
 * SHA-1 van een string als hoofdletter-hex, via de Web Crypto `subtle.digest`-primitief. LET OP:
 * SHA-1 is hier VERPLICHT door het HIBP "Pwned Passwords"-protocol — de k-anonimiteit werkt per
 * definitie over SHA-1-prefixen. Dit is GEEN wachtwoord-opslag: opslag gaat altijd via **bcrypt**
 * (register/reset/wijzig). Deze hash verlaat de server ook nooit heel — alleen de eerste 5 tekens
 * (de range-prefix) gaan k-anoniem naar HIBP.
 */
export async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await webcrypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// HARDENING (2026-09-08): de HIBP-lookup gebruikte al `fetchWithTimeout` (deadline) maar was — als
// ENIGE read-only-GET uitgaande productie-integratie — zónder retry, terwijl de siblings
// `http-verify.ts` (DUO/BIG/iDIN) en `routing.ts` (Geoapify) een begrensde retry-met-backoff hebben.
// Omdat de controle FAIL-OPEN is, liet één transiënte 5xx/429/netwerk-blip de lek-check stil overslaan
// (een mogelijk gelekt wachtwoord toegelaten op de registratie-/wachtwoordwijzig-hot-path) én trip het
// de aflever-heartbeat (valse page). De lookup is een idempotente read-only GET (geen zij-effect bij
// HIBP), dus een begrensde retry-met-exponentiële-backoff is veilig. Alleen transiënte fouten (netwerk,
// time-out, 5xx, 429) worden herhaald; een niet-transiënte fout (4xx — bv. een ongeldige prefix) faalt
// meteen. Spiegelt `routing.ts`/`http-verify.ts`.

/** Retry-grenzen (spiegelt routing.ts/http-verify.ts): veilig maximum zodat een storing niet lang blijft hangen. */
export const DEFAULT_PASSWORD_BREACH_RETRIES = 2;
export const MAX_PASSWORD_BREACH_RETRIES = 5;
/** Basis voor de exponentiële backoff (attempt 0 → base, 1 → 2×base, …), begrensd door MAX_DELAY. */
export const PASSWORD_BREACH_RETRY_BASE_DELAY_MS = 250;
export const PASSWORD_BREACH_RETRY_MAX_DELAY_MS = 4_000;

/** Leest het aantal retries uit een env-waarde en klemt op [0, MAX_PASSWORD_BREACH_RETRIES]. */
export function resolvePasswordBreachRetries(
  raw: string | undefined,
  fallback: number = DEFAULT_PASSWORD_BREACH_RETRIES,
): number {
  const clamp = (n: number) => Math.min(MAX_PASSWORD_BREACH_RETRIES, Math.max(0, n));
  const parsed = raw !== undefined ? Number(raw) : Number.NaN;
  // Eindige waarden worden geklemd (een negatief getal → 0); alleen onleesbare invoer valt terug.
  if (Number.isFinite(parsed)) return clamp(Math.floor(parsed));
  return clamp(Math.floor(fallback));
}

/** Deterministische exponentiële backoff-vertraging voor een gegeven (0-geïndexeerde) retry. */
export function passwordBreachRetryDelayMs(attempt: number): number {
  const delay = PASSWORD_BREACH_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempt);
  return Math.min(PASSWORD_BREACH_RETRY_MAX_DELAY_MS, delay);
}

/** Een HTTP-status die veilig te herhalen is: server-fouten (5xx) en rate-limiting (429). */
function isTransientHibpStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

/** Interne foutklasse van één HIBP-poging; draagt of herhalen zin heeft. */
class HibpFetchError extends Error {
  readonly transient: boolean;
  constructor(transient: boolean) {
    super("HIBP-lookup mislukt");
    this.name = "HibpFetchError";
    this.transient = transient;
  }
}

export interface HibpCheckerOptions {
  /** Injecteerbaar voor tests; default global fetch. */
  fetchImpl?: typeof fetch;
  /** Deadline in ms (geklemd in fetch-timeout). */
  timeoutMs?: number;
  /** Aantal retries bij transiënte fouten (geklemd [0, MAX_PASSWORD_BREACH_RETRIES]); default 2. */
  retries?: number;
  /** Injecteerbare sleep (tests draaien zonder echte vertraging); default setTimeout. */
  sleepImpl?: (ms: number) => Promise<void>;
  /** Basis-URL van de range-API (default de publieke HIBP-endpoint). */
  baseUrl?: string;
  /**
   * Aflever-heartbeat-hook (dead-man's-switch): wordt aangeroepen met de uitkomst van élke échte
   * controle — `true` als HIBP een geldig antwoord gaf (ongeacht breached/niet), `false` als de
   * controle fail-openende (netwerk/time-out/niet-ok/parsefout). Optioneel + injecteerbaar zodat de
   * checker PUUR/testbaar blijft: unit-tests laten 'm weg (geen DB), de fabriek
   * (`getPasswordBreachChecker`) wiret de echte heartbeat-registratie. Wordt nooit aangeroepen voor
   * een lege wachtwoord-invoer (geen operatie). Mag nooit werpen — de checker vangt 'm sowieso af.
   */
  onDelivery?: (ok: boolean) => void | Promise<void>;
}

/**
 * HIBP "Pwned Passwords" range-API met k-anonimiteit. Stuurt alleen de eerste 5 tekens van de
 * SHA-1-hash; de API antwoordt met alle suffixen (+ counts) onder dat prefix. We matchen het
 * resterende suffix lokaal — het wachtwoord en de volledige hash verlaten de server nooit.
 *
 * Fail-open: elke fout (netwerk/time-out/niet-ok/parsefout) → `skipped`.
 */
export class HibpPasswordBreachChecker implements PasswordBreachChecker {
  readonly mode = "hibp";
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly baseUrl: string;
  private readonly onDelivery?: (ok: boolean) => void | Promise<void>;

  constructor(options: HibpCheckerOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS;
    this.retries = resolvePasswordBreachRetries(
      options.retries !== undefined ? String(options.retries) : undefined,
    );
    this.sleep = options.sleepImpl ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    // Zonder trailing slash; we plakken zelf "/{prefix}".
    this.baseUrl = (options.baseUrl ?? "https://api.pwnedpasswords.com/range").replace(/\/+$/, "");
    this.onDelivery = options.onDelivery;
  }

  /** Meldt de aflever-heartbeat de uitkomst; slikt elke fout (observability mag de check nooit breken). */
  private async signalDelivery(ok: boolean): Promise<void> {
    if (!this.onDelivery) return;
    try {
      await this.onDelivery(ok);
    } catch {
      // Bewust genegeerd: de heartbeat is best-effort en mag de fail-open-controle niet beïnvloeden.
    }
  }

  /**
   * Eén poging: doet de GET met een harde deadline en valideert het HTTP-antwoord. Werpt een
   * `HibpFetchError` met `transient`-vlag zodat de retry-lus weet of herhalen zin heeft.
   * - fetch werpt (netwerk/DNS/time-out via `fetchWithTimeout`) → transiënt
   * - `!res.ok` → transiënt bij 5xx/429, anders niet-transiënt (bv. 4xx ongeldige prefix)
   * - 2xx → het aantal treffers voor het suffix (0 = niet gelekt; de controle draaide gezond)
   */
  private async attemptOnce(prefix: string, suffix: string): Promise<number> {
    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${this.baseUrl}/${prefix}`,
        {
          method: "GET",
          // Add-Padding verhult de werkelijke responsgrootte (timing/omvang-privacy). De padding-
          // regels dragen count 0 en worden hieronder genegeerd.
          headers: { "Add-Padding": "true", Accept: "text/plain" },
        },
        { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "HIBP" },
      );
    } catch {
      throw new HibpFetchError(true);
    }
    // Een niet-ok respons is een storing van het kanaal (bereikbaar maar afwijzend). 5xx/429 zijn
    // transiënt (retry zinvol); een 4xx is niet-transiënt (herhalen levert dezelfde afwijzing).
    if (!res.ok) {
      throw new HibpFetchError(isTransientHibpStatus(res.status));
    }
    const body = await res.text();
    return matchSuffixCount(body, suffix);
  }

  async check(password: string): Promise<PasswordBreachResult> {
    // Lege invoer is geen operatie tegen HIBP → geen aflever-signaal (geen vals succes/mislukking).
    if (!password) return SKIPPED;
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    // Retry-lus: alleen transiënte fouten (netwerk/time-out/5xx/429) worden herhaald met exponentiële
    // backoff. De aflever-heartbeat registreert alléén de einduitkomst — één succes, of één mislukking
    // nadat de retries zijn uitgeput — zodat een enkele blip die op de retry herstelt de mislukkingen-
    // teller niet onnodig oploopt (parity met routing.ts). Fail-open: bij een uitgeputte/niet-transiënte
    // fout laat de caller het wachtwoord alsnog toe.
    let attempt = 0;
    for (;;) {
      try {
        const count = await this.attemptOnce(prefix, suffix);
        // HIBP gaf een geldig antwoord — de controle draaide (ongeacht breached/niet) → succes.
        await this.signalDelivery(true);
        return { breached: count > 0, skipped: false, count };
      } catch (err) {
        const transient = err instanceof HibpFetchError && err.transient;
        if (transient && attempt < this.retries) {
          await this.sleep(passwordBreachRetryDelayMs(attempt));
          attempt += 1;
          continue;
        }
        // Netwerkfout/time-out/uitgeputte retries/niet-transiënt: fail-open. Een lek-check mag de flow
        // nooit blokkeren.
        await this.signalDelivery(false);
        return SKIPPED;
      }
    }
  }
}

/**
 * Zoekt in een HIBP-range-antwoord ("SUFFIX:COUNT" per regel) het aantal voor `suffix`. Padding-
 * regels (count 0) tellen niet als een treffer. Case-insensitief; robuust tegen CRLF/spaties.
 * Puur — geen I/O, direct testbaar.
 */
export function matchSuffixCount(body: string, suffix: string): number {
  const target = suffix.trim().toUpperCase();
  for (const line of body.split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const hashSuffix = line.slice(0, idx).trim().toUpperCase();
    if (hashSuffix !== target) continue;
    const count = Number.parseInt(line.slice(idx + 1).trim(), 10);
    return Number.isFinite(count) && count > 0 ? count : 0;
  }
  return 0;
}

/**
 * Bouwt een checker voor de gegeven modus. Onbekende modus → noop (veilig). PUUR: leest geen env —
 * de caller geeft opties (bv. `timeoutMs`) mee, zodat dit direct testbaar blijft.
 */
export function createPasswordBreachChecker(
  mode: string | undefined,
  options: HibpCheckerOptions = {},
): PasswordBreachChecker {
  if (mode === "hibp") {
    return new HibpPasswordBreachChecker(options);
  }
  return new NoopPasswordBreachChecker();
}

let cached: PasswordBreachChecker | null = null;

/**
 * Proces-brede checker, gekozen uit `PASSWORD_BREACH_CHECK`. Gecacht na de eerste aanroep. Leest
 * `process.env` direct (zelfde conventie als storage/mail/upload-scanner-factories).
 */
export function getPasswordBreachChecker(): PasswordBreachChecker {
  if (!cached) {
    cached = createPasswordBreachChecker(process.env.PASSWORD_BREACH_CHECK, {
      timeoutMs: resolveHttpTimeoutMs(process.env.PASSWORD_BREACH_HTTP_TIMEOUT_MS),
      retries: resolvePasswordBreachRetries(process.env.PASSWORD_BREACH_HTTP_RETRIES),
      // Aflever-heartbeat (dead-man's-switch) voor het échte HIBP-kanaal. Lazy import: houdt deze
      // service vrij van een harde observability/prisma-import op modulepad-niveau (voorkomt
      // import-cycles) en laat de noop-default volledig inert. Best-effort — de registratie is zelf
      // fail-open en mag een controle nooit alsnog laten falen.
      onDelivery: async (ok: boolean) => {
        const { recordPasswordBreachDeliverySuccess, recordPasswordBreachDeliveryFailure } =
          await import("@/lib/observability/password-breach-delivery-heartbeat");
        if (ok) {
          await recordPasswordBreachDeliverySuccess("hibp");
        } else {
          await recordPasswordBreachDeliveryFailure("hibp");
        }
      },
    });
  }
  return cached;
}

/** Alleen voor tests: reset de gecachte checker. */
export function resetPasswordBreachCheckerForTests(): void {
  cached = null;
}
