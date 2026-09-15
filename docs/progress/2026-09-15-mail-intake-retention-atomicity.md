# Mail-intake: verwijdering en auditredactie samen bewaren

Securityronde 15 september 02:00 UTC, basis f749333752cfedec64deba6f48973dcf95568690.
Claim: één reparatie aan de bestaande opruimtaak. Nog geen implementatie of releaseclaim.

De taak verwijdert een oude besliste aanvraag vóór de bijbehorende afzenderkopie uit het
auditlog is geredigeerd. Een tijdelijke fout bij die redactie laat de verwijdering staan;
een volgende run vindt de bronrij niet meer en kan de auditkopie niet alsnog opruimen.
Dit is met de echte ongewijzigde taak en helper plus een geïsoleerde databasefoutstub
gereproduceerd: eerste run fout na delete, tweede run pruned=0 met ongewijzigde auditkopie.
Geen productiegegevens gelezen of gewijzigd en geen publiek gegevenslek aangetoond.

Voorgenomen wijziging: één transactie per begrensde batch voor verwijdering, selectie
van overgebleven rijen, auditredactie en het snoeiauditrecord. Retentievenster, NEW-guard,
autorisatie en bestaande bewaarkeuzes blijven gelijk. Tests bewijzen rollback en herstel
bij een volgende run, met uitsluitend synthetische lokale gegevens.

Bestandsgrenzen: mail-intake-retention-task.ts, bijbehorende unit-/integratietests,
securitybacklog en voortgang. Geen wijziging aan schema, externe mail of productieconfiguratie.
