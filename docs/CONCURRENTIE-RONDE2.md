# Concurrentie-onderzoek ronde 2 — verdieping PIDZ/Bendy + adjacente zorg-ZZP-platformen

> Vervolg op het ronde-1-onderzoek (zie `CURRENT_TASK.md` → "Concurrentie-backlog"). Verdiept de
> kernconcurrenten en synthetiseert principes → concrete schermen → een **build/park-backlog**,
> afgezet tegen wat ZZP Platform al heeft. Bron: openbare web-/leveranciersinformatie (juni 2026).
> Dit document is de beslis-trail; de **bouwen**-items worden als losse PR's geleverd.

## Per concurrent — waar zij beter zijn, waar wij beter zijn

### PIDZ (zorg-ZZP-bemiddeling, regiokantoren)

- **Beter:** echte liquiditeit en regionale screening-diepte (8.500+ opdrachten/week, fysieke intake
  per regiokantoor, automatische uitnodiging van matchende ZZP'ers vult diensten "binnen uren").
- **Slechter:** matching is regel-gebaseerd zónder verklaarbare redenen; het dossier zit verborgen
  achter de bemiddelaar zonder gelaagd publiek trust-niveau; geen in-product ORT- of
  DBA-modelgenerator — alles wat wij al expliciet en server-side hebben.

### Bendy (flex-tool voor bureaus)

- **Beter:** volledige uren-naar-factuur-flow als kern — automatische tariefberekening incl.
  WTT/CAO + onkosten + declarabele kilometers, flexkracht keurt eigen factuur in-app goed
  (selfbilling), diepe koppelingen met zorg-roostersystemen (SDB, Intus, Ortec, ONS).
- **Slechter:** geen marktplaats/cross-tenant matching (flexkracht zit opgesloten in één bureau-pool);
  geen self-service onboarding; geen geautomatiseerde match-/next-action-sturing — fundamenteel een
  tool-voor-bureaus, geen netwerk met "wat moet ik nu doen".

### Zorgwerk (zorg-flexmarktplaats + roosterintegratie)

- **Beter:** directe API-roosterintegratie (Nedap ONS, Intus, Monaco, Ortec) zodat flex-aanvragen
  automatisch vanuit het instellingsrooster worden uitgezet; één account met meerdere contractvormen;
  shift-ruil tussen collega's; ~20s aanvraag-tot-match.
- **Slechter:** black-box matching zonder onderbouwing; geen klant-zichtbaar verklaarbaar
  verificatie-badge per credential; DBA-kwetsbaarheid aan de pure ZZP-bemiddelingskant (leunt op de
  uitzend/payroll-uitweg die wij bewust niet bouwen).

## Build/park-backlog

Per item: principe → onze schermen → omvang (S/M/L) → **klasse** (BOUWEN/PARKEREN) → reden.

### BOUWEN (geleverd als losse PR's)

1. **Open-dienst-pool actief vindbaar voor de ZZP'er met live match-score** _(M, PIDZ + Zorgwerk)_ —
   PIDZ/Zorgwerk nodigen matchende ZZP'ers automatisch uit ("binnen uren"/~20s). Wij berekenen al per
   applicant een matchScore in dienst-detail, maar de ZZP'er ziet open diensten van een
   franchise-tenant nog niet als gerichte, gescoorde suggesties met de bestaande `matching.ts`-redenen.
   Schermen: `/opdrachten` ("voor jou"-band), `/rooster`, `src/lib/franchise/dienst-detail.ts`.
   _Leunt op bestaande matching — geen nieuwe rekenlogica._
2. **Vooruitkijkende dekkingsprognose voor de franchiser** _(M, Zorgwerk + PIDZ)_ — **slice 1 GEBOUWD**
   (`coverage-forecast.ts` + dekkingsband op `/franchise/diensten`: gepubliceerde diensten gebucket per
   komende ISO-week op startdatum, met een vroeg signaal welke week dreigt onder te bezetten). Open
   vervolg: uitsplitsing per opdrachtgever/afdeling en een dashboard-band op `/franchise`.
   Schermen: `/franchise/diensten`, `/franchise/samenwerkingen` (weekdays), `/franchise` (dashboard-band).
3. **Shift-ruil/overname binnen tenant** _(L, Zorgwerk)_ — een ZZP'er biedt een ingeplande dienst aan
   ter overname door een collega, met compliance-check op de overnemer. Schermen: `/samenwerkingen/[id]`
   (weekdays/rooster), `/rooster`, `src/lib/franchise/roster-dossier.ts`. _Raakt statusmachine +
   notificaties → L._
4. **Selfbilling-akkoordstap** _(M, Bendy)_ — per gewerkte periode een conceptfactuur die de ZZP'er
   in-app inziet en akkoord geeft vóór hij PENDING wordt. Schermen: `/franchise/facturatie`,
   `/samenwerkingen/[id]` (cascade), `src/lib/franchise/billing.ts`. _Geld blijft PENDING (harde
   regel), geen echte incasso — verfijning van de bestaande cascade + audit-trail._
5. **Proactieve credential-expiry-alert** _(S, Zorgwerk/ZOIZ)_ — alert vóór expiry (niet pas erna),
   klant-zichtbaar in de franchise-/roster-context + queue-prioritering. Schermen:
   `src/lib/franchise/roster-dossier.ts`, `/franchise/zzpers(/[id])`, `/admin/verificaties`. _Leunt op
   bestaande `daysUntil`-expiry-logica._
6. **Per-dienst engageability/contractvorm-signaal** _(S, Zorgwerk + Bendy)_ — toon bij plaatsing welke
   inzetvorm passend is (zelfstandig vs. risico). Schermen: `/franchise/diensten/[id]`,
   `/samenwerkingen/[id]/dossier`, `src/lib/engageability.ts`. _Hergebruikt `computeEngageability` +
   DBA-monitor; vertaalt "meerdere contractvormen" naar onze ZZP-only realiteit als risico-sturing._

### PARKEREN (eigenaars-/strategiebeslissing — niet autonoom bouwen)

7. **Externe roostersysteem-integratie** _(L, Zorgwerk + Bendy)_ — ingest van flex-aanvragen uit
   Nedap ONS/Intus/Ortec. _Vereist commerciële koppelingen + integratiecontracten; eigenaarsbeslissing._
8. **Native white-label app per franchisenemer** _(L, Bendy)_ — valt onder de harde regel: geen
   white-label/tenant-branding zonder eigenaar.
9. **No-use-no-pay / per-actieve-flexkracht prijsmodel** _(M, Bendy + Zorgwerk €3/uur)_ —
   prijs/positionering = eigenaarsbeslissing; billing staat bovendien UIT en geld blijft PENDING.
10. **Bevoorschotting/factoring** _(L, Zorgwerk + PIDZ)_ — wekelijkse vooruitbetaling aan de ZZP'er
    vóór incasso; echte geldstroom = financieel risico, buiten "geld blijft PENDING" en de
    no-payroll-regel.

## Rode draad

De concurrenten winnen op **liquiditeit** (snel vullen via roosterintegratie + auto-uitnodiging) en
op **uren→factuur-diepte** (selfbilling). Wij winnen op **verklaarbaarheid** (matching-redenen,
next-actions), **gelaagd publiek vertrouwen** (verificatie-badges) en **Wet-DBA/AVG-compliance**
in-product. De bouwen-items vertalen hun liquiditeit-/billing-sterktes naar ónze bestaande,
verklaarbare engines — zónder de payroll-/factoring-/black-box-paden die hun zwaktes zijn.
