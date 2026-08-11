# ZZP Platform

Productiegericht SaaS-platform voor de Nederlandse markt waar zelfstandigen (ZZP'ers),
opdrachtgevers en bemiddelaars samenkomen. Kernwaarde: opdrachten matchen met verklaarbare
matching, certificaten/diploma's verifiëren, documenten veilig beheren en de volledige
facturatie-/administratiecascade ontzorgen — Wet-DBA- en AVG-bewust.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Prisma (SQLite lokaal,
PostgreSQL in productie) · Auth.js (NextAuth v5) · Zod · Tailwind + Radix ·
Vitest (unit) · Playwright (e2e). Deploy: Railway (Dockerfile, default branch `main`).

## Snel starten (lokaal)

```bash
npm install
npx prisma db push          # schema → dev.db (SQLite)
SEED_DEMO=true npx prisma db seed   # referentie- + demo-data (wachtwoord demo1234)
npm run dev                 # http://localhost:3000
```

Demo-accounts: `zzp@zzp-platform.local`, `opdrachtgever@zzp-platform.local`,
`admin@zzp-platform.local`, `franchise@zzp-platform.local` (wachtwoord `demo1234`).

## Kwaliteitspoort

```bash
npm run check       # lint + typecheck + test + build
npx prettier --check .
npm run e2e         # Playwright (lokaal: --project=edge of --project=ci)
npm run check:env   # env-vars gedocumenteerd?
npm run validate:ci # workflows consistent?
npm run scan:secrets
```

Een wijziging is pas af als de CI-poort op de PR groen is (`gh pr checks <nr>`) —
6 vereiste checks: `check`, `e2e`, `audit`, `secret-scan`, `CodeQL`, `agent-review`.

## Documentatie

| Document                                                             | Rol                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                                               | Persistente projectcontext + niet-onderhandelbare regels       |
| [START_HIER.md](START_HIER.md)                                       | Werkwijze met Claude Code (sessie-routine)                     |
| [CURRENT_TASK.md](CURRENT_TASK.md)                                   | Huidige taak + geprioriteerde backlog + operationele handoff   |
| [PROGRESS.md](PROGRESS.md)                                           | Logboek van wat af is                                          |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                   | Systeemarchitectuur (event-driven cascade)                     |
| [DESIGN.md](DESIGN.md)                                               | Canoniek designsysteem (tokens, primitives, status-taal)       |
| [SECURITY.md](SECURITY.md)                                           | Security-beleid                                                |
| [MENSENWERK.md](MENSENWERK.md)                                       | Wat een mens moet doen vóór livegang (accounts/secrets/jurist) |
| [docs/RUNBOOK.md](docs/RUNBOOK.md)                                   | Operationeel draaiboek (deploy, rollback, back-up, incidenten) |
| [docs/SECURITY-PRIVACY-BACKLOG.md](docs/SECURITY-PRIVACY-BACKLOG.md) | Security-/privacy-auditlog (opgelost + geparkeerd)             |
| [docs/decisions/](docs/decisions/)                                   | ADR's (architectuurbeslissingen)                               |

## Livegang

De code is productie-klaar achter veilige defaults; integraties (S3, SMTP, Stripe/Mollie,
Upstash, Sentry, ClamAV, DUO/BIG/iDIN) staan default UIT/inert en activeren via env-secrets.
Alles wat een account, geheim, juridisch oordeel of externe partij vereist staat — voor een
niet-technische lezer — stap voor stap in [MENSENWERK.md](MENSENWERK.md).
