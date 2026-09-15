# Zelfstandigen eerst: lancering en vergelijking met Bendy

Claim vóór implementatie, 15 september 2026. Eigenaar vraagt vergelijking met Bendy,
concrete gaten dichten, prijsadvies en snelle livegang; kiest expliciet zelfstandigen
als eerste doelgroep. Bedrijfsidentiteit volgt later op verzoek van de eigenaar.
Basis: `94dad5869b53632619027bc0ab088ccfca66449d`.

Bewezen codegat: `changeSubscription` activeert een betaald pakket wanneer de
no-op-betaalprovider geen checkout teruggeeft, ook buiten de demo. De verkoopkaart
presenteert de voorbeeldprijs en niet-operationele ontzorgdienst als koopbaar.
Reparatie: gedeelde serverpolicy voor demo/gratis/betaald/niet beschikbaar,
serverguard vóór iedere betaalmutatie, duidelijke demo- en beschikbaarheidsteksten.
Geen prijs-/provider-/accountwijziging of incasso. Een gratis start blijft mogelijk.
Voor registratie krijgt de bestaande demo een duidelijke toelichting over fictieve
gegevens. Het geaccepteerde V5-design en bestaande demoproeven blijven behouden.

Parallelle onderzoeksuitkomst komt in een apart lanceringsrapport: vergelijking,
prijzen als voorstel, eerste klanten, operationele bewijzen en resterende blokkades.
Geen open productie voor echte documenten zolang demodata en bedrijfs-/privacy-
gegevens niet zijn opgelost. Geen bestaande gebruikersgegevens verwijderen.

## Gebouwd en eerste bewijs

Drie gerichte regressies falen vóór de reparatie: noop activeert betaald, BUSINESS is
koopbaar zonder operationele dienst, en een ontbrekende checkout wordt als betaald
behandeld. Na de guard slagen de tests; gratis gebruik blijft werken, echte checkout
blijft PENDING en een demo roept zelfs met een geconfigureerde provider niets externs aan.
Ook ontbrekende providerreferentie wordt geweigerd. UI en actie gebruiken dezelfde policy.

Live-audit op 15 september: demo en seed staan aan; alle 27 accounts dragen het
demo-e-maildomein. Resend heeft een succesvolle afleverheartbeat; run-all en de
back-up hebben actuele succesheartbeats. Dit corrigeert oude checklistclaims over
ontbrekende mail/taken, maar bewijst geen volledige mailboxontvangst of backupherstel.
Bedrijfsgegevens zijn door de eigenaar uitgesteld. Geen productiegegevens gewist,
geen betaal-/verificatieprovider geactiveerd en geen commerciële prijs gepubliceerd.
Een expliciete handmatige verificatiemodus/preflight en echte account-/restoreproeven
blijven afzonderlijke lanceringstaken. De huidige demo is geen echte productiepilot.
