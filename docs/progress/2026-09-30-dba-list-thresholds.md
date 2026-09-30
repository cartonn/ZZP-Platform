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

Status: geclaimd; implementatie, tests, onafhankelijke review, CI en release volgen.
