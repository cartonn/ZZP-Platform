# SECURITY & PRIVACY BACKLOG — ZZP Platform

> Bevindingen uit de security-/privacy-auditronde. Gefixt = **OPGELOST** (met PR-referentie);
> geparkeerd met repro, severity (KRITIEK/HOOG/MIDDEL/LAAG), geschonden regel en aanbevolen fix.
> Pak per run de 1–3 belangrijkste; werk dit bestand bij.

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
- **[MIDDEL · AVG art. 15/20 — inzage-export onvolledig (uitbreiding)]** `buildAccountExport`
  (`account-export.ts`) mist naast de eerder geparkeerde categorieën (ontvangen `Review`, eigen
  `ShiftHandoff.reason`, `AvailabilityWindow.note`, open `Collaboration.disputeReason`) nu ook: eigen
  `Application.note` (CLIENT), `NoShowReport` (melder), `ShiftHandoff.decisionNote` (beslisser),
  `LeadContact.body` (franchiser). Fix: per categorie een strikt-`select`-query (geen derde-partij-PII).
- **[LAAG · AVG art. 15/20 + 17]** `FavoriteFreelancer.note` (privé CLIENT-notitie) ontbreekt nog in
  zowel `anonymizeUser` als de export (bevestigd nog open). Fix: `favoriteFreelancer.updateMany({
where: { company: { userId } }, data: { note: null } })` + export-query.

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
- **[LAAG · AVG art. 15/20 + art. 17]** `FavoriteFreelancer.note` (privé CLIENT-notitie over een ZZP'er)
  ontbreekt in zowel de export als de anonimisering van een CLIENT-account (`Company` wordt geüpdatet,
  niet verwijderd → geen cascade). Fix: export + `favoriteFreelancer.updateMany({ note: null })`.
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

- **[HOOG · AVG art. 17 — DomainEvent.payload onverwijderbaar]** `DISPUTE_OPENED`-events bewaren de
  vrije-tekst `reason` in de append-only event-store (`dispute-commands.ts`); structureel niet te
  wissen bij anonimisering. **Mens/DPO-keuze vereist**: payloads pseudonimiseren óf de event-store
  expliciet classificeren onder art. 17 lid 3 (archief/rechtsvordering). MENSENWERK.
- **[HOOG · AVG art. 15/20 — export onvolledig] — OPGELOST (ronde 2026-06-25)** `buildAccountExport`
  (`src/lib/account-export.ts`) miste de eigen `Idea` (title/description), `Collaboration.cancellationReason`
  (eigen) en `PushSubscription`. Toegevoegd met strikte `select` (zie ronde 2026-06-25 boven).
- **[MIDDEL · AVG art. 30]** `PushSubscription`, `IndirectHoursEntry` (urencriterium, 7 jr fiscaal) en
  `HealthIncident` (bevat klartekst-IP in `summary`, `monitoring/detectors.ts`) ontbreken in
  `processing-register.ts`. Fix: register-entries + bewaartermijn/opruimtaak.
- **[MIDDEL · k-anonimiteit testdrempel]** `market-rate.test.ts` gebruikt een lokale `MIN = 3` i.p.v.
  `MARKET_RATE_MIN_SAMPLE` (=10) uit `config.ts`; een per ongeluk verlaagde productiedrempel wordt niet
  gedetecteerd. Fix: importeer de echte constante + assert `>= 10`.
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
