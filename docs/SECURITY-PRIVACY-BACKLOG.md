# SECURITY & PRIVACY BACKLOG — ZZP Platform

> Bevindingen uit de security-/privacy-auditronde. Gefixt = **OPGELOST** (met PR-referentie);
> geparkeerd met repro, severity (KRITIEK/HOOG/MIDDEL/LAAG), geschonden regel en aanbevolen fix.
> Pak per run de 1–3 belangrijkste; werk dit bestand bij.

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
- **[MIDDEL · OWASP A01 / open redirect — `abonnement/actions.ts` bouwt payment-provider `returnUrl`/
  `webhookUrl` uit request-`Origin`/`Host` i.p.v. `AUTH_URL`]** Na een echte betaling kan de browser
  naar een aanvaller-domein worden geredirect (`${origin}/abonnement`). Fix: bouw de URLs uit
  `AUTH_URL`/`NEXTAUTH_URL` (zoals `getPublicOrigin()` in de middleware), nooit uit request-headers.
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
- **[LAAG · CLAUDE.md regel 6 — Zod-grens]** `saveApplicationNote` (`kandidaten/actions.ts`) begrenst
  `note` met een handmatige `.slice(0, 2000)` i.p.v. een Zod-`trimmed(2000)` (conventie in de rest van
  de codebase). Niet exploiteerbaar; consistentie. (Terugkerend thema, zie eerdere rondes.)

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

- **[MIDDEL · A04 — onbegrensde vrije-tekst-invoer buiten Zod (terugkerend thema)]** Diverse mutatie-
  grenzen lezen vrije tekst via `String(formData.get(...))` zonder Zod-`max()`: `rejectCredential.reason`
  (`admin/verificaties/actions.ts:80`), `rejectPerformance`/`rejectInvoice`/`creditInvoice`/`openDispute`
  `.reason` (`samenwerkingen/[id]/actions.ts`), en `parsePerformanceInput` `description`/`milestoneTitle`
  (idem). Niet injecteerbaar (Prisma parametriseert, JSX escapet), maar onbegrensde payload belandt in
  PII-tabellen, notificaties én audit-metadata (bloat). Past in het reeds geparkeerde
  `saveApplicationNote`-patroon. Fix: per veld `z.string().trim().max(N)` aan de grens + defense-in-depth
  in de cascade-handlers.
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
