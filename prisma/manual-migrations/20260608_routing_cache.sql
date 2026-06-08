-- Migratie: reistijd-routing-cache (PR #216, ROUTING_PROVIDER=geoapify).
-- Maakt de twee cachetabellen GeocodeCache + TravelRouteCache aan op PostgreSQL.
--
-- LET OP: in de normale deploy is dit NIET nodig — `scripts/start.mjs` draait bij elke
-- (her)start `npx prisma db push --skip-generate`, wat deze tabellen additief aanmaakt.
-- Dit bestand is een AUDITBARE, IDEMPOTENTE safety-net: handmatig uit te voeren op de
-- productie-Postgres als je het schema expliciet/los wilt toepassen (bv. zonder full deploy):
--
--   psql "$DATABASE_URL" -f prisma/manual-migrations/20260608_routing_cache.sql
--
-- `IF NOT EXISTS` overal → veilig meerdere keren te draaien; raakt geen bestaande data.
-- DDL gegenereerd met `prisma migrate diff` (provider postgresql) en handmatig idempotent gemaakt.

CREATE TABLE IF NOT EXISTS "GeocodeCache" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "confidence" DOUBLE PRECISION,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeocodeCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TravelRouteCache" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'drive',
    "fromQuery" TEXT NOT NULL,
    "toQuery" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "fromLat" DOUBLE PRECISION NOT NULL,
    "fromLon" DOUBLE PRECISION NOT NULL,
    "toLat" DOUBLE PRECISION NOT NULL,
    "toLon" DOUBLE PRECISION NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelRouteCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GeocodeCache_queryKey_key" ON "GeocodeCache"("queryKey");
CREATE INDEX IF NOT EXISTS "GeocodeCache_provider_idx" ON "GeocodeCache"("provider");
CREATE INDEX IF NOT EXISTS "GeocodeCache_expiresAt_idx" ON "GeocodeCache"("expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "TravelRouteCache_cacheKey_key" ON "TravelRouteCache"("cacheKey");
CREATE INDEX IF NOT EXISTS "TravelRouteCache_provider_mode_idx" ON "TravelRouteCache"("provider", "mode");
CREATE INDEX IF NOT EXISTS "TravelRouteCache_expiresAt_idx" ON "TravelRouteCache"("expiresAt");
