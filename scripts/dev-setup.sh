#!/usr/bin/env bash
# Idempotente projectsetup voor (web-)sessies. Aangeroepen door de SessionStart-hook
# (.claude/settings.json). De container is ephemeer: dit herstelt deps, env en db.
set -uo pipefail
cd "$(dirname "$0")/.."

log() { printf '[dev-setup] %s\n' "$1"; }

# 1. npm dependencies
if [ ! -d node_modules ]; then
  log "npm install…"
  npm install --no-audit --no-fund >/dev/null 2>&1 || log "npm install faalde"
fi

# 2. .env (lokale dev) met echte AUTH_SECRET
if [ ! -f .env ]; then
  log ".env aanmaken"
  SECRET="$(openssl rand -base64 32)"
  cat > .env <<EOF
DATABASE_URL="file:./dev.db"
AUTH_SECRET="$SECRET"
STORAGE_DRIVER="local"
STORAGE_LOCAL_DIR="./storage"
NODE_ENV="development"
EOF
fi

# 3. database: client + schema + seed (idempotent)
npx prisma generate >/dev/null 2>&1 || true
npx prisma db push --skip-generate >/dev/null 2>&1 || true
npm run db:seed >/dev/null 2>&1 || true

# 4. browser voor e2e (best-effort, op de achtergrond zodat de sessie niet blokkeert)
if ! command -v microsoft-edge >/dev/null 2>&1 && ! command -v google-chrome >/dev/null 2>&1; then
  log "browser (Edge) op de achtergrond installeren voor e2e…"
  bash scripts/install-browser.sh >/dev/null 2>&1 &
fi

log "klaar"
