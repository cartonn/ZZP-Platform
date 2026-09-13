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

Status: geclaimd; implementatie, tests, onafhankelijke review, CI en release volgen.
