## 6 oktober — aankomende plaatsing-starts in de bemiddelaar-agenda (#1571)

Bemiddelaar-agenda (`/franchise/agenda`, `.ics`) kreeg start-events van aankomende, reeds overeengekomen plaatsings (ACTIVE, niet-betwist, tenant-gescoopt, `startDate >= now`) met 7/1-dag-alarm — parity met het persoonlijke start-event (#1559), gescheiden bestanden. 8 gerichte mappertests groen; typecheck/lint/format, volledige suite en build groen. Review en CI volgen. [Scope](docs/progress/2026-10-06-broker-agenda-placement-starts.md).

## 30 september — ingestelde DBA-drempels in beheeroverzicht (#1539)

Eén configuratielezing voedt SQL-filter/telling en rijbadges. Zes regressies rood vóór herstel; echte SQLite-dekking voor lagere/hogere, gelijke en oude omgekeerde grenzen, kalendergrenzen, vlaggen en paginering. 16 gerichte en 9.244 volledige tests groen (3 bestaande skips); lint/types/format en productiebuild groen. Onafhankelijke review en CI volgen. [Scope](docs/progress/2026-09-30-admin-dba-thresholds.md).

## 30 september — DBA-drempels in samenwerkingslijst (#1538)

Eén configuratielezing na auth voedt alle actieve lijstbeoordelingen; 24 paginagevallen, 59 gerichte en 9.233 volledige tests groen (3 bestaande skips). Lint, types, format en productiebuild groen; review en CI volgen. [Scope](docs/progress/2026-09-30-dba-list-thresholds.md).

## 30 september — ingestelde DBA-drempels in dossierexport (#1537)

De geautoriseerde export gebruikt nu opgeslagen drempels voor beoordeling en duurindicator. Zeven routeregressies: vier rood vóór herstel, alle groen erna; 68 gerichte en 9.209 volledige tests groen (3 bestaande skips). Lint, types, format en productiebuild groen; onafhankelijke review en CI volgen. [Scope en bewijs](docs/progress/2026-09-30-dba-export-thresholds.md).

## 30 september — ingestelde DBA-drempels op samenwerkingsdetail (#1535)

De detailpagina gebruikte vaste 6/12-maandsgrenzen terwijl monitor en overzicht
opgeslagen beheerdersinstellingen volgen. Eén serverlezing voedt nu beoordeling
en vooruitblik na de bestaande toegangscontrole. Vier paginaregressies en 9.195
volledige tests groen (3 bestaande skips). Onafhankelijke review en CI volgen.
[Scope](docs/progress/2026-09-30-dba-detail-thresholds.md).

## 30 september — productie-audit dependencyherstel (#1536)

De verplichte audit blokkeerde op Nodemailer en brace-expansion. Gericht gepatcht:
Nodemailer 10.0.13 en bestaande brace-expansion-kopieën binnen hun majorversie.
Echte ESM/CommonJS-import en offline berichtopbouw plus mailtests groen (65 tests);
productie-audit nul kwetsbaarheden. Mailkanalen en auditbeleid ongewijzigd.
Volledige validatie en onafhankelijke review volgen. [Scope](docs/progress/2026-09-30-production-audit.md).

## 29 september — bereikbare urenstaat-indienherinneringen (#1534)

Duizend stille actieve samenwerkingen hielden een latere herinnering buiten de
runner. Echte SQLite-grensproef onafhankelijk bevestigd. Stabiele id-pagina’s
behouden selectie, laatste urenanker, open-prestatieonderdrukking en deduplicatie.
Vijftien gerichte en 9.191 volledige tests groen (3 skips); types, lint, format en
productiebuild groen. Onafhankelijke review volgt. [Scope](docs/progress/2026-09-29-submission-reminder-window.md).

## 29 september — bereikbare dispuutherinneringen (#1533)

Vijfhonderd oude, reeds geëscaleerde open disputen hielden nieuwe partijmeldingen
buiten de runner. Echte SQLite-proef rood bij 500, controle groen bij 499;
onafhankelijk herhaald. Stabiele disputedAt/id-pagina’s behouden planner,
ontvangers, deduplicatie en transacties. Zeven SQLite-regressies en 33 gerichte
tests groen; volledige suite 9.187 groen (3 bestaande skips), types en lint
geslaagd. Productiebuild en formatcontrole groen. Onafhankelijke review,
GitHub-poorten en release volgen.
[Scope](docs/progress/2026-09-29-dispute-reminder-window.md).

## 29 september — bereikbare certificaatherinneringen (#1531)

Tweeduizend reeds herinnerde, nog geldige certificaten hielden een nieuwe melding
buiten de runnerquery. Echte SQLite-proef rood bij 2.000, controle groen bij 1.999;
onafhankelijk bevestigd. Stabiele vervaltijd/id-pagina’s met atomaire effecten per
pagina behouden de bestaande dekking, deduplicatie en statusbewaking. Zes echte
SQLite-gevallen en 51 gerichte tests groen; volledige suite 9.171 groen (3 bestaande
skips). Lint, types, formatcontrole en netwerkbuild geslaagd; onafhankelijke review
en release volgen.
[Scope](docs/progress/2026-09-29-credential-reminder-window.md).

## 29 september — bereikbare factuurherinneringen (#1530)

Vijfhonderd oude, reeds geëscaleerde facturen blokkeerden een nieuwe dag-3-herinnering.
Afzonderlijke echte SQLite-proef rood bij 500, controle groen bij 499; onafhankelijk
bevestigd. De factuur-runner doorloopt nu begrensde batches met stabiele tijd/id-volgorde.
Acht SQLite-gevallen en 26 gerichte tests groen; volledige suite 9.165 groen
(3 bestaande skips). Lint, types, volledige formatcontrole en productiebuild geslaagd.
Onafhankelijke review en release volgen. [Scope](docs/progress/2026-09-29-invoice-reminder-window.md).

## 28 september — bereikbare prestatieherinneringen (#1529)

Vijfhonderd oude, reeds geëscaleerde urenstaten hielden een nieuwe dag-3-herinnering
buiten de query. Echte SQLite-proef rood bij 500, controle groen bij 499.
De runner doorloopt nu begrensde batches met stabiele tijd/id-volgorde; planner,
deduplicatie en transacties blijven behouden. Vijf SQLite-gevallen en 21 gerichte
tests groen; volledige suite 9.157 groen (3 bestaande skips). Lint, types, volledige
formatcontrole en productiebuild geslaagd. Onafhankelijke review en release volgen. [Scope](docs/progress/2026-09-28-performance-reminder-window.md).

## 28 september — corrigeerbare dienstpreview (#1527)

Een verkeerd eindmaandveld liet de urenformulier-preview crashen. De gedeelde
duurgrens wordt nu vóór segmentatie gecontroleerd met een herstelbare melding;
invoer blijft staan en ongeldige rijen leveren geen gedeeltelijk/vervangend totaal.
Vier regressies rood vóór herstel; zeven rendergevallen groen in Amsterdam en
UTC, 154 gerichte tests groen. Lint/types/format en 9.152 tests groen (3 skips).
Productiebuild geslaagd; onafhankelijke reviews en GitHub-checks volgen.
[Scope](docs/progress/2026-09-28-shift-preview-limit.md).

## 27 september — buildbetrouwbaarheid Cormorant (#1526)

De bestaande Cormorant-loader veroorzaakt herhaalde buildfouten vóór browsertests.
Exacte bestaande fontbestanden en CSS-gedrag zijn lokaal gebundeld; overige fonts
en ontwerpen behouden. Gerichte tests en geïsoleerde compilatie zonder netwerk
groen; lint/types/format, 9.145 tests (3 skips) en productiebuild geslaagd.
Onafhankelijke reviews en GitHub-checks volgen.
[Scope](docs/progress/2026-09-27-local-cormorant.md).

## 27 september — certificaatherinnering rond klokwissel (#1525)

De runner selecteerde in de lente 719 uur terwijl de planner 720 uur beoordeelt.
Exacte tijdsduur gebouwd; tien zonegevallen in bestaande taakharness, twee rood
vóór herstel en 32 gerichte tests groen in Amsterdam en UTC. Lint/types/format en
9.137 tests groen (3 skips); netwerkbuild geslaagd. Reviews en CI volgen. [Scope](docs/progress/2026-09-27-expiry-runner-window.md).

## 27 september — exact bijna-verloopvenster (#1524)

Een fractionele dag buiten het 30-daagse venster gaf alleen de opdrachtgever een
te vroege certificaatwaarschuwing. Exacte tijdvergelijking gebouwd; 13 regressies,
123 gerichte en 9.127 volledige tests groen (3 skips), lint/types/format geslaagd.
Netwerkbuild geslaagd; onafhankelijke review en CI volgen. [Scope](docs/progress/2026-09-27-exact-expiry-window.md).

## 27 september — gelijke certificaat-eindgrens (#1523)

Bij verval exact op opdracht-einde kreeg alleen de zelfstandige een vernieuwingstaak.
Echte helper-/taak-/dossierproef bevestigt de tegenstelling. Herstel van de oorspronkelijke
strikte eindgrens gebouwd; 88 gerichte tests en 9.114 tests groen (3 skips).
Lint, types, format en netwerkbuild geslaagd; reviews en CI volgen.
[Scope](docs/progress/2026-09-27-placement-end-boundary.md).

## 27 september — verloop tijdens opdracht (#1522)

Echte paginarenders tonen voor zelfstandige en opdrachtgever een lege beoordelingsmelding
wanneer een geverifieerde VOG pas tijdens de opdracht verloopt. Twee regressies rood,
zes controles groen op main. Tekstcorrectie gebouwd; 12 rolrenders en 9.102 tests groen
(3 skips), lint/types/format en netwerkbuild geslaagd. Reviews en CI volgen. [Scope](docs/progress/2026-09-27-placement-expiry-copy.md).

## 24 september — opdrachtgever-certificaatvenster (#1520)

Dashboard en actieloader delen de bestaande begrensde selectie; echte SQLite-paginaproef
bewijst de verdwenen melding achter 200 inzetten zonder certificaateis. 36 gerichte
tests slagen; volledige suite 9.090 groen (3 skips), lint/types/format en netwerkbuild groen.
Onafhankelijke review, CI en release volgen.

# CURRENT_TASK.md — Huidige taak

Security 23 september 14:00 UTC: #1516 herstelt lopende uploads na anonimisering; [scope](docs/progress/2026-09-23-late-upload-erasure.md).
Bouwronde 17 september 16:22 UTC: #1514 bewaakt het gelijke certificaatvenster; [scope](docs/progress/2026-09-17-expiry-window-parity.md).
Security 17 september 14:00 UTC: #1513 bewaakt actuele conceptprestatievoorwaarden;
[repro en scope](docs/progress/2026-09-17-draft-performance-current-state.md).

Bouwronde 17 september 12:22 UTC: #1512 bewaart bijna-verloopmeldingen na vervangen
certificaten; [repro en scope](docs/progress/2026-09-17-upcoming-roster-history.md).

Bouwronde 17 september 08:22 UTC: #1511 bewaart verlopen dossiermeldingen na gedekte
historie; [repro en scope](docs/progress/2026-09-17-expired-roster-history.md).

Persona 17 september 05:00 UTC: #1508 laat losse factuurknoppen de dispuutstatus
volgen; [renderbewijs en scope](docs/progress/2026-09-17-disputed-invoice-controls.md).

Bouwronde 17 september 04:22 UTC: #1507 dekt downloadweigering na
bewijsverwijdering; [routeproeven en grenzen](docs/progress/2026-09-17-erased-signing-downloads.md).

Security 17 september 02:00 UTC: #1506 bewaakt actuele dispuut-/partijvoorwaarden
bij losse factuurstatuswrites; [repro en scope](docs/progress/2026-09-17-legacy-invoice-dispute-race.md).

Routine 17 september 00:22 UTC: #1505 controleert verificatie aanvragen na één klik;
[scope en bewijs](docs/progress/2026-09-17-credential-submit-once.md).

Routine 16 september 16:22 UTC: #1504 controleert goedkeuring na één gewone klik;
[scope en bewijs](docs/progress/2026-09-16-verification-single-submit.md).

Routine 16 september 12:22 UTC: #1503 herstelt oudere rijen in het beheeroverzicht;
[bron, bewijs en status](docs/progress/2026-09-16-admin-collaboration-window.md).

Eerdere eigenaar- en releasecontext blijft bewaard in [het contextarchief](docs/progress/2026-09-17-context-archive.md).

> Eén taak tegelijk. Lees CLAUDE.md, de bovenste 100 regels van PROGRESS.md en
> `ARCHITECTURE.md §Modulekaart` voordat je begint. Werk dit bestand bij wanneer je naar de
> volgende taak gaat. **Doel: ≤ 300 regels** — afgeronde fase-verslagen, cutover-checklists en de
> "Gedaan (niet opnieuw)"-historie staan in
> [`docs/progress/current-task-archive-2026-08.md`](docs/progress/current-task-archive-2026-08.md).
> Grep daar vóór je iets bouwt dat al eens gebouwd kan zijn.

## HANDOFF — operationele stand (lees dit eerst)

- **Accountrelease live (7-9):** PR #1418 alle CI-poorten groen, gemerged; health/readiness 200
  op commit `34f658e`. Demo-fase blijft actief; dit bewijst nog geen productiegeschiktheid.

- **Backupreparatie 7-9, nog te publiceren/bewijzen:** remote backupcommando en aparte pg18-image
  hersteld; exacte heartbeatroute bereikt de eigen CRON_SECRET-guard. Geen retentie-snoei.
  Configureer alleen database-backup naar `/railway.backup.json` en dezelfde Postgres-uro6 als de
  app (de job wees naar Postgres). Controleer na CI/merge job, object-readback, heartbeat en
  scratch-herstel; een geslaagde object-roundtrip bewijst nog geen databaseherstel. Zie RUNBOOK §5.
- **Live:** `main` is de bron van waarheid **én** de deploy-branch; Railway bouwt/deployt elke
  merge automatisch (Dockerfile → PostgreSQL). Test-URL
  `zzp-platform-production-ba07.up.railway.app`. Demo-accounts (wachtwoord `demo1234`):
  `opdrachtgever@`, `zzp@` (Sanne), `admin@zzp-platform.local`.
- **Boot:** `scripts/start.mjs` draait preflight → `prisma migrate deploy` (zelf-baselinend; eenmalige
  transitie db push → resolve → deploy, zie RUNBOOK §8) → idempotente seed (alleen bij `SEED_DEMO=true`;
  destructieve reset alleen met `SEED_DEMO_RESET=true`). Geen `db push` meer in productie. Schemawijziging
  = migratie in `prisma/migrations/` (CI-job `migrations` bewaakt drift).
- **Workflow:** korte branch (`feat/`, `fix/`, `docs/`) → **PR naar `main`** → **6 vereiste
  statuschecks** (`check`, `e2e`, `audit`, `secret-scan`, `CodeQL`, `agent-review`) groen →
  `gh pr merge <nr> --squash --auto`. `enforce_admins` staat AAN; niets omzeilt de poort. Altijd
  `git fetch` + rebase vóór commit én push. Bij docs-conflicten: **UNION**, nooit `--ours`.
- **Routines overgenomen door Codex (11-9):** vijf Claude-schema's en hun instructies/historie
  rechtstreeks gelezen en gepauzeerd. Actieve Codex-coördinator: bouwen elke vier uur,
  persona/security/productierijpheid elk tweemaal per dag, ochtendbriefing om 08:00
  Europe/Amsterdam. Exacte UTC-schema's, overdracht en prompts staan in
  [`docs/CODEX-ROUTINE-TAKEOVER.md`](docs/CODEX-ROUTINE-TAKEOVER.md) en `docs/codex/`.
  Iedere twintig minuten controleert de lokale coördinator verschuldigde rondes;
  eerste volledige geplande runs moeten nog worden bevestigd. Bouwruns starten geïsoleerd
  vanaf `origin/main`, met PR en alle zes poorten. De ochtendbriefing blijft uitsluitend
  lezen en rapporteren. Oude GitHub-bouwers blijven uit.
  Bij de eerste overnamecontrole ontbrak `OPENAI_API_KEY`; op 11 september is dit na
  expliciete gebruikersbevestiging toegevoegd als repositorysecret.
  De Restricted-reviewsleutel heeft alleen List models: Read en Responses: Write en
  vervalt op 11 oktober 2026. **Historie:**
  [Proefrun 34575468042](https://github.com/cartonn/ZZP-Platform/actions/runs/34575468042)
  op #1475 head `8be0b39` bevestigde een quotablokkade: Action-start en sleutelcontrole slagen, OpenAI
  meldt geen resterende credits; eindvalidator INCOMPLETE, geen inhoudelijke review.
  Op #1474 head `fb4938b` en #1475 head `8be0b39` zijn alle normale CI-checks groen,
  inclusief e2e; alleen `agent-review` ontbreekt of faalt. Dit is een momentopname op
  de genoemde SHA's. **Vervolg 11 september:** de eigenaar heeft tegoed toegevoegd;
  beschikbaarheid is via de interface geverifieerd.
  [Reviewrun 34576381918](https://github.com/cartonn/ZZP-Platform/actions/runs/34576381918)
  is gestart op #1475 head `5acadf8`. De modeluitvoer geeft BLOCK op PR-headgestuurde
  reviewcontroles; de Action was na die uitvoer nog niet afgesloten. De integratie
  krijgt een vertrouwde workflow, afzonderlijke publisher en bevroren bootstrapbasis.
  De latere run `34581684896` toonde PASS-tekst maar eindigde door de vastgelopen
  officiële uitvoerder als INCOMPLETE met een leeg rapport. De modeljob wordt daarom
  vervangen door directe Responses API-aanroepen met uitsluitend bronleesfuncties;
  de beschermde reviewpoort blijft intact.
  Herbeoordeling en geplande uitvoering zijn apart te verifiëren: lees de actuele GitHub-run/check en het
  duurzame runregister. Herhaal een nieuwe quotafout niet zonder bevestigde wijziging;
  meld sleutelverval vanaf zeven dagen vooraf. Publiceer geen saldo of account-/billingdetails.
  Zie `.github/codex/README.md`.
  Geen review of merge als geslaagd melden zolang de verplichte check niet groen is.
  Linear wordt niet gebruikt.
- **Scope-restrictie routines (2-9-2026):** alleen kern + robuustheid/security/bugs. Ontzorgd/
  aangifte/KOR/fiscale uitbreidingen, academie, ideeën, design-lab, nieuwe rollen, nieuwe
  prijslijnen en i18n zijn **uitgesloten**. Zie `docs/ROUTINE-PROMPT.md` en CLAUDE.md.
- **Uit / niet operationeel (bewust, env-gestuurd):** billing (`BILLING_PROVIDER=noop`), e-mail
  (`EMAIL_DRIVER=noop`), echte verificatie-koppelingen
  (`DIPLOMA_VERIFIER`/`BIG_VERIFIER`/`IDENTITY_VERIFIER` = `mock`), aangifte-partner
  (`TAX_PARTNER_DRIVER` inert). Elke koppeling heeft een zelftest + aflever-heartbeat op
  `/admin/systeemstatus`. Rate-limit-store draait op Redis (`RATE_LIMIT_STORE=redis`, Railway-Redis).
  Live opslag is S3; private put/get/delete-selftest en ClamAV-detectietest slagen. VAPID is ingesteld.
  De opslagprovider echoot geen per-object SSE-header; de encryptie-zelftest valt nu terug op
  bucket-default-encryptie-bewijs (`GetBucketEncryption`, #1426). Resterend: zet default-encryptie op
  de bucket aan (AWS S3: sinds jan-2023 verplicht aan), dan haalt de strikte productiecontrole groen.
- **Productie-bewaking:** `/api/health` geeft `commit` + `builtAt`; `monitor.yml` vergelijkt elke 10 min
  met `origin/main` en opent een issue met label `deploy-lag` bij achterstand. Les 12-8 t/m 2-9: drie
  weken geen geslaagde deploy zonder dat iemand het zag. Observability-bundle compleet (6-9):
  `/api/metrics` (gauges) + `alerts.yml`/`prometheus.yml`/`alertmanager.yml` + `grafana-dashboard.json`
  (import-klaar, gegenereerd door `scripts/grafana-dashboard.mjs`, drift-gated). Zie RUNBOOK §2a.
- **Vóór échte productie (mensenwerk, zie MENSENWERK.md §0):** juridisch/AVG-review (blokkeert
  livegang met echte gevoelige documenten), productie-secrets, betalingen, echte verificatie-API's,
  e-mail, S3, eigen domein. Het juridische pakket staat als **concept v1.0**
  (`/voorwaarden`, `/privacy`, `/cookies` + `docs/legal/`, incl. `REVIEW-DOOR-JURIST.md` met 9
  open toetspunten); de externe jurist-review zelf blijft mensenwerk.

---

## Launch review — 7 september 2026

[Besluit, live-configuratie en pilotvolgorde](docs/LAUNCH-REVIEW-2026-09-07.md).
De actuele Railway-configuratie is leidend boven de oudere handoff: documentopslag staat op S3,
releasefase op demo en demo-seeding aan; e-maildriver is niet ingesteld. Eerst de
accountbeveiligingsfixes door de CI-poort en de operationele productiestappen bewijzen.

Publieke marketing is feitelijk gemaakt; demo-seeding onderdrukt vertrouwenscijfers. De copyfix
staat klaar voor PR/CI; definitieve livecontrole volgt na de deploy.

## NU — bouwprogramma 2/3-9 afgerond (24 PR's, zie PROGRESS.md bovenaan)

Golf 1 (A–F), golf 2 (G, I, M, N, O, Q) en golf 3 (T, U, V, W) zijn gemerged; #1340 (route-dedup) en
#1353 (reactielimiet per maand) staan in de poort. Productie loopt gelijk met `main`. Volgende
increments komen uit de backlog hieronder; **niet dubbel bouwen** — check `gh pr list` eerst.

**5-9:** issue #329 (hangende action-respons in productie) bij de wortel gefixt — React-backport via
`patches/next+15.5.24.patch` + regressietests (zie PROGRESS.md bovenaan, ADR 0012); vervolg staat bij
punt 5 hieronder.

### Open uit het programma (hoogste waarde eerst)

1. **Signaal-snapshot per gebruiker** via de bestaande event-bus (handlers werken per-rol tellers bij,
   reconciliatie-taak als vangnet) zodat de app-shell met één query toe kan (nu 44/41/18/46 per rol; de
   losse vensters in `signals.ts`/`pending-tasks.ts` bestaan bewust — zie de commentaren bij runs 79/82,
   #1022, #1026 — dus niet "samenvoegen" maar vervangen door een snapshot).
2. **Factuur-cutover:** `Invoice.status` afleiden uit `lifecycleStatus`, legacy-takken uit
   `signals.ts`/`pending-tasks.ts` weg; `Account`/`Session`/`VerificationToken`/`CredentialVerification`/
   `VerificationRequest` droppen (0 referenties).
3. **Verrijkte routes naar hun hub-tab** — `/admin/audit` GEDAAN (CSV-export + telling in `AuditPanel`,
   route leidt nu permanent om naar `/admin/toezicht?tab=audit`). Rest: `/prognose` en `/verplichtingen`
   zijn FREELANCER-pagina's (geen admin-hub-tab); alleen oppakken als er een passende hub-tab voor komt.
4. `notFound()` onder een `loading.tsx` geeft HTTP 200 — GEDAAN (6-9, #1400): de maskerende loading-grenzen
   verwijderd/gescoopt naar `(index)`-route-groups voor de zes getroffen routes (4× `/franchise/*/[id]`,
   `certificaten/[id]/bewerken`, `kandidaten/vergelijk`); drift-vaste test `notfound-loading-masking.test.ts`.
5. **React-transitie commit niet na een server action (productiebuild)** — GEDAAN (5-9): wortel gevonden
   én gefixt via de React-backport `patches/next+15.5.24.patch` (ADR 0012); de nudge-workaround
   `action-replay.tsx` uit #1377 is verwijderd. Rest: de `clickUntilGone`/`window.stop()`-omwegen uit
   `e2e/_robust.ts` halen (~20 specs, één voor één op een productiebuild groen houden) en de 5 s-watchdog
   in `PendingSubmitButton` laten vervallen. Zie issue #329.
6. Rooster-begrip scherp definiëren (dashboard-weekstrip, /rooster, samenwerking-looptijd) — review-bevinding.

Oudere notities: [2026-09-29-current_task-archive.md](docs/progress/2026-09-29-current_task-archive.md).
