# Handmatige migraties (`prisma/manual-migrations/`)

Dit project gebruikt **`prisma db push`** (geen Prisma Migrate / `prisma/migrations/`):
het schema wordt op de database gezet door `scripts/start.mjs`, dat bij elke productie-
(her)start `npx prisma db push --skip-generate` draait. Schemawijzigingen — zoals nieuwe
kolommen, indexes en tabellen — worden zo **automatisch en additief** toegepast bij de
volgende deploy. Een aparte migratie is daarvoor normaal **niet nodig**.

Deze map bevat **idempotente, auditbare SQL-bestanden** als safety-net voor wie een
schemawijziging liever **expliciet/los** op de productie-Postgres toepast (bijv. vóór een
deploy, of om de wijziging zichtbaar in versiebeheer te hebben). Elk bestand is veilig
meerdere keren te draaien (`IF NOT EXISTS`) en raakt geen bestaande data.

Toepassen:

```bash
psql "$DATABASE_URL" -f prisma/manual-migrations/<bestand>.sql
```

| Bestand                      | Wat                                                          | PR   |
| ---------------------------- | ------------------------------------------------------------ | ---- |
| `20260608_routing_cache.sql` | `GeocodeCache` + `TravelRouteCache` (reistijd-routing-cache) | #216 |
