# Mailretentieproef: 501 testgevallen efficiënt voorbereiden

Claim vóór implementatie, bouwronde 15 september 08:22 UTC.
Basis: `301c07d07ba92b2a924e04f0a63768bdd61252e7`.

Bron: echte main-CI 34937276385, job 104277824648. De bestaande proef voor
afgeronde en teruggedraaide batches overschreed vijf seconden. De voorbereiding
maakt 501 intake-/auditparen met 1.002 achtereenvolgende losse writes.
Dezelfde proef slaagt afzonderlijk lokaal en bij ongewijzigde CI-herhaling;
er is geen onjuiste productie-uitkomst aangetoond.

Scope: uitsluitend de synthetische gegevensvoorbereiding in
`src/lib/mail-intake-retention-atomicity.test.ts` en voortgangsdocumentatie.
Gebruik bulk-inserts met dezelfde 501 bronrijen en gekoppelde auditmetadata.
Behoud echte foutinjectie, 500/1-batchgrens, rollback/herstart, asserts en time-out.
Geen wijziging aan productiecode, retentiebeleid, vormgeving of CI-poorten.
Gerichte controles, volledige suite, onafhankelijke review en echte CI volgen.
