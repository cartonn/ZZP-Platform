# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie. Houd het kort en feitelijk:
> wat is af, welke bestanden, welke tests, wat is de volgende stap.

## Legenda
- [x] af en getest
- [~] deels af / in uitvoering
- [ ] nog niet begonnen

---

## Status per sessie

- [x] **Sessie 0** — Inventarisatie & fundament
- [ ] **Sessie 1** — Onboarding & profielen
- [ ] **Sessie 2** — Opdrachten CRUD + zoeken/filteren
- [ ] **Sessie 3** — Reacties & kandidatenflow
- [ ] **Sessie 4** — Documenten + credentials (ZZP)
- [ ] **Sessie 5** — Verificatie (admin) + compliance afronden
- [ ] **Sessie 6** — Berichten, notificaties, samenwerkingen
- [ ] **Sessie 7** — Facturatie + billing
- [ ] **Sessie 8** — Admin-paneel afronden
- [ ] **Sessie 9** — Polish, performance, a11y, e2e
- [ ] **Sessie 10** — Productie-voorbereiding (code-kant)

---

## Logboek

### Sessie 0 — 2026-05-25
- Wat gedaan: fundament vanaf nul gescaffold (geen bestaande codebase aangetroffen).
  Next.js 15 (App Router) + React 19 + TS strict + Prisma (SQLite) + Auth.js v5
  (credentials + JWT, role-based) + Tailwind + Vitest. Login werkt, guard redirect
  werkt, 3 demo-accounts geseed. Volledig Prisma-schema voor alle kernmodellen.
- Bestanden (kern):
  - `prisma/schema.prisma` (alle modellen, portable: strings i.p.v. native enums, geen scalar-arrays)
  - `prisma/seed.ts` (3 demo-accounts + skills/branches/plannen, idempotent)
  - `src/lib/enums.ts` (alle enums + Zod + `CREDENTIAL_TRANSITIONS`)
  - `src/lib/credentials.ts` (+ test) — `assertTransition`, expiry-logica
  - `src/lib/authz.ts` (+ test) — auth/rol/ownership, `requireRole`, `assertOwnership`
  - `src/lib/matching.ts` (+ test) — matchscore + compliance-berekening
  - `src/lib/services/storage.ts` (+ test) — abstractie (local/S3-stub) + upload-validatie
  - `src/lib/audit.ts`, `src/lib/db.ts`, `src/lib/utils.ts`, `src/lib/nav.ts`
  - `src/auth.ts`, `src/auth.config.ts` (edge-safe), `src/middleware.ts`, `src/types/next-auth.d.ts`
  - `src/app/login/*`, `src/app/(protected)/layout.tsx` + `dashboard/page.tsx`, `src/app/page.tsx`
  - `src/components/app-shell.tsx`, `sidebar-nav.tsx`, `ui/button.tsx`
- Tests: 44 unit-tests groen (credentials 14, authz 12, matching 11, storage 7).
- Checks: typecheck ✓, lint ✓ (geen warnings), test ✓ (44/44), build ✓ (6 routes + middleware).
- Browser-doorklik (visueel) ✓: Playwright e2e-smoke (`e2e/smoke.spec.ts`, 7 tests) draait
  via **systeem-Edge** (`channel: "msedge"`) en maakt screenshots (`e2e/screenshots/`,
  gitignored) die visueel zijn gecontroleerd: login, freelancer/admin/client-dashboard
  (role-aware nav verschilt), foutstaat, uitloggen. Geen tekst-overflow, states renderen.
  Reden voor Edge: de Playwright-browser-CDN staat niet in de netwerk-allowlist van deze
  omgeving; `packages.microsoft.com` (Edge, chromium-gebaseerd) wél. Run: `npm run e2e`.
- Openstaand / volgende stap: Sessie 1 (Onboarding & profielen). Aandachtspunten:
  - `.env` is lokaal aangemaakt met echte `AUTH_SECRET` (niet in git).
  - Prisma toont een deprecation-warning over `package.json#prisma` (werkt op v6;
    migratie naar `prisma.config.ts` kan later).
  - E2e vereist een geïnstalleerde Edge/Chrome (system). In deze omgeving via apt-repo
    `packages.microsoft.com` → `microsoft-edge-stable`. Niet via Playwright's eigen CDN.

<!-- Kopieer dit blok voor elke nieuwe sessie -->
