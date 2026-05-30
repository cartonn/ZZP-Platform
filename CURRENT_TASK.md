# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md en PROGRESS.md voordat je begint.
> Werk dit bestand bij wanneer je naar de volgende taak gaat.

## HANDOFF — operationele stand (lees dit eerst)

- **Live:** test-URL `zzp-platform-production-be07.up.railway.app`. Demo-accounts (wachtwoord
  `demo1234`): `opdrachtgever@`, `zzp@` (Sanne), `admin@zzp-platform.local`.
- **Deploy:** Railway bouwt/deployt branch **`claude/dazzling-carson-v9Qwk`** automatisch (Dockerfile).
  `scripts/start.mjs` doet bij elke boot `prisma db push` + **seed (idempotent)** → de rijke demo-
  inhoud staat er altijd (7 ZZP'ers met certificaten, 6 opdrachten + concept, reacties in alle
  statussen, 2 samenwerkingen, 4 facturen incl. verlopen).
- **24/7-bouw:** Routine **"ZZP auto-build"** in Claude Code on the web (claude.ai/code/routines),
  elke ~2 uur. Orchestrator op **Opus**, builder-subagents op **Sonnet** (zie `.claude/agents/*`).
  Maakt per run een **Linear-issue in team "ZZP Platform HUB"** (In Progress → Done met commit-hash).
  **Let op:** routine-runs pushen naar hun eigen **`claude/epic-*`-branch** — die moet je naar
  `claude/dazzling-carson-v9Qwk` **mergen** (na de poort) om live te gaan. `ANTHROPIC_API_KEY`-secret
  staat in GitHub. (De GitHub-Actions-cron `auto-build.yml` bestaat ook, maar is onbewezen vanuit de
  sessie — de Routine is de gekozen route.)
- **Vóór échte productie (mensenwerk, zie MENSENWERK.md):** juridisch/AVG-review (blokkeert livegang
  met echte gevoelige documenten), betalingen (Stripe/Mollie), echte verificatie-API's (DUO/BIG/iDIN
  — nu demo), e-mail, S3-documentopslag, eigen domein. Code is hierop voorbereid.

---

## STATUS: PLATFORM OVERHAUL — event-driven cascade (`prompts/PLATFORM_OVERHAUL.md`)

Grote, gefaseerde verbouwing naar een event-driven systeem met de volledige facturatie- en
administratiecascade. Bron van waarheid: `prompts/PLATFORM_OVERHAUL.md` (§0A besluiten hard,
§0B open). Werkdocumenten: `ARCHITECTURE.md`, `DECISIONS.md`, `WORKFLOW_MAP.md`, `DESIGN.md`.

> **Branch deze sessie:** `claude/modest-babbage-08jYa` (harness-instructie). Niet naar
> `claude/dazzling-carson-v9Qwk` pushen zonder toestemming.

### Fasevoortgang
- [x] **Fase 0 — Inventarisatie & fundering.** Docs aangemaakt (ARCHITECTURE/DECISIONS/
      WORKFLOW_MAP/DESIGN), gap-analyse hieronder, Fase 1 voorgesteld.
- [x] **Fase 1 — Event-bus, state machines, event store.** Zie verslag onder.
- [x] **Fase 2 — Datamodel administratie & administratiemotor** (additief). Zie verslag onder.
- [x] **Fase 3 — Hoofdcascade (Events A–E)** — logica + applier + command-laag + UI
      (`/samenwerkingen/[id]`) + demo-seed; end-to-end geverifieerd tegen de DB. Zie verslag.
- [x] **Fase 4 — Zijpaden & DBA-monitoring** — DBA-monitoring ✓, administratie-overzichten ✓,
      te-late-betaling/aanmaningen ✓, creditfactuur ✓, dispuut/escalatie (cascade-freeze) ✓.
      (Exports CSV/PDF horen bij Fase 6.)
- [~] **Fase 5 — Rol-workspaces & UX/UI** — werkproces-UI, cascade op /facturen + dashboard
      "aan zet", cascade-factuurdetail, admin-disputenoverzicht. Open: dark-first-keuze (DESIGN.md).
- [~] **Fase 6 — Notificaties, reminders, exports** — reminder-engines (expiry/betaling/DBA/
      concept-factuur), CSV-exports (grootboek + BTW), jaaroverzicht/IB, notificatie-categorieën,
      print/PDF-factuur, e-mailkanaal-abstractie (MailSender). Open: e-mail echt versturen, PDF-styling.
- [~] **Fase 7 — Hardening & end-to-end** — zijpad-integratietests, loading-states. Open: Playwright-
      e2e (interactieve sessie mét browser).

### 24/7-bouw actief — coördinatie (lees dit, auto-build-agent)
De GitHub Actions-workflow `auto-build.yml` bouwt elke ~15 min op deze branch. Meerdere agents pushen
hier; **altijd `git fetch` + rebase vóór commit én push**. Kies een increment dat **niet overlapt**
met de laatste commits. **Geen dark-first re-theme** zonder akkoord eigenaar (open beslissing).

### Deploy-afspraak: additief tot "klaar", dan cutover
Alles accumuleert op `claude/modest-babbage-08jYa`. **Railway raakt de overhaul pas bij de cutover**
(default branch is nu `dazzling-carson` = oude code). Niet eerder pushen naar de deploy-branch.

**Definition of Done (wanneer is de overhaul "klaar" — bron: PLATFORM_OVERHAUL.md §9):**
cascade A–E + verplichte goedkeuring (B) + alle zijpaden werken end-to-end (uurtarief én milestone);
beide administraties kloppen (BTW, nummering per partij, onveranderlijkheid); DBA signaleert met
disclaimer; fee-module bestaat en staat default UIT; UX consistent + toegankelijk; **dark-first-keuze
gemaakt** (DESIGN.md); unit + integratie groen, build groen; docs bij.

**Cutover-checklist (UITVOEREN als bovenstaande klaar is — vraag eigenaar bij twijfel):**
1. Volledige gate groen + **e2e in een interactieve sessie mét browser** (kan niet in CI/routine).
2. Dark-first-beslissing verwerkt (Fase 5).
3. Migratiescript voor bestaande demo-/livefacturen (de tijdelijke dubbele `status`/`number`-brug
   netjes afronden) — getest op een kopie.
4. `modest-babbage` → deploy-branch brengen: of merge naar de default branch, of `modest-babbage`
   de **default** maken; **Railway op die branch richten** en deploy + seed verifiëren.
5. **Juridisch/AVG-review** (MENSENWERK) vóór livegang met echte gevoelige documenten.

**Geprioriteerde backlog (bovenste eerst; pak er één, lever DoD-groen, push):**
1. E-mail echt versturen via `MailSender` bij sleutel-notificaties (factuur ingediend/goedgekeurd,
   betaling, DBA-signaal) — achter de bestaande abstractie; NoopMailSender blijft default.
2. PDF/print-styling van het BTW-/jaaroverzicht op `/administratie` (print-knop + `@media print`).
3. Eén cron-orchestratie `/api/tasks/run-all` die expiry + betaling + DBA + concept-factuur draait,
   zodat de host maar één cron hoeft.
4. Cascade-herleidbaarheid uitbreiden: op `/samenwerkingen/[id]` de keten tonen
   (contract → prestatie → factuur → betaling) met statusiconen.
5. Hardening: idempotentie-integratietest voor een command (dubbele submit/approve → één effect).
6. Periodieke administratie-notificatie: kwartaal-BTW-herinnering aan de ZZP'er.

> Reeds gedaan (niet opnieuw): print/PDF-factuurknop, MailSender-abstractie, concept-factuur-
> reminders, jaaroverzicht/IB, grootboek-/BTW-CSV, DBA-omzetconcentratie, admin-disputen.

### Gap-analyse (Fase 0)
**Herbruikbaar:** enums+Zod-patroon; `assert*Transition`-maps (credential/invoice/collaboration);
plan/apply-splitsing (`planExpiryRun`/`runExpiryTask`) als blauwdruk voor handlers; `audit()`
één-schrijfpunt; authz-keten (`authz.ts`); server-side snapshots (matchScore, DBA op Job);
next-action-engine; Invoice/InvoiceLine/Collaboration-modellen.
**Moet wijken/uitbreiden:** korte Job/Invoice/Collaboration-enums → rijkere lifecycles (Fase 2/3);
losse factuur → afgeleid uit goedgekeurde prestatie + reeks per partij + BTW.
**Ontbreekt volledig:** centrale event-laag; Urenstaat/Oplevering-entiteit + verplichte
goedkeuringsstap; administratie-items (debiteur/crediteur) + betaalstatus-registratie; doorlopende
DBA-monitoring; reminder-engine voor de facturatie-cascade; Event F (fee, default uit).
**Grootste risico's:** (1) lifecycle-migratie zonder de live demo te breken (additief in Fase 1);
(2) idempotentie bij dubbele events; (3) dark-first vs. light thema (stop-and-confirm vóór Fase 5);
(4) BTW/nummering-correctheid (echte administratie, geen mock).

### Fase 1 — verslag (afgerond 2026-05-29)
Geleverd:
- `src/lib/state-machine.ts` — generieke `defineStateMachine(entity, transitions)` →
  `{ can, assert, next, isTerminal, isState }`; valideert overgangen naar onbekende toestanden
  bij definitie; `StateTransitionError`.
- `src/lib/lifecycles.ts` — doel-lifecycles als state machines: WorkOrder (opdracht), Contract,
  Performance (urenstaat/oplevering), InvoiceLifecycle, Payment (registratie, geen geldverwerking).
- `src/lib/events.ts` — `DomainEventType` (Events A–F + zijpaden) + Zod, `DomainEventInput`/
  `StoredEvent`-vorm, `EventStore`-interface + `InMemoryEventStore` (pure tests).
- `src/lib/event-bus.ts` — `EventBus`: handlerregistratie + idempotente `publish` (claim per
  handler, claim-teruggave bij fout → self-healing replay).
- `src/lib/event-store.ts` — `PrismaEventStore` + proces-singleton `eventBus`.
- Schema: `DomainEvent` (append-only, unieke `dedupeKey`) + `EventHandlerRun` (handler-dedup).
- Tests: state-machine (7), lifecycles (14), event-bus (7). **Gate groen:** typecheck ✓, lint ✓,
  test 230 ✓, build ✓. (e2e niet gedraaid — geen browser-channel in routine, zie CLAUDE.md.)

DoD Fase 1 ✓: events publiceren/consumeren werkt; ongeldige statusovergangen worden geweigerd;
idempotentie aangetoond (dubbele publish = één event + één handlerrun).

### Fase 2 — verslag (afgerond 2026-05-29)
Gekozen richting (met eigenaar afgestemd): **additief naast elkaar** — nieuwe modellen + pure
motor, live `Invoice`/`Collaboration`-flow blijft werken; cutover volgt in Fase 3.
- `src/lib/config.ts` — configureerbare bedrijfsregels: BTW-regimes + tarieven (bps), platformfee
  (default UIT), reminder-tijden, DBA-drempels + disclaimer, betaalbevestiging.
- `src/lib/administration/vat.ts` — pure BTW-berekening (integer-centen, 21/9/0/verlegd/vrijgesteld,
  commerciële afronding, creditregels).
- `src/lib/administration/numbering.ts` — doorlopende nummering **per uitschrijvende partij**
  (geen platform-brede reeks), gatenvrij-check.
- `src/lib/administration/ledger.ts` — administratiemotor: pure dubbel-boekhoud-postings per
  cascade-event (C/D/E + creditfactuur), per-partij saldo, BTW-positie, sluitcontrole.
- `src/lib/administration/persist.ts` — dunne prisma-schrijvers: postings → AdministrationEntry +
  transactionele factuurnummer-toewijzing per partij (voor Fase 3-handlers).
- Schema (additief): `Performance` (urenstaat/oplevering), `InvoiceSequence` (reeks per partij),
  `AdministrationEntry` (grootboek); `Invoice` uitgebreid met nullable cascade/BTW/partij-velden
  + `@@unique([issuerKey, partyInvoiceNumber])`. Live flow ongemoeid.
- Tests: 24 nieuw (vat 8 / numbering 7 / ledger 9). **Gate groen:** typecheck ✓, lint ✓, test 254 ✓,
  build ✓. Proeftransactie A–E aangetoond: debiteuren/crediteuren afgeboekt na betaling, omzet/kosten
  correct, BTW (ZZP'er draagt af, OG vordert terug), **geen enkele platform-boeking** (Besluit 1).

DoD Fase 2 ✓: proeftransactie genereert correcte administratie bij ZZP'er én opdrachtgever;
BTW klopt; nummering uniek per partij; geen geldverwerking aanwezig.

### Fase 3 — verslag (cascade-logica afgerond 2026-05-29)
- `src/lib/cascade/types.ts` — `CascadeEffects` (statuswijzigingen, postings, notificaties, audits,
  nieuwe concept-factuur, vervolg-events).
- `src/lib/cascade/handlers.ts` — pure planners per event: A (contract getekend), B1 (prestatie
  ingediend), B2 (goedgekeurd → concept-factuur + BTW), B2′ (afgekeurd, reden verplicht), C (factuur
  indienen → debiteurenpost + partij-nummer), D (goedkeuren → crediteuren/voorbelasting + vervaldag),
  D′ (afgekeurd), E (betaling geregistreerd → afboeken + samenwerking afronden; Event F-followup
  achter feature-flag, default UIT).
- `src/lib/cascade/apply.ts` — transactionele applier: schrijft alle effecten atomair weg
  (`$transaction`), inclusief nieuwe concept-factuur, postings (`AdministrationEntry`), notificaties,
  audit. Plan/apply-patroon zoals `runExpiryTask`.
- Tests: 16 nieuw (handlers 14 / integratie 2). Integratietest dekt het **hele pad A→E** voor
  uurtarief én milestone; beide administraties sluiten; geen platform-boeking (Besluit 1).
- **Gate groen:** typecheck ✓, lint ✓, test 270 ✓, build ✓.

DoD Fase 3 (logica) ✓: contract-getekend t/m betaalregistratie verloopt deterministisch; beide
administraties kloppen; goedkeuringsstap werkt voor beide tariefvormen; ongeldige overgangen geweigerd.

### Fase 3 — runtime-cutover (afgerond 2026-05-29)
- `src/lib/cascade/commands.ts` — command-laag: ownership-check → pure planner → DomainEvent +
  effecten + EventHandlerRun-marker atomair in één interactieve transactie; Event C kent het
  factuurnummer per partij toe (allocator in dezelfde tx). Idempotent via dedupeKey + state-asserts.
- `src/app/(protected)/samenwerkingen/[id]/{actions,page}.tsx` — cascade-workspace: "Aan zet"-
  banner, contract ondertekenen, uren/oplevering indienen (ZZP'er), goedkeuren/afkeuren
  (opdrachtgever), factuur indienen/goedkeuren/afkeuren, betaling markeren. Link vanaf de lijst.
- `prisma/seed.ts` — cascade-demo: voorgestelde samenwerking (collab-3), ingediende urenstaat
  (perf-1), goedgekeurde urenstaat + concept-factuur (perf-2/inv-c1).
- **Geverifieerd:** smoke tegen de echte DB liep de hele keten door; administratie sluit, BTW klopt,
  nummer per partij (2026-0001), geen platform-boeking. Gate groen: typecheck/lint/test 270/build.

### Volgende: Fase 4 — Zijpaden & DBA-monitoring
Te late betaling + aanmaningen (reminder-engine, plan/apply zoals `runExpiryTask`), creditfactuur,
dispuut/escalatie, periodieke overzichten (BTW-kwartaal, debiteuren/crediteuren), én de doorlopende
DBA-monitoring (§6) met configureerbare drempels + disclaimer. Daarnaast (additief, niet-blokkerend):
cascade-facturen tonen op `/facturen`, en de oude handmatige factuuraanmaak uitfaseren ná
in-browser-verificatie (interactieve sessie).

### Backlog (na de overhaul-fasen)
1. Semantisch matchen met pgvector zodra productie-Postgres draait (nu al: Postgres ✓).

Gereed (pre-overhaul): bedrijfsprofiel-compleetheid · admin gebruikers "vraagt aandacht" ·
nieuwe-reactie-notificatie · uitlegbare matching (match-reasons) · next-action-engine
(dashboard draait erop) · beschikbaarheid in matching (score onveranderd, reden + badges) ·
design-polish-pass (gedeelde EmptyState + Skeleton, route-skeletten, reduced-motion) ·
verloopdetectie als geplande taak (runExpiryTask + POST /api/tasks/expiry met CRON_SECRET,
"verloopt binnenkort"-herinneringen, idempotent via expiryReminderFor).

### Per increment (geen uitzonderingen)
testbare kern + unit-tests → UI → typecheck/lint/test/build groen → e2e + screenshot →
commit → push naar `claude/dazzling-carson-v9Qwk` → werk PROGRESS.md + deze backlog bij.

---

## QUALITY_CHECKLIST (gebruik elke sessie vóór commit)
```
npm install            # indien dependencies gewijzigd
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma db push     # of migrate, indien schema gewijzigd
npm run db:seed        # indien seed gewijzigd
# Start dev, klik de gebouwde flow door, check browserconsole op errors
```
Faalt iets → oorzaak onderzoeken, fixen, checks opnieuw. Pas daarna afvinken.
