# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-22 · **main-commit:** `55014b7` (55014b7a0d23f106500935dd82c325a8525da89a)
> **Methode:** verse `npm install` (node_modules ontbrak in de container) → productie-build
> (`npm run build`) + idempotente demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`);
> productie-server (`CI=true npm run start`) met `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`, `AUTH_SECRET=ci-dummy-secret-…`. Playwright met de vooraf-geïnstalleerde
> Chromium (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, expliciete `executablePath`) — per
> rol ingelogd (wachtwoord `demo1234`). Per pad vastgelegd: **HTTP-status**, **eind-URL** (detecteert
> redirects), **`<h1>`** en de gerenderde `main`-tekst (detecteert leak vs. weigering) + een
> crash-marker over zowel de `main`-tekst als de volledige HTML. Voor de adversariële API-paden is de
> respons-body uitgelezen (PDF-magic, ICS-magic of JSON-foutmelding). Cross-party/-tenant-eigendom is
> tegen de seed-DB geverifieerd (IDs uitgelezen via Prisma, niet uit de UI geraden). De XSS-payloads
> zijn náást statuscontrole ook op **rauwe reflectie in de HTML** én **scriptuitvoering**
> (`window.__x` + dialog-listener) gecontroleerd. De DB is ephemeer; geen enkele poging raakte
> productie. Bewijs-screenshots: `docs/persona-sweep-2026-06-22/` (25 stuks) + `results.json`
> (volledige padmatrix: **60 functionele** + **42 adversariële** probes).
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local`, FRANCHISER `franchise@zzp-platform.local` (Femke /
> tenant "Zorgbemiddeling Noord").

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout/notFound), nooit een 500/crashpagina of stille toegang.

## Opgelost / gewijzigd sinds de vorige sweep (2026-06-21)

- **Geen nieuwe regressies; alle eerder bevestigde poorten houden stand.** De vorige sweep (21-6,
  commit `a4c416f`, PR #476) vond geen gaten. Deze run draaide tegen `55014b7` en herbevestigt de
  isolatie-, authz- en robuustheidspoorten op de actuele `main`.
- **Nieuwe oppervlakken sinds de vorige sweep mee-geprobed** (uit de tussenliggende merges
  #471–#478): de **statusfilters** op `/facturen`, `/reacties` en `/kandidaten` (#474/#475/#477), de
  **filter+zoek** op `/admin/samenwerkingen` (#471), de **sorteer**-opties op `/freelancers` (#473) en
  de **agenda-export `.ics`** (`/api/agenda`, #478). Alle nieuwe oppervlakken zijn robuust tegen
  ongeldige/malicieuze query-parameters (zie sectie B) en de ICS-export is strikt op de eigen sessie
  gescopet (geen id-parameter, dus geen IDOR-vector).
- **Operationele noot (geen platformdefect):** de container startte zónder `node_modules` — de eerste
  productie-build faalde op een ontbrekende `web-push`-module. Opgelost met `npm install` vóór de
  build; daarna alles groen. Dit is een omgevings-/container-artefact, niet iets dat de code raakt.

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's, **0 error-markers** in de server-log over de hele run).
Alle pogingen tot **privilege-escalatie**, **IDOR/cross-partij**, **cross-tenant**-toegang,
**authz-keten omzeilen**, **malicieuze input** en **robuustheid** werden correct geweigerd; geen
enkel privé-document, vreemde factuur, samenwerking, profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 56
  kernschermen + filter-varianten over 4 rollen: alle 200, inhoud rendert (steekproef-`<h1>` +
  `main`-tekst bevestigen de doelpagina). Eén lage observatie (protected soft-404 → HTTP 200) blijft
  GEACCEPTEERD via ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** Adversariële paden (UI + API): alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's. Privé-document van
  een ander → **403** (eigenaar → 200 PDF); cross-tenant entiteit → "Niet gevonden" zonder datalek;
  cross-tenant tenant-gebonden profiel via `/zzp/[id]` → **echte 404**; DBA-dossier van een vreemde
  samenwerking → **403**; rolvreemde CSV-export → **403**; ongeldige/malicieuze query-params
  (`<script>`, SQL-achtige strings, `onerror`-payload) op de nieuwe statusfilters → **200 met genegeerde
  filter, geen reflectie, geen scriptuitvoering**. Cron-eindpunt weigert ongeauthenticeerd.

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's,
geen crashpagina's, geen redirect-away van een toegestane pagina.

| Rol        | Geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                                                                                                                   | Resultaat |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, opdracht-detail (`job-1`), samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, factuur-detail (`2026-0001`), diensten, rooster, inzicht, prognose, profiel/bewerken, documenten, notificaties, reacties + filtervarianten (status/match) | 20/20 OK  |
| CLIENT     | dashboard, opdrachten, opdrachten/nieuw, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, samenwerking-detail (Jansen↔Nadia), bedrijf, inzicht, administratie + filtervarianten                                                                                                  | 14/14 OK  |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, samenwerkingen (+ zoek/filter), support, audit, configuratie, import                                                                                                                                                 | 14/14 OK  |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie + eigen-tenant detail (opdrachtgever Noorderbrug via companyId, ZZP'er Lars Bakker via profileId)                                                                                                                             | 8/8 OK    |

Steekproef-`<h1>`/`main`-tekst per scherm bevestigt dat de echte doelpagina rendert: FREELANCER-
dashboard `h1="Sanne de Vries"`, factuur-detail `h1="Factuur 2026-0001"` (Betaald · € 708,58),
samenwerking-detail `h1="Verpleegkundige (detachering)"`; CLIENT-kandidaten `h1="Kandidaten"`,
verplichtingen `h1="Betaalverplichtingen"`; ADMIN `h1="Platform statistieken"`; FRANCHISER
eigen-tenant-detail toont `Verpleeghuis De Noorderbrug` (met afdelingen) en `Lars Bakker`
(inzetbaarheid/beschikbaarheid/bestanden/logboek). Bewijs o.a. `fl-dashboard.png`,
`fl-factuur-detail.png`, `cl-kandidaten.png`, `cl-verplichtingen.png`, `ad-statistieken.png`,
`fr-eigen-company.png`, `fr-eigen-zzp.png`.

**Geen functionele defecten gevonden.** Eén lage observatie (geen actie):

- **A1 — protected soft-404 geeft HTTP 200 i.p.v. 404 (GEACCEPTEERD, ADR-0009).** Detailroutes met
  een onbekend/vreemd/cross-partij/cross-tenant id (`/samenwerkingen/<x>`, `/facturen/<x>`,
  `/opdrachten/<x>`, `/franchise/.../<x>`) renderen een nette **"Niet gevonden — Dit item bestaat
  niet (meer) of je hebt er geen toegang toe"**-staat binnen de app-layout, met **HTTP 200**. De
  root-`not-found` (volledig onbekende route, bv. `/this-route-does-not-exist`) geeft wél een **echte
  404**, net als cross-tenant tenant-gebonden profielen via `/zzp/[id]` (404). Semantisch zou 404
  zuiverder zijn voor de detail-soft-404's, maar er lekt geen data en de toegang wordt geweigerd —
  bewust geaccepteerd (zie `docs/decisions/0009-soft-404-auth-routes.md`).

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Onderstaand wat is geprobeerd en het (correcte) resultaat.

### Privilege-escalatie — alle geweigerd

| Poging                                                                 | Resultaat                                             |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| FREELANCER → `/admin/verificaties`, `/admin/gebruikers`                | redirect → `/dashboard` (200, h1 "Sanne de Vries")    |
| FREELANCER → `/kandidaten` (CLIENT), `/franchise/opdrachtgevers`       | redirect → `/dashboard` (200)                         |
| FREELANCER → `/verplichtingen` (CLIENT)                                | redirect → `/administratie` (rol-gepaste boekhouding) |
| CLIENT → `/admin/verificaties`, `/admin/no-shows`, `/franchise/zzpers` | redirect → `/dashboard` (200, h1 "Mark Jansen")       |
| CLIENT → `/certificaten` (FREELANCER)                                  | redirect → `/dashboard`                               |
| CLIENT → `/prognose` (FREELANCER)                                      | redirect → `/administratie`                           |
| FRANCHISER → `/admin/verificaties`, `/certificaten`, `/kandidaten`     | redirect → `/dashboard` (200, h1 "Femke Franchise")   |

Geen enkele rol-vreemde pagina rendert; geen `AuthorizationError` in de server-log (0 markers).
Bewijs: `ADV-fl-admin.png`.

### IDOR / cross-partij — alle geweigerd, geen leak

- FREELANCER (Sanne) → `/samenwerkingen/<emma's collab>` (Emma/ZorgGroep) en `/facturen/<emma's
factuur>` (PAID) → **"Niet gevonden / geen toegang"** (alleen de not-found-tekst in `main`, geen
  enkel veld van de andere partij). Bewijs: `ADV-fl-other-collab.png`.
- CLIENT (Mark) → dezelfde vreemde collab/factuur → idem geweigerd, geen leak.
- FREELANCER → `/opdrachten/job-7` (een **DRAFT**-opdracht van Zorgcentrum Jansen) → "Niet gevonden"
  (concepten zijn niet zichtbaar voor anderen).
- Onzin-id's op detailroutes (`/samenwerkingen/onzin-id-xyz`, `/facturen/does-not-exist-123`) → "Niet
  gevonden", geen 500.

### Cross-tenant — alle geweigerd, geen leak

- FRANCHISER (Noord) → `/franchise/opdrachtgevers/<default-tenant companyId>` (Zorgcentrum Jansen) en
  `/franchise/zzpers/<default-tenant profileId>` (Sanne) → **"Niet gevonden / geen toegang"**, terwijl
  de eigen-tenant-controle (Verpleeghuis De Noorderbrug / Lars Bakker) wél volledig rendert. Het
  verschil is de `tenantScopeWhere(actor)`-poort, niet een mismatchende id (de detailroutes nemen een
  _company-id_ resp. _profile-id_, uitgelezen uit de echte navlinks). Bewijs:
  `fr-eigen-company.png` + `fr-eigen-zzp.png` (toegestaan) vs.
  `ADV-fr-crosstenant-company.png` + `ADV-fr-crosstenant-zzp.png` (geweigerd).
- CLIENT (default-tenant) → `/zzp/<Noord-gebonden profileId>` (Lars) → **echte 404**
  (`tenantEntityVisibleTo` weigert cross-tenant tenant-gebonden profielen).

### Document-privacy — correct

- Niet-eigenaar (CLIENT én FRANCHISER) → `GET /api/documents/<andermans doc>` → **403**
  `{"error":"Geen toegang."}`; andere FREELANCER (Sanne) → `GET /api/documents/<Emma's doc>` → **403**.
- Eigenaar → `GET /api/documents/<eigen doc>` → **200** `application/pdf` (`%PDF-1.7…`).
- Ongeauthenticeerd → `GET /api/documents/<id>` → **redirect → `/login`** (de gevolgde redirect levert
  de login-HTML op status 200; **nooit** de PDF — geverifieerd: respons-body is `<!DOCTYPE html>`, geen
  `%PDF`). De middleware-sessiebescherming geldt omdat het pad geen punt bevat.

### Authz-keten omzeilen / verboden mutatie

- De cross-partij/cross-tenant detailpagina's weigeren al op leesniveau ("Niet gevonden"), zodat de
  mutatie-knoppen (uren/factuur goedkeuren/afkeuren, betaling markeren) nooit worden gerenderd voor
  een niet-eigenaar.
- **DBA-dossier-export van een vreemde samenwerking:** FREELANCER én CLIENT → `GET
/api/samenwerkingen/<emma's collab>/dba-dossier` → **403** `{"error":"Geen toegang."}` (de
  ownership-poort zit óók op de API-route, niet alleen op de pagina).
- **Rolvreemde CSV-export:** FREELANCER → `GET /verplichtingen/export` (CLIENT-route) → **403**
  `{"error":"Niet toegestaan"}`; CLIENT → `GET /prognose/export` (FREELANCER-route) → **403**;
  FREELANCER → `GET /api/admin/export/invoices` (ADMIN-route) → **403** "Geen toegang: vereist rol
  ADMIN." De rol-poort zit op de exportroutes zelf, niet alleen op de UI-knop.

### Malicieuze / ongeldige input — server-side geweigerd, geen XSS

Tegen de **nieuwe** query-parameter-oppervlakken (statusfilters #474/#475/#477, admin-zoek #471,
rooster-matchfilter):

- `/facturen?status=<script>alert(1)</script>` (FREELANCER) → **200**, de ongeldige status wordt
  genegeerd, de "Alle (1)"-tab toont gewoon de eigen factuur; **geen rauwe `<script>` in de HTML**.
- `/reacties?status=' OR 1=1--` (FREELANCER) → **200**, pagina rendert normaal (Prisma is
  geparametriseerd; de string is geen geldige enum → genegeerd).
- `/rooster?match=<img src=x onerror=alert(1)>` (FREELANCER) → **200**, normale empty-state, geen
  scriptuitvoering.
- `/admin/samenwerkingen?q=<script>window.__x=1</script>` (ADMIN) → **200**; geverifieerd:
  `window.__x` blijft `false`, **geen rauwe `<script>` in de uitgeleverde HTML**, geen dialog. React
  escapet de reflectie. Bewijs: `ad-samenwerkingen-xss.png`.

(De diepere `/profiel/bewerken`-input-injectie — negatief tarief, ~360-teken XSS-`headline` — werd in
de sweep van 21-6 tegen de DB geverifieerd als **niet gepersisteerd**; ongewijzigd op `main`.)

### Robuustheid — geen 500's

- Onzin-id's op detailroutes → "Niet gevonden" soft-404 (200, zie A1); volledig onbekende route
  (`/this-route-does-not-exist`) → **echte 404**.
- Beschermde pagina zonder cookie (`/dashboard`) → **redirect** → `/login?callbackUrl=…` (h1
  "Inloggen").
- **Over de hele run: 0 HTTP-500's en 0 error-markers in de server-log** (102 probes).

### Authenticatie van cron/webhook

- `POST /api/tasks/run-all` zonder bearer → **503** `{"error":"Taak-endpoint niet
geconfigureerd."}` (in deze QA-omgeving zonder `CRON_SECRET`; in productie mét secret → 401 bij
  ontbrekende/foute bearer). Geen ongeauthenticeerde taakuitvoering.
- `GET /api/agenda` zonder sessie → **redirect → `/login`** (login-HTML, nooit de ICS — geverifieerd:
  body is `<!DOCTYPE html>`, geen `BEGIN:VCALENDAR`). Mét sessie levert de eigen-rooster-ICS
  (`BEGIN:VCALENDAR … X-WR-CALNAME:ZZP Platform — Rooster`), strikt op de eigen actieve samenwerkingen
  gescopet (geen id-parameter → geen IDOR).
