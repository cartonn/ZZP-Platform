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
- **Boot:** `scripts/start.mjs` draait preflight → `prisma migrate deploy` (zelf-baselinend; eenmalige
  transitie db push → resolve → deploy, zie RUNBOOK §8) → idempotente seed (alleen bij `SEED_DEMO=true`;
  destructieve reset alleen met `SEED_DEMO_RESET=true`). Geen `db push` meer in productie. Schemawijziging
  = migratie in `prisma/migrations/` (CI-job `migrations` bewaakt drift).
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
  (`DIPLOMA_VERIFIER`/`BIG_VERIFIER`/`IDENTITY_VERIFIER` = `mock`), web-push (geen VAPID-sleutels), aangifte-partner
  (`TAX_PARTNER_DRIVER` inert). Elke koppeling heeft een zelftest + aflever-heartbeat op
  `/admin/systeemstatus`. Rate-limit-store draait op Redis (`RATE_LIMIT_STORE=redis`, Railway-Redis).
- **Productie-bewaking:** `/api/health` geeft `commit` + `builtAt`; `monitor.yml` vergelijkt elke 10 min
  met `origin/main` en opent een issue met label `deploy-lag` bij achterstand. Les 12-8 t/m 2-9: drie
  weken geen geslaagde deploy zonder dat iemand het zag.
- **Vóór échte productie (mensenwerk, zie MENSENWERK.md §0):** juridisch/AVG-review (blokkeert
  livegang met echte gevoelige documenten), productie-secrets, betalingen, echte verificatie-API's,
  e-mail, S3, eigen domein. Het juridische pakket staat als **concept v1.0**
  (`/voorwaarden`, `/privacy`, `/cookies` + `docs/legal/`, incl. `REVIEW-DOOR-JURIST.md` met 9
  open toetspunten); de externe jurist-review zelf blijft mensenwerk.

---

## NU — bouwprogramma 2/3-9 afgerond (24 PR's, zie PROGRESS.md bovenaan)

Golf 1 (A–F), golf 2 (G, I, M, N, O, Q) en golf 3 (T, U, V, W) zijn gemerged; #1340 (route-dedup) en
#1353 (reactielimiet per maand) staan in de poort. Productie loopt gelijk met `main`. Volgende
increments komen uit de backlog hieronder; **niet dubbel bouwen** — check `gh pr list` eerst.

**5-9:** issue #329 (hangende action-respons in productie) bij de wortel gefixt — React-backport via
`patches/next+15.5.24.patch` + regressietests (zie PROGRESS.md bovenaan, ADR 0012); vervolg staat bij
punt 5 hieronder.

### Open uit het programma (hoogste waarde eerst)

1. **Signaal-snapshot per gebruiker** via de bestaande event-bus (handlers werken per-rol tellers bij,
   reconciliatie-taak als vangnet) zodat de app-shell met één query toe kan (nu 44/41/18/46 per rol; de
   losse vensters in `signals.ts`/`pending-tasks.ts` bestaan bewust — zie de commentaren bij runs 79/82,
   #1022, #1026 — dus niet "samenvoegen" maar vervangen door een snapshot).
2. **Factuur-cutover:** `Invoice.status` afleiden uit `lifecycleStatus`, legacy-takken uit
   `signals.ts`/`pending-tasks.ts` weg; `Account`/`Session`/`VerificationToken`/`CredentialVerification`/
   `VerificationRequest` droppen (0 referenties).
3. **Verrijkte routes naar hun hub-tab** — `/admin/audit` GEDAAN (CSV-export + telling in `AuditPanel`,
   route leidt nu permanent om naar `/admin/toezicht?tab=audit`). Rest: `/prognose` en `/verplichtingen`
   zijn FREELANCER-pagina's (geen admin-hub-tab); alleen oppakken als er een passende hub-tab voor komt.
4. `notFound()` onder een `loading.tsx` geeft HTTP 200 — GEDAAN (6-9, #1400): de maskerende loading-grenzen
   verwijderd/gescoopt naar `(index)`-route-groups voor de zes getroffen routes (4× `/franchise/*/[id]`,
   `certificaten/[id]/bewerken`, `kandidaten/vergelijk`); drift-vaste test `notfound-loading-masking.test.ts`.
5. **React-transitie commit niet na een server action (productiebuild)** — GEDAAN (5-9): wortel gevonden
   én gefixt via de React-backport `patches/next+15.5.24.patch` (ADR 0012); de nudge-workaround
   `action-replay.tsx` uit #1377 is verwijderd. Rest: de `clickUntilGone`/`window.stop()`-omwegen uit
   `e2e/_robust.ts` halen (~20 specs, één voor één op een productiebuild groen houden) en de 5 s-watchdog
   in `PendingSubmitButton` laten vervallen. Zie issue #329.
6. Rooster-begrip scherp definiëren (dashboard-weekstrip, /rooster, samenwerking-looptijd) — review-bevinding.

## Openstaande backlog (bovenste eerst; pak er één, lever DoD-groen, push)

> De volledige "Gedaan (niet opnieuw)"-lijst staat in het archief. Alles hieronder is
> **geverifieerd nog open** op 2-9-2026.

### Product / kern

1. **Rooster-marktplaats — publiceer-/claim-kant.** De discovery-kalender (`roster-market.ts`
   `buildRosterCalendar`, read-only `/rooster`) staat. Open: de opdrachtgever dateert losse
   diensten en de ZZP'er claimt er direct één vanuit de kalender.
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
