#!/usr/bin/env bash
# Installeert een chromium-gebaseerde browser voor Playwright-e2e.
# In deze webomgeving staat de Playwright-browser-CDN niet in de netwerk-allowlist,
# packages.microsoft.com (Microsoft Edge) wél. Daarom Edge via de officiële apt-repo;
# Playwright gebruikt 'm via channel "msedge".
set -uo pipefail

if command -v microsoft-edge >/dev/null 2>&1 || command -v google-chrome >/dev/null 2>&1; then
  echo "[install-browser] browser al aanwezig"
  exit 0
fi

# Fallback 1: Playwright's eigen chromium (werkt als de CDN wél bereikbaar is).
if npx playwright install chromium >/dev/null 2>&1; then
  echo "[install-browser] Playwright chromium geïnstalleerd"
  exit 0
fi

# Fallback 2: Microsoft Edge via apt (packages.microsoft.com).
echo "[install-browser] Playwright-CDN geblokkeerd; Edge via apt installeren"
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/edge stable main" \
  > /etc/apt/sources.list.d/microsoft-edge.list
apt-get update -o Dir::Etc::sourcelist="sources.list.d/microsoft-edge.list" \
  -o Dir::Etc::sourceparts="-" -o APT::Get::List-Cleanup="0"
DEBIAN_FRONTEND=noninteractive apt-get install -y microsoft-edge-stable
echo "[install-browser] Edge geïnstalleerd: $(microsoft-edge --version 2>/dev/null)"
