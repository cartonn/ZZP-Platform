# CURRENT_TASK.md — Huidige taak

> Eén taak tegelijk. Lees CLAUDE.md, de bovenste 100 regels van PROGRESS.md en
> `ARCHITECTURE.md §Modulekaart` voordat je begint. Werk dit bestand bij wanneer je naar de
> volgende taak gaat. **Doel: ≤ 300 regels** — afgeronde fase-verslagen, cutover-checklists en de
> "Gedaan (niet opnieuw)"-historie staan in
> [`docs/progress/current-task-archive-2026-08.md`](docs/progress/current-task-archive-2026-08.md).
> Grep daar vóór je iets bouwt dat al eens gebouwd kan zijn.

## HANDOFF — operationele stand (lees dit eerst)

- **Live:** `main` is de bron van waarheid **én** de deploy-branch; Railway bouwt/deployt elke
  merge automatisch (Dockerfile → PostgreSQL). Test-URL
  `zzp-platform-production-ba07.up.railway.app`. Demo-accounts (wachtwoord `demo1234`):
  `opdrachtgever@`, `zzp@` (Sanne), `admin@zzp-platform.local`.
- **Boot:** `scripts/start.mjs` doet bij elke boot `prisma db push` + **idempotente seed** → de
  demo-inhoud staat er altijd (ZZP'ers met certificaten, opdrachten, reacties in alle statussen,
  samenwerkingen, facturen incl. verlopen).
- **Workflow:** korte branch (`feat/`, `fix/`, `docs/`) → **PR naar `main`** → **6 vereiste
  statuschecks** (`check`, `e2e`, `audit`, `secret-scan`, `CodeQL`, `agent-review`) groen →
  `gh pr merge <nr> --squash --auto`. `enforce_admins` staat AAN; niets omzeilt de poort. Altijd
  `git fetch` + rebase vóór commit én push. Bij docs-conflicten: **UNION**, nooit `--ours`.
- **Routines (Claude Code on the web):** "ZZP auto-build" elke 4 uur (canonieke prompt:
  [`docs/ROUTINE-PROMPT.md`](docs/ROUTINE-PROMPT.md)) en "ZZP persona-sweep" dagelijks 07:00
  (prompt: [`docs/PERSONA-SWEEP-PROMPT.md`](docs/PERSONA-SWEEP-PROMPT.md), gaten-backlog:
  `docs/PERSONA-SWEEP-BACKLOG.md`). Beide starten met een **verse branch vanaf `origin/main`**
  (CLAUDE.md §3a) en eindigen met een PR. Vangnet `auto-pr-claude.yml` opent een PR bij een push
  naar `claude/**`. Linear wordt niet gebruikt.
- **Scope-restrictie routines (2-9-2026):** alleen kern + robuustheid/security/bugs. Ontzorgd/
  aangifte/KOR/fiscale uitbreidingen, academie, ideeën, design-lab, nieuwe rollen, nieuwe
  prijslijnen en i18n zijn **uitgesloten**. Zie `docs/ROUTINE-PROMPT.md` en CLAUDE.md.
- **Uit / niet operationeel (bewust, env-gestuurd):** billing (`BILLING_PROVIDER=noop`), e-mail
  (`EMAIL_DRIVER=noop`), documentopslag (`STORAGE_DRIVER=local`), echte verificatie-koppelingen
  (`DIPLOMA_VERIFIER`/`BIG_VERIFIER`/`IDENTITY_VERIFIER` = `mock`), gedeelde rate-limit-store
  (`RATE_LIMIT_STORE=memory`), web-push (geen VAPID-sleutels), aangifte-partner
  (`TAX_PARTNER_DRIVER` inert). Elke koppeling heeft een zelftest + aflever-heartbeat op
  `/admin/systeemstatus`.
- **Vóór échte productie (mensenwerk, zie MENSENWERK.md §0):** juridisch/AVG-review (blokkeert
  livegang met echte gevoelige documenten), productie-secrets, betalingen, echte verificatie-API's,
  e-mail, S3, eigen domein. Het juridische pakket staat als **concept v1.0**
  (`/voorwaarden`, `/privacy`, `/cookies` + `docs/legal/`, incl. `REVIEW-DOOR-JURIST.md` met 9
  open toetspunten); de externe jurist-review zelf blijft mensenwerk.

---

## NU — in uitvoering (2-9-2026): pakketten A–F

Zes parallelle builders op niet-overlappende bestanden. **Niet dubbel bouwen**; check `gh pr list`
vóór je iets uit deze lijst oppakt.

- **A — Prisma Migrate-baseline:** weg van `prisma db push` bij elke boot; baseline-migratie,
  ontbrekende indexen en een seed-guard zodat productie niet per ongeluk geseed wordt.
- **B — Querybudget:** budget/telling op shell + dashboard, eerste echte DB-integratietest, en de
  BTW-taak weg bij de opdrachtgever (hoort niet bij die rol).
- **C — CI + zoeken:** Postgres-e2e-job in CI (naast SQLite) en hoofdletterongevoelig zoeken.
- **D — Navigatie/IA:** taalwissel weg, zijbalk ≤ 11 items, functionele paginalabels i.p.v.
  motieven, zorg-focus in de marktplaats.
- **E — Routes/robuustheid:** design-lab ADMIN-only én uit de Docker-image, 17 dubbele routes →
  redirects, error boundaries per segment.
- **F — Documentatie/geheugen (dit pakket):** PROGRESS.md ≤ 400 regels + maandarchief,
  CURRENT_TASK.md ≤ 300 regels, modulekaart in ARCHITECTURE.md, routine-scope, ADR 0011.

---

## Openstaande backlog (bovenste eerst; pak er één, lever DoD-groen, push)

> De volledige "Gedaan (niet opnieuw)"-lijst staat in het archief. Alles hieronder is
> **geverifieerd nog open** op 2-9-2026.

### Product / kern

1. **Rooster-marktplaats — publiceerkant (opdrachtgever).** De discovery-kalender
   (`roster-market.ts` `buildRosterCalendar`, `/rooster`) staat, de ZZP'er claimt er direct één
   vanuit de kalender (`claimShift`/`ClaimShift`, hergebruikt de bestaande applicatieketen) en
   krijgt sinds 4-9 een dubbele-boeking-waarschuwing (`agendaDayBookingConflict`) op een dag waarop
   hij al is ingepland. **Nog open:** de opdrachtgever dateert/publiceert losse diensten (de
   claim-kant is dus af; alleen het publiceren van individuele diensten door de opdrachtgever rest).
2. **Lege-, laad- en fouttoestanden naar de Vakwerk-stijl** (PLAN-WERELDKLASSE Fase 2, restpunt).
3. **Mail-intake fase 3:** e2e-test webhook → reviewqueue → concept-opdracht. (Fase 1 + 2 en de
   meetlus zijn gebouwd; inbound-provider + MX/DNS is mensenwerk, MENSENWERK §2b.)
4. **Semantiek als uitlegbare scorecomponent** — fundering staat (`src/lib/semantic.ts` +
   `src/lib/services/semantic-matcher.ts`); pgvector blijft geparkeerd achter de ADR-trigger
   (`docs/decisions/0010-semantische-matching.md`: > ~50k discoverable profielen óf scoring
   > ~50 ms p95).

### Robuustheid / techniek

5. **Twee resterende flaky e2e-tests** (slagen op retry, `retries: 2` absorbeert ze — geen
   blocker): `critical-personas.spec.ts:111` (franchise onbestaand-id → 404, soms 200 op de eerste
   poging) en `support.spec.ts:53` (admin-helpdesk, login-timing).
6. **Componenttest `ExpiryOverviewCard`** (review-should-fix #371) — vergt jsdom/testing-library
   naast de Vitest-`node`-omgeving; alleen oppakken als die infra er toch komt.
7. **Perf-refactors (risky, apart oppakken):** `clientCredentialAlerts` overload met voorgefetchte
   rijen (2 queries minder per CLIENT-dashboard); `suggestedFreelancersForClient` fan-out (pool
   één keer fetchen, in-memory scoren); `savedJobIds`-query op `/opdrachten` in de bestaande
   `Promise.all` vouwen.

### Wacht op een eigenaarsbesluit (niet zelf oppakken)

> Voorstel voor de strategische keuzes: **ADR 0011 — focus & wig**
> ([`docs/decisions/0011-focus-en-wig.md`](docs/decisions/0011-focus-en-wig.md), status
> _voorgesteld_). Zolang die niet is aanvaard of verworpen, blijven de punten hieronder liggen.

- **Financiën-consolidatie:** bedragen staan op vijf plekken (dashboard-tegel, Administratie 2×,
  Inzicht, losse kaarten). Voorstel: Administratie = enige bron; dashboard/Inzicht alleen
  doorklik-samenvattingen. Herontwerp, geen incrementje.
- **Toezicht-tab "Integraties & security":** webhooks, malware-scans en CSP-meldingen zijn voor de
  admin onzichtbaar; plus een feed met platformwijzigingen.
- **Actie-engine-consolidatie:** `adminNextActions`/`franchiserNextActions` (`next-actions.ts`) en
  `pendingTasks()` (`actions/pending-tasks.ts`) zijn twee parallelle engines — #567 voedde
  maandenlang de dode. Samenvoegen tot één bron.
- **AVG — notificatie-bodies bij erasure:** een bedrijfsnaam blijft in oude notificaties van
  ontvangers staan na anonimisering (MIDDEL; zelfde aanpak als de auditlog-scrub nodig).
- **Ontwerp-lab archiveren:** de concepten staan nog in `src/`; verplaatsen naar een archiefmap
  buiten de app of een cap per reeks. (Pakket E haalt het lab uit de Docker-image en zet het
  ADMIN-only; de archivering zelf blijft open.)
- **Fee-transparantie-UI:** de fee als aparte regel voor béíde partijen op factuur + samenwerking.
  Geparkeerd tot billing aangaat (`docs/PRIJSADVIES.md`). Symmetrie is geverifieerd: geen
  role-conditional bedragen, tenant-fees in geen enkele partij-UI.
- **Invite-dedup + betaal-event-idempotentie (LAAG):** audit-metadata-string-match →
  `DomainEvent.dedupeKey`; provider-event-id expliciet vastleggen.
- **Web-push (VAPID):** code-kant af (env-validatie, half-activatie-guard, zelftest, heartbeat);
  sleutels genereren en zetten is mensenwerk.

### Mensenwerk (blokkeert livegang, niet door een agent te doen)

- **Juridisch/AVG-review** vóór livegang met echte gevoelige documenten (MENSENWERK §5).
- **E-mail-uitnodiging i.p.v. tijdelijk wachtwoord** bij de onboarding-import — vergt een
  werkende SMTP-/HTTP-mailkoppeling (MENSENWERK §2).
- **Productie-secrets** (`SHARE_TOKEN_SECRET`, `AUTH_URL`, sterke `AUTH_SECRET`), Upstash-Redis
  voor de gedeelde rate-limit-store, `DRILL_DATABASE_URL` voor de herstel-drill (MENSENWERK §1/§7).

---

## Per increment (geen uitzonderingen)

Testbare kern + unit-tests → UI → `npm run typecheck` / `npm run lint` / `npm run test` /
`npm run build` groen + `npx prettier --write .` → commit → **PR naar `main`** → **CI-poort
geverifieerd groen** (`gh pr checks <nr>`, citeer de uitkomst) → `gh pr merge <nr> --squash --auto`
→ werk PROGRESS.md + deze backlog bij.

## QUALITY_CHECKLIST (vóór commit)

```
npm install            # indien dependencies gewijzigd
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma db push     # of migrate, indien schema gewijzigd
npm run db:seed        # indien seed gewijzigd
```

Faalt iets → oorzaak onderzoeken, fixen, checks opnieuw. Pas daarna afvinken. Controleer de
testuitkomst op de `Test Files`/`Tests`-regel — een afgekapte tail verbergt een failure.
