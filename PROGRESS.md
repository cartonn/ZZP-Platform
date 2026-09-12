# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie: wat is af, welke bestanden, welke tests, volgende stap. **Dit bestand blijft ≤ 400 regels; oudere entries verhuizen maandelijks naar `docs/progress/<jaar-maand>.md`** — archief: [sep](docs/progress/2026-09.md) · [aug](docs/progress/2026-08.md) · [jul](docs/progress/2026-07.md) · [jun](docs/progress/2026-06.md).

## 2026-09-12 — consequente interacties voor muis, aanraking en toetsenbord

Op eigenaarverzoek gedeelde drukfeedback voor echte interactieve onderdelen,
annulering bij scrollen, ruimere mobiele klikvlakken en zichtbare focus in lijsten.
Hover werkt alleen op geschikte pointers; statuszegels en statische kaarten blijven intact.
Lint, types en 8.755 tests slagen (2 bestaande skips); browser- en releasecontrole volgen.
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

## 2026-09-09 — prod: Dependabot supply-chain-automatisering (npm + github-actions)

**Wat:** `.github/dependabot.yml` toegevoegd — de code-kant van het MENSENWERK "Dependency graph +
Dependabot"-item. De `audit`-CI-poort (`scripts/audit-production.mjs`) **detecteert** high/critical-
advisories in de productie-deps en blokkeert de merge, maar niets **herstelde** ze automatisch: een
bump gebeurde pas als een mens/agent het opmerkte (zie #1444, #01c05fc7). Dependabot sluit dat gat en
opent zelf de herstel-/versie-PR's, zodat het venster tussen een bekend CVE en de fix minimaal is en de
ge-pinde GitHub Actions-versies actueel blijven.

**Config:** twee ecosystemen — `npm` (root; **gegroepeerd** in productie- én dev-buckets voor
minor/patch, majors bewust als losse PR's) en `github-actions` (root; alle actions gegroepeerd). Wekelijks
(maandag 06:00 Europe/Amsterdam), begrensde PR-flux (10 resp. 5) zodat de reviewqueue/CI-poort niet
dichtslibt, `chore`-commit-prefix met scope, label `dependencies`. Elke Dependabot-PR loopt door dezelfde
6 vereiste statuschecks (check/e2e/audit/secret-scan/CodeQL/agent-review) — nooit een automatische merge
zonder groene poort. Security-updates komen out-of-band binnen zodra de repo-web-toggle voor Dependency
graph en Dependabot security updates aanstaat (enige resterende menselijke stap).

**Drift-bewaking:** `scripts/dependabot-config.test.ts` (7 tests) — Dependabot draait niet in CI, dus
zonder deze test kan de config stil verweken (verdwenen ecosysteem/groepering) zonder dat een poort dat
opmerkt. Assert: versie 2, npm + github-actions aanwezig, wekelijks + Europe/Amsterdam, begrensde PR-flux,
npm-productie/dev-groepen, actions-groepering, root-directory.

**Checks:** typecheck ✓ · lint ✓ · unit ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR #1453).

## 2026-09-09 — security/privacy auditronde 6: TOCTOU statusovergang-bypass op support-tickets gedicht (CLAUDE.md regel 3)

**Wat:** security-/privacy-auditronde (orchestrator Opus 4.8 + 3 parallelle adversariële Opus-audits op
niet-overlappende oppervlakken: A authz/IDOR/cross-tenant over álle API-routes + auth-keten + cron/webhooks ·
B server-action-mutaties + guardlagen · C privacy/AVG + injectie). Basis `main` @ 12d5b36c. **Eén MIDDEL
gedicht, één HOOG privacy-item heropend voor eigenaar/FG-besluit**, rest clean met file:line-bewijs.

De gebruiker-zijde support-acties `replyToTicket`/`markResolved` (`src/app/(protected)/support/actions.ts`)
toetsten hun statusovergang tegen een vóór-transactionele snapshot en schreven daarna met een **kale**
`prisma.supportTicket.update({ where: { id } })` — zónder de compound-guard `where: { id, status: from }` die
élk ander statuswijzigend oppervlak in de repo gebruikt. Daardoor kon een race (aanvrager reageert terwijl een
ADMIN het ticket afrondt) de live status blind overschrijven en een overgang forceren die
`SUPPORT_TICKET_TRANSITIONS` verbiedt (bv. `RESOLVED→ESCALATED`): de transitie-map-invariant omzeild via timing,
het admin-besluit stil teruggedraaid. **Fix:** beide acties gebruiken nu `updateMany` mét de statusguard (flip
telt alleen zolang de status écht nog `from` is; verliest de race → count 0, geen write, geen fantoom-audit) en de
audit draagt de `{from,to}`-overgang. Spiegelt `admin/support/actions.ts` exact. **Bestanden:**
`src/app/(protected)/support/actions.ts` + `src/app/(protected)/support/toctou-transition.test.ts` (4 tests,
rood→groen bewezen: 3 falen op de oude kale `update`, alle groen met de guard).

**Heropend (geen code-wijziging — eigenaar/FG-besluit):** publiek `/zzp/[id]` toont individueel herleidbare
reviews (naam + rating + verbatim comment) zonder k-anonimiteitsvloer (HOOG, AVG art. 5(1)(f)/25). Al eerder
geparkeerd; audit C bevestigde dat het live blijft. Product-/juridische afweging (MENSENWERK §5), buiten
agent-scope — besluit vereist vóór go-live met echte documenten. Zie `docs/SECURITY-PRIVACY-BACKLOG.md` ronde 6.

**Checks:** typecheck ✓ · lint ✓ · unit (8519 passed, 2 skipped) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR volgt).

## 2026-09-09 — persona-sweep run 9: CLIENT signable-PROPOSED-badge ordende anders dan /acties (outer-window-drift, DOEL 1b)

**Wat:** kritische-gebruiker-sweep over de vier rollen (orchestrator Opus 4.8 + 3 parallelle adversariële
Opus-audits: next-action/badge · IDOR/authz/cross-tenant · malicieuze invoer/geld/robuustheid). DOEL 2
schoon (0 bereikbare authz/IDOR/tenant-gaten; 0 nieuwe invoer/geld-gaten — de delta #1440–#1449 dichtte de
geld/parse-vein). Eén DOEL-1b-defect gefixt, één LOW-robustness-item geparkeerd (zie
`docs/PERSONA-SWEEP-BACKLOG.md` run 9).

De CLIENT /samenwerkingen-nav-badge telt de onderteken-bare PROPOSED-samenwerkingen via
`countClientSignableProposals` (`signals.ts`). Die query ordende `updatedAt desc`, terwijl de list-bron
`proposedCollabs` (`pending-tasks.ts:1149`) in run 81 bewust naar `createdAt asc` is omgezet:
`Collaboration.updatedAt` staat voor een PROPOSED-rij effectief bevroren op het aanmaakmoment, dus
`updatedAt desc` capte de NIEUWSTE voorstellen en liet de OUDSTE — de langst-wachtende hires die om
ondertekening vragen — buiten het (op `CASCADE_SCAN_LIMIT`=50) gecapte venster vallen. Met de list op de
oudste 50 en de badge op de nieuwste 50 divergeren de subsets bij >50 gelijktijdige PROPOSED-samenwerkingen
voor één opdrachtgever → de badge undercountte precies de gestrande, oudste teken-taken die /acties toont.
Exact de outer-window-blindheid die de list-kant al dichtte, achtergebleven in de badge; de badge-doc-comment
claimde bovendien ten onrechte pariteit ("op dezelfde rijen redeneren").

**Aanpak (hergebruik, geen duplicatie):** de badge-query ordent nu identiek `createdAt asc` als de
list-bron → beide oppervlakken redeneren op dezelfde (oudste-eerst) rijen; kan structureel niet meer
driften. **Bestanden:** `src/lib/signals.ts` (+ doc-comment die de gedeelde ordening + de run-81-reden
uitlegt), `src/lib/signals.badge-signable-proposals-order.test.ts` (+1 test, rood→groen bewezen:
`updatedAt desc` → assertion faalt, `createdAt asc` → groen). **Checks:** typecheck ✓ · lint ✓ · unit
(8509 passed, 2 skipped) ✓ · prettier ✓ · build (offline font-stub) exit 0 · CI-poort verifiëren (PR volgt).

## 2026-09-09 — robuustheid: vervalkalender onderdrukt superseded/gedekte certificaten (geen valse vernieuw-nudge)

**Wat:** de vervalkalender `summarizeExpiry` (`src/lib/credential-expiry-overview.ts`) — getoond aan de
ZZP'er op `/certificaten` (ExpiryOverviewCard) én aan de bemiddelaar op `/franchise/zzpers/[id]` (en via
`summarizeExpiryAlert` op `/franchise/zzpers` + de export) — was het énige verval-oppervlak dat de canonieke
superseded-/gedekte-onderdrukking níét toepaste. Élk ander oppervlak sluit een cert dat door een
nieuwer/onbeperkt exemplaar van hetzelfde type gedekt is al uit (`supersededVerifiedCredentialIds`/
`coveredCredentialTypes`): de ZZP-nav-badge (`signals.ts`), de next-actions (`pending-tasks.ts`), de
verval-cron (`expiry-task.ts`) en de bemiddelaar-roostertelling (`rosterExpiringByProfile`). Had een ZZP'er
voor een type twee VERIFIED-certs — één dat binnenkort verloopt én één doorlopend/later-vervallend exemplaar —
dan bleef de kalender "verloopt binnenkort — vernieuw" tonen, terwijl de vereiste al permanent gedekt was: een
valse nudge die nooit op nul komt, plus drift t.o.v. de roostertelling die de bemiddelaar ziet.

**Aanpak (hergebruik, geen duplicatie):** `summarizeExpiry` krijgt de vólledige certificatenlijst binnen, dus
het berekent nu intern `supersededVerifiedCredentialIds` + `coveredCredentialTypes` en slaat twee gevallen over:
(1) een nu-geldig VERIFIED-cert dat superseded is door een nieuwer/onbeperkt exemplaar van hetzelfde type;
(2) een verlopen exemplaar (EXPIRED of computed-expired VERIFIED) van een type dat een ánder nu-geldig
VERIFIED-cert al dekt — exact het geval dat de `coveredCredentialTypes`-docstring benoemt. Verloopt élk exemplaar
van een type, dan valt het type buiten de dekking en blijft de verlopen-melding terecht staan. Het nu-geldige
cover-cert zelf wordt nooit onderdrukt (dat moet de ZZP'er wél vernieuwen vóór het lapst). Geen caller-wijziging;
`summarizeExpiryAlert` (franchise) erft de fix → agreert nu met `rosterExpiringByProfile`.
**Bestanden:** `src/lib/credential-expiry-overview.ts` (+ `.test.ts`: 6 tests — onbeperkt cover onderdrukt,
eerder-vervallend onderdrukt maar later-cover blijft, verlopen-van-gedekt-type onderdrukt, alles-verlopen blijft
zichtbaar, solo-cover blijft zichtbaar, typegrens onderdrukt niet; 2 bestaande fixtures kregen distincte typen
zodat ze windowing/sortering testen i.p.v. incidenteel superseded te triggeren).
**Checks:** typecheck ✓ · lint ✓ · unit (8514/8514, +6) ✓ · build ✓ · prettier ✓ · CI-poort verifiëren (PR #1450).

## 2026-09-09 — robuustheid: doorlopend cert onderdrukt valse collab-verval-nudge (ZZP'er) + badge↔lijst-pariteit

**Wat:** `collaborationCredentialExpiryConcerns` (`src/lib/collaboration-credential-expiry.ts`) — de bron
achter zowel de ZZP'er-taak `credentialCollabExpiryTask` (`pending-tasks.ts`) als de /certificaten-nav-badge
(`signals.ts` `collabDuringPlacementAlerts`) — bouwde `latestByType` uit uitsluitend gedáteerde VERIFIED-certs
(`if (c.status !== "VERIFIED" || !c.expiresAt) continue`) en sloeg een **doorlopend** (nooit vervallend,
`expiresAt == null`) VERIFIED-cert stil over. Had een ZZP'er voor een vereist type twéé geldige certs — één dat
binnenkort verloopt én één doorlopend exemplaar — dan bleef de binnenkort-vervallende de "vernieuw je certificaat
voor samenwerking X"-taak/badge voeden, terwijl het doorlopende cert de vereiste al permanent dekt. Een valse,
onoplosbare verval-nudge die nooit op nul komt — precies het "signaal dat nooit nuttig verdwijnt"-anti-patroon.

**Aanpak (hergebruik, geen duplicatie):** de fix spiegelt de al bestaande regel in
`supersededVerifiedCredentialIds` (`credentials.ts`) — dat een gedateerd cert als _superseded_ markeert zodra
een doorlopend (of later-vervallend) exemplaar bestaat, en dáár al de generíeke verval-nudge onderdrukt (de
collab-anker-helper deed dat als enige niet, terwijl de superseded-doc-comment 'm expliciet noemt). `latestByType`
ving de later-vervallende-gedateerde variant al impliciet (het kiest het laatst-vervallende); nu wordt een type met
een doorlopend geldig VERIFIED-cert opgenomen in `permanentlyCoveredTypes` en overgeslagen bij het afleiden van
zorgen. Zowel de taak als de badge lezen uit dezelfde pure helper → geen badge↔lijst-drift. Andere types (het
doorlopende cert is een ánder type) en niet-geverifieerde doorlopende certs blijven de zorg terecht staan.
**Bestanden:** `src/lib/collaboration-credential-expiry.ts` (+ `.test.ts`: 4 tests — doorlopend cert onderdrukt
binnen-venster- én mid-plaatsing-zorg, ander type onderdrukt niet, niet-geverifieerd doorlopend cert dekt niet).
**Checks:** typecheck ✓ · lint ✓ · unit (helper+signals+credentials 82/82) ✓ · prettier ✓ · full unit + build +
CI-poort verifiëren (PR volgt).

## 2026-09-09 — geld/robuustheid: uren-invoer op de cent-grid afgedwongen (getoonde uren == gefactureerde uren)

**Wat:** de open MED-kandidaat uit de 8-9-notitie hieronder gedicht. De factuurmotor
`hoursTimesRateCents` (`src/lib/administration/hourly-cents.ts`) kwantiseert uren stil naar honderdsten
(`Math.round(hours * 100)`). Uren met méér dan twee decimalen passeerden de validatie (`validatePerformanceForm`/
`assertPerformanceWithinLimits` checkten alleen finite/positief/max, geen 2-decimaal-stap) en werden bij
factuurafleiding geherkwantiseerd — bv. een geknutselde POST of CSV-import met `4,149` uur factureert als
`4,15` uur, terwijl de urenstaat/PDF/CSV `4,149` blijft tonen. Getoonde ≠ gefactureerde hoeveelheid, precies op
het administratie-vertrouwensvlak. **Geld ongemoeid** — de beschermde motor (`hourly-cents.ts`, #1440) is niet
aangeraakt; de fix zit puur op de invoer-grens zodat de kwantisatie een no-op wordt.

**Aanpak (hergebruik, geen duplicatie):** één float-veilig predikaat `isCentAccurateHours(hours)` in
`hourly-cents.ts` (co-locatie met de kwantisatie die het spiegelt): `|hours·100 − round(hours·100)| ≤ 1e-6`
accepteert geldige 2-decimalen inclusief IEEE-754-ruis (1,67 → 166,999…997; 4,15 → 415,000…006) en weigert elke
3e+ decimaal (afstand ≥ 0,1 in geschaalde ruimte). `assertPerformanceWithinLimits` — het choke point voor
formulier, CSV-import (`diensten/importeer`) én admin — weigert nu `hours` en elk ORT-`seg.hours` buiten de grid
(`"Vul de uren in met maximaal twee decimalen."`); `validatePerformanceForm` geeft dezelfde vriendelijke
formulierfout op `hours`/`ortTotal`. Shift-/CSV-afgeleide uren (al op honderdsten via `segmentsFromMinutes`)
blijven geldig; een malformede CSV-rij degradeert tot een per-rij-skip (bestaande `toSafeActionError`-catch).
**Bestanden:** `src/lib/administration/hourly-cents.ts` (+ `.test.ts`: 3 tests — grid-acceptatie incl. float-ruis,
weigering >2 decimalen, consistentie met de kwantisatie), `src/lib/cascade/performance-commands.ts` (+ `.test.ts`:
4 tests — `hours` en `seg.hours` grid-guards), `src/lib/validation.ts` (+ `.test.ts`: 3 tests — `hours`/`ortTotal`
grid + float-noisy 1,67 blijft geldig). **Checks:** typecheck ✓ · lint ✓ · unit (affected 115/115) ✓ · prettier ✓ ·
full unit + build + CI-poort verifiëren (PR #1447).

Oudere entries van 8 en 9 september staan ongewijzigd in
[het voortgangsarchief](docs/progress/2026-09-12-prior-progress.md).
