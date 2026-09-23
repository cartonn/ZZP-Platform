# Lopende documentupload na anonimisering

Bron: securityronde 23 september 2026, geïsoleerde reproductie op f63bf822,
opnieuw bevestigd door de coördinator. Reparatiebasis: 367040f6; PR #1516.

De echte uploadactie wordt na autorisatie tijdens de scanner-await onderbroken.
De echte anonimisering eindigt met nul documenten. Hervatten van de upload bewaart
vervolgens alsnog één documentrij en blob; opnieuw anonimiseren wordt geweigerd.
Dit is een resterende variant van de eerder behandelde document/erasure-race.

Scope: uploadDocument, actuele eigenaar bij de databasewrite, transactionele
koppeling met erasure en opruimen van een blob als de write wordt geweigerd.
Geen beleid, bewaartermijn, gebruikersrol of privé-downloadrecht wordt gewijzigd.
De bestaande 225 gerichte tests slaagden maar dekten dit tijdvenster niet.
De nieuwe auditproef bevestigde de fout met echte acties en tijdelijke SQLite;
auth, scanner en opslag waren gecontroleerde seams, zonder productiegegevens.

De conditionele eigenaarwrite deelt een transactie met document en audit;
verlies van de actuele toelating of een schrijffout ruimt de blob op. Twaalf nieuwe
SQLite-regressies en 95 bestaande gerichte tests slagen, evenals typecheck.
Storagecleanup blijft best-effort en logt fouten via de bestaande veilige helper.
PostgreSQL-lockgedrag is lokaal niet uitgevoerd. Onafhankelijke review, volledige
controles, actuele GitHub-poorten, merge en liveverificatie zijn nog niet afgerond.
Deze scope bewijst geen algemene racevrijheid voor andere uploadschrijvers.
