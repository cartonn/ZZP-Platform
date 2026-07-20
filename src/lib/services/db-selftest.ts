// Connectiviteits-/schema-zelftest voor de database (admin-only, /admin/systeemstatus).
//
// De systeemstatus toont via de readiness-probe wel of de databank *bereikbaar* is (een boolean),
// maar de database — de enige kritieke productie-afhankelijkheid — heeft als enige seam nog geen
// on-demand zelftest met per-stap-uitkomst zoals de opslag/mail/rate-limit/verificatie/betaal/
// upload-scanner/error-monitoring-zelftests. Vóór go-live (MENSENWERK §1b) wil een beheerder ná
// het omzetten naar productie-Postgres kunnen bevestigen: (a) is de verbinding er en hoe snel is
// de round-trip, (b) draait hij op de verwachte provider (Postgres i.p.v. de lokale SQLite), en
// (c) is het schema/de migratie écht toegepast — `scripts/start.mjs` doet bij elke boot een
// `prisma db push`, maar een half-mislukte push zou stil een verouderd schema achterlaten.
//
// Deze module is puur en injecteerbaar: de Prisma-calls (ping + read-only bestaanscheck op
// kern-tabellen) en de klok komen binnen als parameters, zodat de logica deterministisch te testen
// is zonder een echte databank. De read-only probes muteren niets. Geen secrets/PII in de uitvoer:
// een fout wordt teruggebracht tot de error-NAAM (nooit het bericht — dat kan de connection-string
// bevatten), net als de storage-zelftest en de readiness-probe. De DATABASE_URL wordt nooit
// getoond; alleen de afgeleide provider + een samenvatting van de pool-config.

import { isPostgresUrl, type PoolConfig } from "@/lib/db-connection";

/** Afgeleide databankprovider — nooit de rauwe URL (die bevat de secret). */
export type DbProvider = "postgresql" | "sqlite" | "unknown";

/** Eén stap in de zelftest. `ok:false` + `detail` bij een fout of niet-gehaalde verwachting. */
export interface DbSelfTestStep {
  /** Stabiele sleutel (voor keys/tests/UI). */
  key: "connectivity" | "schema";
  /** Nederlandse omschrijving van de stap. */
  label: string;
  ok: boolean;
  /** Korte, niet-gevoelige toelichting bij een fout (error-naam). */
  detail?: string;
}

export interface DbSelfTestReport {
  ok: boolean;
  /** Afgeleide provider (bv. "postgresql", "sqlite"). Nooit de connection-string. */
  provider: DbProvider;
  /** Round-trip-latency van de connectiviteits-ping in ms (afgerond); afwezig als de ping faalde. */
  latencyMs?: number;
  /** Samenvatting van de pool-config voor deze instance (nooit de URL/secrets). */
  pool: PoolConfig;
  steps: DbSelfTestStep[];
}

/** De read-only DB-operaties die de zelftest nodig heeft (injecteerbaar; muteren niets). */
export interface DbSelfTestProbe {
  /** Lichte round-trip (bv. `SELECT 1`) — bewijst connectiviteit. Werpt bij een storing. */
  ping: () => Promise<unknown>;
  /**
   * Read-only bestaanscheck op kern-tabellen — bewijst dat het schema/de migratie is toegepast.
   * Werpt wanneer een verwachte tabel ontbreekt (bv. "no such table" / "relation does not exist").
   */
  checkSchema: () => Promise<unknown>;
}

const STEP_LABELS: Record<DbSelfTestStep["key"], string> = {
  connectivity: "Verbinding + round-trip",
  schema: "Schema/migratie aanwezig",
};

/**
 * Leidt de provider af uit de DATABASE_URL zonder de URL zelf te lekken. `postgres(ql)://` →
 * postgresql; `file:`/`sqlite:` → sqlite; leeg/onbekend → unknown.
 */
export function detectDbProvider(url: string | undefined | null): DbProvider {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "unknown";
  if (isPostgresUrl(trimmed)) return "postgresql";
  if (/^(file|sqlite):/i.test(trimmed)) return "sqlite";
  return "unknown";
}

/**
 * Brengt een onbekende fout terug tot een korte, PII-/secret-vrije omschrijving: alleen de
 * error-NAAM (bv. "PrismaClientKnownRequestError"), nooit het volledige bericht (dat kan de
 * connection-string of tabelnamen bevatten).
 */
function safeDetail(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "Error";
}

/**
 * Voert de zelftest uit: (1) connectiviteit + latency via een lichte round-trip, dan (2) een
 * read-only schema-check op kern-tabellen. Elke stap heeft een eigen try/catch en werpt nooit naar
 * buiten; een gefaalde stap stopt de vóórwaartse stappen. De probes zijn read-only — er wordt nooit
 * geschreven, dus is er niets op te ruimen.
 */
export async function runDbSelfTest(opts: {
  probe: DbSelfTestProbe;
  provider: DbProvider;
  pool: PoolConfig;
  /** Monotone klok in ms (injecteerbaar) voor de latency-meting. */
  now: () => number;
}): Promise<DbSelfTestReport> {
  const { probe, provider, pool, now } = opts;
  const steps: DbSelfTestStep[] = [];
  let latencyMs: number | undefined;

  const record = (key: DbSelfTestStep["key"], ok: boolean, detail?: string) => {
    steps.push({ key, label: STEP_LABELS[key], ok, ...(detail ? { detail } : {}) });
  };

  // 1. Connectiviteit + latency.
  try {
    const start = now();
    await probe.ping();
    latencyMs = Math.max(0, Math.round(now() - start));
    record("connectivity", true);
  } catch (error) {
    record("connectivity", false, safeDetail(error));
    return { ok: false, provider, pool, latencyMs, steps };
  }

  // 2. Schema/migratie toegepast (read-only bestaanscheck op kern-tabellen).
  try {
    await probe.checkSchema();
    record("schema", true);
  } catch (error) {
    record("schema", false, safeDetail(error));
    return { ok: false, provider, pool, latencyMs, steps };
  }

  return { ok: true, provider, pool, latencyMs, steps };
}
