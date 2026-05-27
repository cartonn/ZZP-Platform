# Productie-image voor Railway. Deterministische build (geen Nixpacks-verrassingen
# rond dev-dependencies). Draait op PostgreSQL; de Prisma-provider wordt omgezet
# vóór de build, en bij de start worden schema + demo-data klaargezet.
# syntax=docker/dockerfile:1
FROM node:22-slim

# Prisma heeft openssl nodig.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies incl. dev: nodig voor de build, de Prisma CLI en de seed (tsx).
# `npm install` (i.p.v. `npm ci`) is toleranter als de lockfile licht afwijkt.
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install --no-audit --no-fund

# Broncode.
COPY . .

# Productie draait op PostgreSQL: provider omzetten en bouwen.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" \
  AUTH_SECRET="build-time-placeholder-secret-32chars-min" \
  node scripts/use-db-provider.mjs postgresql \
  && DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public" \
  AUTH_SECRET="build-time-placeholder-secret-32chars-min" \
  npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "scripts/start.mjs"]
