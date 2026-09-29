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
