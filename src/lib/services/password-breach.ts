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

import { createHash } from "crypto";

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
 * SHA-1 van een string als hoofdletter-hex. LET OP: SHA-1 is hier VERPLICHT door het HIBP "Pwned
 * Passwords"-protocol — de k-anonimiteit werkt per definitie over SHA-1-prefixen. Dit is GEEN
 * wachtwoord-opslag: opslag gaat altijd via **bcrypt** (register/reset/wijzig). Deze hash verlaat de
 * server ook nooit heel — alleen de eerste 5 tekens (de range-prefix) gaan naar HIBP. Daarom is de
 * CodeQL-waarschuwing "insufficient password hash" hier een false positive en onderdrukt.
 */
export function sha1Hex(input: string): string {
  // codeql[js/insufficient-password-hash] — SHA-1 is protocol-vereist (HIBP k-anonimiteit), niet voor opslag (bcrypt).
  return createHash("sha1").update(input, "utf8").digest("hex").toUpperCase();
}

export interface HibpCheckerOptions {
  /** Injecteerbaar voor tests; default global fetch. */
  fetchImpl?: typeof fetch;
  /** Deadline in ms (geklemd in fetch-timeout). */
  timeoutMs?: number;
  /** Basis-URL van de range-API (default de publieke HIBP-endpoint). */
  baseUrl?: string;
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
  private readonly baseUrl: string;

  constructor(options: HibpCheckerOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS;
    // Zonder trailing slash; we plakken zelf "/{prefix}".
    this.baseUrl = (options.baseUrl ?? "https://api.pwnedpasswords.com/range").replace(/\/+$/, "");
  }

  async check(password: string): Promise<PasswordBreachResult> {
    if (!password) return SKIPPED;
    const hash = sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    try {
      const res = await fetchWithTimeout(
        `${this.baseUrl}/${prefix}`,
        {
          method: "GET",
          // Add-Padding verhult de werkelijke responsgrootte (timing/omvang-privacy). De padding-
          // regels dragen count 0 en worden hieronder genegeerd.
          headers: { "Add-Padding": "true", Accept: "text/plain" },
        },
        { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "HIBP" },
      );
      if (!res.ok) return SKIPPED;
      const body = await res.text();
      const count = matchSuffixCount(body, suffix);
      return { breached: count > 0, skipped: false, count };
    } catch {
      // Netwerkfout of time-out: fail-open. Een lek-check mag de flow nooit blokkeren.
      return SKIPPED;
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
    });
  }
  return cached;
}

/** Alleen voor tests: reset de gecachte checker. */
export function resetPasswordBreachCheckerForTests(): void {
  cached = null;
}
