# Oudere samenwerkingen blijven bereikbaar voor de bemiddelaar

Persona-sweep 15 september 13:00 UTC. Basis: `3ecbdb4c73b476d69f81280a37e25f514184b678`.
Claim vóór implementatie; bron is de functionele/adversariële gebruikerscontrole.

De bemiddelaar krijgt een vervolgstap voor een oude ACTIVE-inzet die morgen eindigt.
Zijn overzicht haalt eerst de honderd recentst bijgewerkte samenwerkingen van alle
statussen op en filtert pas daarna op ACTIVE. Honderd nieuwere afgeronde inzetten
verdringen de actieve rij. De taak/badge blijft bestaan, maar de bestemmingslijst,
statusaantallen, zoekfunctie en aandachtsstrip missen die rij. Er is geen detailroute.

Zes synthetische helperasserties bevestigen dit vensterprobleem; nog geen nieuwe
browsertest of databaseproef. De open #1357 wijzigt dezelfde pagina voor compliance
maar behoudt de beperking en herstelt dit probleem niet. Geen bestaande fix gevonden.

Begrensde reparatie: dezelfde volledige tenantqueue als de andere bemiddelingsoverzichten,
met uitsluitend de vereiste velden. Geen stille grens vóór filteren en urgentiesortering.
Behoud rolcontrole, scope via de tenant van de opdracht, alle statussen en bestaande UI.
Bewijs met een geïsoleerde database: oude actieve rij na honderd afgeronde rijen,
meer dan honderd actieve rijen, zoeken/tellingen en uitsluiting van andere tenants.
De hoeveelheid gelezen rijen groeit met de eigen tenant; echte paginering vereist
later complete tellingen en dezelfde urgentievolgorde, geen willekeurige afkapping.

## Uitvoering

De bestaande query is eerst ongewijzigd begrensd naar een aparte loader verplaatst.
Met die beperking falen twee echte tijdelijke SQLite-proeven: de oude actieve rij
ontbreekt en de actieve queue telt honderd in plaats van 102 rijen. De tenantproef
slaagt al. Na het weghalen van de grens slagen alle drie, inclusief bestaande zoek-,
status- en toezichthelpers. De selectie bevat alleen weergegeven velden en de
volgorde heeft een vaste id-tiebreaker. De pagina behoudt haar rol- en tenantcontrole.

De aparte admin/bemiddelaar-broncontrole vond daarnaast geen nieuw bereikbaar gat
in de onderzochte document-/besluit-/dispuutpaden. De cliënt/zelfstandige-controle
bevestigt de huidige ondertekenstatus, berichtdeelnemerschap en cascadefilters;
210 gerichte bestaande tests slagen. Geen nieuwe lokale browser of productieprobes;
actuele CI/QA-browseruitvoer wordt apart gecontroleerd. Dit is geen algemene cleanaudit.

Lokale volledige lint/typecheck/build/opmaak slagen; 8.963 tests groen, twee bestaande
skips. Gerichte admin/tenant/document/querycontrole: 117 tests groen. Op basiscommit
slaagt echte CI met 178 browserproeven en één skip, PostgreSQL met 24 browserproeven
en twee integratieproeven; QA met 61 proeven en één bestaande skip. Geen retries.
Dit browserbewijs geldt voor de basis, niet als vervanging van nieuwe PR-CI.
