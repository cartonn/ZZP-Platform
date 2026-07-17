# SECURITY & PRIVACY BACKLOG — ZZP Platform

> Bevindingen uit de security-/privacy-auditronde. Gefixt = **OPGELOST** (met PR-referentie);
> geparkeerd met repro, severity (KRITIEK/HOOG/MIDDEL/LAAG), geschonden regel en aanbevolen fix.
> Pak per run de 1–3 belangrijkste; werk dit bestand bij.

## Ronde 2026-07-17 (basis: `main` @ f32b9c7)

Audit: orchestrator (Opus 4.8) + 2 parallelle adversariële Opus-security-subagents op de **delta sinds de
vorige ronde** (`3d441cd..f32b9c7` — PR's #796–#800), op de niet-overlappende security-/privacy-relevante
oppervlakken. De 10 nieuwe `concept-3xx.tsx`-designbestanden (#800) zijn puur decoratieve UI (geen data-/
authz-oppervlak) — niet in scope. Kader: OWASP Top 10 (A01 broken access control, A03 injection, A05 misconfig,
A07 auth, A09 logging, A10 SSRF) + ASVS + AVG art. 5/9/15/30/32. Stack-CVE-check: Next.js **15.5.19** (voorbij
CVE-2025-29927 middleware-bypass), `npm audit --omit=dev` = **0**.

**Alle nieuwe oppervlakken bevestigd schoon op authz/tenant/injectie/secrets/SSRF/PII** (geen KRITIEK/HOOG/MIDDEL):

- **Betaalprovider-connectiviteitszelftest (#796)** — `billing-selftest.ts`, `billing/provider.ts` (`checkConnectivity`),
  `admin/systeemstatus/actions.ts` (`runBillingSelfTestAction`), `rate-limit.ts` (`billingSelfTestRateLimiter`),
  `components/admin/billing-selftest.tsx`. **SSRF (A10):** de provider-base-URL's zijn **hardcoded**
  (`https://api.stripe.com/v1`, `https://api.mollie.com/v2`) — geen enkel user-gestuurd URL-veld → geen
  SSRF-oppervlak; `checkConnectivity` doet uitsluitend een READ-ONLY round-trip (Stripe `GET /v1/balance`,
  Mollie `GET /v2/methods`) met vaste methode/pad, `fetchWithTimeout` (`BILLING_HTTP_TIMEOUT_MS`, `AbortController`).
  **Secrets (A05):** `STRIPE_API_KEY`/`MOLLIE_API_KEY` gaan alleen in de `Authorization: Bearer`-header, nooit in
  log/UI/audit/error. **Foutafhandeling (A09):** `BillingConnectivityError` reduceert een HTTP-fout tot provider+
  status; `safeBillingDetail` reduceert elke andere fout tot de error-**naam** — geen endpoint/sleutel/stacktrace.
  **Auth-keten:** `requireRole("ADMIN")` → `billingSelfTestRateLimiter` (6/5min per admin) → actie → audit
  `BILLING_SELFTEST_RUN` logt alleen `{ok, active}` + driver-modus, nooit `detail`/URL/sleutel. Op `noop`
  (demo) is er niets externs — eerlijk als "niets getest" gemeld (geen vals groen). **Geen geldverplaatsing**:
  de zelftest maakt nooit een betaling/checkout aan.
- **Bench-vooruitblik bemiddelaar (#797)** — `franchise/roster-availability-forecast.ts` + wiring in
  `franchise/zzpers/page.tsx`. **Cross-tenant (A01):** beide Prisma-queries scopen op `tenantScopeWhere(actor)`
  (fail-closed 403 zonder tenant); de nieuwe geneste `collaborations`-select hangt aan het al-tenant-gescopete
  `freelancerProfile` en accepteert geen enkele client-id (geen IDOR-oppervlak). De forecast-module is **puur**
  (geen I/O) en draagt alleen aggregaat (`{soon, thisWeek, earliestDays}`) + de eigen `freeDate` — nooit een
  cross-tenant naam/titel/id.
- **Beoordeling-next-action na samenwerking (#799)** — `collaboration-review-prompt.ts` (puur, geen I/O) +
  `pending-tasks.ts`/`tasks.ts`. Alle in-scope paden zijn **read-only** (geen mutatie → geen nieuwe auth-keten
  nodig); `reviewLeaveTasks(userId, role)` scoopt ownership via `{freelancer:{userId}}`/`{company:{userId}}` en
  `userId`/`role` komen altijd uit `requireActor()`/`requireRole()`, nooit uit een request-parameter. PII-select
  minimaal (`job.title`, `company.name`, `freelancer.user.name` + eigen review-existence op `authorId:userId`).
- **Kandidaat-ranking / vergelijk (#798, gemergd onder de titel "cashflow"; zie LAAG-nota)** —
  `candidate-ranking.ts` (puur, geen I/O, geen Prisma) + `kandidaten/vergelijk/page.tsx`. **IDOR (A01):** de
  pagina accepteert **alleen** `?job=<id>`; de kandidatenset komt server-side uit
  `application.findMany({where:{jobId: job.id}})` ná een ownership-gate `job.findFirst({where:{id, company:{userId:actor.id}}})`
  → een opdrachtgever kán geen willekeurige freelancer-id's meegeven om vreemde kandidaten te vergelijken (het
  invoerveld bestaat niet). Downstream-lookups her-scopen defensief (`company:{userId}`, `status:"PUBLISHED"`).
  **PII (AVG art. 5):** select bevat geen e-mail/telefoon/adres/BSN/IBAN; `location` gaat alleen via
  `classifyCandidateProximity` (grove bucket, nooit het rauwe adres); reputatie/kwaliteit pre-geaggregeerd. Geen
  `dangerouslySetInnerHTML`, geen Zod-mutatieschema (read-only).

Broad static sweep over de hele repo: `dangerouslySetInnerHTML` = alleen het genonce'd theme-script; raw SQL =
alleen `SELECT 1`-health-checks (tagged template); geen `.passthrough()` in Zod; geen `NEXT_PUBLIC_*`-secret; geen
`console.*` in de delta; geen `.env`/uploads/`.db` in git.

### Geparkeerd deze ronde

- **[LAAG · traceability / verantwoordingsplicht AVG art. 5(2)]** PR #798 is **gemergd onder de commit-titel**
  "routine: cashflow-samenvatting 'openstaand & onderweg' op /facturen (ZZP'er)", maar de daadwerkelijke squash-diff
  raakt uitsluitend `candidate-ranking.ts` + `kandidaten/vergelijk/page.tsx` — de kandidaat-ranking-feature, niet
  cashflow. De cashflow-/openstaand-panels op `/facturen` (`openstaand-panel.tsx`, `debtor-summary-card.tsx`,
  `prognose-panel.tsx`) bestáán al en dateren van vóór #798; er is niets verdwenen. Het is een **titel-mismatch**
  door parallelle agents die hun WIP samen squashten, geen code-vuln en geen datalek. **Aanbevolen:** bij het
  afronden van de cashflow-backlog-item de PROGRESS.md-regel voor #798 corrigeren zodat de projectadministratie
  klopt (commit-titels zijn geen betrouwbare grondwaarheid voor wat er shipte). Geen fix in deze ronde — puur een
  administratie-nota.
- **[LAAG · dataminimalisatie AVG art. 5(1)(c)]** `kandidaten/vergelijk/page.tsx` selecteert `headline` uit Prisma
  maar rendert/mapt het nergens (dode over-select — bereikt de client niet, dus geen lek). Opruimen bij de volgende
  aanraking van dat bestand.

### Geen nieuwe KRITIEK/HOOG/MIDDEL-bevindingen; geen nieuwe geparkeerde items

De betaalprovider-zelftest hergebruikt het bestaande, al-gepoortte zelftest-patroon (hardcoded base-URL, geen
user-URL, sleutel alleen in de auth-header, veilige error-reductie) i.p.v. een nieuw SSRF-/secret-pad; de
franchise-/beoordeling-/kandidaat-oppervlakken zijn read-only en hergebruiken de bestaande tenant-/ownership-scoping.
De eerder geëscaleerde mens-beslissingen blijven staan (steekproefvloer n=3 vs. eigen k≥10 voor de reputatie-/
betaalsignalen; `Job.title`/`description` + `Performance.*`/`NoShowReport.reason` bij erasure).

## Ronde 2026-07-16 (2e — basis: `main` @ 3d441cd)

Audit: orchestrator (Opus 4.8) op de **delta sinds de vorige ronde** (`a8d0139..3d441cd` — PR's #787–#794),
op de security-/privacy-relevante oppervlakken (de 20 nieuwe `concept-3xx.tsx`-designbestanden zijn puur
decoratieve UI, geen data-/authz-oppervlak — niet in scope). Kader: OWASP Top 10 (A01 broken access control,
A03 injection, A05 misconfig, A07 auth, A10 SSRF) + ASVS + AVG art. 5/9/15/30/32.

Nieuwe oppervlakken en de bevinding per oppervlak — **alle bevestigd schoon** (geen KRITIEK/HOOG/MIDDEL):

- **Externe verificatie-adapters DUO/BIG/iDIN (#788)** — `big-verifier.ts`, `diploma-verifier.ts`,
  `identity-verifier.ts`, `http-verify.ts`, `verify-selftest.ts`. **SSRF (A10):** endpoint-host uitsluitend
  uit env (`*_API_BASE`), nooit user-gestuurd → geen SSRF-oppervlak; `verifyViaHttp` hardcodeert methode/
  headers/pad, 8s-timeout via `AbortController`. **Secrets (A05):** `*_API_KEY` gaat alleen in de
  `Authorization: Bearer`-header, nooit in log/UI/audit/error. **Foutafhandeling (A09):** `VerifierRequestError`
  reduceert elke fout tot naam+status (`"BIG: koppeling gaf status 502."`), `safeVerifierDetail` reduceert
  onbekende fouten tot de error-NAAM — geen endpoint/sleutel/stacktrace naar de gebruiker. **Contract:**
  antwoord door `verifyResponseSchema` (Zod) gevalideerd; mock-fallback verzint nooit een `verified:true`.
- **Verifier-zelftest-actie** — `/admin/systeemstatus` `runVerifierSelfTestAction`. Keten auth→rol→rate-limit→
  actie→audit: `requireRole("ADMIN")` → `verifierSelfTestRateLimiter` (6/5min per admin, eigen store) → echte
  round-trip met **synthetische** probe-invoer (`"DUO-0000-0000"`, `"00000000000"`, `PROBE_HOLDER`) → audit
  `VERIFIER_SELFTEST_RUN` logt alleen `{key, active, ok}` + de driver-modus, nooit `detail`/URL/sleutel. Een
  `verified:false` op een verzonnen probe is een gezonde uitkomst (geen misleidend "geverifieerd"-signaal).
- **Franchise/tenant-signalen (#789, #793, #794)** — `roster-placement.ts`, `acute-open-diensten.ts`,
  `dienst-fill-signal.ts` + wiring in `pending-tasks.ts`. **Cross-tenant (A01):** `franchiserTasks` leidt
  `tenantId` server-side af uit de sessie-`userId` (fail-closed `return []` zonder tenant);
  `getRosterFillSignalsForTenant` scoopt **defensief** zowel de dienst- als de roster-query op `tenantId`
  (AND met de id-lijst), zodat een geïnjecteerde vreemde dienst-id wordt weggefilterd; de `/franchise/zzpers`-
  en `/franchise/diensten`-pagina's scopen via `tenantScopeWhere(actor)`. De signalen dragen **alleen
  aggregaat-tellingen** (`readyMatches`/`idleReady`/`countPlaceableDiensten`) — geen cross-tenant titel/naam/id.
  Read-only, geen mutatie/nieuw auth-oppervlak.
- **Afwijzingspatroon-inzicht ZZP'er (#791)** — `rejection-pattern.ts` op `/reacties`. **PII/AVG:** puur
  **self-view** — `requireRole("FREELANCER")` → applications `where: { freelancerId: profile.id }` (eigen
  profiel, afgeleid uit `userId: actor.id`). Aggregeert uitsluitend de eigen gestructureerde afwijzingscodes;
  geen cross-party-PII, geen individueel tarief van een derde. Geen k-anonimiteitsvraag (geen platform-brede
  aggregatie over identificeerbare derden).

Broad static sweep over de hele repo (niet alleen de delta): `dangerouslySetInnerHTML` = alleen het genonce'd
theme-script; raw SQL = alleen `SELECT 1`-health-checks (tagged template, geen injectie); geen `.passthrough()`
in Zod (geen overposting); geen `NEXT_PUBLIC_*`-secret; geen PII/secret in `console.*`; geen `.env`/uploads/`.db`
in git (alleen `.env.example`). `npm audit --omit=dev` = **0**; Next.js **15.5.19** (voorbij CVE-2025-29927
middleware-bypass); `package.json`/`package-lock.json` ongewijzigd in de delta.

### Geen nieuwe KRITIEK/HOOG/MIDDEL-bevindingen; geen nieuwe geparkeerde items

De nieuwe externe-verificatie-adapters introduceren geen user-gestuurd SSRF-pad en lekken geen sleutels; de
franchise-signalen hergebruiken de bestaande, al-gepoortte tenant-scoping i.p.v. een nieuw ongescopet pad; het
afwijzingspatroon blijft strikt self-view. De eerder geëscaleerde mens-beslissingen (steekproefvloer n=3 vs.
eigen k≥10 voor de reputatie-/betaalsignalen; `Job.title`/`description` + `Performance.*`/`NoShowReport.reason`
bij erasure) blijven staan — deze ronde voegde daar niets aan toe.

## Ronde 2026-07-16 (basis: `main` @ a8d0139)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op de **delta sinds de
vorige ronde** (`cb76ca2..a8d0139` — PR's #777, #779–#786), op niet-overlappende oppervlakken: (1) cross-
tenant/franchise-isolatie op de nieuwe acute-dienst-vulbaarheidssplitsing (`franchise/diensten/page.tsx`,
`acute-fillability.ts`, `dienst-fill-signal.ts`); (2) AVG/PII op de nieuwe aggregatie-/reputatie-signalen
(`vacancy-rate-diagnosis.ts` + caller, `collaboration-credential-expiry.ts` + `pending-tasks.ts`/`tasks.ts`,
`processing-register.ts`) — k-anonimiteit, PII-over-fetch, cross-party-lek, art. 30-dekking; (3) authz/secrets/
SSRF/DoS + dependency-CVE's op de rate-limit-store-zelftest (`systeemstatus/actions.ts`, `ratelimit-selftest.ts`

- `.tsx`, `rate-limit.ts`) en `npm audit`. Kader: OWASP Top 10 (A01/A03/A05/A10) + ASVS + AVG art. 5/9/15/17/30/32.
  De 10 nieuwe `concept-3xx.tsx`-designbestanden zijn puur decoratieve UI (geen data-/authz-oppervlak) — niet in scope.

**Alle drie de oppervlakken bevestigd schoon op authz/tenant/injectie/secrets/SSRF** (geen KRITIEK/HOOG):

- **Franchise/tenant:** `franchise/diensten/page.tsx:33` scoopt de `Job`-query op `tenantScopeWhere(actor)`
  (fail-closed 403 zonder tenant); `getRosterFillSignals` (`dienst-fill-signal.ts:121,136`) her-scoopt **defensief**
  zowel de dienst- als de roster-query op `tenantId` (AND met de id-lijst), zodat een geïnjecteerde vreemde id
  wordt weggefilterd; `acute-fillability.ts` draagt per item **alleen** `readyMatches: number` — géén titel/naam/id,
  het #730/#780-titel-lek blijft dicht per constructie. Read-only pagina, geen mutatie.
- **Rate-limit-zelftest (#782):** auth ADMIN op drie lagen (`middleware.ts:136` + page `requireRole("ADMIN")` +
  action `requireRole("ADMIN")`) → rate-limit (6/5min per admin, eigen memory-limiter zodat een kapotte Upstash
  de test niet blokkeert) → actie → audit (`RATELIMIT_SELFTEST_RUN`, logt alleen `{key, ok}` per stap, nooit
  `detail`/URL/token). `safeDetail` reduceert elke fout tot `error.name` — geen secret/endpoint in UI/audit/console.
  SSRF: host uitsluitend uit `UPSTASH_REDIS_REST_URL`, probe-commando's hardcoded, `probeKey` server-side UUID.
  `npm audit --omit=dev` = **0**; Next.js **15.5.19** (voorbij CVE-2025-29927 middleware-bypass).
- **Aggregatie/PII:** `diagnoseVacancyRate` hergebruikt de al-gepoortte marktband-engine (`MARKET_RATE_MIN_SAMPLE=10`,
  `scope:"none"`/`median:null` onder de vloer) en vergelijkt alleen het **eigen** `rateMax` van de opdrachtgever
  met de geaggregeerde mediaan — geen individueel ZZP-tarief, k≥10 end-to-end. `collaborationCredentialExpiryConcerns`
  wordt alleen vanuit `freelancerTasks(userId)` bereikt (eigen certificaten/samenwerkingen, self-view) — geen cross-
  party-lek; deep-link `/certificaten/[id]/bewerken` her-verifieert ownership → geen IDOR. Geen `$queryRaw`/
  `dangerouslySetInnerHTML`; `hint` is server-side numerieke interpolatie, auto-escaped.

### OPGELOST in deze ronde

- **[MIDDEL→OPGELOST · AVG art. 30 ontvanger-volledigheid / verantwoordingsplicht art. 5(2)]** De verwerking
  `markttarief-indicatie` (`src/lib/compliance/processing-register.ts`) beschreef de opdrachtgever-weergave als
  **uitsluitend** "op het opdracht-formulier", terwijl de tarief-diagnose (#783, `vacancy-rate-diagnosis.ts`) dezelfde
  geanonimiseerde mediaan nu óók toont aan opdrachtgevers op de **eigen opdrachtenlijst** (`/opdrachten`, via
  `VacancyRateDiagnosisNote`, bij een koud lopende opdracht die onder de markt biedt). Art. 30 vereist dat het
  register de werkelijke verwerking/ontvangers dekt; de tweede weergave-surface ontbrak → register-drift (zelfde
  klasse als de #781-register-volledigheidsfix). **Geen nieuwe grondslag/gegevenscategorie/risico** — dezelfde k≥10-
  vloer, dezelfde geaggregeerde output. **Repro (was):** `PROCESSING_REGISTER.find(a => a.key==="markttarief-indicatie")`
  → `purpose`/`recipients` noemden alleen "opdracht-formulier", nooit de opdrachtenlijst/tarief-diagnose. **Gefixt:**
  `purpose` + een extra `recipients`-regel dekken nu expliciet de tarief-diagnose-weergave op de opdrachtenlijst.
  Test: `processing-register.test.ts` (+1 case die beide weergaven + de k-vloer pint; rood→groen — zonder de fix
  vindt de assertie de opdrachtenlijst-/tarief-diagnose-ontvanger niet). **Geschonden:** AVG art. 30(1) + art. 5(2)
  - CLAUDE.md regel 5 (register beschrijft de werkelijke verwerking).

### Geen nieuwe KRITIEK/HOOG-bevindingen; geen nieuwe geparkeerde items

De eerder geëscaleerde mens-beslissingen blijven staan (steekproefvloer n=3 vs. eigen k≥10 voor de reputatie-/
betaal-/betrouwbaarheidssignalen; `Job.title`/`description` + `Performance.*`/`NoShowReport.reason` bij erasure).
Deze ronde voegde daar niets aan toe: de nieuwe aggregaties hergebruiken bestaande, al-gepoortte engines i.p.v.
een nieuw ongepoort aggregatiepad te introduceren.

## Ronde 2026-07-15 (2e — basis: `main` @ cb76ca2)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) object-/functie-niveau-autorisatie + mass-assignment/overposting over **álle**
`src/app/(protected)/**/actions.ts` + `src/lib/actions/**` + `src/app/api/**/route.ts`; (2) cross-tenant/
franchise-isolatie (`tenancy.ts`, `franchise/**`, `admin/franchises/**`) incl. het nieuwe geschikte-
vakmensen-vrij-signaal (`dienst-fill-signal.ts`, #779); (3) AVG — erasure-/export-volledigheid model-voor-
model tegen `anonymizeUser`/`account-anonymization.ts`/`account-export.ts`, k-anonimiteit, PII-in-logs.
Kader: OWASP Top 10 (A01/A03/A05/A10) + ASVS + AVG art. 5/9/15/17/30/32. De delta sinds de vorige ronde
(#773–#780: safe-action-error, delete-weigering-audit, mail-zelftest, tarief-passendheid-chip, dienst-fill-
signal, compliance-ripple-taak + de bevroren-dispuut-guard) apart nagelopen. `npm audit --omit=dev` = **0**;
Next.js **15.5.19** gepatcht.

**Oppervlakken (1) en (2) bevestigd volledig schoon** (geen KRITIEK/HOOG-authz-/IDOR-/mass-assignment-/
tenant-gat): elke mutatie draagt de keten auth→rol→ownership/tenant→Zod→actie→audit; geen `.passthrough()`,
geen rauwe `...body`/`...input`-spread in prisma `create`/`update`; `tenantId`/`role`/`priceCents` altijd
server-herleid. Het nieuwe `dienst-fill-signal.ts` scoopt zowel de dienst- als de roster-query op de sessie-
`tenantId` en exposeert **alleen aggregaat-tellingen** (`readyMatches`/`idleReady`) — geen cross-tenant titel/
naam/id; het #730/#780-titel-lek blijft dicht (`firstTitle` alleen binnen de eigen tenant). De nieuwe mail-
zelftest (`mail-selftest.ts` + `systeemstatus/actions.ts`) volgt auth ADMIN→rate-limit→actie→audit, valideert
de ontvanger in de pure kern, logt het adres nooit, en brengt een fout terug tot de error-NAAM (geen secret/
endpoint). SSRF: push-endpoint-allowlist (https-only, officiële push-hosts), Geoapify/Resend hardcoded hosts.
XSS/SQLi: één genonce'd theme-script, alleen `SELECT 1` raw. Export lekt geen derde-partij-PII.

### OPGELOST in deze ronde

- **[MIDDEL→OPGELOST · AVG art. 30 register-volledigheid]** Drie geaggregeerde reputatie-/betrouwbaarheids-
  signalen die platform-breed over een **identificeerbare** partij worden getoond stonden **niet** in het
  verwerkingsregister (`src/lib/compliance/processing-register.ts`), terwijl de zuster-signalen markttarief
  (#14, k≥10) en betaalgedrag (#16, PAYMENT*MIN_SAMPLE_SIZE, #769) er wél in staan: (a) annulerings-
  betrouwbaarheid per opdrachtgever (`client-reliability.ts`, getoond aan ZZP'ers op de opdracht-detail);
  (b) reactiebereidheid per opdrachtgever (`client-responsiveness.ts`, opdracht-detail + reacties); (c)
  leverbetrouwbaarheid per ZZP'er (`collaboration-quality.ts`, getoond aan opdrachtgevers op kandidaten/
  vergelijk/inzicht). **Repro (was):** `PROCESSING_REGISTER.find(a => a.key === "…")` gaf `undefined` voor
  alle drie de verwerkingen. **Gefixt:** twee nieuwe `ProcessingActivity`-entries — `opdrachtgever-
betrouwbaarheidssignalen` (dekt (a)+(b), spiegelbeeld-signalen, zelfde weergavepagina) en
  `leverbetrouwbaarheid-zzp` (dekt (c)) — beide grondslag `GERECHTVAARDIGD_BELANG`, uitsluitend geaggregeerde
  categorie, steekproefvloer (`MIN_SAMPLE_SIZE`/`DELIVERY_MIN_SAMPLE`) als waarborg, retentie = live berekend/
  niet opgeslagen, betrokkenen incl. eenmanszaak-/natuurlijke-persoon-overlap. Test: `processing-register.test.ts`
  (+2 cases die grondslag/aggregatie/steekproefvloer/retentie pinnen; rood→groen — zonder de entries is
  `find(...)` undefined). \_Noot: het register **beschrijft** de bestaande verwerking; het kiest de k-drempel
  niet — die drempelkeuze blijft de geëscaleerde HOOG-beslissing hieronder.*

### Geparkeerd / geëscaleerd naar de mens (deze ronde)

- **[HOOG (art. 5(1)(a)/(d) eerlijkheid+juistheid) / geëscaleerd — steekproefvloer n=3 vs. platform-eigen
  k≥10, nu drie extra signalen]** Naast het al-geparkeerde `PAYMENT_MIN_SAMPLE_SIZE = 3` renderen óók
  `MIN_SAMPLE_SIZE = 3` in `src/lib/client-reliability.ts:41` (annuleringsbetrouwbaarheid per opdrachtgever),
  `MIN_SAMPLE_SIZE = 3` in `src/lib/client-responsiveness.ts:43` (reactiebereidheid per opdrachtgever) en
  `DELIVERY_MIN_SAMPLE = 3` in `src/lib/collaboration-quality.ts:7` (leverbetrouwbaarheid per ZZP'er) een
  reputatielabel over een **met naam getoonde, identificeerbare** partij (veel `Company`-records + elke ZZP'er
  zijn natuurlijke personen) — ver onder de eigen `MARKET_RATE_MIN_SAMPLE = 10`-vloer (`src/lib/config.ts:232`)
  die het platform juist voor de markttarief-aggregatie afdwingt. Mitigerend (anders dan de destijds
  bekritiseerde ambient betaal-chip): alle drie tonen de steekproefgrootte in de zichtbare tekst en het
  leverbetrouwbaarheid-signaal verbergt zich volledig onder `INSUFFICIENT`. Maar het is dezelfde n=3-vs-k≥10-
  drempelkeuze die het project bewust bij een mens heeft gelegd (les MENSENWERK: een agent kiest geen
  k-drempel). **Aanbevolen (voor de mens):** dezelfde beslissing die al voor `PAYMENT_MIN_SAMPLE_SIZE` openstaat
  in één keer laten gelden voor deze drie — óf optrekken naar k≥10 + guardtest spiegelen, óf expliciet
  onderbouwd goedkeuren. **Geschonden:** AVG art. 5(1)(a)/(d) + interne k-anonimiteitsnorm.
- **[LAAG · AVG art. 17 recht op verwijdering — `Job.title`/`Job.description` overleeft `anonymizeUser`]**
  `Job.title`/`Job.description` (`prisma/schema.prisma`) is door de CLIENT zelf geschreven vrije tekst;
  `anonymizeUser` (`admin/gebruikers/actions.ts`) redact `Company.description/website/location` maar raakt
  `Job` nergens aan (geen `job.updateMany`, en — anders dan bij vrijwel elk ander veld — géén begeleidend
  commentaar dat dit een bewuste keuze is). Lager risico dan `bio`/`motivation` (een vacaturetekst is doorgaans
  zakelijk), maar kan incidenteel contactgegevens bevatten ("Bel Jan op 06-…"). **Repro:** anonimiseer een
  opdrachtgever met ≥1 `Job` → `title`/`description` lezen onveranderd. **Aanbevolen (voor de mens):** beoordeel
  of `Job`-content een retentiegrond heeft (marktplaats-/matching-historie, vergelijkbaar met `Invoice`) en
  documenteer dat, óf redact het zoals de overige CLIENT-geschreven velden. Bewust niet unilateraal gewijzigd:
  retentie-vs-vergetelheid met een mogelijke bedrijfsvoering-bewaargrond is een mens-afweging (MENSENWERK §5).

## Ronde 2026-07-15 (basis: `main` @ fc5e03d)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) document-/PDF-/export-serving (`api/media/[...key]`, `api/documents/[id]`, alle
`facturen`/`prestaties`/`admin/facturatie`-pdf's, `samenwerkingen/[id]/{dossier,dba-dossier,modelovereenkomst}`,
`administratie/*`, `admin/export/invoices`, `documenten/actions.ts`, `storage.ts`); (2) tenant-/franchise-
isolatie + cross-party PII (`tenancy.ts`, `franchise/**`, `admin/franchises/**`, `kandidaten/**`,
`bemiddelaars-panel`); (3) injectie/XSS/SSRF/secrets-logging/error-leak over de hele `src/`-boom. Kader: OWASP
Top 10 (A01/A03/A05/A10) + ASVS + AVG art. 5/9/30/32. De delta sinds de vorige ronde (#768–#772: audit-retentie-
pruning, betaalgedrag-register-entry, maanddoel-voortgang, beschikbaarheids-conflict-chip, +10 ontwerpconcepten)
apart nagelopen: schoon — audit-retentie-taak is fail-closed/cron-gated/PII-vrij, income-goal + job-availability-
signal zijn pure, own-profile-scoped logica. `npm audit --omit=dev` = **0**; Next.js **15.5.19** gepatcht.

**Oppervlakken (1) en (2) bevestigd volledig schoon** (geen KRITIEK/HOOG-authz-/IDOR-/tenant-/upload-/SSRF-gat):
elke document-route re-verifieert ownership tegen de sessie-gebruiker + audit op inzage én weigering; `[...key]`-
media resolveert path-traversal-veilig binnen `baseDir` en vereist een DB-`logoKey`-match; tenant-scoping via
`tenantScopeWhere`/`ownsViaTenant`/`assertSameTenant` met server-herleide `tenantId` (nul mass-assignment op
`tenantId`/`role`); cross-tenant = ononderscheidbaar van onbekend-id (geen existence-oracle). Oppervlak (3): één
`dangerouslySetInnerHTML` (hardcoded theme-script + nonce), CSV via centrale `escapeCsvField`-guard op élke export,
ICS via `escapeIcsText`, SSRF met harde host-allowlists (Geoapify query-only, web-push-endpoint-allowlist), logger
redacteert PII/secrets, geen open redirect, cron `Bearer` + timing-safe.

### OPGELOST in deze ronde

- **[MIDDEL→OPGELOST · CWE-209 Information Exposure / OWASP A05:2021]** ~16 server-actions gaven
  `e instanceof Error ? e.message : "..."` (of `return e.message`) terug aan de client. De gecureerde
  applicatiefouten (`AuthorizationError`, `*TransitionError`, `CascadeError`, plain `Error` met NL-tekst) zijn
  veilig, maar een **onverwacht** fouttype dat níet in een curated-klasse zit — een uncaught Prisma-clientfout
  (kan kolom-/tabel-/constraint-namen echoën, bv. `Unique constraint failed on the fields: (email)`) of een Node
  system-error (`connect ECONNREFUSED 10.0.0.5:5432` — hostname/poort) — werd verbatim doorgestuurd. Lage kans,
  maar het gat verbreedt stil naarmate nieuwe mutaties failure-modes toevoegen die iemand vergeet in een curated
  klasse te wikkelen. **Repro (was):** forceer een Prisma-constraint-/verbindingsfout in een van de bedrade
  actions → de rauwe message verscheen in de fout-state naar de client. **Gefixt:** nieuw gedeeld helper
  `src/lib/safe-action-error.ts`. `isInternalError` markeert een fout als intern-lekkend wanneer het geen `Error`
  is, de naam met `PrismaClient` begint, óf er een niet-lege string-`code` is (Prisma `P####` + Node sys-errors);
  `toSafeActionError` logt die server-side (redacterende logger) en geeft een generieke NL-boodschap, terwijl
  curated messages behouden blijven. Bewust **denylist** (fail-safe op de echte lek-families) i.p.v. allowlist,
  om de bewust-Nederlandse curated UX-teksten niet te degraderen. Bedraad in `certificaten/actions.ts`,
  `admin/verificaties/actions.ts`, `account/actions.ts`, `admin/shift-overnames/actions.ts`,
  `diensten/importeer/actions.ts`, `samenwerkingen/[id]/actions.ts` (incl. de twee `return e.message`-paden die
  Next.js **niet** redacteert), `prestaties/actions.ts`. Test: `safe-action-error.test.ts` (9 cases,
  rood→groen: Prisma-/system-/niet-Error → generiek + gelogd; `AuthorizationError`/plain-`Error` → message behouden).
- **[LAAG→OPGELOST · CLAUDE.md regel 5 (audit alles wat telt) / OWASP A01 defense-in-depth]** `deleteDocument`
  (`documenten/actions.ts`) auditte `DOCUMENT_DELETED` alleen bij succes; een geweigerde poging (bestaand id,
  andere eigenaar → IDOR-poging, of onbekend id) gooide een generieke `Error` **zonder audit** — afwijkend van de
  read-routes die elke geweigerde inzage als `*_ACCESS_DENIED` loggen. **Gefixt:** `DOCUMENT_DELETE_DENIED`-audit
  vóór de throw, identiek voor "niet gevonden" en "niet van jou" (geen bestaans-orakel), gevolgd door dezelfde
  generieke foutmelding; er wordt niets verwijderd. Test: `documenten/delete-denied.test.ts` (2 cases; audit
  vuurt, `prisma.delete`/`storage.delete` niet — rood→groen).

### Geen nieuwe KRITIEK/HOOG-bevindingen

Geen open KRITIEK/HOOG-item toegevoegd deze ronde. De eerder geëscaleerde mens-beslissingen (o.a.
`PAYMENT_MIN_SAMPLE_SIZE`=3 vs. k≥10; `Performance.rejectionReason`/`NoShowReport.reason` als derde-partij-tekst
bij `anonymizeUser`) blijven staan voor de mens — deze audit heeft die niet gewijzigd (bewust: een agent kiest
geen k-drempel/retentiegrond, les uit de MENSENWERK-lijn).

## Ronde 2026-07-14 (2e — basis: `main` @ eea7c32)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) AVG-dataminimalisatie + k-anonimiteit op de nieuwe delta (`account-export.ts`/`/api/account/
export`, `payment-behavior.ts` + de betaal-vertrouwenschip op de browse-lijst, `compliance/*`); (2) minder-
betreden server-actions (`academie`/`ideeen`/`beschikbaarheid`/`reacties`/`uitgaven`/`account`/`search`/
`diensten/importeer`) + álle cron/task-routes + de publieke `.ics`-agendafeed; (3) cross-tenant/franchise-
isolatie + upload-veiligheid + SSRF + injectie (SQLi/XSS/CSV-formule). Kader: OWASP Top 10 (A01/A03/A05/A07/
A10) + ASVS + AVG art. 5/9/15/17/30/32. Twee oppervlakken volledig schoon bevestigd (geen KRITIEK/HOOG-
authz-/tenant-/injectie-/upload-/SSRF-gat: mutatieketen uniform, `escapeIcsText` dekt CRLF-injectie, cron
fail-closed timing-safe, media-`[...key]` vereist DB-match vóór storage, CSV via de centrale
`escapeCsvField`-guard op élke export, één `dangerouslySetInnerHTML` = hardcoded theme-script met nonce).

**Eén HOOG cross-party PII-lek gevonden én gefixt (rood→groen, export + erasure); één LAAG timing-side-channel
gefixt (rood→groen); één HOOG-k-anonimiteit-inconsistentie + twee LAAG/MIDDEL geparkeerd voor de mens.**

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · AVG art. 5(1)(f) confidentialiteit / OWASP A01]** De LIVE `Collaboration.disputeReason`
  is één muteerbaar veld: `resolveDispute` (admin) nult het, waarna de **tegenpartij** een nieuw dispuut op
  dezelfde samenwerking kan openen — het veld bevat dan hún tekst. Zowel de AVG-inzage-export
  (`src/lib/account-export.ts`) als de AVG-erasure (`anonymizeUser`, `admin/gebruikers/actions.ts`) scopeten
  op **alle-tijd** eigen `DISPUTE_OPENED`-events (`ownDisputeCollabIds`). Gevolg: (a) de export lekte de live
  dispuutreden van de tegenpartij in het eigen-data-bestand van de betrokkene; (b) de erasure vernietigde het
  lopende dispuutbewijs van de tegenpartij. **Repro:** F opent dispuut op C → admin lost op → X (tegenpartij)
  opent nieuw dispuut op C → F draait `GET /api/account/export` → X's reden `R2` staat in F's export; idem
  wist F's anonimisering X's live `disputeReason`. **Gefixt:** nieuw gedeeld helper `src/lib/dispute-ownership.ts`
  (`collaborationsWithActiveDisputeOpenedBy`) dat het dispuut-eventlog per samenwerking herspeelt (OPENED zet de
  huidige opener, RESOLVED wist 'm) en alleen de samenwerkingen teruggeeft waar de actor de opener van het
  HUIDIGE, nog-open dispuut is — spiegelt exact de `disputedAt`/`disputeReason`-toestandsmachine in
  `dispute-commands.ts`. Gebruikt in de export (live-veld-scope) én de erasure (`activeOwnDisputeCollabIds`,
  alleen voor de live `Collaboration.disputeReason`-null; de payload-/audit-/notificatie-redactie blijft
  correct breed op `actorId`, want dat is en blijft de eigen tekst van de betrokkene). Tests: `dispute-ownership.test.ts`
  (6 cases incl. heropening-door-tegenpartij), `account-export.test.ts` (+1 rood→groen: export-scope = leeg na
  heropening), `anonymize-erasure.test.ts` (+1 rood→groen: erasure raakt de heropende reden niet).
- **[LAAG→OPGELOST · CWE-208 timing-side-channel / OWASP A07 login-enumeratie]** `src/lib/authorize-credentials.ts`
  short-circuitte `bcrypt.compare` weg bij een onbekende e-mail / niet-ACTIVE account / lege (geanonimiseerde)
  passwordHash → dat account reageerde meetbaar sneller dan een fout wachtwoord op een bestaand ACTIVE-account,
  wat via de responstijd verraadt of een e-mail bestaat (het al-geparkeerde item van de vorige ronde). **Gefixt:**
  altijd precies één `bcrypt.compare` draaien; alleen een bestaand ACTIVE-account met gezette hash vergelijkt
  tegen zijn eigen hash, alle andere paden tegen een constante cost-10-equalizer-hash (matcht nooit). Tests:
  `authorize-credentials.test.ts` (+4: compare draait óók bij onbekende e-mail / niet-ACTIVE / lege hash;
  onbekende e-mail weigert zelfs als compare true zou geven).

### Geparkeerd / geëscaleerd naar de mens (deze ronde)

- **[HOOG (art.5(1)(a)/(d) eerlijkheid+juistheid) / geëscaleerd — betaal-vertrouwenschip k=3 vs. platform-eigen
  k≥10]** `PAYMENT_MIN_SAMPLE_SIZE = 3` (`src/lib/payment-behavior.ts:44`) rendert een reputatielabel ("Betaalt
  vaak laat") over een **met naam getoonde** opdrachtgever op de browse-lijst (`opdrachten/(index)/page.tsx`) op
  basis van slechts 3 facturen — terwijl het platform voor de markttarief-aggregatie een **harde k≥10-vloer**
  afdwingt (`market-rate.ts` + guardtest `market-rate.test.ts:89-93`, juist om deze klasse regressie te vangen).
  Het risico is hier arguably groter: het label wordt aan **derden** getoond over een **identificeerbare** entiteit
  (veel `Company`-records zijn eenmanszaken = natuurlijke personen), ambient op een lijst, zonder de sample-size-
  disclosure die de detailpagina (`payment-behavior-block.tsx`) wél geeft. **Aanbevolen (voor de mens):** óf
  `PAYMENT_MIN_SAMPLE_SIZE` optrekken naar de eigen k≥10-vloer + een guardtest spiegelen, óf expliciet documenteren/
  goedkeuren waarom een lagere drempel hier rechtmatig is, én de sample-size in het chip-`title`/aria-label opnemen.
  Bewust een agent níet zelf een k-drempel laten kiezen (les uit de MENSENWERK-lijn). **Geschonden:** AVG art.
  5(1)(a)/(d) + interne k-anonimiteitsnorm.
- **[MIDDEL → OPGELOST (PR #769) · AVG art. 30 register-volledigheid]** `src/lib/compliance/processing-register.ts`
  had wél een `markttarief-indicatie`-entry (incl. k≥10 als maatregel) maar géén equivalent voor het betaalgedrag/
  betaalreputatie-signaal, dat platform-breed wordt getoond (browse-lijst + opdracht-detail + `/verplichtingen`).
  **Gefixt:** `ProcessingActivity`-entry `betaalgedrag-reputatie` toegevoegd (doel, grondslag
  `GERECHTVAARDIGD_BELANG`, betrokkenen incl. eenmanszaak-overlap, categorie = uitsluitend geaggregeerde
  betaaltiming, `PAYMENT_MIN_SAMPLE_SIZE`-steekproefvloer als maatregel, retentie = live berekend/niet opgeslagen,
  ontvangers = browsende ZZP'ers + eigen reputatie-spiegel). Test: `processing-register.test.ts` (+1 case die de
  grondslag/aggregatie/steekproefvloer/retentie afdwingt). _Noot: de k-drempel-hoogte zelf (`PAYMENT_MIN_SAMPLE_SIZE`
  = 3 vs. k≥10) blijft de geëscaleerde HOOG-beslissing hierboven — het register beschrijft de bestaande verwerking,
  het kiest de drempel niet._
- **[LAAG → OPGELOST (PR #769) · defense-in-depth] `getPaymentBehaviorForCompanies`/`getPaymentBehaviorForCompany`**
  (`src/lib/data/payment-behavior.ts`) accepteren een rauwe `companyId`(s) zonder interne rol-/tenant-check; vandaag
  veilig (enige twee call-sites scopen op `visibleJobsWhere(actor)`), maar een toekomstige API-route eromheen zou
  arbitraire-opdrachtgever-betaalreputatie kunnen blootstellen. **Gefixt:** docstring op beide helpers die de
  scoping-verantwoordelijkheid van de aanroeper expliciet maakt (nooit een ongevalideerde, van buitenaf aangeleverde
  `companyId` doorgeven; scope op `visibleJobsWhere(actor)` of de eigen `Company`).

## Ronde 2026-07-14 (basis: `main` @ 4da72bb)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) object-/functie-niveau-autorisatie over **álle** `src/app/api/**/route.ts`-handlers +
`(protected)/**/actions.ts`-server-actions (excl. franchise) — IDOR/ontbrekende authz/mass-assignment/
status-transitie-bypass/error-leak; (2) cross-tenant/franchise-isolatie over `franchise/**` +
`admin/franchises/**` + `src/lib/tenancy.ts` + `src/lib/franchise/**` + de cross-party-PII-paden
(`/kandidaten`) — cross-tenant-IDOR/mass-assignment `tenantId`/`role`/dataminimalisatie/audit; (3) injectie
(SQLi/XSS/CSV-formule) + upload-veiligheid + SSRF + secrets/logging + auth-hardening + AVG-betrokkenenrechten
(`anonymizeUser`-erasure-volledigheid). Kader: OWASP Top 10 (A01/A03/A05/A07/A10) + ASVS + AVG art. 5/9/15/
17/30/32. De verse delta sinds de vorige ronde (#753–#758: logger-PII-hardening, graceful-shutdown-draining,
vacaturetempo-signaal, bulk-goedkeuren-urenstaten, urgentie-facturenlijst, +10 ontwerpconcepten) apart
nagelopen: schoon — het nieuwe bulk-goedkeur-pad (`prestaties/actions.ts`) is dubbel eigenaar-gescoopt
(query op `collaboration.company.userId` + `approvePerformance` her-controleert rol/ownership/transitie/audit
per item), de readiness/shutdown-endpoints zijn PII-vrij (alleen error-namen + publieke commit-SHA), de
facturen-urgentie-helper is pure sortering (geen export/injectie). Stack-CVE-check: Next.js **15.5.19** ≥
15.5.18 → volledig gepatcht tegen de mei-2026-release (13 CVE's incl. CVE-2026-23870 RSC-DoS). `npm audit
--omit=dev` = **0 kwetsbaarheden** (prod); de 2 dev-only-adviezen (esbuild-Windows-dev-server, js-yaml-DoS)
raken de productiebundel niet.

**Eén nieuwe MIDDEL/HOOG-AVG-erasure-gat gevonden én gefixt (rood→groen); één LAAG defense-in-depth-gat
gefixt; één art.17-deelstuk + twee LAAG-observaties geparkeerd.** Alle drie de oppervlakken bevestigd
schoon (geen KRITIEK/HOOG-authz-gat): de mutatieketen auth→rol→ownership/tenant→Zod→actie→audit is uniform
toegepast, tenant-isolatie via `tenantScopeWhere`/`ownsViaTenant`/`assertSameTenant` met server-herleide
`tenantId`, geen mass-assignment op `tenantId`/`role`, uploads via MIME-allowlist + magic-byte-sniff +
random-key + traversal-guard + SSE, SSRF met harde host-allowlists (Geoapify query-only, web-push-endpoint-
allowlist), wachtwoord-reset met gehashte single-use-token + trusted-origin + rate-limit, CSV via de centrale
formule-injectie-guard (CWE-1236), geen open redirect (geen enkele consumer van client-`callbackUrl`).

### OPGELOST in deze ronde

- **[MIDDEL–HOOG→OPGELOST · AVG art. 17 recht op verwijdering]** `anonymizeUser`
  (`src/app/(protected)/admin/gebruikers/actions.ts`) miste `Performance` volledig: `Performance.description`
  (niet-nullable werkomschrijving die de ZZP'er zélf typt bij het indienen van uren/mijlpalen — kan
  opdrachtgever/locatie/persoonsdetails bevatten) en `milestoneTitle` overleefden de anonimisering verbatim.
  De `Collaboration` wordt niet verwijderd (factuur-/fiscale historie), dus de `onDelete:Cascade` op
  `Performance` vuurt niet — precies zoals bij `Application`/`AvailabilityWindow`/`ShiftHandoff`/
  `WorkExperience`, die wél expliciet worden geredact. Dit was een oversight, geen bewuste retentiekeuze.
  **Gefixt:** `prisma.performance.updateMany({ where: { collaboration: { freelancer: { userId } } }, data: {
description: "[Verwijderd op verzoek van de gebruiker]", milestoneTitle: null } })` in de anonimiserings-
  transactie. Test: `anonymize-erasure.test.ts` (+1 case pint where-scope + redactie van beide velden;
  rood→groen — zonder de updateMany is `find("performance.updateMany")` undefined). **Repro (was):**
  anonimiseer een ZZP'er met ≥1 `Performance` → `description`/`milestoneTitle` lazen onveranderd.
- **[LAAG→OPGELOST · OWASP A01 defense-in-depth]** `src/components/admin/gebruikersbeheer/bemiddelaars-panel.tsx`
  (server-component) laadt álle tenants + de naam/e-mail van elke bemiddelaar (cross-tenant PII) zónder eigen
  server-side rolcheck; het leunde volledig op de ADMIN-gate van zijn enige aanroeper (`/admin/franchises` +
  middleware). Vandaag veilig (één correct-gegate call-site), maar bij hergebruik elders zou de check stil
  wegvallen — afwijkend van het patroon dat elke andere admin-loader/-actie in deze codebase zichzelf gate.
  **Gefixt:** `await requireRole("ADMIN")` bovenaan het paneel, vóór elke query. Test:
  `bemiddelaars-panel.test.ts` (nieuw; rood→groen: mockt `requireRole` als throw en assert dat het paneel
  weigert én dat `tenant.findMany` niet draaide vóór de poort).

### Geparkeerd / geëscaleerd naar de mens (deze ronde)

- **[HOOG (art.9-adjacent) / geëscaleerd — `Performance.rejectionReason` overleeft `anonymizeUser`]** Zelfde
  transactie als hierboven. `Performance.rejectionReason` (`prisma/schema.prisma:867`) is **door de
  OPDRACHTGEVER geschreven vrije tekst óver** de ZZP'er (verplichte reden bij het afkeuren van uren) en kan
  een gezondheids-/incapaciteitsreden bevatten (art. 9). Net als het al-geparkeerde `NoShowReport.reason` is
  dit derde-partij-tekst met een mogelijke bewaargrond bij een facturatie-/urengeschil (art. 17(3)(e)
  rechtsvordering) — een échte retentie-vs-vergetelheid-afweging die per MENSENWERK §5 bij de FG/mens hoort,
  niet bij een agent. De zelf-geschreven velden (`description`/`milestoneTitle`) zijn wél unilateraal gefixt
  (geen retentiegrond). **Repro:** anonimiseer een ZZP'er met een afgekeurde `Performance` → `rejectionReason`
  leest onveranderd. **Geschonden:** AVG art. 17 (+ art. 9 bij gezondheidsreden). **Aanbevolen (voor de mens):**
  óf `rejectionReason` op anonimisering redacten (spiegelt de zusters), óf een expliciete `Performance`-/
  `NoShowReport`-retentieregel + art.9-vlag in `processing-register.ts` vastleggen.
- **[LAAG · CWE-208 timing-side-channel op login-enumeratie]** `src/lib/authorize-credentials.ts` short-circuit
  vóór `bcrypt.compare` wanneer de gebruiker niet bestaat → een niet-bestaand account logt meetbaar sneller in
  dan een fout wachtwoord op een bestaand account. Lage praktische severity: rate-limiting + uniforme foutmelding
  staan al. **Aanbevolen:** altijd een dummy-`bcrypt.compare` tegen een constante hash draaien als er geen user is.
- **[LAAG · scale, geen security-bug] `getRosterCandidatesForDienst`** (`src/lib/franchise/dienst-voordracht.ts`)
  laadt alle tenant-freelancers via `findMany({ where: { tenantId } })` zonder `take`-cap (anders dan zusters
  met een `// unbounded-allow:`-motivatie). Geen lek — puur een schaalnotitie voor zeer grote tenants.

## Ronde 2026-07-13 (2e — basis: `main` @ 1fb87d5)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) object-/functie-niveau-autorisatie over **álle 38** `src/app/api/**/route.ts`-handlers
(IDOR/SSRF/rate-limit/error-leak/traversal/webhook-cron-auth); (2) cross-tenant/franchise-isolatie over
`src/app/(protected)/franchise/**` + `admin/franchises/**` + `src/lib/tenancy.ts` + `src/lib/franchise/**`
(IDOR/mass-assignment/status-transitie); (3) AVG-betrokkenenrechten (`lib/compliance/*`, `anonymizeUser`-
erasure-volledigheid, PII-in-logs, dataminimalisatie op de nieuwe dashboard-loaders, k-anonimiteit, export/
retentie). Kader: OWASP Top 10 (A01/A03/A05/A07/A09/A10) + ASVS + AVG art. 5/9/15/17/30/32. De verse delta
sinds de vorige ronde (#745–#751: betaal-webhook→overgangsmap, preflight-CLI, geldpuls/nog-te-factureren-
loaders, opdracht-kwaliteitsmeter, +10 ontwerpconcepten) apart nagelopen — schoon: de nieuwe data-loaders
(`data/vat-deadline.ts`, `data/unbilled-invoices.ts`) zijn owner-gescoopt, selecteren alleen bedragen/data
(geen cross-party-PII); de preflight-CLI toont nooit sleutelwaarden (werkt op booleans/modi). Stack-CVE-check:
Next.js **15.5.19** ≥ 15.5.18 → gepatcht tegen de mei-2026-release incl. de CSP-nonce-XSS (dit platform
gebruikt nonces); `npm audit --omit=dev` = **0 kwetsbaarheden**.

**Twee LAAG-bevindingen volledig gefixt (rood→groen); één HOOG/art.9 geëscaleerd naar de mens (juridische
keuze).** Alle drie de grote oppervlakken bevestigd schoon (geen KRITIEK): de mutatieketen auth→rol→
ownership/tenant→Zod→actie→audit is uniform toegepast (incl. audit van gewéigerde document-/dossier-toegang
voor IDOR-detectie), tenant-isolatie via `assertSameTenant`/`ownsViaTenant`/`tenantScopeWhere`, geen
mass-assignment op `tenantId`/`role`/`status`, storage met traversal-guard + magic-byte-sniff + SSE, push-SSRF
met harde host-allowlist, wachtwoord-reset met gehashte single-use-token + trusted-origin-URL + rate-limit,
`anonymizeUser` wist docs/credentials + redact 20+ vrije-tekstvelden incl. 4 dispuutreden-kopieën.

### OPGELOST in deze ronde

- **[LAAG→OPGELOST · AVG art. 5(1)(f) integriteit/vertrouwelijkheid · defense-in-depth PII-in-logs]**
  `src/lib/observability/logger.ts` maskeerde alleen het `fields`-object, niet de `message`-string zelf:
  een toekomstige call-site die een e-mailadres in de tekst interpoleert (`Reset mislukt voor ${email}`)
  zou de PII buiten de redactie om lekken. Bovendien ving de sleutel-redactie geen naam-/adres-sleutels
  (`{ name: user.name }`, `{ naam }`, `{ adres }`) en geen telefoonnummer-sleutels — alleen secret-achtige
  substrings + het e-mail-waardepatroon. **Gefixt:** (a) `message` gaat nu óók door `maskEmails()`; (b) een
  exacte-match-set (`name/naam/voornaam/achternaam/adres/…`) redact naam-/adres-sleutels **zonder** debug-
  sleutels als `filename`/`username`/`hostname` te raken (substring zou dat wél doen); (c) `phone`/`telefoon`
  als substring toegevoegd. E-mail blijft bewust waarde-gemaskeerd (domein leesbaar voor debugging), niet
  volledig geredacteerd. Geen live-lek gevonden bij de bestaande call-sites (allemaal error-namen/niet-PII);
  dit is structurele hardening. Tests: `logger.test.ts` (+3 cases: naam-exact vs filename/username/hostname,
  voor-/achternaam/adres/contactName, telefoon-substring, en e-mail-in-message-masking). PR #<zie hieronder>.
- **[LAAG→OPGELOST · AVG art. 30 register-volledigheid]** `src/lib/compliance/processing-register.ts` miste
  een verwerkingsactiviteit voor `TaxFilingRequest` (IB/BTW-aangifte via een gemachtigd belastingkantoor met
  DigiD/eHerkenning-machtiging, `partnerName`, `aanslagCents`, granulaire toestemmingsmomenten). Data zat wél
  correct in de eigen-data-export en werd correct buiten `anonymizeUser` gehouden (fiscale grond), maar de
  verwerking stond niet in het register. **Gefixt:** 16e `ProcessingActivity` `belastingaangifte-gemachtigde`
  (grondslag TOESTEMMING, ontvangers = gemachtigde-verwerker + Belastingdienst via Digipoort/SBR, bewaartermijn
  7 jaar art. 52 AWR). Test: `processing-register.test.ts` (+1 case pint key/grondslag/bewaartermijn/ontvangers).

### Geparkeerd / geëscaleerd naar de mens (deze ronde)

- **[HOOG (art.9) / geëscaleerd — `NoShowReport.reason` overleeft `anonymizeUser`]** `src/app/(protected)/
admin/gebruikers/actions.ts` (de `anonymizeUser`-transactie, regel 174–363; bevat géén `noShowReport`-
  bewerking). `NoShowReport.reason` (`prisma/schema.prisma:772`) is **door een derde partij geschreven vrije
  tekst óver** de geanonimiseerde ZZP'er en kan een gezondheidsreden bevatten ("ziek gemeld…", art. 9). Na
  anonimisering blijft die tekst verbatim staan, gekoppeld aan de (geanonimiseerde) `FreelancerProfile.id` —
  een admin kan de betrokkene er permanent uit herleiden. De notificatie-kópie van diezelfde reden wórdt al
  geredacteerd (regel 191–204, NO_SHOW_REPORTED expliciet genoemd); de bron-rij niet. **Repro:** anonimiseer
  een freelancer met een `NoShowReport` tegen zich → `reason` leest onveranderd. **Geschonden:** AVG art. 17
  (+ art. 9 bij gezondheidsreden). **Waarom niet unilateraal gefixt:** de code kiest hier bewust voor behoud
  (comment regel 209–210: mogelijke bewaargrond bij een arbeidsgeschil) — dit is een échte retentie-vs-
  vergetelheid-afweging met bijzondere-categorie-data en hoort per MENSENWERK §5 bij de FG/mens, niet bij een
  agent. **Aanbevolen (voor de mens):** óf `NoShowReport.reason` op anonimisering redacten (rij behouden,
  vrije tekst neutraliseren — spiegelt `ShiftHandoff.decisionNote`/`Application.note`), óf een expliciete
  `NoShowReport`-retentieregel + art.9-vlag in `processing-register.ts` vastleggen zodat de uitzondering
  gedocumenteerd is i.p.v. impliciet.
- **[LAAG · logger-message-redactie is e-mail-only, geen naam-detectie in de message-tékst]** Na de fix gaat
  `message` door `maskEmails()`, maar een losse naam/BSN-vormige string ín de message wordt niet gedetecteerd
  (kan niet betrouwbaar via regex). Blijft best-practice om PII in `fields` te zetten, niet in de message.

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) object-/functie-niveau-autorisatie over **álle** `src/app/api/**/route.ts`-handlers +
`(protected)/**/actions.ts`-server-actions (excl. franchise) — IDOR/ontbrekende authz/mass-assignment/
status-transitie-bypass; (2) cross-tenant/franchise-isolatie over `franchise/**` + `src/lib/franchise/**` +
`src/lib/tenancy.ts` én de nieuwe cross-party-PII-paden (`/kandidaten`, `/kandidaten/vergelijk`,
`candidate-*`); (3) injectie (SQLi/XSS/CSV-formule) + SSRF + secrets/logging + upload-veiligheid + CSP/
headers + AVG-betrokkenenrechten (`lib/compliance/*`, anonymisering/export/retentie). Kader: OWASP Top 10
(A01/A03/A05/A07/A09/A10) + ASVS + AVG art. 5/15/17/30/32. Verse delta sinds vorige ronde
(#739–#744: document-download-rate-limit, storage-zelftest, kandidaat-vergelijker-signalen, reistijd-chip,
+10 ontwerpconcepten) apart nagelopen. `npm audit --omit=dev` = **0 kwetsbaarheden**; typecheck/build groen.

**Geen nieuwe security-/privacy-gaten gevonden (geen KRITIEK/HOOG/MIDDEL).** Alle drie de oppervlakken
bevestigd schoon: elke mutatie draagt de keten auth→rol→ownership/tenant→Zod→actie→audit; de kandidaat-
vergelijker is dubbel eigenaar-gescoopt (`company: { userId: actor.id }` op de opdracht + de gebatchte
reputatie-/historie-/beschikbaarheidsqueries), reputatie sluit `PENDING_REVEAL` uit, reistijd is een grove
stad-tot-stad-schatting (geen exact woonadres); geen raw-SQL-injectie (alleen statische `SELECT 1`-pings),
CSV-exports via de centrale formule-injectie-guard (CWE-1236), SSRF afgeschermd (vaste hosts, user-tekst
alleen als query-param), logger redacteert PII/secrets, uploads via MIME-allowlist + magic-byte-sniff +
random storage-key + traversal-guard, `anonymizeUser` wist docs/credentials + redact audit-metadata-PII.

### OPGELOST in deze ronde

- **[LAAG→OPGELOST · defense-in-depth · CLAUDE.md architectuurregel 3 (statusovergangen via expliciete map) —
  de betaal-webhook was de énige `Subscription.status`-schrijver die de map omzeilde]** `src/app/api/billing/
webhook/route.ts` zette de abonnementsstatus met losse inline `!==`/`===`-checks (`paid` → ACTIVE,
  `failed` → PAST_DUE), terwijl de zustertaken (`past-due-task.ts`, `subscription-expiry-task.ts`) hun
  overgang defensief tegen `SUBSCRIPTION_TRANSITIONS` toetsen. De uitgevoerde overgangen zijn met de
  huidige map allemaal geldig (dus geen exploit vandaag), maar het pad was niet gebonden aan de bron van
  waarheid: zou de map ooit worden aangescherpt (bv. `CANCELLED → ACTIVE` verwijderd zodat een **herspeelde/
  late `paid`-webhook een geannuleerd abonnement niet stilzwijgend heractiveert**), dan bleef de webhook zijn
  eigen logica volgen. **Gefixt:** nieuwe, geëxporteerde `canSubscriptionTransition(from, to)` die
  fail-closed tegen `SUBSCRIPTION_TRANSITIONS` toetst (onbekende bronstatus → geen enkele overgang); beide
  update-takken zijn er nu mee bewaakt. Behoud van gedrag onder de huidige map, maar voortaan gebonden aan
  regel 3. Tests: `src/app/api/billing/webhook/route.test.ts` (+5 cases: PAST_DUE→ACTIVE bij `paid`, geen
  schrijf bij `failed` op ACTIVE, en directe unit-tests van de fail-closed-invariant incl. onbekende status).

### Geparkeerd (LAAG — observaties, geen blocker)

- **[LAAG · CSP — `script-src` bevat naast nonce + `'strict-dynamic'` óók `'unsafe-inline' https:`]**
  Dit is de standaard CSP3-fallback: moderne browsers negeren `'unsafe-inline'` zodra een nonce aanwezig is,
  en `'strict-dynamic'` staat er. In code gedocumenteerd (`src/lib/csp.ts`). Geen echte verzwakking, maar een
  menselijke sanity-check vóór go-live met echte documenten is verstandig (MENSENWERK §5). **Aanbevolen:**
  bevestig dat er geen legacy-browser-eis meer is en overweeg de `'unsafe-inline'`-fallback te schrappen.
- **[LAAG · AVG art. 5(1)(e) retentie — geen geautomatiseerde purge van gevoelige documenten]** Het
  verwerkingsregister (`lib/compliance/processing-register.ts`) benoemt een bewaartermijn ("niet langer dan
  nodig voor verificatie"), maar er is geen job die verificatiedocumenten automatisch verwijdert zodra ze niet
  meer nodig zijn — verwijdering loopt nu alleen via de handmatige admin-`anonymizeUser`. Consistent met het
  expliciete beleid dat AVG-verwijdering mensenwerk blijft; ter bevestiging aan een mens vóór het volume echte
  VOG/diploma's groeit. **Aanbevolen:** een expiry-/retentie-job (opt-in, human-in-the-loop) zodra het volume dat vraagt.

## Ronde 2026-07-12 (2e — basis: `main` @ 9fbd20a)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) document-/dossier-serving + AVG-betrokkenenrechten + upload-veiligheid; (2) cross-
tenant/franchise-IDOR over álle `franchise/**`-actions + `src/lib/franchise/**`; (3) cron/webhook/push/
routing-SSRF + client-error/csp-report + auth-rate-limiting. Kader: OWASP Top 10 (A01/A03/A04/A05/A07) +
ASVS + AVG art. 5/15/17/32. De verse delta sinds #730 (#731–#738) is apart nagelopen (request-id-
sanitisatie, middleware, de nieuwe pure kans-/beschikbaarheidssignalen, de opdrachten-lijst-query) —
schoon: aggregaat-only tellingen, eigenaar-scoped queries, CR/LF-weerbare header-sanitisatie.

**Eén MIDDEL volledig gefixt (rood→groen).** Overige oppervlakken bevestigd schoon (geen KRITIEK/HOOG):
tenant-isolatie uniform via `assertSameTenant`/`ownsViaTenant`/`tenantScopeWhere`; cron via Bearer +
`timingSafeEqual` + 503-inert; Stripe-webhook HMAC + 300s replay-window (Mollie: server-side re-fetch);
push-/routing-SSRF met harde host-allowlist; AVG-anonimisering wist docs/credentials + redact audit-
metadata-PII (`scrubAuditMetadataPii`); AVG-export eigen-data-only + audited; CSV-exports met formule-
injectie-guard (CWE-1236); document-IDOR-keten (`canAccessDocument`) audit-both-paden; upload via
MIME-allowlist + magic-byte-sniff + random storage-key; `npm audit` prod = **0 kwetsbaarheden**.

### OPGELOST in deze ronde

- **[MIDDEL→OPGELOST · OWASP A04 (insecure design — unrestricted resource consumption) / API4:2023 ·
  parity met de bestaande `documentPdfRateLimiter`-rem — `/api/documents/[id]` had géén rate-limit]**
  De privé document-download is de énige route die de rauwe bytes van de gevoeligste bestanden
  (VOG/diploma/ID/verzekering) serveert, maar was — anders dan álle zuster-routes (dossier, DBA-dossier,
  modelovereenkomst, factuur-/prestatie-PDF, die de `documentPdfRateLimiter` al hadden) — niet geremd.
  **Repro:** een geauthenticeerde FREELANCER/CLIENT hamert `GET /api/documents/<gegokte-cuid>` in een
  ongeremde loop → per request een DB-lookup + `storage.exists`/`storage.get` (S3-read in prod) + een
  `DOCUMENT_ACCESS_DENIED`/`DOCUMENT_ACCESSED`-auditregel, tegen nul kosten voor de aanvaller. `Document.id`
  is een `cuid()` (niet volledig willekeurig), dus enumeratie is niet hypothetisch; de data zelf bleef
  afgeschermd door `canAccessDocument`, maar de storage-kosten/auditgroei/DB-belasting niet. **Gefixt:**
  nieuwe `documentDownloadRateLimiter` (default **240/uur/gebruiker**, env `DOCUMENT_DOWNLOAD_RATE_LIMIT`,
  window 1u, prefix `docdl:` — ruimer dan de PDF-rem vanwege de legitiem frequentere inline-preview in de
  verificatiequeue), aangeroepen via `enforceRateLimit` **direct na `requireActor()`**, dus vóór de
  DB-lookup — de loop wordt geremd voordat hij iets kost. Tests: `src/app/api/documents/[id]/route.test.ts`
  (nieuw, 3 cases rood→groen: rem aangeroepen met de juiste limiter+actor-key; 200 binnen de limiet met
  bytes geserveerd; 429 kort-sluit vóór de DB-lookup — geen `storage.get`, geen `DOCUMENT_ACCESSED`-audit).

### Geparkeerd

- **[LAAG · dev-only dependency-DoS · js-yaml GHSA-h67p-54hq-rp68 (quadratische complexiteit bij merge-
  keys)]** Transitieve **dev**-afhankelijkheid via `eslint → @eslint/eslintrc → js-yaml@4.1.1`; zit niet in
  de productie-bundle en verwerkt geen gebruiker-invoer at runtime (alleen eslint-config). `npm audit`
  (incl. dev) = 1 low + 1 moderate, beide via deze keten. **Aanbevolen fix:** `npm audit fix` of een
  `overrides`-pin op een gepatchte js-yaml zodra eslint de transitieve dep bumpt — niet forceren zolang
  het eslint kan breken; geen productie-impact. `npm audit --omit=dev` = 0.

## Ronde 2026-07-12 (basis: `main` @ b5c8b66)

Audit: orchestrator (Opus 4.8) op de vérse delta sinds de vorige ronde (`af5212e..b5c8b66`, #725–#730 —
onderhouds-login-DB-schrijf-fix #725, DB-connection-pool-seam #726, effectief uurtarief na reistijd #727,
+10 ontwerpconcepten #728, ontvangen uitnodigingen op /opdrachten #729, dubbele-boeking-signaal bij het
voordragen #730). Niet-overlappende oppervlakken: (1) tenant-isolatie/IDOR op de nieuwe roster-voordracht-
data (`dienst-voordracht.ts` + `roster-double-booking.ts`); (2) IDOR/PII op de nieuwe ontvangen-uitnodigingen
(`data/received-invitations.ts` + `received-invitations.ts`); (3) secret-lek/config op de #726-delta
(`system-status.ts`, `db-connection.ts`, `env.ts`, `db.ts`) + de pure `effective-rate.ts`. Kader: OWASP
Top 10 (A01/A03/A05) + ASVS + AVG art. 5/32.

**Eén HOOG volledig gefixt (rood→groen).** De rest bevestigd schoon: de ontvangen-uitnodigingen leiden de
lijst af uit de eigen `JOB_INVITED`-auditrecords, gescopet op het uit de sessie afgeleide `freelancerProfileId`
(geen client-input, exacte id-parse tegen substring-vals-positieven, drie begrensde eigenaar-queries, exposeert
alleen opdracht-titel + opdrachtgever-naam van nog-`PUBLISHED` opdrachten); `getRosterCandidatesForDienst`
her-asserteert de tenant bij de read (`job.tenantId !== tenantId → null`) en scoopt de roster-query op
`tenantId`; `system-status` is ADMIN-only en leest uitsluitend driver-MODI/booleans (nooit een sleutelwaarde,
de rauwe `Env` passeert de client-grens niet); `effective-rate.ts` is puur/deterministisch zonder I/O.

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · OWASP A01 (broken access control) · CLAUDE.md regel 2 / Veiligheidsregels (tenant-
  isolatie) — het dubbele-boeking-signaal (#730) lekte de dienst-TITEL van een andere tenant aan de
  bemiddelaar]** Het nieuwe dubbele-boeking-signaal op `/franchise/diensten/[id]/voordragen`
  (`getRosterCandidatesForDienst` → `detectDoubleBooking`) haalde **alle** ACTIEVE samenwerkingen van een
  roster-ZZP'er op — met `job: { select: { title: true } }` zónder tenant-filter — en toonde de franchiser
  `Al ingezet — overlap met "<titel>"`. Een roster-ZZP'er van tenant A kan echter óók op een **opengestelde
  (overflow) dienst van een ándere franchise** (tenant B) of een **platform-opdracht** (`Job.tenantId = null`)
  staan — `visibleJobsWhereForTenant` stelt tenant-ZZP'ers expliciet in staat op overflow-diensten van andere
  franchises te werken. Gevolg: franchise A las de vertrouwelijke dienst-titel van franchise B (of een platform-
  opdracht) uit het waarschuwingslabel — een cross-tenant-datalek. **Repro:** een roster-ZZP'er van tenant A
  heeft een ACTIEVE samenwerking op een overflow-dienst "Geheime dienst van franchise B" (tenant B) die de
  startdatum van de te bemensen dienst overlapt → franchiser A opent `/franchise/diensten/<id>/voordragen` →
  ziet `Al ingezet — overlap met "Geheime dienst van franchise B"`. **Gefixt:** `ActivePlacement` draagt nu
  `tenantId` (uit `Job.tenantId`) en `DoubleBookingInput` een `viewerTenantId` (= `actor.tenantId`);
  `detectDoubleBooking` telt élke overlap mee (de ZZP'er is die dag hoe dan ook bezet — planwaarde behouden)
  maar geeft `firstTitle` **alleen** prijs voor de vroegst-startende overlap **binnen de eigen tenant**; een
  overlap op een andere tenant of platform-opdracht valt terug op het generieke, titelloze label
  ("Al ingezet op een overlappende dienst", dat de UI al ondersteunt). De data-laag selecteert nu
  `job.tenantId` mee en geeft `viewerTenantId: tenantId` door. Tests: `roster-double-booking.test.ts` (3 nieuwe
  cases, rood→groen: cross-tenant/platform-titel verborgen, telling behouden, eigen-tenant-titel gekozen boven
  een vroegere cross-tenant-overlap) + `dienst-voordracht.test.ts` bijgewerkt met tenant-velden.

## Ronde 2026-07-11 (2e — basis: `main` @ af5212e)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-subagents op de vérse delta sinds
de vorige ronde (`350aa49..af5212e`, #718–#724 — onderhoudsmodus #719, opdrachtgever-reputatie voor
de ZZP'er #720, staat-van-dienst op het vertrouwensdossier #723, uitnodiging-opvolging #722,
persona-sweeps). Niet-overlappende oppervlakken: (1) de nieuwe onderhoudsmodus + `middleware.ts` +
`system-status`/`env`-delta (maintenance-bypass, header/HTML-injectie, auth-verzwakking, secret-lek);
(2) uitnodiging-opvolging + opdrachtgever-reputatie + `signals`/`stage`/`pending-tasks`-delta
(IDOR/authz/cross-party-PII/XSS); (3) AVG-volledigheid — schema-delta model-voor-model tegen
`anonymizeUser`/`account-export`, de nieuwe publieke aggregaties (`company-reputation`,
`freelancer-track-record`) op k-anonimiteit/PII, PII-in-logs. Kader: OWASP Top 10 (A01/A03/A05/A07/A09)

- ASVS + AVG art. 5/15/17/30/32. `npm audit --production`: **0 kwetsbaarheden**.

**Eén HOOG + één LAAG volledig gefixt (rood→groen); één MIDDEL geparkeerd.** De rest bevestigd schoon:
de schema-delta is leeg (geen nieuw PII-veld), de nieuwe aggregaties lekken uitsluitend geaggregeerde
statistiek (geen review-auteur/rating, geen collaboratie-/klant-identiteit; `PENDING_REVEAL`-reviews
uitgesloten), de uitnodiging-opvolging is dubbel owner-gescopet (data-fetch + render) en exposeert
alleen tellingen, `MAINTENANCE_MESSAGE` is HTML-escaped + control-char-gestript + lengte-gecapt,
`Retry-After` is `parseInt`+geklemd, `system-status` lekt alleen driver-modi/booleans (nooit een
secret-waarde), de env-delta is niet-fataal (CLAUDE.md regel 8), en de onderhoudspoort verzwakt geen
enkele auth/rol/ownership-check (voegt enkel een blokkade toe).

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · OWASP A05 (security misconfiguration) · CLAUDE.md AUTO-MODE §2 (DB-integriteit)
  / RUNBOOK §9 — volledige onderhouds-afsluiting (`MAINTENANCE_ALLOW_ADMIN=false`) stopte de
  login-DB-schrijfacties niet]** De onderhoudsmodus (#719) draait in de `middleware`, maar de
  middleware-`matcher` sluit `/api/auth/**` expliciet uit — daar draait de middleware dus nooit.
  Gevolg: met `MAINTENANCE_MODE=true` + `MAINTENANCE_ALLOW_ADMIN=false` (de "volledige afsluiting",
  bewust bedoeld voor een database-herstel/migratie waarbij élk verkeer schade kan doen) voerde een
  `POST /api/auth/callback/credentials` nog stééds `user.findUnique`, rate-limiter-lees/schrijf,
  `user.update({ lastLoginAt })` en `audit()`-inserts uit tegen de live database — precies wat de
  beheerder verwacht dat stilligt. Alleen de vervolg-paginanavigatie kreeg de 503. Repro: zet de
  volledige afsluiting aan tijdens een herstel → login schrijft toch naar de DB. Gefixt: nieuwe pure
  poort `loginBlockedByMaintenance(mode, allowAdmin)` (`src/lib/maintenance.ts`) + `authorizeCredentials`
  losgetrokken uit `src/auth.ts` naar `src/lib/authorize-credentials.ts` (NextAuth-vrij, direct
  testbaar); de poort staat als eerste statement, vóór élke Prisma-call, en weigert stil (bewust géén
  audit — dat zou zelf een DB-schrijf zijn). In de standaardmodus (admin-bypass AAN) blijft login
  werken (beheerder moet de deploy kunnen verifiëren). Tests: `src/lib/authorize-credentials.test.ts`
  (rood→groen: bij volledige afsluiting wordt `findUnique`/rate-limiter/`audit` niet aangeroepen; in de
  standaardmodus + onderhoud-uit wél) + pure cases in `maintenance.test.ts`.
- **[LAAG→OPGELOST · beschikbaarheid/robuustheid — `isMaintenanceExemptPath` was exact-match, geen
  trailing-slash-normalisatie]** `/api/health/` (trailing slash) telde niet als vrijgestelde
  gezondheids-probe en zou tijdens onderhoud de 503-pagina krijgen i.p.v. de healthcheck-respons — een
  host-healthcheck met slash kon de container zo laten flapperen (faalt gesloten, dus geen bypass).
  Gefixt: trailing slash genormaliseerd vóór de vergelijking. Test: nieuwe case in `maintenance.test.ts`.

### Geparkeerd in deze ronde

- **[MIDDEL · OWASP A05 — de middleware-`matcher` sluit élk pad met een punt uit → onderhoudsmodus
  én CSP-header worden overgeslagen voor zulke requests]** De `matcher`-regex
  (`/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.).*)`) sluit ieder pad met een punt
  ergens in de path uit, niet alleen bekende statische extensies. Een request als
  `GET /opdrachten/x.y` bereikt de middleware dus nooit → geen onderhouds-503 én geen CSP-header op
  die respons. **Geen authz-/document-lek** (geverifieerd: de pagina's dwingen zelf `requireActor`/
  `requireRole` af met een verse DB-lookup, dus geen auth-bypass); het is een beschikbaarheids-/
  DB-isolatie-gat in de noodrem-garantie + een CSP-dekkingsgat op dotted dynamische routes.
  Aanbevolen fix: versmal de punt-uitsluiting tot echte statische extensies
  (`\.(?:ico|png|jpg|jpeg|gif|svg|css|js|map|txt|xml|json|woff2?)$`) i.p.v. "bevat ergens een punt".
  Bewust geparkeerd: het raakt de globale routing-matcher (brede blast-radius, verdient een eigen PR
  met e2e-verificatie), niet samen te voegen met de auth-poort-fix hierboven.

## Ronde 2026-07-11 (basis: `main` @ 350aa49)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken: (1) franchise/tenant-isolatie & IDOR (incl. de nieuwe compliance-strip #716,
roster-capaciteit #707, klant-relatiegezondheid #709, shift-overname-governance, `tenancy.ts`);
(2) alle `/api/**`-routes + document-/media-/PDF-/dossier-/ICS-serving, cron-auth, webhook, SSRF,
upload; (3) privacy/AVG — volledigheid van `anonymizeUser`/`account-export`, model-voor-model-walk
van `schema.prisma` tegen de erasure-transactie, dataminimalisatie, k-anonimiteit, PII-in-logs;
(4) injectie (SQL/XSS/CSV/ICS/template), mass-assignment/Zod, secrets, auth/sessie, CSP,
`npm audit`. Kader: OWASP Top 10 (A01/A03/A07/A09) + ASVS + AVG art. 5/15/17/20/30/32. Toegepast
op de nieuwste features sinds de vorige basis (`8d0a3dd`): bulk-uitnodiging (#715, `job-invite.ts` +
`inviteSuggestedFreelancersToJob`), cashflow-prognose (#713), db-backup-ops (#712).

**Drie bevindingen volledig gefixt (rood→groen): twee HOOG (AVG art. 17) + één MIDDEL
(cross-tenant PII, defense-in-depth).** Injectie/secrets/auth/CSP/`npm audit --production` (0 vulns)
bevestigd schoon; alle document/PDF/dossier-serving met owner/tenant-check + audit vóór bytes;
franchise-queries `tenantScopeWhere`-gescopet zonder client-`tenantId`; de nieuwe bulk-invite volgt
de volledige mutatieketen (auth→rol CLIENT→ownership→server-side eligibility→rate-limit→audit);
db-backup geeft de connectie-URL als argv-arg door (geen shell-injectie) en redigeert wachtwoorden.

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · OWASP A01/A09 · AVG art. 17 — `FreelancerProfile.defaultMotivation` overleefde
  de erasure]** `freelancerProfileAnonymizationData()` (`src/lib/account-anonymization.ts`) wiste
  `headline/bio/location/languages/kvkNumber/btwNumber/hourlyRate` maar niet het later toegevoegde
  `defaultMotivation` — de zelf-getypte quick-apply-standaardtekst (≤2000 tekens vrije tekst, kan
  naam/telefoon/adres bevatten; spiegelbeeld van `Application.motivation` die al werd geredact) — noch
  `monthlyIncomeGoalCents` (zelfgekozen financieel doel). Repro: ZZP'er zet `defaultMotivation = "Ik
ben Jan Jansen, 06-…"` → verwijderverzoek → `anonymizeUser` → `User.name/email` + `bio` gewist, maar
  `defaultMotivation` staat verbatim in de DB (en werd door `account-export` als persoonsgegeven
  meegenomen). Gefixt: beide velden nu `null` in `freelancerProfileAnonymizationData()`. Test:
  `src/lib/account-anonymization.test.ts` (twee nieuwe cases, rood→groen).
- **[HOOG→OPGELOST · OWASP A01 · AVG art. 17 + art. 15/20 — `Application.availability` niet geredact
  én niet geëxporteerd]** De erasure-`application.updateMany` (`admin/gebruikers/actions.ts`) overschreef
  alleen `motivation`, niet het vrije-tekst-`availability`-veld (≤200 tekens, bv. "bereikbaar op 06-…,
  kan per direct starten") dat de ZZP'er bij een reactie typte — en `account-export.ts` liet het uit de
  applications-`select` (inzage/portabiliteit-gat). Repro: reactie met `availability = "bereikbaar op
06-12345678"` → erasure → tekst blijft leesbaar op de Application-rij, en de ZZP'er ziet 'm niet eens
  in zijn eigen data-export. Gefixt: `availability: null` toegevoegd aan de freelancer-gescopete
  redactie én `availability: true` aan de export-select. Tests: nieuwe cases in
  `anonymize-erasure.test.ts` (redactie) + `account-export.test.ts` (export), rood→groen.
- **[MIDDEL→OPGELOST · OWASP A01 · CLAUDE.md regel 2 (tenant-isolatie, defense-in-depth) — kandidaat-
  lookup in het shift-overname-governance-scherm zonder eigen tenant-filter]**
  `src/components/shift-overname/governance-screen.tsx` haalde de naam + certificaatstatus (PII,
  gezondheids-adjacent) van de voorgestelde overnemer op met `where: { id: { in: candidateIds } }` —
  zónder tenant-scope, leunend op de invariant die `requestShiftHandoff` bij aanmaak afdwingt
  (`candidate.tenantId == job.tenantId`). Elke andere franchise-query re-asserteert de tenant bij de
  read; deze niet. Repro (zodra de invariant ooit breekt, bv. een admin herparenteert een profiel naar
  een andere tenant): tenant-A-franchiser opent `/franchise/shift-overnames` → ziet de naam +
  certificaten van een tenant-B-ZZP'er in de "Voorgestelde overnemer"-kaart. Gefixt: `...scope`
  (= `tenantScopeWhere(actor)`; `{}` voor admin, `{ tenantId }` voor de franchiser) toegevoegd aan de
  candidate-`where`. Test: nieuwe `governance-screen.test.tsx` (franchiser scoping + admin platform-breed),
  rood→groen.

### Geparkeerd in deze ronde

- **[MIDDEL · AVG art. 5(2)/verantwoordingsplicht · CLAUDE.md regel 5 — vier self-scoped export-routes
  loggen geen audit]** `diensten/export`, `prestaties/export`, `prognose/export` en
  `verplichtingen/export` (`src/app/(protected)/**/export/route.ts`) dwingen auth + rol + rate-limit +
  query-ownership correct af (geen IDOR), maar roepen — anders dan élke sibling-export (`account/export`,
  `administratie/*`, `admin/export/invoices`, `admin/audit/export`) — nooit `audit()` aan bij een export
  van financiële/PII-data. Geen access-control-gat, wel een volledigheidsgat in de auditdekking.
  Aanbevolen fix: `audit({ action: "..._EXPORTED", entityType, entityId: "self", metadata: { count } })`
  spiegelen op `api/administratie/export/route.ts`, ná het genereren van de CSV.
- **[MIDDEL · AVG art. 17 (mogelijk art. 9) — `Performance.description` niet geredact bij erasure; DPO-
  afweging]** De vrije-tekst-omschrijving bij een uren-/mijlpaalindiening (`Performance.description`,
  ≤500 tekens, via `performance-form.tsx`) wordt niet geraakt door `anonymizeUser` en staat niet in
  `account-export`. In een zorgcontext kan die tekst cliënt-/patiëntdetails bevatten. Overlapt de reeds
  geparkeerde fiscale-retentie-afweging voor `Performance.rejectionReason`/`Invoice.rejectionReason` —
  samen oplossen ná menselijke sign-off (rij behouden, alleen het vrije-tekstveld blancen). MENSENWERK §5.
- **[LAAG · verantwoordingsplicht — twee admin-exports zonder auditregel]** `admin/avg/export`
  (statisch verwerkingsregister, geen per-user-PII) en `admin/import/template` (statische CSV-template,
  geen PII) loggen geen audit. Beide `requireRole("ADMIN")`-gated; puur cosmetisch/volledigheid.

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken: (1) franchise/tenant-isolatie & IDOR (incl. de nieuwe `/franchise/opdrachtgevers`- en
`/franchise/zzpers`-aggregaties #707/#709, `tenancy.ts`, shift-overname-governance); (2) alle
`/api/**`-routes + document-/media-/PDF-/dossier-serving, cron-auth, webhook, SSRF, upload; (3)
privacy/AVG — volledigheid van `anonymizeUser`/`account-export`, dataminimalisatie, k-anonimiteit,
audit-logging, PII-in-logs; (4) injectie (SQL/XSS/CSV/ICS/template), mass-assignment/Zod, open
redirect, secrets, CSRF, `npm audit`. Kader: OWASP Top 10 (A01/A03/A07/A09) + ASVS + AVG art.
5/9/17/30/32. **Eén bevinding volledig gefixt (rood→groen, HOOG); drie geparkeerd.** Overige
oppervlakken bevestigd schoon: tenant-isolatie/IDOR (alle franchise-queries `tenantScopeWhere`-gescopet,
geen client-`tenantId`), document/PDF/dossier-serving (owner/tenant-check + audit vóór bytes,
`CSP: sandbox`, `nosniff`), cron-`timingSafeEqual`, webhook-signatuur, SSRF-push-allowlist,
uploads (`validateUpload`+`assertContentMatchesMime`+random key), geen `$queryRawUnsafe`, alle
CSV-exports via `escapeCsvField`/`toCsv`, ICS via `escapeIcsText`, geen `.passthrough()`, geen open
redirect, geen secret in bundle/log, `npm audit` 0 vulnerabilities.

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · OWASP A01/A09 · AVG art. 17 (recht op vergetelheid) — vrije-tekst-PII
  overleefde de erasure in `Notification.body`]** `anonymizeUser`
  (`src/app/(protected)/admin/gebruikers/actions.ts`) redact tientallen bronvelden, maar raakte de
  `Notification`-tabel enkel voor de éne smalle DISPUTE_OPENED-admin-fanout aan. Meerdere
  notificatietypes zetten een **verbatim vrije-tekstreden** in de body die de betrokkene zélf ontving
  (userId == de betrokkene): `NO_SHOW_REPORTED` (de gemelde no-show-reden — mogelijk een
  **gezondheidsgegeven, art. 9**), `PERFORMANCE_REJECTED`, `INVOICE_REJECTED`, `INVOICE_CREDITED`,
  `COLLABORATION_STATUS` (annuleerreden), `CREDENTIAL_REJECTED` (afwijsreden + certificaattitel) en
  `SHIFT_HANDOFF_REJECTED` (beslisnotitie). Die kopie leeft alleen op de `Notification`-rij en werd
  door geen enkele bestaande redactie geraakt — de `user.update` cascadeert niet en berichten/support
  worden apart geredact maar notificaties niet. Repro: ZZP'er met een `NO_SHOW_REPORTED`-notificatie
  waarvan de body `Reden: <medische reden>` bevat → admin voert het verwijderverzoek uit → de reden
  staat na anonimisering nog leesbaar in de notificatie-body. Gefixt: de transactie redact nu
  `Notification.body` voor **álle eigen notificaties** (`where: { userId }`) — na anonimisering is het
  account SUSPENDED met lege `passwordHash` en kan de feed nooit meer worden ingezien, dus de body
  heeft geen operationeel doel meer; robuust voor toekomstige reden-dragende types. De titel blijft
  (generiek, geen PII); de DISPUTE_OPENED-admin-fanout in ándermans feed blijft apart geredact. Test:
  nieuwe case in `src/app/(protected)/admin/gebruikers/anonymize-erasure.test.ts` (rood→groen:
  zonder de `notification.updateMany` blijft de reden in de body staan).
  **Escalatie (MENSENWERK §5):** de `NO_SHOW_REPORTED`-reden kan bijzondere persoonsgegevens (art. 9,
  gezondheid) bevatten — laat een FG vóór go-live de bewaargrond van de bron (`NoShowReport.reason`,
  reeds geparkeerd) beoordelen; het notificatie-lek is nu hoe dan ook gedicht.

### Geparkeerd in deze ronde

- **[HOOG · AVG art. 17/5(1)(f) — document-storage-verwijdering bij erasure is best-effort zonder
  retry/reconciliatie]** `anonymizeUser` verwijdert de `Document`-DB-rijen in de transactie, maar de
  bijbehorende storage-objecten (echte VOG/diploma-bytes) worden dáárna best-effort verwijderd
  (`Promise.all(...).catch(logStorageCleanupFailure)`). Faalt een `storage.delete()` (transient
  S3-fout), dan is de enige sporing een logregel — geen retry-queue, reconciliatie-taak of
  `HealthIncident`. Het gevoeligste PII-bestand kan zo onopgemerkt in de opslag achterblijven.
  Aanbevolen fix: schrijf bij een `storage.delete`-fout een duurzaam remediatie-record (bv.
  `HealthIncident` of een `orphaned-storage-key`-tabel) + een geplande taak die retryt/alarmeert tot
  verwijdering bevestigd is. Repro: mock `storage.delete` → reject → account is DB-geanonimiseerd maar
  het bestand staat er nog; niets buiten een logregel wijst erop.
- **[LAAG-MIDDEL · AVG art. 17 — auteurskant van reden-notificaties (kruis-ontvanger)]** De erasure
  redact nu de eigen ontvangen notificatie-body's (userId == betrokkene). Schreef de betrokkene een
  reden die in de notificatie van de **tegenpartij** belandde (bv. een CLIENT die een
  `PERFORMANCE_REJECTED`-reden schreef → notificatie bij de FREELANCER), dan blijft die kopie staan
  (userId != betrokkene). De reden beschrijft doorgaans de ontvanger (diens werk/afwezigheid), dus de
  sterkste art.17-claim is de ontvangerskant die nu gedicht is; de auteurskant is zwakkere PII zonder
  auteursnaam in de body. Aanbevolen fix: spiegel het DISPUTE_OPENED-patroon (scope via
  collaboration/job/invoice-deep-link) voor de overige reden-types, of accepteer als restrisico met
  FG-sign-off.
- **[MIDDEL · AVG art. 30 — geen verwerkingsregister-/bewaartermijn-entry voor no-show-melding]**
  `src/lib/compliance/processing-register.ts` heeft geen entry voor de no-show-flow (`NoShowReport`,
  `reportNoShow`). Deze verwerking legt vrije tekst van de ene partij over de (vermeende) reden van de
  ander vast — mogelijk gezondheidsgerelateerd — zonder verklaarde grondslag of bewaartermijn, en
  fan-out naar `Notification.body`. Aanbevolen fix: register-entry (grondslag: gerechtvaardigd
  belang/uitvoering overeenkomst) + retentie-regel voor `NoShowReport`/no-show-notificaties, met een
  art.9-vlag naast het reeds geparkeerde `NoShowReport.reason`-erasure-item.

## Ronde 2026-07-10 (basis: `main` @ 14cfb51)

Audit: orchestrator (Opus 4.8) + 1 adversariële Opus-subagent op niet-overlappende oppervlakken.
Kader: OWASP Top 10 (A01/A03/A07) + AVG art. 5/32. **Drie bevindingen volledig gefixt (rood→groen):
één KRITIEK, één HOOG, één MIDDEL** — alle drie via de nieuwe gedeelde `src/lib/public-url.ts`
(vertrouwde publieke origin) + de gedeelde CSV-kern. Fresh sweep bevestigde schoon: mutatieketen
(auth→rol→ownership→Zod→actie→audit) over samenwerkingen/facturen/uitgaven/profiel/berichten/
reacties/rooster/beschikbaarheid/kandidaten; franchise/tenant-isolatie + `tenancy.ts`; overige
CSV-exports (allen via `escapeCsvField`/`toCsv`); geen `.passthrough()`/mass-assignment; geen
`$queryRawUnsafe`; geen `dangerouslySetInnerHTML` met user-input; admin/franchise-RBAC defense-in-depth.

### OPGELOST in deze ronde

- **[KRITIEK→OPGELOST · OWASP A01/A07 · CWE-640 (host-header/reset-poisoning → account-overname)]**
  `requestPasswordReset` (`src/app/wachtwoord-vergeten/actions.ts`) bouwde de wachtwoord-reset-URL
  uit de client-beïnvloedbare `x-forwarded-host`/`host`-header. Een aanvaller kon een reset aanvragen
  voor een slachtoffer met `Host: attacker.example`; de (legitieme) reset-mail wees dan een GELDIG
  token naar het aanvallerdomein → overname bij één klik. De middleware gebruikte al `AUTH_URL`, maar
  deze action niet. Repro: `POST` reset-form met `X-Forwarded-Host: attacker.example` → mail bevatte
  `https://attacker.example/wachtwoord-herstellen/<token>`. Gefixt: nieuwe gedeelde
  `src/lib/public-url.ts` (`resolvePublicOrigin`/`publicOrigin`) resolvet de origin uit
  `AUTH_URL`/`NEXTAUTH_URL` en negeert de headers zodra die geconfigureerd is (spiegelt
  `getPublicOrigin` in de middleware). Test: `src/app/wachtwoord-vergeten/reset-poisoning.test.ts`
  (rood→groen: vervalste host + AUTH_URL → link gebruikt AUTH_URL, bevat het aanvallerdomein niet) +
  `src/lib/public-url.test.ts`. **Escalatie (MENSENWERK §5):** zet `AUTH_URL` in productie (staat al
  als niet-fatale env-waarschuwing) — zonder die waarde valt de resolver in dev terug op headers.
- **[HOOG→OPGELOST · OWASP A03 · CWE-1236 (CSV-formule-injectie in de Prestaties-export)]**
  `exportPrestatiesCsv` (`src/lib/prestaties.ts`) was de enige export die de quoting handmatig deed
  (`"${v.replace(/"/g,'""')}"`) i.p.v. de gedeelde `escapeCsvField`/`toCsv` — en miste dus de
  formule-injectie-guard. Vrije tekst van de ZZP'er (`freelancerName`, `description`,
  `rejectionReason`) belandt in de spreadsheet van de opdrachtgever; een cel die met `= + - @`
  begint werd als formule uitgevoerd (DDE/exfiltratie). Repro: ZZP'er zet omschrijving
  `=cmd|'/c calc'!A1` → opdrachtgever exporteert `/prestaties` → formule voert uit in Excel. Gefixt:
  export gaat nu via `toCsv` uit `@/lib/csv` (voorloopse apostrof-guard). Test: nieuwe case in
  `src/lib/prestaties.test.ts` (rood→groen).
- **[MIDDEL→OPGELOST · OWASP A01 (open redirect via request-origin in de betaal-checkout)]**
  `changeSubscription` (`src/app/(protected)/abonnement/actions.ts`) bouwde de payment-provider
  `returnUrl`/`webhookUrl` uit de request-`Origin`/`Host`. Na een betaling kon de browser naar een
  aanvallerdomein worden geredirect. Gefixt: `returnUrl`/`webhookUrl` uit `publicOrigin()`
  (`AUTH_URL`), nooit uit request-headers. Bijvangst: `admin/import/actions.ts` (`loginUrl` in de
  bulk-welkomstmail) gebruikte dezelfde spoofbare header en is mee-gemigreerd naar `publicOrigin()`.
  (Deze bevinding stond geparkeerd in ronde 2026-07-09 en is nu opgelost.)

## Ronde 2026-07-09 (2e — basis: `main` @ 76a8ca9)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken: (1) franchise/tenant-isolatie & IDOR (leads, zzpers, opdrachtgevers, diensten,
instellingen, `tenancy.ts`, `admin/franchises`, incl. de nieuwe reacties-lijst #694); (2) API-route-
authz, upload/storage, SSRF, injectie over alle `/api/**` + document-/media-/PDF-/dossier-serving +
uitgaande `fetch`; (3) privacy/AVG — volledigheid van `anonymizeUser`/`account-export`,
verwerkingsregister, k-anonimiteit, PII-in-logs. Kader: OWASP Top 10 (A01/A03/A04/A07/A09) + ASVS +
AVG art. 5/17/30/32. **Drie bevindingen volledig gefixt (rood→groen): één KRITIEK, één HOOG, één
MIDDEL.** Overige oppervlakken bevestigd schoon (document/media/PDF/dossier IDOR+audit, cron-auth
`timingSafeEqual`, path-traversal-guard, SSRF-allowlist voor push, geen `$queryRawUnsafe`, geen
stacktrace-lek, admin-RBAC defense-in-depth).

### OPGELOST in deze ronde

- **[KRITIEK→OPGELOST · OWASP A07 (auth failures) / rate-limit-bypass — vervalsbaar
  `X-Forwarded-For` omzeilde élke IP-gebonden rate limiter, incl. login-brute-force]**
  `requestMeta()` (`src/lib/request-meta.ts`) en drie gedupliceerde `clientIp()`-kopieën
  (`api/csp-report`, `api/client-error`, `api/billing/webhook`) namen de **LINKER** (eerste)
  `X-Forwarded-For`-entry — precies de waarde die de client zélf kan zetten. Een aanvaller stuurde
  per request een ander eerste XFF-IP en gaf zich zo telkens voor een nieuw IP uit → onbeperkte
  wachtwoord-guessing tegen een bekend account (`loginRateLimiter` keyt op `${ip}:${email}`,
  `src/auth.ts`) plus log-/CPU-flood op de ongeauthenticeerde endpoints. Repro: `POST /api/csp-report`
  met wisselende `X-Forwarded-For: 1.2.3.<n>` → nooit 429. Gefixt: nieuwe pure helper
  `src/lib/client-ip.ts` (`clientIpFrom`/`clientIpFromRequest`) neemt de door de vertrouwde proxy
  toegevoegde **rechter** entry (`TRUSTED_PROXY_HOP_COUNT` hops vanaf rechts, default 1 voor Railway),
  nooit de client-linkerkant; alle vier de call-sites gecentraliseerd. Test:
  `src/lib/client-ip.test.ts` + de drie route-tests aangepast (rood→groen: leftmost-spoof verandert
  het gekozen IP niet meer). **Escalatie (MENSENWERK §5):** de exacte hop-count hangt van de Railway-
  edge af (append vs. overwrite); default 1 is correct voor één vertrouwde proxy en strikt veiliger
  dan leftmost, maar bevestig de edge-config vóór go-live en stel zo nodig `TRUSTED_PROXY_HOP_COUNT` in.
- **[HOOG→OPGELOST · AVG art. 17 (recht op wissen) — dispuutreden overleefde de anonimisering in de
  event-store]** De vrije-tekst-dispuutreden staat in twee kopieën: `Collaboration.disputeReason`
  (werd al gewist) én de `payload` van het `DISPUTE_OPENED`-domeinevent
  (`{ reason }`, `src/lib/cascade/dispute-commands.ts:48`). `anonymizeUser` LAS de events al (om
  `ownDisputeCollabIds` te bepalen) maar scrubde de payload zelf nooit → de reden (mogelijk medische/
  persoonlijke details) bleef ná een verwijderverzoek onbeperkt en herleidbaar (`actorId` = de niet-
  verwijderde `userId`) in `DomainEvent` staan. Repro: FREELANCER opent dispuut met vrije tekst →
  vraagt art. 17-verwijdering → vóór de fix bleef de tekst in `domainEvent.payload`. Gefixt:
  `prisma.domainEvent.updateMany({ where: { type: "DISPUTE_OPENED", actorId: userId }, data: { payload: "{}" } })`
  toegevoegd aan de anonimiseringstransactie (spiegelt `DISPUTE_RESOLVED`, dat al `"{}"` schrijft).
  Test: nieuwe case in `anonymize-erasure.test.ts` (updateMany aanwezig, where-scope + lege payload).
- **[MIDDEL→OPGELOST · OWASP A01 / CWE-203 (observable discrepancy) — cross-tenant existence-oracle
  in de onboarding-wizard]** `addAfdelingStep`/`removeAfdelingStep`
  (`franchise/opdrachtgevers/nieuw/actions.ts`) laadden met kaal `findUnique` en riepen dáárna
  `assertSameTenant` aan: een cross-tenant id gaf een **andere** melding ("Geen toegang tot deze
  bemiddeling-resource.") dan een onbekend id ("Opdrachtgever niet gevonden."), en `removeAfdelingStep`
  gooide zelfs een **ongevangen** `AuthorizationError` (crash) i.p.v. de stille no-op die het
  zusterbestand `../actions.ts` gebruikt. Een FRANCHISER kon zo bestaan/eigendom van een id onder een
  ándere franchise afleiden. Gefixt: `if (!entity || !ownsViaTenant(actor, entity.tenantId)) …` met
  identieke melding/no-op voor beide gevallen (spiegelt `addDepartment`/`removeDepartment`). Test:
  `nieuw/wizard-oracle.test.ts` (cross-tenant ≡ onbekend id; geen thrown 403).

### GEPARKEERD (repro + severity + geschonden regel + aanbevolen fix)

- **[MIDDEL · AVG art. 17 — `AuditLog.metadata.reason` (vrije tekst) niet gescrubd bij erasure]**
  `scrubAuditMetadataPii` (`src/lib/account-anonymization.ts:52-58`) redact alleen velden die **exact**
  gelijk zijn aan het e-mailadres/de naam; een vrije-tekst-`reason` (DISPUTE_OPENED, PERFORMANCE_REJECTED,
  INVOICE_REJECTED/CREDITED — `src/lib/cascade/handlers.ts`, `dispute-commands.ts:78`) matcht nooit en
  blijft staan op auditregels die aantoonbaar over de betrokkene gaan (`owned`). Fix: blank de bekende
  vrije-tekstsleutel `reason` op owned-rijen (analoog aan de outright-null van `disputeReason`).
- **[MIDDEL · AVG art. 15/17 — `Performance.rejectionReason` / `Invoice.rejectionReason` (eigen tekst)
  niet gewist noch geëxporteerd]** De afkeur-/creditreden die de betrokkene als CLIENT/FREELANCER zelf
  schreef (`src/lib/cascade/handlers.ts:217,372,506`) komt niet voor in `anonymizeUser` of
  `account-export`. Fix: `updateMany` gescopet op de eigen partij (spiegel `Application.note` via
  `collaboration.company.userId`), en velden toevoegen aan `buildAccountExport`.
- **[MIDDEL · OWASP A01 / open redirect — `abonnement/actions.ts` ...] → OPGELOST in ronde 2026-07-10**
  (via de gedeelde `src/lib/public-url.ts`; zie de OPGELOST-sectie bovenaan).
- **[LAAG · CWE-203 — zelfde existence-oracle-melding in `admin/shift-overnames/actions.ts:35`
  (`loadDecidableHandoff`)]** Door FRANCHISER bereikbaar via de gedeelde shift-overname-forms; wél
  gevangen (geen crash), alleen melding-onderscheidbaar. Fix: unificeer de melding met "niet gevonden".

## Ronde 2026-07-09 (basis: `main` @ b204e89)

Audit: orchestrator (Opus 4.8) + 1 parallelle adversariële Opus security-subagent, gericht op de vérse
delta sinds de vorige ronde (`fd8826e..b204e89`, #681–#687 — cross-tenant existence-oracle-fix,
ADMIN-systeemstatus-scherm, wettelijke-factuureisen-check, "samenwerking loopt af"-nudge, **werkervaring
op het ZZP-profiel** #683, +20 ontwerpconcepten). Kader: OWASP Top 10 (A01/A03/A04/A09) + ASVS + AVG
art. 5/15/17/30. Zelf onafhankelijk geverifieerd schoon (subagent + grep): `invoice-legal.ts`/
`invoice-compliance-card.tsx` (pure/presentationeel, btw/kvk van de ZZP'er nooit naar de opdrachtgever-
payload — `compliance` is `isFreelancerOwner ? … : null`), `collaboration-renewal.ts`/`renewal-nudge.tsx`
(participant-gated), **`system-status.ts`/`system-status-panel.tsx`** (ADMIN-only via `requireRole` +
middleware; leest uitsluitend driver-MODI/booleans — géén sleutelwaarden bereiken de client; de rauwe
`Env` passeert de server/client-grens nooit, alleen de secret-vrije `SystemStatus`-struct), de 20 nieuwe
`/ontwerp`-concepten (statisch, geen `dangerouslySetInnerHTML`/Prisma/`fetch`; grep: 0 BSN-achtige
9-cijferreeksen, 0 e-mailadressen in de mock-data). **Eén HOOG volledig gefixt (rood→groen); geen overige
nieuwe gaten.**

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · AVG art. 17 (recht op wissen) + CLAUDE.md verificatieflow — de nieuwe
  `WorkExperience`-PII (#683) overleefde de anonimisering]** De werkervaring-feature introduceerde
  `model WorkExperience` (`prisma/schema.prisma:382`) met **zelf-gerapporteerde vrije tekst** die de
  ZZP'er op zijn (publieke) `/zzp/[id]`-profiel toont: `role` ("Verpleegkundige IC"), `organization`
  (opdrachtgever/instelling) en `description` (vrije toelichting die namen/patiënt-/opdrachtdetails kan
  bevatten). `anonymizeUser` (`src/app/(protected)/admin/gebruikers/actions.ts`) **updatet** het
  `FreelancerProfile` (visibility→PRIVATE) i.p.v. het te verwijderen, dus de `onDelete:Cascade` op
  `WorkExperience.freelancerProfileId` **vuurt niet** — precies het scenario dat de transactie voor élk
  zustergeval (`AvailabilityWindow.note`, `IndirectHoursEntry.note`, `FavoriteFreelancer.note`,
  `LeadContact.body`, `Idea`) expliciet met een eigen `updateMany`/`deleteMany` afvangt. Voor
  `WorkExperience` ontbrak die stap → de rol/organisatie/omschrijving bleven ná een verwijderverzoek
  onbeperkt in de DB staan (en, tot visibility PRIVATE werd, publiek zichtbaar). Repro: FREELANCER voegt
  een werkervaring toe → vraagt (art. 17) verwijdering → vóór de fix bleef `WorkExperience` met alle
  vrije tekst bestaan (herleidbaar uit "Verpleegkundige IC bij [kleine instelling] 2019–2020" +
  omschrijving). Gefixt: `prisma.workExperience.deleteMany({ where: { freelancerProfile: { userId } } })`
  toegevoegd aan de anonimiseringstransactie — de hele rij is PII van de betrokkene zónder operationele/
  fiscale bewaargrond (anders dan `Invoice`/`Expense`), dus volledig wissen (spiegelt `credential`/
  `document.deleteMany`), gescopet op het eigen profiel (nooit dat van een ander). Test: nieuwe case in
  `anonymize-erasure.test.ts` (deleteMany aanwezig + `where: { freelancerProfile: { userId } }` —
  rood→groen bewezen: zonder de regel ontbreekt de op; export/`account-export.ts` bevatte de velden al
  sinds #683, dus art. 15/20 was reeds gedekt).

## Ronde 2026-07-08 (2e — basis: `main` @ fd8826e)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken: (1) tenant-isolatie & IDOR over het volledige franchise-oppervlak (leads, zzpers,
opdrachtgevers, diensten, instellingen), `kandidaten`, `admin/franchises`, `samenwerkingen` +
`src/lib/tenancy.ts`; (2) API-route-authz, upload/storage, SSRF, injectie over alle `/api/tasks/**`
(cron-auth), document-/media-/PDF-/dossier-serving, `agenda/feed.ics`, `storage.ts`; (3) privacy/AVG —
volledigheid van `anonymizeUser`, `account-export.ts`, verwerkingsregister, k-anonimiteit, PII-in-logs.
Kader: OWASP Top 10 (A01/A03/A04/A09) + ASVS + AVG art. 5/15/17/30/32. **Geen KRITIEK/HOOG/MIDDEL
nieuwe security-gaten** — de mutatieketen (auth→rol→ownership→Zod→actie→audit), cron-auth
(`timingSafeEqual` op `CRON_SECRET`), document-serving (ownership + audit op allow én deny),
`assertSameTenant` (fail-closed), path-traversal-guard in `storage.ts` en de feed-token-HMAC zijn
consistent en solide. **Twee gerichte hardening-fixes volledig gedaan (rood→groen); MENSENWERK-items
(erasure van vrije-tekst-`reason` in event-store/notificaties, reviewer-naam in register) herbevestigd
en geparkeerd voor DPO-sign-off.**

### OPGELOST in deze ronde

- **[MIDDEL→OPGELOST · AVG art. 5/25 (privacy by design), k-anonimiteit — regressietest van de
  markttarief-drempel was losgekoppeld van de productieconstante]** De k-anonimiteitsvloer op
  markttarief-aggregaties (`MARKET_RATE_MIN_SAMPLE = 10`, `src/lib/config.ts:209`) voorkomt dat een
  ZZP'er het uurtarief (persoonlijke financiële data) van één collega herleidt uit p25/mediaan/p75. De
  productie-wiring (`src/lib/data/job-rate-bands.ts:55,62`) gebruikt de constante correct server-side,
  maar de enige test (`src/lib/market-rate.test.ts`) draaide met een lokale `MIN = 3` om louter de
  scope-keuze-logica te toetsen — géén test bond zich aan de échte constante. Repro: verlaag
  `MARKET_RATE_MIN_SAMPLE` naar 3 → de band toont bij 3 peers → herleidbaar, en **geen enkele test werd
  rood**. Gefixt: nieuwe `describe("k-anonimiteitsvloer MARKET_RATE_MIN_SAMPLE")` importeert de échte
  constante en assert `>= 10`. Rood→groen: elke verlaging onder 10 maakt de test nu rood.

- **[LAAG→OPGELOST · OWASP A01 (broken access control) — cross-tenant existence-oracle in franchise
  void-acties]** `setLeadStatus`/`deleteLead`/`addLeadContact` (`franchise/leads/actions.ts`) en
  `addDepartment`/`removeDepartment` (`franchise/opdrachtgevers/actions.ts`) laadden met kaal
  `findUnique({where:{id}})` en riepen dáárna `assertSameTenant` aan. Een onbekend id gaf een stille
  no-op; een **bestaand id van een ándere tenant** gooide een ongevangen `AuthorizationError` → een
  cross-tenant existence-oracle (een franchiser kon met een gegokt id onderscheiden of een
  lead/afdeling van een andere bemiddeling bestáát) + een lelijke 403/500 naar de client. Repro: een
  FRANCHISER van tenant-A roept `deleteLead("<id-van-tenant-B>")` → vóór de fix een thrown 403 (bestaat)
  vs. stille redirect (bestaat niet). Gefixt: throwende `assertSameTenant` vervangen door het bestaande
  fail-closed predicaat `ownsViaTenant` → cross-tenant gedraagt zich nu IDENTIEK aan "niet gevonden"
  (stille no-op/redirect, geen thrown status, geen oracle). Tests: `delete-lead.test.ts` bijgewerkt —
  cross-tenant asserteert nu de stille redirect i.p.v. de thrown fout (rood→groen: het oude
  `assertSameTenant`-pad gooide en faalde de nieuwe assertie).

## Ronde 2026-07-08 (basis: `main` @ 12e30fc)

Audit: orchestrator (Opus 4.8) + 2 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken: (1) de vérse delta sinds de vorige ronde (`ab6bc99..12e30fc`, #666–#672 — fail-closed
mock-verificatiepoort, client-fout-rapportage `/api/client-error`, inkomstendoel, uitgaven-tracker,
constructieve afwijzingsreden) — volledige auth→rol→ownership→Zod→actie→audit-keten + IDOR/injectie/
SSRF/PII-in-logs; (2) herverificatie van de geparkeerde privacy-items + een privacy-sweep op de nieuwe
`Expense`-data. Kader: OWASP Top 10 (A01/A03/A04/A09) + ASVS + AVG art. 5/15/17/20/30. **Delta-audit:
geen nieuwe security-gaten** — de uitgaven-/inkomstendoel-/kandidaten-acties volgen de keten volledig,
`/api/client-error` is PII-arm genormaliseerd + rate-limited, `rejection-reason` is een gesloten enum
(geen vrije tekst naar de ZZP'er), `route-guards` matcht op segmentgrens. **Eén HOOG + één MIDDEL
volledig gefixt (rood→groen); rest herbevestigd/geparkeerd.**

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · AVG art. 17 (recht op wissen) + art. 30/5/6 — prospect-PII in `Lead`/`LeadContact`
  had geen wis-pad, geen register-entry, geen bewaartermijn]** `model Lead` (`prisma/schema.prisma`)
  bewaart `contactName`/`email`/`phone`/`notes` van een externe opdrachtgever-prospect (géén platform-
  `User`) plus een vrije-tekst-`LeadContact.body`-logboek. `src/app/(protected)/franchise/leads/actions.ts`
  kende **alleen** create/statuswijziging/contact — **geen delete**. `anonymizeUser` raakt uitsluitend
  `User`-gebonden data, dus er bestond letterlijk geen enkel pad om deze PII te wissen → indefinite
  retentie, geen grondslag/termijn vastgelegd. Repro: een FRANCHISER legt een lead met naam+e-mail+
  telefoon+notities vast; de prospect vraagt (art. 17) om verwijdering → vóór de fix kon niemand dat
  uitvoeren, de PII bleef eeuwig staan. Gefixt: nieuwe `deleteLead(leadId)`-server-action (auth → rol
  FRANCHISER → `assertSameTenant` (tenant-ownership) → `prisma.lead.delete` — `LeadContact` cascadet mee
  via `onDelete: Cascade` op `leadId` → `LEAD_DELETED`-audit → redirect naar de lijst); UI-wisknop met
  bevestiging (`[id]/delete-lead-control.tsx`) op de lead-detailpagina; register-entry "Lead-acquisitie
  (bemiddelaar)" (grondslag GERECHTVAARDIGD_BELANG, expliciete bewaartermijn + wis-pad) +
  `RETENTION_SCHEDULE`-regel "Acquisitie-leads". Tenant-gescopet: een franchiser wist nooit een lead van
  een andere bemiddeling. Tests: `src/app/(protected)/franchise/leads/delete-lead.test.ts` (4 cases —
  eigen-tenant → delete+audit+redirect; cross-tenant → `AuthorizationError`, géén delete/audit;
  niet-FRANCHISER → geweigerd; onbekend id → geen delete, wél redirect (geen bestaan-lek) — rood→groen:
  zonder de tenant-poort zou de delete cross-tenant vuren).

- **[MIDDEL→OPGELOST · AVG art. 15/20 (inzage/dataportabiliteit) — de nieuwe `Expense`-PII ontbrak
  volledig in de inzage-export]** De uitgaven-tracker (#670) introduceerde `model Expense`
  (`description` = eigen vrije tekst, `netCents`/`vatCents`/`category`/`occurredAt`), maar
  `src/lib/account-export.ts` bevatte géén `expense`-sectie — een FREELANCER die zijn eigen data
  opvraagt kreeg zijn zakelijke uitgaven (incl. eigen omschrijvingen) niet terug, terwijl het platform
  dit wél als zijn persoonsgegeven/administratie behandelt. Repro: boek een uitgave "Lunch met klant X" →
  vraag de AVG-inzage-export op → vóór de fix ontbrak de uitgave volledig. Gefixt: smalle, op `userId`
  gescopete `db.expense.findMany`-sectie toegevoegd (`description`/`category`/`netCents`/`vatCents`/
  `occurredAt`/`createdAt`; interne grootboek-id's blijven eruit). Test: nieuwe case in
  `src/lib/account-export.test.ts` (sectie present, op de actor gescopet, geen interne id — rood→groen:
  zonder de sectie faalt de present-assertie en gooit de fake-db op de ontbrekende `expense`-tabel).

### Geparkeerd / herbevestigd (deze ronde geverifieerd nog steeds open)

- **[MIDDEL→OPGELOST (verificatie 2e ronde 2026-07-08) · AVG art. 15/20 — inzage-export mist enkele
  erased-maar-niet-geëxporteerde velden]** ~~Naast `Expense` mist `account-export.ts` nog
  `ShiftHandoff.reason`/`decisionNote`, `AvailabilityWindow.note`, `Collaboration.disputeReason`,
  CLIENT-`Application.note`.~~ **Gecorrigeerd:** in de 2e ronde in code geverifieerd dat alle vier de
  velden inmiddels aanwezig én correct op de actor gescoped zijn in `account-export.ts` (commit
  `620f926`, PR #677); zie ook de "OPGELOST 2026-07-08"-entry lager in dit bestand. Deze regel bleef
  per abuis als "open" staan (documenthygiëne, CLAUDE.md regel 6) — hierbij gesloten.
- **[MIDDEL→OPGELOST · OWASP A04/A09 (+ AVG art. 32) — `/api/billing/webhook` heeft geen rate-limit]**
  Publieke, ongeauthenticeerde webhook deed per ping een uitgaande Mollie/Stripe-call
  (`provider.paymentStatus`) voor een aanvaller-gestuurd id — geen forgeable state-change (server
  her-verifieert + matcht op `providerRef`), maar een ongelimiteerde outbound-oracle/kostenamplificatie
  (+ een DB-lookup per ping). Gefixt: nieuwe IP-gekeyde `billingWebhookRateLimiter` (spiegel
  `cspReportRateLimiter`, default 60/min/IP via `BILLING_WEBHOOK_RATE_LIMIT`) als eerste stap in de
  POST-handler — vóór de body-read, de provider-referentie-resolutie én de DB-lookup. Bij overschrijding
  bewust **200** (geen 429): een 429 zou de provider tot een retry-storm aanzetten en throttle-info
  lekken; de drempel ligt ruim boven een legitieme provider-burst (retries lopen met backoff) zodat een
  echte webhook niet gemist wordt. Tests: `src/app/api/billing/webhook/route.test.ts` (6 cases —
  flood→200+géén provider/DB-werk, IP-keying via x-forwarded-for/x-real-ip, doorlaat→resolutie,
  paid→activatie+audit, geen sub→geen provider-call). Rood→groen: zonder de poort vuurt de provider-call
  ongelimiteerd.
- **[MIDDEL · AVG art. 30 (+5/6) — publieke reviewer-naam niet in register — MENSENWERK]** Herbevestigd:
  `src/components/profile/profile-screen.tsx:219,524` toont de echte `author.name` van een review op de
  publieke, niet-ingelogde `/zzp/[id]`; geen register-entry voor deze openbaarmaking van een derde.
  Productbeslissing (register-entry+grondslag vs. alleen voornaam/initialen vs. opt-in) → eerst mens
  (FG/eigenaar, MENSENWERK §5), daarna kleine patch.
- **[LAAG · AVG art. 5(1e)/17 vs. fiscale bewaargrond — `Expense.description` niet geredigeerd bij
  anonimisering — MENSENWERK]** `Expense` wordt bij `anonymizeUser` niet aangeraakt (spiegelt het bewuste
  `Invoice`-fiscale-bewaarplicht-precedent). Waarschijnlijk consistente, bewuste architectuur — maar
  moet een expliciete DPO-beslissing zijn (redigeren zoals `ShiftHandoff`, óf expliciet onder de
  7-jaars-fiscale-uitzondering houden en dat in het register benoemen), geen stille agent-fix.
- **[LAAG · body-read-parity — `/api/client-error` + `/api/csp-report` lezen de body vóór de
  grootte-check]** `request.text()` leest de volledige body in geheugen vóór `MAX_BODY_BYTES`; beide
  routes zijn IP-rate-limited + upstream begrensd. Bestaand geaccepteerd patroon (niet nieuw). Aanbevolen:
  vroege `Content-Length`-afwijzing op beide routes.

## Ronde 2026-07-07 (2e — basis: `main` @ ab6bc99)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken: (1) alle 39 `src/app/api/**/route.ts` route handlers, (2) alle `"use server"`
action-bestanden + gedeelde authz/tenancy/cascade-helpers, (3) volledige AVG/privacy-sweep
(anonimisering/export/dataminimalisatie/k-anonimiteit/register/retentie/derden), (4) cross-cutting
injectie/SSRF/redirect/secrets/headers/auth/deps (`npm audit`). Kader: OWASP Top 10 (A01/A03/A04/A09)

- ASVS + AVG art. 5/6/15/17/30. `npm audit --production`: **0 kwetsbaarheden** (dev-only: esbuild GHSA-
  g7r4-m6w7-qqqr LAAG, js-yaml GHSA-h67p-54hq-rp68 MIDDEL — buiten de productie-tree). Next 15.5.19 (voorbij
  CVE-2025-29927 middleware-bypass), next-auth 5.0.0-beta.31, Prisma 6.19.3 — geen toepasselijke CVE's.
  **Eén KRITIEKE bevinding volledig gefixt (rood→groen); vijf lager-prioritaire geparkeerd (hieronder).**

### OPGELOST in deze ronde

- **[KRITIEK→OPGELOST · OWASP A04 (insecure design) + kerndifferentiatie-verificatieflow — de
  ingebouwde demo-verifiers stempelden op productie een verzonnen-maar-format-geldig diploma/BIG-nummer/
  identiteit stil als "Geverifieerd", wat de plaatsingspoort opent]** In de standaardconfiguratie geven
  `getDiplomaVerifier`/`getBigVerifier`/`getIdentityVerifier` de `Mock*`-verifier terug (`source: "MOCK"`)
  tenzij `DIPLOMA_VERIFIER=duo` / `BIG_VERIFIER=bigregister` / `IDENTITY_VERIFIER=idin` expliciet is gezet.
  De mocks controleren **alleen het formaat** (BIG = 11 cijfers, DUO-code-patroon, naam-match) en geven
  dan `verified:true`. De zelf-verificatie-acties (`verifyCredentialViaDuo`/`verifyCredentialViaBig` in
  `src/app/(protected)/certificaten/actions.ts`, `verifyIdentity` in `src/app/(protected)/account/actions.ts`)
  zetten het resultaat direct op `VERIFIED` — het hoogste vertrouwenssignaal — zónder admin-tussenkomst.
  `computeCompliance`/`complianceBlocksPlacement` behandelt `Credential.status === "VERIFIED"` als
  grondwaarheid en laat op grond daarvan het tekenen van een contract voor een BIG-/diploma-plichtige
  (zorg)opdracht toe (Wkkgz-relevant). **Repro:** een FREELANCER uploadt een willekeurige PDF als
  "Licentie", roept `verifyCredentialViaBig(id, {bigNumber:"12345678901"})` aan → op een productie-deploy
  zónder echte BIG-koppeling werd de credential VERIFIED en passeerde de plaatsingspoort — een neppe
  beroepsregistratie. Er bestond **geen code-level fail-closed poort**; de mock draaide silent-by-omission.
  **Gefixt:** nieuwe pure poort `src/lib/services/verification-policy.ts` (`isMockVerificationAllowed` /
  `mockVerificationBlocked`): buiten productie én bij `SEED_DEMO=true` (expliciete demo-dataset) én bij
  `ALLOW_MOCK_VERIFICATION=true` (bewuste pilot-opt-in) is de mock toegestaan; op een échte productie-
  deploy (geen demo, geen opt-in) wordt een `source:"MOCK"`-resultaat **geweigerd** (fail-closed) — de
  drie acties stempelen niets, auditen de geweigerde poging (`CREDENTIAL_VERIFY_BLOCKED` /
  `IDENTITY_VERIFY_BLOCKED`) en sturen de gebruiker naar de handmatige admin-verificatiequeue (de
  gezonde vertrouwensroute blijft). Echte registerresultaten (`source !== "MOCK"`) passeren altijd. `env.ts`
  kent nu `ALLOW_MOCK_VERIFICATION`/`SEED_DEMO` + een productie-`envWarnings` die luid meldt dat zelf-
  verificatie GEBLOKKEERD is (of, bij opt-in, dat verzonnen credentials geverifieerd kunnen worden). Rule 8
  gerespecteerd: **geen boot-break** — het is een runtime-actiepoort + waarschuwing, geen harde env-eis.
  Tests: `src/lib/services/verification-policy.test.ts` (11 pure cases), `verify-failclosed.test.ts`
  (integratie: geen `$transaction`/VERIFIED-schrijf in productie, wél bij SEED_DEMO/dev — rood→groen: zonder
  de poort stempelt de actie VERIFIED op een mock-resultaat), + 3 nieuwe `env.test.ts`-cases. **GO-LIVE:
  zet de echte koppelingen (`=duo`/`=bigregister`/`=idin`) vóór echte diploma-/VOG-data live gaat.**

### Geparkeerd (deze ronde gevonden, nog niet gefixt)

- **[HOOG · AVG art. 30/5/6 — Lead/prospect-PII buiten register, geen bewaartermijn, geen wis-pad]**
  `model Lead`/`LeadContact` (`prisma/schema.prisma`) bewaart `contactName`/`email`/`phone`/`notes`/`body`
  van externe opdrachtgever-prospects (géén platform-`User`). Deze verwerking staat **niet** in
  `PROCESSING_REGISTER`, heeft **geen** `RETENTION_SCHEDULE`-regel en `src/app/(protected)/franchise/leads/
actions.ts` kent **geen delete/erase-actie** — indefinite retentie, geen grondslag vastgelegd. Fix:
  register-entry ("Lead-acquisitie", grondslag GERECHTVAARDIGD_BELANG) + retentieregel + tenant-gescopede
  `deleteLead`-actie (auth→rol FRANCHISER→`assertSameTenant`→cascade delete→audit) + wis-UI-knop.
- **[MIDDEL · AVG art. 15/20 — inzage-export onvolledig]** `src/lib/account-export.ts` mist zelf-geschreven
  PII die `anonymizeUser` wél als wisbaar behandelt: `ShiftHandoff.reason`/`decisionNote`,
  `AvailabilityWindow.note`, `Collaboration.disputeReason` (eigen), `LeadContact.body` (als FRANCHISER),
  en CLIENT-geschreven `Application.note` (de `applications`-query is op `freelancer.userId` gescoped → voor
  een CLIENT-actor leeg). Fix: die secties toevoegen met eigen-data-scoping.
- **[MIDDEL · OWASP A04/A09 — `/api/billing/webhook` heeft geen rate-limit]** `src/app/api/billing/webhook/
route.ts` is publiek (geen auth) en doet per ping een uitgaande Mollie-API-call (`provider.paymentStatus`)
  voor een aanvaller-gestuurd `id`. Geen forgeable state-change (server her-verifieert bij Mollie + matcht op
  bestaande `providerRef`), maar wél een ongelimiteerde outbound-oracle/kostenamplificatie — anders dan
  `csp-report`/`agenda/feed.ics` die wél `enforceRateLimit` hebben. Fix: IP-gekeyde rate-limiter (bv. nieuwe
  `billingWebhookRateLimiter`) vóór de provider-call.
- **[MIDDEL · AVG art. 30/5 — publieke reviewer-naam niet in register]** `src/components/profile/
profile-screen.tsx` toont de echte `author.name` van een review op de publieke, niet-ingelogde `/zzp/[id]`.
  Geen register-entry voor deze openbaarmaking van een derde (de reviewer). Fix: register-entry
  "Beoordelingen (publiek)" + grondslag, of alleen voornaam/initialen tonen, of opt-in bij indienen.
- **[LAAG · rate-limiter fail-open bij Upstash-storing]** `src/lib/rate-limit.ts:162-192` (`consume`) geeft
  bij een Redis-fout `allowed:true` (bewuste "beschikbaarheid > limiet"-keuze). Autorisatie faalt nooit open —
  alleen de throttle — en de ID's zijn `cuid()` (niet enumereerbaar). Menselijke afweging of dit acceptabel is.

_De vier geparkeerde items uit de 1e ronde van 2026-07-07 (Lead-vrije-tekst-derden, retentie-purge-taak,
Geoapify-register, IBAN-register) blijven eveneens open; zie hieronder._

## Ronde 2026-07-07 (1e — basis: `main` @ 3f6cda5)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken: (1) alle 39 `src/app/api/**/route.ts` route handlers, (2) alle 46 `"use server"`
action-bestanden + de gedeelde authz/tenancy/enums/audit-helpers, (3) een volledige AVG/privacy-sweep
(anonimisering/verwijdering, inzage-export, dataminimalisatie, k-anonimiteit, verwerkingsregister,
logs, retentie, derde-partijen). Kader: OWASP Top 10 (A01 broken access control/IDOR/cross-tenant, A03
injection, A04 insecure design, A09 logging) + OWASP ASVS + AVG art. 5/15/17/30. `npm audit` schoon (0
kwetsbaarheden). Zelf onafhankelijk geverifieerd schoon (geen nieuwe gaten): de delta sinds de vorige
ronde (`d4b6039..3f6cda5`, #638–#644 — reiskosten/mileage, factuur-herhalen, opdracht-sluit-notificatie,
S3 SSE-at-rest, ontwerpconcepten); alle export-CSV's escapen formule-injectie (`escapeCsvField`); cron-
routes zijn `timingSafeEqual`-secret-gated; de billing-webhook her-verifieert de status server-side bij
Mollie; wachtwoord-reset (gehashte tokens, 1u TTL, atomair eenmalig gebruik, enumeratiebescherming, rate-
limited); CSP met nonce+strict-dynamic; login hardcode-redirect (geen open redirect). **Eén KRITIEKE
bevinding volledig gefixt (rood→groen); vier lager-prioritaire geparkeerd (hieronder).**

### OPGELOST in deze ronde

- **[KRITIEK→OPGELOST · OWASP A09 (logging) + AVG art. 17 (recht op vergetelheid) — `anonymizeUser`
  scrubde de auditlog-metadata niet, waardoor het rauwe e-mailadres (en IP/user-agent) van de betrokkene
  de anonimisering overleefde]** `anonymizeUser` (`src/app/(protected)/admin/gebruikers/actions.ts`)
  overschrijft `User.email`/`name` en redacteert tientallen vrije-tekstvelden, maar raakte **geen enkele
  bestaande `AuditLog`-rij** aan. Vier schrijfpunten zetten het rauwe e-mailadres in `AuditLog.metadata`
  (JSON-string): `src/auth.ts:81` (`AUTH_RATE_LIMITED`) en `:97` (`USER_LOGIN_FAILED`),
  `src/app/register/actions.ts:45` (`REGISTER_RATE_LIMITED`), `src/app/(protected)/admin/import/actions.ts:285`
  (`USER_IMPORTED`). Daarnaast staan het IP-adres en de user-agent (beide persoonsgegeven) op de eigen
  auditregels van de betrokkene. Repro: een gebruiker logt ooit fout in / registreert / wordt geïmporteerd,
  wordt later op eigen verzoek geanonimiseerd → een `SELECT * FROM AuditLog WHERE entityId = '<userId>'`
  (of het admin-dossier `src/lib/admin-user-detail.ts`, dat audit-metadata tóónt) levert nog steeds het
  originele e-mailadres + IP op — de betrokkene blijft herleidbaar ondanks "geanonimiseerd", precies wat
  art. 17 moet voorkomen. Gefixt: pure helper `scrubAuditMetadataEmail` (exact, hoofdletter-ongevoelig
  matchend — geen substring-lek naar de auditregel van een ander) + `anonymizeUser` zoekt nu élke
  auditregel die aan de betrokkene raakt (eigen `actorId`/`entityId`, of het originele e-mailadres in de
  metadata) en redact e-mail uit de metadata + wist IP/user-agent, atomair binnen dezelfde anonimiserings-
  transactie. Tests: `src/lib/account-anonymization.test.ts` (6 pure cases incl. substring-niet-raken +
  hoofdletter-ongevoeligheid) en `src/app/(protected)/admin/gebruikers/anonymize-erasure.test.ts` (3 nieuwe
  cases: e-mail eruit/IP eruit op login-failed, rol-behoud+e-mail-redact op import, IP+UA-wis op eigen
  actie, en de auditregel-van-een-ander wordt NIET geraakt — rood→groen: zonder de fix ontbreken de
  `auditLog.update`-ops volledig).

### Geparkeerd (deze ronde gevonden, nog niet gefixt)

- **[HOOG · AVG art. 17 — vrije tekst van dérden óver de betrokkene overleeft anonimisering]**
  `src/app/(protected)/admin/gebruikers/actions.ts` redacteert bewust NIET: `NoShowReport.reason` (door de
  melder over déze ZZP'er geschreven, regel ~114), en analoog `Review.comment` waar de betrokkene
  `subjectId` is (alleen `authorId`-reviews worden gewist) en `ShiftHandoff.decisionNote`/`reason` van de
  tegenpartij. Na anonimisering kan zo'n record nog steeds de naam/identificerende details van de
  "verwijderde gebruiker" tonen. Bewuste architectuurkeuze met reëel PII-risico → **eerst door mens (FG/
  eigenaar, MENSENWERK.md §5) laten beoordelen** vóór er echte VOG/diploma-houders op productie staan; zo
  niet acceptabel, redacteren met een bewaargrond-uitzondering alleen bij een lopend geschil (zoals al bij
  `disputeReason` gebeurt).
- **[MIDDEL · AVG art. 5 lid 1e (opslagbeperking) — bewaartermijnen niet technisch afgedwongen]**
  `src/lib/compliance/processing-register.ts` (`RETENTION_SCHEDULE`) claimt termijnen (AuditLog 12 mnd,
  berichten 12 mnd na samenwerking, reacties 4 wk na selectie), maar `src/app/api/tasks/run-all/route.ts`
  bevat géén purge/cleanup-taak voor `AuditLog`/`Message`/`Application` — data blijft feitelijk onbeperkt.
  Fix: een scheduled retentie-taak toevoegen die deze regels afdwingt, of het register bijstellen naar de
  werkelijke praktijk (nu is het register misleidend).
- **[MIDDEL · AVG art. 30 — verwerkingsregister mist reistijd-routing + derde-partij Geoapify]**
  `src/lib/services/routing.ts` stuurt locatiegegevens (plaats/adres uit `FreelancerProfile.location`/
  `Job.location`) naar `api.geoapify.com` (extern, mogelijk niet-EER), maar
  `src/lib/compliance/processing-register.ts` noemt deze verwerking/ontvanger nergens (in tegenstelling tot
  DUO/BIG/iDIN/e-mail, die wél met SCC-taal zijn opgenomen). Fix: activiteit + verwerker/doorgifte-
  beoordeling (SCC's indien niet-EER) toevoegen. NB: routing staat default op `offline` (inert) — alleen
  relevant zodra `ROUTING_PROVIDER=geoapify`.
- **[LAAG · AVG art. 30 — register noemt niet-bestaand gegevenstype]**
  `src/lib/compliance/processing-register.ts` vermeldt "Bankgegevens (IBAN)" bij facturatie, maar
  `prisma/schema.prisma` bevat geen IBAN/bankgegevensveld. Fix: verwijderen of expliciet als
  "toekomstig/nog niet geïmplementeerd" markeren.

## Ronde 2026-07-06 (2e — basis: `main` @ d4b6039)

Audit: orchestrator (Opus 4.8) + 1 parallelle adversariële Opus security-subagent op de vérse delta
sinds de vorige ronde (`a5abe5a..d4b6039`, #631–#637): de nieuwe **upload-malware-scan-seam**
(`services/upload-scanner.ts`, ClamAV achter env-flag, #631), de **betaalreputatie-spiegel** voor de
opdrachtgever (`data/payment-behavior.ts` + `client-payment-reputation.ts`, #632), de **passende open
diensten op het ZZP'er-dossier** (franchise, `franchise/dienst-suggesties.ts`, #634) en de proactieve
**urencriterium-herinnering** (`hours-criterion-reminder(-task).ts`, #636). Kader: OWASP Top 10 (A01
broken access control/IDOR/cross-tenant, A04 insecure design, A03 injection, A09 logging) + OWASP ASVS +
AVG art. 5/17/30. Zelf onafhankelijk geverifieerd schoon: `dienst-suggesties`/`dienst-voordracht`/
`roster-dossier` (overal `tenantScopeWhere(actor)`; de audit-log-idempotentie-lookups zijn transitief
tenant-gescopet via reeds-gecheckte `jobId`), de betaalreputatie-spiegel (alleen aggregaten, `actor.id`-
gescopet, geen cross-party-lek), `hours-criterion-reminder-task` (geen PII in logs, entitlement-gated,
mutatie+audit+notificatie in één `$transaction`), de clamd INSTREAM-parser (`interpretClamAvResponse`:
found-vóór-clean, geankerde single-line-match, fail-closed default). **Twee bevindingen volledig gefixt
(rood→groen).**

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · OWASP A01 (broken access control — stale server-side status + cross-tenant) +
  CLAUDE.md regel 1 + tenant-isolatie (`lib/tenancy.ts`) + AVG art. 17 — publieke vertrouwensdossier-
  deelpagina dwong geen account-liveness of tenant-isolatie af]** De sessieloze, publieke deelpagina
  `/vertrouwen/[profileId]/[token]` (`src/app/vertrouwen/[profileId]/[token]/page.tsx`) is gepoort door
  een deterministisch, per-profiel onveranderlijk HMAC-deeltoken + `visibility === "PUBLIC"`, maar
  checkte — anders dan zijn sibling-viewer `/zzp/[id]` (`profile-screen.tsx`, die het expliciet dóét) en
  anders dan de één-commit-eerdere agenda-feed-fix (#630) — **noch** account-liveness (`status` /
  `anonymizedAt`) **noch** tenant-isolatie. Schorsing (`setUserStatus`) en anonimisering (`anonymizeUser`)
  raken `FreelancerProfile.visibility` niet, dus een geldig token overleeft de statuswijziging: de pagina
  bleef de **naam + alle VERIFIED-certificaten + de "Servergeverifieerd door ZZP Platform"-zegel**
  serveren voor een geschorst (bv. wegens fraude/valse VOG) of geanonimiseerd/gewist account — precies
  het scenario dat de kerndifferentiatie (geverifieerd vertrouwen) hoort te vóórkomen. Bovendien maakt
  `createZzper` (franchise) roster-ZZP'ers standaard met `visibility: "PUBLIC"` **én** `tenantId` gezet;
  hun vertrouwensdossier was zo over het hele publieke internet bereikbaar zónder enige tenant-grens,
  terwijl hetzelfde profiel op `/zzp/[id]` correct per tenant is afgeschermd (`tenantEntityVisibleTo`) —
  een cross-tenant-lek op een niet-verlopende bearer-URL. Repro: (1) ADMIN schorst/anonimiseert een
  FREELANCER → de eerder gedeelde `/vertrouwen/{id}/{token}`-link toont nog steeds het geverifieerde
  dossier; (2) een franchise-roster-ZZP'er (tenant-gebonden) → dossier publiek zonder tenant-check.
  Gefixt: liveness-poort (`status === "ACTIVE" && !anonymizedAt`) + tenant-poort (`tenantId === null` —
  de anonieme-viewer-reductie van `tenantEntityVisibleTo`) toegevoegd aan de `isShared`-gate, met
  `tenantId`/`status`/`anonymizedAt` in de `select`; neutrale "niet (meer) gedeeld"-melding blijft (geen
  informatielek). Test: `src/app/vertrouwen/vertrouwen-liveness.test.ts` (actief+PUBLIC+geen-tenant →
  audit/serve; geschorst/geanonimiseerd/tenant-gebonden/ongeldig-token → geen serve, geen audit —
  rood→groen bewezen: 3 cases falen zonder de poorten).

- **[MIDDEL→OPGELOST · OWASP A04 (insecure design) + CLAUDE.md regel 4 (upload-veiligheid) — company-
  logo-upload omzeilde de nieuwe malware-scanner]** #631 introduceerde `assertUploadClean` (fail-closed
  ClamAV-scan vóór opslag) en bedraadde die in de document- én certificaat-upload, maar **niet** in de
  derde stored-binary-upload-call-site: de company-logo-upload in `src/app/(protected)/bedrijf/actions.ts`
  (`updateCompanyProfile`). Die deed wél `validateUpload` + `assertContentMatchesMime`, maar geen
  malware-scan → wanneer een operator `UPLOAD_SCANNER=clamav` inschakelt (in de verwachting dat álle
  uploads gescand worden), belandde een besmet "logo" onbekeken in de opslag én werd het via
  `/api/media/[...key]` aan elke ingelogde gebruiker geserveerd. Geen live exploit (scanner default Noop;
  logo's zijn PDF/PNG/JPEG/WEBP met magic-byte-check + `nosniff` bij serve → geen SVG-stored-XSS), maar
  een reële completeness-gap die de fail-closed-intentie van #631 voor dít pad ondermijnt. Gefixt:
  `await assertUploadClean(buffer, { mimeType, size })` toegevoegd binnen de bestaande
  `UploadValidationError`-try/catch, identiek aan de twee zuster-call-sites. Test:
  `src/app/(protected)/bedrijf/actions.scan.test.ts` (schoon logo → scanner aangeroepen + `storage.put`;
  besmet logo → géén `storage.put` + fieldError — rood→groen bewezen: 2 cases falen zonder de regel).

### GEPARKEERD in deze ronde

- Geen nieuwe geparkeerde bevindingen. De onder "Ronde 2026-07-06 (1e)" en eerder geparkeerde LAAG-items
  (o.a. de Zod-grens op id-only-actions, self-export-audit, push-upsert-key) blijven staan.

## Ronde 2026-07-06 (basis: `main` @ a5abe5a)

Audit: orchestrator (Opus 4.8) + 2 parallelle Opus security-subagents op de vérse delta sinds de vorige
ronde (`944ee7c..a5abe5a`, #623–#629): de nieuwe **abonneerbare agenda-feed** (`/api/agenda/feed.ics`

- `calendar/feed-token.ts` + `user-schedule.ts`, #628), de **directe uitnodiging** (opdrachtgever →
  ZZP'er, `job-invite.ts` + `inviteFreelancerToJob`, #625), de **lead-pijplijn-samenvatting** (franchise,
  #627) en de nieuwe **CSP-violatie-ontvanger** (`/api/csp-report` + `observability/csp-report.ts`, #624).
  Kader: OWASP Top 10 (A01 broken access control/IDOR, A03 injection, A04 insecure design, A09 logging) +
  OWASP ASVS + AVG art. 5/17/30. Zelf onafhankelijk geverifieerd: CSP-report-endpoint (ongeauthenticeerd,
  maar rate-limited per IP, 16KB-bodylimiet, altijd 204, AGRESSIEF PII-genormaliseerd — document-URL → pad,
  bron-URL → origin, referrer/UA/original-policy weggegooid, `sample` afgekapt op 120 tekens; geen
  log-injectie-/DoS-/PII-vector); agenda-feed-token (128-bit HMAC-SHA256, namespace-gescheiden van het
  dossier-deeltoken, timing-safe + lengte-check verificatie); lead-pijplijn (read-only, `requireRole
("FRANCHISER")` + `tenantScopeWhere(actor)` — geen cross-tenant, alleen aggregaten, geen per-individu-PII
  onder de k-anon-drempel `LEAD_CONVERSION_MIN_SAMPLE`). **Twee bevindingen volledig gefixt (rood→groen);
  één LAAG geparkeerd.**

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · OWASP A01 (broken access control / cross-tenant IDOR) + CLAUDE.md regel 1 & 2 —
  `inviteFreelancerToJob` scopet de uitgenodigde ZZP'er niet op de tenant]** De nieuwe directe-
  uitnodiging (`src/app/(protected)/opdrachten/actions.ts`) deed correct auth → rol `CLIENT` → ownership
  van de ópdracht (`assertOwnership(actor, job.company.userId)`), maar zocht de uit te nodigen ZZP'er met
  **alleen** `discoverableFreelancerWhere` (`{ visibility: "PUBLIC", user: { status: "ACTIVE" } }`) —
  **zonder** `tenantId`-grens. `FreelancerProfile.visibility` staat standaard op `PUBLIC`, dus de query
  vond óók een ZZP'er uit de private roster van een ándere franchise. Élke andere consument van
  `discoverableFreelancerWhere` combineert 'm met de tenant (`suggestions.ts:306`:
  `{ ...discoverableFreelancerWhere, tenantId: job.tenantId }`, met de comment "anders lekt cross-tenant
  PII" — en dát is precies de functie die déze uitnodigingsknoppen voedt). Repro: een opdrachtgever in
  franchise-A (of een directe opdrachtgever, `tenantId: null`) roept de server action
  `inviteFreelancerToJob(eigenJobId, freelancerVanFranchiseB.id)` rechtstreeks aan → vóór de fix: een
  `Notification` naar die ZZP'er met bedrijfs-/opdrachtnaam van búiten zijn franchise + een `JOB_INVITED`-
  audit + een PII-join over de tenant-grens. De ownership-stap dekte de opdracht, niet de uitgenodigde
  (CLAUDE.md regel 2). Niet via de UI zichtbaar (die toont alleen tenant-gescopete suggesties), maar de
  server mag daar niet op leunen (regel 1: client toont, beslist niet). Gefixt: `tenantId: true` op de
  job-select + `tenantId: job.tenantId` op de freelancer-`where` (spiegelt `suggestions.ts` exact; een
  directe opdrachtgever bereikt zo alleen niet-tenant-ZZP'ers). Test: nieuwe case in
  `opdrachten/actions.test.ts` (`findFirst`-mock respecteert nu de tenant-`where`; franchise-B-ZZP'er →
  geen notificatie/audit — rood→groen bewezen).

- **[MIDDEL→OPGELOST · OWASP A01 + CLAUDE.md regel 1 (server-side status = waarheid) + AVG art. 17 —
  publieke agenda-feed dwong geen account-liveness af]** De nieuwe abonneerbare feed
  `GET /api/agenda/feed.ics` (#628) is bewust sessieloos (een externe agenda-app pollt 'm) en gepoort door
  een deterministisch, per-gebruiker onveranderlijk HMAC-token. Daardoor blijft een geldig token gelden
  ná schorsing of anonimisering: de feed serveerde het volledige werkrooster van de gebruiker — inclusief
  de **NAAM van de tegenpartij (derde-partij-PII)**, jobtitels en data — ook voor een geschorst (bv.
  wegens fraude/misbruik) of geanonimiseerd/gewist account. De sessie-export (`/api/agenda`) snijdt zo'n
  account wél live af via `currentActor()` (`status !== "ACTIVE"` of `anonymizedAt` → geen actor;
  `anonymizeUser` zet `status: "SUSPENDED"` + `anonymizedAt`), maar de publieke feed had die check niet.
  Repro: schors (of anonimiseer) een account met een actieve samenwerking → open de eerder gedeelde
  `feed.ics?u=…&t=…`-link → vóór de fix: 200 + rooster met tegenpartij-PII. Gefixt: een liveness-poort
  ná de tokenverificatie (`prisma.user.findUnique` → `!user || anonymizedAt || status !== "ACTIVE"` →
  404, vóór elke rooster-DB-I/O; 404 i.p.v. 403 zodat de respons niets over het bestaan/de status
  prijsgeeft — spiegelt `currentActor()`). Test: `src/app/api/agenda/feed-liveness.test.ts` (actief →
  200 + rooster; geschorst/geanonimiseerd/onbekend → 404 + géén rooster-load; ongeldig token → 404 vóór
  DB — rood→groen bewezen: 3 cases falen zonder de poort).

### GEPARKEERD in deze ronde

- **[LAAG · CLAUDE.md regel 2 (Zod-grens) — `inviteFreelancerToJob` valideert de twee id-inputs niet via
  Zod]** `jobId`/`freelancerProfileId` gaan rauw de `prisma.findUnique/findFirst` in (Prisma
  parametriseert → geen injectie; consistent met zuster-id-only-actions als `toggleSavedJob`/
  `changeJobStatus`). Geen exploit; puur consistentie met de "elke mutatie: Zod"-keten. Aanbevolen:
  triviale `z.string().cuid()`-guard voor defense-in-depth. Terugkerend thema (zie eerdere rondes:
  `saveApplicationNote`).

## Ronde 2026-07-05 (2e — basis: `main` @ 944ee7c)

Audit: orchestrator (Opus 4.8) + 3 parallelle Opus security-subagents op niet-overlappende
oppervlakken, gericht op de vérse code sinds de vorige ronde (opdrachtgever-betaal/crediteuren/
vacaturetempo-features #616–#621, cron-fout-reporting #615) — (1) IDOR/authz over ÁLLE 24
`src/app/api/**`-route-handlers (incl. cron-auth, document/media, dossier/PDF/export, billing-webhook,
push), (2) cross-tenant-isolatie over álle 12 franchise-server-actions + gedeelde tenant-scoped
data-laag, (3) cross-party-PII/dataminimalisatie/injectie op de non-admin/non-franchise mutatie-
oppervlakte + de nieuwe payment-obligations/creditor/vacancy-features + CSV-export-escaping. Kader:
OWASP Top 10 (A01 broken access control, A03 injection, A04 insecure design, A09 logging) + OWASP
ASVS + AVG art. 5/15/17/30. Zelf onafhankelijk geverifieerd: storage-abstractie (path-traversal-guard
`LocalStorageDriver.resolve` + magic-byte-sniff `sniffMimeType` + niet-raadbare `generateStorageKey`),
CSV formule-injectie-guard (`escapeCsvField`: neutraliseert `= + @ TAB CR` + niet-numerieke `-`),
push-SSRF-allowlist (`isAllowedPushEndpoint`), bulk-import mass-assignment (`assertImportRole` runtime-
gate + PII-gemaskeerde logs), `anonymizeUser`-erasure-volledigheid (uitputtend t.o.v. het schema),
geen server-side `fetch` met user-URL (geen SSRF-vector), `npm audit`: **0 prod-kwetsbaarheden**
(2 dev-only: js-yaml GHSA-h67p-54hq-rp68 — raakt de productie-bundel niet). **Geen KRITIEK/HOOG
gevonden** — de drie oppervlakken zijn goed gehard: elke ownership-gevoelige route/actie doet
auth→rol→ownership(DB-hercheck, nooit client-id vertrouwd)→Zod→actie→audit (op allow én deny); élke
duale/cross-tenant mutatie scopet béide resources op de server-side `Actor.tenantId`. Eén MIDDEL
defense-in-depth-hardening gefixt (rood→groen); rest geparkeerd (LAAG).

### OPGELOST in deze ronde

- **[MIDDEL→OPGELOST · OWASP A01/A04 + CLAUDE.md regel 1 — `VerplichtingenPanel` had geen eigen
  rol-gate]** Het herbruikbare servercomponent `verplichtingen-panel.tsx` riep `getObligationItemsFor
Client(actor.id)` aan en toonde de betaalverplichtingen (crediteuren/facturen/bedragen) van een
  OPDRACHTGEVER zónder zelf `actor.role === "CLIENT"` te checken — het leunde vólledig op zijn twee
  aanroepers (`verplichtingen/page.tsx` redirect + de Administratie-hub `tabsForRole`-allowlist). Beide
  gate'n vandaag correct (niet live-exploiteerbaar), maar een herbruikbaar component dat CLIENT-
  financiën laadt hoort de rol zélf te gaten: een toekomstige derde aanroeper — of een regressie in de
  hub-allowlist — zou de data anders onder de verkeerde "wie moet ik betalen"-lens renderen. Dit
  schendt CLAUDE.md regel 1 (server-side is de waarheid; geen client-/aanroeper-afhankelijke gating van
  kritieke status) en de eigen "route + page + action"-defense-in-depth-filosofie van het project.
  Repro: render `<VerplichtingenPanel actor={freelancerActor} />` rechtstreeks → vóór de fix haalt het
  `getObligationItemsForClient` op i.p.v. niets te tonen. Gefixt: `if (actor.role !== "CLIENT") return
  null;` vóór élke data-toegang. Test: `verplichtingen-panel.test.tsx` (FREELANCER/ADMIN → `null` én
  géén data-load; CLIENT → rendert; vooraf-geladen items → geen extra query — rood→groen bewezen:
  2 cases falen zonder de gate).

### GEPARKEERD in deze ronde

- **[LAAG · AVG art. 5/30 + CLAUDE.md regel 5 — eigen-data CSV-exports zonder audit-entry]** De vier
  self-scoped CSV-export-routes (`verplichtingen/export`, `prognose/export`, `prestaties/export`,
  `diensten/export`) doen auth→rol→rate-limit→eigen-data-query→CSV maar loggen geen `audit()`. Een
  bulk-export van eigen financiële/crediteuren-data (namen tegenpartij, bedragen, vervaldata) valt
  onder dezelfde traceerbaarheids-intentie als "documenttoegang" (regel 5) + AVG art. 30. Géén
  cross-party-data, geen security-gat; bestaande platform-brede conventie (niet nieuw geïntroduceerd).
  Aanbevolen: lichte `EXPORT_DOWNLOADED`-audit-entry op deze routes (wie exporteerde wat, wanneer)
  voor DPO-/admin-onderzoek. Bewust geparkeerd: audit op élk zelf-export kan ruis geven — eerst
  DPO-afweging of dit gewenst/consistent-over-álle-exports moet.
- **[LAAG · OWASP A01 — `pushSubscription.upsert` keyt alleen op `endpoint` (niet ook `userId`)]**
  `api/push/subscribe/route.ts` upsert op `endpoint` alleen; wie een slachtoffer-endpoint (een
  cryptografisch willekeurige, per-browser, niet-raadbare bearer-URL) al bezit, kan de rij naar zich
  toe herbinden en toekomstige push-levering aan dat toestel blokkeren. Vereist voorkennis van het
  geheim → niet-praktisch; code-comment erkent en accepteert dit al. Aanbevolen (alleen bij strenger
  dreigingsmodel): compound-key `[endpoint,userId]` of ownership-check vóór herbinden.
- **[LAAG · CLAUDE.md regel 5 — niet-atomaire audit-writes in enkele franchise-actions]** In o.a.
  `franchise/diensten/actions.ts:setDienstStatus` en `franchise/opdrachtgevers/actions.ts:createOpdracht
gever` staan de Prisma-mutatie en de daaropvolgende `audit()` als twee losse statements i.p.v. één
  `$transaction`; sterft het proces ertussen dan bestaat de mutatie zonder audit-record. Platform-brede
  bestaande conventie (niet franchise-specifiek), waarschijnlijk geaccepteerde trade-off. Aanbevolen:
  state-wijzigende write + `auditData()` in `prisma.$transaction([...])` wikkelen (zoals `setLeadStatus`/
  `addLeadContact` al doen).

## Ronde 2026-07-05 (basis: `main` @ 201b321)

Audit: orchestrator (Opus 4.8) + 3 parallelle Opus security/privacy-subagents op niet-overlappende
oppervlakken — (1) cross-tenant/IDOR over ÁLLE franchise-server-actions + tenant-scoped reads,
(2) AVG art. 17/15/20 erasure-/export-volledigheid van `anonymizeUser` vs. het volledige schema,
(3) CSV-/formule-injectie in exports + authz/cross-party-PII/rate-limit op alle PDF-/dossier-/export-
endpoints. Kader: OWASP Top 10 (A01 broken access control, A04 insecure design, A09 logging) +
AVG art. 5/15/17/30. Zelf geverifieerd: crown-jewel-endpoints (`/api/documents/[id]` ownership+audit+
CSP-sandbox, `/api/media/[...key]` logoKey-scope), cron-auth (timing-safe Bearer), billing-webhook
(Mollie re-fetch-patroon: `id` is niet trust-bearing), CSP (nonce + strict-dynamic, `object-src none`,
`frame-ancestors none`), rate-limiters (login/register/reset/credential-verify/upload/export/pdf/dossier),
ICS-builder (`escapeIcsText` op SUMMARY/DESCRIPTION/LOCATION → geen iCal-injectie), credential-zelf-
verificatie (DUO/BIG: auth→rol→rate-limit→ownership→type-guard). `npm audit`: 0 prod-kwetsbaarheden.
**Cross-tenant/IDOR: geen nieuwe gaten** (tenantId nooit uit client-input; elke duale mutatie scopet
béide resources). **CSV/PDF-authz: geen nieuwe gaten** (`escapeCsvField` neutraliseert `= + @ TAB CR`

- niet-numerieke `-`; elke PDF-route ownership+audit+rate-limit). Eén privacy-bevinding gefixt
  (rood→groen); rest geparkeerd.

### OPGELOST in deze ronde

- **[HOOG→OPGELOST · AVG art. 17 (recht op vergetelheid) — `SupportTicket.subject` overleefde de
  anonimisering onversluierd]** `anonymizeUser` (`admin/gebruikers/actions.ts`) redacteerde wél de
  `SupportMessage.body` van de betrokkene maar niet het **onderwerp** van diens eigen supporttickets.
  `SupportTicket.subject` is niet-nullable vrije tekst die de gebruiker zélf typt bij het openen van
  een ticket (kan naam/adres/telefoon/documentdetail bevatten) en wordt bewijsbaar als persoonsgegeven
  behandeld — het staat in de AVG-inzage-export (`account-export.ts`). Na anonimisering bleef de ticket
  met `userId` bestaan en het onderwerp verbatim leesbaar voor elke admin → de persoon bleef herleidbaar
  uit zijn eigen woorden. `anonymize-erasure.test.ts` had géén assertie op `SupportTicket` (gemist, niet
  bewust uitgesloten — anders dan `NoShowReport`, dat een expliciete "bewust niet hier"-comment draagt).
  Repro: open een ticket met een naam/adres in het onderwerp → vraag verwijdering aan → `anonymizeUser`
  → het onderwerp staat er nog. Gefixt: `supportTicket.updateMany({ where: { userId }, data: { subject:
"[Verwijderd op verzoek van de gebruiker]" } })` in de anonimiseringstransactie (spiegelbeeld van de
  `SupportMessage.body`-redactie; veld niet-nullable → neutrale redactiestring). Geschonden: CLAUDE.md-
  verificatieflow/AVG art. 17. Test: nieuwe case in `anonymize-erasure.test.ts` (onderwerp gemaskeerd,
  gescopet op de eigen `userId` — rood→groen bewezen: faalt zonder de transactieregel).

### GEPARKEERD in deze ronde

- **[MIDDEL (escalatie MENSENWERK) · AVG art. 17 vs. bewaargrond — `NoShowReport.reason` over de
  geanonimiseerde ZZP'er]** Vrije tekst die de tégenpartij (`reportedById`) over de no-show van de
  ZZP'er schreef; de betrokkene blijft daaruit herleidbaar ná anonimisering van het eigen account.
  Bewust niet in `anonymizeUser` (comment `actions.ts` markeert de arbeidsgeschil-bewaargrond). Dit is
  een echte erasure-vs-rechtsgrond-afweging (bewaartermijn + of het ZZP'er-identificerende deel wordt
  geredigeerd terwijl het operationele feit blijft) → menselijke juridische beslissing (MENSENWERK §5),
  geen agent-fix. Aanbevolen: DPO bepaalt bewaartermijn/redactiestrategie; daarna alsnog scopen.
- **[LAAG · AVG art. 15/20 — inzage-export mist enkele eigen vrije-tekstvelden]** `buildAccountExport`
  bevat `AvailabilityWindow.note`, `ShiftHandoff.reason/decisionNote` en `LeadContact.body` niet, terwijl
  dat eigen vrije tekst van de betrokkene is die bij erasure wél wordt geredigeerd. Voor volledige art.
  15/20-pariteit toevoegen aan de export (strikte `select`, alleen de eigen rijen). Geen securityrisico.
- **[LAAG · OWASP A09/consistentie — `/api/agenda` (.ics-rooster-export) zonder rate-limit + audit]**
  De route is self-scoped (`OR: [{company.userId},{freelancer.userId}]`) en auth-gated, maar mist —
  anders dan de zusterexports (`account/export`, PDF-routes) — een `exportRateLimiter`-check en een
  audit-entry. Laag risico (alleen het eigen actieve rooster, geen extra cross-party-PII), maar voor
  consistentie met "audit alles wat telt" + defense-in-depth tegen een scripted DB-loop: voeg
  `enforceRateLimit(exportRateLimiter, ...)` + een `AGENDA_EXPORTED`-audit toe. Aanbevolen fix in
  `src/app/api/agenda/route.ts`.

## Ronde 2026-07-04b (basis: `main` @ f04d7b3)

Audit: orchestrator (Opus 4.8) + 1 parallelle Opus security-subagent op de delta sinds de vorige ronde
(`b86c33b..f04d7b3`, #599–#606). Kader: OWASP Top 10 (A01 broken access control, A09 logging) + AVG
art. 5 lid 1f. **Authz/IDOR/cross-tenant: geen nieuwe gaten** — de nieuwe bemiddelaar-voordracht
(`franchise/diensten/actions.ts` → `dienst-voordracht.ts`) is end-to-end gepoort: `requireRole(
"FRANCHISER")` → Zod → tenant-scope op **zowel** de dienst (`job.tenantId !== tenantId → "niet
gevonden"`) **als** de ZZP'er (`freelancerProfile.findFirst({ where: { id, tenantId } })`) →
engageability server-herberekend → audit → notificatie; het lees-pad `getRosterCandidatesForDienst`
her-checkt de tenant onafhankelijk. Health-probe + `global-error` lekken niets naar
niet-geauthenticeerde callers (payload hard begrensd tot `status/db/commit/time`; alleen `error.digest`
naar de UI). De nieuwe `/ontwerp`-conceptbestanden bevatten geen injectiesink (0 treffers op
`dangerouslySetInnerHTML|prisma\.|fetch\(|process\.env`), maar de route is bewust inlogvrij —
**staande waarschuwing:** nooit echte gebruikers-/documentdata in die conceptcomponenten bedraden.
Eén privacy-bevinding gefixt (rood→groen).

### OPGELOST in deze ronde

- **[MIDDEL→OPGELOST · AVG art. 5 lid 1f / OWASP A09 — rauwe PII (e-mailadres + foutobject) naar de
  hostlog in het admin-bulk-importpad]** `admin/import/actions.ts` logde bij een mislukte welkomstmail
  **`console.error("Import: welkomstmail mislukt voor", row.email, mailErr)`** — het e-mailadres stond
  als los argument (niet eens verstopt in een foutobject) plus de rauwe mailfout (die bij nodemailer/
  Resend zélf óók het adres draagt) — én bij een mislukte aanmaak `console.error(..., e)` waar een
  Prisma-unique-constraintfout het adres kan echoën. Buiten de redactie-pijplijn → onversluierd in de
  Railway-hostlogs. Dit is exact het antipatroon dat #599 (`logMailFailure`) elders dichtte, maar déze
  drie call-sites (plus vier zuster-`storage.delete(...)`-`catch`-sites in `bedrijf`/`documenten`/
  `certificaten`/`admin/gebruikers` en `reviews-reveal-task.ts`) bleven over. Extra risico: het import-
  pad verwerkt in één keer de MEESTE PII (bulk-adressen van geïmporteerde accounts). Gefixt: import-
  call-sites via `logger.error(..., { email: row.email, error: describeError(e) })` (de logger maskeert
  e-mailadressen in élke stringwaarde → `j***@firma.nl`, `describeError` reduceert tot naam/message/
  stack zodat provider-velden zoals `.rejected` niet meegaan); nieuwe gedeelde helper
  `logStorageCleanupFailure(source, storageKey, error)` (`src/lib/observability/storage-failure.ts`,
  spiegelt `logMailFailure`) op de vier storage-`catch`-sites; `reviews-reveal-task` idem. Geschonden:
  CLAUDE.md regel 5 (geen PII in log) + OWASP A09. Test: `src/lib/observability/storage-failure.test.ts`
  (adres in de storage-fout-message gemaskeerd; provider-veld `requesterEmail`/`bucketPolicy` lekt niet
  mee; niet-Error-input gooit nooit door — rood→groen).

## Ronde 2026-07-04 (basis: `main` @ b86c33b)

Audit: orchestrator (Opus 4.8) + 3 parallelle Opus security/privacy-subagents op niet-overlappende
oppervlakken — (1) object-/functieniveau-autorisatie/IDOR/cross-tenant over ÁLLE server actions +
API-routes (focus op de delta #588–#598), (2) injectie/upload/secrets/auth-sessie/headers/SSRF/CSRF,
(3) AVG-recht-op-verwijdering + inzage-export + verwerkingsregister + k-anonimiteit + PII-in-logs.
Kader: OWASP Top 10 (A01 broken access control, A04 insecure design, A05 misconfig, A09 logging) +
AVG art. 5/15/17/30/44/46. **Authz/IDOR/cross-tenant: geen nieuwe gaten** (elke recente feature —
beschikbaarheid-signalen, semantische-matching-scorecomponent, skills-picker, reactiebereidheid-
context — is puur/deterministisch of gescopet op de eigen data van de actor; `assertSameTenant`/
`tenantScopeWhere` overal aanwezig). **Injectie/upload/secrets/auth/headers/SSRF: geen nieuwe gaten**
(de nieuwe Resend HTTP-adapter praat met een hardcoded host, logt geen adres/subject, is inert zonder
`RESEND_API_KEY`; CSP-nonce, storage-traversalguard en env-gating ongewijzigd). `npm audit`: 0 prod-
kwetsbaarheden (2 dev-only low/moderate). Eén security- + één privacy-bevinding gefixt (rood→groen);
de rest geparkeerd.

### OPGELOST in deze ronde

- **[MIDDEL→OPGELOST · A09 / AVG art. 5 lid 1f — ontvangeradres (PII) lekt naar hosting-logs bij
  mislukte mailverzending]** Vijf geplande taken (`notification-digest-task`, `payment-reminders-task`,
  `vat-reminder-task`, `dba-monitor-task`, `concept-invoice-reminders-task`) plus de al eerder
  geparkeerde call-sites (`wachtwoord-vergeten/actions.ts:72,83`, `api/tasks/run-all/route.ts:70`)
  logden een mislukte `mail.send(...)` via **rauwe `console.error("… mislukt:", err)`** — buiten de
  redactie-pijplijn en buiten de auditdatabase. Een SMTP-weigering (nodemailer) draagt het adres in
  `.message`/`.response`/`.rejected`; sinds de Resend HTTP-driver (#589) draagt ook de HTTP-foutbody bij
  een validatiefout het adres. In productie belanden die objecten onversluierd in de Railway-hostlogs
  (AVG-lek). Repro: draai een reminder-taak met een mailkanaal dat een adres weigert → het volledige
  foutobject met `jan@firma.nl` staat in de hostlog. Gefixt: nieuwe `logMailFailure(source, error)`
  (`src/lib/observability/mail-failure.ts`) stuurt de fout via de bestaande `logger` (maskeert e-mail →
  `j***@firma.nl`) + `describeError` (reduceert tot naam/message/stack, provider-velden zoals `.rejected`
  gaan sowieso niet mee). Alle 8 call-sites omgezet; `run-all`/token-fout via `logger.error(…, { error:
describeError(err) })`. Geschonden: CLAUDE.md regel 5 (audit/geen PII in log) + OWASP A09. Test:
  `src/lib/observability/mail-failure.test.ts` (SMTP- én Resend-foutvorm → adres gemaskeerd, joint álle
  console-argumenten zodat een terugval op `console.error(source, err)` óók faalt; rood→groen).

- **[MIDDEL→OPGELOST (register/MENSENWERK; go-live = mensenwerk) · AVG art. 44/46 — Resend-doorgifte
  naar derde land niet transparant in het register]** Sinds `EMAIL_DRIVER=resend` (#589) gaan
  ontvangeradres/naam/notificatie-inhoud naar Resend (US-verwerker, mogelijk buiten de EER), maar de
  `notificaties-email`-entry in `processing-register.ts` noemde slechts een generieke "E-maildienst-
  verlener" zonder de doorgifte/SCC-waarborg — anders dan de Geoapify-precedent. Gefixt (transparantie):
  register-entry noemt nu expliciet de mogelijke EER-doorgifte + vereiste modelcontractbepalingen
  (SCC's)/EU-regio; MENSENWERK.md §5a kreeg een harde DPO-poort ("houd `EMAIL_DRIVER` op `noop`/`smtp`
  tot SCC's/EU-regio bevestigd"). De **feitelijke** go-live-beslissing (DPA met SCC's tekenen) blijft
  MENSENWERK — de code is inert zonder `RESEND_API_KEY`. Geschonden: AVG art. 44/46 (transparantie/
  waarborg doorgifte).

## Ronde 2026-07-03b (basis: `main` @ cabe0f0)

Audit: orchestrator (Opus 4.8) + 2 parallelle Opus security/privacy-subagents op niet-overlappende
oppervlakken — (1) IDOR/authz/cross-tenant over de nieuwste server actions (reacties/kandidaten/
samenwerkingen-cascade/franchise + de #582 `Mijn vakgebied`-filter), (2) AVG-/privacy-dekking over
ALLE `src/app/api/**`-routes, het verwerkingsregister vs. het volledige schema, k-anonimiteit en
PII-in-logs. Kader: OWASP Top 10 (A01 broken access control, A04 insecure design, A09 logging) +
AVG art. 5/15/17/30. **IDOR/cross-tenant: geen nieuwe gaten** — elke cascade-actie herleidt owner/
tenant uit een verse DB-rij op de primaire id (`collaborationId` dient alleen `revalidatePath`),
`assertSameTenant`/`tenantScopeWhere` overal aanwezig, het #582-filter is puur additief op de eigen
profielbranches achter `visibleJobsWhere`. Twee bevindingen volledig gefixt (rood→groen); de rest
geparkeerd.

### OPGELOST in deze ronde

- **[LAAG→OPGELOST · AVG art. 17 + 15/20 — FavoriteFreelancer.note]** De privé favorieten-notitie die
  een CLIENT over een ZZP'er schrijft (vrije tekst, subjectief oordeel dat de betrokkene als auteur
  identificeert) ontbrak in **zowel** `anonymizeUser` (`admin/gebruikers/actions.ts`) als de inzage-
  export (`account-export.ts`) — bevestigd al langer open (zie GEPARKEERD-items 2026-06-25b/07-03).
  `Company` wordt bij anonimisering geüpdatet (niet verwijderd), dus de `onDelete:Cascade` op
  `FavoriteFreelancer` vuurt niet → de notitie bleef verbatim en attribueerbaar staan. Gefixt:
  `favoriteFreelancer.updateMany({ where: { company: { userId } }, data: { note: null } })` in de
  anonimiseringstransactie (gescopet op de eigen bedrijven — nooit andermans notitie) + een strikt-
  `select`-query in `buildAccountExport` (`where: { company: { userId }, note: { not: null } }`, alleen
  `note`/`createdAt`, geen `freelancerProfileId` → geen identiteit van de gemarkeerde ZZP'er). Geschonden:
  CLAUDE.md-verificatieflow/AVG art. 17 + 15/20. Tests: nieuwe case in `anonymize-erasure.test.ts` +
  `account-export.test.ts` (rood→groen).

- **[MIDDEL→OPGELOST · A04 / AVG art. 5 — geen rate-limit op de modelovereenkomst-PDF]**
  `GET /api/samenwerkingen/[id]/modelovereenkomst` genereert on-demand een juridisch DBA-document met
  cross-party PII (namen, KvK-nabije jobomschrijving, DBA-indicatoren, bedrijfsnaam) — exact dezelfde
  vorm als `facturen|prestaties/[id]/pdf`, `admin/facturatie/[id]/pdf` en de `dossier|dba-dossier`-routes,
  die állen `documentPdfRateLimiter` kregen in PR #586. Déze route werd bij #586 gemist: geen enkele rem
  → een partij kan een scripted loop draaien (onbegrensde PDF-generatie + cross-party PII-join, nooit 429).
  Ownership/authz + audit waren intact — availability/defense-in-depth. Gefixt: `enforceRateLimit(
documentPdfRateLimiter, actor.id)` ná `requireActor()`, vóór de DB-query — identiek aan de zusterroutes
  (60/uur, `DOCUMENT_PDF_RATE_LIMIT`). Geschonden: OWASP A04. Test:
  `modelovereenkomst-ratelimit.test.ts` (429→geen PDF/geen audit; toestemming→200+audit; sleutel=actor.id;
  rood→groen).

### GEPARKEERD — privacy / AVG (ronde 2026-07-03b)

- **[MIDDEL · AVG art. 30 — support/helpdesk-PII ontbreekt in het verwerkingsregister]**
  `SupportTicket` (`schema.prisma`, `subject`/`category`/`priority`) en `SupportMessage` (`body`, vrije
  tekst door de gebruiker) houden PII vast met **geen** `ProcessingActivity` in `PROCESSING_REGISTER` en
  **geen** `RetentionRule` in `RETENTION_SCHEDULE` (grep: nul treffers op "support"/"ticket" in
  `processing-register.ts`). Supporttickets bevatten vaak gevoelige context (bv. een ZZP'er die een
  afgewezen VOG/diploma-verificatie betwist, of een betaalgeschil). Fix: register-entry `support-helpdesk`
  (grondslag OVEREENKOMST/GERECHTVAARDIGD_BELANG, betrokkenen ZZP'ers/opdrachtgevers, categorieën
  onderwerp/body/categorie/prioriteit, ontvangers "intern platformbeheer") + bewaartermijn (bv. opgelost +
  N maanden). **MENSENWERK**: bewaartermijn met de eigenaar bevestigen.
- **[LAAG→OPGELOST (ronde 2026-07-04b) · AVG art. 5 lid 1f — storageKey + rauwe fout naar console]**
  `bedrijf/actions.ts`, plus de zuster-call-sites `documenten`/`certificaten`/`admin/gebruikers`, logden
  bij een mislukte `storage.delete(...)` de `storageKey` + het rauwe `err`-object via `console.error`,
  buiten de redactie-pijplijn. Gefixt in ronde 2026-07-04b: alle vier via de nieuwe gedeelde helper
  `logStorageCleanupFailure(source, storageKey, error)` (`src/lib/observability/storage-failure.ts`) —
  `describeError` reduceert de fout tot naam/message/stack en de logger maskeert e-mailadressen. Zie het
  OPGELOST-item bovenaan ronde 2026-07-04b.
- **[LAAG→OPGELOST (ronde 2026-07-04, #599) · AVG art. 5 lid 1f — rauwe foutobjecten naar console]**
  `api/tasks/run-all/route.ts:70` en `wachtwoord-vergeten/actions.ts:72,83` logden een rauwe taak-/
  mailfout via `console.error`. Beide omgezet naar `logger.error(…, { error: describeError(err) })` /
  `logMailFailure` in ronde 2026-07-04 (#599, mail-fout-PII-sweep). Zie dat OPGELOST-item.

## Ronde 2026-07-03 (basis: `main` @ 90a5374)

Audit: orchestrator (Opus 4.8) + 3 parallelle Opus security/privacy-subagents op niet-overlappende
oppervlakken — (1) recente non-admin/franchise server actions (berichten/opdrachten/samenwerkingen/
kandidaten/leads + kandidaten-triage), (2) ALLE API route-handlers + upload/storage + SSRF + headers,
(3) AVG recht-op-verwijdering (`anonymizeUser`) + inzage-export vs. het volledige Prisma-schema.
Kader: OWASP Top 10 (A01 broken access control, A04 insecure design, A05 misconfig, A09 logging) +
AVG art. 5/15/17/30. De nieuwste feature — de tweezijdige double-blind beoordelingen (#579-reeks,
`reviews.ts`/`review-actions.ts`/`reviews-reveal-task.ts`) — is expliciet geverifieerd schoon: de
PENDING_REVEAL-status lekt nergens vóór de simultane onthulling (publieke profielen filteren op
`status: "PUBLISHED"`; de samenwerking-detailpagina toont een deelnemer alleen zijn eigen review +
de PUBLISHED-review van de tegenpartij; de volledige `col.reviews`-array wordt uitsluitend in de
admin-moderatietak gerenderd). Server actions & API-routes: **geen** KRITIEK/HOOG IDOR, cross-tenant-
lek, SSRF, path-traversal of ontbrekende ownership gevonden (elke mutatie herleidt ownership/tenant
uit een verse DB-rij; storage weigert traversal; de enige externe `fetch` — Geoapify — heeft een
hardcoded host). Drie AVG-art.-17-bevindingen (recht op verwijdering onvolledig) volledig gefixt
(rood→groen); de rest geparkeerd.

### OPGELOST in deze ronde

- **[HOOG · AVG art. 17 — recht op verwijdering onvolledig: Application.note]** `anonymizeUser()`
  (`admin/gebruikers/actions.ts`) redacteerde `Application.motivation` (freelancer-scoped), maar niet
  `Application.note` — de interne kandidaatnotitie die de betrokkene als CLIENT zélf schreef bij
  reacties op de eigen opdrachten (vrije tekst, mogelijk persoonlijke opmerkingen over een ZZP'er).
  Een `user.update` triggert geen cascade → bleef verbatim en herleidbaar staan. Repro: CLIENT
  schrijft een notitie bij een sollicitant → CLIENT wordt geanonimiseerd → `Application.note` blijft.
  Gefixt: `application.updateMany({ where: { job: { company: { userId } } }, data: { note: null } })`
  in de anonimiseringstransactie (gescopet op de eigen bedrijfsopdrachten — nooit andermans tekst).
  Geschonden: CLAUDE.md-verificatieflow/AVG art. 17. Test: nieuwe case in `anonymize-erasure.test.ts`.

- **[HOOG · AVG art. 17 — recht op verwijdering onvolledig: ShiftHandoff.decisionNote]** Dezelfde
  anonimisering wiste `ShiftHandoff.reason` (aanvragerskant, `requestedByUserId`), maar niet
  `decisionNote` — de verplichte afwijsreden die de betrokkene als FRANCHISER/beslisser zelf schreef
  (`decidedByUserId`), vrije tekst die de aanvrager/kandidaat kan benoemen. Gefixt:
  `shiftHandoff.updateMany({ where: { decidedByUserId: userId }, data: { decisionNote: null } })` —
  het spiegelbeeld van de bestaande reason-redactie. Test: nieuwe case (rood→groen).

- **[HOOG · AVG art. 17 — recht op verwijdering onvolledig: LeadContact.body]** `anonymizeUser`
  raakte `Lead`/`LeadContact` niet aan; de bel-/gespreksnotities die de betrokkene als FRANCHISER
  zelf schreef (`LeadContact.body`, `createdById`) bleven volledig intact en attribueerbaar. Gefixt:
  `leadContact.updateMany({ where: { createdById: userId }, data: { body: "[Verwijderd…]" } })` (veld
  is niet-nullable → neutrale redactiestring). De derde-partij-lead-PII (contactName/email/phone/
  notes) valt onder het aparte verwerkingsregister-/bewaartermijn-item, niet onder déze erasure. Test:
  nieuwe case (rood→groen).

### GEPARKEERD — privacy / AVG (ronde 2026-07-03)

- **[MIDDEL · AVG art. 17 — NoShowReport.reason bij de melder]** `NoShowReport.reason` (vrije tekst,
  `reportedById` = CLIENT of FRANCHISER — beide anonimiseerbaar) wordt bij anonimisering van de melder
  niet gewist. NB: `anonymizeUser` sluit `NoShowReport.reason` bewust uit wanneer de ZZP'er (het
  subject) wordt geanonimiseerd (mogelijke bewaargrond bij arbeidsgeschil). Voor de melderskant is
  dat een aparte DPO-afweging (eigen vrije tekst vs. bewijsbewaring). Fix na DPO-akkoord:
  `noShowReport.updateMany({ where: { reportedById: userId }, data: { reason: "[Verwijderd…]" } })`.
- **[MIDDEL · AVG art. 17 — Performance/Invoice.rejectionReason]** De afwijsreden die een partij
  (meestal CLIENT) bij een prestatie/factuur schreef blijft na anonimisering staan. Deze rijen hebben
  een eigen fiscale bewaargrond (factuur = 7 jr); alleen de _reden-tekst_ zou geredact moeten worden,
  bedragen/nummers/data behouden — spiegelt `Collaboration.cancellationReason`. Er is geen
  `rejectedById`-kolom; scope via de `actorId` op het domein-/auditevent van de afwijzing (zoals
  `disputeReason` via `DISPUTE_OPENED`). DPO-afweging. Fix in een aparte increment.
- **[OPGELOST 2026-07-08 · AVG art. 15/20 — inzage-export onvolledig (uitbreiding)]** `buildAccountExport`
  (`account-export.ts`) miste naast de eerder geparkeerde categorieën (ontvangen `Review`, eigen
  `ShiftHandoff.reason`, `AvailabilityWindow.note`, open `Collaboration.disputeReason`) ook: eigen
  `Application.note` (CLIENT), `NoShowReport` (melder), `ShiftHandoff.decisionNote` (beslisser),
  `LeadContact.body` (franchiser). **Gefixt:** 8 nieuwe strikt-`select`-secties toegevoegd, elk gescopet
  op de eigen actor en zonder derde-partij-PII — `receivedReviews` (`subjectId==actor`, **alleen
  PUBLISHED** zodat de double-blind reveal niet vóór onthulling wordt gebroken; geen authorId),
  `clientApplicationNotes` (`job.company.userId==actor`, alleen `note`), `shiftHandoffRequests`
  (`requestedByUserId`, alleen `reason`), `shiftHandoffDecisions` (`decidedByUserId`, alleen
  `decisionNote`), `availabilityNotes` (eigen profiel), `noShowReports` (`reportedById`, geen
  `verdictNote`/ZZP-identiteit), `leadContacts` (`createdById`, alleen eigen `body`) en
  `openDisputeReasons` (gescopet op de eigen `DISPUTE_OPENED`-events, net als `anonymizeUser`). De
  derde-partij-lead-PII (contactName/email/phone) blijft onder het aparte verwerkingsregister-item. 8
  nieuwe tests (rood→groen). Geen schemawijziging.
- **[OPGELOST 2026-07-03b · AVG art. 15/20 + 17]** `FavoriteFreelancer.note` (privé CLIENT-notitie)
  ontbrak in zowel `anonymizeUser` als de export. Gefixt (zie ronde 2026-07-03b): `updateMany({ note:
null })` in de anonimiseringstransactie + strikt-`select`-export-query.

### GEPARKEERD — security / hardening (ronde 2026-07-03)

- **[OPGELOST 2026-07-03 · MIDDEL · A04 — geen rate-limit op financiële/PDF-exports]** `exportRateLimiter`
  was alléén op `/api/account/export` bedraad; de CSV-/PDF-/dossier-routes deden DB-joins + on-demand
  generatie zónder per-gebruiker-rem (`admin/export/invoices` dumpt ÁLLE platformfacturen met
  tegenpartij-PII per call — grootste amplificatie). Ownership/authz was intact — availability/
  defense-in-depth. Gefixt via een gedeelde `enforceRateLimit`-guard (`lib/rate-limit-guard.ts`,
  429 + `Retry-After`): de bulk CSV/JSON-exports (`admin/export/invoices`, `administratie/{export,btw,
openstaand}`, `diensten|prestaties|prognose|verplichtingen/export`, `admin/{audit,avg}/export`) op
  `exportRateLimiter` (5/uur, per-route-key tegen kruis-starvatie), en de per-document PDF/dossier-routes
  (`facturen/[id]/pdf`, `prestaties/[id]/pdf`, `admin/facturatie/[id]/pdf`,
  `samenwerkingen/[id]/{dossier,dba-dossier}`) op een nieuwe `documentPdfRateLimiter` (60/uur, env
  `DOCUMENT_PDF_RATE_LIMIT`). Check zit ná auth, vóór DB/generatie; `account/export` hergebruikt nu
  dezelfde helper. Tests: `rate-limit-guard.test.ts` + `admin/export/invoices/route.test.ts`. PR #586.
- **[OPGELOST 2026-07-17 · LAAG · CLAUDE.md regel 6 — Zod-grens]** `saveApplicationNote`
  (`kandidaten/actions.ts`) begrensde `note` met een handmatige `.slice(0, 2000)`. Nu via de gedeelde
  `boundReason` (`src/lib/text-bounds.ts`) — consistent met de A04-hardening (PR #803).

## Ronde 2026-06-25b (basis: `main` @ d1116a1)

Audit: orchestrator (Opus 4.8) + 4 parallelle Opus security/privacy-subagents op niet-overlappende
oppervlakken — (1) API route-handlers, (2) franchise-/admin-tenant-isolatie, (3) non-admin server
actions, (4) AVG/anonimisering + dataminimalisatie. Kader: OWASP Top 10 (A01 broken access control,
A04 insecure design, A05 misconfig, A07 auth, A09 logging) + AVG art. 5/15/17/30. Focus op de nieuwste
features (#540 presigned S3-URLs, #541 reactie-pijplijn, #543 kandidaten-vergelijking, #545
wachttijd-signaal, #546 publieke betaal-webhook). Drie bevindingen volledig gefixt (rood→groen); de
rest geverifieerd en hieronder geparkeerd.

**Expliciet geverifieerd schoon:** tenant-isolatie over ALLE franchise-/admin-actions en -pagina's
(elke mutatie volgt auth→rol→`assertSameTenant`/`tenantScopeWhere`→Zod→actie→audit; geen cross-tenant
lees-/schrijfpad voor een FRANCHISER; geen privilege-escalatie FRANCHISER→ADMIN). De presigned
S3-download-URL (#540) wordt alléén voor logo's gebruikt (niet-gevoelig, `requireActor`+bekende
`logoKey` vóór de redirect) — geen gevoelig document gaat via presigning langs de audit. De nieuwe
pijplijn-/vergelijk-/wachttijd-modules zijn puur en deterministisch; de `/kandidaten/vergelijk`-pagina
heeft een harde ownership-poort (`company: { userId: actor.id }`). De publieke betaal-webhook (#546)
vertrouwt de body nooit en herhaalt de status autoritatief bij de provider.

### OPGELOST in deze ronde

- **[MIDDEL · A09 / AVG art. 30 — auditplicht geweigerde inzage]** `GET /api/samenwerkingen/[id]/dossier`
  en `/dba-dossier` serveren een cross-party compliance-/DBA-dossier (PII: namen, KvK/BTW,
  certificaatstatus) en logden wél de geslaagde export, maar NIET de geweigerde inzage — anders dan
  `/api/documents/[id]` (`DOCUMENT_ACCESS_DENIED`). Daardoor was IDOR-enumeratie op collaboration-id's
  onzichtbaar in het auditspoor. Repro: niet-partij doet `GET …/dossier` met een gegokt id → 403,
  geen auditregel. Gefixt: `DOSSIER_ACCESS_DENIED` / `DBA_DOSSIER_ACCESS_DENIED`-audit (met IP/UA via
  `requestMeta`) op het 403-pad + IP/UA op de bestaande export-audits; NL-labels in `audit-labels.ts`.
  Geschonden: CLAUDE.md regel 5. Test: `src/app/api/dossier-routes-audit.test.ts` (4 cases,
  geautoriseerd→export-audit; niet-partij→403 + denied-audit, geen serve; rood→groen).

- **[HOOG · AVG art. 17 — recht op verwijdering onvolledig: AvailabilityWindow.note]** `anonymizeUser()`
  (`admin/gebruikers/actions.ts`) updatet `FreelancerProfile` (niet verwijderen), dus de `onDelete:
Cascade` op de kindtabel `AvailabilityWindow` vuurt niet → de vrije-tekst `note` (kan reden/medische
  details bevatten, bv. "ziek") bleef na anonimisering herleidbaar staan. Gefixt:
  `availabilityWindow.updateMany({ where: { freelancerProfile: { userId } }, data: { note: null } })`
  in de anonimiseringstransactie. Test: nieuwe case in `anonymize-erasure.test.ts` (rood→groen).

- **[HOOG · AVG art. 17 — recht op verwijdering onvolledig: Collaboration.disputeReason]** Dezelfde
  anonimisering wiste `cancellationReason` (gescopet op `cancelledById`), maar niet `disputeReason` —
  de vrije tekst die de betrokkene schreef bij het openen van een dispuut. `resolveDispute` wist 'm
  normaliter, maar bij anonimisering vóór oplossing van een open dispuut bleef hij staan. De attributie
  zit niet op de rij maar in het `DISPUTE_OPENED`-domeinevent (`actorId`); de fix verzamelt de eigen
  DISPUTE_OPENED-events en wist `disputeReason` alléén op díe samenwerkingen (nooit de reden van de
  tegenpartij). Test: nieuwe case in `anonymize-erasure.test.ts` (rood→groen). De append-only
  `DomainEvent.payload` met dezelfde tekst blijft apart geparkeerd (mens/DPO-keuze, zie 2026-06-24b).

### GEPARKEERD — privacy / AVG (ronde 2026-06-25b)

- **[MIDDEL · AVG art. 15/20 — inzage/portabiliteit onvolledig]** `buildAccountExport`
  (`src/lib/account-export.ts`) mist nog vier eigen-data-categorieën: ontvangen `Review` (waar
  `subjectId == actor`, beoordelingen ÓVER de betrokkene; alleen PUBLISHED, zonder `authorId`), eigen
  `ShiftHandoff.reason` (`requestedByUserId == actor`), `AvailabilityWindow.note` (eigen) en — bij open
  dispuut — `Collaboration.disputeReason` (waar de actor het dispuut opende). Fix: vier extra `select`-
  gescopete queries (geen derde-partij-PII).
- **[OPGELOST 2026-07-03b · AVG art. 15/20 + art. 17]** `FavoriteFreelancer.note` (privé CLIENT-notitie
  over een ZZP'er) ontbrak in zowel de export als de anonimisering. Gefixt in ronde 2026-07-03b.
- **[MIDDEL · AVG art. 5 lid 1c — dataminimalisatie]** `ProfileScreen` (`profile-screen.tsx`) selecteert
  `AvailabilityWindow.note` maar rendert die niet; onnodige verwerking van vrije-tekst-PII op het
  public-facing pad `/zzp/[id]` (server component, gaat niet naar de browser). Fix: `note` uit de select
  halen.

### GEPARKEERD — security / hardening (ronde 2026-06-25b)

- **[OPGELOST 2026-07-17 · MIDDEL · A04 — onbegrensde vrije-tekst-invoer buiten Zod (terugkerend thema)]**
  Diverse mutatie-grenzen lazen vrije tekst via `String(formData.get(...))` zonder lengtebegrenzing:
  `rejectCredential.reason` (`admin/verificaties/actions.ts`), `rejectPerformance`/`rejectInvoice`/
  `creditInvoice`/`openDispute` `.reason` + `parsePerformanceInput` `description`/`milestoneTitle`
  (`samenwerkingen/[id]/actions.ts`), en de LAAG-geparkeerde `saveApplicationNote.note` (handmatige
  `.slice(0,2000)`). Niet injecteerbaar (Prisma parametriseert, JSX escapet), maar onbegrensde payload
  belandde in PII-tabellen, notificaties én audit-metadata (bloat, defense-in-depth). Gefixt via de gedeelde
  pure `boundText`/`boundReason` (`src/lib/text-bounds.ts`, trim + kap; leeg blijft leeg → verplicht-checks
  intact): (1) boundary-normalisatie in de server-actions, (2) defense-in-depth in de pure cascade-handlers
  (`planPerformanceRejected`/`planInvoiceRejectedEvent`/`planInvoiceCreditedEvent`) plus `openDispute` en het
  best-effort e-mail-pad in de reject/credit-commands. `saveApplicationNote` gebruikt nu ook `boundReason`
  (sluit de eerder geparkeerde LAAG-`saveApplicationNote`-consistentie). Tests: `text-bounds.test.ts` (11) +
  3 rood→groen handler-cases. PR #803.
- **[MIDDEL · A01 / A05 / AVG art. 5 lid 1c — over-fetch via `include` zonder top-level `select`]**
  `administratie/openstaand/route.ts`, `admin/export/invoices/route.ts` en
  `samenwerkingen/[id]/dossier/route.ts` doen `findMany/findUnique` met `include` zonder top-level
  `select` → alle scalar-kolommen (o.a. `cancellationReason`, `disputeReason`, `cancelledById`) komen in
  het geheugen, ook al projecteert de mapping ze weg. Niet in de respons gelekt, maar regressierisico.
  Fix: top-level `select` met alleen de gebruikte velden.
- **[MIDDEL · A04 — geen rate-limit op financiële exports]** `administratie/openstaand|export|btw`-routes
  hebben geen per-gebruiker rate-limit (anders dan `/api/account/export` met `exportRateLimiter`). Fix:
  `exportRateLimiter.check(`export:${actor.id}`)` + 429.
- **[MIDDEL · A09 — audit niet-atomair bij statuswijziging]** `replyToTicket` (`support/actions.ts`)
  wijzigt ticketstatus (REOPENED/ESCALATED) in losse `await`s, niet in één `$transaction` met de audit;
  bovendien mist de audit `{ from, to }`. Spiegelt de opgeloste `adminResolve`-fix. Fix: mutatie + audit
  in één transactie, status-delta in metadata.
- **[LAAG · A09 / AVG art. 7 — misleidende audit bij upsert-no-op]** `startFiling`
  (`ontzorgd/aangifte/actions.ts`) doet `upsert` met `update: {}`; bij een bestaand record (ook
  INGEDIEND) verandert niets, maar er wordt tóch een `TAX_FILING_REQUESTED`-audit geschreven (suggereert
  hernieuwde toestemming die niet is gegeven). Fix: alleen auditen bij echte create.
- **[LAAG · A09]** `setBillingStatusAction` (`admin/facturatie/actions.ts:74`) mist `from` in de
  audit-metadata (al genoemd 2026-06-24b; lijn bevestigd).

## Ronde 2026-06-25 (basis: `main` @ d81a0aa)

Audit: orchestrator (statisch lezen + reparatie) + één parallelle security-subagent op de nieuwste
commits (#532 observability, #533 IDOR/AVG-fix, #534/#536/#537 signal-/forecast-features). Kader: OWASP
Top 10 (A01 broken access control, A05 misconfig, A09 logging) + AVG art. 5/15/17/30. Drie bevindingen
volledig gefixt (rood→groen); de rest geverifieerd en hieronder geparkeerd. De nieuwe
signal-/forecast-features (#534/#536/#537) zijn expliciet geverifieerd schoon: alle aggregaten zijn
gescopet op de eigen data van de actor of op `job.tenantId`, geen per-individu PII onder de
k-anonimiteitsdrempel, geen cross-tenant/cross-party-lek.

### OPGELOST in deze ronde

- **[HOOG · AVG art. 15/20 — inzage/portabiliteit onvolledig]** `buildAccountExport`
  (`src/lib/account-export.ts`) miste drie eigen-data-categorieën: eigen `Idea`
  (title/description/declineReason), eigen annuleerredenen (`Collaboration.cancellationReason` waar
  `cancelledById == actor`) en `PushSubscription` (endpoint = persistente toestel-/browser-identifier).
  Repro: `GET /api/account/export` → betrokkene kreeg een onvolledige inzage (art. 15-tekortkoming).
  Gefixt: drie extra `findMany`'s met strikte `select` (annuleerreden gescopet op `cancelledById`, geen
  `companyId/freelancerId`; push zonder cryptografische secrets `p256dh/auth`). Geschonden: CLAUDE.md
  regel 1 (server-side waarheid), AVG art. 15/20. Test: `src/lib/account-export.test.ts` (2 nieuwe
  cases, rood→groen).

- **[MIDDEL · AVG art. 5 lid 1c — dataminimalisatie]** Diezelfde export deed
  `db.company.findUnique({ where })` **zonder `select`** → interne velden (`tenantId`, `logoKey`,
  `userId`) lekten mee in de inzage-JSON. Gefixt: expliciete `select` (alleen
  name/industryId/description/website/location/timestamps). Test: nieuwe case in
  `account-export.test.ts` assert dat `tenantId`/`logoKey` afwezig zijn in de select (rood→groen).

- **[MIDDEL · A09 / AVG art. 30 — auditplicht]** `GET /api/admin/facturatie/[id]/pdf` serveerde een
  platformfactuur-PDF (financiële PII: bedrijfsnaam, bedragen) **zonder auditregel**, anders dan
  `/api/facturen/[id]/pdf` e.a. Geschonden: CLAUDE.md regel 5 ("audit alles wat telt — documenttoegang").
  Gefixt: `PLATFORM_BILLING_PDF_ACCESSED`-audit (met IP/UA via `requestMeta`) ná de admin-rolcheck +
  NL-label in `audit-labels.ts`. Test: `src/app/api/admin/facturatie/[id]/pdf/route.test.ts`
  (geautoriseerd → audit; niet-admin → 403 + geen serve/audit; rood→groen).

- **[HOOG · A05 — security-/availability-misconfig]** `/api/readiness` stond niet in de inlogvrije
  allowlist (`isPublicPath`), terwijl de middleware-matcher het pad wél raakt → een
  Railway/monitoring-readinessprobe werd naar `/login` geredirect (302) i.p.v. 200/503 JSON, en
  rapporteerde permanent falen (kans op onnodige restarts/geblokkeerde deploys). Repro: anonieme
  `GET /api/readiness` → 302 naar `/login`. Gefixt: `isPublicPath` verplaatst naar het pure, geteste
  `src/lib/route-guards.ts` en `/api/readiness` toegevoegd (lekt alleen booleans + 7-tekens commit-SHA,
  net als `/api/health`). Test: `src/lib/route-guards.test.ts` (health+readiness publiek; beschermde
  routes niet; rood→groen).

### GEPARKEERD — security / privacy (ronde 2026-06-25)

- **[MIDDEL · AVG art. 5 lid 1f — PII-lek via Sentry]** `SentryErrorReporter.capture()`
  (`src/lib/observability/report.ts`) geeft het rauwe `Error`-object door aan `sentry.captureException`
  **buiten** de logger-`redact()`/`maskEmails()`-pijplijn. Latent: `@sentry/nextjs` is nog niet
  geïnstalleerd (fallback = `ConsoleErrorReporter` via de gemaskeerde logger), maar het lekt zodra het
  pakket + `SENTRY_DSN` live gaan (bv. een Prisma-/Zod-fout met e-mail in `.message`). Fix: vóór
  `captureException` `describeError()` draaien en alleen `{ name, message: maskEmail(...), stack:
maskEmail(...) }` als `extra` doorgeven. **MENSENWERK: fix vóór Sentry in productie wordt ingeschakeld.**
- **[MIDDEL · AVG art. 5 lid 1f — PII/fout in serverlogs zonder logger]** Vier call-sites loggen via rauwe
  `console.error` i.p.v. de nieuwe gestructureerde logger (geen `redact()`/email-masking):
  `admin/gebruikers/actions.ts:168` (storage-opruimfout, rauw `err`), `documenten/actions.ts:99`,
  `certificaten/actions.ts:73` en — het ergst — `admin/import/actions.ts:298` (logt `row.email`
  rechtstreeks). Fix: vervang door `logger.error(..., { error: describeError(err) })`; voor import het
  e-mailadres weglaten (gebruik `user.id`).
- **[LAAG · logger over-redactie]** `REDACT_KEY_SUBSTRINGS` bevat de brede substring `"auth"`
  (`src/lib/observability/logger.ts:27`) → maskeert ook `authorId`/`author` in debug-logs, wat
  audit-correlatie kan vertroebelen. Geen security-gat (over-redactie). Fix: vervang door specifiekere
  sleutels (`authorization` blijft).

## Ronde 2026-06-24b (basis: `main` @ 5229656)

Audit: 4 parallelle security/privacy-subagents (API route-handlers, franchise-/admin-tenant-isolatie,
non-admin server actions, AVG/anonimisering). OWASP Top 10 (A01 broken access control, A09 logging) +
AVG art. 5/15/17/30 als kader. Twee top-bevindingen volledig gefixt (rood→groen), de rest geverifieerd
en hieronder geparkeerd met repro + severity.

### OPGELOST in deze ronde

- **[HOOG · A01 — IDOR / financiële manipulatie]** `editAndResubmitPerformanceAction`
  (`samenwerkingen/[id]/actions.ts`) kreeg twee onafhankelijke client-id's: `performanceId` (waarop
  ownership werd gecheckt) én `collaborationId` (waaruit `parsePerformanceInput` het uurtarief/ORT
  snapshot). De twee werden NIET aan elkaar gebonden; `updatePerformance` schreef het meegestuurde
  `rateCents` weg zonder te verifiëren dat de samenwerking bij de prestatie hoort. Repro: een ZZP'er
  met twee samenwerkingen (bv. €40 en €80) corrigeert een afgekeurde prestatie op de €40-samenwerking
  met `collaborationId` van de €80-samenwerking → de prestatie krijgt €80/u; na het grace-venster
  auto-goedgekeurd → opgeblazen factuur. Tevens werd andermans tarief leesbaar op de eigen prestatie.
  Geschonden: CLAUDE.md regel 1 (server-side waarheid) & 2 (ownership vóór actie); OWASP A01. Gefixt:
  de actie laadt nu de eigen `collaborationId` + eigenaar van de prestatie, weigert een afwijkend
  `collaborationId` en gebruikt de eigen samenwerking als tarief-bron. Test:
  `src/app/(protected)/samenwerkingen/[id]/edit-resubmit-authz.test.ts` (rood→groen: mismatch →
  geweigerd, geen `updatePerformance`; niet-eigenaar → geweigerd; eigen+match → door).

- **[KRITIEK · AVG art. 17 — recht op verwijdering onvolledig]** `anonymizeUser()`
  (`admin/gebruikers/actions.ts`) redacteerde de eerder gevonden vrije-tekstvelden, maar liet nog
  herleidbare/persoonsgebonden data van de betrokkene achter (een `user.update` triggert geen cascade
  op kindrijen): `IndirectHoursEntry.note` (vrije tekst), eigen `Idea.title/description`,
  `Collaboration.cancellationReason` (waar `cancelledById == userId`) en — het ergst — alle
  `PushSubscription`-rijen (`endpoint` is een persistente toestel-/browser-identifier). Gefixt: vier
  extra mutaties in dezelfde anonimiseringstransactie (note→null, idee-titel/omschrijving geredact,
  eigen annuleerreden→null, push-abonnementen `deleteMany`). Test:
  `anonymize-erasure.test.ts` (4 nieuwe cases, rood→groen).

### GEPARKEERD — privacy/AVG (ronde 2026-06-24b)

- **[HOOG · AVG art. 17 — dispuut-`reason` (vrije tekst) overleeft erasure op DRIE plekken]**
  `DISPUTE_OPENED` bewaart de vrije-tekst `reason` in de append-only event-store
  (`DomainEvent.payload`, `dispute-commands.ts:48`); structureel niet te wissen bij anonimisering.
  **Uitgebreid (2e ronde 2026-07-08, subagent-verificatie):** dezelfde ruwe `reason`-tekst wordt óók
  gekopieerd naar (a) `Notification.body` van admins (`dispute-commands.ts:67`) — `anonymizeUser` muteert
  `Notification` in het geheel niet en deze rijen horen bij de ontvanger (admin), niet de actor; en
  (b) `AuditLog.metadata.reason` (`dispute-commands.ts:78`) — buiten het bereik van
  `scrubAuditMetadataPii`, dat alleen hele veldwaarden exact matcht op naam/e-mail, nooit een naam áls
  substring in een vrije zin. `Collaboration.disputeReason` zélf wordt wél genulld, wat een vals gevoel
  van "weg" geeft. **Mens/DPO-keuze vereist**: pseudonimiseren/redigeren óf de event-store + admin-
  notificaties expliciet classificeren onder art. 17 lid 3 (archief/rechtsvordering) én een
  retentie-opruimtaak toevoegen (die er voor geen van de drie tabellen is). MENSENWERK — geen stille
  agent-fix op de event-store.
- **[HOOG · AVG art. 15/20 — export onvolledig] — OPGELOST (ronde 2026-06-25)** `buildAccountExport`
  (`src/lib/account-export.ts`) miste de eigen `Idea` (title/description), `Collaboration.cancellationReason`
  (eigen) en `PushSubscription`. Toegevoegd met strikte `select` (zie ronde 2026-06-25 boven).
- **[MIDDEL · AVG art. 30]** `PushSubscription`, `IndirectHoursEntry` (urencriterium, 7 jr fiscaal) en
  `HealthIncident` (bevat klartekst-IP in `summary`, `monitoring/detectors.ts`) ontbreken in
  `processing-register.ts`. Fix: register-entries + bewaartermijn/opruimtaak.
- **[MIDDEL · k-anonimiteit testdrempel] — OPGELOST (2e ronde 2026-07-08)** `market-rate.test.ts`
  gebruikte een lokale `MIN = 3` i.p.v. `MARKET_RATE_MIN_SAMPLE` (=10) uit `config.ts`; een per ongeluk
  verlaagde productiedrempel werd niet gedetecteerd. Gefixt: nieuwe `describe`-block importeert de echte
  constante en assert `>= 10` (rood→groen). Zie de OPGELOST-entry bovenaan (2e ronde 2026-07-08).
- **[MIDDEL · AVG art. 5 lid 1f — storageKey in hosting-logs]** mislukte storage-opruiming logt de
  `storageKey` (`admin/gebruikers/actions.ts`, `documenten/actions.ts`, `certificaten/actions.ts`)
  naar `console.error` zonder `NODE_ENV`-guard. Fix: in productie de key maskeren of naar een
  beveiligde audittabel schrijven i.p.v. de console.
- **[MIDDEL · AVG art. 15/20] — OPGELOST (ronde 2026-06-25)** `db.company.findUnique` in de export had
  geen `select` → interne velden (`tenantId`, `logoKey`) lekten mee. Gefixt met expliciete `select`.

### GEPARKEERD — security / hardening (ronde 2026-06-24b)

- **[MIDDEL · A09 — audit-volledigheid] — OPGELOST (ronde 2026-06-25)** `/api/admin/facturatie/[id]/pdf`
  serveerde een platform-factuur-PDF (financiële PII) zonder auditregel. Gefixt met
  `PLATFORM_BILLING_PDF_ACCESSED`-audit (zie ronde 2026-06-25 boven).
- **[MIDDEL · CLAUDE.md regel 2 — Zod-grens]** `saveApplicationNote` (`kandidaten/actions.ts`) schrijft
  het `note`-veld via `String().slice(2000)` i.p.v. een Zod-schema. Niet injecteerbaar (Prisma
  parametriseert), maar buiten de gevalideerde grens. Fix: `z.string().trim().max(2000)`.
- **[MIDDEL · A04 — error-leak]** `activate` (`abonnement/actions.ts`) gebruikt `planKeySchema.parse`
  → rauwe `ZodError` (met geldige enum-waarden) naar de boundary. Fix: `safeParse` + nette fout.
- **[LAAG · A09 — audit-volledigheid]** audit niet-atomair met de statuswijziging in
  `setBillingStatusAction` (`from` ontbreekt in metadata), `adminResolve` (support) en
  `setDienstStatus` (franchise); statusguard ís aanwezig (geen TOCTOU). Fix: mutatie + auditLog in één
  `$transaction`; `{ from, to }` in metadata.
- **[LAAG · A09 — orphaned storage]** mislukte storage-delete bij `deleteDocument`/`deleteDocumentById`
  /logo-upload markeert geen `storageOrphaned` in de audit → onzichtbaar verweesd S3-object. Fix:
  `metadata: { storageOrphaned: true, key }` bij de `.catch`.
- **[LAAG · A05 — CSP-sandbox]** `/api/media/[...key]` zet geen `Content-Security-Policy: sandbox` op
  een (theoretisch) als logo opgeslagen PDF, anders dan `/api/documents/[id]`. Fix: sandbox-header bij
  `application/pdf`.
- **[LAAG · A09]** `/api/agenda` (.ics-export van alle actieve samenwerkingen) schrijft geen
  auditregel, anders dan de overige bulk-exports. Fix: `AGENDA_EXPORTED`-audit.
- **[LAAG · CLAUDE.md regel 3]** `setUserStatus` kent geen expliciete `USER_STATUS_TRANSITIONS`-map
  (ACTIVE→PENDING mogelijk). Fix: transitiemap toevoegen.

## Ronde 2026-06-24 (basis: `main` @ 70cf3b6)

Audit: 4 parallelle security/privacy-subagents over server actions, franchise-/admin-actions,
API route-handlers en AVG/anonimisering, plus handmatige verificatie van auth/sessie, deeltoken,
wachtwoordherstel, cron-auth en storage. OWASP Top 10 (A01 broken access control, A04 insecure
design, A07 auth failures, A09 logging) + AVG art. 5/15/17/30 als kader.

### OPGELOST in deze ronde

- **[HOOG · A09 / AVG art. 30 — accountability]** Drie on-demand PDF-routes serveerden gevoelige
  PII-documenten **zonder auditregel**, in tegenstelling tot de dossier-routes en
  `/api/documents/[id]`. Geschonden: CLAUDE.md regel 5 ("audit alles wat telt — documenttoegang").
  Gefixt: `audit()` (met IP/UA via `requestMeta`) toegevoegd ná de ownership-check in
  `src/app/api/facturen/[id]/pdf/route.ts` (`INVOICE_PDF_ACCESSED`),
  `src/app/api/prestaties/[id]/pdf/route.ts` (`PERFORMANCE_PDF_ACCESSED`) en
  `src/app/api/samenwerkingen/[id]/modelovereenkomst/route.ts` (`MODEL_AGREEMENT_ACCESSED`).
  NL-labels in `src/lib/audit-labels.ts`. Test: `src/app/api/pdf-routes-audit.test.ts` (rood→groen:
  geautoriseerd → auditregel; niet-partij → 403 + geen audit/serve).

- **[KRITIEK · AVG art. 17 — recht op verwijdering]** `anonymizeUser()` overschreef de PII op
  `User`/`FreelancerProfile`/`Company` en wiste `Credential`/`Document`/`Message`, maar liet
  herleidbare vrije-tekst-PII van de betrokkene achter in kindrijen (een `user.update` triggert geen
  cascade). Geschonden: CLAUDE.md "documenten/PII echt verwijderen", AVG art. 17. Gefixt: de
  anonimiseringstransactie in `src/app/(protected)/admin/gebruikers/actions.ts` redact nu ook
  `Application.motivation`, `SupportMessage.body` (eigen), `IdeaComment.body` (eigen),
  `Review.comment` (eigen) en `ShiftHandoff.reason` (eigen). Test:
  `src/app/(protected)/admin/gebruikers/anonymize-erasure.test.ts` (rood→groen).

### GEPARKEERD — privacy/AVG

- **[HOOG · AVG art. 30 — Lead-PII zonder grondslag/bewaartermijn]** Het `Lead`-model bewaart PII
  van derden (prospects): `contactName`, `email`, `phone`, `notes`, `LeadContact.body`. Ontbreekt
  volledig in `src/lib/compliance/processing-register.ts` (geen verwerkingsactiviteit, geen
  `RetentionRule`). Repro: `/franchise/leads` → lead aanmaken → PII blijft onbeperkt staan.
  Fix: registerentry "Acquisitie-/leadbeheer franchise" (grondslag GERECHTVAARDIGD_BELANG),
  bewaartermijn (bv. 12 mnd na `NO_DEAL`/laatste activiteit) + opruimtaak of MENSENWERK-notitie.
  **Mens bevestigen vóór livegang** (mogelijke art. 6-overtreding bij echte data).

- **[HOOG · AVG art. 5 lid 1f — PII in serverlogs]**
  `src/app/(protected)/admin/import/actions.ts` (welkomstmail-fout) logt `row.email` in
  `console.error` zonder `NODE_ENV`-guard; host-/Railway-logs vallen buiten de auditdatabase.
  Fix: vervang door een niet-herleidbare `user.id` (CUID) i.p.v. het e-mailadres.

- **[HOOG · AVG art. 30 — transparantie auditmetadata]** E-mailadressen (ook van niet-leden) worden
  in `AuditLog.metadata` opgeslagen bij `AUTH_RATE_LIMITED`/`USER_LOGIN_FAILED` (`src/auth.ts`),
  `REGISTER_RATE_LIMITED` (`src/app/register/actions.ts`) en `USER_IMPORTED`
  (`admin/import/actions.ts`) en geëxporteerd via de admin-audit-CSV, maar niet vermeld in de
  `dataCategories` van de beveiligings-entry in `processing-register.ts`. Fix: dataCategorie
  documenteren (gerechtvaardigd beveiligingsbelang) en heroverwegen of het e-mailadres bij een
  bekende `userId` nodig is.

- **[MIDDEL · AVG art. 15/20 — inzage/portabiliteit onvolledig] — OPGELOST (#527)**
  `GET /api/account/export` bevatte alleen `sentMessages`. Toegevoegd: ontvangen berichten,
  `TaxFilingRequest`, eigen `Review`, `IdeaComment`, eigen `SupportTicket`/`SupportMessage`,
  `IndirectHoursEntry`. Dataverzameling verhuisd naar de testbare, gedeelde
  `src/lib/account-export.ts` (`buildAccountExport`) met strikte `select`-clauses (geen
  vrije-tekst-PII van derden): ontvangen berichten zijn gescopet op gesprekken waarin de actor
  deelneemt (`senderId != actor`), ondersteuningsberichten op `authorId == actor` (geen
  admin-/assistent-antwoorden), en de eigen `Review` laat `subjectId` weg (geen identiteit van de
  beoordeelde tegenpartij). Test: `src/lib/account-export.test.ts` (5 tests).

- **[MIDDEL · AVG art. 5 lid 1c — dataminimalisatie]** KvK-nummer staat op het publieke profiel
  (`src/components/profile/profile-screen.tsx`), zichtbaar voor anonieme bezoekers op `/zzp/[id]`;
  voor een eenmanszaak herleidbaar tot woonadres via het KvK-register. Fix: KvK alleen tonen aan
  eigenaar/admin/actieve-samenwerking-CLIENT, of een duidelijke uitleg bij het veld.

- **[MIDDEL · AVG art. 13/46 — doorgifte aan derde]** Bij `ROUTING_PROVIDER=geoapify` gaan
  locatiestrings (profiel/opdracht) naar Geoapify (`src/lib/services/routing.ts`) en wordt de query
  in `GeocodeCache.query` bewaard; geen verwerker-entry. Fix: registerentry "Reistijdberekening" +
  MENSENWERK-notitie (verwerkersovereenkomst + EU-regio vereist vóór activering).

- **[LAAG · AVG art. 30]** `TaxFilingRequest` (machtigingen DigiD/eHerkenning, `partnerName`,
  bedragen) ontbreekt in het verwerkingsregister. Fix: entry "Belastingaangifte-delegatie"
  (grondslag TOESTEMMING, bewaartermijn 7 jaar fiscaal).

### GEPARKEERD — security / hardening

- **[HOOG · A09 — error-leak] — OPGELOST (#528)** `src/app/api/tasks/run-all/route.ts` zette rauwe
  `e.message` (mogelijk Prisma-schema-detail) in de JSON-respons. Gefixt: nieuwe pure
  `src/lib/scheduled-tasks.ts` (`runScheduledTasks(tasks, logError?)`) zet de statische string
  `"Taak mislukt."` in `errors[name]` en geeft het echte foutobject via `logError` door; de route
  logt dat **alleen server-side** (`console.error`). Test: `src/lib/scheduled-tasks.test.ts`
  (maskering + geen lek van de ruwe boodschap).

- **[MIDDEL · A04 — resource exhaustion]** `src/app/api/push/subscribe/route.ts` heeft geen
  per-gebruiker rate-limit; een ingelogde gebruiker kan veel push-endpoints registreren. Fix:
  `exportRateLimiter`-patroon toepassen (bv. 20/u).

- **[MIDDEL · datameintegriteit] — OPGELOST (#523)** `noShowReportSchema` (`src/lib/validation.ts`)
  accepteerde een `occurredOn` in de toekomst; een no-show kon vooraf op een ZZP'er worden geboekt
  (telt mee in de schorsingsladder). Gefixt: `.refine(d => d.getTime() <= Date.now(), …)` op het
  schema (server-side, beide melders). Test: `validation.test.ts` (verleden/vandaag toegestaan,
  toekomst geweigerd).

- **[MIDDEL · datameintegriteit] — OPGELOST (#523)** `setOrtProfileAction`
  (`samenwerkingen/[id]/actions.ts`) had geen bovengrens op de maatwerk-ORT-percentages (alleen
  `>= 0`); de eigenaar-CLIENT kon absurde toeslagen instellen die in alle toekomstige facturen
  doorwerken. Gefixt: `MAX_ORT_CUSTOM_BPS = 50000` (+500%) in `config.ts`; harde guard in de actie
  bij het schrijven én een defense-in-depth grens in `parseOrtCustomRates` (`ort.ts`) bij het lezen
  (legacy/bewerkte rijen vallen terug op het sectorprofiel). Test: `ort.test.ts`.

- **[MIDDEL · A09 — audit-volledigheid] — OPGELOST (#528)** `adminReply`
  (`admin/support/actions.ts`) wijzigde ticketstatus + `assignedToId` zonder dat in de auditregel op
  te nemen en zonder transactie rond de mutaties. Gefixt: de vier mutaties in één
  `prisma.$transaction`; `{ statusChanged, assignedTo }` in de `SUPPORT_AGENT_REPLY`-metadata. Test:
  `admin-reply.test.ts`.

- **[MIDDEL · A04 — mass-assignment defense-in-depth] — OPGELOST (#528)** `commitImport`
  (`admin/import/actions.ts`) vertrouwde op het TypeScript-type `ImportRole` voor de rol bij
  `user.create`; geen runtime-guard. Gefixt: `assertImportRole` (`src/lib/import-role.ts`,
  `z.enum(["FREELANCER","CLIENT"])`) vlak vóór de DB-write, binnen de bestaande per-rij-try. Test:
  `import-role.test.ts`.

- **[LAAG · defense-in-depth IDOR]** `deleteDocumentById` (`certificaten/actions.ts`) doet geen
  eigen ownership-check (vertrouwt op de aanroepers die een eigen credential-document doorgeven). Nu
  niet exploiteerbaar; een toekomstige call-site met een form-id zou het wel maken. Fix: in de
  functie `doc.ownerId !== actorId` checken (en `ownerId` selecteren).

- **[LAAG · audit-volledigheid]** `removeDepartment`/`removeAfdelingStep` (franchise) auditen geen
  count van geraakte `Job.departmentId`-cascades. Fix: `affectedJobIds` in metadata.

- **[LAAG · consistentie]** `setUserStatus` (`admin/gebruikers/actions.ts`) gebruikt
  `userStatusSchema.parse` (throwt 500) i.p.v. `safeParse` + nette fout.

### BEKEKEN — geen kwetsbaarheid (vals positief)

- **Billing-webhook ontbeert HMAC-handtekening** (`api/billing/webhook/route.ts`) — gemeld als
  KRITIEK, maar **niet exploiteerbaar**: Mollie ondertekent payment-webhooks niet; de route haalt de
  status autoritatief opnieuw op bij Mollie met de eigen API-key (de re-fetch ÍS de control, conform
  Mollie-docs). Onder de Noop-provider (dev) hebben abonnementen `providerRef = null`, dus de
  `findFirst({ where: { providerRef } })` matcht nooit. Geen HMAC nodig; niet aangepast.
- **CSV-formula-injectie in exports** — `escapeCsvField` (`src/lib/csv.ts`) dekt `= + - @` correct;
  alle exports lopen via `toCsv`. Schoon.
- **Cron-auth, deeltoken, wachtwoordherstel, document-/media-serving, tenant-isolatie** (franchise/
  admin-actions) — geverifieerd correct (timing-safe vergelijkingen, ownership/`assertSameTenant`,
  geen informatielek). Schoon.
