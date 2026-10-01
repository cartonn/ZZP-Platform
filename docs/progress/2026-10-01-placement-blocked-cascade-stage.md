# Persona-sweep — dode "Onderteken contract"-fase bij certificaat-gat (1-10-2026)

Basis: `origin/main` `0b73d06b`.

## Bevinding (DOEL 1b — foute next-action + dode knop)

Een `PROPOSED`-samenwerking waarvan de opdracht een **verplicht** certificaat eist dat de
ZZP'er mist of verlopen is (`collaborationPlacementBlocked` → `computeCompliance` =
`NON_COMPLIANT`) toonde op **de samenwerkingenlijst** en **de dashboard-"Wat loopt er nu"-zone**
de fase `Contract ter ondertekening` met badge **"Aan zet"** en CTA **"Onderteken contract"** —
voor **beide** partijen.

Dat is een dode knop en een zichzelf tegensprekend scherm:

- De server weigert tekenen zolang de plaatsing geblokkeerd is
  (`signing-service.ts` → `complianceBlocksPlacement`); de samenwerking blijft `PROPOSED` en de
  fase verdween nooit.
- Het **samenwerkingsdetail** (`collaboration-status-line.ts`) toonde al wél het juiste signaal:
  ZZP'er → "vul het ontbrekende/verlopen certificaat aan"; opdrachtgever → "wacht tot de ZZP'er
  het aanvult" (niet aan zet).
- Het **actiecentrum** (`pending-tasks.ts`) onderdrukt de teken-taak in exact deze staat; de
  **nav-badge** (`signals.ts`) telt 'm niet mee.

De lijst- en dashboardkaarten riepen `cascadeStage` echter rechtstreeks aan zónder de
plaatsing-geblokkeerd-vlag, dus zij spraken het detail, het actiecentrum, de badge én de
server-guard tegen. Geschonden: CLAUDE.md regel 1 (server-side is de waarheid — de UI bood een
actie die de server weigert) en "geen dode knoppen".

Live gereproduceerd (seed, `qa.db`): collab `cmupknn8g…` (opdrachtgever = Zorgcentrum Jansen,
ZZP'er Sofie, vereist VOG ontbreekt) toonde vóór de fix "Aan zet · Onderteken contract", erna
"Wacht tot de ZZP'er het ontbrekende of verlopen certificaat aanvult".

## Fix

`cascadeStage` (de enige fase-bron) krijgt een optionele `placementBlocked`-input. In de
teken-fase (`contractStatus !== "SIGNED"`) geeft een geblokkeerde plaatsing nu de fase
`credential-blocked`: ZZP'er aan zet ("Vul het ontbrekende of verlopen certificaat aan", CTA
"Certificaat aanvullen"), opdrachtgever niet aan zet ("Wacht tot de ZZP'er … aanvult"). Dezelfde
bron (`collaborationPlacementBlocked`) als de server-guard, het actiecentrum en de badge, dus
geen drift.

`collaboration-status-line.ts` delegeert nu naar `cascadeStage` (één bron) in plaats van een
eigen duplicaat-tak; de bewoording blijft identiek via een nieuwe `credential-blocked`-case in
`phraseForStage`. De lijst (`samenwerkingen/(index)/page.tsx`) en alle drie dashboard-kaarten
(ZZP'er, opdrachtgever, admin in `dashboard/page.tsx`) voeden de vlag met
`collaborationPlacementBlocked(...)`; de dashboard-queries laden daarvoor de verplichte
opdracht-certificaten en de ZZP-certificaten mee.

## Tests + gates

- Vijf nieuwe `cascadeStage`-regressies: ZZP'er/opdrachtgever bij geblokkeerde plaatsing,
  voorrang op een reeds gezette handtekening, geen regressie zonder blok, en geen kaping na SIGNED.
  Bestaande `collaboration-status-line`-tests blijven groen (identieke tekst).
- `typecheck`, `lint`, `prettier --check .` groen; productiebuild groen (`next build`,
  BUILD_ID aanwezig). Volledige suite 9.248 groen / 3 bestaande skips (schone run; acht niet-
  gerelateerde flakes vielen op de eerste run om, groen op de herhaling — buiten de gewijzigde
  bestanden).

Onafhankelijke review + de zes CI-poorten verifiëren nog op de PR-head.
