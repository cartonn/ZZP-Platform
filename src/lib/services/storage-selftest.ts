// Connectiviteitszelftest voor de documentopslag (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont de driver-MODUS (`s3`/`local`), maar bewijst niet dat de opslag echt
// bereikbaar én beschrijfbaar is. Vóór go-live met echte gevoelige documenten (VOG, diploma's,
// verzekering — MENSENWERK §1c) wil een beheerder dat kunnen bevestigen ná het plakken van de
// bucket/sleutels: doet een verkeerd geconfigureerde bucket het écht?
//
// Deze module draait een volledige round-trip tegen een geïnjecteerde driver — put → exists →
// get (byte-vergelijk) → delete → opruim-check — onder een eigen `.selftest/`-prefix, zodat de
// probe nóóit botst met echte documenten (die op `YYYY/<uuid>` leven). Puur en injecteerbaar
// (geen I/O-globals, geen klok) zodat het deterministisch te testen is. Geen secrets in de
// uitvoer: een fout wordt teruggebracht tot de error-NAAM (nooit het bericht — dat kan een
// endpoint/connection-string bevatten), net als de readiness-probe.

import type { StorageDriver } from "@/lib/services/storage";

/** Eén stap in de round-trip. `ok:false` + `detail` bij een fout of een niet-gehaalde verwachting. */
export interface SelfTestStep {
  /** Stabiele sleutel (voor keys/tests/UI). */
  key: "write" | "exists" | "read" | "delete" | "cleanup";
  /** Nederlandse omschrijving van de stap. */
  label: string;
  ok: boolean;
  /** Korte, niet-gevoelige toelichting bij een fout (error-naam of verwachtingsmismatch). */
  detail?: string;
}

export interface StorageSelfTestReport {
  ok: boolean;
  /** Actieve driver-modus (bv. "s3", "local"). Geen sleutelwaarden. */
  driverMode: string;
  /** De gebruikte probe-key (onder `.selftest/`), handig voor de logs. */
  probeKey: string;
  steps: SelfTestStep[];
}

/** De opslag-operaties die de zelftest nodig heeft (subset van `StorageDriver`, injecteerbaar). */
export type SelfTestDriver = Pick<StorageDriver, "put" | "exists" | "get" | "delete">;

/** Prefix waaronder alle probe-objecten leven; scheidt ze van echte documenten (`YYYY/<uuid>`). */
export const SELFTEST_PREFIX = ".selftest/";

const STEP_LABELS: Record<SelfTestStep["key"], string> = {
  write: "Schrijven",
  exists: "Bestaan bevestigen",
  read: "Lezen + byte-vergelijk",
  delete: "Verwijderen",
  cleanup: "Opruimen bevestigen",
};

/**
 * Brengt een onbekende fout terug tot een korte, PII-/secret-vrije omschrijving: alleen de
 * error-NAAM (bv. "CredentialsProviderError"), nooit het volledige bericht.
 */
function safeDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/** Deterministische probe-inhoud, gebonden aan de key zodat de byte-vergelijking iets zegt. */
export function probePayload(probeKey: string): Buffer {
  return Buffer.from(`zzp-storage-selftest\n${probeKey}\n`, "utf8");
}

/**
 * Voert de round-trip uit. Elke stap heeft een eigen try/catch en werpt nooit naar buiten; een
 * gefaalde stap stopt de vóórwaartse stappen (die worden dan niet getoond), maar er wordt in een
 * `finally` **altijd** een best-effort delete gedaan zodat er nooit een probe-object achterblijft —
 * ook niet als een latere stap faalde nadat het schrijven al slaagde.
 */
export async function runStorageSelfTest(opts: {
  driver: SelfTestDriver;
  driverMode: string;
  probeKey: string;
}): Promise<StorageSelfTestReport> {
  const { driver, driverMode, probeKey } = opts;
  const steps: SelfTestStep[] = [];
  const payload = probePayload(probeKey);
  let wrote = false;

  const record = (key: SelfTestStep["key"], ok: boolean, detail?: string) => {
    steps.push({ key, label: STEP_LABELS[key], ok, ...(detail ? { detail } : {}) });
    return ok;
  };

  try {
    // 1. Schrijven.
    try {
      const stored = await driver.put(probeKey, payload, "text/plain");
      wrote = true;
      if (stored.size !== payload.byteLength) {
        record("write", false, `Onverwachte grootte (${stored.size} ≠ ${payload.byteLength}).`);
        return { ok: false, driverMode, probeKey, steps };
      }
      record("write", true);
    } catch (error) {
      record("write", false, safeDetail(error));
      return { ok: false, driverMode, probeKey, steps };
    }

    // 2. Bestaan bevestigen.
    try {
      const found = await driver.exists(probeKey);
      if (!found) {
        record("exists", false, "Object niet gevonden direct na schrijven.");
        return { ok: false, driverMode, probeKey, steps };
      }
      record("exists", true);
    } catch (error) {
      record("exists", false, safeDetail(error));
      return { ok: false, driverMode, probeKey, steps };
    }

    // 3. Lezen + byte-vergelijk.
    try {
      const read = await driver.get(probeKey);
      if (!read.equals(payload)) {
        record("read", false, "Gelezen inhoud komt niet overeen met het geschrevene.");
        return { ok: false, driverMode, probeKey, steps };
      }
      record("read", true);
    } catch (error) {
      record("read", false, safeDetail(error));
      return { ok: false, driverMode, probeKey, steps };
    }

    // 4. Verwijderen.
    try {
      await driver.delete(probeKey);
      wrote = false; // opgeruimd; de finally hoeft niet nog eens te verwijderen.
      record("delete", true);
    } catch (error) {
      record("delete", false, safeDetail(error));
      return { ok: false, driverMode, probeKey, steps };
    }

    // 5. Opruimen bevestigen.
    try {
      const stillThere = await driver.exists(probeKey);
      if (stillThere) {
        record("cleanup", false, "Object bestaat nog na verwijderen.");
        return { ok: false, driverMode, probeKey, steps };
      }
      record("cleanup", true);
    } catch (error) {
      record("cleanup", false, safeDetail(error));
      return { ok: false, driverMode, probeKey, steps };
    }

    return { ok: true, driverMode, probeKey, steps };
  } finally {
    // Vangnet: laat nooit een probe-object achter, ook niet bij een mislukte tussenstap.
    if (wrote) {
      try {
        await driver.delete(probeKey);
      } catch {
        // Best-effort opruimen; een falende cleanup mag het rapport niet kapen.
      }
    }
  }
}
