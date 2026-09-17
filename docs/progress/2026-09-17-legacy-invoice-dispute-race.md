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
