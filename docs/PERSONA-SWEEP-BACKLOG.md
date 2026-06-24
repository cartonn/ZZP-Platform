# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-24 (run 3) · **main-commit basis:** `c6736b8`
> **Methode:** verse productie-build (`npm install` → `npm run build`) + schema-push + idempotente
> demo-seed (`SEED_DEMO=true`) op een ephemere SQLite-DB (`qa.db`); productie-server
> (`CI=true PORT=3100 npm run start`, `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`,
> `STORAGE_DRIVER=local`, `AUTH_SECRET=ci-dummy-…`). Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, expliciete `executablePath`). Per rol
> ingelogd via het echte login-formulier (wachtwoord `demo1234`). DOEL 1 (acties uitvoeren), 1b
> (next-action-engine) en 2 (adversarieel). De DB is ephemeer; geen poging raakte productie.
>
> ## Samenvatting — GEEN GATEN GEVONDEN
>
> **Alle vier rollen + de cascade- en authz-poorten houden stand op `c6736b8`.** Geen nieuwe
> regressies sinds run 2; de toen-opgeloste int-overflow-guard staat nog (`MAX_PERFORMANCE_HOURS`).
>
> **DOEL 1 (werkt + echte acties):** 54 kernschermen over 4 rollen laadden HTTP 200, juiste `<h1>`,
> nul 500's/crashes/redirect-weg-van-toegestaan. Échte mutaties uitgevoerd en tegen de DB
> geverifieerd:
>
> - **ADMIN keurt verificatie goed** → wachtrij 6→5, `CREDENTIAL_VERIFIED`-audit, notificatie
>   "Certificaat goedgekeurd" naar de ZZP'er; de `/acties`-tegel verdween.
> - **CLIENT keurt ingediende prestatie goed** (cascade B2) → `Performance` SUBMITTED→APPROVED,
>   `PERFORMANCE_APPROVED`-audit, **automatisch een concept-factuur** (DRAFT, €1703,68) +
>   `INVOICE_DRAFT_READY`-notificatie. Bedrag/BTW kloppen.
>
> **DOEL 1b (next-action-engine):** `/acties` per rol kruis-gecheckt tegen
> `pending-tasks.ts`/`cascade/stage.ts`. De acties klopten met de echte status; na de
> prestatie-goedkeuring verdween de CLIENT-goedkeurtaak en kwam de FREELANCER "aan zet" voor de
> factuur (correcte handoff). De **lege FRANCHISER-actielijst is correct** — tegen de DB bevestigd:
> 0 due leads (de enige WARM-lead heeft een follow-up in de toekomst) en 0 (bijna-)verlopende
> tenant-certificaten.
>
> **DOEL 2 (adversarieel):** alle pogingen correct geweigerd, nul 500's/leaks/scriptuitvoering.
>
> - **Privilege-escalatie:** FREELANCER/CLIENT/FRANCHISER → rol-vreemde routes (`/admin/*`,
>   `/kandidaten`, `/certificaten`, `/franchise/*`) → redirect naar `/dashboard`.
> - **IDOR/cross-partij:** FREELANCER → andermans `/samenwerkingen/<id>` + `/facturen/<id>` →
>   "Niet gevonden — geen toegang" (soft-404, ADR-0009), geen veldlek.
> - **Cross-tenant:** FRANCHISER (Noord) → default-tenant `/franchise/zzpers/<Sanne>` +
>   `/franchise/opdrachtgevers/<Mark>` → "Niet gevonden"; CLIENT → cross-tenant `/zzp/<Lars>` →
>   **echte 404**.
> - **Document-privacy:** niet-eigenaar (CLIENT + FRANCHISER) → `GET /api/documents/<Sanne>` →
>   **403** `{"error":"Geen toegang."}`; eigenaar → **200 `application/pdf`**.
> - **Authz-keten/rol-export:** FREELANCER → `/verplichtingen/export` **403**,
>   `/api/admin/export/invoices` **403**, `/api/samenwerkingen/<vreemd>/dba-dossier` **403**;
>   CLIENT → `/prognose/export` **403**.
> - **Malicieuze input:** `/facturen?status=<script>…` genegeerd, geen scriptuitvoering
>   (`window.__x` ongezet); `'OR 1=1--`-filter genegeerd (Prisma geparametriseerd).
>
> Bewijs: `docs/persona-sweep-2026-06-24/` (run-2 artefacts blijven leidend) + de live verificatie
> hierboven tegen de seed-DB. Geen codewijziging nodig; deze run is een docs-/backlog-update.
>
> ---
>
> **Datum:** 2026-06-24 (run 2) · **main-commit basis:** `70cf3b6`
> **Methode:** verse productie-build + schema-push + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`, poort 3100). Echte
> doorklik-/actie-flows met Playwright/Chromium per rol (wachtwoord `demo1234`), plus DB-verificatie
> van elke statusovergang. DOEL 1 (acties uitvoeren), 1b (next-action-engine) en 2 (adversarieel).
>
> ## OPGELOST in deze run — int-overflow bij prestatie-goedkeuring (HOOG: 500-crash)
>
> **Gat (gevonden + gefixt):** een ZZP'er kon een prestatie met absurd veel uren indienen (browser-
> `max` omzeild via geknutselde POST); het uren-/bedragveld had geen **server-side** bovengrens. Bij
> goedkeuring overschreed het afgeleide `Invoice.totalCents` (int4) de kolomgrens → `prisma.invoice
.create()` faalde → **HTTP 500-crashpagina** op de goedkeuractie van de opdrachtgever
> (reproduceerbaar: 999.999 u × €88 + BTW = 10.647.989.352 cent). Schending CLAUDE.md regel 1 +
> DOEL-2 (absurde input → weigeren, nooit 500).
> **Fix:** `MAX_PERFORMANCE_HOURS=1000` + `MAX_MILESTONE_CENTS=€1 mln` in `validatePerformanceForm`
> (form-UX) én een harde `assertPerformanceWithinLimits`-guard in `createPerformance`/
> `updatePerformance` (dekt óók de CSV-diensten-import die het formulier omzeilt). +4 unit-tests.
> **Overige doelen groen:** verificatie-goedkeuring (queue 6→5 + audit), prestatie-goedkeuring →
> concept-factuur, next-action-handoff klopt (ZZP'er krijgt "factuur indienen", opdrachtgever-actie
> verdwijnt), IDOR/cross-collab → "Niet gevonden", priv-esc → redirect, doc-API → 404 JSON, negatieve
> uren → server-side geweigerd. Geen verdere gaten.

---

> **Datum:** 2026-06-24 · **main-commit:** `37357e6` (37357e67ba45cd7304486acf8030b1469b394888)
> **Methode:** verse `npm install` (de container miste opnieuw een runtime-module bij de eerste build) →
> productie-build (`npm run build`) + schema-push + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`, poort 3100) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`, `STORAGE_DRIVER=local`,
> `AUTH_SECRET=ci-dummy-secret-…`. Playwright met de vooraf-geïnstalleerde Chromium
> (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, expliciete `executablePath`) — per rol
> ingelogd (wachtwoord `demo1234`) via het echte login-formulier. Per pad vastgelegd: **HTTP-status**,
> **eind-URL** (detecteert redirects), **`<h1>`** en de gerenderde `main`-tekst (detecteert leak vs.
> weigering) + crash-markers over de `main`-tekst. De adversariële API-paden zijn met een
> **geauthenticeerde in-page `fetch(..., {redirect:"manual"})`** uitgelezen (echte status, content-type
> en body-magic), niet via een ongeauthenticeerde request-context. De XSS-payloads zijn náást
> statuscontrole ook op **scriptuitvoering** (`window.__x`), **levende `<img onerror>`-elementen** én
> **rauwe reflectie in de HTML** gecontroleerd. Cross-party/-tenant-eigendom is tegen de seed-DB
> geverifieerd (IDs uitgelezen via Prisma, niet uit de UI geraden — zie `ids.json`). DOEL 1 is naast
> page-load óók op **actie-affordances** getoetst (knoppen/next-actions echt aanwezig + juiste aantallen).
> De DB is ephemeer; geen enkele poging raakte productie.
> Bewijs: `docs/persona-sweep-2026-06-24/` (4 rol-dashboard-screenshots + `results.json` met de
> volledige padmatrix: **52 functionele** + **29 adversariële UI** probes, `api-results.json` met de
> **9 geauthenticeerde adversariële API**-probes, en `ids.json`).
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local` (Admin Beheerder), FRANCHISER `franchise@zzp-platform.local`
> (Femke / tenant "Zorgbemiddeling Noord").

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout/notFound), nooit een 500/crashpagina of stille toegang.

## Opgelost / gewijzigd sinds de vorige sweep (2026-06-23)

- **Geen nieuwe regressies; alle eerder bevestigde poorten houden stand.** De vorige sweep (23-6,
  commit `0f0dba0`) vond geen gaten. Deze run draaide tegen `37357e6` (na o.a. de berichten-/i18n-merges
  t/m #508) en herbevestigt de isolatie-, authz- en robuustheidspoorten op de actuele `main`.
- **Nieuwe/uitgebreide oppervlakken sinds de vorige sweep mee-geprobed:** het berichten-/inbox-scherm
  (`/berichten`) is voor FREELANCER én CLIENT meegenomen in de functionele matrix, plus de
  CLIENT-`/freelancers`-browse. Alle laadden met echte inhoud (HTTP 200, correcte `<h1>`).
- **Methodische verbetering t.o.v. eerdere runs:** de adversariële API-poorten zijn nu met een
  **geauthenticeerde** in-page `fetch` (met `redirect:"manual"`) gemeten. Een eerdere meting met een
  request-context die de sessiecookie niet meestuurde, las verwarrend "200 HTML" (de gevolgde
  login-redirect) terug; met de cookie-dragende fetch tonen alle poorten hun échte status — **403
  JSON** voor elke verboden toegang en **200 `application/pdf`** alleen voor de eigenaar. Dit is een
  meetfout in een vorige harness, geen platformregressie.
- **Operationele noot (geen platformdefect):** de eerste productie-build faalde op een ontbrekende
  runtime-module; opgelost met `npm install` vóór de build (omgevings-/container-artefact, raakt de
  code niet). Identiek aan de noten van 21-6 t/m 23-6.

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's, geen Prisma-/stacktrace-markers). Alle pogingen tot
**privilege-escalatie**, **IDOR/cross-partij**, **cross-tenant**-toegang, **authz-keten omzeilen**,
**malicieuze input** en **robuustheid** werden correct geweigerd; geen enkel privé-document, vreemde
factuur, samenwerking, profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 52
  kernschermen + filter-/detailroutes over 4 rollen: alle 200, inhoud rendert (steekproef-`<h1>` +
  `main`-tekst bevestigen de doelpagina) én de kern-actie-affordances zijn aanwezig met juiste
  aantallen (zie A). Eén lage observatie (protected soft-404 → HTTP 200) blijft GEACCEPTEERD via
  ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** Adversariële paden (UI + API): alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's, **nul
  scriptuitvoering**. De twee `rawScript`-vlaggen uit het UI-detectiescript zijn **vals-positieven** —
  bevestigd geëscapet (zie sectie B, "Malicieuze input").

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's,
geen crashpagina's, geen redirect-away van een toegestane pagina.

| Rol        | Geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                                                                                                                   | Resultaat |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, opdracht-detail (`job-1`), samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, diensten, rooster, inzicht, prognose, profiel/bewerken, documenten, notificaties, reacties, opgeslagen, berichten, verplichtingen→redirect, administratie | 20/20 OK  |
| CLIENT     | dashboard, opdrachten, opdrachten/nieuw, opdracht-detail (`job-1`), kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, bedrijf, inzicht, administratie, freelancers, berichten                                                                                                     | 14/14 OK  |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, samenwerkingen, support, audit, configuratie, import                                                                                                                                                                 | 12/12 OK  |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie                                                                                                                                                                                                                               | 6/6 OK    |

Steekproef-`<h1>` per scherm bevestigt dat de echte doelpagina rendert: FREELANCER-dashboard
`h1="Sanne de Vries"`, opdracht-detail `h1="Verpleegkundige (somatiek)"`, samenwerking-detail
`h1="Verpleegkundige (detachering)"`, inkomstenprognose `h1="Inkomstenprognose"`; CLIENT-kandidaten
`h1="Kandidaten"`, verplichtingen `h1="Betaalverplichtingen"`, bedrijf `h1="Zorgcentrum Jansen"`;
ADMIN `h1="Platform statistieken"` / `h1="DBA-monitor"` / `h1="Audit log"`; FRANCHISER
`h1="Opdrachtgevers"` / `h1="ZZP'ers"`.

**Actie-affordances (geen dode knoppen, juiste aantallen):** FREELANCER `/certificaten` → "Nieuw
certificaat" (1), `/documenten` → "Document uploaden" (1); CLIENT `/opdrachten` → "Nieuwe opdracht"
(1), `/kandidaten` → "Shortlist" (10) + "Afwijzen" (5); ADMIN `/admin/verificaties` → "Goedkeuren"
(6) + "Afwijzen" (6) — exact gelijk aan de 6 items in de wachtrij; FRANCHISER `/franchise/zzpers` →
"Nieuwe ZZP'er toevoegen" (1). De next-actions zijn aanwezig en passen bij de status van het scherm.
Bewijs: `freelancer-dashboard.png`, `client-dashboard.png`, `admin-dashboard.png`,
`franchiser-dashboard.png` + de volledige padmatrix in `results.json`.

**Geen functionele defecten gevonden.** Eén lage observatie (geen actie):

- **A1 — protected soft-404 geeft HTTP 200 i.p.v. 404 (GEACCEPTEERD, ADR-0009).** Detailroutes met
  een onbekend/vreemd/cross-partij/cross-tenant id (`/samenwerkingen/<x>`, `/facturen/<x>`,
  `/opdrachten/<x>`, `/franchise/.../<x>`) renderen een nette **"Niet gevonden — Dit item bestaat
  niet (meer) of je hebt er geen toegang toe"**-staat binnen de app-layout, met **HTTP 200**. De
  root-`not-found` (volledig onbekende route, bv. `/this-route-does-not-exist` of
  `/admin/this-admin-route-nope`) geeft wél een **echte 404**, net als cross-tenant tenant-gebonden
  profielen via `/zzp/[id]` (404). Semantisch zou 404 zuiverder zijn voor de detail-soft-404's, maar
  er lekt geen data en de toegang wordt geweigerd — bewust geaccepteerd (zie
  `docs/decisions/0009-soft-404-auth-routes.md`).

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Onderstaand wat is geprobeerd en het (correcte) resultaat.

### Privilege-escalatie — alle geweigerd (redirect → `/dashboard`)

10 van 10 priv-esc-pogingen redirecten naar het eigen rol-dashboard; geen rol-vreemde pagina rendert.

| Poging                                                             | Resultaat                                           |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| FREELANCER → `/admin/verificaties`, `/admin/gebruikers`            | redirect → `/dashboard` (200, h1 "Sanne de Vries")  |
| FREELANCER → `/kandidaten` (CLIENT), `/franchise/opdrachtgevers`   | redirect → `/dashboard` (200)                       |
| CLIENT → `/admin/no-shows`, `/certificaten`, `/franchise/zzpers`   | redirect → `/dashboard` (200, h1 "Mark Jansen")     |
| FRANCHISER → `/admin/verificaties`, `/certificaten`, `/kandidaten` | redirect → `/dashboard` (200, h1 "Femke Franchise") |

Geen enkele rol-vreemde pagina rendert; geen `AuthorizationError`/markers in de output. De
FREELANCER → `/verplichtingen` (een CLIENT-route) redirect correct naar `/administratie` (rol-gepaste
boekhouding) — geen rol-vreemde render.

### IDOR / cross-partij — alle geweigerd, geen leak

- FREELANCER (Sanne) → `/samenwerkingen/<Emma's collab>` en `/facturen/<vreemde factuur, PAID>` →
  **"Niet gevonden — geen toegang"** (alleen de not-found-tekst in `main`, geen enkel veld van de
  andere partij).
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
  resp. _profile-id_, uitgelezen uit de echte seed-DB — zie `ids.json`).
- CLIENT (default-tenant) → `/zzp/<Noord-gebonden profileId Lars Bakker>` → **echte 404**
  (`tenantEntityVisibleTo` weigert cross-tenant tenant-gebonden profielen).

### Document-privacy — correct (geauthenticeerde API-route)

- Niet-eigenaar (CLIENT én FRANCHISER) → `GET /api/documents/<Sanne's doc>` → **403**
  `{"error":"Geen toegang."}`; andere FREELANCER → `GET /api/documents/<Emma's doc>` → **403**.
- Eigenaar (Sanne) → `GET /api/documents/<eigen doc>` → **200** `application/pdf` (`%PDF-1.7…`).

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
- `/rooster?match=<img src=x onerror=window.__x=1>` (FREELANCER) → **200**, geen scriptuitvoering,
  **0 levende `<img onerror>`-elementen**. Het detectiescript markeerde "raw" omdat de substring in de
  HTML voorkwam, maar bij inspectie staat de payload uitsluitend in de **RSC-payload** als
  URL-encoded string (`rooster?match=%3Cimg+src%3Dx+onerror%3Dwindow.__x%3D1%3E`) — geen levend tag,
  dus vals-positief.
- `/admin/samenwerkingen?q=<script>…` en `/admin/gebruikers?q='><img … onerror=…>` (ADMIN) → **200**,
  geen uitvoering, **0 levende `<img onerror>`-elementen**. De `/admin/gebruikers`-reflectie staat in
  de waarde van het zoek-`input` correct geëscapet: `value="'&gt;&lt;img src=x onerror=window.__x=1&gt;"`
  — de `<`/`>` zijn `&lt;`/`&gt;`, dus de payload kan niet uit het attribuut breken. React escapet de
  reflectie; ook hier vals-positief op de substring.

(De diepere `/profiel/bewerken`-input-injectie — negatief tarief, lange XSS-`headline` — werd in een
eerdere sweep tegen de DB geverifieerd als **niet gepersisteerd**; ongewijzigd op `main`.)

### Robuustheid — geen 500's

- Onzin-id's op detailroutes → "Niet gevonden" soft-404 (200, zie A1); volledig onbekende routes
  (`/this-route-does-not-exist`, `/admin/this-admin-route-nope`) → **echte 404**.
- **Over de hele run: 0 HTTP-500's en 0 crash-/Prisma-markers** (90 probes: 52 functioneel + 29
  adversarieel UI + 9 adversarieel API). De `serverErrors`-teller in `results.json` staat op `2`,
  uitsluitend door twee vals-positieve substring-vlaggen: de crash-regex matchte het woord **"stack"**
  binnen de functietitel **"Fullstack Developer"** op `/freelancers` en `/admin/samenwerkingen` —
  beide pagina's renderden volledig (2968 resp. 1765 tekens, correcte `<h1>`), er was geen 500 en geen
  scriptuitvoering.
