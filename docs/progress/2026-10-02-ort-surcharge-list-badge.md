# 2 oktober 2026 — ORT-toeslagbedrag inline op de lijstoverzichten

## Waarom

De per-categorie ORT-uitsplitsing (avond/nacht/zaterdag/zondag/feestdag) bestond al op de
detailoppervlakken (samenwerking-werkproces, beoordeeldrawer, factuurdetail, urenstaat-PDF),
maar de twee lijstoverzichten toonden alleen een kaal `· ORT`-vlaggetje:

- `/diensten` (ZZP'er) — `{hours} u · ORT`
- `/prestaties` (opdrachtgever) — `{hours} u · ORT`

Daardoor zag een ZZP'er die zijn dienstenlijst scande niet hoeveel een dienst extra opleverde,
en zag een opdrachtgever de meerkosten van onregelmatige uren niet, zonder elke prestatie te
openen. Benchmark (Deel/Temper/Stripe): toeslag/uplift inline in het overzicht, niet verstopt
in een detailscherm.

## Wat

Het vlaggetje toont nu de onregelmatigheidstoeslag inline: `· ORT +€ 12,50`.

- Nieuwe pure helper `formatOrtSurchargeLabel({ hasOrt, surchargeCents })` in
  `src/lib/ort-breakdown.ts`: `null` als er geen ORT is; `"ORT"` zonder bedrag als de toeslag
  nul, negatief of niet-eindig is (defensief — geen misleidend bedrag); anders
  `"ORT +" + formatEuro(surchargeCents)`.
- Beide lijstpagina's gebruiken de helper; alleen voor `HOURS`-prestaties.

De `surchargeCents` komt uit het bestaande rij-model (`DienstSummary`/`PrestatieSummary`,
`ortBreakdown`), dat al via `computePerformanceOrt` → `reconcileSubtotalWithInvoice` tegen de
**bevroren factuur** is gereconcilieerd. De badge kan dus niet driften van het factuursubtotaal
(CLAUDE.md regel 1, server-side waarheid). Geen nieuwe query, geen schemawijziging.

## Bestanden

- `src/lib/ort-breakdown.ts` — `formatOrtSurchargeLabel` + import `formatEuro`.
- `src/lib/ort-breakdown.test.ts` — 8 nieuwe assertions (null/0/negatief/NaN/Infinity/positief/groot).
- `src/app/(protected)/diensten/page.tsx` — badge via helper.
- `src/app/(protected)/prestaties/page.tsx` — badge via helper.

## Bewijs

- `npx vitest run src/lib/ort-breakdown.test.ts` → Test Files 1 passed (1), Tests 28 passed (28).
- Volledige DoD (typecheck/lint/test/build/prettier) en de zes CI-poorten: zie PR #1550.
