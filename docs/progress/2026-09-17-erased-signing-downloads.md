# Verwijderd ondertekenbewijs: downloadregressies

PR #1507, geclaimd vóór implementatie in de bouwronde van 17 september 04:22 UTC.
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
noch gelijktijdige exports tijdens verwijdering.

Acht nieuwe routeproeven dekken de drie ondertekenexports, de drie toegestane
rollen bij een bestaande verwijdermarkering, een fout bij de tweede read en de
gelijke 404 voor een buitenstaander bij een verwijderd/onbekend document.
De 410 bevat alleen de foutmelding, private/no-store en geen downloadheader;
preview- en bewijsgeneratoren blijven onaangeroepen.

Zes gerichte suites: 117 proeven groen. Drie tijdelijke foutinjecties bevestigen
dat de nieuwe proeven terugval detecteren: ontbrekende exportfoutafhandeling
geeft drie failures; genegeerde verwijdermarkering drie; verkeerde status bij
de tweede read één. Daarna alle productbestanden ongewijzigd hersteld en de
gerichte suites opnieuw groen. Dit zijn opzettelijke testmutaties, geen gevonden
productdefecten. Volledige lokale controle, onafhankelijke review en CI volgen;
merge-/releasebewijs wordt apart in het runregister bewaard.
