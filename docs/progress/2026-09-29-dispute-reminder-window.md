# Bereikbare dispuutherinneringen — scopeclaim

Bron: reproduceerbare SQLite-proef op main cf41a873: 499 reeds geëscaleerde open disputen laten een nieuwe dag-3-melding door; 500 houden beide partijmeldingen blijvend buiten de runner. Lead heeft dit onafhankelijk herhaald. Geen nieuwe productfunctionaliteit.

Scope: uitsluitend `dispute-reminders-task.ts`, gerichte SQLite-regressies en voortgangsdocumentatie. Doorloop stabiele disputedAt/id-pagina’s met bestaande planner, ontvangers, deduplicatie, audits en transacties. Geen geld-, status-, auth-, tenant- of designwijzigingen.

Deze eerste commit claimt alleen scope. Implementatie, volledige checks en onafhankelijke review volgen; nog geen geslaagde review of live-uitrol.
