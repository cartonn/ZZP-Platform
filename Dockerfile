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
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Broncode.
COPY . .

# Placeholder-env zodat env-validatie tijdens de build slaagt; Railway levert
# de echte waarden bij het draaien (die overschrijven deze defaults).
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
ENV AUTH_SECRET="build-time-placeholder-secret-32chars-min"

# Productie draait op PostgreSQL: provider omzetten en bouwen.
RUN node scripts/use-db-provider.mjs postgresql && npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "scripts/start.mjs"]
