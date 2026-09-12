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
