# Verlopen rosterdossier achter gedekte historie — 17 september 2026

Bron: FRANCHISER-persona-audit van 05:17, afzonderlijk bijgehouden bij #1508.
Dynamische reproductie op `ed942955`: profiel A heeft vijftig oude EXPIRED LICENSE
plus een onbeperkt geldige vervanger. Profiel B heeft één verlopen LICENSE zonder
dekking. Beide hebben actueel verplicht dossier, volledige profielgegevens,
identiteit, beschikbaarheid en recente login. Echte `pendingTasks` en `navBadges`
geven nul verlopen meldingen in plaats van één. Geen productiegegevens gebruikt.
Draftclaim #1509 volgde vóór implementatie.

`rosterExpiredCredentialWhere` sluit dezelfde-type-dekking op hetzelfde profiel in
de database uit voordat de bestaande vijftig-kandidatenlimiet geldt. Beide bronnen
gebruiken dit filter en dezelfde expiresAt/id-volgorde. Nu-geldige dekking is VERIFIED
met geen einddatum of einddatum strikt na nu; computed expiry sluit aan op de
bestaande dossierhelper (inclusief exact nu). Tenantfilter, uitsluiting van verplichte
typen en vervolgcontrole op het geselecteerde dossier blijven staan.

Elf nieuwe proeven draaien de echte taak-/badgebronnen met een wegwerp-SQLite-database:
EXPIRED, computed-expired, exact nu, geldige vervanger met/zonder einddatum, vier
niet-dekkende statussen, ander type/profiel/tenant en uitsluiting van verplichte typen.
De gerichte selectie telt 46 geslaagde tests. De oorspronkelijke proef faalde op
beide verwachte meldingen. Volledige checks en onafhankelijke review volgen.

Dit wijzigt uitsluitend de reeds-verlopen tak. Bijna-verlopen selectie, de bestaande
limiet voor werkelijk open meldingen en de volledige rosterpagina zijn niet uitgebreid.
Geen nieuw schema, breed ophalen van alle certificaten, juridische claim of facturatie.
Lokale SQLite-bewijzen zijn geen afzonderlijke PostgreSQL-query- of browserreproductie;
de bestaande CI- en migratiepoorten blijven vereist. Merge en livegang apart verifiëren.
