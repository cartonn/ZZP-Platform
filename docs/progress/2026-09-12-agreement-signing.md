# Bouwronde 12 september 2026, 12:22 UTC — modelovereenkomst tekenen

Claim vanaf main `79c98a7bf7c8ceef210a6c59182961b3dcaab300`.

Bron: afzonderlijke V5-review wees op de bestaande serveractie
`signModelAgreementAction`. Die controleert de partij en een eerdere handtekening,
maar leest geen samenwerkingsstatus of geschil en schrijft daarna zonder conditie.
De gebruikersinterface beschouwt uitsluitend PROPOSED/ACTIVE als nog open.

Dit increment onderzoekt en herstelt uitsluitend nieuwe modelovereenkomsthandtekeningen
bij beëindiging/geschil, inclusief gelijktijdige herhaling en atomair auditspoor.
Eerst een directe proef met geïsoleerde synthetische database; daarna relevante tests,
volledige controles en onafhankelijke review. Dit is een claim, nog geen test- of releasebewijs.
De typekeuze, dienstenoverdracht, V5-presentatie en open PR #1474 worden hier niet gewijzigd.

## Rechtstreeks gereproduceerd en gericht hersteld

PR #1482. De eerste run voerde de echte serveractie, Prisma en audit uit op een
nieuwe tijdelijke SQLite-database; alleen authenticatie en cache werden vervangen.
13 van 21 verwachtingen faalden op de oude actie: terminale/ongeldige status,
geschil, wijziging na de eerste lees, overschreven timestamp en auditfout zonder rollback.

De reparatie schrijft met een actuele status-/geschil-/partij-/handtekeningconditie
en neemt de audit op in dezelfde transactie. Een reeds geregistreerd eigen akkoord
blijft een no-op, ook historisch. De tests zijn uitgebreid naar 23 gevallen, inclusief
twee echte tekenaanroepen met een deterministisch verouderde eerste lees en precies
één audit. Samen met de drie bestaande overeenkomstvormtests slagen 26 tests.
Dit bewijst SQLite en de gecontroleerde volgorde, geen gelijktijdige Postgres-belasting.
Volledige lint/types en 8.713 tests slagen (2 bestaande skips), evenals opmaak.
De eerste build kon in de sandbox de lettertypen niet bereiken; de afzonderlijke
build met netwerktoegang is succesvol afgerond. De afzonderlijke reviewer heeft
de implementatie beoordeeld en 26 gerichte tests zelf uitgevoerd zonder blocker.
Definitieve review op de gecommitteerde SHA, GitHub-poorten en release volgen nog.
