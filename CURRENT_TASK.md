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
