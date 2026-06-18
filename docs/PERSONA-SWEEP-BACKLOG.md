# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-18 · **main-commit:** `c109961` (c109961bf345b175fb9b387a27e47b4e798d587a)
> **Methode:** productie-build (`npm run build`) + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`. Playwright met de
> gebundelde Chromium (`/opt/pw-browsers`) — msedge was niet beschikbaar in deze omgeving — per rol
> ingelogd (wachtwoord `demo1234`). Per pad vastgelegd: **HTTP-status**, **eind-URL** (detecteert
> redirects), **`<h1>`** en een **niet-gevonden/crash-marker** uit de body. Bewijs-screenshots (19
> stuks): `docs/persona-sweep-2026-06-18/`.
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local`, FRANCHISER `franchise@zzp-platform.local` (Femke /
> tenant "Zorgbemiddeling Noord"). Cross-party/-tenant-eigendom is tegen de seed-DB geverifieerd
> (IDs uitgelezen via Prisma), niet uit de UI afgeleid. De DB is ephemeer; geen enkele poging raakte
> productie.

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout), nooit een 500/crashpagina of stille toegang.

## Opgelost / gewijzigd sinds de vorige sweep (2026-06-17)

- **B1 (cross-role-crash) — blijft OPGELOST en opnieuw bevestigd.** FREELANCER → `/kandidaten`,
  `/bedrijf`; CLIENT → `/certificaten`, `/reacties`; ADMIN/FRANCHISER → `/kandidaten` geven allemaal
  een **schone redirect naar `/dashboard`** (geen crashpagina, geen `AuthorizationError` in de
  server-log — over de hele run **0 error-markers** in `/tmp/server.log`).
- **`/diensten` voor niet-FREELANCER — gedragswijziging, geen gat.** De vorige sweep noteerde een
  redirect naar `/dashboard`; deze run rendert `/diensten` voor CLIENT/ADMIN/FRANCHISER een nette
  **"Alleen voor ZZP'ers"**-empty-state (HTTP 200, `h1="Diensten"` uit de PageHeader). **Geen
  datalek**: `getDienstenForFreelancer` wordt alleen aangeroepen als `actor.role === "FREELANCER"`;
  de andere rollen zien enkel uitleg-tekst. Het is een bewuste vriendelijke rol-gate. Wel een lichte
  UX-inconsistentie t.o.v. de andere cross-rol-pagina's die hard naar `/dashboard` redirecten — als
  observatie genoteerd onder A1, geen security-actie.
- **`POST /api/billing/webhook` → 200 (was 307).** Geen gat: dit is het standaard Mollie-patroon.
  Lege/ongeldige body → no-op `200` (voorkomt retry-storm); mét een `id` wordt de betaalstatus
  **opgehaald bij de provider** (server-side waarheid) — de request-body bepaalt nooit de status, dus
  een ongeauthenticeerde POST kan geen abonnement activeren. Zie sectie B.

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's, 0 error-markers in de server-log). Alle pogingen tot
**privilege-escalatie**, **IDOR/cross-partij**, **cross-tenant**-toegang, **authz-keten omzeilen**,
**malicieuze input** en **robuustheid** werden correct geweigerd; geen enkel privé-document, vreemde
factuur, samenwerking, profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 42
  kernschermen over 4 rollen: alle 200, inhoud rendert (steekproef-`<h1>` bevestigt de doelpagina).
  Eén lage observatie (soft-404 → HTTP 200; plus de `/diensten`-gate-inconsistentie) blijft
  GEACCEPTEERD via ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** Adversariële paden (UI + API): alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's. Privé-document,
  vreemde factuur-PDF en vreemd DBA-dossier van een ander → **403**. Negatief tarief (`-50`) en een
  ~438-teken XSS-`headline` werden bij het profiel-opslaan **niet gepersisteerd** (server-side Zod +
  client-validatie), geen dialog, geen script in de DOM. Cron-eindpunten weigeren ongeauthenticeerd
  (`503` "niet geconfigureerd" in deze QA-omgeving; in productie met `CRON_SECRET` → 401 bij
  ontbrekende/foute bearer).

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's,
geen crashpagina's.

| Rol        | Geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                               | Resultaat |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, factuur-detail (`2026-0001`), diensten, rooster, inzicht, prognose, profiel/bewerken, documenten | 14/14 OK  |
| CLIENT     | dashboard, opdrachten, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, samenwerking-detail, opdrachten/nieuw, inzicht, bedrijf                                                              | 11/11 OK  |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, support, audit                                                                                                                   | 9/9 OK    |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie, eigen-tenant opdrachtgever-detail (Noorderbrug), eigen-tenant zzp-detail (Lars Bakker)                                                   | 8/8 OK    |

Steekproef-`<h1>` per scherm bevestigt dat de echte doelpagina rendert: FREELANCER-dashboard
`h1="Sanne de Vries"`, factuur-detail `h1="Factuur 2026-0001"`, samenwerking-detail
`h1="Verpleegkundige (detachering)"`; CLIENT-dashboard `h1="Mark Jansen"`, bedrijf
`h1="Zorgcentrum Jansen"`, betaalverplichtingen `h1="Betaalverplichtingen"`; ADMIN
`h1="Platform statistieken"`, `h1="DBA-monitor"`, `h1="Audit log"`; FRANCHISER eigen-tenant-detail
`h1="Verpleeghuis De Noorderbrug"` en `h1="Lars Bakker"`. Bewijs o.a. `freelancer-dashboard.png`,
`freelancer-factuur-detail.png`, `freelancer-collab-detail.png`, `client-kandidaten.png`,
`client-collab-detail.png`, `admin-verificaties.png`, `admin-statistieken.png`,
`franchiser-zzpers.png`, `franchiser-eigen-og.png`. De admin-verificatiewachtrij toont kaarten met
goedkeur-/afkeur-acties (afkeuren vereist een reden, server-side afgedwongen — niet gemuteerd in deze
run). De cascade-werkruimte (`/samenwerkingen/[id]`) toont de "aan zet"-keten met de juiste
status-/actieknoppen voor zowel een eigen ZZP'er-samenwerking als een eigen CLIENT-samenwerking.

### A1 — LAAG · Soft-404 + `/diensten`-gate-inconsistentie geven HTTP 200 — GEACCEPTEERD (ADR-0009)

> **Status: dicht, geen actie.** Twee waarnemingen die geen defect zijn:
>
> 1. **Soft-404 op detailroutes** geeft HTTP 200 i.p.v. 404. Bewust geaccepteerd in
>    `docs/decisions/0009-soft-404-auth-routes.md` (15-6): inherent App-Router-streaming-gedrag (de
>    async `(protected)/layout.tsx` + `loading.tsx`-Suspensegrenzen flushen de app-schil met 200 vóór
>    de pagina `notFound()` bereikt), geen datalek (ownership-/tenant-checks vóór render), achter login
>    (geen SEO-impact). De sweep toetst daarom de zichtbare niet-gevonden-marker i.p.v. de brosse
>    statuscode. Opnieuw waargenomen (bv. `/samenwerkingen/onzin-…`, `/opdrachten/onzin-…`,
>    `/franchise/opdrachtgevers/junk-…` → status 200 + "Niet gevonden"-marker), als verwacht.
> 2. **`/diensten` voor niet-FREELANCER** rendert een vriendelijke "Alleen voor ZZP'ers"-empty-state
>    (200) i.p.v. de middleware-redirect naar `/dashboard` die andere cross-rol-pagina's tonen. Geen
>    datalek (zie boven). Puur een UX-inconsistentie; geen security-actie nodig. Eventueel later
>    harmoniseren (alle cross-rol-toegang óf vriendelijke gate óf redirect), als opruim-item.

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Hieronder wat is geprobeerd en hoe het correct werd geweigerd.

### Wat correct werd geweigerd (geen gaten)

- **Privilege-escalatie (cross-rol):** FREELANCER/CLIENT/FRANCHISER op `/admin/*`
  (`/admin/gebruikers`, `/admin/verificaties`, `/admin/facturatie`) → schone **redirect naar
  `/dashboard`** (middleware `isAdminPath`). ADMIN op `/franchise/opdrachtgevers` → redirect
  (`isFranchisePath`). FREELANCER op `/franchise/zzpers`, CLIENT op `/franchise/opdrachtgevers` →
  redirect. Bewijs: `ADV-freelancer-admin-gebruikers.png`.
- **Cross-rol pagina's buiten `/admin` & `/franchise`:** FREELANCER → `/kandidaten`, `/bedrijf`;
  CLIENT → `/certificaten`, `/reacties`; ADMIN/FRANCHISER → `/kandidaten` → allemaal **schone
  redirect naar `/dashboard`** (geen crashpagina, geen error-log). FREELANCER → `/verplichtingen`
  redirect naar `/administratie` (rol-eigen boekhouding), geen leak. Bewijs:
  `ADV-freelancer-kandidaten.png`, `ADV-client-certificaten.png`.
- **IDOR / cross-partij (UI):** FREELANCER (Sanne) op andermans samenwerking (`…z00053…`,
  emma+ZorgGroep) en andermans factuur (`…sk521ywk`, bram/datic, PAID) → **geweigerd** ("Niet
  gevonden / geen toegang", `h1` leeg, geen secret zichtbaar). CLIENT (Mark) op een samenwerking van
  een andere opdrachtgever (`…6hgejrjm`, Datic) en op zowel een PAID- als een DRAFT-factuur van een
  andere OG → **geweigerd**. Bewijs: `ADV-freelancer-othercollab.png`, `ADV-client-othercollab.png`.
- **Authz-keten omzeilen (privé-bestanden & API-mutatie/-export):**
  - FREELANCER op `GET /api/documents/<youssef-doc>` (privé-document van een andere ZZP'er) → **403**.
  - FREELANCER & CLIENT op `GET /api/facturen/<andermans-factuur>/pdf` → **403** (eigen factuur-pdf →
    **200**, dus de gate is niet "alles dicht" maar correct op ownership).
  - FREELANCER & CLIENT op `GET /api/samenwerkingen/<andermans-collab>/dossier` → **403**.
  - Cron-eindpunten ongeauthenticeerd: `POST /api/tasks/run-all`, `/expiry`, `/payment-reminders` →
    **503** (`CRON_SECRET` is in deze QA-omgeving niet gezet; in productie met secret → 401 bij
    ontbrekende/foute bearer; geen ongeautoriseerde uitvoering, geen 200).
  - `POST /api/push/subscribe` (ongeldige body) → **400** (Zod-weigering, geen verwerking).
  - `POST /api/billing/webhook` (lege body, ingelogde CLIENT) → **200 no-op**. Geen gat: standaard
    Mollie-webhook-patroon — de request-body draagt alleen een `id`, de **betaalstatus wordt
    server-side bij de provider opgehaald** (`getPaymentProvider().paymentStatus`), nooit uit de
    request vertrouwd; zonder geldige `providerRef`-match gebeurt er niets. De 200 voorkomt een
    retry-storm. Code: `src/app/api/billing/webhook/route.ts`.
- **Cross-tenant (franchiser):** FRANCHISER "Noord" op een opdrachtgever **buiten** de eigen tenant
  (`Zorgcentrum Jansen`, tenant `null`) en op een ZZP'er buiten de eigen tenant (`Sanne de Vries`,
  tenant `null`) → **geweigerd** (status 200 + lege `h1` + "geen toegang"-marker, geen secret
  zichtbaar). Op een samenwerking buiten de eigen tenant (`…qzpl11cu`) → **404**. De eigen-tenant
  opdrachtgever (Noorderbrug) en ZZP'er (Lars Bakker) openen wél — correct. Bewijs:
  `ADV-franchiser-crosstenant-og.png`, `ADV-franchiser-crosstenant-zzp.png`, `franchiser-eigen-og.png`.
- **Verboden statusovergangen / mutatie zonder ownership:** de cascade-mutaties (uren/factuur
  goedkeuren-afkeuren, betaling markeren) zitten op `/samenwerkingen/[id]`, die voor een
  niet-eigenaar al **niet rendert** (notFound) — de server-action-knoppen zijn dus niet bereikbaar, en
  de command-laag dwingt ownership + `assertTransition` af. Geen losse REST-mutatie-endpoints om te
  forceren (server-actions met versleutelde action-id's). Geen poging slaagde.
- **Malicieuze input:** FREELANCER op `/profiel/bewerken` met `hourlyRate = -50` en een
  `headline` van `<script>alert(document.cookie)</script>` + 400 tekens → **niet gepersisteerd**
  (na herladen: tarief nog `52`, headline-lengte nog `35`; de update werd geweigerd), **geen dialog**
  en **geen ruw script** in de DOM op het dashboard. Server-side Zod (`freelancerProfileSchema`) +
  client-validatie houden beide stand.
- **Robuustheid (onzin-/injectie-id's & onbekende routes):** `/this-route-does-not-exist-zzz` →
  **404**, `/admin/verificaties/junk-…` → **404**, `/franchise/samenwerkingen/junk-…` → **404**.
  `/samenwerkingen/onzin-…`, `/opdrachten/onzin-…`, `/franchise/opdrachtgevers/junk-…` → soft-404
  (status 200 + "Niet gevonden"-marker, A1). **Geen enkele 500. 0 error-markers in de server-log over
  de hele run.**

---

## Methodenoot

Statusbepaling adversarieel: per pad de **HTTP-status**, de **uiteindelijke URL** (detecteert
redirects) en de **body-marker** (`Niet gevonden|geen toegang|Er ging iets mis`) vastgelegd
(onderscheidt een gerenderde doelpagina van een weigerings-/crash-state); voor de API-paden de
ruwe HTTP-status via Playwright's `APIRequestContext` met de ingelogde sessie-cookies. Een pad telt
als "gat" bij een 500, een zichtbaar secret van een andere partij, een crashpagina, of stille toegang
tot een verboden route — niets daarvan trad op. Eigendoms-claims (welke factuur/samenwerking/company
van wie is, en in welke tenant) zijn tegen de seed-DB geverifieerd (Prisma-uitlezing). De DB is
ephemeer (`qa.db`); geen poging raakte productie.
