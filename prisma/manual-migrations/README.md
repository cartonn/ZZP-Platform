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
geen `_prisma_migrations`-tabel; de boot markeert de baseline daarom eenmalig als toegepast
(`prisma migrate resolve --applied 0_baseline`) zodra het schema er al staat maar de historie
ontbreekt. Op een lege database draait `migrate deploy` de baseline gewoon zelf.

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
