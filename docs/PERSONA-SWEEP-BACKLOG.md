# Persona-sweep — gaten-backlog

> **Datum:** 2026-06-15 · **main-commit:** `12019b0` (12019b0faa08d5c7e92bbadb90edfaa476103809)
> **Methode:** productie-build + idempotente demo-seed (`SEED_DEMO=true`) op een ephemere
> SQLite-DB (`qa.db`); Playwright/Edge per rol ingelogd (wachtwoord `demo1234`).
> Bewijs-screenshots: `docs/persona-sweep-2026-06-15/`.
> Accounts: FREELANCER `zzp@`, CLIENT `opdrachtgever@`, ADMIN `admin@zzp-platform.local`,
> FRANCHISER `franchise@zzp-platform.local`.

Twee doelen per run: **(1) werkt het** per rol, en **(2) stress/adversarieel** — bewust proberen
wat NIET mag (privilege-escalatie, IDOR/cross-tenant, authz-keten omzeilen, verboden
statusovergangen, malicieuze input, robuustheid). Verwacht bij doel 2: altijd geweigerd
(404/403/redirect/Zod-fout), nooit een 500 of stille toegang.

---

## Samenvatting

**Een schone run.** Alle kernschermen voor de vier rollen laden en renderen echte inhoud (geen
500's, geen dode schermen in de geteste set). Alle adversariële pogingen werden correct geweigerd:
privilege-escalatie, cross-partij/cross-tenant IDOR, privé-document-toegang, onzin-/injectie-id's en
XSS. De mutatie-commando's (cascade) dwingen stuk voor stuk `actor.id`/rol af vóór ze schrijven.

- **Sectie A — functionele defecten:** geen blokkerende defecten gevonden; 1 lage observatie
  (soft-404 levert HTTP 200 i.p.v. 404 op de detailroutes).
- **Sectie B — beveiligings-/robuustheidsgaten:** **geen gaten gevonden in deze run.**

Dit is de eerste vastgelegde persona-sweep-backlog; er is geen vorige run om "opgelost sinds"
tegen af te zetten.

---

## A. Werkt niet zoals het hoort (functionele defecten — doel 1)

Per rol doorlopen kernschermen + één kernflow; alle gaven HTTP 200 met echte inhoud, geen 500's.

| Rol        | Geteste schermen                                                                                                                                             | Resultaat                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| FREELANCER | dashboard, certificaten, opdrachten, samenwerkingen, prestaties, facturen, diensten, rooster, inzicht, prognose, profiel/bewerken, eigen samenwerking-detail | alle 200, inhoud rendert |
| CLIENT     | dashboard, opdrachten, kandidaten, prestaties, facturen, verplichtingen, samenwerkingen, opdrachten/nieuw, inzicht                                           | alle 200, inhoud rendert |
| ADMIN      | verificaties, disputen, statistieken, no-shows, dba, gebruikers, facturatie, support, audit                                                                  | alle 200, inhoud rendert |
| FRANCHISER | opdrachtgevers, zzpers, diensten, samenwerkingen, leads, facturatie                                                                                          | alle 200, inhoud rendert |

**Kernflow geverifieerd (ADMIN):** verificatie-wachtrij goedkeuren werkt — een goedgekeurd
certificaat verlaat de wachtrij (6 → 5 kaarten na één goedkeuring). Afwijzen vereist een reden
(client-side `required minLength`, server-side afgedwongen in `statusForDecision`).
Bewijs: `verif_debug.png`, `verif_after_approve.png`.

### A1 — LAAG · Soft-404 op detailroutes geeft HTTP 200 i.p.v. 404

- **Rol/scherm:** alle rollen, detailroutes `/samenwerkingen/[id]`, `/facturen/[id]`,
  `/opdrachten/[id]`.
- **Waarneming:** een onbestaand of niet-toegankelijk id rendert correct de nette
  "Niet gevonden / je hebt er geen toegang toe"-pagina (geen datalek, zie sectie B), maar de
  HTTP-statuscode van het document is **200**. De route `/zzp/[id]` geeft daarentegen wél een
  echte **404**. Inconsistent.
- **Repro:** log in als willekeurige rol → open `/samenwerkingen/zzz-nonexistent-123` → pagina toont
  "Niet gevonden", netwerk-status 200. Vergelijk `/zzp/zzz-nonexistent-123` → status 404.
- **Geschonden regel:** geen architectuurregel; wel een lichte correctheids-/SEO-/API-hygiëne-afwijking
  (een notFound hoort 404 te zijn). Komt waarschijnlijk doordat `notFound()` na het starten van de
  streaming-shell wordt aangeroepen, waardoor de status al op 200 vaststaat.
- **Prioriteit:** LAAG — geen functioneel of veiligheidsprobleem; de gebruiker ziet de juiste
  melding en er lekt niets.
- **Suggestie:** als consistentie gewenst is, de toegangs-/bestaanscheck vóór de eerste streaming-render
  uitvoeren (of een dedicated `not-found.tsx` met expliciete status), zodat detailroutes net als
  `/zzp/[id]` een echte 404 teruggeven. Optioneel, kosten/baten afwegen.

---

## B. Beveiligings-/robuustheidsgaten (doel 2)

**Geen gaten gevonden in deze run.** Alle onderstaande adversariële pogingen werden geweigerd zoals
de architectuurregels voorschrijven. Wat is geprobeerd en het resultaat:

### Privilege-escalatie naar /admin/\*

- **Geprobeerd:** als FREELANCER, CLIENT én FRANCHISER de admin-schermen openen:
  `/admin/verificaties`, `/disputen`, `/statistieken`, `/gebruikers`, `/no-shows`, `/dba`,
  `/facturatie`, `/import`, `/configuratie`, `/audit`, `/avg` (33 pogingen).
- **Resultaat:** elke poging → **redirect naar `/dashboard`**, geen admin-inhoud. ✅ Geweigerd.

### IDOR / cross-partij

- **Geprobeerd:** CLIENT `opdrachtgever@` (Jansen) opent samenwerking, factuur én dossier van een
  **andere** opdrachtgever (zorggroep): `/samenwerkingen/<andere>`, `/facturen/<andere-draft>`,
  `/samenwerkingen/<andere>/dossier`.
- **Resultaat:** "Niet gevonden / je hebt er geen toegang toe", geen data van de andere partij. ✅
  Geweigerd. Bewijs: `idor_client_other-client-collab.png`, `idor_client_other-client-invoice.png`.
- **Geprobeerd:** FREELANCER `zzp@` (Sanne) opent een samenwerking van een **andere** ZZP'er →
  geweigerd. ✅
- **Bevestigd in code:** `samenwerkingen/[id]/page.tsx` regel 121–125 (`notFound()` als de actor noch
  client, noch freelancer, noch admin is).

### Privé-document van een ander

- **Geprobeerd:** FREELANCER `zzp@` haalt via `/api/documents/<id van youssef>` het privé-document
  van een andere gebruiker op.
- **Resultaat:** **403** (en de poging wordt geaudit als `DOCUMENT_ACCESS_DENIED`). Eigen document
  geeft 200. ✅ Geweigerd (CLAUDE.md regel 4 + 5).

### Cross-tenant (franchiser)

- **Geprobeerd:** FRANCHISER `franchise@` (tenant Zorgbemiddeling Noord) opent een samenwerking,
  factuur en opdracht van de **niet-franchise** tenant (Jansen + Sanne): `/samenwerkingen/collab-1`,
  `/facturen/<collab-1-factuur>`, `/opdrachten/job-8`.
- **Resultaat:** "Niet gevonden / geen toegang". ✅ Geweigerd. Bewijs:
  `xtenant_other-tenant-collab.png`.

### Authz-keten omzeilen (verboden mutaties)

- **Bevestigd in code (read + grep over alle cascade-commando's):** elke mutatie checkt eigenaarschap
  - rol vóór de schrijfactie:
  * prestatie vastleggen/indienen → alleen de ZZP'er (`actor.id === col.freelancer.userId`);
  * prestatie goedkeuren/afkeuren → alleen de opdrachtgever (`actor.id === perf.clientUserId`);
  * factuur indienen/crediteren → alleen de uitschrijver (`inv.issuerUserId`);
  * factuur goedkeuren/afkeuren → alleen de tegenpartij (`inv.counterpartyUserId`);
  * betaling registreren → uitschrijver óf tegenpartij;
  * dispuut oplossen → alleen ADMIN.
    Bij overtreding: `CascadeError` met leesbare melding, geen schrijfactie. ✅
- **UI-bevestiging:** de detailpagina's van een niet-eigen samenwerking renderen sowieso `notFound()`,
  dus de mutatieknoppen zijn niet eens bereikbaar.

### Verboden statusovergangen

- **Bevestigd:** credential-afwijzing zonder reden wordt geweigerd door `statusForDecision`
  (gooit bij lege reden of ongeldige overgang); statusovergangen lopen via expliciete maps
  (CLAUDE.md regel 3). ✅

### Malicieuze input / XSS

- **Geprobeerd:** opdracht-formulier (CLIENT) met `<script>alert(1)</script>` als titel en een
  negatief tarief.
- **Resultaat:** geen scriptuitvoering, de ruwe `<script>`-string wordt **niet** rauw in de DOM
  gereflecteerd; het formulier bleef op `/opdrachten/nieuw` staan (validatie hield het tegen). ✅
  Bewijs: `client_opdracht_nieuw_form.png`.

### Robuustheid (onzin-/injectie-id's, niet-bestaande routes)

- **Geprobeerd:** `/samenwerkingen/zzz-nonexistent`, `/facturen/zzz-nonexistent`,
  `/zzp/zzz-nonexistent`, `/opdrachten/zzz-nonexistent`, `/samenwerkingen/' OR 1=1--`,
  `/facturen/%00null`, `/zzp/../../etc/passwd`.
- **Resultaat:** **geen enkele 500.** Alles leverde een nette "Niet gevonden"-pagina of een echte
  404 op. ✅ (Zie sectie A1 voor de status-code-inconsistentie — geen veiligheidsprobleem.)

---

## Reproductie

```bash
# Build + seed + start (ephemere DB; abuse is veilig, nooit tegen productie)
DATABASE_URL="file:./qa.db" AUTH_SECRET="ci-dummy-secret-minstens-16-tekens-lang" \
  STORAGE_DRIVER=local SEED_DEMO=true npm run build
DATABASE_URL="file:./qa.db" npx prisma db push --skip-generate && npm run db:seed
CI=true DATABASE_URL="file:./qa.db" AUTH_SECRET="ci-dummy-secret-minstens-16-tekens-lang" \
  STORAGE_DRIVER=local LOGIN_RATE_LIMIT=100000 REGISTER_RATE_LIMIT=100000 npm run start
# Daarna per rol inloggen (demo1234) en de bovenstaande paden/aanvallen aflopen.
```
