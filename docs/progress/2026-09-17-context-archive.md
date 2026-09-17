# Bestaande context bewaard op 17 september 2026

## Uit CURRENT_TASK

Eigenaaropdracht 15 september: #1495/#1496 gemerged en live op `ad63fb2a` (12:02 UTC).
Persona #1498 gemerged en live op `d0756137` (14:46 UTC); vijf releaseworkflows en health/readiness groen.
Routine 20:22 UTC: #1501 begrenst databasevoorbereiding afzonderlijk; [bewijs](docs/progress/2026-09-15-retention-setup-budget.md).

Security 15 september 02:00 UTC: #1491 maakt mail-intakeverwijdering en auditredactie atomair.
Twee echte databaseproeven rood → groen; rollback/herstart en batchgrenzen getest. Review/CI volgen.

Routine 14 september 00:22 UTC: #1488 bewaakt certificaatgegevens zonder nieuw bestand
tegen een gelijktijdige beoordeling of wijziging. Gemerged en live op `ac5c33a0`
(14 september 21:10 UTC), alle controles en onafhankelijke reviews groen. Zie [uitvoering](docs/progress/2026-09-14-credential-metadata-race.md).

Routine 13 september 16:22 UTC: #1487 is gemerged en live geverifieerd op `14be83b6`
om 20:14 UTC. Zie [uitvoering](docs/progress/2026-09-13-performance-escalation.md).
Security-PR #1484 is gemerged en live geverifieerd op `888734fc` om 15:26 UTC.

Het eigenaarverzoek voor elektronisch ondertekenen en bewijsstukbeoordeling is met
#1486 gemerged en live geverifieerd op `3b2fde8` (13 september 13:42 UTC).
Zie [ondertekenen](docs/progress/2026-09-12-signing-verification.md).
De onderstaande interactieopdracht is met #1485 live op `7fd8b1f` (17:27 UTC).

Huidige eigenaaropdracht 12 september: consequente hover- en aanraakfeedback voor
klikbare kaarten, rijen, navigatie en tabs. Scrollen annuleert de drukstand;
toetsenbordfocus, rustige beweging en mobiele klikvlakken blijven zichtbaar.
Zie [interacties](docs/progress/2026-09-12-interactions.md).
De V5-platformidentiteit is met #1483 gemerged als `535df3f` en live geverifieerd
op 12 september 14:37 UTC, inclusief drie browserproeven op de echte site.
De eerdere #1474 blijft gesloten als vervangen; verlopen reviewbewijs wordt niet hergebruikt.

Eerdere V5-/monitor-/ondertekenreleasecontext staat ongewijzigd in
[het archief](docs/progress/2026-09-15-release-context-archive.md).

## Uit PROGRESS

## 2026-09-10 — Security/privacy-audit ronde 7 (basis `main` @ 7126491b): clean

3 parallelle adversariële Opus-audits (injectie/export · IDOR/cross-tenant · privacy/AVG) + orchestrator-sweep

- gerichte auth/session/dep-probes → **0 nieuwe exploiteerbare security-gaten, 0 nieuwe privacy-defecten**.
  `npm audit --omit=dev` = 0 vulns (dev-only ketens via Dependabot #1453). Volledige OWASP/AVG-dekking met
  file:line-bewijs in `docs/SECURITY-PRIVACY-BACKLOG.md` (ronde 7e). Het geparkeerde `/zzp/[id]`-item blijft
  een eigenaar-/FG-productafweging (MENSENWERK §5). Geen code-wijziging — docs-only PR.

## 2026-09-10 — UX: rol-bewust tegenpartij-filter op de facturenlijst (opdrachtgever/ZZP'er)

**Wat:** de facturenlijst (`/facturen`, ook de Administratie-hub-tab) filterde alleen op status.
Toegevoegd: een rol-bewust filter op **tegenpartij** — de ZZP'er filtert op opdrachtgever, de
opdrachtgever op ZZP'er — zodat "alles wat ik factureerde aan/van partij X" (betaald + openstaand,
elk concept) in één klik zichtbaar is. Stripe-/Malt-pariteit; de meest gevraagde navigatie-affordance
op een factuurregister die nog ontbrak. Geen extra query: partij-id/naam zaten al in de reeds geladen
lijst (alleen `freelancer.id` aan de `select` toegevoegd).

**Aanpak (hergebruik, pure kern):** nieuwe pure module `src/lib/invoice-party-filter.ts` naar het
model van `invoice-filter.ts` — `invoiceParty` (rol-bewuste tegenpartij), `filterInvoicesByParty`,
`summarizeInvoiceParties` (distinct + tellingen, nl-gesorteerd), `parsePartyFilter` (anti-oracle:
onbekend id → "alles"). De partij-scope wordt **vóór** het statusfilter toegepast, zodat de
status-pill-tellingen eerlijk hertellen binnen de gekozen partij (en identiek blijven zodra geen
partij is gekozen). De KPI-kaarten en het debiteuren-overzicht blijven bewust portefeuille-breed —
net als het statusfilter raken ze de saldi niet. Beide filters zijn orthogonaal: elk behoudt de
selectie van het ander in de URL (server bouwt de hrefs via `withParams`). Nieuw client-component
`invoice-party-select.tsx` is een domme navigator (controlled native `<select>`, `router.push` op de
server-gebouwde href; URL = bron van waarheid). Het partij-filter verschijnt pas vanaf 2 distinct
partijen. Geen dictionary-wijziging: nieuwe labels lopen door `t()` als NL-brontekst.

**Bestanden:** `src/lib/invoice-party-filter.ts` (+`.test.ts`, 12 tests), `src/components/administratie/
invoice-party-select.tsx`, `src/components/administratie/facturen-panel.tsx` (wiring + `freelancer.id`
in de query + partij-behoud in de status-pills). **Checks:** typecheck ✓ · lint ✓ · unit (8549 passed,
2 skipped) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR #1467).

## 2026-09-09 — robuustheid: ORT-render-guard op factuurdetail + urenstaat-PDF (corrupte segment-rij 500't die niet meer)

**Wat:** vervolg op #1465. Die hardde de overzicht-mappers `/diensten` + `/prestaties` tegen een
JSON-geldig maar **semantisch** corrupt ORT-segment (onbekende categorie, negatieve uren) via de gedeelde
per-rij-bron `computePerformanceOrt`. Twee andere render-oppervlakken halen de opgeslagen `ortSegments`
echter óók **rechtstreeks** door `computeOrt` — buiten enige try/catch — om de optionele
ORT-uitsplitsing te tonen: het **factuurdetail** (`src/app/(protected)/facturen/[id]/page.tsx:491`, door
beide rollen bekeken) en de **urenstaat-PDF** (`src/lib/performance-pdf.ts:102`, download door beide
rollen). Eén corrupte rij zou daar de héle pagina/PDF 500'en i.p.v. de uitsplitsing over te slaan —
exact de crash-klasse die #1465 op de eerste twee oppervlakken al dichtte, achtergebleven op deze twee.

**Aanpak (hergebruik, geen nieuwe rekenlogica):** nieuwe throw-veilige wrapper `safeComputeOrt`
(`src/lib/ort-breakdown.ts`) — `try { computeOrt(...) } catch { return null }`. Factuurdetail: bij `null`
`return null` (de optionele ORT-uitsplitsing wordt overgeslagen; het bevroren factuurbedrag rendert al los
erboven als uren × tarief = bedrag). PDF: bij `null` valt de generatie terug op de bestaande losse
"uren × tarief"-regel (else-tak). De schrijf-/cascade-paden roepen `computeOrt`/`ortSubtotalCents` bewust
rechtstreeks aan en blijven **fail-closed** (weigeren corrupte invoer bij persistentie) — de guard is
uitsluitend read-path. Bereikbaar alleen via directe DB-corruptie (elke schrijver grid-checkt via
`assertPerformanceWithinLimits`), dus defense-in-depth (LOW).

**Bestanden:** `src/lib/ort-breakdown.ts` (+`safeComputeOrt`), `src/app/(protected)/facturen/[id]/page.tsx`,
`src/lib/performance-pdf.ts`, `src/lib/ort-breakdown.test.ts` (+4 tests: geldig = canoniek/geen drift,
onbekende categorie → null, negatieve uren → null, niet-integer tarief → null). **Checks:** typecheck ✓ ·
lint ✓ · unit (8537 passed, 2 skipped) ✓ · build · prettier ✓ · CI-poort verifiëren (PR #1466).

## 2026-09-09 — robuustheid: per-rij ORT-guard op /diensten + /prestaties (corrupte segment-rij 500't de pagina niet meer)

**Wat:** de overzicht-mappers `getDienstenForFreelancer` (`src/lib/diensten.ts`, ZZP'er-`/diensten`) en
`toPrestatieOverzicht` (`src/lib/prestaties.ts`, opdrachtgever-`/prestaties`) — plus hun CSV-exports —
riepen `ortSubtotalCents`/`summarizeOrtBreakdown` (→ `computeOrt`) aan **buiten** enige try/catch.
`parseOrtSegments` vangt alléén een JSON-syntaxfout af; een JSON-geldig maar **semantisch** corrupt
segment (onbekende categorie, negatieve uren) passeert de parse en laat `computeOrt` alsnog throwen
(`ort.ts` weigert dat terecht — de geldmotor mag nooit stil een NaN/negatief bedrag doorlaten). Omdat de
mappers over **álle** prestatie-rijen van een gebruiker draaien, zou één zulke rij de héle pagina + CSV
500'en i.p.v. per rij te degraderen — precies wat de belendende comment ("één corrupte rij mag niet de
héle pagina laten crashen", #1443) al beloofde, maar alleen voor de parse-stap waarmaakte. Bereikbaar
alleen via directe DB-corruptie (elke schrijver grid-checkt via `assertPerformanceWithinLimits`), dus
defense-in-depth (LOW), geparkeerd in de persona-sweep-backlog run 9.

**Aanpak (hergebruik, geen duplicatie):** nieuwe gedeelde pure bron `computePerformanceOrt`
(`src/lib/ort-breakdown.ts`) leidt subtotaal + ORT-uitsplitsing + `hasOrt` van één rij af en vangt de
ORT-motor-throw per rij op → degradeert naar de basis (uren × tarief), gemarkeerd als geen-ORT. Beide
mappers gebruiken nu die ene bron (de identieke reken-blokken zijn ontdubbeld → kan structureel niet
meer driften tussen de ZZP'er- en opdrachtgever-view). Schrijf-/cascade-paden
(`cascade/handlers.ts`, `performance-commands.ts`, `performance-invoice-preview.ts`) roepen
`computeOrt`/`ortSubtotalCents` bewust rechtstreeks aan en blijven **fail-closed** (weigeren corrupte
invoer bij persistentie) — de guard is uitsluitend read-path.

**Bestanden:** `src/lib/ort-breakdown.ts` (+`computePerformanceOrt`), `src/lib/diensten.ts`,
`src/lib/prestaties.ts`, `src/lib/ort-breakdown.test.ts` (+7 tests: geldig=canoniek/geen drift,
corrupte categorie/negatieve uren → degradatie, corrupt zonder terugval-uren → null/leeg, geen-segmenten,
milestone, geen-tarief). **Checks:** typecheck ✓ · lint · unit · build · prettier ✓ · CI-poort verifiëren (PR #1465).

Oudere security-voortgang staat ongewijzigd in [het bouwstaartarchief](docs/progress/2026-09-15-build-history-tail.md).

Oudere persona-voortgang staat ongewijzigd in [het staartarchief](docs/progress/2026-09-15-persona-history-tail.md).
