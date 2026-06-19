# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-19 · **main-commit:** `0a1146e` (0a1146e — "feat(ui): naam-hero 2 tinten
> lichter op bedrijfs- en bemiddeling-hub (#459)")
> **Methode:** productie-build (`npm run build`) + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`. Playwright met de
> gebundelde Chromium (`/opt/pw-browsers/chromium-1194`) — `chrome-headless-shell` matchte de
> nieuw geïnstalleerde Playwright-versie niet en `cdn.playwright.dev` staat niet in de
> netwerk-allowlist, dus de pre-geïnstalleerde Chromium is via `executablePath` gebruikt. Per rol
> ingelogd (wachtwoord `demo1234`). Per pad vastgelegd: **HTTP-status**, **eind-URL** (detecteert
> redirects), **`<h1>`** en een **niet-gevonden/crash-marker** uit de body; voor API-paden de ruwe
> status (deels met `maxRedirects:0` om een auth-redirect te onderscheiden van een 200-loginpagina).
> Bewijs-screenshots (11 stuks): `docs/persona-sweep-2026-06-19/`.
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local`, FRANCHISER `franchise@zzp-platform.local` (Femke /
> tenant "Zorgbemiddeling Noord"). Cross-party/-tenant-eigendom is tegen de seed-DB geverifieerd
> (IDs uitgelezen via Prisma), niet uit de UI afgeleid. De DB is ephemeer; geen enkele poging raakte
> productie.

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout), nooit een 500/crashpagina of stille toegang.

## Opgelost / gewijzigd sinds de vorige sweep (2026-06-18)

- **Geen nieuwe defecten en geen regressies.** De vorige sweep meldde "geen gaten"; deze run
  bevestigt dat opnieuw over een bredere set schermen (64 functionele schermen i.p.v. 42) en een
  uitgebreidere adversariële set (o.a. prestatie-PDF-IDOR, privé-media-IDOR, admin-only exports per
  verkeerde rol, anonieme API-toegang met `maxRedirects:0`).
- **`POST /api/push/subscribe` ongeauthenticeerd → 307 → `/login`** (was in de 06-18-sweep als
  "400 Zod-weigering" genoteerd). Geen tegenstrijdigheid: de 06-18-run testte dit **ingelogd** met
  een lege body (→ 400 ná de auth-check); deze run testte **anoniem** (→ middleware-redirect naar
  login vóór de route). Beide zijn correcte weigeringen; geen ongeauthenticeerde verwerking.
- **Operationele noot (geen repo-defect):** een verse container-checkout had een `node_modules` die
  niet synchroon liep met `package.json` (o.a. `web-push@^3.6.7` ontbrak → `npm run build` faalde
  met "Module not found: 'web-push'"). `npm install` (21 toegevoegd, 15 verwijderd, 20 gewijzigd)
  loste dit op en de build werd groen. De dependency staat correct in `package.json`; dit is dus een
  staleness-artefact van de ephemere omgeving, niet een fout in de repo. CI (`npm ci`) raakt dit
  niet. Wél het vermelden waard zodat een volgende run weet: bij een build-fout op een ontbrekende
  module éérst `npm install` draaien.

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's, **0 error-markers in de server-log over de hele run**).
Alle pogingen tot **privilege-escalatie**, **IDOR/cross-partij**, **cross-tenant**-toegang,
**authz-keten omzeilen**, **malicieuze input** en **robuustheid** werden correct geweigerd; geen
enkel privé-document, vreemde factuur/PDF, samenwerking, profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 64
  kernschermen over 4 rollen: alle 200, inhoud rendert (steekproef-`<h1>` bevestigt de doelpagina).
  Eén lage observatie (soft-404 → HTTP 200) blijft GEACCEPTEERD via ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** Adversariële paden (UI + API): alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's. Privé-document,
  vreemde factuur-PDF, vreemde prestatie-PDF, privé-media en vreemd DBA-dossier van een ander → **403
  of 404**. Admin-only exports voor een niet-admin → **403**. Negatief tarief (`-50`) en een
  ~420-teken XSS-`headline` werden bij het profiel-opslaan **niet gepersisteerd** (server-side Zod +
  client-validatie), geen dialog, geen script in de DOM. Cron-eindpunten weigeren ongeauthenticeerd.

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; **alle 64 gaven HTTP 200 met echte inhoud, geen
500's, geen crashpagina's**.

| Rol        | Aantal geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                                                                                                          | Resultaat |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, factuur-detail (`2026-0001`), diensten, rooster, inzicht, prognose, profiel, profiel/bewerken, documenten, berichten, beschikbaarheid, academie, administratie (+ favorieten-gate) | 20/20 OK  |
| CLIENT     | dashboard, opdrachten, opdrachten/nieuw, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, samenwerking-detail (eigen ×2), inzicht, bedrijf, bedrijf/bewerken, opdracht-detail (`job-1`), berichten                                                                             | 15/15 OK  |
| ADMIN      | dashboard, verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, support, audit, financien, configuratie, samenwerkingen, opdrachten, franchises, import, avg, bewaking                                                                                                  | 18/18 OK  |
| FRANCHISER | dashboard, opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie, instellingen, shift-overnames, eigen-tenant opdrachtgever-detail (Noorderbrug), eigen-tenant zzp-detail (Lars Bakker)                                                                                           | 11/11 OK  |

Steekproef-`<h1>` per scherm bevestigt dat de echte doelpagina rendert: FREELANCER-dashboard
`h1="Sanne de Vries"`, factuur-detail `h1="Factuur 2026-0001"`, samenwerking-detail
`h1="Verpleegkundige (detachering)"`, prognose `h1="Inkomstenprognose"`, administratie
`h1="Boekhouding"`; CLIENT-dashboard `h1="Mark Jansen"`, bedrijf `h1="Zorgcentrum Jansen"`,
betaalverplichtingen `h1="Betaalverplichtingen"`, samenwerking-detail eigen tweede
`h1="Scrum Master"`; ADMIN `h1="Platform statistieken"`, `h1="DBA-monitor"`, `h1="Audit log"`,
`h1="Verwerkingsregister"` (avg), `h1="Platform-bewaking"` (bewaking); FRANCHISER eigen-tenant-detail
`h1="Verpleeghuis De Noorderbrug"` en `h1="Lars Bakker"`. Bewijs o.a. `freelancer-dashboard.png`,
`client-dashboard.png`, `admin-dashboard.png`, `franchiser-dashboard.png`. De cascade-werkruimte
(`/samenwerkingen/[id]`) toont de "aan zet"-keten met de juiste status-/actieknoppen voor zowel een
eigen ZZP'er-samenwerking als een eigen CLIENT-samenwerking.

### A1 — LAAG · Soft-404 op detailroutes geeft HTTP 200 — GEACCEPTEERD (ADR-0009)

> **Status: dicht, geen actie.** Soft-404 op detailroutes geeft HTTP 200 i.p.v. 404. Bewust
> geaccepteerd in `docs/decisions/0009-soft-404-auth-routes.md` (15-6): inherent
> App-Router-streaming-gedrag (de async `(protected)/layout.tsx` + `loading.tsx`-Suspensegrenzen
> flushen de app-schil met 200 vóór de pagina `notFound()` bereikt), geen datalek
> (ownership-/tenant-checks vóór render), achter login (geen SEO-impact). De sweep toetst daarom de
> zichtbare niet-gevonden-marker i.p.v. de brosse statuscode. Opnieuw waargenomen voor de juiste rol
> (FRANCHISER op `/franchise/opdrachtgevers/junk`, `/franchise/zzpers/junk-xyz`,
> `/franchise/diensten/junk-xyz`, `/franchise/leads/junk-xyz` → status 200 + "Niet gevonden"-marker,
> geen crash), als verwacht.

> **Geen defect, ter info — `/favorieten` is CLIENT-only.** FREELANCER → `/favorieten` redirect naar
> `/dashboard` (de pagina is `requireRole("CLIENT")` — het is de flexpool van de opdrachtgever). Net
> als andere cross-rol-toegang een schone weigering, geen leak.

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Hieronder wat is geprobeerd en hoe het correct werd geweigerd.

### Wat correct werd geweigerd (geen gaten)

- **Privilege-escalatie (cross-rol):** FREELANCER/CLIENT/FRANCHISER op `/admin/*`
  (`/admin/gebruikers`, `/admin/verificaties`, `/admin/facturatie`, `/admin/disputen`) → schone
  **redirect naar `/dashboard`** (middleware `isAdminPath`). ADMIN op `/franchise/opdrachtgevers` →
  redirect (`isFranchisePath`). FREELANCER op `/franchise/zzpers`, CLIENT op
  `/franchise/opdrachtgevers`, FRANCHISER op `/kandidaten` → redirect. Cross-rol pagina's buiten
  `/admin`/`/franchise`: FREELANCER → `/kandidaten`, `/bedrijf`; CLIENT → `/certificaten`,
  `/reacties` → allemaal **schone redirect naar `/dashboard`**. Bewijs:
  `ADV-freelancer-admin-gebruikers.png`, `ADV-freelancer-kandidaten.png`, `ADV-client-certificaten.png`.
- **IDOR / cross-partij (UI):** FREELANCER (Sanne) op andermans samenwerking (emma/ZorgGroep),
  andermans factuur (bram/Datic, PAID) en een samenwerking van een andere opdrachtgever
  (nadia/Jansen) → **geweigerd** ("Niet gevonden / geen toegang", geen secret zichtbaar). CLIENT
  (Mark) op een samenwerking van een andere opdrachtgever (Datic) en op zowel een PAID- als een
  DRAFT-factuur van een andere OG → **geweigerd**. Bewijs: `ADV-freelancer-othercollab.png`,
  `ADV-client-othercollab.png`.
- **Authz-keten omzeilen (privé-bestanden, PDF's & API-export):**
  - FREELANCER op `GET /api/documents/<youssef-doc>` (privé-document andere ZZP'er) → **403**.
  - FREELANCER & CLIENT op `GET /api/facturen/<andermans-factuur>/pdf` → **403** (eigen factuur-pdf →
    **200**, dus de gate is ownership-gebaseerd, niet "alles dicht").
  - FREELANCER & CLIENT op `GET /api/prestaties/<andermans-prestatie>/pdf` → **403** (eigen
    prestatie-pdf → **200**).
  - FREELANCER & CLIENT op `GET /api/samenwerkingen/<andermans-collab>/dossier` en
    `/dba-dossier` → **403**.
  - FREELANCER op `GET /api/media/<andermans-storage-key>` (privé-opslag van een andere ZZP'er) →
    **404** (geen leak; eigen key → 404 omdat het seed-bestand niet fysiek op schijf staat in deze
    QA-omgeving — geen security-implicatie).
  - FREELANCER & CLIENT op `GET /api/admin/export/invoices` (admin-only) → **403**.
  - Cron-eindpunten ongeauthenticeerd: `POST /api/tasks/run-all`, `/expiry`,
    `/payment-reminders` → **503** (`CRON_SECRET` is in deze QA-omgeving niet gezet; de route
    weigert vóór elke uitvoering met `503 "Taak-endpoint niet geconfigureerd."`; in productie met
    secret → **401** bij ontbrekende/foute bearer — zie `src/app/api/tasks/run-all/route.ts`). Geen
    ongeautoriseerde uitvoering, geen 200.
  - `POST /api/push/subscribe` **anoniem** → **307 → `/login`** (middleware). Ingelogd met ongeldige
    body → **400** (Zod). Het abonnement bindt server-side altijd aan de ingelogde actor, nooit aan
    een meegestuurde `userId` (`src/app/api/push/subscribe/route.ts`).
  - Anonieme GET op `/api/administratie/{export,btw,openstaand}`, `/api/account/export`,
    `/api/agenda`, `/api/admin/facturatie/x/pdf` → allemaal **307 → `/login`** (geen 200, geen 500).
- **Cross-tenant (franchiser):** FRANCHISER "Noord" op een opdrachtgever **buiten** de eigen tenant
  (`Zorgcentrum Jansen`, tenant `null`) en op een ZZP'er buiten de eigen tenant (`Sanne de Vries`,
  tenant `null`) → **geweigerd** (200 + "geen toegang"-marker, geen secret zichtbaar). Op een
  samenwerking buiten de eigen tenant → **404**. De eigen-tenant opdrachtgever (Noorderbrug) en
  ZZP'er (Lars Bakker) openen wél — correct. Bewijs: `ADV-franchiser-crosstenant-og.png`,
  `ADV-franchiser-crosstenant-zzp.png`.
- **Verboden statusovergangen / mutatie zonder ownership:** de cascade-mutaties (uren/factuur
  goedkeuren-afkeuren, betaling markeren) zitten op `/samenwerkingen/[id]`, die voor een
  niet-eigenaar al **niet rendert** (notFound) — de server-action-knoppen zijn dus onbereikbaar, en
  de command-laag dwingt ownership + `assertTransition` af. Geen losse REST-mutatie-endpoints om te
  forceren (server-actions met versleutelde action-id's). Geen poging slaagde.
- **Malicieuze input:** FREELANCER op `/profiel/bewerken` met `hourlyRate = -50` en een
  `headline` van `<script>…</script>` + ~420 tekens → **niet gepersisteerd** (na herladen: tarief
  nog `52`; de update werd geweigerd), **geen dialog** en **geen ruw script** dat uitvoert
  (`window.__pwnd`/document.title ongewijzigd) op het dashboard. Server-side Zod
  (`freelancerProfileSchema`) + client-validatie houden beide stand. De CSV-import-pagina
  (`/diensten/importeer`) laadt schoon (200, geen crash).
- **Robuustheid (onzin-/injectie-id's & onbekende routes):** `/this-route-does-not-exist-zzz` →
  **404**, `/admin/verificaties/junk-id-12345` → **404**. `/samenwerkingen/onzin-xyz`,
  `/opdrachten/onzin-xyz`, `/facturen/onzin-xyz` → soft-404 (status 200 + "Niet gevonden"-marker,
  A1). **Geen enkele 500. 0 error-markers in de server-log over de hele run.**

---

## Methodenoot

Statusbepaling adversarieel: per UI-pad de **HTTP-status**, de **uiteindelijke URL** (detecteert
redirects) en de **body-marker** (`Niet gevonden|geen toegang|Pagina niet`) vastgelegd (onderscheidt
een gerenderde doelpagina van een weigerings-/crash-state); voor de API-paden de ruwe HTTP-status via
Playwright's `APIRequestContext` met de ingelogde sessie-cookies — en voor de anonieme paden met
`maxRedirects:0`, zodat een middleware-redirect naar `/login` als **307** zichtbaar is i.p.v. als een
gevolgde 200-loginpagina (dat laatste leverde in pass 1 een vals-positief op voor `push/subscribe`,
vandaar de herhaling met `maxRedirects:0`). Een pad telt als "gat" bij een 500, een zichtbaar secret
van een andere partij, een crashpagina, of stille toegang tot een verboden route — niets daarvan trad
op. Eigendoms-claims (welke factuur/samenwerking/company van wie is, en in welke tenant) zijn tegen de
seed-DB geverifieerd (Prisma-uitlezing). De DB is ephemeer (`qa.db`); geen poging raakte productie.
