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

## Gebouwd en gericht gecontroleerd

Eén gedeelde fixturefactory levert dezelfde bron-/auditgegevens aan kleine en grote
proeven. De 501-rijenproef gebruikt twee Prisma-bulk-inserts in plaats van 1.002
losse fixturewrites. Extra tellingen bewijzen vóór de foutinjectie dat alle 501
bronrijen én 501 ontvangst-auditrecords aanwezig zijn. De bestaande fouttrigger,
productietaak, 500/1-batchgrens, inhoudelijke asserts en tijdslimiet blijven intact.

Dezelfde lokale vier proeven slagen vóór en na de wijziging. In deze ene lokale
voor/nameting daalt de duur van de batchproef van 419,92 naar 72,07 ms; dat is een
waarneming, geen CI-snelheidsgarantie of nieuwe tijdsassertie. De bron van de reparatie
is de echte eerdere CI-time-out, niet een lokaal gefingeerde rode test. Drie
retentiesuites slagen samen met 19 tests. Volledige controle en review volgen.
