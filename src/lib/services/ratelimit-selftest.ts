// Connectiviteitszelftest voor de gedeelde rate-limit-store (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont de store-MODUS (`upstash`/`memory`), maar bewijst niet dat een
// geconfigureerde Upstash Redis écht bereikbaar is. Dat is hier extra riskant: de Upstash-store is
// bewust FAIL-OPEN (een Redis-storing mag login/registratie niet platleggen — zie
// UpstashRateLimitStore.consume). Een verkeerd geplakte REST-URL/token faalt daardoor STIL: de
// limieten gelden dan in werkelijkheid niet gedeeld over de instances, terwijl niets dat toont
// (MENSENWERK §0b H-2). Vóór horizontale schaling wil een beheerder dat kunnen bevestigen ná het
// plakken van de secrets.
//
// Deze module draait daarom een echte round-trip die fouten JUIST zichtbaar maakt (geen fail-open):
//   INCR key             → teller (bewijst bereikbaar + beschrijfbaar; het antwoord reflecteert de write)
//   PEXPIRE key ms NX     → zet de venster-TTL (net als de echte fixed-window)
//   PTTL key              → lees de TTL terug (> 0 bewijst dat de TTL landde)
//   DEL key               → ruim de probe op
//   EXISTS key            → bevestig dat de probe weg is
//
// Puur en injecteerbaar (geen I/O-globals, geen klok): de round-trip praat via een geïnjecteerde
// `exec` (rauwe Upstash-pipeline) zodat het deterministisch te testen is. Geen secrets in de
// uitvoer: een fout wordt teruggebracht tot de error-NAAM (nooit het bericht — dat kan de
// REST-URL/token bevatten), net als de opslag-/readiness-probes.

/** Eén stap in de round-trip. `ok:false` + `detail` bij een fout of een niet-gehaalde verwachting. */
export interface RateLimitSelfTestStep {
  /** Stabiele sleutel (voor keys/tests/UI). */
  key: "connect" | "expire" | "delete" | "cleanup";
  /** Nederlandse omschrijving van de stap. */
  label: string;
  ok: boolean;
  /** Korte, niet-gevoelige toelichting bij een fout (error-naam of verwachtingsmismatch). */
  detail?: string;
}

export interface RateLimitSelfTestReport {
  ok: boolean;
  /** false wanneer er geen gedeelde store draait (RATE_LIMIT_STORE=memory) — dan is er niets getest. */
  active: boolean;
  /** Actieve store-modus (bv. "upstash", "memory"). Geen sleutelwaarden. */
  storeMode: string;
  /** De gebruikte probe-key, handig voor de logs. Leeg wanneer inactief. */
  probeKey: string;
  steps: RateLimitSelfTestStep[];
}

/** Voert één rauwe Upstash-pipeline uit en geeft de resultaten terug (surfacet fouten, geen fail-open). */
export type RateLimitProbeExec = (commands: (string | number)[][]) => Promise<unknown[]>;

const STEP_LABELS: Record<RateLimitSelfTestStep["key"], string> = {
  connect: "Verbinden + tellen (INCR)",
  expire: "Venster-TTL zetten + lezen (PEXPIRE/PTTL)",
  delete: "Opruimen (DEL)",
  cleanup: "Opruimen bevestigen (EXISTS)",
};

/** Standaard venstergrootte voor de probe-TTL (ms). Alleen de probe gebruikt dit; ruim genoeg. */
export const RATELIMIT_SELFTEST_WINDOW_MS = 60_000;

/**
 * Brengt een onbekende fout terug tot een korte, PII-/secret-vrije omschrijving: alleen de
 * error-NAAM (bv. "AbortError"), nooit het volledige bericht (dat kan een endpoint/token bevatten).
 */
function safeDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/** Rapport voor een store die niet gedeeld is (memory): niets getest, eerlijk gemeld. */
export function inactiveRateLimitReport(storeMode: string): RateLimitSelfTestReport {
  return { ok: true, active: false, storeMode, probeKey: "", steps: [] };
}

/**
 * Voert de round-trip uit tegen een geïnjecteerde Upstash-pipeline. Elke stap heeft een eigen
 * try/catch en werpt nooit naar buiten; een gefaalde stap stopt de vóórwaartse stappen, maar er
 * wordt in een `finally` **altijd** een best-effort DEL gedaan zodat er nooit een probe-key
 * achterblijft — ook niet als een latere stap faalde nadat de key al bestond.
 */
export async function runRateLimitSelfTest(opts: {
  exec: RateLimitProbeExec;
  storeMode: string;
  probeKey: string;
  windowMs?: number;
}): Promise<RateLimitSelfTestReport> {
  const { exec, storeMode, probeKey } = opts;
  const windowMs = opts.windowMs ?? RATELIMIT_SELFTEST_WINDOW_MS;
  const steps: RateLimitSelfTestStep[] = [];
  let created = false;

  const record = (key: RateLimitSelfTestStep["key"], ok: boolean, detail?: string) => {
    steps.push({ key, label: STEP_LABELS[key], ok, ...(detail ? { detail } : {}) });
    return ok;
  };
  const fail = (): RateLimitSelfTestReport => ({
    ok: false,
    active: true,
    storeMode,
    probeKey,
    steps,
  });

  try {
    // 1. Verbinden + tellen. INCR op een verse key geeft 1 terug; het antwoord reflecteert de write.
    try {
      const [count] = await exec([["INCR", probeKey]]);
      created = true;
      const used = Number(count);
      if (!Number.isFinite(used) || used < 1) {
        record("connect", false, `Onverwacht INCR-resultaat (${String(count)}).`);
        return fail();
      }
      record("connect", true);
    } catch (error) {
      record("connect", false, safeDetail(error));
      return fail();
    }

    // 2. Venster-TTL zetten (PEXPIRE NX) + teruglezen (PTTL). PTTL > 0 bewijst dat de TTL landde.
    try {
      const [, ttl] = await exec([
        ["PEXPIRE", probeKey, windowMs, "NX"],
        ["PTTL", probeKey],
      ]);
      const ttlMs = Number(ttl);
      if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
        record("expire", false, `Geen venster-TTL gezet (PTTL=${String(ttl)}).`);
        return fail();
      }
      record("expire", true);
    } catch (error) {
      record("expire", false, safeDetail(error));
      return fail();
    }

    // 3. Opruimen. DEL geeft het aantal verwijderde keys terug (1).
    try {
      const [removed] = await exec([["DEL", probeKey]]);
      if (Number(removed) !== 1) {
        record("delete", false, `Onverwacht DEL-resultaat (${String(removed)}).`);
        return fail();
      }
      created = false; // opgeruimd; de finally hoeft niet nog eens te verwijderen.
      record("delete", true);
    } catch (error) {
      record("delete", false, safeDetail(error));
      return fail();
    }

    // 4. Opruimen bevestigen. EXISTS geeft 0 wanneer de key echt weg is.
    try {
      const [exists] = await exec([["EXISTS", probeKey]]);
      if (Number(exists) !== 0) {
        record("cleanup", false, "Probe-key bestaat nog na verwijderen.");
        return fail();
      }
      record("cleanup", true);
    } catch (error) {
      record("cleanup", false, safeDetail(error));
      return fail();
    }

    return { ok: true, active: true, storeMode, probeKey, steps };
  } finally {
    // Vangnet: laat nooit een probe-key achter, ook niet bij een mislukte tussenstap.
    if (created) {
      try {
        await exec([["DEL", probeKey]]);
      } catch {
        // Best-effort opruimen; een falende cleanup mag het rapport niet kapen.
      }
    }
  }
}
