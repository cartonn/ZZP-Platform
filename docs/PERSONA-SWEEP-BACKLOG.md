# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-16 · **main-commit:** `f3652c5` (f3652c5da15674a6457acff2601760a4f79991cf)
> **Methode:** productie-build (`npm run build`) + idempotente demo-seed (`SEED_DEMO=true`) op een
> ephemere SQLite-DB (`qa.db`); productie-server (`CI=true npm run start`) met
> `LOGIN_RATE_LIMIT/REGISTER_RATE_LIMIT=100000`; Playwright/Edge per rol ingelogd (wachtwoord
> `demo1234`). Bewijs-screenshots: `docs/persona-sweep-2026-06-16/`.
> Accounts: FREELANCER `zzp@` (Sanne), CLIENT `opdrachtgever@` (Mark/Zorgcentrum Jansen),
> ADMIN `admin@zzp-platform.local`, FRANCHISER `franchise@zzp-platform.local` (tenant
> "Zorgbemiddeling Noord").

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout), nooit een 500/crashpagina of stille toegang.

## Opgelost sinds de vorige sweep (2026-06-15)

De vorige run vond geen beveiligingsgaten (alleen 1 lage soft-404-observatie A1). Die soft-404 is
**nog niet** geadresseerd (zie A1 hieronder, ongewijzigd). Nieuw onderzocht deze run: de role-gated
pagina's **buiten** `/admin` en `/franchise` (vorige run testte alleen de `/admin/*`-escalatie).
Daar komt het enige nieuwe gat van deze run uit (B1).

---

## Samenvatting

**Geen toegangs-/datalekken.** Alle vier rollen laden hun kernschermen met echte inhoud (geen
500's, geen dode schermen). Alle pogingen tot **privilege-escalatie**, **IDOR/cross-partij** en
**cross-tenant**-toegang werden correct geweigerd; geen enkel privé-document of vreemde
factuur/samenwerking/profiel werd zichtbaar. Server-side validatie (Zod) op de profiel-/tariefvelden
weigert negatieve/absurde waarden en cap te lange tekst.

- **Sectie A — functionele defecten:** geen blokkerende defecten; 1 lage observatie (soft-404 →
  HTTP 200, ongewijzigd t.o.v. 15-6).
- **Sectie B — beveiligings-/robuustheidsgaten:** **1 MEDIUM** — role-gated pagina's buiten
  `/admin` en `/franchise` weigeren toegang via een **ongevangen `AuthorizationError`** die als de
  generieke crashpagina "Er ging iets mis" rendert (+ server-error-log), i.p.v. een nette
  redirect/403 zoals `/admin` en `/franchise` wél krijgen. Geen datalek, wél verkeerd
  weigerings-mechanisme.

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol de kernschermen doorlopen; alle gaven HTTP 200 met echte inhoud, geen 500's.

| Rol        | Geteste schermen                                                                                                                  | Resultaat                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| FREELANCER | dashboard, certificaten, opdrachten, samenwerkingen, prestaties, facturen, diensten, rooster, inzicht, prognose, profiel/bewerken | alle 200, inhoud rendert |
| CLIENT     | dashboard, opdrachten, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, opdrachten/nieuw, inzicht                | alle 200, inhoud rendert |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, support, audit                                       | alle 200, inhoud rendert |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie                                                               | alle 200, inhoud rendert |

Bewijs: `admin-verificaties.png`, `admin-statistieken.png`, `freelancer-dashboard.png`,
`freelancer-samenwerkingen.png`, `client-dashboard.png`, `client-kandidaten.png`,
`franchiser-zzpers.png`. Een eigen factuur (Sanne, `Factuur 2026-0001`/`collab-1`) opent correct met
volledige inhoud; de admin-verificatiewachtrij laadt kaarten met goedkeur-/afkeur-acties (afkeuren
vereist een reden, server-side afgedwongen).

### A1 — LAAG · Soft-404 op detailroutes geeft HTTP 200 i.p.v. 404 (ongewijzigd t.o.v. 15-6)

- **Rol/scherm:** alle rollen, detailroutes `/samenwerkingen/[id]`, `/facturen/[id]`,
  `/opdrachten/[id]`.
- **Waarneming:** een onbestaand of niet-toegankelijk id rendert correct de nette "Niet gevonden /
  geen toegang"-pagina (geen datalek), maar de HTTP-statuscode is **200**. `/zzp/[id]` geeft
  daarentegen wél een echte **404**. Inconsistent.
- **Repro:** elke rol → `/samenwerkingen/zzz-nonexistent-999` → "Niet gevonden", netwerk-status 200.
  Vergelijk `/zzp/ghost` → status 404, en `/this-route-does-not-exist` → 404.
- **Geschonden regel:** geen architectuurregel; lichte correctheids-/API-hygiëne-afwijking (een
  `notFound()` hoort 404 te zijn). Komt doordat `notFound()` na het starten van de streaming-render
  wordt aangeroepen; de shell is dan al met 200 verzonden.
- **Suggestie:** de access-/bestaanscheck vóór de eerste render (in de page-loader) uitvoeren zodat
  `notFound()` de 404-status nog kan zetten — of expliciet documenteren dat dit acceptabel is en de
  observatie sluiten.

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

### Wat correct werd geweigerd (geen gaten)

- **Privilege-escalatie:** FREELANCER/CLIENT/FRANCHISER op `/admin/*` → schone **redirect naar
  `/dashboard`** (middleware `isAdminPath`); wrong-role op `/franchise/*` idem
  (`isFranchisePath`); ADMIN op `/franchise/*` → redirect. Bewijs: `OK-freelancer-on-admin-redirect.png`.
- **IDOR / cross-partij:** FREELANCER (Sanne) op andermans samenwerkingen (`cmqg6nkw6…` ZorgGroep,
  `cmqg6nl43…` Datic) → **geweigerd** ("Niet gevonden/geen toegang"). CLIENT (Mark) op
  facturen/samenwerkingen van een andere opdrachtgever (emma/iris ↔ ZorgGroep) → **geweigerd**. Een
  eigen factuur opent wél — correct (geverifieerd tegen de DB: `collab-1` hoort bij Sanne).
- **Cross-tenant (franchiser):** FRANCHISER "Noord" op een opdrachtgever (`Zorgcentrum Jansen`),
  ZZP'er (Sanne) en samenwerking buiten de eigen tenant → **geweigerd** (`/franchise/opdrachtgevers/…`
  en `/franchise/zzpers/…` tonen "geen toegang"; `/franchise/samenwerkingen/…` → 404). Tenant-scoping
  leunt correct op `tenantId`.
- **Robuustheid (onzin-/injectie-id's):** `/zzp/ghost` → 404, `/this-route-does-not-exist` → 404,
  `/admin/verificaties/junk` → 404, `/franchise/samenwerkingen/junk` → 404. Geen enkele 500.
- **Malicieuze input:** profiel-/tariefvalidatie (`freelancerProfileSchema`) dwingt
  `hourlyRate = int, 0–2000` af en cap't tekstvelden (headline 120, bio 2000); negatieve/absurde
  bedragen en script-strings worden server-side door Zod geweigerd. KvK/BTW via `superRefine`.

### B1 — MEDIUM · Cross-role pagina's buiten `/admin` & `/franchise` crashen i.p.v. nette weigering

- **Rol/scherm:** elke verkeerde rol op een role-gated pagina die **niet** onder `/admin` of
  `/franchise` valt. Bevestigd: FREELANCER → `/kandidaten`, FREELANCER → `/bedrijf`,
  CLIENT → `/certificaten`, CLIENT → `/reacties`. Geldt voor ~14 pagina's met `requireRole(...)`
  buiten die twee prefixes (o.a. `documenten`, `beschikbaarheid`, `profiel`, `facturen/nieuw`,
  `favorieten`, `opdrachten/nieuw`, `opdrachten/[id]/bewerken`).
- **Waarneming:** `requireRole("CLIENT")`/`requireRole("FREELANCER")` werpt een
  `AuthorizationError` (403) die **niet wordt gevangen/geredirect**. Hij bubbelt naar de
  protected-foutgrens (`src/app/(protected)/error.tsx`) en rendert de **generieke crashpagina
  "Er ging iets mis"** (HTTP 200), terwijl de server hem als `⨯ Error [AuthorizationError]: Geen
toegang: vereist rol …` logt. Contrast: `/admin/*` en `/franchise/*` worden door de middleware
  **schoon geredirect** naar `/dashboard`.
- **Repro:**
  1. Log in als FREELANCER (`zzp@`, `demo1234`).
  2. Open `/kandidaten` (CLIENT-only) → pagina toont "Er ging iets mis" (de crashgrens), HTTP 200.
     Idem `/bedrijf`. Server-log: `⨯ Error [AuthorizationError]: Geen toegang: vereist rol CLIENT.`
  3. Log in als CLIENT (`opdrachtgever@`) → open `/certificaten` of `/reacties` (FREELANCER-only) →
     "Er ging iets mis"; server-log `… vereist rol FREELANCER.`
  4. Vergelijk FREELANCER → `/admin/gebruikers` → schone redirect naar `/dashboard` (geen crash,
     geen error-log).
  - Bewijs: `BUG-freelancer-on-kandidaten.png`, `BUG-freelancer-on-bedrijf.png`,
    `BUG-client-on-certificaten.png`, `BUG-client-on-reacties.png` vs.
    `OK-freelancer-on-admin-redirect.png`.
- **Geschonden regel:** de sweep-/DoD-norm "een verboden actie wordt **geweigerd via 403/redirect/
  notFound — NOOIT een 500/crashpagina**". Geen datalek (de foutgrens toont niets gevoeligs), maar
  het weigerings-mechanisme is verkeerd: een crashpagina i.p.v. een nette weigering, en elke poging
  vervuilt de server-error-log (`⨯ Error`) — dat maskeert echte fouten in productie-monitoring en is
  een afwijking van de "elke view heeft een nette state"-designregel.
- **Severity:** MEDIUM (geen leak/escalatie; wél verkeerd gedrag + log-vervuiling + slechte UX).
- **Suggestie (klein, gericht):** kies één van:
  1. **Voorkeur — middleware uitbreiden:** een role→toegestane-routes-map in `lib/route-guards.ts`
     en in `middleware.ts` analoog aan `isAdminPath`/`isFranchisePath` een schone redirect naar
     `/dashboard` doen voor role-gated niet-prefix-pagina's. Houdt de weigering uniform en uit de
     error-log.
  2. **Foutgrens-fix:** `AuthorizationError` herkennen (status 401/403) in
     `src/app/(protected)/error.tsx` en dan een rustige "Geen toegang"-state tonen i.p.v. "Er ging
     iets mis" — zonder `console.error` voor die klasse, zodat de log schoon blijft. (Minste code;
     lost UX + log-ruis op, maar laat de HTTP-200 staan.)
     Optie 1 is het meest in lijn met de bestaande defense-in-depth (`/admin`, `/franchise` worden óók
     in de middleware afgevangen).

---

## Methodenoot

Statusbepaling adversarieel: per pad de **HTTP-status**, de **uiteindelijke URL** (detecteert
redirects) en de **`<h1>`** vastgelegd (onderscheidt een gerenderde doelpagina van een
"Niet gevonden"/"Er ging iets mis"-state). Eigendoms-claims (welke factuur/samenwerking van wie is)
zijn tegen de seed-DB geverifieerd, niet alleen uit de UI afgeleid. De DB is ephemeer (`qa.db`);
geen enkele poging raakte productie.
