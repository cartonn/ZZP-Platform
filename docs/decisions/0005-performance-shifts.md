# ADR-0005: Ruwe diensttijden op een prestatie persisteren (inline correctie)

- **Status:** aanvaard
- **Datum:** 2026-06-02

## Context

Een afgekeurde prestatie (`Performance.status = REJECTED`) moet door de ZZP'er
"gecorrigeerd en opnieuw ingediend" kunnen worden (zijpad REJECTED → SUBMITTED). PR #76
wirede de transitie (knop "Opnieuw indienen"), maar kón de waarden niet vooraf invullen om
écht te corrigeren: een urenstaat die met **diensten** (begin/eind-tijden) is ingevoerd, slaat
alleen de **geaggregeerde** ORT-segmenten op (`Performance.ortSegments` = uren per categorie),
niet de ruwe diensttijden. Bij heropenen waren de oorspronkelijke diensten dus weg en kon het
`PerformanceForm` ze niet terugzetten.

De overige invoervormen verliezen geen data: handmatige ORT-uren staan in `ortSegments`, losse
uren in `hours`, en MILESTONE-velden in `amountCents`/`milestoneTitle`. Alleen de dienstmodus is
lossy. Daarom is een kleine, additieve opslag van de ruwe diensten nodig om inline bewerken
volledig te ondersteunen.

## Besluit

Voeg een optioneel, nullable veld `shifts` toe aan `Performance`:

```prisma
model Performance {
  // ... bestaande velden ongewijzigd ...
  shifts String? // JSON-array [{start,end}] ISO — ruwe diensttijden, voor inline-correctie; null = geen dienstinvoer
}
```

- String + JSON (geen native db-type), conform architectuurregel 6; werkt op SQLite én Postgres.
- `null` is de standaard → bestaande rijen en niet-dienst-prestaties veranderen niet (backward compatible). Railway's `prisma db push` bij boot voegt de kolom additief toe; geen dataverlies.
- `createPerformance` slaat de ruwe diensten op wanneer de ZZP'er in dienstmodus invoert.
- Een nieuw, geguard `updatePerformance`-command (alleen eigenaar, alleen status DRAFT/REJECTED) overschrijft de waarde-velden (incl. `shifts`, `ortSegments`, `hours`) vóór de herindiening; het emit géén event — het `PERFORMANCE_SUBMITTED`-event valt op de daaropvolgende `submitPerformance`. De keten/het audit-spoor blijft dus betekenisvol.

## Gevolgen

**Voordelen**

- De ZZP'er kan een afgekeurde dienst-urenstaat écht corrigeren (diensten aanpassen) en opnieuw indienen — één record, geen losse REJECTED-rij die de "vraagt aandacht"-telling open laat staan.
- Volledig additief: één nullable kolom, geen migratie van bestaande data, geen gedragswijziging voor andere prestaties.

**Nadelen / kosten**

- Lichte data-duplicatie: zowel de ruwe diensten als de afgeleide `ortSegments` worden opgeslagen. De server blijft de bron van waarheid voor de berekening; `shifts` is puur invoer-herstel.
- `updatePerformance` schrijft velden buiten een event om. Bewust afgebakend tot pre-indiening (DRAFT/REJECTED) zodat goedgekeurde/ingediende prestaties onaantastbaar blijven.

## Alternatieven

1. **Niets opslaan (PR #76-stand): alleen "opnieuw indienen" zonder bewerken.** Eenvoudig, maar de ZZP'er kan een dienst-urenstaat niet aanpassen — resubmit-onveranderd leidt vaak tot dezelfde afkeuring. Verworpen als eindstand.
2. **Diensten reconstrueren uit `ortSegments`.** Onmogelijk: de aggregatie is onomkeerbaar (categorie-uren bevatten geen begin/eind-tijden).
3. **Apart `PerformanceShift`-model (rij per dienst).** Relationeel netter, maar zwaarder (extra tabel/queries) terwijl diensten altijd als geheel bij één prestatie horen en samen worden bewerkt. Een JSON-veld volstaat; kan later genormaliseerd worden als de behoefte groeit.
