# Actuele dispuutbewaking bij losse factuuracties

Claim vóór implementatie, basis `dc5b28b5ea974988aabcba80a73363583ad48e0b`.
Bron: securityronde 17 september 02:00 UTC, bestaande dispuutbevriezingsregel.
`sendInvoice`, `markInvoicePaid` en `cancelInvoice` controleren het dispuut alleen
in de vooraf gelezen samenwerking; hun transactionele write controleert uitsluitend
factuur-id en eerdere status. Een dispuut dat daarna opent kan die write niet blokkeren.

Scope: drie legacy-statusacties in `facturen/actions.ts`, gerichte regressietests
en voortgang. Eerst de echte acties met een geïsoleerde synthetische database en
een gecontroleerde statuswijziging na de eerste lees uitvoeren. Alleen bij rood
het write-predicaat bewaken met actuele dispuut-, partij- en legacyvoorwaarden.
Geen nieuwe betaal-, fiscale of juridische functionaliteit; cascadepaden ongemoeid.

Bestaande historiek en open PRs gecontroleerd: eerdere reparaties voegden voorafgaande
dispuut-/cascadecontroles en dubbele-statuswritebewaking toe. Deze claim betreft
het venster tussen lezen en schrijven. Repro, onafhankelijke review en volledige
lokale/GitHub-controles volgen; geen productieprobes of algemene auditgarantie.

## Repro en herstel (#1506)

De echte drie acties op tijdelijke SQLite-data bevestigen dat een tussentijds
opgeslagen dispuut de factuurstatus niet tegenhield. Drie gerichte dispuutproeven
rood vóór herstel; zes extra defensieve snapshotproeven voor gewijzigde partij of
cascadeclassificatie eveneens rood. Die laatste invoegingen zijn geen afzonderlijk
bewezen exploitroute. Zes toegestane-transitie-/auditrollbackproeven slaagden al.

De drie bestaande updateMany-writes bewaken nu ook lifecycleStatus:null, de juiste
huidige partij en collaboration.disputedAt:null. Een verloren claim heeft dezelfde
no-op-afhandeling als een gewijzigde factuurstatus: geen statuswrite, audit of melding.
De voorafgaande controles blijven behouden. Alle 15 echte databaseproeven slagen.
Dit bewijst het gecontroleerde venster na de eerste lees en vóór de write, geen
algemene serialiseerbaarheid van gelijktijdige PostgreSQL-transacties.

Aangrenzende onafhankelijke broncontrole van ondertekenexports, private headers en
bewijsverwijdering vond geen nieuw bereikbaar lek; route-410- en volledige
signing→erasure-integratie blijven dekkingstekorten, geen bevestigd defect.
Volledige checks, onafhankelijke review, CI en release volgen.
