# SECURITY & PRIVACY BACKLOG — ZZP Platform

> Bevindingen uit de security-/privacy-auditronde. Gefixt = **OPGELOST** (met PR-referentie);
> geparkeerd met repro, severity (KRITIEK/HOOG/MIDDEL/LAAG), geschonden regel en aanbevolen fix.
> Pak per run de 1–3 belangrijkste; werk dit bestand bij.

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
