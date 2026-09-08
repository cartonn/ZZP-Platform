# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## 2026-09-08 — DBA: duurdrempel-vooruitblik (waarschuw vóór verhoogd/hoog risico) op de samenwerking-detailpagina

**Wat:** de DBA-duursignalering (`dba-monitor.ts`) is reactief — ze verschijnt pas zodra een inzet de
6-maanden- (verhoogd) of 12-maanden-drempel (hoog risico) al gepasseerd heeft. Schijnzelfstandigheid
is echter vooral proactief te beheersen. Nieuw: een rustige **vooruitblik-kaart** op de samenwerking-
detailpagina die opdrachtgever/ZZP'er/bemiddelaar waarschuwt _voordat_ de inzet een duurdrempel kruist
("Deze samenwerking bereikt over 2 weken de grens van 12 maanden onafgebroken inzet — overweeg nu een
interne beoordeling"), zodat er tijdig een evaluatie gepland kan worden i.p.v. pas ná de kruising te
signaleren. Draagt dezelfde disclaimer (Besluit 2 — signalering ter informatie, geen juridisch oordeel).

**Aanpak (pure kern, consistent met het reactieve signaal):** nieuwe pure module
`src/lib/dba-duration-forecast.ts` — `forecastDbaDurationCrossing(startDate, now, thresholds?, leadDays?)`
kiest de eerstvolgende nog-niet-gepasseerde drempel (verhoogd vóór hoog), berekent de exacte kruisdatum
via `dbaThresholdCrossingDate` (dag-correctie identiek aan `monthsBetween`: 31e → 1e van de volgende maand
wanneer de doelmaand die dag niet heeft) en meldt alleen wanneer de kruising binnen `leadDays` (default 30)
valt. Gebruikt exact dezelfde `startDate` + klok als de reactieve `assessCollaborationDba` op dezelfde
pagina → vooruitblik en signaal kunnen niet uit elkaar lopen. Alle drempels gepasseerd of geen startdatum
→ `null` (het reactieve signaal dekt dat). Display-only server-component `DbaDurationForecastNote`; geen
schema-/mutatie-/authz-oppervlak, geen dode knop. **Bestanden:** `src/lib/dba-duration-forecast.ts`
(+ `.test.ts`, 15 tests: kruisdatum incl. maand-overflow, leadtijd-formattering, venstergrens `<=`,
aangepaste drempels/venster, dedup gelijke drempels), `src/components/collaborations/dba-duration-forecast-note.tsx`,
`src/app/(protected)/samenwerkingen/[id]/page.tsx`. **Checks:** typecheck ✓ · lint ✓ · prettier ✓ ·
unit (forecast 15/15) ✓ · volledige unit + build + CI-poort verifiëren. PR #1436.

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

## 2026-09-07 — security/privacy-audit (2e ronde): 3 parallelle adversariële Opus-audits, 0 exploiteerbare gaten, 1 privacy/product-afweging geparkeerd

**Wat:** orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken +
orchestrator-sweep. **A** — delta `0d69ce32..364396bc` (10 commits) + `mustChangePassword`-invariant + register-
atomiciteit + 2FA-replay. **B** — IDOR/authz over alle server actions + ~45 API-routes, cross-tenant, injectie,
upload, SSRF. **C** — privacy/AVG: minimalisatie/overfetch, erasure, PII-in-logs, k-anonimiteit, audit, derden.
Sweep: `npm audit` (0 vulns), raw-SQL (alleen `SELECT 1`), CSV-builders (alle via `escapeCsvField`, ook de
handgerolde `diensten.ts`-export), tracked secrets (leeg), CSP/middleware server-side. Productiebuild groen.

**Bevinding (geparkeerd, eigenaar-gated — MENSENWERK §5 + §0-poort 4):** publiek profiel `/zzp/[id]` toont anoniem
de **individuele** beoordelingen (naam opdrachtgever + woordelijke tekst + score, n=1) én het aggregaat zonder de
`REVIEW_AGGREGATE_MIN_SAMPLE = 3`-vloer die het `/vertrouwen`-dossier voor exact deze dataset wél afdwingt
(`profile-screen.tsx:258-281`, `review-list.tsx`; vgl. `freelancer-reputation.ts` + `config.ts:599`). AVG art.
5(1)(f)/25/5(2); in zorg-context kan de vrije tekst bijzondere persoonsgegevens bevatten. **Niet unilateraal
gefixt:** publieke toegeschreven reviews zijn een product-/juridische afweging (kern-vertrouwensmechanisme via de
double-blind reveal, zoals Malt/Temper/Werkspot) — de eigenaar kiest (a) aggregaat-only `>= 3` voor anonieme
kijkers of (b) expliciete, geteste uitzondering in de accountability-gate. **Blokkeert go-live met echte
beoordelingen** (nu demo-seed → geen actueel datalek). Repro + fixopties: `docs/SECURITY-PRIVACY-BACKLOG.md`.

**Geen nieuw exploiteerbaar security-gat** in de 10 delta-commits of het IDOR/tenant/injectie/SSRF-oppervlak;
erasure/minimalisatie/k-anonimiteit/audit/derden clean. **Bestanden:** `docs/SECURITY-PRIVACY-BACKLOG.md`,
`PROGRESS.md` (docs-only PR).

## 2026-09-07 — persona-sweep (run 6): /kandidaten-nav-badge dreef af van /acties op een gesloten opdracht

**Wat:** volledige kritische-gebruiker-sweep (4 rollen) via 3 parallelle adversariële Opus-audits op niet-
overlappende oppervlakken. **DOEL 2 schoon:** security/IDOR/cross-tenant/document-privacy **0 bereikbare gaten**
(`currentActor()` herlaadt rol/tenant live uit de DB, `tenantScopeWhere` als één bron, anti-oracle-404 op elke
by-id-fetch, cascade-commands her-afleiden partij i.p.v. client-id); invoer/Zod/geld **0 gaten** (int4-overflow
gedekt, NaN/Infinity/negatief geweigerd, CSV-injectie centraal, upload magic-byte-sniff).

**Gefixt (DOEL 1b — badge↔lijst-pariteit):** `navBadges` (`src/lib/signals.ts`) telde de CLIENT-`/kandidaten`-
badge (NEW-reactie-telling `:640` + stale VIEWED/SHORTLIST-`findMany` `:696`) alleen op `companyId`, zónder de
`job.status: "PUBLISHED"`-poort die run 103 aan de item-engine (`pending-tasks.ts`) toevoegde. Sluit de
opdrachtgever een opdracht zonder de reactie te beoordelen (PUBLISHED→CLOSED/DRAFT), dan blijft de reactie NEW
in de DB (`changeJobStatus` transitioneert reacties niet) → de beoordeeltaak verdwijnt van /acties, maar de
badge bleef 'm eeuwig meetellen: een fantoom-`attention`-badge die nooit op nul komt (het "signaal op één
oppervlak"-anti-patroon). **Fix:** `job.status: "PUBLISHED"` toegevoegd aan beide queries → badge==lijst.
**Bestanden:** `src/lib/signals.ts`, `src/lib/signals-client-closed-job-badge.test.ts` (+1 test, rood→groen
bewezen door de fix te stashen: badge `{count:5, tone:"attention"}` → undefined). **Geparkeerd (LOW):** DST-uur
mis-attributie in ORT-segmentatie (`shift.ts`), twee dagen/jaar, klein factuur-effect — zie PERSONA-SWEEP-BACKLOG.
**Checks:** prettier ✓ · gerichte tests (signals 134/134 + nieuwe 1/1) ✓ · typecheck/lint/build + CI-poort verifiëren.

## 2026-09-07 — geld-integriteit: dubbel-afronden in `segmentShifts` weg (ORT-factuursubtotaal)

**Wat:** `segmentShift` (`src/lib/shift.ts`) rondde de uren per dienst al op 2 decimalen af; `segmentShifts`
telde díe reeds-afgeronde waarden op en rondde de som nóg eens → `round(Σ round(minᵢ/60))` i.p.v.
`round(Σ minᵢ/60)`. Bij een meerdaagse urenstaat met veel diensten op hetzelfde sub-uur-patroon (bv. elke
dienst eindigt op :00 na een niet-uitgelijnde start) accumuleert de per-dienst-afrondingsbias één kant op →
structureel te hoog/te laag factuursubtotaal (`planPerformanceApproved` → `ortSubtotalCents` →
`Invoice.subtotalCents`). Reachable via de dienstmodus van de urenstaat (`samenwerkingen/[id]/actions.ts`
roept `segmentShifts(shifts, …)` met álle diensten). CSV-import ontsnapte al (roept `segmentShifts([shift])`
per dienst). **Fix:** de minuten-doorloop + validatie uit `segmentShift` gedeeld in helper
`accumulateShiftMinutes` die de RUWE minuten-per-categorie teruggeeft; `segmentShift` én `segmentShifts`
aggregeren ruwe minuten en ronden precies één keer via `segmentsFromMinutes`. Publieke API's ongewijzigd;
`segmentShift`-gedrag per losse dienst identiek. **Bestanden:** `src/lib/shift.ts`, `src/lib/shift.test.ts`
(+3 tests: 10× 21:50–22:00 → 1,67u avond i.p.v. 1,70u onder dubbel-afronden; 3× 5 nachtmin → 0,25u i.p.v.
0,24u; losse dienst blijft 0,17u). **Checks:** prettier ✓ · gerichte tests 72/72 ✓ · typecheck/lint/build +
CI-poort verifiëren.

## 2026-09-07 — bestaande versleutelde backupjob herstellen

`db:backup:remote` ontbrak op main; gericht hersteld vanuit `c8b096b2` met verplichte AES-256-GCM, S3-readback/checksum vóór succes-heartbeat, time-outs en behoud van alle bestaande back-ups. Dedicated pg18-image + `railway.backup.json` (cron 02:15 UTC, geen HTTP-healthcheck/seed/migraties). Exacte heartbeatroute passeert sessiemiddleware; CRON_SECRET-guard blijft. Configuratie, grenzen en herstelpad: [RUNBOOK §5](docs/RUNBOOK.md#5-back-up--herstel-database).

Lokaal vóór rebase: typecheck, lint, formatting, env-check en 88 gerichte tests groen. Brede suite strandde alleen in bestaande query-budget-setup (`prisma db push`/Schema engine error); geen Docker-daemon voor image-build. CI en live bewijs nog nodig: juiste appdatabase-reference, backup-config activeren, job/S3/heartbeat en scratch-herstel controleren. CodeQL vond een path-stat/read-race; descriptor met O_NOFOLLOW en begrensde read herstelt die zonder suppressie (66 gerichte tests en typecheck groen). Live backupbewijs volgt na de nieuwe CI-run.

## 2026-09-07 — publieke marketing zonder garanties of democijfers

Loginintro en gedeelde vertrouwensstrip beschrijven productfuncties; juridische garanties en
universele certificaatgeldigheid verwijderd, bestaande Engelse teksten gelijkgetrokken.
SEED_DEMO=true onderdrukt publieke tellingen. Tests: 24 groen; gerichte lint/formatting groen. CI volgt.

## 2026-09-07 — launch review: accounttoegang en registratie gehard

Op actuele main en live health/readiness gecontroleerd. Railway staat nog op demo met seeding;
S3 en Redis zijn ingesteld, e-mail is noop. Besluit en concrete pilotvolgorde:
[launch review](docs/LAUNCH-REVIEW-2026-09-07.md).

Deze branch sluit parallel hergebruik van een tweestaps-herstelcode en een client-bypass van de
verplichte wachtwoordwijziging. Normale servertoegang controleert de actuele wachtwoordvlag;
de wijzigpagina houdt een beperkte uitzondering met alle overige identiteitscontroles.
Accountaanmaak en audit zijn transactioneel; dubbele registratie geeft een veldmelding.
Gerichte regressietests toegevoegd. Lokaal: 8.389 tests groen (2 bestaande skips), typecheck, lint,
productiebuild, volledige formatting, env/workflow-checks en secretscan groen. Vier Playwright-tests
groen op de productiebuild, inclusief de sessie-update-aanval tijdens onboarding. Onafhankelijke
review PASS. PR #1418 heeft alle verplichte CI-controles doorstaan en is gemerged; live health en
readiness bevestigen commit `34f658e` op 7 september om 10:18 UTC.

## 2026-09-07 — bemiddelaar: reeds-verlopen roster-cert telt mee in de /franchise/zzpers-badge (badge↔lijst-drift gedicht)

**Wat:** de nav-badge op `/franchise/zzpers` (`navBadges` → `rosterAlerts`, `signals.ts`) telde alléén de
(bijna-)verlopende (`expiringProfiles`) + niet-inzetbare (`notEngageable`) roster-profielen — er was géén
query en geen term voor de **reeds verlopen, niet-verplichte** certificaten. De autoritaire /acties-bron
(`franchiserTasks`, `pending-tasks.ts`) toont daarvoor wél een `franchiseCredentialExpiredTask`
(`expiredRosterCreds` + `rosterExpiredByProfile`). Gevolg: zodra een niet-verplicht certificaat de
vervaldatum passeerde viel het uit het `(now, soon]`-verloopvenster en verdween het uit de badge, terwijl
`/acties` de "verlopen — vernieuwing nodig"-taak juist dán toont. De bemiddelaar zag geen zijbalk-signaal
terwijl er een actieve, niet-verdwijnende compliance-taak openstond — precies het "signaal op één
oppervlak"-anti-patroon dat elders al is gedicht (de VERIFIED-expiring-tak, de ZZP-`/certificaten`-badge).
`notEngageable` dekt het gat niet: `rosterExpiredByProfile` sluit juist de verplichte typen (VOG/verzekering)
uit die de engageability-tak afhandelt. **Fix:** `signals.ts` draait nu voor de verlopen-tak dezelfde
twee-staps-aanpak als `pending-tasks.ts` (kandidaat-query met de server-berekende verval-scope `status =
EXPIRED` óf `VERIFIED && expiresAt < now`, verplichte typen uitgesloten → gescopet volledig VERIFIED/EXPIRED-
dossier → `rosterExpiredByProfile` mét dekkings-/superseded-uitsluiting) en telt `expiredProfiles` mee in
`rosterAlerts`. Badge en actielijst delen dezelfde pure helper → kunnen niet driften. **Bestanden:**
`src/lib/signals.ts` (import + query + telling), `src/lib/signals.roster-expired-badge.test.ts` (+2 tests:
verlopen roster-cert → badge count 1; kandidaat-query heeft de juiste verval-scope + verplicht-type-
uitsluiting). **Checks:** prettier ✓ · typecheck ✓ · gerichte tests 2/2 ✓ · lint + full test + build + CI-poort
verifiëren.

## 2026-09-07 — persona-sweep (run 5): live doorklik hersteld + cascade-overdue-query op ACTIVE gescoopt

**Wat:** volledige kritische-gebruiker-sweep over alle vier de rollen (zzp@/opdrachtgever@/franchise@/
admin@). **Doorbraak:** de live Playwright-doorklik die de vorige 4 runs niet konden draaien (build hing
op `next/font/google`-fetch → ECONNRESET) is nu wél uitgevoerd — de font-download reset onder de
parallelle build-fetch, dus lokaal (alléén lokaal, niet gecommit) de fonts gestubd → offline
productiebuild → server → sweep. **DOEL 2 (adversarieel) schoon:** 63 probes, **0 bereikbare gaten, 0
500's** (alle status 200/404). Privilege-escalatie (zzp'er/opdrachtgever/franchiser → `/admin/*` en
`/franchise/*`) → redirect naar `/dashboard`; IDOR/onzin-id op samenwerkingen/facturen/opdrachten/
certificaten/berichten → **404** (nooit 500, geen soft-404-lek); **cross-tenant** (franchiser →
`/samenwerkingen/collab-1` + `/api/samenwerkingen/collab-1/dossier|dba-dossier` van een andere tenant)
→ 404. Sluit aan op 3 parallelle adversariële Opus-audits (security/IDOR/tenant · malicieuze invoer/Zod ·
next-action-correctheid): security + validatie **0 gaten**; next-actions 2× LOW (defense-in-depth), waarvan
#1 gefixt.

**Gefixt (DOEL 1b — server-side waarheid / juiste partij aan zet):** de opdrachtgever-taak
`clientCascadeOverduePaymentTask` (`pending-tasks.ts`) en zijn badge-mirror (`signals.ts`) scoopten de
OVERDUE-cascadefactuur-query op `collaboration: { disputedAt: null }` **zonder** `status: "ACTIVE"` — terwijl
de ZZP-tegenhanger (`openInvoiceWhere`) én de SUBMITTED-factuur-sibling in dezelfde bestanden dat wél doen.
Alleen de ZZP'er kan de betaling registreren (→ PAID), en die actie bestaat enkel op een ACTIVE
samenwerking. De terminale-status-guards (`collaborationTerminableGuard`) houden een OVERDUE-factuur vandaag
al binnen ACTIVE (dus latent, geen bereikbaar gat nu), maar de `payment-reminders`-cron zet APPROVED→OVERDUE
**zonder** collab-status-filter: zou een toekomstige regressie in die guards een deal met open factuur laten
afronden/annuleren, dan kreeg de opdrachtgever een niet-afhandelbare, nooit-verdwijnende betaal-taak (de
ZZP-tegenhanger toont 'm terecht níet). **Fix:** `status: "ACTIVE"` toegevoegd aan beide queries — badge en
lijst blijven identiek gescoopt. **Bestanden:** `src/lib/actions/pending-tasks.ts`, `src/lib/signals.ts`,
`src/lib/actions/pending-tasks-client-overdue-payment.test.ts` (+1 test, rood→groen bewezen door de fix te
stashen: `expected { disputedAt: null } to match { status: "ACTIVE", disputedAt: null }`). **Checks:**
typecheck ✓ · lint ✓ · prettier ✓ · gerichte tests 6/6 ✓ · full test + CI-poort verifieert. Geparkeerd in
de sweep-backlog: het 2e LOW next-action-item + de journeys-spec `networkidle`-timeout (test-infra, geen
product-defect; sluit aan op CURRENT_TASK.md punt 5).

## 2026-09-07 — robuustheid (ORT/geld-integriteit): segmentatie klemt de uur-grens binnen één stap

**Wat:** `segmentShift` (`src/lib/shift.ts`) — de motor die een gewerkte dienst automatisch in ORT-uren
per categorie splitst (avond/nacht/weekend/feestdag) — liep de dienst in vaste stappen van 15 min door en
klasseerde **elke slice volledig op zijn start-instant**. ORT-categorieën wisselen alleen op hele-uur-grenzen
(18:00 EVENING, 22:00 NIGHT, 06:00 terug NORMAL, en middernacht voor weekdag-/feestdagwissels). Zodra zo'n
grens **binnen** een stap viel — wat gebeurt bij elke niet-op-het-kwartier-uitgelijnde diensttijd (bv. een
nachtdienst die om 21:50/22:10/07:37 begint) — werden de minuten aan de overkant van de grens op het
**verkeerde toeslagtarief** geboekt. Concreet: `21:50–22:20` gaf `EVENING 0,25u / NIGHT 0,25u` i.p.v.
`0,17u / 0,33u` — 5 nachtminuten (+49%) als avond (+22%) geboekt, dus structurele onderbetaling van de
zorgverlener (bij €30/u ~€0,64 op die slice). Reachable via de gewone UI: de urenstaat-datumvelden
(`performance-form.tsx`, `<input type="datetime-local">` zonder `step`) accepteren minuut-precisie en niets
downstream lijnt uit; de mis-geboekte uren bevriezen in `Invoice.subtotalCents` bij goedkeuring. Geen enkele
bestaande test ving dit — ze gebruikten allemaal op het kwartier uitgelijnde tijden. **Fix:** de doorloop-lus
klemt nu elke slice op de eerstvolgende hele-uur-grens (`new Date(y,m,d,h+1)`), zodat de start-instant-
classificatie exact wordt; totale duur en de O(duur)-DoS-grens (`MAX_SHIFT_HOURS`) blijven behouden, en de
lus vordert altijd (nextHour ligt strikt ná t). **Bestanden:** `src/lib/shift.ts` (segmentatie-lus),
`src/lib/shift.test.ts` (+7 tests: 4 grens-binnen-een-stap-cases avond→nacht/nacht→NORMAL/NORMAL→avond/
middernacht za→zo, stap-onafhankelijkheid, duur-behoud over meerdere grenzen, 60-min-stap). **Checks:**
typecheck ✓ · lint ✓ · prettier ✓ · gerichte tests 70/70 (5 nieuw rood→groen bewezen door de fix te
stashen) · volledige suite 8359 ✓ · build ✓ · CI-poort verifieert.

## 2026-09-07 — prod: RFC 6266 UTF-8-bestandsnamen voor document-/factuur-/media-downloads

**Wat:** downloads verloren diacritische tekens en spaties in de bestandsnaam (`André.pdf → Andr_.pdf`,
`mijn diploma.pdf → mijn_diploma.pdf`) omdat géén Content-Disposition-producer de RFC 6266
`filename*=UTF-8''…`-parameter zette — alleen de gesaneerde ASCII-`filename=`. Op een NL-platform met veel
geüploade certificaten/facturen (André/Renée/Zoë/Müller) een echte fidelity-degradatie. **Fix:** gedeelde
drift-vaste helper `src/lib/http/content-disposition.ts` die náást de injectie-proof ASCII-fallback óók
`filename*` toevoegt — alleen wanneer de percent-codering écht iets toevoegt (≥1 `%XX`: spatie/diakritiek),
dus een na-sanering-puur-ASCII-naam (gestripte traversal) krijgt géén overbodige `filename*`. `filename=`
= `[\w.-]` (geen `"`/`;`/CR/LF); `filename*` RFC 5987 percent-gecodeerd → óók injectie-proof; unicode-variant
strippt control-/pad-/reserved-tekens. Centrale helpers `inlineDisposition`/`sanitizeAttachmentFilename`
(`resource-headers.ts` → documents/facturen-PDF) en `buildContentDisposition` (`storage.ts` → presigned
S3-URLs/media) routeren er nu doorheen. **Bestanden:** `content-disposition.ts` (+ `.test.ts`, 20 tests),
`resource-headers.ts`, `storage.ts` (+3 test-cases). **Checks:** typecheck · lint · prettier · gerichte
tests 58/58 ✓ · build + CI-poort verifieert.

## Staat van het product (2-9-2026)

- **Live:** `main` is bron van waarheid én deploy-branch; Railway deployt elke gemergde PR. Poort: 6 vereiste checks + `migrations`-driftcheck, `enforce_admins` AAN. Boot draait `prisma migrate deploy` (geen `db push` meer in productie); `monitor.yml` bewaakt deploy-lag (issue-label `deploy-lag`).
- **Werkt end-to-end:** opdracht → match → reactie → samenwerking → contract → urenstaat (incl. ORT) → goedkeuring → factuur → betaalregistratie → administratie/BTW. Plus certificaat-dossier met verificatie/verval, next-action-engine, DBA-monitor en tenant-cockpit voor bemiddelaars.
- **Bewust UIT (env-gestuurd, inert):** billing (`noop`), e-mail (`noop`), documentopslag (`local`, geen S3), verificatie-koppelingen DUO/BIG/iDIN (`mock`), web-push (geen VAPID-sleutels), aangifte-partner. Rate-limit-store draait op Redis (`RATE_LIMIT_STORE=redis`). Elk kanaal heeft een zelftest + aflever-heartbeat op `/admin/systeemstatus`.
- **Mensenwerk vóór livegang** (MENSENWERK.md §0): jurist-/AVG-review met echte gevoelige documenten, productie-secrets, betaalprovider, echte verificatie-API's, mailprovider, S3, eigen domein.
- **Open strategische keuze:** focus & wig — voorstel in [ADR 0011](docs/decisions/0011-focus-en-wig.md) (status: voorgesteld, eigenaarsbesluit).
