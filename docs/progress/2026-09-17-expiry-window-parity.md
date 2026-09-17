# Gelijk certificaatvenster — 17 september 2026

Bron: restbevinding van onafhankelijke review #1512; gecontroleerd tegen actuele
main `f63bf822` en recente PR-/backloghistorie. Dashboard gebruikte lokale
`setDate(+30)`, maar actiecentrum en badges exact 30 × 24 uur. Dezelfde
bemiddelaar kon daardoor rond de klokwissel een ander verloopaantal zien.

Geïsoleerde calls van de echte dashboardpagina met gecontroleerde klok en
`Europe/Amsterdam` bevestigden vóór herstel twee rode grensproeven: vanaf
15 maart stond de grens op 14 april 11:00Z in plaats van 12:00Z; vanaf 15 oktober
op 14 november 13:00Z in plaats van 12:00Z. De zomercontrole slaagde. De
pagina-gegevensbronnen zijn gemockt; dit is geen browser- of productieprobe.

De drie oppervlakken gebruiken nu dezelfde bestaande duur van 720 uur uit de
pure certificaatmodule. Alleen het dashboardvenster verandert rond de
klokwissel; bestaande actie-/badgevoorwaarden, `(now, soon]`, tenantfilters,
vervangeruitsluiting, statusregels en ontwerp blijven behouden. Zes paginaproeven
bewaken voorjaar, najaar en zomer in Amsterdam en UTC. Bestaande echte SQLite-
rosterproeven blijven de lijst-/badge-/samenvattingsinhoud afdekken.

Draft-PR #1514 is vóór implementatie geclaimd. Volledige lokale controle,
afhankelijke CI en onafhankelijke/native review worden apart geverifieerd.
Een commit of groene build is nog geen bewezen live-release.
