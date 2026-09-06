# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

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

## 2026-09-06 — routine: stilgevallen bench-ZZP'er als /acties-taak voor de bemiddelaar (re-engagement)

**Wat:** het roster-dormancy-signaal (`classifyRosterDormancy`, `roster-dormancy.ts`: een inzetbare
vakmens die op de bench zit — geen lopende opdracht — én ≥`DORMANT_IDLE_DAYS` (60) niet inlogde) leefde
op **één** oppervlak: de roster-lijst `/franchise/zzpers`. Het verscheen niet op `/acties`, in de
zijbalk-badge of op de dashboard-rail — precies het "signaal op één oppervlak"-anti-patroon dat de
codebase herhaaldelijk dicht. **Waarom:** een afgekoelde, niet-ingezette vakmens drijft stil weg naar een
concurrent; dit is dé proactieve re-engagement-actie van de bemiddelaar (benchmark: staffing-platformen
bewaken werker-engagement). Aanbod-spiegel van de reeds gemergde `franchiseClientReengagementTask`
(stilgevallen opdrachtgever), die exact dezelfde single-surface-fout voor de vraag-kant dichtte. **Hoe
(server-side waarheid, DRY):** nieuwe item-taak `franchiseRosterReengagementTask` (`actions/tasks.ts`,
kind `franchise-roster-reengagement`, `resolver: "link"` → deep-link naar het ZZP'er-dossier
`/franchise/zzpers/[id]`), gewired in `franchiserTasks` (`actions/pending-tasks.ts`) via **dezelfde pure
`classifyRosterDormancy`** als de roster-lijst — geen herberekening die kan driften. De roster-query
kreeg de bench-telling `_count.collaborations (ACTIVE)` erbij (zelfde definitie als de lijst). Alleen de
`dormant`-tier levert een taak; `cooling` blijft een zacht lijst-only signaal (rust boven ruis). Een
**niet-inzetbaar** bench-lid krijgt alleen de hoger-geprioriteerde blokkerende `franchise-not-engageable`-
taak, niet óók de re-engagement-nudge (geen dubbele rij voor één persoon). Prioriteit
`P.franchiserRosterReengagement = 54`: onder de klant-re-engagement (55 — een hele vraag-relatie), boven
koude lead-opvolging (50 — bestaande relatie > koude acquisitie); rol-geïsoleerd (franchiser-only).
**Bestanden:** `src/lib/next-actions.ts` (P-band), `src/lib/actions/tasks.ts` (union + builder),
`src/lib/actions/pending-tasks.ts` (import + roster-`_count` + emit), `src/lib/actions/tasks.test.ts`
(builder-vorm/rangschikking), `src/lib/actions/pending-tasks-franchiser.test.ts` (+3 emit-cases: dormant
→ taak; recent/ingezet → geen taak; niet-inzetbaar bench → alleen de blokkerende taak). **Checks:**
typecheck ✓ · lint ✓ · prettier ✓ · unit 8271 passed (incl. de nieuwe cases) · build (CI-poort
verifieert). **PR #1403.**

## 2026-09-06 — prod: Grafana-dashboard voor /api/metrics (observability-triade compleet)

**Wat:** de observability-bundle had de gauges (`/api/metrics`, ~70 stuks via `buildMetrics`) en de
alerts (`docs/observability/alerts.yml`) al, maar **geen dashboard**. Een operator kon de
dead-man's-switch-heartbeats, aflever-kanalen, cron-backlogs en AVG-retentie alleen via losse PromQL of
via `/admin/systeemstatus` (admin-login) zien. **Waarom:** productie-rijpheid/robuustheid — een
kant-en-klaar dashboard maakt de bestaande gauges in één oogopslag bruikbaar zonder login; completeert de
triade metrics → alerts → **dashboard**. **Hoe:** een **generator als enige bron van waarheid**
(`scripts/grafana-dashboard.mjs`, puur/DB-vrij) bouwt uit een declaratieve secties-spec een Grafana-
dashboard-object → `docs/observability/grafana-dashboard.json` (import-klaar, portable Prometheus-
datasource-variabele). Rijen: beschikbaarheid/modus, cron/back-up-heartbeat, aflever-kanalen (ok +
opeenvolgende-mislukkingen + leeftijd-laatste-mislukking per kanaal), verificatie-wachtrij (SLA),
vastgelopen-pijplijn-backlogs, beveiligingsincidenten, AVG-retentie. **Drift-gate**
(`src/lib/observability/grafana-dashboard.test.ts`, zelfde patroon als `alerts-rules.test.ts`): de
gecommitte JSON is inhoudelijk (geparsed) gelijk aan de generator-uitvoer én elke door `buildMetrics`
geëxposeerde gauge komt in minstens één paneel voor — een nieuwe gauge zonder paneel of een dood paneel
breekt de CI-poort. Formatting is bewust van Prettier (aparte poort), niet byte-vastgeklonken in de test.
Geen runtime-wijziging, geen PII/secrets. **Bestanden:** `scripts/grafana-dashboard.mjs` (nieuw),
`docs/observability/grafana-dashboard.json` (nieuw, gegenereerd), `grafana-dashboard.test.ts` (nieuw, 8
tests), RUNBOOK §2a + MENSENWERK bijgewerkt. **Resterend mensenwerk:** het bestand één keer in Grafana
importeren. **Checks:** dashboard-test 8/8 ✓ · prettier ✓ · typecheck/lint/build via CI-poort. **PR #1402.**

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
