# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie. Houd het kort en feitelijk:
> wat is af, welke bestanden, welke tests, wat is de volgende stap.

## Legenda
- [x] af en getest
- [~] deels af / in uitvoering
- [ ] nog niet begonnen

---

## Status per sessie

- [x] **Sessie 0** — Inventarisatie & fundament
- [x] **Sessie 1** — Onboarding & profielen
- [x] **Sessie 2** — Opdrachten CRUD + zoeken/filteren
- [x] **Sessie 3** — Reacties & kandidatenflow
- [x] **Sessie 4** — Documenten + credentials (ZZP)
- [x] **Sessie 5** — Verificatie (admin) + compliance afronden
- [x] **Sessie 6** — Berichten, notificaties, samenwerkingen
- [x] **Sessie 7** — Facturatie + billing
- [x] **Sessie 8** — Admin-paneel afronden
- [x] **Sessie 9** — Polish, performance, a11y, e2e
- [x] **Sessie 10** — Productie-voorbereiding (code-kant)

---

## Logboek

### Sessie 0 — 2026-05-25
- Wat gedaan: fundament vanaf nul gescaffold (geen bestaande codebase aangetroffen).
  Next.js 15 (App Router) + React 19 + TS strict + Prisma (SQLite) + Auth.js v5
  (credentials + JWT, role-based) + Tailwind + Vitest. Login werkt, guard redirect
  werkt, 3 demo-accounts geseed. Volledig Prisma-schema voor alle kernmodellen.
- Bestanden (kern):
  - `prisma/schema.prisma` (alle modellen, portable: strings i.p.v. native enums, geen scalar-arrays)
  - `prisma/seed.ts` (3 demo-accounts + skills/branches/plannen, idempotent)
  - `src/lib/enums.ts` (alle enums + Zod + `CREDENTIAL_TRANSITIONS`)
  - `src/lib/credentials.ts` (+ test) — `assertTransition`, expiry-logica
  - `src/lib/authz.ts` (+ test) — auth/rol/ownership, `requireRole`, `assertOwnership`
  - `src/lib/matching.ts` (+ test) — matchscore + compliance-berekening
  - `src/lib/services/storage.ts` (+ test) — abstractie (local/S3-stub) + upload-validatie
  - `src/lib/audit.ts`, `src/lib/db.ts`, `src/lib/utils.ts`, `src/lib/nav.ts`
  - `src/auth.ts`, `src/auth.config.ts` (edge-safe), `src/middleware.ts`, `src/types/next-auth.d.ts`
  - `src/app/login/*`, `src/app/(protected)/layout.tsx` + `dashboard/page.tsx`, `src/app/page.tsx`
  - `src/components/app-shell.tsx`, `sidebar-nav.tsx`, `ui/button.tsx`
- Tests: 44 unit-tests groen (credentials 14, authz 12, matching 11, storage 7).
- Checks: typecheck ✓, lint ✓ (geen warnings), test ✓ (44/44), build ✓ (6 routes + middleware).
- Browser-doorklik (visueel) ✓: Playwright e2e-smoke (`e2e/smoke.spec.ts`, 7 tests) draait
  via **systeem-Edge** (`channel: "msedge"`) en maakt screenshots (`e2e/screenshots/`,
  gitignored) die visueel zijn gecontroleerd: login, freelancer/admin/client-dashboard
  (role-aware nav verschilt), foutstaat, uitloggen. Geen tekst-overflow, states renderen.
  Reden voor Edge: de Playwright-browser-CDN staat niet in de netwerk-allowlist van deze
  omgeving; `packages.microsoft.com` (Edge, chromium-gebaseerd) wél. Run: `npm run e2e`.
- Openstaand / volgende stap: Sessie 1 (Onboarding & profielen). Aandachtspunten:
  - `.env` is lokaal aangemaakt met echte `AUTH_SECRET` (niet in git).
  - Prisma toont een deprecation-warning over `package.json#prisma` (werkt op v6;
    migratie naar `prisma.config.ts` kan later).
  - E2e vereist een geïnstalleerde Edge/Chrome (system). In deze omgeving via apt-repo
    `packages.microsoft.com` → `microsoft-edge-stable`. Niet via Playwright's eigen CDN.

### Sessie 1 — 2026-05-26
- Wat gedaan: onboarding & profielen. Registratie met rolkeuze (FREELANCER/CLIENT)
  maakt account + leeg profiel/bedrijf aan en logt direct in. Freelancer- en
  bedrijfsprofiel bewerkbaar via beschermde routes (mutatieketen rol→ownership→Zod→
  actie→audit). Server-berekende profiel-compleetheid met indicator. Publiek ZZP-profiel
  (/zzp/[id]) dat zichtbaarheid server-side afdwingt (PRIVATE → 404, ook anoniem).
  Bedrijfslogo-upload via de storage-abstractie + auth-gated media-route.
- Bestanden:
  - `src/lib/validation.ts` (+ test) — register/freelancer/company Zod-schema's
  - `src/lib/profile.ts` (+ test) — compleetheid + zichtbaarheidsregel
  - `src/app/register/*` — registratie (server action + signin)
  - `src/app/(protected)/profiel/*` — freelancerprofiel bewerken + compleetheid
  - `src/app/(protected)/bedrijf/*` — bedrijfsprofiel bewerken + logo-upload
  - `src/app/zzp/[id]/page.tsx` — publiek profiel (zichtbaarheid afgedwongen)
  - `src/app/api/media/[...key]/route.ts` — auth-gated logo-serving via storage
  - `src/components/ui/*` — input, textarea, select, field, card, progress, badge
  - nav.ts: /profiel + /bedrijf op enabled; auth.config: /register + /zzp/* publiek
- Tests: 58 unit-tests (incl. validation 8, profile 6) + 10 Playwright e2e groen
  (registratie, profiel publiceren, PUBLIC→PRIVATE 404, bedrijfsprofiel).
- Checks: typecheck ✓, lint ✓, test ✓ (58), build ✓ (10 routes), e2e ✓ (10, via Edge).
- Visueel gecontroleerd (screenshots 06-09): register, profiel + compleetheid,
  publiek profiel, bedrijfsprofiel. Geen overflow; states correct.
- Bekende minor: controlled <select> toont kort de oude waarde in de sub-seconde ná
  een server-action save (RSC-refresh), zelfherstellend bij navigatie; data is correct
  (DB + reload-assertie bevestigd). Nette toast/refresh-afhandeling: Sessie 9 (polish).
- Volgende stap: Sessie 2 — Opdrachten CRUD + zoeken/filteren.

### Sessie 2 — 2026-05-26
- Wat gedaan: opdrachten CRUD + zoeken/filteren. CLIENT maakt/bewerkt opdrachten
  (concept → publiceren → sluiten/heropenen → depubliceren) met server-side afgedwongen
  statusovergangen (`JOB_TRANSITIONS`/`assertJobTransition`) + ownership + audit. Vereiste/
  gewenste skills en certificaat-eisen koppelbaar. ZZP-overzicht met debounced zoeken,
  filters (branche, skills, tarief, werkmodus, vereist certificaat), sorteren, paginatie —
  alleen PUBLISHED. Detailpagina role-aware (eigenaar: statusacties + bewerken; ZZP'er:
  read-only + "Reageren (binnenkort)"). Niet-gepubliceerde opdrachten server-side verborgen.
- Bestanden:
  - `src/lib/jobs.ts` (+ test) — JOB_TRANSITIONS, canPublish, normalizeJobFilters
  - `src/lib/validation.ts` — jobSchema (+ tests)
  - `src/app/(protected)/opdrachten/{page,actions,job-form}.tsx`,
    `nieuw/`, `[id]/page.tsx`, `[id]/bewerken/page.tsx`
  - `src/components/jobs/{job-filters,job-status-badge}.tsx`, `ui/check-chip.tsx`
  - nav.ts: Opdrachten / Mijn opdrachten op enabled
- Tests: 71 unit-tests (jobs 9, job-validatie 4 extra) + 11 e2e groen (incl. aanmaken,
  publiceren, zoeken, detail, depubliceren → 404 voor anderen).
- Checks: typecheck ✓, lint ✓, test ✓ (71), build ✓ (15 routes), e2e ✓ (11, via Edge).
- Visueel gecontroleerd (screenshots 10-13): client-overzicht, detail (concept/gepubliceerd),
  browse met filters, ZZP-detail met vereiste skills/certificaten.
- Let op (SQLite-beperking): vrije-tekst-zoek is hoofdlettergevoelig (`contains` zonder
  `mode:insensitive`, niet ondersteund op SQLite). Op Postgres (prod) insensitive maken.
- Volgende stap: Sessie 3 — Reacties & kandidatenflow (matchscore + compliance-snapshot,
  gebruik `src/lib/matching.ts`; feature-gating per plan).

### Sessie 3 — 2026-05-26
- Wat gedaan: reacties & kandidatenflow. FREELANCER reageert op een PUBLISHED opdracht
  (motivatie/tariefvoorstel/beschikbaarheid); server berekent matchscore + compliance-
  snapshot via `matching.ts` en slaat ze op. Eén reactie per opdracht. Plan-gating
  (max reacties, FREE-plan) server-side afgedwongen. CLIENT-kandidatenoverzicht met
  statusbeheer (NEW/VIEWED/SHORTLIST/REJECTED/ACCEPTED via expliciete overgangsmap),
  interne notities en compliance/match per kandidaat. FREELANCER "Mijn reacties".
- Bestanden:
  - `src/lib/applications.ts` (+ test) — APPLICATION_TRANSITIONS, canApply (gating)
  - `src/lib/validation.ts` — applicationSchema (+ test)
  - opdrachten/actions.ts: `createApplication` (match+compliance+gating)
  - `opdrachten/[id]/application-form.tsx` + detailpagina-integratie (reageren/gereageerd)
  - `reacties/page.tsx` (FREELANCER), `kandidaten/{page,actions}.tsx` (CLIENT)
  - `components/{compliance-badge,applications/application-status-badge}.tsx`
  - nav.ts: Mijn reacties + Kandidaten op enabled
- Tests: 78 unit-tests (applications 5, applicatie-validatie 2 extra) + 12 e2e groen
  (reageren → matchscore, dubbel reageren geblokkeerd, kandidaat shortlisten + notitie).
- Checks: typecheck ✓, lint ✓, test ✓ (78), build ✓ (17 routes), e2e ✓ (12, via Edge).
- Visueel gecontroleerd (screenshots 14-16): reactieformulier, mijn reacties, kandidaten.
- Mijlpaal: na Sessie 5 is de volledige kerndifferentiatie (opdracht → reactie →
  verificatie → compliance) demo-klaar. Nu staat opdracht → reactie → match/compliance.
- Volgende stap: Sessie 4 — Documenten + credentials (ZZP-kant): upload-UI op de
  storage-abstractie, credentials uploaden/metadata/verificatie aanvragen/zichtbaarheid.

### Sessie 4 — 2026-05-26
- Wat gedaan: documenten + credentials (ZZP-kant). FREELANCER uploadt certificaten
  (type/titel/uitgever/datums + bewijsstuk via storage-abstractie), bewerkt metadata,
  vraagt verificatie aan (DRAFT/REJECTED/EXPIRED → SUBMITTED via assertTransition), vervangt
  bewijsstuk (reeds beoordeeld → terug naar SUBMITTED), beheert zichtbaarheid (PUBLIC/PRIVATE),
  ziet verificatiehistorie + afwijzingsreden + expiry-indicator. Aparte documenten-pagina
  (upload + privé download). Document-download via ownership-gated route (eigenaar/admin).
  Geverifieerde + openbare credentials verschijnen op het publieke profiel.
- Bestanden:
  - `src/lib/documents.ts` (+ test) — canAccessDocument, documentKindForCredential
  - `src/lib/validation.ts` — credentialSchema, documentSchema (+ tests)
  - `src/app/api/documents/[id]/route.ts` — privé download (ownership, nosniff)
  - `certificaten/{page,actions,credential-form}.tsx`, `nieuw/`, `[id]/bewerken/`
  - `documenten/{page,actions,document-form}.tsx`
  - `components/credentials/credential-status-badge.tsx`; zzp/[id] toont verified certs
  - nav.ts: Documenten + Certificaten op enabled
- Reviewzwerm (3 parallelle agents) + fix-loop:
  - FIX: plan-gating telde ook niet-actieve abonnementen → alleen status ACTIVE telt.
  - FIX: credential-opslag nu atomair ($transaction / nested create); latente bug verholpen
    (document vervangen terwijl status SUBMITTED gooide assertTransition).
  - FIX a11y: zichtbare focus-ring op CheckChip + rol-radio's; CheckChip ontdubbeld.
  - FIX: kandidaten-actions gebruiken de echte Actor; nosniff-headers; logo shrink-0;
    consistente term "certificaat" i.p.v. "credential" in UI.
  - Verificatie-agent: alle fixes correct, geen regressies.
- Tests: 84 unit-tests (documents 3, credential-validatie 3 extra) + 14 e2e groen
  (credential uploaden → verificatie aanvragen, privé-download 200 eigenaar / 403 ander,
  document uploaden/downloaden).
- Checks: typecheck ✓, lint ✓, test ✓ (84), build ✓ (19 routes), e2e ✓ (14, via Edge).
- Visueel gecontroleerd (screenshots 17-19): certificaten (concept + in beoordeling), documenten.
- Volgende stap: Sessie 5 — Admin-verificatiequeue (goedkeuren/afwijzen met verplichte reden,
  expiry-job VERIFIED→EXPIRED). Hierna is de kerndifferentiatie demo-klaar.

### Sessie 5 — 2026-05-26  (MIJLPAAL: kerndifferentiatie demo-klaar)
- Wat gedaan: admin-verificatiequeue + expiry. ADMIN beoordeelt ingediende certificaten
  op `/admin/verificaties`: goedkeuren (→VERIFIED, verifiedAt, CredentialVerification-record,
  VerificationRequest→RESOLVED) en afwijzen (→REJECTED, **reden verplicht** server-side,
  herstelactie voor ZZP'er) via `statusForDecision`. In-app notificatie + audit per beslissing.
  Idempotente expiry-actie zet verlopen VERIFIED → EXPIRED via `expiryTransition`.
  ZZP'er ziet de uitkomst op /certificaten; geverifieerde+openbare certs op publiek profiel;
  compliance (matching.ts) reflecteert VERIFIED+niet-verlopen. Hele keten werkt end-to-end:
  opdracht → reactie → verificatie → compliance.
- Bestanden:
  - `src/app/(protected)/admin/verificaties/{page,actions,expiry-button}.tsx`
  - `src/app/icon.svg` (favicon; loste /favicon.ico 404 op — Next dev "1 Issue")
  - nav.ts: admin Verificaties enabled; auth.config: route-gate /admin → ADMIN
  - audit.ts: `auditData()` zodat audit atomair in een $transaction kan
- Reviewzwerm (2 agents) + fix-loop:
  - FIX (security, defense-in-depth): route-gate `/admin/*` → alleen ADMIN (pagina + actions
    checkten al; nu ook routelaag) + e2e die non-admin-toegang weert.
  - FIX (CLAUDE.md regel 5): audit-regel nu binnen de $transaction van elke beslissing/expiry.
  - FIX (visueel gevonden): geverifieerd certificaat toonde nog "Verificatie aanvragen"
    (VERIFIED→SUBMITTED bestaat in de map voor doc-vervangen, niet als losse actie) →
    knop + server-actie beperkt tot DRAFT/REJECTED/EXPIRED.
- Tests: 84 unit-tests + 17 e2e groen (goedkeuren/afwijzen + reden, expiry→EXPIRED,
  route-gate non-admin, privé-download eigenaar/ander). Console schoon (geen 404/errors).
- Checks: typecheck ✓, lint ✓, test ✓ (84), build ✓ (18 routes), e2e ✓ (17, via Edge).
- Visueel gecontroleerd (screenshots 20-21): admin-queue, ZZP-uitkomst (verified/afgewezen).
- Volgende stap: Sessie 6 — Berichten, notificaties, samenwerkingen.

### Sessie 6 — 2026-05-26
- Wat gedaan: berichten, notificaties, samenwerkingen.
  - **Berichten:** 1-op-1 gesprek (Conversation + ConversationParticipant) tussen CLIENT en
    ZZP'er, gestart vanuit een reactie (`startConversationForApplication`). Thread + composer;
    toegang server-side op deelnemerschap (`isParticipant`); ongelezen-telling (`unreadCount`).
  - **Notificaties:** centrum (`/notificaties`) + ongelezen-bel met badge in de AppShell;
    markeer-als-gelezen (per item + alles). Notificaties bij nieuw bericht, reactie
    geaccepteerd/afgewezen, samenwerking voorgesteld/bijgewerkt — alle ownership-scoped.
  - **Samenwerkingen:** Collaboration met expliciete statusflow (`COLLABORATION_TRANSITIONS`:
    PROPOSED→ACTIVE/CANCELLED, ACTIVE→COMPLETED/CANCELLED), voorgesteld door CLIENT vanuit een
    ACCEPTED reactie, bevestigd/afgerond/geannuleerd door een van beide partijen; audit + notify.
- Bestanden:
  - `src/lib/{messaging,collaborations}.ts` (+ tests), validation.ts (message/collab schemas)
  - `berichten/{page,actions,[id]/page,[id]/message-composer,[id]/mark-read}.tsx`
  - `notificaties/{page,actions}.tsx`; `app-shell.tsx` (bel + telling)
  - `samenwerkingen/{page,actions}.tsx`; `kandidaten/propose-collaboration.tsx`
  - kandidaten: "Bericht sturen" + voorstel/link + notify bij accept/reject (in $transaction)
  - nav.ts + sidebar-nav.tsx: Berichten + Samenwerkingen enabled (nieuw "handshake"-icoon)
- Tests: 91 unit-tests (messaging 5, collaborations 2) + 18 e2e groen (volledige journey:
  reageren → bericht heen/weer → accepteren → samenwerking voorstellen/activeren → notificaties).
- Reviewzwerm (2 agents): security CLEAN (geen IDOR; conversatie/notificatie/samenwerking
  allemaal ownership-/deelnemer-gescoped), correctheid geen bugs. Genoteerd voor later:
  berichtenlijst haalt nu alle messages op (perf → Sessie 9); geen unieke index op
  (conversatie-paar) → theoretische dubbel-aanmaak-race (laag risico).
- Checks: typecheck ✓, lint ✓, test ✓ (91), build ✓ (21 routes), e2e ✓ (18, via Edge).
- Visueel gecontroleerd (screenshots 22-24): berichtenthread, samenwerkingen, notificatiecentrum + bel-badge.
- Volgende stap: Sessie 7 — Facturatie + billing.

### Sessie 7 — 2026-05-26
- Wat gedaan: facturatie + billing.
  - **Facturen (FREELANCER):** opstellen vanuit een ACTIVE/COMPLETED samenwerking (dynamische
    regels: omschrijving/aantal/tarief). Bedragen server-berekend in centen (euro's→centen,
    regel- en totaalbedrag). Concept → versturen (issuedAt + standaard 14 dagen vervaldatum),
    annuleren. Oplopend jaargebonden factuurnummer (uniek). Statusflow via `INVOICE_TRANSITIONS`.
  - **Facturen (CLIENT):** ontvangen facturen, als betaald markeren; OVERDUE server-afgeleid
    (SENT + vervaldatum gepasseerd). Print-vriendelijke detailweergave met regels + totaal.
  - **Abonnement:** plan-overzicht (FREE/PRO/BUSINESS) + huidig plan; (mock) wisselen zonder
    echte betaling. Gating-melding in reageren verwijst naar upgrade.
- Bestanden:
  - `src/lib/invoices.ts` (+ tests: transities, bedragen, isOverdue, nummer, euro's→centen)
  - validation.ts (invoiceLineSchema); `components/invoices/invoice-status-badge.tsx`
  - `facturen/{page,actions,invoice-form,nieuw/page,[id]/page}.tsx`
  - `abonnement/{page,actions}.tsx`; nav + sidebar: Facturen + Abonnement enabled (creditCard-icoon)
  - samenwerkingen: "Factuur opstellen" voor freelancer; gating-melding → upgrade
- Tests: 97 unit-tests (invoices 13) + 20 e2e groen (factuur opstellen→versturen→betaald,
  abonnement upgraden). Reviewzwerm (2 agents): security CLEAN (ownership op alle factuur-
  acties, bedragen server-berekend, abonnement alleen eigen userId). Gefixt: factuurnummer-race
  (P2002-retry i.p.v. crash) + dueAt einde-van-de-dag (niet een dag te vroeg "verlopen").
- Checks: typecheck ✓, lint ✓, test ✓ (97), build ✓ (24 routes), e2e ✓ (20, via Edge).
- Visueel gecontroleerd (screenshots 25-27): factuur opstellen, betaalde factuur, abonnement.
- Volgende stap: Sessie 8 — Admin-paneel afronden (gebruikers, opdrachten, audit log).

### Sessie 8 — 2026-05-26
- Wat gedaan: admin-paneel afgerond.
  - **Gebruikers (`/admin/gebruikers`):** zoeken/filteren (naam/e-mail, rol, status); schorsen/
    activeren via `setUserStatus` met server-side self-guard (`canModerateUser`) + Zod-status +
    notificatie + audit (in $transaction). Rol wordt nooit gewijzigd.
  - **Opdrachten (`/admin/opdrachten`):** alle opdrachten overzien/filteren; `adminCloseJob`
    sluit via de bestaande `assertJobTransition` + audit.
  - **Audit log (`/admin/audit`):** doorzoekbaar (actie/entiteit) + paginatie, read-only, met
    actor-naam en metadata.
- Bestanden:
  - `src/lib/admin.ts` (+ tests: self-guard, suspension-toggle, audit-filters)
  - `admin/{gebruikers,opdrachten,audit}/{page,actions}.tsx`; nav: admin-items enabled
- Tests: 101 unit-tests (admin 6) + 21 e2e groen (admin schorst gebruiker + self-guard,
  sluit opdracht, ziet auditregel). Reviewzwerm: CLEAN — elke admin-actie checkt requireRole,
  self-guard server-side, geen rol-escalatie, filters parameterized, paginatie correct.
- Bekend (productie-securityreview): JWT-strategie betekent dat een net-geschorste gebruiker
  toegang houdt tot de JWT ververst; voor directe lockout zou `currentActor` de status uit de
  DB moeten herlezen. Bewuste trade-off uit Sessie 0.
- Checks: typecheck ✓, lint ✓, test ✓ (101), build ✓ (27 routes), e2e ✓ (21, via Edge).
- Visueel gecontroleerd (screenshots 28-29): gebruikersbeheer, audit log.
- Volgende stap: Sessie 9 — Polish, performance, a11y, e2e.

### Sessie 9 — 2026-05-26
- Wat gedaan: polish, performance, a11y — geen nieuwe features.
  - **Mobiele navigatie (echte gap, gevonden via mobiele browserverificatie):** sidebar was
    `hidden md:flex` zonder mobiel alternatief → géén navigatie op telefoon. Toegevoegd:
    toegankelijke drawer (`role="dialog"` aria-modal, Escape/overlay sluiten, auto-sluiten bij
    routewissel) via `components/mobile-nav.tsx`.
  - **Berichtenlijst perf:** niet meer álle messages laden; laatste bericht via `take:1` +
    ongelezen via goedkope per-conversatie COUNT.
  - **Dashboard:** verouderde Sessie-0-placeholder weg; nu live, ownership-gescopte stats per
    rol (klikbaar) — sluit aan op "dashboard-first" designregel.
  - Console-smoke over álle routes × 3 rollen: 0 errors/404's. `lang="nl"` aanwezig.
- Verifieer→fix-loop (les toegepast): een toegevoegde `(protected)/loading.tsx` bleek
  `notFound()` app-breed naar HTTP 200 te duwen (Suspense-streaming sluit de header te vroeg).
  Gevangen door de jobs-e2e (depubliceren → 404). Bewust teruggedraaid: correcte 404-semantiek
  weegt zwaarder dan een skeleton.
- Tests: 101 unit-tests + 21 e2e groen (incl. mobiel menu in tijdelijke check geverifieerd).
  Reviewzwerm: CLEAN (geen authz-regressie, counts correct, drawer-a11y in orde).
- Checks: typecheck ✓, lint ✓, test ✓ (101), build ✓ (27 routes), e2e ✓ (21, via Edge).
- Visueel gecontroleerd: mobiel menu (screenshot 30), eerdere schermen ongewijzigd.
- Volgende stap: Sessie 10 — Productie-voorbereiding (code-kant).

### Sessie 10 — 2026-05-26  (laatste codesessie)
- Wat gedaan: productie-voorbereiding (code-kant).
  - **S3-storage-driver** achter de bestaande `StorageDriver`-interface (`@aws-sdk/client-s3`,
    lazy import, env-geschakeld via `STORAGE_DRIVER=s3`; lokaal blijft default). Werkt met AWS S3
    én S3-compatible (endpoint/path-style). Credentials via de AWS-provider-chain.
  - **Env-validatie** (`src/lib/env.ts`, Zod) die bij server-boot draait via
    `src/instrumentation.ts` — faalt helder bij ontbrekende/zwakke config (+ unit-tests).
  - **Security headers** (`next.config.mjs`): CSP (strenger in prod, dev-allowances voor HMR),
    nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy, HSTS.
  - **Robuustheid**: `/api/health` (publiek, DB-ping, geen datalek), nette `not-found.tsx` +
    `error.tsx`. `.env.example` uitgebreid met Postgres-switch + S3-vars.
- Tests: 104 unit-tests (env 3) + 21 e2e groen; health + headers geverifieerd (tijdelijke check).
  Reviewzwerm: CLEAN — S3-driver correct, health veilig publiek, CSP breekt prod niet, alleen
  /api/health toegevoegd aan publieke routes. Advies (bewuste trade-offs): CSP `script-src
  'unsafe-inline'` en JWT-staleness bij rol/status-wijziging → voor de menselijke securityreview.
- Checks: typecheck ✓, lint ✓, test ✓ (104), build ✓ (28 routes), e2e ✓ (21, via Edge).

---

## PROJECT COMPLEET (code-kant) — handover

Alle 10 sessies af. De volledige keten werkt end-to-end en is getest:
onboarding → profielen → opdrachten → reacties (match + compliance) → documenten/certificaten →
admin-verificatie → berichten/notificaties/samenwerkingen → facturatie/abonnement → admin-paneel,
met polish + productie-voorbereiding. **104 unit-tests + 21 Playwright-e2e groen**;
typecheck/lint/build groen; console schoon; mobiel + desktop geverifieerd.

### Nog te doen door een mens (NIET door een agent — bewust, zie CLAUDE.md):
1. **Productie-infra**: PostgreSQL provisionen (en `prisma/schema.prisma` datasource provider
   op `postgresql` zetten + migratie draaien), S3-bucket + IAM, mailprovider, domein/HTTPS,
   secrets (`AUTH_SECRET`, DB, AWS) via de hosting-secretstore, backups.
2. **Accounts & betaling**: echte betaalprovider koppelen (Stripe/Mollie) i.p.v. de mock-
   abonnementsflow; betaalmethoden/facturatie-juridisch.
3. **Security-/AVG-review vóór livegang met echte gevoelige documenten** (VOG/diploma's).
   Aandachtspunten uit de reviews: CSP `script-src 'unsafe-inline'` (overweeg nonce-pipeline),
   JWT-staleness bij schorsing/rol-wijziging (overweeg DB-statuscheck in `currentActor` of korte
   token-TTL), rate-limiting op auth/mutaties, pen-test.
4. **E-mail/notificaties**: in-app `Notification` bestaat; echte e-mail/push koppelen.

### Bekende, bewust uitgestelde code-punten (kandidaten voor later):
- Berichten-ongelezen telt per conversatie met een COUNT (prima voor nu; denormaliseren bij schaal).
- SQLite-zoek is hoofdlettergevoelig; op Postgres `mode: "insensitive"` aanzetten.
- Geen unieke index op (jobId, deelnemerspaar) voor conversaties (theoretische dubbel-race).

### Hardening — 2026-05-26 (geleerd van een parallelle Codex-bouw, selectief overgenomen)
- Aanleiding: vergelijking met een andere aanpak (Codex, branch `zzp-production-quality-control-system`).
  Niet klakkeloos overgenomen — alleen wat echt waarde toevoegt en binnen scope past.
- Toegepast (in-scope productie-hardening):
  - **CI/CD ontbrak volledig** → toegevoegd: `.github/workflows/ci.yml` (npm run check: lint +
    typecheck + test + build op elke push/PR) en `security.yml` (npm audit high/critical +
    secret-scan + env-doc-check, ook wekelijks).
  - **`npm run check`** als één commando (lint+typecheck+test+build).
  - **Security-scripts**: `scripts/scan-secrets.sh` (hoog-signaal secret-patronen + geen getrackte
    .env) en `scripts/check-env-docs.mjs` (elke gebruikte `process.env.X` staat in .env.example).
- Bewust NIET overgenomen (scope-creep / andere productrichting):
  - AI-governance-laag + Wet-DBA-risico-engine: krachtig domein-idee, maar nieuwe scope. **Aanbeveling
    aan eigenaar**: voor zzp-zorg is Wet-DBA-compliance (schijnzelfstandigheid: inbedding, directe
    aansturing, vervangbaarheid, terugkerende patronen) dé differentiator — overweeg dit als
    expliciete volgende epic, deterministic-first (regels beslissen, AI formuleert hooguit).
  - k6 load/stress + Sentry: zinvol, maar vragen infra/keuze van de eigenaar; genoteerd.
- Sterkten van deze build t.o.v. de vergeleken aanpak (ter info): echte auth (Auth.js + RBAC) en
  persistente DB + audit (Prisma) zijn hier wél gebouwd; docs (PROGRESS/CURRENT_TASK) lopen niet
  achter op de code. Checks: `npm run check` groen (104 unit + build); scan:secrets + check:env OK.

<!-- Kopieer dit blok voor elke nieuwe sessie -->
