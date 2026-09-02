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
  2. Schema bijwerken — **PostgreSQL draait op Prisma Migrate**: `prisma migrate deploy` past
     uitsluitend de gereviewde migraties uit `prisma/migrations/` toe en houdt de historie bij in
     `_prisma_migrations`. Staat het schema er al zonder die tabel (de database is ooit met
     `db push` opgebouwd), dan wordt `0_baseline` eenmalig als toegepast gemarkeerd. Faalt de
     migratie, dan stopt de boot zichtbaar — **er is bewust geen terugval op `db push`**. SQLite
     (lokaal/CI) blijft `prisma db push --skip-generate`, zonder `--accept-data-loss`. Beslislogica:
     `scripts/db-bootstrap-plan.mjs`; nieuwe migratie maken: `prisma/manual-migrations/README.md`.
  3. Next.js-server starten op de door Railway aangereikte `PORT`.
  4. Referentie- (en met `SEED_DEMO=true` ook demo-)data **asynchroon** seeden, pas nadat
     `/api/readiness` lokaal 200 geeft — healthchecks wachten dus nooit op een seed.
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
- **Harde time-out op de DB-probes:** beide probes doen een DB-round-trip binnen een harde deadline
  (`HEALTH_PROBE_TIMEOUT_MS`, default 3000 ms, geklemd 250–30000). Een DB die de verbinding openhoudt
  maar niet meer antwoordt (pool-uitputting, lock-contentie, netwerk-partitie met open socket) laat de
  probe zo **niet oneindig hangen**: een verlopen probe telt als `degraded`/`not ready` (`503`), nooit
  als vals groen. Zet op `0` om de deadline bewust uit te schakelen (onbeperkt wachten).
- **Graceful shutdown / drainen (twee fasen, zero-downtime redeploy):** zodra de server een
  afsluitsignaal (SIGTERM/SIGINT — een Railway-redeploy of een operator die stopt) ontvangt, verloopt
  de afsluiting in twee fasen zodat een rolling redeploy geen verkeer verliest:
  1. **Drain-fase:** `/api/readiness` gaat op `503` met veld `"draining": true` (via een intern
     SIGUSR2-signaal), terwijl `/api/health` bewust `200` blijft **en de HTTP-server open blijft en
     gewoon requests bedient**. Zo krijgt de load balancer de tijd om deze instance uit de rotatie te
     halen vóór de socket sluit — nieuw verkeer dat hij nog even doorstuurt krijgt géén
     connection-reset. Duur: `SHUTDOWN_DRAIN_MS` (default **5000 ms in productie**, `0` daarbuiten;
     geklemd [0, 60000]).
  2. **Close-fase:** ná het drain-venster laat `scripts/start.mjs` Next de HTTP-server netjes sluiten
     (lopende requests afronden, nieuwe weigeren). Sluit Next niet binnen `SHUTDOWN_FORCE_KILL_MS`
     (default 25000 ms; geklemd [1000, 120000]), dan volgt een `SIGKILL` zodat de deploy nooit blijft
     hangen.

  Een tweede afsluitsignaal slaat het drain-venster over en forceert direct. Niets in te stellen voor
  de pilot; verhoog `SHUTDOWN_DRAIN_MS` alleen als je load balancer trager dan ~5 s uit de rotatie
  haalt (houd het ruim onder de host-kill-grace zodat de container nooit mid-drain een SIGKILL krijgt).

### 2a. Metrics + alerting (`/api/metrics`)

Naast de liveness-probe exposeert `GET /api/metrics` machine-leesbare gauges (Prometheus-tekst, of
`?format=json`) voor een externe monitor — **zonder** admin-login. Beveiligd met dezelfde
`Authorization: Bearer $CRON_SECRET` als de taak-/heartbeat-routes (fail-closed: geen `CRON_SECRET`
→ 503, verkeerd token → 401), nooit gecachet, en de uitvoer bevat **geen** PII/secrets. Gauges o.a.:
`zzp_db_reachable`, `zzp_cron_heartbeat_stale`/`_ok`, `zzp_backup_heartbeat_stale`/`_ok`,
`zzp_verification_queue` + `_oldest_age_seconds`, `zzp_credentials_overdue_expiry`,
`zzp_subscriptions_overdue_expiry`, `zzp_invoices_overdue_unflipped`, `zzp_maintenance_mode`.

- **Complete drop-in bundle:** de map [`docs/observability/`](observability/) bevat drie samenhangende
  bestanden die een operator ongewijzigd kan inladen:
  - [`alerts.yml`](observability/alerts.yml) — Prometheus-regels die de gauges vertalen naar alerts met
    drempels + `for:`-duur (beschikbaarheid, dead-man's-switch, stille-faal-backlogs, verificatie-SLA,
    onderhoud).
  - [`prometheus.yml`](observability/prometheus.yml) — scrape-config die `/api/metrics` met bearer-auth
    (`credentials_file`, secret buiten git) scraped en `alerts.yml` via `rule_files` laadt.
  - [`alertmanager.yml`](observability/alertmanager.yml) — routing-skelet (severity → receiver) +
    `inhibit_rules`.
- **Scrape-deadman (totale storing):** alle waarde-alerts evalueren over de gescrapete gauges. Valt de
  scrape zélf weg (app down, endpoint 503, geroteerde `CRON_SECRET`, netwerk/TLS), dan is er geen data en
  vuurt geen van die alerts. `ZzpTargetDown` (`up == 0`, scrape faalt) en `ZzpMetricsAbsent`
  (`absent(zzp_up)`, gauges ontbreken) dekken juist die blinde vlek — beide `critical`, met `for: 5m` om
  een normale deploy-blip te overbruggen. Zonder hen is de hele bundle stil blind bij de ergste storing.
- **Onderhoud onderdrukt paging:** de belofte wordt nu waargemaakt in `alertmanager.yml`. Zodra
  `ZzpMaintenanceModeOn` (`zzp_maintenance_mode == 1`) vuurt, dempt Alertmanager **elke** operationele
  alert — geen valse paging tijdens een geplande deploy. De onderhoudsalert zelf blijft zichtbaar, zodat
  een per ongeluk aan-gelaten onderhoudsmodus opvalt. Twee extra wortel-oorzaak-inhibities dempen
  `ZzpCronLastRunFailed` onder `ZzpCronStale` en `ZzpBackupLastFailed` onder `ZzpBackupStale`.
- **Drift-gates:** twee CI-tests houden de bundle eerlijk. `alerts-rules.test.ts` klinkt de in
  `alerts.yml` gebruikte `zzp_*`-namen vast aan de gauges uit `buildMetrics` (dode/ontbrekende gauge
  breekt de poort). `monitoring-bundle.test.ts` klinkt de drie bestanden aan elkaar vast: de scrape-config
  moet naar `/api/metrics` wijzen en `alerts.yml` laden, elke door `alertmanager.yml` gerefereerde alert
  moet écht bestaan, en de onderhouds-inhibitie moet **elke** operationele alert dekken — een nieuwe alert
  in `alerts.yml` die niet aan de inhibitie wordt toegevoegd breekt de poort (zodat 'ie niet stil door de
  onderhouds-demping heen paget).
- **Scrape-hardening (bounded-parallel + deadline):** de scrape verzamelt ~18 onafhankelijke
  backlog-tellingen. Die lopen **bounded-parallel** (env `METRICS_COLLECT_CONCURRENCY`, default 4 — laag
  genoeg om de Prisma-connectiepool niet te monopoliseren) achter een **harde deadline**
  (`METRICS_COLLECT_TIMEOUT_MS`, default 5000 ms, geklemd [250, 30000]; `0`/`off` schakelt de deadline
  bewust uit). Zonder deze grens laat een trage/gelockte DB elke scrape stapelen en connecties vasthouden
  — dezelfde hang-klasse die de health/readiness-probes al met `withProbeTimeout` afvangen. Overschrijdt de
  DB-collectie de deadline, dan wordt de scrape **afgekapt**: de reeds afgeronde tellingen worden
  geëxposeerd, de rest houdt zijn default (0), en de gauge `zzp_metrics_collection_complete` gaat op **0**
  zodat een monitor die vals-lage nullen **niet** als gezond leest (alert `ZzpMetricsCollectionIncomplete`).
  Bij 1 rondde de collectie volledig binnen de deadline af.

### 2b. Semantische matching (pgvector) provisioneren

Matching (`src/lib/services/semantic-matcher.ts`) draait standaard op de deterministische
`LocalSemanticMatcher` (`SEMANTIC_MATCHER=local`, productie-geschikt). `SEMANTIC_MATCHER=pgvector`
valt vandaag **graceful terug** op diezelfde lokale matcher zolang pgvector niet operationeel is
(`isOperational()` → false) — geen stille degradatie meer, maar ook nog geen echte semantische
matching. Om pgvector daadwerkelijk in gebruik te nemen:

1. Zet de **`vector`-extensie** aan op de managed Postgres (`CREATE EXTENSION IF NOT EXISTS vector;`).
2. Voeg een **embedding-kolom** toe en vul die via een embedding-pipeline (batch of on-write) voor de
   relevante entiteiten (bv. opdrachten/profielen).
3. Bouw een **ANN-index** op die kolom (bv. HNSW of IVFFlat) voor snelle nearest-neighbour-lookups.
4. Implementeer de echte capability-check in `PgVectorSemanticMatcher.isOperational()` (nu een stub)
   zodat het systeem pas als "operationeel" meldt als extensie, kolom en index daadwerkelijk aanwezig
   en bruikbaar zijn.
5. Zet `SEMANTIC_MATCHER=pgvector` en bevestig via de **semantische-matching-zelftest** op
   `/admin/systeemstatus` (en de go-live-sweep) dat de driver echt operationeel is en een plausibele
   round-trip geeft — niet alleen dat de env-variabele staat. `/admin/systeemstatus` toont de status
   in de groep "Schaalbaarheid" (`ok` = local, `attention` = pgvector geselecteerd maar niet
   operationeel in productie).

Zie ook `MENSENWERK.md` §0b voor de mensenwerk-samenvatting.

## 3. Deploy

**Normale flow (aanbevolen):** merge een PR naar `main` na een groene CI-poort. Railway bouwt en
deployt automatisch. Geen handmatige stap.

**Automatische bootpoort:** `scripts/start.mjs` draait in `NODE_ENV=production` vóór elke schema-
of serverstart de go-live-preflight. `DEPLOYMENT_STAGE=production` (ook de veilige default als de
variabele ontbreekt) gebruikt `--strict`: elk productie-aandachtspunt stopt de nieuwe deployment,
zodat Railway de laatst bekende gezonde versie blijft serveren. Alleen een testomgeving met
uitsluitend fictieve data mag expliciet `DEPLOYMENT_STAGE=demo` gebruiken; daar blijft dezelfde
preflight adviserend en wordt de demo-stage zichtbaar als aandachtspunt gerapporteerd.

**Vooraf (handmatig aanvullend) — go-live preflight:** draai `npm run preflight` (of tegen de deploy-config
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
3. **Schema:** een teruggedraaide deploy draait `prisma migrate deploy` opnieuw. Migraties die al
   toegepast zijn, worden overgeslagen — een rollback van de code draait het schema dus **niet**
   terug. Kolommen die een vorige deploy toevoegde blijven staan (onschadelijk). Moet een migratie
   echt terug, schrijf dan een nieuwe, vooruit-gerichte migratie; **draai nooit een handmatige
   destructieve migratie terug op productie** zonder een geverifieerde back-up (§5). Daarom horen
   dataraakende wijzigingen gesplitst te worden in expand → migreer → contract, zodat oude en nieuwe
   code tijdens een rolling deploy naast elkaar kunnen draaien.

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
npm run db:backup -- --no-verify        # sla de integriteitscheck over (of BACKUP_SKIP_VERIFY=1)
```

Onder water: `pg_dump "$DATABASE_URL" --no-owner --no-privileges --format=custom --file=backups/zzp-backup-<UTC>.dump`.
De map `backups/` staat in `.gitignore` (dumps kunnen productiedata bevatten — nooit committen).

**Integriteitsverificatie (standaard AAN):** ná de dump leest de helper de inhoudsopgave met
`pg_restore --list <bestand>` (zonder iets te herstellen) en snoeit de retentie **pas** als het
archief geldig/volledig blijkt. Een corrupte/afgekapte dump (bv. schijf vol halverwege) wordt
verwijderd en de bestaande back-ups blijven **ongemoeid** — zo kan een mislukte run nooit stil je
goede back-ups wegsnoeien ("een onbeproefde back-up is geen back-up"). Zet de check uit met
`--no-verify` of `BACKUP_SKIP_VERIFY=1` als `pg_restore` niet op het systeem staat.

**Herstel (op een lege/nieuwe database — nooit blind over productie heen):** de helper weigert
standaard over `DATABASE_URL` (de bron) te herstellen; kies een leeg doel of geef bewust `--force`.

```bash
TARGET_DATABASE_URL="postgres://..." npm run db:restore -- backups/zzp-backup-XXXX.dump
npm run db:restore -- --target "postgres://..." --dry-run backups/zzp-backup-XXXX.dump
```

Onder water: `pg_restore --no-owner --no-privileges --clean --if-exists --dbname="$TARGET_DATABASE_URL" <bestand>`.
Beide vereisen de PostgreSQL-client (`pg_dump`/`pg_restore`) op het systeem.

**Herstel-drill (geautomatiseerd — bewijst dat een back-up ÉCHT herstelbaar is):** de
integriteitsverificatie hierboven leest alléén de inhoudsopgave (`pg_restore --list`, TOC). Dat
bewijst dat de kop leesbaar is, niet dat de dump volledig te herstellen is — een corrupte data-block
of afgekapte object-data kan de TOC-check passeren en pas op een echt herstel falen. De drill
(`scripts/backup-restore-drill.ts`, pure kern in `src/lib/ops/db-backup.ts` — getest) sluit dat gat:
hij herstelt de **nieuwste** back-up in een **wegwerp scratch-database** en leest daarna het schema
(aantal `public`-tabellen) + de data (rijen in een verificatietabel) terug.

```bash
DRILL_DATABASE_URL="postgres://.../drill" npm run db:restore-drill        # nieuwste back-up in ./backups
npm run db:restore-drill -- --target "postgres://.../drill" --file backups/zzp-backup-XXXX.dump
npm run db:restore-drill -- --table Job          # andere verificatietabel (default "User")
npm run db:restore-drill -- --dry-run --target "postgres://.../drill"     # toon plan, herstel niets
```

Veilig: het doel is **uitsluitend** `DRILL_DATABASE_URL`/`--target` en de drill weigert hard als dat
gelijk is aan de bron-`DATABASE_URL` — een drill kent bewust **geen `--force`** (een drill die de
productie kan raken is geen drill). **Privacy:** de drill herstelt een volledige productie-back-up
(namen, e-mail, IBAN/KvK/btw, VOG/BIG/diploma-metadata) en **ruimt de scratch-database daarom ná de
verificatie ALTIJD op** (drop `public`-schema, ook wanneer de drill faalt) zodat er geen langlevende
PII-schaduwkopie achterblijft (AVG art. 5(1)(c)/5(1)(e)/32). Lukt het opruimen niet, dan waarschuwt de
drill luid — ruim de scratch-database dan handmatig op. **Mensenwerk (blijft):** wijs `DRILL_DATABASE_URL`
naar een **lege wegwerp-Postgres met dezelfde beveiliging als productie** (encryptie-at-rest,
netwerk-isolatie, toegangscontrole) — de drill dicht het retentievenster in code, maar de vertrouwelijkheid
van het scratch-doel zelf is een infra-keuze. Draai dit periodiek (bv. maandelijks) en na een schema-migratie.
Alternatief handmatig: herstel naar een wegwerp-database, zet `DATABASE_URL` daarheen in staging en
verifieer met `/api/readiness` + een steekproef. Een onbeproefde back-up is geen back-up.

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
