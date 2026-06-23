# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-23 · **main-commit:** `0f0dba0` (0f0dba0ec085033e778a6acf706694b14cb44753)
> **Methode:** verse `npm install` (de container miste de `web-push`-module bij de eerste build) →
> productie-build (`npm run build`) + schema-push + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`, poort 3100) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-secret-…`. Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, expliciete `executablePath`) — per rol
> ingelogd (wachtwoord `demo1234`) via het echte login-formulier. Per pad vastgelegd: **HTTP-status**,
> **eind-URL** (detecteert redirects), **`<h1>`** en de gerenderde `main`-tekst (detecteert leak vs.
> weigering) + crash-markers over zowel de `main`-tekst als de volledige HTML. Voor de adversariële
> API-paden is de respons-body uitgelezen (PDF-magic / JSON-foutmelding). De XSS-payloads zijn náást
> statuscontrole ook op **scriptuitvoering** (`window.__x`) én **rauwe reflectie in de HTML**
> gecontroleerd. Cross-party/-tenant-eigendom is tegen de seed-DB geverifieerd (IDs uitgelezen via
> Prisma, niet uit de UI geraden). De DB is ephemeer; geen enkele poging raakte productie.
> Bewijs: `docs/persona-sweep-2026-06-23/` (4 rol-dashboard-screenshots + `results.json` met de
> volledige padmatrix: **45 functionele** + **26 adversariële UI** + **9 adversariële API** probes).
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local` (Admin Beheerder), FRANCHISER `franchise@zzp-platform.local`
> (Femke / tenant "Zorgbemiddeling Noord").

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout/notFound), nooit een 500/crashpagina of stille toegang.

## Opgelost / gewijzigd sinds de vorige sweep (2026-06-22)

- **Geen nieuwe regressies; alle eerder bevestigde poorten houden stand.** De vorige sweep (22-6,
  commit `55014b7`) vond geen gaten. Deze run draaide tegen `0f0dba0` (na o.a. de i18n-merges t/m
  #498) en herbevestigt de isolatie-, authz- en robuustheidspoorten op de actuele `main`.
- **Nieuwe/uitgebreide oppervlakken sinds de vorige sweep mee-geprobed:** het ZZP'er-overzicht
  `/opgeslagen` (bewaarde opdrachten), de CLIENT-`/verplichtingen` (betaalverplichtingen) en de
  i18n-bijwerkingen van het facturen-paneel. Alle laadden met echte inhoud (HTTP 200, correcte `<h1>`).
  De FREELANCER → `/verplichtingen` (een CLIENT-route) redirect correct naar `/administratie`
  (rol-gepaste boekhouding) — geen rol-vreemde render.
- **Operationele noot (geen platformdefect):** de eerste productie-build faalde op de ontbrekende
  `web-push`-module; opgelost met `npm install` vóór de build (omgevings-/container-artefact, raakt de
  code niet). Identiek aan de noot van 21-6/22-6.

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's, geen Prisma-/stacktrace-markers over de hele run). Alle
pogingen tot **privilege-escalatie**, **IDOR/cross-partij**, **cross-tenant**-toegang, **authz-keten
omzeilen**, **malicieuze input** en **robuustheid** werden correct geweigerd; geen enkel privé-document,
vreemde factuur, samenwerking, profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 45
  kernschermen + filter-/detailroutes over 4 rollen: alle 200, inhoud rendert (steekproef-`<h1>` +
  `main`-tekst bevestigen de doelpagina). Eén lage observatie (protected soft-404 → HTTP 200) blijft
  GEACCEPTEERD via ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** Adversariële paden (UI + API): alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's, **nul
  scriptuitvoering**. De twee `raw=true`-vlaggen uit het detectiescript zijn **vals-positieven** —
  bevestigd geëscapet (zie sectie B, "Malicieuze input").

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's,
geen crashpagina's, geen redirect-away van een toegestane pagina.

| Rol        | Geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                                                                                         | Resultaat |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, opdracht-detail (`job-1`), samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, diensten, rooster, inzicht, prognose, profiel/bewerken, documenten, notificaties, reacties, opgeslagen, verplichtingen→redirect | 18/18 OK  |
| CLIENT     | dashboard, opdrachten, opdrachten/nieuw, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, bedrijf, inzicht, administratie                                                                                                                              | 11/11 OK  |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, samenwerkingen, support, audit, configuratie, import                                                                                                                                       | 12/12 OK  |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie                                                                                                                                                                                                     | 6/6 OK    |

Steekproef-`<h1>` per scherm bevestigt dat de echte doelpagina rendert: FREELANCER-dashboard
`h1="Sanne de Vries"`, opdracht-detail `h1="Verpleegkundige (somatiek)"`, samenwerking-detail
`h1="Verpleegkundige (detachering)"`, inkomstenprognose `h1="Inkomstenprognose"`; CLIENT-kandidaten
`h1="Kandidaten"`, verplichtingen `h1="Betaalverplichtingen"`, bedrijf `h1="Zorgcentrum Jansen"`;
ADMIN `h1="Platform statistieken"` / `h1="DBA-monitor"` / `h1="Audit log"`; FRANCHISER
`h1="Opdrachtgevers"` / `h1="ZZP'ers"`. Bewijs: `freelancer-dashboard.png`, `client-dashboard.png`,
`admin-dashboard.png`, `franchiser-dashboard.png` + de volledige padmatrix in `results.json`.

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

### Privilege-escalatie — alle geweigerd (redirect → `/dashboard`)

| Poging                                                             | Resultaat                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------- |
| FREELANCER → `/admin/verificaties`, `/admin/gebruikers`            | redirect → `/dashboard` (200, h1 "Sanne de Vries")    |
| FREELANCER → `/kandidaten` (CLIENT), `/franchise/opdrachtgevers`   | redirect → `/dashboard` (200)                         |
| FREELANCER → `/verplichtingen` (CLIENT)                            | redirect → `/administratie` (rol-gepaste boekhouding) |
| CLIENT → `/admin/no-shows`, `/franchise/zzpers`                    | redirect → `/dashboard` (200, h1 "Mark Jansen")       |
| CLIENT → `/certificaten` (FREELANCER)                              | redirect → `/dashboard`                               |
| FRANCHISER → `/admin/verificaties`, `/certificaten`, `/kandidaten` | redirect → `/dashboard` (200, h1 "Femke Franchise")   |

Geen enkele rol-vreemde pagina rendert; geen `AuthorizationError`/markers in de output.

### IDOR / cross-partij — alle geweigerd, geen leak

- FREELANCER (Sanne) → `/samenwerkingen/<Emma's collab>` (Emma/ZorgGroep) en `/facturen/<Emma's
factuur, PAID>` → **"Niet gevonden — geen toegang"** (alleen de not-found-tekst in `main`, geen enkel
  veld van de andere partij).
- CLIENT (Mark) → dezelfde vreemde collab/factuur → idem geweigerd, geen leak.
- FREELANCER → `/opdrachten/job-7` (een **DRAFT**-opdracht van Zorgcentrum Jansen) → "Niet gevonden"
  (concepten zijn niet zichtbaar voor anderen).
- Onzin-id's op detailroutes (`/samenwerkingen/onzin-id-xyz`, `/facturen/does-not-exist-123`,
  `/opdrachten/nope-9999`) → "Niet gevonden", geen 500.

### Cross-tenant — alle geweigerd, geen leak

- FRANCHISER (Noord) → `/franchise/opdrachtgevers/<default-tenant companyId Zorgcentrum Jansen>` en
  `/franchise/zzpers/<default-tenant profileId Sanne>` → **"Niet gevonden — geen toegang"**, terwijl de
  eigen-tenant-overzichten (Opdrachtgevers / ZZP'ers) wél volledig renderen. Het verschil is de
  `tenantScopeWhere(actor)`-poort, niet een mismatchend id (de detailroutes nemen een _company-id_
  resp. _profile-id_, uitgelezen uit de echte seed-DB).
- CLIENT (default-tenant) → `/zzp/<Noord-gebonden profileId Lars Bakker>` → **echte 404**
  (`tenantEntityVisibleTo` weigert cross-tenant tenant-gebonden profielen).

### Document-privacy — correct (API-route)

- Niet-eigenaar (CLIENT én FRANCHISER) → `GET /api/documents/<Sanne's doc>` → **403**
  `{"error":"Geen toegang."}`; andere FREELANCER (Sanne) → `GET /api/documents/<Emma's doc>` → **403**.
- Eigenaar → `GET /api/documents/<eigen doc>` → **200** `application/pdf` (`%PDF-1.7…`).

### Authz-keten omzeilen / verboden mutatie (API-route)

- De cross-partij/cross-tenant detailpagina's weigeren al op leesniveau ("Niet gevonden"), zodat de
  mutatie-knoppen (uren/factuur goedkeuren/afkeuren, betaling markeren) nooit worden gerenderd voor een
  niet-eigenaar.
- **DBA-dossier-export van een vreemde samenwerking:** FREELANCER én CLIENT → `GET
/api/samenwerkingen/<Emma's collab>/dba-dossier` → **403** `{"error":"Geen toegang."}` (de
  ownership-poort zit óók op de API-route).
- **Rolvreemde CSV-export:** FREELANCER → `GET /verplichtingen/export` (CLIENT-route) → **403**
  `{"error":"Niet toegestaan"}`; CLIENT → `GET /prognose/export` (FREELANCER-route) → **403**;
  FREELANCER → `GET /api/admin/export/invoices` (ADMIN-route) → **403** "Geen toegang: vereist rol
  ADMIN." De rol-poort zit op de exportroutes zelf, niet alleen op de UI-knop.

### Malicieuze / ongeldige input — server-side geweigerd, geen XSS

Tegen de query-parameter-oppervlakken (statusfilters, admin-zoek, rooster-matchfilter):

- `/facturen?status=<script>window.__x=1</script>` (FREELANCER) → **200**, de ongeldige status wordt
  genegeerd; **geen scriptuitvoering** (`window.__x === false`), geen rauwe `<script>` in de HTML.
- `/reacties?status=' OR 1=1--` (FREELANCER) → **200**, pagina rendert normaal (Prisma is
  geparametriseerd; de string is geen geldige enum → genegeerd).
- `/opdrachten?status=<script>…` (CLIENT) → **200**, ongeldige filter genegeerd, geen uitvoering.
- `/rooster?match=<img src=x onerror=window.__x=1>` (FREELANCER) → **200**, geen scriptuitvoering. Het
  detectiescript markeerde "raw" omdat de substring `onerror=window.__x=1` in de HTML voorkwam, maar bij
  inspectie staat de payload uitsluitend in de **RSC-payload** als JSON-Unicode-escape
  (`<img…>`) — geen levend tag, dus vals-positief.
- `/admin/samenwerkingen?q=<script>…` en `/admin/gebruikers?q='><img … onerror=…>` (ADMIN) → **200**,
  geen uitvoering. De `/admin/gebruikers`-reflectie staat in de waarde van het zoek-`input` correct
  geëscapet: `value="'&gt;&lt;img src=x onerror=window.__x=1&gt;"` — de `<`/`>` zijn `&lt;`/`&gt;`, dus
  de payload kan niet uit het attribuut breken. React escapet de reflectie; ook hier vals-positief op de
  substring.

(De diepere `/profiel/bewerken`-input-injectie — negatief tarief, lange XSS-`headline` — werd in een
eerdere sweep tegen de DB geverifieerd als **niet gepersisteerd**; ongewijzigd op `main`.)

### Robuustheid — geen 500's

- Onzin-id's op detailroutes → "Niet gevonden" soft-404 (200, zie A1); volledig onbekende route
  (`/this-route-does-not-exist`) → **echte 404**.
- **Over de hele run: 0 HTTP-500's en 0 crash-/Prisma-markers** (80 probes). De `serverErrors`-teller
  in `results.json` staat op `2`, uitsluitend door de twee hierboven verklaarde vals-positieve
  substring-vlaggen (beide `xssExecuted=false`); er was geen 500 en geen scriptuitvoering.
