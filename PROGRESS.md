# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie. Houd het kort en feitelijk:
> wat is af, welke bestanden, welke tests, wat is de volgende stap.

## feat(notificaties): "terwijl je weg was"-overzicht in het notificatiecentrum (branch `claude/feat-gemist-overzicht`)

Concurrentie-backlog punt 7 (deel 2 van 2): het notificatiecentrum vat ongelezen meldingen samen
die binnenkwamen tussen de vorige en de huidige login. Deel 1 (e-mail-fallback digest) zit in
PR #314; web-push (VAPID) blijft mensenwerk.

- [x] **`prisma/schema.prisma`** — additief nullable `User.previousLoginAt`
- [x] **`src/auth.ts`** — signIn-event schuift `lastLoginAt` → `previousLoginAt` vóór de update
- [x] **`src/lib/missed-notifications.ts`** — pure `missedWhileAway()`: venster (previousLoginAt,
      lastLoginAt], alleen ongelezen, null bij niets te tonen (rustige standaard)
- [x] **`src/lib/missed-notifications.test.ts`** — 8 unit-tests (geen vorige login, venster-
      randwaarden, gelezen telt niet, na-login telt niet, defensief zonder lastLoginAt)
- [x] **`src/app/(protected)/notificaties/page.tsx`** — rustige banner boven de groepen:
      "Terwijl je weg was: N ongelezen meldingen sinds je vorige bezoek op {datum}"
- Gates groen: typecheck ✓, lint ✓, test 1381 ✓ (was 1373), build ✓, prettier ✓

---

## feat(notificaties): e-mail-fallback digest voor ongelezen meldingen (branch `claude/feat-notificatie-digest`)

Concurrentie-backlog punt 7 (deel 1 van 2): wie de app een tijd niet opent, krijgt ongelezen
in-app-notificaties gebundeld per e-mail. Web-push (VAPID) blijft mensenwerk; het "gemist terwijl
je weg was"-overzicht is het volgende increment.

- [x] **`src/lib/notification-digest.ts`** — pure planner: bundelt ongelezen notificaties ouder dan
      24u (`REMINDERS.notificationDigestMinAgeHours`) tot één digest per gebruiker, gegroepeerd per
      categorie (NL-labels, vaste volgorde, max 3 voorbeeldtitels), deterministische `dedupeKey`
- [x] **`src/lib/notification-digest-task.ts`** — runner (plan/apply zoals `runExpiryTask`):
      idempotent via nieuw veld `Notification.digestedAt` (voortgangsmarkering à la
      `expiryReminderFor`) + `DomainEvent.dedupeKey` als vangnet; **slaat over zonder echt
      mailkanaal** (`isMailDeliveryConfigured()`, nieuw in `mail-sender.ts`) omdat e-mail hier het
      enige effect is; cap 500 kandidaten/run
- [x] **`prisma/schema.prisma`** — additief nullable `Notification.digestedAt`
- [x] **`src/lib/notifications.ts`** — `NOTIFICATION_CATEGORY_LABEL` (NL-labels per categorie)
- [x] **`src/lib/services/reminder-emails.ts`** — `buildNotificationDigestEmail` (tekst + HTML)
- [x] **`src/app/api/tasks/run-all/route.ts`** — runner geregistreerd als `notification-digest`
- [x] Tests: 8 planner-tests (`notification-digest.test.ts`) + 8 runner-tests
      (`notification-digest-task.test.ts`: skip-zonder-mailkanaal, drempel, happy path,
      idempotentie, dedupe-vangnet, mailfout-tolerantie)
- Gates groen: typecheck ✓, lint ✓, test 1389 ✓ (was 1373), build ✓, prettier ✓

---

## feat(dba): tarief-drempelwaarschuwing rechtsvermoeden werknemerschap (branch `claude/feat-tariefdrempel`)

- [x] **`RECHTSVERMOEDEN_DREMPEL_CENTS = 3800`** toegevoegd aan `src/lib/config.ts` met broncommentaar (wetsvoorstel VBAR, aangenomen 21-4-2026, drempel €38 prijspeil 2025, verwachte iwt 1-1-2027)
- [x] **`src/lib/rechtsvermoeden.ts`** — pure logica: `assessRateThreshold(rateCents)`, `rechtsvermoedenHint()`, `RECHTSVERMOEDEN_DISCLAIMER`
- [x] **`src/lib/rechtsvermoeden.test.ts`** — 11 unit-tests: onder/op/boven drempel, null-tarief, grenswaarden, hint-inhoud, disclaimer
- [x] **`src/app/(protected)/opdrachten/job-form.tsx`** — live inline hint bij het rateMin-veld (client-side, `warning`-toon, verdwijnt zodra tarief ≥ €38)
- [x] **`src/app/(protected)/opdrachten/[id]/page.tsx`** — statisch signaalblok naast DBA-sectie voor eigenaar/admin als rateMin < €38
- [x] **`src/app/(protected)/samenwerkingen/[id]/page.tsx`** — Card-blok in het Afspraken/DBA-blok voor actieve en voorgestelde samenwerkingen als col.rate < €38
- Alle gates groen: typecheck ✓, lint ✓, 1359 tests ✓ (was 1348), prettier ✓

---

## Legenda

- [x] af en getest
- [~] deels af / in uitvoering
- [ ] nog niet begonnen

---

## Audit T4 — `commands.ts` gesplitst per entiteit (branch `claude/audit-t4-commands-split`)

- [x] **Mechanische splitsing van `src/lib/cascade/commands.ts` (1193 regels) in 6 modules**
  - `commands-shared.ts` (230 regels) — `CascadeError`, `isUniqueDedupeViolation`, `persistEventAndEffects`, `persistInTransaction`, `assertParty`, `assertNotDisputed`, loaders (`loadPerformance`, `loadCascadeInvoice`), e-mailhelpers (`loadCollabMeta`, `collabLink`)
  - `contract-commands.ts` (97 regels) — `signContract` (Event A)
  - `performance-commands.ts` (287 regels) — `createPerformance`, `updatePerformance`, `submitPerformance`, `approvePerformance`, `autoApprovePerformance`, `rejectPerformance` (Events B1/B2/B2')
  - `invoice-commands.ts` (188 regels) — `submitInvoice`, `approveInvoice`, `rejectInvoice`, `creditInvoice` (Events C/D/D')
  - `payment-commands.ts` (78 regels) — `confirmPayment` (Event E)
  - `dispute-commands.ts` (107 regels) — `openDispute`, `resolveDispute` (zijpad escalatie)
  - `commands.ts` (38 regels) — barrel, re-exporteert alles; alle bestaande importpaden werken ongewijzigd
  - Puur mechanische verplaatsing: nul gedragswijzigingen, nul hernoemingen, comments meegenomen
  - Alle gates groen: typecheck ✓, lint ✓, 1306 tests ✓, build ✓, prettier ✓

---

## Betaalgedrag-signaal opdrachtgever (branch `claude/feat-betaalgedrag`)

- [x] **`src/lib/payment-behavior.ts`** — pure functie `computePaymentBehavior()`, bronkeuze `updatedAt` als `paidAt`-proxy gedocumenteerd, tone-grenzen (good/neutral/warning/unknown), sampleSize < 3 = unknown
- [x] **`src/lib/payment-behavior.test.ts`** — 14 unit-tests voor alle grenzen + lege invoer + edge cases
- [x] **`src/lib/data/payment-behavior.ts`** — query `getPaymentBehaviorForCompany()` (laatste 25 betaalde facturen per companyId, via collaboration.companyId)
- [x] **`src/components/jobs/payment-behavior-block.tsx`** — compact blok met badge + statistieken (tone-kleur, avg dagen, % op tijd)
- [x] **`src/app/(protected)/opdrachten/[id]/page.tsx`** — betaalgedrag-blok zichtbaar voor niet-eigenaar FREELANCER
- [x] Checks: typecheck ✓, lint ✓, test ✓ (1362/1362), build ✓, prettier ✓

---

## Audit T5 — logica uit samenwerkingen-pagina extraheren (branch `claude/audit-t5-pagina-extractie`)

- [x] **Extractie pure logica uit `src/app/(protected)/samenwerkingen/[id]/page.tsx`** (935 → 772 regels)
  - `src/lib/cascade/chain-steps.ts` — `buildChainSteps` + types `ChainStep`/`ChainStepStatus` (puur, geen React)
  - `src/lib/cascade/chain-steps.test.ts` — 24 unit-tests voor alle cascade-stappen/toestanden
  - `src/lib/ort.ts` — `parseOrtSegments` toegevoegd (JSON-parse met lege-array-fallback)
  - `src/lib/ort.test.ts` — 3 tests voor `parseOrtSegments` (geldig, ongeldig JSON, null/undefined)
  - `src/components/collaborations/ort-breakdown.tsx` — `OrtBreakdown` JSX-component
  - `PERF_STATUS`/`INV_STATUS` zijn in de page gelaten: worden nergens anders gebruikt, verplaatsen
    zou een bestand-zonder-callers opleveren. Keuze: kleinste, zuiverste resultaat.
  - `STEP_ICON` (React-rendering) blijft in de page conform opdracht.
- [x] Checks: typecheck ✓, lint ✓, test ✓ (1333/1333), prettier ✓

---

## Audit T3 — cursor-paginatie samenwerkingen en documenten (branch `claude/audit-t3-paginatie`)

- [x] **Gedeelde pagination-helper** `src/lib/pagination.ts` — `pageArgs()`, `splitPage()`, `getPageSize()` (env `LIST_PAGE_SIZE`, default 50). 11 unit-tests in `pagination.test.ts`.
- [x] **Samenwerkingen paginatie** `src/app/(protected)/samenwerkingen/page.tsx` — `take: 100` verwijderd, cursor-paginatie via `?cursor=`, `orderBy: [updatedAt desc, id desc]`, "Meer laden"-link (RSC).
- [x] **Documenten paginatie** `src/app/(protected)/documenten/page.tsx` — zelfde aanpak, `orderBy: [createdAt desc, id desc]`.
- [x] **Vangrail** `src/lib/unbounded-queries.test.ts` — scant `src/app/**` op `findMany()` zonder `take:` of `pageArgs`-spread; volledige allowlist met redenen (56 uitzonderingen gedocumenteerd).
- [x] **Env-documentatie** `.env.example` — `LIST_PAGE_SIZE` gedocumenteerd.
- [x] **CI** `.github/workflows/ci.yml` — `LIST_PAGE_SIZE: "5"` in e2e-job-env.
- [x] **E2e-spec** `e2e/paginatie.spec.ts` — defensief geschreven (seed heeft max. 2 documenten / 1 samenwerking per gebruiker, dus "Meer laden" verschijnt niet met default seed). Cursor-URL-navigatie zonder fout getest.
- Checks: typecheck ✓ · lint ✓ · test 133 files / 1321 tests ✓ · prettier ✓ · check:env ✓

---

## Audit T1 — unit-tests voor alle cron-task-runners (branch `claude/audit-t1-cron-tests`)

- [x] **Unit-tests voor alle 9 cron-task-runners** — 51 nieuwe tests (+ 4 runner-tests uitgebreid in `performance-grace-task.test.ts`)
  - `expiry-task.test.ts` — 5 tests: verlopen, herinnering, dedup, mix, leeg. Functies: 100%
  - `payment-reminders-task.test.ts` — 4 tests: leeg, OVERDUE-markering, dedup, null-candidates. Functies: 80%
  - `dba-monitor-task.test.ts` — 5 tests: leeg, HOOG-signaal, dedup, recent, omzetconcentratie. Functies: 100%
  - `concept-invoice-reminders-task.test.ts` — 6 tests: leeg, dag 3, dag 7, escalatie, dedup, geen dag. Functies: 100%
  - `vat-reminder-task.test.ts` — 4 tests: leeg, buiten venster, happy path 2 ZZP'ers, dedup. Functies: 100%
  - `job-alerts-task.test.ts` — 6 tests: leeg, geen profielen, happy path, dedup, al gealert, credentials. Functies: 100%
  - `past-due-task.test.ts` — 6 tests: leeg, dag 1, dag 3, downgrade, dedup, geen herinneringsdag. Functies: 100%
  - `zzp-membership-task.test.ts` — 6 tests: leeg, 1 ZZP'er, 2 ZZP'ers, dedup, 2× run, buiten maand. Functies: 100%
  - `performance-grace-task.test.ts` (uitgebreid) — 4 runner-tests + 6 bestaande pure tests. Functies: 100%
  - **Coverage:** functies per runner ≥ 80% (totaal 95,65%). Zie coveragetabel in commit-body.
  - `MENSENWERK.md` bijgewerkt met §10 over ontbrekende productie-cron voor `/api/tasks/run-all`.

---

## WORKSPACE OVERHAUL (`prompts/WORKSPACE_OVERHAUL.md`) — dashboards → command center

- [x] **Fase 1 — pure helpers + unit-tests** (branch `feat/workspace-overhaul`, PR #69)
  - [x] A) `src/lib/cascade/stage.ts` — `cascadeStage()`: fase/voortgang (stap N/6)/wie-aan-zet/CTA
        per samenwerking, viewer-bewust. 14 tests (`stage.test.ts`).
  - [x] C) `src/lib/next-actions.ts` — `messagesAwaitingReply` voor freelancer + client (band 55);
        dashboard hergebruikt `unreadConversationCount` uit `signals.ts` (nu geëxporteerd). +4 tests.
        (Legitimatie/VOG-expiry valt al onder `expiringCredentials`; geen apart identiteit-expiry-veld.)
  - [x] B) `src/lib/week-overview.ts` — `weekOverview()`: deterministisch weekoverzicht (ISO-week UTC,
        timing-classificatie, sortering per opdrachtgever). 10 tests. Geen per-dag-rooster (geen
        schema-veld) → echt "ma bij A, wo bij B" vergt ADR + schema-uitbreiding (Fase 6).
- [ ] **Fase 2 — FREELANCER-dashboard → drie zones** (loopt/aandacht/oppakken; tone + voortgang tonen).
- [ ] **Fase 3 — CLIENT** · [ ] **Fase 4 — ADMIN** · [ ] **Fase 5 — zijbalk** ·
      [ ] **Fase 6 — weekoverzicht-UI (+ evt. ADR/schema)**.

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
  - nav.ts: /profiel + /bedrijf op enabled; auth.config: /register + /zzp/\* publiek
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

### Sessie 5 — 2026-05-26 (MIJLPAAL: kerndifferentiatie demo-klaar)

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

### Sessie 10 — 2026-05-26 (laatste codesessie)

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
- Schema: Job uitgebreid met dba\*-velden (db push). validation: jobSchema uitgebreid.
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
  - herinneringen. Schema: `Credential.expiryReminderFor` (db push). env: `CRON_SECRET` optioneel.
- Checks: typecheck ✓, lint ✓, **202 unit-tests** ✓ (+10 planner), build ✓ (route geregistreerd),
  `check:env` ✓. E2e overgeslagen (geen browser-channel in deze routine-omgeving; net als CI).
- Notificaties verschijnen automatisch in het bestaande notificatiecentrum + bel; signals.ts
  badget bijna-verlopen al. Geen "AI" in teksten/comments/docs.

- **Audit QW3 — interim-cap lijstqueries:** `take: 100` op de vier onbegrensde
  collaboration-/document-`findMany`'s (dashboard ×2, samenwerkingen, documenten) als vangnet
  tegen onbegrensde groei; echte cursor-paginatie volgt in audit-taak T3.
- **Audit T2 — applier-transactietest:** nieuwe `src/lib/cascade/apply.test.ts` (5 tests) met een
  geïnjecteerde fake `TransactionClient`: B2-pakket (factuur+status+postings+notificatie+audit),
  tabel-dispatch per entiteit, terugrol bij gelijktijdige statuswijziging (count ≠ 1), lege
  effecten, occurredAt-default. `apply.ts` van 0% naar 100% statements / 83% branches.
- **Audit QW1 — afhankelijkheden schoon:** `next` ^15.5.19 (in-range) + `overrides.postcss =
"$postcss"` zodat de geneste postcss 8.4.31 in next dedupliceert naar de top-level 8.5.15
  (GHSA-qx2v-qp2m-jg93, vereist ≥ 8.5.10). `npm audit`: 2 moderate → **0 vulnerabilities**.

- **Audit T7 — Prisma-config-migratie:** `package.json#prisma` (deprecated, weg in Prisma 7) →
  `prisma.config.ts` (`defineConfig` met schema + `migrations.seed`). dotenv expliciet geladen
  (CLI slaat .env-loading over mét configbestand); `prisma.config.ts` meegekopieerd naar de
  runtime-image (Dockerfile) zodat de boot-seed zijn commando blijft vinden. Lokaal geverifieerd:
  generate zonder deprecation, `db push` en `db seed` werken.

- **Prijsadvies + concurrentie-backlog:** `docs/PRIJSADVIES.md` vastgelegd (4 prijslijnen:
  zzp-abo €24,95/actieve mnd, opdrachtgever €1,75/uur, tenant €12,50/actieve zzp'er/mnd,
  optionele factoring 2,5% — eigenaar: factoring is geen harde nee meer) met omzetscenario's
  200/500/1.000/3.000 zzp'ers en geverifieerde concurrent-benchmarks. Acht-punten
  concurrentie-backlog toegevoegd aan CURRENT_TASK.md; punt 1 en 2 parallel in uitvoering.

<!-- Kopieer dit blok voor elke nieuwe sessie -->
