# GAPS — gaten-backlog van de zelf-test-lus

Bijgehouden door de persona-sweep (zie `LOOP.md`). Fix-agents werken deze van boven naar beneden af;
gefixte items krijgen `[x]` + PR-nummer. "Productkeuzes" worden NIET gefixt zonder eigenaar-besluit.

## Iteratie 0 — 2026-06-09 (kalibratie)

53 screenshots over 4 persona's → 29 ruwe bevindingen → **16 bevestigd**, 3 productkeuzes, 8 dropped.

### Bevestigd (te fixen)

- [x] **HOOG · BUG** (#226) — Vertrouwensniveau "Volledig geverifieerd" negeerde ontbrekende verplichte
      documenten (`src/lib/trust.ts`). → trust weegt nu VOG+verzekering mee op alle 5 surfaces.
- [x] **HOOG · BUG** (#227) — Afgeronde + betaalde samenwerking toonde nog actieve "Akkoord geven" op de
      modelovereenkomst. → `canSign`/`canChooseType` alleen bij PROPOSED/ACTIVE.
- [x] **HOOG · UX** (#227) — Tegenstrijdige ongelabelde badges op ZZP-detail. → gelabeld als
      "Inzetbaarheid" / "Beschikbaarheid".
- [x] **MIDDEN · COPY** (#229) — Abonnementspagina lekt "Dit is een demo zonder echte betaling"
      (`abonnement/page.tsx`). → demo-tekst weg / neutraal herschrijven.
- [x] **MIDDEN · UX** (#229) — Audit-log toont rauwe JSON met centen + e-mail (`admin/audit/page.tsx`). →
      nette NL key/value + geformatteerde bedragen.
- [x] (#233) **LAAG · COPY** — Engelse native file-knop "Choose File / No file chosen" (bedrijf/documenten/
      certificaten/import). → eigen NL "Bestand kiezen".
- [x] (#231) **LAAG · COPY** — "Pdf"-knoplabel i.p.v. "PDF" (`admin/facturatie/page.tsx`).
- [~] (bewust laag) Native datumvelden: rechter stelde zelf vast dat lang="nl" al gezet is; placeholder volgt de browser-UI-taal. Niet gefixt — zeer lage waarde.
- [x] (#232) **LAAG · UX** — Leads-KPI "Open leads 2" vs 3 zichtbare leads zonder uitleg (subtekst/filter).
- [x] (#231) **LAAG · UX** — "Inzetbaar 0 van 2"-tegel op franchise-inzicht niet klikbaar, geen reden/vervolg.
- [x] (#231) **LAAG · UX** — Factuurlijst toont totaal incl. btw zonder "(incl. btw)"-label.
- [x] (#232) **LAAG · UX** — "Genereer facturen" geeft geen zichtbare terugkoppeling.
- [x] (#231) **LAAG · UX** — Verzekering-herstelactie is onopvallende tekstlink i.p.v. knop.
- [x] (#236) **LAAG · UX** — ZZP'er-toevoegformulier permanent uitgeklapt boven roster (vs. opdrachtgevers via knop).
- [x] (geverifieerd) "Reageren"-knop: geen bug — de testopdracht had al een reactie; de reageer-flow is gedekt door e2e (onboarding/applications) + de abuse-suite.
- [x] **HOOG → harness-artefact** — Zwevend 'N'-element over de sidebar = Next.js **dev-indicator**;
      alleen in `npm run dev`. Opgelost door de sweep tegen een productie-build te draaien
      (`playwright.personas.config.ts`). Geen app-fix.

### Productkeuzes (eigenaar-besluit — niet auto-fixen)

- [x] (#234, primaire accounts) Seed-/demodata is IT/developer i.p.v. zorg (positionering). Verrijken met zorgcontext = keuze.
- [x] (#235) Franchise-diensten-overzicht is read-only zonder doorklik naar dienst-detail.
- [x] (#232) Statistieken: subgroep-percentages tellen niet zichtbaar tot 100% (admins niet apart getoond).

## Iteratie 1 — 2026-06-09 (adversariële code-flow-sweep)

6 hunters (freelancer/client/franchiser/admin/geld-cascade/authz-tenancy) → 17 bevindingen, **17 bevestigd**
na adversariële verificatie (confidence ≥ 0,6). Top-down afwerken; elk fix op groene CI.

### HOOG

- [x] (#245) **GELD** — CLIENT-dashboard "Openstaand" (`client-stats.ts`) telt op `status IN (SENT,OVERDUE)`; cascade-facturen blijven `status='DRAFT'` → toont €0. Cascade-bewuste `outstandingInvoiceWhere` toegepast.
- [ ] **DEADEND** — Franchiser-cockpit linkt dienst naar `/opdrachten/[id]` i.p.v. `/franchise/diensten/[id]` → kale/404-pagina buiten de franchise (`franchise/opdrachtgevers/[id]/page.tsx:130`).
- [ ] **GELD** — Factuur opnieuw indienen na afkeuring kent NIEUW factuurnummer toe → gat in gatenvrije reeks (`cascade/commands.ts:672`).
- [ ] **GELD** — Factuur opnieuw indienen dubbel-boekt omzet/debiteuren/BTW (INVOICE_SUBMITTED zonder dedupeKey; reject boekt niet terug) (`cascade/commands.ts:657`).
- [ ] **AUTHZ** — Publieke `/zzp/[id]` lekt tenant-roster-PII cross-tenant + onauthenticated (geen tenant-scope; franchise-ZZP'er default PUBLIC) (`profile.ts:104` + `middleware.ts:28`).

### MIDDEN

- [x] (#245) **GELD** — ZZP'er-facturen "Openstaand"-kaart altijd €0 voor cascade-facturen (`facturen/(index)/page.tsx:58`). Zelfde root cause als #245-HOOG.
- [x] (#245) **GELD** — CLIENT-facturen "Openstaand" negeert cascade-facturen (`facturen/(index)/page.tsx:58`). Zelfde root cause.
- [ ] **BUG** — Tarieffilter verbergt opdrachten met leeg budget (nullable rateMin/rateMax + gte/lte sluit nulls uit) (`opdrachten/(index)/page.tsx:144`).
- [ ] **DEADEND** — "Factuur opstellen"-knop loopt dood zodra er een prestatie is ingediend (lege keuzelijst) (`samenwerkingen/page.tsx:231` + facturen-index `canInvoice`).
- [ ] **COPY** — "Betaling ontvangen"-knop ook getoond aan de betalende opdrachtgever (rol-afhankelijk label nodig) (`samenwerkingen/[id]/page.tsx:884`).
- [ ] **BUG** — Opdrachtgever kan ACTIVE-samenwerking eenzijdig annuleren ondanks onbetaalde goedgekeurde factuur (geen guard/waarschuwing) (`samenwerkingen/actions.ts:105`).
- [ ] **GELD** — Franchise-facturatie toont disclaimer "niet actief" alleen bij `!billingEnabled`, maar billing=true terwijl er niets geïncasseerd wordt → disclaimer verdwijnt juist (`franchise/facturatie/page.tsx:67`).
- [ ] **UX** — `removeDepartment` verweest PUBLISHED-diensten (SetNull) → verdwijnen uit cockpit maar blijven live ("spookdiensten"), geen confirm (`franchise/opdrachtgevers/actions.ts:206`).
- [ ] **DEADEND** — `/admin/gebruikers` belooft "rol"-beheer maar er is geen rolwijziging; ROLE_CHANGED-audit/monitoring is dode infra (`admin/gebruikers/page.tsx:68`).

### LAAG

- [ ] **COPY** — `/admin/audit` toont rauwe action-enums i.p.v. `auditActionLabel()` (helper bestaat + elders gebruikt) (`admin/audit/page.tsx:90`).
- [ ] **COPY** — Audit-metadata toont rauwe enum-waarden (from/to) zonder NL-vertaling (`audit-metadata.ts:6`).
- [ ] **BUG** — Factuurstatusovergang (`admin/facturatie`) zonder concurrency-guard (read-then-write); verificaties doet dit wél veilig (`admin/facturatie/actions.ts:56`).
