# Migraties

## Hoe het schema op de database komt

| Omgeving                | Engine     | Mechanisme                                                 |
| ----------------------- | ---------- | ---------------------------------------------------------- |
| Productie (Railway)     | PostgreSQL | **Prisma Migrate** — `prisma migrate deploy` bij elke boot |
| Lokaal + CI (e2e, unit) | SQLite     | `prisma db push` (wegwerpdatabases, geen migratiehistorie) |

`scripts/start.mjs` beslist dat op basis van `DATABASE_URL`; de pure beslislogica staat in
`scripts/db-bootstrap-plan.mjs` en is unit-getest. De migraties zijn Postgres-SQL en worden nooit op
SQLite gedraaid.

**Baseline.** `prisma/migrations/0_baseline/` bevat het volledige schema zoals het op het moment van
invoering in productie stond. De bestaande productiedatabase is met `db push` opgebouwd en had nog
geen `_prisma_migrations`-tabel.

**Eerste Migrate-boot met mogelijke drift (incident 2-9-2026).** Blind de baseline als toegepast
markeren zonder het schema eerst bij te werken, is fout zodra er drift is tussen "schema staat er"
en "schema is gelijk aan wat de migraties samen zouden opleveren" — precies dat gebeurde toen de
boot-preflight drie weken NO-GO'de (RATE_LIMIT_STORE=redis, zie `src/lib/env.ts`) terwijl `main`
intussen doorbouwde: de productie-DB miste bij de eerste geslaagde boot kolommen/tabellen die
`prisma/schema.prisma` inmiddels wél kende. Daarom draait de boot, alléén wanneer het schema er al
staat (tabel `User`) maar `_prisma_migrations` ontbreekt, dit herstelpad:

1. `prisma db push --skip-generate` (bewust ZONDER `--accept-data-loss`) werkt het schema
   daadwerkelijk bij op het huidige `prisma/schema.prisma` — dicht additieve drift. Een
   DESTRUCTIEVE wijziging laat de boot bewust hard falen (data-bescherming); dat is gewenst, geen
   bug.
2. Elke migratiemap in `prisma/migrations/` wordt in oplopende volgorde als toegepast gemarkeerd
   (`prisma migrate resolve --applied <naam>`) — de mapnamen komen uit de map zelf (nooit
   hardcoded), en na stap 1 heeft de database precies het schema dat die migraties samen zouden
   opleveren (de CI-job `migrations` bewaakt die belofte).
3. `prisma migrate deploy` als bevestiging (no-op zodra alles gemarkeerd staat) — de echte poort:
   verschilt de historie toch, dan faalt deze stap zichtbaar.

Op een lege database (geen `User`-tabel, geen migratiehistorie) draait `migrate deploy` alle
migraties gewoon zelf — geen drift mogelijk. Alle volgende boots (migratiehistorie bestaat al):
alleen `migrate deploy`. Zie `scripts/db-bootstrap-plan.mjs` voor de volledige, unit-geteste
beslislogica.

## Een nieuwe migratie maken

1. Wijzig `prisma/schema.prisma`.
2. Start een lege Postgres als shadow-database:

   ```bash
   docker run --rm -d -p 5433:5432 -e POSTGRES_PASSWORD=shadow --name zzp-shadow postgres:16
   export SHADOW_DATABASE_URL="postgresql://postgres:shadow@localhost:5433/postgres?schema=public"
   ```

3. Genereer de migratie (mapnaam: `<YYYYMMDDHHMM>_<korte_naam>`):

   ```bash
   node scripts/use-db-provider.mjs postgresql
   mkdir -p "prisma/migrations/$(date +%Y%m%d%H%M)_mijn_wijziging"
   npx prisma migrate diff \
     --from-migrations prisma/migrations \
     --to-schema-datamodel prisma/schema.prisma \
     --shadow-database-url "$SHADOW_DATABASE_URL" \
     --script > "prisma/migrations/$(date +%Y%m%d%H%M)_mijn_wijziging/migration.sql"
   node scripts/use-db-provider.mjs sqlite   # provider-wijziging NOOIT committen
   ```

4. Lees de SQL na. Een `DROP`/`ALTER` die data raakt: splits 'm in expand → migreer → contract, zodat
   de oude en nieuwe code samen kunnen draaien tijdens een rolling deploy.
5. Controleer dat er geen drift meer is en commit:

   ```bash
   npm run db:check-migrations     # vergelijkt migraties met schema.prisma
   git diff prisma/schema.prisma   # mag alleen je modelwijziging bevatten, geen provider-switch
   ```

De GitHub-workflow `migrations` draait stap 5 op elke push en PR.

## `manual-migrations/` (los toe te passen SQL)

Deze map bevat **idempotente, auditbare SQL-bestanden** voor wie een schemawijziging liever
expliciet/los op de productie-Postgres toepast. Elk bestand is veilig meerdere keren te draaien
(`IF NOT EXISTS`) en raakt geen bestaande data. Nieuwe schemawijzigingen horen thuis in
`prisma/migrations/` — deze map is historie/safety-net.

```bash
psql "$DATABASE_URL" -f prisma/manual-migrations/<bestand>.sql
```

| Bestand                      | Wat                                                          | PR   |
| ---------------------------- | ------------------------------------------------------------ | ---- |
| `20260608_routing_cache.sql` | `GeocodeCache` + `TravelRouteCache` (reistijd-routing-cache) | #216 |
