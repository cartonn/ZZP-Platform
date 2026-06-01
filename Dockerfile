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
RUN npm install --no-audit --no-fund

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
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false nodejs

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/.next ./.next/
COPY --from=builder /app/public ./public/
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/scripts ./scripts/
COPY --from=builder /app/next.config.mjs ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health',(r)=>{if(r.statusCode!==200)throw r.statusCode})"

CMD ["node", "scripts/start.mjs"]
