# Bereikbare dispuutherinneringen — scopeclaim

Bron: reproduceerbare SQLite-proef op main cf41a873: 499 reeds geëscaleerde open disputen laten een nieuwe dag-3-melding door; 500 houden beide partijmeldingen blijvend buiten de runner. Lead heeft dit onafhankelijk herhaald. Geen nieuwe productfunctionaliteit.

Scope: uitsluitend `dispute-reminders-task.ts`, gerichte SQLite-regressies en voortgangsdocumentatie. Doorloop stabiele disputedAt/id-pagina’s met bestaande planner, ontvangers, deduplicatie, audits en transacties. Geen geld-, status-, auth-, tenant- of designwijzigingen.

Deze eerste commit claimt alleen scope. Implementatie, volledige checks en onafhankelijke review volgen; nog geen geslaagde review of live-uitrol.

## Implementatie

De runner doorloopt pagina’s van maximaal 500 in stabiele disputedAt/id-volgorde,
met één vast now en opgetelde resultaten. Ook volledig reeds behandelde,
geannuleerde of stille pagina’s laten de volgende pagina door. Bestaande planner,
event-dedupe, partij- en adminontvangers en atomaire effecten per signaal blijven
behouden. Toekomstige datums vallen buiten de scan en waren reeds niet due.

Zeven echte SQLite-gevallen dekken 499/500/1001 eerder geëscaleerde rijen, 501
identieke tijdstippen, geannuleerde/stille pagina’s, admin-escalatie en herhaling.
33 gerichte tests geslaagd. Volledige suite: 9.187 geslaagd, 3 bestaande skips;
868 suites geslaagd, 2 bestaande skips. Types, lint, productiebuild en volledige formatcontrole geslaagd.
Onafhankelijke review, GitHub-poorten en release volgen.
Geen productieprevalentie of PostgreSQL-concurrency bewezen. Runtime groeit met
het aantal open disputen; geheugen/queryvensters blijven begrensd per pagina.
