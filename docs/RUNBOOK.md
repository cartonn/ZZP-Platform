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
  automatisch op basis van `DATABASE_URL`.
- **Documentopslag:** privé S3-bucket bij `STORAGE_DRIVER=s3`; anders lokale map (pilot).
- **Cron:** GitHub Actions `run-all-tasks.yml` (dagelijks 05:00 UTC) roept `/api/tasks/run-all` aan
  met `Authorization: Bearer $CRON_SECRET`. Inert zonder `RUN_ALL_TASK_URL`/`CRON_SECRET`.

## 2. Gezondheids-endpoints (monitoring)

| Endpoint         | Doel                    | Gezond | Ongezond | Cache           |
| ---------------- | ----------------------- | ------ | -------- | --------------- |
| `/api/health`    | Liveness (DB-ping)      | `200`  | `503`    | `force-dynamic` |
| `/api/readiness` | Readiness (DB + schema) | `200`  | `503`    | `force-dynamic` |

- Beide zijn **nooit gecachet** en bevatten geen PII/secrets (alleen een korte commit-hash).
- Hang een **uptime-monitor** (bv. de Railway-healthcheck + een externe pinger) op `/api/health`.
  Reageert hij met `503`, dan is de DB onbereikbaar → zie §6 (incident).
- Een DB-storing op `/api/health` wordt gerapporteerd via de observability-reporter (Sentry-ready
  zodra `SENTRY_DSN` gezet is; anders gestructureerd gelogd).

## 3. Deploy

**Normale flow (aanbevolen):** merge een PR naar `main` na een groene CI-poort. Railway bouwt en
deployt automatisch. Geen handmatige stap.

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

**Handmatige back-up (ad hoc, vóór een risicovolle actie):**

```bash
pg_dump "$DATABASE_URL" --no-owner --format=custom --file=backup-$(date +%Y%m%d-%H%M%S).dump
```

**Herstel (op een lege/nieuwe database — nooit blind over productie heen):**

```bash
pg_restore --no-owner --clean --if-exists --dbname="$TARGET_DATABASE_URL" backup-XXXX.dump
```

**Herstel-oefening (aanbevolen vóór go-live):** herstel een back-up naar een **wegwerp-database**,
zet `DATABASE_URL` daarheen in een staging-omgeving, en verifieer met `/api/readiness` +
een steekproef. Een onbeproefde back-up is geen back-up.

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

## 8. Handige verwijzingen

- Go-live-mensenwerk: [`MENSENWERK.md`](../MENSENWERK.md)
- Deploy-gating-besluit: [`docs/decisions/0001-deploy-gating.md`](./decisions/0001-deploy-gating.md)
- Env-validatie: `src/lib/env.ts` · start-script: `scripts/start.mjs`
- Observability: `src/lib/observability/` (logger, readiness, error-reporter)
