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
2. **Vooruitkijkende dekkingsprognose voor de franchiser** _(M, Zorgwerk + PIDZ)_ — niet alleen de
   huidige vulgraad, maar per opdrachtgever/afdeling én vooruit (welke roosterweken dreigen onderbezet).
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

### Uitvoeringsstatus (na verificatie tegen de codebase)

Bij het bouwen bleken twee "bouwen"-items al aanwezig — de deepdive telde meer gaten dan er zijn.
Eerlijk vastgelegd om dubbel werk (slop) te voorkomen.

| #   | Item                               | Status             | Toelichting                                                                                                                                                                                                                                                                                                                 |
| --- | ---------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Open-dienst-pool met match-score   | **AL-AANWEZIG**    | `/opdrachten` scoort elke zichtbare opdracht al (Match %, troef + minpunt via `scoreJobForFreelancer`, incl. franchise-tenant via `visibleJobsWhere`); `/rooster` toont gescoorde open-dienst-suggesties met een "sterke match"-filter; dashboard gebruikt `recommendedJobs`. Een extra "voor jou"-band zou duplicaat zijn. |
| 2   | Vooruitkijkende dekkingsprognose   | **GEBOUWD** (#401) | Per-opdrachtgever dekking bestond al (`buildCompanyBreakdown` op `/inzicht`); toegevoegd: de ontbrekende periode-projectie "wat dreigt onbezet" op `/franchise/diensten`.                                                                                                                                                   |
| 3   | Shift-overname binnen tenant       | **GEBOUWD** (#402) | Gegoverneerd verzoek (overname + goedkeuring); geen contract-/cascade-mutatie. Adversariële review: 2 blockers (bereikbaarheid franchiser, beslis-races) + should-fixes verwerkt.                                                                                                                                           |
| 4   | Selfbilling-akkoordstap            | **AL-AANWEZIG**    | De cascade genereert al een concept-factuur (DRAFT) uit de goedgekeurde uren; de ZZP'er beoordeelt + dient die zelf in (`submitInvoiceAction`, DRAFT→SUBMITTED) — dat ís de akkoord-stap. `franchise/billing.ts`/PENDING uit de backlog was de tenant-FEE, niet de ZZP-factuur.                                             |
| 5   | Proactieve credential-expiry-alert | **GEBOUWD** (#397) | Hergebruikt de bestaande expiry-engine.                                                                                                                                                                                                                                                                                     |
| 6   | Per-dienst inzetvorm-signaal       | **GEBOUWD** (#398) | Hergebruikt het bestaande DBA-risico.                                                                                                                                                                                                                                                                                       |

### Vervolg-increment (liquiditeit, opdrachtgever)

- **Kandidaat-reactiesnelheid op uitnodigingen** _(S, Temper/Pidz + Malt/Upwork)_ — **GEBOUWD (#1269)**.
  Temper/Pidz nodigen automatisch de responsieve ZZP'ers uit; Malt/Upwork tonen een "reageert snel"-badge.
  Vertaald naar onze verklaarbare, positief-only variant: op de kandidatenlijst van een opdracht toont een
  badge "Reageert snel op uitnodigingen" bij een aantoonbaar responsieve voorgestelde ZZP'er (≥ 3
  uitnodigingen, ≥ 60% respons, mediaan ≤ 1 dag), afgeleid uit de `JOB_INVITED`-auditrecords +
  niet-ingetrokken `Application`-reacties. Nooit een negatief label. Helpt de opdrachtgever de responsieve
  kandidaten als eerste uit te nodigen → snellere vulling.

- **Kilometerregistratie bij zakelijke uitgaven** _(S, Bendy + boekhoudtools)_ — **GEBOUWD (#1287)**.
  Bendy laat kilometers declareren; boekhoudtools voeren de vaste kilometervergoeding als aftrekpost.
  Vertaald naar de ZZP'er-administratie: bij een reiskosten-uitgave de gereden km vastleggen; het
  nettobedrag volgt uit de vaste wettelijke vergoeding (€ 0,23/km, 0% btw — een kilometervergoeding
  kent geen voorbelasting). De km vormen een herleidbare rittenregistratie (Belastingdienst-
  onderbouwing) en gaan mee in de uitgaven-CSV. Onderscheiden van de bestaande reiskosten-FACTUURregel
  (`mileage.ts`, opdrachtgever betaalt de rit): dit is de eigen aftrekbare kostenpost
  (`expense-mileage.ts`). Administratie-ontzorging: minder rekenwerk, correcte aftrek.

- **SEPA scan-to-pay QR op de factuur** _(S, Bendy/Deel + professionele facturatiestandaard)_ —
  **GEBOUWD (#1288)**. Bendy/Deel automatiseren de betaalstap; een EPC069-12-QR op de factuur is de
  professionele standaard die elke NL-bankapp scant. Vertaald naar onze rechtstreekse (off-platform)
  betaalrealiteit: naast de bestaande betaalgegevens een puur uit het grootboek afgeleide betaal-QR
  (IBAN, tenaamstelling, bedrag, betaalkenmerk vooringevuld). Geen incasso/geldstroom — enkel minder
  overtikken en het juiste kenmerk voor de reconciliatie. Helpt opdrachtgever (sneller, foutloos
  betalen) én ZZP'er (sneller, correct-gereconcilieerd betaald). `src/lib/payments/epc-qr.ts`.

- **Rittenregistratie-overzicht (km-aftrek)** _(S, Bendy + boekhoudtools)_ — **GEBOUWD (#1295)**.
  De zakelijke km bij een reiskosten-uitgave werden al vastgelegd (#1287), maar niet geaggregeerd. Bendy/
  boekhoudtools tonen een rittenregistratie + km-aftrektotaal; de Belastingdienst verwacht die onderbouwing.
  Toegevoegd op het uitgaven-paneel: jaartotalen (ritten, km, km-aftrek) + compacte rittenlog, puur afgeleid
  (`summarizeMileage`/`mileageTripLog` in `expense-mileage.ts`), km-aftrek canoniek uit km × vast tarief.

- **UBL 2.1 e-factuur-export** _(S, Moneybird/e-boekhouden + Deel/Bendy)_ — **GEBOUWD (#1300)**.
  Boekhoudtools en e-facturatieplatforms leveren de factuur als machineleesbare UBL/Peppol-XML zodat de
  ontvanger 'm rechtstreeks in zijn administratie importeert (geen overtikken). Vertaald naar onze
  bestaande factuur: naast PDF/CSV een puur uit de factuurdata afgeleide **UBL 2.1 (NLCIUS/SI-UBL,
  EN 16931-subset)** download per factuur; btw-categorie volgt het regime (S/AE/E), betaalmiddel-blok
  alleen op een openstaande factuur. Helpt de opdrachtgever (foutloze import) én de ZZP'er (professionele
  standaard, snellere verwerking). `src/lib/invoice-ubl.ts` + `/api/facturen/[id]/ubl`.

- **Flexpool → "sterke match voor je open opdracht"** _(S, Malt/Temper)_ — **GEBOUWD (#1292)**.
  Malt/Temper maken hun favorieten/eigen pool actiegericht: nodig je bewezen mensen direct uit voor
  wat je nu zoekt. Vertaald naar onze verklaarbare matchmotor: de flexpool toonde alleen
  beschikbaarheid; nu berekent het systeem per favoriet de sterkste eigen PUBLISHED-opdracht op/boven
  de suggestie-drempel (`scoreJobForFreelancer`, dezelfde motor als de kandidatenlijst) en toont een
  deep-link-chip "Sterke match voor je opdracht «titel» · %". Read-only, geen nieuwe rekenlogica, geen
  geldstroom; opdrachten waarop de favoriet al reageerde vallen af. `src/lib/favorites/open-job-match.ts`.

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
