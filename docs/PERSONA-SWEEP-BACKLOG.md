# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-20 · **main-commit:** `0a1146e` (0a1146ef9497a1400838af2b63bfa3c77ca3c6c3)
> **Methode:** productie-build (`npm run build`) + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`. Playwright met de
> vooraf-geïnstalleerde Chromium (`/opt/pw-browsers/chromium-1194`, expliciete `executablePath` —
> de Playwright-browser-CDN staat niet in de netwerk-allowlist) — per rol ingelogd
> (wachtwoord `demo1234`). Per pad vastgelegd: **HTTP-status**, **eind-URL** (detecteert redirects),
> **`<h1>`** en de gerenderde `main`-tekst (detecteert leak vs. weigering) + een crash-marker uit de
> body. Cross-party/-tenant-eigendom is tegen de seed-DB geverifieerd (IDs uitgelezen via Prisma),
> niet uit de UI afgeleid. De DB is ephemeer; geen enkele poging raakte productie.
> Bewijs-screenshots: `docs/persona-sweep-2026-06-20/` (12 stuks, incl. 2 ADV-weigeringen) +
> `results.json` (volledige padmatrix).
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local`, FRANCHISER `franchise@zzp-platform.local` (Femke /
> tenant "Zorgbemiddeling Noord").

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout/notFound), nooit een 500/crashpagina of stille toegang.

## Opgelost / gewijzigd sinds de vorige sweep (2026-06-18)

- **Tenant-isolatie opnieuw bevestigd, nu mét volledige body-inspectie.** Waar de vorige sweep de
  cross-tenant-weigering uit eigendoms-IDs en HTTP-status afleidde, is deze run dieper gegaan: voor
  elke cross-tenant-poging is de gerenderde `main`-inhoud uitgelezen. FRANCHISER (tenant Noord) die
  een opdrachtgever (`Zorgcentrum Jansen`) of ZZP'er (`Sanne`) uit de **default-tenant** opent via
  `/franchise/opdrachtgevers/[id]` resp. `/franchise/zzpers/[id]` krijgt **"Niet gevonden / geen
  toegang"** — geen naam, e-mail, afdeling, dienst of profielveld lekt. De eigen-tenant-controle
  (`/franchise/.../Noorderbrug` resp. `/.../Lars Bakker`) rendert wél volledig, wat bewijst dat het
  verschil de `tenantScopeWhere(actor)`-poort is en niet een lege query. Bewijs:
  `ADV-franchiser-crosstenant-company-denied.png`.
- **`/zzp/[profileId]` voor een FRANCHISER = bewuste publieke profielpagina, geen gat.** Een
  franchiser kan een **direct-tenant (tenantId = null), PUBLIC** ZZP-profiel (Sanne) zien via
  `/zzp/[id]`. Dat is by-design: de route is de deelbare publieke profielpagina (zichtbaar zelfs
  zonder login bij PUBLIC). De code dwingt de scheiding expliciet af — `profileVisibleTo` +
  `tenantEntityVisibleTo`: een **tenant-gebonden** profiel (tenantId ≠ null) is alléén zichtbaar voor
  de eigenaar, een ADMIN of iemand binnen dezelfde tenant. Geverifieerd: een CLIENT uit de
  default-tenant die de Noord-gebonden ZZP'er Lars opent via `/zzp/[id]` → **echte 404**. Geen
  privé-documenten op de publieke kaart (alleen geverifieerde badges). Geen actie.
- **`/api/billing/webhook` → 307 (was 200 in de vorige run).** In deze QA-omgeving (geen
  betaalprovider geconfigureerd) leidt een ongeauthenticeerde POST naar `/login`. Geen gat: de
  request-body bepaalt de betaalstatus nooit (server-side opgehaald bij de provider); in beide
  varianten is dit een no-op. Genoteerd als lage observatie onder B.

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's, **0 error-markers** in de server-log over de hele run).
Alle pogingen tot **privilege-escalatie**, **IDOR/cross-partij**, **cross-tenant**-toegang,
**authz-keten omzeilen**, **malicieuze input** en **robuustheid** werden correct geweigerd; geen
enkel privé-document, vreemde factuur, samenwerking, profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 43
  kernschermen over 4 rollen: alle 200, inhoud rendert (steekproef-`<h1>` bevestigt de doelpagina).
  Eén lage observatie (protected soft-404 → HTTP 200) blijft GEACCEPTEERD via ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** Adversariële paden (UI + API): alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's. Privé-document van
  een ander → **403** (eigenaar → 200 PDF); cross-tenant entiteit → "Niet gevonden" zonder datalek;
  negatief tarief (`-50`), `maxTravel=-999` en een ~340-teken XSS-`headline` (incl. `<script>` en
  `onerror`) werden bij het profiel-opslaan **niet gepersisteerd** (server-side Zod), geen
  script-uitvoering, geen `<script>` in de uitgeleverde HTML, geen dialog. Cron-eindpunten weigeren
  ongeauthenticeerd.

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's,
geen crashpagina's. (`/meldingen` gaf 404 — dat is géén defect maar een verkeerd geraden pad: de
notificatieroute is `/notificaties`; de echte nav linkt daarheen.)

| Rol        | Geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                                                          | Resultaat |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, opdracht-detail (`job-1`), samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, factuur-detail (`2026-0001`), diensten, rooster, inzicht, prognose, profiel/bewerken, documenten | 15/15 OK  |
| CLIENT     | dashboard, opdrachten, opdrachten/nieuw, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, samenwerking-detail, bedrijf, inzicht                                                                                         | 11/11 OK  |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, support, audit, configuratie                                                                                                                                | 10/10 OK  |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie + eigen-tenant detail (opdrachtgever Noorderbrug, ZZP'er Lars Bakker)                                                                                                | 8/8 OK    |

Steekproef-`<h1>`/`main`-tekst per scherm bevestigt dat de echte doelpagina rendert: FREELANCER-
dashboard `h1="Sanne de Vries"`, factuur-detail `h1="Factuur 2026-0001"`; CLIENT-dashboard
`h1="Mark Jansen"`; ADMIN `h1="Platform statistieken"`; FRANCHISER eigen-tenant-detail toont
`Verpleeghuis De Noorderbrug` met afdeling Geriatrie + dienst, en `Lars Bakker` met inzetbaarheid +
documenten. Geldige profielwijziging (een normale `headline`) wordt geaccepteerd; de
malicieuze variant geweigerd (zie B). Bewijs o.a. `freelancer-dashboard.png`,
`freelancer-factuur-detail.png`, `freelancer-samenwerking-detail.png`, `client-kandidaten.png`,
`admin-verificaties.png`, `admin-statistieken.png`, `franchiser-opdrachtgevers.png`.

**Geen functionele defecten gevonden.** Eén lage observatie (geen actie):

- **A1 — protected soft-404 geeft HTTP 200 i.p.v. 404 (GEACCEPTEERD, ADR-0009).** Detailroutes met
  een onbekend/vreemd/cross-partij/cross-tenant id (`/samenwerkingen/<x>`, `/facturen/<x>`,
  `/opdrachten/<x>`, `/franchise/.../<x>`) renderen een nette **"Niet gevonden — Dit item bestaat
  niet (meer) of je hebt er geen toegang toe"**-staat binnen de app-layout, met **HTTP 200**. De
  root-`not-found` (volledig onbekende route, bv. `/this-route-does-not-exist`,
  `/admin/nope`) geeft wél een **echte 404**. Semantisch zou 404 zuiverder zijn voor de
  detail-soft-404's, maar er lekt geen data en de toegang wordt geweigerd — bewust geaccepteerd.

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Onderstaand wat is geprobeerd en het (correcte) resultaat.

### Privilege-escalatie — alle geweigerd

| Poging                                                                                  | Resultaat                                             |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| FREELANCER → `/admin/verificaties`, `/admin/gebruikers`, `/admin/statistieken`          | redirect → `/dashboard` (200)                         |
| FREELANCER → `/kandidaten` (CLIENT), `/franchise/opdrachtgevers`                        | redirect → `/dashboard` (200)                         |
| FREELANCER → `/verplichtingen` (CLIENT)                                                 | redirect → `/administratie` (rol-gepaste boekhouding) |
| CLIENT → `/admin/verificaties`, `/admin/no-shows`, `/franchise/zzpers`                  | redirect → `/dashboard` (200)                         |
| CLIENT → `/certificaten` (FREELANCER), `/prognose`                                      | redirect → `/dashboard` resp. `/administratie`        |
| FRANCHISER → `/admin/verificaties`, `/admin/gebruikers`, `/certificaten`, `/kandidaten` | redirect → `/dashboard` (200)                         |

Geen enkele rol-vreemde pagina rendert; geen `AuthorizationError` in de server-log (0 markers).

### IDOR / cross-partij — alle geweigerd, geen leak

- FREELANCER (Sanne) → `/samenwerkingen/<andermans collab>` en `/facturen/<andermans factuur>`
  → **"Niet gevonden / geen toegang"**, geen velden van de andere partij in de body.
- CLIENT (Mark) → dezelfde vreemde collab/factuur → idem geweigerd, geen leak. Bewijs:
  `ADV-freelancer-other-collab-denied.png`.
- FREELANCER → `/opdrachten/job-7` (een **DRAFT**-opdracht van een andere opdrachtgever) →
  "Niet gevonden" (concepten zijn niet zichtbaar voor anderen).

### Cross-tenant — alle geweigerd, geen leak

- FRANCHISER (Noord) → `/franchise/opdrachtgevers/<default-tenant company>` en
  `/franchise/zzpers/<default-tenant ZZP'er>` (zowel via profile-id als user-id) → **"Niet gevonden /
  geen toegang"**. Eigen-tenant-controle rendert wél volledig → het verschil is de
  `tenantScopeWhere(actor)`-poort, niet een lege query.
- CLIENT (default-tenant) → `/zzp/<Noord-gebonden ZZP'er>` → **echte 404**
  (`tenantEntityVisibleTo` weigert cross-tenant tenant-gebonden profielen).
- FRANCHISER → `/zzp/<PUBLIC direct-tenant ZZP'er>` → 200 — **by-design** (publieke deelbare
  profielpagina; geen privé-documenten). Zie de "Opgelost/gewijzigd"-sectie hierboven.

### Document-privacy — correct

- Niet-eigenaar (CLIENT én andere FREELANCER) → `GET /api/documents/<andermans doc>` → **403**
  `{"error":"Geen toegang."}`.
- Eigenaar → `GET /api/documents/<eigen doc>` → **200** `application/pdf`.
- Ongeauthenticeerd → `GET /api/documents/<id>` → **307** → `/login` (nooit zonder sessie geserveerd).

### Authz-keten omzeilen / verboden mutatie

De cross-partij/cross-tenant detailpagina's weigeren al op leesniveau ("Niet gevonden"), zodat de
mutatie-knoppen (uren/factuur goedkeuren/afkeuren, betaling markeren) nooit worden gerenderd voor een
niet-eigenaar. De document-API bevestigt de ownership-poort op data-niveau (403 hierboven). Geen
mutatie zonder eigenaarschap waargenomen.

### Malicieuze / ongeldige input — server-side geweigerd

Profiel-opslaan (`/profiel/bewerken`) met: `headline` = `"><img src=x onerror=...><script>...` + 300×
`X` (na het wegnemen van de client-`maxlength`), `hourlyRate` = `-50`, `maxTravelMinutes` = `-999`:

- Na opslaan blijft de pagina staan; **geen van de malicieuze waarden is gepersisteerd** (na herladen
  staan de originele `headline` "Verpleegkundige (BIG-geregistreerd)" en `hourlyRate` "52" er weer) —
  server-side Zod-validatie houdt stand.
- **Geen XSS:** `window.__pwned` blijft onset op zowel de bewerk- als de publieke profielpagina; geen
  rauwe `<script>` in de uitgeleverde HTML; geen dialog.
- Geen 500/crash.

### Robuustheid — geen 500's

- Onzin-id's op detailroutes → "Niet gevonden" soft-404 (200, zie A1); volledig onbekende routes
  (`/this-route-does-not-exist`, `/admin/nope`, `/franchise/nope`, `/zzp/<onzin>`,
  `/admin/gebruikers/<onzin>`) → **echte 404**.
- Beschermde pagina's zonder cookie (`/dashboard`, `/admin/gebruikers`) → **307** → `/login?callbackUrl=…`.
- **Over de hele run: 0 HTTP-500's en 0 error-markers in de server-log.**

### Authenticatie van cron/webhook

- `POST /api/tasks/run-all` en `/api/tasks/expiry` zonder of met foute bearer → **503** "niet
  geconfigureerd" (in deze QA-omgeving zonder `CRON_SECRET`; in productie mét secret → 401 bij
  ontbrekende/foute bearer). Geen ongeauthenticeerde taakuitvoering.
- `POST /api/billing/webhook` (lege body, ongeauthenticeerd) → **307** → `/login` (no-op; de
  request-body bepaalt de betaalstatus nooit). Lage observatie, geen actie.
