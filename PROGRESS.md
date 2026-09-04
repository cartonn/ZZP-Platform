# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## Staat van het product (2-9-2026)

- **Live:** `main` is bron van waarheid én deploy-branch; Railway deployt elke gemergde PR. Poort: 6 vereiste checks, `enforce_admins` AAN.
- **Werkt end-to-end:** opdracht → match → reactie → samenwerking → contract → urenstaat (incl. ORT) → goedkeuring → factuur → betaalregistratie → administratie/BTW. Plus certificaat-dossier met verificatie/verval, next-action-engine, DBA-monitor en tenant-cockpit voor bemiddelaars.
- **Bewust UIT (env-gestuurd, inert):** billing (`noop`), e-mail (`noop`), documentopslag (`local`, geen S3), verificatie-koppelingen DUO/BIG/iDIN (`mock`), gedeelde rate-limit-store (`memory`), web-push (geen VAPID-sleutels), aangifte-partner. Elk kanaal heeft een zelftest + aflever-heartbeat op `/admin/systeemstatus`.
- **Mensenwerk vóór livegang** (MENSENWERK.md §0): jurist-/AVG-review met echte gevoelige documenten, productie-secrets, betaalprovider, echte verificatie-API's, mailprovider, S3, eigen domein.
- **Open strategische keuze:** focus & wig — voorstel in [ADR 0011](docs/decisions/0011-focus-en-wig.md) (status: voorgesteld, eigenaarsbesluit).

## 2026-09-04 — routine: dubbele-boeking-waarschuwing op /rooster (ZZP'er)

**Wat:** de rooster-agenda (`/rooster`) toont per dag de eigen geplande diensten én de open kansen,
maar waarschuwde nergens wanneer een open kans valt op een dag waarop de ZZP'er **al is ingepland**.
Rechtstreeks claimen vanuit de kalender (`ClaimShift`) kon zo stilzwijgend tot een dubbele boeking
leiden. Nu verschijnt op elke dag met zowel een geboekte dienst áls een open kans een compacte
warning-banner ("Je bent deze dag al ingepland bij …. Controleer of een extra dienst past.") boven de
open diensten, en dezelfde tekst herhaalt in het uitgeklapte claim-formulier — precies op het
beslismoment. Benchmark: Temper/Zorgwerk waarschuwen bij roosterconflicten. Het signaal beslist niets;
claimen loopt onveranderd via `claimShift` (auth→rol→ownership→Zod→actie via de bestaande
applicatieketen). Geen dode knop, geen schema-/mutatie-oppervlak, geen i18n-woordenboekwijziging.

**Aanpak:** pure, deterministische kern in `src/lib/roster-market.ts` — `agendaDayBookingConflict(day)`
geeft `null` tenzij `booked` én `open` beide niet-leeg zijn (ontdubbelde, alfabetische opdrachtgevers +
diensttelling), en `formatBookingConflictNotice(conflict)` is de enige bron van de copy zodat dag-banner
en claim-formulier nooit driften (1 / 2 / >2 opdrachtgevers; defensieve terugval bij lege lijst). De
kalenderpagina leidt per dag het signaal af en geeft de tekst door aan `ClaimShift` (nieuwe optionele
`conflictNotice`-prop). Server-side waarheid: het conflict volgt uit de reeds-gebouwde agenda
(`buildAgenda` over PROPOSED/ACTIVE-samenwerkingen), niet uit de client.

**Bestanden:** `src/lib/roster-market.ts` (+ `.test.ts`, 9 nieuwe tests: conflictdetectie, ontdubbeling/
sortering, en de drie copy-varianten + terugval), `src/app/(protected)/rooster/page.tsx`,
`src/app/(protected)/rooster/claim-shift.tsx`.

**Checks:** typecheck / lint / unit (roster-market 44 groen) / prettier groen; build + CI-poort verifiëren.

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

## 2026-09-02 — persona-sweep run 106: legacy-loose facturatie-nudge + jaarwissel-factuurnummer

**Wat:** kritische-gebruiker-sweep (orchestrator Opus 4.8 + 3 parallelle adversariële Opus-audits op
niet-overlappende oppervlakken: authz/IDOR/tenant · next-action-engine · financiële/cascade-math). De
authz/IDOR/tenant-audit vond **0 bereikbare gaten**. Twee defecten gedicht:

1. **DOEL 1b — MISSING next-action (server-side waarheid):** `getBillingReadiness` (facturatie-
   gereedheid-nudge, #1324) scoopte zijn bewijs-query op `issuerUserId: userId` alléén. Die kolom zet
   alleen de cascade-handler (`null` = platform-fee/legacy), dus een ZZP'er met een legacy loose-factuur
   (issuerUserId null, samenwerking wél van hem) kreeg de art. 35a-btw-id/IBAN-nudge **nooit** — precies
   zijn doelpopulatie. Zelfde kolom-scope-bug als al 3× elders gedicht (`freelancer-stats.ts`, run 79).
   **Fix:** `OR: [{ issuerUserId }, { collaboration: { freelancer: { userId } } }]` + deterministische
   `orderBy`. +2 regressietests.
2. **DOEL 2 — jaarwissel-factuurnummer (juridisch nummer):** het jaarprefix gebruikte
   `new Date().getFullYear()` (server-UTC) i.p.v. de Amsterdamse burgerlijke kalender, op de cascade- én
   losse-factuur-flow. Op de UTC-server valt 31 dec 23:15 UTC = 1 jan Amsterdam → de eerste
   nieuwjaarsfactuur kreeg het oude jaarprefix terwijl haar `issuedAt` al het nieuwe jaar is. **Fix:**
   `fiscalYearOf(new Date())` op beide call-sites. +1 jaarwissel-regressietest (`→ "2027-0001"`).

**Bestanden:** `src/lib/data/freelancer-billing-readiness.ts` (+ `.test.ts`),
`src/lib/cascade/invoice-commands.ts`, `src/app/(protected)/facturen/actions.ts` (+ `actions.test.ts`),
`docs/PERSONA-SWEEP-BACKLOG.md`.

**Tests:** billing-readiness (9) + facturen/actions (34) groen — rood→groen op de nieuwe logica.
typecheck/lint/test/build/prettier groen. **Geparkeerd (nit):** `kor-projection.ts` rekent intern nog
UTC i.p.v. `fiscalYearOf` — gemaskeerd in de UI (zie backlog).

## 2026-09-02 — security/privacy: brute-force-rem op her-authenticatie + herstel-drill PII-teardown

**Wat:** security-/privacy-auditronde (orchestrator + 3 parallelle adversariële Opus-audits op niet-
overlappende oppervlakken; cross-tenant/franchise, document-privacy/erasure en injectie/SSRF/secrets alle
CLEAN). Twee HOOG-bevindingen gedicht:

1. **Ontbrekende rate-limit op her-authenticatie (CWE-307 / OWASP A07).** `changePassword` en
   `disableTwoFactor` toetsten het live wachtwoord via `bcrypt.compare` zonder rem (login heeft er wél één).
   Een aanvaller met een geldige (gestolen) sessie kon het wachtwoord — en bij disable de 6-cijferige TOTP —
   ongelimiteerd raden → account-overname / 2FA strippen. **Fix:** nieuwe `reauthRateLimiter` (default 5/15
   min, gekeyd op `actor.id`) in beide acties vóór de bcrypt-check; audit `AUTH_RATE_LIMITED` bij trip; reset
   op (volledig) succes. `REAUTH_RATE_LIMIT` toegevoegd aan CI + `.env.example`.
2. **Herstel-drill (#1322) liet een volledige PII-schaduwkopie staan (AVG art. 5(1)(c)/5(1)(e)/32).** De drill
   herstelde een volledige productie-back-up in een wegwerp-DB en ruimde die nooit op. **Fix:** pure
   `buildScratchTeardownArgs` + `tearDownScratch()` die ná de verificatie **altijd** het `public`-schema dropt.

**Bestanden:** `src/lib/rate-limit.ts`, `src/app/(protected)/account/wachtwoord/actions.ts` (+ nieuw
`actions.test.ts`), `src/app/(protected)/account/tweestapsverificatie/actions.ts` (+ test),
`src/lib/ops/db-backup.ts` (+ test), `scripts/backup-restore-drill.ts`, 3× `.github/workflows/*.yml`,
`.env.example`, `docs/RUNBOOK.md`, `MENSENWERK.md`, `docs/SECURITY-PRIVACY-BACKLOG.md`.

**Tests:** `account/wachtwoord/actions.test.ts` + `account/tweestapsverificatie/actions.test.ts` (17 groen),
`db-backup.test.ts` (49 groen) — alle rood→groen op de nieuwe logica. typecheck/lint/test/prettier groen.

**Geparkeerd (mensenwerk, infra):** `DRILL_DATABASE_URL` moet naar een wegwerp-Postgres met productie-
gelijkwaardige beveiliging wijzen (het retentievenster is in code gedicht; de scratch-vertrouwelijkheid is
infra). Zie backlog + RUNBOOK §5.
