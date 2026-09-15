# Mail-intake: verwijdering en auditredactie samen bewaren

Securityronde 15 september 02:00 UTC, basis f749333752cfedec64deba6f48973dcf95568690.
PR #1491: één reparatie aan de bestaande opruimtaak; gebouwd, nog in validatie/review.

De taak verwijdert een oude besliste aanvraag vóór de bijbehorende afzenderkopie uit het
auditlog is geredigeerd. Een tijdelijke fout bij die redactie laat de verwijdering staan;
een volgende run vindt de bronrij niet meer en kan de auditkopie niet alsnog opruimen.
Dit is met de echte ongewijzigde taak en helper plus een geïsoleerde databasefoutstub
gereproduceerd: eerste run fout na delete, tweede run pruned=0 met ongewijzigde auditkopie.
Geen productiegegevens gelezen of gewijzigd en geen publiek gegevenslek aangetoond.

Wijziging: één transactie per begrensde batch voor verwijdering, selectie
van overgebleven rijen, auditredactie en het snoeiauditrecord. Retentievenster, NEW-guard,
autorisatie en bestaande bewaarkeuzes blijven gelijk. Tests bewijzen rollback en herstel
bij een volgende run, met uitsluitend synthetische lokale gegevens.

Het snoeiauditrecord bevat uitsluitend tellingen per geslaagde batch, cutoff en venster.
Bij een latere batchfout blijven eerdere batches compleet; de mislukte batch blijft
beschikbaar voor een volgende run. Batches blijven begrensd op 500 rijen, maximaal
200 per run; de transactie heeft een timeout van 30 seconden. Geen automatische
reparatie van eventuele oudere, reeds losgeraakte auditkopieën geclaimd.

Validatie: twee regressies faalden vóór de fix op de verloren bronrijen, en slagen
na de fix met rollback van beide metadata-updates en snoeiaudit. Dezelfde test
bewijst vervolgens een geslaagde herstart en idempotente herhaling. Een extra proef
met 501 rijen bevestigt dat de eerste batch bewaard blijft als de tweede faalt.
Een aparte proef bewaart NEW/recent inclusief auditkopie. De elf bestaande tests
blijven groen, inclusief heropenen tussen selectie en delete; samen 15 PASS.
Eerste fixture-opstart miste verplichte User-velden; die opstartfouten telden niet
als regressiebewijs. De volledige testsuite slaagt: 8.945 PASS, twee bestaande skips.
Lint, typecontrole, volledige opmaak en envdocumentatie slagen. Na het kopiëren van
dependencies moest de lokale Prisma-client opnieuw worden gegenereerd; de eerdere
query-budget-opstartfout telde niet als productdefect. De productiebuild slaagt;
onafhankelijke reviews en actuele GitHub-poorten volgen.

De securityronde onderzocht afgebakend document-/certificaattoegang, ondertekenbewijzen,
geschilbewaking en mail-intake. Vooraf slaagden 263 bestaande tests in 15 bestanden;
die misten de hier gevonden fout. Geen nieuwe bereikbare IDOR in de onderzochte
documentpaden bevestigd. Bekende tenant-erasure-/publieke-reviewprivacy blijft open.
Geen wijziging aan schema, bewaarbeleid, externe mail of productieconfiguratie.
