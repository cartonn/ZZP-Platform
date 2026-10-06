# Bereikbare bewijsstuk-opruiming na opslagfouten

Claim: bouwronde 1 oktober 2026 04:22 UTC, basis 0b73d06be371a7a45a4b7fed712bc1fb0222ef01.

De productie-runner selecteert alleen de oudste 200 beoordeelde bewijsstukken. Een geïsoleerde proef met echte SQLite en de echte runner/verwijderhelper toont dat 200 oude VOG-objecten met objectspecifieke opslagfouten een later verwijderbaar object in twee opeenvolgende runs volledig uitsluiten. De controle met 199 bereikt het nieuwe object wel. Geen productiegegevens gebruikt.

Scope: credential-evidence-cleanup-task.ts en gerichte regressietests; stabiele evidenceSeenAt/id-paginering. Bestaand bewaarbeleid, file-override, duurzame claims, referentieguards, opslagvolgorde en audit blijven behouden. Geen nieuwe integratie of juridische beleidswijziging.

Status: geclaimd vóór implementatie. Onafhankelijke review, volledige validatie, echte PR-CI, merge en release nog niet uitgevoerd.

Implementatie: begrensde pagina’s in evidenceSeenAt/id-volgorde; geen offset over verwijderde rijen. Ook volledig mislukte pagina’s gaan door en dezelfde kandidaat wordt binnen de stabiele selectie eenmaal geprobeerd. De volgende run herneemt mislukte kandidaten. De verwijderhelper en het bewaarbeleid zijn ongewijzigd.

Bewijs: vijf echte SQLite-regressies, waarvan drie rood vóór herstel. Grenzen 199/200, 401 gelijktijdige kandidaten met gemengde of uitsluitend fouten, succesvolle retry, audit/idempotentie en file-override; 41 tests in zes suites groen. Lint, types en volledige suite slagen: 9.249 tests, 3 bestaande skips; 875 suites groen, 2 bestaande skips. Repositoryformattering groen. De eerste productiebuild strandde op lokale ENOSPC tijdens webpack. Na verwijderen van uitsluitend oude gegenereerde buildcaches door de coördinator slaagt de gerichte buildherhaling (exit 0); bij aanvang was 7,9 GiB vrij. Geen bronwijziging of herhaalde volledige tests nodig. Geen productiegegevens of externe opslag gebruikt.
