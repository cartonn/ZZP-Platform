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
- [x] **Sessie 1** — Onboarding & profielen
- [x] **Sessie 2** — Opdrachten CRUD + zoeken/filteren
- [x] **Sessie 3** — Reacties & kandidatenflow
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

### Sessie 1 — 2026-05-26
- Wat gedaan: onboarding & profielen. Registratie met rolkeuze (FREELANCER/CLIENT)
  maakt account + leeg profiel/bedrijf aan en logt direct in. Freelancer- en
  bedrijfsprofiel bewerkbaar via beschermde routes (mutatieketen rol→ownership→Zod→
  actie→audit). Server-berekende profiel-compleetheid met indicator. Publiek ZZP-profiel
  (/zzp/[id]) dat zichtbaarheid server-side afdwingt (PRIVATE → 404, ook anoniem).
  Bedrijfslogo-upload via de storage-abstractie + auth-gated media-route.
- Bestanden:
  - `src/lib/validation.ts` (+ test) — register/freelancer/company Zod-schema's
  - `src/lib/profile.ts` (+ test) — compleetheid + zichtbaarheidsregel
  - `src/app/register/*` — registratie (server action + signin)
  - `src/app/(protected)/profiel/*` — freelancerprofiel bewerken + compleetheid
  - `src/app/(protected)/bedrijf/*` — bedrijfsprofiel bewerken + logo-upload
  - `src/app/zzp/[id]/page.tsx` — publiek profiel (zichtbaarheid afgedwongen)
  - `src/app/api/media/[...key]/route.ts` — auth-gated logo-serving via storage
  - `src/components/ui/*` — input, textarea, select, field, card, progress, badge
  - nav.ts: /profiel + /bedrijf op enabled; auth.config: /register + /zzp/* publiek
- Tests: 58 unit-tests (incl. validation 8, profile 6) + 10 Playwright e2e groen
  (registratie, profiel publiceren, PUBLIC→PRIVATE 404, bedrijfsprofiel).
- Checks: typecheck ✓, lint ✓, test ✓ (58), build ✓ (10 routes), e2e ✓ (10, via Edge).
- Visueel gecontroleerd (screenshots 06-09): register, profiel + compleetheid,
  publiek profiel, bedrijfsprofiel. Geen overflow; states correct.
- Bekende minor: controlled <select> toont kort de oude waarde in de sub-seconde ná
  een server-action save (RSC-refresh), zelfherstellend bij navigatie; data is correct
  (DB + reload-assertie bevestigd). Nette toast/refresh-afhandeling: Sessie 9 (polish).
- Volgende stap: Sessie 2 — Opdrachten CRUD + zoeken/filteren.

### Sessie 2 — 2026-05-26
- Wat gedaan: opdrachten CRUD + zoeken/filteren. CLIENT maakt/bewerkt opdrachten
  (concept → publiceren → sluiten/heropenen → depubliceren) met server-side afgedwongen
  statusovergangen (`JOB_TRANSITIONS`/`assertJobTransition`) + ownership + audit. Vereiste/
  gewenste skills en certificaat-eisen koppelbaar. ZZP-overzicht met debounced zoeken,
  filters (branche, skills, tarief, werkmodus, vereist certificaat), sorteren, paginatie —
  alleen PUBLISHED. Detailpagina role-aware (eigenaar: statusacties + bewerken; ZZP'er:
  read-only + "Reageren (binnenkort)"). Niet-gepubliceerde opdrachten server-side verborgen.
- Bestanden:
  - `src/lib/jobs.ts` (+ test) — JOB_TRANSITIONS, canPublish, normalizeJobFilters
  - `src/lib/validation.ts` — jobSchema (+ tests)
  - `src/app/(protected)/opdrachten/{page,actions,job-form}.tsx`,
    `nieuw/`, `[id]/page.tsx`, `[id]/bewerken/page.tsx`
  - `src/components/jobs/{job-filters,job-status-badge}.tsx`, `ui/check-chip.tsx`
  - nav.ts: Opdrachten / Mijn opdrachten op enabled
- Tests: 71 unit-tests (jobs 9, job-validatie 4 extra) + 11 e2e groen (incl. aanmaken,
  publiceren, zoeken, detail, depubliceren → 404 voor anderen).
- Checks: typecheck ✓, lint ✓, test ✓ (71), build ✓ (15 routes), e2e ✓ (11, via Edge).
- Visueel gecontroleerd (screenshots 10-13): client-overzicht, detail (concept/gepubliceerd),
  browse met filters, ZZP-detail met vereiste skills/certificaten.
- Let op (SQLite-beperking): vrije-tekst-zoek is hoofdlettergevoelig (`contains` zonder
  `mode:insensitive`, niet ondersteund op SQLite). Op Postgres (prod) insensitive maken.
- Volgende stap: Sessie 3 — Reacties & kandidatenflow (matchscore + compliance-snapshot,
  gebruik `src/lib/matching.ts`; feature-gating per plan).

### Sessie 3 — 2026-05-26
- Wat gedaan: reacties & kandidatenflow. FREELANCER reageert op een PUBLISHED opdracht
  (motivatie/tariefvoorstel/beschikbaarheid); server berekent matchscore + compliance-
  snapshot via `matching.ts` en slaat ze op. Eén reactie per opdracht. Plan-gating
  (max reacties, FREE-plan) server-side afgedwongen. CLIENT-kandidatenoverzicht met
  statusbeheer (NEW/VIEWED/SHORTLIST/REJECTED/ACCEPTED via expliciete overgangsmap),
  interne notities en compliance/match per kandidaat. FREELANCER "Mijn reacties".
- Bestanden:
  - `src/lib/applications.ts` (+ test) — APPLICATION_TRANSITIONS, canApply (gating)
  - `src/lib/validation.ts` — applicationSchema (+ test)
  - opdrachten/actions.ts: `createApplication` (match+compliance+gating)
  - `opdrachten/[id]/application-form.tsx` + detailpagina-integratie (reageren/gereageerd)
  - `reacties/page.tsx` (FREELANCER), `kandidaten/{page,actions}.tsx` (CLIENT)
  - `components/{compliance-badge,applications/application-status-badge}.tsx`
  - nav.ts: Mijn reacties + Kandidaten op enabled
- Tests: 78 unit-tests (applications 5, applicatie-validatie 2 extra) + 12 e2e groen
  (reageren → matchscore, dubbel reageren geblokkeerd, kandidaat shortlisten + notitie).
- Checks: typecheck ✓, lint ✓, test ✓ (78), build ✓ (17 routes), e2e ✓ (12, via Edge).
- Visueel gecontroleerd (screenshots 14-16): reactieformulier, mijn reacties, kandidaten.
- Mijlpaal: na Sessie 5 is de volledige kerndifferentiatie (opdracht → reactie →
  verificatie → compliance) demo-klaar. Nu staat opdracht → reactie → match/compliance.
- Volgende stap: Sessie 4 — Documenten + credentials (ZZP-kant): upload-UI op de
  storage-abstractie, credentials uploaden/metadata/verificatie aanvragen/zichtbaarheid.

<!-- Kopieer dit blok voor elke nieuwe sessie -->
