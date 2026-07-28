# RUNBOOK — deploy, rollback, back-up/herstel, monitoring, incident

> Operationeel draaiboek voor het ZZP Platform in productie. Bedoeld voor wie de dienst beheert
> (niet per se de bouwer). Voor de eenmalige go-live-taken (accounts, secrets, juridisch): zie
> [`MENSENWERK.md`](../MENSENWERK.md). Voor architectuurbesluiten: [`docs/decisions/`](./decisions).

---

## 1. Architectuur in één oogopslag

- **Host:** Railway bouwt en deployt automatisch de **default branch `main`** via de `Dockerfile`
  (deterministische build, geen Nixpacks). Elke merge naar `main` → nieuwe deploy.
- **Runtime-start:** `scripts/start.mjs` (idempotent bij elke (her)start):
  1. Prisma-provider afstemmen op `DATABASE_URL` (`scripts/use-db-provider.mjs`).
  2. `prisma db push --skip-generate` — **additief, bewust ZONDER `--accept-data-loss`**: een
     destructieve schemawijziging laat de boot zichtbaar falen i.p.v. productiedata te wissen.
  3. Next.js-server starten op de door Railway aangereikte `PORT`.
  4. Referentie- (en met `SEED_DEMO=true` ook demo-)data **asynchroon** seeden, pas nadat
     `/api/health` lokaal 200 geeft — healthchecks wachten dus nooit op een seed.
- **Database:** PostgreSQL in productie (managed, EU-regio), SQLite lokaal. Provider-switch is
  automatisch op basis van `DATABASE_URL`. Bij horizontale schaling (meerdere instances): zet
  `DATABASE_CONNECTION_LIMIT` (optioneel `DATABASE_POOL_TIMEOUT`/`DATABASE_PGBOUNCER=true`) om de
  Prisma-pool per instance te begrenzen en het connectie-plafond van de managed DB te sparen
  (`src/lib/db-connection.ts`; zichtbaar op `/admin/systeemstatus`, zie `MENSENWERK.md` §0b/§1b).
- **Documentopslag:** privé S3-bucket bij `STORAGE_DRIVER=s3`; anders lokale map (pilot).
- **Cron:** GitHub Actions `run-all-tasks.yml` (dagelijks 05:00 UTC) roept `/api/tasks/run-all` aan
  met `Authorization: Bearer $CRON_SECRET`. Inert zonder `RUN_ALL_TASK_URL`/`CRON_SECRET`.

## 2. Gezondheids-endpoints (monitoring)

| Endpoint         | Doel                              | Gezond | Ongezond | Cache           |
| ---------------- | --------------------------------- | ------ | -------- | --------------- |
| `/api/health`    | Liveness (DB-ping)                | `200`  | `503`    | `force-dynamic` |
| `/api/readiness` | Readiness (DB + schema + drainen) | `200`  | `503`    | `force-dynamic` |

- Beide zijn **nooit gecachet** en bevatten geen PII/secrets (alleen een korte commit-hash).
- Hang een **uptime-monitor** (bv. de Railway-healthcheck + een externe pinger) op `/api/health`.
  Reageert hij met `503`, dan is de DB onbereikbaar → zie §6 (incident).
- Een DB-storing op `/api/health` wordt gerapporteerd via de observability-reporter (Sentry-ready
  zodra `SENTRY_DSN` gezet is; anders gestructureerd gelogd).
- **Graceful shutdown / drainen:** zodra de server een afsluitsignaal (SIGTERM/SIGINT — een
  Railway-redeploy of een operator die stopt) ontvangt, zet `/api/readiness` op `503` met veld
  `"draining": true`, terwijl `/api/health` bewust `200` blijft. Zo stopt de load balancer met nieuw
  verkeer naar de afsluitende instance, terwijl Next de lopende requests netjes afrondt. Sluit Next
  niet binnen `SHUTDOWN_FORCE_KILL_MS` af (default 25000 ms; geklemd [1000, 120000]), dan forceert
  `scripts/start.mjs` een `SIGKILL` zodat de deploy nooit blijft hangen. Een tweede afsluitsignaal
  forceert direct. Niets in te stellen voor de pilot.

### 2a. Metrics + alerting (`/api/metrics`)

Naast de liveness-probe exposeert `GET /api/metrics` machine-leesbare gauges (Prometheus-tekst, of
`?format=json`) voor een externe monitor — **zonder** admin-login. Beveiligd met dezelfde
`Authorization: Bearer $CRON_SECRET` als de taak-/heartbeat-routes (fail-closed: geen `CRON_SECRET`
→ 503, verkeerd token → 401), nooit gecachet, en de uitvoer bevat **geen** PII/secrets. Gauges o.a.:
`zzp_db_reachable`, `zzp_cron_heartbeat_stale`/`_ok`, `zzp_backup_heartbeat_stale`/`_ok`,
`zzp_verification_queue` + `_oldest_age_seconds`, `zzp_credentials_overdue_expiry`,
`zzp_subscriptions_overdue_expiry`, `zzp_invoices_overdue_unflipped`, `zzp_maintenance_mode`.

- **Kant-en-klare alerting-rules:** [`docs/observability/alerts.yml`](observability/alerts.yml) is een
  drop-in Prometheus-regelbestand dat die gauges vertaalt naar alerts met drempels + `for:`-duur
  (beschikbaarheid, dead-man's-switch, stille-faal-backlogs, verificatie-SLA, onderhoud). De kop van
  het bestand toont een voorbeeld-`scrape_config` met de bearer-auth. Laad het via `rule_files`.
- **Onderhoud onderdrukt paging:** gebruik `zzp_maintenance_mode == 1` als `inhibit_rule`-bron om de
  beschikbaarheidsalerts te dempen tijdens een geplande deploy; een per ongeluk aan-gelaten
  onderhoudsmodus blijft zichtbaar via de aparte info-alert `ZzpMaintenanceModeOn`.
- **Drift-gate:** een CI-test (`src/lib/observability/alerts-rules.test.ts`) klinkt de in `alerts.yml`
  gebruikte `zzp_*`-namen vast aan de gauges uit `buildMetrics` — een hernoemde/verwijderde gauge
  (dode alert) of een nieuwe gauge zonder alert breekt de poort.

## 3. Deploy

**Normale flow (aanbevolen):** merge een PR naar `main` na een groene CI-poort. Railway bouwt en
deployt automatisch. Geen handmatige stap.

**Vooraf (optioneel) — go-live preflight:** draai `npm run preflight` (of tegen de deploy-config
`railway run npm run preflight`) om de configuratie-posture buiten de app te controleren zonder een
draaiende server + admin-login. Het rapport toont per onderdeel (opslag, database, e-mail, betalingen,
verificatie-adapters, upload-scan, rate-limit-store, error-monitoring, taak-cron, deel-token-sleutel,
webadres, onderhoudsmodus, …) of het productie-klaar is (`[ ok ]`), op een veilige fallback draait
(`[info]`) of aandacht vraagt vóór livegang (`[ !! ]`), plus de boot-waarschuwingen en een
GO/NO-GO-oordeel. Exitcodes: `0` ok · `1` aandachtspunt in `--strict` · `2` ongeldige/ontbrekende
basisconfig (dan zou de boot óók falen). Vlaggen: `--strict` (aandachtspunten/waarschuwingen laten
de preflight falen — handig als CI-poort), `--json` (machineleesbaar). Toont **nooit** sleutelwaarden;
hergebruikt dezelfde gevalideerde logica als de boot (`validateEnv`) en `/admin/systeemstatus`
(`collectSystemStatus`).

**Verifiëren na een deploy:**

1. Wacht tot Railway "Success" toont.
2. `curl -fsS https://<host>/api/health` → verwacht `{"status":"ok","db":true,...}` met de
   **nieuwe** commit-hash.
3. `curl -fsS https://<host>/api/readiness` → verwacht `"ready":true`.
4. Steekproef: log in met een testaccount en open het dashboard.

**Handmatige (her)deploy:** Railway → project → Deployments → "Redeploy" op de gewenste commit.

## 4. Rollback

Er is **geen automatische productie-deploy buiten de merge→Railway-flow** (zie
[`docs/decisions/0001-deploy-gating.md`](./decisions/0001-deploy-gating.md)). Rollback bij een
kapotte deploy:

1. **Snelste weg (Railway):** Deployments → kies de laatste bekende goede deploy → **"Redeploy"**.
   Railway serveert die image opnieuw. Geen code-wijziging nodig.
2. **Via git (duurzaam):** `git revert <slechte-merge-commit>` op een branch → PR → merge naar
   `main`. Railway bouwt de teruggedraaide staat. Gebruik dit als de fout in de code zit en je de
   herstelde staat wilt vastleggen.
3. **Schema:** een teruggedraaide deploy draait opnieuw `prisma db push` (additief). Kolommen die
   een vorige deploy toevoegde blijven staan (onschadelijk). **Draai nooit een handmatige
   destructieve migratie terug op productie** zonder een geverifieerde back-up (§5).

> **Let op:** rollback herstelt de **code**, niet de **data**. Data-corruptie herstel je uit een
> back-up (§5), niet met een deploy-rollback.

## 5. Back-up & herstel (database)

**De databaseback-ups zijn de verantwoordelijkheid van de databasedienst** (managed Postgres:
Neon/Supabase/Railway Postgres). Dit is mensenwerk om aan te zetten — de app kan het niet.

**Instellen (eenmalig):**

1. Zet **automatische dagelijkse back-ups** aan bij je databasedienst (EU-regio).
2. Bewaar minimaal **7–30 dagen** aan snapshots; overweeg **point-in-time recovery** (PITR) voor
   gevoelige data.
3. Noteer wie toegang heeft tot het herstelproces.

**Handmatige back-up (ad hoc, vóór een risicovolle actie):** er is een veilige, retentie-bewuste
helper (`scripts/backup-db.ts`, pure kern `src/lib/ops/db-backup.ts` — getest). Hij weigert een
niet-PostgreSQL-`DATABASE_URL`, logt nooit het wachtwoord en snoeit oude dumps.

```bash
npm run db:backup                       # dump naar ./backups (of $BACKUP_DIR), behoud $BACKUP_RETENTION (14)
npm run db:backup -- --dir /pad --keep 7
npm run db:backup -- --dry-run          # toon wat er zou gebeuren, schrijf niets
```

Onder water: `pg_dump "$DATABASE_URL" --no-owner --no-privileges --format=custom --file=backups/zzp-backup-<UTC>.dump`.
De map `backups/` staat in `.gitignore` (dumps kunnen productiedata bevatten — nooit committen).

**Herstel (op een lege/nieuwe database — nooit blind over productie heen):** de helper weigert
standaard over `DATABASE_URL` (de bron) te herstellen; kies een leeg doel of geef bewust `--force`.

```bash
TARGET_DATABASE_URL="postgres://..." npm run db:restore -- backups/zzp-backup-XXXX.dump
npm run db:restore -- --target "postgres://..." --dry-run backups/zzp-backup-XXXX.dump
```

Onder water: `pg_restore --no-owner --no-privileges --clean --if-exists --dbname="$TARGET_DATABASE_URL" <bestand>`.
Beide vereisen de PostgreSQL-client (`pg_dump`/`pg_restore`) op het systeem.

**Herstel-oefening (aanbevolen vóór go-live):** herstel een back-up naar een **wegwerp-database**,
zet `DATABASE_URL` daarheen in een staging-omgeving, en verifieer met `/api/readiness` +
een steekproef. Een onbeproefde back-up is geen back-up.

**Back-up-heartbeat / dead-man's-switch:** laat de externe back-up-job (pg_dump/databasedienst) na
elke geslaagde dump pingen naar `POST /api/backups/heartbeat` met
`Authorization: Bearer $CRON_SECRET` (optioneel `{ "ok": false }` bij een mislukte run). Zo toont
`/admin/systeemstatus` (kaart "Database-back-up") of het back-up-schema nog draait — venster
instelbaar via `BACKUP_MAX_AGE_HOURS` (default 48 uur; zie `MENSENWERK.md` §11).

## 6. Incident-respons (beknopt)

1. **Vaststellen:** `/api/health` en `/api/readiness` checken; Railway-logs en (indien actief)
   Sentry bekijken. Reproduceer met een testaccount.
2. **Beperken:** is het een slechte deploy → **rollback (§4.1)**. Is het de DB → databasedienst-
   status checken; bij corruptie **niet** blijven schrijven, back-up-herstel voorbereiden (§5).
3. **Communiceren:** meld de status via het support-kanaal (`MENSENWERK.md` §6b).
4. **Herstellen & vastleggen:** fix via de normale PR→CI→merge-flow. Leg een betekenisvolle keuze
   vast als ADR in [`docs/decisions/`](./decisions) en werk `PROGRESS.md` bij.

**Veiligheidsregels tijdens een incident (hard):** nooit auth uitschakelen, nooit een check
verwijderen om "er langs te komen", nooit secrets in logs/chat plakken. Stop na 2 mislukte
herstelpogingen en escaleer naar een mens.

## 7. Secrets-rotatie

Secrets staan uitsluitend in de Railway-secrets-kluis (nooit in code/git/logs). Zie
[`MENSENWERK.md`](../MENSENWERK.md) §7 voor het volledige overzicht. Rotatie-aandachtspunten:

- **`AUTH_SECRET`** roteren logt alle actieve sessies uit (JWT's worden ongeldig). Doe dit bewust,
  bij voorkeur buiten piek. Minimaal 32 tekens (`openssl rand -base64 32`).
- **`SHARE_TOKEN_SECRET`** roteren breekt bestaande deelbare dossier-links. Communiceer vooraf.
  Ontbreekt hij, dan valt de code terug op `AUTH_SECRET` (env-validatie waarschuwt in productie).
- **Integratiesleutels** (`AWS_*`, `RESEND_API_KEY`, `MOLLIE_API_KEY`, verifier-keys) roteer je bij
  de betreffende leverancier en plak je in de Railway-secrets. De env-validatie (`src/lib/env.ts`)
  faalt de boot helder als een **ingeschakelde** integratie zijn sleutel mist — halve activering
  wordt bewust geweigerd.

## 9. Onderhoudsmodus (het platform tijdelijk offline halen)

Een operationele noodrem voor een geplande migratie, een database-herstel (§5) of een incident (§6):
in plaats van halfwerkende schermen of 500-fouten krijgt de bezoeker een rustige **503-onderhouds-
pagina** ("we zijn zo terug", met een `Retry-After`-hint). De gezondheids-probes (`/api/health`,
`/api/readiness`) blijven bereikbaar zodat de Railway-healthcheck de container **niet** herstart en
je uptime-monitor groen blijft. Bron van waarheid: `src/lib/maintenance.ts` (puur, getest) + de
middleware (`src/middleware.ts`, draait vóór auth/rol-guards).

**Aanzetten (Railway-secrets, geen redeploy van code nodig — alleen de env-variabele):**

1. Zet `MAINTENANCE_MODE=true`. Optioneel: `MAINTENANCE_MESSAGE="…"` (eigen bezoekerstekst) en
   `MAINTENANCE_RETRY_AFTER=600` (seconden; geklemd op [30, 86400], default 300).
2. Ingelogde **admins** mogen er standaard door om de deploy/migratie te verifiëren. Wil je een
   **volledige** afsluiting (bv. tijdens een DB-herstel), zet dan `MAINTENANCE_ALLOW_ADMIN=false`.
3. Verifieer: bezoekers krijgen 503, `/api/health` blijft 200. In productie logt de boot bovendien
   een waarschuwing (`envWarnings`) en `/admin/systeemstatus` toont "Onderhoudsmodus: aan" (aandacht).

**Uitzetten:** verwijder `MAINTENANCE_MODE` (of zet 'm op `false`). **Vergeet dit niet** na afloop —
zolang hij aan staat is het platform voor bezoekers onbereikbaar.

## 10. Handige verwijzingen

- Go-live-mensenwerk: [`MENSENWERK.md`](../MENSENWERK.md)
- Deploy-gating-besluit: [`docs/decisions/0001-deploy-gating.md`](./decisions/0001-deploy-gating.md)
- Env-validatie: `src/lib/env.ts` · start-script: `scripts/start.mjs`
- Observability: `src/lib/observability/` (logger, readiness, error-reporter)
- Onderhoudsmodus: `src/lib/maintenance.ts` · middleware: `src/middleware.ts`
