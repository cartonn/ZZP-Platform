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

Implementatie: nullable Document.evidenceRemovalStartedAt plus additieve migratie.
Opruiming en hergebruik schrijven dezelfde documentrij in hun korte transactie;
opruiming herleest de huidige credential en bewaarbeleidsvoorwaarden vóór de claim.
Opslag-I/O volgt na commit. Een geclaimd bestand kan niet opnieuw worden gebruikt,
ook niet na een opslagfout; de gebruiker kan een nieuw bewijs uploaden. De echte
verwijderdatum wordt pas na opslagverwijdering gezet.

Gericht: 78 tests in twaalf suites, typecheck en SQLite-schema slagen. De proeven
bewaken beide volgordes, retry, vervangende upload, beleid/type/referenties en audit.
Volledige checks, PostgreSQL-migratiepoort en onafhankelijke review volgen.

De native review van d6dedcd8 vond een verdwenen gestructureerde waarschuwing bij
gedeeld bewijs. Herstel behoudt het operationele signaal na transactionele weigering;
een regressie controleert waarschuwing zonder opslagverwijdering of verwijderaudit.
Deze nieuwe commit vereist opnieuw onafhankelijke en native review.
