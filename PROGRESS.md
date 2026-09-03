# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## Staat van het product (2-9-2026)

- **Live:** `main` is bron van waarheid én deploy-branch; Railway deployt elke gemergde PR. Poort: 6 vereiste checks, `enforce_admins` AAN.
- **Werkt end-to-end:** opdracht → match → reactie → samenwerking → contract → urenstaat (incl. ORT) → goedkeuring → factuur → betaalregistratie → administratie/BTW. Plus certificaat-dossier met verificatie/verval, next-action-engine, DBA-monitor en tenant-cockpit voor bemiddelaars.
- **Bewust UIT (env-gestuurd, inert):** billing (`noop`), e-mail (`noop`), documentopslag (`local`, geen S3), verificatie-koppelingen DUO/BIG/iDIN (`mock`), gedeelde rate-limit-store (`memory`), web-push (geen VAPID-sleutels), aangifte-partner. Elk kanaal heeft een zelftest + aflever-heartbeat op `/admin/systeemstatus`.
- **Mensenwerk vóór livegang** (MENSENWERK.md §0): jurist-/AVG-review met echte gevoelige documenten, productie-secrets, betaalprovider, echte verificatie-API's, mailprovider, S3, eigen domein.
- **Open strategische keuze:** focus & wig — voorstel in [ADR 0011](docs/decisions/0011-focus-en-wig.md) (status: voorgesteld, eigenaarsbesluit).

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

## 2026-09-01 — routine: proactieve facturatie-gereedheid-next-action (ZZP'er)

**Wat:** de wettelijke factuur-compliancekaart (`invoice-legal.ts` → `InvoiceComplianceCard`) toetste alleen
één reeds-geopende factuur (reactief). Een ZZP'er wiens profiel het btw-id of de IBAN mist, ontdekte dat pas
per factuur — terwijl in de cascade elke goedgekeurde prestatie automatisch een factuur wordt. Zonder btw-id
gaat élke uitgaande factuur juridisch onvolledig (art. 35a Wet OB) de deur uit; zonder IBAN kan de opdrachtgever
niet betalen. Er was geen proactieve, profiel-brede nudge.

**Aanpak:** nieuwe pure `assessBillingReadiness` (`src/lib/billing-readiness.ts`) leunt op
`assessInvoiceCompliance` als énige bron van waarheid voor de btw-eis (synthetische factuur met alle niet-
profielvelden voldaan; alleen het profiel-herstelbare, verplichte btw-punt telt) en voegt IBAN toe (betaalbaarheid,
regime-onafhankelijk). Loader `getBillingReadiness` (`src/lib/data/freelancer-billing-readiness.ts`) is
**evidence-based**: één eigenaar-gescopete query over de dáádwerkelijk uitgeschreven facturen (`issuerUserId` +
`issuedAt` gezet) bepaalt of er wordt gefactureerd én of er btw wordt geheven — een KOR/EXEMPT-ondernemer krijgt
zo nooit een valse art. 35a-melding, en wie nog niet factureert geen ruis. Gewired als next-action
`billingProfileTask` (`P.billingProfileIncomplete = 47`: onder het acute geld-/deadline-cluster, boven relatie-/
compleetheidsnudges) in de ZZP'er-tak van `pendingTasks`; deep-link (`resolver: "link"`) naar `/profiel/bewerken`.
`getCompletenessProfile` laadt nu ook `btwNumber`/`iban` (gedeelde request-cache, geen extra query voor het profiel).

**Bestanden:** `src/lib/billing-readiness.ts` (+ `.test.ts`, 8), `src/lib/data/freelancer-billing-readiness.ts`
(+ `.test.ts`, 8), `src/lib/actions/tasks.ts` (`billingProfileTask` + union), `src/lib/actions/tasks.billing-profile.test.ts`
(4), `src/lib/next-actions.ts` (prioriteit), `src/lib/actions/pending-tasks.ts` (emit),
`src/lib/data/freelancer-profile.ts` (selects). Read-only afgeleid, geen schema-/mutatie-/authz-oppervlak, geen dode knop.

**Checks:** typecheck ✓, lint ✓, unit (732 files / 7659 groen; +20 nieuw) ✓, build ✓, prettier ✓. CI-poort verifieert.

## 2026-09-01 — security/privacy: MENSENWERK.md inverteerde welke PII-retentie live is (AVG art. 5(2)/5(1)(e))

**Wat:** sinds #1308 (2026-08-31) staan de PII-retentievensters fail-safe AAN (lege env ⇒ actieve
verwijdering op het beloofde venster: audit 365d, lead 365d, notificatie 180d, reactie 28d, support 365d,
mail-intake 180d, health-IP 90d). `MENSENWERK.md` — het document waarop de eigenaar/FG leunt om te weten
wat al live is — werd door #1308 niet bijgewerkt en bleef beweren dat retentie "standaard UIT / onbeperkt
bewaren" is en "zolang het leeg blijft verandert er niets". Dat inverteert de waarheid over welke
onomkeerbare PII-verwijdering in productie draait (verantwoordingsplicht, AVG art. 5(2)). Zes stil-wissende
retentie-env's ontbraken bovendien volledig uit de env-var-tabel.

**Aanpak:** de vier stale secties (auditlog-blok, env-tabelrij, audit-/reactie-/notificatie-/lead-gauges)
herschreven naar de fail-safe-AAN-waarheid met #1308-referentie; env-tabel gecorrigeerd + 6 ontbrekende
rijen toegevoegd; de twee kruisverwijzingen die auditlog nog bij "default UIT" schaarden ontkoppeld
(berichten/webhook blijven correct als de énige bewust default-UIT vensters). Durable regressietest
`src/lib/mensenwerk-retention-docs.test.ts` klinkt de doc vast aan de `config.ts`-defaults (rood→groen).

**Bestanden:** `MENSENWERK.md`, `docs/SECURITY-PRIVACY-BACKLOG.md`,
`src/lib/mensenwerk-retention-docs.test.ts` (nieuw, 4 tests). Audit A/B/C-oppervlakken (IDOR/tenant op
41 api-routes + 50+ server actions, PII/SSRF/logs, erasure/retentie) CLEAN.

## 2026-09-01 — prod: back-up herstel-drill (bewijst dat een dump écht herstelbaar is)

**Wat:** de back-up (`scripts/backup-db.ts`) verifieerde alléén de inhoudsopgave (`pg_restore --list`,
TOC) — dat bewijst een leesbare kop, niet een volledig herstelbare dump (corrupte/afgekapte object-data
passeert de TOC-check en faalt pas op een echt herstel). "Een onbeproefde back-up is geen back-up" was
zo half ingevuld.

**Aanpak:** nieuw `db:restore-drill` (`scripts/backup-restore-drill.ts`) herstelt de nieuwste back-up in
een **wegwerp scratch-database** (`DRILL_DATABASE_URL`) en leest daarna schema (`public`-tabellen) + data
(rijen in een verificatietabel, default `User`) terug. Pure kern in `src/lib/ops/db-backup.ts`:
`selectLatestBackup`, `assertDrillTarget` (weigert hard het bron-doel — géén `--force`-ontsnapping),
`assertSafeIdentifier` (injectie-veilige tabelnaam), `buildPublicTableCountArgs`/`buildRowCountArgs`,
`parsePsqlCount`, `interpretDrill`. Inert lokaal/zonder scratch-DB (heldere fout, raakt niets).

**Bestanden:** `src/lib/ops/db-backup.ts` (+ `.test.ts`, +9 nieuwe testblokken → 47 tests groen),
`scripts/backup-restore-drill.ts`, `package.json` (script), `.env.example` (`DRILL_DATABASE_URL`/
`DRILL_VERIFY_TABLE`), `docs/RUNBOOK.md` §5, `MENSENWERK.md` §1b. Resterend mensenwerk: een lege
wegwerp-Postgres + `DRILL_DATABASE_URL` zetten; periodiek draaien.

## 2026-09-01 — routine: kilometervergoeding is de enige aftrekpost bij een reiskosten-rit (server-side)

**Wat:** een REISKOSTEN-uitgave kon zowel een handmatig `netCents` (werkelijke autokost) als
`kilometers` opslaan. De vaste kilometervergoeding (€ 0,23/km, 0% btw) hóórt de werkelijke autokosten te
_vervangen_, niet te stapelen (fiscaal kies je één methode). De UI leidde het bedrag al uit de km af,
maar de server — de bron van waarheid — dwong dit niet af: via een bewerkt net-veld, bulk of API kon
het geboekte bedrag (winst/IB) de rittenregistratie/km-aftrek voor dezelfde rit tegenspreken.
(Geparkeerde nit persona-sweep run 103.)

**Aanpak:** één `.transform` in `expenseSchema` (`src/lib/expense.ts`, de bron van waarheid → elk
call-punt normaliseert gelijk) maakt km gezaghebbend: bij `category === "REISKOSTEN"` met vastgelegde
`kilometers` wordt `netCents = mileageExpenseNetCents(km)` en `vatCents = 0`. De transform staat vóór de
"> € 0"-refine, zodat een km-rit met een leeg nettoveld het afgeleide bedrag krijgt en de refine haalt.
`createExpense` consumeert de genormaliseerde schema-output ongewijzigd → grootboek + audit boeken het
afgeleide bedrag, dat per constructie samenloopt met `summarizeMileage` (canoniek uit km). De UI
(`uitgaven-form.tsx`) zet netto/btw/tarief op alleen-lezen zodra een rit is ingevuld, met een uitleg,
zodat de wederzijdse uitsluiting zichtbaar is (geen "getypt bedrag verdwijnt"-verrassing).

**Bestanden:** `src/lib/expense.ts` (+ `.test.ts`, +4 schema-tests),
`src/components/administratie/uitgaven-form.tsx`,
`src/app/(protected)/uitgaven/actions.test.ts` (+1 action-regressietest). Backlog-nit → OPGELOST.

**Checks:** typecheck ✓, lint ✓, unit (7600+ groen; +5 nieuwe) ✓, build ✓, prettier ✓. CI-poort verifieert.

## 2026-09-01 — persona-sweep run 105: KOR-meter jaarwisseling-regressie (jaar én kwartaal uit dezelfde Amsterdamse instant)

**Wat:** het "ontzorgd"-dashboard van de ZZP'er (voedt de KOR-omzetgrensmeter) bepaalde het fiscale
jaar met `getUTCFullYear()` terwijl het kwartaal Amsterdams (`fiscalQuarterOf`) werd bepaald — een
regressie t.o.v. de vandaag gemergde fiscale-kalender-consolidatie (#1318). Op een UTC-server viel rond
de jaarwisseling (`31 dec 23:00–24:00 UTC` = `1 jan 00:00–01:00` Amsterdam) het jaar niet meer samen met
het Amsterdamse kwartaal; `annualSummary`/`vatReturn` filteren intern op `fiscalYearOf` → de meter laadde
de omzet van het oude jaar en kon een vals "KOR-grens genaderd"-alarm geven op nieuwjaarsochtend. Zelfde
root cause in `ontzorgd-panel.tsx`: de urencriterium-aggregatie gebruikte UTC-kalenderjaargrenzen.

**Aanpak:** `year = fiscalYearOf(input.now)` in `ontzorg-overview.ts` (jaar én kwartaal uit dezelfde
Amsterdamse instant); de panel-urenaggregaties op de halfopen `[yearStartInstant(fy), yearStartInstant(fy+1))`-
grenzen (spiegelt `taxYearRange`/`annualSummary`). Gevonden door de adversariële financiële-audit; de
authz/IDOR/tenant- én next-action-audits vonden 0 bereikbare gaten in de nieuwste oppervlakken.

**Bestanden:** `src/lib/tax/ontzorg-overview.ts` (+ `.test.ts`, +1 regressietest rood→groen),
`src/components/administratie/ontzorgd-panel.tsx`, `docs/PERSONA-SWEEP-BACKLOG.md`.

**Checks:** prettier ✓, typecheck/lint/unit/build verifieert (CI-poort leidend).

## 2026-09-01 — routine: fiscale periode-indeling consistent in Europe/Amsterdam

**Wat:** de fiscale rapportages (BTW per kwartaal, jaaroverzicht/IB, km-aftrek per jaar, platform-
kwartaaloverzicht) deelden een boeking (`occurredAt`) in een periode in met een mix van lokale
`getFullYear()`/`getMonth()` en `getUTCFullYear()` — nooit in Europe/Amsterdam. De Nederlandse fiscale
kalender loopt op de burgerlijke dag in NL-tijd. Op een UTC-server (Railway) landde een boeking gemaakt
vlak na middernacht NL-tijd daardoor één dag/periode te vroeg (bv. 1 jan 00:30 Amsterdam = 31 dec 23:30
UTC → verkeerd BTW-kwartaal/belastingjaar), en de rapportagefamilies konden onderling verschillen. De
trend-modules (`revenue.ts`, `expense-trend.ts`, …) groepeerden al wél in Europe/Amsterdam; deze familie
week daarvan af (geparkeerde nit persona-sweep run 104).

**Aanpak:** één bron van waarheid `src/lib/administration/fiscal-calendar.ts` — pure helpers die jaar/
kwartaal/maand van een `Date` in Europe/Amsterdam bepalen (`fiscalYearOf`/`fiscalQuarterOf`/`fiscalMonthOf`)
plus query-grenzen als UTC-instant (`quarterStartInstant`/`yearStartInstant`/`amsterdamCivilDayStart`/
`amsterdamCivilDayMs`, offset-correct over wintertijd +1 én zomertijd +2). Alle periode-indeling
(`overview.ts`, `platform-overview.ts`, `expense.ts`, `expense-mileage.ts`) en de deadline-modules
(`vat-deadline.ts`, `income-tax-deadline.ts` — `previousQuarter`/`vatQuarterRange`/`taxYearRange`/
`wholeDaysUntil`) leunen erop. De pure classifier en de query-grenzen blijven exact consistent, zodat een
DB-gescopete set precies de entries bevat die de pure berekening ziet (self-consistency-test).

**Bestanden:** `src/lib/administration/fiscal-calendar.ts` (nieuw) + `.test.ts`,
`src/lib/administration/{overview,platform-overview,vat-deadline,income-tax-deadline}.ts`,
`src/lib/expense.ts`, `src/lib/expense-mileage.ts`, en de bijbehorende tests (boundary-regressies +
data-layer-grenzen bijgewerkt naar de Amsterdam-instanten). Backlog-nit → OPGELOST.

**Checks:** typecheck ✓, lint ✓, unit (7600+ groen; +19 nieuwe/aangepaste fiscale-kalender-tests) ✓,
prettier ✓. Build/CI-poort verifieert.

## 2026-09-01 — persona-sweep run 104: dienst-overname-beslistaak + nav-badge verdwijnen op een terminale/bevroren inzet

**Wat:** een OPEN dienst-overname-aanvraag (`ShiftHandoff`) bleef eeuwig als beslis-taak (`/acties`
bemiddelaar + admin, dashboard-rail, sidebar-badge) én nav-badge hangen nadat de bijbehorende samenwerking
terminaal (CANCELLED/COMPLETED) of bevroren (dispuut) werd — recht tegen de server-side status in en
cross-surface inconsistent. Zelfde bugklasse als run 103 (`job.status`-scope op de kandidaat-taken).

**Aanpak:** displayqueries scoopten alleen op `ShiftHandoff.status: "OPEN"`, niet op de
parent-`collaboration.status`, terwijl niets de OPEN-aanvraag sluit bij een collab-transitie
(`cancelCollaboration`/auto-completion/`openDispute`). `collaboration: { status: "ACTIVE", disputedAt: null }`
toegevoegd aan `pending-tasks.ts` (franchiser + admin) en `signals.ts` (`openHandoffs` + `openAdminHandoffs`),
spiegelt de sibling-queries (`endingCollabs`, `openDiensten`) die al parent-gescoped waren. Na een
**agent-review-BLOCK** ook de derde surface meegenomen: het gedeelde governance-scherm
(`ShiftHandoffGovernanceScreen`) waar badge/taak náár linken haalde OPEN-handoffs óók ongescoped op
(moot-aanvraag zichtbaar mét werkende approve/reject-formulieren). Zelfde collab-scope op
`governance-screen.tsx` + een **server-side guard** in `loadDecidableHandoff` die een beslissing op een
terminale/bevroren inzet hard weigert (ná de tenant-poort → geen CWE-203-oracle).

**Bestanden:** `src/lib/actions/pending-tasks.ts`, `src/lib/signals.ts`,
`src/components/shift-overname/governance-screen.tsx`, `src/app/(protected)/admin/shift-overnames/actions.ts`,

- tests (`pending-tasks.shift-handoff.test.ts`, `signals.shift-handoff-collab-scope.test.ts` [nieuw],
  `governance-screen.test.tsx`, `oracle.test.ts` — samen +12, rood→groen). Backlog bijgewerkt
  (1 latente tijdzone-nit geparkeerd). Gate groen (typecheck/lint/unit/build/prettier).

## 2026-09-01 — security: tweede-factor-challenge vereist om 2FA uit te zetten (OWASP ASVS 2.8)

**Wat:** `disableTwoFactor` her-authenticeerde alleen met het accountwachtwoord — het uitschakelen van
2FA (secret + álle herstelcodes in één transactie gewist) vereiste géén tweede-factor-challenge. Een
uitgelekt/hergebruikt/gephisht wachtwoord kon dus in z'n eentje de beveiligingslaag strippen, precies de
laag die het account beschermt als het wachtwoord uitlekt. Best practice bij GitHub/Google is een
factor-challenge vóór het verwijderen van de factor. (Geparkeerde security-nit uit persona-sweep run 103.)

**Fix:** een account met 2FA aan moet nu — náást het wachtwoord — een geldige TOTP-code of ongebruikte
herstelcode invoeren om 2FA uit te zetten. De verificatie loopt via **dezelfde replay-veilige poort als
de login**: de module-private `verifySecondFactor` uit `authorize-credentials.ts` is verbatim geëxtraheerd
naar `src/lib/two-factor/verify-second-factor.ts` (één bron van waarheid; login rewired als pure
import-swap, gedrag ongewijzigd). Zo erft de disable-challenge exact de TOTP-replay-preventie (atomaire
high-water-mark `updateMany`, TOCTOU-safe), het eenmalige herstelcode-verbruik en de audit-reden. De
factor wordt geverifieerd vóór enige schrijfactie; faalt hij, dan blijft 2FA aan.

**Bestanden:**

- `src/lib/two-factor/verify-second-factor.ts` — nieuwe gedeelde poort (`verifySecondFactor`, met
  optionele `context`-audit-metadata) + `verify-second-factor.test.ts` (8 tests: TOTP/replay/decrypt-fout/
  herstelcode/context).
- `src/lib/authorize-credentials.ts` — lokale functie verwijderd; import + call rewired (behoud van gedrag).
- `src/app/(protected)/account/tweestapsverificatie/actions.ts` — disable-schema `token`, findUnique-select
  uitgebreid, factor-gate vóór de transactie.
- `src/app/(protected)/account/tweestapsverificatie/two-factor-panel.tsx` — verificatiecode-veld op OnPanel.
- `src/app/(protected)/account/tweestapsverificatie/actions.test.ts` — disable-tests: factor geëist,
  mislukte factor gate't uitschakeling, geen DISABLED-audit bij mislukking.
- `docs/PERSONA-SWEEP-BACKLOG.md` — geparkeerde nit → OPGELOST.

**Checks:** typecheck ✓, unit (verify-second-factor 8/8 + tweestapsverificatie-actions + authorize-credentials
groen) ✓, lint ✓, build ✓, prettier ✓. CI-poort verifieert.
