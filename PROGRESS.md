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
- [x] **Sessie 4** — Documenten + credentials (ZZP)
- [x] **Sessie 5** — Verificatie (admin) + compliance afronden
- [x] **Sessie 6** — Berichten, notificaties, samenwerkingen
- [x] **Sessie 7** — Facturatie + billing
- [x] **Sessie 8** — Admin-paneel afronden
- [x] **Sessie 9** — Polish, performance, a11y, e2e
- [x] **Sessie 10** — Productie-voorbereiding (code-kant)

---

## Logboek

### Platform Overhaul — Fase 0 + 1 — 2026-05-29
Start van de event-driven overhaul (`prompts/PLATFORM_OVERHAUL.md`). Branch deze sessie:
`claude/modest-babbage-08jYa`.
- **Fase 0 (docs):** `ARCHITECTURE.md` (huidig + event-driven doel), `DECISIONS.md` (besluiten 0A
  hard + 0B open + sessie-besluiten), `WORKFLOW_MAP.md` (event→effect-tabel, Events A–F + zijpaden),
  `DESIGN.md` (UX-principes + open dark-first-keuze), gap-analyse + fasevoortgang in `CURRENT_TASK.md`.
- **Fase 1 (event-laag, getest):** `state-machine.ts` (generieke `defineStateMachine`),
  `lifecycles.ts` (WorkOrder/Contract/Performance/InvoiceLifecycle/Payment), `events.ts`
  (`DomainEventType` + `EventStore` + `InMemoryEventStore`), `event-bus.ts` (`EventBus`, idempotente
  `publish` met handler-claim + self-healing replay), `event-store.ts` (`PrismaEventStore` + singleton).
  Schema: `DomainEvent` (append-only, unieke `dedupeKey`) + `EventHandlerRun`. Tests: 28 nieuw
  (state-machine 7 / lifecycles 14 / event-bus 7). Gate groen: typecheck, lint, test (230), build.
  Idempotentie aangetoond: dubbele publish = één event, handler draait één keer.
### Platform Overhaul — Fase 2 (administratie, additief) — 2026-05-29
Richting met eigenaar afgestemd: **additief naast elkaar** (live Invoice-flow blijft werken,
cutover in Fase 3). Pure administratiemotor, volledig getest zonder DB.
- `config.ts` (BTW-regimes/tarieven in bps, platformfee default UIT, reminder-tijden, DBA-drempels
  + disclaimer, betaalbevestiging) · `administration/vat.ts` (BTW integer-centen) ·
  `administration/numbering.ts` (nummering per uitschrijvende partij, gatenvrij) ·
  `administration/ledger.ts` (dubbel-boekhoud-postings per event C/D/E + creditfactuur, saldo's,
  BTW-positie, sluitcontrole) · `administration/persist.ts` (prisma-schrijvers + transactionele
  nummer-toewijzing).
- Schema additief: `Performance`, `InvoiceSequence`, `AdministrationEntry`; `Invoice` uitgebreid met
  nullable cascade/BTW/partij-velden + unique(issuerKey, partyInvoiceNumber).
- Tests: 24 nieuw (vat 8 / numbering 7 / ledger 9). Gate groen: typecheck, lint, test (254), build.
  Proeftransactie A–E: debiteuren/crediteuren afgeboekt, BTW correct, geen platform-boeking (Besluit 1).
- Volgende: Fase 3 (cascade-handlers op de event-bus) — stop-and-confirm bij cutover live Invoice-UI.

### Platform Overhaul — Fase 3 (hoofdcascade, logica) — 2026-05-29
Cascade A→E als pure planners + transactionele applier, volledig getest zonder DB.
- `cascade/types.ts` (CascadeEffects) · `cascade/handlers.ts` (A/B1/B2/B2′/C/D/D′/E, Event F achter
  flag) · `cascade/apply.ts` (atomaire applier: status + postings + notificaties + audit + nieuwe
  concept-factuur).
- Tests: 16 nieuw (handlers 14 / integratie 2). Integratie dekt hele pad A→E (uurtarief + milestone);
  beide administraties sluiten; geen platform-boeking (Besluit 1). Gate groen: typecheck, lint,
  test (270), build.
- Nog te doen (stop-and-confirm): command-functies (routes/serveracties) die planner+event+apply
  koppelen + factuurnummer-allocatie, dan cutover van de live Invoice/samenwerking-UI. Daarna Fase 4.

### Platform Overhaul — Fase 3 runtime-cutover (command-laag + UI) — 2026-05-29
- `cascade/commands.ts` (signContract, create/submit/approve/rejectPerformance,
  submit/approve/rejectInvoice, confirmPayment) — atomair: DomainEvent + effecten + idempotentie-
  marker in één transactie; factuurnummer per partij via allocator.
- `/samenwerkingen/[id]` werkproces-UI met "Aan zet"-banner en alle rol-acties (additief naast de
  live factuur-flow). Link vanaf de samenwerkingenlijst.
- seed: cascade-demo (voorgestelde samenwerking + ingediende/goedgekeurde prestaties + concept-factuur).
- Geverifieerd met een DB-smoke: hele keten A→E loopt door, administratie sluit, BTW + nummer per
  partij kloppen, geen platform-boeking. Gate groen (typecheck/lint/test 270/build).
- Volgende: Fase 4 (zijpaden + DBA-monitoring); cascade-facturen op /facturen tonen; oude
  factuuraanmaak uitfaseren ná browserverificatie.

### Platform Overhaul — Fase 4 (DBA-monitoring + administratie-overzichten) — 2026-05-29
- `dba-monitor.ts` (pure engine: duur 6/12 mnd, omzetconcentratie, patroon-indicatoren; niveau
  Laag/Verhoogd/Hoog; altijd disclaimer — Besluit 2) + `dba-monitor-task.ts` (geplande runner,
  idempotent via DomainEvent dedupeKey; notificatie bij beide partijen + audit) + POST
  /api/tasks/dba-monitor (CRON_SECRET). Werkproces-UI toont het signaal rustig met disclaimer.
- `administration/overview.ts` (pure: BTW per kwartaal, debiteuren/crediteuren-saldo, jaaromzet) +
  `/administratie`-pagina (ZZP'er/opdrachtgever) met nav-item.
- Tests: 13 nieuw (dba-monitor 9 / overview 4). Gate groen (typecheck/lint/test 283/build).
- Te-late-betaling + aanmaningen: `payment-reminders.ts` (pure) + task + /api/tasks/payment-reminders;
  herinnering 5/1 dag vóór, OVERDUE-transitie + signaal bij beide partijen. Tests: 6.
- Creditfactuur: `planInvoiceCreditedEvent` + `creditInvoice`-command + UI-knop in het werkproces;
  tegenboekingen + BTW-correctie. Tests: +2.
- Dispuut/escalatie: `openDispute`/`resolveDispute`-commands + Collaboration.disputedAt;
  `assertNotDisputed` bevriest alle cascade-commands; admin-notificatie + oplossen; UI in werkproces.
- **Fase 4 afgerond.** Exports (CSV/PDF) verschuiven naar Fase 6. Volgende: Fase 5/6 polish +
  cascade-facturen op /facturen + dashboard "aan zet".

### Platform Overhaul — Fase 5 (koppeling) — 2026-05-29
- Cascade-facturen tonen op `/facturen` met lifecycle-badge + partij-nummer, link naar het werkproces.
- Dashboard "aan zet": cascade-taken (concept-factuur indienen / betaling markeren bij ZZP'er;
  prestaties & facturen goedkeuren bij opdrachtgever) verschijnen in "Vraagt aandacht".
- Gate groen (typecheck/lint/test 291/build). Open in Fase 5: dark-first-keuze (stop-and-confirm).

### Platform Overhaul — nacht-build increments — 2026-05-29/30
- Cascade-factuurdetail (`/facturen/[id]`): lifecycle-badge, partij-nummer, BTW-uitsplitsing, herkomst-blok.
- CSV-export administratie: `administration/csv.ts` (pure) + `GET /api/administratie/export` + knop.
- Cascade-dashboardtaken in geteste pure helpers (`cascade/next-actions.ts`); dashboard gebruikt ze.
- BTW-kwartaal CSV-export; notificatie-categorieën+iconen; zijpad-integratietests (resubmit, credit-
  netting); loading-states; DBA gevoed door Job-indicatoren; admin-disputenoverzicht (/admin/disputen)
  + dashboardsignaal. Tests doorlopend groen (309). Open: e-mailkanaal, PDF-export, Playwright-e2e,
  dark-first-beslissing.

### Platform Overhaul — concept-factuur-reminders (§4 B2) — 2026-05-30
- `concept-invoice-reminders.ts` (pure): herinnert de ZZP'er aan niet-ingediende concept-facturen op
  dag 3 en 7; escaleert daarna naar het platform (admins). `concept-invoice-reminders-task.ts`
  (plan/apply, idempotent via DomainEvent dedupeKey) + `POST /api/tasks/concept-invoice-reminders`.
- Tests: 5 nieuw (325 totaal). Gate groen. Vult de B2-reminder-cascade uit §4 aan.

### Platform Overhaul — §6 run-all, BTW-herinnering, cascade-keten, idempotentie-test — 2026-05-30
- `/api/tasks/run-all`: enkelvoudig cron-eindpunt dat alle vijf geplande taken (expiry, betaling,
  DBA, concept-factuur, BTW-herinnering) achtereenvolgens uitvoert; per-taak fouten breken de rest
  niet af; host hoeft nog maar één cron te configureren.
- `vat-reminder.ts` (pure): kwartaal-BTW-herinnering aan alle actieve ZZP'ers in de laatste 7
  dagen van elk kwartaal; dedupeKey per gebruiker/kwartaal/jaar (idempotent). `vat-reminder-task.ts`
  + `POST /api/tasks/vat-reminder`. `notifications.ts` uitgebreid met VAT_REMINDER en
  INVOICE_DRAFT_ESCALATION.
- `/samenwerkingen/[id]`: cascade-keten (contract → prestatie → factuur → betaling) met
  statusiconen bovenaan; afgeleid van bestaande data, geen extra DB-query.
- `cascade/idempotency.test.ts`: pure-planner determinisme (3 planners) + mock-DB dedupeKey-guard
  (eerste aanroep → transactie; tweede aanroep → early return zonder dubbel effect).
- Tests: 352 (was 328). Gate groen: typecheck/lint/test/build. E2e overgeslagen (geen browser).

### Platform Overhaul — DBA-drempels configureerbaar + onboarding-checklist — 2026-05-30
- `PlatformConfig`-model (schema): singleton-rij met DBA-drempelwaarden (fallback op statische defaults).
- `platform-config.ts`: `getDbaThresholds()` / `saveDbaThresholds()` met DB-fallback.
- `dba-monitor.ts`: `thresholds?`-parameter op `assessCollaborationDba` + `planDbaMonitorRun`
  (bestaande tests ongewijzigd); `dba-monitor-task.ts` laadt drempels uit DB vóór het plannen.
- `/admin/configuratie`: admins kunnen DBA-drempels (eerste/sterk duursignaal, omzetconcentratie%)
  aanpassen via formulier + server action (Zod-validatie, audit).
- Nav: "Configuratie" voor ADMIN met Settings-icoon.
- `onboarding.ts` (pure): 4-stappen-checklist (profiel/certificaat/beschikbaarheid/opdracht) +
  `isOnboardingComplete`. Dashboard-FREELANCER-view toont "Aan de slag"-blok tot alle stappen klaar.
- Tests: +19 (platform-config 10, onboarding 9); totaal 384 groen.
- Gate groen: typecheck/lint/test/build. E2e overgeslagen (geen browser).

### Platform Overhaul — dark mode + cutover-voorbereiding — 2026-05-30
- Dark mode als gebruikerskeuze: `src/lib/theme.ts` (pure, server-safe) + `ThemeProvider` +
  `ThemeToggle`-knop (header + loginpagina); persistentie via cookie; tests (4). DESIGN.md
  en DECISIONS.md bijgewerkt: keuze vastgelegd als "gebruikerskeuze", geen geforceerde dark-first.
- **Cutover-migratiescript** `scripts/migrate-legacy-invoices.mjs` (idempotent, --dry-run):
  vult `lifecycleStatus`, `issuerUserId`, `counterpartyUserId`, `issuerKey`, `partyInvoiceNumber`
  (per-partij doorlopend, chronologisch), `subtotalCents`, `vatCents` en `vatRegime` in op alle
  facturen die vóór de overhaul-cascade zijn aangemaakt. Atomaire transactie; werkt
  `InvoiceSequence` bij. Statusmapping: SENT→SUBMITTED, OVERDUE→OVERDUE, PAID→PROCESSED,
  CANCELLED→CREDITED. BTW-regime EXEMPT (legacy-facturen bevatten geen BTW-splitsing).
  Na migratie zijn alle facturen zichtbaar én actieerbaar in het cascade-werkproces.
- Unit-tests `src/lib/migrate-legacy-invoices.test.ts`: statusmapping + per-partij-nummering
  (chronologisch, gatenvrij, jaar-scheiding). 6 tests.
- **Print/PDF-factuur-styling verbeterd** (`globals.css`): `@page` A4-marges, geforceerd licht
  thema bij afdrukken (ook bij donker thema actief), `max-w-2xl` opgeheven zodat factuur
  pagina-breed is, subtiele kaartborders, leesbare tabelcellen, dempte subtekst.
- Gate groen: typecheck ✓ lint ✓ test 394 ✓ build ✓. E2e overgeslagen (geen browser).

### Meedenk-laag — 2026-05-26
Cohesief, deterministisch "meedenk"-systeem dat rollen ontzorgt; alleen wat belangrijk is /
actie vraagt wordt getoond, complexiteit blijft server-side. Geen nieuwe infra. (De term "AI"
is bewust uit de hele UI, code-commentaren en docs gehouden.)
- **Nav-signalen** (`src/lib/signals.ts` + test): badges op nav-items vanaf elke pagina —
  certificaten (afgewezen/verloopt), kandidaten (nieuwe reacties), opdrachten (concepten),
  verificaties (wachtrij), berichten (ongelezen, 2 begrensde queries, geen N+1). Toon: attention
  (opvallend) vs info (rustig). Render in `sidebar-nav`/`mobile-nav` via `app-shell`.
- **Proactieve matching** (`src/lib/recommendations.ts` + test): "Opdrachten die bij je passen"
  op het ZZP-dashboard, hergebruikt `computeMatchScore`. Begrensde scan, drempel 70.
- **Compliance-ripple** (`src/lib/collaboration-alerts.ts` + test): ontbrekend/verlopen/bijna-
  verlopen vereist certificaat in een lopende samenwerking → gemeld bij opdrachtgever (dashboard +
  kaart) én ZZP'er (kaart met "Bijwerken"). Gedeelde `CREDENTIAL_TYPE_LABEL` naar `credentials.ts`.
- **Aansluiting vóór reageren** (`opdrachten/[id]`): match + per-eis certificaatstatus met
  "Toevoegen"-link voor wat ontbreekt/verlopen is.
- **Geschikte ZZP'ers** (`src/lib/suggestions.ts` + test): spiegelbeeld voor de opdrachtgever bij
  een gepubliceerde opdracht — openbare profielen die passen, met "Bericht sturen" (echt gesprek
  via `startConversationWithFreelancer`).
- **Match per opdracht in de lijst** (`opdrachten` browse): persoonlijke matchscore per kaart.
- **Verificatie-wachttijd** (`admin/verificaties`): dagen-in-wachtrij + amber na 5 dagen.
- **Status-uitleg** (`reacties`): per reactie wat de status betekent en de volgende stap.
- **Verlopen facturen**: dashboard-attentie + nav-badge voor ZZP'er (herinneren) en opdrachtgever
  (betalen) via `overdueInvoiceCount`.
- **Privéprofiel-waarschuwing** (dashboard): meldt dat opdrachtgevers je niet kunnen vinden.
- **Over de opdrachtgever** (`opdrachten/[id]`): bedrijfsinfo voor ZZP'ers.
- **Refactor**: één `scoreJobForFreelancer` in `matching.ts` i.p.v. 5× dezelfde mapping.
- **Railway-deploy**: `Dockerfile`, `railway.json`, `scripts/{use-db-provider,start}.mjs`
  (PostgreSQL in productie, schema-push + seed bij eerste start).
- e2e: `recommendations`, `collaboration-compliance`, `berichten-signal`, `job-fit`,
  `suggested-freelancers`, `browse-match`, `overdue-invoice`, `profile-visibility`, `company-info`
  (+ asserties in `applications`/`verification`). Checks groen: typecheck/lint, 163 unit-tests,
  build, e2e + shots.

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

### Sessie 4 — 2026-05-26
- Wat gedaan: documenten + credentials (ZZP-kant). FREELANCER uploadt certificaten
  (type/titel/uitgever/datums + bewijsstuk via storage-abstractie), bewerkt metadata,
  vraagt verificatie aan (DRAFT/REJECTED/EXPIRED → SUBMITTED via assertTransition), vervangt
  bewijsstuk (reeds beoordeeld → terug naar SUBMITTED), beheert zichtbaarheid (PUBLIC/PRIVATE),
  ziet verificatiehistorie + afwijzingsreden + expiry-indicator. Aparte documenten-pagina
  (upload + privé download). Document-download via ownership-gated route (eigenaar/admin).
  Geverifieerde + openbare credentials verschijnen op het publieke profiel.
- Bestanden:
  - `src/lib/documents.ts` (+ test) — canAccessDocument, documentKindForCredential
  - `src/lib/validation.ts` — credentialSchema, documentSchema (+ tests)
  - `src/app/api/documents/[id]/route.ts` — privé download (ownership, nosniff)
  - `certificaten/{page,actions,credential-form}.tsx`, `nieuw/`, `[id]/bewerken/`
  - `documenten/{page,actions,document-form}.tsx`
  - `components/credentials/credential-status-badge.tsx`; zzp/[id] toont verified certs
  - nav.ts: Documenten + Certificaten op enabled
- Reviewzwerm (3 parallelle agents) + fix-loop:
  - FIX: plan-gating telde ook niet-actieve abonnementen → alleen status ACTIVE telt.
  - FIX: credential-opslag nu atomair ($transaction / nested create); latente bug verholpen
    (document vervangen terwijl status SUBMITTED gooide assertTransition).
  - FIX a11y: zichtbare focus-ring op CheckChip + rol-radio's; CheckChip ontdubbeld.
  - FIX: kandidaten-actions gebruiken de echte Actor; nosniff-headers; logo shrink-0;
    consistente term "certificaat" i.p.v. "credential" in UI.
  - Verificatie-agent: alle fixes correct, geen regressies.
- Tests: 84 unit-tests (documents 3, credential-validatie 3 extra) + 14 e2e groen
  (credential uploaden → verificatie aanvragen, privé-download 200 eigenaar / 403 ander,
  document uploaden/downloaden).
- Checks: typecheck ✓, lint ✓, test ✓ (84), build ✓ (19 routes), e2e ✓ (14, via Edge).
- Visueel gecontroleerd (screenshots 17-19): certificaten (concept + in beoordeling), documenten.
- Volgende stap: Sessie 5 — Admin-verificatiequeue (goedkeuren/afwijzen met verplichte reden,
  expiry-job VERIFIED→EXPIRED). Hierna is de kerndifferentiatie demo-klaar.

### Sessie 5 — 2026-05-26  (MIJLPAAL: kerndifferentiatie demo-klaar)
- Wat gedaan: admin-verificatiequeue + expiry. ADMIN beoordeelt ingediende certificaten
  op `/admin/verificaties`: goedkeuren (→VERIFIED, verifiedAt, CredentialVerification-record,
  VerificationRequest→RESOLVED) en afwijzen (→REJECTED, **reden verplicht** server-side,
  herstelactie voor ZZP'er) via `statusForDecision`. In-app notificatie + audit per beslissing.
  Idempotente expiry-actie zet verlopen VERIFIED → EXPIRED via `expiryTransition`.
  ZZP'er ziet de uitkomst op /certificaten; geverifieerde+openbare certs op publiek profiel;
  compliance (matching.ts) reflecteert VERIFIED+niet-verlopen. Hele keten werkt end-to-end:
  opdracht → reactie → verificatie → compliance.
- Bestanden:
  - `src/app/(protected)/admin/verificaties/{page,actions,expiry-button}.tsx`
  - `src/app/icon.svg` (favicon; loste /favicon.ico 404 op — Next dev "1 Issue")
  - nav.ts: admin Verificaties enabled; auth.config: route-gate /admin → ADMIN
  - audit.ts: `auditData()` zodat audit atomair in een $transaction kan
- Reviewzwerm (2 agents) + fix-loop:
  - FIX (security, defense-in-depth): route-gate `/admin/*` → alleen ADMIN (pagina + actions
    checkten al; nu ook routelaag) + e2e die non-admin-toegang weert.
  - FIX (CLAUDE.md regel 5): audit-regel nu binnen de $transaction van elke beslissing/expiry.
  - FIX (visueel gevonden): geverifieerd certificaat toonde nog "Verificatie aanvragen"
    (VERIFIED→SUBMITTED bestaat in de map voor doc-vervangen, niet als losse actie) →
    knop + server-actie beperkt tot DRAFT/REJECTED/EXPIRED.
- Tests: 84 unit-tests + 17 e2e groen (goedkeuren/afwijzen + reden, expiry→EXPIRED,
  route-gate non-admin, privé-download eigenaar/ander). Console schoon (geen 404/errors).
- Checks: typecheck ✓, lint ✓, test ✓ (84), build ✓ (18 routes), e2e ✓ (17, via Edge).
- Visueel gecontroleerd (screenshots 20-21): admin-queue, ZZP-uitkomst (verified/afgewezen).
- Volgende stap: Sessie 6 — Berichten, notificaties, samenwerkingen.

### Sessie 6 — 2026-05-26
- Wat gedaan: berichten, notificaties, samenwerkingen.
  - **Berichten:** 1-op-1 gesprek (Conversation + ConversationParticipant) tussen CLIENT en
    ZZP'er, gestart vanuit een reactie (`startConversationForApplication`). Thread + composer;
    toegang server-side op deelnemerschap (`isParticipant`); ongelezen-telling (`unreadCount`).
  - **Notificaties:** centrum (`/notificaties`) + ongelezen-bel met badge in de AppShell;
    markeer-als-gelezen (per item + alles). Notificaties bij nieuw bericht, reactie
    geaccepteerd/afgewezen, samenwerking voorgesteld/bijgewerkt — alle ownership-scoped.
  - **Samenwerkingen:** Collaboration met expliciete statusflow (`COLLABORATION_TRANSITIONS`:
    PROPOSED→ACTIVE/CANCELLED, ACTIVE→COMPLETED/CANCELLED), voorgesteld door CLIENT vanuit een
    ACCEPTED reactie, bevestigd/afgerond/geannuleerd door een van beide partijen; audit + notify.
- Bestanden:
  - `src/lib/{messaging,collaborations}.ts` (+ tests), validation.ts (message/collab schemas)
  - `berichten/{page,actions,[id]/page,[id]/message-composer,[id]/mark-read}.tsx`
  - `notificaties/{page,actions}.tsx`; `app-shell.tsx` (bel + telling)
  - `samenwerkingen/{page,actions}.tsx`; `kandidaten/propose-collaboration.tsx`
  - kandidaten: "Bericht sturen" + voorstel/link + notify bij accept/reject (in $transaction)
  - nav.ts + sidebar-nav.tsx: Berichten + Samenwerkingen enabled (nieuw "handshake"-icoon)
- Tests: 91 unit-tests (messaging 5, collaborations 2) + 18 e2e groen (volledige journey:
  reageren → bericht heen/weer → accepteren → samenwerking voorstellen/activeren → notificaties).
- Reviewzwerm (2 agents): security CLEAN (geen IDOR; conversatie/notificatie/samenwerking
  allemaal ownership-/deelnemer-gescoped), correctheid geen bugs. Genoteerd voor later:
  berichtenlijst haalt nu alle messages op (perf → Sessie 9); geen unieke index op
  (conversatie-paar) → theoretische dubbel-aanmaak-race (laag risico).
- Checks: typecheck ✓, lint ✓, test ✓ (91), build ✓ (21 routes), e2e ✓ (18, via Edge).
- Visueel gecontroleerd (screenshots 22-24): berichtenthread, samenwerkingen, notificatiecentrum + bel-badge.
- Volgende stap: Sessie 7 — Facturatie + billing.

### Sessie 7 — 2026-05-26
- Wat gedaan: facturatie + billing.
  - **Facturen (FREELANCER):** opstellen vanuit een ACTIVE/COMPLETED samenwerking (dynamische
    regels: omschrijving/aantal/tarief). Bedragen server-berekend in centen (euro's→centen,
    regel- en totaalbedrag). Concept → versturen (issuedAt + standaard 14 dagen vervaldatum),
    annuleren. Oplopend jaargebonden factuurnummer (uniek). Statusflow via `INVOICE_TRANSITIONS`.
  - **Facturen (CLIENT):** ontvangen facturen, als betaald markeren; OVERDUE server-afgeleid
    (SENT + vervaldatum gepasseerd). Print-vriendelijke detailweergave met regels + totaal.
  - **Abonnement:** plan-overzicht (FREE/PRO/BUSINESS) + huidig plan; (mock) wisselen zonder
    echte betaling. Gating-melding in reageren verwijst naar upgrade.
- Bestanden:
  - `src/lib/invoices.ts` (+ tests: transities, bedragen, isOverdue, nummer, euro's→centen)
  - validation.ts (invoiceLineSchema); `components/invoices/invoice-status-badge.tsx`
  - `facturen/{page,actions,invoice-form,nieuw/page,[id]/page}.tsx`
  - `abonnement/{page,actions}.tsx`; nav + sidebar: Facturen + Abonnement enabled (creditCard-icoon)
  - samenwerkingen: "Factuur opstellen" voor freelancer; gating-melding → upgrade
- Tests: 97 unit-tests (invoices 13) + 20 e2e groen (factuur opstellen→versturen→betaald,
  abonnement upgraden). Reviewzwerm (2 agents): security CLEAN (ownership op alle factuur-
  acties, bedragen server-berekend, abonnement alleen eigen userId). Gefixt: factuurnummer-race
  (P2002-retry i.p.v. crash) + dueAt einde-van-de-dag (niet een dag te vroeg "verlopen").
- Checks: typecheck ✓, lint ✓, test ✓ (97), build ✓ (24 routes), e2e ✓ (20, via Edge).
- Visueel gecontroleerd (screenshots 25-27): factuur opstellen, betaalde factuur, abonnement.
- Volgende stap: Sessie 8 — Admin-paneel afronden (gebruikers, opdrachten, audit log).

### Sessie 8 — 2026-05-26
- Wat gedaan: admin-paneel afgerond.
  - **Gebruikers (`/admin/gebruikers`):** zoeken/filteren (naam/e-mail, rol, status); schorsen/
    activeren via `setUserStatus` met server-side self-guard (`canModerateUser`) + Zod-status +
    notificatie + audit (in $transaction). Rol wordt nooit gewijzigd.
  - **Opdrachten (`/admin/opdrachten`):** alle opdrachten overzien/filteren; `adminCloseJob`
    sluit via de bestaande `assertJobTransition` + audit.
  - **Audit log (`/admin/audit`):** doorzoekbaar (actie/entiteit) + paginatie, read-only, met
    actor-naam en metadata.
- Bestanden:
  - `src/lib/admin.ts` (+ tests: self-guard, suspension-toggle, audit-filters)
  - `admin/{gebruikers,opdrachten,audit}/{page,actions}.tsx`; nav: admin-items enabled
- Tests: 101 unit-tests (admin 6) + 21 e2e groen (admin schorst gebruiker + self-guard,
  sluit opdracht, ziet auditregel). Reviewzwerm: CLEAN — elke admin-actie checkt requireRole,
  self-guard server-side, geen rol-escalatie, filters parameterized, paginatie correct.
- Bekend (productie-securityreview): JWT-strategie betekent dat een net-geschorste gebruiker
  toegang houdt tot de JWT ververst; voor directe lockout zou `currentActor` de status uit de
  DB moeten herlezen. Bewuste trade-off uit Sessie 0.
- Checks: typecheck ✓, lint ✓, test ✓ (101), build ✓ (27 routes), e2e ✓ (21, via Edge).
- Visueel gecontroleerd (screenshots 28-29): gebruikersbeheer, audit log.
- Volgende stap: Sessie 9 — Polish, performance, a11y, e2e.

### Sessie 9 — 2026-05-26
- Wat gedaan: polish, performance, a11y — geen nieuwe features.
  - **Mobiele navigatie (echte gap, gevonden via mobiele browserverificatie):** sidebar was
    `hidden md:flex` zonder mobiel alternatief → géén navigatie op telefoon. Toegevoegd:
    toegankelijke drawer (`role="dialog"` aria-modal, Escape/overlay sluiten, auto-sluiten bij
    routewissel) via `components/mobile-nav.tsx`.
  - **Berichtenlijst perf:** niet meer álle messages laden; laatste bericht via `take:1` +
    ongelezen via goedkope per-conversatie COUNT.
  - **Dashboard:** verouderde Sessie-0-placeholder weg; nu live, ownership-gescopte stats per
    rol (klikbaar) — sluit aan op "dashboard-first" designregel.
  - Console-smoke over álle routes × 3 rollen: 0 errors/404's. `lang="nl"` aanwezig.
- Verifieer→fix-loop (les toegepast): een toegevoegde `(protected)/loading.tsx` bleek
  `notFound()` app-breed naar HTTP 200 te duwen (Suspense-streaming sluit de header te vroeg).
  Gevangen door de jobs-e2e (depubliceren → 404). Bewust teruggedraaid: correcte 404-semantiek
  weegt zwaarder dan een skeleton.
- Tests: 101 unit-tests + 21 e2e groen (incl. mobiel menu in tijdelijke check geverifieerd).
  Reviewzwerm: CLEAN (geen authz-regressie, counts correct, drawer-a11y in orde).
- Checks: typecheck ✓, lint ✓, test ✓ (101), build ✓ (27 routes), e2e ✓ (21, via Edge).
- Visueel gecontroleerd: mobiel menu (screenshot 30), eerdere schermen ongewijzigd.
- Volgende stap: Sessie 10 — Productie-voorbereiding (code-kant).

### Sessie 10 — 2026-05-26  (laatste codesessie)
- Wat gedaan: productie-voorbereiding (code-kant).
  - **S3-storage-driver** achter de bestaande `StorageDriver`-interface (`@aws-sdk/client-s3`,
    lazy import, env-geschakeld via `STORAGE_DRIVER=s3`; lokaal blijft default). Werkt met AWS S3
    én S3-compatible (endpoint/path-style). Credentials via de AWS-provider-chain.
  - **Env-validatie** (`src/lib/env.ts`, Zod) die bij server-boot draait via
    `src/instrumentation.ts` — faalt helder bij ontbrekende/zwakke config (+ unit-tests).
  - **Security headers** (`next.config.mjs`): CSP (strenger in prod, dev-allowances voor HMR),
    nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy, HSTS.
  - **Robuustheid**: `/api/health` (publiek, DB-ping, geen datalek), nette `not-found.tsx` +
    `error.tsx`. `.env.example` uitgebreid met Postgres-switch + S3-vars.
- Tests: 104 unit-tests (env 3) + 21 e2e groen; health + headers geverifieerd (tijdelijke check).
  Reviewzwerm: CLEAN — S3-driver correct, health veilig publiek, CSP breekt prod niet, alleen
  /api/health toegevoegd aan publieke routes. Advies (bewuste trade-offs): CSP `script-src
  'unsafe-inline'` en JWT-staleness bij rol/status-wijziging → voor de menselijke securityreview.
- Checks: typecheck ✓, lint ✓, test ✓ (104), build ✓ (28 routes), e2e ✓ (21, via Edge).

---

## PROJECT COMPLEET (code-kant) — handover

Alle 10 sessies af. De volledige keten werkt end-to-end en is getest:
onboarding → profielen → opdrachten → reacties (match + compliance) → documenten/certificaten →
admin-verificatie → berichten/notificaties/samenwerkingen → facturatie/abonnement → admin-paneel,
met polish + productie-voorbereiding. **104 unit-tests + 21 Playwright-e2e groen**;
typecheck/lint/build groen; console schoon; mobiel + desktop geverifieerd.

### Nog te doen door een mens (NIET door een agent — bewust, zie CLAUDE.md):
1. **Productie-infra**: PostgreSQL provisionen (en `prisma/schema.prisma` datasource provider
   op `postgresql` zetten + migratie draaien), S3-bucket + IAM, mailprovider, domein/HTTPS,
   secrets (`AUTH_SECRET`, DB, AWS) via de hosting-secretstore, backups.
2. **Accounts & betaling**: echte betaalprovider koppelen (Stripe/Mollie) i.p.v. de mock-
   abonnementsflow; betaalmethoden/facturatie-juridisch.
3. **Security-/AVG-review vóór livegang met echte gevoelige documenten** (VOG/diploma's).
   Aandachtspunten uit de reviews: CSP `script-src 'unsafe-inline'` (overweeg nonce-pipeline),
   JWT-staleness bij schorsing/rol-wijziging (overweeg DB-statuscheck in `currentActor` of korte
   token-TTL), rate-limiting op auth/mutaties, pen-test.
4. **E-mail/notificaties**: in-app `Notification` bestaat; echte e-mail/push koppelen.

### Bekende, bewust uitgestelde code-punten (kandidaten voor later):
- Berichten-ongelezen telt per conversatie met een COUNT (prima voor nu; denormaliseren bij schaal).
- SQLite-zoek is hoofdlettergevoelig; op Postgres `mode: "insensitive"` aanzetten.
- Geen unieke index op (jobId, deelnemerspaar) voor conversaties (theoretische dubbel-race).

### Hardening — 2026-05-26 (geleerd van een parallelle Codex-bouw, selectief overgenomen)
- Aanleiding: vergelijking met een andere aanpak (Codex, branch `zzp-production-quality-control-system`).
  Niet klakkeloos overgenomen — alleen wat echt waarde toevoegt en binnen scope past.
- Toegepast (in-scope productie-hardening):
  - **CI/CD ontbrak volledig** → toegevoegd: `.github/workflows/ci.yml` (npm run check: lint +
    typecheck + test + build op elke push/PR) en `security.yml` (npm audit high/critical +
    secret-scan + env-doc-check, ook wekelijks).
  - **`npm run check`** als één commando (lint+typecheck+test+build).
  - **Security-scripts**: `scripts/scan-secrets.sh` (hoog-signaal secret-patronen + geen getrackte
    .env) en `scripts/check-env-docs.mjs` (elke gebruikte `process.env.X` staat in .env.example).
- Bewust NIET overgenomen (scope-creep / andere productrichting):
  - Governance-laag + Wet-DBA-risico-engine: krachtig domein-idee, maar nieuwe scope. **Aanbeveling
    aan eigenaar**: voor zzp-zorg is Wet-DBA-compliance (schijnzelfstandigheid: inbedding, directe
    aansturing, vervangbaarheid, terugkerende patronen) dé differentiator — overweeg dit als
    expliciete volgende epic, deterministic-first (regels beslissen en leggen uit).
  - k6 load/stress + Sentry: zinvol, maar vragen infra/keuze van de eigenaar; genoteerd.
- Sterkten van deze build t.o.v. de vergeleken aanpak (ter info): echte auth (Auth.js + RBAC) en
  persistente DB + audit (Prisma) zijn hier wél gebouwd; docs (PROGRESS/CURRENT_TASK) lopen niet
  achter op de code. Checks: `npm run check` groen (104 unit + build); scan:secrets + check:env OK.

### Design-systeem + ReOS-leerpunten — 2026-05-26 (eigenaar-richting)
- Aanleiding: eigenaar vindt het light Linear-thema mooier en wil het in **tokens** vastgelegd;
  leer ook van de eerdere ReOS-werkplek-UX.
- `design.md` toegevoegd: token-tabel (uit globals.css), statuskleur-mapping, component-contracten,
  layout/a11y/responsive, copy-stijl, **design-acceptatiecriteria**, en een **ReOS-leerpunten**-sectie
  (werkbank-gevoel, dag-context, metric-strip, "Vraagt aandacht", dichte items, split login) vertaald
  naar het light thema — niet de donkere ReOS-look gekopieerd.
- Dashboard herbouwd als werkbank: dag-context-header ("{Rol}-werkplek · datum" + groet + operationele
  samenvatting), klikbare metric-strip, en een **"Vraagt aandacht"-paneel** met echte, deterministische
  uitzonderingen per rol (profiel-compleetheid, afgewezen/verlopen certificaten, nieuwe reacties,
  concept-opdrachten, openstaande verificaties) — reden + volgende actie, geen verzonnen meldingen,
  rustige lege staat. Desktop + mobiel geverifieerd (screenshots 31-32).
- Checks: typecheck ✓, lint ✓, build ✓, e2e ✓ (21). Smoke-admin assert aangepast op de nieuwe header.

### Wet DBA — deterministische compliance — 2026-05-26 (eigenaar-richting: "conform geldende wetgeving")
- Wat gedaan: deterministische schijnzelfstandigheid-check op opdrachten. Regels beslissen en
  leggen uit; **geen black box, geen dode knoppen**. `src/lib/dba.ts` (gewogen indicatoren: gezag/inbedding =
  kern, vrije vervanging/vaste uren = medium, exclusiviteit/duur = licht) → LAAG/MIDDEN/HOOG met
  uitleg per indicator + handelingsadvies. Volledig unit-getest.
- Opdrachtformulier: DBA-sectie met **live preview** (zelfde pure functie client-side, single source).
  Server **herberekent gezaghebbend** bij opslaan en bewaart snapshot (`dbaRisk` + `dbaReasons` JSON +
  de booleans) — client-waarde wordt nooit vertrouwd. Detailpagina toont risico + uitleg + advies
  **alleen aan eigenaar/admin** (niet aan kandidaten). Disclaimer: hulpmiddel, geen juridisch advies.
- Schema: Job uitgebreid met dba*-velden (db push). validation: jobSchema uitgebreid.
- Tests: 111 unit-tests (dba 7) + 22 e2e groen (hoog-risico live + op detail). Reviewzwerm: CLEAN
  (server-gezaghebbend, geen lek naar non-owners, drempels kloppen, JSON-guard).
- Checks: typecheck ✓, lint ✓, build ✓, e2e ✓ (22). Desktop + mobiel-patroon ongewijzigd.
- Aanbeveling vervolg (eigenaar): AVG/privacy-evidence (verwerkingsregister, bewaartermijnen,
  DPIA-light) en modelovereenkomst-koppeling bij HOOG; beide deels mensenwerk.

### ReOS-corpus leerpunten toegepast — 2026-05-26
- Aanleiding: volledige ReOS-planningscorpus gelezen (visie/roadmap/doelgroep/concurrentie,
  RLS-plan, privacy-matrix, DBA-case-log, incident/change templates). Selectief toegepast:
- **DBA-model completer + golden cases:** hun DBA-reviewlog (DBA-001 pass / -002 review / -003
  blocked / -004 zwak ondernemerschap=review) legde een gat bloot — ik miste een ondernemerschap-
  signaal. Toegevoegd: `weakEntrepreneurship` (gewicht 2) in `src/lib/dba.ts`, Job-veld
  `dbaWeakEntrepreneurship`, formulier-checkbox + live preview, en **4 golden-case tests** als
  regressie-anker (LAAG/MIDDEN/HOOG).
- **Negatieve autorisatietests (RLS-intent op app-laag):** `e2e/authorization.spec.ts` — opdrachtgever
  B kan opdracht/concept + bewerk-pagina van A niet zien (404, server-side ownership). Vult de
  bestaande document-403- en /admin-route-gate-tests aan.
- Tests: 113 unit + 23 e2e groen; typecheck/lint/build groen.
- Aanbevelingen genoteerd (eigenaar-keuze, niet zelf verzonnen): AVG-gebruikersrechten +
  verwerkingsregister/bewaartermijnen (privacy-matrix), RLS-first als defense-in-depth op Postgres-
  prod, multi-member-organisaties + subrollen, beschikbaarheid als workflow-stap, audit van
  login/securityevents + IP/UA.

### Increment: AVG-gegevensrechten + audit-hardening — 2026-05-26
- **Inzage/portabiliteit:** `/account` + `/api/account/export` — JSON-export van uitsluitend de
  eigen persoonsgegevens (profiel, credential-metadata, bedrijf, reacties, document-metadata,
  notificaties, eigen berichten); geen documentinhoud, geen data van derden, auth vereist.
- **Recht op verwijdering:** verwijderverzoek (`deletionRequestedAt`) + intrekken; account blijft
  actief tot beheer afhandelt (fiscale bewaarplicht), notificatie naar admins + audit.
- **Audithardening:** login/uitlog/mislukte-login geaudit via Auth.js (USER_LOGIN/LOGOUT/
  LOGIN_FAILED) + **IP/user-agent** (`request-meta.ts`, AuditLog uitgebreid). Account-link in de
  shell-footer.
- Tests: e2e (export 200+JSON, verwijderverzoek/intrekken, admin ziet USER_LOGIN). 25 e2e + units groen.
- Reviewzwerm: CLEAN (geen cross-user-PII-lek, geen hard-delete van fiscale data, geen
  login-enumeratie in de response, bcrypt-short-circuit correct). Checks groen.

### Increment: Beschikbaarheid als workflow-stap — 2026-05-26
- `AvailabilityWindow`-model (periodes met type AVAILABLE/LIMITED/UNAVAILABLE + uren + notitie).
  `/beschikbaarheid` (FREELANCER): periodes toevoegen/verwijderen (ownership + audit).
- `src/lib/availability.ts` (getest): upcomingWindows, currentOrNextAvailable (negeert
  UNAVAILABLE), summarizeAvailability. Samenvatting getoond op het publieke profiel
  (zichtbaarheid-gated) en bij kandidaten (alleen eigen-opdracht-sollicitanten).
- Nav: "Beschikbaarheid" (FREELANCER, calendar-icoon). Tests: 7 unit + e2e (toevoegen/zien/
  verwijderen). 26 e2e + units groen. Reviewzwerm: CLEAN (geen IDOR op delete, geen datalek).

### STATUS: productiewaardig MVP (code-kant) bereikt — 2026-05-26
Na de eigenaar-richtingen (design-tokens, ReOS-werkbank, Wet DBA, AVG, beschikbaarheid) is dit
een productiewaardige MVP voor de NL ZZP-marktplaats: echte auth + RBAC, persistente DB + audit
(incl. login/IP/UA), opdrachten→reacties (match+compliance), documenten/certificaten + admin-
verificatie, berichten/notificaties/samenwerkingen, facturatie/abonnement, admin-paneel,
**Wet DBA-check** (deterministisch + golden cases), **AVG-gegevensrechten**, **beschikbaarheid**,
CI/security-scripts, design-systeem (tokens), mobiel + desktop. ~130 unit-tests + 26 e2e groen;
elke increment ge-reviewd (CLEAN); geen slop, geen dode knoppen.

Bewust NIET in deze MVP (post-MVP epic, eigen sessie): **multi-member-organisaties + subrollen**
(owner/manager/recruiter/viewer). Dit raakt elke ownership-check (Company 1:1 user → org+members)
en is in de referentiedocs zelf nog een open MVP-vraag — een grote, risicovolle refactor die niet
aan het eind van een lange sessie thuishoort. Overige open punten: RLS-first op Postgres-prod,
echte betaalprovider, e-mail, formele security-/AVG-review (mensenwerk).

### Increment: DUO-diplomaverificatie (API-koppeling achter service-grens) — 2026-05-26
- Eerlijke aanpak: er is geen open DUO-lookup-API; de echte route is de **verificatiecode** uit het
  DUO-diplomaregister. Geïmplementeerd achter een schone interface (zoals de S3-driver):
  - `src/lib/services/diploma-verifier.ts` (getest): `DiplomaVerifier` + **MockDiplomaVerifier**
    (deterministisch, valideert alleen het codeformaat, verzint géén diplomagegevens) +
    **DuoDiplomaVerifier** (env-geschakeld `DIPLOMA_VERIFIER=duo`; faalt helder zonder config —
    echte onboarding = mensenwerk). Factory `getDiplomaVerifier()`.
  - Actie `verifyCredentialViaDuo` (FREELANCER, eigen DIPLOMA): bij geldige code wordt de credential
    **systeem-geverifieerd** (bron DUO) via de transitiemap (→ SUBMITTED → VERIFIED), met
    `CredentialVerification{verifierId:null, source:"DUO"}` + audit (IP/UA). Bron MOCK staat
    transparant in de auditregel.
  - UI: DUO-verificatieformulier op niet-geverifieerde diploma's; historie toont "via DUO".
  - Schema: `CredentialVerification.verifierId` nullable + `source` (ADMIN|DUO), SetNull.
- Tests: 5 unit (verifier) + e2e (ongeldige code faalt, geldige code → Geverifieerd). 27 e2e + units groen.
- Reviewzwerm: CLEAN (geen IDOR, transitiemap gerespecteerd, schema niet-breekend, geen fake-data).
- Productie-onboarding (DUO-contract/endpoint/cert) = mensenwerk; idem BIG-register voor zorg (apart).

### Increment: BIG-registerverificatie (zorg-beroepsregistratie) — 2026-05-26
- Zelfde service-grens-patroon als DUO. `src/lib/services/big-verifier.ts` (getest):
  `BigVerifier` + **MockBigVerifier** (valideert alleen het 11-cijferige BIG-nummerformaat,
  verzint geen registratiegegevens) + **BigRegisterVerifier** (env `BIG_VERIFIER=bigregister`;
  faalt helder zonder config — onboarding/webservice = mensenwerk). Factory `getBigVerifier()`.
- Gedeelde helper `applyExternalVerification(source: DUO|BIG)` in certificaten/actions.ts (DRY):
  asserts beide transitiehops (→SUBMITTED→VERIFIED) vóór de transactie; DUO-actie gerefactord,
  `verifyCredentialViaBig` toegevoegd (geldt voor type **Licentie**). `CredentialVerification.source`
  krijgt nu ook "BIG" (String, geen migratie). UI: BIG-formulier op niet-geverifieerde licenties;
  historie toont "via BIG-register".
- Tests: 5 unit (BIG) + e2e (ongeldig nummer faalt, geldig → Geverifieerd). 28 e2e + units groen.
- Reviewzwerm: CLEAN (geen IDOR, DUO-refactor gedragsbehoudend, transitiemap intact, geen fake-data).
- Productie-onboarding BIG-register = mensenwerk (zelfde als DUO).

### Increment: Identiteitsverificatie + zichtbaar vertrouwensniveau — 2026-05-26
- Slimme differentiator: concurrenten verifiëren losse documenten; wij binden **identiteit +
  geverifieerde certificaten** tot één uitlegbaar **trust-signaal** dat opdrachtgevers zien.
- `src/lib/services/identity-verifier.ts` (getest): `IdentityVerifier` + **MockIdentityVerifier**
  (naam-match met account, verzint niets) + **IdinIdentityVerifier** (env `IDENTITY_VERIFIER=idin`;
  faalt helder zonder config — iDIN/eIDAS-onboarding = mensenwerk).
- `src/lib/trust.ts` (getest): `computeTrustLevel` → BASIS/DEELS/VOLLEDIG + reden/ontbrekend.
- `/account`: identiteit verifiëren (eigen account, naam-match) → `identityVerifiedAt` +
  `verifiedLegalName` opgeslagen + audit (IP/UA). Trust-badge op **publiek profiel** en
  **kandidaten** (alleen het niveau, niet de juridische naam). Dashboard-nudge bij geen identiteit.
- Schema: User.identityVerifiedAt + verifiedLegalName.
- Tests: 8 unit (trust+identity) + e2e (mismatch faalt, match slaagt, trust-badge op profiel).
  29 e2e + units groen. Reviewzwerm: één MEDIUM gefixt — kandidaten telde verlopen-maar-VERIFIED
  credentials mee voor trust (inflatie); nu non-expired gefilterd, gelijk aan het publieke profiel.
- E2e-hardening: lokaal `retries: 1` + ruimere timeouts op bericht-bubbels (de zware multi-context
  tests flaken soms op één gedeelde dev-server; een echte bug faalt ook na retry).
- Echte iDIN/eIDAS-koppeling = mensenwerk (zelfde patroon als DUO/BIG).

### Increment: Design-polish-pass — lege/laad/fout-staten + micro-interacties — 2026-05-29
- Orchestrator (Opus) + 3 Sonnet-builders op niet-overlappende paginagroepen (lijst-/admin-/berichten-vlakken).
- **Gedeelde `EmptyState`** (`src/components/ui/empty-state.tsx`): icoon-in-zachte-cirkel + titel +
  omschrijving + optionele actieknop (echte route, geen dode knop). Vervangt overal de ad-hoc
  `text-sm text-muted-foreground`-lege-staten (opdrachten, kandidaten, certificaten, facturen,
  samenwerkingen, reacties, notificaties, berichten (+thread), documenten, beschikbaarheid,
  admin opdrachten/audit/gebruikers/verificaties, profiel, bedrijf).
- **Gedeelde `Skeleton`-primitives** (`src/components/ui/skeleton.tsx`): `Skeleton`,
  `PageHeaderSkeleton`, `ListSkeleton`. Nieuwe route-`loading.tsx` voor de zware lijstroutes;
  dashboard-`loading.tsx` hergebruikt nu de primitive.
- **Micro-interacties** (`globals.css`): `prefers-reduced-motion`-guard (a11y) + subtiele
  `.card-interactive` hover op klikbare lijstrijen (opdrachten/reacties/berichten/facturen).
- **404-semantiek bewaard (les uit Sessie 9 toegepast):** een `loading.tsx` op een segment wikkelt
  ook z'n dynamische kinderen in Suspense → `notFound()` lekt als HTTP 200. Opgevangen door de
  jobs-/authorization-e2e. Oplossing: lijst + `loading.tsx` van segmenten met `notFound()`-kinderen
  (opdrachten, facturen, berichten, certificaten) in een **`(index)` route-group** geplaatst
  (URL ongewijzigd), zodat de Suspense-grens de `[id]`/`bewerken`-zusjes niet meer omvat.
- Checks: typecheck ✓, lint ✓, **192 unit-tests** ✓, build ✓ (31 routes). E2e: jobs + authorization
  weer 404-correct; overige losse failures zijn de bekende multi-context-load-flakiness op de
  gedeelde dev-server (elk slaagt los/na retry). Lokale dev-db opnieuw geseed (schone staat).

### Increment: Geplande verloopdetectie + "verloopt binnenkort"-herinneringen — 2026-05-29
- Orchestrator (Opus) + 2 Sonnet-builders, contract-first op niet-overlappende bestanden
  (pure planner vs. runner/endpoint/env); orchestrator deed schema + integratie + poort.
- **Pure planner** `src/lib/expiry.ts` (+ 10 unit-tests): `planExpiryRun(candidates, now, windowDays)`
  → `toExpire` (VERIFIED + verlopen, via bestaande `expiryTransition`) en `toRemind`
  (VERIFIED, niet verlopen, binnen 30 dagen). **Idempotent**: dedup-anker `expiryReminderFor`
  (de vervaldatum waarvoor al herinnerd is) voorkomt dubbele herinneringen; bij vernieuwing
  (nieuwe `expiresAt`) volgt automatisch een nieuwe herinnering. Lijsten zijn nooit overlappend.
- **Taak-runner** `src/lib/expiry-task.ts`: `runExpiryTask({ actorId, now })` laadt begrensd
  (VERIFIED + `expiresAt ≤ now+30d`), past het plan in één `$transaction` toe (EXPIRED zetten +
  notificaties + herinnering-notificaties + `expiryReminderFor` markeren + audit per batch).
  Eén bron van waarheid voor admin-knop én geplande ingang.
- **Geplande ingang** `POST /api/tasks/expiry`: beveiligd met `CRON_SECRET` (Bearer/`?token=`);
  zonder secret → 503 (nooit per ongeluk open), bij token-mismatch → 401 (lekt niets).
  Middleware-publiek gemaakt (eigen token-guard, geen sessie). `actorId: null` = systeemactie.
  `.github/workflows/expiry-check.yml` roept het dagelijks aan via repo-secrets
  `EXPIRY_TASK_URL` + `CRON_SECRET` (de scheduler-koppeling zelf = mensenwerk).
- **Admin** `runExpiryCheck` gerefactord naar `runExpiryTask`; knop rapporteert nu verlopen
  + herinneringen. Schema: `Credential.expiryReminderFor` (db push). env: `CRON_SECRET` optioneel.
- Checks: typecheck ✓, lint ✓, **202 unit-tests** ✓ (+10 planner), build ✓ (route geregistreerd),
  `check:env` ✓. E2e overgeslagen (geen browser-channel in deze routine-omgeving; net als CI).
- Notificaties verschijnen automatisch in het bestaande notificatiecentrum + bel; signals.ts
  badget bijna-verlopen al. Geen "AI" in teksten/comments/docs.

### Platform Overhaul — Fase 7 hardening (nav-signalen + ORT-tests) — 2026-05-30
- **Nav-signalen cascade** (`signals.ts`): FREELANCER krijgt badge op `/samenwerkingen`
  voor concept-facturen indienen + goedgekeurde facturen betalen; CLIENT voor
  prestaties + facturen goedkeuren. ADMIN krijgt badge op `/admin/disputen` bij open
  disputen. `SignalCounts` uitgebreid met `cascadeWork` + `openDisputes`.
- **ORT-tests**: SATURDAY (+52%), HOLIDAY (+100%) en volledig gemengde dienst (alle 5
  categorieën) toegevoegd aan `ort.test.ts`.
- **Handlers-tests**: lege `ortSegments`-array valt terug op `uren×tarief`; HOLIDAY via
  `performanceSubtotalCents` getest.
- **Validatie-tests**: ORT + periodedatum-combinaties (geldig, start>eind, alleen start).
- Tests: 415 → 426 groen. Gate: typecheck ✓ lint ✓ test ✓ build ✓.
  E2e overgeslagen (geen browser-channel in routine).

### ORT — sector-/klantprofielen (van rekenmotor naar verkoopbaar) — 2026-05-30
- **Config** (`config.ts`): `ORT_SECTORS` (DEFAULT/VVT/GGZ/GHZ/JEUGD) + `ORT_SECTOR_LABEL`
  + `ORT_SECTOR_PROFILES` (toeslag-bps per categorie per zorg-CAO). DEFAULT verwijst naar
  `DEFAULT_ORT_RATES_BPS` (één bron van waarheid). Waarden zijn richtwaarden — per CAO valideren.
- **Resolver** (`ort.ts`): `ortRatesForSector(sector?)` → profiel of DEFAULT-fallback bij
  onbekend/leeg. Server-side waarheid: de samenwerking bepaalt het profiel, niet de client.
- **Schema**: `Collaboration.ortProfile String?` (nullable, additief — db push veilig).
- **Cascade-koppeling**: `PerformanceApprovedCtx.performance.ortRates`; `approvePerformance`
  resolvt `ortProfile` → bps en geeft die mee aan `performanceSubtotalCents`/`ortSubtotalCents`.
- **UI**: sectorkeuze op de samenwerking (opdrachtgever/admin stelt in via `setOrtProfileAction`);
  ORT-uitsplitsing op samenwerking- én factuurpagina rekent met het gekozen sectorprofiel.
- **Tests**: `ortRatesForSector` (bekend/onbekend/leeg, alle profielen dekken 5 categorieën,
  sectorprofiel beïnvloedt subtotaal). Tests: 426 → 430 groen.
  Gate: typecheck ✓ lint ✓ test ✓ build ✓. E2e overgeslagen (geen browser-channel in routine).

### ORT — automatische categorisatie uit diensttijden (geen Excel) — 2026-05-30
- **Dienstmotor** (`shift.ts`): `segmentShift(start, end, opts)` zet een dienst (begin/eind)
  automatisch om in ORT-segmenten (uren per categorie). Loopt de dienst in kwartierstappen door,
  classificeert elk moment en telt per categorie op. Precedentie = **hoogste toeslag wint** (de
  rates uit het sectorprofiel bepalen de keuze, bv. zaterdagnacht → zaterdag of nacht).
- **Feestdagen** (`dutchHolidays(year)`): officiële NL-feestdagen incl. Pasen-afgeleiden
  (Meeus/Jones/Butcher) en Koningsdag-verschuiving bij zondag. Overschrijfbaar per CAO.
- **Tijdvensters** (`config.ts ORT_TIME_WINDOWS`): avond 18:00, nacht 22:00–06:00 — configureerbaar.
- **UI**: dienst-invoer (begin/eind, datetime-local) in `performance-form.tsx`; de server leidt de
  ORT-categorieën af met het sectorprofiel + feestdagen. Handmatige urenverdeling blijft als fallback.
- **Tests**: `shift.test.ts` (14) — dag/avond/nacht over middernacht, weekend/feestdag-precedentie,
  sectorprofiel-precedentie, kwartierresolutie, feestdagberekening. Tests: 430 → 444 groen.
  Gate: typecheck ✓ lint ✓ test ✓ build ✓. E2e overgeslagen (geen browser-channel in routine).
  Let op: tijden in lokale TZ — zet TZ=Europe/Amsterdam in productie.

### ORT — meerdere diensten per urenstaat (week/maand) — 2026-05-30
- **Motor** (`shift.ts`): `segmentShifts(shifts, opts)` aggregeert meerdere diensten tot één set
  ORT-segmenten (gelijke categorieën opgeteld). Een periode met veel diensten → één factuur.
- **UI** (`performance-form.tsx`): meerdere dienstrijen toevoegen/verwijderen (client-side);
  inputs delen `shiftStart`/`shiftEnd`-namen → server leest ze met `getAll` en paart per index.
- **Action**: parseert alle dienstparen, valideert (begin<eind, beide gevuld), bouwt de
  feestdagenset over alle betrokken jaren en aggregeert met het sectorprofiel.
- **Tests**: `segmentShifts` (3) — optellen gelijke categorieën, combineren verschillende, leeg.
  Tests: 444 → 447 groen. Gate: typecheck ✓ lint ✓ test ✓ build ✓.

### ORT — live preview in de urenstaat-form — 2026-05-30
- **`performance-form.tsx`**: dienstrijen zijn nu gecontroleerd (React-state). Terwijl je de
  diensten typt, leidt de form live de ORT-segmenten + subtotaal af met dezelfde motor als de
  server (`segmentShifts` + `computeOrt` + `ortRatesForSector` + `dutchHolidays`). Toont een
  voorbeeldtabel (categorie/uren/toeslag/totaal) zodat de ZZP'er vóór indienen ziet wat klopt
  ("kan ik dit vertrouwen?"). Server blijft de waarheid; de opdrachtgever keurt definitief goed.
- **`page.tsx`**: `rateCents` + `ortProfile` als props doorgegeven aan de form.
- Gate: typecheck ✓ lint ✓ test ✓ build ✓ (447 groen). Geen nieuwe units (UI-preview hergebruikt
  de al-geteste motoren); e2e overgeslagen (geen browser-channel in routine).

### ORT — maatwerk-percentages per klant — 2026-05-30
- **Engine** (`ort.ts`): `parseOrtCustomRates(json)` (valideert 5 categorieën, niet-negatieve
  gehele bps) + `resolveOrtRates({ortProfile, ortCustomRates})` met precedentie
  **maatwerk → sectorprofiel → default**. Eén resolver, overal hergebruikt.
- **Schema**: `Collaboration.ortCustomRates String?` (JSON bps, nullable, additief).
- **UI** (`ort-profile-form.tsx`, client): keuze "Maatwerk" toont 5 percentage-velden (procent →
  bps), voorgevuld uit de huidige maatwerkwaarden; opdrachtgever/admin stelt in (server dwingt af).
- **Threading**: cascade (`approvePerformance`), urenstaat-afleiding (action), én alle
  weergaven (samenwerking-uitsplitsing, factuurpagina, live preview) gebruiken `resolveOrtRates`.
- **Tests**: `parseOrtCustomRates` + `resolveOrtRates` (precedentie/validatie). 447 → 452 groen.
  Gate: typecheck ✓ lint ✓ test ✓ build ✓.

### Onboarding — CSV bulk-import van ZZP'ers & opdrachtgevers — 2026-05-30
- **Pure kern** (`onboarding/import.ts`): eigen RFC4180-achtige CSV-parser (`;`/`,`/tab-autodetectie,
  gequote velden met `""`, BOM, CRLF/LF), kolomherkenning met NL/EN-aliassen, rolherkenning
  (ZZP'er/opdrachtgever-synoniemen), per-rij Zod-validatie met duidelijke meldingen, dubbele
  e-mails binnen het bestand markeren, en een samenvatting. Voorbeeld-CSV-generator.
- **Tijdelijke wachtwoorden** (`onboarding/password.ts`): crypto-random, leesbaar (geen 0/O/1/l/I),
  gegarandeerd elke tekensoort, geschud.
- **Server** (`admin/import/actions.ts`): `previewImport` (dry-run + DB-annotaties: bestaat e-mail
  al, onbekende vaardigheden) en `commitImport` (transactioneel User+profiel+notificatie+audit per
  rij; bestaande overslaan; rol kan nooit ADMIN worden; max 500 rijen; 2 MB-limiet). Voorbeeld-CSV
  via admin-only route. Samenvattende audit `USERS_IMPORTED`.
- **UI** (`admin/import`): twee-staps wizard — upload → controle-overzicht (per rij status
  OK/Let op/Fout/Bestaat al + opmerkingen) → bevestigen → resultaat met eenmalig getoonde
  tijdelijke inloggegevens (kopieerbaar). Link + nav-item bij Gebruikers.
- **Tests**: `import.test.ts` (16: parser, aliassen, rol, validatie, dubbele e-mail, template) +
  `password.test.ts` (4). Gate: typecheck ✓ lint ✓ test ✓ build ✓.
  Vervolg (mensenwerk): e-mail-uitnodiging i.p.v. tijdelijk wachtwoord zodra SMTP staat.
- **Security-review verwerkt** (subagent): (1) **geforceerde wachtwoordwijziging** — geïmporteerde
  accounts krijgen `User.mustChangePassword=true`; middleware blokkeert alle routes behalve
  `/account/wachtwoord` tot de gebruiker zelf een wachtwoord instelt; daarna uitloggen + opnieuw
  inloggen (verse JWT). Vlag door schema → JWT/sessie → `Actor`. Nieuwe wachtwoord-wijzigpagina
  (ook vrijwillig via /account). (2) bcrypt-hashing parallel (`Promise.all`) i.p.v. sequentieel.
  (3) geen interne foutmeldingen naar client (generiek + server-side log). (4) MIME-check
  aangescherpt (`.csv`-extensie leidend). Open (mensenwerk, MENSENWERK §5): privacy-sign-off op de
  one-time-reveal van tijdelijke wachtwoorden vóór livegang.
- Tests totaal: 485 groen (incl. door auto-build toegevoegde diensten-tests).

### ORT — diensten-overzicht + CSV-import voor ZZP'ers — 2026-05-31
- `src/lib/diensten.ts` (query + CSV-export voor ZZP'er-diensten) + `src/lib/diensten.test.ts`
  (13 tests: parseCsvShifts + exportDienstenCsv).
- `/diensten`: overzicht van alle urenstaaten/opleveringen per ZZP'er, statusfilter,
  link naar samenwerking, exportknop.
- `/diensten/importeer` (page + form + actions): CSV-import wizard, ORT-segmentatie per dienst,
  createPerformance + submitPerformance in de cascade-keten.
- `/diensten/export`: CSV-export van alle diensten voor de ZZP'er.
- Tests: +13 (diensten).

### Prestaties-overzicht voor opdrachtgever (rooster per klant) — 2026-05-31
- `src/lib/prestaties.ts` (query + CSV-export voor opdrachtgever) + `src/lib/prestaties.test.ts`
  (10 tests: exportPrestatiesCsv).
- `/prestaties`: overzicht van alle urenstaaten/opleveringen van alle ZZP'ers voor de
  opdrachtgever, statusfilter (ter goedkeuring/goedgekeurd/afgekeurd), "Keuren →"-link,
  exportknop, pending-telling in de header.
- `/prestaties/export`: CSV-export van alle prestaties.
- Nav `pendingPerformances`-signaal: badge op `/prestaties` voor openstaande goedkeuringen.
- Tests: +10 (prestaties).

### Admin platform-statistieken + diensten-import hardening — 2026-05-31
- `src/lib/admin-stats.ts`: pure helpers (`approvalRate`, `sharePercent`, `formatStatsEuro`)
  + `getPlatformStats()` (gebruikers per rol, samenwerkingen per status, prestaties per status,
  facturen cascade/verwerkt/bedrag, verificatie-wachtrij, open disputen).
- `src/lib/admin-stats.test.ts`: 11 unit-tests.
- `/admin/statistieken`: metriek-kaarten per sectie, dispuut-waarschuwingsbanner,
  links naar beheerpagina's. `loading.tsx` aanwezig.
- `nav.ts`: "Statistieken" nav-item voor ADMIN.
- Diensten CSV-import hardening: `MAX_CSV_IMPORT_SIZE = 100` in `diensten.ts`
  (geëxporteerd, getest); server-action weigert > 100 diensten; UI toont het maximum.
- Tests: 505 → 520 groen. Gate: typecheck ✓ lint ✓ test ✓ build ✓.
  E2e overgeslagen (geen browser-channel in routine).

<!-- Kopieer dit blok voor elke nieuwe sessie -->
