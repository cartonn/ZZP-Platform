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
