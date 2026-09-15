# Begrensde databasevoorbereiding voor de mailretentieproef

Claim vóór implementatie. Basis `de68803aa4b8b2de7a1ac79660209c0b81e04aef`.
Bron: echte main-CI 35002149141, eerste poging, job 104492879139. De
`beforeAll` van `mail-intake-retention-atomicity.test.ts:22` overschreed de
standaard hooklimiet van 10 seconden; alle vier proeven werden overgeslagen.
Hierdoor werd de release overgeslagen. Dezelfde code slaagde bij de eerste
herhaling (vier retentieproeven, 8.969 totale tests, twee bestaande skips).

De hook maakt een volledig tijdelijk SQLite-schema via een child process met
al een eigen limiet van 30 seconden, gevolgd door twee kleine fixture-inserts.
De impliciete buitenlimiet van 10 seconden is daarmee korter dan de expliciet
begrensde voorbereiding. Geef alleen deze eenmalige hook een expliciete limiet
van 40 seconden: de bestaande childlimiet plus ruimte voor fixture-inserts.
Alle testlichamen, hun standaardlimieten, rollbackproeven, batchgrenzen en
productcode blijven gelijk. Geen globale timingwijziging of testretry.

Beoogde bestanden: deze bestaande test en voortgangsdocumentatie. Bewijs met de
ongewijzigde gerichte suite en een geïsoleerde vertraagde setup-proef; vervolgens
volledige controles, aparte onafhankelijke review en echte GitHub-CI/native review.
Andere performancebacklogpunten zijn in actuele code al gerealiseerd; geen open
claim overlapt deze hook. Geen lokale browser/server of productiegegevens nodig.

## Gecontroleerde timingproef

Een tijdelijke, niet-gecommitteerde Node-preload vertraagde uitsluitend de echte
Prisma-schemavoorbereiding met 11 seconden. Met de oude hook faalt de suite op
10 seconden en worden alle vier tests overgeslagen. Met de expliciete setupgrens
slagen dezelfde vier proeven in 11,99 seconden, inclusief de echte tijdelijke
database en rollback-/batchasserties. De preload stond uit tijdens gewone checks.
Dit bewijst de setupgrens; het is geen claim over snellere productiefunctionaliteit.

Lint, types, volledige opmaak en 8.969 tests (twee bestaande skips) zijn groen.
De sandboxbuild miste toegang tot bestaande Google-fonts; dezelfde code bouwde
met netwerktoegang succesvol. Echte CI en onafhankelijke/native review volgen vóór een merge.
