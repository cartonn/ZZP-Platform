# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-21 · **main-commit:** `a4c416f` (a4c416f69357dd52a3464b5f6cabb49496bfc180)
> **Methode:** productie-build (`npm run build`) + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-secret-…`. Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194`, expliciete `executablePath`) — per rol ingelogd
> (wachtwoord `demo1234`). Per pad vastgelegd: **HTTP-status**, **eind-URL** (detecteert redirects),
> **`<h1>`** en de gerenderde `main`-tekst (detecteert leak vs. weigering) + een crash-marker. Voor
> de adversariële API-paden is de respons-body uitgelezen. Cross-party/-tenant-eigendom is tegen de
> seed-DB geverifieerd (IDs uitgelezen via Prisma), niet uit de UI geraden; non-persistentie van
> malicieuze input is **tegen de DB** geverifieerd (autoritatief). De DB is ephemeer; geen enkele
> poging raakte productie.
> Bewijs-screenshots: `docs/persona-sweep-2026-06-21/` (15 stuks, incl. cross-tenant- en
> malicieuze-input-weigeringen) + `results.json` (volledige padmatrix: 47 functionele + 40
> adversariële probes).
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local`, FRANCHISER `franchise@zzp-platform.local` (Femke /
> tenant "Zorgbemiddeling Noord").

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout/notFound), nooit een 500/crashpagina of stille toegang.

## Opgelost / gewijzigd sinds de vorige sweep (2026-06-20)

- **Geen nieuwe regressies; alle eerder bevestigde poorten houden stand.** De vorige sweep (20-6,
  commit `0a1146e`) vond geen gaten. Deze run draaide tegen `a4c416f` (o.a. de nieuwe
  `routine: stale-dispuut-escalatie-reminder` #466 en tussenliggende merges) en herbevestigt de
  isolatie- en authz-poorten op de actuele `main`.
- **Methodische correctie t.o.v. eerdere runs — de franchise-detailroutes nemen een
  _company-id_ resp. _profile-id_, geen _user-id_.** Een eerdere cross-tenant-poging via de **user-id**
  gaf altijd "Niet gevonden" (ongeacht tenant), wat een vals-positief gevoel van isolatie kan geven.
  Deze run is opnieuw uitgevoerd met de **correcte id-typen** uitgelezen uit de echte navlinks
  (`/franchise/opdrachtgevers/<companyId>`, `/franchise/zzpers/<profileId>`): de eigen-tenant-entiteit
  rendert volledig (Verpleeghuis De Noorderbrug / Lars Bakker) en de **default-tenant**-entiteit
  (Zorgcentrum Jansen via companyId, Sanne via profileId) geeft **"Niet gevonden / geen toegang"** —
  dat bewijst de `tenantScopeWhere(actor)`-poort, niet een toevallig mismatchende id. Bewijs:
  `franchiser-eigen-company.png`, `franchiser-eigen-zzp.png`,
  `ADV-franchiser-crosstenant-company-denied.png`, `ADV-franchiser-crosstenant-zzp-denied.png`.

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's, **0 error-markers** in de server-log over de hele run).
Alle pogingen tot **privilege-escalatie**, **IDOR/cross-partij**, **cross-tenant**-toegang,
**authz-keten omzeilen**, **malicieuze input** en **robuustheid** werden correct geweigerd; geen
enkel privé-document, vreemde factuur, samenwerking, profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 47
  kernschermen over 4 rollen: alle 200, inhoud rendert (steekproef-`<h1>` bevestigt de doelpagina).
  Eén lage observatie (protected soft-404 → HTTP 200) blijft GEACCEPTEERD via ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** Adversariële paden (UI + API): alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's. Privé-document van
  een ander → **403** (eigenaar → 200 PDF); cross-tenant entiteit → "Niet gevonden" zonder datalek;
  DBA-dossier van een vreemde samenwerking → **403**; rolvreemde CSV-export → **403**; negatief tarief
  (`-50`), `maxTravelMinutes=-999` en een ~360-teken XSS-`headline` (incl. `<script>` en `onerror`)
  werden bij het profiel-opslaan **niet gepersisteerd** (geverifieerd tegen de DB), geen
  script-uitvoering, geen rauwe `<script>` in de HTML, geen dialog. Cron-eindpunten weigeren
  ongeauthenticeerd.

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's,
geen crashpagina's. (Twee probes — `/samenwerkingen/collab-1` en `/admin/import` — sloegen in de
`networkidle`-wachtstap aan op een time-out, maar renderden wél volledig: hun `<h1>`
respectievelijk "Verpleegkundige (detachering)" en "Onboarding importeren" werd gecaptured. Dat is een
testharnas-artefact, geen defect.)

| Rol        | Geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                                                                                              | Resultaat |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, opdracht-detail (`job-1`), samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, factuur-detail (`2026-0001`), diensten, rooster, inzicht, prognose, profiel/bewerken, documenten, notificaties, account/notificaties | 17/17 OK  |
| CLIENT     | dashboard, opdrachten, opdrachten/nieuw, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, bedrijf, inzicht, administratie                                                                                                                                   | 11/11 OK  |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, support, audit, configuratie, import                                                                                                                                                            | 11/11 OK  |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie + eigen-tenant detail (opdrachtgever Noorderbrug via companyId, ZZP'er Lars Bakker via profileId)                                                                                                        | 8/8 OK    |

Steekproef-`<h1>`/`main`-tekst per scherm bevestigt dat de echte doelpagina rendert: FREELANCER-
dashboard `h1="Sanne de Vries"`, factuur-detail `h1="Factuur 2026-0001"`; CLIENT-dashboard
`h1="Mark Jansen"`, verplichtingen `h1="Betaalverplichtingen"`; ADMIN `h1="Platform statistieken"`;
FRANCHISER eigen-tenant-detail toont `Verpleeghuis De Noorderbrug` (met afdelingen) en `Lars Bakker`
(inzetbaarheid/beschikbaarheid/documenten). Bewijs o.a. `freelancer-dashboard.png`,
`client-dashboard.png`, `client-kandidaten.png`, `admin-verificaties.png`, `admin-statistieken.png`,
`franchiser-opdrachtgevers.png`, `franchiser-eigen-company.png`, `franchiser-eigen-zzp.png`.

**Geen functionele defecten gevonden.** Eén lage observatie (geen actie):

- **A1 — protected soft-404 geeft HTTP 200 i.p.v. 404 (GEACCEPTEERD, ADR-0009).** Detailroutes met
  een onbekend/vreemd/cross-partij/cross-tenant id (`/samenwerkingen/<x>`, `/facturen/<x>`,
  `/opdrachten/<x>`, `/franchise/.../<x>`) renderen een nette **"Niet gevonden — Dit item bestaat
  niet (meer) of je hebt er geen toegang toe"**-staat binnen de app-layout, met **HTTP 200**. De
  root-`not-found` (volledig onbekende route, bv. `/this-route-does-not-exist`, `/admin/nope`,
  `/franchise/nope`, `/zzp/<onzin>`) geeft wél een **echte 404**. Semantisch zou 404 zuiverder zijn
  voor de detail-soft-404's, maar er lekt geen data en de toegang wordt geweigerd — bewust
  geaccepteerd (zie `docs/decisions/0009-soft-404-auth-routes.md`).

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Onderstaand wat is geprobeerd en het (correcte) resultaat.

### Privilege-escalatie — alle geweigerd

| Poging                                                                                  | Resultaat                                             |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| FREELANCER → `/admin/verificaties`, `/admin/gebruikers`                                 | redirect → `/dashboard` (200)                         |
| FREELANCER → `/kandidaten` (CLIENT), `/franchise/opdrachtgevers`                        | redirect → `/dashboard` (200)                         |
| FREELANCER → `/verplichtingen` (CLIENT)                                                 | redirect → `/administratie` (rol-gepaste boekhouding) |
| CLIENT → `/admin/verificaties`, `/admin/no-shows`, `/franchise/zzpers`                  | redirect → `/dashboard` (200)                         |
| CLIENT → `/certificaten` (FREELANCER)                                                   | redirect → `/dashboard`                               |
| CLIENT → `/prognose` (FREELANCER)                                                       | redirect → `/administratie`                           |
| FRANCHISER → `/admin/verificaties`, `/admin/gebruikers`, `/certificaten`, `/kandidaten` | redirect → `/dashboard` (200)                         |

Geen enkele rol-vreemde pagina rendert; geen `AuthorizationError` in de server-log (0 markers).

### IDOR / cross-partij — alle geweigerd, geen leak

- FREELANCER (Sanne) → `/samenwerkingen/<andermans collab>` (emma/ZorgGroep) en
  `/facturen/<andermans factuur>` (emma, PAID) → **"Niet gevonden / geen toegang"** (gecontroleerd in
  de `main`-inhoud: alleen de not-found-tekst, geen enkel veld van de andere partij).
- CLIENT (Mark) → dezelfde vreemde collab/factuur → idem geweigerd, geen leak.
- FREELANCER → `/opdrachten/job-7` (een **DRAFT**-opdracht van Zorgcentrum Jansen) → "Niet gevonden"
  (concepten zijn niet zichtbaar voor anderen).
- Onzin-id op een detailroute (`/samenwerkingen/onzin-id-xyz`) → "Niet gevonden", geen 500.

### Cross-tenant — alle geweigerd, geen leak

- FRANCHISER (Noord) → `/franchise/opdrachtgevers/<default-tenant companyId>` (Zorgcentrum Jansen) en
  `/franchise/zzpers/<default-tenant profileId>` (Sanne) → **"Niet gevonden / geen toegang"**. De
  eigen-tenant-controle (Verpleeghuis De Noorderbrug / Lars Bakker) rendert wél volledig → het
  verschil is de `tenantScopeWhere(actor)`-poort, niet een mismatchende id (deze run gebruikte
  bewust de **correcte id-typen**, uitgelezen uit de echte navlinks — zie de methodische correctie
  hierboven).
- CLIENT (default-tenant) → `/zzp/<Noord-gebonden profileId>` → **echte 404**
  (`tenantEntityVisibleTo` weigert cross-tenant tenant-gebonden profielen). FREELANCER (Sanne) → idem
  → 404.

### Document-privacy — correct

- Niet-eigenaar (CLIENT én andere FREELANCER) → `GET /api/documents/<andermans doc>` → **403**
  `{"error":"Geen toegang."}`.
- Eigenaar → `GET /api/documents/<eigen doc>` → **200** `application/pdf` (`%PDF-1.7…`).
- Ongeauthenticeerd → `GET /api/documents/<id>` → **307** → `/login` (nooit zonder sessie geserveerd).

### Authz-keten omzeilen / verboden mutatie

- De cross-partij/cross-tenant detailpagina's weigeren al op leesniveau ("Niet gevonden"), zodat de
  mutatie-knoppen (uren/factuur goedkeuren/afkeuren, betaling markeren) nooit worden gerenderd voor
  een niet-eigenaar.
- **DBA-dossier-export van een vreemde samenwerking:** FREELANCER → `GET
/api/samenwerkingen/<andermans collab>/dba-dossier` → **403** `{"error":"Geen toegang."}` (de
  ownership-poort zit óók op de API-route, niet alleen op de pagina).
- **Rolvreemde CSV-export:** FREELANCER → `GET /verplichtingen/export` (CLIENT-route) → **403**
  `{"error":"Niet toegestaan"}`; CLIENT → `GET /prognose/export` (FREELANCER-route) → **403**. De
  rol-poort zit op de exportroutes zelf, niet alleen op de UI-knop.

### Malicieuze / ongeldige input — server-side geweigerd

Profiel-opslaan (`/profiel/bewerken`) met (na het client-side wegnemen van `maxlength`/`min`):
`headline` = `"><img src=x onerror=window.__pwned=1><script>window.__pwned=1</script>` + 300× `X`,
`hourlyRate` = `-50`, `maxTravelMinutes` = `-999`:

- **Niets gepersisteerd** — geverifieerd **tegen de DB** (autoritatief): na de poging staan
  `headline = "Verpleegkundige (BIG-geregistreerd)"`, `hourlyRate = 52`, `maxTravelMinutes = null`
  ongewijzigd. Server-side Zod-validatie houdt stand.
- **Geen XSS:** `window.__pwned` blijft `false`, geen dialog, geen rauwe
  `window.__pwned=1</script>` in de uitgeleverde HTML.
- Geen 500/crash. Bewijs: `ADV-profiel-malicious-input.png`.

### Robuustheid — geen 500's

- Onzin-id's op detailroutes → "Niet gevonden" soft-404 (200, zie A1); volledig onbekende routes
  (`/this-route-does-not-exist`, `/admin/nope`, `/franchise/nope`, `/zzp/<onzin>`,
  `/admin/gebruikers/<onzin>`) → **echte 404**.
- Beschermde pagina's zonder cookie (`/dashboard`) → **307/redirect** → `/login?callbackUrl=…`.
- **Over de hele run: 0 HTTP-500's en 0 error-markers in de server-log.**

### Authenticatie van cron/webhook

- `POST /api/tasks/run-all` zonder bearer → **503** "Taak-endpoint niet geconfigureerd" (in deze
  QA-omgeving zonder `CRON_SECRET`; in productie mét secret → 401 bij ontbrekende/foute bearer). Geen
  ongeauthenticeerde taakuitvoering.
- `POST /api/billing/webhook` (lege body, ongeauthenticeerd) → **307** → `/login` (no-op; de
  request-body bepaalt de betaalstatus nooit — die wordt server-side bij de provider opgehaald). Lage
  observatie, geen actie.
