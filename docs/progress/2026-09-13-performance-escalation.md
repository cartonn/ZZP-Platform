# 13 september 2026 — blijvende opvolgtaak voor ongekeurde prestaties

Claim voor de bouwronde 16:22 UTC, vanaf main `888734fc`.
Bron: CURRENT_TASK.md techniek 6a en de audit van 3 september: de eenmalige
escalatiemelding verdwijnt na lezen, terwijl de ingediende prestatie blijft wachten.
Actuele code bevestigt dat adminTasks geen prestatie-escalatie laadt.

Scope: één blijvende beheertaak per lang wachtende SUBMITTED-prestatie op een
ACTIVE, niet-betwiste samenwerking, met dezelfde drempel als de bestaande reminder.
Actiecentrum, dashboard en navigatietelling volgen effectieve serverstatus.
Bestanden: actions/tasks.ts, actions/pending-tasks.ts, signals.ts, een gedeelde
queryhelper, gerichte regressietests en voortgang. Geen automatische goedkeuring,
geldmutatie, nieuwe integratie of wijziging van herinneringen.

Gebouwd in #1487: gedeelde request-gecachete query voor maximaal de oudste vijftig
prestaties, met stabiele id-volgorde bij gelijke indieningsdatum. De bestaande planner
levert de escalatiedrempel; bij standaard dag 3/7 vanaf acht volledige dagen.
Een linktaak opent de uren op het bestaande samenwerkingsdetail; goedkeuring blijft
bij de opdrachtgever. Geen afhankelijkheid van notificatie- of eventgeschiedenis.
De bestaande signaalsnapshot kan maximaal 60 seconden achterlopen.

Validatie: 8.933 tests geslaagd, twee bestaande skips; twaalf nieuwe echte SQLite-proeven
bewijzen tijdgrens, status, geschilherstel, configuratie, sortering en doorschuiven na
het afhandelen van de oudste vijftig. Drie nieuwe taak-/badgeproeven bewijzen koppeling,
lege toestand en afscherming voor onbekende rollen. De eerste volledige run vond vijf
oude mocks zonder de nieuwe query; die zijn aangevuld. De volledige herhaling is groen.
Onafhankelijke review, CI en liveverificatie volgen.
