# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

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

## 2026-09-07 — security/privacy (audit): CWE-770-volume-rem op de support-hub (laatste ongeremde UGC-mutatie)

**Wat:** volledige security-/privacy-auditronde (orchestrator Opus 4.8 + 3 parallelle adversariële Opus-audits op
niet-overlappende oppervlakken: **A** alle server actions, **B** alle ~45 API-routes plus middleware, tenant-isolatie,
storage, injectie, SSRF en webhook-/cron-auth, **C** privacy/AVG erasure/export/PII/retentie/k-anonimiteit).
Alle drie de oppervlakken **0 exploiteerbare gaten** (auth→rol→ownership→Zod→audit-keten overal, TOCTOU-safe
compound-writes, CWE-203 anti-oracle-404, geen path-traversal/SSRF/injectie, erasure CI-schema-gated,
cross-tenant query-niveau geïsoleerd). Orchestrator-sweep los: `npm audit` 0 productie-vulns, geen raw-SQL-sinks,
geen tracked secrets/documenten, geoapify-SSRF-oppervlak vaste host. **Live Playwright-doorklik niet uitvoerbaar in
deze sandbox** (build draait wél groen). **Eén gat gedicht (MIDDEL, CWE-770):** de support-hub was het enige
authenticated UGC-mutatie-oppervlak zónder per-gebruiker-rate-limit — `createTicket`/`replyToTicket` staan open
voor élke ingelogde gebruiker, schrijven vrije tekst plus triage-scan plus notificatie-/audit-fan-out, maar hadden
geen volume-rem (message/application/invite/noshow/idea/upload/invoice hebben die wél). Een scripted account kon zo
onbegrensd `SupportTicket`/`SupportMessage`-rijen aanmaken (DB-/storage-bloat + helpdesk-flood). **Fix:** nieuwe
`supportTicketRateLimiter` (default 20/uur, gedeelde bucket over beide acties) vóór de scan/lookup en write;
`createTicket` geeft `{ error }`, `replyToTicket` werpt — parity met de sibling-remmen. **Bestanden:**
`src/lib/rate-limit.ts` (nieuwe limiter), `src/app/(protected)/support/actions.ts` (2 checks),
`src/app/(protected)/support/rate-limit.test.ts` (+4 tests, rood→groen bewezen). **Checks:** typecheck ✓, lint ✓,
prettier ✓, gerichte tests 8/8 ✓, build ✓, full test + CI-poort verifieert. Backlog bijgewerkt.

## 2026-09-07 — bemiddelaar: open disputen zichtbaar op de samenwerkingen-cockpit (bevroren plaatsing = eigen aandachtsklasse)

**Wat:** een open dispuut bevriest een plaatsing — het cascade-werkproces (uren → goedkeuring → factuur)
staat stil tot het is opgelost — maar de bemiddelaar-cockpit `/franchise/samenwerkingen` telde en toonde
disputen nergens. `disputedAt` werd uitsluitend gebruikt om ándere signalen te ónderdrukken
(vervolg-nudge in `collaboration-renewal.ts`, voorstel-ouderdom, roster-dossier), waardoor een bevroren
inzet volledig onzichtbaar viel: geen strip-tegel, geen kop, geen rij-markering, en in de lijst-sortering
zakte hij naar rang 2 (renewal-fase `none`). De bemiddelaar die de plaatsing regelde had zo geen enkel
zicht op stilstaand werk. **Nu:** (a) `FranchiseCollabOversight` krijgt een eigen `disputed`-teller —
lopende inzet (ACTIVE óf PROPOSED; `openDispute` staat een dispuut op beide toe) met `disputedAt !== null`,
terminale statussen tellen niet mee, (b) de strip toont een danger-tegel "Bevroren dispuut · werkproces
staat stil" (alleen bij > 0, DESIGN.md: toon alleen wat telt), (c) de kop noemt het dispuut-signaal
**vóór** het vervolg-/voorstelsignaal (bevroren = urgenter dan aflopend), (d) de lijst sorteert bevroren
inzet naar de top (rang −1, boven overdue) en draagt een rij-chip "Bevroren · dispuut". Pure, server-side
afgeleide presentatie — geen mutatie/schema/authz-oppervlak; één bron (`collaborationFrozenRowBadge` +
`summarizeFranchiseCollaborations`) voor strip én lijst, dus geen drift. **Hoe:** `disputed`-veld +
`collaborationFrozenRowBadge` in `src/lib/franchise/collaboration-oversight.ts`; danger-tegel +
dynamische kolomtelling (3–5) in de strip; import + sort-rang + rij-chip in de pagina. **Bestanden:**
`collaboration-oversight.ts` (+ `.test.ts`, +5 tests → 20), `components/franchise/collaboration-oversight-strip.tsx`,
`app/(protected)/franchise/samenwerkingen/page.tsx`. **Checks:** typecheck · lint · prettier · unit ·
build · CI-poort verifieert.

## 2026-09-06 — bemiddelaar: churn-risico-tiering + "bel de koudste eerst" op de klantenlijst

**Wat:** de bemiddelaar-cockpit `/franchise/opdrachtgevers` toonde stilgevallen klanten (`attention`) als
één ongesorteerde hoop met een generieke "Stilgevallen"-chip — bij een pool van tientallen klanten geen
antwoord op "wie bel ik het eerst?". Elke bemiddeling/CRM (benchmark Bullhorn/PIDZ-regiokantoor) tiert
koude accounts op verval-risico. **Nu:** (a) stilgevallen klanten worden getierd op koude-duur —
`watch` (30–59 dagen) vs. `high` (≥ `CLIENT_CHURN_RISK_DAYS` = 60), (b) de rij-chip draagt de concrete
duur + escalerende toon ("Stilgevallen · 34 dagen" warning → "Lang stil · 72 dagen" danger), (c) de
klantenlijst sorteert op `clientOutreachRank` — stilgevallen (koudste eerst) → plaatst nu → rustig, zodat
wat actie vraagt bovenaan komt (Noord-ster), en (d) strip + headline lichten het hoog-risico-aantal eruit
("… 2 al langer dan 60 dagen: bel die eerst."). Pure, server-side afgeleide presentatie (geen mutatie/
schema/authz-oppervlak); de sortering is stabiel (V8) dus gelijke rang behoudt de createdAt-desc-volgorde.
**Hoe:** nieuwe pure exports in `src/lib/franchise/client-health.ts` — `CLIENT_CHURN_RISK_DAYS`,
`clientChurnRisk`, `clientOutreachRank`, `clientAttentionChip` + `ClientHealthSummary.attentionHigh`
(deelverzameling van `attention`); `summarizeClientHealth`/`clientHealthHeadline` verrijkt. Geen drift met
`signals.ts` (leest nog `.attention`). **Bestanden:** `client-health.ts` (+ `.test.ts`, 34 tests, +18),
`components/franchise/client-health-strip.tsx`, `app/(protected)/franchise/opdrachtgevers/(index)/page.tsx`.
**Checks:** typecheck ✓ · lint ✓ · prettier (hele repo) ✓ · unit 8322 ✓ (de 2 `react-render-phase-ping`
env-only, groen na `npx patch-package` — CI draait dit) · build ✓ · CI-poort verifieert.

## 2026-09-06 — robuustheid: lengte-cap op identiteits-/betaalvelden (KvK/BTW/IBAN) vóór de format-check

**Wat:** vier vrije-tekstvelden in de Zod-schema's die directe server-actions voeden — de KvK bij de
bureau-zelfaanmelding (`bureauRegisterSchema`) en KvK/BTW-id/IBAN op het freelancerprofiel
(`freelancerProfileSchema`) — misten als enige een expliciete lengte-cap (`.max()`). Anders dan de rest
van `validation.ts` (`optionalText`/`trimmed`/`languages` cappen wél) liep een ongebonden string per
aanroep volledig door de regex-validatie (`isValidKvk`/`isValidBtwId`/`isValidIban`) en de
normalisatie (`normalizeKvk`/`normalizeBtwId`/`normalizeIban`, elk een `.replace`/`.toUpperCase` over de
hele string) voordat de format-check hem afkeurde. Niet exploiteerbaar (ankered regex, geen ReDoS; de
body-limiet cap de request al), maar een inconsistentie/defense-in-depth-gat: een scripted aanroeper kon
per call onnodig werk laten verzetten. Geparkeerde LOW uit persona-sweep run 4
(`docs/PERSONA-SWEEP-BACKLOG.md`). **Hoe (één bron, drift-vast):** nieuwe helper
`optionalIdentityField({ max, isValid, message, normalize })` in `validation.ts` die de drie identieke
optionele velden produceert met de cap **in de union-string-tak** (`z.string().trim().max(...)`), zodat
een te lange invoer met een `too_big`-issue afvalt vóór de format-check draait; de verplichte bureau-KvK
kreeg `.max(32)`. Caps ruim boven elke geldige waarde (langste toegestane IBAN = 28 tekens), dus geen
echte invoer wordt geweigerd. **Bestanden:** `src/lib/validation.ts` (helper + 4 velden),
`src/lib/validation.test.ts` (+4 cases: geldige genormaliseerde in-/output; lege velden → undefined;
absurd lange invoer → `too_big` op alle vier de velden — rood→groen bewijs dat de cap vuurt, want zónder
`.max()` levert alleen de format-check een `custom`-issue). **Checks:** typecheck ✓ · lint ✓ · prettier
(gerichte bestanden) ✓ · gerichte tests 62/62 ✓ · build + full test + CI-poort.

## 2026-09-06 — prod: gestreamde body-limiet op publieke endpoints (CWE-400)

**Wat:** de vier publieke, ongeauthenticeerde body-lezende endpoints (`/api/client-error`,
`/api/csp-report`, `/api/billing/webhook`, `/api/mail-intake/webhook`) bufferden de body via
`request.text()` — dat leest de VOLLEDIGE stream in het geheugen vóór de byte-check. Een
`Content-Length`-pre-check (bij twee van de vier aanwezig) dekt alleen een eerlijke header; een
chunked request (Transfer-Encoding: chunked, géén Content-Length) omzeilde de pre-check en werd
onbegrensd gebufferd (CWE-400 geheugen-DoS, alleen begrensd door de per-IP count-rate-limit).
**Fix:** één geteste, drift-vaste helper `src/lib/http/read-limited-text.ts` (`readLimitedText`)
die (a) de `Content-Length`-header pre-checkt (afwijzen zónder lezen) én (b) de body **gestreamd**
leest en de reader cancelt zodra de lopende byte-som de grens overschrijdt — nooit méér dan de
grens (+ één chunk) in het geheugen, óók zonder Content-Length. Byte-nauwkeurig (UTF-8-bytes, niet
`string.length`/code-units) en byte-identiek aan `request.text()` (cruciaal voor Stripe-
handtekeningverificatie). Vier kopieën van het read-then-check-patroon vervangen door één bron.
**Bestanden:** `src/lib/http/read-limited-text.ts` (+ `.test.ts`, 10 tests) + de vier routes.
**Checks:** typecheck ✓ · lint ✓ · prettier (hele repo) ✓ · gerichte tests 51/51 ✓ · build ✓ ·
full test 8305 ✓ (de 2 `react-render-phase-ping`-fails waren env-only: `patch-package`-postinstall
niet gedraaid in de sandbox; na `npx patch-package` groen — CI draait dit bij `npm install`).

## 2026-09-06 — security/privacy (audit 2e): k-anonimiteit-accountability-gate op de anonimiseringsvloeren

**Wat:** volledige security-/privacy-auditronde (orchestrator Opus 4.8 + 3 parallelle adversariële Opus-audits op
niet-overlappende oppervlakken: **A** alle 53 server actions · **B** alle ~45 API-routes + tenant-isolatie +
storage + injectie + SSRF + webhook-auth · **C** privacy/AVG erasure/export/PII/retentie/k-anonimiteit). Alle drie
de oppervlakken **0 exploiteerbare gaten** (auth→rol→ownership→Zod→audit-keten overal, TOCTOU-safe compound-writes,
CWE-203 anti-oracle, geen path-traversal/SSRF/injectie, erasure CI-schema-gated). Orchestrator-sweep los: `npm audit`
0 productie-vulns, geen raw-SQL-sinks, geen tracked secrets/documenten. **Live Playwright-doorklik niet uitvoerbaar
in deze sandbox** (build draait wél groen; runtime-probe leunt op statisch+gerichte tests, zoals de vorige rondes).
**Eén accountability-gat gedicht (MIDDEL):** het platform toont op ≥6 plekken geaggregeerde persoonsgegevens
(markttarief, beoordelingen, betaalgedrag, betrouwbaarheid, reactiebereidheid, leverbetrouwbaarheid), elk met een
k-anonimiteitsvloer. Anders dan bij de erasure was er **geen geautomatiseerde poort** die (a) een stille verlaging
van een vloer tegenhield, noch (b) de art. 30-register-prosa aan de code bond — het register citeerde de markttarief-
vloer als hard-gecodeerde "10", ontkoppeld van `MARKET_RATE_MIN_SAMPLE`. **Fix:** nieuwe gate
`src/lib/compliance/k-anonymity-floors.test.ts` (7 tests, rood→groen bewezen door de constante tijdelijk naar 5 te
zetten): `MARKET_RATE_MIN_SAMPLE >= 10`, de vijf in-app-vloeren `>= 3`, en de register-prosa moet de werkelijke
constante citeren (doc↔code-binding). **Geschonden:** AVG art. 5(2)/art. 30 + art. 5(1)(f)/25. **Geen source-
wijziging van het register** — de prosa blijft mens-leesbaar, de test bindt haar. **Geparkeerd:** in-app review-
aggregatie-vloer (owner-gated UX, MENSENWERK §5), register↔Prisma-schema-coverage-gate (LAAG, grotere diff),
mail-intake-From-spoofing (LAAG), liveness-probe-SHA (LAAG) — zie `docs/SECURITY-PRIVACY-BACKLOG.md`. **Checks:**
typecheck ✓ · lint ✓ · prettier (hele repo) ✓ · gerichte tests 130/130 ✓ · build ✓ · full test + CI-poort.

## 2026-09-06 — persona-sweep (run 4): twee robuustheidsgaten gedicht (int4-vangnet + zoekterm-cap)

**Wat:** persona-sweep run 4 (3 parallelle adversariële Opus-audits: cascade-geldpad · cross-tenant/IDOR/
document-privacy · malicieuze invoer/Zod). Alle drie de oppervlakken **0 bereikbare blockers**; twee
robuustheidsgaten gedicht. **Live Playwright-doorklik niet uitvoerbaar in deze sandbox:** de productiebuild
hangt op `next/font/google` → `fonts.gstatic.com` (netwerkbeleid blokkeert de font-fetch, connection reset
mid-exchange). CI heeft wél netwerk → e2e draait daar; omgevingsbeperking, geen defect.
**(1) int4-overflow-vangnet op `Invoice.totalCents`:** de bestaande grens-test claimde dekking "óók met kop
voor ORT-toeslag + BTW" maar assertte alléén het kale subtotaal (uren-cap × tarief-cap = €2 mln). Het echte
worst case is dat subtotaal × max ORT-maatwerktoeslag (`MAX_ORT_CUSTOM_BPS`, ×6) × hoogste BTW (2100 bps)
≈ €14,52 mln — veilig onder int4, maar de ~32% marge werd niet bewaakt. Een toekomstige cap-/BTW-verhoging
zou stil tot een int4-overflow → 500 kunnen leiden. **Fix:** de test rekent het maximum nu uit de bron-
constanten en faalt de build zodra de combinatie int4 nadert. **(2) ongebonden zoekterm-invoer:**
`searchPlatform` is een direct aanroepbare server-actie; `normalizeSearchQuery` verwerkte een ongebonden
string zonder lengte-cap. **Fix:** `MAX_QUERY_LENGTH = 100`; de ruwe invoer wordt begrensd vóór élke
stringbewerking (defense-in-depth tegen een flood). **Bestanden:** `src/lib/search.ts`, `src/lib/search.test.ts`
(+2, rood→groen), `src/lib/cascade/performance-commands.test.ts` (+1). **Geparkeerd (LOW):** kvk/btw/iban `.max()`,
onboarding-import-tarief-cap vs UI-cap, `confirmPayment` payer-callable (design-afweging). Zie
`docs/PERSONA-SWEEP-BACKLOG.md` (run 4). **Checks:** typecheck ✓ · lint ✓ · prettier ✓ · gerichte tests 54/54 ✓ ·
full test + build via CI-poort.

## 2026-09-06 — routine: anti-brute-force rem op identiteitsverificatie (parity met DUO/BIG)

**Wat:** `account/actions.ts verifyIdentity` — de zelf-verificatie die bij succes `identityVerifiedAt`

- de geverifieerde juridische naam vastlegt (dé basis voor het vertrouwensniveau en de naamcontrole bij
  credentials) **zonder admin-tussenkomst** — miste als enige zelf-verificatie-oppervlak de anti-brute-force
  rate-limiter die de DUO/BIG-credential-zelfverificatie (`verifyCredentialViaDuo/Big`,
  `credentialVerifyRateLimiter`) wél heeft. **Waarom:** defense-in-depth/consistentie (geparkeerde LOW-notitie
  uit persona-sweep run 3, `docs/PERSONA-SWEEP-BACKLOG.md`). De actie is direct aanroepbaar; zonder rem is ze
  geautomatiseerd te bombarderen — in productie doet elke poging een uitgaande iDIN-round-trip (kosten-/
  oracle-amplificatie richting de provider) en een geweigerde poging schrijft een auditregel. Niet acuut
  exploiteerbaar (mock is prod-geblokkeerd, echte iDIN is out-of-band), maar het gat is een robuustheids-/
  consistentie-defect. **Hoe (server-side, DRY):** nieuwe singleton `identityVerifyRateLimiter` (10/uur per
  `actor.id`, env `IDENTITY_VERIFY_RATE_LIMIT`, parity met `credentialVerifyRateLimiter`) in `rate-limit.ts`;
  `verifyIdentity` checkt de rem **direct ná `requireActor()`**, vóór de user-lookup én de provider-call, en
  geeft bij overschrijding `{ error: "Te veel verificatiepogingen…" }` — exact het patroon van de credential-
  verify-paden. **Bestanden:** `src/lib/rate-limit.ts` (+singleton), `src/app/(protected)/account/actions.ts`
  (import + check), `.env.example` (doc-regel), `src/app/(protected)/account/verify-identity-ratelimit.test.ts`
  (nieuw, 3 cases: overschreden rem → afkap vóór verifier/schrijf; key op `verify:<actor.id>`; toegestaan →
  doorloop). **Checks:** typecheck ✓ · lint ✓ · gerichte test 3/3 ✓ · prettier ✓ · full test + build via
  CI-poort. **PR #1406.**

## 2026-09-06 — routine: verlopen-certificaat-taken deduppen per type (ZZP'er /acties — rust boven ruis)

**Wat:** de generieke verlopen-certificaat-tak in `pending-tasks.ts` gaf één `credentialFixTask("expired")`
per verlopen niet-verplicht certificaat, zónder per-type-dedup — anders dan de verplicht-document-tak
(`expiredCredIdByType`) en de collab-tak (`credentialCollabExpiredTask`), die per type wél één kandidaat
kiezen. Gevolg: twee verlopen certificaten van hetzelfde type (bv. een oud én een nieuwer verlopen diploma)
gaven de ZZP'er twee vernieuw-taken naar twee `/certificaten/{id}/bewerken`-pagina's. **Waarom:** de
compliance van een type leunt op één geldig VERIFIED-certificaat (`coveredTypes`), dus één vernieuwing laat
béíde taken verdwijnen — de tweede rij is ruis. Noord-ster: het systeem toont alleen wat actie vraagt (rust
boven ruis). Parked LOW uit persona-sweep run 3 (`docs/PERSONA-SWEEP-BACKLOG.md`). **Hoe (server-side
waarheid, geen nieuwe rekenlogica):** `expiredNonMandatoryCreds` draagt nu ook `type`+`expiresAt`; de emissie
kiest per type het meest recent verlopen exemplaar (dezelfde keuze als de andere twee takken) en slaat een
type over dat al een hogere-band collab-taak kreeg (per-type i.p.v. de oude per-id collab-dedup — strikter,
want collab-taken worden per type ge-emit). Verschillende types blijven aparte taken (geen over-dedup).
**Bestanden:** `src/lib/actions/pending-tasks.ts`, `src/lib/actions/pending-tasks-expired-credential.test.ts`
(+2 cases rood→groen: zelfde type → 1 taak (laatst-verlopen); verschillende types → 2 taken). **Checks:**
typecheck ✓ · lint ✓ · gerichte credential-tests 13/13 ✓ · prettier ✓ · full test + build via CI-poort. **PR #1405.**

## 2026-09-06 — persona-sweep: ZZP'er ziet nu ook een mid-plaatsing-certificaatverval (asymmetrie gedicht)

**Wat:** de opdrachtgever kreeg al een einddatum-verankerde waarschuwing als een vereist certificaat ná
het 30-daagse venster maar vóór de `Collaboration.endDate` verloopt (`expiringDuringPlacement`,
`collaboration-alerts.ts`), maar de ZZP'er-tegenhanger (`collaborationCredentialExpiryConcerns`) ankerde
uitsluitend op `now + 30 dagen` en gaf géén `/acties`-taak tot het verval binnen 30 dagen viel — terwijl
de ZZP'er de énige is die het certificaat kan vernieuwen. Bij een plaatsing > 30 dagen zag de
opdrachtgever dus "verloopt vóór het einde van de opdracht" terwijl de ZZP'ers eigen actielijst leeg
bleef. **Waarom:** DOEL 1b (juiste partij "aan zet") + CLAUDE.md regel 1 (server-side waarheid); zelfde
asymmetrie-klasse die persona-sweep run 56/57 al dichtte voor missing/expired. **Hoe (pure spiegel, geen
nieuwe UI):** `CollabRequirementInput` krijgt een optionele `placementEnd`; de pure helper telt een
certificaat óók als zorg wanneer het vóór díe einddatum lapt (`duringPlacementOnly: true`) en neemt
alléén de plaatsingen mee waarvoor het daadwerkelijk vóór het einde verloopt (een langere plaatsing die
het wél dekt telt niet mee). De `/acties`-enumerator selecteert nu `Collaboration.endDate` en geeft het
door; de mid-plaatsing-taak hergebruikt dezelfde `credentialCollabExpiryTask`-verwoording ("verloopt
tijdens je opdracht") maar op een eigen, lagere band `credentialExpiringDuringPlacement` (71: boven
generiek verlopend 70, onder contractSign 72 én de binnen-venster-variant credentialExpiringForCollab
73). **Sweep verder schoon:** live Playwright over alle vier rollen (0× 500, geen privilege-escalatie,
geen soft-404-oracle) + 2 adversariële Opus-audits (mutatie-authz-keten · next-action-correctheid): 0
verdere bereikbare gaten; 3 LOW-items geparkeerd in `docs/PERSONA-SWEEP-BACKLOG.md`. **Bestanden:**
`src/lib/collaboration-credential-expiry.ts` (+`.test.ts`, +8 cases rood→groen), `src/lib/actions/tasks.ts`
(+`.test.ts`), `src/lib/actions/pending-tasks.ts`, `src/lib/next-actions.ts`. **Checks:** typecheck ✓ ·
lint ✓ · next-action/actions-tests 233/233 ✓ · prettier ✓ · full test + build via CI-poort.

## Staat van het product (2-9-2026)

- **Live:** `main` is bron van waarheid én deploy-branch; Railway deployt elke gemergde PR. Poort: 6 vereiste checks + `migrations`-driftcheck, `enforce_admins` AAN. Boot draait `prisma migrate deploy` (geen `db push` meer in productie); `monitor.yml` bewaakt deploy-lag (issue-label `deploy-lag`).
- **Werkt end-to-end:** opdracht → match → reactie → samenwerking → contract → urenstaat (incl. ORT) → goedkeuring → factuur → betaalregistratie → administratie/BTW. Plus certificaat-dossier met verificatie/verval, next-action-engine, DBA-monitor en tenant-cockpit voor bemiddelaars.
- **Bewust UIT (env-gestuurd, inert):** billing (`noop`), e-mail (`noop`), documentopslag (`local`, geen S3), verificatie-koppelingen DUO/BIG/iDIN (`mock`), web-push (geen VAPID-sleutels), aangifte-partner. Rate-limit-store draait op Redis (`RATE_LIMIT_STORE=redis`). Elk kanaal heeft een zelftest + aflever-heartbeat op `/admin/systeemstatus`.
- **Mensenwerk vóór livegang** (MENSENWERK.md §0): jurist-/AVG-review met echte gevoelige documenten, productie-secrets, betaalprovider, echte verificatie-API's, mailprovider, S3, eigen domein.
- **Open strategische keuze:** focus & wig — voorstel in [ADR 0011](docs/decisions/0011-focus-en-wig.md) (status: voorgesteld, eigenaarsbesluit).
