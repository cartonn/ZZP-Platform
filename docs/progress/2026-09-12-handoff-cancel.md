# Intrekken van een overname-aanvraag: actuele status en audit

Securityslot 12 september 14:00 UTC, gestart door de coördinator van 14:59 UTC.
Basis: `535df3fd06bb8b1fd3917c8e2ffdacd32650c6f6`. De Handslag V5-platformrelease
#1483 is na alle poorten gemerged en op 14:37 UTC live geverifieerd.

De eerdere onafhankelijke review signaleerde dat `cancelShiftHandoff` alleen de
aanvrager en OPEN-status bewaakt. Een directe actie met een eigen synthetische
SQLite-database bevestigt dat intrekken ook lukt tijdens een geschil en op een
niet-actieve samenwerking. Een statuswijziging na de eerste read wordt evenmin
meegenomen. Bij een falende audit blijft de intrekking ten onrechte opgeslagen.

Reproductie: 17 gerichte tests, 10 rood en 7 groen vóór de reparatie. Dit is geen
productieprobe. De oude oracle-/beoordelingsguards blijven onderdeel van de dekking.

Geclaimde kleine reparatie: actuele ACTIVE/niet-betwiste samenwerking en aanvrager
bewaken bij de write; intrekking en audit in één transactie. Bestanden:
`shift-handoff-actions.ts`, gerichte annulering-/oracletests en voortgang/backlog.
Aanvragen/goedkeuren, contracten, geld, vormgeving en reviewcontroles blijven buiten
deze reparatie. Volledige validatie, onafhankelijke review en release volgen nog.

## Hervatting 13 september

De routine van 14:02 UTC controleert eerst bestaande PR #1484. De eerdere claim en
ongecommitteerde reparatie blijven behouden in hun oorspronkelijke worktree. Een nieuwe
worktree vanaf actuele main `3b2fde8321625038d104fc697139b9a4faf96b2c` verenigt de
bestaande claim met main via een gewone merge. De kwetsbare actie is sinds de oude
basis inhoudelijk ongewijzigd; het eerdere rode bewijs blijft van toepassing.

De intrekking controleert nu na ownership de ACTIVE-status en afwezigheid van een
geschil. De conditionele write controleert opnieuw aanvraagstatus, aanvrager en dezelfde
actuele samenwerking. Intrekking en audit staan samen in één transactie. De 17 echte
SQLite-regressies en zeven oracleproeven slagen op deze basis, inclusief statusraces,
eigenaarswissel, dubbel intrekken en rollback bij een auditfout. Alle testgegevens zijn
synthetisch en staan in een eigen tijdelijke database. Volledige check, onafhankelijke
review, GitHub-poorten en livecontrole volgen; dit is nog geen releaseverklaring.

De volledige suite slaagt met 8.918 tests en twee bestaande skips; typecheck, lint,
opmaak en env-documentatie zijn groen. De eerste volledige check stopte op een
indexeringstypefout in een nieuwe test; de assertion is hersteld zonder productwijziging.
De sandboxbuild kon de bestaande externe lettertypen niet ophalen; de afzonderlijke
productiebuild met netwerktoegang is vervolgens geslaagd.
