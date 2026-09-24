# Lopende bewijsopruiming en herindienen

Op basis29f1e4c0 bevestigen twee echte actieproeven met tijdelijke SQLite dat
requestVerification en metadata-herindiening slagen terwijl storage.delete van
de oude beoordelingscyclus wacht. Hervatten verwijdert het nog gekoppelde bestand;
SUBMITTED en een PENDING-aanvraag blijven zonder bewijs staan. #1518 beschermt
latere selectie, maar een reeds begonnen verwijdering valt buiten die reparatie.

Claim: een duurzame documentgebonden verwijdermarkering vóór externe opslag-I/O,
met transactionele wederzijdse uitsluiting tegenover hergebruik van hetzelfde
bewijs. Een begonnen verwijdering wordt herhaald bij opslagfouten; een nieuwe
upload blijft mogelijk. De markering betekent uitsluitend dat verwijdering is
begonnen, niet dat het bestand al weg is. Geen nieuw bewaarbeleid.

Scope: documentmodel/migratie, credential-evidence-helper, herindienacties en
noodzakelijke regressies. Geen storage-I/O vasthouden in een DB-transactie.
Bewijs vereist beide volgordes, fout/herstart, normale opruiming, nieuwe uploads,
audits en schema-controles. Implementatie en onafhankelijke review volgen.
