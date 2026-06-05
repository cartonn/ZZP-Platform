# ADR-0004: Weekrooster per samenwerking (per-dag-planning)

- **Status:** geaccepteerd (geïmplementeerd 2026-06-06)
- **Datum:** 2026-05-30

## Context

Het dashboard heeft een weekoverzicht gekregen (`src/lib/week-overview.ts`, WORKSPACE_OVERHAUL
fase 1B + 6): voor een ZZP'er met meerdere lopende samenwerkingen toont het per ISO-week welke
samenwerkingen lopen, met timing (loopt door / start / eindigt deze week) en gegroepeerd per
opdrachtgever.

Dit overzicht is **deterministisch op basis van de bestaande velden** (`Collaboration.startDate`,
`endDate`, `rate` + relaties naar opdracht en opdrachtgever). Wat het **niet** kan, is de werkelijke
weekindeling tonen — "maandag + dinsdag bij opdrachtgever A, woensdag bij B, vrijdag bij C". Die
informatie staat nergens in het datamodel:

- `Collaboration` heeft geen uren-per-week of weekdagen-veld.
- `Job` heeft geen geschatte uren/week.
- `AvailabilityWindow.hoursPerWeek` bestaat wél, maar dat is de **eigen opgegeven beschikbaarheid**
  van de ZZP'er over een periode — niet een afspraak per opdrachtgever.

Tijdens fase 1B is bewust besloten dit **niet stilzwijgend op te rekken**: een verzonnen
uren/dag-verdeling zou een schijnwaarheid in de UI zetten. Een echt weekrooster vereist eerst een
expliciete, additieve schema-uitbreiding — vandaar deze ADR.

## Besluit

**Voorgesteld (nog niet uitgevoerd):** voeg een optioneel, additief weekrooster toe op
`Collaboration`, zonder bestaande velden of gedrag te wijzigen. Eén nieuw nullable veld dat een
genormaliseerde set weekdagen draagt:

```prisma
model Collaboration {
  // ... bestaande velden ongewijzigd ...
  weekdays String? // JSON-array van Weekday-enum: ["MON","TUE","FRI"]; null = onbekend/niet vastgelegd
}
```

- Enum als string + Zod (conform architectuurregel 6): `Weekday = MON | TUE | WED | THU | FRI | SAT | SUN`,
  gevalideerd met een Zod-schema; opgeslagen als JSON-array-string (SQLite + Postgres, geen native enum).
- `null` blijft de standaard → bestaande samenwerkingen en de huidige `weekOverview`-uitvoer veranderen
  niet. De helper krijgt een optioneel `weekdays`-veld in `WeekCollaborationInput` en valt terug op de
  huidige timing-classificatie wanneer het ontbreekt.
- Vastleggen gebeurt op de samenwerking-detailpagina (`/samenwerkingen/[id]`) door wie aan zet is
  (auth → rol → ownership → Zod → actie → audit), niet client-side afgeleid.

Dit besluit wordt pas geïmplementeerd na akkoord van de eigenaar (data-model-wijziging → migratie).

**Uitgevoerd (2026-06-06, na akkoord eigenaar):** `Collaboration.weekdays String?` toegevoegd (additief,
`prisma db push`). `Weekday`-enum + `weekdaySchema` in `src/lib/enums.ts`; pure (de)serialisatie +
NL-labels + formattering in `src/lib/weekdays.ts` (`parseWeekdays`/`serializeWeekdays`/`formatWeekdays`,
unit-getest). Vastleggen via `setWeekdaysAction` op `/samenwerkingen/[id]` (auth → ownership: beide
partijen + admin → Zod-validatie per code → audit `COLLABORATION_WEEKDAYS_SET`). Het weekoverzicht
(`week-overview.ts` + dashboard) toont het rooster wanneer vastgelegd, anders de timing-terugval.

## Gevolgen

**Voordelen**

- Het weekoverzicht kan een echt rooster tonen ("ma + di bij A, wo bij B") i.p.v. alleen
  periode/timing — de kernwaarde voor een ZZP'er die bij meerdere opdrachtgevers werkt.
- Additief en backward-compatible: `null` = huidig gedrag, geen big-bang-migratie, geen dataverlies.
- Eén bron van waarheid (server-side), conform de bestaande mutatieketen.

**Nadelen / kosten**

- Een Prisma-migratie + seed-aanpassing + Zod-schema + UI om het rooster te bewerken.
- Roostergegevens kunnen verouderen als ze niet worden onderhouden; de UI moet "niet vastgelegd"
  netjes tonen (geen valse precisie).
- Geen ondersteuning voor onregelmatige roosters (week-op-week wisselend) — bewust buiten scope;
  een herhalend weekpatroon dekt het leeuwendeel van de praktijk.

## Alternatieven

1. **Niets doen (huidige stand).** Weekoverzicht blijft periode/timing-gebaseerd. Eenvoudig en
   eerlijk, maar mist de "welke dag bij wie"-waarde. Acceptabel als tussenstand.
2. **Afleiden uit `AvailabilityWindow`.** Verworpen: beschikbaarheid ≠ afspraak per opdrachtgever;
   zou een schijnnauwkeurigheid opleveren die niet klopt.
3. **Apart `CollaborationSchedule`-model** (rij per dag/blok met start/eind-tijd). Krachtiger
   (tijdsblokken, uren per dag), maar fors zwaarder: extra tabel, queries, UI. Overkill voor de
   eerste stap; het additieve `weekdays`-veld kan hier later naartoe groeien als de behoefte blijkt.
