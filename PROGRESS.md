# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## 2026-09-09 — prod: request-body begrensd op de resterende body-lezende API-endpoints (CWE-400)

**Wat:** `readLimitedText` (gestreamde body-grens) sloot het onbegrensd-bufferen op de vier publieke
body-lezende endpoints (`/api/client-error`, `/api/csp-report`, `/api/billing/webhook`,
`/api/mail-intake/webhook`). Drie andere body-lezende endpoints lazen de body nog via een onbegrensd
`request.json()`, dat de VOLLEDIGE stream (óók chunked, zónder Content-Length) in het geheugen buffert
vóór er een grens geldt: `push/subscribe` + `push/unsubscribe` (sessie-auth, **geen rate-limit** → een
ingelogde actor kon arbitrair grote bodies loopen) en `backups/heartbeat` (Bearer CRON_SECRET). CWE-400.

**Aanpak (hergebruik, geen duplicatie):** één gedeelde helper `readLimitedJson(request, maxBytes)` in
`src/lib/http/read-limited-text.ts` (leunt op `readLimitedText` + `JSON.parse`, retourneert de geparste
waarde of `null` bij te groot/onleesbaar/leeg/onparseerbaar). De drie endpoints lezen nu via die helper met
een eigen krappe grens (subscribe 8 KB, unsubscribe 4 KB, heartbeat 1 KB); gedrag bij een geldige body
identiek (`null` mapt op het bestaande faalpad: 400 bij push, "kale ping = geslaagd" bij de heartbeat).
**Bestanden:** `src/lib/http/read-limited-text.ts` (+ `.test.ts`: 5 nieuwe `readLimitedJson`-tests — geldige
JSON, leeg→null, onparseerbaar→null, byte-grens vóór parsen, chunked-oversize zonder Content-Length),
`src/app/api/push/subscribe/route.ts`, `src/app/api/push/unsubscribe/route.ts`,
`src/app/api/backups/heartbeat/route.ts`. **Checks:** typecheck ✓ · lint ✓ · unit (15/15 helper) ✓ ·
prettier ✓ · build + CI-poort verifiëren (PR #1446).

## 2026-09-09 — security/privacy: auditronde 5 — 0 nieuwe exploiteerbare gaten, 0 privacy-defecten (basis @ 271ea20c)

**Wat:** 5e volledige security-/privacy-auditronde. Orchestrator (Opus 4.8) + 3 parallelle adversariële
Opus-audits op niet-overlappende oppervlakken: **A** API-routehandlers (IDOR/authz/cross-tenant/cron/webhook/
agenda-feed), **B** server-action-mutaties (auth→rol→ownership→Zod→audit, mass-assignment, statusovergangen,
cross-tenant writes), **C** privacy/AVG (minimalisatie/erasure/PII-in-logs/k-anon/derden) + injectie (CSV/XSS/
ICS/PDF/SQL). Orchestrator-sweep: `npm audit --omit=dev` (0 vulns), getrackte secrets (leeg), raw-SQL (alleen
parameterloze probes), `dangerouslySetInnerHTML` (1× nonce-gated thema-script), erasure-dekkingspoort 5/5 groen.

**Resultaat:** GEEN nieuw exploiteerbaar security-gat en GEEN nieuw privacy-defect — de delta sinds ronde 4
(#1438–#1444) is puur robuustheid/geld-correctheid, geen nieuwe mutatie/authz-pad/PII-oppervlak. Alle eerder
geharde patronen bevestigd met file:line-bewijs (ownership vóór byte-uitgifte, anti-oracle-404 CWE-203,
timing-safe cron/webhook, TOCTOU-safe compound-writes, tenant-scoping, `escapeCsvField` overal). FYI-note
(geen blocker): `approveSubmittedPerformancesAction` scopet fail-**closed** ook voor ADMIN — mogelijk product-
gat, geen security-gat. **Bestanden:** `docs/SECURITY-PRIVACY-BACKLOG.md` (ronde-5-entry), `PROGRESS.md`.
**Checks:** typecheck ✓ · lint ✓ · unit ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (docs-only PR).

## 2026-09-09 — robuustheid: CSV-uren zonder float-artefact + ongeguarde ortSegments-parse gehard (/prestaties + /diensten)

**Wat:** twee geïsoleerde robuustheidsfixes in de export/query van `/prestaties` (bemiddelaar/admin) en
`/diensten` (ZZP'er). (1) De CSV-"Uren"-kolommen (`Uren`, `Reguliere uren`, `ORT-uren`) renderden uren met
een kale `Number.toString()`: een som van sub-kwartier-uren expandeert in IEEE-754 (`4,1 + 2,2 =
6,300000000000001`, `0,1 + 0,2 = 0,30000000000000004`) en lekte die staart in een export die juist tegen
een loonstrook wordt afgestemd (het scherm toont wél netjes via `toLocaleString`). **Geld ongemoeid** — de
factuur rondt per segment in integer-centen. (2) `JSON.parse(p.ortSegments)` stond ongeguard in beide
lezers, terwijl élke andere lezer van die kolom (`ort.ts` `parseOrtSegments`, `performance-pdf.ts`) een
try/catch-parser gebruikt: één corrupte rij liet de héle `/prestaties`/`/diensten`-pagina crashen i.p.v.
alleen die ene rij.

**Aanpak (hergebruik, geen duplicatie):** `fmtHours` rondt nu op honderdsten af
(`(Math.round(hours*100)/100).toString().replace(".", ",")`) en de kale "Uren"-kolom (`X.hours.toString()`)
loopt door diezelfde `fmtHours`; de ongeguarde parse is vervangen door de canonieke `parseOrtSegments`
(stille `[]`-terugval — downstream `hasOrt`/`summarizeOrtBreakdown` handelen `[]` al correct af). Ongebruikte
`OrtSegment`-import verwijderd. **Bestanden:** `src/lib/prestaties.ts`, `src/lib/diensten.ts` (+ beide
`.test.ts`: float-artefact-regressie op alle drie de uren-kolommen; corrupte-rij → geen throw, `hasOrt=false`,
terugval op uren×tarief). **Checks:** typecheck ✓ · lint ✓ · unit (prestaties+diensten 54) ✓ · full unit +
build + prettier + CI-poort verifiëren.

## 2026-09-08 — bemiddelaar: /franchise/diensten-vulbaarsignaal telt vakantie-afwezige vakmens niet meer als "vrij" (drift met capaciteitstegel)

**Wat:** `computeDienstFill` (`src/lib/franchise/dienst-fill-signal.ts`) — het "vrij inzetbaar"-vulbaarsignaal
per open dienst op `/franchise/diensten` — telde een roster-vakmens die NU op vakantie/verlof is (lopend
`AvailabilityWindow` type `UNAVAILABLE` dat `now` dekt) mee als vrij inzetbaar. De roster-capaciteitstegel
op `/franchise/zzpers` (`isIdleReady` mét `unavailableNow`) sluit diezelfde vakmens juist uit. Beide
oppervlakken claimen in hun eigen comments expliciet "dezelfde definitie", maar spraken elkaar tegen: de
lijst toonde een groene "X geschikte vakmensen vrij"-chip (en de acute-triage rekende de dienst als
`fillableNow`) voor iemand die het voordracht-scherm (`detectUnavailability`) meteen als afwezig markeert
— een verspilde voordraag-ronde, precies wat de `unavailableNow`-guard moet voorkomen. De benodigde
`availabilityWindows` werden al geladen in `ROSTER_SELECT` maar niet gebruikt voor de idle-check.

**Aanpak (hergebruik, geen duplicatie):** `unavailableNow` afleiden uit `awayUntil(f.availabilityWindows,
now) != null` (de canonieke bron uit `src/lib/availability.ts`, zelfde helper als de export-route) en
meegeven aan `isIdleReady` — pariteit met de tegel. `now`-semantiek behouden (het signaal is "kan ik dit
NU vullen"), geen scope-creep richting dienst-startdatum. **Bestanden:** `src/lib/franchise/dienst-fill-signal.ts`,
`src/lib/franchise/dienst-fill-signal.test.ts` (+2 tests, rood→groen: op-vakantie → idle 0/ready 0;
venster voorbij → idle 1/ready 1). **Checks:** typecheck ✓ · lint ✓ · unit (full 8486) ✓ · build ✓ ·
prettier ✓ · CI-poort verifiëren.

> **Genoteerd voor een aparte run (niet in deze PR):** een cascade-audit vond een MED-kandidaat — uren met
> meer dan twee decimalen passeren `validatePerformanceForm`/`assertPerformanceWithinLimits` (alleen
> finite/positief/max, geen 2-decimaal-stap) en worden in `hoursTimesRateCents` op honderdsten
> geherkwantiseerd, wat de gefactureerde hoeveelheid met een cent kan laten afwijken van de getoonde uren.
> Raakt de beschermde administratie-motor (`hourly-cents.ts`, grenst aan #1440) → aparte,
> mensenwerk-review-waardige fix.

## 2026-09-08 — verval-cron onderdrukt valse "vernieuw"-nudge op gedekte/superseded certificaten

**Wat:** de nachtelijke verval-cron (`runExpiryTask`, `src/lib/expiry-task.ts`) laadde enkel VERIFIED-
certificaten die binnen 30 dagen verlopen en was — anders dan élk lees-oppervlak — **niet
dekking-/superseded-bewust**. Elke lezer (de `/certificaten`-badge `signals.ts`, `/acties`
`pending-tasks.ts`, de roster `rosterExpiringByProfile`) onderdrukt bewust een "vernieuw dit
certificaat"-nudge zodra het type al gedekt wordt door een ander nu-geldig VERIFIED-certificaat
(zie `supersededVerifiedCredentialIds`/`coveredCredentialTypes` in `credentials.ts`). De cron sprak
die surfaces tegen: een ZZP'er met bv. VOG #A (verloopt over 12 dagen) én VOG #B (geldig tot 2027)
kreeg een "verloopt binnenkort — vernieuw het op tijd"-notificatie op #A, precies de valse melding die
de rest van het platform juist wegfiltert. De cron kón #B niet eens zien (het valt buiten het
30-dagen-scanvenster). Server-side-waarheid dus intern tegenstrijdig (CLAUDE.md regel 1).

**Aanpak (hergebruik, geen duplicatie):** twee-staps-load die exact `summarizeRosterExpiringSoon`
(`data/roster-expiry.ts`) spiegelt — na de kandidaat-scan het VOLLEDIGE VERIFIED-dossier van de
kandidaat-profielen laden (óók langer-geldige/onbeperkte dekkers buiten het venster) en **per profiel**
(cross-profiel dekt niet) `supersededVerifiedCredentialIds` + `coveredCredentialTypes` berekenen.
Herinnerings-pad: superseded ids op plan-niveau uit `toRemind` gefilterd (de bestaande VERIFIED-
herlezing/TOCTOU, dedup-marker en `reminded`-telling volgen vanzelf). Verloop-pad: de EXPIRED-flip +
audit blijven de volledige geflipte set (de overgang gebeurt echt; badges leunen op de status), alleen
de "verlopen, vernieuw het"-**notificatie** wordt onderdrukt als het type al gedekt is — consistent met
`coveredCredentialTypes`. Geen wijziging aan de pure `planExpiryRun` of `credentials.ts`. **Bestanden:**
`src/lib/expiry-task.ts`, `src/lib/expiry-task.test.ts` (+5 tests: superseded → geen herinnering,
verschillende types → wél, cross-profiel geen valse dekking, verlopen+gedekt → flip zonder melding,
verlopen+ongedekt → wél melding; harness leest nu `type`/`freelancerProfileId` en honoreert het
`freelancerProfileId`-filter). **Checks:** typecheck ✓ · lint ✓ · unit (full 8484) ✓ · build + CI-poort
verifiëren · prettier ✓.

## 2026-09-08 — prod: single-flight coalescing op de gezondheids-probes (/api/health + /api/readiness, pool-uitputting-amplificatie)

**Wat:** de twee publieke, ongeauthenticeerde gezondheids-endpoints (`/api/health` liveness, `/api/readiness`
readiness) doen elk een echte DB-round-trip (`SELECT 1`, en readiness ook `prisma.user.count()`). Ze zijn
bewust ongeauth (`route-guards`) zodat de load balancer/orchestrator ze zonder sessie kan pollen, maar ze
hadden — anders dan élk ander werk-doend publiek endpoint — geen rem op gelijktijdigheid: een
ongeauthenticeerde burst startte N gelijktijdige DB-queries en kon zo de **bewust-begrensde Prisma-pool**
(`DATABASE_CONNECTION_LIMIT`, `db-connection.ts`) uitputten → connection-timeouts voor de héle app (login,
documentdownload, verificatiequeue) — een self-inflicted DoS, volledig pre-auth. Precies de pool-uitputting
die `probe-timeout.ts` al als hang-risico noemt, maar dan als amplificatie.

**Aanpak (geen 429 op een healthcheck — dat zou de orchestrator een gezonde instance laten killen):**
single-flight. Nieuwe pure helper `coalesceProbe(key, fn)` (`src/lib/observability/probe-coalesce.ts`):
gelijktijdige aanroepers met dezelfde sleutel delen één in-flight probe; pas na settelen (succes én fout)
start de eerstvolgende aanroeper een verse. De probe kost zo hoogstens één DB-query per probe-duur per
endpoint, ongeacht de burst. Bewust géén caching van de uitkomst (readiness/health nooit ouder dan één
probe-duur; herstel/degradatie meteen zichtbaar; fail-closed blijft fail-closed). In `/api/readiness` blijft
de `draining`-check **buiten** de coalescing — per-request en goedkoop, en een afsluitende instance moet altijd
de verse drain-staat zien; de DB-gebonden checks (database + schema) worden gecoalesceerd, de shutdown-check
daarna per request toegevoegd. Publieke JSON-vorm + statuscodes ongewijzigd (`{ready,checks:[database,schema,
shutdown],draining,commit,time}` / 200/503). **Bestanden:** `src/lib/observability/probe-coalesce.ts`
(+ `.test.ts`, 5 tests: één fn-call bij gelijktijdige joiners, verse probe na settelen, fout-propagatie +
sleutel-vrijgave, onafhankelijke sleutels, geen lek bij synchrone worp), `src/app/api/readiness/route.ts`,
`src/app/api/health/route.ts`. **Checks:** typecheck ✓ · lint ✓ · prettier ✓ · unit (nieuw + readiness/health)
✓ · full unit + build + CI-poort verifiëren. MENSENWERK.md §0b bijgewerkt.

## 2026-09-08 — geld: exacte commerciële afronding op "uren × tarief" (IEEE-754-halvecent-onderbetaling gedicht)

**Wat:** de factuurbasis `uren × uurtarief` werd op zes plekken berekend met `Math.round(hours *
hourlyRateCents)` — met IEEE-754-drijvers. Kwartier-uren (0,25/0,5/0,75) zijn exact in float, maar een
uren-waarde met **sub-kwartier-decimalen** (bv. 0,29 of 4,14 — die `validatePerformanceForm` toelaat: het
eist finite/`>0`/max, géén kwartier-stap; de `step="0.25"` is client-only) kan het exacte product op een
halve-cent-grens laten landen terwijl de float-representatie er net ONDER zit: `0,29 × 1750 =
507,4999…994` i.p.v. `507,5`, `4,14 × 25 = 103,4999…999` i.p.v. `103,5`. `Math.round` rondde dan naar
BENEDEN (507/103 i.p.v. 508/104), waardoor de ZZP'er **systematisch één cent te weinig** werd
gefactureerd — in strijd met de gedocumenteerde afronding ("halve cent omhoog"). Het defect raakte de
**persistente** factuur (`Invoice.subtotalCents` via `performanceSubtotalCents` → `hourlySubtotalCents` /
`computeOrt`) én elke preview/PDF die hetzelfde product toonde. De zuster-afronding voor toeslag/BTW
(`Math.round(intCent × bps / 10000)`) is bewezen correct — de teller is dáár een echt geheel getal — en
is ongemoeid gelaten.

**Aanpak (server-side waarheid, geen drift):** één pure bron `hoursTimesRateCents(hours, rateCents)`
(`src/lib/administration/hourly-cents.ts`) rekent in integer-ruimte: uren dragen per datamodel max 2
decimalen (handmatig 2-decimaal; `segmentsFromMinutes` rondt shift-uren af op honderdsten), dus
`Math.round(hours*100)` herstelt exact de bedoelde waarde, `hoursHundredths × rateCents` is een exact
geheel getal in honderdsten-cent, en `(… + 50)/100` (geïntegereerd) doet een **exacte round-half-up**.
Voor elke geldige 2-decimale invoer identiek aan de oude uitkomst, behalve precies op de eerder
verkeerd-afgeronde halve-cent-grenzen. Alle zes call-sites lopen nu door deze helper (geen preview↔factuur-
drift). **Bestanden:** `src/lib/administration/hourly-cents.ts` (+ `.test.ts`, 6 tests: gemelde
defect-cases 508/104, parity op kwartier-/2-decimale uren, brede honderdsten-sweep die float-drift
aantoont + corrigeert en nooit onderbetaalt, safe-integer bij de maxima), `src/lib/administration/vat.ts`
(`hourlySubtotalCents`), `src/lib/ort.ts` (`computeOrt`-basis), `src/lib/diensten.ts`,
`src/lib/prestaties.ts`, `src/lib/ort-breakdown.ts`, `src/lib/performance-pdf.ts`. **Checks:** typecheck ✓
· lint ✓ · prettier ✓ · unit (nieuw + vat/ort/ort-breakdown/cascade) ✓ · full unit + build + CI-poort
verifiëren.

## 2026-09-08 — security/privacy: k-anonimiteitsvloer-poort scant recursief (submap-blindvlek gedicht, HOOG)

**Wat:** security-/privacy-auditronde (orchestrator Opus 4.8 + 3 parallelle adversariële Opus-audits op
niet-overlappende oppervlakken: A authz/IDOR/cross-tenant, B injectie/upload/error-lek/CSP/SSRF, C
privacy/AVG). **0 nieuwe exploiteerbare security-gaten** — alle drie de audits + `npm audit --omit=dev`
(0 vulns) bevestigen de gehardheid (ownership vóór byte-uitgifte, anti-oracle-404, timing-safe secrets,
alle CSV via `escapeCsvField`, storage-keys `randomUUID`, SSRF alleen vaste hosts, één nonce-gated
`dangerouslySetInnerHTML`). **1 HOOG privacy-defect GEVONDEN & GEDICHT** (twee audits kwamen er
onafhankelijk op uit): de afdwing-poort voor de k-anonimiteitsvloer op beoordelingsaggregaten
(`review-aggregate-floor-coverage.test.ts`, gisteren toegevoegd bij #1432) scande `src/lib` **niet-
recursief** (`readdirSync` zonder `recursive`). De ~27 submappen (`data/`, `franchise/`, `compliance/`, …)
vielen buiten bereik — precies waar een nieuwe `aggregateReviews`-consument organisch landt — terwijl de
test-naam/commentaar een volledige garantie claimden. Een toekomstige call-site in een submap kon zo de
vloer `REVIEW_AGGREGATE_MIN_SAMPLE` stil weglaten (individueel herleidbaar cijfer bij n=1/n=2) zónder dat
de build faalde. Geen actief lek vandaag (de drie huidige consumenten passen de vloer toe), maar een vals
gevoel van dekking. **Geschonden:** AVG art. 5(1)(f)/25 (privacy-by-design) + art. 5(2)
(verantwoordingsplicht).

**Aanpak:** recursieve walker `findFloorlessAggregateConsumers(root, exempt)` (POSIX-relatieve paden,
stabiel cross-platform) vervangt de platte scan; regressietest plaatst een floorless consument in een
submap-fixture en pint dat de poort hem nú detecteert (rood→groen tegen de oude niet-recursieve scan) én
een correcte consument mét vloer negeert. **Bestanden:** `src/lib/compliance/review-aggregate-floor-
coverage.test.ts` (5 tests groen). **Checks:** typecheck ✓ · lint ✓ · unit ✓ · build ✓ · prettier ✓ ·
CI-poort verifiëren. Backlog: `docs/SECURITY-PRIVACY-BACKLOG.md` bijgewerkt.

## 2026-09-08 — robuustheid: roosterbezetting-tijdlijn anchort 'vandaag' op de NL-kalenderdag (UTC-server-drift)

**Wat:** de bemiddelaar-roosterbezetting (`/franchise/planning`, `buildRosterTimeline`) verankerde de
14-daagse horizon op de **UTC-dag** van `now` (`utcMidnight`). De productieserver (Railway) draait in UTC,
dus tussen middernacht NL en middernacht UTC (bv. 23:00Z = 01:00 NL in de zomer, of 23:30Z = 00:30 NL in de
winter) is het hier al de volgende burgerlijke dag. Gevolg: een bemiddelaar die 's avonds laat het rooster
opende zag **"vandaag" als gisteren**, het hele raster schoof één dag achter, en de laatste horizon-dag viel
weg — precies wanneer de avond-/nachtplanning telt. Deterministisch elke avond reproduceerbaar.

**Aanpak (hergebruik, geen duplicatie):** `buildDays` verankert nu op `amsterdamCivilDayMs(now)` — dezelfde
Europe/Amsterdam-burgerlijke-dag-bron als de fiscale kalender (`src/lib/administration/fiscal-calendar.ts`),
die exact dit faalpad (UTC-server, boeking vlak na middernacht NL) al elders afdekt. Het verder stappen in
UTC-dagen houdt de iso-dagsleutels uitgelijnd op de UTC-middernacht-sentinels van `AvailabilityWindow`/
`endDate`, dus alle cel-/plaatsing-/venster-logica blijft ongewijzigd; alleen de ankerdag klopt nu. Pure,
deterministische helper — geen I/O, geen status-/geldstroommutatie. **Bestanden:** `src/lib/franchise/
roster-timeline.ts`, `src/lib/franchise/roster-timeline.test.ts` (+4 tests, rood→groen: zomer 23:00Z→8 sep,
winter 23:30Z→16 jan, vóór-middernacht-NL geen over-correctie, afgelopen plaatsing bezet 'vandaag' niet meer).
**Checks:** typecheck ✓ · lint ✓ · unit 8467/8469 (2 skipped) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren.
PR #1437.

## 2026-09-08 — persona-sweep: FREELANCER /certificaten-badge volgt /acties op verval (3× badge↔lijst-drift)

**Wat:** persona-sweep run 7 (orchestrator Opus 4.8 + 3 parallelle adversariële Opus-audits op niet-
overlappende oppervlakken). Security/IDOR/cross-tenant/document-privacy en malicieuze-invoer/Zod/geld
**schoon (0 bereikbare gaten)**. **Drie DOEL-1b-defecten gefixt**, alle op de FREELANCER /certificaten-
nav-badge (`navBadges`, `signals.ts`), die de certificaat-verval-filters herimplementeerde in plaats van
de gedeelde helpers van de item-engine (`pending-tasks.ts`) te gebruiken — het "signaal op één
oppervlak"-anti-patroon: (1) **mid-plaatsing-verval** (cert verloopt ná het 30-daagse venster maar vóór
de plaatsings-einddatum) stond wél op /acties (`credentialCollabExpiryTask`) maar niet in de badge
(onder-telling); (2) **computed-expired** (VERIFIED-cert met verstreken `expiresAt` vóór de expiry-cron
flipt) kreeg op /acties een verleng-taak maar de badge keek alleen naar `status === "EXPIRED"` (onder-
telling tussen cron-runs door); (3) **per-credential i.p.v. per-type** telde twee verlopen exemplaren van
hetzelfde type als 2 terwijl /acties er één toont (over-telling/fantoom).

**Aanpak (structurele drift-preventie):** de badge-tak deelt nu dezelfde inputset (mét `placementEnd`)
en dezelfde pure helpers als de item-engine — `collaborationCredentialExpiryConcerns` (duringPlacement-
concerns die nog niet in `expiring` zitten), de computed-expired-check `EXPIRED || (VERIFIED &&
expiresAt <= now)`, en per-type-dedup met type-uitsluiting (`collabCoveredExpiredTypes`) identiek aan
`expiredNonMandatoryByType`. **Bestanden:** `src/lib/signals.ts`,
`src/lib/signals.badge-gaps-credential-expiry.test.ts` (+3 tests, rood→groen bewezen: 0→1, 0→1, 2→1),
`docs/PERSONA-SWEEP-BACKLOG.md`. **Checks:** typecheck ✓ · lint ✓ · unit (signals+pending-tasks+expiry
303/303) ✓ · prettier ✓ · full unit + build + CI-poort verifiëren.

## 2026-09-08 — cascade: factuurvoorspelling (btw + totaal incl.) bij goedkeuring van uren/oplevering

**Wat:** de opdrachtgever keurt een prestatie goed zonder te zien wat hij daadwerkelijk gaat
betalen. `OrtBreakdown` (werkproces-pagina) stopte bij **"subtotaal excl. btw"**, en gewone uren
(uren × tarief) en opleveringen toonden helemaal géén bedrag — pas ná goedkeuring verscheen de
conceptfactuur mét btw. Nu toont elke prestatie vóór goedkeuring de volledige conceptfactuur-
uitkomst: **subtotaal excl. → btw (21%) → totaal incl. btw**. ORT-uren krijgen twee extra
regels in de bestaande uitsplitsingstabel; gewone uren/opleveringen een compacte
"Conceptfactuur: … excl. + … btw = … incl."-regel (alleen zolang er nog geen factuur is, d.w.z.
niet-goedgekeurd; ná goedkeuring staat de definitieve factuur er al onder). Helpt zowel de
opdrachtgever ("wat ga ik betalen") als de ZZP'er ("wat ontvang ik incl. btw") bij een ingediende/
afgekeurde urenstaat.

**Aanpak (server-side waarheid, geen drift):** één pure bron `src/lib/performance-invoice-preview.ts`
(`computeInvoicePreview(subtotaal)` = canonieke `computeVat(subtotaal, DEFAULT_VAT_REGIME)`, en
`previewPerformanceInvoice(prestatie)` die het subtotaal langs exact dezelfde takken als de cascade
afleidt — ORT-uren → basis + toeslagen · gewone uren → uren × tarief · oplevering → milestonebedrag).
De invoice-VAT bij goedkeuring is `DEFAULT_VAT_REGIME` (STANDARD_HIGH, 21%), een constante — dus de
preview is per definitie gelijk aan de latere `Invoice.totalCents`. Een parity-regressietest bindt
`previewPerformanceInvoice` aan `computeVat(performanceSubtotalCents(...), DEFAULT_VAT_REGIME)` zodat
de UI-voorspelling niet van de cascade-bron kan wegdrijven. Ongeldige/onvolledige invoer → `null`
(geen throw; presentatie toont niets). **Bestanden:** `src/lib/performance-invoice-preview.ts`
(+ `.test.ts`, 11 tests), `src/components/collaborations/ort-breakdown.tsx` (btw + totaal-regels in
de tfoot), `src/app/(protected)/samenwerkingen/[id]/page.tsx` (non-ORT preview-regel).
**Checks:** typecheck ✓ · lint ✓ · unit 76/76 (affected suites) ✓ · prettier ✓ · build + CI-poort
verifiëren. PR #1434.

## 2026-09-08 — prod: retry-op-transiënte-fout op de HIBP gelekt-wachtwoord-controle (fail-open-gat gedicht)

**Wat:** de HIBP gelekt-wachtwoord-lookup (`src/lib/services/password-breach.ts`) gebruikte al
`fetchWithTimeout` (deadline) maar was — als **enige** read-only-GET uitgaande productie-integratie —
zónder retry, terwijl de siblings `http-verify.ts` (DUO/BIG/iDIN) en `routing.ts` (Geoapify) een
begrensde retry-met-backoff hebben. Omdat de controle **fail-open** is, liet één transiënte 5xx/**429**
(HIBP rate-limit't)/netwerk-blip de lek-check stil overslaan — een mogelijk gelekt wachtwoord toegelaten
op de registratie-/wachtwoordwijzig-hot-path (NIST 800-63B) — én tripte het onnodig de aflever-heartbeat
(valse page). De lookup is een idempotente read-only GET, dus een begrensde retry-met-exponentiële-backoff
is veilig.

**Aanpak (spiegelt routing.ts/http-verify.ts):** `attemptOnce` doet één GET en werpt een
`HibpFetchError{transient}` (fetch-throw/5xx/429 → transiënt; 4xx → niet-transiënt); de `check()`-lus
herhaalt alleen transiënte fouten met backoff (`passwordBreachRetryDelayMs`, 250 ms → 4 s cap) tot
`resolvePasswordBreachRetries(PASSWORD_BREACH_HTTP_RETRIES)` (geklemd [0,5], default 2). De
aflever-heartbeat registreert **alléén de einduitkomst** (één succes, of één mislukking na uitputte
retries), zodat een blip die herstelt de mislukkingen-teller niet oploopt. Injecteerbare `sleepImpl` +
`retries` → tests draaien zonder echte vertraging. K-anonimiteit/Add-Padding/fail-open-semantiek
ongewijzigd. **Bestanden:** `src/lib/services/password-breach.ts`, `src/lib/services/password-breach.test.ts`
(26 tests, +7 retry), `src/lib/env.ts` (`PASSWORD_BREACH_HTTP_RETRIES`), `.env.example`, `MENSENWERK.md`.
**Checks:** password-breach 26/26 ✓ · typecheck/lint/prettier/build + CI-poort verifiëren. PR #1433.

## 2026-09-08 — security/privacy: k-anonimiteitsvloer op ALLE beoordelingsaggregaten (HOOG, gedicht)

**Wat:** 3e adversariële security-/privacy-auditronde (orchestrator Opus 4.8 + 3 parallelle Opus-audits op
niet-overlappende oppervlakken: authz/IDOR/tenant · injectie/upload/headers/auth · privacy/AVG). **Eén nieuw
HOOG privacy-gat gevonden én gedicht**, 0 exploiteerbare security-gaten. De k-anonimiteitsvloer
`REVIEW_AGGREGATE_MIN_SAMPLE = 3` was correct in `freelancerReputationFromReviews` (publiek dossier) maar
**stil weggelaten** in de twee spiegelfuncties `companyReputationFromReviews` (opdracht-detailpagina, elke
ZZP'er) en `groupCandidateRatings` (`/kandidaten` + kandidaat-ranking, elke opdrachtgever): beide toonden een
**individueel herleidbaar** cijfer bij n=1/n=2 (AVG art. 5(1)(f)/25). Beide poorten nu op
`>= REVIEW_AGGREGATE_MIN_SAMPLE`, identiek aan de referentie; onder de vloer `null`/weggelaten (geen
render-aanpassing, retourtype ongewijzigd; ook geen ranking-invloed van één opinie).

**Root cause gedicht:** de bestaande `k-anonymity-floors.test.ts` bewaakte alleen de **waarde** van de
constante, niet de **toepassing** ervan per call-site. Nieuwe afdwing-poort
`src/lib/compliance/review-aggregate-floor-coverage.test.ts` pint alle drie de spiegelfuncties gedrag-matig
(onder/op de vloer) én dwingt statisch af dat elke `aggregateReviews`-consument in `src/lib` de constante noemt
(parity met `anonymize-schema-coverage.test.ts` voor erasure) — een 4e call-site kan de vloer niet stil weglaten.
**Bestanden:** `src/lib/company-reputation.ts`, `src/lib/candidate-reviews.ts`,
`src/lib/company-reputation.test.ts`, `src/lib/candidate-reviews.test.ts`,
`src/lib/compliance/review-aggregate-floor-coverage.test.ts` (nieuw), `docs/SECURITY-PRIVACY-BACKLOG.md`.
**Checks:** typecheck ✓ · lint ✓ · prettier ✓ · unit (affected suites 29/29 + downstream 83/83) ✓ · build + volledige
CI-poort verifiëren.

## 2026-09-08 — cascade: ORT-verdienpreview ook in de handmatige urenmodus (ZZP'er)

**Wat:** de ZZP'er zag bij het indienen van een urenstaat een live ORT-verdienpreview (uren per
categorie + subtotaal excl. btw) **alleen in de dienstenmodus** (begin/eind-tijden). Wie de
onregelmatige uren **handmatig per categorie** invulde (avond/nacht/weekend/feestdag), zag geen
enkele berekening — die persoon diende blind in en wist pas ná goedkeuring wat de opdracht opleverde.
Nu toont het formulier in béíde modi hetzelfde voorbeeld, plus een nieuwe **"Totaal uren"**-regel.
De dienstenmodus houdt voorrang (server: shifts > handmatig), dus het handmatige voorbeeld verschijnt
alleen als er geen geldige dienstrijen staan — consistent met wat de server indient. Server-side
blijft de waarheid: het voorbeeld is een richtbedrag, de opdrachtgever keurt de definitieve
berekening goed.

**Aanpak (DRY + pariteit):** één gedeelde, pure bron `src/lib/manual-ort.ts` (`MANUAL_ORT_FIELDS`
= veldnaam↔categorie↔label in canonieke volgorde, en `manualOrtSegments()` die uren>0 in vaste
volgorde tot segmenten bouwt). Zowel de server-actie (`parsePerformanceInput`) als het formulier
lezen hieruit, zodat de precedentie/volgorde tussen wat de ZZP'er ziet en wat de server berekent
niet kan driften. Het formulier deelt nu één `OrtPreviewTable`-component tussen beide modi.
**Bestanden:** `src/lib/manual-ort.ts` (+ `.test.ts`, 6 tests), `src/app/(protected)/samenwerkingen/[id]/actions.ts`
(inline `ortFields`-blok → gedeelde helper, gedrag identiek), `src/app/(protected)/samenwerkingen/[id]/performance-form.tsx`
(gedeeld preview-component + gecontroleerde handmatige velden + handmatig voorbeeld + totaal-uren).
**Checks:** typecheck ✓ · lint ✓ · unit 170/170 (relevante suites) incl. manual-ort 6/6 ✓ · build ✓
(109/109 static pages) · prettier ✓ · CI-poort verifiëren. PR #1431.

## 2026-09-07 — DBA-monitor: risico-verlaagstappen ook op de opgeslagen opdracht-detailpagina

**Wat:** de concrete "next best action" van de DBA-monitor (`dbaMitigations`, #1427 — de kleinste set
indicator-wijzigingen die het risico één niveau verlaagt) stond alleen **live op het opdracht-formulier**.
Op de opgeslagen opdracht-detailpagina (`opdrachten/[id]`) zag de opdrachtgever wél het risiconiveau, de
redenen en de modelovereenkomst-aanbeveling, maar niet de "zo verlaag je het risico"-stappen — een
asymmetrie precies daar waar de opdrachtgever ná publicatie terugkeert. Nieuw gedeeld presentatiecomponent
`DbaMitigationCard` (`src/components/dba/dba-mitigation-plan.tsx`) toont het plan; op de detailpagina wordt
het plan **server-side herberekend** uit de opgeslagen indicatoren (`job.dba*`) — dezelfde pure functie,
consistent met de al server-side herberekende modelovereenkomst-aanbeveling ernaast. Server-side waarheid;
geen nieuwe logica. Het formulier gebruikt nu hetzelfde component (inline blok verwijderd, DRY).
**Bestanden:** `src/components/dba/dba-mitigation-plan.tsx` (+ `.test.tsx`, 3 tests via `renderToStaticMarkup`),
`src/app/(protected)/opdrachten/job-form.tsx` (blok → component), `src/app/(protected)/opdrachten/[id]/page.tsx`.
**Checks:** gerichte tests groen · typecheck/lint/prettier/build + CI-poort verifiëren. PR #1430.

## 2026-09-07 — DBA-monitor: concreet, uitlegbaar risico-verlaagadvies op het opdrachtformulier

**Wat:** de DBA-monitor gaf tot nu toe een verdict (LAAG/MIDDEN/HOOG) + generiek advies, maar niet
_welke_ concrete wijziging het risico daadwerkelijk verlaagt. Nieuwe pure functie `dbaMitigations`
(`src/lib/dba.ts`) berekent het **kleinste, meest-uitlegbare setje indicator-wijzigingen** dat het
risico naar het eerstvolgende lagere niveau brengt — de "next best action" van de DBA-monitor.
Alleen de gezag-/inbeddings-indicatoren zijn hefbomen (de verwachte duur is een eerlijke inschatting,
geen af te vinken knop: telt mee in de score maar niet als voorstel). Deterministisch: kiest de
deelverzameling actieve indicatoren met (1) minste wijzigingen → (2) minste overbodige verlaging →
(3) stabiele indicator-volgorde (brute-force over ≤2⁶ deelverzamelingen). `null` als er niets te
verlagen valt (al LAAG) of als de indicatoren de vereiste verlaging niet dekken (duur-gedreven).
Live getoond op het opdrachtformulier (`opdrachten/job-form.tsx`): terwijl de opdrachtgever de
kenmerken aanvinkt, verschijnt "Zo verlaag je het risico naar MIDDEN/LAAG:" met concrete stappen
(bv. "Sta vrije vervanging toe."). Server-side blijft `assessDbaRisk` de waarheid; dit is een
uitlegbare hint bovenop dezelfde pure functie. **Bestanden:** `src/lib/dba.ts`,
`src/lib/dba.test.ts` (+7 tests, 18/18), `src/app/(protected)/opdrachten/job-form.tsx` (kleine
refactor: gedeeld `dbaInput`-object). **Checks:** test 18/18 ✓ · typecheck/lint/prettier/build ✓ ·
CI-poort verifiëren. PR #1427.

**Nevenbevinding (geen wijziging):** het geparkeerde LOW-item "DST-uur mis-attributie in
`segmentShifts`" is empirisch weerlegd — de Nederlandse DST-wissels (03:00↔02:00) liggen volledig
binnen NIGHT, terwijl de ORT-categoriegrenzen op 06:00/18:00/22:00 liggen; de segmentatie loopt in
echte-ms-slices die [start,end) exact partitioneren, dus de totaalminuten blijven behouden en de
categorie is uniform over de wissel (fall-back → 3u NIGHT, spring → 1u NIGHT). Non-bug bij de
standaard-ORT-vensters; backlog-item als zodanig gemarkeerd.

## 2026-09-07 — prod: bucket-default-encryptie-fallback in de opslag-encryptie-zelftest (go-live-poort op S3-compatibele opslag)

**Wat:** de go-live-blocker uit LAUNCH-REVIEW §1 / CURRENT_TASK-handoff opgelost — "De opslagprovider
ondersteunt de vereiste SSE-metadata niet; de strikte productiecontrole slaagt nog niet." De
`encrypt`-stap van de opslag-zelftest deed alleen een per-object `HeadObject` en faalde ONVERSLEUTELD
zodra een S3-compatibele store de `x-amz-server-side-encryption`-header niet echoot — óók als de bucket
elk object transparant-at-rest versleutelt. De stap valt nu, bij een afwezige per-object-header, terug
op **positief bucket-breed bewijs**: `GetBucketEncryption` (`describeBucketEncryption` op de
S3-driver). Een geconfigureerde default-encryptie-regel bewijst dat S3 élk object op schijf versleutelt
(default afgedwongen ongeacht de PutObject-parameters) → stap groen met eerlijke bucket-policy-toelichting.
**Verzwakt niets:** de fallback voegt alleen een PASS-pad toe waar ONAFHANKELIJK positief bewijs bestaat;
ontbreekt dat (geen regel, of de call werpt/wordt niet ondersteund → doorgegooid, nooit stil geslikt),
dan blijft de bestaande AVG-faalmodus (nooit vals groen). `GetBucketEncryption` is een echte
backend-round-trip → geregistreerd in de opslag-aflever-heartbeat (RecordingStorageDriver).
**Bestanden:** `src/lib/services/storage.ts` (`BucketEncryptionInfo`, interface-methode, S3-impl,
RecordingStorageDriver-forwarding), `src/lib/services/storage-selftest.ts` (fallback in de `encrypt`-stap),
`+7 tests` (`storage-selftest.test.ts`, `recording-storage-driver.test.ts`), `MENSENWERK.md`.
**Checks:** gerichte tests 53/53 ✓ · typecheck/lint/build/prettier + CI-poort verifiëren. PR #1426.

## Staat van het product (2-9-2026)

- **Live:** `main` is bron van waarheid én deploy-branch; Railway deployt elke gemergde PR. Poort: 6 vereiste checks + `migrations`-driftcheck, `enforce_admins` AAN. Boot draait `prisma migrate deploy` (geen `db push` meer in productie); `monitor.yml` bewaakt deploy-lag (issue-label `deploy-lag`).
- **Werkt end-to-end:** opdracht → match → reactie → samenwerking → contract → urenstaat (incl. ORT) → goedkeuring → factuur → betaalregistratie → administratie/BTW. Plus certificaat-dossier met verificatie/verval, next-action-engine, DBA-monitor en tenant-cockpit voor bemiddelaars.
- **Bewust UIT (env-gestuurd, inert):** billing (`noop`), e-mail (`noop`), documentopslag (`local`, geen S3), verificatie-koppelingen DUO/BIG/iDIN (`mock`), web-push (geen VAPID-sleutels), aangifte-partner. Rate-limit-store draait op Redis (`RATE_LIMIT_STORE=redis`). Elk kanaal heeft een zelftest + aflever-heartbeat op `/admin/systeemstatus`.
- **Mensenwerk vóór livegang** (MENSENWERK.md §0): jurist-/AVG-review met echte gevoelige documenten, productie-secrets, betaalprovider, echte verificatie-API's, mailprovider, S3, eigen domein.
- **Open strategische keuze:** focus & wig — voorstel in [ADR 0011](docs/decisions/0011-focus-en-wig.md) (status: voorgesteld, eigenaarsbesluit).
