import { PrismaClient } from "@prisma/client";

import { resolveDatabaseUrl } from "@/lib/db-connection";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Productie-Postgres: begrens de pool per proces via env (connection_limit/pool_timeout/pgbouncer)
// zodat horizontale schaling het connectie-plafond van de managed DB niet uitput. Inert-by-default:
// zonder de env-variabelen komt de URL ongewijzigd terug en gedraagt de client zich als voorheen.
// `db push`/migraties gebruiken de rauwe env-URL uit het schema — die blijven ongemoeid.
const rawUrl = process.env.DATABASE_URL;
const resolvedUrl = resolveDatabaseUrl(rawUrl, process.env);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Alleen overschrijven wanneer de pool-config de URL daadwerkelijk aanpaste; anders de
    // schema-datasource ongemoeid laten (byte-identiek lokaal gedrag).
    ...(resolvedUrl && resolvedUrl !== rawUrl ? { datasourceUrl: resolvedUrl } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
