import { Prisma, PrismaClient } from "@prisma/client";

import { resolveDatabaseUrl } from "@/lib/db-connection";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Productie-Postgres: begrens de pool per proces via env (connection_limit/pool_timeout/pgbouncer)
// zodat horizontale schaling het connectie-plafond van de managed DB niet uitput. Inert-by-default:
// zonder de env-variabelen komt de URL ongewijzigd terug en gedraagt de client zich als voorheen.
// `db push`/migraties gebruiken de rauwe env-URL uit het schema — die blijven ongemoeid.
const rawUrl = process.env.DATABASE_URL;
const resolvedUrl = resolveDatabaseUrl(rawUrl, {
  DATABASE_CONNECTION_LIMIT: process.env.DATABASE_CONNECTION_LIMIT,
  DATABASE_POOL_TIMEOUT: process.env.DATABASE_POOL_TIMEOUT,
  DATABASE_PGBOUNCER: process.env.DATABASE_PGBOUNCER,
});

// Query-budget-instrumentatie (opt-in via PRISMA_QUERY_LOG=1): de client zendt dan per query een
// `query`-event uit i.p.v. alleen fouten te loggen, zodat `src/lib/query-budget.test.ts` het aantal
// database-queries per scherm kan tellen. Inert-by-default: zonder de env-variabele is de logconfig
// byte-identiek aan voorheen, dus geen extra overhead in dev of productie. Het event bevat de
// SQL-tekst en parameters — daarom nooit standaard aan (queryparameters kunnen persoonsgegevens
// bevatten); de test zet 'm bewust alleen voor zijn eigen wegwerp-database.
const baseLog: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
const log: (Prisma.LogLevel | Prisma.LogDefinition)[] =
  process.env.PRISMA_QUERY_LOG === "1" ? [...baseLog, { emit: "event", level: "query" }] : baseLog;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log,
    // Alleen overschrijven wanneer de pool-config de URL daadwerkelijk aanpaste; anders de
    // schema-datasource ongemoeid laten (byte-identiek lokaal gedrag).
    ...(resolvedUrl && resolvedUrl !== rawUrl ? { datasourceUrl: resolvedUrl } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
