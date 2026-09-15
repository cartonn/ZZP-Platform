# Mail-intake fase 3 — browserproef (#1490)

Bron: CURRENT_TASK.md, product/kern punt 3. Planners moeten een ontvangen aanvraag kunnen
beoordelen en als concept overnemen. Parser, webhook en reviewqueue bestonden al;
`rg --files e2e` bevestigde dat hun volledige keten nog geen browserproef had.

## Wijziging

Nieuwe root-e2e gebruikt twee verse opdrachtgeveraccounts en echte lokale HTTP-/serveracties.
Geen ontbrekende configuratie overslaan: de proef eist de bekende dummy-sleutel en localhost.
De gedeelde Playwright-configuratie levert die waarde aan testprocessen en een eigen lokale
server, zowel voor `npm run e2e` als CI. Een reeds draaiende ontwikkelserver wordt niet
hergebruikt, omdat die de testinstelling kan missen. Een expliciete andere waarde wordt
niet overschreven en faalt op de fixturecontrole. Geen repositorysecret, productieconfiguratie,
inbound-provider, DNS of echte mail wordt gewijzigd.

De proef bewijst geweigerde lege/foute autorisatie; twee afleveringen leveren één aanvraag;
geparsede locatie/tarieven verschijnen; een andere opdrachtgever ziet de aanvraag niet en
kan het aantoonbaar verstuurde vreemde ID niet accepteren. Daarna maakt alleen de eigenaar
expliciet het concept, met zichtbare conceptstatus en publiceerknop. De andere opdrachtgever
krijgt de niet-gevondenpagina zonder titel in DOM of respons. Een retry ná acceptatie bewaart
de ene bestaande conceptlink; de andere eigen aanvraag blijft onaangeroerd.

De uiteindelijke concept-URL wordt pas na de echte navigatie gelezen; de wachtrijroute zelf
mag niet aan die wachtvoorwaarde voldoen. Vreemde invoer wordt bij het formdata-event gezet
en in de werkelijke POST gecontroleerd, zodat een React-render de aanval niet ongemerkt
terugzet naar een geldige eigen aanvraag. ADR-0009 accepteert de beschermde soft-404;
expliciete weigering en geen gegevens zijn hier verplicht, een kale HTTP 200 is geen bewijs.

## Validatie

Lokale productiebuild met een aparte SQLite-database en opslag, alleen synthetische fixtures.
Browserproef: 1 PASS, retries=0. De eerdere proefversies faalden op testopzet (te brede URL-
voorwaarde, veranderde verborgen invoer en de verkeerde niet-gevondenmarker); deze uitslagen
bewijzen geen productdefect. Geen productcode aangepast om de test groen te krijgen.

8.941 unittests PASS, 2 bestaande skips; typecheck, lint, formatting, 119 envdocumentaties en
productiebuild PASS. De seed-tool had lokale IPC-toegang nodig; de build gebruikte netwerk
voor bestaande lettertypen. Er is geen productie-database of echte mailbox benaderd.

De eerste GitHub-review wees terecht op de ontbrekende standaardinstelling bij lokale
e2e-uitvoering. Die is naar de gedeelde configuratie verplaatst; de CI-specifieke waarde
is verwijderd. Herbeoordeling op de nieuwe commit en actuele GitHub-poorten volgen.
De gewone lokale `npm run e2e -- --project=ci`-route slaagt ook met de webhookvariabele
expliciet uit de omgeving verwijderd: 1 PASS, geen retries, eigen ontwikkelserver en testdatabase.
Dit document claimt nog geen merge
of deployment. Geen uitgebreide providercontracttest, externe aflevergarantie of complete
mail-intake-matrix: dit increment dekt de bestaande afzender-matchroute naar een concept.
