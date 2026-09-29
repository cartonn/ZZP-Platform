# Factuurherinneringen voorbij de eerste querybatch

PR #1530. Bron: afzonderlijke echte SQLite-proeven op main `38289525` bewijzen dat
500 oude, reeds geëscaleerde SUBMITTED-facturen een nieuwe dag-3-herinnering blokkeren;
499 oude facturen werkt wel. De coördinator heeft dit onafhankelijk gereproduceerd.

De factuur-runner verwerkt nu pagina's van maximaal 500 rijen op `(issuedAt, id)`.
Een vaste klok begrenst de scan; null- en toekomstige indieningsdatums leveren ook
volgens de bestaande planner geen signaal en worden vóór paginering uitgesloten.
Ook na een geheel gededupliceerde of niet-herinnerbare pagina gaat de scan door.
Planner, losstaande facturen, geschil-/annuleringsbewaking, deduplicatie, notificatietekst
en atomaire effectschrijvers blijven behouden. Bedragen en factuurstatus wijzigen niet.

Acht echte tijdelijke SQLite-proeven dekken 499/500/1001 oude afgehandelde facturen,
501 gelijke datums met omgekeerde invoervolgorde, een pagina zonder geplande signalen,
null/toekomst/niet-kandidaten/losstaande factuur en betwiste/geannuleerde samenwerking.
Herhaling blijft idempotent. De bestaande mock respecteert nu selectie en paginering.
Gerichte drie suites: 26 groen. Volledige suite: 9.165 groen, 3 bestaande skips.
Lint, typecheck, volledige formatcontrole en productiebuild geslaagd.
Onafhankelijke review, GitHub-controles en release volgen afzonderlijk.

Grenzen: uitsluitend factuur-runner; geen browser, productiemutaties of PostgreSQL-
concurrentieproef. Totale looptijd groeit met de wachtrij; ieder databaseantwoord en
plan blijft begrensd tot één pagina. Gelijktijdig gewijzigde/nieuwe indieningen kunnen
de volgende cronronde bereiken; dit is geen volledige databasesnapshot of gewijzigde
concurrentiegarantie.
