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
  - **Update 14-8-2026:** het juridische documentenpakket stáát als concept v1.0 (op basis van
    concurrentie-onderzoek PIDZ/Bendy/Zorgwerk/Malt/Temper/Deel + AP/ACM/EUR-Lex-kader):
    `/voorwaarden`, `/privacy`, `/cookies` (publiek), plus docs/legal/ (verwerkersovereenkomst,
    datalekprocedure, **REVIEW-DOOR-JURIST.md** = overdrachtsdossier met 9 open toetspunten en de
    juridische productbacklog). De externe jurist-review zelf blijft mensenwerk; entiteitsgegevens
    (KVK/adres) zijn placeholders tot de inschrijving definitief is.

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
       idempotentiecheck). Werkt op SQLite; **Postgres-smoke GEDAAN (10-8-2026):** op Postgres 16
       (Docker) dry-run → live (2 synthetische legacy-rijen gemigreerd) → idempotente rerun ✓.
3. [x] **e2e in een interactieve sessie mét browser — GEDAAN (10-8-2026):** volledige suite (±145
       tests incl. cascade-flow A→E, factuur-PDF-serving en de ex-gequarantaineerde
       lifecycle-cascade) groen tegen een productie-server met bundled Chromium. Zie PROGRESS.md.
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

### QA-loop — gequarantainede test (15-6-2026 → OPGELOST 10-8-2026)

De QA-loop (`qa.yml`, post-merge op main) is gehard: **`--workers=1` per shard** (parallelle
workers tegen één SQLite-db gaven write-lock-contentie + kruisbesmetting → flaky CI-rood, o.a. de
franchise-robuustheidstest die lokaal serieel wél slaagt).

- [x] **`e2e/qa/lifecycle.spec.ts` (volledige cascade) — UIT quarantaine (10-8-2026).** De
      "samenwerking voorstellen"-hang was de bekende #329-klasse (action-response hangt in
      productie terwijl de mutatie slaagde). `test.fixme()` weg; de voorstel-, teken- en
      betaalstappen gebruiken nu de `_robust.ts`-helpers (`clickUntil`/`clickUntilGone`) en de
      verrotte stappen (Toon details-flow, "Markeer als betaald") zijn bijgewerkt. De volledige
      cascade (opdracht → … → betaling → audit) draait end-to-end groen (sessie 10-8).
- [ ] **2 resterende flaky tests** (slagen op retry, dus loop blijft groen — geen blocker):
      `critical-personas.spec.ts:111` (franchise onbestaand-id → 404; soms 200 op eerste poging) en
      `support.spec.ts:53` (admin-helpdesk; login-timing). De-flaken wanneer er tijd is (robuustere
      waits / notFound-zekerheid); `retries: 2` absorbeert ze nu.

> Resultaat 15-6: volledige QA-suite lokaal **58 passed, 2 skipped (quarantaine), 2 flaky→pass**,
> exit 0. Was: chronisch rood (25+ runs zonder succes).

**Geprioriteerde backlog (bovenste eerst; pak er één, lever DoD-groen, push):**

> Gedaan (niet opnieuw): **Alle rollen — notificatie-presentatie voor 20 ontbrekende types (2026-08-22, PR #1191)** —
> 20 uitgestuurde notificatietypes ontbraken in de `META`-map (`src/lib/notifications.ts`) en vielen op `/notificaties`
>
> - digest-mail terug op de generieke `system`/`info`-fallback (geen icoon/toon, samengeklonterd onder "Overig" zonder
>   eigen filtertegel). De security-audit van 2026-08-22 signaleerde dit expliciet als losse UX-PR met coverage-test.
>   `META` aangevuld met alle 20 + juiste categorie/toon; twee nieuwe categorieën `application` ("Reacties":
>   `APPLICATION_RECEIVED`/`_REJECTED`/`_WITHDRAWN`, laatste uit "Overig" naar zijn siblings) en `account` ("Account":
>   `ACCOUNT_STATUS`/`ACCOUNT_DELETION_REQUESTED`); overige onder credential/invoice/messages/dispute/workflow/payment/
>   system. Nieuwe pure `isNotificationTypeKnown`; `CATEGORY_ICON` (Inbox/UserCog) — `Record<NotificationCategory>` dwingt
>   volledigheid af via typecheck. Puur presentatie, geen schema-/mutatie-/authz-/domeinmotor-oppervlak. +drift-test (elk
>   uitgestuurd type heeft expliciete presentatie). Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — betaalprovider-aflever-heartbeat (dead-man's-switch) (2026-08-22, PR #1190)** —
> completeert de dead-man's-switch-familie: opslag/mail/push/cron/back-up hadden een doorlopend afleversignaal, de
> **betaalprovider (Stripe/Mollie outbound)** — het laatste productie-kernkanaal — niet. Een verlopen/ingetrokken
> API-sleutel of provider-storing laat élke `startCheckout`/`paymentStatus` stil mislukken (checkout hangt eeuwig op
> PENDING); de connectiviteitszelftest bewijst alleen bereikbaarheid vóór go-live (menselijke klik), de reconcile-cron
> herstelt één gemiste webhook — geen van beide bewaakt doorlopend. Patroon = `RecordingStorageDriver`:
> `RecordingPaymentProvider`-decorator rond `getPaymentProvider()` (alleen om de échte provider; no-op/mock blijft kaal),
> elke uitgaande operatie registreert in singleton `BillingDeliveryHeartbeat`; `resolveWebhookRef` (inbound) loopt
> ongeregistreerd door. Event-gedreven oordeel op de laatste operatie (`never`/`ok`/`failing` + teller), geen
> staleness-op-leeftijd; fail-open registratie; nooit sleutels/endpoints/foutinhoud. Kaart "Betaalprovider" op
> `/admin/systeemstatus`, gauges `zzp_billing_delivery_ok`/`_consecutive_failures`/`_last_failure_age_seconds` op
> `/api/metrics`, alert `ZzpBillingDeliveryFailing` (`==0 and >=3`, `for: 15m`) + inhibitie. +15 tests (pure freshness +
> decorator) + metrics-gauge-set/assertions. Resterend mensenwerk: niets extra (vult zichzelf zodra
> `BILLING_PROVIDER=stripe`/`mollie` staat). Gate: typecheck/lint/test/build/prettier groen.
>
> Gedaan (niet opnieuw): **Alle rollen — proactieve reminder voor onbeantwoorde berichten (cron) (2026-08-22, PR #1188)** —
> `/berichten` toonde de wachtende kant al dat een gesprek "stil" ligt (`conversation-turn.ts` vanaf
> `CONVERSATION_STALE_DAYS`=3), maar niemand nudget de kant die aan zet is: de ontvanger van het laatste bericht die
> nog niet antwoordde (zag het pas bij inloggen). Nieuwe pure planner `conversation-reply-reminders.ts` + runner
> `conversation-reply-reminders-task.ts` (patroon van `application-decision-reminders`): nudge op dag 3 en 7 na het
> laatste bericht (`CONVERSATION_STALE_DAYS` + offsets `REMINDERS.conversationReplyDays` [0,4], geen drift met het
> /berichten-stiltesignaal), daarna stop (max 2). Elke deelnemer behalve de afzender; idempotent via DomainEvent
> dedupeKey per (gesprek, ontvanger, dag). Notificatie → /berichten/[id], nieuwe categorie "messages" (Berichten),
> audit-label + registratie in run-all. Runner-scan begrensd op `Conversation.updatedAt`-venster; planner beslist de
> exacte dag uit `lastMessage.createdAt`. Puur/server-side, geen schema-/authz-/geldstroom-oppervlak. +24 tests. Gate groen.
>
> Gedaan (niet opnieuw): **ZZP'er — startdatum-sortering op de opdrachtenlijst (2026-08-21, PR #1187)** —
> `/opdrachten` sorteerde op beste match, nieuwste en tarief, maar niet op **startdatum**, terwijl
> `job-start-proximity.ts` al bestond en elke opdracht een `startDate` heeft. Een ZZP'er die een gat in de
> agenda wil vullen wil bovenaan zien wat het eerst begint (benchmark Temper/Zorgwerk: "start binnenkort").
> Nieuwe pure `src/lib/job-start-sort.ts` (`sortJobsByStart`) rangschikt vanuit _nu_: aankomend oplopend
> (soonste eerst) → voorbij-maar-open aflopend (recentst gestart eerst) → ongedateerd; tie-break nieuwst
> gepubliceerd, dan id (deterministisch, UTC-middernacht). `start_soon` in `JOB_SORTS`; de pagina deelt het
> in-geheugen scan-en-pagineer-pad met de matchsortering (`scanAndRank`). Werkt voor iedereen (geen profiel
> nodig). Sorteeroptie "Startdatum (eerst)" in `job-filters.tsx`. Read-only, geen schema-/mutatie-/authz-/
> domeinmotor-oppervlak. +9 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er + opdrachtgever — vervolgsignaal (renewal-badge) op de /samenwerkingen-lijst (2026-08-20)** —
> de bemiddelaar zag op `/franchise/samenwerkingen` al per lopende plaatsing een `renewalRowBadge` ("Loopt af over
> N dagen" / "Voorbij einddatum") en het detail toont de volledige `RenewalNudge`, maar de deelnemer-lijst
> `/samenwerkingen` (ZZP'er + opdrachtgever) toonde voor dezelfde ACTIVE-inzet enkel een platte `Eind:`-datum zónder
> aflooop-signaal — juist de twee partijen die een vervolg moeten plannen. `renewalRowBadge` verhuisd naar de
> canonieke `src/lib/collaboration-renewal.ts` (re-export in `franchise/collaboration-oversight.ts` → importpaden
> ongewijzigd); de deelnemer-lijst berekent per ACTIVE-kaart `summarizeCollaborationRenewal` uit de reeds geladen
> velden (geen extra query) en tekent de chip naast de status-/DBA-badge, alleen bij attention (ending_soon/overdue).
> Zelfde pure bron als de bemiddelaar-lijst + next-action + detail-nudge → geen drift. Read-only, geen schema-/
> mutatie-/authz-oppervlak. +tests (renewalRowBadge canoniek). Gate: typecheck/lint/test (6471)/build/prettier groen. PR #1176.
>
> Gedaan (niet opnieuw): **Opdrachtgever — vaardigheidsfilter op de ZZP'er-etalage (2026-08-20)** —
> `/freelancers` had tot nu toe alleen zoekbalk + vertrouwensniveau + "alleen beschikbaar"; de
> opdrachtgever kon niet narrowen op concrete vaardigheden (VOG-chauffeur, ORT-avond, React, …). De
> pure `applyFreelancerFilters` ondersteunde de `skillIds`-tak (OR-semantiek, gelijk aan de
> `/opdrachten`-skillfilter) al — de UI legde die filter nergens bloot. Nieuwe pure
> `buildFreelancerSkillCatalog(cards)` (`src/lib/freelancer-search.ts`) construeert de catalogus
> uitsluitend uit skills die minstens één zichtbare ZZP'er voert (klikken kan nooit naar 0 vallen op
> een niet-vertegenwoordigde skill; klantvriendelijker dan een globale DB-lijst); frequentie desc,
> tiebreaker `localeCompare(nl)` op naam, dan op id → volledig deterministisch. Chips onder de
> filterrij (label `Vaardigheden` + count per chip), `Toon alle N vaardigheden`-toggle voor lange
> catalogi (>12), geselecteerde skills buiten de top-N blijven altijd zichtbaar (anders "verdwijnt"
> een actieve filter), `Wis vaardigheden` voor snelle reset, empty-state-CTA respecteert de nieuwe
> filter. Client-only, geen schema-/mutatie-/authz-/query-oppervlak. +7 tests. Gate: typecheck,
> lint, test (6467), build, prettier groen. PR #1175.
>
> Gedaan (niet opnieuw): **Opdrachtgever + bemiddelaar — voorstel-ouderdomssignaal op onondertekende
> samenwerkingen (2026-08-20)** — een `PROPOSED`-samenwerking (contract nog niet ondertekend) toont in
> de werkproces-fase "Contract ter ondertekening · Aan zet", maar niet de **duur**: een voorstel van een
> uur oud zag er identiek uit als een dat al 8 dagen stil hing. De renewal-motor veroudert alleen ACTIVE-
> inzet tegen de einddatum; PROPOSED-maar-niet-getekend werd nergens verouderd. Nieuwe pure
> `src/lib/collaboration-proposal-age.ts` (`summarizeProposalAge`, gespiegeld op `collaboration-renewal.ts`):
> alleen PROPOSED + niet-getekend + niet-bevroren komt in aanmerking; onder `PROPOSAL_STALE_DAYS` (4, dempt
> weekend-ruis) `fresh`/geen label, daarboven `stalling` + "Wacht al N dagen op ondertekening"; hele UTC-
> dagen, klok-skew→0. Gewired op `/samenwerkingen` (index, beide rollen) als rustige `text-warning`-regel in
> het contract-sign-fase-blok (alleen bij attention). Franchise-toezicht: `collaboration-oversight.ts` telt
> nu `stalledProposals` uit dezelfde pure bron (geen drift) → `franchiseCollabHeadline`-zin + conditionele
> "Voorstel stilstaand"-tegel in `CollaborationOversightStrip` (alleen bij >0). Read-only, geen schema-/
> mutatie-/authz-/domeinmotor-oppervlak. +tests (helper 9 + oversight stalled-tak/headline-combinatie).
> Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — vastgelopen-PAST_DUE-downgrade-detector `zzp_subscriptions_past_due_overdue_downgrade` (2026-08-20)** —
> sluit het laatste gat in de abonnement-stille-faal-familie. Elke abonnementsstatus had een stille-faal-gauge behalve de PAST_DUE-downgrade:
> een mislukte betaling zet een abonnement op `PAST_DUE` (webhook), waarna de `subscription-past-due`-cron herinnert (dag 1/3/7) en op dag 8+
> downgradet naar `CANCELLED` (→ Gratis). De cron-heartbeat bewijst alleen dát de run afrondde, niet dát 'ie de downgrade-pijplijn verwerkte —
> `overdueExpirySubscriptions` dekt ACTIVE-verval, `stalePendingSubscriptions` dekt PENDING, maar PAST_DUE-downgrade was ongedekt: bleef dat werk
> stil hangen dan bleven mislukte betalingen eeuwig in PAST_DUE hangen en gingen de herstel-herinneringen niet uit (verloren omzet-herstel;
> géén toegangslek — de entitlement-guard behandelt PAST_DUE al als Gratis). Nieuwe read-only gauge `zzp_subscriptions_past_due_overdue_downgrade`
> op `/api/metrics` (PAST_DUE-abonnementen voorbij de downgrade-drempel `PAST_DUE_DOWNGRADE_AFTER_DAYS`, 7 dagen). Nieuwe pure
> `overdueDowngradeSubscriptionWhere`/`pastDueDowngradeBacklogCutoff` (`src/lib/past-due.ts`, `pastDueAt ?? updatedAt`-OR), via drift-gate-test
> vastgeklonken aan de downgrade-beslissing van `planPastDue` → kan niet driften. Prometheus-alert `ZzpSubscriptionsPastDueOverdueDowngrade`
> (`> 0`, `for: 30h`) + onderhouds-inhibitie, vastgeklonken aan beide drift-gates. Met de mock-provider (pilot-default) → gauge `0`. Read-only,
> geen schema-/mutatie-/auth-oppervlak, geen PII/secrets. +tests (metrics-map+clamp, volledige gauge-set, route-query-telling, where↔planPastDue-drift).
> Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — herinnerings-alarmen (VALARM) op de agenda-deadlines (2026-08-19, PR #1164)** —
> de agenda-feed (`/api/agenda` + `/api/agenda/feed.ics`) exporteerde de administratieve deadlines (certificaat-verloop, factuur-vervaldatum,
> BTW, IB, einde plaatsing) als kále all-day-events zónder VALARM: een abonnee zag de deadline pas op de dag zelf, te laat om nog een VOG te
> verlengen of een BTW-aangifte voor te bereiden. Nu dragen die deadline-events herinnerings-alarmen die ruim vooraf afgaan in de eigen agenda-app
> (certificaat 30 + 7 dagen, factuur 3, BTW 7, IB 14, einde plaatsing 14). `src/lib/calendar/ics.ts`: nieuw `IcsAlarm`-type (`daysBefore`+`description`)
>
> - optioneel `alarms` op `IcsEvent`; pure `formatIcsAlarmTrigger` (0→`PT0S`, n≥1→`-P{n}D`, ongeldig→`null`); `buildIcsCalendar` serialiseert
>   `BEGIN:VALARM`/`ACTION:DISPLAY`/`TRIGGER`/`DESCRIPTION` binnen het VEVENT (RFC 5545, zelfde escaping/folding). `src/lib/calendar/deadlines.ts`:
>   `administrativeDeadlineEvents` hangt de voorloopvensters per categorie aan, teksten perspectief-/betaal-bewust en bedrag-loos (publieke bearer-feed).
>   Weekrooster blijft alarm-loos (geen pop-up per dienst). Puur/server-side/deterministisch, geen schema-/mutatie-/authz-oppervlak. +tests (VALARM-
>   serialisatie + trigger-formatter in ics.test.ts; alarm-assertions per categorie in deadlines.test.ts). Gate: typecheck, lint, test (6403), build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — certificaat-compliance CSV-export (2026-08-19, PR #1162)** —
> de opdrachtgever ziet de dashboard-momentopname "Certificaten van je ZZP'ers" (welke lopende samenwerkingen een certificaat-actie
> vragen), maar kon die compliance-stand niet exporteren voor een kwaliteits-/zorgverantwoordelijke. Nu een "Exporteer (CSV)"-actie op de
> momentopname-kaart (alleen bij ≥1 samenwerking): één rij per melding — ZZP'er, opdracht, status (Actie vereist/Let op), en welke vereiste
> certificaten ontbreken/verlopen/binnenkort-verlopen/in-beoordeling zijn. Nieuwe pure `src/lib/collaboration-compliance-csv.ts`
> (`complianceCsv`, certificaattypes via `CREDENTIAL_TYPE_LABEL`, gescheiden met ", " zodat het CSV-scheidingsteken ";" de cel niet quoot;
> gedeelde `toCsv` met formule-injectie-guard CWE-1236 op namen/titels van derden). De rijen komen uit exact dezelfde bron als de
> momentopname (`clientCredentialAlertsFromRows` → alleen niet-COMPLIANT) → geen scherm↔export-drift. Nieuwe rol-bewuste route
> `src/app/(protected)/samenwerkingen/certificaten/export/route.ts` (alleen CLIENT; FREELANCER/ADMIN 403; rate-limited; ongewindowde query
> die `clientCredentialAlerts` spiegelt; triage-sortering NON_COMPLIANT vóór WARNING; auditregel `COMPLIANCE_REGISTER_EXPORTED`). Read-only,
> geen schema-/mutatie-/authz-/domeinmotor-oppervlak. Benchmark: klant-zichtbare compliance is ons onderscheid t.o.v. PIDZ/Zorgwerk
> (verborgen dossier). +9 tests (6 pure + 3 route-auth/-audit-parity) + audit-label. Gate: typecheck, lint, test (6390), build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er + opdrachtgever — CSV-export relatie-uitsplitsing op /inzicht (omzet/uitgaven per relatie) (2026-08-19, PR #1159)** —
> de kaarten "Omzet per opdrachtgever" (ZZP'er) en "Uitgaven per ZZP'er" (opdrachtgever) op `/inzicht` toonden de betaalde omzet/uitgaven per
> relatie op het scherm, maar waren — anders dan de franchiser-tegenhanger "Per opdrachtgever" (die al `/franchise/opdrachtgevers/export` had) —
> niet exporteerbaar. Nu een "Exporteer (CSV)"-actie op beide kaarten (alleen bij ≥1 relatie) die het debiteuren-/crediteuren-per-relatie-overzicht
> als CSV levert (kolommen relatie/bedrag/aandeel/samenwerkingen), naast het per-factuur-register (#1156). Nieuwe pure
> `src/lib/relation-breakdown-csv.ts` (`relationBreakdownCsv`, rol-afhankelijke koppen; behoudt de scherm-volgorde → geen drift; gedeelde
> `centsToEuroPlain`/`toCsv` met formule-injectie-guard). Nieuwe rol-bewuste route `src/app/(protected)/inzicht/relaties/export/route.ts`
> (FREELANCER=`getFreelancerRevenueBreakdown`, CLIENT=`getClientSpendBreakdown` — exact de kaart-fetchers, alleen eigen relaties; ADMIN/FRANCHISER
> 403; rate-limited; auditregel `RELATION_BREAKDOWN_EXPORTED`). Read-only, geen schema-/mutatie-/domeinmotor-oppervlak. +6 tests + export-auth/-audit-
> parity + audit-label. Gate: typecheck, lint, test (6377), build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er + opdrachtgever — factuurregister-CSV-export op /facturen (verkoop-/inkoopboek) (2026-08-19, PR #1156)** —
> de administratie kende al een **grootboek**-CSV (`/api/administratie/export`, regel per boeking, vanaf de Boekhouding-tab) maar geen
> **factuurregister**: het verkoopboek (ZZP'er) / inkoopboek (opdrachtgever) — één rij per factuur, dat een boekhouder als factuuroverzicht
> vraagt. Nu een "Exporteer (CSV)"-knop op `/facturen` (naast "Nieuwe factuur", alleen bij ≥1 factuur). Nieuwe pure
> `src/lib/invoice-register-csv.ts` (`invoiceRegisterCsv`): kolommen factuurnummer/factuurdatum/vervaldatum/tegenpartij/omschrijving/
> bedrag_excl_btw/btw/bedrag_incl_btw/status/betaald_op, oplopend op factuurdatum (concepten onderaan). De **status** hergebruikt exact
> `invoiceGroup` + `INVOICE_FILTER_LABEL` (zelfde cascade-bewuste indeling als de filter-pills) → geen scherm↔export-drift; bedragen via de
> gedeelde `centsToEuroPlain`/`toCsv` (formule-injectie-guard in de CSV-kern). Excl./btw-splitsing uit `subtotalCents`/`vatCents` (invariant
> excl.+btw=incl.); legacy losse factuur zonder splitsing → totaal excl. + €0 btw (verzint nooit een splitsing). Nieuwe route
> `src/app/(protected)/facturen/export/route.ts`: rol-bewust (FREELANCER=verkoop, CLIENT=inkoop, ADMIN 403 — die heeft /admin/facturatie),
> **exact dezelfde `where` als het facturen-paneel** (alleen eigen facturen), rate-limited, `AuthorizationError`→nette status, auditregel
> `INVOICE_REGISTER_EXPORTED`. Read-only, geen schema-/mutatie-/domeinmotor-oppervlak. +11 tests + gedeelde export-auth/-audit-parity + audit-label.
> Gate: typecheck, lint, test (6362+), build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — betaalgegevens (IBAN + betaalkenmerk) op de factuur-PDF (2026-08-19, PR #1154)** —
> het factuurdetail toont een `PaymentDetailsCard` (IBAN/t.n.v./betaalkenmerk/bedrag), maar die kaart is `print-hide` én de canonieke
> factuur-**PDF** (`invoice-pdf.ts`) bevatte géén betaalinstructie — een opgeslagen/geprinte/doorgestuurde factuur miste dus elke IBAN
> of betaalkenmerk (betalen = opzoeken/overtypen, foutgevoelig). Nu een "Betaalgegevens"-blok op de PDF dat de on-screen kaart exact
> spiegelt. Nieuwe pure `invoicePaymentRows(data)` (`src/lib/invoice-pdf.ts`, één bron → geen screen↔PDF-drift): IBAN via `formatIban`,
> t.n.v. = crediteurnaam, betaalkenmerk = `Factuur <nummer>`, bedrag = `totalCents` incl. btw (bij verlegde btw = 0 → werkelijk over te
> maken bedrag), uiterlijk betalen = vervaldatum; geen IBAN → geen blok. De betaal-pending-gate die de `PaymentDetailsCard` al gebruikte
> is geëxtraheerd naar een gedeelde pure `src/lib/invoice-payment-status.ts` (`isInvoicePaymentPending`) en gebruikt door zowel het
> factuurdetail als de PDF-route → één bron, geen drift; een betaalde/geannuleerde/concept-factuur krijgt géén betaalinstructie meer
> (agent-review should-fix). PDF-route selecteert nu `freelancer.iban` + `status`/`lifecycleStatus`; `buildInvoicePdf` tekent het blok
> onder de totalen. Geen nieuwe dependency, geen schema-/mutatie-/authz-wijziging, display-only. +8 tests. Gate: typecheck, lint, test
> (6351), build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — abonnements-reconcile-cron als webhook-backstop / self-healing (2026-08-19, PR #1153)** —
> een betaalde checkout zet een `Subscription` op `PENDING`; **alleen** de inkomende betaal-webhook tilt 'm daarna naar `ACTIVE`/`PAST_DUE`.
> `provider.paymentStatus(providerRef)` werd tot nu toe **uitsluitend** vanuit de webhook-route aangeroepen — valt die webhook stil (verkeerde
> callback-URL, handtekening-mismatch, geblokkeerde poort, provider-retry uitgeput), dan bleef élke checkout **voor altijd** op `PENDING` staan
> (niemand geactiveerd, omzet lekt stil weg). PR #1135 voegde alleen _detectie_ toe (`zzp_subscriptions_stale_pending`-gauge); dit voegt de
> _self-healing_ toe die Stripe/Mollie expliciet aanbevelen. Nieuwe taak `subscription-reconcile` (in `/api/tasks/run-all` + los
> `/api/tasks/subscription-reconcile`, `src/lib/subscription-reconcile-task.ts`): poll't de provider voor PENDING-rijen die langer dan
> `SUBSCRIPTION_RECONCILE_AFTER_MINUTES` (default 30, geklemd 5–1440) mét een `providerRef` op een bevestiging wachten, en past de opgehaalde
> status alsnog toe. De statustoepassing is geëxtraheerd naar de gedeelde idempotente `src/lib/billing/apply-payment-status.ts`
> (`applyResolvedPaymentStatus`) die **zowel** de webhook **als** de reconcile-taak gebruiken → één bron van waarheid + dezelfde
> `ProcessedWebhookEvent`-ledger-grendel, dus reconcile + late webhook op dezelfde betaling verlengen de periode niet twee keer. `open` laat de
> rij ongemoeid (trage SEPA telt nooit als vastgelopen); batch begrensd per tick (`SUBSCRIPTION_RECONCILE_MAX_BATCH`, default 50); provider-/DB-fout
> per rij → overslaan (volgende tick opnieuw), nooit de hele run breken. No-op met de mock-provider. Webhook-route gedrag ongewijzigd (behavior-preserving
> refactor). Resterend mensenwerk: niets extra — draait zodra `BILLING_PROVIDER=stripe`/`mollie` actief is. +24 tests (apply-helper 8, reconcile-taak 8,
> config-parsers 4, webhook-refactor groen). Gate: typecheck, lint, test (6342), build, prettier, check:env groen.
>
> Gedaan (niet opnieuw): **ZZP'er + opdrachtgever — ORT-uitsplitsing in de urenstaat-CSV-exports (2026-08-19, PR #1151)** —
> de CSV-exports van `/diensten` (ZZP'er) en `/prestaties` (opdrachtgever) droegen enkel een `ORT` Ja/Nee-kolom + het totaal-
> subtotaal, waardoor een zorg-boekhouder/payroll de onregelmatigheidstoeslag niet kon afstemmen tegen een CAO-loonstrook.
> Nu 4 extra kolommen — Reguliere uren, ORT-uren, Basisbedrag (EUR), ORT-toeslag (EUR) — met de invariant basis + toeslag =
> subtotaal. Nieuwe pure `src/lib/ort-breakdown.ts` (`summarizeOrtBreakdown`) bouwt de uitsplitsing uitsluitend op de canonieke
> `computeOrt`-motor (NORMAL = regulier, overige categorieën = ORT; bedragen 1-op-1 → geen drift met het factuursubtotaal);
> platte uren zonder segmenten → alles regulier; geen uurtarief (milestone) → leeg (kolommen blijven leeg, geen "0,00"-basis).
> Gewired in `getDienstenForFreelancer`/`getPrestatiesForClient` (geen extra query) + beide `exportXxxCsv`. Display/export-only,
> geen schema-/mutatie-/authz-/domeinmotor-wijziging. +tests (helper 6, CSV-kolommen ZZP'er+opdrachtgever, milestone-leeg).
> Gate: typecheck, lint, test (6318), build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — urenstaat-uitschieter-signaal bij goedkeuren op /prestaties (2026-08-18, PR #1150)** —
> het uurtarief van een urenstaat staat server-side vast (`rateCents = col.rate * 100` bij indienen); het **aantal uren** is
> daarmee de enige vrij-in te voeren waarde die de opdrachtgever bij het goedkeuren afstempelt — óók via het één-klik
> bulk-goedkeurpaneel. Een urenstaat die opvallend hoger is dan wat deze ZZP'er op dezelfde samenwerking normaal indient was stil
> overbetalingsrisico. Nu een rustige "controleer even"-attentie (geen blokkade). Nieuwe pure `src/lib/performance-hours-anomaly.ts`
> (`detectHoursAnomalies`): **mediaan**-baseline uit de GOEDGEKEURDE HOURS-urenstaten per samenwerking, markeert elke nog INGEDIENDE
> urenstaat die de mediaan met ≥30% **én** ≥8 u overstijgt (min-steekproef 3; absolute-uren-vloer dempt ruis op kleine weken;
> mediaan robuuster dan gemiddelde tegen scheve historie). Gewired als per-rij-waarschuwing op `/prestaties` + "controleer uren"-chip
> op het bulk-goedkeurpaneel (spiegelt de `hasStale`-chip). Baseline over de vólledige set (niet de gefilterde view). Read-only, alleen
> CLIENT, geen schema-/mutatie-/authz-/domeinmotor-oppervlak; goedkeuren loopt onveranderd door `approvePerformance`. +16 tests. Gate:
> typecheck, lint, test (6309), build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — diensten-samenvattingsstrip op /diensten (2026-08-18, PR #1145)** —
> de ZZP'er-urenstatenlijst (`/diensten`) was een platte lijst zonder aggregaat, terwijl de opdrachtgever-tegenhanger
> (`/prestaties`) juist wél een geld-samenvatting toont (`summarizePendingApprovalValue`). Die asymmetrie is gedicht met een
> rustige 3-koloms strip boven de lijst: **Wacht op goedkeuring** (€ + aantal urenstaten die bij de opdrachtgevers op
> goedkeuring wachten — geld dat vaststaat maar nog niet mag factureren; "N zonder tarief nog niet meegerekend" als een
> urenstaat geen berekenbaar subtotaal heeft, zelfde afspraak als de payer-kant), **Goedgekeurd** (€ + aantal vrijgegeven voor
> facturatie) en **Nog van jou** (concept in te dienen + afkeuring te herstellen, beide als deep-link naar het bestaande
> statusfilter). Nieuwe pure `src/lib/diensten-summary.ts` (`summarizeDiensten`/`hasDienstenSummary`) werkt op de reeds geladen
> `getDienstenForFreelancer`-data over de VOLLEDIGE set (niet de gefilterde view) → geen extra query, kan niet driften van de
> lijst eronder. Display-only, alleen FREELANCER, geen schema-/mutatie-/auth-oppervlak. +7 tests. Gate: typecheck, lint, test,
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Bemiddelaar — statusfilter op de dienstenlijst `/franchise/diensten` (2026-08-18, PR #1136)** —
> de bemiddelaar-dienstenlijst was de enige franchise-lijst zónder filter (concept/open/gevuld/gesloten in één platte lijst),
> terwijl `/franchise/zzpers` (zoek+filter+sorteer), `/franchise/opdrachtgevers` (health-tabs) én de opdrachtgever-`/opdrachten`
> (`JOB_STATUS_FILTER`-pills) wél triage-baar zijn. Een bemiddelaar met tientallen diensten kon niet inzoomen op "wat staat open".
> Nu statusfilter-pills (Alle/Open/Gevuld/Concept/Gesloten) met tellingen, spiegel van het `/opdrachten`-pill-patroon. Anders dan
> `job-status-filter.ts` (puur op `status`) leeft hier naast `status` een afgeleide `filled`-boolean (actieve samenwerking), dus de
> groepen zijn **wederzijds uitsluitende** triage-buckets met precedentie `gevuld > concept (DRAFT) > gesloten (CLOSED) > open`,
> gelijk aan de lijst-badge (`filled ? "Gevuld" : JobStatusBadge`) → pill en badge dezelfde taal, som van de tellingen = totaal.
> Server-side waarheid via `?status=`; aggregatiekaarten (vulgraad/prognose) blijven over de vólledige set, alleen de lijst filtert;
> geen extra DB-query, gefilterde empty-state. Nieuwe pure `src/lib/franchise/dienst-status-filter.ts` (+11 tests). Read-only, geen
> schema-/mutatie-/auth-oppervlak. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — stil-kapotte-webhook-detector `zzp_subscriptions_stale_pending` (2026-08-18, PR #1135)** —
> een betaalde checkout upsert een `Subscription` naar `PENDING`; alléén de betaal-webhook tilt 'm daarna naar `ACTIVE` (paid)/`PAST_DUE`
> (failed) — er is géén cron die `PENDING` verwerkt. Elke andere abonnementsstatus had al een stille-faal-gauge, `PENDING` niet: een
> verlaten checkout is één stille rij, maar een stil kapotte webhook (verkeerde callback-URL, handtekening-mismatch, geblokkeerde poort)
> laat ÉLKE checkout op `PENDING` staan → niemand geactiveerd, platform-omzet lekt stil weg, zonder dat iets dat toont. Nieuwe read-only
> gauge `zzp_subscriptions_stale_pending` op `/api/metrics` (abonnementen langer dan `SUBSCRIPTION_PENDING_STALE_HOURS`, default 24u, in
> `PENDING`), zelfde patroon als `zzp_subscriptions_overdue_expiry`: pure `stalePendingSubscriptionWhere`/`pendingStaleCutoff`
> (`src/lib/subscription-pending-stale.ts`, één bron van waarheid, `updatedAt`-klok reset bij een verse checkout-poging), config-clamp,
> gauge, route-query, drift-gate-sample, Prometheus-alert `ZzpSubscriptionsStalePending` (`> 0`, `for: 30h`) + onderhouds-inhibitie. Met de
> mock-provider (pilot-default) bestaat er nooit een `PENDING`-rij → gauge `0`. Geen schema-/mutatie-/auth-oppervlak, geen PII/secrets.
> +tests (where/cutoff/config-parser/metrics-map+clamp/route-query+fail-veilig/drift-gates). Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — betaalgedrag per opdrachtgever op /inzicht (2026-08-18, PR #1133)** —
> de ZZP'er zag "Omzet per opdrachtgever" (van wíe komt mijn omzet), maar niet hoe goed elke klant betaalt (betaaltermijn/op-tijd
> per opdrachtgever) — de cashflow-hefboom. Nieuwe kaart "Betaalgedrag per opdrachtgever": per klant een toon-badge (Betaalt op tijd/
> Gemiddeld/Betaalt vaak laat) + gemiddelde betaaltijd + op-tijd-% + aantal betalingen; traagste betalers bovenaan. Nieuwe pure
> `src/lib/freelancer-payer-behavior.ts` groepeert de eigen betaalde facturen (`issuerUserId`, PAID) per opdrachtgever en voedt elke
> groep in de bestaande pure `computePaymentBehavior` → geen drift met het betaalgedrag-blok op de opdracht-detailpagina. Alleen
> klanten met genoeg historie (`sampleSize >= PAYMENT_MIN_SAMPLE_SIZE`); read-only, alleen FREELANCER, alleen geaggregeerde statistiek,
> geen schema-/mutatie-/auth-oppervlak. +7 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Bemiddelaar — plaatsingen-per-maand trend op /inzicht (2026-08-17, PR #1132)** —
> alle bestaande franchiser-trends op `/inzicht` ("Doorgezet volume", "Fee per maand") meten in euro's; er was geen zicht op de
> operationele doorzet — hoevéél nieuwe plaatsingen per maand tot stand komen (recruitment-KPI, kern-throughput van een bemiddeling).
> Nieuwe kaart "Plaatsingen per maand" (staafstrip, 6 mnd) telt de nieuwe samenwerkingen per kalendermaand + totaal + delta laatste
> maand. Nieuwe pure `src/lib/placements-trend.ts` (`buildPlacementsTrend`/`getTenantPlacementsTrend`) hergebruikt exact de
> maand-bucketing (`monthlyRevenue`) + delta (`monthDeltaPct`) uit `revenue.ts` door elke plaatsing als één "cent" te tellen → geen
> drift met de geld-trends. Telt alleen ACTIVE/COMPLETED-samenwerkingen (echte inzet), tenant-gescoopt via `job.tenantId`;
> plaatsingsdatum = `startDate` met `createdAt`-terugval. Read-only, alleen FRANCHISER, geen schema-/mutatie-/auth-oppervlak. +6 tests.
> Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — push-aflever-heartbeat / dead-man's-switch voor web-push (2026-08-17)** —
> web-push (VAPID/PWA-pushmeldingen) was, anders dan e-mail, een gebruikersgericht afleverkanaal zónder doorlopend
> afleversignaal; een systematisch afwijzend kanaal (geroteerde/verlopen VAPID-sleutels, provider-storing) liet élke
> pushmelding stil mislukken omdat de delivery-taak elke behandelde notificatie best-effort als gepusht markeert
> (geen retry) en doorgaat. Nu registreert `src/lib/push-delivery-task.ts` na elke afleverronde die aan echte
> (niet-verlopen) endpoints probeerde af te leveren de uitkomst in een singleton `PushDeliveryHeartbeat` (geen PII),
> event-gedreven net als mail (`never`/`ok`/`failing`, geen staleness-op-leeftijd; verlopen abonnementen tellen
> bewust niet als mislukking) — zichtbaar op `/admin/systeemstatus` ("Push-aflevering"), machine-leesbaar via
> `zzp_push_delivery_ok`/`zzp_push_consecutive_failures`/`zzp_push_last_failure_age_seconds` op `/api/metrics`, met
> drop-in alert `ZzpPushDeliveryFailing` in `docs/observability/alerts.yml`. Resterend mensenwerk: niets extra —
> vult zichzelf zodra web-push bekabeld is. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — gemiddeld betaald uurtarief per maand op /inzicht (2026-08-16, PR #1114)** —
> de kosten-tegenhanger van de ZZP'er-tariefstrip (#1112). De client-`/inzicht` toonde totale uitgaven + uitgaven per ZZP'er,
> maar niet tegen wélk gemiddeld uurtarief hij inhuurt (tariefinflatie-signaal). Nu een "Gemiddeld betaald uurtarief per maand"-kaart:
> naar afgenomen uren gewogen `Σ(rateCents × uren)/Σ(uren)` per maand (excl. ORT), venster-gemiddelde + delta + staafstrip. Hergebruikt
> de identieke pure `buildHourlyRateTrend` met een client-gescoopte fetcher (`getClientHourlyRateTrend`, `collaboration.company.userId`)
> → geen drift met de ZZP'er-variant; delta neutraal getoond (kostenstijging ≠ prestatie). `GemiddeldUurtariefPerMaandCard`
> geparametriseerd (title/caption/emptyDescription/deltaTone); ZZP'er-aanroep ongewijzigd. Read-only, alleen CLIENT, geen schema-/
> mutatie-/auth-oppervlak. +3 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — semantische matching (pgvector): stille-degradatie-gat gedicht (2026-08-16)** —
> `SEMANTIC_MATCHER=pgvector` was de enige env-selecteerbare driver die zonder boot-fout/waarschuwing/status/metriek stilletjes de
> relevantie-component van elke match op `0` zette (`relatedness()` gooit, `safeRelatedness` ving het stil op). `getSemanticMatcher()`
> (`src/lib/services/semantic-matcher.ts`) valt nu graceful terug op `LocalSemanticMatcher` zolang pgvector niet operationeel is
> (nieuw `isOperational()`/`configuredSemanticMatcher()`), plus env-waarschuwing, `/admin/systeemstatus`-item (groep Schaalbaarheid),
> read-only semantische-matching-zelftest + go-live-sweep-runner + UI-kaart. Resterend is puur mensenwerk (pgvector-DB-provisioning:
> extensie, embedding-kolom, ANN-index, echte `isOperational()`-check — zie MENSENWERK.md §0b, RUNBOOK §2b); `SEMANTIC_MATCHER=local`
> blijft tot dan de juiste productie-instelling. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — HIBP gelekt-wachtwoord-controle live zelftest + go-live-sweep (2026-08-14, PR #1094)** —
> de gelekt-wachtwoord-controle (`password-breach.ts`, HIBP, `PASSWORD_BREACH_CHECK=hibp`) was de enige **fail-open** externe integratie
> zónder live-zelftest/sweep-entry/metric. Een stille HIBP-storing (netwerk/time-out/non-200/gewijzigd contract) laat élk nieuw wachtwoord
> ongecontroleerd door (`skipped`) zonder dat iets dat toont — dezelfde stille faalmodus die de rate-limit-/upload-scanner-zelftests afvangen.
> Nieuwe pure/injecteerbare `src/lib/services/password-breach-selftest.ts` (spiegel van de upload-scanner-EICAR-zelftest): haalt één
> bekend-gelekt test-wachtwoord door de controle en bewijst bereikbaarheid (`skipped`→fout) én detectie (`breached:false`→fout, `true`→OK).
> Gewired als `runPasswordBreachSelfTestAction` (auth→rol→rate-limit→audit, geen secrets/PII) + 10e go-live-sweep-runner + UI-kaart op
> `/admin/systeemstatus`. Read-only, k-anoniem, controle blijft fail-open in de flow; geen schema-/mutatie-/auth-oppervlak. +9 tests. Gate:
> typecheck, lint, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — kosten-per-maand trend op /uitgaven (2026-08-14, PR #1092)** —
> de administratie-hub-tab Uitgaven toonde kosten dit jaar, aftrekbare btw en kosten per categorie, maar geen tijdsdimensie —
> je zag niet wánneer je kosten piekten. De winst-per-maand-trend op /inzicht toont winst-bars + één kostentotaal, maar geen
> kosten-bars per maand, en niet op de pagina die juist over kosten gaat. Nu een self-contained "Kosten per maand"-staafstrip
> (laatste 6 maanden, netto excl. btw) tussen de kerncijfers en de categorie-verdeling. Nieuwe pure `src/lib/expense-trend.ts`
> (`buildExpenseTrend`/`toExpenseRows`/`expenseTrend`) hergebruikt exact de maand-bucketing (`monthlyRevenue`) + delta
> (`monthDeltaPct`) uit `revenue.ts` → geen drift met de omzet-/winsttrends (zelfde TZ Europe/Amsterdam, maandgrenzen,
> afronding). Laadt zijn eigen venster-gescoopte uitgaven (niet afhankelijk van de 200-rij-lijstcap); render via de bestaande
> `BarSeries`. Read-only, alleen FREELANCER, geen schema-/mutatie-/auth-oppervlak. +8 tests. Gate: typecheck, lint, test (5915),
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Bemiddelaar — fee-per-maand trend op /inzicht (2026-08-14, PR #1089)** —
> de FRANCHISER-`/inzicht` toonde in "Jouw fee" alleen een all-time totaal, geen fee-over-tijd — terwijl dat zijn kern-P&L is.
> Nu een "Fee per maand"-trendkaart (spiegel van de ZZP'er "Winst per maand"), berekend uit de reeds geladen omzettrend
> (`getTenantRevenueTrend`) × het ingestelde fee-percentage via de bestaande `computeTenantFee`. Nieuwe pure
> `src/lib/tenant-fee-trend.ts` (`buildTenantFeeTrend` → fee/volume per maand + totalen + delta laatste maand vs.
> voorlaatste, elke maand afzonderlijk afgerond zodat het maand-totaal de som van de getoonde balken is);
> `FeePerMaandCard` op de franchiser-tak (alleen als de fee is ingesteld; delta-badge alleen bij ≥2 maanden fee).
> Geen extra query, geen schema-/mutatie-/auth-oppervlak, display-only, server-side waarheid. +9 tests. Gate: typecheck,
> lint, test (5900), build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — VAPID web-push env-validatie + half-activatie-guard + systeemstatus-posture (2026-08-14, PR #1088)** —
> `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` (web-push) stonden wél in `.env.example` maar ontbraken volledig in de env-validatie
> (`src/lib/env.ts`) én in de systeemstatus/preflight-posture (`src/lib/system-status.ts`) — het enige gebruikersgerichte meldkanaal zonder
> go-live-zichtbaarheid, en een half-geconfigureerde sleutel (één van twee gezet) schakelde push stil UIT zonder boot-fout. Nieuwe pure
> `src/lib/push/config.ts` (`resolveWebPushConfigState` configured/partial/off + `isValidVapidSubject` RFC 8292) als gedeelde bron van waarheid
> voor env-validatie, de runtime (`web-push.ts`) én de posture → geen drift. env.ts: VAPID in het schema + superRefine-guard (partial → boot-fout,
> eis beide of geen) + subject-formaatvalidatie. system-status: posture-item "Push-notificaties" (ok als bekabeld, anders fallback — optionele
> extra, nooit "aandacht"). +24 tests (config/env/system-status). Geen schema-/mutatie-/auth-oppervlak; geen gedragswijziging als push al bekabeld
> is. Resterend mensenwerk: optioneel `npx web-push generate-vapid-keys` + de sleutels in de secrets. Gate: typecheck, lint, test, build, prettier groen.

---

> Gedaan (niet opnieuw): **Bemiddelaar — stilgevallen opdrachtgever als next-action op /acties + /franchise/opdrachtgevers-badge (2026-08-13, PR #1083)** —
> de relatiegezondheid "stilgevallen opdrachtgever" (`attention`-tier: geen open dienst én geen lopende samenwerking, ≥ `CLIENT_IDLE_DAYS`=30 dagen
> rustig) stond al op de klantenlijst-strip én het klantdetail (`ClientReengagementCard`), maar niet op `/acties`, en `/franchise/opdrachtgevers` was
> het enige bemiddeling-navitem met een pagina-signaal zónder badge — het "signaal op één oppervlak"-anti-patroon. Re-engagement van een warme,
> bestaande relatie is hoger-leverage dan koude acquisitie (benchmark Bullhorn/PIDZ-regiokantoor). Nu emit `franchiserTasks` per `attention`-klant een
> `franchiseClientReengagementTask` (kind `franchise-client-reengagement`, deep-link naar het klantdetail) op /acties + de rail, en `signals.ts` telt
> `attentionClients` als badge op `/franchise/opdrachtgevers` (exact het aantal /acties-taken). Eén bron van waarheid: nieuwe pure
> `buildClientActivityInputs`/`clientIdleDays` in `client-health.ts` die de klantenlijst-pagina, de engine én de badge delen (de "laatst-actief"-
> afleiding leeft op één plek → geen drift). Prioriteit `P.franchiserClientReengagement`=55 (onder aflopende plaatsing 62, boven koude lead 50).
> Query spiegelt de pagina exact (`company.findMany({ where:{ tenantId }})` + 2 groupBy-aggregaten, geen N+1). Server-side waarheid, read-only signaal,
> geen schema-/mutatie-/auth-oppervlak. +tests (helper, builder+ordening, engine×3, badge-pariteit). Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — verwachte betaaldatum in de openstaande-posten CSV (debiteurenlijst) (2026-08-13, PR #1075)** —
> de `/openstaand`-pagina toont de ZZP'er per post de realistische verwachte-betaaldatum (uit het betaalgedrag van de opdrachtgever), maar de
> CSV-export (`/api/administratie/openstaand`) gaf enkel de contractuele vervaldatum — screen↔export-drift op de cashflow-info die een
> boekhouder/cashflow-tool wil. Nu draagt de ZZP'er-CSV een extra kolom `verwachte_betaaldatum` (ná `vervaldatum`), dezelfde effectieve
> verwachte-binnendatum die het scherm toont; opdrachtgever/ADMIN houden de kale 7-koloms-vorm. Hergebruikt de bestaande pure motor
> `buildPayoutForecastMap`/`effectivePayoutDate` (kan niet driften met het scherm); `agingCsv(report, expectedPaymentDates?)` optioneel →
> zónder map byte-identiek aan voorheen. Read-only, geen schema-/domeinmotor-/mutatie-/auth-wijziging. +4 tests. Gate: typecheck, lint, test,
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — koud-lopende opdracht als next-action op /acties (+ /opdrachten-badge) (2026-08-12, PR #1070)** —
> het vacaturetempo-signaal (`summarizeVacancyPerformance.attention` — een gepubliceerde opdracht die koud loopt: geen/weinig kandidaten voor
> de tijd dat hij open staat) stond al op de opdracht-lijst/-detail én als achtergrondnotificatie (`job-engagement.ts`), maar ontbrak in het
> next-action-model. Een ongevulde opdracht die geen kandidaten trekt is juist het hoogste-leverage-bijstuur-moment (tarief/eisen/omschrijving).
> Nu emit `clientTasks` het als `jobNeedsAttentionTask` (kind `job-needs-attention`, deep-link naar het opdracht-detail waar de tarief-diagnose
>
> - bijstuur-knoppen staan) op /acties + de dashboard-rail, en de `/opdrachten`-nav-badge telt het mee (het "signaal op één oppervlak"-anti-
>   patroon). Eén bron van waarheid: nieuwe gedeelde `getClientColdJobs` (`src/lib/data/client-cold-jobs.ts`) — pre-filter DB-side op de
>   niet-ingetrokken-reactie-telling (`VACANCY_COLD_MAX_APPLICATIONS`, want beide attentie-takken vereisen < 3 reacties), dan per kandidaat de
>   echte reactie-tijdstempels in één query (geen N+1), en de pure `summarizeVacancyPerformance` beslist `attention`; dezelfde helper voedt /acties
>   én de badge → geen drift. Prioriteit `P.jobNeedsAttention: 44` (boven concept-opdracht/completeness, onder het inkomende-kandidaten-cluster +
>   collaborationRenewal). De `/opdrachten`-badge combineert concept-opdrachten (info) met het koud-signaal (attention, dynamische toon zoals de
>   /admin/gebruikersbeheer-badge). Server-side waarheid, read-only signaal, geen schema-/mutatie-/auth-oppervlak. +tests (helper/builder/
>   integratie/badge-pariteit) + 7 bestaande client-task-/signals-tests neutraliseren de nieuwe helper. Gate: typecheck, lint, test (5840), build,
>   prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — performance-grace stille-faal-gauge (`zzp_performances_overdue_grace`) (2026-08-12, PR #1069)** —
> stille-faal-detector voor de laatste uitbetaal-kritische statustransitie-cron zonder gauge: `performance-grace` (SUBMITTED-prestatie →
> automatisch APPROVED na het grace-venster `PERFORMANCE_GRACE_DAYS`, wat de factuur-cascade start). De cron-heartbeat bewijst alleen DÁT
> `/api/tasks/run-all` afrondde, niet DÁT 'ie de grace-pijplijn verwerkte; bij een systematisch falende grace-taak blijven ingediende prestaties
> ná hun deadline in SUBMITTED hangen → geen factuur, ZZP'er niet uitbetaald, zonder dat iets dat toont. Zelfde patroon als
> `zzp_credentials_overdue_expiry`/`zzp_subscriptions_overdue_expiry`/`zzp_invoices_overdue_unflipped`/`zzp_reviews_overdue_reveal`. Nieuwe
> geëxporteerde `overduePerformanceGraceWhere(cutoff)` als één bron van waarheid (gedeeld door de taak-findMany die auto-goedkeurt én de
> gauge-telling → geen drift); gate op `performanceGraceDays() > 0` → staat het venster uit (pilot-default) dan gauge `0` (geen misleidend
> signaal, geen onnodige DB-read). Drop-in alert `ZzpPerformancesOverdueGrace` (`> 0`, `for: 30h`) + onderhouds-inhibitie, vastgeklonken aan
> de drift-gate. Read-only count, faalt veilig (0, nooit 500, geen PII), geen schema-/mutatie-/auth-oppervlak. +tests. Gate: typecheck, lint,
> test (5825), build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — IB-aangiftedeadline als next-action op /acties (2026-08-11, PR #1058)** —
> de aangifte-inkomstenbelasting-deadline (uiterlijk 1 mei ná het belastingjaar) — dé grootste jaarlijkse administratie-deadline —
> zat al in de agenda-feed (#1045) en het ontzorg-overzicht, maar ontbrak op `/acties` (+ badge + rail), terwijl de kwartaal-BTW-deadline
> er wél een `vat-deadline`-taak had. Nu emit de item-engine (`freelancerTasks`) de IB-deadline óók als forward-looking next-action zodra
> hij nadert. Nieuwe pure gate `incomeTaxDeadlineNeedsAction` (nudge alléén bij `status==="due-soon"`, binnen `INCOME_TAX_DEADLINE_SOON_DAYS`
> = 30 — buiten dat venster jaarrond ruis; spiegelt `vatDeadlineNeedsAction`); nieuw taak-kind `income-tax-deadline` + pure builder
> `incomeTaxDeadlineTask` (subtitel met aftelling + "je jaaroverzicht staat klaar", `resolver:"link"` → `/ontzorgd/aangifte`, nooit "te laat" —
> forward-looking, geen "ingediend"-vlag). Prioriteit `incomeTaxDeadlineDueSoon: 57` (onder kwartaal-BTW `vatDeadlineDueSoon` 58, boven één
> naderende factuurbetaling `paymentDueSoon` 56). Hergebruikt de reeds-omzet-gegate loader `getIncomeTaxDeadlineForActor` (#1045; alleen
> FREELANCER, jaar-/owner-gescoopt) — geen extra query, geen schemawijziging, geen nieuw mutatie/auth-oppervlak, server-side waarheid,
> read-only. +5 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Security — anti-oracle (CWE-203) op `createPerformance` (2026-08-11, PR #1056)** —
> laatste existence-oracle in de party-guarded cascade-commando's gedicht (persona-sweep run 70, GEPARKEERD LOW).
> `createPerformance` (`src/lib/cascade/performance-commands.ts`) gaf een niet-partij die een geldig
> `collaborationId` raadde de behulpzame rolmelding "Alleen de ZZP'er kan een prestatie vastleggen." (bevestigt
> dat de samenwerking bestaat), terwijl een onbekend id "Samenwerking niet gevonden." teruggaf — een productie-
> observeerbaar verschil op het MILESTONE-pad (`logAndSubmitPerformanceAction` toont de melding als returnwaarde).
> De 5 siblings (`update/submit/approve/reject/editAndResubmit`) waren al op #903 geünificeerd; dit was de enige
> die achterbleef. **Fix:** een actor die noch de ZZP'er, noch de opdrachtgever, noch admin is, krijgt nu exact
> dezelfde "Samenwerking niet gevonden."-melding als een onbekend id (`col.company.userId` was al meegeladen — geen
> extra query); alleen de opdrachtgever (partij, verkeerde kant) houdt de behulpzame rolmelding. Server-side
> waarheid, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +2 regressietests in
> `anti-oracle-party.test.ts` (17 → 19). Gate: typecheck, lint, test (5769), build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — mail-aflever-heartbeat / dead-man's-switch voor het e-mailkanaal
> (2026-08-11, PR volgt)** — e-mail is een productiekernkanaal (§2: certificaat goedgekeurd, wachtwoordherstel,
> herinneringen), maar had — anders dan opslag/database/cron/back-up — géén doorlopend afleversignaal. Een
> systematisch afwijzende provider (verlopen sleutel, gede-verifieerd domein, geschorst account, harde
> rate-limit) laat élke mail stil mislukken; de verzendcode vangt de fout PII-veilig af (`logMailFailure`) en
> gaat door, dus niemand merkt het tot een gebruiker klaagt. Nu registreert elke verzending via een echte
> driver (smtp/resend/postmark/ses) de uitkomst in een singleton `MailDeliveryHeartbeat`, via een nieuwe
> `RecordingMailSender`-decorator rond `getMailSender()` (de `noop`-driver registreert bewust niets). Anders
> dan cron/back-up is dit **geen** staleness-op-leeftijd (e-mail is event-gedreven) maar het oordeel op de
> **laatste** verzending: `never`/`ok`/`failing` + `consecutiveFailures`. Zichtbaar op `/admin/systeemstatus`
> (nieuwe kaart "E-mailaflevering") en machine-leesbaar op `/api/metrics` (`zzp_mail_delivery_ok`,
> `zzp_mail_consecutive_failures`, `zzp_mail_last_failure_age_seconds`). Drop-in Prometheus-alert
> `ZzpMailDeliveryFailing` (`zzp_mail_delivery_ok == 0 and zzp_mail_consecutive_failures >= 3`, `for: 15m`) in
> `docs/observability/alerts.yml`, toegevoegd aan de onderhouds-inhibitie in `alertmanager.yml`, vastgeklonken
> aan de drift-gates. Herstel wordt automatisch gewist zodra een verzending slaagt (of via de E-mail-zelftest).
> Bevat nooit PII/secrets — alleen tijdstippen, teller, driver-modus. Registratie is fail-open (een DB-storing
> in de heartbeat mag een geslaagde verzending niet laten falen, noch een echte verzendfout maskeren). Gate:
> typecheck, lint, test, build, prettier + drift-gates groen.
>
> Gedaan (niet opnieuw): **Bemiddelaar — vervolgsignaal bij een aflopende plaatsing op /acties (2026-08-11, PR #1052)** —
> de opdrachtgever (`clientTasks`) én de ZZP'er (`freelancerTasks`) kregen allebei al een `collaboration-renewal` next-action zodra een
> lopende samenwerking haar einddatum nadert/passeert (`renewalTasks`, op /acties + badge + rail). De bemiddelaar — die de plaatsing
> brokerde en er de fee op verdient — kreeg niets: `franchiserTasks` riep `renewalTasks` nooit aan en er was geen franchise-renewal-taak.
> Een aflopende plaatsing is juist zijn hoogste-leverage-moment (verlengen, opdrachtgever behouden, geen onverwacht bezettingsgat). Nu emit
> de item-engine het vervolgsignaal ook voor de FRANCHISER: tenant-gescoopte `collaboration.findMany` (via `job.tenantId`, `status ACTIVE`,
> `disputedAt null`, `endDate` binnen het venster) → hergebruikt de al-geteste pure `summarizeCollaborationRenewal` → nieuwe pure builder
> `franchiseCollaborationRenewalTask` (kind `franchise-collaboration-renewal`, toont beide partijen, deep-link
> `/franchise/samenwerkingen?status=ACTIVE` — er is geen bemiddelaar-detailpagina per inzet). Prioriteit `franchiserCollaborationRenewal: 62`
> (onder de open-dienst-taken, boven een koude lead). Dezelfde pure fase-classificatie als de twee partij-taken → geen drift over de drie
> oppervlakken. Server-side waarheid, read-only signaal, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +10 tests. Gate: typecheck,
> lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — dashboard-weekstrip toont echte dienst-belasting (2026-08-11, PR #1049)** —
> de "Deze week"-strip op het opdrachtgever-dashboard was decoratief: `buildCurrentWeek(...)` kreeg `undefined` als dag-belasting → elke
> dagbalk 0, altijd een lege week, en de telling toonde `activeCount` (totaal actieve samenwerkingen) i.p.v. de diensten die déze week lopen —
> een misleidend getal boven een lege strip. De ZZP'er-tak bouwt die strip al echt op (`weekOverview` + `buildWeekStrip` uit `weekdays`/
> `startDate`/`endDate`, met per-dag-belasting); de opdrachtgever — die vaak meerdere ZZP'ers tegelijk inzet — kreeg dit niet, terwijl het
> dashboard zijn primaire dagelijkse blik is. Nu bouwt de client-tak een echte `weekOverview` (label per dienst = de ZZP'er op locatie),
> gegate op `runningZonePlan(...).showWeek` (2–6 lopend, exact als de ZZP'er — een afgekapte set zou de telling laten liegen); de render
> overlayt de echte per-dag-belasting en toont het aantal diensten déze week (buiten het venster: lege strip + "0 diensten" i.p.v. het oude
> misleidende totaal). Nieuwe pure `weekStripLoadByDate` in `week-strip.ts` (dedupliceert de inline-loop uit de ZZP'er-tak) + 2 tests; client
> select uitgebreid met `startDate`/`endDate`/`rate`/`weekdays` + `freelancer.id`. Server-side waarheid, read-only, geen schemawijziging, geen
> nieuw mutatie/auth-oppervlak. Gate: typecheck, lint, test (5706), build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — verwachte betaaldatum (op betaalgedrag) op /openstaand (2026-08-11, PR #1046)** —
> de openstaande-postenpagina (`/openstaand`) — de "wie is mij geld schuldig"-hoofdpagina van de ZZP'er — toonde de betaal-timing per
> post op de **contractuele vervaldatum** ("verwacht rond {dueAt}") en telde de "Binnenkomend deze week"-tegel op diezelfde vervaldag.
> De betaalgedrag-forecast (`forecastInvoicePayout`) die de #1 cashflow-vraag "wanneer krijg ik mijn geld?" beantwoordt bestond al en
> draaide op `/facturen` + `/prognose`, maar niet op deze aging-view. Nu leidt `/openstaand` per opdrachtgever de realistische
> betaaldatum af uit de eigen betaalhistorie (privacy — nooit data van andere ZZP'ers): een structureel trage opdrachtgever verschuift
> naar "verwacht betaald rond {datum} · doorgaans X dagen na de vervaldag", en zijn geld valt niet langer te vroeg in "Binnenkomend
> deze week". **Conservatief:** alleen een betrouwbare forecast die **later** valt dan de vervaldag corrigeert — nooit optimistischer dan
> de contractuele datum (spiegelt `data/income-forecast.ts`). Overdue/aging blijft op de contractuele vervaldag. Server-side waarheid,
> alleen FREELANCER, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Nieuw pure `payout-forecast.ts`
> (`buildPayoutForecastMap`/`effectivePayoutDate`) + 9 tests; `openstaand-panel.tsx` laadt de eigen PAID-facturen en maakt weektegel +
> per-rij-regel forecast-bewust. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — IB-aangiftedeadline in de persoonlijke agenda-feed (2026-08-10, PR #1045)** —
> de agenda-export (`/api/agenda` + webcal `/api/agenda/feed.ics`) exporteerde al certificaat-verloop, factuur-vervaldatum en
> BTW-aangifte, maar niet de jaarlijkse aangifte inkomstenbelasting (NL-standaard: uiterlijk 1 mei ná het belastingjaar) — een
> deadline die een ZZP'er niet mag missen. Nu een los gehele-dag-event in beide feeds (éénmaal abonneren → altijd in de eigen
> agenda-app). Bewust **forward-looking**: geen "ingediend"-vlag in het systeem (aangifte gebeurt buiten het platform via
> DigiD/fiscaal dienstverlener), dus altijd de eerstvolgende nog niet verstreken deadline (venster flipt op 2 mei naar het lopende
> belastingjaar) i.p.v. een mogelijk-al-ingediende verstreken datum. Gegate op werkelijke activiteit (`revenueCents > 0` in dat jaar,
> spiegelt de BTW-saldo-gate → geen ruis bij een slapende onderneming). Privacy: geen bedragen in het event. Nieuw pure
> `income-tax-deadline.ts` (`incomeTaxFilingDeadline`/`nextIncomeTaxYear`/`summarizeIncomeTaxDeadline`/`taxYearRange`) +
> data-loader `data/income-tax-deadline.ts` (owner-/jaar-gescoopt, alleen FREELANCER); gewired in `calendar/deadlines.ts` +
> `calendar/user-deadlines.ts`. Server-side waarheid, read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +alle
> tests (income-tax-deadline pure + data + deadlines + user-deadlines + agenda-feed-mocks). Gate: typecheck, lint, test (5674),
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — faalattributie op de cron-heartbeat (wélke taak faalde) (2026-08-10, PR #1042)** —
> de cron-heartbeat (dead-man's-switch) registreerde alléén ÓF de laatste `/api/tasks/run-all` een taakfout had (`lastOk`);
> wélke van de ~28 taken faalde stond alleen in de server-logs (de systeemstatus-kaart zei letterlijk "controleer de
> server-logs op de gefaalde runner"). Sinds de per-taak-deadline (#1037) time-outen taken bovendien onafhankelijk, wat het
> gat scherper maakt. Nu bewaart de heartbeat de namen van de gefaalde taken (`CronHeartbeat.lastFailedTasks`, gewist bij een
> geslaagde run) en toont `/admin/systeemstatus` ze direct ("Gefaalde taken: expiry, message-retention"). Namen = statische
> code-identifiers (géén PII), defensief gesaneerd tot `[a-zA-Z0-9_-]`-slugs vóór opslag/weergave (geen log-/UI-injectie).
> Additief-nullable veld (veilige `db push`), server-side waarheid, heartbeat faalt nooit naar buiten, geen nieuw
> auth-/mutatie-oppervlak. Nieuwe pure `cron-failed-tasks.ts` (serialize/parse/normalize). +19 tests. Gate: typecheck, lint,
> test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — routing-cache retentie-backlog gauge (`/api/metrics`, AVG art. 5(1)(e)) (2026-08-02, PR volgt)** —
> laatste PII-dragende "verwijder-ouder-dan-venster"-retentie-prune zonder stille-faal-detector gedicht (na audit/reacties/
> notificaties/leads/health-incident-IP/messages/webhook-events). Nieuwe gauge `zzp_routing_cache_retention_backlog` telt
> `GeocodeCache`- + `TravelRouteCache`-rijen wier eigen TTL (`expiresAt`) is verstreken die de `routing-cache-retention`-cron nog
> niet fysiek verwijderde. Beide tabellen dragen **platte-tekst locatie-PII** (`query`/`fromQuery`/`toQuery`, adres-/plaatsindicaties);
> de leeslaag negeert verlopen rijen alleen lazy → deze cron dwingt als enige de opslagbeperking af. **Anders dan de 7 bestaande
> backlog-gauges is deze retentie ALTIJD actief** (TTL per rij ingebakken, geen instelvenster → nooit `0`-per-definitie; cutoff = `now`).
> Nieuwe geëxporteerde `prunableRoutingCacheWhere(cutoff)` als enige bron van waarheid, gedeeld door taak (delete) + gauge (count) over
> beide tabellen → geen drift. Read-only count, faalt veilig (0, nooit 500), geen schema/PII. Drop-in alert `ZzpRoutingCacheRetentionBacklog`
> (`>0`, `for:30h`) + onderhouds-inhibitie, vastgeklonken aan beide drift-gates. +4 tests, 5578 unit-tests. Gate: typecheck, lint, test,
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Bemiddelaar — `/franchise/zzpers`-badge sluit superseded verlopend cert uit (badge = /acties) (2026-08-01, PR #1026)** —
> de franchiser-nav-badge voor `/franchise/zzpers` telde (bijna-)verlopende geverifieerde certificaten van tenant-ZZP'ers via een
> **rauwe** `expiresAt: { gte: now, lte: soon }`-query zonder supersede-uitsluiting, terwijl de /acties-bron (`franchiserTasks` →
> `rosterExpiringByProfile`) superseded exemplaren wél uitsluit (het laatste supersede-gat, run-55 GEPARKEERD). Een ZZP'er die zijn
> certificaat vernieuwde door een **nieuw** cert van hetzelfde type aan te maken (i.p.v. het bestaande te bewerken) telde zo alsnog mee
> in de badge → de badge over-rapporteerde t.o.v. /acties (valse "verloopt binnenkort"-telling die de bemiddelaar liet najagen). Exact de
> "badge luider dan /acties"-driftklasse die de codebase herhaaldelijk dicht. **Fix:** de badge draait nu dezelfde twee-staps, supersede-
> aware aggregatie als /acties — kandidaat-scope (in-venster verlopend, gecapt/geordend zoals /acties) → volledig VERIFIED-dossier per
> kandidaat (`freelancerProfileId in [...]`) → `rosterExpiringByProfile(...).length`. Eén bron van waarheid, kan niet meer driften.
> Server-side waarheid, read-only telling, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +2 regressietests (superseded telt
> niet mee → geen badge; gemengd echt+superseded → count 1). Gate: typecheck, lint, test (5568), build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — webhook-event-ledger retentie-backlog gauge (`/api/metrics`, availability) (2026-08-01, PR #1024)** —
> laatste "verwijder-ouder-dan-venster"-retentie-gat in de stille-faal-detectorlaag gesloten. Nieuwe gauge
> `zzp_webhook_events_retention_backlog` telt `ProcessedWebhookEvent`-rijen ouder dan `WEBHOOK_EVENT_RETENTION_DAYS`
> die de `webhook-event-retention`-cron nog niet snoeide. Anders dan de 6 bestaande backlog-gauges **niet
> AVG-gedreven maar availability-gedreven**: de ledger draagt geen PII (opaque providerreferentie + status) maar
> groeit monotoon met elk betaal-webhook — stalt de cron stil terwijl een venster gezet is, dan bloeit tabel/index
> onbeperkt op (schijf-/querylast). Nieuwe geëxporteerde `prunableWebhookEventWhere(cutoff)` als enige bron van
> waarheid, gedeeld door taak (delete) + gauge (count) → geen drift; retentie UIT (pilot-default) → 0. Read-only
> count, faalt veilig, geen schema/PII. Drop-in alert `ZzpWebhookEventsRetentionBacklog` (`>0`, `for:30h`) +
> onderhouds-inhibitie, vastgeklonken aan beide drift-gates. +6 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — geaccepteerde kandidaat wacht te lang op samenwerkingsvoorstel escaleert op /acties (2026-08-01, PR #1015)** —
> de `proposeCollaboration`-taak (een ACCEPTED-reactie zonder samenwerkingsvoorstel) stond op een **vlakke** prioriteit
> (`P.proposeCollaboration` = 68) zonder leeftijdsbesef. Een geaccepteerde ZZP'er die dagen op het beloofde voorstel wacht
> staat in het ergste limbo (zei "ja", er volgt niets) — exact het "signaal zonder aging in het next-action-model"-patroon
> van #1001 (firstLookOverdue) en #1014 (conceptInvoiceAging), nu voor de derde beslis-fase (accept → voorstel). Nieuw veld
> `Application.acceptedAt DateTime?` (additief-nullable, veilige `db push`), gezet op → ACCEPTED in `kandidaten/actions.ts`
> (enige plek; bulk-triage sluit ACCEPTED uit); legacy-rijen (null) → fallback op `updatedAt`. Pure `pendingCollaborationProposals`
> kreeg `now` + `agingDays` (geklemd ≥ 0) + `stalled`; `proposeCollaborationTask` een optionele `agingDays?` → bij
> `≥ PROPOSAL_STALL_DAYS` (3) prioriteit 68 → nieuwe band `P.proposeCollaborationStalled` (69, onder contractSign 72) + subtitel
> "al X dagen geaccepteerd — rond de hire af". `undefined` = gedragsbehoudend. Server-side waarheid, één read-only signaal,
> geen nieuw auth-oppervlak. +5 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — verouderde concept-factuur escaleert op /acties (2026-07-31, PR #1014)** —
> de dashboard-tegel "Nog te factureren" draaide al naar warning zodra de oudste niet-ingediende concept-factuur ≥
> `UNBILLED_AGING_DAYS` (7) bleef liggen, maar op `/acties` (+ badge + rail) stond diezelfde concept op een **vlakke**
> prioriteit zonder leeftijdsbesef — een 20 dagen oude concept zag er identiek uit als een van vandaag (signaal op één
> oppervlak, afwezig in het next-action-model). De ZZP'er zit dan op zijn eigen, nog-niet-verzonden geld voorbij het
> herinner-/escalatievenster. Nu escaleert de indien-taak mee: `invoiceSubmitTask` kreeg een optionele `agingDays?`; bij
> `≥ UNBILLED_AGING_DAYS` klimt de prioriteit van `P.messagesAwaiting` (55) naar de nieuwe band `P.conceptInvoiceAging`
> (59, onder overdue 60 / rejected 62, boven de pre-due nudges) en het subtitel-label wordt "{opdracht} · al X dagen klaar".
> `freelancerTasks` leest nu `createdAt` op de collab-facturen en geeft `daysSince(inv.createdAt, now)` mee. Drempel +
> `daysSince` hergebruikt → geen drift met dashboard/reminder-cron. `undefined` = gedragsbehoudend. Read-only signaal, geen
> schemawijziging, geen nieuw mutatie-/auth-oppervlak. +5 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Bemiddelaar — roster-capaciteit respecteert self-set UNAVAILABLE-venster (2026-07-31, PR #1013)** —
> op `/franchise/zzpers` classificeerde het capaciteitsoverzicht (`isIdleReady`/`summarizeRosterCapacity`) een ZZP'er als
> "nu vrij inzetbaar" op alléén de grove `FreelancerProfile.availability`-enum. Een ZZP'er die zichzelf via een
> `AvailabilityWindow` (`UNAVAILABLE`) voor deze periode had geblokkeerd (vakantie/verlof) — terwijl zijn grove status nog
> op AVAILABLE stond — telde tóch mee in de "nu vrij inzetbaar"-tegel, het `?idle=1`-filter én de idle-chip → de bemiddelaar
> zou hem vandaag voordragen (verspilde ronde). De vensters werden al geladen + aan `countPlaceableDiensten` (matching) gevoerd,
> maar niet aan het capaciteitssignaal. Directe spiegel van de voordracht-waarschuwing (#1005/#1009), nu op het roster-overzicht.
> `RosterCapacityInput.unavailableNow?` (optioneel → gedragsbehoudend); `isIdleReady` sluit een lopend afwezigheidsvenster uit;
> `summarizeRosterCapacity` → `unavailable`-bucket; `RosterZzper.unavailableNow?` doorgetrokken zodat het `?idle=1`-filter nooit
> uit de pas loopt met de tegel. Pagina leest per kaart `summarizeAway(availabilityWindows)` (hergebruikt bestaande pure
> `awayUntil`/`summarizeAway`) → warning-chip "Afwezig t/m {datum}" (`CalendarX`). Server-side waarheid, geen schemawijziging,
> geen nieuw mutatie/auth-oppervlak, read-only signaal. +5 tests. Gate: typecheck, lint, test (5509), build, prettier groen.

> Gedaan (niet opnieuw): **Bemiddelaar — onbeschikbaarheid-signaal bij roster-voordracht (2026-07-31, PR #1009)** —
> de bemiddelaar-voordracht (`/franchise/diensten/[id]`) toonde al een dubbele-boeking-signaal (overlap met een
> andere ACTIEVE samenwerking, `roster-double-booking.ts`), maar géén signaal wanneer de ZZP'er zichzelf via een
> `AvailabilityWindow` (`UNAVAILABLE`) op de dienstdatum onbeschikbaar had gemaakt. Voordragen op zo'n datum = een
> uitnodiging + notificatie die de ZZP'er alsnog moet afwijzen (verspilde ronde). Directe spiegel van de
> opdrachtgever-zijde (`proposal-availability.ts`, #1005), nu voor de bemiddelaar. Pure `detectUnavailability`
> (`src/lib/franchise/roster-unavailability.ts`): alleen UNAVAILABLE-vensters die de dienstdag inclusief omsluiten,
> dag-granulaire yyyy-mm-dd(UTC)-vergelijking (tijdzone-veilig), corrupte/omgekeerde ranges genegeerd, vroegst-
> startende gekozen; `dienstStart==null` → geen conflict. Gewired in `buildRosterCandidates` náást `doubleBooking`
> (vensters al geladen — geen extra query, geen schemawijziging, geen nieuw mutatie/auth-oppervlak);
> `RosterCandidate.unavailability`; waarschuwingschip (`CalendarX`) in `voordragen.tsx`. Server-side blijft de
> waarheid (advies-signaal). +12 tests. Gate: typecheck, lint, test, build, prettier groen.

> Gedaan (niet opnieuw): **Opdrachtgever — waarschuw bij een voorstel op een onbeschikbare kandidaat-periode (2026-07-31)** —
> een ZZP'er kan zich via `AvailabilityWindow` (`UNAVAILABLE`) voor een periode onbeschikbaar maken; de opdrachtgever zag op
> `/kandidaten` alleen of de **opdracht-startdatum** in zo'n venster viel (`assessJobStartAvailability`), maar het voorstel-
> formulier (`ProposeCollaboration`) liet vrij een eigen start/eind kiezen zónder toets → een voorstel over een onbeschikbare
> periode heen wordt afgewezen (verspilde ronde voor beide partijen). Nu een **live, niet-blokkerende** waarschuwing zodra de
> gekozen voorstel-periode een UNAVAILABLE-venster van de kandidaat overlapt. Server-side blijft de waarheid (beschikbaarheid =
> advies; de ZZP'er beslist bij accepteren). Pure `proposalDateConflicts`/`isIsoDate` (`src/lib/proposal-availability.ts`):
> inclusieve periode-overlap via lexicografische yyyy-mm-dd-vergelijking (tijdzone-veilig), leeg einde = één dag op de start,
> omgekeerde range valt veilig terug op de start. `propose-collaboration.tsx` leest de getypte/gekozen datums mee (beide
> formaten); `date-input.tsx` geeft nu ook de kalender-picker-keuze door via `onChange` (geen bestaande consument gebruikte dat);
> `kandidaten/page.tsx` levert de reeds-geladen UNAVAILABLE-vensters aan (geen extra query, geen schemawijziging, geen nieuw
> mutatie/auth-oppervlak). +13 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — message/conversation-retentie-sweep (AVG art. 5(1)(e)) (2026-07-31)** —
> het verwerkingsregister beloofde al een bewaartermijn voor chatberichten (`Message.body`, vrije-tekst-PII), maar
> niets dwong die af — het laatste PII-dragende "verwijder-ouder-dan-venster"-gat na audit-/reactie-/notificatie-/
> lead-/health-incident-retentie. Nieuwe geplande taak `message-retention` (`src/lib/message-retention.ts` +
> `src/lib/message-retention-task.ts`, meedraaiend in `/api/tasks/run-all`) snoeit berichten ouder dan
> `MESSAGE_RETENTION_DAYS` gebatcht/idempotent, met één auditrecord per snoei-actie (geen PII — aantal + cutoff +
> venster). Standaard **UIT** (leeg/0 = onbeperkt, net als `AUDIT_LOG_RETENTION_DAYS`) — wissen is onomkeerbaar en
> berichten hebben waarde voor geschillenbeslechting. Guard: nooit berichten van een gesprek dat aan een lopende
> samenwerking (PROPOSED/ACTIVE) hangt. Nieuwe gauge `zzp_messages_retention_backlog` + drop-in alert. Register-
> belofte nu afgedwongen. Gate: tests groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — branche-gedreven certificaat-aanbeveling op het opdrachtformulier (2026-07-31, PR #1002)** —
> een opdrachtgever die een opdracht plaatst weet niet altijd wélke bewijsstukken in zijn branche gebruikelijk/wettelijk vereist zijn (een
> zorginstelling vergeet makkelijk VOG/BIG, een aannemer het VCA-certificaat). Concurrenten in de zorg (Pidz/Zorgwerk) vullen die compliance-
> eisen vóór de klant in. Nu toont het nieuwe-opdracht-/dupliceer-formulier een rustige, read-only hint zodra de branche gekozen is:
> **"Vaak vereist in {branche}: …"** met korte onderbouwing. De opdrachtgever vinkt zelf de chips aan — guidance, geen automatische eis
> (server-side waarheid blijft de expliciete selectie). Pure `recommendedCredentialsForIndustry(name)`
> (`src/lib/jobs/credential-recommendations.ts`): trefwoord-gebaseerd, case-insensitief, substring-match (raakt "Zorg & Welzijn"); Zorg →
> VOG/DIPLOMA/LICENSE, Bouw/techniek → VOG/CERTIFICATE/INSURANCE, Transport/logistiek → LICENSE/INSURANCE/VOG, ICT → VOG; degradeert veilig
> naar `null` bij lege/onbekende branche (geen hint). UI-hint onder "Vereiste certificaten" afgeleid uit de bestaande `industryId`-state +
> `industries`-prop — geen controlled-component-refactor, geen extra query, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +8 tests.
> Gate: typecheck, lint, test (5448), build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — eerste-reactie-SLA next-action (onbekeken kandidaat wacht op eerste blik) (2026-07-30, PR #1001)** —
> de opdrachtgever kreeg voor NEW-reacties alleen een leeftijdloze telling ("X nieuwe reacties", `applicationsReviewTask`); een kandidaat
> die al dagen onbekeken ligt viel niet op. De aging-logica bestond al als BI op `/inzicht` (`awaitingFirstLookAtRisk`,
> `CANDIDATE_GHOSTING_RISK_DAYS = 5`) maar was nooit in het `/acties`-taakmodel gepromoveerd — exact het "signaal op één surface, afwezig
> op /acties + badge + rail"-patroon. Nu een eigen, urgentere **"kandidaat wacht op een eerste reactie"**-taak zodra een NEW-reactie de
> ghosting-drempel bereikt zonder eerste blik. Helpt de opdrachtgever (sneller reageren) + de geghostte ZZP'er (krijgt antwoord); benchmark
> Temper/Malt. Pure `summarizeFirstLookOverdue` (`src/lib/client-first-look.ts`) hergebruikt exact `ageInDays` + de drempel uit
> `client-application-funnel.ts` → één bron, geen drift met de trechter. `P.firstLookOverdue = 53` (boven `staleApplications` 52 en
> `applications` 50 — een nooit-geopende reactie is de hardste responsiviteitsfaal). Enumerator trekt de onbekeken-oude reacties af van de
> generieke "nieuwe reacties"-telling (residu-aftrek → geen dubbeltelling). Resolver `"link"` → `/kandidaten` (geen UI-wiring). Read-only,
> geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +10 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — complete monitoring drop-in bundle (scrape + Alertmanager-inhibitie) (2026-07-30, PR #998)** —
> `docs/observability/` had alléén `alerts.yml`; de scrape-config + de onderhouds-`inhibit_rule` bestonden enkel als proza in de
> kop/RUNBOOK. Zonder inhibit_rule paget een geplande deploy on-call voor DB-onbereikbaar/cron-stil/back-up-stil (alert-fatigue).
> Nu compleet: **`prometheus.yml`** (scrape → `/api/metrics`, bearer via `credentials_file`, `rule_files: [alerts.yml]`,
> Alertmanager-koppeling) + **`alertmanager.yml`** (routing op severity + `inhibit_rules`: `ZzpMaintenanceModeOn` dempt elke
> operationele alert; cron-stil→cron-run-faalde; back-up-stil→back-up-faalde). Tweede drift-gate `monitoring-bundle.ts` (puur) +
> `monitoring-bundle.test.ts` (10 tests) klinkt de drie bestanden vast: scrape wijst naar `/api/metrics` + laadt `alerts.yml`,
> elke gerefereerde alert bestaat écht, en de onderhouds-inhibitie dekt **elke** operationele alert (nieuwe alert zonder target →
> poort breekt). Geen runtime/schema/auth-wijziging. Docs: RUNBOOK §2a + MENSENWERK §0b. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — annuleringsbetrouwbaarheid-spiegel op /samenwerkingen (2026-07-30, PR #994)** —
> de opdrachtgever zag zijn eigen betaalreputatie (/verplichtingen) + reactiereputatie (/kandidaten) — spiegels van wat ZZP'ers
> over hem zien — maar **niet** de derde: zijn annuleringsbetrouwbaarheid (`ClientReliabilityBlock`, die de ZZP'er wél op de
> opdracht-detailpagina ziet). Nu een **"Jouw betrouwbaarheid in afspraken"**-kaart bovenaan /samenwerkingen (alleen CLIENT),
> gevoed door dezelfde loader/cijfers → geen drift. Pure `summarizeReliabilityReputation`
> (`src/lib/client-reliability-reputation.ts`, +5 tests) vertaalt het geaggregeerde `ClientReliability` naar kop + tip zonder te
> herclassificeren (tone identiek aan invoer); spiegelt `client-payment-reputation.ts`/`client-responsiveness-reputation.ts`
> één-op-één. Data via `getOwnReliabilityForClient(userId)` (symmetrisch met `getOwnPaymentBehaviorForClient`) → hergebruikt exact
> `getClientReliabilityForCompany`. Onder de min-steekproef (3) geen cijfers maar een eerlijke "nog X toezeggingen nodig"-regel.
> Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. `RELIABILITY_MIN_SAMPLE_SIZE` geëxporteerd. Gate:
> typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — /api/metrics incident-IP-redactie retentie-backlog gauge (2026-07-30, PR volgt)** —
> vijfde retentie-backlog dead-man's-switch: **`zzp_health_incidents_ip_retention_backlog`** telt beveiligingsincidenten
> (`HealthIncident`) ouder dan `HEALTH_INCIDENT_IP_RETENTION_DAYS` wier bron-IP de `health-incident-retention`-cron nog niet
> redigeerde. Sloot het laatste PII-minimalisatie-gat in de metrics-detectorlaag (audit/reacties/notificaties/leads hadden al
> een backlog-gauge; incident-IP-redactie als enige niet) — en déze cron staat **standaard AAN** (default 90d; onbeperkte
> IP-retentie is hier de overtreding, AVG art. 5(1)(c)/(e)). Kandidaat-`where` geëxtraheerd naar gedeelde
> `prunableHealthIncidentIpWhere(cutoff)` → één bron van waarheid met de taak, geen drift. Read-only `count`, faalt veilig,
> geen schemawijziging, geen PII. Drop-in alert `ZzpHealthIncidentsIpRetentionBacklog` (`>0`, `for:30h`) in `alerts.yml`,
> vastgeklonken aan de drift-gate. `metrics.ts`+`route.ts`+`alerts-rules.ts`+`alerts.yml`+`health-incident-retention-task.ts`
> (+5 tests). Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — routing-provider (Geoapify) connectiviteitszelftest + go-live-sweep (2026-07-29, PR #973)** —
> de Geoapify reistijd-routing was de **enige** keyed externe HTTP-integratie zónder connectiviteitszelftest én afwezig in de
> go-live-sweep; omdat routing zonder geldige sleutel **stil terugvalt** op de offline haversine-schatter kon de GO/NO-GO-sweep "GO"
> melden terwijl `GEOAPIFY_API_KEY` ongeldig was. Nieuw: `checkRoutingConnectivity` (READ-ONLY geocode-round-trip met harde time-out,
> muteert cache niet, `RoutingConnectivityError` met veilig bericht — nooit de sleutel/URL), pure kern `runRoutingSelfTest` +
> `safeRoutingDetail`, server-actie `runRoutingSelfTestAction` (rol → `routingSelfTestRateLimiter` 6/5min → audit `ROUTING_SELFTEST_RUN`),
> sweep-entry `key:"routing"`, UI-kaart op `/admin/systeemstatus`, audit-NL-label. +18 tests, suite 5354. Zelfde patroon als de andere 8
> zelftests. MENSENWERK §4d nieuw. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — `/api/metrics` reactie-retentie-backlog gauge (2026-07-28, PR #959)** —
> vijfde stille-faal-detector-gauge op het machine-leesbare monitoring-endpoint: **`zzp_applications_retention_backlog`**
> telt terminale reacties (`Application`, REJECTED/WITHDRAWN, zónder samenwerking) ouder dan het geconfigureerde
> `APPLICATION_RETENTION_DAYS`-venster die de `application-retention`-cron nog niet snoeide. Tweede gauge op een
> privacygevoelige retentie-garantie (na `zzp_audit_retention_backlog`): een `Application`-rij draagt vrije-tekst-PII in
> `motivation`/`note`, beloofd op ≤4 weken (AVG art. 5(1)(e)). De cron-heartbeat bewijst alleen dát de run afrondde, niet
> dát 'ie de snoei-pijplijn verwerkte → een oplopende backlog terwijl de heartbeat "vers" is = PII over de termijn heen
> bewaard, extern alarmeerbaar. Gauge hergebruikt **exact** `prunableApplicationWhere(applicationRetentionCutoff(...))`
> (zelfde bron als de taak, incl. cascade-veilige `collaboration: { is: null }`-guard) → geen drift; retentie UIT → 0;
> read-only `count`, faalt veilig (0, nooit 500), geen schemawijziging, geen PII. Drop-in alert
> `ZzpApplicationsRetentionBacklog` (`> 0`, `for: 30h`) in `docs/observability/alerts.yml`, vastgeklonken aan de
> drift-gate. `metrics.ts` + `route.ts` + `alerts-rules.ts` + `alerts.yml` (+3 tests, →5270). Gate: typecheck, lint,
> test, build, prettier groen.
>
> Gedaan (niet opnieuw): **ZZP'er — soortgelijke open opdrachten na een afwijzing op /reacties (2026-07-27, PR #942)** —
> een afgewezen reactie (`REJECTED`) toonde alleen een statische hint + eventueel de afwijzingsreden, geen concrete volgende
> stap. De verklaarbare matchmotor (`relatedJobsForFreelancer`/`recommendedJobs`) draaide al op `/dashboard` + `/opdrachten/[id]`
> maar was **ongebruikt op `/reacties`**. Nu een contextueel **"Soortgelijke open opdrachten"**-blok, verankerd aan de meest
> recente afwijzing ("Niet geselecteerd voor '{opdracht}'? Deze open opdrachten passen bij je."), tot 3 passende open opdrachten
> (matchscore + reden, deep-link). Benchmark Temper/Malt (alternatieven na afwijzing). Pure `pickReengagementAnchor`
> (`src/lib/reengagement.ts`) kiest het anker uit de al-opgehaalde reacties (meest recente REJECTED zonder samenwerking; WITHDRAWN
> = geen nudge); alleen dán één begrensde read via de bestaande matchfunctie (geen extra query zonder afwijzing, geen N+1). Blok
> verbergt zich zonder suggesties. `RelatedJobsSection` kreeg optionele `title`/`description` (bestaande caller intact). Read-only,
> geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +6 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Opdrachtgever — acuut-onbezet-signaal op de eigen opdrachtkaart (2026-07-27, PR #939)** —
> "Mijn opdrachten" (CLIENT-grid) toonde per opdracht het vacaturetempo (respons-momentum) + tarief-diagnose, maar geen signaal
> dat een **gepubliceerde opdracht waarvan de startdatum nadert/verstreken is nog niet vervuld** is — een distinct, urgenter
> risico (een opdracht kan goed tempo hebben en tóch morgen ongevuld starten). Spiegelt de bemiddelaar-acute-onbezet-taak
> (`franchise/acute-open-diensten.ts`) voor de directe opdrachtgever (benchmark Temper/Pidz "shift starts soon, still open"). Nu
> een compacte **"Start … · nog niet vervuld"**-badge (acuut=warning bij start deze week/verstreken, gedempt tot 21d vooruit).
> Pure `jobFillUrgency` (`src/lib/jobs/fill-urgency.ts`): gepubliceerd + niet-vervuld + startdatum-proximity; zwijgt bij
> vervuld/concept/gesloten/zonder-startdatum. "Vervuld" = niet-geannuleerde samenwerking, via één begrensde `collaboration.groupBy`
> (geen N+1). Read-only, geen schemawijziging, geen mutatie/auth-oppervlak. +8 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — /api/metrics verificatie-wachtrij-leeftijd gauge (2026-07-27, PR #938)** —
> `/api/metrics` had `zzp_verification_queue` (wachtrij**diepte**) maar niet de **leeftijd van de oudst wachtende verificatie**.
> Een kleine-maar-vastgelopen wachtrij (overige inzendingen verwerkt, één blijft dagen hangen) is een SLA-breach op de
> kern-differentiatie (certificaat-verificatie) die de kale telling mist. Nieuwe gauge `zzp_verification_queue_oldest_age_seconds`
> (leeftijd in seconden; `-1` = lege wachtrij) → externe monitor kan alarmeren op "oudste wachtende verificatie > X uur". Route
> haalt de oudste SUBMITTED-inzending met exact dezelfde ordering + `waitingSince`-semantiek als `/admin/verificaties` (één bron,
> kan niet driften; steunt op `@@index([status, submittedAt])`). Read-only, geen schemawijziging, geen mutatie/auth-oppervlak,
> geen PII, fail-safe. +3 tests (metrics.test.ts → 15). Gate: typecheck, lint, test (5157), build, prettier groen.
>
> Gedaan (niet opnieuw): **Kandidaten-/reactie-trechter op /inzicht (opdrachtgever) (2026-07-26, PR #935)** —
> `/inzicht` toonde de opdrachtgever samenwerkingen-per-status, vervullingsgraad (time-to-fill) en compliance, maar **geen
> kandidaat-/reactie-trechter** — terwijl de ZZP'er wél een "Status van je reacties"-donut heeft (spiegelbeeld ontbrak). Nu een
> nieuwe rij: een "Kandidaten per status"-donut (hergebruikt `APPLICATION_SEGMENTS`) naast een "Reactie-trechter"-widget
> (wachten-op-eerste-blik → shortlist → geaccepteerd + aannamekans), benchmark ATS/Temper/Malt hiring-funnel. Pure
> `summarizeClientApplications(byStatus)` (`src/lib/client-application-funnel.ts`): aannamekans = geaccepteerd van de **besliste**
> reacties (ACCEPTED+REJECTED; NEW/WITHDRAWN geen beslissing), `null` onder `CLIENT_FUNNEL_MIN_DECIDED=3` → geen schijnprecisie.
> `getClientStats` telt met **één gescoopte `application.groupBy`** (`where: { job: { companyId } }`) → alleen reacties op de eigen
> opdrachten; donut + trechter voeden op dezelfde telling (één bron, geen drift). Read-only BI, geen schemawijziging, geen nieuw
> mutatie/auth-oppervlak. +7 tests. Gate: typecheck, lint, test (5125), build, prettier groen.
>
> Gedaan (niet opnieuw): **Inzetbaarheids-/compliance-chip op de opdrachtenlijst (ZZP'er) (2026-07-26, PR #933)** —
> `/opdrachten` toonde per rij triage-chips (tarief, reistijd, betaalreputatie, agenda, concurrentie, reactiebereidheid) maar geen
> **inzetbaarheids-/compliance-signaal** — de hardste gatingfactor in de zorg: mis ik een vereist certificaat (VOG/diploma/BIG) voor
> deze dienst? (benchmark Pidz/Zorgwerk "diensten waarvoor je inzetbaar bent"). De compliance werd al per opdracht berekend via
> `scoreJobForFreelancer(job, profile).compliance` maar op de lijst weggegooid. Nu een gating-chip op de metadata-rij:
> "Mist een vereist certificaat" / "Vereist certificaat verlopen" (warning) of "Certificaat in beoordeling" (muted). Pure
> `jobComplianceChip(compliance, requiredCredentialCount)` (`src/lib/jobs/compliance-chip.ts`) **zwijgt** bij COMPLIANT én bij een
> opdracht zonder harde eisen (geen chip op elke rij; spiegelt de calm-chip-conventie). Geen extra query/schemawijziging/mutatie-
> oppervlak. +6 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — `/api/metrics` subscription-expiry backlog gauge (2026-07-26, PR #932)** —
> derde stille-faal-detector-gauge op het machine-leesbare monitoring-endpoint: **`zzp_subscriptions_overdue_expiry`** telt de
> betaalde ACTIVE-abonnementen wier `currentPeriodEnd` voorbij is maar die de `subscription-expiry`-cron nog niet op CANCELLED
> (→ Gratis) zette. Zelfde klasse als `zzp_credentials_overdue_expiry` (#925): de cron-heartbeat bewijst alleen dát de run afrondde,
> niet dát 'ie de verval-/renewal-pijplijn verwerkte. Entitlement-guard behandelt zo'n verlopen periode al als Gratis (geen
> toegangslek), maar een oplopende DB-backlog terwijl de heartbeat "vers" is betekent dat de verval-cyclus stilligt → extern
> alarmeerbaar. Gauge-count gebruikt exact de where-vorm van `runSubscriptionExpiryTask` (`ACTIVE` + `currentPeriodEnd<nu` +
> `plan.priceCents>0`) → geen drift; read-only `count`, faalt veilig (0, nooit 500), geen schemawijziging, geen PII. `metrics.ts`
>
> - `route.ts` (+6 tests). Gate: typecheck, lint, test (5112), build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — server-action body-limiet gelijkgetrokken met de upload-ceiling (2026-07-24, PR #905)** —
> uploads (documenten/certificaten/bedrijfslogo) lopen via Next.js **server actions**; `validateUpload` staat tot **10 MB** toe
> (`MAX_UPLOAD_BYTES`), maar Next kapt de server-action-request-body **standaard op 1 MB** af → een reëel gescande VOG-/diploma-PDF
> (2–5 MB) werd stil geweigerd **vóór** de validatie draaide (generieke "Body exceeded 1 MB" i.p.v. `UploadValidationError`). De
> kernfunctie (veilige documentupload) brak op echte bestanden. Fix: `experimental.serverActions.bodySizeLimit = "12mb"` in
> `next.config.mjs` (10 MB-ceiling + headroom voor multipart-boundaries/form-velden); bron van waarheid blijft `MAX_UPLOAD_BYTES`.
> Drift-poort `src/lib/services/upload-body-limit.test.ts` (importeert config + ceiling, faalt zodra ze uit de pas lopen), +4 tests.
> Geen schemawijziging, geen auth/mutatie-oppervlak. Gate: typecheck, lint, test (4917), build (config-schema gevalideerd), prettier groen.
>
> Gedaan (niet opnieuw): **"Deze week"-samenvatting bovenaan /rooster (ZZP'er) (2026-07-24, PR #898)** —
> de rooster-agenda opende zonder overzicht direct in de per-dag-secties. Nu een compacte **"Deze week"-strip**
> (geplande diensten · opdrachtgevers · open kansen in de huidige ISO-week) bovenaan de agenda, glanceable naar
> concurrent-benchmark (Temper/Pidz "je week in één oogopslag"). Pure `summarizeRosterWeek(agenda.days, now)`
> (`roster-market.ts`) leunt op de reeds-gebouwde `buildAgenda`-output (geen extra query/schemawijziging/
> mutatie-oppervlak), hergebruikt `startOfIsoWeek` → geen drift; meerdaagse dienst ontdubbeld op collaborationId,
> opdrachtgevers op naam, open kansen op jobId. +5 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Tijd tot plaatsing (time-to-fill) KPI op /inzicht (bemiddelaar) (2026-07-23, PR #881)** —
> de bemiddelaar zag op `/inzicht` de vervullingsgraad (Vulgraad, % diensten vervuld) maar niet de snelheid van plaatsen.
> Nu een compacte regel **"Gem. tijd tot plaatsing · X dagen"** (met "snelste Y") in de Vulgraad-widget — tenant-breed
> gescoped, symmetrisch met de opdrachtgever-KPI (#878). Nieuwe loader `getTenantTimeToFill(actor)` (`time-to-fill.ts`)
> scoopt op `Job.tenantId` en hergebruikt exact de pure `summarizeTimeToFill` + dezelfde begrensde query-vorm
> (`TIME_TO_FILL_MAX_JOBS=500`, vroegste ACTIVE/COMPLETED-samenwerking als plaatsingsmoment, `publishedAt`→`createdAt`-
> fallback, `null` zonder tenant/onder de steekproefdrempel). Read-only, geen schemawijziging, geen nieuw mutatie/auth-
> oppervlak; alleen een geaggregeerd portefeuillegetal. +6 tests (`tenant-time-to-fill.test.ts`). Gate: typecheck, lint,
> unit-tests (4849), build, prettier groen.
>
> Gedaan (niet opnieuw): **Tijd tot plaatsing (time-to-fill) KPI op /inzicht (opdrachtgever) (2026-07-23, PR #878)** —
> `/inzicht` toonde de opdrachtgever de vervullingsgraad (% opdrachten met plaatsing — de uitkomst) maar niet de snelheid:
> hoe lang duurt het gemiddeld van publicatie tot de eerste échte plaatsing? Dat is de klassieke ATS-metriek **time-to-fill**
> (benchmark Temper/Malt). Nu een compacte KPI **"Gem. tijd tot plaatsing · X dagen"** (met "snelste Y") naast de
> vervullingsgraad-gauge. Pure `summarizeTimeToFill` (`time-to-fill.ts`) berekent de mediane doorlooptijd (robuuster dan
> gemiddelde) + snelste, in hele dagen; negeert defensief negatieve doorlooptijden, `null` onder `TIME_TO_FILL_MIN_SAMPLE=2`.
> Data-loader `getClientTimeToFill` doet één begrensde query (company-scoped opdrachten met ≥1 ACTIVE/COMPLETED-samenwerking →
> vroegste plaatsing; `publishedAt`→`createdAt`-fallback). Onderscheiden van `job-vacancy-performance.ts` (reactietempo per
> losse opdracht) en `fillRate` (percentage). Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak; alleen een
> geaggregeerd portefeuillegetal. +7 tests. Gate: typecheck, lint, unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Benodigd wekelijks tempo tot het urencriterium (ZZP'er, /inzicht) (2026-07-22, PR #877)** —
> de Urencriterium-kaart op `/inzicht` (1.225 uur → zelfstandigenaftrek) toonde bij achterstand alleen "nog X uur" +
> een indirecte-uren-tip, geen concreet haalbaarheids-antwoord. Nu een **benodigd-weektempo** ("houd ≈ Y uur/week aan tot
> eind jaar") + **haalbaarheidsoordeel** (Nog haalbaar ≤25 u/wk / Ambitieus tempo ≤40 u/wk / Dit jaar niet meer) als
> glanceable Badge naast het percentage + verrijkte uitlegzin. Pure motor-uitbreiding: `hoursCriterion` (`hours-criterion.ts`)
> kreeg `weeksRemaining` + `hoursPerWeekNeeded` (deelt op de exacte resterende weken → geen onderschatting aan het jaareinde;
> guard tegen deling door ~0); `hoursPaceFeasibility` (`hours-criterion-summary.ts`) classificeert op het benodigde tempo.
> Read-only afleiding op de reeds-getelde uren — geen extra query, geen schemawijziging, geen nieuw mutatie/auth-oppervlak;
> indicatief (urencriterium blijft mensenwerk). +9 tests. Gate: typecheck, lint, test, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — cross-origin-isolatie (COOP/CORP) + Permissions-Policy-hardening (2026-07-22, PR #875)** —
> security-headers-hardening voor de pre-livegang-pentest (MENSENWERK §5d). De statische headers stonden al sterk
> (HSTS+preload, X-Frame-Options DENY, nosniff) en de CSP draait per request met nonce, maar drie moderne isolatie-lagen
> ontbraken: **`Cross-Origin-Opener-Policy: same-origin`** (severt de opener-relatie met cross-origin vensters — cross-window-lek/
> reverse-tabnabbing; betaalproviders gebruiken full-page redirects → geen flow breekt), **`Cross-Origin-Resource-Policy:
same-origin`** (geen cross-origin embedding van onze resources — kernwaarde voor documentprivacy: een gelekte document-URL
> kan een gevoelig bestand niet cross-origin inladen) en een **uitgebreide `Permissions-Policy`** (deny-list voor camera/microfoon/
> geolocatie/betaling/usb/serial/… + FLoC/Topics-opt-out; alleen fullscreen/clipboard-write op self). Nieuwe pure module
> `src/lib/security/resource-headers.ts` (`privateFileHeaders`/`sandboxedDocumentHeaders` + bestandsnaam-sanitizer) als bron van
> waarheid tegen drift, gewired in álle 7 privé-bestand-routes (geüploade documenten, media, factuur-PDF's ×2, prestatie-PDF,
> DBA-dossier, modelovereenkomst). Alleen response-headers — geen auth-/mutatie-/schemawijziging. +13 tests incl. een regressiepoort
> die next.config.mjs importeert. Gate: typecheck, lint, 4796 unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Aanmaningsniveau (dunning-stap) per debiteur op /facturen (2026-07-22, PR #872)** —
> het debiteuren-overzicht (`DebtorSummaryCard`, ZZP'er) toonde per opdrachtgever openstaand/te-laat-bedrag + ouderdom,
> maar niet hóe ver een te late factuur op de aanmaningsladder staat (Betalingsherinnering → Eerste/Tweede/Laatste
> aanmaning) — die stap leefde alleen op het factuurdetail. Nu een compacte niveau-regel per debiteur (meest-geëscaleerd
> over zijn te late facturen), zodat de ZZP'er prioriteert wie hij het hardst moet nabellen. Pure `debtor-summary.ts`
> (`DebtorRow.dunningLevel/dunningLabel/worstOverdueDays`) hergebruikt exact `currentDunningStage` (`payment-reminders.ts`,
> zelfde bron als het detail → geen drift); label = config-data (`DUNNING_STAGES`), geen i18n. Wiring in
> `debtor-summary-card.tsx` leunt op de al-geladen factuurlijst — geen extra query, geen schemawijziging, geen nieuw
> mutatie/auth-oppervlak. +5 tests. Gate: typecheck, lint, unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Betaaltermijn-KPI (DSO) voor de ZZP'er op /facturen (2026-07-22, PR #871)** —
> `/facturen` toonde de ZZP'er al per-opdrachtgever betaalreputatie, cashflow-vooruitblik, debiteuren-overzicht en
> per-factuur "Verwacht rond"-projectie, maar nergens het portefeuille-brede retrospectieve kerngetal "hoe snel word ik
> gemiddeld betaald, over álle opdrachtgevers heen?" (DSO — Moneybird/e-Boekhouden tonen dit prominent). Nu een compacte
> regel onder de Betaald-kaart — **"Gemiddeld na X dagen betaald · Y% op tijd"** — warning bij structureel traag betaald.
> Pure `summarizeOwnPaymentTiming` (`own-payment-timing.ts`) hergebruikt exact `computePaymentBehavior` (één rekenkern,
> gedeeld met de per-opdrachtgever-kaart) op de eigen betaalde facturen + standaard-30-dagen-vergelijking (faster/around/
> slower, marge 3d); `null` onder de steekproefdrempel (3) → nooit een getal uit één factuur. Wiring in `facturen-panel.tsx`
> leunt op de al-geladen factuurlijst — geen extra query, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +7 tests.
> Gate: typecheck, lint, 4768 unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Vervolgsignaal (naderende einddatum samenwerking) als next-action — ZZP'er + opdrachtgever (2026-07-20, PR #848)** —
> het vervolgsignaal (`summarizeCollaborationRenewal`: een ACTIVE samenwerking die haar einddatum nadert/passeerde) leefde
> alléén op het samenwerkingsdetail (`RenewalNudge`); wie dat ene scherm niet opende, miste het vervolgvenster → de inzet
> valt stil (opdrachtgever raakt een goede ZZP'er kwijt; ZZP'er lijnt de volgende opdracht te laat op). Exact het run-38-gap-
> patroon (signaal op detail, afwezig op /acties + badge + dashboard-rail). Benchmark Temper/Pidz "verleng je serie". Nu een
> next-action **"Plan een vervolg met {tegenpartij}"** op alle drie de oppervlakken, voor beide rollen — gevoed door dezelfde
> pure summarizer als het detail (nooit divergerend). `P.collaborationRenewal=46` + builder `collaborationRenewalTask`
> (overdue→attention, ending_soon→info; deep-link naar het detail waar de rol-passende vervolgactie al staat) + enumerator
> `renewalTasks` (één DB-voorgefilterde query per rol: `status:"ACTIVE"`, `disputedAt:null`, `endDate:{lte:venster}`, take-
> begrensd; gewired in freelancerTasks+clientTasks). Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak.
> Resolver `link` → default-tak `action-list.tsx` (geen UI-wijziging). +11 tests. Gate: typecheck, lint, 4636 unit-tests,
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — upload-scanner (ClamAV) connectiviteitszelftest (2026-07-19, PR #838)** —
> sloot het laatste connectiviteitszelftest-gat in de go-live-posture: opslag/e-mail/rate-limit/verificatie/betaalprovider
> hadden al een admin-zelftest op `/admin/systeemstatus`, de ClamAV upload-scanner als enige niet. Die is **fail-closed** →
> een verkeerd geplakte `CLAMAV_HOST` blokkeert stil álle uploads tot een admin een echt document uploadt. Nu een admin-only
> **Upload-scanner-zelftest** die de standaard **EICAR-testprobe** naar clamd stuurt: bevestigt bereikbaarheid + daadwerkelijke
> detectie (een clamd met lege virusdefinities geeft anders stil "clean" — die stille storing vangt de zelftest expliciet af);
> géén echt bestand opgeslagen; op `noop` eerlijk "niets getest" (geen vals groen). Pure kern `upload-scanner-selftest.ts`
> (`runUploadScannerSelfTest` + `eicarProbeBuffer` uit fragmenten + `safeUploadScannerDetail`) + server-actie (auth ADMIN →
> `uploadScannerSelfTestRateLimiter` 6/5min → probe → audit `UPLOAD_SCANNER_SELFTEST_RUN`, nooit secrets) + client-card + page-wiring.
> Geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Vervangt de verlaten claim-PR #802. Gate: typecheck, lint, unit-tests,
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Tarief-rekenhulp — netto-inkomensdoel → benodigd uurtarief (ZZP'er) (2026-07-19, PR #835)** —
> de ZZP'er zette zijn uurtarief handmatig met alleen een passieve marktband (`market-rate.ts`) als hint; de omgekeerde,
> praktische vraag "wat moet ik per uur vragen om netto € X per maand over te houden?" werd nergens beantwoord (bevestigd:
> `income-goal.ts` = omzetdoel afgezet tegen facturen, `effective-rate.ts` = reistijd-correctie per opdracht — geen voorwaartse
> tariefberekening). Benchmark: elke ZZP-boekhouder (Moneybird/Tellow) heeft zo'n rekenhulp. Nu een interactieve kaart **naast de
> marktband** op `/profiel/bewerken`: netto-doel/maand + declarabele uren/week (+ optionele kosten, startersaftrek) → benodigd
> uurtarief + benodigde omzet + geschatte IB/Zvw + netto/jaar + vergelijking met het huidige tarief. Pure `requiredHourlyRate`
> (`rate-calculator.ts`) inverteert `net(winst)=winst−heffing(winst)` met bisectie op hele centen en **hergebruikt exact
> `tax/income-tax.ts`** (`estimateIncomeTax`) — dezelfde IB/Zvw-motor als de ontzorg-schermen, dus consistent, geen tweede bron
> van waarheid. Client-component `RateCalculatorCard` doet de week→jaar-schaling (46 werkweken) en rekent live; efemere invoer,
> **geen server-mutatie, geen schemawijziging, geen nieuw auth-oppervlak**. Indicatief met de gedeelde `TAX_DISCLAIMER`;
> urencriterium afgeleid uit de declarabele uren (met toelichting). +9 tests. Gate: typecheck, lint, 4572 unit-tests, build,
> prettier groen.
>
> Gedaan (niet opnieuw): **"Stuur een samenwerkingsvoorstel" next-action voor geaccepteerde kandidaat
> (2026-07-19, PR #831)** — wanneer de opdrachtgever een reactie **accepteert** (`ACCEPTED`) moet hij
> daarna nog handmatig `proposeCollaboration` doen (ACCEPTED → `PROPOSED`-collaboration, `applicationId`
> @unique). Tot dan heeft de reactie géén collaboration en nudged **niets** in de next-action-engine die
> afrondstap: `applicationsReviewTask` dekt alleen `NEW`, `staleApplicationsTask` alleen `VIEWED`/
> `SHORTLIST`, `contractSignTask` pas ná het voorstel. De ZZP'er ziet "Geaccepteerd! Wacht op een
> samenwerkingsvoorstel" en wacht; de opdrachtgever vergeet → een gemaakte hire in limbo. Nu een
> next-action **"Stuur {kandidaat} een samenwerkingsvoorstel"** per geaccepteerde-maar-onvoorgestelde
> reactie (tone `attention`, band `P.proposeCollaboration=68` net onder `contractSign` 72, boven
> `staleApplications`/`applications`), deep-link `/kandidaten?open=<applicationId>` (opent direct de rij
> met het voorstelformulier). Pure `pendingCollaborationProposals` (`accepted-proposal.ts`, enige bron van
> waarheid; filtert defensief reeds-voorgestelde) + builder `proposeCollaborationTask`
> (`resolver:"link"` → `default`-tak, geen UI-wiring) + wiring in `clientTasks` (één extra eigenaar-
> gescoopte, `take`-begrensde ACCEPTED-query in de bestaande `Promise.all`, oudst-eerst). Read-only, geen
> schemawijziging, geen nieuw mutatie/auth-oppervlak. +8 tests. Gate: typecheck, lint, 4553 unit-tests,
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — back-up-heartbeat / dead-man's-switch voor database-back-ups
> (2026-07-19, PR #830)** — de automatische dagelijkse database-back-up draait bij de databasedienst,
> buiten het zicht van het platform; een stil gestopt back-up-schema (opgezegde snapshot-policy,
> mislukte dump, verlopen databasedienst-abonnement) was tot nu toe onzichtbaar — spiegelt exact het
> patroon van de cron-heartbeat (#810). Nu een nieuw Prisma-model `BackupHeartbeat` (singleton, géén
> PII — alleen tijdstip + of de laatste back-up slaagde) en `POST /api/backups/heartbeat`
> (`Authorization: Bearer $CRON_SECRET`, fail-closed: geen secret → 503, verkeerd token → 401;
> optionele body `{ "ok": boolean }`, default `true`). Op `/admin/systeemstatus` een nieuwe kaart
> **"Database-back-up"**: actueel / aandacht (mislukt of nog nooit gemeld) / stale (schema lijkt
> gestopt). Venster `BACKUP_MAX_AGE_HOURS` (default 48 uur, geklemd 1–720). Inert zonder config; de
> heartbeat-schrijf/-lees faalt nooit naar buiten. Bestanden:
> `src/lib/observability/backup-heartbeat.ts`, `.../backup-freshness.ts`,
> `src/app/api/backups/heartbeat/route.ts`, `src/components/admin/backup-heartbeat-card.tsx`,
> `src/lib/config.ts` (`parseBackupMaxAgeHours`), `prisma/schema.prisma`. `MENSENWERK.md` §7/§11 +
> `docs/RUNBOOK.md` §5 + `.env.example` bijgewerkt (resterend mensenwerk: back-up-job laten pingen).
> Gate: typecheck, lint, tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Pre-due betaal-nudge voor de opdrachtgever (factuur vervalt binnenkort) (2026-07-19, PR #827)** —
> de opdrachtgever kreeg als next-action alléén een **post-due** roll-up ("N facturen over de vervaldatum · Markeer als
> betaald", `overdueInvoiceTask("CLIENT")`) plus een aggregate payables-card op `/facturen`. Er was **niets pre-due**: geen
> actie die vóór de vervaldatum zegt "je factuur vervalt binnenkort — betaal op tijd". Op tijd betalen beschermt de zichtbare
> betaalreputatie (`client-payment-reputation.ts`) → de ZZP'er wordt sneller betaald (benchmark Deel/Stripe betaal-reminders).
> Nu een pre-due next-action **"N facturen vervallen binnenkort · Betaal op tijd — dat houdt je betaalreputatie sterk"** (tone
> `info`, band `P.paymentDueSoon=56`, onder de post-due `overdueInvoice=60`). Pure `paymentDueSoonWhere(userId, now, windowDays=7)`
> (`payment-due-soon.ts`) als één bron van waarheid voor de scoping — **alleen legacy/handmatige facturen** (`lifecycleStatus:
null, status:"SENT"`, waar de payer écht een "Markeer als betaald"-knop heeft; cascade-facturen betaal-markeert de ZZP'er —
> les van #808), **nog niet te laat** (`dueAt >= now` → raakt de post-due roll-up niet, geen dubbele next-action), **binnen 7
> dagen**, **niet in dispuut**. Count `paymentDueSoonCount` (signals.ts) + task-builder `paymentDueSoonTask` (kind
> `payment-due-soon`, resolver `link` → default-tak `action-list.tsx`, geen UI-wiring) + wiring in `clientTasks` (één extra
> indexed count in de bestaande `Promise.all`). Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +9 tests
> (`payment-due-soon.test.ts` 5, `signals.due-soon.test.ts` 1, `tasks.test.ts` 3). Gate: typecheck, lint, unit-tests, build,
> prettier groen.
>
> Gedaan (niet opnieuw): **"Reageert meestal binnen ~X" reactietijd-signaal in het gesprek (2026-07-18, PR #817)** —
> het gespreksdetail (`/berichten/[id]`) toonde wie er "aan zet" is en of een reactie te lang ligt (op de berichtenlijst),
> maar nergens hóe snel de gesprekspartner doorgaans antwoordt — een wachtende ZZP'er/opdrachtgever/bemiddelaar kon niet
> inschatten of stilte normaal is. Benchmark: Intercom/WhatsApp/Malt tonen "reageert doorgaans binnen X". Nu een subtiele
> regel onder de naam in de gesprekskop — **"Reageert meestal binnen een dag"** — uit de mediane reactietijd van de partner.
> Pure `summarizeReplyLatency` leest de al-geladen, **onveranderlijke** `Message.createdAt` + `senderId` (anders dan bij
> `Application` géén driftgevoelig `updatedAt` — een bericht wordt nooit bijgewerkt → eerlijk/reproduceerbaar). Beurt = partner
> antwoordt nádat de andere kant stuurde, gemeten vanaf het eerste onbeantwoorde inkomende bericht (opeenvolgende
> partner-berichten = één antwoord); mediaan in grove uitlegbare buckets (uur/enkele uren/dag/enkele dagen/week-of-langer) —
> **geen schijnprecisie**. Sample-gated (≥2 beurten) → geen regel bij te weinig historie (rustige kop); symmetrisch voor alle
> drie de rollen. `message-reply-latency.ts` (+9 tests) + wiring in de kop (geen extra query — berichten al geladen). Geen
> schemawijziging, geen nieuw mutatie/auth-oppervlak; alleen berichten van dít gesprek (beide deelnemers zien die al) →
> privacy by design. Gate: typecheck, lint, 4423 unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — betaal-webhook idempotentie-grendel (exact-één-keer per event) (2026-07-18, PR #816)** —
> de betaal-webhook (`/api/billing/webhook`) leunde voor replay-veiligheid volledig op de overgangsmap; de persona-sweep (run 26/27)
> flagde dit als het resterende billing-hardening-item vóór recurring billing. Nu een provider-agnostische idempotentie-ledger
> (`ProcessedWebhookEvent`, uniek op `(provider, "<paymentRef>:<status>")`), atomair met de statusmutatie + audit in één transactie:
> een herspeeld/dubbel event schendt de constraint → rollback → inert 200; een echte DB-fout propageert → provider levert opnieuw af.
> De status zit in de sleutel (open→paid blijft twee events; replay met zelfde ref+status wordt genegeerd) en wordt altijd
> gezaghebbend opgehaald vóór de sleutel (ongesigneerde Mollie-body kan 'm niet vervalsen). Transitiemap-poort ongewijzigd
> (defense-in-depth). Geen secret/flag, altijd aan; ledger bevat geen PII. `webhook-idempotency.ts` (pure helpers, +7 tests) +
> route-transactie + 3 idempotentie-route-tests. Onafhankelijke security-review PASS. Gate: typecheck, lint, 4414 tests, build,
> prettier groen. **Backlog (niet-blokkerend):** retentie-snoei-taak voor oude ledger-rijen zodra recurring billing het volume opvoert.
>
> Gedaan (niet opnieuw): **Uitgaven-vooruitblik "te betalen binnen 30 dagen" op /facturen (opdrachtgever) (2026-07-18, PR #813)** —
> de ZZP'er zag op `/facturen` al de cashflow-vooruitblik ("≈ € X verwacht binnen 30 dagen", #811), maar de opdrachtgever (payer)
> zag op dezelfde pagina alleen "Openstaand" + het te-late deel — geen tijdlijn van wat er de komende 30 dagen te betalen valt.
> Nu een compacte regel onder de Openstaand-kaart (alleen opdrachtgever) — **"≈ € X te betalen binnen 30 dagen"** — die de
> openstaande factuurbedragen optelt naar hun vervaldatum, zodat de payer liquiditeit kan plannen en op tijd betaalt
> (te laat betalen schaadt de zichtbare betaalreputatie). Symmetrisch met de ZZP-cashflow-vooruitblik, maar geankerd op `dueAt`
> (de payer weet wanneer hij MOET betalen): reeds verstreken vervaldata tellen als "binnen 30 dagen" (nú verschuldigd); een factuur
> zonder vervaldatum blijft buiten de telling. Pure `summarizePayablesForecast` in `payables-forecast.ts` (+8 unit-tests) + wiring
> in `facturen-panel.tsx` (leunt op de al-geladen factuurlijst — geen extra query, geen schemawijziging, geen nieuw mutatie/auth-
> oppervlak). Gate: typecheck, lint, unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Cashflow-vooruitblik "verwacht binnen 30 dagen" op /facturen (ZZP'er) (2026-07-17, PR #811)** —
> `/facturen` toonde per openstaande factuur al de verwachte betaaldatum (`forecastInvoicePayout` → "Verwacht rond …"),
> maar nergens het geaggregeerde antwoord op de #1 cashflow-vraag van de ZZP'er: "hoeveel geld komt er de komende 30 dagen
> realistisch binnen?" De summary-kaarten toonden alleen Betaald (cumulatief), Openstaand en het te-late deel — geen
> tijdsdimensie op het openstaande bedrag (benchmark: cashflow-vooruitblik Moneybird/e-Boekhouden). Nu een compacte regel
> onder de Openstaand-kaart — **"≈ € X verwacht binnen 30 dagen"** — die de openstaande factuurbedragen optelt naar wanneer
> betaling realistisch binnenkomt. Pure `summarizeCashflowForecast` in `cashflow-forecast.ts` telt alleen facturen met een
> op betaalhistorie gebaseerde (`confident`) projectie (een enkel-vervaldatum-anker is te onzeker voor een cashflow-belofte);
> een reeds verstreken verwachte datum telt als "binnen 30 dagen" (geld wordt nú verwacht); alleen getoond bij `next30Cents > 0`.
> Hergebruikt exact `behaviorByCompany` + `forecastInvoicePayout` (dezelfde motor als de per-rij "Verwacht rond"-regel) —
> geen extra query, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +8 unit-tests. Gate: typecheck, lint, unit-tests,
> build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — cron-heartbeat / dead-man's-switch voor geplande taken (2026-07-17, PR #810)** —
> `/admin/systeemstatus` toonde bij de cron alleen of `CRON_SECRET` gezet was, niet of de dagelijkse
> `/api/tasks/run-all`-cron nog drááit. Stopt die stil (workflow uit, secret geroteerd, `RUN_ALL_TASK_URL` fout,
> host-storing), dan stoppen verloopdetectie, abonnement-verval, auditlog-retentie (AVG) en herinneringen zonder
> dat iemand het ziet. Nu registreert elke afronding van `run-all` een heartbeat (`CronHeartbeat`-singleton, géén
> PII — tijdstip + `lastOk`) en een admin-kaart **"Geplande-taken-cron"** toont de freshness: actueel / stale
> (> venster) / laatste-run-faalde / nooit-gedraaid. Venster `CRON_MAX_AGE_HOURS` (default 36, geklemd 1–720).
> Pure oordeel in `cron-freshness.ts` (17 tests) + fail-safe DB-laag `cron-heartbeat.ts` + `parseCronMaxAgeHours`
> in `config.ts` (4 tests). Heartbeat/read falen nooit naar buiten. Read-only qua bestaand auth-oppervlak, geen
> nieuwe mutatie. Gate: typecheck, lint, 21 nieuwe unit-tests, build, prettier groen. MENSENWERK §10 bijgewerkt.
>
> Gedaan (niet opnieuw): **Reactiebereidheid-chip op de opdrachtenlijst (ZZP'er) (2026-07-17, PR #807)** —
> op `/opdrachten` (browse-/triage-lijst) toonde elke kaart al ZZP-zijdige signalen (match, reistijd, concurrentie,
> betaalgedrag, startdatum, tarief-fit, beschikbaarheid) maar niet of de opdrachtgever binnengekomen reacties
> überhaupt oppakt — dat signaal (`computeClientResponsiveness`) leefde alleen op de opdracht-detailpagina
> (`ClientResponsivenessBlock`). "Pakt deze opdrachtgever reacties op of laat hij ze liggen?" is een kern-triagevraag
> vóór je je tijd in een reactie steekt (benchmark Malt/Temper). Nu een compacte chip per kaart — **"Pakt reacties op"**
> (good) / **"Laat reacties liggen"** (warning), alleen bij een uitgesproken reputatie (neutral/unknown → geen chip).
> Pure `responsivenessChip` in `client-responsiveness.ts` (mapt het bestaande signaal → `{label,tone}`, module-taal
> "oppakken"/"laten liggen" → geen tegenspraak met detail; +6 tests) + wiring in `opdrachten/(index)/page.tsx`
> (`responsivenessByJob`-map via de begrensde batch-loader `getClientResponsivenessForCompanies`, `MessageSquareReply`-chip
> ná tarief-fit). Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak; alleen het geaggregeerde oordeel
> (≥3 reacties) — nooit een individuele reactie van een andere ZZP'er. Gate: typecheck, lint, unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Beoordelings-nudge als next-action na een afgeronde samenwerking (ZZP'er + opdrachtgever) (2026-07-17, PR #799)** —
> het tweezijdige beoordelingssysteem (double-blind reveal, `Review`-model + `createReviewAction` + `ReviewForm` op
> `/samenwerkingen/[id]`) bestond al, maar niets nudgede een partij ná afronding om écht te beoordelen — de sectie stond
> stil op het detail en het blinde venster (14 dagen) sloot vaak eenzijdig/ongebruikt. De item-engine (`pending-tasks.ts`)
> had géén review-taak, dus `/acties`, de "Volgende acties"-rail én de zijbalk-badge zwegen. Reviews voeden reputatie →
> matching/vertrouwen (benchmark Malt/Temper/Deel). Nu een next-action **"Beoordeel {tegenpartij}"** voor élke afgeronde
> samenwerking die de actor nog kan beoordelen (venster open, nog niet zelf beoordeeld), voor beide rollen; deep-link naar
> het bestaande formulier. Pure `collaboration-review-prompt.ts` (`reviewPromptForCollaboration` → `{daysLeft}`|null,
> hergebruikt exact `canLeaveReview` + venster-helpers → geen tegenspraak met detail; 6 tests) + builder `reviewLeaveTask`
> (kind `review-leave`, band `P.reviewPrompt=24` tussen completeness(30)/drafts(20); tone info→attention bij ≤3 dagen;
> `resolver:"link"` → `default`-tak van `action-list.tsx`, geen UI-wiring; 3 tests) + `reviewLeaveTasks`-enumerator in
> `pending-tasks.ts` (één COMPLETED-query per rol, DB-voorgefilterd op open venster + `take:MAX` + `reviews where authorId`,
> N+1-veilig) gewired in `freelancerTasks` + `clientTasks`. Read-only, geen schemawijziging, geen nieuw mutatie/auth-
> oppervlak. 11 nieuwe tests (+2 integratie). Gate: typecheck, lint, 4339 unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **"Aanbevolen keuze": gewogen totaalranglijst in de vergelijk-view (opdrachtgever) (2026-07-16, PR #798)** —
> de kandidaten-vergelijk-view (`/kandidaten/vergelijk`) zette reacties al per onderdeel naast elkaar
> (`buildCandidateComparison` → 9 losse per-dimensie-trofeeën) maar berekende bewust géén cross-dimensie totaal; de
> opdrachtgever moest de negen signalen zelf wegen. Nu een transparante gewogen **totaalscore (0–100)** per kandidaat +
> een voorzichtige **"Aanbevolen keuze"**-banner met korte onderbouwing (benchmark Malt/Temper). Beslis-hulp, geen
> beslisser ("jij beslist"). Pure `candidate-ranking.ts` (`overallCandidateScore` = gewogen gemiddelde over de aanwezige
> dimensies — ontbrekende dimensie krimpt de noemer i.p.v. te straffen, gewichten som=1 met match/compliance zwaarst;
> `rankCandidates` beveelt alléén aan bij voorsprong ≥4 punten én niet-NON_COMPLIANT — een non-compliant koploper wordt
> nooit gekroond; onderbouwing via dezelfde `pickUniqueBest` als de tabel → geen tegenspraak; 9 tests) + wiring in
> `kandidaten/vergelijk/page.tsx` (banner + "Totaalprofiel"-rij). Read-only, geen schemawijziging, geen nieuwe query
> (leunt op de al-opgehaalde `CompareCandidate[]`), geen nieuw mutatie/auth-oppervlak. Gate: typecheck, lint, 4328
> unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Vooruitblik-bench "wie komt binnenkort vrij?" op het roster (bemiddelaar) (2026-07-16, PR #797)** —
> het roster-capaciteitsoverzicht op `/franchise/zzpers` beantwoordde alleen "wie kan ik NU inzetten?"
> (`roster-capacity.ts` idle-ready). De planvraag ernaast — "wie komt BINNENKORT vrij?" — ontbrak: de bemiddelaar zag
> pas dat een ingezette vakmens vrijviel als het al gebeurd was en kon herplaatsing niet vooruit plannen (benchmark:
> staffing-planning Pidz/Zorgwerk). Nu een vooruitblik-strip ("N vakmensen komen binnen 30 dagen vrij — 2 deze week.
> Plan herplaatsing vast vooruit.") + een "Komt vrij over 5 dagen"/"Komt vrij op 20 jul"-chip per nu-ingezette kaart.
> Pure `roster-availability-forecast.ts` (`freeDateFromActiveCollaborations` = láátste ACTIVE-einddatum, `null` bij
> open einde/niet ingezet; `forecastChipLabel` weekgrens→looptijd, verder→datum, horizon 30d; `summarizeRosterForecast`
>
> - `rosterForecastHeadline` delen dezelfde grenzen als de chip → geen drift; 12 tests) + wiring in `franchise/zzpers/page.tsx`
>   (`collaborations { where ACTIVE, select endDate }` aan de bestaande tenant-gescopete include — geen N+1). Read-only,
>   geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Gate: typecheck, lint, 4319 unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Plaatsbaarheids-signaal per vrije ZZP'er op het roster (bemiddelaar) (2026-07-16, PR #793)** —
> op `/franchise/zzpers` toonde het capaciteitsoverzicht al **wie** vrij inzetbaar is (de bench), maar niet **waar** de
> bemiddelaar die persoon vandaag op kan zetten; daarvoor moest hij elk profiel openen (waar `dienst-suggesties` de
> passende diensten toont). Nu een compacte **"N passende diensten"**-chip per vrij-inzetbare ZZP'er op de lijst + een kop
> "X vrije vakmensen zijn direct plaatsbaar op een open dienst"; de chip deep-linkt naar het profiel met de bestaande
> voordracht-actie (geen dood signaal). Pure `roster-placement.ts` (`countPlaceableDiensten` telt open tenant-diensten met
> matchscore ≥ de **gedeelde** `DIENST_SUGGESTIE_MIN_SCORE` via dezelfde `scoreJobForFreelancer`-motor → chip == detail;
> `placeableChipLabel`/`placeableHeadline` null bij nul; 10 tests) + wiring in `franchise/zzpers/page.tsx` (open diensten
> één keer geladen `take:100` tenant-gescopet; alleen `isIdleReady`-ZZP'ers scoren; `industries`/`availabilityWindows` aan
> de bestaande include toegevoegd; geen N+1). Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Gate:
> typecheck, lint, 4294 unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Afwijzingspatroon-inzicht op /reacties (ZZP'er) (2026-07-16, PR #791)** — de ZZP'er zag
> afwijzingsredenen alleen **per reactie** (`rejectionReasonFeedback` op elke afgewezen kaart), maar nergens het **patroon**
> over al zijn afwijzingen heen; drie keer "Tarief boven budget" moest hij zelf uit de losse kaarten optellen. Nu één
> actiegericht patroon-inzicht bovenaan `/reacties` — **"Terugkerende reden bij je afwijzingen: Tarief boven budget
> (3× genoemd)"** + een concrete, respectvolle volgende stap. Pure `rejection-pattern.ts` (`summarizeRejectionPattern` +
> `REJECTION_PATTERN_ADVICE`; alleen REJECTED mét actiegerichte reden, OTHER/onbekend/leeg tellen niet, drempel
> `MIN_COUNT=2`, null zonder patroon; 8 tests) + `RejectionPatternNote` (rendert niets bij null) + wiring in
> `reacties/page.tsx` (leunt op de al-geladen `app.rejectionReason` — geen extra query/N+1). Read-only, geen
> schemawijziging, geen nieuw mutatie/auth-oppervlak. Gate: typecheck, lint, 4281 unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Acute-onbezet dienst als next-action — bemiddelaar (2026-07-16, PR #789)** — de bemiddelaar zag
> op `/franchise/diensten` al **welke** open diensten NU dreigen onbezet (start deze week/verstreken/geen startdatum) mét de
> vulbaar/werving-triage (#785/#779), maar dat operationeel-urgentste item ontbrak volledig in zijn actiecentrum: de item-engine
> (`pending-tasks.ts`) had géén enkele dienst-taak voor de FRANCHISER, dus `/acties`, de dashboard-rail "Volgende acties" én de
> zijbalk-badge zwegen erover — een dienst die dreigt leeg te vallen laat een opdrachtgever zonder bezetting. Nu één aggregaat-
> next-action **"N diensten dreigen onbezet"** met "X direct vulbaar uit je roster · Y vragen werving" als subtitel. Pure
> `acute-open-diensten.ts` (`isStartAcute` = één bron van waarheid voor "acuut", ook de diensten-kaart erop overgezet → geen
> drift; `summarizeAcuteOpenDiensten` leunt op de geteste `summarizeAcuteFillability`; 8 tests) + builder `franchiseAcuteDienstTask`
> (kind `franchise-open-dienst-acute`, link → `/franchise/diensten`, band `P.franchiserServiceAcute=78` boven roster-compliance/
> stale-service; tone attention bij ≥1 werving, anders info; valt op `default`-tak van `action-list.tsx` → geen UI-wiring) +
> wiring in `franchiserTasks` (één extra tenant-gescopete `job.findMany` in de bestaande `Promise.all`; vulbaar-signaal alleen
> voor open diensten via de nieuwe tenant-variant `getRosterFillSignalsForTenant`, geen N+1). Read-only, geen schemawijziging,
> geen nieuw mutatie/auth-oppervlak. Gate: typecheck, lint, 4273 unit-tests, build, prettier groen.
>
> Gedaan (niet opnieuw): **Prod-rijpheid — verificatie-adapter connectiviteitszelftest (DUO/BIG/iDIN) (2026-07-16, PR #788)** —
> de externe verificatie-adapters misten als enige integratie een connectiviteitszelftest (opslag/e-mail/rate-limit hadden
> die al). Zodra de mens een echte adapter aanzet (`DIPLOMA_VERIFIER=duo`/`BIG_VERIFIER=bigregister`/`IDENTITY_VERIFIER=idin`)
>
> - endpoints/sleutels plakt, was er geen manier om vóór echte diploma-/zorg-/identiteitscontrole te bevestigen dat de
>   koppeling het endpoint écht bereikt. Nu een admin-only **Verificatie-zelftest** op `/admin/systeemstatus`: per aangezette
>   adapter een echte round-trip met een **synthetische** probe die ALLEEN bereikbaarheid + auth + contract-vorm toetst
>   (nooit `verified===true` — een `verified:false` op een verzonnen code is een gezonde uitkomst); demo-verifier (`mock`) →
>   eerlijk "niets getest". Pure `verify-selftest.ts` (`runVerifierSelfTest`+`safeVerifierDetail`, 12 tests) + gedragsbehoudende
>   `*EndpointConfig()`-extractie uit de 3 verifiers + server-actie (auth ADMIN → rate-limit → probe → audit, geen secrets in
>   uitvoer/metadata) + client-card + page-wiring. Geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Gate: typecheck,
>   lint, targeted tests groen.
>
> Gedaan (niet opnieuw): **Acute-dienst vulbaarheidssplitsing (voordragen vs. werven) — bemiddelaar (2026-07-16, PR #785)** —
> de "Wat dreigt onbezet"-triagekaart op `/franchise/diensten` toonde al **welke** open diensten acuut zijn (deze week /
> verstreken start / geen startdatum) maar niet **of** de bemiddelaar ze uit zijn eigen roster kan oplossen of extern moet
> werven — de eerstvolgende beslissing. Het vulbaar-signaal (`readyMatches` uit `dienst-fill-signal.ts`) was al op de pagina
> geladen maar leefde alleen als chip per lijst-rij verderop, niet in de acute-triage. Nu per acute dienst **"N matches vrij"**
> (direct voordraagbaar) vs. **"Werven"** + een samenvattende regel ("2 direct vulbaar uit je roster · 1 dienst vraagt werving").
> Pure `acute-fillability.ts` (`summarizeAcuteFillability` + `acuteFillabilityHeadline`; 12 tests) + wiring in
> `franchise/diensten/page.tsx` (leunt op het al-geladen `fillSignals`, geen extra query/N+1). Read-only, geen schemawijziging,
> geen nieuw mutatie/auth-oppervlak, geen nieuwe rekenlogica/drempel. Gate groen.
>
> Gedaan (niet opnieuw): **Proactieve certificaat-verval-waarschuwing per lopende samenwerking (ZZP'er) (2026-07-15, PR #784)** —
> de ZZP'er kreeg alleen een **generieke** "certificaat verloopt binnenkort"-taak (`credentialFixTask(..., "expiring")`),
> die op elk verlopend geverifieerd certificaat vuurt ongeacht of er een opdracht op leunt en geen samenwerking noemt.
> De opdrachtgever zag de andere kant al gericht (kandidaten-scherm: verval-tijdens-opdracht via
> `summarizeCandidateCredentialExpiry`), maar de ZZP'er werd nooit gewaarschuwd dat het verval een concrete
> samenwerking dreigt te blokkeren. Nu een gerichte, samenwerking-gebonden next-action — **"VOG verloopt tijdens je
> opdracht · Verloopt over 8 dagen · vernieuw het voor je opdracht bij Zorggroep Noord (Wijkverpleegkundige)"** —
> geruster + slimmer: oplossen vóór het een blokkade wordt (benchmark Pidz/Zorgwerk compliance-bewaking). Pure
> `collaboration-credential-expiry.ts` (`collaborationCredentialExpiryConcerns`: laatst-vervallend geldig
> VERIFIED-certificaat per type × vereiste certificaten van lopende/voorgestelde samenwerkingen, binnen 30-daags
> venster, gegroepeerd per certificaat, gesorteerd op vroegste verval; 10 tests) + builder `credentialCollabExpiryTask`
> (nieuwe kind, `P.credentialExpiringForCollab = 75` — boven generiek 70, onder afgewezen 80; 4 tests). Wiring in
> `freelancerTasks`: generieke verval-taken **uitgesteld** en alleen geëmit voor niet-gedekte certificaten → geen
> dubbele taak. Reeds-verlopen/ontbrekend vereist certificaat blijft elders (verplicht-document/compliance-ripple).
> Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Gate groen (typecheck, lint, 4242 unit-tests, build).
>
> Gedaan (niet opnieuw): **Tarief-diagnose op een koud lopende opdracht (opdrachtgever) (2026-07-15, PR #783)** —
> op "Mijn opdrachten" (`/opdrachten`, CLIENT-view) toonde het vacaturetempo-signaal
> (`summarizeVacancyPerformance`) al dát een opdracht koud loopt ("Weinig respons, X dagen open"), maar gaf
> alleen een generieke tip ("overweeg tarief/eisen/zichtbaarheid bij te stellen") — het tarief werd nooit tegen
> de markt getoetst. De marktband-engine (`computeMarketBand`/`getJobRateBands`) bestond al, maar werd uitsluitend
> op het opdracht-formulier getoond; de twee waren nergens gecombineerd. Nu een concrete, cijfermatige
> tarief-diagnose per koude kaart — **"Je biedt tot € 45/u, terwijl het markttarief rond € 60/u ligt. Een hoger
> tarief trekt doorgaans meer kandidaten."** — die "reacties blijven uit, geen idee waarom" in een meetbare knop
> verandert (raakt de vervullingsgraad; benchmark Malt/Upwork rate-guidance). Pure `vacancy-rate-diagnosis.ts`
> (`diagnoseVacancyRate`: fireert alleen bij `attention` én begrensde bovengrens `rateMax != null` én
> `rateMax < markt-mediaan` — mediaan bewust als drempel; open-eind tarief → geen claim; toont uitsluitend de
> geaggregeerde mediaan, nooit een individueel ZZP-tarief; 7 tests) + `VacancyRateDiagnosisNote` + wiring in
> `ClientJobs` (marktband één keer geladen, alleen bij ≥1 koude kandidaat met begrensd tarief — geen N+1, geen
> query zonder noodzaak). Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Gate groen
> (typecheck, lint, unit-tests, build ✓).
>
> Gedaan (niet opnieuw): **Geschikte-vakmensen-vrij-signaal per open dienst (bemiddelaar) (2026-07-15, PR #779)** —
> op `/franchise/diensten` toonde de bemiddelaar per open dienst "X dagen open"/reactie-tellingen, maar geen
> antwoord op zijn kernvraag: "kan ik dit NU vullen uit mijn eigen roster of moet ik werven?" Nu een compacte chip
> **"N geschikte vakmensen vrij"** per open (gepubliceerde, ongevulde) dienst zodra er vrij-inzetbare
> roster-vakmensen zijn die goed matchen op déze dienst — één-oogopslag-triage tussen voordragen en werven
> (benchmark Pidz/Zorgwerk). Een vakmens telt mee bij vrij-inzetbaar (`isIdleReady`: ACTIEF + beschikbaar + geen
> lopende opdracht — dezelfde bron als de roster-capaciteitstegel) én matchscore ≥ `READY_MATCH_MIN_SCORE=60`
> (zelfde motor als het voordraag-scherm). Chip alleen bij ≥1 ready match (rustige lijst). Pure
> `dienst-fill-signal.ts` (`computeDienstFill` + `dienstFillChip` + data-loader `getRosterFillSignals`: roster +
> dienst-matchvelden gebundeld geladen, tenant-gescopet, geen N+1; 11 tests) + gedeelde `rosterMatchSource`-mapping
> geëxtraheerd uit `dienst-voordracht.ts` (gedragsbehoudend) + wiring in `franchise/diensten/page.tsx`. Read-only,
> geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Gate groen.
>
> Gedaan (niet opnieuw): **Compliance-ripple next-action voor de opdrachtgever (2026-07-15, PR #777)** — de
> opdrachtgever-compliance-ripple (een lopende samenwerking waarvan de ZZP'er een vereist certificaat
> mist/verlopen/binnenkort-verlopend heeft) verscheen wél op de dashboard-momentopname + `/samenwerkingen`-lijst,
> maar ontbrak als item-taak in `/acties`, de "Volgende acties"-rail en de zijbalk-badge — die surfaces gebruiken
> sinds de migratie uitsluitend de item-engine (`pending-tasks.ts`), terwijl de dode aggregaat-engine
> (`clientNextActions`) het als hoogste opdrachtgever-actie (`P.complianceRipple=85`) had. Twee next-action-surfaces
> spraken elkaar tegen. Nu een nieuwe pure builder `clientComplianceTask` (`tasks.ts`): NON_COMPLIANT
> (ontbrekend/verlopen = acuut gat) → `P.complianceRipple` (85, attention); WARNING (binnenkort-verlopend/in
> beoordeling) → `P.credentialExpiring` (70). Eén taak per samenwerking, deep-link naar het samenwerkingsdetail;
> `kind: "client-compliance"` valt via de `default`-tak van `action-list.tsx` op de link-resolver (geen UI-wiring).
> Wiring in `clientTasks` via de bestaande, geteste `clientCredentialAlerts(userId)` (eigenaar-gescoopt,
> take-begrensd) in de `Promise.all`. Spiegelt de bemiddelaar-`franchiseCredentialExpiryTask`. Read-only qua
> datamodel, geen nieuw mutatie/auth-oppervlak, geen N+1. +8 tests. Gate groen (4200 tests, build ✓).
>
> Gedaan (niet opnieuw): **Tarief-passendheid-chip op de opdrachtenlijst (ZZP'er) (2026-07-15, PR #775)** —
> op `/opdrachten` (find-work/triage-lijst) toonde elke kaart al ZZP-zijdige signalen (match, reistijd,
> concurrentie, betaalgedrag, startdatum-beschikbaarheid) maar géén oordeel of het opdrachtbudget past bij
> wat de ZZP'er zélf vraagt; hij moest het budget (`rateMin–rateMax`) mentaal tegen zijn eigen uurtarief
> afzetten. "Betaalt deze opdracht wat ik vraag?" is een kern-triagevraag vóór je tijd in een reactie steekt
> (benchmark Malt/Upwork rate-fit). Nu een compacte chip per kaart — **"Onder je tarief"** (budgetplafond
> onder je tarief, warning) / **"Boven je tarief"** (budgetbodem boven je tarief, kans), alleen bij een
> uitgesproken mismatch (tarief binnen budget of onbekend → geen chip, lijst blijft rustig). Pure
> `jobRateFitChip` in `job-rate-fit.ts` (vergelijkt `hourlyRate` met `rateMin/rateMax`; plafond gaat vóór
> bodem; 8 tests) + wiring in `opdrachten/(index)/page.tsx` (`rateFitByJob`-map over de zichtbare opdrachten,
> `Wallet`-chip). Geen extra query (`hourlyRate` met profiel geladen, budget al op de opdracht). Los van
> `rate-fit.ts` (opdrachtgever-zijdig op `/kandidaten`). Read-only, geen schemawijziging, geen nieuw
> mutatie/auth-oppervlak, geen N+1. Gate groen (typecheck, lint, unit-tests, build ✓).
>
> Gedaan (niet opnieuw): **E-mail-connectiviteitszelftest voor de beheerder (2026-07-15, PR #774)** —
> naast de bestaande Opslag-zelftest kon de beheerder de e-mailkoppeling wel als "geldig geconfigureerd"
> zien, maar niet bevestigen dat er ook écht mail wordt afgeleverd. Nu een **E-mail-zelftest** op
> `/admin/systeemstatus` (admin-only): ontvangeradres invullen, "Testmail versturen" klikken, en er
> gaat één echte testmail uit via het geconfigureerde kanaal (`getMailSender()` — `noop`/`smtp`/
> `resend`) — de laatste check vóór go-live ná het plakken van `RESEND_API_KEY`/`EMAIL_FROM` (of de
> SMTP-variabelen). Bij `EMAIL_DRIVER=noop` meldt het scherm eerlijk "Geen kanaal actief — er is niets
> verzonden" (geen vals groen vinkje). Volgt de volledige mutatieketen auth → rol (ADMIN) → rate-limit
> (`mailSelfTestRateLimiter`, default 4/5 min, instelbaar via `MAIL_SELFTEST_RATE_LIMIT`) → actie →
> audit (`MAIL_SELFTEST_RUN`); audit/log bevat nooit het ontvangeradres of secrets, alleen de uitkomst
>
> - driver-modus. Nieuwe bestanden: `mail-selftest.ts` (+test), `mail-selftest.tsx`,
>   `runMailSelfTestAction` in `systeemstatus/actions.ts`, limiter in `rate-limit.ts`. Read-only qua
>   datamodel: geen schemawijziging, geen nieuwe verplichte env-var. Gate groen (typecheck, lint,
>   unit-tests, build, prettier).
>
> Gedaan (niet opnieuw): **Beschikbaarheids-conflict-chip op de opdrachtenlijst (ZZP'er) (2026-07-15, PR #771)** —
> het beschikbaarheidssignaal (valt de startdatum in een periode die de ZZP'er zélf op onbeschikbaar/beperkt heeft
> gezet?) leefde alleen op de opdracht-detailpagina (`assessJobStartAvailability` → `job-availability-signal-card`).
> Op de `/opdrachten`-browse-lijst moest de ZZP'er elke opdracht openen om een agenda-conflict te ontdekken. Nu een
> compacte chip per opdracht op de lijst zelf — hij steekt geen tijd in een reactie voor een klus die hij al
> geblokkeerd heeft (zelfde detail→lijst-chip-patroon als concurrentie/betaal/reistijd). Pure `jobAvailabilityChip`
> in `job-availability-signal.ts` (mapt het bestaande `JobAvailabilitySignal` naar `{label,tone}`: UNAVAILABLE →
> "Je bent dan niet beschikbaar"/`block`, LIMITED → "Dan beperkt beschikbaar"/`limited`, geen signaal → null; +3
> tests) + wiring in `opdrachten/(index)/page.tsx` (`availabilityWindows` in de bestaande profiel-`include` — geen
> extra query; `availabilityByJob` per zichtbare opdracht via `assessJobStartAvailability`; `CalendarOff`-chip ná
> de betaal-chip). Read-only advies-signaal, geen schemawijziging, geen nieuw mutatie/auth-oppervlak, geen N+1.
> Gate groen (typecheck, lint, unit-tests, build ✓).
>
> Gedaan (niet opnieuw): **Prod-rijpheid — auditlog-retentie-pruning (AVG dataminimalisatie) (2026-07-14, PR #768)** —
> het verwerkingsregister (`RETENTION_SCHEDULE`) documenteert 12 maanden bewaartermijn voor het auditlog/
> beveiligingslogboek (AVG art. 5 lid 1e), maar geen code dwong die af — auditregels mét IP-adres accumuleerden
> onbeperkt. Nu een geplande taak `audit-retention` (in `/api/tasks/run-all`) die regels ouder dan het
> geconfigureerde venster gebatcht + idempotent snoeit, met één verantwoordings-auditrecord per actie (art. 5 lid 2).
> Pure `audit-retention.ts` (`auditRetentionCutoff`) + config-parser `parseAuditRetentionDays` (opt-in, veilige
> minimumvloer 30 dagen) + taak + wiring + system-status-item + env-schema. Inert-by-default
> (`AUDIT_LOG_RETENTION_DAYS` leeg = onbeperkt, huidig gedrag). Geen schemawijziging. +20 tests, gate groen.
> Resterend mensenwerk: bewaartermijn laten vaststellen (privacyjurist), daarna `AUDIT_LOG_RETENTION_DAYS=365` zetten.
>
> Gedaan (niet opnieuw): **Betaal-vertrouwenschip op de browse-lijst (ZZP'er) (2026-07-14, PR #765)** — op
> `/opdrachten` (browse-/triage-lijst) toonde elke kaart al ZZP-zijdige signalen (match, reistijd, concurrentie,
> startdatum) maar géén opdrachtgever-vertrouwenssignaal; om te zien of een opdrachtgever op tijd betaalt moest je
> élke opdracht openen (`payment-behavior-block` op de detailpagina). "Krijg ik op tijd betaald?" is het diepste
> beslissignaal vóór je tijd in een reactie steekt (benchmark Malt/Upwork). Nu een compacte chip per kaart —
> **"Betaalt op tijd"** / **"Betaalt vaak laat"**, alleen bij een uitgesproken reputatie. Pure `paymentTrustChip`
> in `payment-behavior.ts` (hergebruikt `computePaymentBehavior`; toont alleen `good`/`warning`, null bij
> neutral/unknown zodat de lijst rustig blijft; 4 tests) + begrensde batch-loader `getPaymentBehaviorForCompanies`
> in `data/payment-behavior.ts` (spiegelt `getClientResponsivenessForCompanies`, per opdrachtgever `take: 25`) +
> wiring in `opdrachten/(index)/page.tsx` (alleen ZZP'er, zichtbare gepagineerde opdrachten, `BadgeEuro`-chip).
> Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak, alleen het geaggregeerde betaaloordeel
> (≥3 facturen) — nooit een individuele factuur/bedrag. Gate groen (4128 tests, build ✓).
>
> Gedaan (niet opnieuw): **'Kandidaten wachten op je beslissing' next-action (opdrachtgever) (2026-07-14, PR #763)** —
> de ZZP'er ziet op `/reacties` al een "je reactie ligt al lang"-signaal (`application-wait.ts`), maar de opdrachtgever
> kreeg geen tegenhanger zodra een reeds-bekeken kandidaat (VIEWED/SHORTLIST) langer dan gebruikelijk op een beslissing
> wacht — alleen nieuwe NEW-reacties werden genudged (`applicationsReviewTask`). Neglected kandidaten haken stil af
> (benchmark Temper/Malt/Deel: trage opdrachtgevers verliezen talent). Nu een next-action "N kandidaten wachten op je
> beslissing" op `/acties` + dashboard-zone "Volgende acties", die de bestaande `WAIT_ATTENTION_DAYS`-drempels hergebruikt
> (VIEWED ≥ 14 / SHORTLIST ≥ 21 dagen). Pure `stale-applications.ts` (`summarizeStaleClientApplications`: leunt op de
> geteste `summarizeApplicationWait`, telt alleen VIEWED/SHORTLIST met `attention` — NEW valt buiten om dubbeltelling met
> de "nieuwe reacties"-taak te vermijden; `count`+`oldestDays`, null bij geen aandacht; 8 tests) + `staleApplicationsTask`
> (kind `stale-applications`, link → `/kandidaten`, band `P.staleApplications=52`; 2 tests) + wiring in `clientTasks`
> (één begrensde eigenaar-gescoopte query met DB-side createdAt-voorfilter, `take: MAX`). Read-only, geen schemawijziging,
> geen nieuw mutatie/auth-oppervlak. Gate groen (4124 tests, build ✓).
>
> Gedaan (niet opnieuw): **Bulk-goedkeuren ingediende urenstaten per samenwerking (opdrachtgever) (2026-07-13, PR #756)** —
> de opdrachtgever kon ingediende urenstaten/opleveringen alleen los goedkeuren op `/samenwerkingen/[id]` (per prestatie
> een aparte knop); bij een reeks diensten betekende dat doorklikken per staat, en zolang niet gekeurd is staat de
> factuur-cascade (event B → concept-factuur) stil en wacht de ZZP'er op geld. Nu een "Snel goedkeuren"-paneel bovenaan
> `/prestaties` met per samenwerking (≥2 ingediende urenstaten) één knop "Keur alle N goed" + teller/somtotaal + "wacht al
> lang"-markering (benchmark Temper/Bendy bulk-goedkeuren). Pure `prestaties-bulk.ts` (`groupSubmittedForBulkApproval`,
> groepeert SUBMITTED per samenwerking, cap ≥2, sorteert meeste-wachtende/hoogste-bedrag eerst; 6 tests) + server-action
> `approveSubmittedPerformancesAction` (rol-poort CLIENT/ADMIN → eigenaar-gescoopte query `collaboration.company.userId`
> `take 500` → loop door de bestaande `approvePerformance`-cascade per prestatie; per-item try/catch, één falende sleept de
> rest niet mee; 4 authz-tests) + client-`bulk-approve-panel.tsx`. Geen schemawijziging, geen tweede goedkeur-pad, dubbele
> eigenaarscontrole, idempotent via bestaande dedupeKey. Gate groen (4093 tests, build ✓).
>
> Gedaan (niet opnieuw): **Vacaturetempo-signaal op "Mijn opdrachten" (opdrachtgever) (2026-07-13, PR #755)** —
> de CLIENT-lijst `/opdrachten` toonde per opdracht de reactie-pijplijn maar geen tempo-oordeel; of een
> gepubliceerde opdracht koud liep zag je alleen door élke opdracht te openen (`JobVacancyPerformanceCard` op
> de detailpagina). Nu een compacte vacaturetempo-chip per gepubliceerde kaart (koud/gestaag/sterk) + een
> "aandacht nodig"-strip bovenaan (telt de opdrachten die bijsturen vragen), zodat de opdrachtgever in één
> oogopslag triageert welke posting tarief/eisen/zichtbaarheid moet bijstellen. Hergebruikt de geteste pure
> `summarizeVacancyPerformance` (zelfde koud-drempels als `job-engagement.ts`). Nieuwe pure
> `job-vacancy-overview.ts` (`summarizeVacancyPortfolio` + `vacancyPortfolioHeadline`, null zonder aandacht;
> 6 tests) + `vacancy-pace-chip.tsx` + wiring in `ClientJobs` (één begrensde `status != WITHDRAWN`-query over de
> eigen reacties, geen N+1; `publishedAt ?? createdAt` als anker). Read-only, geen schemawijziging, geen nieuw
> mutatie/auth-oppervlak, alleen geaggregeerde tellingen. Gate groen (4073 tests, build ✓).
>
> Gedaan (niet opnieuw): **Prod-rijpheid — graceful shutdown draining (2026-07-13, PR #754)** — bij een
> Railway-redeploy kreeg de afsluitende instance nog nieuw verkeer: `scripts/start.mjs` killde de Next-child
> bij SIGTERM zonder venster en `/api/readiness` bleef `200` tot het proces al weg was, waardoor lopende
> requests (uploads, cascade-mutaties, webhooks) afgekapt konden worden. Nu zet de server bij een afsluitsignaal
> `/api/readiness` op `503` (`"draining": true`) terwijl `/api/health` bewust `200` blijft (LB stopt met nieuw
> verkeer; host-healthcheck herstart de container niet vroegtijdig); Next rondt lopende requests af en `start.mjs`
> forceert een `SIGKILL` na `SHUTDOWN_FORCE_KILL_MS` (default 25000 ms, geklemd [1000,120000]) zodat de deploy
> nooit blijft hangen (tweede signaal forceert direct). Pure `src/lib/observability/shutdown.ts`
> (`beginDraining`/`isDraining`/`drainingSinceAt`/`registerShutdownSignals`, geïnjecteerde klok+signaal-registratie,
> idempotent; 10 tests) + optionele `draining`-check in `readiness.ts` (backward compatible; +4 tests) + wiring in
> `api/readiness/route.ts`, `instrumentation.ts` (Node-runtime) en `scripts/start.mjs`. Geen schemawijziging, geen
> dependency, verzwakt geen check (readiness strenger, liveness ongewijzigd). RUNBOOK §2 + MENSENWERK §0b +
> `.env.example`. Gate groen (4067 tests, build ✓).
>
> Gedaan (niet opnieuw): **BTW-aangifte-deadline als next-action (ZZP'er + opdrachtgever) (2026-07-13, PR #751)** —
> de harde fiscale kwartaaldeadline (boete bij missen) leefde alleen in het `/administratie`-boekhoudpaneel. Nu
> verschijnt hij als concrete, klikbare next-action op `/acties` én in de dashboard-zone "Volgende acties" zodra
> de deadline nadert (≤14 dagen) of verstreken is én er een saldo te melden is — de ZZP'er/opdrachtgever hoeft de
> kwartaaldeadline niet meer zelf te bewaken (benchmark Deel/boekhoud-tools: proactieve indieningsherinnering).
> Puur `vat-deadline.ts` +`vatQuarterRange` (query-scoping) +`vatDeadlineNeedsAction` (alleen due-soon/overdue mét
> niet-nul saldo; een nihil-kwartaal wordt niet genudged — geen fiscaal advies) + data-loader
> `data/vat-deadline.ts` (`getVatDeadlineForActor`: owner-/kwartaal-gescoopte `administrationEntry`-query,
> hergebruikt de geteste `summarizeVatDeadline`; null voor rollen zonder grootboek) + `vat-deadline`-kind/
> `vatDeadlineTask` (link-resolver → `/administratie`, "af te dragen"/"terug te vorderen", aftelling/"te laat") +
> prioriteitsbanden `vatDeadlineOverdue`(74)/`vatDeadlineDueSoon`(58) + wiring in `pending-tasks.ts` (FREELANCER +
> CLIENT). De link-resolver valt via de bestaande `default`-tak van `action-list.tsx` op `OpenLink` — geen
> UI-wijziging. Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. +8 tests. Gate groen (4053
> tests, build ✓).
>
> Gedaan (niet opnieuw): **"Nog te factureren" geld-glance op het ZZP-dashboard (2026-07-13, PR #749)** —
> na goedkeuring van een prestatie ontstaat automatisch een concept-factuur (`lifecycleStatus=DRAFT`) die de
> ZZP'er nog moet indienen (event C). Dat "geld blijft liggen"-signaal stond alleen passief op `/prognose` en
> per samenwerking op `/acties`, nergens als één bedrag-op-het-startscherm (benchmark Bendy uren-naar-factuur).
> Nu een KPI-tegel "Nog te factureren" (bruto bedrag + aantal concept + oudste-ouderdom als aging-signaal),
> alleen bij ≥1 concept. Pure `src/lib/unbilled-invoices.ts` (`summarizeUnbilledInvoices`, lidmaatschap via de
> cascade-bewuste `invoiceGroup` — dezelfde bron als de /facturen-"Concept"-pill; `UNBILLED_AGING_DAYS=7`; null
> zonder concept; 7 tests) + data-loader `src/lib/data/unbilled-invoices.ts` (`getUnbilledInvoiceSummary`: één
> owner-gescoopte query begrensd tot concept-kandidaten, sluit bevroren samenwerkingen uit) + wiring in
> `dashboard/page.tsx` (KPI-push ná de geldpuls, `Receipt`-icoon, aging → warning-toon). KPI's zijn niet
> klikbaar (geen dode knop); de submit-actie leeft al in de next-action-rail. Geen schemawijziging, geen nieuw
> mutatie/auth-oppervlak, i18n-woordenboek niet aangeraakt. Gate groen (4045 tests, build ✓).
>
> Gedaan (niet opnieuw): **Prod-rijpheid — go-live preflight-CLI (`npm run preflight`) (2026-07-13)** —
> de productie-configuratie-posture was alleen zichtbaar via het in-app `/admin/systeemstatus`-scherm
> (vereist draaiende server + admin-login). Nu ook een CLI go-live preflight die dezelfde gevalideerde
> boot-logica (`validateEnv`) + posture (`collectSystemStatus`) **buiten de app** draait, zodat de
> operator vóór/tijdens de deploy (`railway run npm run preflight`) of in CI een duidelijk GO/NO-GO-
> oordeel krijgt. Rapporteert per onderdeel `[ ok ]`/`[info]`/`[ !! ]` + boot-waarschuwingen; toont
> nooit sleutelwaarden. Exit `0`/`1` (--strict poort)/`2` (ongeldige basisconfig); `--json` machineleesbaar.
> Pure `src/lib/ops/preflight.ts` (10 tests, incl. PII-lek-guard) + `scripts/preflight.ts` (tsx) +
> `package.json`-script; RUNBOOK §3 + MENSENWERK §11 bijgewerkt. Geen schemawijziging, geen nieuwe env-var,
> read-only inspectie (geen productie-oppervlak/mutatie geraakt). Gate groen.
>
> Gedaan (niet opnieuw): **Reputatie + eerder-samengewerkt in de kandidaat-vergelijker (opdrachtgever)
> (2026-07-12)** — de side-by-side kandidaat-vergelijker (`/kandidaten/vergelijk`) toonde match, tarief,
> vertrouwen, compliance, leverbetrouwbaarheid, beschikbaarheid en reistijd, maar niet de twee sterkste
> rehire-signalen die de kandidatenlijst (`/kandidaten`) wél toont: **reputatie** (gemiddelde
> opdrachtgever-beoordeling, sterren) en **"eerder samengewerkt"** (afgeronde samenwerkingen met déze
> opdrachtgever). Bij een aannamebeslissing wegen "hoog beoordeeld" en "beviel me eerder" zwaar (benchmark
> Malt/Upwork/LinkedIn "worked together before"); zonder die rijen was de vergelijking incompleet. Nu twee
> nieuwe rijen: "Reputatie" (met uniek-hoogste-winnaar via nieuwe `bestRatingId`; kandidaat zonder
> beoordeling telt niet mee — geen valse 0-sterren) en "Samenwerking · met jou" (rehire-vlag, geen winnaar).
> Hergebruikt de bestaande, geteste data-loaders (`getReviewRatingsForCandidates`,
> `getSharedHistoryForCandidates`) + componenten (`RatingStars`, `CandidateHistoryBadge`) uit `/kandidaten`
> — drie gebatchte, eigenaar-/subject-gescoopte queries in één `Promise.all` (geen N+1). `CompareCandidate`
> uitgebreid met `reviewRating`/`sharedHistory`; +3 tests op `bestRatingId`. Read-only, geen schemawijziging,
> geen nieuw mutatie/auth-oppervlak. Gate groen (4002 tests, build ✓).
>
> Gedaan (niet opnieuw): **Concurrentie-chip op de opdrachtenlijst (ZZP'er) (2026-07-12)** — op `/opdrachten`
> (de triage-lijst) ziet de ZZP'er nu per opdracht een compacte concurrentie-chip ("3 reacties" / "8 reacties ·
> reageer snel") zodra er al ándere actieve reacties zijn — het kanssignaal dat tot nu toe alleen op de
> detailkaart (`JobCompetitionCard`) stond. Zo triageert de ZZP'er meteen welke opdracht eerst te pakken
> (benchmark Temper/Pidz/Zorgwerk: "binnen uren" vullen; wij maken de concurrentie vooraf verklaarbaar). Chip
> alleen bij ≥1 reactie (geen ruis op lege opdrachten) en niet op reeds-beantwoorde opdrachten; alleen
> geaggregeerde telling, nooit identiteit/score van anderen. Pure `competitionChip` in `job-competition.ts`
> (hergebruikt de geteste `summarizeJobCompetition`, +5 tests) + wiring in `opdrachten/(index)/page.tsx` (twee
> begrensde queries over de zichtbare pagina-ids: `groupBy` reactietelling + eigen reacties; `Users`-chip).
> Read-only, geen schemawijziging, geen N+1. Gate groen (3980 tests, build ✓).
>
> Gedaan (niet opnieuw): **Reistijd-signaal per kandidaat bij het voordragen (bemiddelaar) (2026-07-12)** — de
> bemiddelaar zag op `/franchise/diensten/[id]` bij het voordragen match/compliance/inzetbaarheid/dubbele-boeking,
> maar niet **hoe ver** een roster-ZZP'er naar de dienst-locatie reist — een concrete regio-planningsfactor
> (Zorgwerk/Pidz: dichtstbijzijnde beschikbare eerst; dichterbij dagt betrouwbaarder op). Nu een reistijd-chip
> per kandidaat, spiegel van het `/kandidaten`-proximity-signaal (opdrachtgever). Hergebruikt de pure
> `classifyCandidateProximity` (REMOTE/onbekende plaats ⇒ geen chip); `RosterCandidate.proximity` in
> `buildRosterCandidates` uit `job.workMode`+`job.location`+`f.location` (al geladen — nul extra query) + chip in
> `voordragen.tsx`. Read-only, geen schemawijziging, geen nieuw mutatie/auth-oppervlak. Gate groen (3975 tests, build ✓).
>
> Gedaan (niet opnieuw): **Dubbele-boeking-signaal bij het voordragen (bemiddelaar) (2026-07-12)** — de
> bemiddelaar zag bij het voordragen van een roster-ZZP'er op `/franchise/diensten/[id]` match/compliance/
> inzetbaarheid, maar niet of die ZZP'er al op een andere ACTIEVE samenwerking staat waarvan de looptijd de
> **startdatum van de dienst** overlapt (een vakmens kan niet twee diensten tegelijk draaien). Nu een
> waarschuwingsregel ("Al ingezet — overlap met …") per kandidaat vóór de voordracht (benchmark Zorgwerk/Pidz-
> planning). Puur `src/lib/franchise/roster-double-booking.ts` (`detectDoubleBooking`; venster
> `[start, end ?? FAR_FUTURE]` inclusief-omsluit de dienststart; null-datum → geen vals alarm; 14 tests) +
> wiring in `dienst-voordracht.ts` (`activeCollaborations`-select, `doubleBooking`-veld, `dienst`-context in
> `buildRosterCandidates`) + `voordragen.tsx` (`CalendarClock`-warning). Read-only, geen schemawijziging, geen
> nieuw mutatie/auth-oppervlak. Gate groen (3943 tests, build ✓).
>
> Gedaan (niet opnieuw): **"Je bent uitgenodigd" — ontvangen uitnodigingen voor de ZZP'er op /opdrachten
> (2026-07-11, PR #729)** — een directe uitnodiging (`inviteFreelancerToJob` / bulk) landde alléén als een
> vluchtige `Notification` + een `JOB_INVITED`-auditrecord; de ZZP'er had geen blijvende plek voor "welke
> opdrachtgevers nodigden mij uit?". Een uitnodiging is de hoogst-intente lead (een opdrachtgever koos jóu
> specifiek; benchmark LinkedIn/Malt/Upwork "invited to apply"). Nu een prominente "Je bent uitgenodigd"-band
> bovenaan `/opdrachten` (find-work-pagina) met open, nog-onbeantwoorde uitnodigingen + directe "Bekijk &
> reageer". Pure `src/lib/received-invitations.ts` (`selectOpenInvitations`: dedup per opdracht (meest recente),
> alleen nog-PUBLISHED, sluit reeds-beantwoorde uit, nieuwste eerst, cap 6; 9 tests) + data-laag
> `data/received-invitations.ts` (`getReceivedInvitations`: eigen JOB_INVITED-audit via metadata-`contains` +
> exacte parse, drie begrensde eigenaar-gescopete queries, geen N+1) + `ReceivedInvitationsBand` + wiring in
> `BrowseJobs` (dezelfde parallelle batch, alleen ZZP'er, alleen bij ≥1). Read-only, geen schemawijziging, geen
> nieuw mutatie/auth-oppervlak. Seed-demo `seed-invite-job8-sanne` (ZorgGroep → Sanne). Gate groen (3928 tests,
> build ✓).
>
> Gedaan (niet opnieuw): **Staat van dienst (afgeronde klussen + uren) op het vertrouwensdossier
> (2026-07-11, PR #723)** — het portable, deelbare vertrouwensdossier (`/vertrouwen/[profileId]/[token]`)
> toonde geverifieerde certificaten + vertrouwensniveau maar niet de feitelijke staat van dienst
> (afgeronde samenwerkingen + gewerkte uren) die de ZZP'er wél op de browse-kaart heeft. Nu een
> drempel-gegate "Staat van dienst"-sectie op het deelbare dossier — het sterkste zelf-marketing-
> artefact van de ZZP'er (benchmark Malt/LinkedIn: toon aantoonbaar geleverd werk). Pure
> `src/lib/data/freelancer-track-record.ts` (`getFreelancerTrackRecord`, mirror van de aggregatie in
> `freelancer-search.ts`; cap 2000) + 3 tests; hergebruikt de al-geteste pure `trackRecordHighlights`
> (≥1 klus / ≥8 uur — geen magere "0"-cijfers). Wiring in de dossier-page ná de deel-/liveness-poort;
> `vertrouwen-liveness.test.ts`-mock uitgebreid. Read-only, geen schemawijziging, geen nieuwe
> mutatie/auth-surface. Gate groen (3881 tests, build ✓).
>
> Gedaan (niet opnieuw): **Prod-rijpheid — onderhoudsmodus (maintenance mode) (2026-07-11)** — een
> operationele noodrem waarmee de beheerder het platform tijdens een geplande migratie, een database-
> herstel of een incident gecontroleerd offline haalt: bezoekers krijgen een rustige 503-onderhoudspagina
> (thema-bewust, geen scripts, NL) met een `Retry-After`-hint, terwijl `/api/health` + `/api/readiness`
> bereikbaar blijven zodat de Railway-healthcheck de container niet neerhaalt en uptime-monitors groen
> blijven. Inert by default (`MAINTENANCE_MODE`), draait vóór auth/rol-guards in de middleware. Ingelogde
> admins mogen er standaard door (`MAINTENANCE_ALLOW_ADMIN=false` = volledige afsluiting); eigen tekst via
> `MAINTENANCE_MESSAGE`, hint via `MAINTENANCE_RETRY_AFTER` (geklemd [30,86400]). Pure `src/lib/maintenance.ts`
> (`isMaintenanceEnabled`/`maintenanceAllowsAdmin`/`maintenanceRetryAfterSeconds`/`maintenanceMessage`
> (control-tekens gestript + 300-cap)/`isMaintenanceExemptPath`/`shouldServeMaintenance`/`escapeHtml`/
> `buildMaintenancePage`; 25 tests) + wiring in middleware, env-schema (4 velden + prod-boot-waarschuwing zolang
> aan) en `/admin/systeemstatus` (item "Onderhoudsmodus", aan=aandacht). Geen schemawijziging, geen dependency,
> verzwakt geen enkele auth-check (extra blokkade). RUNBOOK §9 + MENSENWERK §11 + `.env.example` bijgewerkt.
> Gate groen (3858 tests, build ✓).
>
> Gedaan (niet opnieuw): **Compliance-strip (aflopende certificaten) voor de bemiddelaar op /franchise/zzpers
> (2026-07-11, PR #716)** — het ZZP'er-roster had per-rij een vervalchip + een `?alerts=1`-filter maar geen
> aggregaat dat de kernvraag "houd ik mijn pool compliant?" in één oogopslag beantwoordt. Nu een strip bovenaan
> `/franchise/zzpers` (naast de capaciteit-strip #707) met het aantal vakmensen met een **verlopen** (hard gat)
> of **aflopend** certificaat, klikbaar naar het bestaande alerts-filter; rendert alleen bij een signaal. Pure
> `src/lib/franchise/credential-compliance.ts` (`summarizeCredentialCompliance` partitioneert per meest-urgent
> vervalvenster in expired/expiringSoon/clear, `flagged=expired+expiringSoon`, sommen tot total;
> `credentialComplianceHeadline`, verlopen zwaarder dan aflopend; hergebruikt `ExpiryWindow` — geen eigen
> drempels; 8 tests) + `CredentialComplianceStrip` (3 StatCards) + `alertWindow` op de reeds gebouwde RosterCard
> (geen extra query, geen schemawijziging). Benchmark Pidz/Zorgwerk (bureau moet compliance vóór zijn). Gate groen.
>
> Gedaan (niet opnieuw): **Bulk-uitnodiging geschikte ZZP'ers voor een opdracht (2026-07-10, PR #715)** —
> de opdrachtgever kon geschikte ZZP'ers alleen één voor één uitnodigen (`inviteFreelancerToJob`, #625);
> concurrenten (PIDZ/Zorgwerk) nodigen matchende krachten "binnen uren" automatisch uit. Nu één klik
> **"Nodig alle uit (N)"** op de "Geschikte ZZP'ers"-sectie van `/opdrachten/[id]` (getoond bij ≥2 nog-niet-
> uitgenodigde suggesties): alle nog-niet-uitgenodigde suggesties in één keer, met behoud van onze verklaarbare
> matching. Pure `job-invite.ts` `planBulkJobInvites` (dedup + reeds-uitgenodigd-uitsluiting + cap
> `MAX_BULK_JOB_INVITES=10`, behoudt hoogste-match-eerst) + gedeelde `parseInvitedFreelancerIds` (één bron voor
> page-badge én action-dedup) + server-action `inviteSuggestedFreelancersToJob` (auth→rol CLIENT→ownership→
> server-side eligibility; kandidatenbron = `suggestedFreelancersForJob`; defensieve her-fetch discoverable+eigen
> tenant; `inviteRateLimiter` één token per uitnodiging; notificaties+audits via `createMany` in één transactie;
> idempotent, race-veilig, geen 500). Geen schemawijziging, geen eigen datamodel. +11 tests, gate groen (3815).
>
> Gedaan (niet opnieuw): **Realistische cashflow-prognose op basis van betaalgedrag op /prognose (2026-07-10, PR #713)** —
> de inkomsten-tijdlijn bucketde elke openstaande factuur op de contractuele vervaldag (`dueAt`), terwijl we per factuur
> al een betaalgedrag-gecorrigeerde verwachte betaaldatum berekenden (`forecastInvoicePayout` + `computePaymentBehavior`,
> zichtbaar op het facturen-paneel). Geld van structureel-trage opdrachtgevers viel te vroeg in "Deze maand" → te
> optimistische cashflow. Nu volgt de maand-bucket de realistische verwachting wanneer er ≥3 betaalde facturen van díe
> opdrachtgever zijn. `income-forecast.ts` (`realisticDate?` op `ForecastItem`, `effectiveDate()` stuurt bucket + sortering,
> OVERDUE-detectie blijft op de contractuele vervaldag, `behaviorAdjustedCount`, CSV op effectieve datum) +
> `data/income-forecast.ts` (2e begrensde `status:"PAID"`-query → betaalgedrag per Company, `realisticDate` alleen op
> APPROVED nog-niet-verlopen met `forecast.confident`) + `prognose-panel.tsx` (kop-notitie + per-regel "Verwacht rond … ·
> doorgaans N dagen na de vervaldag"). Additief, geen schemawijziging, privacy (alleen eigen betaalde facturen). +5 tests,
> gate groen. Vervolg-fix (agent-review): `effectiveDate()` dwingt de invariant af (correctie alleen naar LATER, nooit
> vóór de vervaldag — `forecastInvoicePayout` clamt niet), data-laag zet `realisticDate` alleen bij `expectedAt > dueAt`.
>
> Gedaan (niet opnieuw): **Klant-relatiegezondheid (churn-signaal) voor de bemiddelaar op /franchise/opdrachtgevers (2026-07-10, PR #709)** —
> de klantenlijst toonde statische afdeling-/dienst-tellingen maar geen antwoord op de CRM-kernvraag "welke klant
> verdient nu een belletje?": wie plaatst actief werk versus wie is stilgevallen (churn-risico; benchmark Bullhorn/
> PIDZ-regiokantoor). Nu een relatiegezondheid-strip bovenaan + per-rij statuschip + filter-tabs. Pure
> `src/lib/franchise/client-health.ts` (`classifyClientHealth`: `active`=PUBLISHED-opdracht óf ACTIVE-samenwerking,
> `attention`=niets + laatste activiteit/aanmelding ≥ `CLIENT_IDLE_DAYS=30` geleden, `quiet`=recent; drie buckets die
> samen `total` vormen; TZ-robuuste UTC-dagen, `now` geïnjecteerd; 16 tests) + `ClientHealthStrip` (3 StatCards,
> "Stilgevallen" klikbaar → `?status=aandacht`) + wiring op `opdrachtgevers/page.tsx` (filtered nested
> `_count.collaborations(ACTIVE)` + 2 groupBy-aggregaten voor open-opdracht-presence en laatste activiteit — geen N+1;
> "laatst actief"-datum per rij). Spiegelt roster-capaciteit (#707) naar de klantkant. Geen schemawijziging. Gate
> groen (3779).
>
> Gedaan (niet opnieuw): **Roster-capaciteit ('vrij inzetbaar') voor de bemiddelaar op /franchise/zzpers (2026-07-10, PR #707)** —
> de bemiddelaar zag per-kaart de inzetbaarheid maar geen aggregaat "wie kan ik nu aan het werk zetten?".
> Nu een capaciteitsstrip bovenaan met de **vrij-inzetbare** capaciteit als hoofdmaat (ACTIEF + beschikbaar +
> geen lopende opdracht; benchmark Pidz/Zorgwerk: bezetting maximaliseren) + één-klik filter `?idle=1`. Pure
> `src/lib/franchise/roster-capacity.ts` (`isIdleReady` als gedeelde bron voor strip én filter,
> `summarizeRosterCapacity` partitioneert in placed/needsAttention/idleReady/unavailable — "nu ingezet" wint
> van een aandachtspunt —, `rosterCapacityHeadline`; 16 tests) + `RosterCapacityStrip` (4 StatCards, "Vrij
> inzetbaar" klikbaar) + `onlyIdle`-dimensie in `zzper-roster-filter.ts` (+ `activeCollaborations` op
> `RosterZzper`) + "Alleen vrij inzetbaar"-checkbox. Wiring: `_count.collaborations` gefilterd op
> `status:"ACTIVE"` (was ongebruikt in de render) → `activeCollaborations`. Geen schemawijziging, geen extra
> query. Gate groen (3763 tests).
>
> Gedaan (niet opnieuw): **'Bewaard, nog niet gereageerd'-signaal op /opgeslagen (2026-07-10, PR #705)** —
> een ZZP'er die een opdracht bewaart maar niet reageert, verliest die stilletjes; `/opgeslagen` toonde
> open/niet-beschikbaar maar niet óf je al reageerde of dat de startdatum nadert (Indeed/LinkedIn
> "opgeslagen, nog niet gesolliciteerd"). Pure `src/lib/saved-jobs-nudge.ts` (`summarizeSavedJobAction` →
> `applied`/`open`/`start_soon` bij startdatum ≤ `SAVED_JOB_START_SOON_DAYS=10`, TZ-robuuste UTC-dagen,
> verstreken start → `open`; `countUnactedSavedJobs`; 9 tests) gevoed naar `/opgeslagen` via één begrensde
> `application.findMany` (`freelancerId`+`jobId in openJobIds`, ≤200). Per nog-open item een actie-chip +
> "N wachten nog op je reactie" in de kop. Read-only, geen schemawijziging, geen extra query op de
> hoofd-fetch. Gate groen (3747).
>
> Gedaan (niet opnieuw): **Prod-rijpheid — security.txt (RFC 9116) (2026-07-10, PR #704)** — een
> machine-leesbaar meldpunt voor gecoördineerde kwetsbaarheidsmelding op `/.well-known/security.txt`,
> nodig vóór de pentest (MENSENWERK §5d) voor een platform met gevoelige documenten. Pure
> `src/lib/security-txt.ts` (`normalizeSecurityContact`/`resolveSecurityContacts`/
> `isSecurityContactConfigured`/`securityTxtExpires`/`buildSecurityTxt`, 18 tests) → route
> `src/app/.well-known/security.txt/route.ts` (`force-dynamic`, `text/plain`, Expires per request in de
> toekomst, origin via `resolvePublicOrigin`, pad met punt → buiten middleware-matcher). `SECURITY_CONTACT`
> in env-schema + `.env.example`; `/admin/systeemstatus`-item (ok bij gezet, fallback bij afgeleid
> `mailto:security@<host>` — altijd een geldig meldpunt). Geen schemawijziging, geen dependency. Gate
> groen (3738 tests). MENSENWERK §0b + §7 bijgewerkt. Rest = mensenwerk: `SECURITY_CONTACT` naar een
> bewaakte mailbox zetten vóór de pentest.
>
> Gedaan (niet opnieuw): **Bezettingsrisico-signaal voor de opdrachtgever op /opdrachten/[id] (2026-07-10, PR #701)** —
> de opdrachtgever ziet op de eigen opdracht-detail een waarschuwing zodra de **startdatum nadert terwijl er nog
> niemand is vastgelegd** (geen ACCEPTED reactie, geen niet-geannuleerde samenwerking) — het concrete "dreigt
> onbezet te starten"-risico dat `job-vacancy-performance.ts` (algemeen tempo) en `franchise/dekkingsprognose.ts`
> (tenant-breed) niet op opdracht-niveau dekken (benchmark Temper/Zorgwerk). Fasen `none`/`on_track`/`approaching`
> (≤10d, warning)/`urgent` (≤3d, danger)/`overdue` (verstreken, danger); gerichte volgende stap uit de reactie-stand
> (shortlist→reacties→bereik). Pure `src/lib/job-staffing-risk.ts` (`summarizeStaffingRisk`/`staffingRiskHeadline`/
> `staffingRiskActionLabel`, TZ-robuuste UTC-dagen, 17 tests) + presentationele `JobStaffingRiskCard` (rendert alleen
> bij `attention`) + wiring op `[id]/page.tsx` (één `groupBy` reactie-status + één `collaboration.count`, alleen
> eigenaar/PUBLISHED/startdatum). Geen schemawijziging, geen extra query op de hoofd-fetch. Gate groen.
>
> Gedaan (niet opnieuw): **Reputatie-rating (beoordelingen) op de kandidatenkaart (2026-07-09, PR #700)** —
> de opdrachtgever ziet op `/kandidaten` (beslismoment) de gemiddelde opdrachtgever-beoordeling (sterren
>
> - aantal) van een reagerende ZZP'er — hét marktplaats-vertrouwenssignaal (Temper/Malt/Upwork), dat we
>   al op het profiel hadden maar niet waar de opdrachtgever kiest. Alleen PUBLISHED CLIENT_ON_FREELANCER
>   (double-blind reveal gerespecteerd). Pure `candidate-reviews.ts` `groupCandidateRatings` (hergebruikt
>   `aggregateReviews`, kandidaat zonder beoordeling ontbreekt bewust), gebatchte `data/candidate-reviews.ts`
>   (`getReviewRatingsForCandidates`, geen N+1, `take`-begrensd), `RatingStars` in de badge-rij. 5 tests,
>   gate groen (3699). Geen schemawijziging.
>
> Gedaan (niet opnieuw): **Certificaat-verval-tijdens-opdracht signaal op /kandidaten (2026-07-09, PR #698)** —
> `computeCompliance` oordeelt op `now`; een vereist certificaat dat nu geldig is maar vóór/kort na de
> opdracht-**startdatum** verloopt, toonde als COMPLIANT terwijl de kandidaat bij aanvang niet compliant is.
> Nu een beslismoment-waarschuwing per kandidaat. Pure `src/lib/candidate-credential-expiry.ts`
> `summarizeCandidateCredentialExpiry` (`CREDENTIAL_JOB_EXPIRY_WINDOW_DAYS=30`, alleen nu-geldig-geverifieerde
> vereiste certificaten, laatst-vervallende per type, `before-start`/`soon-after-start`, 12 tests) gevoed naar
> `/kandidaten` (`expiryByApp`, zelfde `now` als live compliance; alleen getoond wanneer compliance niet al
> blokkeert). Read-only, geen extra query (startDate + expiresAt al geladen), geen schemawijziging. Gate groen (3694).
>
> Gedaan (niet opnieuw): **Prod-rijpheid — zoekmachine-indexering afgeschermd (2026-07-09, PR #697)** —
> dit login-gated platform met gevoelige documenten had geen site-brede afscherming tegen indexering
> (geen robots.txt, geen X-Robots-Tag). Nu standaard privé, env-flag om bij go-live open te zetten.
> Pure `src/lib/indexing.ts` (`isIndexingAllowed`/`robotsHeaderValue`/`buildRobotsRules`/
> `NOINDEX_DIRECTIVE`, alleen `"true"` → aan; 15 tests) gevoed naar `src/app/robots.ts` (`force-dynamic`,
> default `Disallow: /`) én een globale `X-Robots-Tag: noindex, nofollow` in `next.config.mjs`
> (defense-in-depth). `ALLOW_INDEXING` in env-schema + `.env.example`; `/admin/systeemstatus`-item
> (altijd ok, geen boot-waarschuwing — privé is de veilige default). `/robots.txt` valt buiten de
> middleware-matcher (dot in het pad) → geen login-redirect voor crawlers. Geen schemawijziging. Gate
> groen (3682 tests). MENSENWERK §0b + §7 bijgewerkt.
>
> Gedaan (niet opnieuw): **Agenda-verouderd signaal in de vindbaarheid-kaart (2026-07-09, PR #692)** —
> sluit een inconsistentie: de Vindbaarheid-kaart toonde "Beschikbaarheid gedeeld ✓ / goed vindbaar" ook bij
> een volledig verlopen agenda (alle vensters in het verleden; nog vindbaar via de scalar-fallback), terwijl
> `/acties` tegelijk "werk je beschikbaarheid bij" nudget. `freelancer-findability.ts` uitgebreid met
> `availabilityStale` → factor-`stale`-vlag + `advisory` (zachte optimalisatie-nudge náást de blokkade, alleen
> als `discoverable && hasAvailability && availabilityStale`; leeg ≠ verouderd, privé → zichtbaarheid is het gat).
> `FindabilityCard` toont klok-icoon + "Verlopen agenda" + doorklik `/beschikbaarheid`. Wiring via
> `summarizeAvailabilityFreshness(...).status==="expired"` op de reeds-geladen windows (geen extra query, geen
> schemawijziging). 5 nieuwe tests (3646), gate groen.
>
> Gedaan (niet opnieuw): **Vindbaarheid-signaal voor de ZZP'er op /profiel/bewerken (2026-07-09,
> PR #690)** — beantwoordt "kan een opdrachtgever mij vinden?" (de privé-profiel-val). Pure
> `src/lib/freelancer-findability.ts` `summarizeFindability({isPublic, hasSkills, hasAvailability})` →
> level hidden/limited/visible + eerste blokkade+doorklik (prioriteit zichtbaarheid>skills>beschikbaarheid);
> spiegelt `discoverableFreelancerWhere` (PUBLIC) + surfacing-filters (skills, beschikbaarheid zoals
> freelancer-search: venster óf scalair AVAILABLE/LIMITED). `FindabilityCard` bovenaan de profiel-editor,
> anker-ids `#zichtbaarheid`/`#vaardigheden`. `availabilityWindows` op de bestaande findUnique (geen extra
> query), read-only, geen schemawijziging. 6 tests, gate groen (3641).
>
> Gedaan (niet opnieuw): **Prod-rijpheid — uitgaande HTTP-timeouts voor externe koppelingen
> (2026-07-09, PR #689)** — hardening tegen een hangende externe endpoint (beschikbaarheid/
> resource-exhaustion). Nieuwe gedeelde `src/lib/services/fetch-timeout.ts` (`fetchWithTimeout` +
> `resolveHttpTimeoutMs` + `HttpTimeoutError`, AbortController, geklemd [1s,60s], default 10s) gewired
> in `billing/provider.ts` (Mollie+Stripe, `BILLING_HTTP_TIMEOUT_MS`), `services/mail-sender.ts`
> (Resend, `EMAIL_HTTP_TIMEOUT_MS`) en `rate-limit.ts` (Upstash, 2.5s default
> `RATE_LIMIT_HTTP_TIMEOUT_MS`, timeout **fail-opent** via bestaande catch). Voorheen had alleen de
> verifier-helper een timeout. Gedrag verder identiek, inert zonder secrets, geen schemawijziging.
> Gate groen (3635 tests). MENSENWERK §0b + §7 bijgewerkt.
>
> Gedaan (niet opnieuw): **"Samenwerking loopt af" — vervolgsignaal voor beide partijen (2026-07-09)**
> — nudge op `/samenwerkingen/[id]` die beide partijen op tijd op een naderende/verstreken einddatum van
> een lopende inzet wijst zodat ze een vervolg plannen (Temper/Pidz "verleng je serie"). Rolafhankelijke
> actie: opdrachtgever → vervolgopdracht (`/opdrachten/nieuw?from=<jobId>`), ZZP'er → `/beschikbaarheid`.
> Puur `src/lib/collaboration-renewal.ts` `summarizeCollaborationRenewal` (fase none/on_track/ending_soon/
> overdue, `RENEWAL_WINDOW_DAYS=21`, alleen ACTIVE + niet-bevroren + met einddatum, hele UTC-dagen; 11 tests)
>
> - presentationele `RenewalNudge`. `col.endDate` was al geladen (geen extra query), geen schemawijziging;
>   alleen betrokken partijen, niet bij dispuut. Seed: `endInDays` op collab-1 (10d) + Rik (14d). Gate groen.
>
> Gedaan (niet opnieuw): **Wettelijke-factuureisen-check voor de ZZP'er (2026-07-08)** — de
> factuurdetail (`/facturen/[id]`) toont de crediteur of zijn factuur voldoet aan de wettelijke
> factuureisen (art. 35a Wet OB) en wat er ontbreekt, met een gerichte fix (typisch btw-id/KvK op het
> profiel). Puur `src/lib/invoice-legal.ts` `assessInvoiceCompliance` (7 requirements met
> severity required/recommended, EXEMPT/KOR → btw-id wordt aanbeveling, `profileFixNeeded`; 9 tests);
> `InvoiceComplianceCard` (bevestiging/melding + deeplink naar profiel-bewerken + uitklapbare
> checklist), alleen voor `isFreelancerOwner`. Wiring: kvk/btw op de freelancer-select, server-side
> gevoed. Read-only, geen schemawijziging, geen extra query. Benchmark Moneybird/Tellow. Gate groen.

> Gedaan (niet opnieuw): **Werkervaring op het ZZP-profiel (2026-07-08)** — de ZZP'er toont eerdere
> rollen/opdrachten (trust/credibility zoals Malt/LinkedIn/Deel) naast de servergeverifieerde
> certificaten; puur self-reported met expliciete "niet servergeverifieerd"-disclaimer (geen
> vertrouwensinflatie). Additief `WorkExperience`-model (anker op `FreelancerProfile`, cascade); pure
> `work-experience.ts` (`workExperienceSchema`/`formatWorkPeriod`/`sortWorkExperiences`, jaar-
> granulariteit, eindjaar ≥ startjaar, `WORK_EXPERIENCE_MAX_PER_PROFILE=30`, 10 tests); acties
> `addWorkExperience`/`deleteWorkExperience` (auth→rol→ownership→Zod→cap→audit, IDOR-veilige delete);
> `WorkExperienceEditor` op `/profiel/bewerken` + Werkervaring-sectie op het publieke profiel; in de
> AVG-inzage-export; Sanne 3 demo-ervaringen. Read-only leeskant, geen extra query op het profiel.
> Gate groen (3604 tests).

> Gedaan (niet opnieuw): **Prod-rijpheid — ADMIN systeemstatus-scherm (2026-07-08)** — een ADMIN-only
> `/admin/systeemstatus` dat de productie-configuratie-posture op één scherm toont (opslag/database/
> e-mail/betalingen/verificatie-adapters/upload-scan/rate-limit-store/error-monitoring/taak-cron/
> deel-token-sleutel/webadres): per onderdeel `level` ok/fallback/attention + modus + toelichting, plus
> live databank-readiness en de boot-`envWarnings`. Beantwoordt de RUNBOOK-vraag "is productie na de
> deploy correct bekabeld?" zonder boot-logs te grepen. Pure `src/lib/system-status.ts`
> (`collectSystemStatus`/`databaseKind`, in prod telt fallback als aandacht, verifiers fail-closed →
> aandacht tenzij SEED_DEMO; geen sleutelwaarden; 17 tests) + `readEnv()` in `env.ts` +
> `SystemStatusPanel` + nav-item (icon `activity`) onder Beheer. Read-only, geen schemawijziging, geen
> dependency. Gate groen (3594 tests). MENSENWERK §11 bijgewerkt.

> Gedaan (niet opnieuw): **Standaard-motivatie / sneller reageren voor de ZZP'er (2026-07-08)** — de
> ZZP'er bewaart één keer een standaardtekst op zijn profiel die het motivatieveld op het
> reageerformulier (`/opdrachten/[id]`) automatisch voorinvult (met hint "pas 'm aan voor deze
> opdracht"). Reduceert de frictie van bij elke opdracht vanaf nul typen (benchmark: proposal-templates/
> quick-apply bij Malt/Upwork/Temper); de ingezonden motivatie blijft server-side de waarheid. Additief
> `FreelancerProfile.defaultMotivation`; pure `application-template.ts` (`normalizeDefaultMotivation`/
> `hasDefaultMotivation`/`resolveMotivationDraft`/`DEFAULT_MOTIVATION_MAX`, 7 tests); gewired in
> profiel-bewerken (+ Actiecentrum-drawer) en het reageerformulier; valt onder de bestaande inzage-export.
> Seed: Sanne demo-standaardtekst. Read-only leeskant, geen extra query. Gate groen.

> Gedaan (niet opnieuw): **"Eerder samengewerkt"-signaal op /kandidaten (2026-07-08)** — de opdrachtgever
> ziet bij het beoordelen van reacties nu of hij al eerder een samenwerking met déze ZZP'er heeft afgerond
> (chip "Eerder samengewerkt" + telling + laatste afronddatum in de tooltip). Sterk, laag-risico
> vertrouwenssignaal (Malt/LinkedIn "worked together before"). Puur `candidate-history.ts`
> (`summarizeSharedHistory`/`sharedHistoryLabel`, 10 tests, alleen COMPLETED, `completedAt ?? createdAt`);
> gebatchte per-opdrachtgever fetcher `data/candidate-history.ts` (`company.userId`-scope, geen N+1, geen
> PROPOSED/ACTIVE); `CandidateHistoryBadge` + `formatMonthYearNl`; gevouwen in de bestaande `Promise.all`.
> Read-only, geen schemawijziging. Demo via Sanne (collab-1/job-4 afgerond + app-1/job-1 open bij Jansen).

> Gedaan (niet opnieuw): **Constructieve afwijzingsreden voor de ZZP'er (2026-07-08)** — de opdrachtgever
> geeft bij het afwijzen van een reactie optioneel een gestructureerde reden mee (6 codes); de ZZP'er ziet
> die als respectvolle, constructieve feedback op `/reacties` i.p.v. een black-box afwijzing (noord-ster:
> verklaarbaarheid; beter dan Temper/Pidz). Additief `Application.rejectionReason`; pure `rejection-reason.ts`
> (`REJECTION_REASONS`/`optionalRejectionReasonSchema`/`rejectionReasonFeedback`/`buildRejectionNotificationBody`,
> 24 tests); `changeApplicationStatus` leest+persisteert de reden (safeParse, geen 500) en wist 'm bij een
> teruggedraaide afwijzing; nieuwe `RejectApplicationDialog` met reden-select; feedback op `/reacties`; Peter
> (app-8) demo-reden. Geen extra query, server-side waarheid. Gate groen (3542 tests).

> Gedaan (niet opnieuw): **Uitgaven-/onkostentracker voor de ZZP'er (2026-07-07)** — de ZZP'er legt
> aftrekbare zakelijke kosten vast die in het grootboek boeken (KOSTEN + BTW-voorbelasting), zodat
> winst/IB-schatting/reservering/BTW op nettowinst i.p.v. bruto-omzet worden berekend. Additief
> `Expense`-model + `AdministrationEntry.expenseId` (cascade); pure `expense.ts`
> (`planExpensePostings`/`summarizeExpenses`/`parseEurosToCents`/`expenseSchema`, 27 tests);
> acties `createExpense`/`deleteExpense` (auth→rol→ownership→Zod→transactie→audit, 10 tests);
> "Uitgaven"-tab in de administratie-hub (`/financien?tab=uitgaven`) + link vanuit Ontzorgd; Sanne
> demo-uitgaven. Sluit het grootste ontzorg-gat t.o.v. Moneybird/Tellow/Bendy. Gate groen.

> Gedaan (niet opnieuw): **Inkomstendoel (maanddoel) voor de ZZP'er (2026-07-07)** — zelfgekozen
> maanddoel op `/prognose` met voortgang (gefactureerd deze maand + nog te versturen concepten t.o.v.
> doel). Additief `FreelancerProfile.monthlyIncomeGoalCents`; pure `income-goal.ts`
> (`summarizeIncomeGoal`/`incomeGoalHeadline`, status none/achieved/on_track/behind); data
> `getRealizedRevenueThisMonthCents` (TZ-robuust, op `issuedAt`, non-DRAFT); server-action
> `setMonthlyIncomeGoal` (auth→rol→ownership→Zod→update→audit `INCOME_GOAL_SET/CLEARED`);
> `IncomeGoalCard` met instel-/wijzig-/wis-formulier; Sanne demo-doel € 6.000. 18 tests, gate groen.

> Gedaan (niet opnieuw): **Prod-rijpheid — Stripe billing-adapter (PR "prod: Stripe
> billing-adapter")** — tweede echte betaalprovider achter de bestaande `PaymentProvider`-seam
> (`src/lib/billing/provider.ts`), naast Mollie. `StripePaymentProvider`: `startCheckout` maakt een
> Stripe Checkout Session (`POST /v1/checkout/sessions`, metadata userId+planKey) en geeft de
> hosted-checkout-URL terug; `paymentStatus` haalt de sessie gezaghebbend op en normaliseert de
> status. Geen extra SDK-dependency (praat via HTTPS met `api.stripe.com`). Webhook-route
> (`src/app/api/billing/webhook/route.ts`) delegeert referentie-extractie nu aan de actieve
> provider via `resolveWebhookRef(rawBody, headers)`; Stripe verifieert de handtekening
> (`Stripe-Signature`, HMAC-SHA256, replay-tolerantie 300s, `src/lib/billing/stripe-signature.ts`)
> vóór verwerking, Mollie-gedrag ongewijzigd. Env-validatie eist `STRIPE_API_KEY` +
> `STRIPE_WEBHOOK_SECRET` zodra `BILLING_PROVIDER=stripe` (halve activering = boot-fout); inert
> zonder secrets. Activeren via `BILLING_PROVIDER=stripe`. Rest = mensenwerk (MENSENWERK.md §3/§7):
> Stripe-account + KYC, secrets zetten, webhook-endpoint aanmaken in het Stripe-dashboard.

> Gedaan (niet opnieuw): **BTW-aangifte-deadline-signaal op de boekhouding (PR #664)** — het
> boekhoudpaneel toonde BTW per kwartaal (bedragen) maar niet de uiterste indienings-/betaaldatum. Nu
> een deadline-kaart bovenaan `/financien` → Boekhouding: eerstvolgende aangiftekwartaal, NL-deadline
> (einde maand ná het kwartaal), aftelling + urgentiebadge (Op schema/Binnenkort/Verstreken) en het
> saldo. Pure `administration/vat-deadline.ts` (`previousQuarter`/`vatFilingDeadline`/
> `summarizeVatDeadline`, hergebruikt `vatReturn`; 9 tests) + presentationele `VatDeadlineCard`.
> Read-only, geen schemawijziging, geen extra query, `now` geïnjecteerd.

> Gedaan (niet opnieuw): **Betaalreputatie-spiegel voor de opdrachtgever (PR #632)** — de
> opdrachtgever ziet nu op `/verplichtingen` de betaalreputatie die ZZP'ers over hem zien
> (`computePaymentBehavior`: gemiddelde betaaltijd, % op tijd, toon), als zelfverbeter-nudge ("op tijd
> betalen trekt sneller vakmensen aan"). Sluit de spiegel-asymmetrie: het signaal was tot nu toe alléén
> zichtbaar voor ZZP'ers (opdracht-detailpagina). Pure `lib/client-payment-reputation.ts`
> `summarizePaymentReputation` (kop + tip per toon, 4 tests) + `getOwnPaymentBehaviorForClient` (eigen
> Company → hergebruikt `getPaymentBehaviorForCompany`) + `PaymentReputationCard` boven het
> verplichtingen-paneel. Server-side, geen schemawijziging, geen factuurdata van anderen.

> Gedaan (niet opnieuw): **Prod-rijpheid — malware-scan van uploads** (PR "prod: upload
> malware-scanning seam") — pluggbare `UploadScanner`-seam (`src/lib/services/upload-scanner.ts`,
> zelfde patroon als StorageDriver/MailSender/RateLimitStore): `NoopUploadScanner` (default) +
> `ClamAvUploadScanner` achter `UPLOAD_SCANNER=clamav` (rauw clamd INSTREAM-protocol via `node:net`,
> geen extra dependency, `CLAMAV_HOST`/`CLAMAV_PORT`). `assertUploadClean` gewired vóór `storage.put`
> in de documenten- én certificaten-upload-actions, na `assertContentMatchesMime`. **Fail-closed** bij
> onbereikbare scanner (`UPLOAD_SCAN_FAIL_OPEN=true` schakelt bewust door tijdens storing). Env-
> validatie: `CLAMAV_HOST` harde boot-eis bij `clamav`, niet-fatale prod-waarschuwing op `noop`.
> 24 nieuwe tests + env-tests uitgebreid, geen schemawijziging. Rest = mensenwerk (MENSENWERK.md
> §0b/§7): clamd-daemon draaien + secrets zetten.

> Gedaan (niet opnieuw): **Directe uitnodiging — opdrachtgever nodigt passende ZZP'er uit voor een
> opdracht (PR #625)** — vanaf de "Geschikte ZZP'ers"-sectie op `/opdrachten/[id]` nodigt de eigenaar
> met één klik een gescoorde, openbare, nog-niet-reagerende ZZP'er uit; de ZZP'er krijgt een
> `JOB_INVITE`-notificatie met deeplink en kan direct reageren. Pure `lib/job-invite.ts`
> (`assessInviteEligibility` + `buildJobInviteNotification`, 8 tests); server-action
> `inviteFreelancerToJob` (auth→rol CLIENT→ownership→eligibility→Notification+`JOB_INVITED`-audit,
> idempotent via het auditrecord, soft-return bij races, 6 action-tests); "Uitgenodigd"-badge voor
> reeds-uitgenodigde ZZP'ers. Geen schemawijziging (Notification + audit, zoals flexpool-routing).
> Vertaalt de auto-uitnodiging-liquiditeit van Temper/Pidz naar onze verklaarbare matching; vult het
> gat naast de publicatie-flexpool (`pool-routing.ts`, alleen eigen poule).

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
1. ~~Playwright e2e voor de cascade-flow~~ **GEDAAN (10-8-2026, lokale sessie):** volledige suite
   groen incl. cascade-flow; lifecycle-quarantaine opgeheven. Zie PROGRESS.md-top.
2. ~~Postgres-smoke van het migratiescript~~ **GEDAAN (10-8-2026):** dry-run + live + idempotente
   rerun op Postgres 16 geslaagd.
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
3. **Geparkeerde eigenaar-beslissingen uit kwaliteitsronde 2 (7-7-2026)** — pas oppakken na
   expliciet akkoord van de eigenaar:
   - **Financiën-consolidatie**: bedragen staan op 5 plekken (dashboard-tegel, Administratie 2×,
     Inzicht, nieuwe kaarten). Voorstel: Administratie = enige bron (per-leverancier +
     betaalreputatie als tabs), dashboard/Inzicht alleen doorklik-samenvattingen. Herontwerp.
   - **Toezicht-tab "Integraties & security"**: Stripe-webhooks/malware-scans/CSP-meldingen zijn
     voor de admin onzichtbaar; plus een "Platformwijzigingen"-feed (wat bouwde de automatisering
     vannacht). Nieuwe feature.
   - **AVG: notificatie-bodies bij erasure**: bedrijfsnaam blijft in oude notificaties van
     ontvangers staan na anonimisering (MIDDEL; scoping-risico — zelfde aanpak als de
     auditlog-scrub nodig).
   - **Actie-engine-consolidatie**: `adminNextActions`/`franchiserNextActions` (next-actions.ts,
     aggregaat) en `pendingTasks()` (actions/pending-tasks.ts, gerenderd) zijn twee parallelle
     engines — #567 voedde maandenlang de dode. Samenvoegen tot één bron.
   - **i18n-beleidsafwijking**: routines voegen nog steeds EN-vertalingen toe aan
     src/lib/i18n/messages.ts terwijl het i18n-spoor per instructie is afgesloten — routine-prompt
     aanscherpen óf het beleid herzien.
   - **Ontwerp-lab archiveren**: 152 concepten (6,8 MB) staan nog in src/ (build is al gefixt
     via #653); verplaatsen naar design-archive/ buiten de app of een cap per reeks.
   - **Invite-dedup + Stripe-event-idempotentie** (LAAG): audit-metadata-string-match →
     DomainEvent.dedupeKey; Stripe event-id expliciet vastleggen.
4. **Perf-refactors uit de kwaliteitsronde 2-7 (RISKY, apart oppakken):**
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
