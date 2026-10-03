## 3 oktober — "Start plaatsing"-agenda-event (#1559)

De persoonlijke agenda-feed (`/api/agenda` + `feed.ics`) toonde al "Einde plaatsing" maar geen
start-nudge. Toegevoegd: een symmetrisch gehele-dag-event "Start plaatsing: <tegenpartij>" met
herinneringen 7 en 1 dag vooraf, voor ZZP'er en opdrachtgever, uitsluitend nog niet begonnen
plaatsingen (`ACTIVE`, niet-betwist, `startDate >= now`). Privacy-pariteit met het end-event (alleen
tegenpartijnaam). Hergebruikt de bestaande ICS-builder/loader-scoping. 133 gerichte calendar-/
agenda-tests groen; volledige suite 9.251 groen (3 bestaande skips), types/lint/format en
productiebuild groen. Meegenomen: `patch-package` → `devDependencies` (deblokkeert de base-brede
productie-audit-poort, braces-DoS GHSA-vfj7-8cjw-p6xm; no-op zodra #1553 merget). CI/review volgen.

## 30 september — ingestelde DBA-drempels in beheeroverzicht (#1539)

Eén configuratielezing voedt SQL-filter/telling en rijbadges. Zes regressies rood vóór herstel; echte SQLite-dekking voor lagere/hogere, gelijke en oude omgekeerde grenzen, kalendergrenzen, vlaggen en paginering. 16 gerichte en 9.244 volledige tests groen (3 bestaande skips); lint/types/format en productiebuild groen. Onafhankelijke review en CI volgen. [Scope](docs/progress/2026-09-30-admin-dba-thresholds.md).

## 30 september — DBA-drempels in samenwerkingslijst (#1538)

Eén configuratielezing na auth voedt alle actieve lijstbeoordelingen; 24 paginagevallen, 59 gerichte en 9.233 volledige tests groen (3 bestaande skips). Lint, types, format en productiebuild groen; review en CI volgen. [Scope](docs/progress/2026-09-30-dba-list-thresholds.md).

## 30 september — ingestelde DBA-drempels in dossierexport (#1537)

De geautoriseerde export gebruikt nu opgeslagen drempels voor beoordeling en
duurindicator. Zeven routeregressies: vier rood vóór herstel, alle groen erna;
68 gerichte en 9.209 volledige tests groen (3 bestaande skips). Lint, types, format
en productiebuild groen; onafhankelijke review en CI volgen.
[Scope en bewijs](docs/progress/2026-09-30-dba-export-thresholds.md).

## 30 september — ingestelde DBA-drempels op samenwerkingsdetail (#1535)

De detailpagina gebruikte vaste 6/12-maandsgrenzen terwijl monitor en overzicht
opgeslagen beheerdersinstellingen volgen. Eén serverlezing voedt nu beoordeling
en vooruitblik na de bestaande toegangscontrole. Vier paginaregressies en 9.195
volledige tests groen (3 bestaande skips). Onafhankelijke review en CI volgen.
[Scope](docs/progress/2026-09-30-dba-detail-thresholds.md).

## 30 september — productie-audit dependencyherstel (#1536)

De verplichte audit blokkeerde op Nodemailer en brace-expansion. Gericht gepatcht:
Nodemailer 10.0.13 en bestaande brace-expansion-kopieën binnen hun majorversie.
Echte ESM/CommonJS-import en offline berichtopbouw plus mailtests groen (65 tests);
productie-audit nul kwetsbaarheden. Mailkanalen en auditbeleid ongewijzigd.
Volledige validatie en onafhankelijke review volgen. [Scope](docs/progress/2026-09-30-production-audit.md).

## 29 september — bereikbare dispuutherinneringen (#1533)

Vijfhonderd oude, reeds geëscaleerde open disputen hielden nieuwe partijmeldingen
buiten de runner. Echte SQLite-proef rood bij 500, controle groen bij 499;
onafhankelijk herhaald. Stabiele disputedAt/id-pagina’s behouden planner,
ontvangers, deduplicatie en transacties. Zeven SQLite-regressies en 33 gerichte
tests groen; volledige suite 9.187 groen (3 bestaande skips), types en lint
geslaagd. Productiebuild en formatcontrole groen. Onafhankelijke review,
GitHub-poorten en release volgen.
[Scope](docs/progress/2026-09-29-dispute-reminder-window.md).

## 2026-09-29 — indienherinneringen bereikbaar voorbij eerste batch (#1534)

Een cap van 1.000 ACTIVE/SIGNED samenwerkingen sloot latere urenstaatmeldingen uit.
Grensproef onafhankelijk bevestigd; stabiele id-pagina’s behouden bestaande planner,
ontvangers, deduplicatie en transacties. Vier SQLite-regressies, 15 gerichte tests en
9.191 volledige tests groen (3 bestaande skips). Types, lint, format en build groen; review volgt.
[Scope en bewijs](docs/progress/2026-09-29-submission-reminder-window.md).

## 29 september — IBM Plex zonder build-download (#1532)

Productiebuild strandde in de IBM Plex Sans-loader van het bestaande ontwerplab.
Zes bestaande fontbestanden lokaal gebundeld; 24 faces, fallbackmaten, CSS-variabele
én uitsluitend Latin-preload behouden. Negen gerichte checks en daadwerkelijke
Next-CSS-vergelijking bevestigen dezelfde faces en fontbytes. Lint, types, format,
productiebuild en 9.180 tests groen (3 bestaande skips). Onafhankelijke review,
GitHub-poorten en release volgen. [Scope](docs/progress/2026-09-29-local-ibm-plex.md).

## 29 september — bereikbare certificaatherinneringen (#1531)

Tweeduizend reeds herinnerde, nog geldige certificaten hielden een nieuwe melding
buiten de runnerquery. Echte SQLite-proef rood bij 2.000, controle groen bij 1.999;
onafhankelijk bevestigd. Stabiele vervaltijd/id-pagina’s met atomaire effecten per
pagina behouden de bestaande dekking, deduplicatie en statusbewaking. Zes echte
SQLite-gevallen en 51 gerichte tests groen; volledige suite 9.171 groen (3 bestaande
skips). Lint, types, formatcontrole en netwerkbuild geslaagd; onafhankelijke review
en release volgen.
[Scope](docs/progress/2026-09-29-credential-reminder-window.md).

## 29 september — bereikbare factuurherinneringen (#1530)

Vijfhonderd oude, reeds geëscaleerde facturen blokkeerden een nieuwe dag-3-herinnering.
Afzonderlijke echte SQLite-proef rood bij 500, controle groen bij 499; onafhankelijk
bevestigd. De factuur-runner doorloopt nu begrensde batches met stabiele tijd/id-volgorde.
Acht SQLite-gevallen en 26 gerichte tests groen; volledige suite 9.165 groen
(3 bestaande skips). Lint, types, volledige formatcontrole en productiebuild geslaagd.
Onafhankelijke review en release volgen. [Scope](docs/progress/2026-09-29-invoice-reminder-window.md).

## 28 september — bereikbare prestatieherinneringen (#1529)

Vijfhonderd oude, reeds geëscaleerde urenstaten hielden een nieuwe dag-3-herinnering
buiten de query. Echte SQLite-proef rood bij 500, controle groen bij 499.
De runner doorloopt nu begrensde batches met stabiele tijd/id-volgorde; planner,
deduplicatie en transacties blijven behouden. Vijf SQLite-gevallen en 21 gerichte
tests groen; volledige suite 9.157 groen (3 bestaande skips). Lint, types, volledige
formatcontrole en productiebuild geslaagd. Onafhankelijke review en release volgen. [Scope](docs/progress/2026-09-28-performance-reminder-window.md).

## 28 september — corrigeerbare dienstpreview (#1527)

Een verkeerd eindmaandveld liet de urenformulier-preview crashen. De gedeelde
duurgrens wordt nu vóór segmentatie gecontroleerd met een herstelbare melding;
invoer blijft staan en ongeldige rijen leveren geen gedeeltelijk/vervangend totaal.
Vier regressies rood vóór herstel; zeven rendergevallen groen in Amsterdam en
UTC, 154 gerichte tests groen. Lint/types/format en 9.152 tests groen (3 skips).
Productiebuild geslaagd; onafhankelijke reviews en GitHub-checks volgen.
[Scope](docs/progress/2026-09-28-shift-preview-limit.md).

## 27 september — Cormorant zonder build-download (#1526)

Terugkerende loaderfout vóór browsertests begrensd hersteld: vijf bestaande
fontbestanden ongewijzigd gebundeld, inclusief twintig faces, fallbackmaten en
uitsluitend Latin-preload. Acht gerichte tests en geïsoleerde compilatie zonder
netwerk groen. Lint/types/format, 9.145 tests (3 skips) en productiebuild groen.
Werkelijk gebouwde CSS vergeleken met vorige build; onafhankelijke reviews en CI volgen.
[Scope en bronverantwoording](docs/progress/2026-09-27-local-cormorant.md).

## 27 september — certificaatherinnering rond klokwissel (#1525)

De runner selecteerde in de lente 719 uur terwijl de planner 720 uur beoordeelt.
Exacte tijdsduur gebouwd; tien zonegevallen in bestaande taakharness, twee rood
vóór herstel en 32 gerichte tests groen in Amsterdam en UTC. Lint/types/format en
9.137 tests groen (3 skips); netwerkbuild geslaagd. Reviews en CI volgen. [Scope](docs/progress/2026-09-27-expiry-runner-window.md).

## 27 september — exact bijna-verloopvenster (#1524)

Een fractionele dag buiten het 30-daagse venster gaf alleen de opdrachtgever een
te vroege certificaatwaarschuwing. Exacte tijdvergelijking gebouwd; 13 regressies,
123 gerichte en 9.127 volledige tests groen (3 skips), lint/types/format geslaagd.
Netwerkbuild geslaagd; onafhankelijke review en CI volgen. [Scope](docs/progress/2026-09-27-exact-expiry-window.md).

## 27 september — gelijke certificaat-eindgrens (#1523)

Bij verval exact op opdracht-einde kreeg alleen de zelfstandige een vernieuwingstaak.
Echte helper-/taak-/dossierproef bevestigt de tegenstelling. Herstel van de oorspronkelijke
strikte eindgrens gebouwd; 88 gerichte tests en 9.114 tests groen (3 skips).
Lint, types, format en netwerkbuild geslaagd; reviews en CI volgen.
[Scope](docs/progress/2026-09-27-placement-end-boundary.md).

## 27 september — verloop tijdens opdracht (#1522)

Echte paginarenders tonen voor zelfstandige en opdrachtgever een lege beoordelingsmelding
wanneer een geverifieerde VOG pas tijdens de opdracht verloopt. Twee regressies rood,
zes controles groen op main. Tekstcorrectie gebouwd; 12 rolrenders en 9.102 tests groen
(3 skips), lint/types/format en netwerkbuild geslaagd. Reviews en CI volgen. [Scope](docs/progress/2026-09-27-placement-expiry-copy.md).

## 24 september 2026 — gelijk opdrachtgever-certificaatvenster (#1520)

- Echte dashboard-/SQLite-proef verloor verplichte VOG-meldingen achter 200 inzetten
  zonder certificaateis; acties en badge vonden de melding wel.
- Dashboard en actieloader delen nu hun bestaande filter, volgorde en grens.
  Paginaregressie rood vóór de fix, groen erna; 36 gerichte tests groen.
- [Bewijs en scope](docs/progress/2026-09-24-client-compliance-window.md).
  9.090 tests groen (3 skips), lint/types/format en netwerkbuild groen.
  Onafhankelijke review, CI en release volgen afzonderlijk.

## 24 september 2026 — lopende bewijsopruiming (#1519)

- Twee echte SQLite-actieproeven tonen verlies van hetzelfde bewijs bij
  herindienen terwijl de oude opslagverwijdering al wacht.
- Afzonderlijke vervolgclaim op #1518: duurzame documentmarkering vóór externe
  verwijdering en transactionele uitsluiting bij hergebruik geïmplementeerd.
  78 gerichte tests en typecheck groen; volledige controles en review volgen.
- [Repro, scope en vereiste controles](docs/progress/2026-09-24-evidence-removal-claim.md).

## 24 september 2026 — opnieuw aangevraagde VOG-controle (#1518)

- Echte afwijs-/aanvraag-/opruimacties op tijdelijke SQLite reproduceren verlies
  van het nog benodigde bewijs na een tijdelijk mislukte opslagverwijdering.
- Bestaande bewijsreset ook bij opnieuw verificatie aanvragen toegepast. Vier
  SQLite-regressies en tien bestaande gerichte tests slagen; typecheck groen.
  Volledige controles, onafhankelijke review en releasepoorten volgen afzonderlijk.
- [Repro en scope](docs/progress/2026-09-24-vog-rerequest.md).

## 23 september 2026 — lokale platformmonospace (#1517)

- Bewezen Google Fonts-downloadfout vóór browser-CI: JetBrains Mono in rootlayout.
- Hetzelfde normale variabele lettertype (100–800) lokaal gebundeld met originele
  bron en licentie. Fontmetadata en Next-loaderuitvoer gecontroleerd.
- Na de eerste onafhankelijke review vervangen door de officiële Latin-WOFF2
  van 40.404 bytes, om een onnodig zware rootpreload te voorkomen.
- Arial-fallbackmetingen verschillen licht. Historische labfonts blijven extern.
  Geen algemene offlinebuildclaim.
- Volledige controles en onafhankelijke review volgen; [bron](src/app/fonts/README.md).

## 23 september 2026 — lopende upload na anonimisering (#1516)

- Echte upload- en erasure-acties reproduceren een document na afgeronde verwijdering.
- Conditionele eigenaarwrite, document en audit delen nu één transactie;
  een geweigerde write ruimt de eerder opgeslagen blob op. Na review dekt
  dezelfde bescherming ook nieuwe en vervangende certificaatuploads.
- 25 SQLite-regressies en 167 overige gerichte tests slagen. Volledige
  controle, onafhankelijke review en release afzonderlijk verifiëren.
- [Bron en grenzen](docs/progress/2026-09-23-late-upload-erasure.md).

## 17 september 2026 — gelijk certificaatvenster rond klokwissels (#1514)

- Dashboardgrens week op `f63bf822` één uur af van acties/badge: twee rode
  paginaproeven bij zomer-/wintertijd, één groene zomercontrole.
- Gedeelde bestaande duur van 720 uur voor dashboard, acties en badges.
  Paginaregressies bewaken beide klokwissels en zomer, in Amsterdam én UTC.
- [Repro en scope](docs/progress/2026-09-17-expiry-window-parity.md).
  Volledige controles, onafhankelijke review, CI en release afzonderlijk volgen.

## 17 september 2026 — actuele voorwaarden bij conceptprestaties (#1513)

- Vier echte tijdelijke SQLite-proeven bewaren ten onrechte een concept als een
  dispuut/status/eigenaar na de voorafcontrole verandert; bron `c67eefd8`.
- Conditionele parentwrite en concept-create delen nu één transactie. Acht echte
  databaseproeven bewaken huidige voorwaarden, bestaand adminrecht en rollback.
- [Repro en grenzen](docs/progress/2026-09-17-draft-performance-current-state.md).
  Volledige controles, onafhankelijke review, CI en release afzonderlijk verifiëren.

## 17 september 2026 — bijna-verloopmeldingen (#1512)

- Echte taak-/badgebronnen verliezen één waarschuwing achter vijftig vervangen
  certificaten; geïsoleerde SQLite-repro op `3d7bbe1c` rood vóór de fix.
- Gedeeld tenantfilter sluit dekking voorbij het venster vóór de limiet uit;
  vervangers binnen het venster blijven meetellen. Elf nieuwe databasegevallen.
- [Scope, bewijs en grenzen](docs/progress/2026-09-17-upcoming-roster-history.md).
  Volledige controle, onafhankelijke review en CI volgen.

## 17 september 2026 — verlopen dossiermeldingen (#1511)

- Repro: vijftig gedekte historische certificaten verdringen een werkelijk verlopen
  dossier; echte taak- en badgebronnen geven nul in plaats van één in geïsoleerd SQLite.
- Gedeeld tenantfilter verwijdert gedekte historie vóór de bestaande limiet; stabiele
  id-tiebreaker en dezelfde vervalgrens als het dossier. Elf nieuwe databaseproeven.
- [Scope en controles](docs/progress/2026-09-17-expired-roster-history.md); review/CI volgen.

## 2026-09-17 — factuurbediening volgt dispuut (#1508)

Vijf detailpaginarenders bevestigen knoppen die de server tijdens dispuut weigert.
De drie knoppredicaten volgen nu dezelfde dispuutstatus; normale bediening en
PDF-toegang blijven behouden. Vijftien renderproeven groen, 202 gerichte tests
groen met één lokale PostgreSQL-skip. [Bewijs en vierrollengrenzen](docs/progress/2026-09-17-disputed-invoice-controls.md).
Volledige controle, onafhankelijke reviews en CI volgen.

## 2026-09-17 — downloadproeven na bewijsverwijdering (#1507)

Acht nieuwe routeproeven bewaken 410 bij verwijderd ondertekenbewijs, geen
PDF-reconstructie en statusafscherming voor buitenstaanders. 117 gerichte
proeven groen; drie opzettelijke foutinjecties worden gedetecteerd. Geen
productlek of beleidswijziging. [Scope en grenzen](docs/progress/2026-09-17-erased-signing-downloads.md).
Volledige controle, onafhankelijke reviews en CI volgen.

## 2026-09-17 — dispuut bewaken bij de factuurwrite (#1506)

Drie echte databaseproeven bevestigen een losse factuurstatuswijziging nadat een
dispuut tussen lezen en schrijven opende. De bestaande transactionele writes
bewaken nu actuele dispuut-, partij- en legacyvoorwaarden. Geldige mutaties en
auditrollback blijven behouden. Vijftien gerichte databaseproeven groen na herstel;
[scope en beperkingen](docs/progress/2026-09-17-legacy-invoice-dispute-race.md).
Volledige controle, onafhankelijke reviews en CI volgen.

## 2026-09-17 — verificatieaanvraag zonder herklik/herladen (#1505)

Bestaande React-#329-backlog: de certificaatproef vraagt na hydratatie eenmaal
verificatie aan, wacht op In beoordeling en het verdwijnen van de aanvraagknop,
zonder hoofddocumentnavigatie. Geldige VOG/diploma- en verlopen-bewijsstukjourneys
blijven behouden. [Scope](docs/progress/2026-09-17-credential-submit-once.md).
Volledige lokale controle, browser-CI en onafhankelijke reviews volgen.

## 2026-09-16 — goedkeuringsproef zonder herklik/herladen (#1504)

Bestaande React-#329-backlog: de documentbeoordelingsproef klikt eenmaal op
Goedkeuren, wacht op het verdwijnen van de eigen kaart en bewaakt dat de andere
kaart zichtbaar blijft zonder documentnavigatie. Bewijsstuk-, checklist-, afwijzings-,
zegel- en retentiecontroles blijven staan. [Scope](docs/progress/2026-09-16-verification-single-submit.md).
Lokale controles, browser-CI en onafhankelijke reviews volgen.

## 2026-09-16 — oudere samenwerkingen blijven vindbaar voor beheer (#1503)

Persona-repro: één oude actieve inzet met wachtende prestatie verdween achter 500
nieuwere afgeronde rijen, terwijl beheertaak en badge bleven staan. Na native review
filtert en telt de database de volledige set; het scherm haalt maximaal 50 rijen en
alleen geaggregeerde kindtellingen op. Zoek-/DBA-/paginaproeven slagen op SQLite;
de PostgreSQL-integratieproef en volledige nieuwe review/CI volgen.
Zie [bewijs en scope](docs/progress/2026-09-16-admin-collaboration-window.md).

## 2026-09-15 — Eigen tijdslimiet voor databasevoorbereiding (#1501)

Echte main-CI faalde vóór vier retentieproeven: standaardhook 10s, terwijl de
schemavoorbereiding al begrensd was op 30s. Alleen de setuphook krijgt 40s;
productcode, individuele testlimieten en foutinjecties blijven behouden.
Zie [bron en bewijs](docs/progress/2026-09-15-retention-setup-budget.md); controles en review volgen.

## 2026-09-15 — Shortlist met één gewone handeling (#1500)

Bestaande React-#329-backlog: kandidatenproef wacht na één klik op de eigen
Shortlist-status en verbiedt documentnavigatie tijdens die stap. Het herklik-/reloadvangnet
vervalt alleen hier; overige ketenchecks blijven behouden. [Uitvoering](docs/progress/2026-09-15-shortlist-single-submit.md).

## 2026-09-15 — auditkopieën afgewezen bureau opruimen (#1499)

Bestaande privacybevinding met echte erasure-actie bevestigd: drie rood, zes groen.
Aanmeldingsvelden en afwijsreden verdwijnen atomair met de eigen REJECTED-Tenant;
status, adminherkomst en andere tenants blijven behouden. 227 gerichte tests groen.
Review/CI/release volgen. [Uitvoering](docs/progress/2026-09-15-rejected-tenant-audit-erasure.md).

## 2026-09-15 — Oudere bemiddelingsinzetten blijven zichtbaar (#1498)

Een actie kon verdwijnen achter honderd nieuwere afgeronde rijen in de bestemmingslijst.
De tenantqueue selecteert nu alle benodigde rijvelden vóór zoeken, tellen en urgentiesortering.
Twee echte databaseproeven rood → groen; andere/directe tenants blijven uitgesloten.
8.963 tests en types/lint/build/opmaak groen; onafhankelijke review/CI volgen. [Uitvoering](docs/progress/2026-09-15-franchise-collaboration-window.md).

## 2026-09-15 — Bevestigde verzending in de samenwerkingsproef (#1497)

De browserproef wacht na beide berichten op de bestaande serverbevestiging voordat
zij naar de andere deelnemer of de volgende stap gaat. De ongelezenbadge en volledige
samenwerkingsketen blijven verplicht. Bron: twee CI-fouten in run 34962603065; geen
aangetoond productdefect. 8.960 tests, types/lint/build/opmaak groen; review/CI volgen. Zie [uitvoering](docs/progress/2026-09-15-message-send-acknowledgement.md).

## 15 september 2026 — demo-QA na abonnementsbeveiliging (#1496)

#1495 is gemerged; aanvullende QA miste de expliciete demo-instelling voor betaalde demo-keuzes.
Configuratie hersteld en demo-uitleg expliciet getest; productieregels en bestaande tekst behouden.
Volledige QA op herstelbranch en onafhankelijke review volgen. [Bewijs](docs/progress/2026-09-15-launch-qa-demo.md).

## 15 september 2026 — efficiënte voorbereiding mailretentieproef (#1494)

Echte CI-time-out op 501 testgevallen bevestigd. Dezelfde bron-/auditparen worden
in bulk voorbereid; foutinjectie, 500/1-batchgrens en tijdslimiet blijven behouden.
Claim vóór implementatie; controles en onafhankelijke review volgen.
Zie [bron en scope](docs/progress/2026-09-15-retention-fixture-bulk-setup.md).

## 2026-09-15 — zelfstandigen eerst: eerlijke abonnementsbeschikbaarheid

Eigenaar vraagt snelle marktintroductie en vergelijking met Bendy. De server weigert
betaalde activatie zonder provider en onvolledige checkout; de demo doet nooit een
betaalcall. Niet-operationele dienstverlening wordt buiten de demo niet verkocht.
Demo-uitleg bij registratie en abonnement; gedeelde serverpolicy voor knop en actie.
Drie regressies vooraf rood; gerichte controle groen. Review en release volgen.
Zie [uitvoering](docs/progress/2026-09-15-zzp-launch.md). #1494 is live op `94dad586`.

## 15 september 2026 — wachten na eigen handtekening (#1493)

Detailaanwijzingen gebruiken nu de opgeslagen eigen handtekening; de andere partij houdt de tekenactie.
Zes regressies rood → groen, 131 gerichte tests geslaagd; certificaatblokkades houden voorrang. [Bewijs en scope](docs/progress/2026-09-15-signed-detail-guidance.md); review/CI volgen.

## 15 september 2026 — wachten op mobiel profielformulier (#1492)

De mobiele interactieproef telde soms nul velden vóórdat het formulier was geladen.
Een zichtbaarheidsexpectatie wacht nu vóór telling en meting; bestaande checks blijven behouden.
Echte CI-fout/retry bevestigd; lokale controle en onafhankelijke review volgen.
Zie [bron en scope](docs/progress/2026-09-15-mobile-form-test-readiness.md).

## 15 september 2026 — mail-intake en auditkopie samen opruimen (#1491)

Securityronde bevestigt dat een auditfout na verwijdering het afzenderadres blijvend
kon achterlaten. Eén transactie per begrensde batch bewaart verwijderen, redactie en
snoeiaudit samen. Echte SQLite-foutinjecties bewijzen rollback/herstart; een latere
batchfout tast afgeronde batches niet aan. NEW/recent blijven behouden. Review/CI volgen.
Zie [bevinding en bewijs](docs/progress/2026-09-15-mail-intake-retention-atomicity.md).

## 15 september 2026 — browserbewijs mail-intake (#1490)

Bestaande kernbacklog fase 3: webhook → reviewqueue → concept-opdracht. Nieuwe geïsoleerde
browserproef controleert autorisatie, dubbele aflevering, eigenaargrenzen, menselijke
acceptatie en behoud van conceptstatus. Alleen testcode en lokale fixtures; geen echte
mailintegratie. 1 browserproef zonder retries en 8.941 unittests (2 skips) groen; types/lint/
opmaak/env/build groen. Review/CI volgen. Oudere voortgang is ongewijzigd bewaard in
[het staartarchief](docs/progress/2026-09-15-progress-tail-archive.md).

## 14 september 2026 — certificaatgegevens behouden na gelijktijdige beoordeling (#1488)

Een save zonder nieuw bestand mag geen nieuwere beoordeling/gegevens overschrijven.
De fallback controleert actuele status, versie en eigenaar; verouderde saves geven een fout.
Vier regressies rood → groen; achttien certificaattests groen. Volledige controles en review
volgen; zie [uitvoering](docs/progress/2026-09-14-credential-metadata-race.md).

## 13 september 2026 — blijvende opvolging van prestatiebeoordeling (#1487)

Een lang wachtende SUBMITTED-prestatie verschijnt als beheertaak, ook zonder notificatie.
Actiecentrum, dashboard en samenwerkingsbadge delen één actuele, oudste-eerst-lijst.
Alleen ACTIVE zonder geschil; beoordeling haalt de taak uit de wachtrij. Grens: acht
volle dagen bij de standaardherinneringen. De bestaande snapshot-TTL blijft maximaal 60s.
8.933 tests slagen (2 bestaande skips), inclusief twaalf geïsoleerde SQLite-proeven.
Types, lint, opmaak en build groen; herbeoordeling en release volgen; zie [uitvoering](docs/progress/2026-09-13-performance-escalation.md).

## 13 september 2026 — intrekken overname-aanvraag (#1484)

Bestaande beveiligingsclaim hervat vanuit een nieuwe worktree op actuele main `3b2fde8`.
De aanvrager kan alleen op een actieve, niet-betwiste samenwerking intrekken; de write
controleert actuele status en ownership opnieuw. Audit en intrekking committen samen.
De 24 gerichte regressie-/oracleproeven en 8.918 totale tests slagen (2 bestaande skips).
Alle zes poorten en onafhankelijke reviews slaagden; #1484 is gemerged als `888734fc`
en op 13 september 15:26 UTC live geverifieerd, inclusief alle CI- en QA-controles.
Zie [uitvoering](docs/progress/2026-09-12-handoff-cancel.md).

Oudere notities: [2026-09-29-progress-archive.md](docs/progress/2026-09-29-progress-archive.md).
