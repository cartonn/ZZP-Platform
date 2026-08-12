# Productie-image voor Railway. Deterministische build (geen Nixpacks-verrassingen
# rond dev-dependencies). Draait op PostgreSQL; de Prisma-provider wordt omgezet
# vóór de build, en bij de start worden schema + demo-data klaargezet.
# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:22-slim AS builder

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
# --legacy-peer-deps: next-auth (beta) declareert nodemailer@^7 als peer, wij draaien de
# gepatchte nodemailer@8 (CVE-fix). De lockfile is hiermee consistent; zonder de vlag
# faalt npm install in de schone Docker-omgeving op ERESOLVE.
RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY . .

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" \
  AUTH_SECRET="build-time-placeholder-secret-32chars-min" \
  node scripts/use-db-provider.mjs postgresql \
  && DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" \
  AUTH_SECRET="build-time-placeholder-secret-32chars-min" \
  npm run build

# --- Production stage ---
FROM node:22-slim

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodejs

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# --chown zodat de non-root runtime-user in .next/cache en Prisma-temp mag schrijven.
COPY --from=builder --chown=nodejs:nodejs /app/package.json /app/package-lock.json* ./
# public/ bevat de service worker (sw.js) en offline.html; zonder deze kopie 404'en die
# bestanden in productie en faalt de SW-registratie in de browserconsole.
COPY --from=builder --chown=nodejs:nodejs /app/public ./public/
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules/
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next/
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma/
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts/
COPY --from=builder --chown=nodejs:nodejs /app/next.config.mjs ./
# Prisma leest zijn configuratie (o.a. het seed-commando) uit prisma.config.ts; zonder dit
# bestand vindt `prisma db seed` bij boot geen seed-commando meer (vervangt package.json#prisma).
COPY --from=builder --chown=nodejs:nodejs /app/prisma.config.ts ./
# De demo-seed (prisma/seed.ts) draait via tsx en importeert app-code (@/lib/cascade/commands, ...).
# Daarvoor moeten de bronbestanden én tsconfig.json (dat het @/*-pad-alias definieert) in de
# runtime-image staan — alleen .next is niet genoeg. Zonder deze faalt de achtergrond-seed met
# MODULE_NOT_FOUND en blijft de demo-data leeg.
COPY --from=builder --chown=nodejs:nodejs /app/src ./src/
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./

# De lokale storage-driver schrijft geüploade documenten/bewijsstukken naar /app/storage. /app is
# root-eigendom, dus de non-root runtime-user kan die map niet zelf aanmaken → maak 'm aan en geef
# 'm aan nodejs. Zonder dit faalt elke document-write (EACCES): échte uploads én de demo-seed van de
# certificaat-bewijsstukken. (Voor persistente productie-opslag: STORAGE_DRIVER=s3 of een volume.)
RUN mkdir -p /app/storage && chown -R nodejs:nodejs /app/storage

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/readiness',(r)=>{if(r.statusCode!==200)throw r.statusCode})"

CMD ["node", "scripts/start.mjs"]
