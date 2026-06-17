# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-17 · **main-commit:** `1ba58a3` (1ba58a38dd11e9754fce8c2835ff265085af88a8)
> **Methode:** productie-build (`npm run build`) + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`; Playwright/Edge (msedge) per rol ingelogd
> (wachtwoord `demo1234`). Per pad vastgelegd: **HTTP-status**, **eind-URL** (detecteert redirects),
> **`<h1>`** en een **niet-gevonden/crash-marker** uit de body. Bewijs-screenshots (28 stuks):
> `docs/persona-sweep-2026-06-17/`.
> Accounts: FREELANCER `zzp@` (Sanne de Vries), CLIENT `opdrachtgever@` (Mark Jansen / Zorgcentrum
> Jansen), ADMIN `admin@zzp-platform.local`, FRANCHISER `franchise@zzp-platform.local` (tenant
> "Zorgbemiddeling Noord"). Cross-party/-tenant-eigendom is tegen de seed-DB geverifieerd, niet uit
> de UI afgeleid. De DB is ephemeer; geen enkele poging raakte productie.

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout), nooit een 500/crashpagina of stille toegang.

## Opgelost sinds de vorige sweep (2026-06-16)

- **B1 (cross-role-crash, MEDIUM) — bevestigd OPGELOST en live geverifieerd.** De vorige sweep zag
  nog de generieke crashpagina "Er ging iets mis" wanneer een verkeerde rol een role-gated pagina
  buiten `/admin`/`/franchise` opende. Die fix (PR #395, `roleForPath()` in `src/lib/route-guards.ts`
  - middleware-redirect) zit nu op de basis-commit en is deze run **end-to-end bevestigd**:
    FREELANCER → `/kandidaten`, `/bedrijf`, `/verplichtingen` en CLIENT → `/certificaten`, `/reacties`,
    `/diensten` geven nu een **schone redirect naar `/dashboard`** (geen crashpagina, geen
    `⨯ Error [AuthorizationError]` in de server-log). Bewijs: `ADV-freelancer-kandidaten.png` en
    `ADV-client-certificaten.png` (identiek aan de dashboard-screenshot — de redirect is geslaagd).
- **A1 (soft-404, LAAG) — blijft GEACCEPTEERD** via `docs/decisions/0009-soft-404-auth-routes.md`.
  Niet opnieuw als defect opgevoerd (zie sectie A).

## Samenvatting

**Geen gaten gevonden in deze run.** Alle vier rollen laden hun kernschermen met echte inhoud (alle
HTTP 200, geen 500's, geen crashpagina's). Alle pogingen tot **privilege-escalatie**,
**IDOR/cross-partij**, **cross-tenant**-toegang, **authz-keten omzeilen**, **malicieuze input** en
**robuustheid** werden correct geweigerd; geen enkel privé-document, vreemde factuur, samenwerking,
profiel of dossier werd zichtbaar.

- **Sectie A — functionele defecten:** **geen** blokkerende of niet-blokkerende defecten. 42
  kernschermen over 4 rollen: alle 200, inhoud rendert. 1 lage observatie (soft-404 → HTTP 200) blijft
  GEACCEPTEERD via ADR-0009, geen actie.
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten.** 32 adversariële paden: alle
  geweigerd (redirect/403/404/notFound), nul 500's, nul leaks, nul crashpagina's. Negatieve tarieven
  en een 400-teken-XSS-string werden bij het profiel-opslaan **niet gepersisteerd** (server-side Zod +
  client-validatie), geen script in de DOM. Cron-eindpunten weigeren ongeauthenticeerd (503 "niet
  geconfigureerd" in deze QA-omgeving; met `CRON_SECRET` gezet → 401 bij ontbrekende/foute bearer).

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen én -detailroutes doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's,
geen crashpagina's.

| Rol        | Geteste schermen (allemaal 200, inhoud rendert)                                                                                                                                                               | Resultaat |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FREELANCER | dashboard, certificaten, opdrachten, samenwerkingen, samenwerking-detail (`collab-1`), prestaties, facturen, factuur-detail (`2026-0001`), diensten, rooster, inzicht, prognose, profiel/bewerken, documenten | 14/14 OK  |
| CLIENT     | dashboard, opdrachten, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, samenwerking-detail, opdrachten/nieuw, inzicht, bedrijf                                                              | 11/11 OK  |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, support, audit                                                                                                                   | 9/9 OK    |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie, eigen-tenant opdrachtgever-detail (Noorderbrug)                                                                                          | 7/7 OK    |

Steekproef-`<h1>` per scherm bevestigt dat de echte doelpagina rendert (bv. FREELANCER-dashboard
`h1="Sanne de Vries"`, factuur-detail `h1="Factuur 2026-0001"`, ADMIN `h1="Platform statistieken"`,
FRANCHISER eigen-tenant-detail `h1="Verpleeghuis De Noorderbrug"`). Bewijs o.a.
`freelancer-dashboard.png`, `freelancer-factuur-detail.png`, `client-kandidaten.png`,
`admin-verificaties.png`, `admin-statistieken.png`, `franchiser-zzpers.png`,
`franchiser-eigen-og.png`. De admin-verificatiewachtrij toont kaarten met goedkeur-/afkeur-acties
(afkeuren vereist een reden, server-side afgedwongen — niet gemuteerd in deze run).

### A1 — LAAG · Soft-404 op detailroutes geeft HTTP 200 i.p.v. 404 — GEACCEPTEERD (ADR-0009)

> **Status: dicht, geen actie.** Bewust geaccepteerd in `docs/decisions/0009-soft-404-auth-routes.md`
> (15-6): inherent App-Router-streaming-gedrag (de async `(protected)/layout.tsx` +
> `loading.tsx`-Suspensegrenzen flushen de app-schil met 200 vóór de pagina `notFound()` bereikt),
> geen datalek (ownership-/tenant-checks vóór render), achter login (geen SEO-impact). Een echte 404
> forceren zou de laadskeletons opofferen (harde DESIGN-regel "elke view heeft een laadstaat"). De
> sweep toetst daarom de zichtbare niet-gevonden-marker i.p.v. de brosse statuscode. Niet "fixen" door
> laadstaten te slopen. Opnieuw waargenomen deze run (bv. `/samenwerkingen/onzin-…` → status 200 +
> "Niet gevonden"-marker), als verwacht — geen nieuw defect.

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Hieronder wat is geprobeerd en hoe het correct werd geweigerd.

### Wat correct werd geweigerd (geen gaten)

- **Privilege-escalatie (cross-rol):** FREELANCER/CLIENT/FRANCHISER op `/admin/*` → schone
  **redirect naar `/dashboard`** (middleware `isAdminPath`). ADMIN op `/franchise/*` → redirect
  (`isFranchisePath`). FREELANCER op `/franchise/zzpers`, CLIENT op `/franchise/opdrachtgevers` →
  redirect. Bewijs: `ADV-freelancer-admin-gebruikers.png`.
- **Cross-rol pagina's buiten `/admin` & `/franchise`** (de vorige B1): FREELANCER → `/kandidaten`,
  `/bedrijf`, `/verplichtingen`; CLIENT → `/certificaten`, `/reacties`, `/diensten`; ADMIN/FRANCHISER →
  `/kandidaten` → allemaal **schone redirect naar `/dashboard`** (geen crashpagina, geen error-log).
  Bewijs: `ADV-freelancer-kandidaten.png`, `ADV-client-certificaten.png`.
- **IDOR / cross-partij:** FREELANCER (Sanne) op andermans samenwerking (`…z00053…`, emma+ZorgGroep)
  en andermans factuur (`…87h009e…`, datic/bram, PAID) → **geweigerd** ("Niet gevonden / geen
  toegang"), geen `ZorgGroep`-secret zichtbaar. CLIENT (Mark) op een samenwerking van een andere
  opdrachtgever (`…86p0090…`, datic) en op zowel een PAID- als een DRAFT-factuur van een andere OG →
  **geweigerd**, geen `Datic`-secret zichtbaar. Bewijs: `ADV-freelancer-othercollab.png`.
- **Authz-keten omzeilen (privé-bestanden & API-mutatie/-export):**
  - FREELANCER op `GET /api/documents/<youssef-doc>` (privé-document van een andere ZZP'er) → **403**.
  - FREELANCER & CLIENT op `GET /api/facturen/<andermans-factuur>/pdf` → **403**.
  - FREELANCER op `GET /api/samenwerkingen/<andermans-collab>/dossier` → **403**.
  - Cron-eindpunten ongeauthenticeerd: `POST /api/tasks/run-all`, `/expiry`, `/payment-reminders` →
    **503** ("Taak-endpoint niet geconfigureerd" — `CRON_SECRET` is in deze QA-omgeving niet gezet; in
    productie met secret → 401 bij ontbrekende/foute bearer; geen ongeautoriseerde uitvoering, geen 200).
  - `POST /api/billing/webhook`, `POST /api/push/subscribe`, ongeauth. `GET /api/documents/<id>` →
    **307** (redirect, geen verwerking).
- **Cross-tenant (franchiser):** FRANCHISER "Noord" op een opdrachtgever **buiten** de eigen tenant
  (`Zorgcentrum Jansen` en `ZorgGroep Midden`, beide tenant `null`) → **geweigerd** (status 200 + nette
  "geen toegang"-marker, geen `Zorgcentrum Jansen`/`ZorgGroep Midden`-secret zichtbaar). Op een
  samenwerking buiten de eigen tenant → **404**. De eigen-tenant opdrachtgever (Noorderbrug) opent wél
  — correct. Bewijs: `ADV-franchiser-crosstenant-og.png`, `franchiser-eigen-og.png`.
- **Verboden statusovergangen / mutatie zonder ownership:** de cascade-mutaties (uren/factuur
  goedkeuren-afkeuren, betaling markeren) zitten op `/samenwerkingen/[id]`, die voor een
  niet-eigenaar al **niet rendert** (notFound) — de server-action-knoppen zijn dus niet bereikbaar, en
  de command-laag dwingt ownership + `assertTransition` af. Geen losse REST-mutatie-endpoints om te
  forceren (server-actions met versleutelde action-id's). Geen poging slaagde.
- **Malicieuze input:** FREELANCER op `/profiel/bewerken` met `hourlyRate = -50` en een
  `headline` van `<script>alert(document.cookie)</script>` + 400 tekens → **niet gepersisteerd**
  (na herladen: tarief nog `52`, headline-lengte nog `35`; de volledige update werd atomair
  geweigerd), **geen script in de DOM** op het dashboard. Server-side Zod
  (`freelancerProfileSchema`: `hourlyRate` int 0–2000, headline cap 120, bio cap 2000) + client-
  validatie houden beide stand.
- **Robuustheid (onzin-/injectie-id's & onbekende routes):** `/this-route-does-not-exist-zzz` → **404**,
  `/admin/verificaties/junk-…` → **404**, `/franchise/samenwerkingen/junk-…` → **404**, een ~5000-teken
  factuur-pdf-id → **307** (redirect, geen crash). `/samenwerkingen/onzin-…` en `/opdrachten/onzin-…` →
  soft-404 (status 200 + "Niet gevonden"-marker, A1). **Geen enkele 500.**

---

## Methodenoot

Statusbepaling adversarieel: per pad de **HTTP-status**, de **uiteindelijke URL** (detecteert
redirects) en de **body-marker** (`Niet gevonden|geen toegang|Er ging iets mis`) vastgelegd
(onderscheidt een gerenderde doelpagina van een weigerings-/crash-state). Een pad telt als "gat" bij
een 500, een zichtbaar secret van een andere partij, een crashpagina, of stille toegang tot een
verboden route — niets daarvan trad op. Eigendoms-claims (welke factuur/samenwerking/company van wie
is, en in welke tenant) zijn tegen de seed-DB geverifieerd. De DB is ephemeer (`qa.db`); geen poging
raakte productie.
