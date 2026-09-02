# ADR-0011: Focus & wig — waar het platform als eerste geld verdient

- **Status:** **Voorgesteld — eigenaarsbesluit.** Dit is een advies van een onafhankelijke review
  (2-9-2026), geen vastgesteld beleid. Zolang deze ADR niet op _aanvaard_ staat, verandert er niets
  aan de bouwrichting behalve de scope-restrictie voor de routines (die is al doorgevoerd in
  CLAUDE.md en `docs/ROUTINE-PROMPT.md`, omdat die los staat van de strategische keuze).
- **Datum:** 2026-09-02
- **Beslisser:** de eigenaar. Een agent voert dit niet uit.

## Context

Het platform is technisch ver: de volledige cascade (uren → ORT → prestatie → factuur →
betaalregistratie → administratie), certificaatverificatie met verval, een next-action-engine,
DBA-monitoring en een tenant-cockpit voor bemiddelaars draaien end-to-end op `main`. Wat ontbreekt
is geen functionaliteit maar **focus**: er zijn vier rollen, vier prijslijnen
(`docs/PRIJSADVIES.md`), een aangifteservice, een academie, een ideeënbus en honderden
designconcepten — zonder één gedocumenteerde klant of pilot.

Wat we wél weten (geverifieerd of expliciet als aanname gemarkeerd):

- **Marktkrimp.** Het CBS meldt over 2025 een daling van ±62.000 zzp'ers, met de sterkste daling in
  de zorg. `docs/PRIJSADVIES.md` rekent al met "zorg-zzp −16% in 2025". Een open marktplaats die
  puur op zzp-volume drijft, groeit dus tegen de stroom in.
- **Concurrenten verdienen aan de bureau-/uitzendkant.** PIDZ realiseert ≈ €14,6 mio omzet (2024)
  op 8.500+ zzp'ers via een uitzend-/marge-formule met 13 franchisevestigingen; Bendy verkoopt
  bureau-software per actieve flexwerker (€16/mnd + €2.500 setup). Zie de onderzoekstabel in
  `docs/PRIJSADVIES.md`.
- **Consolidatie aan de bovenkant.** In de markt loopt een overnamebod van Randstad op Zorgwerk;
  de kleine bureaus daaronder houden hun processen in Excel.
- **Juridisch risico op de bemiddelaarsrol.** Het Temper-arrest van het Hof Amsterdam (16-6-2026)
  raakt de vraag wanneer een platform bemiddelaar/werkgever is in plaats van softwareleverancier.
  Het platform beweegt vandaag richting bemiddelaarsfunctionaliteit (voordragen, roster,
  tenant-fee) zonder dat die vraag beantwoord is. `docs/legal/REVIEW-DOOR-JURIST.md` heeft de
  jurist-review al als open punt staan.
- **Geen klantsignaal in de bouw.** De routines leverden deze week een KOR-omzetgrensmeter, een
  aangifte-agenda en kilometervergoeding-aftrek: boekhoudpakket-functionaliteit, geen
  zorgplatform-functionaliteit. Er is geen bron aan te wijzen die erom vroeg.

## Besluit (voorstel)

1. **Wig: SaaS voor kleine zorg-bemiddelingsbureaus — "het bureau zonder Excel".** Eén koper met
   pijn en budget, in plaats van drie zijden tegelijk. De tenant-cockpit, ORT, de
   certificaat-compliance per plaatsing en de facturatiecascade zijn precies wat zo'n bureau nu
   handmatig doet. De ZZP'er- en opdrachtgever-kant blijven bestaan, maar als onderdeel van het
   bureauproduct — niet als eigen go-to-market.
2. **Routines: pauzeren of tot de kern beperken.** Doorgevoerd als scope-restrictie: alleen kern
   (certificaat/verificatie/verval · cascade · next-actions · DBA-monitor · tenant-cockpit) en
   robuustheid/security/bugs. Ontzorgd/aangifte/KOR, academie, ideeën, design-lab, nieuwe rollen,
   nieuwe prijslijnen en i18n zijn uitgesloten. Elke run moet de klantbron benoemen; zonder bron
   alleen bugs/robuustheid.
3. **Jurist in september, met één hoofdvraag:** is dit platform **softwareleverancier** of
   **bemiddelaar**? Neem het Temper-arrest (Hof Amsterdam, 16-6-2026) expliciet mee, plus de vraag
   welke functionaliteit (voordragen, tarieven zetten, fee per uur) de weegschaal doet doorslaan.
   Voeg deze vraag toe aan `docs/legal/REVIEW-DOOR-JURIST.md`.
4. **Prijs vereenvoudigen** (`docs/PRIJSADVIES.md`): **lijn 2 (uurfee bij de opdrachtgever)** en
   **lijn 4 (factoring / "direct betaald")** schrappen. De uurfee versterkt juist het
   bemiddelaars-beeld uit punt 3; factoring vergt werkkapitaal, debiteurenrisico, KYC en een
   herziening van Besluit 1 ("geld loopt nooit via het platform") — dat is een tweede bedrijf.
   **Lijn 3 wordt een vast tenant-tarief per bureau per maand** in plaats van per actieve
   flexwerker: voorspelbaar voor het bureau, simpel te verkopen, en het koppelt onze omzet los van
   hun uren. Lijn 1 (ZZP'er-abonnement) blijft als optie staan, maar is niet de eerste motor.
5. **VOG-metadata-modus vóór de eerste échte upload.** Voor VOG (en vergelijkbare
   bijzonder-gevoelige stukken) slaan we standaard **alleen metadata** op — soort, nummer/kenmerk,
   afgiftedatum, geldigheid, wie het zag — en niet het document zelf. Dat verlaagt het AVG-risico
   (art. 5(1)(c) dataminimalisatie, art. 32) precies daar waar het het hoogst is, en het past bij
   de bestaande verificatie-architectuur (`credentials.ts` + de verifier-seams). Het volledige
   document opslaan blijft een expliciete, per-tenant aan te zetten uitzondering.
6. **Geen uitbreiding meer van "ontzorgd"/aangifte.** Wat er staat blijft werken; er komt niets
   bij. Boekhouden is een andere markt met sterke bestaande spelers.

## Gevolgen

**Voordelen.** Eén koper, één verhaal, één prijs. De schermen die het bureau nodig heeft bestaan
al, dus de wig is vooral inperken en aanscherpen — niet bouwen. Een vast tenant-tarief maakt de
omzet voorspelbaar en de verkoop simpel. Het schrappen van de uurfee en factoring verkleint zowel
het juridische als het financiële risico aanzienlijk.

**Nadelen / kosten.** Het directe ZZP'er-model wordt naar achteren geschoven; het omzetmodel in
`docs/PRIJSADVIES.md` (dat ±80% uit de uurfee haalt) moet opnieuw worden gerekend. Bestaande,
gebouwde functionaliteit (aangifte, academie, ideeën, design-lab) wordt bevroren zonder ooit
verkocht te zijn — sunk cost die we accepteren in plaats van er verder in te investeren. Een vast
tarief schaalt niet mee met een groeiend bureau; dat is bewust (voorspelbaarheid boven maximale
opbrengst) maar laat omzet liggen bij grote tenants.

**Voor de bouw/ops.** De scope-restrictie in CLAUDE.md + `docs/ROUTINE-PROMPT.md` is de directe
uitvoering. De VOG-metadata-modus is een echt bouwitem (schema + upload-pad + admin-instelling) en
moet vóór de eerste productie-upload klaar zijn — het staat nu niet in de backlog en hoort daar
pas in als de eigenaar deze ADR aanvaardt. De prijswijziging raakt alleen `docs/PRIJSADVIES.md` en
de (inerte) `TENANT_BILLING`-config; er staat geen live billing aan.

## Alternatieven

- **Open marktplaats blijven (huidige koers).** Drie zijden tegelijk bedienen in een krimpende
  markt, zonder pilotklant en zonder duidelijke koper. Afgewezen: het is precies waarom de bouw nu
  zonder klantsignaal uitwaaiert.
- **Zelf payroll/uitzenden gaan doen (de PIDZ-formule).** Hoogste marge per uur en het bewezen
  model in deze markt. **Afgewezen:** het vergt werkkapitaal, een uitzend-cao, verzekeringen en
  werkgeversrisico, en het maakt de vraag uit punt 3 definitief in ons nadeel — we zouden dan
  onmiskenbaar bemiddelaar/werkgever zijn. Dat is een ander bedrijf, geen SaaS.
- **Factoring als eerste geldstroom (lijn 4).** Aantrekkelijk voor de ZZP'er en direct te vermarkten.
  Afgewezen als eerste stap: financieringskosten, debiteurenrisico, KYC/uitbetaalrails en een
  herziening van Besluit 1. Kan later terugkomen als partnerdeal, niet nu.

## Als de eigenaar anders beslist

Dat mag — dit is een voorstel. Concreet:

- **Wig afgewezen, marktplaats blijft:** laat de scope-restrictie op de routines dan tóch staan
  (het klantsignaal-vereiste is los van de wig-keuze), en vervang punt 1 door een expliciete keuze
  welke rol als eerste betaalt. Zonder die keuze blijft de bouw uitwaaieren.
- **Uurfee of factoring toch behouden:** zet de jurist-vraag (punt 3) dan **vóór** elke verdere
  bouw aan de bemiddelaarskant, want juist die twee lijnen wegen mee in de kwalificatie.
- **Ontzorgd/aangifte tóch doorbouwen:** werk dan eerst uit wie dat koopt en tegen welke prijs, en
  haal `tax`/`tax-filing` uit de uitgesloten lijst in CLAUDE.md + `docs/ROUTINE-PROMPT.md` — anders
  bouwen de routines het niet.
- **Niets besluiten:** dan is de veilige tussenstand de huidige — kern + robuustheid, geen nieuwe
  productlijnen. Die stand is al ingeregeld en kost niets.

Zie ook: [`docs/PRIJSADVIES.md`](../PRIJSADVIES.md) (herzieningsvoorstel bovenaan),
[`docs/legal/REVIEW-DOOR-JURIST.md`](../legal/REVIEW-DOOR-JURIST.md),
[ADR-0006](0006-pidz-pariteit.md) (PIDZ-pariteit) en [`MENSENWERK.md`](../../MENSENWERK.md) §5.
