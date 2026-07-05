# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## HANDOFF — operationele stand (lees dit eerst)

- **Live:** test-URL `zzp-platform-production-ba07.up.railway.app`. Demo-accounts (wachtwoord
  `demo1234`): `opdrachtgever@`, `zzp@` (Sanne), `admin@zzp-platform.local`.
- **Deploy:** Railway bouwt/deployt de **default branch `main`** automatisch (Dockerfile).
  `scripts/start.mjs` doet bij elke boot `prisma db push` + **seed (idempotent)** → de rijke demo-
  inhoud staat er altijd (7 ZZP'ers met certificaten, 6 opdrachten + concept, reacties in alle
  statussen, 2 samenwerkingen, 4 facturen incl. verlopen).
- **Workflow (main-flow):** korte feature-branches (`feat/...`, `fix/...`, `docs/...`) → **PR naar
  `main`** → na de poort (CI groen, geverifieerd via `gh pr checks <nr>`) mergen → Railway deployt
  `main`. **Altijd `git fetch` + rebase vóór commit én push.** Geen losse langlevende epic-/deploy-
  branches meer; `main` is de bron van waarheid en de deploy-branch tegelijk.
- **24/7-bouw:** Routine **"ZZP auto-build"** in Claude Code on the web (claude.ai/code/routines),
  **elke 4 uur** (cadans verlaagd 15-6 i.v.m. Opus-belasting). Orchestrator én builder/tester-subagents
  op **Opus 4.8** (15-6; zie `.claude/agents/*`). Draait op het Claude Max-abonnement (OAuth), geen
  per-token-API-kosten. Naast de auto-build draait de routine **"ZZP persona-sweep"** dagelijks
  (07:00 lokaal, Opus 4.8): test het systeem als kritische gebruiker per rol op **(1) werkt het
  zoals het hoort** en **(2) stress/adversarieel — gaten zoeken door dingen te doen die niet mogen**
  (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden statusovergangen,
  malicieuze input, 404-vs-500). Levert een gaten-backlog in `docs/PERSONA-SWEEP-BACKLOG.md` via een
  PR (merget niet zelf). Canonieke prompt: [`docs/PERSONA-SWEEP-PROMPT.md`](docs/PERSONA-SWEEP-PROMPT.md).
  Routine-runs leveren een **PR naar `main`** op. `ANTHROPIC_API_KEY`-secret staat in GitHub. (De
  GitHub-Actions-cron `auto-build.yml` bestaat ook, maar is onbewezen vanuit de sessie — de Routine
  is de gekozen route.) _(Linear wordt niet meer gebruikt — sinds 14-6.)_
  - **Canonieke routine-prompt:** [`docs/ROUTINE-PROMPT.md`](docs/ROUTINE-PROMPT.md) — plak die in
    het Instructions-veld op claude.ai. Bevat de verse-branch-start + PR-eind; bij een
    promptwijziging: diff tegen dat bestand.
  - **Verse branch per run (instellen in de routine-prompt):** zet het git-blok uit
    **CLAUDE.md §3a punt 1+3** letterlijk bovenaan de routine-prompt op claude.ai
    (`git reset --hard` + `git checkout -b "feat/auto-$(date +%Y%m%d-%H%M%S)-$RANDOM" origin/main`
    → werk → rebase → push → `gh pr create --base main`). Dit maakt "vers vanaf main per run"
    deterministisch en de branchnaam collision-proof voor parallelle agents. Zonder deze
    promptregel hervat de routine de sessie-branch en stapelt het werk (les 13-14 juni).
  - **Vangnet auto-PR (sinds 14-6, `auto-pr-claude.yml`):** als de routine tóch alléén naar haar
    sessie-branch `claude/<naam>` pusht zonder zelf een PR te openen, opent deze workflow er
    automatisch één naar `main` (idempotent). Zo blijft routine-werk nooit meer hangen op de
    sessie-branch (les van 13-14 juni: 24 commits + AVG-blockers op `claude/dazzling-carson-v9Qwk`
    zonder PR — geborgen in PR #360; daarna de branch gereset naar main). De workflow **merget
    niet**: de poort (ci/security op de push, pr-review + mens) beoordeelt en merget. Repo-instelling
    "Allow GitHub Actions to create and approve pull requests" staat AAN (sinds 14-6).
- **Vóór échte productie (mensenwerk, zie MENSENWERK.md):** juridisch/AVG-review (blokkeert livegang
  met echte gevoelige documenten), betalingen (Stripe/Mollie), echte verificatie-API's (DUO/BIG/iDIN
  — nu demo), e-mail, S3-documentopslag, eigen domein. Code is hierop voorbereid.

---

## STATUS: PLATFORM OVERHAUL — event-driven cascade (`prompts/PLATFORM_OVERHAUL.md`)

Grote, gefaseerde verbouwing naar een event-driven systeem met de volledige facturatie- en
administratiecascade. Bron van waarheid: `prompts/PLATFORM_OVERHAUL.md` (§0A besluiten hard,
§0B open). Werkdocumenten: `ARCHITECTURE.md`, `DECISIONS.md`, `WORKFLOW_MAP.md`, `DESIGN.md`.

> **Branch-flow:** werk op een korte feature-branch en lever een **PR naar `main`**. De overhaul is
> inmiddels volledig op `main` gemerged en live (geen aparte deploy-branch meer).

### Fasevoortgang

- [x] **Fase 0 — Inventarisatie & fundering.** Docs aangemaakt (ARCHITECTURE/DECISIONS/
      WORKFLOW_MAP/DESIGN), gap-analyse hieronder, Fase 1 voorgesteld.
- [x] **Fase 1 — Event-bus, state machines, event store.** Zie verslag onder.
- [x] **Fase 2 — Datamodel administratie & administratiemotor** (additief). Zie verslag onder.
- [x] **Fase 3 — Hoofdcascade (Events A–E)** — logica + applier + command-laag + UI
      (`/samenwerkingen/[id]`) + demo-seed; end-to-end geverifieerd tegen de DB. Zie verslag.
- [x] **Fase 4 — Zijpaden & DBA-monitoring** — DBA-monitoring ✓, administratie-overzichten ✓,
      te-late-betaling/aanmaningen ✓, creditfactuur ✓, dispuut/escalatie (cascade-freeze) ✓.
      (Exports CSV/PDF horen bij Fase 6.)
- [x] **Fase 5 — Rol-workspaces & UX/UI** — werkproces-UI, cascade op /facturen + dashboard
      "aan zet", cascade-factuurdetail, admin-disputenoverzicht, dark mode als gebruikerskeuze
      (toggle in header + loginpagina; DESIGN.md + DECISIONS.md bijgewerkt).
- [x] **Fase 6 — Notificaties, reminders, exports** — reminder-engines (expiry/betaling/DBA/
      concept-factuur), CSV-exports (grootboek + BTW), jaaroverzicht/IB, notificatie-categorieën,
      print/PDF-factuur + A4-styling, e-mailkanaal-abstractie (MailSender). Open (mensenwerk):
      SMTP-koppeling productie.
- [x] **Fase 7 — Hardening & end-to-end** — zijpad-integratietests ✓, loading-states ✓,
      cutover-migratiescript ✓ (legacy-facturen → cascade-velden; getest, idempotent),
      nav-signalen cascade ✓ (cascadeWork + openDisputes + pendingPerformances),
      ORT-categorietests ✓ (SATURDAY/HOLIDAY/gemengd), validatietests periodedata ✓,
      diensten-overzicht ZZP'er + CSV-import ✓, prestaties-overzicht opdrachtgever ✓,
      diensten-/prestaties-exports ✓, admin platform-statistieken (/admin/statistieken) ✓,
      diensten-import MAX_CSV_IMPORT_SIZE hardening ✓.
      Open: Playwright-e2e (interactieve sessie mét browser).

### 24/7-bouw actief — coördinatie (lees dit, auto-build-agent)

Meerdere agents pushen via PR's naar `main`; **altijd `git fetch` + rebase vóór commit én push**.
Kies een increment dat **niet overlapt** met de laatste commits. Houd PR's klein (100–300 regels).

**Branch-discipline (hard, zie CLAUDE.md 3a — les van 11-6-2026):** verse branch vanaf
`origin/main` per run (nooit een sessie-branch hervatten); overlap-check vóór het bouwen
(`gh pr list` + main-log + PROGRESS.md-top); **een run zonder PR is een mislukte run** — de
nachtroutine bouwde tweemaal duplicaatwerk op een verzamelbranch zonder PR en dat werk is
weggegooid. Gemergde branches worden automatisch verwijderd (repo-setting aan sinds 11-6-2026).

### Deploy-afspraak: de cutover is gebeurd — `main` is live

De overhaul is volledig naar `main` gemerged en Railway deployt `main`. **Er is geen aparte deploy-
branch meer**; elke gemergde PR gaat na de poort automatisch live. De cutover-checklist hieronder is
historie (afgevinkt waar van toepassing).

**Definition of Done (wanneer is de overhaul "klaar" — bron: PLATFORM_OVERHAUL.md §9):**
cascade A–E + verplichte goedkeuring (B) + alle zijpaden werken end-to-end (uurtarief én milestone);
beide administraties kloppen (BTW, nummering per partij, onveranderlijkheid); DBA signaleert met
disclaimer; fee-module bestaat en staat default UIT; UX consistent + toegankelijk; **dark-first-keuze
gemaakt** (DESIGN.md); unit + integratie groen, build groen; docs bij.

**Cutover-checklist (UITVOEREN als bovenstaande klaar is — vraag eigenaar bij twijfel):**

1. [x] Dark-first-beslissing verwerkt (toggle + DESIGN.md + DECISIONS.md).
2. [x] Migratiescript getest (`scripts/migrate-legacy-invoices.mjs --dry-run` + live run +
       idempotentiecheck). Werkt op SQLite; testen op een Postgres-kopie = aanbevolen vóór prod.
3. [ ] **e2e in een interactieve sessie mét browser** (cascade-flow A→E, migrated invoices in
       werkproces, PDF-afdruk). Kan niet in CI/routine.
4. [x] Overhaul naar **`main`** gemerged; Railway deployt `main` (default branch). Geen aparte
       deploy-branch meer.
5. [ ] **Juridisch/AVG-review** (MENSENWERK) vóór livegang met echte gevoelige documenten.

**ORT / zorg — voortgang (zorgbureau zonder Excel, doel september):**

- [x] ORT-rekenmotor (`ort.ts`) + cascade-koppeling + handmatige urenverdeling-UI.
- [x] ORT sector-/klantprofielen (`config.ts ORT_SECTOR_PROFILES`, VVT/GGZ/GHZ/JEUGD + maatwerk
      via `Collaboration.ortProfile`); resolver `ortRatesForSector`; selector op de samenwerking.
- [x] Automatische ORT-categorisatie uit diensttijden (`shift.ts segmentShift`) +
      NL-feestdagen (`dutchHolidays`) + tijdvensters (`ORT_TIME_WINDOWS`).
- [x] Meerdere diensten per urenstaat (`segmentShifts`) + dynamische dienstrijen-UI.
- [x] Live ORT-preview in de form (afgeleide segmenten + subtotaal vóór indienen).
- [x] Maatwerk-percentages per klant (eigen bps die het sectorprofiel overschrijven).
- [x] **Onboarding-import (CSV)**: ZZP'ers + opdrachtgevers in bulk met dry-run preview, validatie,
      transactionele aanmaak + audit, tijdelijke wachtwoorden. (`/admin/import`)
- [x] **Diensten-overzicht + CSV-import** (`/diensten`, `/diensten/importeer`): ZZP'er importeert
      diensten via CSV → ORT-segmentatie → cascade createPerformance + submitPerformance.
- [x] **Prestaties-overzicht voor opdrachtgever** (`/prestaties`): rooster/diensten per klant,
      "Keuren →"-link, CSV-export.
- [x] **Admin platform-statistieken** (`/admin/statistieken`): live metriek-kaarten (gebruikers,
      samenwerkingen, prestaties, facturen, verificaties, disputen).
- [ ] **Volgende stappen (mensenwerk/browser):** e-mail-uitnodiging i.p.v. tijdelijk wachtwoord
      (SMTP); Playwright e2e; cutover (Railway).

### Audit-backlog (Fable-audit op `main` — VOLLEDIG AFGEROND 12-6-2026)

> Bron: principal-audit op `main`. Gezondheid **B+**, nul Critical/High security. Echte
> zwaktes = onderhoudbaarheid + schaal, niet veiligheid. **Niet aankomen behalve voor tests:**
> planner/applier-split, authz-chain, document-privacy, domeinmotor (matching/cascade/administration).
> Beantwoorde auditvragen: deploy-branch = **`main`**; e2e blijft **advisory** (niet blocking);
> cron-call-shape = `runXxxTask({ actorId: null })` via `POST /api/tasks/run-all` achter
> `Bearer $CRON_SECRET`.

**M0/M1 — gemerged (niet opnieuw doen):**

- [x] **T1 — cron-task unit-tests** (#301): 51 tests over 9 runners, idempotentie + lege state,
      geïnjecteerde klok. _Open noot:_ `run-all` heeft nog geen prod-cron (host-config = mensenwerk;
      alleen `expiry-check.yml` is gewired).
- [x] **T2 — `apply.ts` transactietest** (#299): atomaire write geverifieerd; 0% → ~100%.
- [x] **QW3 — interim list-cap** (#298): `take: 100` op dashboard/samenwerkingen/documenten.
- [x] **QW1 — `next` → 15.5.19 + postcss-override** (#300): `npm audit` 2 moderate → **0**.

**M2 — gemerged (niet opnieuw doen):**

1. [x] **T3 — cursor-paginatie** (#307 + #354): samenwerkingen + documenten cursor-gepagineerd
       ("Meer laden", `lib/pagination.ts`, vangrail-test); dashboard-zone "Wat loopt er nu"
       bewust begrensd tot top-6 (`lib/running-zone.ts`, `updatedAt desc`) + overloop-tegel
       met totaaltelling die doorverwijst naar de gepagineerde lijst.
2. [x] **T4 — split `cascade/commands.ts`** (#305): 1193 r. → 6 modules
       (`commands-shared` / `contract-` / `performance-` / `invoice-` / `payment-` /
       `dispute-commands.ts`) + barrel in `commands.ts`; importpaden ongewijzigd, nul
       gedragswijziging.
3. [x] **T5 — extract pagina-logica**: `buildChainSteps` → `cascade/chain-steps.ts` (24 tests),
       `parseOrtSegments` → `lib/ort.ts`, `OrtBreakdown` → component. Pagina 935 → 772 r.
       (inmiddels weer ~790 door nieuwe features — acceptabel).

**M3 — gemerged:**

4. [x] **T7 — Prisma-config-migratie**: `package.json#prisma` → `prisma.config.ts`
       (`defineConfig`, dotenv expliciet, meegekopieerd in de Docker-image).
       Resterend uit M3: **L4** (post-guard `!`-asserts) alleen meenemen als je toch in die
       bestanden zit; **L3 — afgerond** (ZZP2-186: `parseLanguages` 6× gededupliceerd naar
       `src/lib/parse-languages.ts` + `parseLanguagesText`, 7 tests); **T6 (e2e blocking) —
       overslaan** tot de suite stabiel-groen is.

> **NIET nu doen (auditadvies):** Prisma 7 / Next 16 / Tailwind 4 majors (opt-in, geen pre-launch-
> payoff, regressierisico); CSP-nonce-pipeline (`'unsafe-inline'` gedocumenteerd acceptabel pre-prod,
> herzien vóór livegang met echte documenten); Redis-rate-limit-store (interface al pluggbaar, pas
> bij multi-instance).

---

**PLAN-WERELDKLASSE Fase 2 — voortgang:** **Weekrooster als kalenderstrip (ZZP2-194, commit
`7f71870`)** af — `week-strip.ts` `buildWeekStrip` + `WeekStripView` op de dashboard-zone "Wat loopt
er nu" (ma–zo dienstblokken i.p.v. platte badges). Matchredenen op kaarten: **opdracht-kaart
(ZZP2-188) én kandidaten-kaart af** (de kandidaten-kaart toont al de volledige troef/minpunt-redenen
in "Waarom deze match?"). **Terminologie-ADR (ZZP2-195) af** — canoniek begrippenkader in
`docs/decisions/0008-terminologie-ia.md` + `src/lib/terminology.ts` (`TERM`/`TERM_PLURAL`/`term()`),
`nav.ts` gewired (gedragsbehoudend) met vangrail-test tegen drift; overloads Opdracht↔Dienst en
Reactie↔Kandidaat opgelost. Open in Fase 2: lege-/laad-/fouttoestanden naar Vakwerk-stijl.

**PLAN-WERELDKLASSE Fase 3 — voortgang (`docs/PLAN-WERELDKLASSE.md`):** Tariefinzicht (ZZP2-184),
portable vertrouwensdossier (#313), **Flexpool/favorieten slice 1 (ZZP2-187, commit `c59f8d7`)** én
**Flexpool slice 2 (ZZP2-192) — nieuwe dienst eerst naar de pool routeren ("eerst eigen mensen"):
`pool-routing.ts` `planPoolInvites` + wiring in `changeJobStatus` bij de eerste publicatie + eigenaar-
noot** af. Beoordelingen = **GEDAAN** (#384, 15-6): tweezijdig met double-blind reveal (simultane
onthulling tegen vergelding) — zie PROGRESS.md-top. **Rooster-marktplaats slice 1
(discovery)** af — `roster-market.ts` `buildRosterCalendar` + read-only `/rooster`-agenda van open
diensten met startdatum, per dag, met matchscore. Open Fase 3: de **publiceer-/claim-kant** van de
Rooster-marktplaats (opdrachtgever dateert losse diensten; ZZP'er claimt direct vanuit de kalender).

### Review-should-fixes nachtbatch #367–#372 (15-6-2026 — geen blockers, opportunistisch)

> Uit de adversariële reviews van de 6 gemergde nachtfeatures. Geen van alle een blocker; pak ze
> mee wanneer je toch in het betreffende bestand zit, of als losse kleine PR.
> **Stand 15-6:** #367/#368/#372 GEDAAN (review-should-fixes deel 2, deze PR). #369 (PR #387) +
> #370 (PR #383) in-flight. **#371 open** — bewust overgeslagen (geen jsdom/testing-library, Vitest
> op `node`; een render-test zou een infra-wijziging vergen die niet in verhouding staat).

- [x] **#367 betrouwbaarheidssignaal** (`lib/client-reliability.ts`): defensieve guard zodat `completed`
      geen rij telt die óók een client-annulering is (`status==="COMPLETED" && !(byClient && cancelledAt)`);
      en in `lib/data/client-reliability.ts`: geef `unknown` terug als `company` null is i.p.v. een te
      positief signaal. **GEDAAN** (15-6, +2 tests).
- [x] **#368 rooster sterke-match** (`rooster/page.tsx`): toon een nette "geen sterke matches"-melding
      wanneer `?match=sterk` handmatig actief is maar `strongCalendar.total === 0` (nu valt het stil terug).
      **GEDAAN** (15-6).
- **#369 markttarief-band** — **GEDAAN** (15-6, PR voor #369): `MarketBand` heeft nu `p25Raw`/`p75Raw`
  (niet-afgerond); `JobRateBandCard` gebruikt die voor `ratePosition` → grensclassificatie consistent met
  `/profiel/bewerken`. _(AVG art.6-bevestiging AFGEROND 15-6: eigenaar koos
  gerechtvaardigd belang (1f); vastgelegd als verwerkingsactiviteit "markttarief-indicatie" in
  `lib/compliance/processing-register.ts` met k-anonimiteit (≥10) als waarborg.)_
- ~~**#370 verificatie-wachtrij**~~ **AFGEROND** — dedicated `submittedAt DateTime?` op `Credential`
  (eenmalig gezet bij → SUBMITTED) i.p.v. `updatedAt` voor de wachtrij-leeftijd; composite index
  `@@index([status, submittedAt])`; `waitingSince`-fallback voor legacy-records; gewired in
  `/admin/verificaties` + `admin-stats.ts`; seed-spreiding. Zie PROGRESS.md top.
- **#371 vervalkalender** (`components/credentials/expiry-overview-card.tsx`): component-test voor
  `ExpiryOverviewCard` (render/labels/empty). _(De misleidende labels zijn al gefixt bij merge.)_
- [x] **#372 betaalverplichtingen** (`verplichtingen/page.tsx`): scope op `counterpartyUserId` + de
      bestaande `@@index([counterpartyUserId, lifecycleStatus])` i.p.v. de 3-way join; en vang
      OVERDUE-items zónder `dueAt` op die nu door de `take: 200` + `nulls: last` kunnen wegvallen.
      **GEDAAN** (15-6, begrensd vangnet + dedup op id).

### QA-loop — gequarantainede test (15-6-2026)

De QA-loop (`qa.yml`, post-merge op main) is gehard: **`--workers=1` per shard** (parallelle
workers tegen één SQLite-db gaven write-lock-contentie + kruisbesmetting → flaky CI-rood, o.a. de
franchise-robuustheidstest die lokaal serieel wél slaagt). **Eén test in quarantaine:**

- [ ] **`e2e/qa/lifecycle.spec.ts` (volledige cascade) — `test.fixme`.** Hangt structureel op de
      "samenwerking voorstellen"-stap; server-action werpt geen fout (server-log schoon), komt niet
      verder, óók serieel — dus geen parallellisme/SQLite-contentie. Vergt interactieve
      trace-debugging (network/console uit de Playwright-trace, headed reproductie). Kernlogica is al
      gedekt door groene integratietests (`src/lib/cascade/apply.test.ts`, `handlers.test.ts`).
      Haal de `test.fixme()` weg zodra de voorstel-hang gefixt is.
- [ ] **2 resterende flaky tests** (slagen op retry, dus loop blijft groen — geen blocker):
      `critical-personas.spec.ts:111` (franchise onbestaand-id → 404; soms 200 op eerste poging) en
      `support.spec.ts:53` (admin-helpdesk; login-timing). De-flaken wanneer er tijd is (robuustere
      waits / notFound-zekerheid); `retries: 2` absorbeert ze nu.

> Resultaat 15-6: volledige QA-suite lokaal **58 passed, 2 skipped (quarantaine), 2 flaky→pass**,
> exit 0. Was: chronisch rood (25+ runs zonder succes).

**Geprioriteerde backlog (bovenste eerst; pak er één, lever DoD-groen, push):**

> Gedaan (niet opnieuw): **CSP-violatie-rapportage-endpoint (prod-rijpheid, PR #624)** — de al
> gedeployde CSP stuurt nu violatie-rapporten naar `/api/csp-report` via `report-to`
> (Reporting-Endpoints-header) + `report-uri`-fallback. Pure `src/lib/observability/csp-report.ts`
> `parseCspReport` (legacy + moderne vorm → PII-arme `NormalizedCspViolation`: document→pad,
> blocked/source→origin, referrer/UA/policy weg, sample afgekapt, max 10); publieke rate-limited
> POST-route (altijd 204, body-cap 16 KB, `cspReportRateLimiter` 30/min/IP), `isPublicPath` +
> `Reporting-Endpoints`-header in de middleware. Levert de observability om injectie te zien én de
> policy later te verstrakken (`'unsafe-inline'`-scriptfallback laten vallen). 39 nieuwe tests, geen
> schemawijziging. Rest = mensenwerk (optioneel monitoren; MENSENWERK §0b).

> Gedaan (niet opnieuw): **Vacaturetempo-kaart voor de opdrachtgever op /opdrachten/[id]** — pure
> `lib/job-vacancy-performance.ts` `summarizeVacancyPerformance` (dagen open, reacties/week, eerste
> reactie, momentum, pace strong/steady/slow/cold met dezelfde koud-drempels als `job-engagement.ts`,
> verse opdracht terughoudend) + `JobVacancyPerformanceCard` boven `JobReachCard` (eigenaar, PUBLISHED).
> Toont de doorlooptijd/snelheid die bereik (`job-reach`) en pijplijn (`job-pipeline`) niet dekken; de
> on-screen tegenhanger van de notificatie-only `job-engagement.ts`. Begrensde reactie-scan (`take:500`),
> geen schemawijziging, geen kandidaatgegevens gelekt; 8 unit-tests.

> Gedaan (niet opnieuw): **Abonnement-periode-vervalcyclus (prod-rijpheid, PR #608)** — na een
> eenmalige Mollie-betaling vervalt een betaald abonnement nu echt. Pure `subscription-lifecycle.ts`
> (`isSubscriptionActive` + `planSubscriptionExpiry`, renewal-herinneringen dag 7/1, per-periode
> dedupeKey); `entitlement-guard.ts` telt een verlopen betaalde periode direct als FREE (server-side
> waarheid, óók vóór de taak draait); `subscription-expiry-task.ts` zet verlopen abonnementen idempotent
> op CANCELLED (→ Gratis) met renewal-notificaties + audit, gewired in `/api/tasks/run-all`. Demo/gratis
> (`currentPeriodEnd=null`) ongewijzigd perpetueel. 28 unit-tests; geen schemawijziging. Rest = mensenwerk
> (Mollie-key; recurring-mandaat als vervolgstap).

> Gedaan (niet opnieuw): **Match-ranking bij voordragen uit roster (bemiddelaar)** (PR #601) — de
> FRANCHISER-voordrachtlijst op `/franchise/diensten/[id]` toonde alleen inzetbaarheid, ongesorteerd
> (`createdAt`). Nu gerangschikt op matchscore voor déze dienst via de bestaande `scoreJobForFreelancer`:
> pure `buildRosterCandidates` (matchScore + troef/minpunt, INACTIEF onderaan, tiebreak op naam),
> `getRosterCandidatesForDienst` laadt de match-velden en delegeert; `voordragen.tsx` toont "Match NN" +
> troef/minpunt-regel (spiegel van de Reacties-lijst en `/kandidaten`). 5 unit-tests; read-only, geen
> schemawijziging, geen extra query.

> Gedaan (niet opnieuw): **Prod-rijpheid — global-error boundary + health-probe hardening + runbook**
> (PR #600) — `src/app/global-error.tsx` (root-error-boundary, laatste vangnet buiten `error.tsx`,
> eigen `<html>/<body>` + inline-stijlen, `reset`/harde-navigatie/`digest`); `/api/health` met
> `force-dynamic` (liveness nooit gecachet — gate't de seed in `start.mjs`) + DB-storing via de
> observability-reporter; pure kern `src/lib/observability/health.ts` (`buildHealthPayload`/
> `healthHttpStatus`/`shortCommit`, 8 tests); `docs/RUNBOOK.md` (deploy/rollback/back-up-herstel/
> incident/secrets-rotatie/monitoring) + MENSENWERK.md §11. Geen schemawijziging.

> Gedaan (niet opnieuw): **Beschikbaarheid-op-startdatum-signaal voor de opdrachtgever** — pure
> `availability.ts` `availabilityOnDate(windows,date)` (`AVAILABLE|LIMITED|UNAVAILABLE|NONE`, één bron voor de
> inclusieve-einddatum-logica, UNAVAILABLE domineert een overlappend inzetbaar venster) + `candidate-availability.ts`
> `classifyStartFit(windows,jobStart)` (`available|limited|blocked|none|unknown`; `unknown` bij geen startdatum óf geen
> gedeelde agenda) + label/short-label/variant-maps. Op `/kandidaten` een badge "Startdatum <datum>: Beschikbaar/Niet
> beschikbaar/…" bij de agenda-regel; op `/kandidaten/vergelijk` toont de "Beschikbaarheid"-rij de start-fit met de datum
> in de rij-hint (val terug op "Agenda gedeeld" zonder startdatum). Antwoordt "kan deze kandidaat starten wanneer ik hem
> nodig heb?" — vertaalt de beschikbaar-voor-de-shift-datum van Pidz/Temper/Zorgwerk naar onze gedeelde vensters.
> Afgeleid uit de reeds opgehaalde `availabilityWindows` (geen extra query), read-only, geen schemawijziging; 19
> unit-tests. PR #590.

> Gedaan (niet opnieuw): **Productie-cron voor `/api/tasks/run-all`** (MENSENWERK §10, code-kant) —
> `.github/workflows/run-all-tasks.yml` roept dagelijks (05:00 UTC) het beveiligde run-all-endpoint aan
> met `Authorization: Bearer $CRON_SECRET`, zodat alle 16 taakrunners idempotent draaien i.p.v. alleen
> handmatig (voorheen was enkel `expiry-check.yml` = één taak gewired). Inert zonder secrets (skip zonder
> falen), `concurrency`-guard, faalt bij HTTP≠200 én bij `ok:false` in de body (jq). Resterend mensenwerk:
> repo-secrets `RUN_ALL_TASK_URL` + `CRON_SECRET`. Geen code-/schemawijziging. PR #581.

> Gedaan (niet opnieuw): **Opdracht dupliceren (opdrachtgever)** — pure `lib/job-duplicate.ts`
> `buildJobDuplicateInitial`/`duplicateJobTitle` (bron→`JobFormInitial` zonder `id`, lege startDate,
> "(kopie)"-titel met dubbel-suffix-guard + inkorten tot `JOB_TITLE_MAX=160`; 12 tests) + `/opdrachten/nieuw?from=<id>`
> met server-side ownership-poort (niet-eigen `from` → stil leeg formulier) + "Dupliceren"-knop op de
> opdracht-detail (eigenaar). Linear/Stripe/GitHub-friction-reducer: terugkerend werk plaatsen zonder
> opnieuw te typen; kopie start altijd als vers concept (geen reacties/status/startdatum-lek). PR #551.

> Gedaan (niet opnieuw): **Wachttijd-signaal per reactie voor de ZZP'er op `/reacties`** — pure
> `lib/application-wait.ts` `summarizeApplicationWait({status,createdAt,hasCollaboration},now)` →
> `{daysWaiting,stage,attention}` voor nog-onbesliste reacties (NEW/VIEWED/SHORTLIST), `null` bij
> besloten/samenwerking; fase-bewuste drempels `WAIT_ATTENTION_DAYS` (7/14/21 dagen);
> `countApplicationsAwaitingAttention` voor de strip. `WaitSignal`-component toont alleen op
> aandacht een rustige warning-regel + deeplink "Bekijk andere opdrachten"; strip boven de lijst met
> de telling. Afgeleid uit onveranderlijke `createdAt` + status (geen `updatedAt`, geen extra query,
> geen schemawijziging); 7 unit-tests. PR #545.
>
> Gedaan (niet opnieuw): **"Beslis nu"-signaal per kandidaat (opdrachtgever) op `/kandidaten`** — pure
> `lib/candidate-decision.ts` `summarizeCandidateDecision`/`summarizeCandidatesAwaitingDecision`
> (kwaliteitsgewogen: `STRONG_MATCH_MIN=70`/`MODERATE_MATCH_MIN=50`, omgekeerd geduld
> `DECISION_PATIENCE_DAYS` strong 2 / moderate 4 / modest 8 dagen, urgency high/medium/low; `null` bij
> besloten/samenwerking; toekomstige `createdAt`→0; 11 tests) + tellende warning-strip ("N wachten op je
> beslissing, waaronder M sterke matches die je elders kunt verliezen") + per-kaart nudge bij `attention`.
> Vertaalt de "binnen uren"-liquiditeit van Pidz/Temper naar onze verklaarbare kant; spiegel van het
> ZZP'er-wachttijdsignaal (#545) maar gewogen naar matchkwaliteit. Afgeleid uit de reeds opgehaalde lijst
> (geen extra query), geen schemawijziging. PR #549.
>
> Gedaan (niet opnieuw): **Kandidaten-vergelijking per opdracht (opdrachtgever)** — pure
> `lib/candidate-compare.ts` `buildCandidateComparison`/`pickUniqueBest` (uniek-beste per dimensie:
> match/scherpste tarief/vertrouwen/compliance/leverbetrouwbaarheid; gelijkspel → geen winnaar; <2 →
> geen winnaars; 11 tests) + CLIENT-only `/kandidaten/vergelijk?job=<id>` (ownership-poort →
> `notFound`, actieve reacties `take:8`, hergebruikt trust/compliance/delivery/availability-motoren,
> tabel met trofee-uitlichting) + "vergelijken"-chip per opdracht met ≥2 actieve reacties op
> `/kandidaten` (afgeleid, geen extra query). Read-only, geen schemawijziging. PR #543.
>
> Gedaan (niet opnieuw): **Reactie-pijplijn per opdracht voor de opdrachtgever op `/opdrachten`** —
> pure `lib/job-pipeline.ts` `summarizeJobPipeline(statuses)` (`total`/`newCount`/`viewed`/`shortlist`/
> `accepted`/`rejected`/`needsAttention`; WITHDRAWN telt niet mee, `needsAttention` bij NEW>0; 5 tests)
>
> - `JobPipelineStrip` op de opdrachtgever-kaart die nieuwe (nog niet bekeken) reacties uitlicht
>   ("N nieuw"-chip) i.p.v. de kale `_count`-regel. Beantwoordt "welke opdracht vraagt nu actie?" op het
>   overzicht. Per-status telling via één `application.groupBy({ by:["jobId","status"] })` gescopet op
>   `company.userId` (geen N+1); read-only, geen schemawijziging. PR #541.
>   Gedaan (niet opnieuw): **Presigned S3 download-URLs in de storage-abstractie** (prod-rijpheid) —
>   `StorageDriver.getSignedDownloadUrl(key, opts)`: S3-driver levert kortlevende presigned GET-URLs
>   via `@aws-sdk/s3-request-presigner` (lazy import, `ResponseContentType`/`-Disposition`-overrides),
>   lokale driver geeft `null` → caller streamt (pilot ongewijzigd). Pure helpers `resolveSignedUrlTtl`
>   (geklemd [30,3600], default 300, env `STORAGE_S3_URL_TTL`) + `buildContentDisposition`. Gewired in
>   de niet-gevoelige logo-route (`/api/media/[...key]`, 302-redirect bij S3). De gevoelige
>   `/api/documents/[id]` blijft bewust server-streamen + sandbox-CSP (audit: document-privacy niet
>   aanraken buiten tests) — presigned daar is een seam na security-review. 22 tests (storage +
>   media-route); geen schemawijziging. PR #540.
>   Gedaan (niet opnieuw): **Verwachte-betaaldatum per openstaande ZZP-factuur** — pure
>   `lib/invoice-payment-forecast.ts` `forecastInvoicePayout({ issuedAt, dueAt, avgDaysToPay,
sampleSize })`: genoeg betaalhistorie van deze opdrachtgever (≥3 betaalde facturen) → `issuedAt +
avgDaysToPay` (basis `history`/`confident`), anders terugval op de vervaldatum. Beantwoordt de #1
>   cashflow-vraag "wanneer krijg ik mijn geld?" — refinement bovenop `invoice-due` (contractuele
>   deadline). In `facturen-panel.tsx` alleen voor de ZZP'er, betaalgedrag per opdrachtgever uit de
>   **eigen** betaalde facturen via `computePaymentBehavior` (privacy, geen extra query); rustige
>   muted-regel alleen bij betrouwbare historie. 7 unit-tests; read-only, geen schemawijziging. PR #537.
>   Gedaan (niet opnieuw): **Kans-/concurrentiesignaal voor de ZZP'er op /opdrachten/[id]** — pure
>   `lib/job-competition.ts` `summarizeJobCompetition({ applicantCount, myScore })` (+ helpers
>   `competitionLevel`/`chanceLevel`): concurrentieniveau (low/moderate/high op 3/8 reacties) × kansniveau
>   uit de eigen matchscore (strong/fair/longshot op 70/50) → kop, sturingstip en `urgent`-vlag; nul-reacties
>   = "Wees de eerste"-nudge. `JobCompetitionCard` op de "Jouw aansluiting"-sectie (niet-eigenaar FREELANCER,
>   PUBLISHED, nog niet gereageerd); server-side telling via begrensde `application.count` (WITHDRAWN telt
>   niet mee), toont nooit gegevens van andere kandidaten. Spiegelbeeld van het bereiksignaal (`job-reach`),
>   vertaalt de "binnen uren"-liquiditeit van Temper/Pidz/Zorgwerk naar onze verklaarbare matching. 15
>   unit-tests; read-only, geen schemawijziging. PR #536.
>   Gedaan (niet opnieuw): **Bereik-signaal voor de opdrachtgever op /opdrachten/[id]** — pure
>   `lib/job-reach.ts` `summarizeJobReach` (buckets total≥50 / strong≥70 / available / strongAvailable
>   → niveau good/moderate/low + sturingstip; 10 tests) + server-fetcher `lib/data/job-reach.ts`
>   `getJobReach` (begrensde tenant-gescopete scan via `discoverableFreelancerWhere`, sluit reeds-
>   reagerenden/WITHDRAWN uit, scoort met `scoreJobForFreelancer`) + `JobReachCard` (eigenaar, PUBLISHED).
>   Hoeveel passende, vindbare ZZP'ers bereikt deze opdracht en hoeveel zijn nu beschikbaar — vertaalt de
>   "auto-uitnodiging binnen uren"-liquiditeit van Pidz/Zorgwerk naar onze verklaarbare matching. Geen
>   schemawijziging, server-side waarheid. PR #534.
>   Gedaan (niet opnieuw): **Tariefpassendheid-signaal op /kandidaten** — `lib/rate-fit.ts`
>   `classifyProposedRateFit(proposedRate, rateMin, rateMax)` (puur: within/below/above/unknown, grenzen
>   inclusief, plafond vóór bodem, één grens volstaat) + budgetpassendheid-badge naast het tariefvoorstel
>   op de kandidatenkaart (Binnen/Onder/Boven budget). Vult het gat dat de matchreden het profiel-
>   `hourlyRate` gebruikt i.p.v. de `proposedRate` van de reactie. Read-only, geen schemawijziging, geen
>   extra query; 9 unit-tests. PR #516.
>   Gedaan (niet opnieuw): **FRANCHISER nav-signalen (overdue leads + open shift-overnames)** —
>   `signals.ts` FRANCHISER-tak (was `return {}`): tenant-gescopete attention-badges `overdueLeads`
>   → `/franchise/leads` (actieve leads KOUD/WARM met `nextFollowUp` < vandaag, UTC-dag) en
>   `openHandoffs` → `/franchise/shift-overnames` (OPEN `ShiftHandoff` via `collaboration.job.tenantId`);
>   pure `startOfUtcDay`; +6 tests; geen schemawijziging, twee begrensde counts.
>   Gedaan (niet opnieuw): **Statusfilter op het opdrachtgever-overzicht `/opdrachten`** — pure
>   `lib/job-status-filter.ts` (`parseJobStatusFilter`/`filterJobsByStatus`/`summarizeJobStatusGroups`)
>
> * filter-pills (Alle/Concept/Gepubliceerd/Gesloten met tellingen) op `ClientJobs`, spiegel van het
>   #474/#475/#477-pill-patroon; read-only, geen schemawijziging, geen extra query, 12 unit-tests. PR #488.
>   Gedaan (niet opnieuw): **Bewaarde opdrachten voor de ZZP'er (`/opgeslagen`)** — `SavedJob`-model
>   (anker op `FreelancerProfile`, additief), pure `lib/saved-jobs.ts` `partitionSavedJobs` (open vs.
>   niet-meer-beschikbaar), `toggleSavedJob`-action (auth → rol → profiel-anker → `visibleJobsWhere` →
>   mutatie + audit `JOB_SAVED`/`JOB_UNSAVED`), bewaar-knop op de opdracht-detail, `/opgeslagen`-
>   overzicht + nav-item (bookmark) + demo-seed (Sanne 2 open + 1 DRAFT). Spiegelbeeld van de Flexpool
>   (opdrachtgever→ZZP'er). 7 unit-tests; PR #479.
>   Gedaan (niet opnieuw): **Sorteeropties op de ZZP'er-browse (`/freelancers`, opdrachtgever)** — pure
>   `sortFreelancers` in `lib/freelancer-search.ts` (relevance/available/trust/track-record/rate-asc/
>   rate-desc) over de reeds server-berekende kaartdata + sorteer-`Select` in `freelancer-browse.tsx`;
>   deterministische naam→id-tiebreaker, "geen tarief" altijd achteraan, muteert de invoer niet; +8
>   unit-tests; read-only, geen schemawijziging, geen extra query.
>   Gedaan (niet opnieuw): **ZZP'er kan eigen reactie intrekken (WITHDRAWN)** — nieuwe
>   `APPLICATION_STATUSES`-waarde `WITHDRAWN` + pure `canWithdrawApplication` (alleen NEW/VIEWED/
>   SHORTLIST, geen samenwerking); freelancer-only `withdrawApplication` server-action op `/reacties`
>   (ownership + audit `APPLICATION_WITHDRAWN` + notificatie naar de opdrachtgever). Re-apply hergebruikt
>   de bestaande rij (geen extra plan-slot); WITHDRAWN uitgesloten in outcomes-samenvatting,
>   reactiebereidheid-signaal, "Gereageerd"-badge (rooster), aanbevelingen en kandidaat-suggesties; nette
>   noot op `/kandidaten`. Geen schemawijziging; +9 unit-tests. Zie PROGRESS.md-top.
>   Gedaan (niet opnieuw): **Certificaat-impact op lopende inzet (ZZP'er)** — `freelancer-compliance.ts`
>   `linkExpiryToInzet` koppelt de vervalkalender (`summarizeExpiry`) aan de actieve samenwerkingen wier
>   verplichte certificaattypen een (bijna-)vervallend certificaat raakt; `data/freelancer-compliance.ts`
>   `getActiveCollaborationRequirements` (freelancer-gescopet, take:200) levert de data; `InzetImpactCard`
>   op `/certificaten` toont dagaftelling + vernieuw-deeplink + geraakte inzetten. Mirror van de bestaande
>   opdrachtgever-`clientCredentialAlerts`/compliance-momentopname; read-only, geen schemawijziging.
>   11 unit-tests.
>   Gedaan (niet opnieuw): **Job-engagement-signaal (koude opdracht) voor de opdrachtgever** —
>   `lib/job-engagement.ts` `planJobEngagement` (pure) + `lib/job-engagement-task.ts`
>   `runJobEngagementTask` (plan/apply, idempotent via DomainEvent `job-cold:<jobId>`, gewired in
>   `run-all`): waarschuwt de opdrachtgever wanneer een gepubliceerde opdracht ≥7 dagen open staat met
>   <3 reacties (spiegel van `job-alerts`). `JOB_COLD`-notificatie (system/attention) in de bestaande
>   meldingenlijst, linkt naar de opdracht; 16 unit-tests; geen schemawijziging, geen geldstroom.
>   Gedaan (niet opnieuw): **Reactie-uitkomsten samenvatting op `/reacties`** — pure
>   `summarizeApplicationOutcomes` (`lib/application-outcomes.ts`, 11 tests) + `OutcomesSummary`-strip
>   (Verstuurd/Bekeken/Op shortlist/Geaccepteerd) met responspercentage + acceptatiegraad
>   (drempel `APPLICATION_OUTCOME_MIN_SAMPLE = 4`, anders geen misleidende "100%"); read-only,
>   geen schemawijziging, geen extra query.
>   Gedaan (niet opnieuw): **Matchredenen op de opdracht-kaart** (`/opdrachten`, Linear ZZP2-188) —
>   troef (`topPositiveReason`) én minpunt (`topGapReason`) onder elke kaart; uitlegbaarheid uit de
>   bestaande matchmotor, geen extra query. Sluit een deel van `docs/PLAN-WERELDKLASSE.md` Fase 2
>   "Matchredenen zichtbaar maken op kaarten" af (kandidaten-kaart blijft open).
>   NB: tariefinzicht (Fase 3) was op deze branch al gebouwd (ZZP2-184, `lib/market-rate.ts`).
>   Gedaan (niet opnieuw): **Markttarief-band op het opdracht-formulier** — `computeMarketBand` +
>   `ratePosition` in `lib/market-rate.ts`, `lib/data/job-rate-bands.ts`, `JobRateBandCard` op
>   `/opdrachten/nieuw` + `/opdrachten/[id]/bewerken`; geanonimiseerde band per branche met
>   opdrachtgever-positie op het minimumtarief (spiegel van de ZZP'er-marktband). Geen schemawijziging.

> Reeds gedaan (niet opnieuw): reactiebereidheid-signaal opdrachtgever op /opdrachten/[id]
> (`client-responsiveness.ts` `computeClientResponsiveness` + `data/client-responsiveness.ts` +
> `ClientResponsivenessBlock`): derde opdrachtgever-vertrouwenssignaal naast betaalgedrag en
> annuleringsgedrag — pakt de opdrachtgever binnengekomen reacties op of laat hij ze op `NEW` liggen?
> Deterministisch uit onveranderlijke `Application.createdAt` + huidige `status`; toon good/neutral/
> warning/unknown (steekproef ≥ 3, stale-grens 14 dagen); read-only, geaggregeerd, geen
> schemawijziging; 10 unit-tests.

0. **Bergings-backlog uit de branch-sanering** — zie `docs/BRANCH-SANERING-2026-06-11.md`.
   **VOLLEDIG GEBORGEN (12-6-2026):** afronden-rem, CSV-injectie-hardening, rol-fallback
   boekhouding, AVG-verwerkingsregister (#334), KvK-/BTW-validatie (#335),
   beschikbaarheidsconflicten (#336), CLIENT-dashboard "wat kan ik oppakken" (#337),
   iCal-export (#338), dispuut-triage (#339), inkomstenprognose (`feat/inkomstenprognose`).
   Tweezijdige beoordelingen — **GEDAAN (#384, 15-6)**: double-blind reveal (simultane onthulling),
   niet langer geparkeerd. Niets meer open uit deze bergings-backlog.
1. Playwright e2e voor de cascade-flow (interactieve sessie mét browser vereist) — sla over in
   routines, doe in een interactieve sessie mét browser-channel.
2. Postgres-smoke van het migratiescript (optioneel, aanbevolen vóór cutover) — draai
   `migrate-legacy-invoices.mjs` op een Postgres-kopie van de demo-DB.
3. Cutover zelf uitvoeren (Railway + branch-switch + seed-verify) — mensenwerk of expliciete
   sessie mét browser.

> Reeds gedaan (niet opnieuw): disputen-gezondheid op /admin/statistieken
> (`lib/disputes.ts` — `DisputeHealth` + pure `disputeUrgentThreshold(now)` voor een goedkope
> URGENT-count; `admin-stats.ts` `openDisputes` → `disputes: DisputeHealth` via begrensde
> findFirst+count; nieuwe "Disputen"-sectie met 3 gezondheidskaarten (Open / Langst open / Urgent),
> spiegelt de verificatie-wachtrij-gezondheid; 4 unit-tests; geen schemawijziging),
> Reeds gedaan (niet opnieuw): prestatie-goedkeuring-reminder voor de opdrachtgever
> (`performance-approval-reminders.ts` `planPerformanceApprovalReminders` + `…-task.ts`
> `runPerformanceApprovalReminderTask`): actieve nudge (dag 3/7) + admin-escalatie wanneer een
> ingediende prestatie ongekeurd blijft en de cascade stalt — spiegelbeeld van
> `concept-invoice-reminders`. Vult het gat dat het grace-venster (auto-goedkeuring) default UIT
> staat. `REMINDERS.performanceApprovalDays=[3,7]`; plan/apply, idempotent via DomainEvent dedupeKey;
> gewired in `/api/tasks/run-all`; 16 unit-tests; read-only, geen schemawijziging, geen geldstroom.
> Reeds gedaan (niet opnieuw): wachttijd-zicht op de prestatie-goedkeuringswachtrij
> (`lib/performance-approval.ts` — pure `summarizePerformanceApproval` + `PERFORMANCE_APPROVAL_STALE_DAYS=3`,
> hergebruikt `daysWaiting`/`waitingLabel` uit `verification-queue.ts`; 8 unit-tests; `/prestaties` toont
> per ingediende prestatie "N dagen wachtend" + een warning-regel bij ≥ 3 dagen die de cascade-stalling
> benoemt; read-only, geen schemawijziging, geen extra query),
> Reeds gedaan (niet opnieuw): annuleringsbetrouwbaarheid-signaal van de opdrachtgever
> (`lib/client-reliability.ts` `computeClientReliability` + `lib/data/client-reliability.ts` +
> `ClientReliabilityBlock` op de opdracht-detailpagina): spiegelbeeld van het betaalgedrag-signaal —
> hoe vaak annuleert de opdrachtgever agreed werk en hoe vaak last-minute (chargeable); read-only,
> server-side, geen schemawijziging, 11 unit-tests),
> Reeds gedaan (niet opnieuw): verificatie-wachtrij gezondheid op /admin/statistieken
> (`lib/verification-queue.ts` — pure `summarizeVerificationQueue` + `daysWaiting`/`waitingLabel`/
> `staleThreshold`, `VERIFICATION_STALE_DAYS=5`; 15 unit-tests; admin-stats.ts `pendingVerifications`
> → `verificationQueue {pending,oldestDays,staleCount}` via begrensde findFirst+count; statistieken-
> certificatensectie naar 4 kaarten incl. "Langst wachtend" + "Te lang in wachtrij"; de lokale
> STALE_DAYS/daysWaiting/waitingLabel-duplicatie in /admin/verificaties is opgeruimd naar de gedeelde
> module; geen schemawijziging),
> Rooster-marktplaats slice 1 — discovery-kalender van open diensten
> (`lib/roster-market.ts` `buildRosterCalendar` + read-only `/rooster` voor FREELANCER/ADMIN:
> PUBLISHED-jobs met startdatum per kalenderdag, matchscore + "Gereageerd"-badge, doorklik naar de
> opdracht; reageren via de bestaande flow, geen schemawijziging; 14 unit-tests; nav-item onder Werk),
> Rooster matchredenen + sterke-match-filter (`roster-market.ts` `filterRosterByMinMatch` +
> `ROSTER_STRONG_MATCH_MIN`; troef/minpunt-regel per dienst gelijk aan /opdrachten; `?match=sterk`
> filter-tabs; 6 unit-tests; geen schemawijziging),
> indirecte uren voor het urencriterium (/ontzorgd/uren:
> IndirectHoursEntry-model + lib/tax/indirect-hours.ts + acties/page; /ontzorgd telt nu direct +
> indirect i.p.v. indirectHours:0 — branch claude/dazzling-carson-v9Qwk),
> geschorste/geanonimiseerde ZZP'er niet meer vindbaar voor
> opdrachtgevers (ZZP2-183: gedeeld `discoverableFreelancerWhere` = PUBLIC + ACTIVE op /freelancers,
> opdracht-suggesties en "gesprek starten" — sluit het no-show-handhavingsgat),
> aanmaningsladder/dunning-escalatie (DUNNING_STAGES in config,
> currentDunningStage + escalations in payment-reminders.ts, admin-escalatie in de runner,
> niveau-label op factuurdetail — Linear ZZP2-35), print/PDF-factuurknop + A4-afdruk-styling,
> MailSender-abstractie,
> concept-factuur-reminders, jaaroverzicht/IB, grootboek-/BTW-CSV, DBA-omzetconcentratie,
> admin-disputen, run-all cron, BTW-herinnering, cascade-keten op werkprocespagina,
> idempotentie-test, cascade-factuurdetail herleidingsbewijs, admin-kwartaaloverzicht,
> DBA-drempels configureerbaar (PlatformConfig + /admin/configuratie), onboarding-checklist
> ZZP'er (4 stappen, dashboard), dark-mode toggle (gebruikerskeuze), cutover-migratiescript
> legacy-facturen (scripts/migrate-legacy-invoices.mjs, getest, idempotent),
> nav-signalen cascade (cascadeWork + openDisputes + pendingPerformances in signals.ts),
> ORT-categorietests (SATURDAY/HOLIDAY/gemengd), handlers-edge-cases, validatietests periodedata,
> diensten-overzicht ZZP'er + CSV-import + export, prestaties-overzicht opdrachtgever + export,
> admin platform-statistieken (/admin/statistieken), diensten-import MAX_CSV_IMPORT_SIZE hardening,
> admin DBA-risico-overzicht (/admin/dba: geconsolideerd, gesorteerd, filterbaar; dba-overview.ts + test),
> notificatie-voorkeuren (/account/notificaties: e-mailherinneringen per categorie aan/uit, opt-out-model,
> NotificationPreference-model, gating in de 4 reminder-taakrunners — ZZP2-41),
> herplaatsing bij uitval (ZZP2-158: geannuleerde actieve inzet heropent de dienst + ReplacementPanel met
> vervangers op de samenwerking-detailpagina; replacement.ts + test — sluit de COMPETITORS.md ronde-2
> BOUWEN-backlog volledig af),
> tariefinzicht "jouw tarief vs. de markt" (ZZP2-184: lib/market-rate.ts geanonimiseerde mediaan + p25/p75
> per functie met platform-fallback + anonimiseringsdrempel, MarketRateCard op /profiel/bewerken — sluit
> PLAN-WERELDKLASSE Fase 3 "Tariefinzicht" af),
> kandidaten-bulk-triage (ZZP2-185: shortlist/bekeken/afwijzen voor meerdere reacties tegelijk op
> /kandidaten — planBulkApplicationTransition + bulkChangeApplicationStatus + sticky bulk-balk),
> omzet-/uitgaventrend op /inzicht (ZZP2-189: revenue-trend.ts buildRevenueTrend + rol-/tenant-fetchers,
> RevenueTrendCard met sparkline + delta-badge + 6-maands strip; sluit de eerder ongebruikte
> monthlyRevenue/Sparkline-capaciteit aan op echte data, per rol — FREELANCER/CLIENT/FRANCHISER),
> facturatiecockpit statusfilter + verouderingssignaal (ZZP2-190: `/admin/facturatie` filter-tabs per
> status + "Te lang open"-KPI + per-factuur veroudering, afgeleid uit issuedAt; pure
> `platform-billing/aging.ts` + 13 tests; geen schemawijziging).
> leverbetrouwbaarheid-signaal ZZP'er (ZZP2-191: `collaboration-quality.ts` — first-time-right %
> (goedgekeurd zonder eerdere afkeuring), gecorrigeerde prestaties, gem. goedkeuringstijd
> `submittedAt`→`approvedAt`, toon-oordeel met min-steekproef 3; sectie "Leverbetrouwbaarheid" op
> /inzicht voor de FREELANCER; read-only, server-side, geen schemawijziging; 19 unit-tests).
> leverbetrouwbaarheid-signaal ZZP'er voor de OPDRACHTGEVER op /kandidaten (PR #447: spiegelbeeld van
> de opdrachtgever-vertrouwenssignalen op /opdrachten/[id]; hergebruikt `collaboration-quality.ts` via
> nieuwe pure batch-aggregator `computeDeliveryQualityByProfile` + gebatchte fetcher
> `lib/data/freelancer-delivery-quality.ts` (geen N+1) + `DeliveryQualityBlock`; per kandidaat
> in-één-keer-akkoord %/gecorrigeerd/gem. doorlooptijd, verbergt zich bij te kleine steekproef;
> read-only, geen schemawijziging; +5 unit-tests).
> track record per ZZP'er op /freelancers (`freelancer-track-record.ts` — pure `trackRecordHighlights`
> met betekenis-drempels: afgeronde samenwerkingen ≥ 1 + gewerkte uren round ≥ 8; server-berekend in
> `freelancer-search.ts` via bulk-queries, getoond op de browse-kaart; spiegelt het betaalgedrag-signaal
> de andere kant op; geen subjectieve beoordelingen; 8 unit-tests; geen schemawijziging).
> betaalverplichtingen-prognose voor de opdrachtgever (`payment-obligations.ts` `buildPaymentObligations`
>
> - `/verplichtingen` CLIENT-only): spiegel van de inkomstenprognose (`/prognose`, FREELANCER) maar
>   cashflow-uit; bucket OVERDUE/THIS_MONTH/NEXT_MONTH/LATER/UNSCHEDULED met opdrachtgever-semantiek
>   (DRAFT telt niet — alleen SUBMITTED/APPROVED/OVERDUE), samenvatting goed-te-keuren/ingepland/te-laat,
>   begrensde query op `collaboration.company.userId`, 12 unit-tests; read-only, geen schemawijziging).
>   certificaat-compliance-momentopname op het CLIENT-dashboard (`summarizeClientCompliance` in
>   `collaboration-alerts.ts` + `ComplianceSnapshotCard`): geaggregeerde telling over álle lopende
>   samenwerkingen — sluit het zicht-gat dat de per-kaart-melding alleen de top-6 zone dekte; read-only,
>   geen extra query, geen schemawijziging, 4 unit-tests; verbergt zichzelf wanneer alles compliant is.

### Gap-analyse (Fase 0)

**Herbruikbaar:** enums+Zod-patroon; `assert*Transition`-maps (credential/invoice/collaboration);
plan/apply-splitsing (`planExpiryRun`/`runExpiryTask`) als blauwdruk voor handlers; `audit()`
één-schrijfpunt; authz-keten (`authz.ts`); server-side snapshots (matchScore, DBA op Job);
next-action-engine; Invoice/InvoiceLine/Collaboration-modellen.
**Moet wijken/uitbreiden:** korte Job/Invoice/Collaboration-enums → rijkere lifecycles (Fase 2/3);
losse factuur → afgeleid uit goedgekeurde prestatie + reeks per partij + BTW.
**Ontbreekt volledig:** centrale event-laag; Urenstaat/Oplevering-entiteit + verplichte
goedkeuringsstap; administratie-items (debiteur/crediteur) + betaalstatus-registratie; doorlopende
DBA-monitoring; reminder-engine voor de facturatie-cascade; Event F (fee, default uit).
**Grootste risico's:** (1) lifecycle-migratie zonder de live demo te breken (additief in Fase 1);
(2) idempotentie bij dubbele events; (3) dark-first vs. light thema (stop-and-confirm vóór Fase 5);
(4) BTW/nummering-correctheid (echte administratie, geen mock).

### Fase 1 — verslag (afgerond 2026-05-29)

Geleverd:

- `src/lib/state-machine.ts` — generieke `defineStateMachine(entity, transitions)` →
  `{ can, assert, next, isTerminal, isState }`; valideert overgangen naar onbekende toestanden
  bij definitie; `StateTransitionError`.
- `src/lib/lifecycles.ts` — doel-lifecycles als state machines: WorkOrder (opdracht), Contract,
  Performance (urenstaat/oplevering), InvoiceLifecycle, Payment (registratie, geen geldverwerking).
- `src/lib/events.ts` — `DomainEventType` (Events A–F + zijpaden) + Zod, `DomainEventInput`/
  `StoredEvent`-vorm, `EventStore`-interface + `InMemoryEventStore` (pure tests).
- `src/lib/event-bus.ts` — `EventBus`: handlerregistratie + idempotente `publish` (claim per
  handler, claim-teruggave bij fout → self-healing replay).
- `src/lib/event-store.ts` — `PrismaEventStore` + proces-singleton `eventBus`.
- Schema: `DomainEvent` (append-only, unieke `dedupeKey`) + `EventHandlerRun` (handler-dedup).
- Tests: state-machine (7), lifecycles (14), event-bus (7). **Gate groen:** typecheck ✓, lint ✓,
  test 230 ✓, build ✓. (e2e niet gedraaid — geen browser-channel in routine, zie CLAUDE.md.)

DoD Fase 1 ✓: events publiceren/consumeren werkt; ongeldige statusovergangen worden geweigerd;
idempotentie aangetoond (dubbele publish = één event + één handlerrun).

### Fase 2 — verslag (afgerond 2026-05-29)

Gekozen richting (met eigenaar afgestemd): **additief naast elkaar** — nieuwe modellen + pure
motor, live `Invoice`/`Collaboration`-flow blijft werken; cutover volgt in Fase 3.

- `src/lib/config.ts` — configureerbare bedrijfsregels: BTW-regimes + tarieven (bps), platformfee
  (default UIT), reminder-tijden, DBA-drempels + disclaimer, betaalbevestiging.
- `src/lib/administration/vat.ts` — pure BTW-berekening (integer-centen, 21/9/0/verlegd/vrijgesteld,
  commerciële afronding, creditregels).
- `src/lib/administration/numbering.ts` — doorlopende nummering **per uitschrijvende partij**
  (geen platform-brede reeks), gatenvrij-check.
- `src/lib/administration/ledger.ts` — administratiemotor: pure dubbel-boekhoud-postings per
  cascade-event (C/D/E + creditfactuur), per-partij saldo, BTW-positie, sluitcontrole.
- `src/lib/administration/persist.ts` — dunne prisma-schrijvers: postings → AdministrationEntry +
  transactionele factuurnummer-toewijzing per partij (voor Fase 3-handlers).
- Schema (additief): `Performance` (urenstaat/oplevering), `InvoiceSequence` (reeks per partij),
  `AdministrationEntry` (grootboek); `Invoice` uitgebreid met nullable cascade/BTW/partij-velden
  - `@@unique([issuerKey, partyInvoiceNumber])`. Live flow ongemoeid.
- Tests: 24 nieuw (vat 8 / numbering 7 / ledger 9). **Gate groen:** typecheck ✓, lint ✓, test 254 ✓,
  build ✓. Proeftransactie A–E aangetoond: debiteuren/crediteuren afgeboekt na betaling, omzet/kosten
  correct, BTW (ZZP'er draagt af, OG vordert terug), **geen enkele platform-boeking** (Besluit 1).

DoD Fase 2 ✓: proeftransactie genereert correcte administratie bij ZZP'er én opdrachtgever;
BTW klopt; nummering uniek per partij; geen geldverwerking aanwezig.

### Fase 3 — verslag (cascade-logica afgerond 2026-05-29)

- `src/lib/cascade/types.ts` — `CascadeEffects` (statuswijzigingen, postings, notificaties, audits,
  nieuwe concept-factuur, vervolg-events).
- `src/lib/cascade/handlers.ts` — pure planners per event: A (contract getekend), B1 (prestatie
  ingediend), B2 (goedgekeurd → concept-factuur + BTW), B2′ (afgekeurd, reden verplicht), C (factuur
  indienen → debiteurenpost + partij-nummer), D (goedkeuren → crediteuren/voorbelasting + vervaldag),
  D′ (afgekeurd), E (betaling geregistreerd → afboeken + samenwerking afronden; Event F-followup
  achter feature-flag, default UIT).
- `src/lib/cascade/apply.ts` — transactionele applier: schrijft alle effecten atomair weg
  (`$transaction`), inclusief nieuwe concept-factuur, postings (`AdministrationEntry`), notificaties,
  audit. Plan/apply-patroon zoals `runExpiryTask`.
- Tests: 16 nieuw (handlers 14 / integratie 2). Integratietest dekt het **hele pad A→E** voor
  uurtarief én milestone; beide administraties sluiten; geen platform-boeking (Besluit 1).
- **Gate groen:** typecheck ✓, lint ✓, test 270 ✓, build ✓.

DoD Fase 3 (logica) ✓: contract-getekend t/m betaalregistratie verloopt deterministisch; beide
administraties kloppen; goedkeuringsstap werkt voor beide tariefvormen; ongeldige overgangen geweigerd.

### Fase 3 — runtime-cutover (afgerond 2026-05-29)

- `src/lib/cascade/commands.ts` — command-laag: ownership-check → pure planner → DomainEvent +
  effecten + EventHandlerRun-marker atomair in één interactieve transactie; Event C kent het
  factuurnummer per partij toe (allocator in dezelfde tx). Idempotent via dedupeKey + state-asserts.
- `src/app/(protected)/samenwerkingen/[id]/{actions,page}.tsx` — cascade-workspace: "Aan zet"-
  banner, contract ondertekenen, uren/oplevering indienen (ZZP'er), goedkeuren/afkeuren
  (opdrachtgever), factuur indienen/goedkeuren/afkeuren, betaling markeren. Link vanaf de lijst.
- `prisma/seed.ts` — cascade-demo: voorgestelde samenwerking (collab-3), ingediende urenstaat
  (perf-1), goedgekeurde urenstaat + concept-factuur (perf-2/inv-c1).
- **Geverifieerd:** smoke tegen de echte DB liep de hele keten door; administratie sluit, BTW klopt,
  nummer per partij (2026-0001), geen platform-boeking. Gate groen: typecheck/lint/test 270/build.

### Volgende: Fase 4 — Zijpaden & DBA-monitoring

Te late betaling + aanmaningen (reminder-engine, plan/apply zoals `runExpiryTask`), creditfactuur,
dispuut/escalatie, periodieke overzichten (BTW-kwartaal, debiteuren/crediteuren), én de doorlopende
DBA-monitoring (§6) met configureerbare drempels + disclaimer. Daarnaast (additief, niet-blokkerend):
cascade-facturen tonen op `/facturen`, en de oude handmatige factuuraanmaak uitfaseren ná
in-browser-verificatie (interactieve sessie).

### Backlog (na de overhaul-fasen)

1. Semantiek als uitlegbare scorecomponent (fundering staat er: `src/lib/semantic.ts` +
   `src/lib/services/semantic-matcher.ts`); pgvector geparkeerd achter de ADR-trigger — zie
   `docs/decisions/0010-semantische-matching.md` (> ~50k discoverable profielen óf scoring > ~50ms p95).
2. ~~UX-walkthrough-backlog~~ — **VOLLEDIG AFGEWERKT 3-7-2026** in PR #557–#574 (zie de
   status-banner in docs/UX-WALKTHROUGH-2026-07-02.md). Niet opnieuw oppakken.
3. **Perf-refactors uit de kwaliteitsronde 2-7 (RISKY, apart oppakken):**
   - `clientCredentialAlerts` (src/lib/collaboration-alerts.ts) her-queryt op het CLIENT-dashboard
     dezelfde company + ACTIVE-collaborations die `dashboard/page.tsx` al heeft — geef de functie
     een overload met voorgefetchte rijen (2 queries minder per dashboard-load).
   - `suggestedFreelancersForClient` (src/lib/suggestions.ts) fan-out: per job (≤10) een findMany
     over ≤200 profielen met 4 includes — pool één keer fetchen en in-memory scoren.
   - `savedJobIds`-query op /opdrachten (index) in de bestaande `Promise.all` vouwen.
   - ~~Denial-audit op factuur-/urenstaat-PDF-routes~~ — af (PR #554, 2-7).

Gereed (pre-overhaul): bedrijfsprofiel-compleetheid · admin gebruikers "vraagt aandacht" ·
nieuwe-reactie-notificatie · uitlegbare matching (match-reasons) · next-action-engine
(dashboard draait erop) · beschikbaarheid in matching (score onveranderd, reden + badges) ·
design-polish-pass (gedeelde EmptyState + Skeleton, route-skeletten, reduced-motion) ·
verloopdetectie als geplande taak (runExpiryTask + POST /api/tasks/expiry met CRON_SECRET,
"verloopt binnenkort"-herinneringen, idempotent via expiryReminderFor).

### Per increment (geen uitzonderingen)

testbare kern + unit-tests → UI → typecheck/lint/test/build groen → e2e + screenshot →
commit → **PR naar `main`** (feature-branch) → **CI-poort geverifieerd groen (`gh pr checks <nr>`)**
→ na de poort mergen → werk PROGRESS.md + deze backlog bij.

---

## QUALITY_CHECKLIST (gebruik elke sessie vóór commit)

```
npm install            # indien dependencies gewijzigd
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma db push     # of migrate, indien schema gewijzigd
npm run db:seed        # indien seed gewijzigd
# Start dev, klik de gebouwde flow door, check browserconsole op errors
```

Faalt iets → oorzaak onderzoeken, fixen, checks opnieuw. Pas daarna afvinken.

---

## Concurrentie-backlog (onderzoek juni 2026 — AFGEROND op 2 geparkeerde punten na, 12-6-2026)

Bron: concurrentie-onderzoek + `docs/PRIJSADVIES.md`. Status geverifieerd tegen `main` (12-6):

1. [x] **Tarief-drempelwaarschuwing rechtsvermoeden (< €38/uur)** — gemerged:
       `lib/rechtsvermoeden.ts` + tests, `RECHTSVERMOEDEN_DREMPEL_CENTS` in config, signaal op
       opdracht-form/-detail + samenwerking mét disclaimer; ook in `dba-audit.ts`.
2. [x] **Betaalgedrag-signaal opdrachtgever** (#310) — `payment-behavior.ts` (gem. dagen-tot-
       betaling, %-op-tijd, sampleSize ≥ 3) + blok op opdracht-detail voor de ZZP'er.
3. [x] **Portable vertrouwensdossier** (#313, hardening #333) — publieke niet-raadbare URL
       `/vertrouwen/[profileId]/[token]` (HMAC-token `lib/share-token.ts`, eigen
       `SHARE_TOKEN_SECRET`), geverifieerde certificaten-metadata + zegel, geen informatielek,
       rate-limit per IP, audit op elke weergave; deelblok op /certificaten.
4. [x] **DBA-audit-export per samenwerking** (#312) — PDF-export
       `api/samenwerkingen/[id]/dba-dossier` ("klaar voor het bedrijfsbezoek"), `lib/dba-audit.ts`.
5. [~] **Fee-transparantie-UI** — GEPARKEERD tot billing aangaat (PRIJSADVIES): de fee als aparte
   regel zichtbaar voor béíde partijen op factuur + samenwerking. Symmetrie-verificatie GEDAAN
   (10-6-2026): tarief/factuurbedragen op alle oppervlakken identiek aan beide partijen getoond;
   geen role-conditional bedragen; tenant-fees in geen enkele partij-UI.
6. [x] **Symmetrische annulering + no-show-registratie** — AFGEROND (12-6-2026, besluit
       eigenaar): (a) annulering met verplichte reden, kosteloos tot 7 dagen vóór de start,
       daarna betalingsverplichting (snapshot `cancellationChargeable`), zichtbaar voor de
       franchiser (#357); (b) no-show-registratie door opdrachtgever/franchiser met reden →
       ZZP'er geïnformeerd, admin beoordeelt gegrond/ongegrond op /admin/no-shows, bij 3
       ongegronde een uitschrijf-taak in de admin-wachtrij (SUSPENDED, handmatig — branch
       `feat/no-show-registratie`).
7. [x] **Notificatie-betrouwbaarheid** — digest (#314), "terwijl je weg was" (#315),
       e-mailvoorkeuren per categorie (#318). Nog open: web-push (VAPID) = mensenwerk.
8. [x] **Startkapitaal & boekhoud-belofte etaleren** (#311) — trust-strip/registratie-copy.
