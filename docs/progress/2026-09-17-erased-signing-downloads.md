# Verwijderd ondertekenbewijs: downloadregressies

Claim vóór implementatie, bouwronde 17 september 04:22 UTC.
Basis: `21b237a17745bd03ad90e0a79690229de44fa439`.

Bron: de onafhankelijke security-deelaudit van 17 september 02:01 UTC vond
ontbrekende routeproeven voor `SigningEvidenceErasedError` en HTTP 410.
De bestaande productcode bevat de weigering al; er is geen nieuw lek aangetoond.

Scope: regressietests in `ondertekening/route.test.ts` en
`modelovereenkomst-legacy.test.ts`, plus voortgang. Controleer alle drie
bewijsformaten, een bestaande verwijdermarkering, verwijdering vastgesteld bij
de tweede read en afscherming van de verwijderstatus voor een buitenstaander.
Alle proeven gebruiken synthetische routefixtures; geen productiegegevens.

Geen productwijziging, bewaarbeleid of integratie. Deze routeproeven bewijzen
niet de volledige databaseketen tekenen → adminverwijdering → FK-cascade,
noch gelijktijdige exports tijdens verwijdering. Validatie en review volgen.
