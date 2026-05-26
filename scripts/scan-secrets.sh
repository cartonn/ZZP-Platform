#!/usr/bin/env bash
# Secret-scanner: faalt als er hoog-signaal secrets of een getrackte .env in git staan.
# Bewust spaarzame, hoog-signaal patronen om false positives te vermijden.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0

# 1. Een .env mag nooit getrackt zijn (alleen .env.example).
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "[scan-secrets] FOUT: .env staat in git. Verwijder en .gitignore het."
  fail=1
fi

# 2. Hoog-signaal secret-patronen in getrackte bestanden (placeholders uitgesloten).
PATTERN='AKIA[0-9A-Z]{16}|-----BEGIN ([A-Z ]+ )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}'
matches=$(git grep -nIE "$PATTERN" -- . ':(exclude).env.example' ':(exclude)package-lock.json' ':(exclude)scripts/scan-secrets.sh' 2>/dev/null || true)
if [ -n "$matches" ]; then
  echo "[scan-secrets] FOUT: mogelijke secrets in getrackte bestanden:"
  echo "$matches"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "[scan-secrets] OK — geen getrackte .env en geen secret-patronen gevonden."
fi
exit "$fail"
