# DBA-export volgt ingestelde duurdrempels

Claim voor bouwronde 30 september 12:22 UTC. Bij opgeslagen 3/9-maandsgrenzen
geeft het echte PDF-dataobject op 15 april voor een start op 1 januari LAAG,
terwijl de assessment met dezelfde configuratie VERHOOGD geeft. Bron: begrensde
audit routine-20260930-build-1240-audit.md; geen nieuwe productfunctionaliteit.

Scope: bestaande geautoriseerde DBA-dossierroute leest configuratie na toegang,
geeft die door aan de pure dossierbouwer, plus daadwerkelijke routeregressies.
Disclaimer, toegang, audit, headers en PDF-opmaak behouden. Lijst-/adminfilterpariteit
blijft apart; geen overlappende uitbreiding.

## Implementatie en regressiebewijs

De route leest `getDbaThresholds()` eenmaal na de bestaande toegangspoort. De pure
`buildDbaAuditData` ontvangt optioneel dezelfde drempels voor de bestaande beoordeling
en de duurindicator. Zonder argument blijven de bestaande 6/12-maandsdefaults gelden.
De PDF-renderer, opmaak, disclaimer, tarieftoets en toegangs-/auditketen zijn ongewijzigd.

Zeven nieuwe routeregressies gebruiken de echte configuratielader en dossierbouwer;
alleen database, PDF-grens en randdiensten zijn geïsoleerd. Met de oude bron falen vier
gevallen: ZZP'er, opdrachtgever en admin krijgen LAAG in plaats van VERHOOGD bij
3/9 maanden; een oude omgekeerde 12/6-configuratie geeft VERHOOGD in plaats van HOOG.
Drie controles blijven groen: ontbrekende configuratie met standaardduurgrens,
buitenstaander en onbekende samenwerking. Na herstel slagen alle zeven. De tests
bewaken ook de duurindicator, auditniveau, disclaimer en private responseheaders.

Gerichte validatie: vijf bestanden, 68 tests geslaagd; inclusief bestaande dossier-
audit-, pure bouwer-, daadwerkelijke PDF-renderer- en monitorregressies.
Volledige suite: 873 bestanden geslaagd, twee bestaande bestanden overgeslagen;
9.209 tests geslaagd, drie bestaande skips. `env -u RUST_LOG npm run check` geslaagd:
lint, typecheck, tests en productiebuild. Volledige Prettier-controle geslaagd. De build
herstelde automatisch na tijdelijke TLS-downloadretries. Onafhankelijke review,
CI/e2e en release zijn nog niet bevestigd. Er zijn geen lokale server, browser, productiedata, echte mail of
betaalde externe diensten gebruikt.
