# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## 2026-09-09 — security/privacy auditronde 6: TOCTOU statusovergang-bypass op support-tickets gedicht (CLAUDE.md regel 3)

**Wat:** security-/privacy-auditronde (orchestrator Opus 4.8 + 3 parallelle adversariële Opus-audits op
niet-overlappende oppervlakken: A authz/IDOR/cross-tenant over álle API-routes + auth-keten + cron/webhooks ·
B server-action-mutaties + guardlagen · C privacy/AVG + injectie). Basis `main` @ 12d5b36c. **Eén MIDDEL
gedicht, één HOOG privacy-item heropend voor eigenaar/FG-besluit**, rest clean met file:line-bewijs.

De gebruiker-zijde support-acties `replyToTicket`/`markResolved` (`src/app/(protected)/support/actions.ts`)
toetsten hun statusovergang tegen een vóór-transactionele snapshot en schreven daarna met een **kale**
`prisma.supportTicket.update({ where: { id } })` — zónder de compound-guard `where: { id, status: from }` die
élk ander statuswijzigend oppervlak in de repo gebruikt. Daardoor kon een race (aanvrager reageert terwijl een
ADMIN het ticket afrondt) de live status blind overschrijven en een overgang forceren die
`SUPPORT_TICKET_TRANSITIONS` verbiedt (bv. `RESOLVED→ESCALATED`): de transitie-map-invariant omzeild via timing,
het admin-besluit stil teruggedraaid. **Fix:** beide acties gebruiken nu `updateMany` mét de statusguard (flip
telt alleen zolang de status écht nog `from` is; verliest de race → count 0, geen write, geen fantoom-audit) en de
audit draagt de `{from,to}`-overgang. Spiegelt `admin/support/actions.ts` exact. **Bestanden:**
`src/app/(protected)/support/actions.ts` + `src/app/(protected)/support/toctou-transition.test.ts` (4 tests,
rood→groen bewezen: 3 falen op de oude kale `update`, alle groen met de guard).

**Heropend (geen code-wijziging — eigenaar/FG-besluit):** publiek `/zzp/[id]` toont individueel herleidbare
reviews (naam + rating + verbatim comment) zonder k-anonimiteitsvloer (HOOG, AVG art. 5(1)(f)/25). Al eerder
geparkeerd; audit C bevestigde dat het live blijft. Product-/juridische afweging (MENSENWERK §5), buiten
agent-scope — besluit vereist vóór go-live met echte documenten. Zie `docs/SECURITY-PRIVACY-BACKLOG.md` ronde 6.

**Checks:** typecheck ✓ · lint ✓ · unit (8519 passed, 2 skipped) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR volgt).

## 2026-09-09 — persona-sweep run 9: CLIENT signable-PROPOSED-badge ordende anders dan /acties (outer-window-drift, DOEL 1b)

**Wat:** kritische-gebruiker-sweep over de vier rollen (orchestrator Opus 4.8 + 3 parallelle adversariële
Opus-audits: next-action/badge · IDOR/authz/cross-tenant · malicieuze invoer/geld/robuustheid). DOEL 2
schoon (0 bereikbare authz/IDOR/tenant-gaten; 0 nieuwe invoer/geld-gaten — de delta #1440–#1449 dichtte de
geld/parse-vein). Eén DOEL-1b-defect gefixt, één LOW-robustness-item geparkeerd (zie
`docs/PERSONA-SWEEP-BACKLOG.md` run 9).

De CLIENT /samenwerkingen-nav-badge telt de onderteken-bare PROPOSED-samenwerkingen via
`countClientSignableProposals` (`signals.ts`). Die query ordende `updatedAt desc`, terwijl de list-bron
`proposedCollabs` (`pending-tasks.ts:1149`) in run 81 bewust naar `createdAt asc` is omgezet:
`Collaboration.updatedAt` staat voor een PROPOSED-rij effectief bevroren op het aanmaakmoment, dus
`updatedAt desc` capte de NIEUWSTE voorstellen en liet de OUDSTE — de langst-wachtende hires die om
ondertekening vragen — buiten het (op `CASCADE_SCAN_LIMIT`=50) gecapte venster vallen. Met de list op de
oudste 50 en de badge op de nieuwste 50 divergeren de subsets bij >50 gelijktijdige PROPOSED-samenwerkingen
voor één opdrachtgever → de badge undercountte precies de gestrande, oudste teken-taken die /acties toont.
Exact de outer-window-blindheid die de list-kant al dichtte, achtergebleven in de badge; de badge-doc-comment
claimde bovendien ten onrechte pariteit ("op dezelfde rijen redeneren").

**Aanpak (hergebruik, geen duplicatie):** de badge-query ordent nu identiek `createdAt asc` als de
list-bron → beide oppervlakken redeneren op dezelfde (oudste-eerst) rijen; kan structureel niet meer
driften. **Bestanden:** `src/lib/signals.ts` (+ doc-comment die de gedeelde ordening + de run-81-reden
uitlegt), `src/lib/signals.badge-signable-proposals-order.test.ts` (+1 test, rood→groen bewezen:
`updatedAt desc` → assertion faalt, `createdAt asc` → groen). **Checks:** typecheck ✓ · lint ✓ · unit
(8509 passed, 2 skipped) ✓ · prettier ✓ · build (offline font-stub) exit 0 · CI-poort verifiëren (PR volgt).

## 2026-09-09 — robuustheid: vervalkalender onderdrukt superseded/gedekte certificaten (geen valse vernieuw-nudge)

**Wat:** de vervalkalender `summarizeExpiry` (`src/lib/credential-expiry-overview.ts`) — getoond aan de
ZZP'er op `/certificaten` (ExpiryOverviewCard) én aan de bemiddelaar op `/franchise/zzpers/[id]` (en via
`summarizeExpiryAlert` op `/franchise/zzpers` + de export) — was het énige verval-oppervlak dat de canonieke
superseded-/gedekte-onderdrukking níét toepaste. Élk ander oppervlak sluit een cert dat door een
nieuwer/onbeperkt exemplaar van hetzelfde type gedekt is al uit (`supersededVerifiedCredentialIds`/
`coveredCredentialTypes`): de ZZP-nav-badge (`signals.ts`), de next-actions (`pending-tasks.ts`), de
verval-cron (`expiry-task.ts`) en de bemiddelaar-roostertelling (`rosterExpiringByProfile`). Had een ZZP'er
voor een type twee VERIFIED-certs — één dat binnenkort verloopt én één doorlopend/later-vervallend exemplaar —
dan bleef de kalender "verloopt binnenkort — vernieuw" tonen, terwijl de vereiste al permanent gedekt was: een
valse nudge die nooit op nul komt, plus drift t.o.v. de roostertelling die de bemiddelaar ziet.

**Aanpak (hergebruik, geen duplicatie):** `summarizeExpiry` krijgt de vólledige certificatenlijst binnen, dus
het berekent nu intern `supersededVerifiedCredentialIds` + `coveredCredentialTypes` en slaat twee gevallen over:
(1) een nu-geldig VERIFIED-cert dat superseded is door een nieuwer/onbeperkt exemplaar van hetzelfde type;
(2) een verlopen exemplaar (EXPIRED of computed-expired VERIFIED) van een type dat een ánder nu-geldig
VERIFIED-cert al dekt — exact het geval dat de `coveredCredentialTypes`-docstring benoemt. Verloopt élk exemplaar
van een type, dan valt het type buiten de dekking en blijft de verlopen-melding terecht staan. Het nu-geldige
cover-cert zelf wordt nooit onderdrukt (dat moet de ZZP'er wél vernieuwen vóór het lapst). Geen caller-wijziging;
`summarizeExpiryAlert` (franchise) erft de fix → agreert nu met `rosterExpiringByProfile`.
**Bestanden:** `src/lib/credential-expiry-overview.ts` (+ `.test.ts`: 6 tests — onbeperkt cover onderdrukt,
eerder-vervallend onderdrukt maar later-cover blijft, verlopen-van-gedekt-type onderdrukt, alles-verlopen blijft
zichtbaar, solo-cover blijft zichtbaar, typegrens onderdrukt niet; 2 bestaande fixtures kregen distincte typen
zodat ze windowing/sortering testen i.p.v. incidenteel superseded te triggeren).
**Checks:** typecheck ✓ · lint ✓ · unit (8514/8514, +6) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR #1450).

## 2026-09-09 — robuustheid: doorlopend cert onderdrukt valse collab-verval-nudge (ZZP'er) + badge↔lijst-pariteit

**Wat:** `collaborationCredentialExpiryConcerns` (`src/lib/collaboration-credential-expiry.ts`) — de bron
achter zowel de ZZP'er-taak `credentialCollabExpiryTask` (`pending-tasks.ts`) als de /certificaten-nav-badge
(`signals.ts` `collabDuringPlacementAlerts`) — bouwde `latestByType` uit uitsluitend gedáteerde VERIFIED-certs
(`if (c.status !== "VERIFIED" || !c.expiresAt) continue`) en sloeg een **doorlopend** (nooit vervallend,
`expiresAt == null`) VERIFIED-cert stil over. Had een ZZP'er voor een vereist type twéé geldige certs — één dat
binnenkort verloopt én één doorlopend exemplaar — dan bleef de binnenkort-vervallende de "vernieuw je certificaat
voor samenwerking X"-taak/badge voeden, terwijl het doorlopende cert de vereiste al permanent dekt. Een valse,
onoplosbare verval-nudge die nooit op nul komt — precies het "signaal dat nooit nuttig verdwijnt"-anti-patroon.

**Aanpak (hergebruik, geen duplicatie):** de fix spiegelt de al bestaande regel in
`supersededVerifiedCredentialIds` (`credentials.ts`) — dat een gedateerd cert als _superseded_ markeert zodra
een doorlopend (of later-vervallend) exemplaar bestaat, en dáár al de generíeke verval-nudge onderdrukt (de
collab-anker-helper deed dat als enige niet, terwijl de superseded-doc-comment 'm expliciet noemt). `latestByType`
ving de later-vervallende-gedateerde variant al impliciet (het kiest het laatst-vervallende); nu wordt een type met
een doorlopend geldig VERIFIED-cert opgenomen in `permanentlyCoveredTypes` en overgeslagen bij het afleiden van
zorgen. Zowel de taak als de badge lezen uit dezelfde pure helper → geen badge↔lijst-drift. Andere types (het
doorlopende cert is een ánder type) en niet-geverifieerde doorlopende certs blijven de zorg terecht staan.
**Bestanden:** `src/lib/collaboration-credential-expiry.ts` (+ `.test.ts`: 4 tests — doorlopend cert onderdrukt
binnen-venster- én mid-plaatsing-zorg, ander type onderdrukt niet, niet-geverifieerd doorlopend cert dekt niet).
**Checks:** typecheck ✓ · lint ✓ · unit (helper+signals+credentials 82/82) ✓ · prettier ✓ · full unit + build +
CI-poort verifiëren (PR volgt).

## 2026-09-09 — geld/robuustheid: uren-invoer op de cent-grid afgedwongen (getoonde uren == gefactureerde uren)

**Wat:** de open MED-kandidaat uit de 8-9-notitie hieronder gedicht. De factuurmotor
`hoursTimesRateCents` (`src/lib/administration/hourly-cents.ts`) kwantiseert uren stil naar honderdsten
(`Math.round(hours * 100)`). Uren met méér dan twee decimalen passeerden de validatie (`validatePerformanceForm`/
`assertPerformanceWithinLimits` checkten alleen finite/positief/max, geen 2-decimaal-stap) en werden bij
factuurafleiding geherkwantiseerd — bv. een geknutselde POST of CSV-import met `4,149` uur factureert als
`4,15` uur, terwijl de urenstaat/PDF/CSV `4,149` blijft tonen. Getoonde ≠ gefactureerde hoeveelheid, precies op
het administratie-vertrouwensvlak. **Geld ongemoeid** — de beschermde motor (`hourly-cents.ts`, #1440) is niet
aangeraakt; de fix zit puur op de invoer-grens zodat de kwantisatie een no-op wordt.

**Aanpak (hergebruik, geen duplicatie):** één float-veilig predikaat `isCentAccurateHours(hours)` in
`hourly-cents.ts` (co-locatie met de kwantisatie die het spiegelt): `|hours·100 − round(hours·100)| ≤ 1e-6`
accepteert geldige 2-decimalen inclusief IEEE-754-ruis (1,67 → 166,999…997; 4,15 → 415,000…006) en weigert elke
3e+ decimaal (afstand ≥ 0,1 in geschaalde ruimte). `assertPerformanceWithinLimits` — het choke point voor
formulier, CSV-import (`diensten/importeer`) én admin — weigert nu `hours` en elk ORT-`seg.hours` buiten de grid
(`"Vul de uren in met maximaal twee decimalen."`); `validatePerformanceForm` geeft dezelfde vriendelijke
formulierfout op `hours`/`ortTotal`. Shift-/CSV-afgeleide uren (al op honderdsten via `segmentsFromMinutes`)
blijven geldig; een malformede CSV-rij degradeert tot een per-rij-skip (bestaande `toSafeActionError`-catch).
**Bestanden:** `src/lib/administration/hourly-cents.ts` (+ `.test.ts`: 3 tests — grid-acceptatie incl. float-ruis,
weigering >2 decimalen, consistentie met de kwantisatie), `src/lib/cascade/performance-commands.ts` (+ `.test.ts`:
4 tests — `hours` en `seg.hours` grid-guards), `src/lib/validation.ts` (+ `.test.ts`: 3 tests — `hours`/`ortTotal`
grid + float-noisy 1,67 blijft geldig). **Checks:** typecheck ✓ · lint ✓ · unit (affected 115/115) ✓ · prettier ✓ ·
full unit + build + CI-poort verifiëren (PR #1447).

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

> **Genoteerd voor een aparte run — GEDAAN 9-9 (PR #1447, zie bovenaan).** Een cascade-audit vond een
> MED-kandidaat — uren met meer dan twee decimalen passeren `validatePerformanceForm`/
> `assertPerformanceWithinLimits` (alleen finite/positief/max, geen 2-decimaal-stap) en worden in
> `hoursTimesRateCents` op honderdsten geherkwantiseerd, wat de gefactureerde hoeveelheid met een cent kan
> laten afwijken van de getoonde uren. Gedicht op de invoer-grens (`isCentAccurateHours`); de beschermde
> administratie-motor (`hourly-cents.ts`, #1440) is niet aangeraakt.

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

## Staat van het product (2-9-2026)

- **Live:** `main` is bron van waarheid én deploy-branch; Railway deployt elke gemergde PR. Poort: 6 vereiste checks + `migrations`-driftcheck, `enforce_admins` AAN. Boot draait `prisma migrate deploy` (geen `db push` meer in productie); `monitor.yml` bewaakt deploy-lag (issue-label `deploy-lag`).
- **Werkt end-to-end:** opdracht → match → reactie → samenwerking → contract → urenstaat (incl. ORT) → goedkeuring → factuur → betaalregistratie → administratie/BTW. Plus certificaat-dossier met verificatie/verval, next-action-engine, DBA-monitor en tenant-cockpit voor bemiddelaars.
- **Bewust UIT (env-gestuurd, inert):** billing (`noop`), e-mail (`noop`), documentopslag (`local`, geen S3), verificatie-koppelingen DUO/BIG/iDIN (`mock`), web-push (geen VAPID-sleutels), aangifte-partner. Rate-limit-store draait op Redis (`RATE_LIMIT_STORE=redis`). Elk kanaal heeft een zelftest + aflever-heartbeat op `/admin/systeemstatus`.
- **Mensenwerk vóór livegang** (MENSENWERK.md §0): jurist-/AVG-review met echte gevoelige documenten, productie-secrets, betaalprovider, echte verificatie-API's, mailprovider, S3, eigen domein.
- **Open strategische keuze:** focus & wig — voorstel in [ADR 0011](docs/decisions/0011-focus-en-wig.md) (status: voorgesteld, eigenaarsbesluit).
