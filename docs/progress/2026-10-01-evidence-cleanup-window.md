# Bereikbare bewijsstuk-opruiming na opslagfouten

Claim: bouwronde 1 oktober 2026 04:22 UTC, basis 0b73d06be371a7a45a4b7fed712bc1fb0222ef01.

De productie-runner selecteert alleen de oudste 200 beoordeelde bewijsstukken. Een geïsoleerde proef met echte SQLite en de echte runner/verwijderhelper toont dat 200 oude VOG-objecten met objectspecifieke opslagfouten een later verwijderbaar object in twee opeenvolgende runs volledig uitsluiten. De controle met 199 bereikt het nieuwe object wel. Geen productiegegevens gebruikt.

Scope: credential-evidence-cleanup-task.ts en gerichte regressietests; stabiele evidenceSeenAt/id-paginering. Bestaand bewaarbeleid, file-override, duurzame claims, referentieguards, opslagvolgorde en audit blijven behouden. Geen nieuwe integratie of juridische beleidswijziging.

Status: geclaimd vóór implementatie. Onafhankelijke review, volledige validatie, echte PR-CI, merge en release nog niet uitgevoerd.
