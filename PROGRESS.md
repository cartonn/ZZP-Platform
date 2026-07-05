# PROGRESS.md — Voortgang

> Bijwerken aan het eind van elke sessie. Houd het kort en feitelijk:
> wat is af, welke bestanden, welke tests, wat is de volgende stap.

## Persona-sweep 2026-07-05 (run 10) — APPROVED vorige-cyclus-factuur maskeert de betaalactie niet meer

**Defect (live gereproduceerd + gefixt):** het spiegelbeeld van de run-9-fix. Op een ACTIVE-
samenwerking met een cyclus-1-factuur op `lifecycleStatus=APPROVED` (opdrachtgever heeft goedgekeurd,
ZZP'er moet de betaling nog markeren) waarop de ZZP'er nieuwe cyclus-2-uren indient
(`Performance SUBMITTED`, nieuwer dan de factuur), toonde de cascade-status-regel op het
samenwerking-detail als ZZP'er **"Je hoeft nu niets te doen — wacht op goedkeuring van je uren."**,
terwijl hetzelfde scherm én `/acties` de openstaande betaaltaak ("Markeer de betaling") toonden —
een zichzelf tegensprekend scherm.

- **Oorzaak:** `performanceNewerThanInvoice` (`src/lib/cascade/stage.ts:75`) nulde de factuur
  onvoorwaardelijk zodra er een nieuwere prestatie was — óók een niet-terminale factuur die nog een
  ZZP-actie draagt. Een `SUBMITTED`-prestatie short-circuit bovendien vóór de factuur-tak, dus de
  betaalactie viel weg. `pending-tasks.ts:264-266` maskeert niets en toonde de taak wél.
- **Fix:** ZZP-uitzondering in de `perf === "SUBMITTED"`-tak van `stage.ts` via de nieuwe pure helper
  `priorCycleFreelancerPhase(latestInvoiceStatus, …)`: een genulde vorige-cyclus-factuur met een
  openstaande ZZP-actie (DRAFT→indienen, REJECTED→corrigeren, APPROVED/OVERDUE→betaling markeren)
  wordt tóch als ZZP-fase getoond (`youAreUp:true`); SUBMITTED/PAID/PROCESSED → geen ZZP-actie, val
  terug op de keur-fase. De opdrachtgever ziet ongewijzigd de keur-fase (diens actie).
- **Live geverifieerd na rebuild:** ZZP'er "Actie nodig: markeer de betaling zodra je bent betaald.";
  opdrachtgever "Actie nodig: keur de ingediende uren of oplevering." — beide consistent met `/acties`.
- **Bestanden:** `src/lib/cascade/stage.ts` (+helper), `src/lib/cascade/stage.test.ts` (+5 cases,
  rood→groen). Gate: typecheck ✓, lint ✓, **3107 unit-tests ✓**, prettier ✓, build ✓. Geen
  schemawijziging. Adversariële matrix (priv-esc/IDOR/cross-tenant/doc-privacy/exports/XSS/405) + de
  recente-commits-audit (#605–#617): geen nieuwe gaten. Rest geparkeerd in `docs/PERSONA-SWEEP-BACKLOG.md`.

## Administratie-ontzorging 2026-07-05 — te-betalen-per-leverancier voor de opdrachtgever (PR #616)

**Waarde (opdrachtgever, cashflow-uit):** `/verplichtingen` toonde de betaalverplichtingen op een
tijdlijn (deze maand / volgende maand / te laat), maar niet _aan wie_ ik hoeveel moet betalen. Bij
meerdere leveranciers is de #1 vraag "achter welke crediteur moet ik aan / wie moet ik als eerste
betalen?". Spiegel van het ZZP'er-debiteurenoverzicht (#611) vanuit de betaal-kant. Benchmark:
Moneybird/e-Boekhouden/Tellow hebben een crediteuren-/ouderdomsoverzicht; wij vertalen dat naar onze
server-side verplichtingen-waarheid (cascade-bewust) met te-laat-signaal en eerstvolgende vervaldatum.

- **`src/lib/creditor-summary.ts`** (nieuw, puur): `summarizeCreditors(items, now)` groepeert de
  openstaande `ObligationItem[]` per leverancier → `{outstandingCents, overdueCents (stage OVERDUE of
dueDate<now), awaitingApprovalCents (SUBMITTED), invoiceCount, overdueCount, earliestDueDate,
daysUntilEarliestDue}`; sortering te-laat → openstaand → naam; verplichtingen zonder leverancier-id
  tellen niet mee. `shouldShowCreditorSummary` toont de kaart alleen bij ≥2 leveranciers óf een
  te-laat bedrag (anders voegt ze niets toe aan het totaal). 11 unit-tests.
- **`ObligationItem.counterpartyId`** (additief): stabiele groeperingssleutel (freelancer-profiel-id),
  gevuld in `data/payment-obligations.ts` (select `freelancer.id`). Enige constructiesite; geen extra query.
- **`components/administratie/creditor-summary-card.tsx`** (nieuw): "Te betalen per leverancier"-kaart
  met per leverancier naam, openstaand bedrag, aantal facturen + goed-te-keuren/vervalt-over, en een
  te-laat-badge; kop-badge met het totale te-late bedrag. Plain NL (geen i18n).
- **`verplichtingen-panel.tsx`**: gerenderd onder de samenvattingsstrip, afgeleid uit de reeds geladen
  verplichtingenlijst (geen extra query).
- Gate: typecheck ✓, lint ✓ (0 warnings), **3101 unit-tests ✓** (11 nieuw), prettier ✓, build ✓.
  Read-only, geen dode knoppen, geen schemawijziging, server-side verplichtingen-waarheid.

## Prod-rijpheid 2026-07-05 — cron/achtergrondtaakfouten naar de error-reporter (Sentry-ready)

**Waarde (beheerder, observability):** een gefaalde geplande taak op de onbewaakte dagelijkse
05:00-cron verdween voorheen stil. `/api/tasks/run-all` logde een taakfout alleen via `logger.error`
(gaat nooit naar Sentry — `onRequestError` ziet 'm niet, want de taakloper vangt de fout op); de
losse per-taak-routes **slikten** de fout volledig (leeg `catch {}`, géén log). Precies het faaltype
waarvoor externe monitoring bestaat, bleef onzichtbaar. Nu bereiken deze fouten de error-reporting-grens.

- **Nieuw:** `reportBackgroundFailure(source, error, extra?)` in `src/lib/observability/report.ts` —
  logt ALTIJD één lokale, gestructureerde (PII-geredacteerde) regel én escaleert ADDITIONEEL naar de
  externe reporter wanneer `SENTRY_DSN` gezet is (op DSN gepoort zodat de console-fallback niet dubbelt).
  Slikt alles (rapportage mag een taak nooit laten falen).
- **Gewired:** `run-all/route.ts` (callback → `cron:run-all` + `{task}`) en de 12 losse taak-routes
  (`catch (e)` → `reportBackgroundFailure("cron:<naam>", e)` vóór de 500; return-tekst ongewijzigd).
- **Bestanden:** `src/lib/observability/report.ts` (+helper), `report.test.ts` (+4 tests, 12 totaal),
  13 route-bestanden onder `src/app/api/tasks/`, `MENSENWERK.md` §0b.
- **Resterend mensenwerk:** onveranderd — `SENTRY_DSN` + `npm i @sentry/nextjs` (optioneel, aanbevolen);
  zonder DSN draait alles veilig door op gestructureerd loggen.
- Gate: typecheck ✓, lint ✓, test 3090 ✓, prettier ✓, build (CI-poort). Geen schemawijziging.

## Security/Privacy-audit 2026-07-05 — `SupportTicket.subject` mee in de erasure (AVG art. 17)

**Waarde (betrokkene, recht op vergetelheid):** een security-/privacy-auditronde (orchestrator Opus 4.8

- 3 parallelle Opus-subagents op cross-tenant/IDOR, AVG-erasure/export-volledigheid en CSV-/PDF-authz)
  vond één echt gat: `anonymizeUser` redacteerde wél `SupportMessage.body` maar niet het door de gebruiker
  zélf getypte **onderwerp** van diens supporttickets — dat bleef verbatim en herleidbaar staan (en zit in
  de AVG-inzage-export). Gedicht: `supportTicket.updateMany({ where: { userId }, data: { subject: … } })`
  in de anonimiseringstransactie.

* **Bestanden:** `src/app/(protected)/admin/gebruikers/actions.ts` (+redactieregel),
  `src/app/(protected)/admin/gebruikers/anonymize-erasure.test.ts` (+mock + case, rood→groen bewezen),
  `docs/SECURITY-PRIVACY-BACKLOG.md` (ronde 2026-07-05: OPGELOST + 3 geparkeerde items).
* **Geparkeerd:** `NoShowReport.reason` (erasure-vs-bewaargrond → MENSENWERK/DPO), export-pariteit voor
  enkele eigen vrije-tekstvelden (LAAG), `/api/agenda` zonder rate-limit/audit (LAAG, consistentie).
* **Geen nieuwe gaten** in cross-tenant/IDOR, CSV-/PDF-authz, crown-jewel-endpoints, CSP, cron-auth,
  billing-webhook, rate-limiters of de ICS-builder; `npm audit` 0 prod-kwetsbaarheden.
* Gate: typecheck ✓, lint ✓, test ✓, build ✓, prettier ✓ — CI-poort geverifieerd op de PR.

## Ontwerp-lab 2026-07-05 — reeks 9: +10 concepten (nrs 81–90) op `/ontwerp`

**Waarde (eigenaar, richtingkeuze herontwerp):** het publieke, inlogvrije design-lab groeide van 80 →
**90 concepten** (additief; geen bestaand concept aangeraakt). Tien nieuwe, onmiskenbaar verschillende
2026-designrichtingen, elk als volledig uitgewerkt high-fidelity redesign van de zes kernschermen
(dashboard, marktplaats, opdracht, verificatie, acties, facturen) met NL mock-content.

- **Nieuw (81–90):** 81 Vloeiglas (Apple Liquid Glass — refractief materiaal 2026) · 82 Japandi
  (wabi-sabi/quiet-luxury) · 83 Therma (thermografie/infrarood-heatmap datataal) · 84 Draad
  (Superhuman-grade snelheids-inbox/keyboard-triage) · 85 Focus (enkelvoudige zen-focusmodus) ·
  86 Revisie (versiebeheer/diff-esthetiek als auditspoor) · 87 Kader (fintech-ops canvas Mercury/Ramp) ·
  88 Widget (glanceable widget-home iOS/Family) · 89 Lumen (bioluminescente diepzee-dark) · 90 Marmer
  (klassiek geaderd marmer, erfgoed quiet-luxury).
- **Bestanden:** 10× `src/components/ontwerp/concepts/concept-8x/9x-*.tsx` (nieuw), plus additieve
  entries in `registry.ts` en imports/map in `src/app/ontwerp/[id]/page.tsx`. Alle tien gebruiken
  bestaande `--font-lab-*`-vars; geen nieuwe dependencies; deterministisch (geen random/Date in render).
- Gate: typecheck ✓, lint ✓, test ✓, build ✓, prettier ✓ — CI-poort geverifieerd op de PR.
- Details + volledige trend-lijst: `docs/DESIGN-LAB.md` (reeks 9).

## Matching/keuze-hulp 2026-07-05 — reistijd-signaal per kandidaat voor de opdrachtgever (PR #612)

**Waarde (opdrachtgever, keuze op locatie):** `/kandidaten` toonde per kandidaat al match, tarief,
agenda, startdatum-fit, vertrouwen en leverbetrouwbaarheid — maar niet _hoe ver_ de kandidaat reist.
Voor een opdracht op locatie (ONSITE/HYBRID, o.a. zorg) is nabijheid een concrete keuzefactor:
dichtbij = betrouwbaarder opdagen en minder reisbelasting. Benchmark: Pidz/Temper tonen shift-afstand.
Dit is het opdrachtgever-spiegelbeeld van het reistijd-signaal dat de ZZP'er al op de
opdracht-detailpagina ziet.

- **`src/lib/candidate-proximity.ts`** (nieuw, puur): `classifyCandidateProximity({jobWorkMode,
jobLocation, candidateLocation})` → `{minutes, level}` of `null` (geen chip) wanneer niet relevant
  (REMOTE-opdracht) of niet te schatten (onbekende plaats aan één kant → `estimateTravelMinutes`
  → null). Buckets `near ≤30` / `moderate ≤75` / `far`; `proximityLabel` ("Dichtbij · ~18 min"),
  `PROXIMITY_VARIANT` (success/muted/warning). Hergebruikt de bestaande `estimateTravelMinutes`-stub
  (mensenwerk vervangt die later door een echte routing-provider — aangrijpingspunt blijft gelijk);
  raakt de matching-motor niet. 9 unit-tests.
- **`kandidaten/page.tsx`**: reistijd-chip in de logistiek-regel (naast tarief/agenda/startdatum),
  afgeleid uit de reeds geladen `job.workMode`/`job.location` + `freelancer.location` (geen extra
  query). Toont niets bij een remote opdracht of onbekende plaats (geen misleidend signaal).
- Gate: typecheck ✓, lint ✓ (0 warnings), **3094 unit-tests ✓** (9 nieuw), prettier ✓, build ✓.
  Read-only, geen dode knoppen, geen schemawijziging.

## Administratie-ontzorging 2026-07-04 — debiteuren-overzicht per opdrachtgever ZZP'er (PR #611)

**Waarde (ZZP'er, cashflow):** het facturen-scherm toonde één "Openstaand"-totaal, maar niet _wie_
mij nog hoeveel verschuldigd is. Bij meerdere opdrachtgevers is de #1 vraag "achter welke debiteur
moet ik aan?". Benchmark: Moneybird/e-Boekhouden/Tellow hebben allemaal een debiteuren-/ouderdoms-
overzicht; wij vertalen dat naar onze server-side openstaand-regel (cascade-bewust) met een
te-laat-signaal en de ouderdom van de langst openstaande factuur.

- **`src/lib/debtor-summary.ts`** (nieuw, puur): `summarizeDebtors(invoices, now)` groepeert de
  openstaande facturen (`isInvoiceOutstanding`, cascade + legacy) per opdrachtgever →
  `{outstandingCents, overdueCents (dueAt<now), invoiceCount, overdueCount, oldestIssuedAt,
oldestDaysOutstanding}`; sortering te-laat → openstaand → naam; losstaande facturen (geen company)
  tellen niet mee. `shouldShowDebtorSummary` toont de kaart alleen bij ≥2 debiteuren óf een te-laat
  bedrag (anders voegt ze niets toe aan het enkele totaal). 13 unit-tests.
- **`components/administratie/debtor-summary-card.tsx`** (nieuw): "Openstaand per opdrachtgever"-kaart
  met per debiteur naam, openstaand bedrag, aantal facturen + ouderdom en een te-laat-badge; kop-badge
  met het totale te-late bedrag.
- **`facturen-panel.tsx`**: alleen voor de ZZP'er, afgeleid uit de reeds geladen factuurlijst (geen
  extra query), gerenderd onder de Betaald/Openstaand-totaalkaarten.
- Gate: typecheck ✓, lint ✓ (0 warnings), **3076 unit-tests ✓** (13 nieuw), prettier ✓, build ✓.
  Read-only, geen dode knoppen, geen schemawijziging, server-side openstaand-waarheid.

## Administratie-ontzorging 2026-07-04 — handmatige betaalherinnering-knop ZZP'er (PR #609)

**Waarde (ZZP'er, cashflow):** achter een openstaande factuur aanzitten is de #1 cashflow-pijn.
Er waren al de automatische aanmaningsladder (`payment-reminders.ts`, op een schema) én het
aanmaning-sjabloon (`aanmaning.ts`, "het platform verstuurt geen brieven"). Wat ontbrak: een
**één-klik in-platform nudge** die de ZZP'er zélf, op het moment dat hij kiest, naar de opdrachtgever
stuurt vanaf de factuurdetail. Benchmark: Moneybird/Tellow/e-Boekhouden hebben allemaal een "stuur
herinnering"-knop; wij vertalen dat naar onze server-side waarheid + afkoelperiode.

- **`src/lib/manual-payment-reminder.ts`** (nieuw, puur): `isAwaitingPayment(status, lifecycleStatus)`
  (cascade → APPROVED/OVERDUE; los → SENT/OVERDUE) + `canSendPaymentReminder(input, now)` →
  `{eligible, reason, daysOverdue, nextAllowedAt}`. Voorwaarden in volgorde: crediteur-eigenaar →
  uitgereikt (`issuedAt`) → nog onbetaald → buiten de afkoelperiode (`MANUAL_REMINDER_COOLDOWN_DAYS=2`,
  strikt kleiner-dan). 15 unit-tests.
- **`facturen/actions.ts`** — `sendPaymentReminder(invoiceId, prev, formData)` (`ReminderState`):
  auth → rol (FREELANCER) → ownership (uitschrijver) → server-herbevestiging via de pure helper →
  afkoelperiode uit het **auditlogboek** (laatste `INVOICE_REMINDER_SENT`, geen schemakolom) → notify
  (`PAYMENT_REMINDER` naar de opdrachtgever) + audit. Bericht past zich aan op dagen-te-laat. Geen
  geldstroom (Besluit 1): statusregistratie + signalering.
- **`components/invoices/payment-reminder-button.tsx`** (nieuw, client) — `useActionState`-knop
  (spiegel van `credential-reminder-button.tsx`), toont pending + succes/fout inline.
- **`facturen/[id]/page.tsx`** — "Wacht op betaling"-blok voor de ZZP'er: knop bij eligible, anders een
  rustige afkoelperiode-noot ("opnieuw mogelijk vanaf <datum>"). `INVOICE_REMINDER_SENT`-auditlabel.
- Gate: typecheck ✓, lint ✓ (0 warnings), **3063 unit-tests ✓** (15 nieuw), prettier ✓, build ✓.
  Server-side waarheid, geen dode knoppen, geen schemawijziging, geen extra query op het niet-eligible pad.

## Prod-rijpheid 2026-07-04 — abonnement-periode-vervalcyclus (PR #608)

**Gat gedicht (billing-correctheid):** na een eenmalige Mollie-betaling zette de webhook
`currentPeriodEnd = nu + 1 maand`, maar `getActivePlanKey` beschouwde élk `ACTIVE`-abonnement als
gerechtigd — ongeacht `currentPeriodEnd`. Gevolg: permanente Pro/Business na één betaling
(omzetlek + onjuiste server-side waarheid). Er was een PAST_DUE-ladder maar geen periode-verval.

- **`src/lib/subscription-lifecycle.ts`** (nieuw, puur): `isSubscriptionActive({status,currentPeriodEnd},now)`
  (ACTIVE + niet-verlopen; `currentPeriodEnd=null` = perpetueel/demo) + `planSubscriptionExpiry`
  (renewal-herinneringen op dag 7/1 vóór verval + verval-items; per-periode dedupeKey-token). 14 tests.
- **`src/lib/entitlement-guard.ts`**: `getActivePlanKey`/`usersWithEntitlement` gebruiken nu
  `isSubscriptionActive` → een verlopen betaalde periode telt direct als FREE, óók vóór de taak draait.
  Demo/gratis-activaties (null periode) ongewijzigd. +10 tests (nieuw `entitlement-guard.test.ts`).
- **`src/lib/subscription-expiry-task.ts`** (nieuw): `runSubscriptionExpiryTask` — query ACTIVE betaalde
  abonnementen met niet-null `currentPeriodEnd`, plant, dedupt op DomainEvent, stuurt renewal-notificaties
  en zet verlopen abonnementen op `CANCELLED` (→ Gratis) met audit. Idempotent, geen geldstroom. +4 tests.
  Gewired in `/api/tasks/run-all` (`subscription-expiry`).
- Gate: typecheck ✓, lint ✓ (0 warnings), **3048 unit-tests ✓** (28 nieuw), prettier ✓, build ✓.
- Resterend mensenwerk: Mollie-account/KYC + `MOLLIE_API_KEY`; automatische maandhernieuwing
  (Mollie-mandaat/recurring) is een vervolgstap bovenop deze verval-cyclus.

## Security/privacy-audit ronde 2026-07-04b — PII-in-logs sweep afgerond (main-basis `f04d7b3`)

Security-audit van de delta `b86c33b..f04d7b3` (#599–#606) met 1 parallelle Opus security-subagent.
**Authz/IDOR/cross-tenant: geen nieuwe gaten** — de nieuwe bemiddelaar-voordracht
(`franchise/diensten/actions.ts` → `dienst-voordracht.ts`) is end-to-end gepoort (role → Zod →
tenant-scope op dienst én ZZP'er → engageability-herberekening → audit); health-probe/`global-error`
lekken niets naar niet-geauthenticeerde callers; de nieuwe `/ontwerp`-conceptbestanden bevatten geen
injectiesink. **1 privacy-bevinding gefixt (MIDDEL, rood→groen):**

- [x] **`admin/import/actions.ts`** — het admin-bulk-importpad logde `console.error("… mislukt voor",
row.email, mailErr)` (e-mailadres als los argument + rauwe mailfout) en `console.error(…, e)` bij
      aanmaakfout — rauwe PII buiten de redactie-pijplijn, het pad met de meeste PII per actie. Omgezet
      naar `logger.error(…, { email: row.email, error: describeError(e) })` (adres → `j***@firma.nl`).
- [x] **Nieuwe helper `src/lib/observability/storage-failure.ts`** (`logStorageCleanupFailure`, spiegelt
      `logMailFailure`) — de vier `storage.delete(...)`-`catch`-sites (`bedrijf`/`documenten`/
      `certificaten`/`admin/gebruikers`) + `reviews-reveal-task.ts` routen nu via de maskerende logger
      i.p.v. het rauwe `err`-object. Sluit de parked LOW-items uit ronde 2026-07-03b.
- [x] **`src/lib/observability/storage-failure.test.ts`** — adres in de storage-fout-message gemaskeerd;
      provider-veld (`requesterEmail`/`bucketPolicy`) lekt niet mee; niet-Error-input gooit nooit door.
- [x] Checks: typecheck ✓, lint ✓ (0 warnings), `test` ✓ (+3 nieuw; `unbounded-queries`-
      allowlist-regelnrs bijgewerkt na de import-shift), `prettier` ✓, `build` ✓ (3020 tests). Backlog
      bijgewerkt (`docs/SECURITY-PRIVACY-BACKLOG.md` ronde 2026-07-04b).

## Persona-sweep run 9 — multi-cyclus: betaalde factuur maskeerde geen nieuwe uren meer (2026-07-04, main-basis `757772d`)

Kritische-gebruiker-sweep (4 rollen, live Playwright/Chromium) vond **1 defect, live gereproduceerd
en gefixt**: op een ACTIVE-samenwerking waar de ZZP'er ná een betaalde cyclus-1-factuur nieuwe uren
indient (cyclus 2), toonde de cascade-fase (detail/lijst/dashboard/roster-dossier) "Factuur betaald ·
niets te doen" terwijl het "aan zet"-blok tegelijk "1 ingediende prestatie wacht op je goedkeuring"
zei — een zichzelf tegensprekend scherm. `createPerformance` gate't alleen op ACTIVE, dus dit
multi-cyclus-pad is echt bereikbaar. Geparkeerde MEDIUM uit `docs/PERSONA-SWEEP-BACKLOG.md` (run 8):

- [x] **`src/lib/cascade/stage.ts`** — optionele input `performanceNewerThanInvoice` + pure helper
      `isPerformanceNewerThanInvoice(perfCreatedAt, invCreatedAt)`. Is de laatste prestatie nieuwer dan
      de laatste factuur, dan hoort de factuur bij een vorige cyclus en telt ze niet mee (`inv` → null):
      de PAID-terminaaltak wordt overgeslagen en de fase valt terug op de prestatie-evaluatie. Dezelfde
      genulde `inv` voedt ook de factuur-fase, zodat cyclus 2 een nieuwe factuur vraagt i.p.v. de oude
      te herhalen.
- [x] **Callers geven de vlag door** (`dashboard/page.tsx`, `samenwerkingen/page.tsx`,
      `samenwerkingen/[id]/page.tsx` via `collaboration-status-line`, `franchise/roster-dossier.ts`):
      de laatste-prestatie/-factuur-selects laden nu ook `createdAt`; geen extra query, geen
      schemawijziging. `unbounded-queries.test.ts`-allowlist regelnummers bijgewerkt.
- [x] **`src/lib/cascade/stage.test.ts`** — +4 cases: PAID + nieuwere SUBMITTED → performance-approve
      (opdrachtgever aan zet); PAID + nieuwere APPROVED → invoice-submit; PAID zonder nieuwere prestatie
      blijft terminaal betaald; `isPerformanceNewerThanInvoice`-randgevallen (strikt nieuwer, ontbrekende
      datum → false).
- [x] **Live geverifieerd** tegen de verse build: dezelfde samenwerking toont ná de fix "Actie nodig:
      keur de ingediende uren of oplevering." + badge "Ter goedkeuring", consistent met het actiecentrum.
- [x] Gate groen: typecheck ✓, lint ✓ (0 warnings), **3017 unit-tests** ✓, `prettier --write .` ✓,
      `next build` ✓. Server-side waarheid, geen dode knoppen, geen verboden woord.

## Actiecentrum — "dien je uren in"-taak voor de ZZP'er (2026-07-04g, main-basis `c85cc98`)

De cascade-fase (`stage.ts`) toont op detail/lijst/dashboard "Dien je uren/oplevering in" met
`youAreUp:true` zodra een samenwerking ACTIVE is (contract getekend) en er nog geen prestatie is
ingediend — maar het actiecentrum (`/acties`, item-niveau `pending-tasks.ts`) miste die taak. De
ZZP'er die net een getekende samenwerking had, zag daar dus géén "wat moet ik nu doen"-item en moest
zelf de samenwerking in navigeren. Geparkeerde next-action-asymmetrie uit
`docs/PERSONA-SWEEP-BACKLOG.md` (run 8, LOW) gedicht (PR #605):

- [x] **`src/lib/actions/tasks.ts`** — nieuwe pure builder `performanceSubmitTask(collabId, jobTitle)` + union-kind `performance-submit` (tone attention, submit-band `P.messagesAwaiting`=55, resolver
      "link" → de samenwerking, want indienen is meerstaps: uren/ORT vastleggen → indienen).
- [x] **`src/lib/actions/pending-tasks.ts`** — de collab-prestatie-select laadt nu de meest recente
      prestatie (status, `createdAt desc`, take 5) i.p.v. alleen REJECTED-rijen. De ZZP'er-tak spiegelt
      nu `stage.ts` exact op de laatste prestatie: geen/DRAFT → `performanceSubmitTask`; REJECTED →
      `performanceResubmitTask`; SUBMITTED → geen ZZP'er-taak (opdrachtgever keurt); APPROVED → de
      factuur-tak. ACTIVE ⟹ contract getekend (bevestigd in `handlers.ts planContractSigned`), dus de
      submit-taak verschijnt nooit vóór ondertekening. Geen extra query, geen schemawijziging.
- [x] **`src/components/actions/action-list.tsx`** — geen wijziging nodig: de nieuwe kind valt in de
      `default`-tak (OpenLink → `task.href`), geen exhaustieve `never`-switch geraakt.
- [x] **`src/lib/actions/tasks.test.ts`** — +1 test (link-resolver, submit-prioriteit 55, deep-link,
      lager dan de goedkeur-taak).
- [x] Gate lokaal groen: typecheck ✓, lint ✓ (0 warnings), **3013 unit-tests** ✓, `prettier --write .` ✓,
      `next build` ✓. Server-side waarheid, geen dode knoppen, geen verboden woord.

## Ontwerp-lab reeks 8 — +10 concepten (nrs 71–80) op `/ontwerp` (2026-07-04, main-basis `867d764`)

Design-lab uitgebreid van 70 → **80 concepten** (additief; reeks 1–7 ongewijzigd). Orchestrator
Opus 4.8 + 4 parallelle Opus-builders op niet-overlappende bestanden; registry + route zelf
geïntegreerd (append-only). Tien nieuwe, onderling én van 1–70 onderscheidende richtingen:

- [x] **71 Vertrek** — Solari split-flap-vertrekbord, kinetisch-mechanisch (antraciet + amber).
- [x] **72 Bon** — thermische kassabon: scheurranden, dot-matrix, barcode, totaalregels.
- [x] **73 Printplaat** — PCB/circuit board: koperbanen, chip-kaarten, silkscreen-labels, via's.
- [x] **74 Sterrenbeeld** — sterrenkaart: constellatie-matching-graaf, helderheid = match-sterkte.
- [x] **75 Cinema** — cinematisch letterbox: cinemascope-banden, title-cards, filmkorrel, scrubber.
- [x] **76 Etiket** — apotheek-/lab-label: recept-koppen, dossiernummers, geverifieerd-zegels.
- [x] **77 Arcade** — retro-game HUD: match% als power-bar, score-tellers, getemde scanline-gloed.
- [x] **78 Zilver** — zilver-gelatine zwart-wit fotografie: contactvel + sprocket-frames, filmkorrel.
- [x] **79 Radar** — sonar-radarscope: afstandsringen + sweep, afstand = reistijd, phosphor-gloed.
- [x] **80 Terrazzo** — gespikkeld terrazzo-steen: deterministische spikkels, tactiel-premium-speels.

Bestanden: `src/components/ontwerp/concepts/concept-71-vertrek.tsx` … `concept-80-terrazzo.tsx`
(nieuw); `registry.ts` (+10 entries, append); `src/app/ontwerp/[id]/page.tsx` (+10 imports +
map-entries, append). Live-app ongewijzigd. Details in `docs/DESIGN-LAB.md` (reeks 8). Volgende
reeks = 81–90.

## Ontwerp-lab reeks 7 — +10 concepten (nrs 61–70) op `/ontwerp` (2026-07-04, main-basis `efb6fce`)

Design-lab uitgebreid van 60 → **70 concepten** (additief; reeks 1–6 ongewijzigd). Orchestrator
Opus 4.8 + 4 parallelle Opus-builders op niet-overlappende bestanden; registry + route zelf
geïntegreerd (append-only). Tien nieuwe, onderling én van 1–60 onderscheidende richtingen:

- [x] **61 Stroom** — Kanban-flowboard als besturingssysteem (status-als-plaats, lanes + lift-hover).
- [x] **62 Neonzon** — synthwave/retrowave-zonsondergang met horizon-grid + crisp glazige panelen.
- [x] **63 Strip** — graphic-novel/pop-art: inktcontour, Ben-Day-halftone, panelen + tekstballonnen.
- [x] **64 Solar** — solarpunk techno-optimisme, zon-boog/blad-glyphs in amber+groen.
- [x] **65 Kinetiek** — kinetische typografie (CSS-keyframes, KPI-marquee) met reduced-motion-respect.
- [x] **66 Prikbord** — skeuomorf prikbord/scrapbook: kurk, punaises, washi-tape, rode-draad-links.
- [x] **67 Parcours** — smaakvol gamified vertrouwens-reis: voortgangsringen, brons/zilver/goud-niveaus.
- [x] **68 Pictogram** — ISOTYPE pictogram-first informatietaal (zelf-getekend 15-delig SVG-systeem).
- [x] **69 Haard** — cozy warm-dark (espresso + kaars-amber), laag-prikkelende dark-mode.
- [x] **70 Krijt** — schoolbord/krijt: deterministische textuur, handgetekende krijt-diagrammen.

Bestanden: `src/components/ontwerp/concepts/concept-61-stroom.tsx` … `concept-70-krijt.tsx` (nieuw);
`registry.ts` (+10 entries, append); `src/app/ontwerp/[id]/page.tsx` (+10 imports + map-entries,
append). Live-app ongewijzigd. Gate lokaal groen: typecheck ✓, lint ✓, **test 3012** ✓, build ✓
(70 concepten geprerenderd via `generateStaticParams`), `prettier --write` ✓. Woord "AI" nergens.
Details in `docs/DESIGN-LAB.md` (reeks 7). Volgende reeks = 71–80.

## Persona-sweep run 8 — cascade-fase sprak actiecentrum tegen bij contract ondertekenen (2026-07-04f, main-basis `bf7395d`)

Kritische-gebruiker-sweep (orchestrator Opus 4.8 + 3 parallelle Opus-audits). DOEL 1 end-to-end
geverifieerd (CLIENT accepteert reactie → `NEW→ACCEPTED` + audit + notificatie + next-action daalt);
~90 schermen HTTP 200, nul 500's; ~40 adversariële probes (privilege-escalatie/IDOR/cross-tenant/
document-privacy/XSS/405) allemaal correct geweigerd; audits van #592–#601 en franchiser-tenant-
isolatie schoon. **Eén DEFECT gevonden & gefixt:**

- [x] **`src/lib/cascade/stage.ts`** — een niet-getekend contract (`contractStatus !== "SIGNED"`) op
      een niet-terminale samenwerking is nu één `contract-sign`-fase (`youAreUp:true`, "Onderteken
      contract"). Voorheen kreeg alléén `contractStatus==="SENT"` die actieve fase, maar productie zet
      `SENT` **nergens** (levensloop is `DRAFT → SIGNED`); elke echte ondertekenbare `PROPOSED`-
      samenwerking viel in de dode passieve DRAFT-tak (`youAreUp:false`, "wordt nog voorbereid"). Dat
      verborg de teken-CTA op het detail/de lijstkaart/de dashboard-cascadezone en sprak het
      actiecentrum tegen (`/acties` toonde tegelijk "Contract ondertekenen" via `contractSignTask`).
- [x] **`src/lib/collaboration-status-line.ts`** — dode `contract-draft`-case verwijderd; de status-zin
      toont nu "Actie nodig: onderteken het contract om te starten."
- [x] **`stage.test.ts` + `collaboration-status-line.test.ts`** — tests die het defect vastlegden
      omgezet naar de correcte verwachting (DRAFT = beide partijen aan zet). Live geverifieerd tegen de
      verse build.
- [x] Gate lokaal groen: typecheck ✓, lint ✓ (0 warnings), **3012 unit-tests** ✓, `prettier --write .` ✓,
      `next build` ✓. Overige next-action-audit-bevindingen (multi-cyclus "Betaald"-maskering e.a.)
      geparkeerd in `docs/PERSONA-SWEEP-BACKLOG.md`.

## Bemiddelaar — match-ranking bij voordragen uit roster (2026-07-04e, main-basis `c58f465`)

De bemiddelaar (FRANCHISER) draagt op een open dienst eigen roster-ZZP'ers voor
(`/franchise/diensten/[id]`). Die lijst toonde tot nu toe alléén inzetbaarheid en stond
ongesorteerd (`createdAt desc`) — de kernvraag "wie past het best op deze dienst?" bleef onbeantwoord,
terwijl de matchmotor die het al voor de Reacties-lijst en `/kandidaten` beantwoordt gewoon voorhanden
is. Nu gerangschikt op matchkwaliteit voor déze specifieke dienst (PR #601):

- [x] **`lib/franchise/dienst-voordracht.ts`** — nieuwe pure kern `buildRosterCandidates` scoort elke
      roster-ZZP'er met `scoreJobForFreelancer` (dezelfde motor, geen nieuwe rekenlogica) →
      `matchScore` + `topReason` (troef) + `topGap` (minpunt). Sortering: voordraagbare ZZP'ers
      bovenaan (INACTIEF kan server-side niet worden voorgedragen → onderaan), daarbinnen aflopende
      matchscore, tiebreak op naam (`localeCompare "nl"`). `getRosterCandidatesForDienst` laadt nu de
      job-match-velden (skills/credential-eisen/tarief/werkvorm/locatie/branche/tekst) + de
      freelancer-match-velden (skills/branches/tarief/werkvorm/locatie/reistijd/bio/
      beschikbaarheidsvensters) en delegeert naar de pure kern.
- [x] **`franchise/diensten/[id]/voordragen.tsx`** — "Match NN"-badge per rij (zoals de
      Reacties-lijst) + troef/minpunt-regel (Check/Minus, spiegel van de `/opdrachten`-kaart).
      Read-only weergave.
- [x] **`lib/franchise/dienst-voordracht.test.ts`** — 5 unit-tests: aflopende matchranking, INACTIEF
      onderaan ondanks hoge match, troef/minpunt-surfacing, voorgedragen/gereageerd-markering,
      naam-tiebreak bij gelijke score.
- [x] Gate lokaal groen: typecheck ✓, lint ✓ (0 warnings), **3012 unit-tests** ✓, `prettier --write .` ✓,
      `next build` ✓. Server-side waarheid, geen schemawijziging, geen extra query, geen verboden woord.

## Prod-rijpheid — global-error boundary + health-probe hardening + operationeel runbook (2026-07-04d, main-basis `888951b`)

Drie samenhangende productie-gaten gedicht (PR #600):

- [x] **`src/app/global-error.tsx`** — root-error-boundary (het laatste vangnet). `error.tsx` vangt
      fouten BINNEN de app-layout; een fout in de root-layout zelf (providers/thema/fonts) viel
      daarbuiten en toonde het kale Next.js-foutscherm. Nu een rustige NL-fallback met eigen
      `<html>/<body>` + uitsluitend inline-stijlen (app-CSS/providers zijn hier niet gegarandeerd),
      "Opnieuw proberen" (`reset`) + harde navigatie naar `/` (bewust: volledige herlaad herstelt de
      app-context) + korte foutreferentie (`digest`). Server-fouten lopen al via `onRequestError`.
- [x] **`/api/health` gehard** — `export const dynamic = "force-dynamic"` zodat de liveness-probe
      nooit statisch gecachet wordt (belangrijk: `scripts/start.mjs` gate't de seed op een echte
      200 van deze route). DB-storing wordt nu via de observability-reporter gerapporteerd
      (Sentry-ready). Pure kern geëxtraheerd naar `src/lib/observability/health.ts`
      (`buildHealthPayload`/`healthHttpStatus`/`shortCommit`) + 8 unit-tests.
- [x] **`docs/RUNBOOK.md`** — operationeel draaiboek: deploy/verificatie, rollback (Railway-redeploy + git-revert), back-up/herstel (`pg_dump`/`pg_restore` + herstel-oefening), incident-respons,
      secrets-rotatie, monitoring op /health + /readiness. MENSENWERK.md §11 verwijst ernaar.

Gate: typecheck + lint + prettier groen; health-tests 8/8; build in CI. Geen schemawijziging, geen
gedragswijziging aan bestaande routes.

## Security/privacy-audit — mail-fout-PII uit hostlogs + Resend-doorgifte transparant (2026-07-04c, main-basis `b86c33b`)

Auditronde (orchestrator Opus 4.8 + 3 parallelle Opus subagents op niet-overlappende oppervlakken:
authz/IDOR/cross-tenant, injectie/upload/secrets/auth/headers/SSRF, AVG-erasure/export/register/
k-anon/PII-logs). Delta #588–#598 + volledige sweep. Authz, injectie/upload/auth/headers/SSRF: **geen
nieuwe gaten**. `npm audit`: 0 prod-kwetsbaarheden. Twee bevindingen gefixt (rood→groen).

- [x] **A09 / AVG art. 5 lid 1f** — ontvangeradres (PII) lekte naar hostlogs bij mislukte mailverzending.
      Nieuwe `logMailFailure(source, error)` (`src/lib/observability/mail-failure.ts`) via de redactende
      `logger` + geëxporteerde `describeError`. 8 call-sites omgezet: 5 geplande taken (`notification-
digest`, `payment-reminders`, `vat-reminder`, `dba-monitor`, `concept-invoice-reminders`) +
      `wachtwoord-vergeten/actions.ts` (mail + token-fout) + `api/tasks/run-all/route.ts`. Test:
      `mail-failure.test.ts` (SMTP-/Resend-foutvorm → adres gemaskeerd; joint álle console-args).
- [x] **AVG art. 44/46** — Resend-doorgifte (US, mogelijk buiten EER) transparant gemaakt:
      `processing-register.ts` `notificaties-email` noemt nu de doorgifte + SCC/EU-regio-waarborg;
      `MENSENWERK.md` §5a kreeg de DPO-poort (houd `EMAIL_DRIVER` op `noop`/`smtp` tot SCC's rond).
      Feitelijke go-live-beslissing blijft mensenwerk (code inert zonder `RESEND_API_KEY`).
- [x] Gate lokaal groen: typecheck ✓, lint ✓ (0 warnings), **2999 unit-tests** ✓, `prettier --write .` ✓,
      `next build` ✓. Backlog bijgewerkt (ronde 2026-07-04, beide items OPGELOST). Geen verboden woord;
      UI/teksten volledig Nederlands; geen auth verzwakt, geen check verwijderd.

## Ontwerp-lab — reeks 6: +10 concepten (nrs 51–60) (2026-07-04b, main-basis `b3d20d3`)

Additieve run van het publieke `/ontwerp`-design-lab: 10 nieuwe, onderling sterk onderscheidende
top-1% redesign-concepten toegevoegd bovenop de bestaande 50 — niets overschreven of verwijderd.
Totaal nu **60 concepten** op `/ontwerp`. Gebouwd door 4 parallelle builder-subagents op
niet-overlappende bestanden; registry + route-koppeling zelf geïntegreerd (append-only).

- [x] `concept-51-teletekst.tsx` (Concept51) — NOS-Teletekst-revival.
- [x] `concept-52-metrokaart.tsx` (Concept52) — transit-lijndiagram als navigatie.
- [x] `concept-53-bauhaus.tsx` (Concept53) — Bauhaus/De-Stijl-geometrie, primaire kleuren.
- [x] `concept-54-eink.tsx` (Concept54) — e-ink/e-paper monochroom, dither-status.
- [x] `concept-55-aquarel.tsx` (Concept55) — painterly waterverf-wassingen.
- [x] `concept-56-kiosk.tsx` (Concept56) — 10-voet groot-format touch, XL-targets.
- [x] `concept-57-origami.tsx` (Concept57) — gevouwen papier, facet-belichting.
- [x] `concept-58-textiel.tsx` (Concept58) — geweven stof, stiksel & stof-labels.
- [x] `concept-59-memphis.tsx` (Concept59) — Memphis-postmodern, squiggles/terrazzo.
- [x] `concept-60-schetsboek.tsx` (Concept60) — hand-getekend, marker & annotaties.
- [x] `registry.ts` + `src/app/ontwerp/[id]/page.tsx` — 10 ConceptMeta-entries + imports/koppeling
      TOEGEVOEGD (append-only, bestaande entries ongemoeid). `docs/DESIGN-LAB.md` bijgewerkt.
- [x] Gate lokaal groen: typecheck ✓, lint ✓ (0 warnings), 2996 unit-tests ✓, `prettier --check .` ✓,
      `next build` ✓ (`/ontwerp/[id]` SSG, 60 params). Geen enkel voorkomen van het verboden woord;
      UI volledig Nederlands; alleen bestanden onder `src/app/ontwerp` + `src/components/ontwerp` en
      de twee koppelbestanden geraakt — live-app-gedrag ongewijzigd.

## UX — "beschikbaarheid verlopen"-nudge voor de ZZP'er (2026-07-04a, main-basis `db9613d`)

Een vindbare (niet-privé) ZZP'er met een volledig verlopen beschikbaarheidsagenda (alle vensters in
het verleden) verdween stil uit de start-fit die opdrachtgevers op `/kandidaten` zien — een verholen
rem op de matching. Concurrenten (Pidz/Temper) porren flexkrachten juist actief om hun agenda vers te
houden. Toegevoegd: een rustige actie-centrum-taak die de ZZP'er terugstuurt naar `/beschikbaarheid`.

- [x] `lib/availability.ts` — pure `summarizeAvailabilityFreshness(windows, now)` →
      `{status:"fresh"|"expired"|"empty", total}`. Puur afgeleid uit de einddata (inclusief, via
      `upcomingWindows`); `type` doet er niet toe — óók een toekomstig UNAVAILABLE-venster telt als
      "agenda bijgehouden" (fresh). `expired` = wél vensters maar geen enkele met toekomstwaarde.
- [x] `lib/next-actions.ts` — prioriteitsband `P.availabilityStale=40` (tussen `completeness`=30 en
      `applications`=50): findability-nudge weegt zwaarder dan een cosmetisch compleetheidsgat, lichter
      dan een nieuwe reactie.
- [x] `lib/actions/tasks.ts` — nieuw taak-type `availability-refresh` + `availabilityRefreshTask()`
      (tone `info`, resolver `link` → `/beschikbaarheid`; geen resolver-registry-wijziging nodig, de
      `default`-tak rendert de deep-link).
- [x] `lib/actions/pending-tasks.ts` — `freelancerTasks` haalt de vensters begrensd op (`take: MAX`)
      en pusht de taak alleen bij `visibility !== "PRIVATE"` én `status === "expired"` (een privé-
      profiel krijgt al de eigen taak; een nooit-gedeelde agenda is onboarding, geen nudge hier).
- [x] Tests: `availability.test.ts` (+5: empty/fresh/expired/toekomstig-UNAVAILABLE=fresh/t-m-vandaag=fresh),
      `tasks.test.ts` (+1: builder-vorm + prioriteit-ordening). Gate: typecheck + lint + prettier (hele
      repo) + **test 2996** + build groen. Geen schemawijziging, server-side waarheid, geen extra last
      (één begrensde query alleen voor een vindbaar profiel).

## Matching — semantiek als uitlegbare scorecomponent (2026-07-03h, main-basis `4b878a7`)

Inhoudelijke aansluiting (opdrachttekst ↔ profieltekst) weegt nu mee als kleine, uitlegbare
scorecomponent in de matchscore i.p.v. alleen als tiebreaker. Fundering was er al (ADR-0010:
`semantic.ts` + matcher-service); dit bedraadt de score + breakdown + reason.

- [x] `src/lib/matching.ts` — `semantic` toegevoegd aan `WEIGHTS` (requiredSkills 35→32, optionalSkills
      15→13, `semantic` 5; som blijft 100). Optionele `relatednessScore?` (0..1) op `MatchInput` +
      `FreelancerMatchSource`; bijdrage `round(relatednessScore * WEIGHTS.semantic)` als expliciete
      `semantic`-breakdown-component (patroon van `branche`). Positieve reason "Omschrijving sluit aan
      bij jouw profiel" vanaf de drempel (0.3), ná skills/branche. Nooit straffen op ontbrekende tekst.
- [x] **Cross-view consistentie (fix agent-review-blocker):** `jobProfileRelatedness(job, profile)`
      exporteert één canonieke, pure/deterministische relatedness (title+description ↔ headline+bio;
      bewust géén skill-namen — die zitten al in de skills-component en zouden per scherm kunnen
      verschillen). `scoreJobForFreelancer` leidt de relatedness zelf af uit die scalaire tekstvelden,
      tenzij de aanroeper hem expliciet meegeeft. Zo scoort elk scherm hetzelfde paar identiek. Eén
      drempel-constante (`SEMANTIC_HIGHLIGHT_THRESHOLD` uit matching.ts) i.p.v. drie duplicaten.
- [x] `src/components/match/match-breakdown.tsx` — `semantic`-rij ("Aansluiting"), alleen bij > 0.
- [x] Tekstvelden bijgeschakeld op de scoor-callers zodat de `semantic`-component overal vult:
      `opdrachten/[id]` (myFit; headline/bio + skill-namen), `kandidaten` (job.description + freelancer.bio),
      `franchise/dienst-detail` (freelancer.bio), `data/job-reach` (headline/bio), `job-alerts(-task)`
      (JobAlertJob.description + JobAlertFreelancer.headline/bio). `suggestions.ts`/`recommendations.ts`
      voeden de al berekende relatedness in de score; de tiebreaker blijft als secundaire sort.
- [x] Tests: `matching.test.ts` (semantic sum-invariant, grenzen 0..max, drempel-reason, `jobProfileRelatedness`,
      afgeleide==expliciete score, tekst-tilt-score); `suggestions.test.ts` (aansluitende tekst scoort
      strikt hoger dan geen overlap; parity-fixture meegetrokken). Gate: typecheck + lint + prettier (hele
      repo) + **test 2978** + build groen. Demo-seed-rankings kunnen licht verschuiven (gewenst effect).

## ADR — semantische matching: lokale embedder houden, pgvector parkeren (2026-07-03g)

ADR-0010 vastgelegd: deterministische lokale feature-hashing-embedder (`semantic.ts` + matcher-service)
blijft de bron van inhoudelijke gelijkenis; geen pgvector/vector-kolom nu (breekt gedeeld SQLite+Postgres-schema,
lost een niet-bestaand schaalprobleem op). Expliciete trigger vastgelegd om pgvector wél te bouwen. Backlog-item 1
in CURRENT_TASK.md geherformuleerd naar "semantiek als uitlegbare scorecomponent". Docs-only.

## UX — reactiebereidheid-context per openstaande reactie (ZZP'er) (2026-07-03f, main-basis `5710cc7`)

Op `/reacties` zag de ZZP'er bij een nog-onbesliste reactie wel de eigen wachttijd (#545), maar niet of
_deze opdrachtgever_ reacties überhaupt oppakt of laat liggen. Concurrenten geven kandidaten die geruststelling/
sturing (Malt/Temper/Deel); wij maken het verklaarbaar en eerlijk. Toegevoegd: een subtiel signaal per
openstaande reactie dat de opdrachtgever-brede reactiebereidheid duidt — hergebruikt hetzelfde geaggregeerde
signaal dat al op de opdracht-detail staat, maar gericht op de wacht-beslissing (doorwachten of verder kijken).

- [x] `client-responsiveness.ts` — pure `describeApplicantResponsiveness(responsiveness)` →
      `{tone:"good"|"warning", label} | null`. Geruststelling bij tone `good`, gekwantificeerde waarschuwing
      (`N% opgepakt`) bij `warning`; `null` bij `neutral`/`unknown` (dan voegt een boodschap niets toe).
- [x] `lib/data/client-responsiveness.ts` — `getClientResponsivenessForCompanies(companyIds)` →
      `Map<companyId, ClientResponsiveness>`, hergebruikt de single-variant per opdrachtgever (parallel);
      die begrenst de fetch al op DB-niveau met `take: MAX_APPLICATIONS` (geen onbegrensde findMany). Set is
      inherent klein. Alleen geaggregeerde tellingen — privacy by design.
- [x] `components/applications/applicant-responsiveness-note.tsx` — presentationele één-regel-noot (muted bij
      good, warning-kleur bij warning); rendert niets zonder beslissingswaarde.
- [x] `/reacties` — batcht de reactiebereidheid alleen voor nog-openstaande reacties (NEW/VIEWED/SHORTLIST,
      geen samenwerking) en toont de noot onder het bestaande wachttijd-signaal. `company.id` toegevoegd aan de
      select; allowlist-regel `unbounded-queries.test.ts` bijgewerkt (regelverschuiving door de imports).
- [x] Tests: `client-responsiveness.test.ts` (+5: good/warning-met-%/stale-warning/neutral-null/unknown-null;
      totaal 17). Gate: typecheck + lint + prettier (hele repo) + **test 2972** + build groen. PR #592.

## Ontwerp-lab — reeks 5: +10 concepten (nrs 41–50), totaal nu 50 (2026-07-03e, main-basis `bd488f9`)

Additieve uitbreiding van het publieke design-lab op `/ontwerp` (KERNREGEL: accumuleren, nooit vervangen).
Tien nieuwe, onderling en t.o.v. de bestaande 40 duidelijk onderscheidende designrichtingen, gebouwd door
4 parallelle builders op niet-overlappende bestanden; orchestrator wire de registry + route en draaide de poort.

- [x] Nieuwe concept-componenten `src/components/ontwerp/concepts/concept-41..50-*.tsx` (elk `use client`,
      leest `./mock`, dekt de zes kernschermen + berichten/documenten, alleen `--font-lab-*`-fonts, geen "AI"):
      41 **Beton** (neo-brutalisme verfijnd) · 42 **Helvetia** (Zwitserse typografie) · 43 **Aqua** (Frutiger
      Aero revival) · 44 **Grootboek** (green-bar kasboek) · 45 **Duim** (mobiel-first duimzone-app) · 46 **Palet**
      (command-first ⌘K-spotlight) · 47 **Ruimte** (spatial glas, donker) · 48 **Paspoort** (ID-document/guilloché/
      MRZ, verificatie als held) · 49 **Meter** (analoge SVG-instrumentcluster) · 50 **Handleiding** (docs-referentie).
- [x] `registry.ts` — 10 `ConceptMeta`-entries toegevoegd (append, bestaande niet aangeraakt); `[id]/page.tsx`
      — 10 imports + id→component-koppelingen toegevoegd. `docs/DESIGN-LAB.md` bijgewerkt (reeks 5 + trends, totaal 50).
- [x] Poort lokaal groen: `typecheck` ✓, `lint` ✓ (0 warnings), `prettier --check .` ✓, `test` ✓ (2967),
      `build` ✓ (exit 0). Onderzochte 2026-trends: neo-brutalisme/intentional-incompleteness, Swiss-typografie,
      Frutiger-Aero/Neo-Aero, ledger-dichtheid, thumb-zone mobile-first, command-palette-navigatie, spatial/
      visionOS-vibrancy, security-engraving (guilloché/MRZ), gauge-cluster-skeuomorfisme, technical-mono docs.

## UX — beschikbaarheid-op-startdatum-signaal voor de opdrachtgever (2026-07-03d, main-basis `fea6769`)

De opdrachtgever zag op `/kandidaten` en `/kandidaten/vergelijk` alleen een generieke agenda-samenvatting
("Agenda gedeeld" / "Beschikbaar t/m X") — niet of de kandidaat kán starten op de **startdatum van déze
opdracht**. Pidz/Temper/Zorgwerk gaten hier hard op (beschikbaar-voor-de-shift-datum). Nu een concreet,
verklaarbaar signaal, afgeleid uit de reeds opgehaalde beschikbaarheidsvensters (geen extra query, geen
schemawijziging, server-side waarheid).

- [x] `availability.ts` — pure `availabilityOnDate(windows, date)` → `AVAILABLE|LIMITED|UNAVAILABLE|NONE`
      (één bron voor de inclusieve-einddatum-logica; UNAVAILABLE domineert een overlappend inzetbaar venster).
- [x] `candidate-availability.ts` (nieuw) — `classifyStartFit(windows, jobStart)` → `available|limited|blocked|none|unknown`
      (`unknown` bij geen startdatum óf geen gedeelde agenda) + label-/short-label-/variant-maps
      (available=success, limited=warning, blocked=danger, none=muted). `CompareCandidate.startFit` toegevoegd (optioneel).
- [x] `/kandidaten`: `startDate` in de job-select; per kandidaat een badge "Startdatum <datum>: Beschikbaar/
      Niet beschikbaar/…" bij de agenda-regel (verbergt zich bij `unknown`).
- [x] `/kandidaten/vergelijk`: `startDate` in de job-select; de "Beschikbaarheid"-rij toont nu de start-fit-badge
      met de startdatum in de rij-hint (val terug op "Agenda gedeeld" als de opdracht geen startdatum heeft).
- [x] Tests: `candidate-availability.test.ts` (12) + `availability.test.ts` (+7 `availabilityOnDate`); allowlist-regel
      `unbounded-queries.test.ts` bijgewerkt (regelverschuiving door de extra select). Gate: typecheck + lint +
      prettier + **test 2967** + build groen. PR #590.

## Prod — HTTP-API e-mailadapter (Resend) achter `EMAIL_DRIVER=resend` (2026-07-03c, main-basis `523a496`)

Het e-mailkanaal was **SMTP-only**, maar Railway (de productie-host) blokkeert uitgaande SMTP-poorten
(25/465/587) op de meeste plannen — daar levert `smtp` niets af. Toegevoegd: een tweede echte driver die
via de **Resend HTTP-API** (`fetch` naar `api.resend.com`, géén SDK-dependency) verzendt, zelfde
driver-patroon als noop/smtp en de Upstash-rate-limit-adapter. Inert zonder secret; app draait door.

- [x] `ResendMailSender` in `src/lib/services/mail-sender.ts` — POST `/emails`, Bearer-auth, `text` altijd,
      `html` optioneel; PII-veilige foutmelding bij non-2xx (geen adres/onderwerp gelogd). Vereist
      `RESEND_API_KEY` + `EMAIL_FROM`, anders duidelijke fout. `isMailDeliveryConfigured()` telt nu smtp+resend.
- [x] Env-validatie (`src/lib/env.ts`): `EMAIL_DRIVER` enum uitgebreid met `resend`; `RESEND_API_KEY`
      toegevoegd; superRefine eist key+afzender bij `EMAIL_DRIVER=resend` (geen halve activering).
- [x] De twee hardcoded `EMAIL_DRIVER === "smtp"`-checks in `admin/import/actions.ts` gebruiken nu
      `isMailDeliveryConfigured()` (welkomstmails werken ook onder resend).
- [x] Tests: `mail-sender.test.ts` (+7: driver-keuze, ontbrekende secrets, POST-payload, html weglaten,
      non-2xx-fout, helper) en `env.test.ts` (+2). `.env.example` + MENSENWERK §2/§7 bijgewerkt.
- Resterend mensenwerk: Resend-account + domeinverificatie (DNS/SPF/DKIM), `RESEND_API_KEY` + `EMAIL_FROM`
  - `EMAIL_DRIVER=resend` in de Railway-secrets. Gate: typecheck + lint + prettier + test + build groen.

## Security/privacy-audit — FavoriteFreelancer-erasure + modelovereenkomst-rate-limit (2026-07-03b, main-basis `cabe0f0`)

Auditronde (orchestrator Opus 4.8 + 2 parallelle security/privacy-subagents, niet-overlappend). IDOR/
cross-tenant over de nieuwste server actions: **geen nieuwe gaten** (cascade-acties herleiden owner/tenant
uit een verse DB-rij; `assertSameTenant` overal; #582-branchefilter puur additief). Twee bevindingen
gefixt (rood→groen); drie geparkeerd. Kader: OWASP A01/A04/A09 + AVG art. 5/15/17/30.

- [x] **AVG art. 17 + 15/20 — `FavoriteFreelancer.note`** (privé CLIENT-notitie over een ZZP'er) ontbrak in
      `anonymizeUser` (`admin/gebruikers/actions.ts`) én in `buildAccountExport` (`account-export.ts`). `Company`
      wordt geüpdatet, niet verwijderd → geen cascade → notitie bleef attribueerbaar staan. Erasure:
      `favoriteFreelancer.updateMany({ where: { company: { userId } }, data: { note: null } })`. Export: strikt-
      `select`-query (alleen `note`/`createdAt`, geen `freelancerProfileId`). Tests: `anonymize-erasure.test.ts`
  - `account-export.test.ts`.
- [x] **A04 / AVG art. 5 — rate-limit op `GET /api/samenwerkingen/[id]/modelovereenkomst`**. On-demand
      DBA-modelovereenkomst-PDF (cross-party PII) miste als enige PDF-route de `documentPdfRateLimiter` die de
      zusterroutes in PR #586 kregen. Toegevoegd: `enforceRateLimit(documentPdfRateLimiter, actor.id)` ná auth,
      vóór de DB-query. Test: `modelovereenkomst-ratelimit.test.ts`.
- Geparkeerd (zie `docs/SECURITY-PRIVACY-BACKLOG.md`, ronde 2026-07-03b): support/helpdesk-PII ontbreekt in
  het verwerkingsregister (MIDDEL, art. 30); twee LAAG-items rauwe `console.error`-PII (`bedrijf/actions.ts`,
  `tasks/run-all`, `wachtwoord-vergeten/actions.ts`).
- Gate: typecheck + lint + prettier + **test 2942** + build groen.

## Persona-sweep run 7 — geen gaten (2026-07-03, main-basis `edcb354`)

Kritische-gebruiker-sweep over 4 rollen (ZZP'er/opdrachtgever/franchiser/admin), verse prod-build +
seed op ephemere `qa.db`, Playwright/Chromium. **DOEL 1:** ADMIN keurt een verificatie goed →
server-side geverifieerd (`SUBMITTED` 6→5, `VERIFIED` 24→25, `verifiedAt` gezet, `CREDENTIAL_VERIFIED`-
audit + "Certificaat goedgekeurd"-notificatie); 58 schermen HTTP 200, nul echte 500's. **DOEL 1b:**
`/acties` per rol klopt tegen de DB (admin 6 review-taken = 6 SUBMITTED; client "3 nieuwe reacties" = 3
NEW; franchiser terecht leeg). **DOEL 2 (~42 probes):** priv-esc → redirect, IDOR/cross-partij/cross-
tenant → soft-404, document-privacy 200-eigenaar/403-vreemd, exports/dba-dossier 403, XSS 0-uitvoering,
garbage 404. **Geen gaten.** Details: `docs/PERSONA-SWEEP-BACKLOG.md` (run 7). Geen codewijziging.

## Security/hardening — rate-limit op financiële/PDF-exports (2026-07-03)

Dicht het geparkeerde SECURITY-PRIVACY-BACKLOG-item [MIDDEL · A04]: `exportRateLimiter` bestond,
maar was alléén op `/api/account/export` bedraad. De overige CSV-/PDF-/dossier-routes doen zware
DB-joins + on-demand generatie zonder per-gebruiker-rem (grootste amplificatie:
`/api/admin/export/invoices` dumpt álle platformfacturen met tegenpartij-PII per call). Ownership/
authz was intact — dit is availability/defense-in-depth.

- [x] **`lib/rate-limit-guard.ts`** — gedeelde `enforceRateLimit(limiter, key, message?)`: één
      rem-en-respons voor alle download-routes → 429 (met `Retry-After`-header in seconden) of `null`.
- [x] **`lib/rate-limit.ts`** — nieuwe `documentPdfRateLimiter` (default 60/uur, env
      `DOCUMENT_PDF_RATE_LIMIT`) voor per-document PDF/dossier-generatie (ruim boven normaal gebruik,
      stopt een scripted loop).
- [x] **Bulk CSV/JSON-exports → `exportRateLimiter` (5/uur), per-route-key** (geen kruis-starvatie
      van legit multi-exports): `admin/export/invoices`, `administratie/{export,btw,openstaand}`,
      `diensten/export`, `prestaties/export`, `prognose/export`, `verplichtingen/export`,
      `admin/audit/export`, `admin/avg/export`.
- [x] **Per-document PDF/dossier → `documentPdfRateLimiter` (60/uur, actor-key):**
      `facturen/[id]/pdf`, `prestaties/[id]/pdf`, `admin/facturatie/[id]/pdf`,
      `samenwerkingen/[id]/dossier`, `samenwerkingen/[id]/dba-dossier`. Check zit ná auth, vóór de
      DB/generatie; de ownership-/denied-audit-keten blijft ongewijzigd.
- [x] **`account/export`** hergebruikt nu dezelfde helper (consistentie + `Retry-After`).
- Tests: `rate-limit-guard.test.ts` (5 cases: allowed→null, over-limiet→429 + `Retry-After`, per-key,
  eigen bericht) + `admin/export/invoices/route.test.ts` (integratie: 2e call → 429, geen query/audit).
  Geen schemawijziging. Gate groen: typecheck + lint + prettier + test (2937) + build. PR #586.

## Persona-sweep run 6 — GEEN GATEN GEVONDEN (2026-07-03)

Kritische-gebruiker-sweep over 4 rollen op `5ee4d74` (verse build + seed + productie-server,
Playwright/Chromium). **DOEL 1:** echte end-to-end mutatie server-side geverifieerd (FREELANCER
reageert op `job-8` → `Application` `NEW` in DB + `/reacties`; reactie intrekken → `WITHDRAWN`,
geauditeerd). ~40 schermen 200, nul 500's. **DOEL 1b:** `/acties` per rol kruis-gecheckt tegen
`next-actions.ts` + echte DB-staat — alle acties correct, rol-geïsoleerd, niets tegenstrijdigs.
**DOEL 2 (~60 adversariële probes):** privilege-escalatie → redirect; IDOR/cross-partij + cross-tenant
→ soft-404 (geen leak); document-privacy → 403 voor niet-eigenaar; garbage-id's → 404/soft-404 (nul
500's); XSS → niet ge-echood; malicieuze factuur-input → server-side geweigerd. Geen enkel gat.
Alleen doc-update: `docs/PERSONA-SWEEP-BACKLOG.md` (run 6-entry).

## ZZP'er — "Mijn vakgebied"-quickfilter op /opdrachten (2026-07-03)

Open UX-walkthrough-punt (2026-07-02, "kleinere punten"): de ZZP'er-opdrachtenlijst was niet op
profielbranche te filteren — een zorg-ZZP'er zag IT-opdrachten als ruis. Nieuw: een één-klik
"Mijn vakgebied"-quickfilter beperkt de lijst tot de branches uit het eigen profiel. Sluit direct
aan op de bestaande matching-scoring (die branche al weegt): scoring rangschikt, de quickfilter
schoont de lijst op.

- [x] **`lib/jobs.ts`** — `JobFilters.mine: boolean` + parse `params.mine === "1"` in
      `normalizeJobFilters` (exact-match; `"0"`/`"true"` → false). +1 unit-test (11 in `jobs.test.ts`).
- [x] **`opdrachten/(index)/page.tsx`** (BrowseJobs, FREELANCER/ADMIN) — na de profiel-fetch: expliciete
      `industryId` wint (meest specifiek), anders `mine` → `where.industryId = { in: profielbranches }`.
      Zonder profielbranches (o.a. ADMIN) doet `mine` niets. `myIndustryCount` doorgegeven aan de filters.
- [x] **`components/jobs/job-filters.tsx`** — "Mijn vakgebied"-toggle-chip (alleen bij
      `myIndustryCount > 0`), `aria-pressed`, met uitleg-regel; branche-`Select` uitgeschakeld zolang
      de quickfilter actief is (mine overkoepelt de expliciete branchekeuze).
- Server-side waarheid (Prisma-`where`), geen extra query (profielbranches al geladen), geen
  schemawijziging. Gate groen: typecheck + lint + prettier (hele repo) + test (2931) + build. PR #582.

## Productie-cron voor /api/tasks/run-all — geplande workflow (2026-07-03)

Productie-rijpheid (MENSENWERK §10, code-kant). Tot nu was **alleen** de dagelijkse expiry-check
gewired (`expiry-check.yml`, één taak); de overige 15 taakrunners draaiden **alleen bij handmatige
aanroep** in productie. Nieuw: `.github/workflows/run-all-tasks.yml` roept elke dag om 05:00 UTC
`POST /api/tasks/run-all` aan met `Authorization: Bearer $CRON_SECRET`, waardoor **alle 16 runners**
idempotent draaien (dunning/PAST_DUE, betaal-/concept-factuur-/BTW-herinneringen, DBA-monitor,
job-alerts/-engagement, ZZP-lidmaatschap, prestatie-grace/-goedkeuring/-indien-reminders,
dispuut-reminders, beoordelingen-onthulling, push-delivery, notificatie-digest, monitor).

- Mirror van het bewezen `expiry-check.yml`-patroon; **inert zonder secrets** (skip zonder falen).
- `concurrency`-guard tegen overlappende runs; faalt de job bij transportfout (HTTP≠200) én bij een
  taakfout in de body (`ok:false` via `jq`), zodat fouten zichtbaar worden in Actions.
- Cadans daglijks: de digest bundelt notificaties ouder dan 24u tot één e-mail/dag; idempotentie
  laat een andere cadans toe. Dekt óók de expiry-check (die overbodig maar onschadelijk blijft).
- Resterend mensenwerk: repo-secrets `RUN_ALL_TASK_URL` + `CRON_SECRET` zetten (§7 / MENSENWERK §10).
- Bestand: `.github/workflows/run-all-tasks.yml`. Geen code-/schemawijziging.

## Security/privacy-audit — AVG art. 17 erasure-gaten gedicht (2026-07-03)

Audit-ronde (orchestrator Opus 4.8 + 3 parallelle security-subagents op niet-overlappende
oppervlakken: recente server actions, alle API-routes/upload/SSRF/headers, AVG-erasure vs. schema).
Server actions & API-routes: geen KRITIEK/HOOG IDOR, cross-tenant, SSRF of path-traversal. De
nieuwe tweezijdige double-blind beoordelingen expliciet schoon (PENDING_REVEAL lekt nergens vóór
onthulling). Drie art.-17-gaten (recht op verwijdering onvolledig) gefixt in `anonymizeUser`:

- [x] **`Application.note`** (interne kandidaatnotitie van de CLIENT) → `updateMany({ note: null })`
      gescopet op `job.company.userId`.
- [x] **`ShiftHandoff.decisionNote`** (afwijsnotitie van de FRANCHISER/beslisser) → `null`, gescopet
      op `decidedByUserId` (spiegel van de bestaande reason-redactie op de aanvragerskant).
- [x] **`LeadContact.body`** (bel-/gespreksnotities van de FRANCHISER) → redactiestring (niet-null
      veld), gescopet op `createdById`.
- Bestanden: `src/app/(protected)/admin/gebruikers/actions.ts` + `anonymize-erasure.test.ts`
  (12→15 tests, rood→groen). Rest geparkeerd in `docs/SECURITY-PRIVACY-BACKLOG.md` (ronde
  2026-07-03): NoShowReport/rejectionReason-erasure (DPO-afweging), export-uitbreiding,
  FavoriteFreelancer.note, rate-limit op financiële/PDF-exports.

## Ontwerp-lab — reeks 4: +10 concepten (31–40) op /ontwerp (2026-07-03)

Accumulerende galerij: 10 nieuwe top-1% redesign-concepten toegevoegd bovenop de bestaande 30 —
`/ontwerp` toont nu **40 richtingen** naast elkaar. Geen bestaand concept aangeraakt; puur additief.

- [x] **10 nieuwe concept-componenten** `src/components/ontwerp/concepts/concept-31..40-*.tsx`
      (client-only, elk de 6 kernschermen uit gedeelde `mock.ts`, complete loading/empty/error-states,
      statusbadges label+icoon, toegankelijk, responsive, geen "AI"-token):
      31 Perron (split-flap vertrekbord, mechanisch) · 32 Parel (iriserend holografisch/chroom, licht) ·
      33 Zegel (letterpress & lakzegel) · 34 Redactie (datajournalistiek/geannoteerde charts) ·
      35 Deco (art-deco geometrie/goud) · 36 Schemer (gouden uur/warm verloop) ·
      37 Isometrie (axonometrisch 3D) · 38 Spectrum (duotone jaaroverzicht/bold type) ·
      39 Botanie (herbarium/botanisch) · 40 Kwadrant (interactieve beslismatrix/scatter).
- [x] **registry.ts** — 10 `ConceptMeta`-entries toegevoegd (append; bestaande 01–30 ongemoeid).
- [x] **`app/ontwerp/[id]/page.tsx`** — imports + id→component-koppeling voor 31–40 toegevoegd
      (append). Galerij-index groeit automatisch mee (mapt over `CONCEPTS`).
- [x] **docs/DESIGN-LAB.md** bijgewerkt met reeks 4 + onderzochte 2026-trends (holografisch/iriserend,
      mechanisch/retro-futurist, letterpress/tactile-rebellion, datajournalistiek/micrographics,
      art-deco-revival, gouden-uur gradient-craft, isometrisch 3D, dopamine-duotone, biofiel/botanisch,
      analytische beslismatrix).
- Gate groen: typecheck + lint + prettier (hele repo) + test (2931) + build (alle 40 `/ontwerp/<id>`
  SSG-pagina's gegenereerd). Bouwwerk gedelegeerd aan 4 parallelle builder-subagents op niet-
  overlappende bestanden; orchestrator koppelde registry + route en draaide de poort.

## Ontwerp-lab — reeks 3: +10 concepten (21–30) op /ontwerp (2026-07-03)

Accumulerende galerij: 10 nieuwe top-1% redesign-concepten toegevoegd bovenop de bestaande 20 —
`/ontwerp` toont nu **30 richtingen** naast elkaar. Geen bestaand concept aangeraakt; puur additief.

- [x] **10 nieuwe concept-componenten** `src/components/ontwerp/concepts/concept-21..30-*.tsx`
      (client-only, elk de 6 kernschermen uit gedeelde `mock.ts`, werkende marktplaats-filter +
      empty-state, statusbadges label+icoon, toegankelijk, responsive, geen "AI"-token):
      21 Atlas (cartografisch/kaart-first) · 22 Dossier (neo-skeuomorf archief + lakzegel) ·
      23 Blauwdruk (technische blueprint) · 24 Console (terminal/TUI phosphor) ·
      25 Reliëf (Soft-UI/neumorfisme 2.0) · 26 Perforatie (ticket/instapkaart) ·
      27 Courant (broadsheet-krant) · 28 Riso (risograph duotone) ·
      29 Signaal (hi-vis workwear) · 30 Vitrine (museale curatie).
- [x] **registry.ts** — 10 `ConceptMeta`-entries toegevoegd (append; bestaande 01–20 ongemoeid).
- [x] **`app/ontwerp/[id]/page.tsx`** — imports + id→component-koppeling voor 21–30 toegevoegd
      (append). Galerij-index groeit automatisch mee (mapt over `CONCEPTS`).
- [x] **docs/DESIGN-LAB.md** bijgewerkt met reeks 3 + onderzochte 2026-trends (blueprint/drafting,
      terminal/raw, neo-skeuomorphism & Soft-UI-revival, spatial/kaart-first, risograph/duotone,
      broadsheet, ticket-skeuomorfie, workwear-signaal, museale curatie).
- Gate groen: typecheck + lint + prettier (hele repo) + test (2927) + build (alle 30 `/ontwerp/<id>`
  SSG-pagina's gegenereerd). Bouwwerk gedelegeerd aan 4 parallelle builder-subagents op niet-
  overlappende bestanden; orchestrator koppelde registry + route en draaide de poort.

## ZZP'er — gevraagde-vaardigheden-signaal op /profiel/bewerken (2026-07-03)

Spiegel van het certificaat-vraagsignaal (`credential-demand`), maar voor vaardigheden: over de open
opdrachten die de ZZP'er mag zien, welke vereiste skills staan nog niet in zijn profiel — gerangschikt
op hoeveel opdrachten elke skill zou ontsluiten. Een verklaarbare nudge om het skills-veld te
vervolledigen zodat de matching (die skills weegt) meer opdrachten oplevert. Het signaal staat direct
boven het Vaardigheden-formulier, zodat de actie één scroll weg is.

- [x] **`lib/skill-demand.ts`** (puur, geen schemawijziging) — `computeSkillDemand(requirements,
ownedSkillIds)` → `{ gaps: [{ skillId, name, opportunityCount }], blockedOpportunities }`.
      Skills zijn binair (geen status/verloop zoals certificaten); distinct-job-telling per skill via
      Set (dedupliceert dubbele (job, skill)-rijen defensief), sortering opportunityCount desc → naam
      asc (nl, case-insensitief) → skillId. 7 unit-tests.
- [x] **`lib/data/freelancer-skill-demand.ts`** — `getSkillDemandRequirements(userId)` haalt de
      vereiste `JobSkill` (`required: true`) op van de zichtbare open opdrachten waarop nog niet is
      gereageerd; tenant-gesloten (`visibleJobsWhereForTenant`), begrensd op SCAN_LIMIT=100. Spiegelt
      exact de credential-demand-fetcher. Server-side waarheid, geen extra schema.
- [x] **`components/profile/skill-demand-card.tsx`** — chip-lijst (top 6 + "+N meer"), verbergt zich
      zonder gaten; read-only. Gewired op `/profiel/bewerken` tussen marktband en het formulier.
- Gate groen: typecheck + lint + prettier + test (2927) + build. Allowlist-line-shift in
  `unbounded-queries.test.ts` bijgewerkt (pre-existing skill/industry-findMany's).

## UX-offensief — volledige walkthrough-backlog afgewerkt in 18 PR's (2026-07-02/03)

Vervolg op de UX-walkthrough (83 schermen, 4 rollen, docs/UX-WALKTHROUGH-2026-07-02.md): álle
bevindingen gefixt via parallelle builder-agents in eigen worktrees, elk increment door de
6-checks-poort (#557–#574, alle gemerged):

- [x] **Bugs**: dubbele tellers + seed-drift + "-100%"-trend (#557) · dd-mm-jjjj-hint op 11
      formulieren via gedeelde DateInput (#558) · openstaand-tegenspraak (#560).
- [x] **Navigatie**: zijbalk standaard uitgeklapt met labels, sectiekoppen per rol en
      wachtrij-tellers; voorkeur in cookie (#559).
- [x] **Terminologie**: Urenstaten, Uren goedkeuren, Reacties, ZZP'ers vinden, samenwerking
      (i.p.v. werkproces), Dienst-overnames, Document toevoegen + type-afhankelijke
      placeholders; incl. i18n + e2e (#564; #574 ORT-mensentaal).
- [x] **Statuswaarheid**: één inzetbaarheids-bron zzp (dashboard+profiel, #570);
      franchiser-next-actions + roster-badge + dekkingsprognose (#566);
      vervullingsgraad-context (#573).
- [x] **Matching-vertrouwen**: branche-factor (-25/cap 60) in álle 8 scoring-paden met
      transparante breakdown-regel; ringkleur ↔ score; herlabel profiel-matches (#561).
- [x] **Bemiddelaar-werkwoorden**: ZZP'er voordragen op open dienst (#562) · zelf gesprek
      starten (#563) · fee-percentage + volume/fee-splitsing (#565) · leads-dagen-stil +
      kleurkiezer (#572).
- [x] **Beslisacties**: compacte kandidaten-triage + vergelijk-keuzeknoppen (#569) ·
      VOG-herinnering, "Urenstaat indienen", no-show secundair + status-zin (#571) ·
      admin-gebruikersdossier (#573).
- [x] **Formulieren**: DBA-check in mensentaal + oordeel-na-input, modelovereenkomst
      "Automatisch", concept/publiceren-knoppen (#568).
- [x] **Admin-wachtrijen**: inline bewijsstuk-preview, afwijzen-achter-klik, support-triage,
      compleet acties-centrum (#567). Login-uitleg in gewone taal (#572).
- Proces-les (memory): parallelle builders ALTIJD in eigen git-worktree — gedeelde working tree
  wist elkaars werk. agent-review ving 3 échte bugs vóór merge (breakdown-som,
  SUBMITTED-als-ontbrekend, gemiste e2e-specs).

## Kwaliteitsronde — review van alle code sinds 15-6, 10 verbeteringen (2026-07-02)

Vier parallelle reviewers (lib-domein, app-routes, API/cron-security, components) over de
~169 commits sinds de model-switch van 15-6 (#377). Oordeel: geen blockers — authz-ketens,
transitie-maps en query-bounds consequent op orde. Tien geverifieerde SAFE-verbeteringen toegepast:

- [x] **Cron-starvation**: `orderBy` (oudste eerst) op de gecapte queries in
      `dispute-reminders-task.ts` en `performance-approval-reminders-task.ts`; defensieve
      `take: 2000` + `orderBy expiresAt` in `expiry-task.ts`.
- [x] **Audit-parity**: geweigerde inzage van de modelovereenkomst-PDF logt nu
      `MODEL_AGREEMENT_ACCESS_DENIED` (zoals de dossier-routes); label + regressietest bijgewerkt.
- [x] **Kalenderdag-fix**: `soonestOpenDays` in `franchise/dekkingsprognose.ts` rekent nu
      middernacht-tot-middernacht (was wall-clock-floor → "0 dagen" 's avonds voor een dienst
      morgenochtend); 2 nieuwe tests.
- [x] **Perf opdracht-detail**: concurrentie-telling start parallel met de externe routing-call
      (`opdrachten/[id]/page.tsx`); `Date.now()` per request i.p.v. per rij op `/kandidaten`.
- [x] **Dedup components**: gedeelde `BehaviorToneBadge` + `LevelChip` in
      `src/components/jobs/signal-chips.tsx`; 3 gedragsblokken + 2 level-kaarten omgezet
      (3× identieke TONE-maps verwijderd).
- [x] **UI-robuustheid**: bestandsnaam in `file-input.tsx` kan weer truncaten (min-w-0/flex-1);
      doc-note op async `PageHeader` (niet bruikbaar vanuit client components).
- Geparkeerd (RISKY, backlog): dashboard-dubbelfetch `clientCredentialAlerts`, per-job-fanout in
  `suggestions.ts`, `savedJobIds`-batching op /opdrachten.
- Gate groen: typecheck + lint + prettier + test + build.

## Opdrachtgever — opdracht dupliceren als startpunt voor een nieuwe (2026-07-02)

Vertaalt de "duplicate"-friction-reducer van Linear/Stripe/GitHub naar de opdrachtgever: terugkerend/
seizoenswerk plaatsen zonder alles opnieuw te typen. Één klik neemt titel, omschrijving, tarief, skills,
certificaateisen, DBA-antwoorden en modelovereenkomst over in een vers **concept**; reacties, status en
startdatum lekken nooit mee.

- [x] **`lib/job-duplicate.ts`** (puur, geen schemawijziging) — `buildJobDuplicateInitial(job)` vormt een
      bron-opdracht om tot de `JobFormInitial` van de nieuwe-opdracht-form **zonder `id`** (zo maakt de form
      een nieuwe opdracht i.p.v. de bron te wijzigen), met lege `startDate` en een `duplicateJobTitle`
      "(kopie)"-titel (dubbel-suffix-guard, hoofdletterongevoelig, ingekort tot `JOB_TITLE_MAX=160` — spiegelt
      `jobSchema.title`). Skills/certificaateisen gesplitst in verplicht/optioneel. 12 unit-tests.
- [x] **`/opdrachten/nieuw?from=<id>`** — server-side ophalen van de bron + **ownership-poort** (`owns`);
      niet-eigen/onbekende `from` valt stil terug op een leeg formulier (geen lek, `from` is een gemak, geen
      autorisatiegrens). Kop "Opdracht dupliceren" + rustige overgenomen-uit-notitie bij een geldige bron.
- [x] **"Dupliceren"-knop** naast "Bewerken" op de opdracht-detail (alleen eigenaar) → `/opdrachten/nieuw?from=<id>`.
- Bestanden: `src/lib/job-duplicate.ts` (+ `.test.ts`), `src/app/(protected)/opdrachten/nieuw/page.tsx`,
  `src/app/(protected)/opdrachten/[id]/page.tsx`, allowlist-regels (line-shift) in `unbounded-queries.test.ts`.
  Gate: typecheck + lint + prettier + test (**2808 groen**) + build groen.

## Ontwerp-lab — reeks 2: +10 concepten (nrs 11–20) op /ontwerp (2026-07-02)

Additieve uitbreiding: de galerij accumuleert nu (10 → 20). Reeks 1 (01–10) blijft ongewijzigd
staan; er is niets overschreven of verwijderd. Tien nieuwe, onderscheidende richtingen op basis van
verse 2026-research (glasmorfisme-met-diepte, verfijnd neo-brutalisme, whitespace-maximalisme/
calm-luxe, dark-mode-first/OLED, command-palette-als-standaard, mobiel-first/thumb-zone, aurora-mesh,
Zwitsers monochroom, warm-humanist, journey/timeline). Gebouwd door 4 parallelle workers op
niet-overlappende bestanden; orchestrator heeft alleen TOEGEVOEGD aan `registry.ts` + `[id]/page.tsx`.

- [x] **10 nieuwe concepten** (`concept-11-terra.tsx` … `concept-20-karbon.tsx`):
      11 Terra (warm-humanist organisch), 12 Glas (glasmorfisme 2.0), 13 Prisma (verfijnd neo-brutalisme),
      14 Raster (Zwitsers monochroom), 15 Zenit (mobiel-first app-shell), 16 Aurora (aurora/mesh-verloop),
      17 Kanaal (command-first ⌘K-spotlight), 18 Kompas (reis/tijdlijn wayfinding), 19 Puur (whitespace-
      maximalisme), 20 Karbon (OLED-donker high-contrast). Elk: volledige app-shell, alle 6 kernschermen,
      empty-/interactie-states, a11y (aria/focus-visible/tabular-nums), Nederlands, geen "AI".
- [x] **Wiring (additief)**: `registry.ts` (10 nieuwe ConceptMeta APPEND), `[id]/page.tsx` (10 imports +
      id→component APPEND), `ontwerp/layout.tsx` (5 fonts toegevoegd), `ontwerp/page.tsx` (kop count-driven).
      Bestaande entries/koppelingen ongemoeid.
- [x] **Docs**: `docs/DESIGN-LAB.md` (reeks-2-status + trends), dit PROGRESS-blok.
- Totaal nu **20 concepten** klikbaar op `/ontwerp`.

## Ontwerp-lab — verse set v3: 10 nieuwe top-1% concepten op /ontwerp (2026-06-25)

Volledige, verse vervanging van de v2-set (Atlas…Onyx) door tien sterkere, onderscheidende
redesign-richtingen op basis van verse 2026-research (twee dominante esthetieken: techno-futurist
dark vs. editorial crème; plus bento-grid, calm interfaces, dopamine-kleur, claymorphism,
data-dichtheid en accessibility-als-esthetiek). Gebouwd door 4 parallelle workers op
niet-overlappende bestanden; orchestrator heeft geïntegreerd, oude set verwijderd en de poort gedraaid.

- [x] **10 nieuwe concepten** (`src/components/ontwerp/concepts/concept-01-veld.tsx` … `concept-10-bastion.tsx`):
      01 Veld (bento-grid modulair), 02 Folio (redactioneel luxe), 03 Helder (toegankelijk hoog-contrast),
      04 Tij (kalme interface), 05 Beurs (data-dicht handelsterminal), 06 Klei (claymorphism),
      07 Puls (dopamine kleurblok), 08 Nebula (techno-futurist cyber-grid), 09 Index (database-werkblad),
      10 Bastion (vertrouwen-fintech, marine & messing). Elk: volledige app-shell, alle 6 kernschermen,
      werkende marktplaats-filter + empty-state, a11y (aria/focus-visible/tabular-nums), Nederlands, geen "AI".
- [x] **Wiring**: `registry.ts` (metadata 10 richtingen), `[id]/page.tsx` (route-map), oude 10 conceptbestanden verwijderd.
- [x] **Docs**: `docs/DESIGN-LAB.md` (richtingen-tabel + trends → v3).
- Gate groen: typecheck + lint + prettier + test (2796) + build (alle 10 SSG: /ontwerp/01..10). Viewbaar op `/ontwerp`.

## Opdrachtgever — "beslis nu"-signaal per kandidaat op /kandidaten (2026-06-25)

Vertaalt de "binnen uren"-liquiditeit van Pidz/Temper/Zorgwerk naar onze verklaarbare kant: de
opdrachtgever krijgt een rustige nudge wanneer een nog-onbesliste reactie te lang ligt — het hardst
voor de béste kandidaten, want die raken elders aan de slag. Spiegel van het ZZP'er-wachttijdsignaal
(`application-wait.ts`, #545), maar gewogen naar matchkwaliteit i.p.v. enkel de fase.

- [x] **`lib/candidate-decision.ts`** (puur, geen schemawijziging) — `summarizeCandidateDecision({status,
matchScore, createdAt, hasCollaboration}, now)` → `{daysWaiting, tier, attention, urgency}` of `null`
      bij besloten/samenwerking. `candidateTier` klasseert op `STRONG_MATCH_MIN=70`/`MODERATE_MATCH_MIN=50`
      (ontbrekende score = bescheiden). Omgekeerd gewogen geduld `DECISION_PATIENCE_DAYS`
      (strong 2 / moderate 4 / modest 8 dagen): hoe sterker de match, hoe sneller beslissen. Urgency
      high/medium/low per klasse. `summarizeCandidatesAwaitingDecision` telt de aandacht-vragende set +
      de sterke subset voor de strip. `createdAt` in de toekomst → 0 dagen (nooit negatief).
- [x] **UI op `/kandidaten`** — tellende warning-strip ("N kandidaten wachten op je beslissing, waaronder
      M sterke matches die je elders kunt verliezen") boven de lijst (alleen zonder statusfilter) + per-kaart
      nudge (alleen bij `attention`): sterke match toont de dag-aftelling + "beslis nu"-tekst (warning),
      overige bescheidener. Afgeleid uit de reeds opgehaalde lijst (geen extra query), één gedeelde `now`.
- Bestanden: `src/lib/candidate-decision.ts` (+ `.test.ts`, 11 tests), `src/app/(protected)/kandidaten/page.tsx`,
  allowlist-regel in `src/lib/unbounded-queries.test.ts` bijgewerkt. Gate: typecheck + lint + prettier +
  test (**2796 groen**) + build groen.

## Productie-rijpheid — gedeelde rate-limit-store (Upstash Redis REST) achter env-flag (2026-06-25)

Sluit MENSENWERK §0b **H-2**: de rate-limiters waren per-proces in-memory; bij meerdere Railway-
instances golden de limieten per instance. De `RateLimitStore`-interface is nu echt pluggbaar.

- [x] **`UpstashRateLimitStore`** (`src/lib/rate-limit.ts`) — gedeelde, durable store via de Upstash
      Redis REST-API (geen extra SDK-dependency; praat via `fetch`, zelfde aanpak als de Mollie-
      provider). Fixed-window in één atomaire pipeline: `INCR` + `PEXPIRE … NX` + `PTTL`. Genamespacete
      keys (`rl:…`). **Fail-open** bij Redis-storing (logt de fout) zodat een blip login/registratie
      niet platlegt — beschikbaarheid boven een tijdelijk zwakkere limiet.
- [x] **Async store-interface** — `RateLimitStore.consume`/`reset` en `RateLimiter.check`/`reset` zijn
      nu async (alle 11 call-sites awaiten; draaiden al in async-context). `MemoryRateLimitStore` blijft
      de veilige default. `RateLimiter` kreeg een **namespace** per limiter (login:/register:/… ) zodat
      tellers van verschillende limiters elkaar nooit raken in een gedeelde store.
- [x] **`createRateLimitStore()`-factory** + env: `RATE_LIMIT_STORE=memory|upstash` +
      `UPSTASH_REDIS_REST_URL`/`_TOKEN`. Env-validatie eist de twee secrets af bij `upstash` en
      waarschuwt in productie zolang hij op `memory` staat. `.env.example` bijgewerkt.
- Bestanden: `src/lib/rate-limit.ts`, `src/lib/rate-limit.test.ts` (+Upstash/factory/namespace-tests),
  `src/lib/env.ts`, `src/lib/env.test.ts`, `.env.example`, MENSENWERK §0b/§7. Call-sites (await):
  `src/auth.ts`, `src/lib/applications-create.ts`, `src/app/vertrouwen/[…]/page.tsx`,
  `src/app/wachtwoord-vergeten/actions.ts`, `src/app/register/actions.ts`,
  `src/app/api/account/export/route.ts`, `src/app/(protected)/{berichten,documenten,certificaten}/actions.ts`.
  Gate: typecheck + lint + prettier + check:env + test (**2785 groen**) + build groen.
- Resterend mensenwerk: Upstash-Redis (EU-regio) aanmaken, REST-URL/token in Railway-secrets,
  `RATE_LIMIT_STORE=upstash` zetten.

## Security-/privacy-audit ronde 2026-06-25b — dossier-auditplicht + 2 AVG-erasure-gaten (2026-06-25)

Audit: orchestrator (Opus 4.8) + 4 parallelle Opus-subagents (API-routes, tenant-isolatie, non-admin
actions, AVG/anonimisering). Kader OWASP Top 10 + AVG art. 5/15/17/30. Drie bevindingen volledig gefixt
(rood→groen); de rest geparkeerd in `docs/SECURITY-PRIVACY-BACKLOG.md` (ronde 2026-06-25b).

- [x] **MIDDEL · A09/AVG art. 30** — `GET /api/samenwerkingen/[id]/dossier` en `/dba-dossier` logden de
      geweigerde inzage (403) niet, anders dan `/api/documents/[id]`. IDOR-enumeratie op collaboration-id's
      was onzichtbaar in het auditspoor. Fix: `DOSSIER_ACCESS_DENIED`/`DBA_DOSSIER_ACCESS_DENIED`-audit
      (IP/UA) op het 403-pad + IP/UA op de export-audits; NL-labels. Test: `dossier-routes-audit.test.ts`.
- [x] **HOOG · AVG art. 17** — `anonymizeUser` wiste `AvailabilityWindow.note` niet (vrije tekst, kan
      medische/persoonsdetails bevatten; geen cascade want profiel wordt geüpdatet). Fix: `note`→null in
      de anonimiseringstransactie.
- [x] **HOOG · AVG art. 17** — idem `Collaboration.disputeReason` bij een open dispuut; attributie via het
      `DISPUTE_OPENED`-domeinevent (`actorId`), alleen de eigen reden gewist (nooit die van de tegenpartij).
- Bestanden: `src/app/api/samenwerkingen/[id]/dossier/route.ts`, `…/dba-dossier/route.ts`,
  `src/lib/audit-labels.ts`, `src/app/(protected)/admin/gebruikers/actions.ts`. Tests:
  `dossier-routes-audit.test.ts` (nieuw, 4) + `anonymize-erasure.test.ts` (+2) + allowlist-entry in
  `unbounded-queries.test.ts`. Gate: typecheck + lint + prettier + test (2772 groen) + build groen.

## Persona-sweep run 5 — betaal-webhook publiek gemaakt (2026-06-25)

Kritische-gebruiker-sweep over alle vier rollen (ZZP'er/opdrachtgever/franchiser/admin). Eén defect
gevonden en gefixt; de rest van de authz-/IDOR-/tenant-/mutatie-poorten houdt stand (zie
`docs/PERSONA-SWEEP-BACKLOG.md` run 5 voor de volledige probe-lijst).

- [x] **Defect:** `POST /api/billing/webhook` werd door de middleware naar `/login` geredirect (307),
      omdat de route niet in de `isPublicPath`-allowlist stond. Een provider-webhook (Mollie) draagt
      geen sessie-cookie, dus de handler draaide nooit → bij go-live zouden betaalde abonnementen niet
      activeren (`SUBSCRIPTION_ACTIVATED`/`PAST_DUE` vuren niet). Inert vandaag (billing default-uit),
      gegarandeerde breuk bij livegang.
- [x] **Fix** (`src/lib/route-guards.ts`): exact-match `/api/billing/webhook` aan `isPublicPath`
      toegevoegd. Veilig publiek: de handler haalt de betaalstatus opnieuw op bij de provider (bron van
      waarheid), vertrouwt de request-body nooit blind en antwoordt altijd 200 zonder lek. Exact-match
      houdt `/api/billing` en sub-paden beschermd.
- Bewijs: na herbouw geeft de webhook (geen sessie) **200 "ok"**; `/api/account/export`,
  `/api/billing/webhook/extra`, `/dashboard` blijven 307→login. +1 test in `route-guards.test.ts`.
  Gate: typecheck + lint + test (2766 groen) + build + prettier groen. Read-only m.u.v. de allowlist;
  geen schemawijziging.

## Wachttijd-signaal per reactie voor de ZZP'er (2026-06-25)

De ZZP'er zag op `/reacties` wel de status en "Gereageerd X geleden", maar niet of een reactie
_langer dan gebruikelijk_ blijft liggen — de #1 kandidaat-onzekerheid ("hoor ik nog iets, of kan ik
beter verder kijken?"). Concurrenten (Malt/Temper/Deel) tonen kandidaten de versheid van hun
sollicitatie en nudgen tot her-engagement; nu doen wij dat fase-bewust en eerlijk.

- [x] **Pure motor** (`src/lib/application-wait.ts`): `summarizeApplicationWait({ status, createdAt,
hasCollaboration }, now)` geeft `{ daysWaiting, stage, attention }` voor een nog-onbesliste
      reactie (NEW/VIEWED/SHORTLIST) en `null` zodra ze besloten is of er een samenwerking uit
      voortkwam. Fase-bewuste drempels `WAIT_ATTENTION_DAYS` (NEW 7 / VIEWED 14 / SHORTLIST 21 dagen);
      toekomstige `createdAt` klemt op 0. `countApplicationsAwaitingAttention` telt de set. Puur,
      afgeleid uit de onveranderlijke `createdAt` + status — geen `updatedAt`-drift.
- [x] **UI** (`src/components/applications/wait-signal.tsx` + `/reacties`): subtiele warning-regel
      onder een kaart **alleen** wanneer de reactie aandacht vraagt (rustig bij een verse reactie),
      met fase-tekst + deeplink "Bekijk andere opdrachten". Plus een strip boven de lijst met de
      telling. Geen geneste links (signaal staat buiten de kaart-`Link`).
- Tests: `application-wait.test.ts` (7). Allowlist-regelnummer reacties bijgewerkt in
  `unbounded-queries.test.ts` (import-shift, geen nieuwe query). Gate: typecheck + lint + test
  (2765 groen) + build + prettier groen. Read-only, geen schemawijziging, geen extra query.

## Ontwerp-lab `/ontwerp` — verse set v2 van 10 concepten (2026-06-25)

Het publieke, inlogvrije design-lab onder `/ontwerp` is ververst met een **nieuwe, sterkere set van
tien onderscheidende top-1% redesign-concepten** (additief; de live-app is niet aangeraakt). De
vorige set (Helder/Orbit/Folio/Haven/Cockpit/Puls/Vitre/Beton/Mobiel/Nocturne) is vervangen.

- [x] **10 verse richtingen** — 01 Atlas (Zwitsers raster), 02 Aurora (ambient-gloed donker),
      03 Pers (riso/krantdruk), 04 Kompas (warm-menselijk wegwijs), 05 Console (terminal/IDE),
      06 Spectra (expressieve duotone), 07 Lumen (glas/vibrancy), 08 Graphite (blauwdruk-brutalisme),
      09 Zak (mobiel-eerst), 10 Onyx (quiet-luxury matte). De ontwerp-ruimte is bewust gespreid zodat
      geen twee concepten op dezelfde esthetiek leunen (vier lichte richtingen + drie onderscheiden
      donkere: ambient vs. glas vs. matte).
- [x] Elk concept toont de zes kernschermen (dashboard, marktplaats, opdracht-detail met verklaarbare
      matching, verificatie/zegel, acties, facturen) met realistische NL demo-content uit
      `mock.ts`, interne scherm-tabs, hover/focus en complete loading/empty/error-staten.
- Bestanden: `src/components/ontwerp/concepts/concept-01-atlas.tsx` … `concept-10-onyx.tsx`,
  `registry.ts` (metadata), `src/app/ontwerp/[id]/page.tsx` (route-map). `docs/DESIGN-LAB.md`
  bijgewerkt. Het woord "AI" komt nergens voor; UI-taal NL.
- Gate: typecheck + lint + test + build + prettier groen → PR → CI-poort.

## Kandidaten-vergelijking per opdracht voor de opdrachtgever (2026-06-25)

De opdrachtgever shortlist reacties, maar moest ze tot nu toe één voor één doorscrollen om te
kiezen. Geen concurrent (Malt/Temper/Pidz) zet kandidaten leesbaar naast elkaar mét uitlegbare
uitspringers. Nu kan de opdrachtgever per opdracht de actieve kandidaten side-by-side vergelijken.

- [x] **Pure motor** (`src/lib/candidate-compare.ts`): `buildCandidateComparison(candidates)` zet de
      set naast elkaar en wijst per dimensie (match / scherpste tarief / vertrouwen / compliance /
      leverbetrouwbaarheid) de **uniek beste** aan via `pickUniqueBest`. Bij gelijkspel geen winnaar
      (eerlijk, geen willekeurige uitlichting); <2 kandidaten → geen winnaars. Geen I/O, muteert de
      invoer niet.
- [x] **Vergelijkpagina** (`/kandidaten/vergelijk?job=<id>`, CLIENT-only): ownership-poort
      (`job.company.userId === actor.id`, anders `notFound`), haalt de actieve reacties
      (NEW/VIEWED/SHORTLIST/ACCEPTED, `take: 8`) en hergebruikt de bestaande motoren
      (`computeTrustLevel`, `computeCompliance`, `getDeliveryQualityForProfiles`,
      `summarizeAvailability`). Vergelijkingstabel met trofee-markering op de uitspringer per
      onderdeel; loading/empty-states.
- [x] **Entry-link** op `/kandidaten`: per opdracht met ≥2 actieve reacties een "vergelijken"-chip,
      server-side afgeleid uit de reeds opgehaalde lijst (geen extra query).
- Tests: `candidate-compare.test.ts` (11). Gate: typecheck + lint + test (2758 groen) + build +
  prettier groen. Read-only, geen schemawijziging.

## Persona-sweep run 4 — geen gaten (2026-06-25)

Kritische-gebruiker-sweep over alle vier rollen op `e457d25` (4 rollen parallel via Playwright/Chromium).
**Geen gaten gevonden** (4e schone run op rij). DOEL 1: 56 schermen 200, en een échte mutatie geverifieerd
(ADMIN keurt verificatie goed → wachtrij 6→5, `CREDENTIAL_VERIFIED`-audit, `verifiedAt`, UI gerevalideerd).
DOEL 1b: next-action-engine kruis-gecheckt (rol-geïsoleerd, ownership/tenant-gescopet, handoff-correct).
DOEL 2: 101 adversariële probes — priv-esc → redirect, IDOR/cross-tenant/cross-partij → soft-404/404,
document-privacy 403 (eigenaar 200 pdf), rol-exports + dba-dossier 403, 0 scriptuitvoering, 0 HTTP-500.
Details + reproductie in `docs/PERSONA-SWEEP-BACKLOG.md` (run 4). Docs-only PR.

## Reactie-pijplijn per opdracht voor de opdrachtgever (2026-06-25)

De opdrachtgever-`/opdrachten`-kaarten toonden alleen een kale "N reacties"-regel — geen signaal
welke opdracht _nieuwe, nog niet bekeken_ kandidaten heeft wachten. Daarmee bleef de kernvraag
"welke opdracht vraagt nu mijn aandacht?" onbeantwoord op het overzicht. Nu toont elke kaart een
compacte reactie-pijplijn die nieuwe reacties uitlicht.

- [x] **Pure motor** (`src/lib/job-pipeline.ts`): `summarizeJobPipeline(statuses)` levert
      `total` / `newCount` / `viewed` / `shortlist` / `accepted` / `rejected` / `needsAttention`.
      Ingetrokken reacties (WITHDRAWN) tellen niet mee in het totaal; `needsAttention` is waar zodra
      er NEW-reacties klaarstaan. Geen I/O, muteert de invoer niet.
- [x] **UI** (`src/components/jobs/job-pipeline-strip.tsx`): compacte strip op de opdrachtgever-
      `/opdrachten`-kaart — "N reacties", uitgelicht "N nieuw"-chip (primair) bij niet-bekeken
      reacties, plus "op shortlist"/"geaccepteerd" alleen als ze tellen. Lege staat:
      "Nog geen reacties".
- [x] **Wiring** (`src/app/(protected)/opdrachten/(index)/page.tsx`): per-status telling via één
      `application.groupBy({ by: ["jobId","status"] })` over de eigen opdrachten (geen N+1),
      server-side gescopet op `company.userId`. Vervangt de `_count`-regel.
- Tests: `job-pipeline.test.ts` (5). Allowlist-regelnummers bijgewerkt in `unbounded-queries.test.ts`.
- Gate: typecheck + lint + test (2747 groen) + build + prettier groen. Read-only, geen schemawijziging.

## Prod: presigned S3 download-URLs in de storage-abstractie (2026-06-25)

Productie-rijpe S3-levering: documenten/logo's hoeven niet langer als volledige buffer door de
app-server te streamen. De `StorageDriver`-abstractie krijgt een `getSignedDownloadUrl`-seam.

- [x] **Storage-seam** (`src/lib/services/storage.ts`): `getSignedDownloadUrl(key, opts)` op de
      interface; **S3-driver** levert een kortlevende presigned GET-URL via
      `@aws-sdk/s3-request-presigner` (lazy import, zoals `@aws-sdk/client-s3`) met
      `ResponseContentType`/`ResponseContentDisposition`-overrides; **lokale driver** geeft `null`
      → caller valt terug op streamen (gedrag lokaal/pilot ongewijzigd). Pure helpers
      `resolveSignedUrlTtl` (TTL geklemd op [30, 3600], default 300, env `STORAGE_S3_URL_TTL`) +
      `buildContentDisposition` (saneert bestandsnaam tegen header-injectie).
- [x] **Media/logo-route** (`src/app/api/media/[...key]/route.ts`): na de server-side authz
      (`requireActor` + bekende `logoKey`) een **302-redirect** naar de presigned URL wanneer de
      driver er een levert; anders streamen. Logo's zijn niet-gevoelig → geen privacyrisico.
- [x] **Gevoelige document-route ongemoeid**: `/api/documents/[id]` behoudt bewust
      server-streaming + `Content-Security-Policy: sandbox` (audit: document-privacy niet aanraken
      buiten tests). Presigned adoptie daar is een gedocumenteerde seam na security-review.
- [x] **Env**: optionele `STORAGE_S3_URL_TTL` in `src/lib/env.ts` + `.env.example`.
- Tests: `storage.test.ts` (+helpers/local-null, 18) + nieuwe `media/[...key]/route.test.ts` (4:
  401/404/redirect/stream). Gate: typecheck + lint + test (2742 groen) + build + prettier groen.
- Mensenwerk-rest: alleen `STORAGE_DRIVER=s3` + bucket/credentials zetten (MENSENWERK §1c); de
  code activeert presigning dan vanzelf.

## Security-/privacy-audit: AVG-inzage compleet + auditplicht + readiness-probe (2026-06-25)

Auditronde (orchestrator + 1 parallelle security-subagent) over de nieuwste commits (#532–#537) met
OWASP Top 10 + AVG art. 5/15/17/30 als kader. Vier bevindingen volledig gefixt (rood→groen), de rest
geparkeerd in `docs/SECURITY-PRIVACY-BACKLOG.md` (ronde 2026-06-25). De nieuwe signal-/forecast-features
(#534/#536/#537) zijn geverifieerd schoon (alle aggregaten gescopet op eigen data / `job.tenantId`).

- [x] **AVG art. 15/20 — inzage compleet** (`src/lib/account-export.ts`): eigen `Idea`, eigen
      `Collaboration.cancellationReason` (`cancelledById == actor`) en `PushSubscription` (zonder
      crypto-secrets) toegevoegd met strikte `select`. Tegelijk `company`-over-fetch gedicht
      (`tenantId`/`logoKey` lekten) via expliciete `select`. Test: `account-export.test.ts` (+3).
- [x] **A09 / AVG art. 30 — auditplicht** (`src/app/api/admin/facturatie/[id]/pdf/route.ts`):
      `PLATFORM_BILLING_PDF_ACCESSED`-audit op de platformfactuur-PDF (financiële PII), spiegelt de
      overige PDF-routes. Nieuw NL-label in `audit-labels.ts`. Test: nieuwe `route.test.ts` (+2).
- [x] **A05 — readiness-probe inlogvrij** (`src/lib/route-guards.ts` + `src/middleware.ts`):
      `/api/readiness` werd door de middleware naar `/login` geredirect; `isPublicPath` verplaatst naar
      het pure, geteste route-guards-module + readiness toegevoegd. Test: `route-guards.test.ts` (+2).
- Geparkeerd (MENSENWERK/volgende run): Sentry geeft rauw `Error` door (PII-lek zodra Sentry live),
  vier `console.error`-call-sites buiten de logger (o.a. `import/actions.ts` logt `row.email`).
- Gates: typecheck + lint + test (2731 groen) + build + `prettier --check .` groen. CI-poort verifiëren.

## Ontwerp-lab: verse set van 10 concepten — run 25-6-2026 (2026-06-25)

`/ontwerp` (publiek, inlogvrij, noindex) toont opnieuw 10 onderscheidende, top-1% redesign-concepten
van het hele platform. De vorige set (Atelier, Spectraal, Kompas, Tij, Krijt, Prisma, Stratum,
Onthaal, Veld, Maan) is vervangen door een sterkere, verse set, gekozen op grond van verse
2026-research (strategisch minimalisme/calm UI, kinetische variable typografie, functionele motion,
spatial depth/layering, glassmorphism contrast-bewust, bento, tactiel brutalisme/monospace, editorial
reveal, OKLCH, single-metric focus, dark-mode-first cockpits).

- [x] **10 nieuwe concepten** in `src/components/ontwerp/concepts/concept-<nn>-*.tsx` (elk
      self-contained `"use client"`, leest gedeelde mock, rendert alle 6 kernschermen via tab-state):
      01 Helder (Linear-grade licht), 02 Orbit (OLED-dark spatial), 03 Folio (redactioneel/kinetisch),
      04 Haven (warm-menselijk, vertrouwensmeter-hero), 05 Cockpit (data-dicht, 3-paneel), 06 Puls
      (expressieve kleur/motion), 07 Vitre (glas/vibrancy), 08 Beton (tactiel brutalisme), 09 Mobiel
      (telefoonframe, duim-zone), 10 Nocturne (quiet luxury dark).
- [x] `registry.ts` herschreven met de 10 nieuwe richtingen + rationale + onderzochte trends;
      `[id]/page.tsx` imports bijgewerkt; galerij-index `/ontwerp` toont alle 10 klikbaar.
- [x] Additief: alleen `src/app/ontwerp` + `src/components/ontwerp` aangeraakt; live-app ongemoeid.
- [x] `docs/DESIGN-LAB.md` bijgewerkt (richtingen-tabel + trends).
- Gates: typecheck + lint + test + build + prettier groen vóór PR; CI-poort verifiëren.

## Verwachte-betaaldatum per openstaande ZZP-factuur (2026-06-25)

De #1 cashflow-vraag van een ZZP'er is "wanneer krijg ik mijn geld?". Het facturen-overzicht toonde
alleen de contractuele vervaldatum (`invoice-due.ts`) — de juridische deadline, niet wanneer het geld
realistisch binnenkomt. Nu toont elke openstaande factuur een verwachte betaaldatum, afgeleid uit hoe
déze opdrachtgever de ZZP'er historisch betaalt (gemiddeld aantal dagen na factuurdatum). Vertaalt de
billing-diepte van Bendy/Zorgwerk naar onze bestaande, verklaarbare betaalgedrag-engine; read-only,
server-side, geen schemawijziging, geen extra query.

- [x] **Pure motor** `src/lib/invoice-payment-forecast.ts` — `forecastInvoicePayout({ issuedAt, dueAt,
avgDaysToPay, sampleSize })`. Genoeg historie (≥ `PAYOUT_FORECAST_MIN_SAMPLE` = 3 betaalde
      facturen) → `issuedAt + avgDaysToPay` (basis `history`, `confident`); anders terugval op de
      vervaldatum (basis `due`). Projecteert op de factuurdatum omdat `computePaymentBehavior` de
      termijn vanaf `issuedAt` meet (meet- en projectie-anker gelijk). Clampt data-ruis (negatief
      gemiddelde) weg; `daysAfterDue` legt uit hoeveel later dan de vervaldag.
- [x] **Wiring** `src/components/administratie/facturen-panel.tsx` — alleen ZZP'er: per opdrachtgever
      het betaalgedrag uit de **eigen** betaalde facturen (privacy — nooit data van andere ZZP'ers)
      via `computePaymentBehavior`, geen extra query (de hele lijst is al geladen). Toont een rustige
      muted-regel "Verwacht rond <datum> · doorgaans N dagen na de vervaldag" alleen bij een
      betrouwbare historie-projectie (anders dupliceert het slechts de vervaldatum-chip).
- [x] **7 unit-tests** (`invoice-payment-forecast.test.ts`). Gate lokaal groen: typecheck, lint,
      2725 tests, `next build`, prettier.

## kans-/concurrentiesignaal voor de ZZP'er op opdracht-detail (2026-06-24)

Spiegelbeeld van het opdrachtgever-bereiksignaal (`job-reach`): waar dat de vraagkant samenvat
(hoeveel passende ZZP'ers bereikt de opdracht), vat dit de aanbodkant samen voor de ZZP'er die
overweegt te reageren. Op een gepubliceerde opdracht waarop hij nog niet reageerde ziet de ZZP'er nu
hoeveel kandidaten al reageerden en — gecombineerd met zijn eigen matchscore — hoe sterk hij ervoor
staat en of snel handelen loont. Vertaalt de "binnen uren"-liquiditeit van Temper/Pidz/Zorgwerk naar
onze verklaarbare matching, zonder gegevens van andere kandidaten te lekken (alleen hun aantal telt).

- [x] **Pure motor** `src/lib/job-competition.ts` — `summarizeJobCompetition({ applicantCount,
myScore })` + helpers `competitionLevel`/`chanceLevel`. Concurrentieniveau (low/moderate/high op
      3/8 reacties) × kansniveau uit de eigen score (strong/fair/longshot op 70/50) → kop, sturingstip
      en `urgent`-vlag (veel reacties + niet-kansloze match → reageer snel). Nul-reacties = "Wees de
      eerste"-nudge. Normaliseert negatieve/fractionele telling. Geen schemawijziging.
- [x] **Card** `src/components/jobs/job-competition-card.tsx` — presentationeel, toont alleen de
      geaggregeerde telling + kop/tip; gewired in `/opdrachten/[id]` bij "Jouw aansluiting" (alleen
      niet-eigenaar FREELANCER, PUBLISHED, nog niet gereageerd). Server-side telling via begrensde
      `application.count` (ingetrokken reacties tellen niet mee).
- [x] **15 unit-tests** (`job-competition.test.ts`) over niveaus, grenzen, nul-reacties, onbekende
      score en de kop/urgent-matrix. Gate lokaal groen: typecheck, lint, 2718 tests, `next build`,
      `prettier --write .`.

## ontwerp-lab: verse, sterkere set van 10 concepten (2026-06-24)

Volledige refresh van `/ontwerp`: de vorige set (Stille Precisie, Redactie, Cockpit, Glas, Stelling,
Nacht, Klare Taal, Warm Onthaal, Stroom, Onderweg) is vervangen door tien nieuwe, onderscheidende
richtingen, gekozen op grond van verse 2026-research (Linear/Vercel/Stripe/Raycast/Family + Pidz/
Temper/Malt/Deel) en een kritische zelf-review om het niveau op te tillen. Additief: alleen bestanden
onder `src/app/ontwerp` + `src/components/ontwerp/concepts`, geen wijziging aan de live-app.

- [x] **Tien nieuwe concepten** (alle klikbaar, zes kernschermen via interne tabs, verklaarbare
      matching + verificatiezegel + facturen): 01 **Atelier** (editorial Swiss), 02 **Spectraal**
      (premium spatial dark), 03 **Kompas** (keyboard-first ⌘K-console), 04 **Tij** (ambient
      aurora-light), 05 **Krijt** (verfijnd neo-brutalism), 06 **Prisma** (confident color system),
      07 **Stratum** (ops console / terminal-dichtheid), 08 **Onthaal** (warm-human, trust-first),
      09 **Veld** (mobiel-eerst), 10 **Maan** (refined minimal dark).
- [x] **Mock verrijkt** — `spark`-reeksen op KPI's + gedeelde `BERICHTEN`/`DOCUMENTEN` voor optionele
      extra schermen (zes kernschermen blijven de basis).
- [x] **Registry + route-map + galerij-index** bijgewerkt; oude concept-bestanden verwijderd.
- [x] **Gate groen lokaal** — typecheck, lint, prettier (`--check .`), 2703 tests, `next build`
      (alle 10 `/ontwerp/01..10` geprerenderd). Docs: `docs/DESIGN-LAB.md` + dit blok.

## bereik-signaal voor de opdrachtgever op de opdracht-detail (2026-06-24)

Liquiditeit-inzicht dat concurrenten (Pidz/Zorgwerk) via auto-uitnodiging "binnen uren" oplossen,
vertaald naar onze bestaande verklaarbare matching-engine: de eigenaar van een gepubliceerde opdracht
ziet vooraf hoeveel passende, publiek-vindbare ZZP'ers hij bereikt (los van wie al reageerde) en
hoeveel daarvan nu beschikbaar zijn — met een sturingstip bij beperkt bereik (tarief/eisen/werkvorm).

- [x] **Pure logica** — `src/lib/job-reach.ts` `summarizeJobReach`: buckets `total` (score ≥ 50),
      `strong` (≥ 70), `available`, `strongAvailable`; bereik-niveau good/moderate/low + tip. Grenzen
      inclusief, elke kandidaat hoogstens één keer per bucket. 10 unit-tests.
- [x] **Server-fetcher** — `src/lib/data/job-reach.ts` `getJobReach`: begrensde tenant-gescopete scan
      (`discoverableFreelancerWhere` + `take: 200`), sluit ingetrokken reacties + reeds-reagerenden uit,
      scoort via `scoreJobForFreelancer` en vat samen. Cross-tenant lekt niet (op `job.tenantId`).
      Alleen voor PUBLISHED-opdrachten, anders `null`.
- [x] **UI** — `src/components/jobs/job-reach-card.tsx` `JobReachCard` op `/opdrachten/[id]` (alleen
      eigenaar, PUBLISHED): bereik-niveau-stip, tellingen, sturingstip. Parallel opgehaald naast de
      bestaande suggesties. Geen schemawijziging, server-side waarheid, geen dode knoppen.

Gate groen: typecheck ✓, lint ✓, prettier ✓, test **2703** ✓, build ✓.

## security/privacy-audit ronde 2026-06-24b — IDOR-tariefinjectie + AVG-erasure dichtgezet

4 parallelle audit-subagents (API-routes, tenant-isolatie, server-actions, AVG). Twee top-bevindingen
volledig gefixt (rood→groen), rest geparkeerd in `docs/SECURITY-PRIVACY-BACKLOG.md` (ronde 2026-06-24b).

- [x] **[HOOG · A01 — IDOR/financiële manipulatie]** `editAndResubmitPerformanceAction`
      (`samenwerkingen/[id]/actions.ts`) bond `performanceId` (ownership) en `collaborationId`
      (tarief-bron) niet → een ZZP'er kon zijn prestatie corrigeren met het tarief van een ándere
      samenwerking en zijn factuur opblazen. Fix: tarief-bron hard gebonden aan de eigen samenwerking
      van de prestatie; afwijkend id geweigerd. Test: `edit-resubmit-authz.test.ts`.
- [x] **[KRITIEK · AVG art. 17]** `anonymizeUser()` (`admin/gebruikers/actions.ts`) liet PII achter:
      `IndirectHoursEntry.note`, eigen `Idea.title/description`, `Collaboration.cancellationReason`
      (eigen) en alle `PushSubscription`-rijen (toestel-identifier). Fix: vier extra mutaties in de
      anonimiseringstransactie. Test: `anonymize-erasure.test.ts` (+4 cases).
- Gate groen: typecheck, lint, 2667 unit-tests, prettier, build.

## prod: observability-seam — gestructureerde logging + error-reporting + readiness

Productie-rijpheid: server-side waarneembaarheid die nu nog ontbrak. Additief; geen auth- of
gedragswijziging, geen nieuwe harde dependency. Integraties inert achter env-flags (graceful
fallback zonder secret/package).

- [x] **Gestructureerde, PII-veilige logger** — `src/lib/observability/logger.ts`. Eén JSON-regel
      per log (`{level,msg,time,...}`), drempel via `LOG_LEVEL` (default `info`). `redact()` maskeert
      secret-achtige keys (password/token/authorization/dsn/iban/bsn/…) én e-mailadressen in
      string-waarden, recursief, met diepte-cap; muteert input niet; nooit throw (serialisatie-fallback).
- [x] **Error-reporting-seam** — `src/lib/observability/report.ts`. `reportError()` → default
      `ConsoleErrorReporter` (logt gestructureerd); `SentryErrorReporter` actief zodra `SENTRY_DSN`
      gezet is, lazy-import van `@sentry/nextjs` via variabele specifier (`webpackIgnore`) zodat het
      build niet breekt zolang het pakket niet geïnstalleerd is — één keer waarschuwen, dan console-
      fallback. `reportError` slikt alle fouten (rapportage faalt nooit de request).
- [x] **`onRequestError`-wiring** — `src/instrumentation.ts`: Next.js 15 routeert gevangen server-
      fouten (RSC/route handlers/server actions) naar de seam; robuust, nooit throw.
- [x] **Readiness-endpoint** — `src/app/api/readiness/route.ts` + pure `evaluateReadiness`
      (`src/lib/observability/readiness.ts`). Strenger dan liveness `/api/health`: DB-ping **én**
      schema-probe (kerntabel queryable) → 200/`ready` of 503. PII-vrije fout-details (alleen error-naam).
- [x] **env-validatie** — `SENTRY_DSN` + `LOG_LEVEL` toegevoegd (`src/lib/env.ts`); productie-
      waarschuwing wanneer `SENTRY_DSN` ontbreekt (niet-fataal).

Tests: logger (13), readiness (5), report+env (27) — incl. de fallback-zonder-secret/zonder-package.
Gate groen: typecheck ✓, lint ✓, prettier ✓, build ✓ (route `/api/readiness`), test **2686** ✓.
**Menselijke reststap:** `SENTRY_DSN` zetten + `npm i @sentry/nextjs` voor externe error-monitoring;
zonder dat draait alles veilig door op gestructureerd loggen.

## ontwerp-lab: publiek design-lab `/ontwerp` — volledige set van 10 concepten live

Een publiek, inlogvrij design-lab (`noindex`) waar de eigenaar via één URL tien onderscheidende,
top-1% redesign-concepten van het hele platform naast elkaar bekijkt en kiest. Additief: geen
wijziging aan de live-app, alleen nieuwe bestanden onder `src/app/ontwerp` + `src/components/ontwerp/concepts`.

- [x] **Scaffold** — `src/app/ontwerp/layout.tsx` (fonts via next/font + `noindex`),
      `page.tsx` (galerij-index die alle 10 richtingen toont met preview/rationale/trends; gebouwde
      concepten klikbaar, rest "binnenkort"), `[id]/page.tsx` (dynamische route → concept-component-map,
      `generateStaticParams` over de gebouwde concepten).
- [x] **Registry + mock** — `src/components/ontwerp/concepts/registry.ts` (metadata van alle 10
      richtingen, `available`-vlag) en `mock.ts` (gedeelde Nederlandse demo-content: opdrachten,
      certificaten, acties, facturen, KPI's — consistent over alle concepten).
- [x] **Concept 01 "Stille Precisie"** (`concept-01-mono.tsx`) — ultra-minimaal mono (Geist + Geist
      Mono), hairline-randen i.p.v. schaduw, mono tabular cijfers, ⌘K-trigger, 6 kernschermen via
      interne scherm-tabs.
- [x] **Concept 02 "Redactie"** (`concept-02-editorial.tsx`) — editorial/redactioneel warm (Fraunces
      display-serif + Inter + mono), edge-to-edge hero-cijfer, crème/terracotta, magazine-section-nav,
      dezelfde 6 kernschermen.
- [x] **Concept 03 "Cockpit"** (`concept-03-cockpit.tsx`) — data-dense pro (donker slate), compacte
      rijen, sticky tabel-headers, bulk-select + J/K-toetsenbordhint, color-graded match-pills.
- [x] **Concept 04 "Glas"** (`concept-04-glas.tsx`) — dark-glassmorphism: `backdrop-blur` alléén op
      chrome/nav/chips, data-panels solide; **elevatie = urgentie** (glow schaalt met urgentie).
- [x] **Concept 05 "Stelling"** (`concept-05-stelling.tsx`) — verfijnd neo-brutalisme: 2px-randen,
      harde offset-schaduw die "indrukt" bij hover, oversized Space Grotesk, één elektrisch accent.
- [x] **Concept 06 "Nacht"** (`concept-06-nacht.tsx`) — premium-dark (Linear/Raycast): elevatieschaal,
      hairline-borders, low-chroma indigo, volwaardig **⌘K command-palet** (overlay + zoek + empty-state).
- [x] **Concept 07 "Klare Taal"** (`concept-07-klare-taal.tsx`) — high-contrast/WCAG-AAA als esthetiek:
      3px focus-ringen, ≥44px tikdoelen, `motion-reduce`, status via icoon + tekst + onderstrepingspatroon.
- [x] **Concept 08 "Warm Onthaal"** (`concept-08-warm.tsx`) — warm-human: zachte vormen/grote radii,
      Jakarta + Instrument-Serif-accent, mint/perzik, vriendelijke lege-staten en bevestigingen.
- [x] **Concept 09 "Stroom"** (`concept-09-stroom.tsx`) — Linear-grade: kalm/toetsenbord-eerst,
      progressieve onthulling (uitklap-rijen), shortcut-kbd's + ⌘K, lijsten boven kaarten.
- [x] **Concept 10 "Onderweg"** (`concept-10-onderweg.tsx`) — mobiel-eerst: telefoon-frame, bottom-nav,
      bottom-sheet opdracht-detail, optimistisch claimen met directe bevestiging.
- [x] **Docs** — `docs/DESIGN-LAB.md` (architectuur, de 10 richtingen, onderzochte 2026-trends).

Onderzocht (2026, via WebSearch): strategische minimalisme + progressieve onthulling (Linear/Vercel/
Stripe), kinetische/variable typografie, verfijnde glassmorphism (blur = informatiehiërarchie, niet ruis),
tactiel neo-brutalisme, OKLCH/dark-light-keuze, ⌘K + J/K-navigatie, en concurrent-analyse
(Pidz/Zorgwerk/Temper/Malt/Deel → ons trio verklaarbare matching + next-best-action + verificatie).

Gate groen: typecheck ✓, lint ✓, prettier ✓, build ✓ (`/ontwerp` + `/ontwerp/01..10` SSG-geprerenderd),
test **2660** ✓. Alle tien concepten zijn nu klikbaar en volledig uitgewerkt op `/ontwerp`.

## routine: server-side hardening — cron-foutmaskering + helpdesk-audit + import-rol-guard

Drie gedocumenteerde hardening-items uit `docs/SECURITY-PRIVACY-BACKLOG.md`, elk server-side
(geen UI), die elke rol geruster maken (robuustheid/accountability eerst). Geen schemawijziging.

- [x] **[HOOG · A09 error-leak]** `src/app/api/tasks/run-all/route.ts` lekte ruwe `e.message`
      (mogelijk Prisma-schema-detail) per mislukte taak in de JSON-respons. Nieuwe pure
      `src/lib/scheduled-tasks.ts` (`runScheduledTasks(tasks, logError?)`): bij een fout zet hij de
      **statische** string `"Taak mislukt."` in `errors[name]` en geeft het echte foutobject via
      `logError` door zodat de route het **alleen server-side** logt (`console.error`). De
      auth/CRON-poort en de responsvorm blijven gedragsbehoudend. Tests: `scheduled-tasks.test.ts`
      (4 — all-success, maskering + geen lek van de ruwe boodschap, `logError`-detail, doorlopen na fout).
- [x] **[MIDDEL · A09 audit-volledigheid]** `adminReply` (`admin/support/actions.ts`): de vier
      mutaties (bericht, notificatie, conditionele toewijzing, conditionele status→AWAITING_USER)
      staan nu in één `prisma.$transaction`; de auditregel `SUPPORT_AGENT_REPLY` legt
      `{ statusChanged, assignedTo }` vast. Test: `admin-reply.test.ts` (3).
- [x] **[MIDDEL · A04 mass-assignment]** `commitImport` (`admin/import/actions.ts`): runtime
      `z.enum(["FREELANCER","CLIENT"])`-guard (`src/lib/import-role.ts` `assertImportRole`) vlak vóór
      `user.create`, binnen de bestaande per-rij-try (ongeldige rol → nette rij-fout, geen
      mass-assignment). Test: `import-role.test.ts` (4). Allowlist-regelnummers in
      `unbounded-queries.test.ts` bijgewerkt (+1 door de extra import).

Gate groen: typecheck ✓, lint ✓, test **2660** ✓, build ✓, `prettier --write .` ✓.

## routine: AVG account-export compleet maken (art. 15/20 — inzage/portabiliteit)

`GET /api/account/export` (recht op inzage/dataportabiliteit) bevatte alleen `sentMessages` naast
het profiel/de basisdata. Een betrokkene kreeg dus een **onvolledige** kopie van zijn eigen
gegevens — schending AVG art. 15/20, MIDDEL uit `docs/SECURITY-PRIVACY-BACKLOG.md`. Dit raakt direct
elke rol (ZZP'er/opdrachtgever): één-klik een volledige, eerlijke data-export.

- [x] **`src/lib/account-export.ts`** — nieuwe testbare, gedeelde `buildAccountExport(db, actorId)`
      verzamelt alle eigen-data-secties. Toegevoegd t.o.v. de oude route: **ontvangen berichten**,
      **`TaxFilingRequest`**, **eigen `Review`**, **`IdeaComment`**, **eigen `SupportTicket`/
      `SupportMessage`** en **`IndirectHoursEntry`**. Strikte `select`-clauses — geen vrije-tekst-PII
      van derden: ontvangen berichten gescopet op gesprekken waarin de actor deelneemt
      (`senderId != actor` + `participants.some.userId == actor`), ondersteuningsberichten op
      `authorId == actor` (geen admin-/assistent-antwoorden), en de eigen `Review` laat `subjectId`
      weg (verbergt de identiteit van de beoordeelde tegenpartij).
- [x] **`src/app/api/account/export/route.ts`** — gerefactord naar `buildAccountExport`; auth,
      rate-limit (`exportRateLimiter`) en audit (`ACCOUNT_DATA_EXPORTED`) blijven in de route.
- [x] **`src/lib/account-export.test.ts`** — 5 tests (alle secties present, scoping ontvangen
      berichten, support-berichten alleen eigen, `Review` zonder `subjectId`, canned doorgifte).

Gate groen: typecheck ✓, lint ✓, test **2649** ✓, build ✓, `prettier --check .` ✓.

## routine: input-hardening — no-show-datum niet in de toekomst + ORT-maatwerk bovengrens

Twee server-side datameintegriteit-fixes uit `docs/SECURITY-PRIVACY-BACKLOG.md` (MIDDEL); beide
beschermen een rol tegen absurde/misbruik-invoer (DOEL-2-thema van de persona-sweep).

- [x] **No-show niet in de toekomst** (`src/lib/validation.ts`): `noShowReportSchema.occurredOn`
      krijgt `.refine(d => d.getTime() <= Date.now())`. Zonder deze grens kon een opdrachtgever/
      bemiddelaar een no-show vooruit op een ZZP'er boeken — die telt mee in de 3-strikes-
      schorsingsladder, dus de ZZP'er moest hiertegen beschermd worden. +4 tests
      (`validation.test.ts`: verleden/vandaag toegestaan, toekomst geweigerd, te korte reden).
- [x] **ORT-maatwerk bovengrens** (`config.ts` `MAX_ORT_CUSTOM_BPS = 50000` = +500%): harde guard
      in `setOrtProfileAction` (`samenwerkingen/[id]/actions.ts`) bij het schrijven + defense-in-
      depth grens in `parseOrtCustomRates` (`ort.ts`) bij het lezen (legacy/bewerkte rijen vallen
      terug op het sectorprofiel i.p.v. een absurde toeslag in elke factuur). +1 test (`ort.test.ts`).

Gate groen: typecheck ✓, lint ✓, test **2629** ✓, build ✓, `prettier --check .` ✓.

## prod: volledige env-validatie + SHARE_TOKEN_SECRET-afdwinging in productie

De env-validatie (`src/lib/env.ts`) dekte slechts een paar variabelen. Nu **productie-rijp**: alle
§7-secrets worden coherent gevalideerd met flag→companion-checks, en productie-specifieke eisen
worden afgedwongen (MENSENWERK §0b H-1).

- **Harde fouten (boot faalt):** integratie ingeschakeld maar secret(s) ontbreken — `STORAGE_DRIVER=s3`
  (bucket + regio + AWS-sleutels), `EMAIL_DRIVER=smtp` (SMTP-host/poort/user/pass + from),
  `BILLING_PROVIDER=mollie` (key), `DIPLOMA_VERIFIER=duo`/`BIG_VERIFIER=bigregister`/
  `IDENTITY_VERIFIER=idin` (base + key). Productie-eisen: `SHARE_TOKEN_SECRET` verplicht (H-1),
  `AUTH_URL`/`NEXTAUTH_URL` verplicht, `AUTH_SECRET` ≥ 32 tekens.
- **Zachte waarschuwingen (gelogd, niet fataal) in productie:** lokale opslag, noop-mailkanaal,
  ontbrekende `CRON_SECRET`, SQLite-`DATABASE_URL` — pure `envWarnings(env)`. De pilot blijft draaien;
  integraties zijn default inert tot de secret er is.
- [x] `src/lib/env.ts` — schema uitgebreid (alle §7-vars), `superRefine` flag→companion + prod-eisen,
      `envWarnings()` (puur), `validateEnv()` logt waarschuwingen.
- [x] `src/lib/env.test.ts` — 20 tests (8 → 20): elke integratie-poort, prod-afdwinging, inert-zonder-secret.
- Verificatie: typecheck ✓ · lint ✓ · test **2615** ✓ · build ✓ · prettier ✓ · check:env ✓.
- Resterend mensenwerk: alleen de secrets genereren + in de Railway-kluis plakken.

## persona-sweep: bovengrens op prestatie-uren/bedrag — voorkomt int-overflow → 500 bij goedkeuring

**Gat gevonden én gefixt (live, kritische-gebruiker-sweep).** Een ZZP'er kon via een geknutselde
POST (browser-`max` omzeild) een prestatie met een absurd aantal uren indienen (bv. 999.999 uur).
Het uren-veld kende geen **server-side** bovengrens (alleen `hours <= 0` werd geweigerd). Bij
goedkeuring door de opdrachtgever berekent de cascade `totalCents = uren × tarief + BTW`; bij
999.999 × €88 + 21% = 10.647.989.352 cent, wat de `Int`-kolom (`Invoice.totalCents`, int4 ≈ €21,4
mln) overschrijdt → `prisma.invoice.create()` faalt → **500-crashpagina** op de goedkeuractie
(reproduceerbaar op SQLite én productie-Postgres). Schending CLAUDE.md regel 1 (server-side waarheid)
en DOEL-2-spec (absurde uren/bedrag → weigeren, nooit 500).

- [x] `src/lib/validation.ts` — `validatePerformanceForm` krijgt bovengrenzen: `MAX_PERFORMANCE_HOURS`
      (1.000 u/urenstaat, incl. ORT-totaal) en `MAX_MILESTONE_CENTS` (€1 mln/oplevering). Beide ruim
      onder int4 (zelfs bij max tarief €2.000/u + ORT-toeslag + 21% BTW). Heldere NL-foutmelding.
- [x] `src/lib/cascade/performance-commands.ts` — harde `assertPerformanceWithinLimits`-guard in
      `createPerformance` én `updatePerformance` (werpt `CascadeError`). Dekt élk pad, óók de
      **CSV-diensten-import** (`/diensten/importeer`) die rechtstreeks `createPerformance` aanroept en
      het formulier-`validatePerformanceForm` omzeilt.
- [x] `src/lib/validation.test.ts` — +4 tests (absurde uren, ORT-totaal, mijlpaalbedrag; grens 1.000
      u toegestaan). Gate groen: typecheck ✓, lint ✓, test ✓, build ✓, prettier ✓.

Overige doelen deze run **groen, geen verdere gaten**: admin keurt verificatie goed (queue 6→5, audit
`CREDENTIAL_VERIFIED`); opdrachtgever keurt prestatie goed → concept-factuur gegenereerd; next-action-
handoff klopt (ZZP'er krijgt "factuur indienen", opdrachtgever's actie verdwijnt — geen stale/dubbele
actie); IDOR/cross-collab → "Niet gevonden", priv-esc → redirect, doc-API → 404 JSON, negatieve uren →
server-side geweigerd.

## routine: tariefpassendheid-signaal op /kandidaten (proposedRate vs. budget)

De kandidatenkaart toonde het tariefvoorstel van de ZZP'er (`proposedRate`) zonder vergelijking met
het gepubliceerde opdrachtbudget (`rateMin`..`rateMax`). De matchreden "Tarief past binnen het budget"
gebruikt bovendien het profiel-`hourlyRate`, niet de `proposedRate` (de werkelijke vraag voor déze
opdracht). Toegevoegd: een budgetpassendheid-badge naast het tariefvoorstel (Binnen/Onder/Boven budget)
als beslis-hulp voor de opdrachtgever bij het triëren op kosten. Read-only, geen schemawijziging, geen
extra query (leunt op de reeds geladen `job.rateMin/rateMax` + `app.proposedRate`).

- [x] `src/lib/rate-fit.ts` — pure `classifyProposedRateFit(proposedRate, rateMin, rateMax)` →
      `within`/`below`/`above`/`unknown` (grenzen inclusief, plafond vóór bodem, één grens volstaat,
      `unknown` zonder voorstel of zonder budget) + `RATE_FIT_LABEL` + `RATE_FIT_VARIANT`.
- [x] `src/lib/rate-fit.test.ts` — 9 unit-tests (alle grensgevallen + label/variant-dekking).
- [x] `src/app/(protected)/kandidaten/page.tsx` — badge naast "Tariefvoorstel" (verbergt zich bij
      `unknown`); `t()`-gewikkeld zoals de rest van de pagina, geen woordenboek-werk.
- [x] `src/lib/unbounded-queries.test.ts` — allowlist-regel kandidaten 91 → 92 (nieuwe import).

Gate groen: typecheck ✓, lint ✓, test **2608** ✓, build ✓, `prettier --check .` ✓.

## security/privacy: PDF-toegang geaudit + AVG-anonimisering dekt vrije-tekst-PII

Security-/privacy-auditronde (2026-06-24, basis `main` @ 70cf3b6) met 4 parallelle subagents over
server actions, franchise-/admin-actions, API-routes en AVG/anonimisering + handmatige verificatie
van auth/sessie, deeltoken, wachtwoordherstel, cron-auth en storage. Twee bevindingen volledig
gefixt (rood→groen), de rest geparkeerd in `docs/SECURITY-PRIVACY-BACKLOG.md`.

- [x] **KRITIEK (AVG art. 17, recht op verwijdering):** `anonymizeUser()` liet herleidbare
      vrije-tekst-PII van de betrokkene achter in kindrijen (een `user.update` cascadeert niet). De
      anonimiseringstransactie in `src/app/(protected)/admin/gebruikers/actions.ts` redact nu ook
      `Application.motivation`, `SupportMessage.body`, `IdeaComment.body`, `Review.comment` en
      `ShiftHandoff.reason` (alle door de betrokkene zelf geschreven). `NoShowReport.reason` bewust
      niet (door een andere partij geschreven; mogelijke bewaargrond) — geparkeerd.
- [x] **HOOG (CLAUDE.md regel 5, AVG art. 30 accountability):** drie PDF-routes serveerden gevoelige
      PII zonder auditregel. `audit()` (met IP/UA) toegevoegd in `facturen/[id]/pdf`,
      `prestaties/[id]/pdf` en `samenwerkingen/[id]/modelovereenkomst`; NL-labels in
      `src/lib/audit-labels.ts`.
- [x] Tests: `src/app/api/pdf-routes-audit.test.ts` (+6) en
      `src/app/(protected)/admin/gebruikers/anonymize-erasure.test.ts` (+6) — beide rood zonder de fix.
- [x] `docs/SECURITY-PRIVACY-BACKLOG.md` aangemaakt: geparkeerde bevindingen (Lead-PII zonder
      grondslag, PII in import-log, run-all error-leak, push-subscribe rate-limit, no-show-datum,
      ORT-bovengrens e.a.) + één vals-positief gedocumenteerd (Mollie-webhook re-fetch ÍS de control).

Gate groen: typecheck ✓, lint ✓, test **2611** ✓, build ✓, `prettier --write .` ✓.

## routine: i18n opdrachtgever-dashboard (/dashboard, CLIENT-tak) vertaald (EN)

Vervolg op de i18n-reeks (#491–#502, ZZP'er-pad). De FREELANCER-tak van het werkruimte-dashboard is
in #492 vertaald; de **CLIENT (opdrachtgever)-tak van `/dashboard` was nog volledig Nederlands**.
Nu via `t()` (server-side `getTranslator`, NL-fallback) vertaald: KPI-labels (Fill rate/Active
collaborations/Posted assignments/Spending + de stats-fallback), lijst "Suggested professionals" +
lege staat, compliance-zegel (titel + subtitel "X/Y shifts compliant" + items Missing-expired/
Expiring soon/In review), header-fallback en de week-strip (labels + dienst/diensten via de gedeelde
`t`-parameter van `buildCurrentWeek`). Geen schemawijziging, geen gedragswijziging in de NL-UI.

- [x] `src/lib/i18n/messages.ts` — sectie "Opdrachtgever-dashboard": 15 brontekst→EN-paren.
- [x] `src/app/(protected)/dashboard/page.tsx` — CLIENT-tak: alle hardgecodeerde NL-strings via `t()`;
      `buildCurrentWeek` krijgt nu `t` (week-labels + dienst/diensten meertalig, gelijk aan de
      FREELANCER-tak).
- [x] `src/lib/i18n/messages.test.ts` — +2 tests (EN-vertaling + NL-onveranderd).

Gate groen: typecheck ✓, lint ✓, test **2566** ✓, build ✓, `prettier --check .` ✓.

## feat(i18n): ZZP'er — reactieoverzicht (/reacties) vertaald (EN)

Vervolg op de ZZP'er-i18n-reeks (#491–#498). Het reactieoverzicht `/reacties` was nog volledig
Nederlands. Nu via `t()` (server-side `getTranslator`, NL-fallback) vertaald: kop + uitkomsten-
samenvatting, statusfilter-pills, statushints per reactie, compliance-regels, intrek-bevestiging.
Drie gedeelde badges meegenomen (ook elders gebruikt) — async gemaakt zoals `InvoiceStatusBadge`
(#498); alle call-sites zijn server-componenten.

- [x] `src/lib/i18n/messages.ts` — sectie "Mijn reacties": reactiestatus-labels (New/Viewed/
      Shortlist/Rejected/Withdrawn/Accepted), compliance-badge (Meets requirements/Attention point/
      Does not meet), uitkomsten-subteksten, statushints, samenwerkings-hints, intrek-bevestiging,
      filter-/lege-staten, "Other".
- [x] `src/components/applications/application-status-badge.tsx` — `async` + `t(label)`
      (gedeeld: ook /kandidaten, /franchise/diensten/[id]).
- [x] `src/components/compliance-badge.tsx` — `async` + `t(label)` (gedeeld: /reacties,
      /kandidaten, /opdrachten/[id], replacement-panel, franchise/diensten/[id]).
- [x] `src/components/applications/outcomes-summary.tsx` — `async` + `t()`; subteksten met
      `plural(t(...), t(...))` en N-fragmenten via `t()`.
- [x] `src/app/(protected)/reacties/page.tsx` — `getTranslator`; alle UI-strings via `t()`,
      credentialtypes via `t(CREDENTIAL_TYPE_LABEL[type])`, filterlabels via `t(g.label)`.
- [x] `src/lib/unbounded-queries.test.ts` — allowlist-regelnummer 101 → 103 (nieuwe import).

Gate groen: typecheck ✓, lint ✓, test **2561** ✓, build ✓, `prettier --check .` ✓.

## routine: statusfilter op /opdrachten (opdrachtgever-overzicht)

Het opdrachtgever-overzicht "Mijn opdrachten" (`/opdrachten`) toonde alle eigen opdrachten in één
ongefilterde lijst. Toegevoegd: een statusfilter (Alle/Concept/Gepubliceerd/Gesloten) met
pill-tellingen, spiegelt het bestaande pill-patroon van `/facturen`, `/reacties` en `/kandidaten`.
Read-only, geen schemawijziging, geen extra query (filtert de reeds-geladen lijst client-side van de
server-component).

- [x] `src/lib/job-status-filter.ts` — pure helpers: `parseJobStatusFilter` (onbekend/malicieus →
      "all"), `filterJobsByStatus` (behoudt volgorde, muteert niet), `summarizeJobStatusGroups`
      (telling per groep, "all" = totaal); labels gelijk aan `JobStatusBadge`.
- [x] `src/app/(protected)/opdrachten/(index)/page.tsx` — `ClientJobs` leest `?status=`, toont
      filter-pills (`withParams`) + een lege-staat "Geen opdrachten met deze status".
- [x] `src/lib/job-status-filter.test.ts` — 12 unit-tests (parse-fallback, filter, telling, mutatie).
- [x] `src/lib/unbounded-queries.test.ts` — allowlist-regelnummers bijgewerkt (edit verschoof de regels).
- Gate: typecheck ✓, lint ✓, test 2540 ✓, build ✓, prettier ✓.

## feat(opgeslagen): bewaarde opdrachten voor de ZZP'er

Een ZZP'er kon een interessante opdracht alleen onthouden door erop te reageren of de URL te
kopiëren. Toegevoegd: opdrachten **bewaren** (bookmark) en terugvinden op een eigen overzicht —
spiegelbeeld van de bestaande Flexpool (opdrachtgever bewaart ZZP'er via `FavoriteFreelancer`).
Server-side keten (auth → rol → eigen profiel als anker → zichtbaarheidscheck → mutatie + audit);
additieve schemawijziging.

- [x] `prisma/schema.prisma` — nieuw `SavedJob`-model (anker op `FreelancerProfile`,
      `@@unique([freelancerProfileId, jobId])`, cascade-delete) + back-relations op
      `FreelancerProfile.savedJobs` en `Job.savedBy`.
- [x] `src/lib/saved-jobs.ts` — pure `partitionSavedJobs` (splitst open vs. niet-meer-beschikbaar,
      sorteert meest recent bewaard eerst, deterministische tiebreaker, muteert niet) +
      `isSavedJobOpen`. Tests: `saved-jobs.test.ts` (7).
- [x] `src/app/(protected)/opdrachten/actions.ts` — `toggleSavedJob(jobId)`: idempotente toggle;
      bewaren alleen voor een gepubliceerde, voor deze ZZP'er zichtbare opdracht
      (`visibleJobsWhere`); audit `JOB_SAVED`/`JOB_UNSAVED`.
- [x] `src/components/jobs/save-job-button.tsx` — client-toggle (Bewaren/Bewaard), `useTransition`,
      `aria-pressed`. Gewired op de opdracht-detail (FREELANCER, niet-eigenaar, PUBLISHED).
- [x] `src/app/(protected)/opgeslagen/{page,loading}.tsx` — overzicht: "Nog open" (klikbaar naar
      detail + verwijder-toggle) en "Niet meer beschikbaar" (gesloten/teruggetrokken, met
      statusbadge); empty-states (geen profiel / niets bewaard). `take: 200`.
- [x] `src/lib/nav.ts` + `src/components/sidebar-nav.tsx` — nav-item "Opgeslagen" (bookmark-icoon)
      onder Werk; nieuwe `bookmark` `NavIcon`.
- [x] `prisma/seed.ts` — Sanne bewaart job-13 + job-18 (open) en job-7 (DRAFT → "niet meer
      beschikbaar"), idempotent.
- [x] `src/lib/unbounded-queries.test.ts` — allowlist-regelnummers opgeschoven (nieuwe import).

Gate groen: typecheck ✓, lint ✓, test **2487** ✓ (+7), build ✓ (`/opgeslagen` 2.51 kB),
`prettier --check .` ✓. Seed-smoke geverifieerd tegen scratch-DB (2 open + 1 unavailable).

## feat(freelancers): sorteeropties op de ZZP'er-browse (opdrachtgever)

De opdrachtgever-browse (`/freelancers`) had wél filters (zoeken, vertrouwensniveau, alleen
beschikbaar) maar geen sorteervolgorde — de lijst stond vast op server-volgorde (`updatedAt desc`).
Een opdrachtgever die op tarief, vertrouwen, beschikbaarheid of ervaring wil vergelijken moest
handmatig scannen. Toegevoegd: een pure, stabiele sorteerfunctie over de reeds server-berekende
kaartdata + een sorteer-`Select`. Read-only, **geen schemawijziging, geen extra query**.

- [x] `src/lib/freelancer-search.ts` — `FreelancerSortKey` + pure `sortFreelancers(cards, sort)`:
      `relevance` (behoudt server-volgorde), `available` (beschikbaar eerst, tiebreak vertrouwen),
      `trust` (vertrouwensniveau hoog→laag), `track-record` (afgeronde samenwerkingen, dan uren),
      `rate-asc`/`rate-desc` (tarief, "geen tarief" altijd achteraan). Deterministische
      eindtiebreaker (naam → id) zodat dezelfde invoer altijd dezelfde volgorde geeft; muteert de
      invoer niet.
- [x] `src/app/(protected)/freelancers/freelancer-browse.tsx` — sorteer-`Select` (NL-labels) naast de
      bestaande filters; `sortFreelancers(applyFreelancerFilters(...), sort)`; "Filters wissen" reset
      ook de sortering naar `relevance`.
- [x] Tests: `freelancer-search.test.ts` (+8: relevance-behoud, no-mutation, available-volgorde,
      trust, rate-asc/desc met nulls-last, track-record + naam-tiebreaker).

Gate groen: typecheck ✓, lint ✓, test **2434** ✓, build ✓, `prettier --check .` ✓.

## feat(reacties): ZZP'er kan eigen reactie intrekken (WITHDRAWN)

Een ZZP'er kon zijn eigen reactie op een opdracht niet terugtrekken. Werd hij onbeschikbaar, dan
bleef hij als kandidaat zichtbaar bij de opdrachtgever (en kon hij niet opnieuw reageren). Nieuwe
`WITHDRAWN`-status + freelancer-only intrek-actie, met nette afhandeling in alle afgeleide
oppervlakken. Server-side keten (auth → rol → ownership → toegestane overgang → mutatie + audit +
notificatie). **Geen schemawijziging** (status is een string-kolom, geen native db-enum).

- [x] `src/lib/enums.ts` — `WITHDRAWN` toegevoegd aan `APPLICATION_STATUSES` (achteraan: werkstroom-
      sortering op `/kandidaten` houdt ingetrokken reacties onderaan).
- [x] `src/lib/applications.ts` — `WITHDRAWN: []` (terminaal voor de opdrachtgever) +
      pure `canWithdrawApplication(from)` (alleen NEW/VIEWED/SHORTLIST). WITHDRAWN is nooit een doel
      van een opdrachtgever-overgang.
- [x] `src/app/(protected)/reacties/actions.ts` — `withdrawApplication(appId)`: ownership +
      geen-samenwerking + `canWithdrawApplication`-gate; transactie status→WITHDRAWN + audit
      (`APPLICATION_WITHDRAWN`) + notificatie naar de opdrachtgever. Intrek-knop (ConfirmButton) op
      `/reacties`; status-hint + badge ("Ingetrokken").
- [x] Re-apply na intrekken: `opdrachten/actions.ts` hergebruikt de bestaande rij (heropent →
      NEW, verbruikt geen extra plan-slot); `opdrachten/[id]/page.tsx` toont weer het reageer-
      formulier; `rooster/page.tsx` + `recommendations.ts` + `suggestions.ts` sluiten WITHDRAWN uit
      ("Gereageerd"-badge / aanbevelingen / kandidaat-suggesties komen terug).
- [x] Afgeleide oppervlakken sluiten WITHDRAWN correct uit/af: `application-outcomes.ts`
      (buiten tellingen + percentage-noemers), `client-responsiveness.ts` (uit de steekproef),
      `status-breakdown.ts` + badge + audit-labels + notificatie-categorie.
- [x] `/kandidaten`: ingetrokken reactie toont een nette "ZZP'er heeft ingetrokken"-noot i.p.v. een
      lege actierij; uitgesloten van de "Beste match"-etalage.
- [x] Tests: `applications.test.ts` (+4: canWithdraw-grenzen + terminaliteit), `application-outcomes.test.ts`
      (+3), `client-responsiveness.test.ts` (+2). Allowlist-regels `unbounded-queries.test.ts` bijgewerkt
      (verschoven regelnummers).

Gate groen: typecheck ✓, lint ✓, test **2306** ✓ (+9), build ✓, `prettier --check .` ✓.

## feat(certificaten): certificaat-impact op lopende inzet (ZZP'er)

De vervalkalender op `/certificaten` (`summarizeExpiry`) toonde wél wélke certificaten (bijna)
verlopen, maar niet de **consequentie** ervan: welke lopende inzet komt in gevaar als een vereist
certificaat verloopt? De opdrachtgever had die koppeling al (`clientCredentialAlerts` +
compliance-momentopname op het CLIENT-dashboard); de ZZP'er zag enkel een abstracte vervaldatum. Dit
sluit die mirror-asymmetrie op de kerndifferentiatie (verificatie/compliance). Read-only,
**geen schemawijziging, geen mutatie, geen extra ongebonden query**.

- [x] `src/lib/freelancer-compliance.ts` — pure `linkExpiryToInzet(overview, collaborations)`: koppelt
      elk `ExpiryItem` uit de vervalkalender aan de actieve samenwerkingen wier verplichte
      certificaattypen het raakt; behoudt de urgentst-eerst-volgorde van de vervalkalender, sorteert de
      geraakte inzetten deterministisch (clientName→jobTitle→id), laat items zonder geraakte inzet weg,
      en telt `collaborationsAtRisk` = distinct samenwerkingen geraakt door een EXPIRED/WITHIN_30-item.
      Muteert de invoer niet.
- [x] `src/lib/data/freelancer-compliance.ts` — `getActiveCollaborationRequirements(userId)`: spiegel
      van `clientCredentialAlerts`, freelancer-gescoped (`freelancerId`, `status ACTIVE`, `take: 200`),
      haalt opdrachttitel + verplichte certificaateisen + opdrachtgevernaam op; laat inzet zonder eis weg.
- [x] `src/components/credentials/inzet-impact-card.tsx` — `InzetImpactCard`: compacte sectie onder de
      vervalkalender met per (bijna-)vervallend certificaat een dagaftelling (verlopen/over N dagen) +
      "Vernieuwen"-deeplink (`credentialEditPath`) en de geraakte inzetten (link naar `/samenwerkingen/[id]`).
      Verbergt zichzelf zodra er geen risico is. Gewired in `certificaten/(index)/page.tsx` direct na
      `ExpiryOverviewCard`.
- [x] Tests: `freelancer-compliance.test.ts` (11: matching/multi-collab/geen-match-weglaten/
      distinct-telling per venster/volgorde/no-mutation). Allowlist-regel in `unbounded-queries.test.ts`
      bijgewerkt (verschoven regelnummer van de bestaande eigenaar-gescopete certificaat-`findMany`).

Gate groen: typecheck ✓, lint ✓, test **2297** ✓, build ✓, `prettier --check .` ✓.

## feat(certificaten): herstel-deeplink + contextbanner bij afgewezen/verlopen certificaat

De verificatieflow (kerndifferentiatie) had een herstel-UX-gat: een afgewezen/verlopen certificaat
notificeerde de ZZP'er met een link naar de **generieke** `/certificaten`-lijst, waar hij bij veel
certificaten moest zoeken welke is afgekeurd én zelf moest afleiden dat een nieuw bewijsstuk
uploaden het opnieuw ter verificatie aanbiedt. Read-only logica, **geen schemawijziging, geen
mutatie**.

- [x] `src/lib/credentials.ts` — pure `credentialEditPath(id)` (één bron voor de herstel-URL
      `/certificaten/[id]/bewerken`) + `credentialRecoveryNotice(status)`: contextuele
      herstelmelding (tone/title/message) voor REJECTED (danger) en EXPIRED (warning), anders `null`.
- [x] Deep-links naar het specifieke certificaat i.p.v. de lijst: `admin/verificaties/actions.ts`
      (CREDENTIAL_REJECTED-notificatie) en `lib/expiry-task.ts` (CREDENTIAL_EXPIRED +
      CREDENTIAL_EXPIRING) linken nu via `credentialEditPath(...)`.
- [x] `certificaten/credential-form.tsx` — contextbanner bovenaan het bewerken-formulier bij
      REJECTED (incl. afwijzingsreden) / EXPIRED, gestuurd door `credentialRecoveryNotice`; nieuwe
      optionele `status`/`rejectionReason` op `CredentialFormInitial`.
- [x] `certificaten/[id]/bewerken/page.tsx` — geeft `status` + `rejectionReason` door.
- [x] Tests: `credentials.test.ts` (+6) voor `credentialEditPath` en `credentialRecoveryNotice`
      (danger/warning/null-grenzen). Gate groen: typecheck ✓, lint ✓, test **2224** ✓, build ✓,
      `prettier --check .` ✓.

## routine: job-engagement-signaal (weinig reacties) voor de opdrachtgever

Spiegelbeeld van `job-alerts` (die ZZP'ers naar passende nieuwe opdrachten duwt): een geplande taak
waarschuwt nu de **opdrachtgever** wanneer een gepubliceerde opdracht "koud" blijft — lang open zonder
noemenswaardige respons. Tot nu toe kreeg de opdrachtgever géén signaal dat zijn opdracht weinig
reacties trekt (tarief-/zichtbaarheid-/skill-mismatch); hij kon alleen blind wachten. Read-only afgeleid
uit bestaande data, **geen schemawijziging, geen geldstroom, geen UI-redesign** (de melding verschijnt in
de bestaande meldingenlijst en linkt naar de opdracht).

- [x] `src/lib/job-engagement.ts` — pure `planJobEngagement(jobs, { now, minAgeDays?, maxApplications? })` + `jobAgeInDays` + drempels `JOB_COLD_MIN_AGE_DAYS=7` / `JOB_COLD_MAX_APPLICATIONS=2`. Een opdracht is
      koud wanneer hij ≥ `minAgeDays` geleden is gepubliceerd én ≤ `maxApplications` reacties heeft;
      niet-gepubliceerde opdrachten worden genegeerd. dedupeKey `job-cold:<jobId>` (per opdracht hooguit
      één waarschuwing, geen herhaald gezeur). Reactie-tekst schaalt (0 / 1 / meer).
- [x] `src/lib/job-engagement-task.ts` — `runJobEngagementTask` (plan/apply zoals `runJobAlertsTask`):
      begrensde query (`status PUBLISHED`, `publishedAt <= now-7d`, `take: 200`, `_count.applications`),
      idempotent via DomainEvent-dedupeKey, schrijft `DomainEvent` (type `JOB_COLD`, zoals `JOB_MATCH`
      buiten de cascade-enum) + `Notification` + `AuditLog` (`JOB_ENGAGEMENT_ALERT_SENT`) atomair per alert.
- [x] `src/app/api/tasks/run-all/route.ts` — taak `job-engagement` toegevoegd aan de cron-keten.
- [x] `src/lib/notifications.ts` — `JOB_COLD` → categorie `system`, toon `attention`.
- [x] Tests: `job-engagement.test.ts` (12, grenzen leeftijd/reacties/null/drempels/multi-job) +
      `job-engagement-task.test.ts` (4, mocked prisma: leeg / happy path / idempotentie / dubbele run).

Gates groen: typecheck ✓, lint ✓, test 2232 ✓ (+16), build ✓ (`/api/tasks/run-all` aanwezig),

## feat(reminders): prestatie-goedkeuring-reminder voor de opdrachtgever (cascade-deblokkering)

Het grace-venster (`performance-grace-task`, auto-goedkeuring) staat **default UIT** (financieel
beleid). Met grace uit blijft een SUBMITTED-prestatie die de opdrachtgever nooit keurt eindeloos
liggen en stalt de hele facturatie-cascade (geen concept-factuur → geen betaling). Er was alleen een
read-only "N dagen wachtend"-melding op `/prestaties`; **geen actieve nudge**. Toegevoegd: een
geplande reminder-taak die de opdrachtgever herinnert (dag 3/7) en daarna escaleert naar de admins —
spiegelbeeld van `concept-invoice-reminders` (die de ZZP'er aan de niet-ingediende factuur herinnert).
Plan/apply, idempotent via DomainEvent dedupeKey, read-only afgeleid, geen schemawijziging, geen
geldstroom.

- [x] `src/lib/performance-approval-reminders.ts` — pure `planPerformanceApprovalReminders(candidates,
now)` + `daysSince`. Alleen SUBMITTED + submittedAt op een niet-geannuleerde, niet-betwiste
      samenwerking (zelfde poort als het grace-venster); herinnering op `REMINDERS.performanceApprovalDays`
      (`[3, 7]`), escalatie ná de laatste dag. Per signaal een stabiele dedupeKey (één per dag/per
      prestatie → geen dagelijks gezeur).
- [x] `src/lib/performance-approval-reminders-task.ts` — runner: begrensde query (`take: 500`,
      Performance → collaboration → company.userId), filtert al-gevuurde dedupeKeys, schrijft per
      signaal atomair DomainEvent (`PERFORMANCE_APPROVAL_REMINDER`/`_ESCALATION`) + Notification (naar
      opdrachtgever `/prestaties`; escalatie naar elke actieve admin `/admin/disputen`) + AuditLog.
- [x] `src/lib/config.ts` — `REMINDERS.performanceApprovalDays = [3, 7]`.
- [x] `src/lib/notifications.ts` — `PERFORMANCE_APPROVAL_REMINDER` + `_ESCALATION` → categorie
      `workflow`, toon `attention`.
- [x] `src/app/api/tasks/run-all/route.ts` — taak `performance-approval-reminders` in de cron-keten,
      naast `performance-grace`.
- [x] Tests: `performance-approval-reminders.test.ts` (11) + `…-task.test.ts` (5): dag-grenzen,
      escalatie-drempel, status-/annulering-/dispuut-poort, non-mutatie, idempotentie, milestone-label,
      ontbrekende opdrachtgever. Gate groen: typecheck ✓, lint ✓, test **2236** ✓ (+16), prettier ✓,
      build ✓ (`/api/tasks/run-all` aanwezig).

## feat(admin): platform-doorzet-trend (gefactureerd volume per maand) op /admin/statistieken

`/admin/statistieken` toonde uitsluitend punt-in-tijd-tellingen — geen doorzet-/groeitrend over de
tijd. `buildRevenueTrend` had al FREELANCER/CLIENT/TENANT-fetchers maar geen platform-brede variant.
Dit voegt die toe en wired de bestaande `RevenueTrendCard` als doorzet-hero boven de statistieken.
Read-only, server-side, geen schemawijziging, geen mutatie.

- [x] `src/lib/revenue-trend.ts` — `getPlatformRevenueTrend(now, months)`: totaal gefactureerd
      volume per maand over álle facturen (`status != CANCELLED`, binnen het maandvenster,
      `issuerUserId not null`). Sommeren over `issuerUserId not null` telt elke cascade-transactie
      precies één keer (de ZZP'er factureert de opdrachtgever één keer) en sluit eventuele
      platform-fee-facturen uit — doorzet/GMV, geen platform-inkomsten (Besluit 1: het platform
      boekt niets). Tevens pure `toRevenueRows(invoices)` geëxtraheerd die de 4× gedupliceerde
      factuur→`RevenueSource`-mapping centraliseert; de drie bestaande fetchers gebruiken hem nu ook
      (gedragsbehoudend).
- [x] `src/lib/revenue-trend.test.ts` — 4 nieuwe tests voor `toRevenueRows` (mapping
      `issuedAt`→`occurredAt`, `totalCents` null → 0, volgorde/lengte behouden, lege invoer).
- [x] `src/app/(protected)/admin/statistieken/page.tsx` — parallelle fetch + nieuwe BI-sectie
      "Doorzet" met de `RevenueTrendCard` ("Gefactureerd volume per maand") + een toelichtingsregel
      dat dit doorzet is, geen platform-inkomsten. Spiegelt de omzettrend op /inzicht naar de
      platform-brede admin-context.

Gates groen: typecheck ✓, lint ✓, test 2220 ✓ (+4), build ✓ (`/admin/statistieken` aanwezig),
`prettier --check .` ✓.

---

## feat(opdracht): reactiebereidheid-signaal opdrachtgever op /opdrachten/[id]

Derde opdrachtgever-vertrouwenssignaal voor de ZZP'er op de opdracht-detail, naast betaalgedrag
(`payment-behavior.ts`) en annuleringsgedrag (`client-reliability.ts`): **pakt deze opdrachtgever
binnengekomen reacties op of laat hij ze op `NEW` liggen?** Deterministisch afgeleid uit de
onveranderlijke `Application.createdAt` + de huidige `status` (geen afhankelijkheid van het
driftgevoelige `updatedAt`). Read-only, server-side, geaggregeerd (privacy — geen reactie van een
andere ZZP'er zichtbaar), geen schemawijziging, geen mutatie.

- [x] `src/lib/client-responsiveness.ts` — pure `computeClientResponsiveness(rows, now)`: "opgepakt"
      = status !== "NEW"; openstaand = nog `NEW` + leeftijd (now − createdAt, op 0 geklemd bij
      data-ruis). Toon: `good` (≥ 80% opgepakt én niets > 14 dagen open), `warning` (< 50% opgepakt
      óf een reactie > 14 dagen op NEW), `neutral` ertussenin, `unknown` < 3 reacties.
- [x] `src/lib/data/client-responsiveness.ts` — `getClientResponsivenessForCompany(companyId, now)`:
      begrensde query (`application.findMany where job.companyId`, `take: 100`, nieuwste eerst).
- [x] `src/components/jobs/client-responsiveness-block.tsx` — `ClientResponsivenessBlock`: compact
      blok (toon-badge + %-opgepakt / nog-open / oudste-open), spiegelt de twee bestaande blokken.
- [x] `src/app/(protected)/opdrachten/[id]/page.tsx` — meegefetcht in de bestaande
      `showClientSignals`-`Promise.all` (alleen niet-eigenaar FREELANCER) en gerenderd onder de twee
      bestaande signaalblokken.
- [x] Tests: `client-responsiveness.test.ts` (10) — grenzen toon/steekproef, oudste-open + stale,
      toekomst-createdAt klem, lege lijst. Gate groen: typecheck ✓, lint ✓, test **2226** ✓ (+10),
      prettier ✓, build ✓ (`/opdrachten/[id]` aanwezig).

## feat(kandidaten): leverbetrouwbaarheid-signaal ZZP'er voor de opdrachtgever (PR #447)

De opdrachtgever ziet nu per kandidaat op `/kandidaten` de **leverbetrouwbaarheid** van de ZZP'er —
het spiegelbeeld van de vertrouwenssignalen (betaalgedrag/annuleringsgedrag/reactiebereidheid) die de
ZZP'er over de opdrachtgever op `/opdrachten/[id]` ziet. Read-only, server-side, geen schemawijziging,
geen mutatie. Verbergt zich bij een te kleine steekproef (geen misleidende cijfers).

- [x] `src/lib/collaboration-quality.ts` — pure batch-aggregator `computeDeliveryQualityByProfile`
      (+ `ProfilePerfRow`): groepeert goedgekeurde prestaties + completed-tellingen naar één
      `DeliveryQuality` per profiel; hergebruikt de bestaande `computeDeliveryQuality`.
- [x] `src/lib/data/freelancer-delivery-quality.ts` — `getDeliveryQualityForProfiles(profileIds)`:
      twee gebatchte, begrensde queries (geen N+1), `groupBy` voor afgeronde samenwerkingen +
      `findMany` (take 5000) voor goedgekeurde prestaties.
- [x] `src/components/freelancer/delivery-quality-block.tsx` — `DeliveryQualityBlock`: compacte regel
      met toon-badge + in-één-keer-akkoord %/gecorrigeerd/gem. doorlooptijd; null bij INSUFFICIENT.
- [x] `src/app/(protected)/kandidaten/page.tsx` — één gebatchte fetch over alle reagerende profielen,
      blok per kandidaat onder de verificatiemarkers.
- [x] Tests: `collaboration-quality.test.ts` +5 (groepering per profiel, dedup, lege set,
      geen cross-contaminatie). typecheck ✓ · lint ✓ · test 2225 ✓ · build ✓ · prettier ✓.

## routine: CSV-export voor /verplichtingen (opdrachtgever) + /prognose (ZZP'er)

`/prestaties` en `/diensten` hadden al een "Exporteren"-knop + CSV-route; de spiegelpagina's
`/verplichtingen` (CLIENT betaalverplichtingen) en `/prognose` (FREELANCER inkomstenprognose) niet,
terwijl de pure motor (`buildPaymentObligations` / `buildIncomeForecast`) al bestond. Symmetrisch
gesloten met een gebucketteerde CSV-export per pagina (zelfde bucket-volgorde als het scherm).
Read-only, server-side, rolgegate, **geen schemawijziging, geen mutatie**.

- [x] `src/lib/data/payment-obligations.ts` (nieuw) — `getObligationItemsForClient(userId)`: de twee
      bestaande `invoice.findMany`-queries (scheduled + OVERDUE-zonder-vervaldag-vangnet, gemerged +
      gededupliceerd op factuur-id) verhuisd uit het paneel → één bron voor paneel én export.
- [x] `src/lib/data/income-forecast.ts` (nieuw) — `getForecastItemsForFreelancer(userId)`: idem voor
      de prognose-query.
- [x] `src/lib/payment-obligations.ts` / `src/lib/income-forecast.ts` — pure `exportObligationsCsv` /
      `exportForecastCsv(items, now)`: bouwen via `buildPaymentObligations`/`buildIncomeForecast`,
      één rij per factuur in bucket-volgorde, 9 NL-kolommen (Categorie/Status/Tegenpartij/Opdracht/
      Factuurnummer/Vervaldatum (of Verwachte datum)/Netto/BTW/Bruto EUR), via de canonieke `toCsv`
      uit `lib/csv.ts` (RFC4180 + formule-injectie-guard); komma-decimaal voor Excel-NL.
- [x] `src/app/(protected)/verplichtingen/export/route.ts` + `…/prognose/export/route.ts` (nieuw) —
      GET, rolgegate (CLIENT resp. FREELANCER → anders 403), `text/csv` + gedateerde
      `Content-Disposition`-bestandsnaam; spiegelen de prestaties/diensten-route exact.
- [x] `verplichtingen-panel.tsx` / `prognose-panel.tsx` — optionele `items?`-prop (anders zelf
      fetchen via de data-laag); de hub-render blijft ongemoeid. `…/verplichtingen/page.tsx` +
      `…/prognose/page.tsx` — fetchen `items`, geven die door aan het paneel (geen dubbele query) en
      tonen de "Exporteren"-knop in `PageHeader.action` alleen bij data.
- [x] Tests: `payment-obligations.test.ts` (+6) en `income-forecast.test.ts` (+5) voor de exporters
      (kop aanwezig, één rij per item, bucket-label als Categorie, komma-decimaal, lege set → kop).
      Gate groen: typecheck ✓, lint ✓, test **2231** ✓, prettier ✓, build ✓ (beide `/…/export`-routes
      aanwezig).

## feat(dashboard): #19-werkruimte voor álle rollen (ZZP'er, opdrachtgever, bemiddelaar, admin)

Het dashboard is voor elke rol omgezet naar de gekozen ontwerprichting **#19** (drie-koloms
werkruimte: icoon-navigatierail + hoofdkolom + contextuele rechterrail), 1:1 met de lab-referentie
`src/components/ontwerp/layouts/ontwerp-9.tsx`. Echte, server-side data per rol — geen slop.

- [x] `src/components/dashboard/workspace-dashboard.tsx` — gedeelde, presentationele #19-werkruimte:
      onderlijnde kop, KPI-tegels, lijst (avatar + naam + verificatie + rol + locatie + tarief +
      match + statuschip), en een **volle-hoogte `border-l` contextrail** met "Volgende acties",
      week-strip en compliance-zegel. Witte kaarten (`bg-card`) op een crème vlak (`bg-background`),
      gescheiden door de border-lijn — net als #19.
- [x] `src/components/app-shell.tsx` — `/dashboard` rendert **flush** (geen 6xl-klem, eigen layout)
      voor alle rollen, omkaderd als `rounded-2xl`-kaart met marge. Bovenbalk uitgelijnd op `h-9`
      (zoeken + thema + bel + rolspecifieke primaire actie) — één strip, zoals #19.
- [x] `src/app/(protected)/dashboard/page.tsx` — data + mapping per rol: FREELANCER (matches +
      inzetbaarheid), CLIENT (`getClientStats` + voorgestelde ZZP'ers + compliance-zegel),
      FRANCHISER (roster-lijst + roster-compliance-zegel), ADMIN (platformbrede "Wat loopt er nu" +
      platformstatus-zegel). Week-strip altijd de huidige ISO-week ("vandaag" gemarkeerd); spreekt
      van **"diensten"**. Avatar-accenten cyclen per rij. Oude tweekoloms-helpers verwijderd.
- [x] Tests: `e2e/smoke.spec.ts`-ankers bijgewerkt (werkplek-tekst verviel); `acties.spec` dashboard-
      zone wijst naar `/acties` (inline-afhandeling leeft daar). Gate groen: typecheck, lint, 2216
      unit-tests, prettier, build. PR's #435/#437/#438/#439/#440 gemerged; #441 (bemiddelaar+admin)
      in de poort.

## feat(rooster): agenda — eigen geplande diensten naast open kansen

`/rooster` toonde alleen open diensten (PUBLISHED jobs met startdatum); de ZZP'er zag z'n eigen
geboekte/geplande diensten (uit actieve samenwerkingen) nergens op de kalender — alleen de
dashboard-week-strip dekt de huidige ISO-week. Dit maakt `/rooster` een echte agenda over de
21-daagse horizon: eigen geboekte diensten + open kansen, visueel onderscheiden. Read-only,
server-side, afgeleid uit bestaande data, **geen schemawijziging, geen mutatie**.

- [x] `src/lib/roster-market.ts` — pure `buildAgenda(open, collaborations, now, horizonDays)`:
      projecteert elke actieve samenwerking over het geklemde venster `[vandaag, horizon]` (open
      start → vanaf vandaag, open eind → t/m horizon), respecteert het ADR-0004-weekrooster
      (`weekdays` → `scheduled:true` op de vastgelegde dagen; anders elke venster-dag
      `scheduled:false`) en overlayt de geboekte diensten op de open-kalenderdagen (nieuwe dagen voor
      booked-only). Hergebruikt de bestaande helpers `utcMidnightMs`/`utcDayToWeekday`; bestaande
      exports/gedrag ongemoeid; muteert geen input.
- [x] `src/lib/roster-market.test.ts` — 11 nieuwe tests (weekdays-projectie, venster-defaults +
      horizon-klem, verleden/na-horizon dragen niets bij, merge open+booked / booked-only,
      intra-dag-sortering, totalen, non-mutatie). Totaal 31 in dit bestand.
- [x] `src/app/(protected)/rooster/page.tsx` — FREELANCER-only `collaboration.findMany`
      (PROPOSED/ACTIVE, `take: 100`) → `bookedInputs` via `parseWeekdays`; `buildAgenda(calendar, …)`
      (sterke-match-filter blijft alleen op open diensten, booked altijd zichtbaar). Per dag een
      "Jouw diensten"-groep (success-accent, "Geboekt"-badge, link naar `/samenwerkingen/[id]`,
      "volgens looptijd"-noot bij afgeleide dagen) boven de "Open diensten"-groep; empty-state alleen
      bij geen booked én geen open.

Gates groen: typecheck ✓, lint ✓, test 2173 ✓ (+11), build ✓ (`/rooster` aanwezig),
`prettier --check .` ✓.

---

## docs: persona-sweep-backlog 2026-06-16 reconciliëren (beide bevindingen al geadresseerd)

De persona-sweep van 16-6 draaide tegen basis-commit `f3652c5` en kruiste de bevindingen niet met
al-gemergd werk of bestaande ADR's. Bij naloop bleken **beide** bevindingen al afgehandeld op `main`;
er was geen openstaand beveiligings-/robuustheidsgat en geen geschikt, niet-overlappend BOUWEN-item.
Backlog gereconcilieerd zodat de volgende run/sweep niet opnieuw onderzoekt (of A1 destructief "fixt").

- [x] **A1 (soft-404, LAAG) — GEACCEPTEERD.** Reeds vastgelegd in
      `docs/decisions/0009-soft-404-auth-routes.md` (15-6): inherent App-Router-streaming-gedrag (de
      async `(protected)/layout.tsx` + `loading.tsx`-Suspensegrenzen flushen de schil met 200 vóór
      `notFound()`), geen datalek, achter login. Een echte 404 zou de laadskeletons offeren (harde
      DESIGN-regel; voor `/certificaten/[id]` en `/berichten/[id]` expliciet behouden, zie de
      comments in hun segment-`loading.tsx`). Niet "fixen" door laadstaten te slopen.
- [x] **B1 (cross-role-crash, MEDIUM) — OPGELOST.** Gemerged in PR #395 (commit `2d686c2`) ná de
      basis-commit van de sweep: `roleForPath()` (`src/lib/route-guards.ts`) + middleware-redirect,
      analoog aan `isAdminPath`/`isFranchisePath`. Dekt alle door B1 genoemde routes.
- [x] `docs/PERSONA-SWEEP-BACKLOG.md` — reconciliatie-sectie + A1/B1 als dicht gemarkeerd (record
      blijft staan). Geen code-/schemawijziging; gates ongemoeid.

## feat(admin): disputen-gezondheid (doorlooptijd + urgent) op /admin/statistieken

De platform-statistieken toonden voor disputen alleen een kale "Open disputen"-telling — geen zicht
op hóe lang een dispuut al openstaat of hoeveel er urgent zijn geworden. Zolang een dispuut openstaat
ligt de betalingscascade stil, dus leeftijd is het signaal dat telt. Dit trekt de disputen-sectie
gelijk met de bestaande verificatie-wachtrij-gezondheid (oudste + stale-telling). Read-only,
server-side, deterministisch, **geen schemawijziging** (afgeleid uit de bestaande `disputedAt`).

- [x] `src/lib/disputes.ts` — `DisputeHealth` interface (`open`/`oldestAgeDays`/`urgentCount`) +
      pure `disputeUrgentThreshold(now)`: drempeldatum waarvóór een dispuut >= `urgentDays` openstaat
      (URGENT), zodat een goedkope `count` volstaat zonder alle rijen te laden. Consistent met
      `disputeAgeDays` (een dispuut precies op de drempel telt als URGENT).
- [x] `src/lib/disputes.test.ts` — 4 nieuwe unit-tests: drempel ligt exact `urgentDays` vóór now,
      consistentie met `disputeAgeDays`/`disputeUrgency` op de grens, net-jonger valt buiten de `lte`,
      en de now-default. Totaal 49 in dit + admin-stats-bestand.
- [x] `src/lib/admin-stats.ts` — `openDisputes: number` op `PlatformStats` vervangen door
      `disputes: DisputeHealth`; query uitgebreid met een begrensde `findFirst` (oudste open dispuut,
      alleen `disputedAt`) + een `count` op `disputeUrgentThreshold(now)`. Beide begrensd, geen findMany.
- [x] `src/app/(protected)/admin/statistieken/page.tsx` — nieuwe sectie "Disputen" (Gavel-icoon) met
      3 gezondheidskaarten: Open disputen, Langst open (tone op de raised/urgent-drempels), Urgent
      (`urgentDays`+ open). De misplaatste "Open disputen"-kaart uit de Certificaten-sectie verwijderd;
      de waarschuwingsbanner benoemt nu ook het urgent-aantal.

Gates groen: typecheck ✓, lint ✓, test 2085 ✓ (+4), build ✓, `prettier --check .` ✓.

---

## feat(reacties): reactie-uitkomsten samenvatting voor de ZZP'er (slaagkans)

`/reacties` toonde elke reactie los met haar status, maar de ZZP'er kreeg geen totaalbeeld: hoeveel
van mijn reacties worden bekeken, staan op de shortlist en worden geaccepteerd? Dit voegt een
compacte uitkomsten-samenvatting toe boven de lijst, met de slaagkans (responspercentage +
acceptatiegraad). Read-only, server-side, deterministisch, **geen schemawijziging, geen extra query**
(afgeleid uit de al opgehaalde reacties).

- [x] `src/lib/application-outcomes.ts` — pure `summarizeApplicationOutcomes(applications, minSample)`
      → `ApplicationOutcomes`: tellingen (total/open/shortlisted/accepted/rejected/seen/collaborations) + `responseRate` (bekeken/totaal) en `acceptanceRate` (geaccepteerd / beoordeeld =
      geaccepteerd+afgewezen); percentages `null` onder `APPLICATION_OUTCOME_MIN_SAMPLE = 4` zodat de
      UI nooit met een misleidende "100%" uit één reactie pronkt. Open = NEW+VIEWED+SHORTLIST, seen =
      status ≠ NEW; commerciële afronding; muteert de invoer niet, geen I/O.
- [x] `src/lib/application-outcomes.test.ts` — 11 unit-tests: lege lijst → nullen, per-status-telling,
      seen-definitie, samenwerkingen, response/acceptance-drempel (op/onder), beoordeeld-noemer sluit
      open reacties uit, afronding, aangepaste minSample, non-mutatie.
- [x] `src/components/applications/outcomes-summary.tsx` — presentationele 4-koloms StatCard-strip
      (Verstuurd/Bekeken/Op shortlist/Geaccepteerd) met sub-teksten (responspercentage,
      acceptatiegraad of gestarte samenwerkingen). Verbergt zichzelf bij < 3 reacties (rustige pagina).
- [x] `src/app/(protected)/reacties/page.tsx` — uitkomsten berekend uit de bestaande reacties + strip
      boven de lijst; `unbounded-queries.test.ts`-allowlist regelnummer bijgewerkt (52 → 54).

Gates groen: typecheck ✓, lint ✓, test 2092 ✓ (+11), build ✓ (`/reacties` aanwezig), prettier --check . ✓.

---

## fix(review-batch): should-fixes deel 2 — #367 / #368 / #372 (15-6-2026)

Drie review-should-fixes uit de nachtbatch #367–#372 verwerkt (geen blockers, opportunistisch).
#369 en #370 waren al in-flight (PR #387 / #383); #371 (component-render-test) is bewust
overgeslagen — er is geen jsdom/`@testing-library/react` en de Vitest-omgeving staat op `node`, dus
een DOM-render-test zou een infra-wijziging vergen die niet in verhouding staat tot één should-fix
(en `next/link` onder `react-dom/server` is broos). #371 blijft open in de backlog.

- [x] **#367 betrouwbaarheidssignaal** (`lib/client-reliability.ts` + `lib/data/client-reliability.ts`):
      defensieve noemer-guard zodat een rij die zowel `COMPLETED` is áls een eigen annulering draagt
      niet dubbel telt (alleen via de teller); en de data-laag geeft nu een neutraal `unknown`-signaal
      terug wanneer de `company` null is, i.p.v. een te positief signaal (zonder bekende eigenaar kan
      een annulering niet aan de opdrachtgever worden toegeschreven). +2 unit-tests (totaal 2083).
- [x] **#368 rooster sterke-match** (`rooster/page.tsx`): nette melding "Geen sterke matches op dit
      moment — hieronder staan alle open diensten" wanneer `?match=sterk` handmatig actief is maar
      `strongCalendar.total === 0` (viel voorheen stil terug op alle diensten zonder uitleg).
- [x] **#372 betaalverplichtingen** (`verplichtingen/page.tsx`): scope direct op `counterpartyUserId`
      (de gezaghebbende sleutel, met de dedicated index `[counterpartyUserId, lifecycleStatus]`) i.p.v.
      de 3-way join door collaboration → company → user; + een begrensd vangnet dat OVERDUE-facturen
      zónder `dueAt` gericht ophaalt en op id dedupliceert, zodat ze niet door `nulls: "last"` + de
      `take: 200`-cap kunnen wegvallen. Read-only, server-side, geen schemawijziging.

Gates groen: typecheck ✓, lint ✓, test 2083 ✓ (+2), build ✓, `prettier --check .` ✓.
(E2e niet in de routine — geen browser-channel; CI draait e2e.)

---

## fix(markttarief): niet-afgeronde p25/p75 in de marktband — consistente grensclassificatie (#369)

Review-should-fix **#369** uit de nachtbatch. `JobRateBandCard` (op `/opdrachten/nieuw` +
`/opdrachten/[id]/bewerken`) bepaalde de tariefpositie via `ratePosition` op de **afgeronde** `p25`/`p75`
uit de marktband, terwijl `/profiel/bewerken` (`computeMarketRate`) de **niet-afgeronde** percentielen
gebruikt. Bij een tarief vlak bij een grens kon dezelfde waarde op de twee oppervlakken anders
classificeren (below/within/above). Opgelost door de niet-afgeronde percentielen in de band mee te geven.

- [x] `src/lib/market-rate.ts` — `MarketBand` uitgebreid met `p25Raw`/`p75Raw` (niet-afgerond, null bij
      scope "none"); `computeMarketBand` geeft ze terug. De afgeronde `p25`/`p75` blijven voor weergave.
- [x] `src/components/jobs/job-rate-band-card.tsx` — `ratePosition(p25Raw, p75Raw, rateMin)` i.p.v. de
      afgeronde grenswaarden; weergave (mediaan + middenmoot) ongewijzigd op de afgeronde waarden.
- [x] `src/lib/market-rate.test.ts` — +3 tests: p25Raw/p75Raw gelijk aan afgerond bij hele percentielen,
      niet-afgeronde grenswaarden bewaard bij niet-hele percentielen (40.75/42.25) + consistente
      classificatie, en null bij scope "none". Suite: 37 (markt-rate), 2064 totaal.

Read-only consumer, server-side waarheid, geen schemawijziging, geen extra query. Gate lokaal groen:
typecheck ✓ · lint ✓ · test 2064 ✓ · build ✓ · prettier ✓. E2e via CI.

---

## fix(verificatie): dedicated `submittedAt` voor de wachtrij-leeftijd (review-should-fix #370)

De verificatie-wachtrij (kerndifferentiator) berekende de wachttijd uit `Credential.updatedAt`. Elke
bewerking van een ingediend certificaat (titel, zichtbaarheid, opnieuw uploaden) zette `updatedAt`
terug, waardoor de "N dagen wachtend"-leeftijd en de "te lang in wachtrij"-telling te laag uitvielen.
Dit voegt een eigen `submittedAt`-tijdstip toe dat alléén bij de overgang → SUBMITTED wordt gezet,
zodat de doorlooptijd klopt ongeacht latere edits.

- [x] `prisma/schema.prisma` — `Credential.submittedAt DateTime?` + composite index
      `@@index([status, submittedAt])` voor oudste-eerst + de stale-`count`.
- [x] `src/app/(protected)/certificaten/actions.ts` — `submittedAt: new Date()` gezet bij de drie
      overgangen naar SUBMITTED (resubmit met nieuw bewijsstuk, herverificatie na feitwijziging,
      `requestVerification`).
- [x] `src/lib/verification-queue.ts` — `waitingSince({submittedAt, updatedAt})` (valt terug op
      `updatedAt` voor legacy-records zonder `submittedAt`); `summarizeVerificationQueue` rekent nu op
      `submittedAt`. `staleThreshold`-doc bijgewerkt.
- [x] `src/app/(protected)/admin/verificaties/page.tsx` — orderBy op `submittedAt asc (nulls last)`,
      `daysWaiting(waitingSince(c), now)` voor de per-rij-badge.
- [x] `src/lib/admin-stats.ts` — oudste-aanvraag findFirst + stale-`count` op `submittedAt` met
      legacy-fallback (`OR submittedAt null → updatedAt`).
- [x] `prisma/seed.ts` — `submittedAt` voor SUBMITTED-demo-credentials met deterministische spreiding
      (2–8 dagen) zodat de wachtrij realistisch oogt; idempotent (alleen op `create`).
- [x] `src/lib/verification-queue.test.ts` — +6 tests (waitingSince fallback + "edit zet wachttijd niet
      terug", summarize op submittedAt, legacy-null-fallback). `unbounded-queries.test.ts`-allowlist
      regelnummer bijgewerkt (32 → 33 door de extra import).

Gates groen: typecheck ✓, lint ✓, test 2019 ✓ (+6), build ✓, `prettier --write .` ✓.
(E2e niet in de routine — geen browser-channel, zie CLAUDE.md; CI draait e2e.)

---

## feat(reviews): tweezijdige beoordelingen — double-blind (simultane onthulling) (#384, 15-6-2026)

De geparkeerde reviews-feature live gebracht, maar als **trust-primitive met double-blind reveal**
(zoals Airbnb) i.p.v. direct publiceren — anders is vergelding ("2 sterren terug") de dominante
faalmodus en verwordt het systeem tot 4,9-ster-inflatie. Beoordeling na een **afgeronde**
samenwerking; blind tot **min(beide ingediend, venster sluit)**; gelockt bij indienen; submission
sluit voor béide partijen bij venstereinde (zo kan een gepubliceerde beoordeling niet meer vergolden
worden). Productbesluit eigenaar (15-6): double-blind, admin mag blinde reviews zien voor moderatie
(gelabeld), notificatie zonder score tijdens het venster.

- [x] `prisma/schema.prisma` — `Collaboration.completedAt` (venster-anker); `Review.status`
      (`PENDING_REVEAL`→`PUBLISHED`) + `publishedAt` + `revealDeadline` + indexen
      (`[subjectId,direction,status]`, `[status,revealDeadline]`).
- [x] `src/lib/cascade/apply.ts` + `src/app/(protected)/samenwerkingen/actions.ts` — `completedAt`
      gestempeld op **beide** afrondingspaden (betalings-cascade én handmatige afronding). Het missen
      van het tweede pad was de BLOCKER uit de adversariële review (venster viel terug op `createdAt`).
- [x] `src/lib/reviews.ts` (+ test, 45 tests) — pure logica: `reviewWindowCloses/Open`, `isRevealDue`,
      `canLeaveReview` met `windowClosed`; `aggregateReviews` (gemiddelde over álle PUBLISHED).
- [x] `src/app/(protected)/samenwerkingen/[id]/review-actions.ts` — auth→deelnemer→COMPLETED→venster
      open→Zod→max-één→atomair (review+notificatie+audit); mutual reveal race-veilig t.o.v. de cron.
- [x] `src/lib/reviews-reveal-task.ts` + `/api/tasks/reviews-reveal` + `run-all` — cron-sweep publiceert
      verstreken `PENDING_REVEAL` (atomair, idempotent via status-guard, notificeert beide partijen).
- [x] Weergave: publiek profiel (`profile-screen.tsx`) + samenwerking-detail filteren strikt op
      `PUBLISHED`; tegenpartij ziet blinde review nooit; admin ziet beide richtingen (blind gelabeld).
- [x] `src/lib/config.ts` `reviewBlindDays()` (env `REVIEW_BLIND_DAYS`, default 14) +
      `.env.example`-documentatie; seed: historische samenwerkingen `completedAt` + reviews `PUBLISHED`.

Adversariële review (reviewer + security) vóór merge: 1 BLOCKER (tweede afrondingspad) + should-fixes
(cron-atomiciteit, mutual-reveal-race, auteur-notificatie) verwerkt. CI-poort groen: `check`, `e2e`
(2 shards), `audit`, `secret-scan`. Gemerged (`--admin`, advisory `review`-job non-blocking).

---

## feat(prestaties): wachttijd-zicht op de goedkeuringswachtrij van de opdrachtgever

`/prestaties` toonde per ingediende prestatie alleen de indiendatum ("Ingediend op X") — niet
hóe lang die al op goedkeuring wacht. Een prestatie die blijft liggen stalt de hele
facturatiecascade (geen concept-factuur, geen betaling). Dit maakt de doorlooptijd zichtbaar en
signaleert te lang wachtende prestaties, zodat de opdrachtgever tijdig keurt. Read-only,
server-side, deterministisch, **geen schemawijziging, geen extra query** (afgeleid uit de al
opgehaalde `submittedAt`).

- [x] `src/lib/performance-approval.ts` — pure module: `PERFORMANCE_APPROVAL_STALE_DAYS = 3`,
      `summarizePerformanceApproval(items, now)` → `{ pending, oldestDays, staleCount }` (negeert
      items zonder `submittedAt`, muteert niet). Hergebruikt de generieke `daysWaiting`/`waitingLabel`
      uit `verification-queue.ts` (re-export — "vandaag ingediend"/"N dagen wachtend" geldt voor beide
      wachtrijen) i.p.v. ze te dupliceren.
- [x] `src/lib/performance-approval.test.ts` — 8 unit-tests: re-export-helpers, lege invoer,
      null-`submittedAt` genegeerd, pending/oudste/stale-telling, stale-grensgeval (exact = telt mee /
      −1 = niet), numerieke klok, non-mutatie.
- [x] `src/app/(protected)/prestaties/page.tsx` — wachtrij-samenvatting berekend over de SUBMITTED-
      prestaties; header toont een warning-regel "N prestaties wachten al ≥ 3 dagen — houdt de
      facturatie tegen" bij stale items; per SUBMITTED-rij "Ingediend op X · N dagen wachtend"
      (warning-tint zodra ≥ drempel). Bestaande filter/export/keuren-flow ongewijzigd.

Gates groen: typecheck ✓, lint ✓, test 1992 ✓ (+8), build ✓, `prettier --check .` ✓.
(E2e niet in de routine — geen browser-channel, zie CLAUDE.md; CI draait e2e.)

---

## feat(verplichtingen): betaalverplichtingen-prognose voor de opdrachtgever (branch `claude/keen-wozniak-6jnz3g`)

Spiegelbeeld van de bestaande inkomstenprognose (`/prognose`, alleen FREELANCER): de opdrachtgever
had geen cashflow-uit-overzicht van wat hij nog moet betalen. Deze increment voegt een
betaalverplichtingen-tijdlijn toe op `/verplichtingen` (CLIENT-only), met dezelfde bucketing als de
inkomstenprognose maar met opdrachtgever-semantiek: een DRAFT-factuur is nog niet naar de
opdrachtgever verstuurd en telt nooit als verplichting — alleen SUBMITTED/APPROVED/OVERDUE.
Read-only, server-side, deterministisch, **geen schemawijziging**.

- [x] `src/lib/payment-obligations.ts` — pure `buildPaymentObligations(items, now)` →
      `PaymentObligations`: bucket per UTC-kalendermaand (OVERDUE / THIS_MONTH / NEXT_MONTH / LATER /
      UNSCHEDULED), past-due (OVERDUE-status óf `dueDate < startOfToday`) → OVERDUE, SUBMITTED zonder
      vervaldag → UNSCHEDULED ("Nog goed te keuren"); per-bucket net/btw/bruto som + samenvatting
      `awaitingApprovalGrossCents` (SUBMITTED) / `scheduledGrossCents` (APPROVED toekomst) /
      `overdueGrossCents` / totalen; binnen een bucket gesorteerd dueDate asc → bruto desc →
      invoiceId asc; muteert de invoer niet, geen I/O.
- [x] `src/lib/payment-obligations.test.ts` — 12 unit-tests: lege invoer, maand-bucketing, dec→jan
      wrap, OVERDUE-status met toekomstdatum, APPROVED met verstreken datum → overdue, vervaldag
      exact op start-vandaag → niet-overdue, SUBMITTED → UNSCHEDULED, bucketvolgorde, sortering +
      tie-breaks, aggregatie net/btw/bruto, non-mutatie.
- [x] `src/app/(protected)/verplichtingen/page.tsx` — CLIENT-only (anders redirect /administratie);
      begrensde query (`take: 200`, `dueAt asc nulls last`) over de cascade-facturen gericht aan de
      opdrachtgever (`collaboration.company.userId`); samenvattingsstrip (goed te keuren / ingepland /
      te laat / totaal), bucket-secties met factuurregels (ZZP'er-naam, statuschip, opdracht, nummer,
      vervaldag), BTW-voorbelasting-hint, prognose-disclaimer, empty-state.
- [x] `src/app/(protected)/verplichtingen/loading.tsx` — skeleton (PageHeader + lijst).
- [x] `src/lib/nav.ts` — navitem "Verplichtingen" voor CLIENT onder Administratie, ná Openstaand.

Gates groen: typecheck ✓, lint ✓, test 1955 ✓ (+12), build ✓ (`/verplichtingen` aanwezig),
`prettier --write .` ✓. (E2e via CI — geen browser-channel in de routine.)

---

## feat(certificaten): vervalkalender — overzicht van (bijna) verlopen certificaten (branch `claude/keen-wozniak-d0wjas`)

De `/certificaten`-pagina toonde de vervaldatum alleen per kaart; een ZZP'er met meerdere
bewijsstukken zag niet in één oogopslag wat als eerste vernieuwd moet worden. Dit voegt een
geaggregeerde vervalkalender toe boven de certificaatlijst — op de kerndifferentiator
(verificatie/expiry). Read-only, server-side, deterministisch, **geen schemawijziging, geen extra
query** (afgeleid uit de al opgehaalde certificaten).

- [x] `src/lib/credential-expiry-overview.ts` — pure `summarizeExpiry(creds, now)` →
      `ExpiryOverview`: bucket VERIFIED/EXPIRED-certificaten mét vervaldatum in vensters
      (EXPIRED / WITHIN_30 / WITHIN_60 / WITHIN_90, horizon `EXPIRY_HORIZON_DAYS = 90`), sorteert
      meest urgent eerst (dagen oplopend, tie-break op titel), telt per venster; muteert de invoer
      niet. EXPIRED-status telt altijd als verlopen; DRAFT/SUBMITTED/REJECTED en certificaten zonder
      vervaldatum vallen weg.
- [x] `src/lib/credential-expiry-overview.test.ts` — 10 unit-tests: lege kalender, venster-indeling,
      horizon-grens (exact = wél / +1 = weg), VERIFIED-maar-verstreken → verlopen, EXPIRED-status met
      toekomstdatum → verlopen, niet-verlopende statussen genegeerd, geen vervaldatum genegeerd,
      sortering + tie-break, non-mutatie.
- [x] `src/components/credentials/expiry-overview-card.tsx` — presentationele server-component:
      venster-chips (verlopen/30/60/90), top-5 urgentste certificaten met type-label + dagen-tekst,
      link naar `/certificaten/[id]/bewerken` om te vernieuwen, "+N binnen 90 dagen"-noot. Verbergt
      zichzelf zodra niets binnen de horizon verloopt (rustige pagina).
- [x] `certificaten/(index)/page.tsx` — kaart gerenderd tussen MandatoryDocuments en de lijst;
      `unbounded-queries.test.ts`-allowlist regelnummer bijgewerkt (63 → 65 door de extra imports).

Gates groen: typecheck ✓, lint ✓, test 1953 ✓ (+10), build ✓, prettier --write . ✓.
(E2e niet in de routine — geen browser-channel; CI draait e2e.)

---

## feat(admin): verificatie-wachtrij gezondheid (doorlooptijd + te-lang-wachtend) op /admin/statistieken

De platform-statistieken toonden voor de kerndifferentiator (certificaat-verificatie) alleen een
kale wachtrij-telling — geen zicht op doorlooptijd of of er aanvragen blijven liggen. De
verificatie-wachtrijpagina had bovendien `STALE_DAYS`/`daysWaiting`/`waitingLabel` lokaal
gedupliceerd. Dit consolideert die logica in één geteste pure module en surface't de
wachtrij-gezondheid op de statistiekenpagina. Read-only, server-side, deterministisch, **geen
schemawijziging**.

- [x] `src/lib/verification-queue.ts` — pure module: `VERIFICATION_STALE_DAYS = 5`, `daysWaiting`
      (hele dagen, geïnjecteerde klok als `Date|number`), `waitingLabel`, `summarizeVerificationQueue`
      (→ `{ pending, oldestDays, staleCount }`, muteert niet) en `staleThreshold(now)` voor een
      goedkope `count`-primitive (geen onbegrensde findMany in de hot statistiek-query).
- [x] `src/lib/verification-queue.test.ts` — 15 unit-tests: floor/non-negatief/getalsklok,
      labels (enkel/meervoud), lege wachtrij, oudste-bepaling, stale-grensgeval (exact = telt mee),
      non-mutatie, en consistentie tussen `staleThreshold` en `summarizeVerificationQueue` op de grens.
- [x] `src/lib/admin-stats.ts` — `pendingVerifications` vervangen door
      `verificationQueue: VerificationQueueHealth`; query uitgebreid met `findFirst` (oudste, alleen
      `updatedAt`) + `count` (stale via `staleThreshold`), beide begrensd.
- [x] `src/app/(protected)/admin/statistieken/page.tsx` — certificaten-sectie naar 4 kaarten:
      Wachtrij, Langst wachtend (oudste aanvraag, warning ≥ drempel), Te lang in wachtrij
      (stale-telling), Open disputen.
- [x] `src/app/(protected)/admin/verificaties/page.tsx` — lokale helpers verwijderd; gebruikt nu de
      gedeelde module (`summarizeVerificationQueue` + `waitingLabel` + `VERIFICATION_STALE_DAYS`);
      header toont ook de stale-telling. Vangrail-allowlist regelnummer bijgewerkt (36 → 32).

Gates groen: typecheck ✓, lint ✓, test 1958 ✓ (+15), build ✓, `prettier --check .` ✓.
(E2e niet in de routine — geen browser-channel, zie CLAUDE.md; CI draait e2e.)

---

## feat(opdrachten): markttarief-band op het opdracht-formulier (branch `claude/keen-wozniak-14ij6l`)

De `market-rate.ts`-motor toonde een geanonimiseerde marktband alleen aan de ZZP'er op
`/profiel/bewerken`. De opdrachtgever die een tarief voor een opdracht bepaalt had geen
marktreferentie — alleen de rechtsvermoeden-drempel (< €38/u). Dit voegt dezelfde
geanonimiseerde marktband (mediaan + p25–p75) toe aan het opdracht-formulier, gescoped op de
gekozen branche, met een opdrachtgever-gerichte positie-beoordeling van het ingevulde
minimumtarief. Zowel `Job.rateMin/rateMax` als `FreelancerProfile.hourlyRate` zijn in euro's →
direct vergelijkbaar. Server-side berekend, deterministisch, **geen schemawijziging**.

- [x] `src/lib/market-rate.ts` — pure `computeMarketBand({industryPeerRates, platformPeerRates,
minSample})` → `MarketBand` (scope/sampleSize/median/p25/p75, afgerond) met dezelfde
      scope-keuze (industrie→platform→none) als `computeMarketRate`; pure `ratePosition(p25, p75,
rate)` (below/within/above/unknown, grenzen inclusief). `computeMarketRate` hergebruikt nu
      `ratePosition` (gedragsbehoudend, niet-afgeronde grenzen).
- [x] `src/lib/market-rate.test.ts` — +13 tests (computeMarketBand: scope-keuze, platform-terugval,
      none + voortgangsteller, filtering, non-mutatie; ratePosition: unknown-gevallen, classificatie,
      inclusieve grenzen). 35 in dit bestand.
- [x] `src/lib/data/job-rate-bands.ts` — `getJobRateBands(industryIds)`: één begrensde query
      (`take: MARKET_RATE_SAMPLE_CAP`) over ZZP-uurtarieven + branche-links, in JS per branche
      gebucket → `{ byIndustry, platform }`. Alleen geaggregeerde statistieken (k-anonimiteit via
      `MARKET_RATE_MIN_SAMPLE`).
- [x] `src/components/jobs/job-rate-band-card.tsx` — presentationele band-kaart: mediaan (mono),
      middenmoot p25–p75, scope-chip + sample-telling, opdrachtgever-gerichte positie-tekst
      (onder/in lijn/boven) + disclaimer; rustige "nog niet genoeg profielen"-staat met
      voortgangsteller.
- [x] `opdrachten/job-form.tsx` — props `rateBands`/`platformRateBand`; band reactief op de gekozen
      branche + ingevuld minimumtarief, gerenderd tussen de basisgegevens en de eisen-sectie.
- [x] `opdrachten/nieuw/page.tsx` + `opdrachten/[id]/bewerken/page.tsx` — banden opgehaald en
      doorgegeven. Vangrail-allowlist regelnummers bijgewerkt (imports schoven de findMany's).

Gates groen: typecheck ✓, lint ✓, test 1952 ✓ (+13), build ✓, `prettier --check .` ✓. (E2e via CI —
geen browser-channel in de routine.)

---

## feat(rooster): matchredenen + sterke-match-filter op de discovery-kalender (branch `claude/keen-wozniak-ln7j00`)

Vervolg op Rooster-marktplaats slice 1: de discovery-kalender (`/rooster`) toonde per dienst alleen
een kale "Match X%"-badge — de `reasons` die de matchmotor al berekent werden weggegooid, net zoals
op `/opdrachten` vóór ZZP2-188. Dit trekt de uitlegbaarheid gelijk en voegt een sterke-match-filter
toe zodat een ZZP'er meteen de best passende diensten ziet. Read-only, server-side, **geen
schemawijziging, geen nieuwe query** (alles uit de al opgehaalde matchberekening).

- [x] `src/lib/roster-market.ts` — `RosterShiftInput` uitgebreid met optionele `topReason`/`topGap`
      (de zwaarst wegende troef/minpunt). Nieuwe pure `filterRosterByMinMatch(calendar, min)` +
      `ROSTER_STRONG_MATCH_MIN = 70`: houdt alleen diensten met `matchScore ≥ min`, laat null-scores
      (bv. ADMIN) en lege dagen weg, herberekent `total`, laat `beyondHorizon` ongemoeid, muteert de
      invoer niet.
- [x] `src/lib/roster-market.test.ts` — 6 nieuwe unit-tests (drempel, null-score weg, lege dagen weg,
      `beyondHorizon` behouden, grensgeval exact-op-de-drempel, non-mutatie). Totaal 20 in dit bestand.
- [x] `src/app/(protected)/rooster/page.tsx` — per dienst de volledige `scoreJobForFreelancer`-uitkomst
      (score + `topPositiveReason` + `topGapReason`); reden-regel onder de metadata (groene troef-check + gedempte minpunt-minus, identiek aan `/opdrachten`). Filter-tabs "Alle diensten / Sterke
      matches" via `?match=sterk` (alleen voor een FREELANCER mét ≥ 1 sterke match; server-side
      gefilterd, `aria-current`, telling per tab).

Gates groen: typecheck ✓, lint ✓, test 1949 ✓ (+6), build ✓ (`/rooster` aanwezig), prettier --check . ✓.
(E2e niet in de routine — geen browser-channel; CI draait e2e.) Open vervolg in Fase 3: de
**publiceer-/claim-kant** van de Rooster-marktplaats (opdrachtgever dateert losse diensten; ZZP'er
claimt direct vanuit de kalender).

---

## feat(opdrachten): annuleringsbetrouwbaarheid-signaal van de opdrachtgever (branch `claude/keen-wozniak-jso9v5`)

Spiegelbeeld van het betaalgedrag-signaal (`payment-behavior.ts`): waar dat laat zien hóe een
opdrachtgever betaalt, laat dit zien hoe betrouwbaar hij zich aan afspraken houdt — hoe vaak hij
agreed werk annuleert en hoe vaak last-minute (de chargeable 7-dagen-snapshot). De ZZP'er ziet het
naast het betaalgedrag-blok op de opdracht-detailpagina, vóór hij reageert. Read-only, server-side,
deterministisch, **geen schemawijziging** (afgeleid uit de bestaande annuleringssnapshot-velden op
`Collaboration`).

- [x] `src/lib/client-reliability.ts` — pure `computeClientReliability(rows)`: teller = door de
      opdrachtgever zelf gestarte annuleringen (`byClient && cancelledAt`), noemer = afgeronde
      samenwerkingen + die eigen annuleringen; annuleringen door de ZZP'er tellen niet mee (teller
      noch noemer). `cancelRate`, `lastMinute` (chargeable-subset), toon
      good/neutral/warning/unknown met `MIN_SAMPLE_SIZE = 3` en drempel `> 25%` of een last-minute
      → warning. Geen I/O, muteert de invoer niet.
- [x] `src/lib/client-reliability.test.ts` — 11 unit-tests (steekproefgrens, ZZP'er-annuleringen
      genegeerd, percentage-berekening, alle toon-grenzen, non-mutatie).
- [x] `src/lib/data/client-reliability.ts` — `getClientReliabilityForCompany(companyId)`: laatste 50
      afgewikkelde (COMPLETED/CANCELLED) samenwerkingen per bedrijf + `company.userId` voor de
      `byClient`-attributie (chargeable = definitioneel opdrachtgever, anders `cancelledById ===
ownerUserId`). Alleen geaggregeerde statistieken — geen individuele data zichtbaar.
- [x] `src/components/jobs/client-reliability-block.tsx` — compact blok (kalender-icoon, toon-badge),
      "geen enkele afspraak geannuleerd"-tekst bij 0, anders percentage + evt. last-minute-telling;
      `unknown`-empty-state. Spiegelt het betaalgedrag-blok visueel.
- [x] `opdrachten/[id]/page.tsx` — beide client-signalen samen opgehaald (`Promise.all`, alleen voor
      een niet-eigenaar FREELANCER) en het blok gerenderd direct ná `PaymentBehaviorBlock`.

Gates groen: typecheck ✓, lint ✓, test 1954 ✓ (+11), build ✓, prettier --write . ✓. (E2e niet in de
routine — geen browser-channel, zie CLAUDE.md; CI draait e2e wél.)

---

## feat(rooster): discovery-kalender van open diensten — Rooster-marktplaats slice 1 (branch `claude/dazzling-carson-v9Qwk`)

PLAN-WERELDKLASSE Fase 3 "Rooster-marktplaats: diensten per kalender publiceren/claimen". Slice 1 =
de **discovery-kant** voor de ZZP'er: gepubliceerde opdrachten mét een startdatum (`Job.startDate`)
als agenda gegroepeerd per kalenderdag, met persoonlijke matchscore en doorklik naar de opdracht.
Het reageren/claimen loopt via de bestaande opdracht-detail/reageer-flow — **geen nieuwe mutatie,
geen schemawijziging**, puur additief en server-side.

- [x] `src/lib/roster-market.ts` — pure `buildRosterCalendar(shifts, now, horizonDays=21)`:
      bucket dated shifts per UTC-kalenderdag binnen de horizon; verleden weggefilterd, diensten ná
      de horizon geteld in `beyondHorizon` (niet geplaatst); binnen een dag gesorteerd matchScore
      desc (null achteraan) → startDate asc → title asc; dagen oplopend; `weekday` via
      `(getUTCDay()+6)%7`; muteert de input niet. Geen I/O.
- [x] `src/lib/roster-market.test.ts` — 14 unit-tests: lege invoer, verleden weggefilterd,
      horizon-grens (exact = wél / +1 dag = beyondHorizon), sortering matchScore/null/tie-breaks,
      dagen oplopend, isToday-markering, weekday-mapping (vaste UTC-zondag/maandag), non-mutatie,
      total/beyondHorizon-tellingen.
- [x] `src/app/(protected)/rooster/page.tsx` — read-only agenda (FREELANCER + ADMIN; CLIENT →
      redirect /opdrachten). Tenant-zichtbare PUBLISHED-jobs met `startDate gte vandaag` (`take: 200`,
      `visibleJobsWhere`); matchscore via `scoreJobForFreelancer`; "Gereageerd"-badge uit een
      begrensde `application.findMany`. Dag-secties (NL weekdag + datum + "Vandaag"-badge), shift-rijen
      in de Vakwerk/Warmte-stijl (tarief mono, `Match X%`-badge), empty-state + beyondHorizon-noot.
- [x] `src/app/(protected)/rooster/loading.tsx` — skeleton (PageHeader + dense list).
- [x] `src/lib/nav.ts` — navitem "Rooster" onder Werk (FREELANCER), direct ná Opdrachten.

Gates groen: typecheck ✓, lint ✓, test 1943 ✓ (+14), build ✓ (`/rooster` aanwezig), prettier --check . ✓.
(E2e niet in de routine — geen browser-channel, zie CLAUDE.md.) Open vervolg in Fase 3: de
**publiceer-/claim-kant** (opdrachtgever dateert losse diensten; ZZP'er claimt direct vanuit de
kalender i.p.v. de reageer-flow). Noot: `prisma generate` was nodig in de verse container — de
`IndirectHoursEntry`-client was stale waardoor typecheck eerst rood stond (geen codewijziging nodig).

> **Routine-noot (Linear):** stap 3/6 (tracking-issue in "ZZP Platform HUB") kon niet — de
> Linear-connector vereist interactieve OAuth (niet beschikbaar in een onbeheerde routine) én de
> workspace zit nog op de gratis issue-limiet (eerder gemeld). Mensenwerk: workspace upgraden/opschonen
> of OAuth eenmalig koppelen, anders blijft de Linear-tracking van auto-build-runs geblokkeerd.

---

## feat(dashboard): certificaat-compliance-momentopname voor de opdrachtgever (branch `claude/dazzling-carson-v9Qwk`)

De CLIENT-dashboard toonde certificaat-waarschuwingen (ZZP'er mist/verlopen vereist certificaat)
alleen per-kaart in de "Wat loopt er nu"-zone, die **bewust tot top-6 begrensd** is
(`running-zone.ts`). Een opdrachtgever met meer lopende samenwerkingen zag compliance-gaten
buiten die zone dus niet op het dashboard — een echt zicht-gat op de kerndifferentiator
(certificaat-verificatie). Dit voegt een geaggregeerde momentopname toe over **álle** lopende
samenwerkingen. Read-only, server-side, deterministisch, geen schemawijziging, geen extra query
(hergebruikt de al opgehaalde `clientCredentialAlerts`).

- [x] `src/lib/collaboration-alerts.ts` — pure `summarizeClientCompliance(alerts)` →
      `ClientComplianceSnapshot`: `total` (samenwerkingen met actie), `nonCompliant`/`warning`
      (status-splitsing) en de type-tellingen `missing`/`expired`/`expiringSoon`/`inReview`
      gesommeerd over alle meldingen. Geen I/O, muteert de invoer niet.
- [x] `src/lib/collaboration-alerts.test.ts` — 4 unit-tests (lege invoer → nullen,
      NON_COMPLIANT/WARNING-splitsing, type-sommatie over meerdere meldingen, non-mutatie op een
      bevroren array).
- [x] `src/components/dashboard/compliance-snapshot-card.tsx` — presentationele server-component
      (geen client-JS): zegel-icoon + uppercase label "Certificaten van je ZZP'ers", mono-telling
      "N samenwerking(en) vragen aandacht", alleen-niet-nul breakdown-chips, link naar
      /samenwerkingen. Verbergt zichzelf (`return null`) zodra alles op orde is — rustig dashboard.
- [x] `dashboard/page.tsx` — CLIENT-tak: volledige meldingslijst gevangen, momentopname berekend en
      via `complianceSnapshot` op `DashboardData` doorgegeven; kaart gerenderd tussen de
      "Wat loopt er nu"-zone en de statistiek-grid. Vangrail-allowlist-regelnummer bijgewerkt
      (170→178 door de uitgebreide import).

Gates groen: typecheck ✓, lint ✓, test 1929 ✓ (+4), build ✓, prettier --check . ✓.
(E2e niet in de routine — geen browser-channel, zie CLAUDE.md.) Noot: in deze verse container moest
`npx prisma generate` draaien om de client met het nieuwe `IndirectHoursEntry`-model te synchroniseren
(anders faalde typecheck op vóór-bestaande `ontzorgd/`-fouten — geen codewijziging nodig).

---

## feat(ontzorgd): indirecte uren bijhouden voor het urencriterium (branch `claude/dazzling-carson-v9Qwk`)

Het Ontzorgd-dashboard gaf `indirectHours: 0` hard mee aan `buildOntzorgOverview`, terwijl
`hoursCriterion` indirecte uren (acquisitie/administratie/scholing/reistijd) al ondersteunt voor
het 1.225-uur urencriterium (zelfstandigenaftrek). De ZZP'er kon ze nergens registreren →
voortgang telde te laag en de onderbouwing voor de aftrek ontbrak.

- [x] Schema (additief): `IndirectHoursEntry` (userId, workedOn, hours Float, category, note?) +
      relatie `User.indirectHoursEntries`. Categorie als string (geen db-enum — SQLite/Postgres).
- [x] `src/lib/tax/indirect-hours.ts` — pure module: `INDIRECT_HOUR_CATEGORIES` + NL-labels,
      `indirectHoursEntrySchema` (geen toekomstdatum, kwartier-precisie, 0<uren≤24, notitie ≤280),
      `sumIndirectHours`, `groupIndirectHoursByCategory` (canonieke volgorde, alleen >0). 16 tests.
- [x] `/ontzorgd/uren` — actions (`addIndirectHours`/`deleteIndirectHours`: auth → rol → entitlement
      IB_VOORBEREIDING → Zod → schrijven → audit; ownership-check op delete) + page (totaal +
      subtotalen per categorie, invoerformulier via client-component, lijst met verwijderen,
      loading-skeleton, empty/lock-states). `findMany` gebonden met `take: 200`.
- [x] `/ontzorgd` koppelt de jaar-som van indirecte uren door naar `buildOntzorgOverview`, toont
      "Direct X u · indirect Y u" in de urencriterium-kaart + link "Indirecte uren bijhouden →".

Gates groen: typecheck ✓, lint ✓, test 1762 ✓ (16 nieuw), build ✓, prettier ✓. E2e overgeslagen
(routine-omgeving zonder browser-channel). Linear-issue niet aangemaakt: workspace zit op de
free-issue-limiet (mensenwerk: upgrade Linear).

## feat(freelancers): feitelijk track record per ZZP'er op de browse-kaart (branch `claude/dazzling-carson-v9Qwk`)

Opdrachtgevers zagen op /freelancers wél vertrouwensniveau, tarief, beschikbaarheid en
vaardigheden, maar geen feitelijke staat van dienst. Dit voegt het spiegelbeeld toe van het
betaalgedrag-signaal (`payment-behavior.ts`, dat de ZZP'er over de opdrachtgever ziet): een
puur feitelijk, server-berekend track record dat de opdrachtgever over de ZZP'er ziet. Geen
subjectieve beoordelingen (geparkeerd productbesluit) — alleen harde feiten.

- [x] `src/lib/freelancer-track-record.ts` — pure `trackRecordHighlights(record)` met
      betekenis-drempels (spiegelt `trustHighlights` in `public-trust.ts`): afgeronde
      samenwerkingen ≥ 1 ("afgeronde klus/klussen", via `plural.ts`), gewerkte uren
      `Math.round` ≥ 8 ("uur gewerkt"). Onder de drempel: niets tonen, zodat een net-gestarte
      ZZP'er nooit met magere "0"-cijfers pronkt. 8 unit-tests.
- [x] `src/lib/freelancer-search.ts` — `FreelancerCard.trackRecord` server-side meegeleverd via
      efficiënte bulk-queries (geen N+1): `collaboration.groupBy` voor COMPLETED + `findMany`
      met APPROVED HOURS-prestaties, gesommeerd per `freelancerId`. Tenant-gescoped via de al
      gescopete profiel-ids. Fixtures in `freelancer-search.test.ts` bijgewerkt (15 tests).
- [x] `freelancer-browse.tsx` — compacte track-record-regel op de kaart (CircleCheck/Clock,
      mono-cijfer + muted label); lege staat = niets gerenderd. Semantische tokens, geen "AI".

Gates groen: typecheck ✓, lint ✓, test 1754 ✓, build ✓, prettier --check . ✓
(E2e niet gedraaid — routine-omgeving heeft geen browser-channel, zie CLAUDE.md.)

---

## test(dba): structuur-/gedragstests voor de DBA-dossier-PDF-generator (branch `claude/dazzling-carson-v9Qwk`)

`src/lib/dba-audit-pdf.ts` (`buildDbaAuditPdf`) genereert het DBA-compliance-dossier voor een
eventueel bedrijfsbezoek van de Belastingdienst — een kerndifferentiator. De pure data-bouwer
(`dba-audit.ts`) was getest, de PDF-render-laag zelf had nul tests.

- [x] `src/lib/dba-audit-pdf.test.ts` — 14 tests die via `PDFDocument.load` verifiëren (geen broze
      byte-asserts): geldige niet-lege PDF + `%PDF`-magic; titel bevat opdracht- én ZZP'er-naam;
      paginabreuk (60 lange indicatoren + lange disclaimer → ≥ 2 pagina's, > kleine dossier — bewijst
      dat `addPage`/`ensure` meermaals loopt en de per-pagina-footer dus blijft staan); geen crash op
      tekens buiten WinAnsi (€/é/—/typografisch apostrof/"ZZP'er"); rand-/null-data
      (`durationMonths`/`rateCentsSnapshot` null, 0 vs > 0 geverifieerde certificaten, lege indicatoren).
- [x] Fixture bouwt waar mogelijk via `buildDbaAuditData` zodat de tests in de pas blijven met het
      echte datacontract. Geen productie-gedrag gewijzigd (alleen tests).

> **Routine-noot (Linear):** de Linear-workspace "ZZP Platform HUB" heeft de **gratis issue-limiet
> bereikt** ("Usage limit exceeded — free issue limit"). De routine kon daardoor géén tracking-issue
> aanmaken (stap 3/6). Mensenwerk: workspace upgraden of opschonen, anders blijft de Linear-tracking
> van auto-build-runs geblokkeerd.

Gate groen: typecheck ✓, lint ✓, test 1760 ✓ (+14), build ✓, prettier ✓. (E2e niet in de routine —
geen browser-channel.)

---

## refactor(profiel): talen-write-kant naar de gedeelde helper (branch `claude/dazzling-carson-v9Qwk`)

Sluitstuk op de eerdere `parseLanguages`-deduplicatie (audit L3, commit 49f5628): die consolideerde
alleen de LEES-kant. De SCHRIJF-kant in `profiel/actions.ts` had nog een eigen komma-split én
`JSON.stringify(...)` — dezelfde (de)serialisatielogica los gekopieerd.

- [x] `src/lib/parse-languages.ts` uitgebreid met `splitLanguagesInput` (komma-invoer → opgeschoonde
      lijst, getrimd/lege segmenten weg) en `serializeLanguages` (lijst → JSON-array-string of `null`).
- [x] `profiel/actions.ts` gebruikt nu beide helpers i.p.v. lokale logica — één bron van waarheid voor
      de hele talen-rondgang (split → valideer → serialiseer → parse → toon). Nul gedragswijziging.
- [x] 6 nieuwe unit-tests in `parse-languages.test.ts` (split: trim/filter/leeg; serialize: leeg→null,
      inverse van `parseLanguages`).
- [x] `unbounded-queries.test.ts`-allowlist regelnummers voor `profiel/actions.ts` bijgewerkt (de
      compactere split verschoof de twee findMany-regels).

Gates groen: typecheck ✓, lint ✓, test 1887 ✓, build ✓, prettier ✓. (e2e overgeslagen — geen
browser-channel in de routine.)

---

## feat(terminologie): canoniek begrippenkader (IA) + ADR (branch `claude/dazzling-carson-v9Qwk`, ZZP2-195)

PLAN-WERELDKLASSE Fase 2 — "Terminologie gladstrijken: één begrippenkader, IA-besluit vastleggen
als ADR." De UI gebruikte domeinbegrippen niet consistent en twee termen waren overladen.

- [x] **`docs/decisions/0008-terminologie-ia.md`** — ADR met het canonieke glossarium (11 begrippen:
      enkelvoud/meervoud/route/toelichting) + expliciete oplossing van twee overloads:
      (1) Opdracht ↔ Dienst (werkvraag/vacature vs. concrete geplande/gewerkte dienst — verschillende
      begrippen); (2) Reactie ↔ Kandidaat (zelfde `Application`-record, ZZP'er- vs. opdrachtgever-
      perspectief, bewust behouden).
- [x] **`src/lib/terminology.ts`** — bron van waarheid: `TERM` / `TERM_PLURAL` (Record per
      `DomainConcept`) + `term()`-helper. Puur, geen runtime-afhankelijkheid.
- [x] **`src/lib/nav.ts`** — de kernbegrip-labels (FREELANCER/CLIENT + de gelijke ADMIN/FRANCHISER-
      items) betrekken nu uit `TERM_PLURAL`; **gedragsbehoudend** (geen getoonde label-string
      verandert), zodat de begrippen niet meer per scherm kunnen afdrijven.
- [x] **`src/lib/terminology.test.ts`** — 19 unit-tests: compleetheid, uniciteit, `term()`-gedrag,
      en een **vangrail** die afdwingt dat 12 live nav-labels gelijk blijven aan het canonieke kader.

Gates groen: typecheck ✓, lint ✓, test 1881 ✓, build ✓, prettier ✓. (e2e niet in routine — geen
browser-channel, zie CLAUDE.md.)

---

## feat(dashboard): weekrooster als kalenderstrip (ma–zo) — PLAN-WERELDKLASSE Fase 2 (ZZP2-194, branch `claude/dazzling-carson-v9Qwk`)

De dashboard-zone "Wat loopt er nu" toonde "Deze week" als een platte rij muted-badges. Fase 2 vroeg
een echte kalenderstrip (ma–zo met dienstblokken); de data was er al (`week.entries` + `weekdays`,
ADR-0004) maar werd niet als rooster getoond.

- [x] `src/lib/week-strip.ts` — pure `buildWeekStrip(week, now)`: 7 dagkolommen met per dag de lopende
      samenwerkingen. Expliciet weekrooster (`weekdays`) wint; entries zonder rooster vallen terug op
      de actieve kalenderdagen binnen de week (start/eind geklemd op UTC-dagniveau). Markeert vandaag.
      Geen I/O. 7 unit-tests (`week-strip.test.ts`): weekdag-mapping, fallback start/eind-klemming,
      open-eind = hele week, vandaag-markering binnen/buiten de week, twee samenwerkingen op één dag.
- [x] `src/components/dashboard/week-strip.tsx` — presentationele 7-koloms grid (server-component,
      geen client-JS): dag-label + datum, dienstblokken linken naar `/samenwerkingen/[id]`, vandaag
      geaccentueerd, rustige lege dagen.
- [x] `dashboard/page.tsx` — platte badge-rij vervangen door de strip (alleen bij gevulde week);
      samenvattingsregel ("Deze week: N samenwerkingen bij M opdrachtgevers") blijft. Ongebruikte
      `TIMING_LABEL` + `formatWeekdays`-import verwijderd; vangrail-allowlist regelnummer bijgewerkt.

Sluit PLAN-WERELDKLASSE Fase 2 "Weekrooster als kalenderstrip" af. Gates groen: typecheck ✓, lint ✓,
test 1862 ✓ (+7), build ✓, prettier --check . ✓. (E2e niet in de routine — geen browser-channel,
net als CI.) Commit `7f71870`.

## feat(flexpool): nieuwe dienst eerst naar de poule routeren — "eerst eigen mensen" (ZZP2-192, branch `claude/dazzling-carson-v9Qwk`)

Flexpool slice 2 (`docs/PLAN-WERELDKLASSE.md` Fase 3 — vervolg op slice 1, ZZP2-187). Slice 1 liet een
opdrachtgever een poule bijhouden, maar de poule deed nog niets bij het plaatsen van werk. Nu krijgen
poule-leden bij de **eerste** publicatie van een opdracht direct voorrang — vóór de brede
`job-alerts`-taak en ongeacht de matchdrempel. Server-side waarheid, deterministisch, idempotent.

- [x] `src/lib/pool-routing.ts` — pure `planPoolInvites(job, members)`: geschiktheid (ACTIEF account,
      PUBLIC profiel, tenant-zichtbaarheid/overflow, nog niet gereageerd, niet UNAVAILABLE) →
      notificatie-items met dedupeKey `pool-invite:${jobId}:${userId}`. 20 unit-tests
      (`pool-routing.test.ts`): alle vijf overslaan-regels, overflow-doorlating, null-tenant-match,
      AVAILABLE/LIMITED/UNKNOWN vs. UNAVAILABLE, volgordebehoud, non-mutatie.
- [x] `src/lib/notifications.ts` + `src/lib/audit-labels.ts` — type `POOL_INVITE` (categorie
      collaboration, toon attention) + audit-actie `POOL_INVITED`.
- [x] `opdrachten/actions.ts` — `changeJobStatus` informeert de poule **alleen bij de eerste
      publicatie** (`!job.publishedAt`), zodat heropenen (CLOSED→PUBLISHED) niet opnieuw spamt;
      `notification.createMany` + audit met telling. Tenant-overflow uit de job-relatie.
- [x] `opdrachten/[id]/page.tsx` — rustige eigenaar-noot "N leden uit je Flexpool zijn bij publicatie
      als eerste geïnformeerd" (telling uit het gezaghebbende POOL_INVITED-auditrecord, niet live
      herberekend — de UI claimt alleen wat verstuurd is). Link naar /favorieten.
- [x] Vangrail-allowlist bijgewerkt (skill-query regel verschoven 71→72 + nieuwe per-bedrijf
      begrensde flexpool-query).

Gates groen: typecheck ✓, lint ✓, test 1855 ✓ (+20), build ✓, prettier --check . ✓. (E2e niet in de
routine — geen browser-channel, net als CI.) Open vervolg in Fase 3: Rooster-marktplaats (diensten per
kalender publiceren/claimen). Demo-seed van een poule-uitnodiging is bewust overgeslagen (additief
risico); de uitnodiging verschijnt live bij een echte publicatie.

## feat(inzicht): leverbetrouwbaarheid-signaal voor de ZZP'er (ZZP2-191, branch `claude/dazzling-carson-v9Qwk`)

Premium, objectief signaal naast het bestaande betaalgedrag-signaal van de opdrachtgever:
hoe vaak levert de ZZP'er in één keer akkoord, en hoe snel keurt de opdrachtgever goed.
Puur afgeleid uit bestaande modellen — geen schemawijziging, read-only, server-side.

- [x] `src/lib/collaboration-quality.ts` — pure helpers + `getDeliveryQuality(userId)`:
      `firstTimeRightRate` (% goedgekeurd zonder eerdere afkeuring: `approvedAt` gezet, `rejectedAt`
      leeg), `correctedPerformances` (goedgekeurd na een afkeuring), `avgApprovalDays`
      (`submittedAt`→`approvedAt`), `completedCollaborations` als steekproefbasis, toon
      `EXCELLENT|RELIABLE|DEVELOPING|INSUFFICIENT` met `DELIVERY_MIN_SAMPLE = 3`.
- [x] `src/lib/collaboration-quality.test.ts` — 19 unit-tests (grenzen 90/70, min-steekproef,
      doorlooptijd-afronding op 1 decimaal, lege invoer).
- [x] `src/app/(protected)/inzicht/page.tsx` — sectie "Leverbetrouwbaarheid" (FREELANCER):
      3 StatCards + muted correctie-noot + empty-state bij te weinig gegevens.

Gates groen: typecheck ✓, lint ✓, test 1835 ✓, build ✓, prettier ✓. (e2e niet in de routine — geen browser.)

---

## feat(facturatie): statusfilter + verouderingssignaal op de platform-facturatiecockpit (ZZP2-190)

`/admin/facturatie` toonde de platformfacturen (franchise-fee + ZZP-abonnement) als platte lijst
zonder filter of veroudering — de admin kon niet snel zien welke facturen verstuurd-maar-onbetaald
zijn en hoe lang al (de aanmaan-vraag). Additief, deterministisch, server-side, **geen schemawijziging**
(afgeleid uit bestaande `issuedAt`/`paidAt`).

- [x] `src/lib/platform-billing/aging.ts` — pure verouderingslogica met geïnjecteerde klok:
      `PLATFORM_BILLING_TERM_DAYS` (= `DEFAULT_PAYMENT_TERM_DAYS` = 30), `dueDateFor`,
      `agingFor(inv, now)` (dagen openstaand + dagen te laat + `overdue`-vlag; alleen SENT
      veroudert; `overdue` strikt `now > dueAt` dus exact op de termijn = niet te laat),
      `summarizeAging` (aantal + centen te laat). 13 unit-tests incl. grensgeval op de termijn.
- [x] `billing-data.ts` — `issuedAt` toegevoegd aan `BillingInvoiceRow` + select.
- [x] `/admin/facturatie/page.tsx` — statusfilter-tabs (Alle/Concept/Verzonden/Betaald/Geannuleerd)
      via `?status=`-searchParam met telling per status (server-side filter, `aria-current`),
      StatCard "Te lang open" (aantal + bedrag verlopen termijn, tone warning), per VERZONDEN-factuur
      een "Betaaltermijn verlopen · n d"-badge of rustige "n dagen open"-tekst, plus een lege staat
      wanneer het filter niets oplevert. Bestaande genereer-/PDF-/statusknoppen ongewijzigd.

Gates groen: typecheck ✓, lint ✓, test 1816 ✓ (+13), prettier ✓, build ✓. E2e overgeslagen
(routine zonder browser-channel, net als CI).

---

## feat(inzicht): maandelijkse omzet-/uitgaventrend per rol — branch `claude/dazzling-carson-v9Qwk` (Linear ZZP2-189)

De pure omzetreeks (`monthlyRevenue`/`monthDeltaPct` in `revenue.ts`) én de `Sparkline`-component
bestonden al getest, maar werden nergens gerenderd — een dode capaciteit. `/inzicht` toonde alleen
statische KPI-tegels, geen trend over tijd.

- [x] `src/lib/revenue-trend.ts` — pure `buildRevenueTrend(rows, now, months)` (delegeert naar
      `monthlyRevenue`/`monthDeltaPct`) + drie rol-/tenant-gescopete DB-fetchers
      (`getFreelancerRevenueTrend` / `getClientRevenueTrend` / `getTenantRevenueTrend`):
      gefactureerde facturen (`issuedAt != null`, niet `CANCELLED`) per maand, gespiegeld op de
      ownership-filters van `*-stats.ts` (issuer/counterparty/tenant; platform-fee uitgesloten).
      8 unit-tests (groepering, jaargrens, delta, lege staat).
- [x] `src/components/insight/revenue-trend-card.tsx` — presentationele server-component: huidig
      maandbedrag, delta-badge (▲/▼ t.o.v. vorige maand), `Sparkline`, 6-maands strip + empty-state.
- [x] `src/app/(protected)/inzicht/page.tsx` — kaart ingehaakt voor FREELANCER (omzet), CLIENT
      (uitgaven) en FRANCHISER (franchise-omzet), direct onder de verdiensten/uitgaven/omzet-sectie.

Server-side waarheid, integer-centen, omzet volgt de factuurdatum (consistent met de administratie).
Gates groen: typecheck ✓, lint ✓, test 1803 ✓, build ✓, prettier ✓ (e2e n.v.t. — geen browserkanaal).
Commit `2cea08e`.

---

## feat(opdrachten): matchredenen op de opdracht-kaart — branch `claude/dazzling-carson-v9Qwk` (Linear ZZP2-188)

PLAN-WERELDKLASSE Fase 2 "Matchredenen zichtbaar maken op kaarten (ook de minpunten —
uitlegbaarheid als feature)". De ZZP'er zag op `/opdrachten` alleen een "Match X%"-badge; de
`reasons` die de matchmotor al berekent werden weggegooid.

- [x] `src/lib/matching.ts` — `topGapReason(reasons)` naast `topPositiveReason`: het zwaarst
      wegende minpunt (eerste gap), `null` als er geen is. Puur. 2 unit-tests in `matching.test.ts`.
- [x] `src/app/(protected)/opdrachten/(index)/page.tsx` — per opdracht het volledige
      `scoreJobForFreelancer`-resultaat (score + troef + minpunt); onder de metadata-regel een
      regel met de zwaarst wegende troef (groen, check) en het zwaarst wegende minpunt (gedempt,
      minus). Geen extra query — alles uit de bestaande matchberekening.

Gates groen: typecheck ✓, lint ✓, test 1795 ✓ (+2), build ✓, prettier ✓, check:env ✓.
(E2e overgeslagen — routine-omgeving heeft geen browserkanaal.)

> Noot: deze run startte op een tariefinzicht-increment, maar bij de overlap-check bleek dat al
> gebouwd op deze branch (ZZP2-184, `lib/market-rate.ts` + marktband op profiel/bewerken). Om
> duplicaat te vermijden is dat verworpen en is dit matchredenen-increment gekozen.

---

## feat(flexpool): poule van bewezen ZZP'ers — branch `claude/dazzling-carson-v9Qwk` (ZZP2-187)

PLAN-WERELDKLASSE Fase 3 "Flexpool/favorieten" (slice 1). Een opdrachtgever houdt een poule van
bewezen ZZP'ers bij ("eerst eigen mensen"); de poule toont beschikbaren eerst.

- [x] Schema: `FavoriteFreelancer` (company → freelancerProfile, optionele privé-notitie, uniek per
      paar, cascade-delete) + relaties op `Company`/`FreelancerProfile`. `prisma db push` + generate.
- [x] `lib/favorites.ts` — pure `favoriteNoteSchema` (Zod, max 500) + `sortFavorites` (beschikbaren
      eerst via vaste ordening, dan recentst toegevoegd; muteert niet). 6 unit-tests.
- [x] `favorieten/actions.ts` — `addFavorite`/`removeFavorite`/`saveFavoriteNote`: keten auth → rol
      CLIENT → ownership (eigen bedrijf) → Zod → actie → audit; idempotent (bestaanscheck +
      `deleteMany`); revalidatePath op /favorieten + /zzp/[id].
- [x] `/favorieten` (Flexpool): overzicht met beschikbaarheid-badge, tarief, notitie, profiel-link,
      verwijderen achter `ConfirmButton`; loading.tsx + twee empty-states (geen bedrijf / lege poule).
      `take: 100` (vangrail groen).
- [x] `FavoriteButton` (client, optimistisch) op het publieke ZZP-profiel — alleen voor een
      opdrachtgever die een ander profiel bekijkt; `ProfileScreen` bepaalt de favoriet-stand
      server-side. Navitem "Flexpool" onder Werk (CLIENT).
- [x] Audit-labels FAVORITE_ADDED/REMOVED/NOTE_SAVED. Idempotente demo-seed: 3 favorieten voor
      Zorgcentrum Jansen (SEED_DEMO).

Gate groen: typecheck ✓, lint ✓, test 1793 ✓, build ✓, prettier --check . ✓. (E2e niet gedraaid —
routine-omgeving heeft geen browser-channel, zie CLAUDE.md.) Commit `c59f8d7`.
Vervolgslice (apart): nieuwe diensten eerst naar de pool routeren.

---

## refactor(parse-languages): dedup naar gedeelde lib (audit L3) — branch `claude/dazzling-carson-v9Qwk` (ZZP2-186)

De helper `parseLanguages(raw)` stond 6× gekopieerd met inconsistente signatuur (5× `string[]`,
1× komma-gevoegde `string`). Audit-L3-rest uit CURRENT_TASK.md. Nu één bron van waarheid.

- [x] `src/lib/parse-languages.ts` — `parseLanguages(raw): string[]` (defensief parsen van de
      JSON-array-string) + `parseLanguagesText(raw): string` (komma-gevoegd voor drawer-velden).
- [x] 7 unit-tests (`parse-languages.test.ts`): null/leeg, geldige array, ongeldige JSON,
      niet-array JSON, niet-string-elementen, tekst-variant.
- [x] 6 callsites omgezet naar imports; lokale duplicaten verwijderd
      (`profile-screen.tsx`, `pending-tasks.ts`, `roster-dossier.ts`, `dashboard/page.tsx`,
      `profiel/bewerken/page.tsx`, `drawer-data.ts` → `parseLanguagesText`). Nul gedragswijziging.
- [x] Vangrail-allowlist regelnummers bijgewerkt (`unbounded-queries.test.ts`: dashboard → 168,
      profiel/bewerken → 27/28 na het verwijderen van de lokale functies, op de rebase-stand).

Gates groen: typecheck ✓, lint ✓, test ✓, build ✓, prettier --check . ✓. (E2e niet
gedraaid — routine-omgeving heeft geen browser-channel, zie CLAUDE.md.)

---

## feat(kandidaten): bulk-triage reacties (branch `claude/dazzling-carson-v9Qwk`) — Linear ZZP2-185

Opdrachtgever kan op `/kandidaten` reacties in batches triëren i.p.v. één voor één.

- [x] `lib/applications.ts` — pure `planBulkApplicationTransition(items, to)` op de bestaande
      `APPLICATION_TRANSITIONS`-map → `{ eligible, skipped }`. Server-side waarheid; +4 unit-tests
      (`applications.test.ts`, totaal 10 in dat bestand).
- [x] `kandidaten/actions.ts` — `bulkChangeApplicationStatus(_prev, formData)`: auth → rol CLIENT →
      ownership (alleen eigen opdrachten via where-clause) → Zod-doelstatus (alleen
      VIEWED/SHORTLIST/REJECTED; ACCEPTED blijft een bewuste losse actie) → overgangscheck →
      atomair `$transaction` (status-update + audit `APPLICATION_STATUS_CHANGED` + notificatie bij
      afwijzen). Reacties gekoppeld aan een samenwerking worden overgeslagen; resultaatmelding
      "n bijgewerkt, m overgeslagen".
- [x] `kandidaten/bulk-triage-bar.tsx` (client) — sticky balk; checkboxes gekoppeld via het HTML
      `form=`-attribuut aan een aparte bulk-form (geen geneste forms), telling via document-wide
      change-listener, statuskeuze + `window.confirm` bij afwijzen, feedback via `FormStatus`.
- [x] `kandidaten/page.tsx` — checkbox per kaart (alleen als niet aan een samenwerking gekoppeld),
      `<BulkTriageBar />`, `pb-24` zodat de vaste balk de laatste kaart niet bedekt.
- [x] `unbounded-queries.test.ts` — allowlist: page.tsx-regel verschoven (48→49) + nieuwe
      bulk-query (begrensd door `id: { in: ids }`).

Gates groen: typecheck ✓, lint ✓, test 1751 ✓, build ✓, prettier ✓ (e2e niet in deze omgeving —
geen browser-channel).

---

## feat(tarief): "jouw tarief vs. de markt" — geanonimiseerde marktband (branch `claude/dazzling-carson-v9Qwk`, Linear ZZP2-184)

Differentiator uit `docs/PLAN-WERELDKLASSE.md` Fase 3: de ZZP'er stelt zijn uurtarief in
mét marktreferentie, geanonimiseerd en server-side berekend.

- [x] `src/lib/market-rate.ts` — pure, deterministische motor: `median`, `percentile`
      (lineaire interpolatie, muteert input niet) en `computeMarketRate`. Functie-band
      (gedeelde industrie) met platform-brede fallback; positie van het eigen tarief
      t.o.v. p25–p75 (below/within/above/unknown). Anonimiseringsdrempel
      `MARKET_RATE_MIN_SAMPLE` (=3) — onder de drempel geen band (geen herleidbaarheid);
      eigen tarief uitgesloten uit de peer-set. 26 unit-tests.
- [x] `src/lib/config.ts` — `MARKET_RATE_MIN_SAMPLE` + `MARKET_RATE_SAMPLE_CAP` (=5000,
      harde geheugengrens op de peer-query; band is expliciet indicatief).
- [x] `src/components/profile/market-rate-card.tsx` — server-component (Vakwerk, mono-cijfers):
      mediaan groot, middenmoot p25–p75, scope-label (Vergelijkbare functies / Platformbreed),
      positiebadge + uitleg, eigen tarief, disclaimer; rustige empty-state onder de drempel.
- [x] `/profiel/bewerken` — peer-query (gedeelde industrie + platform-fallback, `take` gecapt,
      alleen `hourlyRate`), kaart tussen compleetheid en formulier. Allowlist-regels
      (skills/branches) bijgewerkt na lijnverschuiving.

Gates groen: typecheck ✓, lint ✓, test 1772 ✓, build ✓, prettier ✓. (E2e overgeslagen —
routine-omgeving zonder browser-channel, net als CI.)

---

## fix(vindbaarheid): geschorste ZZP'er niet meer vindbaar voor opdrachtgevers (ZZP2-183)

Correctie-gat: een geschorst account (`User.status = SUSPENDED`) wordt al server-side geweigerd bij
login (`auth.ts`) en bij elke mutatie (`authz.ts`), maar de opdrachtgever-gerichte vind-oppervlakken
filterden alleen op `visibility: "PUBLIC"` — niet op accountstatus. Daardoor bleef een ZZP'er die net
is uitgeschreven (no-show-flow) of geanonimiseerd (status óók SUSPENDED) gewoon in zoek/suggesties/
contact opduiken. `job-alerts-task.ts` deed het al wél goed. Dit ondergroef de no-show-handhaving.

- [x] `src/lib/freelancer-visibility.ts` — gedeeld where-fragment `discoverableFreelancerWhere`
      (`{ visibility: "PUBLIC", user: { status: "ACTIVE" } }`). Bewust een leaf-module zonder
      server-only imports (db/auth/next-headers), zodat `freelancer-search.ts` — dat in de
      client-graph van `freelancer-browse.tsx` zit — niet de auth-keten meebundelt. + 3 unit-tests.
- [x] Toegepast op de drie opdrachtgever-oppervlakken: `getAllPublicFreelancers` (/freelancers),
      `suggestedFreelancersForJob` (opdracht-suggesties), `startConversationWithFreelancer`
      (berichten — extra `user.status === "ACTIVE"`-guard naast de PUBLIC-check).
- [x] Geanonimiseerde accounts lekten al niet (anonimisering zet ook `visibility: PRIVATE`); de
      status-filter dekt dat nu netjes dubbel af.

Gates groen: typecheck ✓, lint ✓, test 1749 ✓, build ✓, prettier ✓. (E2e overgeslagen — routine-
omgeving heeft geen browser-channel.)

---

## feat(no-show): registratie + admin-beoordeling + uitschrijf-wachtrij (branch `feat/no-show-registratie`) — punt 6 deel 2 (sluit punt 6 af)

Productbesluit eigenaar (12-6): melder registreert no-show met reden → ZZP'er direct
geïnformeerd; admin beoordeelt gegrond/ongegrond; alleen ongegronde tellen mee; bij 3
ongegronde een uitschrijf-taak in de admin-wachtrij (handmatig, nooit automatisch).

- [x] Schema: `NoShowReport` (collab + freelancerProfile + melder + reden + occurredOn +
      verdict PENDING/JUSTIFIED/UNJUSTIFIED + verdictBy/At). Enum + Zod (`noShowVerdictSchema`).
- [x] `lib/no-show.ts` — `NO_SHOW_LIMIT = 3`, pure `noShowStanding` (telling/remaining/atLimit),
      6 unit-tests.
- [x] Actions: `reportNoShow` (opdrachtgever óf franchiser van de dienst; alleen op
      ACTIVE/CANCELLED; notificatie aan ZZP'er mét reden + uitleg; audit) en
      `judgeNoShowReport` (admin; oordeel + notificatie met stand n/3; audit).
- [x] `/admin/no-shows` (+ navitem Operatie): te-beoordelen-wachtrij met gegrond/ongegrond,
      "grens bereikt"-sectie met uitschrijf-knop (hergebruikt `setUserStatus` → SUSPENDED),
      recent-beoordeeld-lijst.
- [x] Actiecentrum: admin-taken `admin-judge-no-show` (per melding) + `admin-suspend-no-show`
      (grens bereikt, alleen ACTIVE-accounts); ZZP'er-waarschuwing `no-show-warning`
      (n van 3, link naar de samenwerking met de reden).
- [x] Werkproces-detail: no-show-kaart — opdrachtgever meldt (datum + reden), beide partijen
      zien elke registratie incl. oordeel-badge (zo komt de reden expliciet bij de ZZP'er).

Gates groen: typecheck ✓, lint ✓, test 1746 ✓, build ✓, prettier ✓

---

## feat(annulering): symmetrische annulering met reden + 7-dagen-kostenregel (branch `feat/annulering-met-reden`) — punt 6 deel 1

Productbesluit eigenaar (12-6): opdrachtgever annuleert kosteloos tot 7 dagen vóór de start;
daarna betalingsverplichting. Reden verplicht voor beide partijen; zichtbaar voor de franchiser.

- [x] `lib/cancellation.ts` — pure `assessCancellation` (alleen opdrachtgever-annulering van een
      ACTIEVE samenwerking met startdatum kan betalingsplichtig zijn; grens = start − 7 dagen,
      `CANCELLATION_FREE_DAYS` in config). 7 unit-tests incl. grensgeval.
- [x] Schema (additief): `Collaboration.cancelledAt/cancelledById/cancellationReason/
cancellationChargeable` — server-side snapshot op het annuleermoment.
- [x] Actions: `cancelCollaboration` (useActionState, reden verplicht via
      `collaborationCancellationSchema`, zelfde guards als statuswijziging — open-factuur-rem,
      herplaatsing); `changeCollaborationStatus` weigert CANCELLED voortaan; notificatie aan de
      andere partij bevat de reden + evt. betalingsverplichting; audit-metadata reason+chargeable.
- [x] UI: `CancelCollaborationForm` (uitklapbaar, kostenregel getoond vóór bevestiging) op de
      samenwerkingen-lijst; annuleringskaart op het werkproces-detail; reden + wie/wanneer +
      betalingsverplichting-badge op /franchise/samenwerkingen (eigenaarsvraag).

Volgende stap (punt 6 deel 2): no-show-registratie met reden → ZZP'er geïnformeerd, admin
beoordeelt gegrond/ongegrond, bij 3 ongegronde een uitschrijf-taak in de admin-wachtrij.
Gates groen: typecheck ✓, lint ✓, test 1740 ✓, build ✓, prettier ✓

---

## perf(dashboard): "Wat loopt er nu" bewust begrensd — audit T3 afgerond (branch `feat/cursor-paginatie`)

Sluitstuk van audit T3 (samenwerkingen/documenten waren al gepagineerd in #307): de
dashboard-zone hing nog op de interim-cap `take: 100` (QW3) en rendert tot 100 kaarten.

- [x] `src/lib/running-zone.ts` — zone-grens `RUNNING_ZONE_LIMIT = 6` + pure
      `runningZonePlan(total)`: overloop-telling en het weekoverzicht-besluit
      (alleen bij ≥ 2 lopende én volledige data — afgekapte set zou de telling laten
      liegen). 5 unit-tests in `running-zone.test.ts`.
- [x] Dashboard FREELANCER/CLIENT: `take: 100` → `take: RUNNING_ZONE_LIMIT`,
      sortering `updatedAt desc` (meest recent bewogen bovenaan, consistent met de
      admin-zone) + `collaboration.count` voor de eerlijke totaaltelling.
      Admin-tak op dezelfde gedeelde grens; `isNewAccount` (ZZP'er) op het totaal.
- [x] Overloop-tegel in de zone: "Nog n lopende samenwerking(en) →" (gestippelde
      kaart) naar de volledige, gepagineerde lijst per rol (`SAMENWERKINGEN_HREF`).
- [x] Vangrail-allowlist regelnummer bijgewerkt (`unbounded-queries.test.ts`).

Besluit: op het dashboard geen "meer laden"-cursor maar een bewuste top-6 + doorverwijzing —
het dashboard toont alleen wat telt; de cursor-gepagineerde lijsten zijn /samenwerkingen
en /documenten (#307). Daarmee is audit T3 volledig af; geen `take: 100`-interim-caps
meer op de T3-oppervlakken.

Gates groen: typecheck ✓, lint ✓, test 1733 ✓, build ✓, prettier ✓

---

## fix(profiel): "Mijn profiel" binnen de app-schil — zijbalk blijft staan (branch `fix/profiel-in-app-schil`)

Eigenaar-melding (12-6): klik op "Mijn profiel" liet de linkernavigatie verdwijnen (redirect
naar de standalone publieke route).

- [x] Profielweergave geëxtraheerd naar gedeeld servercomponent
      `src/components/profile/profile-screen.tsx` (kopkaart + tabs + tabinhoud; tab-links
      via basePath; zelfde visibility-checks).
- [x] `/profiel` rendert de weergave nu bínnen de app-schil (zijbalk + topbar blijven);
      tabs navigeren binnen /profiel?tab=…
- [x] `/zzp/[id]` blijft de standalone publieke route (eigen chrome, Inloggen-link
      voor bezoekers) — zelfde gedeelde weergave.

Geverifieerd: zijbalk zichtbaar op /profiel (alle tabs), publieke route ongewijzigd
standalone, geen console-errors. Gates groen: typecheck ✓, lint ✓, test 1728 ✓, build ✓

---

## feat(design): samenwerkingen-lijst in de Warmte-taal + werkproces-fase per kaart (branch `feat/warmte-samenwerkingen-lijst`)

Schermen-sweep (vervolg): de samenwerkingen-lijst was het zwakste kernscherm.

- [x] Werkproces-fase op elke actieve/voorgestelde kaart (zelfde cascadeStage-afleiding als
      de dashboard-kaarten): omschrijving, "Aan zet"-badge, voortgangsbalk "Stap x van 6",
      klikbaar naar het werkproces. Terminale kaarten: stille "Werkproces bekijken →"-link.
- [x] Mono-tarief als kerncijfer (€ 85/uur) i.p.v. kale "Tarief:"-tekst.
- [x] Zwevende scheidingslijn op afgeronde kaarten gefixt (actierij rendert alleen met inhoud).
- [x] Query: laatste prestatie + cascade-factuur per kaart (take-1 nested, geen N+1);
      vangrail-allowlist hernummerd.

Visueel geverifieerd, geen console-errors. Gates groen: typecheck ✓, lint ✓, test 1728 ✓,
build ✓, prettier ✓

---

## feat(profiel): publiek profiel schermvullend + ruimere kop (branch `feat/profiel-breed`)

Eigenaar-verzoek (12-6): profiel stond smal in het midden — schermvullender en mooier.

- [x] Pagina van max-w-3xl naar **max-w-6xl** (kopbalk + main), px-6 op sm+.
- [x] Kopkaart meer présence: p-6/p-8, avatar size-16/20, naam display text-3xl,
      uurtarief als groot mono-kerncijfer (€ 52 + /uur klein), ruimere kerncijfer-rij.
- [x] Profiel-tab-grid op lg naar 2fr/1fr (hoofdkolom breder op grote schermen).

Visueel geverifieerd op 1600px, geen console-errors. Gates groen: typecheck ✓, lint ✓,
test 1728 ✓, build ✓, prettier ✓

---

## feat(profiel): "Mijn profiel" = de publieke weergave; bewerken op /profiel/bewerken (branch `feat/profiel-publiek`)

Eigenaar-verzoek (12-6): "Mijn profiel" moet direct het publieke profiel tonen; de
dashboardknop wordt "Bewerk jouw profiel".

- [x] `/profiel` → redirect naar het eigen publieke profiel (/zzp/[id]; eigenaar mag altijd
      kijken, ook op privé — profileVisibleTo). Bewerkformulier verhuisd naar `/profiel/bewerken`
      (kop "Profiel bewerken", display-titel, link "Naar mijn profiel").
- [x] Eigen publiek profiel: knop "Bewerk jouw profiel" in de kopkaart (alleen eigenaar).
- [x] Dashboard-profielkaart: "Bekijk je publieke profiel" → "Bewerk jouw profiel"
      (/profiel/bewerken). Alle bewerk-links omgezet (tasks, next-actions, onboarding,
      certificaten, dashboard-stat); 9 e2e-specs + vangrail-allowlist meegenomen.

Visueel + flow geverifieerd (dashboard → Mijn profiel → publiek profiel met tabs →
bewerk-knop → formulier); 19 geraakte e2e-tests lokaal groen.
Gates groen: typecheck ✓, lint ✓, test 1728 ✓, build ✓, prettier ✓

---

## feat(dashboard): "Wat loopt er nu" altijd zichtbaar + admin platformbreed (branch `feat/dashboard-wat-loopt-er-nu`)

Eigenaar-feedback op #348: de zone verdween bij de ZZP'er zonder lopend werk en ontbrak
bij de admin — alle rollen moeten dezelfde opzet zien.

- [x] Zone altijd zichtbaar voor elke rol; zonder lopend werk een lege staat met de
      eerstvolgende stap (ZZP'er → opdrachten, opdrachtgever → plaatsen, franchiser → diensten).
- [x] Admin: platformbrede lopende samenwerkingen (6 meest recent bewogen, beide partijnamen,
      cascade-fase vanuit CLIENT-perspectief — leest neutraal voor een meekijker; admin heeft
      toegang tot de werkprocespagina).
- [x] "Alle samenwerkingen"-link per rol (/samenwerkingen, /admin/…, /franchise/…).

Visueel geverifieerd (ZZP + admin, geen console-errors). Gates groen: typecheck ✓, lint ✓,
test 1728 ✓, build ✓, prettier ✓

---

## feat(dashboard): profielkaart-kop + vaste zone-volgorde voor alle rollen (branch `feat/dashboard-profielkaart`)

Eigenaar-verzoek (12-6): direct na inloggen de publieke-profielkaart bovenaan, daaronder
"Wat vraagt aandacht" en de lopende samenwerkingen, daarna de rest — zelfde opzet/stijl
voor alle rollen.

- [x] Profielkaart-kop (publieke-profiel-taal van /zzp/[id]): initialen-avatar, display-naam,
      vertrouwenszegel (zelfde computeTrustLevel-bron als profiel + dossier), subtitel
      (kop/locatie of bedrijfsnaam·plaats), mono-uurtarief, statusregel, link
      "Bekijk je publieke profiel" (ZZP'er).
- [x] Zone-volgorde voor élke rol: profielkaart → Wat vraagt aandacht (admin: Operationele
      wachtrij) → Wat loopt er nu → statistieken → de rest zoals het was.
- [x] e2e-smoke bijgewerkt (h1 = naam i.p.v. "Welkom terug"); vangrail-allowlist hernummerd.

Visueel geverifieerd (ZZP/CLIENT/ADMIN, geen console-errors); smoke 7/7 lokaal groen.
Gates groen: typecheck ✓, lint ✓, test 1728 ✓, build ✓, prettier ✓

---

## fix(dashboard): verplicht-documenttaak + Warmte-kop (branch `fix/dashboard-verplicht-document`)

Eigenaar-melding (12-6): dashboard toonde rood "Nog niet inzetbaar — Verzekering ontbreekt"
terwijl "Wat vraagt aandacht" zei "Niets dat nu aandacht vraagt. Goed bezig." — de
next-action-laag kende verplichte documenten (VOG/verzekering) niet.

- [x] `tasks.ts` — nieuwe taaksoort `mandatory-document` (band P.mandatoryDoc=84: boven
      afgewezen certificaat, onder identiteit); titel "ontbreekt"/"verlopen", link-resolver.
- [x] `pending-tasks.ts` — één credential-query voedt nu fix-taken én `mandatoryDocuments()`
      (zelfde bron als de inzetbaarheidskaart — de oppervlakken kunnen niet meer tegenspreken).
      In beoordeling = geen taak (admin is aan zet).
- [x] `/certificaten/nieuw?type=…` — deep-link vult het documenttype vast in (gevalideerd
      tegen CREDENTIAL_TYPES, ongeldig → VOG).
- [x] Dashboard in de Warmte-taal: display-kop, uppercase sectielabels (incl. aandacht-zone),
      mono statistiek-cijfers.

Visueel geverifieerd (Sanne: verzekering-taak bovenaan, deep-link prefillt INSURANCE).
Gates groen: typecheck ✓, lint ✓, test 1728 ✓, build ✓, prettier ✓

---

## feat(prognose): inkomstenprognose voor de ZZP'er (branch `feat/inkomstenprognose`)

Bergings-backlog item 11 (sanering-doc, branch `-7wDjk` geborgen via cherry-pick op verse main):

- [x] `src/lib/income-forecast.ts` — pure motor: open cascade-facturen (DRAFT/SUBMITTED/
      APPROVED/OVERDUE) → buckets Te laat / Deze maand / Volgende maand / Later / Nog te
      plannen; totalen bruto/netto/BTW + nog-te-factureren / onderweg / te-laat-splitsing.
- [x] `/prognose` (alleen FREELANCER; anderen → /administratie): samenvattingsstrip,
      buckets met factuurregels, BTW-opzij-hint, disclaimer. Warmte-taal (PageHeader,
      uppercase-labels, mono-bedragen). Nav-item "Prognose" onder Administratie.
- [x] Hardening t.o.v. de geborgen branch: `take: 200` + deterministische `orderBy`
      (vervaldag eerst — vangrail unbounded-queries), dubbele "Concept"-aanduiding weg.
- [x] Tests: income-forecast-suite (bucketing, sortering, randen rond maandwissel/UTC).

Visueel geverifieerd (leeg + gevuld, licht). Gates groen: typecheck ✓, lint ✓, test 1726 ✓,
build ✓, prettier ✓

---

## feat(design): werkproces-pagina in de Warmte-taal (branch `feat/warmte-werkproces`)

Schermen-sweep (slot): display-titel op de kop, alle sectiekoppen (Uren & opleveringen,
Facturen, Contract, Gedeelde certificaten, Weekrooster, ORT-profiel) in de uppercase-labeltaal —
consistent met profiel/opdracht-detail/certificaten. Pure presentatie; visueel geverifieerd.
Gates groen: typecheck ✓, lint ✓, test 1708 ✓, build ✓, prettier ✓

---

## feat(design): certificaten-beheer in de Warmte-taal (branch `feat/warmte-certificaten`)

Schermen-sweep (vervolg): geldig-teller in de paginakop ("X van Y geldig geverifieerd"),
bron-tags (DUO/BIG/ADMIN) naast de statusbadge per certificaat, uppercase-label op het
deel-dossier-blok — zelfde taal als het publieke profiel (#341). Pure presentatie.
Visueel geverifieerd; gates groen: typecheck ✓, lint ✓, test 1708 ✓, build ✓, prettier ✓

---

## feat(design): opdracht-detail in de Warmte-taal (branch `feat/warmte-opdracht-detail`)

Schermen-sweep (vervolg op het Warmte-profiel, #341) — pure presentatie, nul logica:

- [x] Kop-kaart: display-titel + mono-tariefchip
- [x] Alle secties in de uppercase-labeltaal (Eisen, Wet DBA, Geschikte ZZP'ers,
      Over de opdrachtgever, Veilig inhuren)
- [x] "Jouw aansluiting" met ScoreRing-donut (zoals de Aansluiting-kaart in het ontwerp);
      compliance-badge alleen bij afwijking
- [x] Geschikte ZZP'ers: stille badges + MatchMeter (consistent met dashboard)
- [x] Visueel geverifieerd als ZZP'er (donut + labels renderen, nul console-errors)
- Gates groen: typecheck ✓, lint ✓, test 1708 ✓, build ✓, prettier ✓

---

## feat(profiel): publiek ZZP-profiel naar het Warmte-ontwerp — vijf tabs (branch `feat/vakwerk-profiel`)

Eigenaarsopdracht (ontwerp docs/ontwerpen/warmte.html exact nagebouwd op /zzp/[id]):

- [x] **Profielkop**: avatar-initialen, naam + beschikbaarheids- en vertrouwensbadge, subtitel
      (functie · locatie · op het platform sinds), kerncijfers (uurtarief mono, u/wk uit
      beschikbaarheidsvensters, afgeronde samenwerkingen, werkmodus), verificatie-zegels
- [x] **Vijf tabs** (server-gerenderd via ?tab=, geen client-JS): Profiel · Certificaten ·
      Beschikbaarheid · Samenwerkingen · Beoordelingen
- [x] **Profiel**: Stamgegevens (functie/specialisaties/branches/locatie+reistijd/uurtarief/
      KvK/talen/lid sinds) + Over; rechterkolom Profielkracht (ScoreRing-donut + signaalbalken
      identiteit/documenten/certificaten, eerlijk server-side berekend) + Vertrouwen +
      Recente samenwerkingen
- [x] **Certificaten**: "X van Y geldig", per rij bron-tag (DUO/BIG/ADMIN), geverifieerd-datum,
      geldig-t/m of verloopt-over-X-dagen, status-badge
- [x] **Beschikbaarheid**: status + samenvatting + komende vensters · **Samenwerkingen**:
      geanonimiseerd (opdrachttitel, géén bedrijfsnaam — privacy) · **Beoordelingen**: eerlijke
      staat (systeem in voorbereiding, feiten i.p.v. sterren)
- [x] Nieuw `ScoreRing`-component (puur SVG); alle visibility-/tenant-guards intact
- [x] Visueel geverifieerd: alle 5 tabs geschoten, nul console-errors
- Gates groen: typecheck ✓, lint ✓, test 1708 ✓, build ✓, prettier ✓

---

## feat(agenda): ICS-export van het werkrooster (branch `feat/ical-export`)

Bergings-backlog (geborgen van routine-branch zg2s6n): `lib/calendar/{ics,schedule}.ts`
(+ tests) genereren een geldige VCALENDAR met wekelijkse RRULE-events uit actieve
samenwerkingen met rooster; `GET /api/agenda` (eigenaar-scoped) + downloadknop op
/samenwerkingen die zich verbergt zonder exporteerbaar rooster (geen dode knop).
Positief én leeg pad geverifieerd op lokale prod-server. Vangrail-allowlist bij.
Gates groen: typecheck ✓, lint ✓, test 1676 ✓, build ✓, prettier ✓

---

## feat(admin): dispuut-triage met leeftijd en urgentie (branch `feat/dispuut-triage`)

Bergings-backlog (geborgen van routine-branch SJmv0, laatste D-item): `src/lib/disputes.ts`
(+ tests) berekent leeftijd/urgentie per open dispuut; /admin/disputen toont samenvatting +
urgentiesortering. Visueel geverifieerd als admin (lege staat netjes).
Gates groen: typecheck ✓, lint ✓, test 1660 ✓, build ✓, prettier ✓

---

## feat(dashboard): opdrachtgever-zone "Wat kan ik oppakken" (branch `feat/client-oppakken`)

Bergings-backlog / WORKSPACE_OVERHAUL Fase 3-rest (geborgen van routine-branch nrzrs0,
handmatig geïntegreerd op het huidige drie-zones-dashboard):

- [x] `suggestedFreelancersForClient()` in `suggestions.ts` (+ tests): geschikte openbare
      ZZP'ers geaggregeerd over de gepubliceerde opdrachten van de opdrachtgever
- [x] `ClientSuggestionsSection` op het dashboard in de fase-2-stijl (stille badges,
      MatchMeter + mono-percentage, TrustBadge, "Bericht sturen"): prominent zonder lopend
      werk, compact ernaast, en een nodig-uit-CTA zonder suggesties
- [x] Vangrail-allowlist hernummerd; visueel geverifieerd als opdrachtgever (nul errors)
- Gates groen: typecheck ✓, lint ✓, test 1628 ✓, build ✓, prettier ✓

---

## feat(beschikbaarheid): conflictdetectie met lopende samenwerkingen (branch `feat/beschikbaarheidsconflicten`)

Bergings-backlog (geborgen van routine-branch wtK4l, ZZP2-109): `availability-conflicts.ts`
(+ tests) detecteert niet-beschikbaarheidsvensters die overlappen met lopende/voorgestelde
samenwerkingen en waarschuwt op /beschikbaarheid. Vangrail-allowlist bijgewerkt.
Gates groen: typecheck ✓, lint ✓, test 1625 ✓, build ✓, prettier ✓

---

## feat(profiel): KvK- en BTW-nummervalidatie (branch `feat/kvk-btw-validatie`)

Bergings-backlog (geborgen van routine-branch 0jOnC, ZZP2-127): `src/lib/fiscal.ts` met
formaatvalidatie voor KvK-nummers (8 cijfers) en NL-BTW-id's (NL + 9 cijfers + B + 2,
incl. elfproef-varianten) + 25 tests; gekoppeld in `validation.ts` aan het ZZP'er-profiel.
Gates groen: typecheck ✓, lint ✓, test 1615 ✓, build ✓, prettier ✓

---

## feat(avg): verwerkingsregister + bewaartermijnen op /admin/avg (branch `feat/admin-avg-register`)

Bergings-backlog (geborgen van routine-branch J4fj9, cherry-pick op actuele main):
art. 30 AVG-verwerkingsregister met bewaartermijnen-overzicht voor de beheerder
(`processing-register.ts` + 43 tests, `/admin/avg`, nav-item). Pre-launch-complianceitem.
Visueel geverifieerd als admin (lokale prod-server, nul console-errors).
Gates groen: typecheck ✓, lint ✓, test 1590 ✓, build ✓, prettier ✓

---

## fix(security): bevindingen security-review 12-6 (branch `fix/security-review-juni`)

Review over het volledige dagdiff (20 PR's, 119 bestanden): 0 Critical, 2 High, 5 Medium.

- [x] **H-1** — `shareTokenSecret()`: deel-links gebruiken voortaan SHARE_TOKEN_SECRET
      (fallback AUTH_SECRET); rotatie van sessies en links ontkoppeld; .env.example bij
- [x] **M-1/M-2** — `src/lib/cron-auth.ts`: alle 12 taakroutes alleen nog Bearer-header
      (geen ?token= in access-logs) + timing-safe vergelijking
- [x] **M-3** — NoopMailSender logt in productie geen e-mailadres/onderwerp meer (AVG)
- [x] **M-4** — `dossierViewRateLimiter` (30/5min per IP) op het publieke vertrouwensdossier,
      met dezelfde 404 als bij een ongeldig token (geen oracle)
- [x] **H-2** (gedeelde limit-store) + SHARE_TOKEN_SECRET-zetten → MENSENWERK §0b;
      **M-5** (watchdog-dubbelklik) gemitigeerd door assertJobTransition, afweging genoteerd
- Gates groen: typecheck ✓, lint ✓, test 1547 ✓, build ✓, prettier ✓, check:env ✓

---

## feat(ux): PendingSubmitButton — geen enkele werkproces-knop hangt nog eeuwig (branch `feat/pending-submit-watchdog`)

Generalisatie van de JobStatusButton-watchdog (issue #329-leerpunt):

- [x] `src/components/ui/pending-submit-button.tsx` — submit-knop met `useFormStatus`-pending +
      watchdog: geen response binnen 5s → harde refresh (verse GET = werkelijke status)
- [x] Alle 10 submit-knoppen op `/samenwerkingen/[id]` (goed-/afkeuren, factuur indienen/
      goedkeuren/afkeuren, betaling, crediteren, dispuut openen/oplossen, contract) omgezet
- [x] Command-level-repro bevestigt: rejectPerformance werkt foutloos — het afkeuren-e2e-pad
      blijft een prod-form-nuance binnen #329; CI-skip blijft met verwijzing
- Gates groen: typecheck ✓, lint ✓, tests ✓, build ✓, prettier ✓

---

## fix(ux): statusknop kan niet meer eeuwig hangen — watchdog + redirect (issue #329, branch `fix/329-werkende-statusknop`)

Diepe debugsessie op de prod-only hang van server-action-responses (#329):

- Uitgesloten: CSP (#323), service worker, action-body (auth/prisma/audit/revalidate), bind-forms,
  sectie-JSX. Vastgesteld: route-specifiek (/opdrachten/[id]), intermitterend (~2/3), server rondt
  alles af incl. 303 — de response bereikt de client nooit. Wortel zit in Next-streaming-internals;
  reproductiepad en bevindingen staan in issue #329.
- [x] `changeJobStatus` eindigt nu met `redirect()` (juiste semantiek; verse GET).
- [x] **Watchdog** in `JobStatusButton`: hangt de response > 4s, dan een harde refresh — een verse
      GET toont gegarandeerd de werkelijke status. Geverifieerd 3/3 in prod-modus (badge ≤ 5s).
- [x] Cascade-e2e weer aan in CI (de setup strandde exact op dit hang-pad).
- Gates groen: typecheck ✓, lint ✓, test 1545 ✓, build ✓, prettier ✓

---

## fix(boekhouding): rol-fallback ADMIN/FRANCHISER op /administratie (branch `fix/boekhouding-rol-fallback2`)

Bergings-backlog (geborgen van routine-branch szz2a3, ZZP2-141): ADMIN/FRANCHISER kregen op
/administratie een misleidend leeg ZZP-grootboek; nu een nette uitleg-lege-staat
(`administrationPartyForRole`), met voor ADMIN een verwijzing naar het platform-brede overzicht.
Vangrail-allowlist hernummerd. Visueel geverifieerd als admin op lokale prod-server.
Gates groen: typecheck ✓, lint ✓, test 1547 ✓, build ✓, prettier ✓

---

## fix(geld) + e2e: credit-/afkeur-crash, betaal-tegenboekingen, dispuut-freeze (branch `feat/e2e-credit-zijpad`)

De nieuwe credit-zijpad-e2e legde een keten van echte bugs bloot (missie B-vondst):

- [x] **Crash-fix:** `Invoice.rejectionReason` bestond niet — élke factuurafkeuring (D′) én
      creditering crashte op een PrismaClientValidationError achter een generieke foutpagina.
      Kolom additief toegevoegd (schema + db push).
- [x] **Geld-fix geborgen** (sanering-sha 798aedee, routine-branch pbzof7): credit-van-betaald
      draait nu óók de betaal-tegenboekingen terug (geen spookvordering/-schuld meer in
      debiteuren/crediteuren) + PAST_DUE-ladder per episode; met verzwaarde tests.
- [x] **UI-dispuut-freeze:** 7 actie-oppervlakken op het werkproces (prestatie-/factuur-/
      betaal-/credit-acties) verdwijnen tijdens een dispuut — server blokkeerde al, de UI
      bood de acties nog aan.
- [x] **e2e:** nieuw credit-zijpad-scenario; hele cascade-suite locator-gehard (stepper-details
      maakten vrije-tekst-matches ambigu, scoping op secties + exact); **4/4 lokaal groen**.
- [x] **CI:** e2e-job draait nu smoke + cascade (was alleen smoke — de kritieke geld-loop
      draaide nooit in CI).
- Gates groen: typecheck ✓, lint ✓, test 1547 ✓, build ✓, prettier ✓

---

## docs(design): Vakwerk fase 4 — dark-pariteit-sweep afgerond (geen afwijkingen)

Sweep over dashboard, opdrachten, samenwerkingen (+detail), facturen, certificaten en
notificaties in licht én donker (14 screenshots via lokale prod-server): 0 console-errors,
0 overflow, statuskleuren en signatuurcomponenten klappen correct om via de tokens.
Missie C (Vakwerk-frontend) is hiermee volledig afgevinkt; geen codewijzigingen nodig.

---

## feat(design): Vakwerk fase 3 — CascadeStepper + TurnBanner op het werkproces (branch `feat/vakwerk-fase3`)

- [x] Keten-rendering op `/samenwerkingen/[id]` vervangen door de `CascadeStepper`-signatuur
      (zegelgroen afgerond, merkkleur actief, verbindingslijn; mobiel stapelt verticaal);
      `STEP_ICON` + losse iconen-imports verwijderd
- [x] "Aan zet"-card vervangen door de `TurnBanner` (hét contrastmoment: inkt op papier,
      pulserende stip; eerste taak als titel, rest als lijst)
- [x] Visueel geverifieerd op lokale prod-server (login → samenwerking; nul console-errors)
- Gates groen: typecheck ✓, lint ✓, test 1545 ✓, build ✓, prettier ✓

---

## feat(design): Vakwerk fase 2 — held-kaart + rustiger identiteit (branch `feat/vakwerk-fase2`)

Missie C fase 2 (cherry-picks 8840e36 + aa5719a van de ontwerpbranch, op actuele main):

- [x] **TaskHero** in `action-list.tsx` — de hoogst-gerankte taak als toon-getint held-vlak met
      icoonblok en dezelfde inline-resolver; de rest blijft compacte rijen
- [x] **Rustiger identiteit** — badges alleen als ze iets signaleren (beschikbaar/compliant is de
      norm), MatchMeter + mono-percentage i.p.v. drie badges, zachter pastel, palette-switcher
      verwijderd (één identiteit), theme.ts vereenvoudigd
- [x] Vangrail-allowlist hernummerd (dashboard-regel)
- [x] Visueel geverifieerd op lokale prod-server (login → dashboard, nul console-errors)
- Gates groen: typecheck ✓, lint ✓, test 1545 ✓, build ✓, prettier ✓

---

## feat(security): CSP-nonce-pipeline — productie zonder 'unsafe-inline' voor scripts (branch `feat/csp-nonce`)

Missie A (prompts/MISSIE-PRODUCTIE-KLAAR.md): de laatste grote pre-prod security-hardening in code.

- [x] `src/lib/csp.ts` (+ 5 tests) — pure `buildCsp()` + `generateNonce()` (Web Crypto, Edge+Node);
      prod: `script-src 'self' 'nonce-…' 'strict-dynamic'` + legacy-fallbacks; dev: oude permissieve
      policy (HMR) zonder nonce
- [x] `src/middleware.ts` — `nextWithCsp()`: nonce per request op request- én responseheaders
      (request-header laat Next zijn eigen hydratie-scripts noncen)
- [x] `src/app/layout.tsx` — leest `x-nonce` via `headers()` voor het inline theme-script; maakt de
      app bewust volledig dynamisch zodat er geen statisch gebakken HTML zonder nonce bestaat
- [x] `next.config.mjs` — CSP verwijderd uit de statische headers (rest blijft)
- [x] Geverifieerd op lokale prod-server: header + nonce op theme- én framework-scripts (curl),
      0 nonce-loze inline scripts, browser-smoke zonder CSP-errors met werkende interactiviteit
- Gates groen: typecheck ✓, lint ✓, csp-tests 5 ✓, build ✓ (alle routes dynamisch)

---

## feat(security): rate-limiting op kritieke mutaties (branch `feat/rate-limit-mutaties`)

Missie A (prompts/MISSIE-PRODUCTIE-KLAAR.md): vier nieuwe fixed-window-limiters naast de
bestaande login/registratie/reset/zelf-verificatie-remmen.

- [x] `src/lib/rate-limit.ts` — message (30/5min), application (10/u), upload (20/u), export (5/u);
      alle drempels via env overschrijfbaar, gedocumenteerd in `.env.example`
- [x] Gewired: `berichten/actions.ts` (sendMessage), `opdrachten/actions.ts` (createApplication),
      `documenten/actions.ts` (uploadDocument), `api/account/export` (HTTP 429)
- [x] 4 nieuwe limiter-tests; allowlist-regelnummers vangrail bijgewerkt
- Gates groen: typecheck ✓, lint ✓, test 1527 ✓, build ✓, prettier ✓, check:env ✓

---

## fix(samenwerkingen): afronden-rem op het handmatige pad + knopweergave (branch `claude/dazzling-carson-v9Qwk`, ZZP2-163)

Maakt bergings-backlog #1 (geld-correctheid) volledig af. De cascade-afronding was al gedicht
(ZZP2-160, `cascade/completion.ts`), maar het **handmatige** afrondpad miste de rem en bood een
dode knop. Nu symmetrisch met de annuleer-rem en gevoed uit dezelfde pure module:

- [x] **`src/lib/cascade/completion.ts`** — `completionBlockReason(snapshot)`: NL-reden of `null`
      (geld eerst: niet-afgewikkelde factuur blokkeert vóór een onbeoordeelde SUBMITTED-prestatie).
      Tegenhanger van `hasOpenCollaborationWork`, gedeeld door guard + UI. +8 unit-tests.
- [x] **`samenwerkingen/actions.ts`** — `changeCollaborationStatus` weigert COMPLETED server-side bij
      open geld/onbeoordeeld werk (factuurstatussen + SUBMITTED-prestaties; server-side waarheid).
- [x] **`samenwerkingen/page.tsx`** — geen dode "Markeer als afgerond"-knop: bulk-snapshot per
      zichtbare samenwerking → toont de reden i.p.v. een knop die de server zou weigeren.
- [x] **`unbounded-queries.test.ts`** — allowlist voor de twee nieuwe (page-/collab-begrensde)
      findMany's + bijgewerkte regelnummers.
- Gate groen: typecheck ✓, lint ✓, test 1523 ✓, build ✓, prettier ✓. (E2e niet in routine — geen
  browser-channel.)

---

## fix(boekhouding): geen FREELANCER-fallback voor ADMIN/FRANCHISER op /administratie (branch `claude/dazzling-carson-v9Qwk`, ZZP2-162)

Bergings-backlog #3 (rol-fallback boekhouding). `/administratie` bepaalde de grootboekpartij met
een stille fallback (`actor.role === "CLIENT" ? "CLIENT" : "FREELANCER"`): ADMIN en FRANCHISER
kregen daardoor een lege ZZP-administratie met labels (omzet, af te dragen BTW) die voor hun rol
niet kloppen. Een franchisenemer heeft geen persoonlijke debiteuren-/crediteurenadministratie;
een admin gebruikt het platform-brede overzicht.

- [x] **`src/lib/administration/overview.ts`** — pure `administrationPartyForRole(role)`:
      FREELANCER→FREELANCER, CLIENT→CLIENT, ADMIN/FRANCHISER→null (+ type `PersonalLedgerParty`).
- [x] **`src/app/(protected)/administratie/page.tsx`** — bij `null` een nette empty-state:
      admin → link naar `/admin/administratie`, overige rollen → dashboard. Geen misleidend grootboek.
- [x] **Tests** — `overview.test.ts` +3 (FREELANCER/CLIENT/ADMIN/FRANCHISER); allowlist-regel
      voor de eigenaar-scoped `administrationEntry.findMany` bijgewerkt naar de nieuwe regel.
- Gate groen: typecheck ✓, lint ✓, test 1516 ✓, build ✓, prettier ✓. (e2e niet gedraaid —
  geen browser-channel in de routine.)

---

## fix(csv): hard tegen formule-injectie (CWE-1236) in CSV-export (branch `claude/dazzling-carson-v9Qwk`, ZZP2-161)

Bergings-backlog #2 (security, klein). `escapeCsvField` quotete velden bij scheidingsteken/
quote/newline, maar beschermde niet tegen formule-injectie: een cel die met `=`/`+`/`-`/`@`/
tab/CR begint kan door Excel/LibreOffice/Sheets als formule worden uitgevoerd. Exportwaarden
komen deels uit gebruikersinvoer (namen, bedrijfsnamen, omschrijvingen).

- [x] **`src/lib/csv.ts`** — `needsFormulaGuard(value)` herkent gevaarlijke starttekens
      (`= + @ \t \r`, en `-` tenzij een gewoon negatief getal via `PLAIN_NEGATIVE`); cellen
      krijgen een voorloopse apostrof `'` (binnen de quotes wanneer quoting nodig is).
      Fix in de centrale module ⇒ alle exports (grootboek, BTW, aging, diensten, onboarding)
      zijn in één keer beschermd. RFC 4180-quoting blijft intact.
- [x] **`src/lib/csv.test.ts`** — +12 tests: elk gevaarlijk startteken, `=HYPERLINK`-payload,
      negatief-getal-uitzonderingen (`-5`, `-1016.40`, `-1016,40`), `a=b` ongemoeid, gemengde rij.
- Gates groen: typecheck ✓, lint ✓, test 1513 ✓, build ✓, prettier ✓. (e2e overgeslagen —
  routine zonder browser-channel.)

---

## fix(cascade): afronden-rem — geen COMPLETED-samenwerking met openstaand geld (branch `claude/dazzling-carson-v9Qwk`, ZZP2-160)

Bergings-backlog #1 (geld-correctheid). `planPaymentConfirmedEvent` zette een samenwerking
onvoorwaardelijk op COMPLETED zodra één factuur betaald werd — ook als er nog andere
niet-afgewikkelde facturen of onbeoordeelde prestaties open stonden, waardoor dat geld/werk
los van zijn context achterbleef.

- [x] **`src/lib/cascade/completion.ts`** — pure, DB-loze helper: `isInvoiceSettled`
      (cascade PAID/PROCESSED/CREDITED of legacy PAID/CANCELLED = afgewikkeld) +
      `hasOpenCollaborationWork(snapshot)` (open zodra een SUBMITTED-prestatie of een
      niet-afgewikkelde andere factuur bestaat). +21 unit-tests (`completion.test.ts`).
- [x] **`src/lib/cascade/handlers.ts`** — `PaymentConfirmedCtx.collaboration` kreeg optioneel
      `hasOtherOpenWork`; afrond-conditie is nu `status === "ACTIVE" && !hasOtherOpenWork`.
      +1 handler-test (afronding tegengehouden bij openstaand werk).
- [x] **`src/lib/cascade/payment-commands.ts`** — `confirmPayment` berekent server-side de
      snapshot (andere facturen + SUBMITTED-prestaties van de samenwerking) en geeft
      `hasOtherOpenWork` door. De factuur wordt nog steeds betaald gemarkeerd; alleen de
      automatische afronding wacht tot het laatste openstaande werk weg is.
- Gates groen: typecheck ✓, lint ✓, test 1493 ✓, build ✓, prettier ✓. (e2e overgeslagen —
  routine zonder browser-channel.)

---

## feat(notificaties): e-mailvoorkeuren per categorie (opt-out) — geborgen + uitgebreid (branch `feat/email-voorkeuren`)

Geborgen van routine-branch `epic-lovelace-2fRim` (1 juni, nooit als PR geopend; zie
"Increment: Notificatie-voorkeuren" verderop voor de oorspronkelijke inhoud) via cherry-pick op
actuele main, en uitgebreid:

- [x] Cherry-pick conflictvrij voor alle code behalve schema/PROGRESS; T1-runner-tests (10 juni)
      voorzien van `notificationPreference`-mock (4 testbestanden)
- [x] **Nieuwe 5e categorie `digest`** in `EMAIL_PREFERENCE_CATEGORIES` — de digest-runner
      (#314) bestond nog niet toen de branch gebouwd werd
- [x] **`notification-digest-task.ts`** — opt-out op queryniveau
      (`notificationPreferences: { none: { category: "digest", emailEnabled: false } }`):
      notificaties van een opted-out gebruiker blijven ongemarkeerd zodat hij na heraanzetten
      alsnog één digest over de achterstand krijgt; +1 runner-test
- [x] Preferences-tests bijgewerkt 4 → 5 categorieën (incl. schema-cases)
- Gates groen: typecheck ✓, lint ✓, test 1471 ✓, build ✓, prettier ✓

---

## feat(samenwerkingen): herplaatsing bij uitval (branch `claude/dazzling-carson-v9Qwk`, ZZP2-158)

Concurrentie-backlog ronde 2, laatste open BOUWEN-item ("SOS" à la Zorgwerk/ZZP-Markt): bij
annulering van een **actieve** samenwerking helpt het platform de opdrachtgever de dienst direct
opnieuw in te vullen. De openstaande-factuur-veiligheidsrem in de cancel-actie bleef ongewijzigd.

- [x] **`src/lib/replacement.ts`** (+ `replacement.test.ts`, 8 tests) — pure `planReplacement({ from, to, jobStatus })`:
      alleen `ACTIVE→CANCELLED` handelt; CLOSED→heropenen (PUBLISHED) + signaal, PUBLISHED→alleen signaal,
      DRAFT→niets (respecteert een bewust gedepubliceerde dienst). Alle andere overgangen = leeg plan.
- [x] **`src/app/(protected)/samenwerkingen/actions.ts`** — `changeCollaborationStatus` heropent de dienst
      (via `assertJobTransition`, defense-in-depth) + notificeert de opdrachtgever (`COLLABORATION_REPLACEMENT`) + audit (`JOB_REOPENED_FOR_REPLACEMENT`, `COLLABORATION_REPLACEMENT_OPENED`), atomair in de bestaande
      `$transaction`. Veiligheidsrem (openstaande factuur blokkeert annuleren) staat ervóór en blijft intact.
- [x] **`src/components/collaborations/replacement-panel.tsx`** — rustige "Herplaatsing"-kaart met passende,
      beschikbare ZZP'ers (TrustBadge/AvailabilityBadge/ComplianceBadge + "Bericht sturen" via
      `startConversationWithFreelancer`) of nette lege staat met link naar de opdracht.
- [x] **`src/app/(protected)/samenwerkingen/[id]/page.tsx`** — panel getoond aan de opdrachtgever bij een
      geannuleerde samenwerking; `suggestedFreelancersForJob` (leeg zodra de dienst niet PUBLISHED is).
- [x] **`src/lib/audit-labels.ts`** + **`src/lib/notifications.ts`** — nieuwe labels + notificatiecategorie.
- Gate groen: typecheck ✓, lint ✓, test 1479 ✓ (+8, na rebase op main), build ✓, prettier ✓. (E2e:
  geen browser-channel in de routine — overgeslagen, net als in CI.)

---

## feat(vertrouwen): deelbaar en verifieerbaar vertrouwensdossier (branch `claude/feat-dossier-link`)

- [x] **`src/lib/share-token.ts`** — pure helpers `dossierShareToken(profileId, secret)` en `verifyDossierToken(profileId, token, secret)`; HMAC-SHA256, hex, 32 tekens; timing-safe vergelijking; lege-secret-guard
- [x] **`src/lib/share-token.test.ts`** — 10 unit-tests: deterministisch, verkeerd token faalt, ander id faalt, lege secret werpt / retourneert false, lengte-oracle geblokkeerd
- [x] **`src/app/vertrouwen/[profileId]/[token]/page.tsx`** — publieke route (buiten protected): token+profiel-check → neutrale melding als ongeldig/niet-PUBLIC; bij geldig: naam/functie/vertrouwensbadge (hergebruik TrustBadge + computeTrustLevel), geverifieerde certificaten-metadata (type/titel/geldig-t/m/bron), verificatieverklaring + datum; audit TRUST_DOSSIER_VIEWED; geen bestanden, geen PII buiten naam+functie
- [x] **`src/middleware.ts`** — `/vertrouwen/` toegevoegd als publieke route (naast `/zzp/`)
- [x] **`src/app/(protected)/certificaten/(index)/page.tsx`** — deelblok "Deel je vertrouwensdossier": URL tonen als profiel PUBLIC (data-testid), link naar profielinstellingen als PRIVATE; server-side token-berekening, geen client-JS
- [x] **`src/lib/audit-labels.ts`** — `TRUST_DOSSIER_VIEWED` label toegevoegd
- [x] **`src/lib/unbounded-queries.test.ts`** — allowlist bijgewerkt (regel-nr. verschoven door edits in certificaten-page)
- [x] **`e2e/trust-dossier.spec.ts`** — 2 e2e-specs: deelblok zichtbaar + URL navigeerbaar + publieke pagina bevestigt naam + "Geverifieerd"; ongeldige token toont neutrale melding
- Bewuste beperking (gedocumenteerd in code): geen per-token revocatie in v1; profiel op PRIVATE zetten maakt link ontoegankelijk
- Middleware-aanpassing: ja (`/vertrouwen/` als publiek pad)
- Gates groen: typecheck ✓, lint ✓, 1383 tests ✓ (was 1373, +10 share-token), prettier (n.v.t. — zie poort)

---

## feat(dba): audit-klaar DBA-dossier als PDF-export per samenwerking (branch `claude/feat-dba-export`)

- [x] **`src/lib/dba-audit.ts`** — pure functie `buildDbaAuditData(col, parties, credentials, now)` → serialiseerbaar data-object; `DBA_AUDIT_FOOTER` als vaste voettekst-disclaimer
- [x] **`src/lib/dba-audit.test.ts`** — 25 unit-tests: footer/disclaimer, modelovereenkomst-status (ondertekend/niet), DBA-indicatoren doorvertaald (6), rechtsvermoeden tarieftoets, ondernemerschap-signalen, header-metadata
- [x] **`src/lib/dba-audit-pdf.ts`** — PDF-builder (`buildDbaAuditPdf`) met voettekst op elke pagina (pdf-lib, hergebruikt pdf-common)
- [x] **`src/app/api/samenwerkingen/[id]/dba-dossier/route.ts`** — GET-route: requireActor → partij-check → PDF → audit `DBA_DOSSIER_EXPORTED`
- [x] **`src/app/(protected)/samenwerkingen/[id]/page.tsx`** — link "DBA-dossier (PDF)" naast Compliance-dossier (minimale wijziging)
- Alle gates groen: typecheck ✓, lint ✓, 1398 tests ✓ (137 test files), prettier ✓

---

## feat(vertrouwen): startkapitaal- en boekhoud-belofte op de vertrouwens-strip (branch `claude/feat-trust-copy`)

- [x] **`src/components/marketing/trust-strip.tsx`** — twee nieuwe PILLARS toegevoegd:
  - "Geverifieerd dossier is je startkapitaal" (icoon: `FolderCheck`)
  - "Gatenvrije factuurnummering" (icoon: `FileCheck`)
  - Zelfde structuur/stijl als bestaande pijlers; geen duplicatie
- Geen nieuwe unit-tests nodig (PILLARS is pure data zonder logica; test voor `trustHighlights` ongewijzigd)
- Alle gates groen: typecheck ✓, lint ✓, 1373 tests ✓, prettier ✓, build ✓

---

## feat(notificaties): "terwijl je weg was"-overzicht in het notificatiecentrum (branch `claude/feat-gemist-overzicht`)

Concurrentie-backlog punt 7 (deel 2 van 2): het notificatiecentrum vat ongelezen meldingen samen
die binnenkwamen tussen de vorige en de huidige login. Deel 1 (e-mail-fallback digest) zit in
PR #314; web-push (VAPID) blijft mensenwerk.

- [x] **`prisma/schema.prisma`** — additief nullable `User.previousLoginAt`
- [x] **`src/auth.ts`** — signIn-event schuift `lastLoginAt` → `previousLoginAt` vóór de update
- [x] **`src/lib/missed-notifications.ts`** — pure `missedWhileAway()`: venster (previousLoginAt,
      lastLoginAt], alleen ongelezen, null bij niets te tonen (rustige standaard)
- [x] **`src/lib/missed-notifications.test.ts`** — 8 unit-tests (geen vorige login, venster-
      randwaarden, gelezen telt niet, na-login telt niet, defensief zonder lastLoginAt)
- [x] **`src/app/(protected)/notificaties/page.tsx`** — rustige banner boven de groepen:
      "Terwijl je weg was: N ongelezen meldingen sinds je vorige bezoek op {datum}"
- Gates groen: typecheck ✓, lint ✓, test 1381 ✓ (was 1373), build ✓, prettier ✓

---

## feat(notificaties): e-mail-fallback digest voor ongelezen meldingen (branch `claude/feat-notificatie-digest`)

Concurrentie-backlog punt 7 (deel 1 van 2): wie de app een tijd niet opent, krijgt ongelezen
in-app-notificaties gebundeld per e-mail. Web-push (VAPID) blijft mensenwerk; het "gemist terwijl
je weg was"-overzicht is het volgende increment.

- [x] **`src/lib/notification-digest.ts`** — pure planner: bundelt ongelezen notificaties ouder dan
      24u (`REMINDERS.notificationDigestMinAgeHours`) tot één digest per gebruiker, gegroepeerd per
      categorie (NL-labels, vaste volgorde, max 3 voorbeeldtitels), deterministische `dedupeKey`
- [x] **`src/lib/notification-digest-task.ts`** — runner (plan/apply zoals `runExpiryTask`):
      idempotent via nieuw veld `Notification.digestedAt` (voortgangsmarkering à la
      `expiryReminderFor`) + `DomainEvent.dedupeKey` als vangnet; **slaat over zonder echt
      mailkanaal** (`isMailDeliveryConfigured()`, nieuw in `mail-sender.ts`) omdat e-mail hier het
      enige effect is; cap 500 kandidaten/run
- [x] **`prisma/schema.prisma`** — additief nullable `Notification.digestedAt`
- [x] **`src/lib/notifications.ts`** — `NOTIFICATION_CATEGORY_LABEL` (NL-labels per categorie)
- [x] **`src/lib/services/reminder-emails.ts`** — `buildNotificationDigestEmail` (tekst + HTML)
- [x] **`src/app/api/tasks/run-all/route.ts`** — runner geregistreerd als `notification-digest`
- [x] Tests: 8 planner-tests (`notification-digest.test.ts`) + 8 runner-tests
      (`notification-digest-task.test.ts`: skip-zonder-mailkanaal, drempel, happy path,
      idempotentie, dedupe-vangnet, mailfout-tolerantie)
- Gates groen: typecheck ✓, lint ✓, test 1389 ✓ (was 1373), build ✓, prettier ✓

---

## feat(dba): tarief-drempelwaarschuwing rechtsvermoeden werknemerschap (branch `claude/feat-tariefdrempel`)

- [x] **`RECHTSVERMOEDEN_DREMPEL_CENTS = 3800`** toegevoegd aan `src/lib/config.ts` met broncommentaar (wetsvoorstel VBAR, aangenomen 21-4-2026, drempel €38 prijspeil 2025, verwachte iwt 1-1-2027)
- [x] **`src/lib/rechtsvermoeden.ts`** — pure logica: `assessRateThreshold(rateCents)`, `rechtsvermoedenHint()`, `RECHTSVERMOEDEN_DISCLAIMER`
- [x] **`src/lib/rechtsvermoeden.test.ts`** — 11 unit-tests: onder/op/boven drempel, null-tarief, grenswaarden, hint-inhoud, disclaimer
- [x] **`src/app/(protected)/opdrachten/job-form.tsx`** — live inline hint bij het rateMin-veld (client-side, `warning`-toon, verdwijnt zodra tarief ≥ €38)
- [x] **`src/app/(protected)/opdrachten/[id]/page.tsx`** — statisch signaalblok naast DBA-sectie voor eigenaar/admin als rateMin < €38
- [x] **`src/app/(protected)/samenwerkingen/[id]/page.tsx`** — Card-blok in het Afspraken/DBA-blok voor actieve en voorgestelde samenwerkingen als col.rate < €38
- Alle gates groen: typecheck ✓, lint ✓, 1359 tests ✓ (was 1348), prettier ✓

---

## Legenda

- [x] af en getest
- [~] deels af / in uitvoering
- [ ] nog niet begonnen

---

## Audit T4 — `commands.ts` gesplitst per entiteit (branch `claude/audit-t4-commands-split`)

- [x] **Mechanische splitsing van `src/lib/cascade/commands.ts` (1193 regels) in 6 modules**
  - `commands-shared.ts` (230 regels) — `CascadeError`, `isUniqueDedupeViolation`, `persistEventAndEffects`, `persistInTransaction`, `assertParty`, `assertNotDisputed`, loaders (`loadPerformance`, `loadCascadeInvoice`), e-mailhelpers (`loadCollabMeta`, `collabLink`)
  - `contract-commands.ts` (97 regels) — `signContract` (Event A)
  - `performance-commands.ts` (287 regels) — `createPerformance`, `updatePerformance`, `submitPerformance`, `approvePerformance`, `autoApprovePerformance`, `rejectPerformance` (Events B1/B2/B2')
  - `invoice-commands.ts` (188 regels) — `submitInvoice`, `approveInvoice`, `rejectInvoice`, `creditInvoice` (Events C/D/D')
  - `payment-commands.ts` (78 regels) — `confirmPayment` (Event E)
  - `dispute-commands.ts` (107 regels) — `openDispute`, `resolveDispute` (zijpad escalatie)
  - `commands.ts` (38 regels) — barrel, re-exporteert alles; alle bestaande importpaden werken ongewijzigd
  - Puur mechanische verplaatsing: nul gedragswijzigingen, nul hernoemingen, comments meegenomen
  - Alle gates groen: typecheck ✓, lint ✓, 1306 tests ✓, build ✓, prettier ✓

---

## Betaalgedrag-signaal opdrachtgever (branch `claude/feat-betaalgedrag`)

- [x] **`src/lib/payment-behavior.ts`** — pure functie `computePaymentBehavior()`, bronkeuze `updatedAt` als `paidAt`-proxy gedocumenteerd, tone-grenzen (good/neutral/warning/unknown), sampleSize < 3 = unknown
- [x] **`src/lib/payment-behavior.test.ts`** — 14 unit-tests voor alle grenzen + lege invoer + edge cases
- [x] **`src/lib/data/payment-behavior.ts`** — query `getPaymentBehaviorForCompany()` (laatste 25 betaalde facturen per companyId, via collaboration.companyId)
- [x] **`src/components/jobs/payment-behavior-block.tsx`** — compact blok met badge + statistieken (tone-kleur, avg dagen, % op tijd)
- [x] **`src/app/(protected)/opdrachten/[id]/page.tsx`** — betaalgedrag-blok zichtbaar voor niet-eigenaar FREELANCER
- [x] Checks: typecheck ✓, lint ✓, test ✓ (1362/1362), build ✓, prettier ✓

---

## Audit T5 — logica uit samenwerkingen-pagina extraheren (branch `claude/audit-t5-pagina-extractie`)

- [x] **Extractie pure logica uit `src/app/(protected)/samenwerkingen/[id]/page.tsx`** (935 → 772 regels)
  - `src/lib/cascade/chain-steps.ts` — `buildChainSteps` + types `ChainStep`/`ChainStepStatus` (puur, geen React)
  - `src/lib/cascade/chain-steps.test.ts` — 24 unit-tests voor alle cascade-stappen/toestanden
  - `src/lib/ort.ts` — `parseOrtSegments` toegevoegd (JSON-parse met lege-array-fallback)
  - `src/lib/ort.test.ts` — 3 tests voor `parseOrtSegments` (geldig, ongeldig JSON, null/undefined)
  - `src/components/collaborations/ort-breakdown.tsx` — `OrtBreakdown` JSX-component
  - `PERF_STATUS`/`INV_STATUS` zijn in de page gelaten: worden nergens anders gebruikt, verplaatsen
    zou een bestand-zonder-callers opleveren. Keuze: kleinste, zuiverste resultaat.
  - `STEP_ICON` (React-rendering) blijft in de page conform opdracht.
- [x] Checks: typecheck ✓, lint ✓, test ✓ (1333/1333), prettier ✓

---

## Audit T3 — cursor-paginatie samenwerkingen en documenten (branch `claude/audit-t3-paginatie`)

- [x] **Gedeelde pagination-helper** `src/lib/pagination.ts` — `pageArgs()`, `splitPage()`, `getPageSize()` (env `LIST_PAGE_SIZE`, default 50). 11 unit-tests in `pagination.test.ts`.
- [x] **Samenwerkingen paginatie** `src/app/(protected)/samenwerkingen/page.tsx` — `take: 100` verwijderd, cursor-paginatie via `?cursor=`, `orderBy: [updatedAt desc, id desc]`, "Meer laden"-link (RSC).
- [x] **Documenten paginatie** `src/app/(protected)/documenten/page.tsx` — zelfde aanpak, `orderBy: [createdAt desc, id desc]`.
- [x] **Vangrail** `src/lib/unbounded-queries.test.ts` — scant `src/app/**` op `findMany()` zonder `take:` of `pageArgs`-spread; volledige allowlist met redenen (56 uitzonderingen gedocumenteerd).
- [x] **Env-documentatie** `.env.example` — `LIST_PAGE_SIZE` gedocumenteerd.
- [x] **CI** `.github/workflows/ci.yml` — `LIST_PAGE_SIZE: "5"` in e2e-job-env.
- [x] **E2e-spec** `e2e/paginatie.spec.ts` — defensief geschreven (seed heeft max. 2 documenten / 1 samenwerking per gebruiker, dus "Meer laden" verschijnt niet met default seed). Cursor-URL-navigatie zonder fout getest.
- Checks: typecheck ✓ · lint ✓ · test 133 files / 1321 tests ✓ · prettier ✓ · check:env ✓

---

## Audit T1 — unit-tests voor alle cron-task-runners (branch `claude/audit-t1-cron-tests`)

- [x] **Unit-tests voor alle 9 cron-task-runners** — 51 nieuwe tests (+ 4 runner-tests uitgebreid in `performance-grace-task.test.ts`)
  - `expiry-task.test.ts` — 5 tests: verlopen, herinnering, dedup, mix, leeg. Functies: 100%
  - `payment-reminders-task.test.ts` — 4 tests: leeg, OVERDUE-markering, dedup, null-candidates. Functies: 80%
  - `dba-monitor-task.test.ts` — 5 tests: leeg, HOOG-signaal, dedup, recent, omzetconcentratie. Functies: 100%
  - `concept-invoice-reminders-task.test.ts` — 6 tests: leeg, dag 3, dag 7, escalatie, dedup, geen dag. Functies: 100%
  - `vat-reminder-task.test.ts` — 4 tests: leeg, buiten venster, happy path 2 ZZP'ers, dedup. Functies: 100%
  - `job-alerts-task.test.ts` — 6 tests: leeg, geen profielen, happy path, dedup, al gealert, credentials. Functies: 100%
  - `past-due-task.test.ts` — 6 tests: leeg, dag 1, dag 3, downgrade, dedup, geen herinneringsdag. Functies: 100%
  - `zzp-membership-task.test.ts` — 6 tests: leeg, 1 ZZP'er, 2 ZZP'ers, dedup, 2× run, buiten maand. Functies: 100%
  - `performance-grace-task.test.ts` (uitgebreid) — 4 runner-tests + 6 bestaande pure tests. Functies: 100%
  - **Coverage:** functies per runner ≥ 80% (totaal 95,65%). Zie coveragetabel in commit-body.
  - `MENSENWERK.md` bijgewerkt met §10 over ontbrekende productie-cron voor `/api/tasks/run-all`.

---

## WORKSPACE OVERHAUL (`prompts/WORKSPACE_OVERHAUL.md`) — dashboards → command center

- [x] **Fase 1 — pure helpers + unit-tests** (branch `feat/workspace-overhaul`, PR #69)
  - [x] A) `src/lib/cascade/stage.ts` — `cascadeStage()`: fase/voortgang (stap N/6)/wie-aan-zet/CTA
        per samenwerking, viewer-bewust. 14 tests (`stage.test.ts`).
  - [x] C) `src/lib/next-actions.ts` — `messagesAwaitingReply` voor freelancer + client (band 55);
        dashboard hergebruikt `unreadConversationCount` uit `signals.ts` (nu geëxporteerd). +4 tests.
        (Legitimatie/VOG-expiry valt al onder `expiringCredentials`; geen apart identiteit-expiry-veld.)
  - [x] B) `src/lib/week-overview.ts` — `weekOverview()`: deterministisch weekoverzicht (ISO-week UTC,
        timing-classificatie, sortering per opdrachtgever). 10 tests. Geen per-dag-rooster (geen
        schema-veld) → echt "ma bij A, wo bij B" vergt ADR + schema-uitbreiding (Fase 6).
- [x] **Fase 2 — FREELANCER-dashboard → drie zones** — `dashboard/page.tsx`: zone 1 "Wat loopt er nu"
      (`RunningCard` met fase-chip + `Progress` stap N/M + "aan zet"-CTA via `cascadeStage`), zone 2 "Wat
      vraagt aandacht" (`DashboardActions`, tone-bewust), zone 3 "Wat kan ik oppakken" (`MatchesSection`,
      prominent bij geen lopend werk, compact ernaast). + inzetbaarheid + onboarding-checklist nieuw account.
- [x] **Fase 3 — CLIENT** — zelfde drie zones vanuit opdrachtgever-perspectief (lopende samenwerkingen +
      compliance-waarschuwing per kaart, operationele aandacht-zone).
- [x] **Fase 4 — ADMIN** — zone 2 als "Operationele wachtrij" (`DashboardActions`); kerncijfers via stats +
      `/admin/statistieken`.
- [x] **Fase 5 — zijbalk** — `nav.ts` per rol gegroepeerd (Werk · Profiel · Administratie · Account; admin:
      Operatie · Toezicht · Beheer), met Dashboard ≠ Administratie expliciet gescheiden + eigen iconen.
- [x] **Fase 6 — weekoverzicht-UI** — week-chips bovenaan zone 1 bij ≥2 actieve samenwerkingen
      (`weekOverview` + `formatWeekdays`); `Collaboration.weekdays` bestaat (`parseWeekdays`), dus "ma bij A,
      wo bij B" wordt getoond waar ingevuld. Resterend: interactieve e2e-verificatie (browser-sessie).

---

## Status per sessie

- [x] **Sessie 0** — Inventarisatie & fundament
- [x] **Sessie 1** — Onboarding & profielen
- [x] **Sessie 2** — Opdrachten CRUD + zoeken/filteren
- [x] **Sessie 3** — Reacties & kandidatenflow
- [x] **Sessie 4** — Documenten + credentials (ZZP)
- [x] **Sessie 5** — Verificatie (admin) + compliance afronden
- [x] **Sessie 6** — Berichten, notificaties, samenwerkingen
- [x] **Sessie 7** — Facturatie + billing
- [x] **Sessie 8** — Admin-paneel afronden
- [x] **Sessie 9** — Polish, performance, a11y, e2e
- [x] **Sessie 10** — Productie-voorbereiding (code-kant)

---

## Logboek

### QA-iteratie 6 — 2026-06-10 (geld + reminders + authz, gerichte diepte) — ZZP2-144

3 adversariële hunters op nog-niet-diep-gedekte assen. **2 HOOG-geldbugs gefixt** (zie GAPS.md iter-6):

- **Credit-van-betaald** (`ledger.ts`/`cascade/handlers.ts`): crediteren van een PAID/PROCESSED-factuur
  draaide de betaal-tegenboekingen niet terug → spookvordering/-schuld in de debiteuren-/crediteuren-
  overzichten. `planInvoiceCredited({ reversePayment })` + test verzwaard (DEBITEUREN/CREDITEUREN/
  ONTVANGEN/BETAALD = 0) + test voor crediteren-vóór-betaling.
- **PAST_DUE-ladder tweede episode** (`past-due.ts`): dedupeKey miste een cyclus-discriminator → een
  tweede mislukte betaling vuurde geen herinneringen/downgrade. Nu gediscrimineerd op `pastDueAt`. +regressietest.

Authz/tenant/state-as schoon (convergentie bevestigd). Tevens PROGRESS WORKSPACE-OVERHAUL-fasen
gereconciliëerd met de echte code-stand (dashboard drie zones + gegroepeerde nav waren al gebouwd).
Gate groen: typecheck ✓, lint ✓, test ✓, build ✓. E2e overgeslagen (geen browser-channel in de routine).

### Meedenk-laag — 2026-05-26

Cohesief, deterministisch "meedenk"-systeem dat rollen ontzorgt; alleen wat belangrijk is /
actie vraagt wordt getoond, complexiteit blijft server-side. Geen nieuwe infra. (De term "AI"
is bewust uit de hele UI, code-commentaren en docs gehouden.)

- **Nav-signalen** (`src/lib/signals.ts` + test): badges op nav-items vanaf elke pagina —
  certificaten (afgewezen/verloopt), kandidaten (nieuwe reacties), opdrachten (concepten),
  verificaties (wachtrij), berichten (ongelezen, 2 begrensde queries, geen N+1). Toon: attention
  (opvallend) vs info (rustig). Render in `sidebar-nav`/`mobile-nav` via `app-shell`.
- **Proactieve matching** (`src/lib/recommendations.ts` + test): "Opdrachten die bij je passen"
  op het ZZP-dashboard, hergebruikt `computeMatchScore`. Begrensde scan, drempel 70.
- **Compliance-ripple** (`src/lib/collaboration-alerts.ts` + test): ontbrekend/verlopen/bijna-
  verlopen vereist certificaat in een lopende samenwerking → gemeld bij opdrachtgever (dashboard +
  kaart) én ZZP'er (kaart met "Bijwerken"). Gedeelde `CREDENTIAL_TYPE_LABEL` naar `credentials.ts`.
- **Aansluiting vóór reageren** (`opdrachten/[id]`): match + per-eis certificaatstatus met
  "Toevoegen"-link voor wat ontbreekt/verlopen is.
- **Geschikte ZZP'ers** (`src/lib/suggestions.ts` + test): spiegelbeeld voor de opdrachtgever bij
  een gepubliceerde opdracht — openbare profielen die passen, met "Bericht sturen" (echt gesprek
  via `startConversationWithFreelancer`).
- **Match per opdracht in de lijst** (`opdrachten` browse): persoonlijke matchscore per kaart.
- **Verificatie-wachttijd** (`admin/verificaties`): dagen-in-wachtrij + amber na 5 dagen.
- **Status-uitleg** (`reacties`): per reactie wat de status betekent en de volgende stap.
- **Verlopen facturen**: dashboard-attentie + nav-badge voor ZZP'er (herinneren) en opdrachtgever
  (betalen) via `overdueInvoiceCount`.
- **Privéprofiel-waarschuwing** (dashboard): meldt dat opdrachtgevers je niet kunnen vinden.
- **Over de opdrachtgever** (`opdrachten/[id]`): bedrijfsinfo voor ZZP'ers.
- **Refactor**: één `scoreJobForFreelancer` in `matching.ts` i.p.v. 5× dezelfde mapping.
- **Railway-deploy**: `Dockerfile`, `railway.json`, `scripts/{use-db-provider,start}.mjs`
  (PostgreSQL in productie, schema-push + seed bij eerste start).
- e2e: `recommendations`, `collaboration-compliance`, `berichten-signal`, `job-fit`,
  `suggested-freelancers`, `browse-match`, `overdue-invoice`, `profile-visibility`, `company-info`
  (+ asserties in `applications`/`verification`). Checks groen: typecheck/lint, 163 unit-tests,
  build, e2e + shots.

### Sessie 0 — 2026-05-25

- Wat gedaan: fundament vanaf nul gescaffold (geen bestaande codebase aangetroffen).
  Next.js 15 (App Router) + React 19 + TS strict + Prisma (SQLite) + Auth.js v5
  (credentials + JWT, role-based) + Tailwind + Vitest. Login werkt, guard redirect
  werkt, 3 demo-accounts geseed. Volledig Prisma-schema voor alle kernmodellen.
- Bestanden (kern):
  - `prisma/schema.prisma` (alle modellen, portable: strings i.p.v. native enums, geen scalar-arrays)
  - `prisma/seed.ts` (3 demo-accounts + skills/branches/plannen, idempotent)
  - `src/lib/enums.ts` (alle enums + Zod + `CREDENTIAL_TRANSITIONS`)
  - `src/lib/credentials.ts` (+ test) — `assertTransition`, expiry-logica
  - `src/lib/authz.ts` (+ test) — auth/rol/ownership, `requireRole`, `assertOwnership`
  - `src/lib/matching.ts` (+ test) — matchscore + compliance-berekening
  - `src/lib/services/storage.ts` (+ test) — abstractie (local/S3-stub) + upload-validatie
  - `src/lib/audit.ts`, `src/lib/db.ts`, `src/lib/utils.ts`, `src/lib/nav.ts`
  - `src/auth.ts`, `src/auth.config.ts` (edge-safe), `src/middleware.ts`, `src/types/next-auth.d.ts`
  - `src/app/login/*`, `src/app/(protected)/layout.tsx` + `dashboard/page.tsx`, `src/app/page.tsx`
  - `src/components/app-shell.tsx`, `sidebar-nav.tsx`, `ui/button.tsx`
- Tests: 44 unit-tests groen (credentials 14, authz 12, matching 11, storage 7).
- Checks: typecheck ✓, lint ✓ (geen warnings), test ✓ (44/44), build ✓ (6 routes + middleware).
- Browser-doorklik (visueel) ✓: Playwright e2e-smoke (`e2e/smoke.spec.ts`, 7 tests) draait
  via **systeem-Edge** (`channel: "msedge"`) en maakt screenshots (`e2e/screenshots/`,
  gitignored) die visueel zijn gecontroleerd: login, freelancer/admin/client-dashboard
  (role-aware nav verschilt), foutstaat, uitloggen. Geen tekst-overflow, states renderen.
  Reden voor Edge: de Playwright-browser-CDN staat niet in de netwerk-allowlist van deze
  omgeving; `packages.microsoft.com` (Edge, chromium-gebaseerd) wél. Run: `npm run e2e`.
- Openstaand / volgende stap: Sessie 1 (Onboarding & profielen). Aandachtspunten:
  - `.env` is lokaal aangemaakt met echte `AUTH_SECRET` (niet in git).
  - Prisma toont een deprecation-warning over `package.json#prisma` (werkt op v6;
    migratie naar `prisma.config.ts` kan later).
  - E2e vereist een geïnstalleerde Edge/Chrome (system). In deze omgeving via apt-repo
    `packages.microsoft.com` → `microsoft-edge-stable`. Niet via Playwright's eigen CDN.

### Sessie 1 — 2026-05-26

- Wat gedaan: onboarding & profielen. Registratie met rolkeuze (FREELANCER/CLIENT)
  maakt account + leeg profiel/bedrijf aan en logt direct in. Freelancer- en
  bedrijfsprofiel bewerkbaar via beschermde routes (mutatieketen rol→ownership→Zod→
  actie→audit). Server-berekende profiel-compleetheid met indicator. Publiek ZZP-profiel
  (/zzp/[id]) dat zichtbaarheid server-side afdwingt (PRIVATE → 404, ook anoniem).
  Bedrijfslogo-upload via de storage-abstractie + auth-gated media-route.
- Bestanden:
  - `src/lib/validation.ts` (+ test) — register/freelancer/company Zod-schema's
  - `src/lib/profile.ts` (+ test) — compleetheid + zichtbaarheidsregel
  - `src/app/register/*` — registratie (server action + signin)
  - `src/app/(protected)/profiel/*` — freelancerprofiel bewerken + compleetheid
  - `src/app/(protected)/bedrijf/*` — bedrijfsprofiel bewerken + logo-upload
  - `src/app/zzp/[id]/page.tsx` — publiek profiel (zichtbaarheid afgedwongen)
  - `src/app/api/media/[...key]/route.ts` — auth-gated logo-serving via storage
  - `src/components/ui/*` — input, textarea, select, field, card, progress, badge
  - nav.ts: /profiel + /bedrijf op enabled; auth.config: /register + /zzp/\* publiek
- Tests: 58 unit-tests (incl. validation 8, profile 6) + 10 Playwright e2e groen
  (registratie, profiel publiceren, PUBLIC→PRIVATE 404, bedrijfsprofiel).
- Checks: typecheck ✓, lint ✓, test ✓ (58), build ✓ (10 routes), e2e ✓ (10, via Edge).
- Visueel gecontroleerd (screenshots 06-09): register, profiel + compleetheid,
  publiek profiel, bedrijfsprofiel. Geen overflow; states correct.
- Bekende minor: controlled <select> toont kort de oude waarde in de sub-seconde ná
  een server-action save (RSC-refresh), zelfherstellend bij navigatie; data is correct
  (DB + reload-assertie bevestigd). Nette toast/refresh-afhandeling: Sessie 9 (polish).
- Volgende stap: Sessie 2 — Opdrachten CRUD + zoeken/filteren.

### Sessie 2 — 2026-05-26

- Wat gedaan: opdrachten CRUD + zoeken/filteren. CLIENT maakt/bewerkt opdrachten
  (concept → publiceren → sluiten/heropenen → depubliceren) met server-side afgedwongen
  statusovergangen (`JOB_TRANSITIONS`/`assertJobTransition`) + ownership + audit. Vereiste/
  gewenste skills en certificaat-eisen koppelbaar. ZZP-overzicht met debounced zoeken,
  filters (branche, skills, tarief, werkmodus, vereist certificaat), sorteren, paginatie —
  alleen PUBLISHED. Detailpagina role-aware (eigenaar: statusacties + bewerken; ZZP'er:
  read-only + "Reageren (binnenkort)"). Niet-gepubliceerde opdrachten server-side verborgen.
- Bestanden:
  - `src/lib/jobs.ts` (+ test) — JOB_TRANSITIONS, canPublish, normalizeJobFilters
  - `src/lib/validation.ts` — jobSchema (+ tests)
  - `src/app/(protected)/opdrachten/{page,actions,job-form}.tsx`,
    `nieuw/`, `[id]/page.tsx`, `[id]/bewerken/page.tsx`
  - `src/components/jobs/{job-filters,job-status-badge}.tsx`, `ui/check-chip.tsx`
  - nav.ts: Opdrachten / Mijn opdrachten op enabled
- Tests: 71 unit-tests (jobs 9, job-validatie 4 extra) + 11 e2e groen (incl. aanmaken,
  publiceren, zoeken, detail, depubliceren → 404 voor anderen).
- Checks: typecheck ✓, lint ✓, test ✓ (71), build ✓ (15 routes), e2e ✓ (11, via Edge).
- Visueel gecontroleerd (screenshots 10-13): client-overzicht, detail (concept/gepubliceerd),
  browse met filters, ZZP-detail met vereiste skills/certificaten.
- Let op (SQLite-beperking): vrije-tekst-zoek is hoofdlettergevoelig (`contains` zonder
  `mode:insensitive`, niet ondersteund op SQLite). Op Postgres (prod) insensitive maken.
- Volgende stap: Sessie 3 — Reacties & kandidatenflow (matchscore + compliance-snapshot,
  gebruik `src/lib/matching.ts`; feature-gating per plan).

### Sessie 3 — 2026-05-26

- Wat gedaan: reacties & kandidatenflow. FREELANCER reageert op een PUBLISHED opdracht
  (motivatie/tariefvoorstel/beschikbaarheid); server berekent matchscore + compliance-
  snapshot via `matching.ts` en slaat ze op. Eén reactie per opdracht. Plan-gating
  (max reacties, FREE-plan) server-side afgedwongen. CLIENT-kandidatenoverzicht met
  statusbeheer (NEW/VIEWED/SHORTLIST/REJECTED/ACCEPTED via expliciete overgangsmap),
  interne notities en compliance/match per kandidaat. FREELANCER "Mijn reacties".
- Bestanden:
  - `src/lib/applications.ts` (+ test) — APPLICATION_TRANSITIONS, canApply (gating)
  - `src/lib/validation.ts` — applicationSchema (+ test)
  - opdrachten/actions.ts: `createApplication` (match+compliance+gating)
  - `opdrachten/[id]/application-form.tsx` + detailpagina-integratie (reageren/gereageerd)
  - `reacties/page.tsx` (FREELANCER), `kandidaten/{page,actions}.tsx` (CLIENT)
  - `components/{compliance-badge,applications/application-status-badge}.tsx`
  - nav.ts: Mijn reacties + Kandidaten op enabled
- Tests: 78 unit-tests (applications 5, applicatie-validatie 2 extra) + 12 e2e groen
  (reageren → matchscore, dubbel reageren geblokkeerd, kandidaat shortlisten + notitie).
- Checks: typecheck ✓, lint ✓, test ✓ (78), build ✓ (17 routes), e2e ✓ (12, via Edge).
- Visueel gecontroleerd (screenshots 14-16): reactieformulier, mijn reacties, kandidaten.
- Mijlpaal: na Sessie 5 is de volledige kerndifferentiatie (opdracht → reactie →
  verificatie → compliance) demo-klaar. Nu staat opdracht → reactie → match/compliance.
- Volgende stap: Sessie 4 — Documenten + credentials (ZZP-kant): upload-UI op de
  storage-abstractie, credentials uploaden/metadata/verificatie aanvragen/zichtbaarheid.

### Sessie 4 — 2026-05-26

- Wat gedaan: documenten + credentials (ZZP-kant). FREELANCER uploadt certificaten
  (type/titel/uitgever/datums + bewijsstuk via storage-abstractie), bewerkt metadata,
  vraagt verificatie aan (DRAFT/REJECTED/EXPIRED → SUBMITTED via assertTransition), vervangt
  bewijsstuk (reeds beoordeeld → terug naar SUBMITTED), beheert zichtbaarheid (PUBLIC/PRIVATE),
  ziet verificatiehistorie + afwijzingsreden + expiry-indicator. Aparte documenten-pagina
  (upload + privé download). Document-download via ownership-gated route (eigenaar/admin).
  Geverifieerde + openbare credentials verschijnen op het publieke profiel.
- Bestanden:
  - `src/lib/documents.ts` (+ test) — canAccessDocument, documentKindForCredential
  - `src/lib/validation.ts` — credentialSchema, documentSchema (+ tests)
  - `src/app/api/documents/[id]/route.ts` — privé download (ownership, nosniff)
  - `certificaten/{page,actions,credential-form}.tsx`, `nieuw/`, `[id]/bewerken/`
  - `documenten/{page,actions,document-form}.tsx`
  - `components/credentials/credential-status-badge.tsx`; zzp/[id] toont verified certs
  - nav.ts: Documenten + Certificaten op enabled
- Reviewzwerm (3 parallelle agents) + fix-loop:
  - FIX: plan-gating telde ook niet-actieve abonnementen → alleen status ACTIVE telt.
  - FIX: credential-opslag nu atomair ($transaction / nested create); latente bug verholpen
    (document vervangen terwijl status SUBMITTED gooide assertTransition).
  - FIX a11y: zichtbare focus-ring op CheckChip + rol-radio's; CheckChip ontdubbeld.
  - FIX: kandidaten-actions gebruiken de echte Actor; nosniff-headers; logo shrink-0;
    consistente term "certificaat" i.p.v. "credential" in UI.
  - Verificatie-agent: alle fixes correct, geen regressies.
- Tests: 84 unit-tests (documents 3, credential-validatie 3 extra) + 14 e2e groen
  (credential uploaden → verificatie aanvragen, privé-download 200 eigenaar / 403 ander,
  document uploaden/downloaden).
- Checks: typecheck ✓, lint ✓, test ✓ (84), build ✓ (19 routes), e2e ✓ (14, via Edge).
- Visueel gecontroleerd (screenshots 17-19): certificaten (concept + in beoordeling), documenten.
- Volgende stap: Sessie 5 — Admin-verificatiequeue (goedkeuren/afwijzen met verplichte reden,
  expiry-job VERIFIED→EXPIRED). Hierna is de kerndifferentiatie demo-klaar.

### Sessie 5 — 2026-05-26 (MIJLPAAL: kerndifferentiatie demo-klaar)

- Wat gedaan: admin-verificatiequeue + expiry. ADMIN beoordeelt ingediende certificaten
  op `/admin/verificaties`: goedkeuren (→VERIFIED, verifiedAt, CredentialVerification-record,
  VerificationRequest→RESOLVED) en afwijzen (→REJECTED, **reden verplicht** server-side,
  herstelactie voor ZZP'er) via `statusForDecision`. In-app notificatie + audit per beslissing.
  Idempotente expiry-actie zet verlopen VERIFIED → EXPIRED via `expiryTransition`.
  ZZP'er ziet de uitkomst op /certificaten; geverifieerde+openbare certs op publiek profiel;
  compliance (matching.ts) reflecteert VERIFIED+niet-verlopen. Hele keten werkt end-to-end:
  opdracht → reactie → verificatie → compliance.
- Bestanden:
  - `src/app/(protected)/admin/verificaties/{page,actions,expiry-button}.tsx`
  - `src/app/icon.svg` (favicon; loste /favicon.ico 404 op — Next dev "1 Issue")
  - nav.ts: admin Verificaties enabled; auth.config: route-gate /admin → ADMIN
  - audit.ts: `auditData()` zodat audit atomair in een $transaction kan
- Reviewzwerm (2 agents) + fix-loop:
  - FIX (security, defense-in-depth): route-gate `/admin/*` → alleen ADMIN (pagina + actions
    checkten al; nu ook routelaag) + e2e die non-admin-toegang weert.
  - FIX (CLAUDE.md regel 5): audit-regel nu binnen de $transaction van elke beslissing/expiry.
  - FIX (visueel gevonden): geverifieerd certificaat toonde nog "Verificatie aanvragen"
    (VERIFIED→SUBMITTED bestaat in de map voor doc-vervangen, niet als losse actie) →
    knop + server-actie beperkt tot DRAFT/REJECTED/EXPIRED.
- Tests: 84 unit-tests + 17 e2e groen (goedkeuren/afwijzen + reden, expiry→EXPIRED,
  route-gate non-admin, privé-download eigenaar/ander). Console schoon (geen 404/errors).
- Checks: typecheck ✓, lint ✓, test ✓ (84), build ✓ (18 routes), e2e ✓ (17, via Edge).
- Visueel gecontroleerd (screenshots 20-21): admin-queue, ZZP-uitkomst (verified/afgewezen).
- Volgende stap: Sessie 6 — Berichten, notificaties, samenwerkingen.

### Sessie 6 — 2026-05-26

- Wat gedaan: berichten, notificaties, samenwerkingen.
  - **Berichten:** 1-op-1 gesprek (Conversation + ConversationParticipant) tussen CLIENT en
    ZZP'er, gestart vanuit een reactie (`startConversationForApplication`). Thread + composer;
    toegang server-side op deelnemerschap (`isParticipant`); ongelezen-telling (`unreadCount`).
  - **Notificaties:** centrum (`/notificaties`) + ongelezen-bel met badge in de AppShell;
    markeer-als-gelezen (per item + alles). Notificaties bij nieuw bericht, reactie
    geaccepteerd/afgewezen, samenwerking voorgesteld/bijgewerkt — alle ownership-scoped.
  - **Samenwerkingen:** Collaboration met expliciete statusflow (`COLLABORATION_TRANSITIONS`:
    PROPOSED→ACTIVE/CANCELLED, ACTIVE→COMPLETED/CANCELLED), voorgesteld door CLIENT vanuit een
    ACCEPTED reactie, bevestigd/afgerond/geannuleerd door een van beide partijen; audit + notify.
- Bestanden:
  - `src/lib/{messaging,collaborations}.ts` (+ tests), validation.ts (message/collab schemas)
  - `berichten/{page,actions,[id]/page,[id]/message-composer,[id]/mark-read}.tsx`
  - `notificaties/{page,actions}.tsx`; `app-shell.tsx` (bel + telling)
  - `samenwerkingen/{page,actions}.tsx`; `kandidaten/propose-collaboration.tsx`
  - kandidaten: "Bericht sturen" + voorstel/link + notify bij accept/reject (in $transaction)
  - nav.ts + sidebar-nav.tsx: Berichten + Samenwerkingen enabled (nieuw "handshake"-icoon)
- Tests: 91 unit-tests (messaging 5, collaborations 2) + 18 e2e groen (volledige journey:
  reageren → bericht heen/weer → accepteren → samenwerking voorstellen/activeren → notificaties).
- Reviewzwerm (2 agents): security CLEAN (geen IDOR; conversatie/notificatie/samenwerking
  allemaal ownership-/deelnemer-gescoped), correctheid geen bugs. Genoteerd voor later:
  berichtenlijst haalt nu alle messages op (perf → Sessie 9); geen unieke index op
  (conversatie-paar) → theoretische dubbel-aanmaak-race (laag risico).
- Checks: typecheck ✓, lint ✓, test ✓ (91), build ✓ (21 routes), e2e ✓ (18, via Edge).
- Visueel gecontroleerd (screenshots 22-24): berichtenthread, samenwerkingen, notificatiecentrum + bel-badge.
- Volgende stap: Sessie 7 — Facturatie + billing.

### Sessie 7 — 2026-05-26

- Wat gedaan: facturatie + billing.
  - **Facturen (FREELANCER):** opstellen vanuit een ACTIVE/COMPLETED samenwerking (dynamische
    regels: omschrijving/aantal/tarief). Bedragen server-berekend in centen (euro's→centen,
    regel- en totaalbedrag). Concept → versturen (issuedAt + standaard 14 dagen vervaldatum),
    annuleren. Oplopend jaargebonden factuurnummer (uniek). Statusflow via `INVOICE_TRANSITIONS`.
  - **Facturen (CLIENT):** ontvangen facturen, als betaald markeren; OVERDUE server-afgeleid
    (SENT + vervaldatum gepasseerd). Print-vriendelijke detailweergave met regels + totaal.
  - **Abonnement:** plan-overzicht (FREE/PRO/BUSINESS) + huidig plan; (mock) wisselen zonder
    echte betaling. Gating-melding in reageren verwijst naar upgrade.
- Bestanden:
  - `src/lib/invoices.ts` (+ tests: transities, bedragen, isOverdue, nummer, euro's→centen)
  - validation.ts (invoiceLineSchema); `components/invoices/invoice-status-badge.tsx`
  - `facturen/{page,actions,invoice-form,nieuw/page,[id]/page}.tsx`
  - `abonnement/{page,actions}.tsx`; nav + sidebar: Facturen + Abonnement enabled (creditCard-icoon)
  - samenwerkingen: "Factuur opstellen" voor freelancer; gating-melding → upgrade
- Tests: 97 unit-tests (invoices 13) + 20 e2e groen (factuur opstellen→versturen→betaald,
  abonnement upgraden). Reviewzwerm (2 agents): security CLEAN (ownership op alle factuur-
  acties, bedragen server-berekend, abonnement alleen eigen userId). Gefixt: factuurnummer-race
  (P2002-retry i.p.v. crash) + dueAt einde-van-de-dag (niet een dag te vroeg "verlopen").
- Checks: typecheck ✓, lint ✓, test ✓ (97), build ✓ (24 routes), e2e ✓ (20, via Edge).
- Visueel gecontroleerd (screenshots 25-27): factuur opstellen, betaalde factuur, abonnement.
- Volgende stap: Sessie 8 — Admin-paneel afronden (gebruikers, opdrachten, audit log).

### Sessie 8 — 2026-05-26

- Wat gedaan: admin-paneel afgerond.
  - **Gebruikers (`/admin/gebruikers`):** zoeken/filteren (naam/e-mail, rol, status); schorsen/
    activeren via `setUserStatus` met server-side self-guard (`canModerateUser`) + Zod-status +
    notificatie + audit (in $transaction). Rol wordt nooit gewijzigd.
  - **Opdrachten (`/admin/opdrachten`):** alle opdrachten overzien/filteren; `adminCloseJob`
    sluit via de bestaande `assertJobTransition` + audit.
  - **Audit log (`/admin/audit`):** doorzoekbaar (actie/entiteit) + paginatie, read-only, met
    actor-naam en metadata.
- Bestanden:
  - `src/lib/admin.ts` (+ tests: self-guard, suspension-toggle, audit-filters)
  - `admin/{gebruikers,opdrachten,audit}/{page,actions}.tsx`; nav: admin-items enabled
- Tests: 101 unit-tests (admin 6) + 21 e2e groen (admin schorst gebruiker + self-guard,
  sluit opdracht, ziet auditregel). Reviewzwerm: CLEAN — elke admin-actie checkt requireRole,
  self-guard server-side, geen rol-escalatie, filters parameterized, paginatie correct.
- Bekend (productie-securityreview): JWT-strategie betekent dat een net-geschorste gebruiker
  toegang houdt tot de JWT ververst; voor directe lockout zou `currentActor` de status uit de
  DB moeten herlezen. Bewuste trade-off uit Sessie 0.
- Checks: typecheck ✓, lint ✓, test ✓ (101), build ✓ (27 routes), e2e ✓ (21, via Edge).
- Visueel gecontroleerd (screenshots 28-29): gebruikersbeheer, audit log.
- Volgende stap: Sessie 9 — Polish, performance, a11y, e2e.

### Sessie 9 — 2026-05-26

- Wat gedaan: polish, performance, a11y — geen nieuwe features.
  - **Mobiele navigatie (echte gap, gevonden via mobiele browserverificatie):** sidebar was
    `hidden md:flex` zonder mobiel alternatief → géén navigatie op telefoon. Toegevoegd:
    toegankelijke drawer (`role="dialog"` aria-modal, Escape/overlay sluiten, auto-sluiten bij
    routewissel) via `components/mobile-nav.tsx`.
  - **Berichtenlijst perf:** niet meer álle messages laden; laatste bericht via `take:1` +
    ongelezen via goedkope per-conversatie COUNT.
  - **Dashboard:** verouderde Sessie-0-placeholder weg; nu live, ownership-gescopte stats per
    rol (klikbaar) — sluit aan op "dashboard-first" designregel.
  - Console-smoke over álle routes × 3 rollen: 0 errors/404's. `lang="nl"` aanwezig.
- Verifieer→fix-loop (les toegepast): een toegevoegde `(protected)/loading.tsx` bleek
  `notFound()` app-breed naar HTTP 200 te duwen (Suspense-streaming sluit de header te vroeg).
  Gevangen door de jobs-e2e (depubliceren → 404). Bewust teruggedraaid: correcte 404-semantiek
  weegt zwaarder dan een skeleton.
- Tests: 101 unit-tests + 21 e2e groen (incl. mobiel menu in tijdelijke check geverifieerd).
  Reviewzwerm: CLEAN (geen authz-regressie, counts correct, drawer-a11y in orde).
- Checks: typecheck ✓, lint ✓, test ✓ (101), build ✓ (27 routes), e2e ✓ (21, via Edge).
- Visueel gecontroleerd: mobiel menu (screenshot 30), eerdere schermen ongewijzigd.
- Volgende stap: Sessie 10 — Productie-voorbereiding (code-kant).

### Sessie 10 — 2026-05-26 (laatste codesessie)

- Wat gedaan: productie-voorbereiding (code-kant).
  - **S3-storage-driver** achter de bestaande `StorageDriver`-interface (`@aws-sdk/client-s3`,
    lazy import, env-geschakeld via `STORAGE_DRIVER=s3`; lokaal blijft default). Werkt met AWS S3
    én S3-compatible (endpoint/path-style). Credentials via de AWS-provider-chain.
  - **Env-validatie** (`src/lib/env.ts`, Zod) die bij server-boot draait via
    `src/instrumentation.ts` — faalt helder bij ontbrekende/zwakke config (+ unit-tests).
  - **Security headers** (`next.config.mjs`): CSP (strenger in prod, dev-allowances voor HMR),
    nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy, HSTS.
  - **Robuustheid**: `/api/health` (publiek, DB-ping, geen datalek), nette `not-found.tsx` +
    `error.tsx`. `.env.example` uitgebreid met Postgres-switch + S3-vars.
- Tests: 104 unit-tests (env 3) + 21 e2e groen; health + headers geverifieerd (tijdelijke check).
  Reviewzwerm: CLEAN — S3-driver correct, health veilig publiek, CSP breekt prod niet, alleen
  /api/health toegevoegd aan publieke routes. Advies (bewuste trade-offs): CSP `script-src
'unsafe-inline'` en JWT-staleness bij rol/status-wijziging → voor de menselijke securityreview.
- Checks: typecheck ✓, lint ✓, test ✓ (104), build ✓ (28 routes), e2e ✓ (21, via Edge).

---

## PROJECT COMPLEET (code-kant) — handover

Alle 10 sessies af. De volledige keten werkt end-to-end en is getest:
onboarding → profielen → opdrachten → reacties (match + compliance) → documenten/certificaten →
admin-verificatie → berichten/notificaties/samenwerkingen → facturatie/abonnement → admin-paneel,
met polish + productie-voorbereiding. **104 unit-tests + 21 Playwright-e2e groen**;
typecheck/lint/build groen; console schoon; mobiel + desktop geverifieerd.

### Nog te doen door een mens (NIET door een agent — bewust, zie CLAUDE.md):

1. **Productie-infra**: PostgreSQL provisionen (en `prisma/schema.prisma` datasource provider
   op `postgresql` zetten + migratie draaien), S3-bucket + IAM, mailprovider, domein/HTTPS,
   secrets (`AUTH_SECRET`, DB, AWS) via de hosting-secretstore, backups.
2. **Accounts & betaling**: echte betaalprovider koppelen (Stripe/Mollie) i.p.v. de mock-
   abonnementsflow; betaalmethoden/facturatie-juridisch.
3. **Security-/AVG-review vóór livegang met echte gevoelige documenten** (VOG/diploma's).
   Aandachtspunten uit de reviews: CSP `script-src 'unsafe-inline'` (overweeg nonce-pipeline),
   JWT-staleness bij schorsing/rol-wijziging (overweeg DB-statuscheck in `currentActor` of korte
   token-TTL), rate-limiting op auth/mutaties, pen-test.
4. **E-mail/notificaties**: in-app `Notification` bestaat; echte e-mail/push koppelen.

### Bekende, bewust uitgestelde code-punten (kandidaten voor later):

- Berichten-ongelezen telt per conversatie met een COUNT (prima voor nu; denormaliseren bij schaal).
- SQLite-zoek is hoofdlettergevoelig; op Postgres `mode: "insensitive"` aanzetten.
- Geen unieke index op (jobId, deelnemerspaar) voor conversaties (theoretische dubbel-race).

### Hardening — 2026-05-26 (geleerd van een parallelle Codex-bouw, selectief overgenomen)

- Aanleiding: vergelijking met een andere aanpak (Codex, branch `zzp-production-quality-control-system`).
  Niet klakkeloos overgenomen — alleen wat echt waarde toevoegt en binnen scope past.
- Toegepast (in-scope productie-hardening):
  - **CI/CD ontbrak volledig** → toegevoegd: `.github/workflows/ci.yml` (npm run check: lint +
    typecheck + test + build op elke push/PR) en `security.yml` (npm audit high/critical +
    secret-scan + env-doc-check, ook wekelijks).
  - **`npm run check`** als één commando (lint+typecheck+test+build).
  - **Security-scripts**: `scripts/scan-secrets.sh` (hoog-signaal secret-patronen + geen getrackte
    .env) en `scripts/check-env-docs.mjs` (elke gebruikte `process.env.X` staat in .env.example).
- Bewust NIET overgenomen (scope-creep / andere productrichting):
  - Governance-laag + Wet-DBA-risico-engine: krachtig domein-idee, maar nieuwe scope. **Aanbeveling
    aan eigenaar**: voor zzp-zorg is Wet-DBA-compliance (schijnzelfstandigheid: inbedding, directe
    aansturing, vervangbaarheid, terugkerende patronen) dé differentiator — overweeg dit als
    expliciete volgende epic, deterministic-first (regels beslissen en leggen uit).
  - k6 load/stress + Sentry: zinvol, maar vragen infra/keuze van de eigenaar; genoteerd.
- Sterkten van deze build t.o.v. de vergeleken aanpak (ter info): echte auth (Auth.js + RBAC) en
  persistente DB + audit (Prisma) zijn hier wél gebouwd; docs (PROGRESS/CURRENT_TASK) lopen niet
  achter op de code. Checks: `npm run check` groen (104 unit + build); scan:secrets + check:env OK.

### Design-systeem + ReOS-leerpunten — 2026-05-26 (eigenaar-richting)

- Aanleiding: eigenaar vindt het light Linear-thema mooier en wil het in **tokens** vastgelegd;
  leer ook van de eerdere ReOS-werkplek-UX.
- `design.md` toegevoegd: token-tabel (uit globals.css), statuskleur-mapping, component-contracten,
  layout/a11y/responsive, copy-stijl, **design-acceptatiecriteria**, en een **ReOS-leerpunten**-sectie
  (werkbank-gevoel, dag-context, metric-strip, "Vraagt aandacht", dichte items, split login) vertaald
  naar het light thema — niet de donkere ReOS-look gekopieerd.
- Dashboard herbouwd als werkbank: dag-context-header ("{Rol}-werkplek · datum" + groet + operationele
  samenvatting), klikbare metric-strip, en een **"Vraagt aandacht"-paneel** met echte, deterministische
  uitzonderingen per rol (profiel-compleetheid, afgewezen/verlopen certificaten, nieuwe reacties,
  concept-opdrachten, openstaande verificaties) — reden + volgende actie, geen verzonnen meldingen,
  rustige lege staat. Desktop + mobiel geverifieerd (screenshots 31-32).
- Checks: typecheck ✓, lint ✓, build ✓, e2e ✓ (21). Smoke-admin assert aangepast op de nieuwe header.

### Wet DBA — deterministische compliance — 2026-05-26 (eigenaar-richting: "conform geldende wetgeving")

- Wat gedaan: deterministische schijnzelfstandigheid-check op opdrachten. Regels beslissen en
  leggen uit; **geen black box, geen dode knoppen**. `src/lib/dba.ts` (gewogen indicatoren: gezag/inbedding =
  kern, vrije vervanging/vaste uren = medium, exclusiviteit/duur = licht) → LAAG/MIDDEN/HOOG met
  uitleg per indicator + handelingsadvies. Volledig unit-getest.
- Opdrachtformulier: DBA-sectie met **live preview** (zelfde pure functie client-side, single source).
  Server **herberekent gezaghebbend** bij opslaan en bewaart snapshot (`dbaRisk` + `dbaReasons` JSON +
  de booleans) — client-waarde wordt nooit vertrouwd. Detailpagina toont risico + uitleg + advies
  **alleen aan eigenaar/admin** (niet aan kandidaten). Disclaimer: hulpmiddel, geen juridisch advies.
- Schema: Job uitgebreid met dba\*-velden (db push). validation: jobSchema uitgebreid.
- Tests: 111 unit-tests (dba 7) + 22 e2e groen (hoog-risico live + op detail). Reviewzwerm: CLEAN
  (server-gezaghebbend, geen lek naar non-owners, drempels kloppen, JSON-guard).
- Checks: typecheck ✓, lint ✓, build ✓, e2e ✓ (22). Desktop + mobiel-patroon ongewijzigd.
- Aanbeveling vervolg (eigenaar): AVG/privacy-evidence (verwerkingsregister, bewaartermijnen,
  DPIA-light) en modelovereenkomst-koppeling bij HOOG; beide deels mensenwerk.

### ReOS-corpus leerpunten toegepast — 2026-05-26

- Aanleiding: volledige ReOS-planningscorpus gelezen (visie/roadmap/doelgroep/concurrentie,
  RLS-plan, privacy-matrix, DBA-case-log, incident/change templates). Selectief toegepast:
- **DBA-model completer + golden cases:** hun DBA-reviewlog (DBA-001 pass / -002 review / -003
  blocked / -004 zwak ondernemerschap=review) legde een gat bloot — ik miste een ondernemerschap-
  signaal. Toegevoegd: `weakEntrepreneurship` (gewicht 2) in `src/lib/dba.ts`, Job-veld
  `dbaWeakEntrepreneurship`, formulier-checkbox + live preview, en **4 golden-case tests** als
  regressie-anker (LAAG/MIDDEN/HOOG).
- **Negatieve autorisatietests (RLS-intent op app-laag):** `e2e/authorization.spec.ts` — opdrachtgever
  B kan opdracht/concept + bewerk-pagina van A niet zien (404, server-side ownership). Vult de
  bestaande document-403- en /admin-route-gate-tests aan.
- Tests: 113 unit + 23 e2e groen; typecheck/lint/build groen.
- Aanbevelingen genoteerd (eigenaar-keuze, niet zelf verzonnen): AVG-gebruikersrechten +
  verwerkingsregister/bewaartermijnen (privacy-matrix), RLS-first als defense-in-depth op Postgres-
  prod, multi-member-organisaties + subrollen, beschikbaarheid als workflow-stap, audit van
  login/securityevents + IP/UA.

### Increment: AVG-gegevensrechten + audit-hardening — 2026-05-26

- **Inzage/portabiliteit:** `/account` + `/api/account/export` — JSON-export van uitsluitend de
  eigen persoonsgegevens (profiel, credential-metadata, bedrijf, reacties, document-metadata,
  notificaties, eigen berichten); geen documentinhoud, geen data van derden, auth vereist.
- **Recht op verwijdering:** verwijderverzoek (`deletionRequestedAt`) + intrekken; account blijft
  actief tot beheer afhandelt (fiscale bewaarplicht), notificatie naar admins + audit.
- **Audithardening:** login/uitlog/mislukte-login geaudit via Auth.js (USER_LOGIN/LOGOUT/
  LOGIN_FAILED) + **IP/user-agent** (`request-meta.ts`, AuditLog uitgebreid). Account-link in de
  shell-footer.
- Tests: e2e (export 200+JSON, verwijderverzoek/intrekken, admin ziet USER_LOGIN). 25 e2e + units groen.
- Reviewzwerm: CLEAN (geen cross-user-PII-lek, geen hard-delete van fiscale data, geen
  login-enumeratie in de response, bcrypt-short-circuit correct). Checks groen.

### Increment: Beschikbaarheid als workflow-stap — 2026-05-26

- `AvailabilityWindow`-model (periodes met type AVAILABLE/LIMITED/UNAVAILABLE + uren + notitie).
  `/beschikbaarheid` (FREELANCER): periodes toevoegen/verwijderen (ownership + audit).
- `src/lib/availability.ts` (getest): upcomingWindows, currentOrNextAvailable (negeert
  UNAVAILABLE), summarizeAvailability. Samenvatting getoond op het publieke profiel
  (zichtbaarheid-gated) en bij kandidaten (alleen eigen-opdracht-sollicitanten).
- Nav: "Beschikbaarheid" (FREELANCER, calendar-icoon). Tests: 7 unit + e2e (toevoegen/zien/
  verwijderen). 26 e2e + units groen. Reviewzwerm: CLEAN (geen IDOR op delete, geen datalek).

### STATUS: productiewaardig MVP (code-kant) bereikt — 2026-05-26

Na de eigenaar-richtingen (design-tokens, ReOS-werkbank, Wet DBA, AVG, beschikbaarheid) is dit
een productiewaardige MVP voor de NL ZZP-marktplaats: echte auth + RBAC, persistente DB + audit
(incl. login/IP/UA), opdrachten→reacties (match+compliance), documenten/certificaten + admin-
verificatie, berichten/notificaties/samenwerkingen, facturatie/abonnement, admin-paneel,
**Wet DBA-check** (deterministisch + golden cases), **AVG-gegevensrechten**, **beschikbaarheid**,
CI/security-scripts, design-systeem (tokens), mobiel + desktop. ~130 unit-tests + 26 e2e groen;
elke increment ge-reviewd (CLEAN); geen slop, geen dode knoppen.

Bewust NIET in deze MVP (post-MVP epic, eigen sessie): **multi-member-organisaties + subrollen**
(owner/manager/recruiter/viewer). Dit raakt elke ownership-check (Company 1:1 user → org+members)
en is in de referentiedocs zelf nog een open MVP-vraag — een grote, risicovolle refactor die niet
aan het eind van een lange sessie thuishoort. Overige open punten: RLS-first op Postgres-prod,
echte betaalprovider, e-mail, formele security-/AVG-review (mensenwerk).

### Increment: DUO-diplomaverificatie (API-koppeling achter service-grens) — 2026-05-26

- Eerlijke aanpak: er is geen open DUO-lookup-API; de echte route is de **verificatiecode** uit het
  DUO-diplomaregister. Geïmplementeerd achter een schone interface (zoals de S3-driver):
  - `src/lib/services/diploma-verifier.ts` (getest): `DiplomaVerifier` + **MockDiplomaVerifier**
    (deterministisch, valideert alleen het codeformaat, verzint géén diplomagegevens) +
    **DuoDiplomaVerifier** (env-geschakeld `DIPLOMA_VERIFIER=duo`; faalt helder zonder config —
    echte onboarding = mensenwerk). Factory `getDiplomaVerifier()`.
  - Actie `verifyCredentialViaDuo` (FREELANCER, eigen DIPLOMA): bij geldige code wordt de credential
    **systeem-geverifieerd** (bron DUO) via de transitiemap (→ SUBMITTED → VERIFIED), met
    `CredentialVerification{verifierId:null, source:"DUO"}` + audit (IP/UA). Bron MOCK staat
    transparant in de auditregel.
  - UI: DUO-verificatieformulier op niet-geverifieerde diploma's; historie toont "via DUO".
  - Schema: `CredentialVerification.verifierId` nullable + `source` (ADMIN|DUO), SetNull.
- Tests: 5 unit (verifier) + e2e (ongeldige code faalt, geldige code → Geverifieerd). 27 e2e + units groen.
- Reviewzwerm: CLEAN (geen IDOR, transitiemap gerespecteerd, schema niet-breekend, geen fake-data).
- Productie-onboarding (DUO-contract/endpoint/cert) = mensenwerk; idem BIG-register voor zorg (apart).

### Increment: BIG-registerverificatie (zorg-beroepsregistratie) — 2026-05-26

- Zelfde service-grens-patroon als DUO. `src/lib/services/big-verifier.ts` (getest):
  `BigVerifier` + **MockBigVerifier** (valideert alleen het 11-cijferige BIG-nummerformaat,
  verzint geen registratiegegevens) + **BigRegisterVerifier** (env `BIG_VERIFIER=bigregister`;
  faalt helder zonder config — onboarding/webservice = mensenwerk). Factory `getBigVerifier()`.
- Gedeelde helper `applyExternalVerification(source: DUO|BIG)` in certificaten/actions.ts (DRY):
  asserts beide transitiehops (→SUBMITTED→VERIFIED) vóór de transactie; DUO-actie gerefactord,
  `verifyCredentialViaBig` toegevoegd (geldt voor type **Licentie**). `CredentialVerification.source`
  krijgt nu ook "BIG" (String, geen migratie). UI: BIG-formulier op niet-geverifieerde licenties;
  historie toont "via BIG-register".
- Tests: 5 unit (BIG) + e2e (ongeldig nummer faalt, geldig → Geverifieerd). 28 e2e + units groen.
- Reviewzwerm: CLEAN (geen IDOR, DUO-refactor gedragsbehoudend, transitiemap intact, geen fake-data).
- Productie-onboarding BIG-register = mensenwerk (zelfde als DUO).

### Increment: Identiteitsverificatie + zichtbaar vertrouwensniveau — 2026-05-26

- Slimme differentiator: concurrenten verifiëren losse documenten; wij binden **identiteit +
  geverifieerde certificaten** tot één uitlegbaar **trust-signaal** dat opdrachtgevers zien.
- `src/lib/services/identity-verifier.ts` (getest): `IdentityVerifier` + **MockIdentityVerifier**
  (naam-match met account, verzint niets) + **IdinIdentityVerifier** (env `IDENTITY_VERIFIER=idin`;
  faalt helder zonder config — iDIN/eIDAS-onboarding = mensenwerk).
- `src/lib/trust.ts` (getest): `computeTrustLevel` → BASIS/DEELS/VOLLEDIG + reden/ontbrekend.
- `/account`: identiteit verifiëren (eigen account, naam-match) → `identityVerifiedAt` +
  `verifiedLegalName` opgeslagen + audit (IP/UA). Trust-badge op **publiek profiel** en
  **kandidaten** (alleen het niveau, niet de juridische naam). Dashboard-nudge bij geen identiteit.
- Schema: User.identityVerifiedAt + verifiedLegalName.
- Tests: 8 unit (trust+identity) + e2e (mismatch faalt, match slaagt, trust-badge op profiel).
  29 e2e + units groen. Reviewzwerm: één MEDIUM gefixt — kandidaten telde verlopen-maar-VERIFIED
  credentials mee voor trust (inflatie); nu non-expired gefilterd, gelijk aan het publieke profiel.
- E2e-hardening: lokaal `retries: 1` + ruimere timeouts op bericht-bubbels (de zware multi-context
  tests flaken soms op één gedeelde dev-server; een echte bug faalt ook na retry).
- Echte iDIN/eIDAS-koppeling = mensenwerk (zelfde patroon als DUO/BIG).

### Increment: Design-polish-pass — lege/laad/fout-staten + micro-interacties — 2026-05-29

- Orchestrator (Opus) + 3 Sonnet-builders op niet-overlappende paginagroepen (lijst-/admin-/berichten-vlakken).
- **Gedeelde `EmptyState`** (`src/components/ui/empty-state.tsx`): icoon-in-zachte-cirkel + titel +
  omschrijving + optionele actieknop (echte route, geen dode knop). Vervangt overal de ad-hoc
  `text-sm text-muted-foreground`-lege-staten (opdrachten, kandidaten, certificaten, facturen,
  samenwerkingen, reacties, notificaties, berichten (+thread), documenten, beschikbaarheid,
  admin opdrachten/audit/gebruikers/verificaties, profiel, bedrijf).
- **Gedeelde `Skeleton`-primitives** (`src/components/ui/skeleton.tsx`): `Skeleton`,
  `PageHeaderSkeleton`, `ListSkeleton`. Nieuwe route-`loading.tsx` voor de zware lijstroutes;
  dashboard-`loading.tsx` hergebruikt nu de primitive.
- **Micro-interacties** (`globals.css`): `prefers-reduced-motion`-guard (a11y) + subtiele
  `.card-interactive` hover op klikbare lijstrijen (opdrachten/reacties/berichten/facturen).
- **404-semantiek bewaard (les uit Sessie 9 toegepast):** een `loading.tsx` op een segment wikkelt
  ook z'n dynamische kinderen in Suspense → `notFound()` lekt als HTTP 200. Opgevangen door de
  jobs-/authorization-e2e. Oplossing: lijst + `loading.tsx` van segmenten met `notFound()`-kinderen
  (opdrachten, facturen, berichten, certificaten) in een **`(index)` route-group** geplaatst
  (URL ongewijzigd), zodat de Suspense-grens de `[id]`/`bewerken`-zusjes niet meer omvat.
- Checks: typecheck ✓, lint ✓, **192 unit-tests** ✓, build ✓ (31 routes). E2e: jobs + authorization
  weer 404-correct; overige losse failures zijn de bekende multi-context-load-flakiness op de
  gedeelde dev-server (elk slaagt los/na retry). Lokale dev-db opnieuw geseed (schone staat).

### Increment: Geplande verloopdetectie + "verloopt binnenkort"-herinneringen — 2026-05-29

- Orchestrator (Opus) + 2 Sonnet-builders, contract-first op niet-overlappende bestanden
  (pure planner vs. runner/endpoint/env); orchestrator deed schema + integratie + poort.
- **Pure planner** `src/lib/expiry.ts` (+ 10 unit-tests): `planExpiryRun(candidates, now, windowDays)`
  → `toExpire` (VERIFIED + verlopen, via bestaande `expiryTransition`) en `toRemind`
  (VERIFIED, niet verlopen, binnen 30 dagen). **Idempotent**: dedup-anker `expiryReminderFor`
  (de vervaldatum waarvoor al herinnerd is) voorkomt dubbele herinneringen; bij vernieuwing
  (nieuwe `expiresAt`) volgt automatisch een nieuwe herinnering. Lijsten zijn nooit overlappend.
- **Taak-runner** `src/lib/expiry-task.ts`: `runExpiryTask({ actorId, now })` laadt begrensd
  (VERIFIED + `expiresAt ≤ now+30d`), past het plan in één `$transaction` toe (EXPIRED zetten +
  notificaties + herinnering-notificaties + `expiryReminderFor` markeren + audit per batch).
  Eén bron van waarheid voor admin-knop én geplande ingang.
- **Geplande ingang** `POST /api/tasks/expiry`: beveiligd met `CRON_SECRET` (Bearer/`?token=`);
  zonder secret → 503 (nooit per ongeluk open), bij token-mismatch → 401 (lekt niets).
  Middleware-publiek gemaakt (eigen token-guard, geen sessie). `actorId: null` = systeemactie.
  `.github/workflows/expiry-check.yml` roept het dagelijks aan via repo-secrets
  `EXPIRY_TASK_URL` + `CRON_SECRET` (de scheduler-koppeling zelf = mensenwerk).
- **Admin** `runExpiryCheck` gerefactord naar `runExpiryTask`; knop rapporteert nu verlopen
  - herinneringen. Schema: `Credential.expiryReminderFor` (db push). env: `CRON_SECRET` optioneel.
- Checks: typecheck ✓, lint ✓, **202 unit-tests** ✓ (+10 planner), build ✓ (route geregistreerd),
  `check:env` ✓. E2e overgeslagen (geen browser-channel in deze routine-omgeving; net als CI).
- Notificaties verschijnen automatisch in het bestaande notificatiecentrum + bel; signals.ts
  badget bijna-verlopen al. Geen "AI" in teksten/comments/docs.

### Increment: Rate-limiting op auth (brute-force-bescherming) — 2026-05-31

- Orchestrator (Opus) + 1 Sonnet-builder (geïsoleerde kern); orchestrator deed integratie + poort.
  Linear: ZZP2-29 (team ZZP Platform HUB), In Progress → Done met commit-hash.
- **Keuze:** bovenste backlog-item (pgvector semantisch matchen) is in deze headless routine-
  omgeving geblokkeerd — vereist prod-Postgres mét `vector`-extensie (lokaal/CI = SQLite, poort
  dekt het niet) én externe embeddings (botst met determinisme + geen-"AI"). In plaats daarvan het
  door de handover gesanctioneerde, headless-testbare security-item opgepakt.
- **Kern** `src/lib/rate-limit.ts` (+ 11 unit-tests, geïnjecteerde klok): deterministische
  fixed-window-limiter met pluggbare `RateLimitStore`-interface, dezelfde driver-aanpak als
  storage/verifiers. `MemoryRateLimitStore` (per-proces, sweep bij drempel) als default; later
  vervangbaar door een durable store (Redis/Upstash) achter dezelfde interface. `RateLimiter`-
  wrapper + geconfigureerde singletons (`loginRateLimiter` 5/15min, `registerRateLimiter` 5/uur).
- **Login** (`src/auth.ts`): begrenst pogingen per IP + genormaliseerde e-mail; bij overschrijding
  poging weigeren + `AUTH_RATE_LIMITED`-audit (IP/UA), géén enumeratie-lek. Reset de teller bij
  geslaagde login zodat legitieme gebruikers niet onnodig worden geblokkeerd.
- **Registratie** (`src/app/register/actions.ts`): begrenst nieuwe accounts per IP +
  `REGISTER_RATE_LIMITED`-audit; neutrale foutmelding.
- Geen nieuwe env-vars (config als constanten → geen `check:env`-impact). Geen "AI" in code/teksten.
- Checks: typecheck ✓, lint ✓, **213 unit-tests** ✓ (+11), build ✓ (33 routes). E2e overgeslagen
  (geen browser-channel in deze routine-omgeving; net als CI). Commit `ec189e3`.

### CSV-kern + SMTP-mail + onboarding e2e + repo-hardening — 2026-05-31

- **CSV-kernbibliotheek** (`src/lib/csv.ts`): gedeelde lees-/schrijffuncties hergebruikt door
  diensten, prestaties, administratie en import — één bron i.p.v. herhaalde code.
- **SMTP-mailintegratie** (`feat(mail)` x2):
  - `SmtpMailSender` in `mail-sender.ts` (nodemailer, lazy geladen, poort 465 = TLS / 587 = STARTTLS).
  - Welkomstmail bij onboarding-import (`welcome-email.ts`) — tijdelijk wachtwoord + inloglink.
  - Cascade-herinneringen (`reminder-emails.ts`) — expiry-task + payment-reminders-task +
    concept-invoice-reminders-task + vat-reminder-task sturen nu ook e-mail via `getMailSender()`.
  - Patroon: e-mails buiten de transactie (falen rolt DB-actie niet terug).
- **E2e-tests onboarding** (`test(e2e)`): CSV bulk-import + geforceerde wachtwoordwijziging
  (happy path + edge cases) in Playwright CI.
- **Playwright in CI** (`feat(ci)`): `playwright.yml` draait nu ook in GitHub Actions (`--project=ci`,
  bundled Chromium), screenshots als artifact. Alle workflows op OAuth (geen API key meer).
- **Repo-hardening** (`feat`): `CODEOWNERS`, issue-/PR-templates, `CONTRIBUTING.md`, `SECURITY.md`.
- **Prettier + husky + lint-staged** (`feat`): formatting-toolchain als pre-commit hook; codebase
  geformatteerd; `.git-blame-ignore-revs` voor de format-commit.

### Verificatie-uitslag e-mails + DBA-signaal e-mail — 2026-05-31

Sluit de ontbrekende e-mailkanalen voor twee kritieke platform-events:

- **Admin goedkeuren/afwijzen → e-mail naar ZZP'er** (`admin/verificaties/actions.ts`):
  `buildCredentialVerifiedEmail` en `buildCredentialRejectedEmail` (inclusief afwijzingsreden)
  — naast de bestaande in-app notificatie.
- **DBA-monitor signaal → e-mail naar beide partijen** (`dba-monitor-task.ts`):
  `buildDbaSignalEmail` met signaaltekst + disclaimer — naar ZZP'er én opdrachtgever.
- **3 nieuwe templates** in `reminder-emails.ts` + 9 unit-tests (totaal 564 groen).
- **Patroon**: e-mail buiten transactie, `getMailSender()` singleton (noop dev/test, SMTP prod).
- # Gate: typecheck ✓ lint ✓ test 564 ✓ build ✓.

### Increment: Semantische matching-laag (deterministisch lokaal, pgvector-klaar) — 2026-05-30

- Orchestrator (Opus) + 2 Sonnet-builders op niet-overlappende nieuwe bestanden; orchestrator
  deed de integratie + poort. Backlog-kop "semantisch matchen met pgvector" — gebouwd volgens
  hetzelfde service-grens-patroon als storage/DUO/BIG/identiteit (lokaal werkt overal, echte
  pgvector-provisioning op productie-Postgres = mensenwerk).
- **Pure laag** `src/lib/semantic.ts` (+ 34 unit-tests): deterministische tekstgelijkenis zonder
  externe afhankelijkheid — `tokenize` (lowercase, diacritics-strip, NL-stopwoorden, min. lengte),
  `embed` (feature hashing via FNV-1a, signed, L2-genormaliseerd, dim 96), `cosineSimilarity`
  (geklemd op [0,1]), `textRelatedness(a,b)` 0..1. Symmetrisch, identiek=1, leeg=0.
- **Service-grens** `src/lib/services/semantic-matcher.ts` (+ 8 unit-tests): `SemanticMatcher`-
  interface, `LocalSemanticMatcher` (default, in-memory cosinus), `PgVectorSemanticMatcher`
  (env `SEMANTIC_MATCHER=pgvector`; faalt helder zonder DB-zijde), `getSemanticMatcher()` +
  `safeRelatedness()` zodat ranking nooit crasht (degradeert naar score-only).
- **Integratie** `recommendations.ts` + `suggestions.ts`: inhoudelijke gelijkenis als
  deterministische **tiebreaker** bij gelijke score (`relatedness` veld, optioneel) + een
  verklarende regel ("Sluit inhoudelijk aan op je profiel / op de opdracht") op de dashboard-
  en opdrachtkaart wanneer de aansluiting boven de drempel ligt. `computeMatchScore` blijft
  ongewijzigd (bestaande tests intact). Tiebreaker-unit-tests toegevoegd in beide test-files.
- **Drempel gekalibreerd** op de demo-seed (42 job×profiel-paren, gemeten): median 0.120,
  p75 0.245, p90 0.472, max 0.737 → `SEMANTIC_HIGHLIGHT_THRESHOLD = 0.3` toont de verklaring
  voor 7/42 = 16,7% (~top 1/6) best-aansluitende paren (selectief, nooit altijd-aan/leeg).
- env: `SEMANTIC_MATCHER` toegevoegd aan `env.ts` (default "local") + `.env.example`.
- Checks groen: typecheck, lint, **246 unit-tests**, build (33 routes), `check:env`. E2e
  overgeslagen (geen browser-channel in deze routine-omgeving, net als CI). Geen "AI" in
  UI/teksten/comments/docs; deterministisch en server-side.
- Let op (handoff): de backlog-kop "semantisch matchen" is in eerdere routine-runs al meermaals
  als Done gemarkeerd op losse `claude/epic-*`-branches die nooit naar `claude/dazzling-carson-v9Qwk`
  zijn gemerged. Deze run staat op `claude/epic-lovelace-ghtBi` en moet (na de poort) eveneens
  gemerged worden om live te gaan.

### Admin DBA-risico-overzicht (/admin/dba) — 2026-06-01

- **Probleem:** de DBA-monitor (`dba-monitor.ts` + geplande taak) signaleert per samenwerking en
  notificeert beide partijen, maar er was geen geconsolideerd beheerdersoverzicht. Beheerders konden
  het DBA-risico over álle actieve samenwerkingen niet in één blik zien/sorteren/filteren.
- **Pure kern** `src/lib/dba-overview.ts` (+ `dba-overview.test.ts`, 14 tests): `rankDbaLevel`
  (HOOG<VERHOOGD<LAAG), `sortDbaRows` (hoogste risico eerst, bij gelijk niveau langste duur eerst),
  `summarizeDbaOverview` (totaal + aantal per niveau, alle drie niveaus altijd aanwezig) en
  `loadDbaOverview(now?)` — laadt ACTIEVE samenwerkingen, berekent omzetconcentratie identiek aan de
  monitor-taak en past de bestaande engine (`assessCollaborationDba` + `jobDbaIndicators`) toe.
  Server-side waarheid; hergebruikt `getDbaThresholds()` (DB-drempels).
- **Pagina** `/admin/dba` (+ `loading.tsx`): samenvattingsstrip met klikbare niveaufilters
  (querystring `?niveau=`), per rij Card met niveau-Badge (HOOG→danger/VERHOOGD→warning/LAAG→muted),
  duur, partijen en de individuele signalen, link naar het werkproces. Verplichte disclaimer altijd
  zichtbaar (Besluit 2: signaleren, geen juridisch oordeel). Loading- + lege staten aanwezig.
  Alleen ADMIN (`requireRole("ADMIN")`). Nav-item "DBA-monitor" toegevoegd voor ADMIN.
- Gebouwd met 2 Sonnet-builders op niet-overlappende bestanden (lib+tests / pagina+nav), orchestrator
  integreerde + draaide de poort. Gate groen: typecheck ✓ lint ✓ test 569 ✓ build ✓ (/admin/dba
  geregistreerd) prettier ✓. E2e overgeslagen (geen browser-channel in de routine-omgeving, net als CI).
  Linear: ZZP2-37. Geen "AI" in UI/teksten/comments.

### Aanmaningsladder voor te late facturen (dunning-escalatie) — 2026-05-31

- Orchestrator (Opus) + 2 Sonnet-builders op niet-overlappende bestanden (engine+config+tests vs.
  runner). Linear: ZZP2-35 (ZZP Platform HUB).
- **Config** (`config.ts`): `DUNNING_STAGES` (REMINDER@0 / FIRST_NOTICE@14 / SECOND_NOTICE@30 /
  FINAL_NOTICE@45 dagen-na-vervaldag, NL-labels) + `DunningLevel` + `DUNNING_ESCALATION_LEVEL`.
  Configureerbaar; het platform int niet (Besluit 1) — signalen, geen incasso.
- **Engine** (`payment-reminders.ts`): `daysOverdue` + `currentDunningStage` (hoogst bereikte
  niveau of null) + `PaymentEscalationItem` + `escalations[]` op het plan. `planPaymentReminders`
  vuurt per te late factuur het huidige niveau, eenmalig per niveau (dedupeKey per niveau,
  idempotent), en escaleert naar het platform op het laatste niveau. Pre-vervaldag-herinneringen
  ongewijzigd; bestaande tests blijven groen.
- **Runner** (`payment-reminders-task.ts`): verwerkt de gestaffelde reminders + escaleert naar
  actieve admins (DomainEvent + notificatie per admin + audit, idempotent via dedupeKey).
  `PaymentReminderResult.escalated` toegevoegd.
- **UI**: rustig informatief aanmaningsniveau-label op de factuurdetailpagina voor OVERDUE-facturen.
- Tests: 555 → 573 groen (+18). Gate: typecheck ✓ lint ✓ test ✓ build ✓ prettier ✓.
  E2e overgeslagen (geen browser-channel in deze omgeving; net als CI).

### Dispuut-triage op /admin/disputen (leeftijd + urgentie + samenvatting) — 2026-06-05

- **Probleem:** `/admin/disputen` toonde open disputen alleen met "sinds {datum}" — geen gevoel van
  urgentie terwijl een open dispuut de facturatie-cascade (en dus betaling) bevriest tot bemiddeling.
- **Pure kern** `src/lib/disputes.ts` (+ `disputes.test.ts`, 32 tests, stijl van `dba-overview.ts`):
  `disputeAgeDays` (hele dagen open, floor, nooit negatief), `disputeUrgency`
  (NORMAAL/VERHOOGD/URGENT via `DISPUTE_URGENCY_THRESHOLDS` 3/7 dagen), `rankDisputeUrgency`,
  `sortDisputeRows` (urgentste eerst, bij gelijk niveau oudste eerst), `summarizeDisputes` (totaal
  - aantal per niveau, alle niveaus altijd aanwezig, oudste leeftijd) en `buildDisputeRow` (pure
    factory). `loadDisputeOverview(now?)` als dunne DB-laag (alle samenwerkingen met open dispuut),
    gesorteerd. Server-side waarheid; geen schemawijziging.
- **Pagina** `/admin/disputen`: samenvattingsstrip met tellers per urgentieniveau + per kaart een
  urgentie-Badge (URGENT→danger / VERHOOGD→warning / NORMAAL→muted) en "X dagen open"; gesorteerd
  urgentste-eerst. Loading/empty-states intact.
- Gebouwd met 2 Sonnet-builders op niet-overlappende bestanden (lib+tests / pagina), orchestrator
  (Opus) integreerde + draaide de poort. Gate groen: typecheck ✓ lint ✓ test **1057** ✓ build ✓
  prettier ✓. E2e overgeslagen (geen browser-channel in de routine-omgeving, net als CI).
  Linear: ZZP2-89. Geen "AI" in UI/teksten/comments.

---

### AVG-verwerkingsregister + bewaartermijnen-overzicht (admin) — 2026-06-02

- **Probleem:** het platform verwerkt gevoelige persoonsgegevens (VOG/strafrechtelijk, diploma's,
  identiteit, financiële administratie) maar er was nergens een verwerkingsregister (art. 30 AVG) of
  een overzicht van bewaartermijnen — terwijl de formele AVG-review livegang met echte gevoelige
  documenten blokkeert. Eerste concrete, controleerbare bouwsteen daarvoor.
- **Pure kern** `src/lib/compliance/processing-register.ts` (+ `.test.ts`, 43 tests): deterministisch
  register van 13 verwerkingsactiviteiten (naam, doel, rechtsgrond art. 6, betrokkenen, categorieën
  persoonsgegevens, gevoelig art. 9/10, ontvangers, bewaartermijn, beveiligingsmaatregelen) afgeleid
  uit het echte datamodel, plus een bewaarschema (`RETENTION_SCHEDULE`, 7 regels — o.a. fiscale
  bewaarplicht 7 jaar). Hulpfuncties `summarizeRegister` (telling per rechtsgrond + gevoelig),
  `filterByLegalBasis` (muteert niet), `LEGAL_BASES`/`LEGAL_BASIS_LABEL`, verplichte disclaimer.
- **Admin-pagina** `/admin/avg` (+ `loading.tsx`): samenvattingsstrip met rechtsgrond-filterpills
  (querystring `?grond=`), registercards met rechtsgrond- + "Gevoelig (art. 9/10)"-badge, bewaarschema-
  sectie, disclaimer, lege/loading-staten. Alleen ADMIN (`requireRole`). **CSV-export** `/admin/avg/export`
  via `csv.ts` (register + bewaarschema in één bestand, ADMIN-gated). Nav-item "Verwerkingsregister"
  onder Toezicht. Read-only — geen data-mutatie/verwijdering.
- Gebouwd met 2 Sonnet-builders op niet-overlappende bestanden (lib+tests / pagina+route+nav),
  orchestrator integreerde + draaide de poort. Gate groen: typecheck ✓ lint ✓ **test 978 ✓** build ✓
  (/admin/avg + /admin/avg/export geregistreerd) prettier ✓. E2e overgeslagen (geen browser-channel
  in de routine-omgeving, net als CI). Linear: ZZP2-53. Geen "AI" in UI/teksten/comments.

---

---

- **Audit QW3 — interim-cap lijstqueries:** `take: 100` op de vier onbegrensde
  collaboration-/document-`findMany`'s (dashboard ×2, samenwerkingen, documenten) als vangnet
  tegen onbegrensde groei; echte cursor-paginatie volgt in audit-taak T3.
- **Audit T2 — applier-transactietest:** nieuwe `src/lib/cascade/apply.test.ts` (5 tests) met een
  geïnjecteerde fake `TransactionClient`: B2-pakket (factuur+status+postings+notificatie+audit),
  tabel-dispatch per entiteit, terugrol bij gelijktijdige statuswijziging (count ≠ 1), lege
  effecten, occurredAt-default. `apply.ts` van 0% naar 100% statements / 83% branches.
- **Audit QW1 — afhankelijkheden schoon:** `next` ^15.5.19 (in-range) + `overrides.postcss =
"$postcss"` zodat de geneste postcss 8.4.31 in next dedupliceert naar de top-level 8.5.15
  (GHSA-qx2v-qp2m-jg93, vereist ≥ 8.5.10). `npm audit`: 2 moderate → **0 vulnerabilities**.

- **Audit T7 — Prisma-config-migratie:** `package.json#prisma` (deprecated, weg in Prisma 7) →
  `prisma.config.ts` (`defineConfig` met schema + `migrations.seed`). dotenv expliciet geladen
  (CLI slaat .env-loading over mét configbestand); `prisma.config.ts` meegekopieerd naar de
  runtime-image (Dockerfile) zodat de boot-seed zijn commando blijft vinden. Lokaal geverifieerd:
  generate zonder deprecation, `db push` en `db seed` werken.

- **Prijsadvies + concurrentie-backlog:** `docs/PRIJSADVIES.md` vastgelegd (4 prijslijnen:
  zzp-abo €24,95/actieve mnd, opdrachtgever €1,75/uur, tenant €12,50/actieve zzp'er/mnd,
  optionele factoring 2,5% — eigenaar: factoring is geen harde nee meer) met omzetscenario's
  200/500/1.000/3.000 zzp'ers en geverifieerde concurrent-benchmarks. Acht-punten
  concurrentie-backlog toegevoegd aan CURRENT_TASK.md; punt 1 en 2 parallel in uitvoering.

### Increment: Notificatie-voorkeuren — e-mailherinneringen per categorie aan/uit — 2026-06-01

- **Probleem:** terugkerende herinnerings-/signaal-e-mails (betaling, concept-factuur, BTW, DBA)
  konden niet per categorie worden uitgezet; geen controle over de inbox. In-app notificaties
  blijven de bron van waarheid en staan hier los van.
- **Pure kern** `src/lib/notification-preferences.ts` (+ 38 unit-tests): `EMAIL_PREFERENCE_CATEGORIES`
  (payment/invoice/vat/dba, NL-labels), opt-out-model (afwezige rij = aan), `resolveEmailPreferences`,
  `isEmailEnabled`, `isEmailPreferenceCategory`, `emailPreferencesSchema` (Zod).
- **Datalaag** `src/lib/notification-preferences-data.ts`: `loadEmailPreferences(userId)`,
  `loadEmailPreferencesFor(userIds)` (één query, geen N+1), `recipientWantsEmail`.
- **Schema:** `NotificationPreference` (`@@unique([userId, category])`, default aan, cascade delete);
  relatie op `User`. (db push, additief — bestaande flow ongemoeid.)
- **UI** `/account/notificaties` (+ `loading.tsx`): toggle per categorie via de mutatieketen
  (requireActor → Zod → `$transaction` upserts → `auditData`+`requestMeta` → revalidate), met link
  vanaf `/account`. Geen dode knoppen; uitleg dat in-app meldingen altijd blijven.
- **Gating** in de 4 terugkerende taakrunners (`payment-reminders-task`, `concept-invoice-reminders-task`,
  `vat-reminder-task`, `dba-monitor-task`): vóór `mail.send` checkt `isEmailEnabled(prefsByUser.get(uid),
cat)`. DomainEvent/Notification/AuditLog en admin-escalaties ongemoeid. Transactionele cascade-/
  wachtwoord-/welkomstmails bewust buiten scope (operationeel, niet uit te zetten).
- Gebouwd met 3 Sonnet-builders op niet-overlappende bestanden (tests / UI / runner-gating);
  orchestrator (Opus) leverde het contract (schema + pure kern + datalaag) en draaide de poort.
- Gate groen: typecheck ✓ lint ✓ test **884** ✓ (+38) build ✓ (`/account/notificaties` geregistreerd)
  prettier ✓. E2e overgeslagen (geen browser-channel in de routine-omgeving, net als CI).
  Linear: ZZP2-41. Geen "AI" in UI/teksten/comments.

## Sessie — Vakwerk-ontwerptaal (fase 1) — 2026-06-09

Eigenaar koos de lichte richting met pastel achtergrond; Vakwerk is nu het standaardpalet
(ADR 0007, routekaart in `docs/PLAN-WERELDKLASSE.md`, referentie `docs/ontwerpen/vakwerk.html`).

- **Tokens:** pastelblauw papier + witte vellen + klein-blauw + zegelgroen in `:root`/`.dark`
  (`globals.css`); bloei/elektrisch-blauw blijven werken. Radius 0.75rem.
- **Typografie:** Inter / Schibsted Grotesk / JetBrains Mono via `next/font` (`layout.tsx`),
  `font-display`/`font-mono` in Tailwind. PageHeader-h1 → display-font.
- **Nieuwe primitives (+ geteste lib-logica):** `Seal`, `MatchMeter` (`lib/meter.ts`),
  `Sparkline` (`lib/sparkline.ts`), `CascadeStepper`, `TurnBanner`, `Table`.
- **Backend-slice:** `lib/revenue.ts` — maandelijkse omzetreeks (Europe/Amsterdam, factuurdatum)
  - delta; gevoed door betaalde facturen (cascade + legacy).
- **Toegepast:** app-shell (witte zijbalk/topbalk op pastel canvas), dashboard (display-kop,
  overline-labels, mono-KPI's, omzet-sparkline als 4e ZZP-stat, matchmeters bij matches),
  samenwerkingsdetail (CascadeStepper + TurnBanner i.p.v. handgerolde stepper/kaart).
- **Checks:** typecheck/lint/test (125 bestanden, 1272 tests)/build groen; visueel geverifieerd
  (licht + donker, dashboard + werkproces) met de demo-seed.
- **Rustiger gemaakt (eigenaarsfeedback "iets minder druk"):** keuzepaletten-systeem volledig
  verwijderd (PaletteSwitcher, bloei/elektrisch-blauw-CSS, palette-deel van theme.ts/no-flash-
  script; themes-e2e versmald tot licht/donker) — één identiteit. Achtergrond/randen/accent
  zachter (bg `216 42% 97%`). Dashboard-matchrijen tonen beschikbaarheid-/compliance-badges
  alleen nog bij een afwijking.

<!-- Kopieer dit blok voor elke nieuwe sessie -->
