# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## Staat van het product (2-9-2026)

- **Live:** `main` is bron van waarheid én deploy-branch; Railway deployt elke gemergde PR. Poort: 6 vereiste checks + `migrations`-driftcheck, `enforce_admins` AAN. Boot draait `prisma migrate deploy` (geen `db push` meer in productie); `monitor.yml` bewaakt deploy-lag (issue-label `deploy-lag`).
- **Werkt end-to-end:** opdracht → match → reactie → samenwerking → contract → urenstaat (incl. ORT) → goedkeuring → factuur → betaalregistratie → administratie/BTW. Plus certificaat-dossier met verificatie/verval, next-action-engine, DBA-monitor en tenant-cockpit voor bemiddelaars.
- **Bewust UIT (env-gestuurd, inert):** billing (`noop`), e-mail (`noop`), documentopslag (`local`, geen S3), verificatie-koppelingen DUO/BIG/iDIN (`mock`), web-push (geen VAPID-sleutels), aangifte-partner. Rate-limit-store draait op Redis (`RATE_LIMIT_STORE=redis`). Elk kanaal heeft een zelftest + aflever-heartbeat op `/admin/systeemstatus`.
- **Mensenwerk vóór livegang** (MENSENWERK.md §0): jurist-/AVG-review met echte gevoelige documenten, productie-secrets, betaalprovider, echte verificatie-API's, mailprovider, S3, eigen domein.
- **Open strategische keuze:** focus & wig — voorstel in [ADR 0011](docs/decisions/0011-focus-en-wig.md) (status: voorgesteld, eigenaarsbesluit).

## 2026-09-06 — security/privacy: k-anonimiteitsvloer op publieke beoordelingsaggregatie (vertrouwensdossier)

**Wat:** het deelbare, publieke, **onauthentieke** vertrouwensdossier (`/vertrouwen/[profileId]/[token]`) toonde
een "geaggregeerd" beoordelingscijfer óók bij één beoordeling ("Gemiddeld cijfer over **1** beoordeling: 2,0 ★") —
dat is niet geaggregeerd maar het exacte, individueel-herleidbare cijfer van één opdrachtgever, gelekt aan het hele
internet; bij twee beoordelingen is de ander herleidbaar (ander = 2·gemiddelde − eigen). **Waarom:** AVG art. 5(1)(f)
en art. 25 (privacy by design) en de eigen privacyregel ("alleen geaggregeerd … nooit individuele beoordelingen") —
dezelfde faalklasse die het platform al dichtte voor marktbanden (`MARKET_RATE_MIN_SAMPLE = 10`), maar bij
beoordelingen gemist. Adversariële auditronde (orchestrator Opus 4.8 + 3 parallelle Opus-audits). **Fix:** nieuwe
vloer `REVIEW_AGGREGATE_MIN_SAMPLE = 3` (`src/lib/config.ts`); `freelancerReputationFromReviews` geeft `null` onder de
vloer → de publieke pagina laat de beoordelingssectie weg. Server-side waarheid; enige consument is het gedeelde pad.
**Bestanden:** `src/lib/config.ts`, `src/lib/freelancer-reputation.ts` (met `.test.ts` rood→groen: n=1/n=2 → null,
≥3 → getoond), `src/lib/data/freelancer-reputation.ts` (doc), `src/app/vertrouwen/[profileId]/[token]/page.tsx`
(comment). **Geparkeerd** (backlog): in-app spiegelfuncties `company-reputation`/`candidate-reviews` (zelfde vloer,
lagere severity — geauthenticeerde tegenpartij), spoofbare `From`-fallback in mail-intake (MIDDEL), commit-SHA op
liveness-probes (LAAG). **Checks:** typecheck ✓ · lint ✓ · prettier ✓ · unit + build (CI-poort verifieert).

## 2026-09-06 — routine: notFound()-routes onder een loading.tsx geven weer 404 i.p.v. 200 (alle rollen; bemiddelaar-detail)

**Wat:** zes detail-/bewerk-routes die `notFound()` aanroepen streamden onder een voorouder-`loading.tsx`
en committeerden daardoor HTTP **200** vóór de throw — een zachte-404 op een gevoelige resource-op-id-route.
Betrof de vier bemiddelaar-detailroutes `/franchise/{diensten,leads,opdrachtgevers,zzpers}/[id]` (gemaskeerd
door de grootouder `franchise/loading.tsx`), `certificaten/[id]/bewerken` (gemaskeerd door de resterende
`certificaten/loading.tsx`) en `kandidaten/vergelijk` (gemaskeerd door `kandidaten/loading.tsx`). **Waarom:**
(1) **correctheid** — een ontbrekende/niet-eigen resource hoort een echte 404 te geven, geen 200; (2)
**bestaans-oracle/IDOR** — 200-vs-404 op een id-route lekt bestaan (de repo behandelt dit elders al zo,
`5b11dd10` + `pdf-routes-audit.test.ts`). Dit was CURRENT_TASK-item #4. **Hoe (repo-conventie, sweeps
`459f49c1`/`43b9d6b2`):** de maskerende loading-grenzen weg; lijstroutes met een `[id]`-broer kregen hun
skeleton via een gescoopte `(index)`-route-group (loading lekt niet meer naar de broer), routes zonder
`[id]`-broer een eigen `loading.tsx`; `certificaten/[id]/bewerken` verliest zijn form-skeleton bewust —
correctheid (404) wint van de skeleton-nicety. **Drift-vast:** nieuwe statische test loopt `src/app` af en
faalt zodra een `notFound()`-pagina weer een actieve loading-grens boven zich krijgt. **Bestanden:** verwijderd
`franchise/loading.tsx`, `certificaten/loading.tsx`; verplaatst naar `(index)/` (page+loading) voor
`franchise/{diensten,opdrachtgevers,zzpers}` en `kandidaten`; nieuw `franchise/{facturatie,instellingen,
shift-overnames}/loading.tsx` + `src/app/notfound-loading-masking.test.ts`. **Checks:** typecheck ✓ · lint ✓ ·
test 8255 passed (incl. de nieuwe test) · build ✓ · prettier ✓. **PR #1400.**

## 2026-09-05 — routine: stage-bewuste aanmaningsbrief (volgt de aanmaningsladder) (ZZP'er)

**Wat:** de aanmaningsbrief-generator (`aanmaning.ts`, kopieerbaar sjabloon op `/facturen/[id]`)
produceerde **één** brief: altijd getiteld "Betalingsherinnering" én die vanaf dag 1 na de vervaldag
wettelijke handelsrente + incassokosten aankondigde. Het platform escaleert elders al netjes via de
aanmaningsladder (`DUNNING_STAGES`: Betalingsherinnering@0 → Eerste aanmaning@14 → Tweede aanmaning@30
→ Laatste aanmaning@45 dagen) — de notificaties en het debiteurenoverzicht (`currentDunningStage`)
gebruikten die al, alleen de brief liep achter. **Waarom:** (1) **helderheid/vertrouwen** — een factuur
die elders "Laatste aanmaning" heet mag geen brief opleveren die zichzelf "Betalingsherinnering" noemt
(zelfde zelf-tegensprekend-document-klasse als de persona-sweep-fixes); (2) **toon/juridisch** — een
eerste vriendelijke herinnering hoort nog niet met rente/incassokosten te dreigen; die horen bij de
geëscaleerde aanmaningen (ingebrekestelling). Administratie-ontzorging: de ZZP'er kopieert de juiste
brief zonder handmatig te herschrijven. **Hoe (server-side waarheid, DRY):** `buildAanmaningData` leidt
het niveau nu af via de bestaande `currentDunningStage(dueAt, now)` — één bron met de rest van het
platform, geen dubbele drempel-logica. Nieuwe velden `level`/`stageLabel`; `hasCharges` is gated
(`level !== "REMINDER" && charges.hasCharges`), zodat de kosten-alinea pas vanaf de Eerste aanmaning
verschijnt. `buildAanmaningLetter` past subject, openingszin (vriendelijk → feitelijk-dringend →
sommatie → verzuim), betaalverzoek en een slot-incassowaarschuwing (alleen FINAL) per niveau aan. UI:
de sectiekop toont het niveau ("Laatste aanmaning opstellen"). **Bestanden:** `src/lib/aanmaning.ts`
(+ `.test.ts`, +12 cases: 4 niveaus × subject/toon/kosten-gating + REMINDER-met-overdue-zonder-kosten +
null-dueAt), `src/components/invoices/aanmaning-section.tsx` (kop). Geen paginawijziging nodig (de
module leidt zijn eigen niveau af uit `dueAt`). **Checks:** aanmaning 26/26 ✓ · typecheck/lint/build/
prettier via CI-poort. **PR #1399.**

## 2026-09-05 — routine: bereik-check vóór publicatie in het opdracht-formulier (opdrachtgever)

**Wat:** de bereikmotor (`getJobReach` + de pure `job-reach.ts`/`job-reach-bottleneck.ts`) toonde de
opdrachtgever pas **ná** publicatie hoeveel passende, vindbare ZZP'ers een opdracht bereikt en wat het
grootste knelpunt is. De `job-reach.ts`-module benoemt zelf al de bedoeling "bereik vooraf verklaarbaar
… zodat de opdrachtgever tarief of eisen kan bijsturen vóór de opdracht koud wordt" — maar dat signaal
verscheen nog niet in het formulier. **Waarom:** een opdrachtgever die pas na publicatie ziet dat zijn
eisen bijna niemand bereiken, verliest tijd (opdracht koud, herpublicatie). Vooraf sturen op eisen/
tarief/werkvorm vult sneller — benchmark: LinkedIn/Indeed/Temper tonen een kandidaat-indicatie tijdens
het opstellen. **Hoe (server-side waarheid, DRY):** de pool-scan+score-kern uit `getJobReach` is
geëxtraheerd naar `computeReachForMatchSource(source, tenantId, appliedIds?)` in `data/job-reach.ts`;
`getJobReach` roept die nu aan (gedrag ongewijzigd). Nieuwe pure `src/lib/jobs/reach-spec.ts`
(`jobReachSpecSchema` + `toJobMatchSource` + `hasDiscriminatingRequirements` + `parseReachSpecFromForm`)
vertaalt een concept-formulier naar een `JobMatchSource`. Nieuwe read-only server-action
`estimateJobReach(formData)` (`opdrachten/actions.ts`): auth → rol CLIENT → tenant-scope (bedrijf) →
Zod-spec → begrensde pool-scan (≤200, op `company.tenantId`) → geaggregeerd `JobReach` terug (nooit
per-ZZP'er-gegevens). Zonder onderscheidende eis (geen vereiste skill/certificaat, branche of
minimumtarief) → `insufficient`, geen kaart (anders zou "bereik" de hele pool zijn). Rem:
`reachEstimateRateLimiter` (default 60/5 min per actor). UI: `JobReachPreview` (client, spiegelt
`JobReachCard`) in `job-form.tsx`, gedebouncet (600 ms) op `<form onChange>`, verouderde antwoorden
genegeerd via seq-id, loading/insufficient/gevuld-states. **Server bepaalt, client toont** (CLAUDE.md
regel 1). **Bestanden:** `src/lib/jobs/reach-spec.ts` (+ `.test.ts`, 16 cases), `src/lib/data/job-reach.ts`
(refactor), `src/lib/rate-limit.ts` (limiter), `opdrachten/actions.ts` (action), nieuwe
`src/components/jobs/job-reach-preview.tsx`, `opdrachten/job-form.tsx` (wiring). **Checks:** typecheck ✓ ·
lint ✓ · prettier ✓ · build ✓ · unit (reach-spec 16/16; volledige suite 8245 passed — de 2 rode
`react-render-phase-ping`-cases waren de patch-package-installstaat van de verse clone, groen na
`npx patch-package` zoals CI's `npm ci` doet). **PR #1398.**

## 2026-09-05 — prod: geautomatiseerde back-up-herstel-drill in CI (end-to-end DR-garantie)

**Wat:** de herstel-drill (`scripts/backup-restore-drill.ts`, `npm run db:restore-drill`) was volledig
gebouwd én unit-getest, maar **niets draaide 'm ooit op een schema** — geen enkele workflow/cron riep
`db:backup`/`db:restore-drill` aan. De belofte "een onbeproefde back-up is geen back-up" was daarmee
zelf onbeproefd. **Waarom:** productie-rijpheid — een DR-script dat nooit draait, bewijst niets; een
pg_dump/pg_restore-regressie of een schema dat niet herstelbaar dumpt zou pas tijdens een echt incident
blijken. **Hoe:** nieuwe `.github/workflows/restore-drill.yml` — een **zelfstandige** job (Postgres 16
service-container, **geen productie-secret nodig**) die de volledige keten end-to-end oefent: seedt een
bron-database (`SEED_DEMO`), maakt er met de echte `npm run db:backup` een back-up van (pg_dump +
integriteitscheck), herstelt die met de echte `npm run db:restore-drill` in een aparte wegwerp
scratch-database en leest schema + rijen terug (scratch daarna opgeruimd — geen PII-kopie). Mirrort exact
het bestaande `e2e-postgres`-patroon (`use-db-provider.mjs` → `prisma migrate deploy`/`db push` → seed).
Triggers: **maandelijkse cron** (1e, 03:17 UTC), **`workflow_dispatch`** en **`pull_request`** op de
back-up-/herstelcode. Bewust **geen** vereiste branch-protection-check (betrouwbaarheidssignaal, geen
merge-blokkade). **Bestanden:** `.github/workflows/restore-drill.yml` (nieuw) + RUNBOOK §5 / MENSENWERK
bijgewerkt (code-kant continu-gedrild GEDAAN; periodieke drill tegen een echte productie-back-up blijft
aanbevolen extra zekerheid). **Checks:** config-/docs-increment (geen app-code); `prettier --check .`
groen; de nieuwe workflow draait op deze PR (paths-trigger) als end-to-end-bewijs. **PR #1397.**

## 2026-09-05 — security/privacy-auditronde (2e): geen nieuwe gaten

**Wat:** volledige adversariële security-/privacy-audit op `main` @ d8f165be — orchestrator (Opus 4.8) +
3 parallelle Opus-audits op niet-overlappende oppervlakken (elk met bewijsopdracht file:line + repro).
Dekking: (A) object-/functie-autorisatie & IDOR over álle ~60 server actions + ~65 route handlers
(auth→rol→ownership→Zod→actie→audit, anti-oracle-404, TOCTOU-`updateMany`, document-routes, RBAC,
mass-assignment); (B) cross-tenant isolatie (FRANCHISER/multi-tenant, `tenantScopeWhere`); (C) AVG:
erasure-volledigheid (`anonymizeUser` + CI schema-coverage-gate), PII-overfetch, XSS, CSV-/formule-
injectie, SSRF, PII-in-logs. Plus orchestrator-probes: rauwe `Invoice.number` (userId-prefix) wordt op
élk client-pad gemaskeerd via `displayInvoiceNumber` (38 refs geverifieerd); `npm audit --production` = 0.
**Uitkomst:** GEEN nieuwe security-/privacy-gaten. 7 dev-/build-tooling-DoS-advisories (niet
runtime-bereikbaar; CI-`audit`-gate is productie-only) geparkeerd als LAAG in de backlog.
**Bestanden:** `docs/SECURITY-PRIVACY-BACKLOG.md` (nieuwe ronde-entry + coverage). **Volgende:** losse
niet-brekende `npm audit fix`-PR (dev-deps) als aparte dependency-increment.

## 2026-09-05 — routine: certificaat-in-beoordeling meldt eerlijk wanneer het langer duurt dan gebruikelijk

**Wat:** de "In beoordeling"-kaart op `/certificaten` (`VerificationTurnaroundCard`) zei
**onvoorwaardelijk** "Je hoeft zelf niets te doen" — ook wanneer de langst-wachtende ingediende
aanvraag de gebruikelijke doorlooptijd (p90) al had overschreden. Die geruststelling wordt oneerlijk
zodra een beoordeling vastloopt en ondermijnt de noord-ster "Kan ik dit vertrouwen?". **Waarom:**
verificatie is de kerndifferentiatie; de ZZP'er moet kunnen vertrouwen op wat het scherm zegt. De
admin-kant flagt lang-wachtende aanvragen al vanaf `VERIFICATION_STALE_DAYS` (5), dus de lus is
platform-breed gesloten — alleen de ZZP'er-melding liep achter. **Hoe (server-side waarheid, pure
logica):** nieuwe pure classifier `classifyVerificationWait(oldestWaitingDays, turnaround)` in
`src/lib/verification-turnaround.ts` → `on_track` | `slower_than_usual`. Zonder betrouwbaar
doorlooptijd-aggregaat (te weinig historie) altijd `on_track` (geen valse alarmering); anders
`slower_than_usual` zodra de wachttijd de p90 **strikt** overschrijdt (exact op p90 = nog binnen).
De kaart toont bij `slower_than_usual` een rustige `warning`-toon (icoon + "langst wachtend"-regel)
en vervangt de onvoorwaardelijke geruststelling door een eerlijke melding ("wacht langer dan
gebruikelijk — de beoordelaar ziet ’m in de wachtrij; je hoeft zelf niets te doen"). Geen dode knop:
de ZZP'er hoeft nog steeds niets in te dienen. **Bestanden:** `src/lib/verification-turnaround.ts`
(+ `.test.ts`, +5 cases: geen aggregaat, binnen, exact-p90-grens, boven-p90), nieuwe
`src/components/credentials/verification-turnaround-card.tsx` + `.test.tsx` (4 render-cases).
**Checks:** typecheck ✓ · lint ✓ · prettier ✓ · unit (2 files, 15 passed) ✓ · build (CI-poort
verifieert). **PR #1394.**

## 2026-09-05 — persona-sweep: TOCTOU-hardening op drie admin-statusovergangen

**Wat:** de persona-sweep (3 parallelle adversariële Opus-audits — API-routes, roster/notificaties/
profiel, admin-oppervlak — plus live smoke) vond dat drie ADMIN-statusovergangen nog een kale
`prisma.<model>.update({ where: { id } })` deden na een vóór-lees + `assertTransition`, i.p.v. de
compound-guarded `updateMany({ where: { id, status: from } })` die de rest van het platform hanteert
(verificatie, no-show, dispuut, shift-overname, tenant-activatie, platform-billing). Twee gelijktijdige
admin-klikken passeerden beide de vóór-lees → een dubbele auditregel en/of een stale-overschrijving.
De API-route- en roster/notificatie/profiel-oppervlakken kwamen schoon uit de audit (0 bereikbare gaten).
**Bevindingen (alle drie OPGELOST):**

1. **`admin/bewaking/actions.ts` `setStatus`** (acknowledge/resolve incident) — HOOGSTE: `INCIDENT_TRANSITIONS`
   staat terug-overgangen naar `OPEN` toe, dus een acknowledge en een resolve konden elkaar overschrijven,
   elk met eigen auditregel.
2. **`admin/opdrachten/actions.ts` `adminCloseJob`** — kale `update` in een array-`$transaction`; race gaf
   een dubbele `JOB_CLOSED_BY_ADMIN`-auditregel.
3. **`admin/support/actions.ts` `adminResolve` + de statusflip in `adminReply`** — read-then-write zonder
   guard; `adminReply` kon bovendien een intussen door de aanvrager heropend ticket (terug op `ESCALATED`)
   met een stale flip alsnog uit de wachtrij op `AWAITING_USER` zetten.

**Hoe:** alle drie nu compound-guarded `updateMany({ where: { id, status: from } })` bínnen een
`$transaction`, met de auditregel (`auditData` + `tx.auditLog.create`) ná een geslaagde claim
(`count === 0` → geen audit, geen stale write); de `adminReply`-statusflip guardt op de gelezen status.
Spiegelt exact `admin/no-shows/actions.ts`. **Tests (rood→groen):** `admin/bewaking/actions.test.ts` (nieuw),
`admin/opdrachten/close-toctou.test.ts` (nieuw), `admin/support/resolve-toctou.test.ts` (nieuw) +
`admin/support/admin-reply.test.ts` (bijgewerkt naar de guarded flip + nieuwe race-case). **Bestanden:**
`admin/bewaking/actions.ts`, `admin/opdrachten/actions.ts`, `admin/support/actions.ts` + de 4 tests.
**Checks:** typecheck · lint · prettier · unit groen; build via CI-poort.

## 2026-09-05 — issue #329 bij de wortel gefixt: verloren render-fase-ping in de gebundelde React

**Symptoom:** in een productiebuild bleef na een server action de knop op "Bezig…" staan terwijl de
mutatie allang was geland; het project werkte er sinds juni omheen (`e2e/_robust.ts`, watchdog in
`PendingSubmitButton`). **Diagnose (gemeten met tee op de fetch, React-root-lanes en breakpoints in de
gebundelde React):** de RSC-body komt volledig binnen, maar React's `pingSuspendedRoot` laat een ping
vallen die tijdens de render-fase binnenkomt (flight-chunk in `resolved_model` lost zijn `then`
synchroon op) terwijl de root op `RootSuspendedWithDelay` staat; de lane eindigt "suspended + warm"
zonder listener en zonder geplande render. Upstream gefixt in React `19.3.0-canary-…-20260731`
(Next 16.3); Next 15.5.24/15.5.25 bundelen nog de oude canary. **Fix:** eenregelige backport via
`patch-package` (`patches/next+15.5.24.patch`, postinstall) — gemeten 5/5 direct door, voorheen 5/6 hang.
**Borging:** `src/lib/system/react-render-phase-ping.test.ts` (bundel bevat fix, buggy pad afwezig) +
`e2e/bureau-registratie.spec.ts` activeert nu met één gewone klik in de productiebuild. ADR
[0012](docs/decisions/0012-react-render-phase-ping-backport.md). De client-side nudge-workaround uit #1377 (`ActionReplay`, `action-replay.ts`) is hiermee overbodig en
verwijderd — anders zou de e2e-regressietest een wegvallende patch niet meer kunnen zien. Vervolg (aparte
PR): `_robust.ts` terugbrengen tot herklik-zonder-reload en de 5 s-watchdog in `PendingSubmitButton`
laten vervallen.

## 2026-09-05 — routine: job-detail wijst de ZZP'er de juiste herstelactie per vereist certificaat

**Wat:** op de opdracht-detailpagina (`/opdrachten/[id]`) toonde de "Jouw aansluiting"-checklist bij een
**verlopen** vereist certificaat de actie "Toevoegen" met een link naar de certificatenlijst — terwijl de
ZZP'er dat certificaat al bezit. "Toevoegen" suggereert een tweede exemplaar aanmaken; de juiste actie bij
verval is **vernieuwen** (nieuw bewijsstuk uploaden / opnieuw verificatie aanvragen op het bestaande
certificaat). Een écht ontbrekend certificaat landde bovendien op de lijst i.p.v. direct op het
nieuw-formulier. **Waarom:** noord-ster "wat moet ik nu doen?" — de herstelactie moet kloppen én de ZZP'er
in één klik op de plek zetten waar de actie thuishoort. **Hoe:** nieuwe pure helper `credentialFixAction`
(`src/lib/credential-fix-action.ts`) mapt de certificaat-staat op de juiste actie: `missing` → "Toevoegen"
naar `/certificaten/nieuw`, `expired` → "Vernieuwen" naar `/certificaten`, `satisfied`/`inReview` → geen
actie. De job-detailpagina gebruikt de helper i.p.v. de inline "Toevoegen"-link. **Bestanden:**
`src/lib/credential-fix-action.ts` (nieuw) + `.test.ts` (5 cases, incl. regressie "verlopen ≠ Toevoegen"),
`src/app/(protected)/opdrachten/[id]/page.tsx`. **Checks:** typecheck · lint · prettier · unit groen; build
via CI-poort. **PR #1393.**

## 2026-09-05 — persona-sweep: losse factuur nummert gatenvrij per ZZP'er (Wet OB art. 35a)

**Wat:** de persona-sweep (live Playwright-smoke over 4 rollen + 2 adversariële Opus-audits op
franchise/tenant-isolatie en facturen/cascade/administratie — 0 bereikbare authz-gaten daar) vond dat de
losse-factuur-actie `createInvoice` (`/facturen/nieuw`, bereikbare UI) het factuurnummer **platform-breed**
telde: `prisma.invoice.count({ where: { number: { startsWith: `${year}-` } } }) + 1`. Gevolg: de wettelijk
vereiste **gatenvrije reeks per uitschrijvende partij** brak zodra een ánder platform-lid een losse factuur
maakte (A `2026-0001`, B `2026-0002`, A weer `2026-0003` → A's reeks mist `0002`), en alle ZZP'ers vochten
om dezelfde `number @unique`-teller (P2002-retries onder gelijktijdigheid). De cascade-flow deed dit al goed.
**Hoe:** de losse factuur deelt nu exact dezelfde atomaire per-partij-allocator als de cascade
(`allocateInvoiceNumber`, sleutel = de ZZP'er, bínnen de create-transactie); `partyInvoiceNumber` draagt het
getoonde/wettelijke nummer, `number` blijft globaal uniek via de `issuerKey:`-prefix. Omdat `number` sinds de per-partij-nummering
een `issuerKey:`-prefix (met het interne user-id) draagt, mag geen enkel scherm/notificatie/export het
rauwe `number` tonen; alle plekken lezen nu het partij-nummer via één centrale helper
`displayInvoiceNumber` (`src/lib/invoice-number.ts`). Dit dekt óók een pre-existent lek: cascade-facturen
droegen dit prefix al, dus enkele surfaces lekten het user-id al vóór deze PR.
**Bestanden:** `src/lib/invoice-number.ts` (nieuw), `src/app/(protected)/facturen/actions.ts` (+ `.test.ts`,
+4 rood→groen: gatenvrije per-partij-toewijzing, jaarprefix, send/markPaid-notificatiebody geen user-id-lek),
`.../facturen/[id]/page.tsx`, `.../facturen/export/route.ts`, `.../search/actions.ts`,
`src/lib/calendar/user-deadlines.ts`, `src/lib/franchise/roster-dossier.ts`, de twee `samenwerkingen/[id]/dossier`-
laders, `src/components/administratie/{facturen,openstaand}-panel.tsx`, `src/app/api/administratie/openstaand/route.ts`.
**Checks:** typecheck ✓ · lint ✓ · prettier ✓ · unit (8208 passed) ✓ · build (CI-poort verifieert). Backlog
bijgewerkt. **Restrisico:** oude losse facturen houden hun platform-brede `2026-XXXX` (geen `partyInvoiceNumber`),
weergave valt terug op het globale nummer; alleen nieuwe losse facturen lopen in de gatenvrije partij-reeks.

## 2026-09-05 — security/privacy: audit-CSV-export meldt truncatie (AVG art. 5(2) verantwoording)

**Wat:** de admin-audit-CSV-export (`/admin/audit/export`) capte op `AUDIT_EXPORT_CAP = 10.000` rijen
**zonder enige indicatie** dat er getrunceerd was. Een admin die de CSV als volledig audit-bewijs
presenteert bij een AVG-inspectie kon onbewust een onvolledig register tonen (art. 5(2)
verantwoordingsplicht). **Waarom nu:** geparkeerd MIDDEL uit de security-/privacy-auditronde van 5-9;
geen security-breach maar wél een compliance-valkuil in de kern-toezicht-hub. **Hoe (server-side
waarheid, drie lagen):** de route telt het `total` naast de gecapte rijen (`Promise.all(count,
findMany)`); bij `total > exported` (1) voegt `auditExportCsv` een expliciete **sluit-rij** toe die het
geëxporteerde, totale én resterende aantal noemt en aanraadt het filter te verfijnen, (2) markeert
`auditExportFilename` de bestandsnaam met `-getrunceerd`, (3) draagt de `AUDIT_LOG_EXPORTED`-auditregel
`total`+`truncated`. Het audit-paneel toont daarnaast een vooraf-waarschuwing bij de exportknop zodra het
totaal de cap overstijgt (cap verhuisd naar `audit-export.ts` als gedeelde bron — geen drift). De melding
is CSV-injectie-veilig (geen leidend formule-teken) en de export blijft byte-identiek bij een volledig
register. **Bestanden:** `src/lib/audit-export.ts` (+ `.test.ts`, +9 cases),
`src/app/(protected)/admin/audit/export/route.ts`, `src/components/admin/audit-panel.tsx`. **Checks:**
typecheck ✓ · lint ✓ · prettier ✓ · unit (audit-export: 17 passed) ✓ · build (CI-poort verifieert). **PR #1390.**

## 2026-09-05 — prod/observability: `zzp_build_info`-gauge op /api/metrics (deploy-correlatie)

**Wat:** de Prometheus `*_build_info`-conventie toegevoegd — een constante `1`-gauge
`zzp_build_info{commit,built_at}` op `GET /api/metrics`. **Waarom:** `/api/health` toont commit +
built_at al als JSON, maar dat is niet scrape-baar naast de andere gauges; zonder deze gauge kan een
dashboard/alert een regressie of metriek-verschuiving niet correleren met de exacte draaiende deploy, en
detecteert Prometheus zélf geen redeploy (`changes(zzp_build_info[…])`). Tot nu toe kende alleen de
GitHub-deploy-lag-watchdog (`monitor.yml`) de draaiende commit. **Hoe:** `buildCommit`/`buildAt` in
`MetricsInput` (pure `buildMetrics` emit een gelabelde 1-gauge via de bestaande escape-laag); de route
leest de build-metadata uit dezelfde env + normalisatie als `/api/health` (`shortCommit`/`normalizeBuiltAt`),
module-constant per proces (geen DB-read). `zzp_build_info` in `INFO_ONLY_METRICS` (bewust geen
drempel-alert) zodat de alerts-drift-gate 'm kent. Labels dragen alleen statische build-metadata — geen
PII/secret. **Bestanden:** `src/lib/observability/metrics.ts`, `.../alerts-rules.ts`,
`src/app/api/metrics/route.ts` (+ tests), `docs/RUNBOOK.md §2a`. **Tests:** labels + fallback
(`dev`/`onbekend`) + Prometheus-render (gesorteerde labels) + volledige gauge-lijst; metrics + alerts-rules
70 groen, typecheck/lint/prettier groen. **PR #1389.**

## 2026-09-05 — security/privacy: certificaat-type lekte niet meer via de publieke agenda-feed

**Wat:** een security-/privacy-auditronde (orchestrator + 3 adversariële Opus-audits op de delta sinds
`c3afae34`) vond dat PR #1386 het certificaat-**type/de vrije-tekst-titel** (bv. "VOG", "BIG") in de
**niet-intrekbare publieke bearer-agenda-feed** (`/api/agenda/feed.ics`) zette. VOG (justitieel, AVG art. 10)
en BIG (zorg, art. 9) zijn bijzondere gegevens; dat een bij naam bekende persoon zo'n certificaat houdt hoort
niet in een kanaal dat naar Google/Apple-agenda-infra synct en niet per-token in te trekken is (AVG art.
5(1)(c) dataminimalisatie · OWASP A01). **Fix (twee lagen):** het verval-event is nu generiek "Certificaat
verloopt" + generieke alarmen zónder type/titel (`deadlines.ts`), en de loader selecteert de titel niet eens
meer uit de DB (`user-deadlines.ts`, `select: {id, expiresAt}`). Wélk certificaat verloopt, opent de ZZP'er in
het geauthenticeerde dossier. **Bewust ongemoeid:** de bemiddelaar-agenda (`franchise/agenda.ts`) — sessie-
gebonden, ge-auditede, tenant-gescoopte download met legitiem need-to-know, géén bearer-feed.

**Bestanden:** `src/lib/calendar/deadlines.ts`, `src/lib/calendar/user-deadlines.ts` (+ hun tests).
**Tests:** nieuwe rood→groen-guard "noemt het certificaat-type NERGENS in de bearer-feed" + `select`-borg;
`npm run test` 8195 groen, typecheck/lint/prettier/build groen. **Rest geparkeerd** in
`docs/SECURITY-PRIVACY-BACKLOG.md` (per-token-intrekking HOOG-latent, stille CSV-truncatie MIDDEL, CSRF-adjacent
GET-export LAAG). **Volgende stap:** per-token-intrekking van de agenda-feed (schema + instellingen-UI), mens-poort.

## 2026-09-05 — slimme lege staat op /opdrachten → verbreed je zoekopdracht (ZZP'er)

**Wat:** filterde de ZZP'er de opdrachten-marktplaats op zijn eigen vakgebied (standaard AAN zodra
hij branches heeft) of op andere filters en leverde dat níks op, dan bood de lege staat alleen "Wis
alle filters" — alles-of-niets. De nuttigste zet is meestal "verbreed één ding": zijn niche is
vandaag leeg terwijl er wél ander werk is. Nu toont de lege staat tot twee één-klik-verbredingen,
elk met het exacte aantal opdrachten dat die versoepeling oplevert (bv. "Zoek in alle vakgebieden ·
12 opdrachten"). Benchmark: LinkedIn/Malt "broaden your search", maar met een echte teller vooraf.

**Hoe (server-side waarheid, geen drift):** nieuwe pure helper `buildRelaxationCandidates(f)` leidt
uit de genormaliseerde filters de zinvolle één-filter-versoepelingen af (vakgebied, certificaat-eis,
vaardigheden, werkvorm, tarief, locatie, hideApplied, zoekterm), elk als een reeds-versoepelde
`JobFilters` die precies één dimensie loslaat en de overige filters intact houdt. `rankRelaxations`
houdt alleen versoepelingen mét treffers, sorteert op meeste kansen eerst (tie-break op vaste
voorkeursvolgorde) en kapt op 2. De pagina telt elke variant met dezelfde gedeelde
`buildJobMarketplaceWhere` → het getoonde aantal is exact wat de ZZP'er ná de klik ziet. Alleen bij
écht nul treffers (`foundTotal`, volgt de inzetbaarheidsfilter) en met profiel — geen extra queries
op een gevulde lijst. `onlyEligible` (in-memory compliance, niet in de DB-where) is de uitzondering:
staat die aan, dan bieden we uitsluitend het versoepelen van `onlyEligible` zelf aan, zodat elke
telling exact blijft (de overige zouden niet-inzetbare opdrachten meetellen).

**Bestanden:** `src/lib/jobs/empty-state-relaxations.ts` (+ `.test.ts`: 15 cases — kandidaat-opbouw,
één-dimensie-relaxatie, page-reset, onlyEligible-uitzondering, rangschikking/kap),
`src/components/jobs/empty-state-suggestions.tsx` (presentatie, rendert niets zonder suggesties),
`src/app/(protected)/opdrachten/(index)/page.tsx` (wiring in de lege-staat-tak).

**Checks:** typecheck ✓ · lint ✓ · prettier ✓ · unit (empty-state-relaxations: 15 passed) ✓ · build ✓ (CI-poort verifieert).

## 2026-09-04 — certificaat-vervalkalender → abonneer op je agenda (ZZP'er)

**Wat:** de ZZP'er ziet op `/certificaten` de **vervalkalender** (`ExpiryOverviewCard`) met wat er
(bijna) verloopt, maar kon die verval-deadlines nergens in zijn eigen agenda-app zetten — terwijl de
agenda-`.ics`-feed (`/api/agenda` + `/api/agenda/feed.ics`) élk certificaat-verval al meestuurt, mét
herinneringen 30 en 7 dagen vooraf. De "abonneer op je agenda"-affordance (`AgendaSubscribe`) stond
alleen op `/samenwerkingen` en `/rooster`. Deze increment verbindt de urgentie (waar de ZZP'er 'm
voelt) met de oplossing: één klik → verval-reminders in Google/Apple Agenda, zo mist hij geen
vernieuwing.

**Hoe (klein + additief):** `AgendaSubscribe` kreeg optionele copy-props (`description`,
`privacyNote`, `downloadName`) met defaults = de huidige rooster-copy, dus de bestaande call-sites
wijzigen byte-identiek niet. `ExpiryOverviewCard` kreeg een optionele `feedPath`-prop en toont de
affordance in de kaart-header met certificaat-copy; de certificaten-pagina geeft `agendaFeedPath(actor.id)`
door (feed uit → nette download-fallback). De alarm-doorlooptijden zijn ontdubbeld naar één bron
(`CREDENTIAL_EXPIRY_ALARM_DAYS = [30, 7]` in `deadlines.ts`): de `.ics`-mapper hangt exact die alarmen
aan, en de UI-copy leest dezelfde constante via `formatDayLeadTimes` → feed en belofte lopen nooit uiteen.

**Bestanden:** `src/lib/calendar/deadlines.ts` (constant + `formatDayLeadTimes` + gebruik in mapper),
`src/lib/calendar/deadlines.test.ts` (+6 cases: invariant feed↔constante, `formatDayLeadTimes`),
`src/components/agenda/agenda-subscribe.tsx` (copy-props), `src/components/credentials/expiry-overview-card.tsx`
(`feedPath`-prop + affordance), `src/app/(protected)/certificaten/(index)/page.tsx` (wiring).

**Checks:** typecheck ✓ · lint ✓ · prettier ✓ · unit (calendar/deadlines: 19 passed) ✓ · build (CI-poort verifieert).

## 2026-09-04 — dedup: /admin/audit consolideert in de toezicht-hub (met CSV-export)

**Wat:** het audit-log was de laatste losse toezicht-route die náást de toezicht-hub bleef bestaan
(`/admin/dba`, `/admin/avg`, `/admin/bewaking` leiden al permanent om naar `/admin/toezicht?tab=…`).
`/admin/audit` bleef staan omdat de standalone-pagina een **CSV-export** had die de hub-audit-tab miste
(pakket E liet 'm daarom staan om functieverlies te voorkomen). Voor de ADMIN betekende dat twee plekken
voor hetzelfde paneel — en de export zat op de verkeerde.

**Fix (mirror van dba/avg):** de CSV-export + de "N gebeurtenis(sen)"-telling verhuizen naar het gedeelde
`AuditPanel` (nieuwe pure helper `auditExportHref` in `admin.ts` bouwt één canoniek exportpad
`/admin/audit/export`, negeert de paginering, url-encodeert de filters). Daardoor krijgt de hub-audit-tab
de export vanzelf — geen functieverlies. `/admin/audit/page.tsx` wordt nu een `permanentRedirect` via
`hubRedirectTarget("/admin/toezicht", "audit", …)` die de actie-/entiteit-/pagina-filters meeneemt, zodat
oude deeplinks/bladwijzers blijven werken. De export-route (`/admin/audit/export`, ADMIN-only) blijft; de
overbodige `loading.tsx` van de redirect-route is verwijderd. Dode `countAuditEntries` (alleen de oude
pagina gebruikte 'm; `AuditPanel` telt zelf) opgeruimd. Server-side rol-poort ongewijzigd (`requireRole`
draait vóór de redirect).

**Bestanden:** `src/lib/admin.ts` (+ `.test.ts`: +3 cases), `src/lib/hub-redirect.test.ts` (+1 case),
`src/components/admin/audit-panel.tsx`, `src/app/(protected)/admin/audit/page.tsx` (nu redirect),
`src/app/(protected)/admin/audit/loading.tsx` (verwijderd).

**Checks:** typecheck ✓ · lint ✓ · prettier ✓ · unit (admin + hub-redirect: 14 passed) ✓ · build (CI-poort verifieert).

## 2026-09-04 — prod: routing-provider hot-path time-out + transiënte retry (silent-hang-vangnet) (#1384)

**Wat:** de échte Geoapify geocode-/route-fetches (`src/lib/services/routing.ts`, `fetchJson`) op de
match-hot-path gebruikten als **enige** uitgaande productie-integratie een **kale `fetch`** — zonder
deadline en zonder retry — terwijl de routing-connectiviteitszelftest (én billing/e-mail/rate-limit/
verify) al `fetchWithTimeout` gebruikte. Een trage/hangende provider blokkeerde zo de match-request
onbeperkt (silent-hang/resource-exhaustion onder last); één transiënte 5xx/429/netwerk-blip liet de
lookup onnodig terugvallen op de haversine-schatting **én** trip de routing dead-man's-switch-heartbeat
(valse page).

**Fix (spiegelt `http-verify.ts`):** `fetchJson` deelt nu de gehardende `fetchWithTimeout` (env
`ROUTING_HTTP_TIMEOUT_MS`, al door de zelftest gebruikt, geklemd 1000–60000) en doet een **begrensde
retry-met-exponentiële-backoff** bij transiënte fouten (netwerk/time-out/5xx/429), instelbaar via
`ROUTING_HTTP_RETRIES` (geklemd 0–5, default 2). Geocode/route zijn read-only GETs → retry
idempotent-veilig; een 4xx (verkeerde sleutel) of onleesbare JSON faalt meteen. De heartbeat registreert
alleen de **einduitkomst** (één succes, of één mislukking na uitputte retries) — een blip die op de retry
herstelt laat de mislukkingen-teller niet onnodig oplopen. Inert bij `ROUTING_PROVIDER=offline` (de
pilot-default): geen provider actief, geen gedragsverandering. Server-side; geen schema/migratie/authz.

**Bestanden:** `src/lib/services/routing.ts` (+ `.test.ts`: 20 tests, incl. retry-herstel op 503,
niet-transiënte 401 zonder retry, uitgeputte 429 = één mislukking, `resolveRoutingRetries`/backoff-klem).

**Checks:** typecheck ✓ · lint ✓ · prettier --check . ✓ · unit (routing) ✓ · build (CI-poort verifieert).
