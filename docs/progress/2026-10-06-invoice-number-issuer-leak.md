# 2026-10-06 — Interne uitschrijver-sleutel lekt nooit in het factuurnummer

## Probleem

`Invoice.number` draagt sinds de per-partij-nummering een `issuerKey:`-prefix
(`<userId>:2026-0007` voor een losse factuur, `<issuerKey>:2026-0007` of
`PLATFORM:2026-0007` voor een cascade-factuur ná indienen). Die sleutel bevat een
**userId** en mag nergens getoond worden — dat is de reden dat
`displayInvoiceNumber` bestaat ("ÉÉN bron, zodat geen enkel scherm, export of
notificatie het interne globale `Invoice.number` lekt").

De helper én zijn inline-dubbelgangers vielen echter terug op de **rauwe**
`inv.number` zodra `partyInvoiceNumber` ontbrak:

```ts
inv.partyInvoiceNumber ?? inv.number; // lekt de issuerKey-prefix bij een null partij-nummer
```

In de normale flow krijgt elke genummerde factuur ook een `partyInvoiceNumber`,
dus de prefix bleef in de praktijk verborgen — maar het is een broos invariant:
één data-afwijking of toekomstige regressie waarbij een genummerde factuur zonder
partij-nummer op een weergavepad belandt, zet de **userId** op de factuur-PDF, de
CSV-export, de factuurdetailpagina of de openstaand-API. Dat is een
privacy-/dataminimalisatie-risico (CLAUDE.md regel 1 — server-side waarheid; en de
documentatie van de helper zelf).

## Oplossing

Verdediging in de diepte, geconcentreerd in de bestaande single source:

1. `displayInvoiceNumber` stript de `issuerKey:`-prefix alsnog wanneer
   `partyInvoiceNumber` ontbreekt — **uitsluitend** als het restant een geldig
   partij-nummer is (`JAAR-VOLGNR`, `^\d{4}-\d{4,}$`). CONCEPT-nummers
   (`CONCEPT-<id>`, geen dubbele punt) en oude losse nummers blijven letterlijk
   behouden; geen vals-positieven. De `??`-semantiek (leeg partij-nummer `""`
   blijft `""`) blijft gespiegeld via `!= null`.
2. De rauwe inline-dubbelgangers `partyInvoiceNumber ?? number` die naar de weergave
   gaan, lopen nu allemaal door de gehardende helper, zodat het invariant op één
   plek wordt afgedwongen:
   - `src/app/api/facturen/[id]/pdf/route.ts` (factuur-PDF: betaalkenmerk, titel,
     "Nr.", bestandsnaam)
   - `src/app/api/administratie/openstaand/route.ts` (openstaand + CSV)
   - `src/app/(protected)/facturen/[id]/page.tsx` (koptekst, betaalreferentie,
     wettelijke compliance-check, aanmaning)
   - `src/app/(protected)/facturen/actions.ts` (handmatige betaalherinnering)

Geen gedragswijziging in de normale flow: een factuur mét `partyInvoiceNumber`
toont precies hetzelfde als voorheen. Alleen het lek-scenario is dichtgezet.

## Bewijs

- `src/lib/invoice-number.test.ts` (nieuw, 9 cases): partij-nummer onveranderd,
  lege string behouden, CONCEPT-fallback, legacy zonder prefix, userId-prefix
  gestript, PLATFORM-prefix gestript, lang volgnummer, geen vals-positief bij een
  dubbele punt zonder geldig partij-nummer, en geen strip bij een te kort volgnummer.
- `npm run typecheck`, `npm run lint`, `npm run test` (9.253 groen, 3 bestaande
  skips), `npm run build` en `npx prettier --write .` groen. E2e draait in CI.

## Bestanden

- `src/lib/invoice-number.ts` (harden + `stripIssuerPrefix`)
- `src/lib/invoice-number.test.ts` (nieuw)
- `src/app/api/facturen/[id]/pdf/route.ts`
- `src/app/api/administratie/openstaand/route.ts`
- `src/app/(protected)/facturen/[id]/page.tsx`
- `src/app/(protected)/facturen/actions.ts`
