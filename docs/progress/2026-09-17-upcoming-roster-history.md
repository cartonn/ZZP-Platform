# Bijna-verloop achter vervangen certificaten — 17 september 2026

Bron: de afzonderlijke bijna-verloopvariant uit de persona-audit van 17 september
05:17. #1511 herstelde alleen de reeds-verlopen selectie. Nieuwe reproductie op
`3d7bbe1c`: tenantprofiel A heeft vijftig VERIFIED LICENSE-exemplaren die binnen
vijftig uur verlopen plus één onbeperkte vervanger. B heeft een LICENSE die over
tien dagen verloopt zonder vervanger. Volledige verplichte dossiers en actuele
identiteit/profiel/login isoleren het signaal. Echte `pendingTasks` en `navBadges`
leveren nul in plaats van één. Wegwerp-SQLite, geen productiegegevens of browser.
Draftclaim #1512 vóór implementatie; open en recente PR's opnieuw gecontroleerd.

De gedeelde `rosterExpiringCredentialWhere` selecteert alleen VERIFIED in `(now, soon]`
en sluit per type dekking voorbij het venster uit voordat de bestaande cap50 geldt.
Dekking vereist VERIFIED op hetzelfde profiel/type met geen vervaldatum of een datum
strikt na `soon`. Een vervanger binnen het venster wordt bewust niet uitgesloten:
de bestaande volledige dossiercontrole kiest daar het relevante exemplaar. Actielijst, zijbalk en dashboard
gebruiken dezelfde selectie en expiresAt/id-volgorde. De reeds-verlopen tak blijft
intact; ook verplichte typen kunnen nog een bijna-verloopmelding geven.

Elf extra databasegevallen dekken onbeperkte/langer geldige vervangers, verval op
dag20/dag30, vier niet-dekkende statussen, ander type/profiel/tenant, verplicht type
en exact-nu-kandidaten. De oude elf reeds-verlopen gevallen blijven bestaan.
Twee bestaande mocks volgen de gewijzigde exclusieve ondergrens/stabiele volgorde.
Volledige lokale controles en onafhankelijke reviews volgen; actuele CI en release
zijn aparte bewijzen. Geen onbeperkte nieuwe credentialscan, schemawijziging of
uitbreiding van de bestaande cap voor werkelijk open signalen. Lokale SQLiteproeven
zijn geen afzonderlijke PostgreSQL-query- of browserreproductie.

De eerste onafhankelijke review vond dat de dashboardhelper nog de oude selectie
gebruikte. Negen van de elf bijna-verloopgevallen falen wanneer de echte
`summarizeRosterExpiringSoon` aan dezelfde databaseproef wordt toegevoegd.
Ook die helper gebruikt nu het gedeelde filter. Alle elf gevallen bewaken drie
oppervlakken; dashboard en badge zijn geen gemockte vervangers. Nieuwe review volgt.

De native GitHub-review van head `3f89939b` blokkeerde een tweede randgeval:
50 oude exemplaren bleven andere profielen verdringen als de vervanger zelf op dag
20 of 30 verliep. Met alle 50 rijen intact falen beide databasegevallen vóór herstel.
De eerste selectie groepeert nu per profiel/type en sorteert op het laatste verval,
met profiel/type als vaste tie-breakers; de limiet geldt pas daarna. De volledige
dossiercontrole blijft behouden. Een één-slotproef bewijst bovendien dat verval op
dag 10 vóór de vervanger op dag 20/30 wordt geselecteerd. Namen worden met de
bestaande tweede dossierquery opgehaald. Dit vergroot geen onbeperkte scan in de app.
Eerdere reviewoordelen blijven bewaard; de nieuwe commit vereist nieuwe reviews.
