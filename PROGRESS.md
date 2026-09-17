## 17 september 2026 — claim gelijk certificaatvenster rond klokwissels

- Bouwronde 16:22 UTC: dashboard gebruikt kalenderdagen, acties/badge 720 uur.
- Echte paginacall met gecontroleerde klok in Europe/Amsterdam: twee rode
  grensproeven (voorjaar/najaar), één groene zomercontrole op `f63bf822`.
- Scope: gedeelde vensterduur, dashboard/acties/badge en gerichte regressies;
  geen status-, tenant-, retentie- of ontwerpwijziging. Implementatie volgt na claim.

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

## 13 september 2026 — begeleid ondertekenen en bewijsstukbeoordeling (#1486)

Nieuwe eigenaaropdracht: twee partijen tekenen dezelfde vastgelegde overeenkomst met
naam, expliciete bevestigingen en extra wachtwoordcontrole. De eerste handtekening
bevriest tekst/PDF; de tweede activeert de samenwerking. Eigen taken en badges wachten
daarna op de andere partij. Gewone elektronische handtekening, geen gekwalificeerde claim.
Bewijsdownload bevat originele tekstgegevens als bijlagen. Admincontrole gebruikt passende
methoden/checklists en werkelijke bronregistratie; VOG-bewaring blijft beperkt. Bij
accountverwijdering vraagt gezamenlijk bewijs een expliciete beoordeelde beslissing.

Volledige suite na herstel: 8.901 geslaagde tests en twee bestaande skips. De eerste
onafhankelijke review vond de oude seed-aanroep; demo-opbouw gebruikt nu beide echte
ondertekenstappen en bewijst actieve samenwerkingen, uren en betaalde facturen. De eerste
CI bevestigde documentbeoordeling; de mobiele ondertekentest controleert nu de werkelijke
loginredirect zonder die te volgen. Typecheck/lint/opmaak en PDF-rendercontrole groen.
Op `339223f4` slaagt de volledige CI, inclusief vier mobiele licht/donkerproeven.
De native review vraagt een laadstatus; die is toegevoegd na de toegangscontrole,
met zestien extra tests en behoud van echte 404-antwoorden. De volgende native review
vond een risico op achteraf opgebouwd bewijs bij oude actieve/getekende contracten.
Die blijven nu alleen-lezen zonder nieuw origineel; negentien regressieproeven bewaken
servertransacties, downloads en de pagina. Alle zes poorten en de onafhankelijke reviews
slaagden op `f4f60e73`. #1486 is gemerged als `3b2fde8`; de exacte Railway-release,
migratie, health en readiness zijn op 13 september 13:42 UTC live geverifieerd.
Ook alle CI- en QA-controles op de samengevoegde commit zijn groen.
Zie [uitvoering](docs/progress/2026-09-12-signing-verification.md).

# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## 2026-09-12 — consequente interacties voor muis, aanraking en toetsenbord

Op eigenaarverzoek gedeelde drukfeedback voor echte interactieve onderdelen,
annulering bij scrollen, ruimere mobiele klikvlakken en zichtbare focus in lijsten.
Hover werkt alleen op geschikte pointers; statuszegels en statische kaarten blijven intact.
Lint, types, build en 8.755 tests slagen (2 bestaande skips); browser/releasecontrole #1485 volgt.
Zie [uitvoering](docs/progress/2026-09-12-interactions.md).

## 2026-09-12 — ingelogd platform krijgt de Handslag V5-identiteit

Op herhaald eigenaarverzoek wordt de bestaande platformvormgeving van #1474
geïntegreerd met actuele main112e23c in #1483. Blauw/wit/oranje, originele handen,
Open Sans, lagen/schaduwen en responsieve navigatie vormen één geheel met de landing.
Zwart markeert wachten op goedkeuring; oranje volgt de effectieve goedgekeurde status.
De verlopen review van #1474 blijft als bewijs bewaard; deze integratie krijgt nieuwe
controles en onafhankelijke review. Ook installatie-iconen en offlinepagina zijn vernieuwd.
Lokale volledige check: 8.755 tests groen (2 bestaande skips), lint/types/build/opmaak
groen; 21 browserproeven zonder retries geslaagd. Alle zes releasepoorten groen;
#1483 gemerged als `535df3f`, live geverifieerd om 14:37 UTC met drie browserproeven.
Zie [uitvoering](docs/progress/2026-09-12-platform-brand.md).

## 2026-09-12 — modelovereenkomst: tekenen met actuele status en atomair auditspoor

PR #1482: directe proeven met een eigen synthetische SQLite-database bevestigen
handtekeningen op beëindigde/betwiste samenwerkingen, overschrijven bij herhaling
en ontbreken van rollback bij auditfouten. Een conditionele write accepteert nu
uitsluitend een nieuwe eigen handtekening op PROPOSED/ACTIVE zonder geschil.
Handtekening en audit committen samen; bestaande akkoorden blijven behouden.
De 26 gerichte en 8.713 totale tests slagen (2 bestaande skips); lint, types,
opmaak en productiebuild zijn groen. Na alle zes poorten is #1482 gemerged als
`112e23c` en op 12 september 13:29 UTC live geverifieerd.
Zie [bewijs en afbakening](docs/progress/2026-09-12-agreement-signing.md).

## 2026-09-12 — deploybewaking: ontbrekend incidentlabel

De succesvolle labelzoekopdracht van GitHub CLI geeft lege stdout als `deploy-lag`
ontbreekt. De bewaking behandelt uitsluitend deze uitvoer nu als geen label;
CLI-fouten, corrupte JSON en lege incident-JSON blijven blokkeren. Twee regressies
rood → groen; 29 gerichte bewakingstests en 8.690 totale tests geslaagd (2 bestaande
skips), lint/types/opmaak en productiebuild geslaagd. Alle zes poorten zijn geslaagd;
#1481 is gemerged als `79c98a7` en live geverifieerd. De geplande bewaking van
12 september 09:18 UTC (run 34685491207) slaagt inclusief incidentafhandeling.
Bron en bewijs: [voortgang](docs/progress/2026-09-12-monitor-label-json.md).

## 2026-09-11 — herstel goedgekeurde lichte V5-landing

Op verzoek van de eigenaar blijft de publieke landing wit/blauw/oranje, ook bij een
opgeslagen donker thema of donkere iPhone-instelling. Het palet en de browserkleur zijn
pagina-gebonden; de opgeslagen appkeuze blijft intact. De globale installatiekaart krijgt
bijpassende leesbare tekstkleuren. Na navigatie vervallen de landing-overrides.

Validatie: volledige lokale check (lint, types, 8.658 tests geslaagd, 2 bestaande skips,
productiebuild); zeven productie-browserreizen geslaagd zonder retries, inclusief donkere
systeemvoorkeur, opgeslagen keuze, iPhone-installatiekaart en navigatie naar inloggen.
Onafhankelijke productreview uitgevoerd; verplichte GitHub-poorten en live-uitrol volgen.

## 2026-09-10 — kern/cascade: factuur-goedkeuring-reminders (dag 3/7 + admin-escalatie)

**Wat:** sluit de énige un-genudgede opdrachtgever-poort in de facturatie-cascade. Na indienen van een
concept-factuur (Event C) krijgt die een factuurnummer en gaat de vordering naar de opdrachtgever ter
goedkeuring (SUBMITTED → APPROVED). Anders dan de prestatie-goedkeuring (die dag-3/7-herinneringen +
admin-escalatie had via `performance-approval-reminders`) bleef een SUBMITTED cascade-factuur zónder
enige nudge: geen goedkeuring → geen betaal-registratie → cascade stalt na indiening. CURRENT_TASK
punt 6(b).

**Aanpak (spiegel van `performance-approval-reminders`):** pure planner
`planInvoiceApprovalReminders` (`src/lib/invoice-approval-reminders.ts`) plant per SUBMITTED-factuur op
een niet-geannuleerde, niet-betwiste samenwerking een herinnering naar de opdrachtgever
(`counterpartyUserId`) op `REMINDERS.invoiceApprovalDays` (=[3,7]) en escaleert ná de laatste dag naar
de admins. Anker = `Invoice.issuedAt` (gezet bij de SUBMITTED-overgang). Runner
`runInvoiceApprovalReminderTask` (`-task.ts`) fetcht SUBMITTED-facturen (oudste eerst, cap 500),
dedupliceert op `DomainEvent.dedupeKey` (idempotent) en schrijft per verse actie domainEvent +
notification + auditLog in één transactie. Geen geldstroom. Losstaande factuur zonder samenwerking →
`collabStatus` valt terug op ACTIVE (nooit geannuleerd/betwist).

**Bestanden:** `src/lib/invoice-approval-reminders.ts` (+`.test.ts`, 10), `src/lib/invoice-approval-reminders-task.ts`
(+`.test.ts`, 7), `src/lib/config.ts` (`invoiceApprovalDays`), `src/lib/notifications.ts`
(+`.test.ts`: `INVOICE_APPROVAL_REMINDER`/`INVOICE_APPROVAL_ESCALATION` → invoice/attention),
`src/lib/audit-labels.ts` (2 labels), `src/app/api/tasks/run-all/route.ts` (taak geregistreerd na
performance-approval-reminders). **Checks:** unit (39 in de vier direct betrokken suites ✓) · typecheck
· lint · build · prettier · CI-poort verifiëren (PR #1473).

## 2026-09-10 — persona-sweep run 10 (DOEL 1b, FRANCHISER): `/franchise/zzpers`-badge telt dormant-bench re-engagement mee

**Wat:** kritische-gebruiker-sweep voor alle 4 rollen (live prod-build + seed) + drie parallelle
adversariële Opus-audits (next-action/badge · IDOR/authz/cross-tenant/document-privacy · geld/invoer/
robuustheid). DOEL 2 schoon (0 bereikbare gaten op beide adversariële oppervlakken). **1 DOEL 1b-defect
gefixt:** de `/franchise/zzpers`-nav-badge onder-telde de `franchiseRosterReengagementTask` die /acties
(+ dashboard-rail) wél toont — de badge-roster-query laadde het ACTIVE-samenwerking-`_count` niet, dus
`classifyRosterDormancy` kon de dormant-tier nooit bepalen en de teken-taak viel uit de badge (signaal op
één oppervlak; asymmetrisch met de klant-spiegel `attentionClients`).

**Aanpak:** badge-roster-query laadt nu hetzelfde ACTIVE-`_count` als de /acties-bron; `rosterAlerts`
telt een `dormantReengagement`-term mee, exact de emitter-volgorde spiegelend (INACTIEF `continue`t vóór
de dormancy-check → geen dubbeltelling). Geen nieuwe logica: hergebruik van `classifyRosterDormancy`.

**Bestanden:** `src/lib/signals.ts`, `src/lib/signals.roster-reengagement-badge.test.ts` (+2, rood→groen),
`src/lib/signals.badge-gaps-run52.test.ts` (fixtures `_count`), `docs/PERSONA-SWEEP-BACKLOG.md`.
**Checks:** typecheck ✓ · lint ✓ · unit 8568 (8566✓/2 skip) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR volgt).

## 2026-09-10 — robuustheid: ORT-render-guard op de beoordeel-drawer + werkproces-uitsplitsing (laatste 2 oppervlakken)

**Wat:** sluit de crash-klasse-serie #1465/#1466 af. Die hardden de overzicht-mappers (`/diensten` +
`/prestaties`) en de lees-oppervlakken factuurdetail + urenstaat-PDF tegen een JSON-geldig maar
**semantisch** corrupt ORT-segment (onbekende categorie, negatieve/niet-eindige uren). Twee laatste
render-oppervlakken haalden de OPGESLAGEN/geparsede segmenten echter nog **rechtstreeks** door
`computeOrt` — buiten enige try/catch — om de optionele ORT-uitsplitsing te tonen: de **beoordeel-drawer**
in het Actiecentrum (`src/components/actions/review-bodies.tsx` `OrtBreakdown` — de opdrachtgever die
"keur uren goed" bekijkt) en de **werkproces-uitsplitsing** (`src/components/collaborations/ort-breakdown.tsx`
`OrtBreakdown` — de ZZP'er op de samenwerkingspagina). Eén corrupte rij zou daar de héle drawer resp.
werkproces-pagina laten crashen i.p.v. de uitsplitsing over te slaan.

**Aanpak (hergebruik, geen nieuwe rekenlogica):** beide componenten roepen nu de bestaande throw-veilige
wrapper `safeComputeOrt` (`src/lib/ort-breakdown.ts`, #1466) aan i.p.v. `computeOrt`; bij `null` (corrupt
segment) valt de `result.lines.length === 0`-tak al terug op "render niets" → de urenregels en bevroren
bedragen tonen gewoon los. Read-path-only guard; schrijf-/cascade-paden blijven fail-closed. Alleen
bereikbaar via directe DB-corruptie (elke schrijver grid-checkt via `assertPerformanceWithinLimits`) —
defense-in-depth, spiegelt exact #1465/#1466.

**Bestanden:** `src/components/actions/review-bodies.tsx`, `src/components/collaborations/ort-breakdown.tsx`,
`src/lib/ort-breakdown.test.ts` (+2 cases op de exacte segment-vormen van de twee nieuwe call-sites; 24
tests in de suite). **Checks:** typecheck ✓ · lint ✓ · unit (ort-breakdown 24/24) ✓ · prettier ✓ ·
build + volledige suite + CI-poort verifiëren (PR volgt).

## 2026-09-10 — prod/security: gedeelde constant-time secret-vergelijking (dicht length-leak)

**Wat:** het patroon `Buffer.from(...)` + lengte-voorcheck + `timingSafeEqual` zat **6× gedupliceerd**
verspreid over `cron-auth.ts`, `mail-intake.ts`, `billing/stripe-signature.ts`, `two-factor/totp.ts`,
`share-token.ts` en `calendar/feed-token.ts` — telkens met een subtiel andere lengte-guard. Twee ervan
(`authorizeCron` en het mail-intake-Bearer/Basic-secret) vergelijken door de **operator gekozen**, dus
**niet-publieke**, geheimen; hun `a.length !== b.length → early return` lekte de byte-lengte van dat
geheim via de responstijd (een klassieke length-oracle). De vier andere vergelijken vaste-lengte-tokens
(publiek-bekende lengte) waar het geen echt lek was, maar wel dezelfde herhaalde crypto-plumbing.

**Aanpak:** één audited primitive `constantTimeEqual(a, b)` (`src/lib/security/constant-time-equal.ts`)
— HMAC-SHA256 bij beide invoeren met een **willekeurige per-aanroep-sleutel** naar een digest van vaste
lengte (32 bytes), dan `timingSafeEqual` op de digests. Constant-time in inhoud **én** lengte (geen
vroege return; digests zijn altijd 32 bytes → geen length-oracle), de random sleutel maakt de digest
onbruikbaar als offline oracle, en valse gelijkheid faken vereist een HMAC-SHA256-botsing. Uitkomst is
byte-identiek aan `a === b`. Alle 6 call-sites gerefactord naar de primitive; hun domein-voorchecks
(Bearer/Basic-parsing, base32-decode, TOTP-cijfer-regex, `typeof`-guard) blijven ongemoeid. Extra:
`authorizeCron` krijgt een expliciete `if (!secret) return false` (voorheen konden twee lege buffers
`true` geven — onbereikbaar want elke route guardt al met 503, nu ook standalone veilig).

**Bestanden:** `src/lib/security/constant-time-equal.ts` (+`.test.ts`, 6 tests), `src/lib/cron-auth.ts`
(+`cron-auth.test.ts`, 7 tests — dichtte tevens de ontbrekende test op deze security-kritieke guard die
álle cron/taak/back-up-endpoints beschermt), `src/lib/mail-intake.ts`, `src/lib/billing/stripe-signature.ts`,
`src/lib/two-factor/totp.ts`, `src/lib/share-token.ts`, `src/lib/calendar/feed-token.ts`. Gedrag
behouden (equal→true, unequal→false); geen route-/API-wijziging. **Checks:** typecheck ✓ · lint ✓ ·
unit (constant-time/cron/stripe/totp/share/mail/feed-suites groen) ✓ · prettier ✓ · build + CI-poort
verifiëren (PR #1469).

Oudere voortgang staat ongewijzigd in
[het contextarchief](docs/progress/2026-09-17-context-archive.md).
