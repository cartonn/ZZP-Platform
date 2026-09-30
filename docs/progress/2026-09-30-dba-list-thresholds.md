# Samenwerkingslijst volgt ingestelde DBA-drempels

Bouwronde 30 september 2026, 16:22 UTC. Claim vóór implementatie.

Bron: geïsoleerde uitvoering van de echte serverpagina op main a430bb58.
Voor beide partijen ontbreekt bij drie maanden en ingestelde 3/9-maandsgrenzen
het verhoogde signaal; bij negen maanden toont de lijst verhoogd in plaats van
hoog. Bij zeven maanden en 9/15-grenzen toont de lijst juist onterecht verhoogd.
Detail en dossier gebruiken inmiddels de opgeslagen configuratie (#1535, #1537).

Scope: één serverlezing van de bestaande DBA-configuratie voor de zichtbare
samenwerkingslijst en regressies van de echte pagina voor beide partijen.
Bestanden: samenwerkingen/(index)/page.tsx en naastgelegen paginatests,
CURRENT_TASK.md, PROGRESS.md en dit bewijsbestand.
Beheerdersbadges en SQL-filters blijven een afzonderlijk backlogitem.

Implementatie: `getDbaThresholds()` wordt één keer na `requireActor()` gelezen
en als derde argument aan elke actieve lijstbeoordeling doorgegeven. De bestaande
serverconfiguratielader en pure beoordelaar blijven ongewijzigd. Eigenaarfilter,
statusfilter, cursor, ACTIVE-beperking, dispuutgedrag en badgepresentatie behouden.

Bewijs: 24 gevallen renderen de echte pagina met de echte configuratielader en
beoordelaar; database en authenticatie zijn gecontroleerde fixtures en niet-gerelateerde
helpers/componenten zijn vervangen. Beide partijen, dag vóór/op ingestelde 3/9-grenzen, verhoogde 9/15-grenzen,
ontbrekende configuratie (6/12), niet-actieve statussen, dispuut, ontbrekende start,
opdrachtindicator, één lezing voor meerdere rijen, autorisatie en paginatie gedekt.
Vóór herstel: 12 rood, 12 groen (ook de ontbrekende configuratielezing wordt bewaakt).
Na herstel: 24 groen; samen met certificaatpagina, engine en configuratie 59 groen.
Het bestaande certificaatfixture heeft alleen een lege configuratierij gekregen.

Volledige suite: 874 bestanden groen, 2 overgeslagen; 9.233 tests groen, 3 bestaande
skips. `env -u RUST_LOG npm run check` geslaagd: lint, typecheck, suite en
productiebuild groen; volledige formatcontrole groen. Build herstelde zelf van
TLS-downloadpogingen en toont bestaande Edge-runtimewaarschuwingen uit jose.
Onafhankelijke review, CI en release volgen.
