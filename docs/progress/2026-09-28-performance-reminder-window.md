# Prestatieherinneringen voorbij de eerste querybatch

PR #1529. Bron: twee echte SQLite-proeven op main `3b916add` tonen dat 500 oudere,
reeds geëscaleerde SUBMITTED-prestaties een nieuwe dag-3-herinnering blokkeren;
499 rijen werkt wel. De oude oudste-500-query hield dezelfde rijen iedere ronde.

De runner verwerkt nu pagina's van maximaal 500 rijen op `(submittedAt, id)`.
De klok staat per run vast en toekomstige inzendingen worden niet geselecteerd.
Ook na een volledig gededupliceerde of niet-herinnerbare pagina gaat de scan door.
Iedere pagina gebruikt dezelfde planner, deduplicatie en atomaire effectschrijvers.
Er komt geen automatische goedkeuring, nieuwe termijn of gewijzigde notificatietekst.

Vijf echte tijdelijke SQLite-proeven dekken 499/500/1001 reeds afgehandelde rijen,
501 gelijktijdige nieuwe signalen met omgekeerde invoervolgorde en een volledige
pagina zonder geplande signalen. Herhaling blijft idempotent. De bestaande mock
respecteert nu selectie, volgorde en paginering. Gerichte drie suites: 21 groen;
volledige suite: 9.157 groen, 3 bestaande skips. Lint, typecheck, volledige
Prettier-controle en productiebuild geslaagd. Een initiële strikte typefout op
de bewaakte laatste-rijtoegang is hersteld; de definitieve controles slagen.
Onafhankelijke review en GitHub-/releasepoorten volgen afzonderlijk.

Grenzen: uitsluitend de prestatie-runner; factuurvariant buiten scope. Geen browser,
productiemutaties of PostgreSQL-concurrentieproef. Totale looptijd groeit met de
wachtrij; ieder databaseantwoord en deduplicatieplan blijft begrensd tot één pagina.
Een gelijktijdig gewijzigde/nieuwe inzending kan de volgende cronronde bereiken;
dit is geen volledige databasesnapshot of gewijzigde concurrentiegarantie.
