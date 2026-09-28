# 28 september — corrigeerbare dienstinvoer

Bouwronde 00:22 UTC, bron main `0d485a88`.
Echte PerformanceForm-render met een verkeerd eindmaandveld (12 januari tot
12 maart) werpt de bestaande grensfout van 1000 uur tijdens de voorbeeldberekening.
Normale dienst renderde wel; broncontrole toont dezelfde state vanuit datumvelden.
Dit is een formulierprobleem vóór servervalidatie, geen aangetoonde geldmutatie.

Claim: gedeelde duurgrens vóór de preview controleren en een herstelbare Nederlandse
melding tonen. Geldmotor, servervalidatie en V5 blijven behouden. Scope: formulier,
gerichte renderregressies en voortgang. Implementatie en controles volgen.
