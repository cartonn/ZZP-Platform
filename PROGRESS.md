# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## Staat van het product (2-9-2026)

- **Live:** `main` is bron van waarheid én deploy-branch; Railway deployt elke gemergde PR. Poort: 6 vereiste checks + `migrations`-driftcheck, `enforce_admins` AAN. Boot draait `prisma migrate deploy` (geen `db push` meer in productie); `monitor.yml` bewaakt deploy-lag (issue-label `deploy-lag`).
- **Werkt end-to-end:** opdracht → match → reactie → samenwerking → contract → urenstaat (incl. ORT) → goedkeuring → factuur → betaalregistratie → administratie/BTW. Plus certificaat-dossier met verificatie/verval, next-action-engine, DBA-monitor en tenant-cockpit voor bemiddelaars.
- **Bewust UIT (env-gestuurd, inert):** billing (`noop`), e-mail (`noop`), documentopslag (`local`, geen S3), verificatie-koppelingen DUO/BIG/iDIN (`mock`), web-push (geen VAPID-sleutels), aangifte-partner. Rate-limit-store draait op Redis (`RATE_LIMIT_STORE=redis`). Elk kanaal heeft een zelftest + aflever-heartbeat op `/admin/systeemstatus`.
- **Mensenwerk vóór livegang** (MENSENWERK.md §0): jurist-/AVG-review met echte gevoelige documenten, productie-secrets, betaalprovider, echte verificatie-API's, mailprovider, S3, eigen domein.
- **Open strategische keuze:** focus & wig — voorstel in [ADR 0011](docs/decisions/0011-focus-en-wig.md) (status: voorgesteld, eigenaarsbesluit).

## 2026-09-04 — routine: badge/telling toont een server-verlopen VERIFIED-certificaat als verlopen (#1380)

**Wat:** twee adversariële Opus-audits op niet-overlappende kern-oppervlakken (certificaat-/
verificatie-lifecycle · ORT/cascade-math + reminders). De cascade-audit bevond de geld-paden schoon
(reconcile, segmentatie, nummering, VAT, reminder-idempotentie — alleen een LAAG reminder-jitter-nootje,
onder de lat). De lifecycle-audit vond één bereikbaar server-side-waarheid-defect (CLAUDE.md regel 1).

**Defect:** de hele app behandelt een `VERIFIED`-certificaat met een gepasseerde `expiresAt` als
verlopen — óók vóór de expiry-cron (`runExpiryTask`) de status naar `EXPIRED` flipt (`isExpired`,
`computeCompliance`, verval-danger-band, `/acties`). De **statusbadge** was de enige plek die de ruwe
DB-status toonde: `VERIFIED` → groene "Geverifieerd", zonder naar `expiresAt` te kijken. Op de
bemiddelaar-cockpit `/franchise/zzpers/[id]` toonde één scherm zo tegelijk de rode danger-band "1
certificaat verlopen" én een groene "Geverifieerd"-badge voor hetzelfde certificaat — een
cross-surface tegenspraak op precies het vertrouwenssignaal dat het platform onderscheidt. Ook op
`/certificaten` (ZZP'er, badge vs. "(verlopen)"-tekst) en `/admin/gebruikersbeheer/[id]`. Dezelfde
wortel-oorzaak in het DBA-dossier-PDF: `verifiedCount` (→ `trustLevel`) telde een server-verlopen
certificaat mee als geverifieerd (de route selecteerde `expiresAt` niet eens).

**Fix:** `CredentialStatusBadge` accepteert nu `expiresAt` en loopt door dezelfde `isExpired`-regel
(`VERIFIED` + gepasseerde `expiresAt` → toont "Verlopen"); de drie call-sites geven `expiresAt` mee
(ze selecteerden het al). `buildDbaAuditData` sluit server-verlopen certificaten uit van
`verifiedCount`; de dba-dossier-route selecteert + geeft `expiresAt` mee. Server-side blijft de
waarheid — de badge/telling toont, beslist niet.

**Bestanden:** `src/components/credentials/credential-status-badge.tsx` (+ `.test.tsx`, 6 cases),
`src/app/(protected)/{franchise/zzpers/[id],certificaten/(index),admin/gebruikersbeheer/[id]}/page.tsx`,
`src/lib/dba-audit.ts` (+ `.test.ts`, +3 cases: verlopen-VERIFIED → BASIS, toekomst → DEELS, gemengd),
`src/app/api/samenwerkingen/[id]/dba-dossier/route.ts`, `docs/PERSONA-SWEEP-BACKLOG.md`.

**Checks:** typecheck ✓ · lint ✓ · unit 8143 ✓ (2 skip) · prettier --check ✓ · build ✓; CI-poort verifieert.

## 2026-09-02/03 — bouwprogramma na de Fable-review: 24 PR's in drie golven (orchestrator + parallelle builders)

**Aanleiding:** onafhankelijke totaalreview van 2-9 (rapport "Handslag onder de loep"): engineering sterk,
productfocus zwak, en productie bleek al sinds 12-8 stil te staan. Drie golven van parallelle builders in
eigen worktrees, elk pakket één PR met de volledige poort, alles zelf gemerged via `--auto`.

**Productie hersteld (#1345, #1351):** elke Railway-deploy faalde sinds 12-8 op de preflight
(`RATE_LIMIT_STORE=redis` was onbekend) — Redis-driver gebouwd, onbekende keuzewaarden zijn voortaan een
waarschuwing met fallback i.p.v. NO-GO, eenmalige DB-transitie db push → resolve → deploy, deploy-lag-
watchdog in `monitor.yml`, `builtAt` in `/api/health`. Los daarvan wees `DATABASE_URL` naar een Postgres met
vreemde data; de eigenaar-sessie koppelde een nieuwe service (Postgres-uro6, EU West). Live = main sinds 3-9.

**Robuustheid:** Prisma Migrate-baseline + `migrations`-driftcheck + AuditLog/Notification-indexen + seed-
reset-guard (#1334); Postgres-e2e-job in CI en `ciContains()` — bewees dat élke zoekfunctie op Postgres
hoofdlettergevoelig kapot was (#1332); querybudget-integratietest (eerste echte DB-test) + request-gecachte
gebruikerscontext (#1333, #1349; shell 44/41/18/46 queries per rol — ≤ 20 vergt een signaal-snapshot, zie
backlog); /kandidaten begrensd + vangrail over lib/components (#1342); 136 contracttests op de UI-primitives

- 2 a11y-fixes (#1339); e2e bemiddelaar-flow + tenant-isolatie met positieve controle (#1347, #1350);
  `fillForUrl` tegen hydratatie-flakes + EmptyState-kop (#1354); 12 heartbeat-modellen → 1 (#1355);
  review-workflow 90 turns + 'INCOMPLEET'-verdict + herstart per PR (#1352).

**Product/focus:** design-lab ADMIN-only + uit de Docker-image, foutgrenzen per deelgebied (#1335); 12
dubbele routes → redirects (#1340, in de poort); zijbalk ≤ 11 items, taalwissel weg, zorg-focus (#1336);
61 motief-labels → gewone sectienamen (#1346); zorg-only seed (#1341); VOG-metadata-modus (#1338, gehard in
#1358); bureau-zelfregistratie met PENDING-tenant en admin-activatie (#1343); reactielimiet per kalendermaand
i.p.v. levenslang (#1353, in de poort); BTW-taak weg bij de opdrachtgever (#1333).

**Geheugen/proces:** PROGRESS ≤ 400 regels + archief, CURRENT_TASK ≤ 300, modulekaart, routine-scope-
restrictie, ADR 0011 focus & wig (voorstel) (#1331). Loopjemee is een los project met eigen loop (zie dat repo).

**Open uit het programma (backlog):** signaal-snapshot per gebruiker via de event-bus (shell → 1 query);
factuur-cutover `status`→`lifecycleStatus`; de 3 verrijkte routes (/admin/audit, /prognose, /verplichtingen)
naar hun hub-tab; `notFound()` onder `loading.tsx` geeft 200; e2e-shard-flakes blijven de traagste poort.

## 2026-09-04 — persona-sweep: geen ORT-drift op de ZZP'er-view /diensten (spiegel van #1373)

**Wat:** persona-sweep-ronde (orchestrator Opus 4.8 + live Playwright-sweep over alle vier de rollen +
3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken: authz/IDOR/tenant ·
next-action-engine · financieel/cascade + malicieuze invoer). Live-sweep: geen 500's, geen
console-fouten, geen dode nav-links, cross-rol verboden routes server-side geweigerd. authz/IDOR/
tenant én next-action-engine: **0 bereikbare gaten**. Eén KRITIEK-klasse defect gevonden én gefixt:

**PR #1373 fixte de ORT-drift alleen aan de opdrachtgever-kant (`/prestaties`); de spiegelende
ZZP'er-view `/diensten` (`getDienstenForFreelancer`) + CSV-export bleven live-herberekenen.** Na
goedkeuring bevriest het factuurbedrag (`Invoice.subtotalCents`, `performanceId @unique`), maar de
samenwerking-ORT-toeslagen mogen daarna nog wijzigen (`setOrtProfileAction` blokkeert alleen bij een
wachtende SUBMITTED-urenstaat). De ZZP'er zag daardoor voor een reeds gefactureerde/betaalde prestatie
een bedrag dat kon afwijken van zowel de factuur als de (na #1373 correcte) opdrachtgever-view — een
directe cross-surface tegenspraak op geld (CLAUDE.md regel 1). **Fix:** de "bevroren factuur wint"-
reconciliatie losgetrokken naar één gedeelde pure helper `reconcileSubtotalWithInvoice`
(`src/lib/ort-breakdown.ts`), nu gebruikt door zowel `prestaties.ts` als `diensten.ts` — dit
elimineert de drievoudige duplicatie die de asymmetrie überhaupt liet ontstaan. `diensten.ts` haalt
`invoice.subtotalCents` mee en toont het bevroren subtotaal (toeslag = subtotaal − snapshot-stabiele
basis). +5 rood→groen-asserties op de helper; de bestaande `/prestaties`-drift-tests routen nu door
de helper en blijven groen.

**Bestanden:** `src/lib/ort-breakdown.ts` (+ `.test.ts`), `src/lib/diensten.ts`,
`src/lib/prestaties.ts`, `docs/PERSONA-SWEEP-BACKLOG.md`.

**Checks:** typecheck / lint / unit (773 files, 8091 tests) / build / prettier --check groen; CI-poort
verifieert.

## 2026-09-04 — routine: /prestaties toont het bevroren factuursubtotaal (geen ORT-drift)

**Wat:** `getPrestatiesForClient` (`src/lib/prestaties.ts`) herberekende voor élke prestatie — óók
reeds goedgekeurde/gefactureerde — het subtotaal uit de **live** ORT-toeslagen van de samenwerking.
Die toeslagen mogen ná goedkeuring nog wijzigen (`setOrtProfileAction` blokkeert alleen zolang er een
SUBMITTED-urenstaat wacht), terwijl het factuurbedrag bij goedkeuren wordt bevroren
(`Invoice.subtotalCents`, `performanceId @unique`, via `planPerformanceApproved` → `computeVat`, die
het subtotaal ongewijzigd doorgeeft). Gevolg: het `/prestaties`-overzicht én de CSV-export konden
gaan afwijken van de onveranderlijke factuur die de opdrachtgever daadwerkelijk kreeg/betaalde — de
reconciliatie-oppervlakte die de payer tegen betalingen/loonstrook legt. Tegenspraak met de
"één-bron-van-waarheid"-conventie.

**Fix (server-side waarheid):** mapping-logica losgetrokken naar de pure, los-testbare
`toPrestatieOverzicht(row)`; `getPrestatiesForClient` neemt de afgeleide factuur mee
(`invoice: { subtotalCents }`) en toont, zodra die bestaat, háár bevroren subtotaal i.p.v. de
live-herberekening. De ORT-toeslag reconciliëert tegen dat bevroren subtotaal
(`toeslag = factuursubtotaal − basis`; de basis is snapshot-stabiel via het gesnapshotte uurtarief).
Zonder factuur (DRAFT/SUBMITTED/REJECTED) blijven de live toeslagen legitiem de bron.

**Bestanden:** `src/lib/prestaties.ts` (pure `toPrestatieOverzicht` + `PrestatieRow`, invoice in query),
`src/lib/prestaties.test.ts` (+6 asserties: drift zonder factuur bewezen, bevroren mét factuur,
non-ORT-uren, milestone, SUBMITTED-fallback).

**Checks:** typecheck ✓ · lint ✓ · unit 8087 ✓ · build ✓ · prettier ✓; CI-poort verifieert.

## 2026-09-04 — security/privacy: timing-enumeratie bij bureau-aanmelding gedicht (CWE-208/A07)

**Wat:** de zelfaanmelding van een bemiddelingsbureau (`registerBureau`) belooft "geen enumeratie" — een al
bestaand e-mailadres/KvK-nummer geeft exact dezelfde generieke bevestiging als een nieuwe aanmelding. Maar de
responstijd verraadde het bestaan tóch: `bcrypt.hash` (cost 10, ~60ms — de grootste vaste rekenstap) draaide
alleen op het nieuw-pad, ná de existentie-check. Het bestaand-pad retourneerde direct na twee indexed reads;
een aanvaller kon bureaus/accounts enumereren op latentie (het rate-limit verhoogt de kosten maar dicht het
orakel niet). **Fix:** `bcrypt.hash` draait nu onvoorwaardelijk vóór de existentie-check, zodat bestaand- en
nieuw-pad dezelfde vaste kosten dragen. Server-side, geen UI-wijziging, geen auth verzwakt.

**Audit deze ronde:** orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende
oppervlakken (A: IDOR/object-autorisatie, B: cross-tenant + PII-minimalisatie, C: injectie/upload/SSRF/
open-redirect/fout-lek + de delta sinds `5f9bf1ab`) — **geen bevestigd KRITIEK/HOOG gat**, IDOR/cross-tenant/
injectie CLEAN, de request-gecachte gebruikerscontext (#1349) expliciet veilig (per-request `cache()`, gekeyd
op sessie-eigen id). `npm audit --omit=dev`: 0 kwetsbaarheden. Details in `docs/SECURITY-PRIVACY-BACKLOG.md`
(ronde 2026-09-04).

**Bestanden:** `src/app/register/actions.ts`, `src/app/register/bureau-timing-enumeratie.test.ts` (nieuw, 3
rood→groen-asserties), `docs/SECURITY-PRIVACY-BACKLOG.md`.

**CI-robuustheid (meegenomen):** de `audit`-poort (`.github/workflows/security.yml`) faalde hard op een
**aanhoudende** npm-registry-storing (HTTP 503 op het audit-endpoint, ~20 min) — dat blokkeert elke PR
onterecht. Nieuwe wrapper `scripts/audit-production.mjs` leest de `npm audit --json`-uitvoer en onderscheidt
een echte high/critical-**bevinding** (blokkeert, exit 1 — gate volledig intact) van een bevestigde
registry-**storing** (niet-blokkerend met luide waarschuwing; backstop: informatieve volledige-audit +
wekelijkse scheduled run). Onverwachte uitvoer faalt fail-safe. Durable test
`scripts/audit-production.test.ts` (7 asserties) borgt dat een storing nooit een bevinding maskeert.

**Checks:** typecheck / lint / unit / build / prettier groen; CI-poort verifieert.

## 2026-09-04 — prod: server-action origin-allowlist (Next.js 15 CSRF-poort achter proxy)

**Wat:** Next.js 15 controleert bij élke Server Action de `Origin`-header tegen de (`X-Forwarded-`)
`Host` als CSRF-mitigatie. Achter Railway's reverse proxy of bij een eigen domein kan die
vergelijking mismatchen → élke mutatie (documentupload, cascade, alle server actions) faalt dan stil
met een 403. `experimental.serverActions.allowedOrigins` (`next.config.mjs`) staat nu de canonieke
publieke host(s) expliciet toe, afgeleid uit `AUTH_URL`/`NEXTAUTH_URL` (+ optionele
`SERVER_ACTIONS_ALLOWED_ORIGINS` voor multi-domein) via de pure, geteste
`scripts/server-actions-origins.mjs`. Puur additief (default same-origin-check blijft), inert zonder
config (leeg → default gedrag, CLAUDE.md §8). Zelfde `.mjs`-helper-patroon als `shutdown-config.mjs`.

**Bestanden:** `scripts/server-actions-origins.mjs` + `.test.ts` (13 cases), `next.config.mjs`
(import + conditionele `allowedOrigins`), `src/lib/env.ts` (`SERVER_ACTIONS_ALLOWED_ORIGINS` in
schema), MENSENWERK.md §0b. **Gate:** typecheck ✓ · lint ✓ · test 8072 ✓ · prettier --check ✓ ·
build ✓. **Mensenwerk:** niets extra bij één domein (volgt uit `AUTH_URL`); bij multi-domein
`SERVER_ACTIONS_ALLOWED_ORIGINS` zetten.

## 2026-09-03 — persona-sweep: BTW-jaar volgt Amsterdamse kalender + agenda lekt geen CLIENT-BTW-deadline

**Wat:** persona-sweep-ronde (orchestrator Opus 4.8 + 3 parallelle Opus-audits op niet-overlappende
oppervlakken: authz/IDOR/tenant · next-action-engine · financieel/cascade + malicieuze invoer). De
authz/IDOR/tenant-audit vond **0 bereikbare gaten** (mutatieketen `auth → rol → ownership → Zod →
actie → audit` overal intact op de laatste ~30 commits, inclusief VOG-flow, franchise-mutaties,
cron-guards, privé-documenten anti-oracle). Drie gefixte defecten uit de andere twee audits:

1. **should-fix (DOEL 2, CLAUDE.md regel 1 — server-side waarheid / periode-drift): de BTW-CSV-export
   `/api/administratie/btw` gebruikte `new Date().getFullYear()` (server-UTC) i.p.v. `fiscalYearOf`.**
   Op de UTC-server (Railway) valt `31 dec 23:15 UTC` = `1 jan 00:15` Amsterdam; met `getFullYear()`
   was het jaar in de bestandsnaam én het audit-log het oude jaar, terwijl `vatYear`/`vatReturn`
   intern filteren op `fiscalYearOf(occurredAt) === year` → de eerste nieuwjaarsochtend leverde de
   ZZP'er/opdrachtgever een `btw-2026.csv` met (0 of) verkeerde kwartalen i.p.v. `btw-2027.csv`.
   Zelfde bugklasse als #1329 (factuurnummering), gemist bij die sweep. **Fix:**
   `year = fiscalYearOf(new Date())` + regressietest op `31 dec 23:15 UTC` (Content-Disposition én
   audit-metadata zijn 2027). Bestand: `src/app/api/administratie/btw/route.ts` (+ `route.test.ts`).

2. **should-fix (DOEL 2, zelfde bugklasse — intern tegenstrijdig scherm):
   `boekhouding-panel.tsx` gebruikte `now.getFullYear()` voor omzet/BTW/jaaroverzicht, terwijl de
   BTW-deadline-kaart op hetzelfde paneel via `summarizeVatDeadline` al `fiscalYearOf` gebruikte.**
   In het NYE-UTC-venster liep het jaar-blok en de deadline-kaart uiteen op één en hetzelfde scherm.
   **Fix:** `year = fiscalYearOf(now)`. Bestand: `src/components/administratie/boekhouding-panel.tsx`.

3. **should-fix (DOEL 1b, CLAUDE.md regel 1 — cross-surface pariteit): de agenda-/`.ics`-export van
   de opdrachtgever bevatte alsnog BTW-aangifte-deadlines**, terwijl die taak sinds #1333 bewust uit
   `/acties` is verwijderd (structureel onjuist voor een meestal btw-vrijgestelde zorginstelling —
   een aangifte-deadline op onze deelverzameling van haar administratie is niet afvinkbaar). De
   agenda-loader `loadUserAdministrativeDeadlines` riep `getVatDeadlinesForActor` onvoorwaardelijk
   aan met de live `role`, waardoor de door #1333 bedoelde beslissing in de agenda-surface werd
   gecontrapunteerd. **Fix:** `role === "FREELANCER" ? getVatDeadlinesForActor(...) : []` (zelfde
   scoping als `pending-tasks.ts` L863) + regressietest die verifieert dat de mock voor CLIENT
   nooit wordt aangeroepen en `result.vat` leeg is. Bestanden: `src/lib/calendar/user-deadlines.ts`
   (+ `.test.ts`).

**Checks:** typecheck / lint / unit (767 files, 8020 tests) / prettier groen; CI-poort verifieert.

## 2026-09-03 — routine: uren-uitschieter-attentie óók op de goedkeur-plek (opdrachtgever)

**Wat:** het uren-uitschieter-signaal ("≈X% meer uren dan gebruikelijk … controleer even") waarschuwde de
opdrachtgever alleen op de lijst `/prestaties`. Maar goedkeuren gebeurt op `/samenwerkingen/[id]` (de
"Keuren →"-bestemming van diezelfde lijst); dáár ontbrak de attentie precies op het beslismoment — de
opdrachtgever stempelt een opvallend hoge urenstaat af zonder de "controleer even"-context. Nu toont de
samenwerkingspagina hetzelfde, server-side berekende signaal op de SUBMITTED-urenstaatkaart, vlak boven de
knoppen Goedkeuren/Afkeuren. Zelfde deterministische detector (`detectHoursAnomalies`), baseline = mediaan
van de eerder goedgekeurde urenstaten van déze samenwerking (≥3 samples). Het signaal beslist niets;
goedkeuren loopt onveranderd via `approvePerformanceAction` (auth→rol→ownership→transitie→audit). Alleen
zichtbaar voor de opdrachtgever (`isClient`), geen lek naar de ZZP'er.

**Aanpak:** de copy verhuisde naar één gedeelde pure formatter `formatHoursAnomalyNotice(HoursAnomaly)` in
`src/lib/performance-hours-anomaly.ts` — één bron van waarheid, zodat de tekst op beide plekken nooit driftt.
`/prestaties` gebruikt nu diezelfde formatter (inline JSX vervangen, identieke rendered tekst). Op de
samenwerking wordt de detector op `col.performances` gedraaid (expliciete row-mapping id/collaborationId/
type/status/hours) en per SUBMITTED-kaart opgezocht. Geen schema-/mutatie-/authz-oppervlak, geen dode knop,
geen i18n-woordenboekwijziging.

**Bestanden:** `src/lib/performance-hours-anomaly.ts` (+ `.test.ts`, 3 nieuwe formatter-tests: exacte copy,
nl-komma-decimaal, consistentie met de detector), `src/app/(protected)/samenwerkingen/[id]/page.tsx`,
`src/app/(protected)/prestaties/page.tsx`.

**Checks:** typecheck / lint / unit (8020 groen) / build / prettier groen; CI-poort verifieert.

## 2026-09-03 — routine: re-engagement-suggesties óók na een gesloten/vervulde opdracht (ZZP'er)

**Wat:** het "Soortgelijke open opdrachten"-blok op `/reacties` verankerde alleen op een expliciete
**afwijzing** (`pickReengagementAnchor` → `REJECTED`). Een even doodlopend, maar demotiverender geval
kreeg géén suggesties: een nog-openstaande reactie (NEW/VIEWED/SHORTLIST) waarvan de opdracht dood
ging — gesloten of vermoedelijk vervuld door een ander — terwijl de ZZP'er nog wachtte (het
"ghosted"-geval). Die kreeg alleen de statische per-rij-link "Bekijk andere opdrachten". Nu verankert
het blok op het **meest recente doodlopende spoor**: een afwijzing (reason `REJECTED`) óf een dode
opdracht op een nog-openstaande reactie (reason `JOB_ENDED`), met copy die zich aanpast
("… is niet meer beschikbaar." i.p.v. "Niet geselecteerd voor …"). Dezelfde verklaarbare matchmotor
(`relatedJobsForFreelancer`), één begrensde read, alleen wanneer er echt iets doodliep.

**Aanpak:** `ReengagementReaction` kreeg een `jobDead`-veld (server-side afgeleid uit dezelfde
`applicationJobAvailability(...) != null` als de per-rij-melding — geen tweede waarheid);
`ReengagementAnchor` kreeg `reason: "REJECTED" | "JOB_ENDED"`. `pickReengagementAnchor` loopt
nieuw→oud en pakt de eerste treffer (afwijzing of dode opdracht), collab/WITHDRAWN uitgesloten; de
`jobDead`-tak is defensief begrensd tot open statussen zodat een inconsistente aanroeper nooit een
besliste reactie als "opdracht liep dood" verankert. Puur/deterministisch, geen mutatie/schema/authz,
geen dode knop, geen i18n-woordenboekwijziging (`t()` valt terug op de NL-brontekst).

**Bestanden:** `src/lib/reengagement.ts` (+ `.test.ts`, 11 tests — 5 nieuw voor het JOB_ENDED-spoor,
recentheid-voorrang en de defensieve guard), `src/app/(protected)/reacties/page.tsx`.

**Checks:** typecheck / lint / unit / build / prettier groen; CI-poort verifieert.

## 2026-09-03 — security/privacy: VOG-verwijdering gehard tegen herindienen + race (audit-ronde)

**Wat:** adversariële security-/privacy-audit (orchestrator Opus 4.8 + 3 parallelle Opus-audits) op de delta
sinds `c238580d` (14 PR's). Twee gaten op de níeuwe VOG-metadata-modus (#1338) gedicht:

1. **KRITIEK (AVG art. 5(1)(e)/art. 10):** herindienen van een reeds beoordeelde VOG (VERIFIED/REJECTED →
   SUBMITTED) liet `evidenceSeenAt/evidenceSeenById/evidenceRemovedAt` van de vorige cyclus staan. Een stale,
   niet-lege `evidenceRemovedAt` maakte de opruim-vangnet-taak (die alleen `evidenceRemovedAt: null` oppakt)
   blind → bij een opslagstoring op de tweede beoordeling bleef het nieuwe strafrechtelijk gegeven permanent en
   zonder alarm in de opslag. Ook: de certificatenpagina toonde onterecht "gezien · bestand verwijderd". Fix:
   gedeelde `EVIDENCE_REVIEW_RESET` in beide her-beoordelingspaden — invariant "SUBMITTED = deze cyclus nog niet
   beoordeeld" is weer overal waar.
2. **HOOG (audit-integriteit):** `removeCredentialEvidence` schreef een `CREDENTIAL_EVIDENCE_REMOVED`-audit ook
   als de compound-guard 0 rijen matchte (verloren race tussen queue en cron, geen lock) → spook-auditregel +
   overtelling. Fix: transactie gate't nu op `res.count`; bij 0 niets wissen, geen audit, `{removed:false}`.

**Bestanden:** `src/app/(protected)/certificaten/actions.ts`, `src/lib/credential-evidence.ts`. **Tests
(rood→groen):** `certificaten/evidence-resubmit-reset.test.ts` (nieuw), `src/lib/credential-evidence.test.ts`
(nieuw) — beide falen zonder de fix, slagen ermee. Overige bevindingen (timing-enumeratie op bureau-aanmelding,
geen erasure-pad voor afgewezen bureau, fail-open rate-limit, DB-transitie) geparkeerd in
`docs/SECURITY-PRIVACY-BACKLOG.md` (ronde 2026-09-03). `npm audit --omit=dev`: 0 kwetsbaarheden.

## 2026-09-02 — routine: verificatiewachtrij markeert certificaten die een lopende inzet blokkeren (admin)

**Wat:** de admin-verificatiewachtrij (`/admin/verificaties`) toonde vraag vanuit **open opdrachten**
(`verification-impact.ts`), maar niet de urgentste dimensie: welke ingediende (SUBMITTED) certificaten
blokkeren een **lopende (ACTIVE) inzet**? Als een ZZP'er nú op een opdracht zit die een certificaattype
verplicht stelt en dat type is nog niet geldig-geverifieerd, draait die plaatsing met een openstaand
compliance-gat — de opdrachtgever loopt live risico (vertrouwen/verificatie is de kerndifferentiatie).
Nu een **danger-badge** "Blokkeert lopende inzet · N" op zulke inzendingen + een teller in de header
("N blokkeren een lopende inzet"). FIFO-volgorde (eerlijkheid) blijft ongewijzigd; het is een tweede
prioriteitsdimensie naast open-vraag, verlopen-inzending en herindiening.

**Aanpak:** pure, deterministische kern `src/lib/verification-placement-impact.ts`
(`activePlacementImpact`): per wachtrij-inzending het aantal distinct ACTIVE-inzetten dat haar type
verplicht vereist én waar het type nog niet gedekt is door een geldig VERIFIED-certificaat (zelfde
"geldig geverifieerd"-semantiek als `assessCollaborationCredentials`; al-gedekte types geven geen valse
urgentie). Data-laag `src/lib/data/verification-placement-impact.ts` scoopt op de ZZP'ers die nú in de
wachtrij staan (structureel klein), platform-breed (admin ziet alle tenants, spiegelt de open-vraag-helper):
ACTIVE-collaboraties + verplichte job-eisen, en de VERIFIED-certificaten (geldigheid server-side bepaald).
Read-only afgeleid; geen schema-/mutatie-/authz-oppervlak, geen dode knop.

**Bestanden:** `src/lib/verification-placement-impact.ts` (+ `.test.ts`, 9 tests),
`src/lib/data/verification-placement-impact.ts`, `src/app/(protected)/admin/verificaties/page.tsx`.

**Checks:** typecheck / lint / unit / build / prettier groen; CI-poort verifieert.

## 2026-09-02 — security/privacy-audit: geen nieuwe gaten (basis `main` @ c238580d)

**Wat:** volledige adversariële security-/privacy-auditronde (orchestrator Opus 4.8 + 3 parallelle Opus-audits
op niet-overlappende oppervlakken), met de opdracht de eerdere "CLEAN"-claims op de áctuele HEAD te wéérleggen —
plus een gerichte review van de delta `f793358a..c238580d` (reauth-rem, roostertijdlijn, `/franchise/planning`,
`ciContains`-zoeken, Prisma-baseline/seed-reset-guard, ontwerp-lab-hardening). **Uitkomst: geen nieuwe bevinding.**
Alle sensitieve primitieven her-geverifieerd: `documents/[id]`/PDF-/dossier-routes leiden ownership server-side af
en auditen (anti-oracle 404); `media/[...key]` serveert alleen bekende `logoKey`s; alle cron/webhook-guards zijn
fail-closed (503 bij leeg `CRON_SECRET`); cross-tenant-scoping via `tenantScopeWhere`/`ownsViaTenant` overal
fail-closed; geen `.passthrough()`/overposting; `anonymizeUser` volledig met CI-coverage-gate;
`escapeCsvField`/`escapeIcsText` op alle exports; `npm audit --omit=dev` = 0. De nieuwe `SEED_DEMO_RESET`-wisvlag is
fail-closed (vereist óók `SEED_DEMO=true`). Gedekt: OWASP A01–A10 + AVG art. 5/17/25/32. Details + dekkingsmatrix in
`docs/SECURITY-PRIVACY-BACKLOG.md` (ronde 2026-09-02b). Geparkeerde infra-/mensenwerkpunten uit eerdere rondes
ongewijzigd.

**Bestanden:** `docs/SECURITY-PRIVACY-BACKLOG.md`, `PROGRESS.md` (docs-only; geen codewijziging — er was niets te fixen).

## 2026-09-02 — routine: certificaat-verval tijdens de plaatsing (opdrachtgever)

**Wat:** de opdrachtgever-certificaat-alert (`collaboration-alerts.ts`, compliance-ripple) gebruikte een
vast 30-daags "verloopt binnenkort"-venster en negeerde `Collaboration.endDate` volledig. Gevolg: een
vereist certificaat dat ná die 30 dagen maar **vóór het einde van een langere plaatsing** verloopt, gaf
géén enkel signaal — een stil compliance-gat precies bij de langlopende inzetten waar het risico het
grootst is (VOG/diploma lapt mid-opdracht, opdrachtgever weet van niets). Benchmark: vertrouwen/verificatie
als kerndifferentiatie (Pidz e.a. leunen op certificaat-compliance). Nu een **additieve** WARNING: een
certificaat dat vóór de einddatum van de opdracht vervalt (buiten het venster) verschijnt als
`expiringDuringPlacement` — melding "verloopt vóór het einde van de opdracht". Bestaand gedrag ongewijzigd:
het 30-daagse venster blijft, open-einde-plaatsingen (`endDate = null`) en certificaten die de plaatsing
overleven geven geen signaal.

**Aanpak:** pure `assessCollaborationCredentials` kreeg een optionele 5e param `placementEnd`; nieuwe
bucket `expiringDuringPlacement` = satisfied-types waarvan élk geldig VERIFIED-certificaat vóór
`placementEnd` vervalt (en niet al in `expiringSoon`). Zelfde "every valid cert"-semantiek als het venster
→ een tweede, langlopend certificaat behoudt de dekking. Verleden-einddatum geeft per definitie geen ruis
(geldig ⇒ `expiresAt > now ≥ placementEnd`). `endDate` door `CollaborationAlertRow` +
`clientCredentialAlertsFromRows` geriemd (Prisma `include` levert het scalar-veld al → geen extra query);
`clientCredentialAlerts`-query, dashboard-momentopname, CSV-export én de `/samenwerkingen`-lijst krijgen de
anker vanzelf mee (screen↔action-pariteit). Berichten (`describeCredentialAlert`/`shortCredentialAlert`/
`clientComplianceTask`) + de dashboard-chip + de compliance-CSV kregen de nieuwe categorie; WARNING-band
(`P.credentialExpiring`), nooit een gap-prioriteit. Server-side waarheid, geen mutatie/schema/authz, geen
dode knop.

**Bestanden:** `src/lib/collaboration-alerts.ts` (+ `.test.ts`), `src/lib/collaboration-compliance-csv.ts`
(+ `.test.ts`), `src/lib/actions/tasks.ts` (+ `.test.ts`),
`src/components/dashboard/compliance-snapshot-card.tsx`,
`src/app/(protected)/samenwerkingen/(index)/page.tsx`, plus mock-updates in
`signals.badge-gaps-run46.test.ts`, `pending-tasks-client-compliance.test.ts`, `export-audit.test.ts`.

**Tests:** +12 (7 op de nieuwe assess-logica, +fromRows-einddatum/open-einde, +CSV-kolom, +clientCompliance-
task, +clientHasComplianceAction). typecheck/lint/test/build/prettier groen · CI-poort verifieert.

## 2026-09-02 — routine: roosterbezetting-tijdlijn voor de bemiddelaar (wie is wanneer beschikbaar)

**Wat:** de bemiddelaar (FRANCHISER) kon "wie kan ik NU inzetten?" (`roster-capacity.ts`) en "wie komt
binnenkort vrij?" (`roster-availability-forecast.ts`) zien, maar er was geen dag-precieze
cross-roster planvraag: "wie is WANNEER beschikbaar?". Bij het vooruit plannen van de komende twee
weken moest hij elke ZZP'er-kaart apart openen. Benchmark: de rooster-/shiftplanning waarmee Temper/
Zorgwerk/Pidz leiden. Nieuw scherm `/franchise/planning` ("Roosterbezetting"): een read-only raster
van rosterrijen × 14 dagkolommen, elke cel afgeleid uit de zelf-opgegeven `AvailabilityWindow`-vensters
én de lopende (ACTIVE) plaatsingen — ingezet / afwezig / beperkt / vrij, in één oogopslag.

**Aanpak:** pure, deterministische kern `src/lib/franchise/roster-timeline.ts` (`buildRosterTimeline`):
UTC-dag-granulaire sleutels (consistent met `roster-unavailability.ts`), precedentie
PLACED > UNAVAILABLE > LIMITED > AVAILABLE, ongeldige vensterranges/onbekende typen genegeerd, rijen
gesorteerd op meest-inzetbaar eerst + `perDayAvailable` per dag (dunne dagen zichtbaar). Server-component
`page.tsx` haalt de tenant-roster tenant-gescoopt op (`tenantScopeWhere`, spiegelt de zzpers-query) en
mapt naar de pure invoer; presentatie in `RosterTimelineGrid` (horizontaal scrollbaar, licht/donker,
weekend-markering, deep-links naar `/franchise/zzpers` + de `.ics`-agenda). Read-only afgeleid, geen
schema-/mutatie-/authz-oppervlak, geen dode knop. Nav-item toegevoegd voor de FRANCHISER.

**Bestanden:** `src/lib/franchise/roster-timeline.ts` (+ `.test.ts`),
`src/app/(protected)/franchise/planning/{page,loading}.tsx`,
`src/components/franchise/roster-timeline-grid.tsx` (+ `.test.tsx`), `src/lib/nav.ts`.

**Checks:** typecheck / lint / unit / build / prettier groen; CI-poort verifieert.
