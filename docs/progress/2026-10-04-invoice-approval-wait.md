# 2026-10-04 — te-keuren-factuur-taak escaleert met wachttijd

## Probleem (gedragsinconsistentie, cashflow ZZP'er)

De te-keuren-factuur-taak (`invoiceApproveTask`, `src/lib/actions/tasks.ts`) hing vlak op de
approve-band (65) — zonder leeftijdsbesef — terwijl de **upstream** te-keuren-urenstaat
(`performanceApproveTask`) al sinds #1529-gebied escaleert naar de overdue-band (67) zodra die
≥ `PERFORMANCE_WAIT_ATTENTION_DAYS` (7) op goedkeuring wacht.

Dat is achterstevoren: een ingediende (SUBMITTED) cascade-factuur die de opdrachtgever niet
goedkeurt blokkeert stil de betaalcascade en dus de cashflow van de ZZP'er. Het platform behandelt
diezelfde stilstand elders al als urgent — `invoice-approval-reminders.ts` port de opdrachtgever op
dag 3/7 en escaleert daarna naar de admins, verankerd op `Invoice.issuedAt`
(`REMINDERS.invoiceApprovalDays = [3, 7]`, `config.ts`). Toch bleef de /acties-taak voor exact die
stilstaande factuur vlak op band 65 met een kale subtitel — strikt minder urgent dan de upstream
urenstaat-goedkeuring.

Niet gedekt door #1530 (herinnering-batch-bereikbaarheid) of #1551 (goedkeuring over cycli heen).

## Oplossing

Downstream-spiegel van `performance-wait.ts`:

- **Nieuw** `src/lib/invoice-approval-wait.ts` — pure helper `summarizeInvoiceApprovalWait`
  (`{ lifecycleStatus, issuedAt } → { daysWaiting, attention } | null`). Alleen SUBMITTED mét
  `issuedAt` telt; toekomstige `issuedAt` → 0 dagen (nooit negatief).
  `INVOICE_APPROVAL_WAIT_ATTENTION_DAYS = Math.max(...REMINDERS.invoiceApprovalDays)` (7) — één
  bron van waarheid met de nudge, geen drift.
- **`next-actions.ts`** — nieuwe prioriteitsband `invoiceApprovalOverdue: 66`: boven de verse
  approve-band (65), net onder de upstream urenstaat-escalatie (67) zodat de hele keten eerst
  bovenaan gedeblokkeerd wordt. Deelt de waarde met `supportOpen` (66, ADMIN) — rol-geïsoleerd,
  zelfde patroon als `credentialExpiring`/`verificationQueue` (beide 70).
- **`tasks.ts`** — `invoiceApproveTask` krijgt optionele `daysWaiting`; ≥ drempel → overdue-band +
  subtitel "… · wacht al N dag(en) op goedkeuring". `undefined` = gedragsbehoudend (vlakke band).
- **`pending-tasks.ts`** — `approveInvoices` selecteert nu `issuedAt`, leidt de wachttijd af en geeft
  die door. De where-scope garandeert SUBMITTED; valt `wait` onverhoopt weg → terug naar de vlakke band.

Geen badge-drift: de /samenwerkingen- + /prestaties-badges tellen alleen ingediende facturen, ze
rangschikken niet op prioriteit.

## Bewijs

- `src/lib/invoice-approval-wait.test.ts` — null-takken (DRAFT/APPROVED/PAID/PROCESSED/onbekend/geen
  issuedAt), dagtelling, toekomst→0, drempel 6 vs 7, en drempel == 7 (geen drift).
- `src/lib/actions/tasks.test.ts` — vers (65, kale subtitel), onder drempel (65), ≥ drempel (66 +
  wachttekst), en 66 < 67 (upstream eerst).
- `src/lib/actions/pending-tasks-outer-window.test.ts` — integratie: oude SUBMITTED-factuur → band
  66 + "wacht al"; verse factuur → band 65 kaal.

Lint, typecheck, format, volledige unit-suite en productiebuild groen (zie PR). Onafhankelijke
review en CI volgen.
