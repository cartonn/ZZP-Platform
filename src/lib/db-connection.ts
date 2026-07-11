// Connection-pool-configuratie voor de Prisma-client (productie-Postgres).
//
// Waarom: Prisma opent per proces een eigen connectie-pool (default `num_cpus * 2 + 1`
// connecties). Bij horizontale schaling op Railway (meerdere instances) vermenigvuldigt dat
// zich en kan het het connectie-plafond van een managed Postgres (Neon/Supabase/Railway,
// vaak 20–100) uitputten — nieuwe requests krijgen dan "too many connections". Deze seam
// laat de operator de pool per instance begrenzen (en pgbouncer-compat aanzetten) via env,
// zónder de DATABASE_URL in de secrets te hoeven aanpassen.
//
// Inert-by-default: zonder de env-variabelen komt de URL ONGEWIJZIGD terug — identiek gedrag
// als voorheen (Prisma-defaults). SQLite/`file:`-URLs worden nooit aangeraakt (die kennen
// geen pool-parameters). Een parameter die de operator al expliciet in de URL zette, wordt
// nooit overschreven — de URL blijft de bron van waarheid.
//
// Pure, testbare logica: geen Prisma-/Next-afhankelijkheden. Zie db.ts voor de wiring.

/** Env-sleutels die deze seam leest (los zodat env.ts ze kan documenteren/waarschuwen). */
export interface PoolEnv {
  DATABASE_CONNECTION_LIMIT?: string;
  DATABASE_POOL_TIMEOUT?: string;
  DATABASE_PGBOUNCER?: string;
}

export interface PoolConfig {
  /** Max. aantal connecties in de pool per proces (Prisma `connection_limit`). */
  connectionLimit?: number;
  /** Seconden dat een query op een vrije connectie wacht (Prisma `pool_timeout`; 0 = uit). */
  poolTimeout?: number;
  /** PgBouncer-/pooler-compatibele modus (Prisma `pgbouncer=true`). */
  pgbouncer?: boolean;
}

/** Grenzen — een onzinnige waarde valt terug op "niet gezet" i.p.v. de boot te breken. */
const CONNECTION_LIMIT_RANGE = { min: 1, max: 1000 } as const;
const POOL_TIMEOUT_RANGE = { min: 0, max: 3600 } as const;

function clampedInt(
  raw: string | undefined,
  range: { min: number; max: number },
): number | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  // Alleen hele, niet-negatieve getallen; alles anders is ongeldig → undefined (geen wijziging).
  if (!/^\d+$/.test(trimmed)) return undefined;
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(value)) return undefined;
  return Math.min(Math.max(value, range.min), range.max);
}

function parseBool(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === "true";
}

/** Leidt de pool-configuratie af uit de env (met veilige clamping/parsing). */
export function parsePoolConfig(env: PoolEnv): PoolConfig {
  const config: PoolConfig = {};
  const connectionLimit = clampedInt(env.DATABASE_CONNECTION_LIMIT, CONNECTION_LIMIT_RANGE);
  if (connectionLimit !== undefined) config.connectionLimit = connectionLimit;
  const poolTimeout = clampedInt(env.DATABASE_POOL_TIMEOUT, POOL_TIMEOUT_RANGE);
  if (poolTimeout !== undefined) config.poolTimeout = poolTimeout;
  if (parseBool(env.DATABASE_PGBOUNCER)) config.pgbouncer = true;
  return config;
}

/** Herkent een Postgres-connectiestring (postgres:// of postgresql://). */
export function isPostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//i.test(url.trim());
}

/**
 * Geeft de DATABASE_URL terug, aangevuld met de geconfigureerde pool-parameters.
 *
 * - Niet-Postgres (SQLite/`file:`): ONGEWIJZIGD terug.
 * - Geen config gezet: ONGEWIJZIGD terug.
 * - Parameter al aanwezig in de URL: NIET overschrijven (operator wint).
 * - Onparseerbare URL: ONGEWIJZIGD terug (nooit de boot breken op een edge-case).
 */
export function resolveDatabaseUrl(rawUrl: string | undefined, env: PoolEnv): string | undefined {
  if (!rawUrl) return rawUrl;
  if (!isPostgresUrl(rawUrl)) return rawUrl;

  const config = parsePoolConfig(env);
  const hasAny =
    config.connectionLimit !== undefined ||
    config.poolTimeout !== undefined ||
    config.pgbouncer === true;
  if (!hasAny) return rawUrl;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const setIfAbsent = (key: string, value: string) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  };

  if (config.connectionLimit !== undefined) {
    setIfAbsent("connection_limit", String(config.connectionLimit));
  }
  if (config.poolTimeout !== undefined) {
    setIfAbsent("pool_timeout", String(config.poolTimeout));
  }
  if (config.pgbouncer === true) {
    setIfAbsent("pgbouncer", "true");
  }

  return url.toString();
}
