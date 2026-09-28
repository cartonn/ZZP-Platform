# 28 september — corrigeerbare dienstinvoer (#1527)

Bouwronde 00:22 UTC, bron main `0d485a88`.
Een verkeerd eindmaandveld (12 januari tot 12 maart) liet de echte
PerformanceForm-render de bestaande grensfout van 1000 uur werpen, voordat de
server zijn invoermelding kon tonen. Dezelfde state ontstaat vanuit de gewone
datumvelden. Dit is een formulierprobleem, geen aangetoonde geldmutatie.

De preview controleert nu de gedeelde `MAX_SHIFT_HOURS` vóór segmentatie. Bij een
te lange dienst blijven de velden staan en verschijnt een Nederlandse melding
met `role="alert"`. Er verschijnt geen gedeeltelijk totaal van andere diensten
of een vervangend handmatig totaal. De geldmotor, servervalidatie en het bestaande
V5-ontwerp blijven behouden; de bestaande maximumgrens verandert niet.

Zeven echte componentrenders dekken normale invoer, een verkeerde eindmaand,
beide volgordes van gemengde geldige/ongeldige rijen met handmatige uren, exact
1000 uur, één minuut daarboven en de gewone handmatige preview. Vóór herstel
vier rood en drie controles groen; daarna zeven groen in Amsterdam en UTC.
Samen met de bestaande reken-/formulierproeven: 154 tests groen. Geen browser-
of productie-interactie uitgevoerd. Volledige controles, onafhankelijke review,
GitHub-checks, merge en liveverificatie worden afzonderlijk geregistreerd.

Volledige validatie: lint, typecheck en repositorybrede Prettier-controle geslaagd.
863 testsuites geslaagd, twee overgeslagen; 9.152 tests geslaagd, drie overgeslagen.
Productiebuild met netwerk geslaagd (exit 0); nog geen review-, merge- of liveclaim.
