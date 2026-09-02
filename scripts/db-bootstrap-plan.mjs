// Pure, testbare beslislogica voor het schema-bootstrapplan bij de (productie)start.
//
// Waarom apart: start.mjs is plain-JS die node rechtstreeks draait (geen bundling) en kan dus niet
// uit `@/lib` importeren. Deze .mjs-helper is wél door vitest importeerbaar — hetzelfde patroon als
// db-sync.mjs en shutdown-config.mjs.
//
// ACHTERGROND (het probleem dat dit oplost). Tot nu toe draaide productie bij ELKE boot
// `prisma db push`: geen migratiehistorie, geen rollback-pad, DDL-rechten nodig voor de
// runtime-user, en bij meerdere replica's voeren die replica's tegelijk DDL uit. Vanaf nu geldt:
//
//   - PostgreSQL (productie/Railway) → **Prisma Migrate**. `prisma/migrations/0_baseline` bevat het
//     volledige schema; elke volgende wijziging komt als eigen, gereviewde migratiemap. De boot
//     draait `prisma migrate deploy` — deterministisch, herhaalbaar, met historie in
//     `_prisma_migrations`.
//   - De bestaande productiedatabase is ooit via `db push` aangemaakt en kent die tabel nog niet.
//     Zolang `_prisma_migrations` ontbreekt terwijl het schema er al staat (de tabel "User"
//     bestaat), markeren we de baseline eenmalig als toegepast (`migrate resolve --applied
//     0_baseline`) — anders zou `migrate deploy` de baseline opnieuw willen draaien en falen op
//     bestaande tabellen. Op een lege database doet `migrate deploy` de baseline gewoon zelf.
//   - SQLite (lokaal + CI) → `db push` zoals voorheen. De migraties zijn Postgres-SQL; ze op SQLite
//     draaien kan niet en hoeft niet (wegwerpdatabases zonder productiedata).
//
// Bewust GEEN stille terugval naar `db push` als `migrate deploy` faalt: dat zou het verschil tussen
// "schema is bij" en "migratie is echt toegepast" weer wegpoetsen en de historie corrupt maken. Een
// falende migratie hoort de boot zichtbaar te laten stoppen.

import { SCHEMA_SYNC_COMMAND } from "./db-sync.mjs";

/** De naam van de baseline-migratiemap (prisma/migrations/0_baseline). */
export const BASELINE_MIGRATION = "0_baseline";

/** Zet het schema idempotent op de database (SQLite lokaal/CI); bewust ZONDER --accept-data-loss. */
export const PUSH_COMMAND = SCHEMA_SYNC_COMMAND;

/** Markeert de baseline als toegepast op een database die al via db push is aangemaakt. */
export const RESOLVE_BASELINE_COMMAND = `npx prisma migrate resolve --applied ${BASELINE_MIGRATION}`;

/** Past alle nog niet toegepaste migraties toe (productie). */
export const MIGRATE_DEPLOY_COMMAND = "npx prisma migrate deploy";

/**
 * Leid de Prisma-datasourceprovider af uit DATABASE_URL — dezelfde regel als
 * scripts/use-db-provider.mjs, zodat het bootstrapplan niet uit de pas kan lopen met het schema.
 * @param {string | undefined} databaseUrl
 * @returns {"postgresql" | "sqlite"}
 */
export function resolveDbProvider(databaseUrl) {
  return /^postgres(ql)?:\/\//.test(databaseUrl ?? "") ? "postgresql" : "sqlite";
}

/**
 * Bepaal welke commando's de boot moet draaien om het schema op de database te krijgen.
 *
 * @param {object} input
 * @param {"postgresql" | "sqlite"} input.provider
 * @param {boolean} [input.hasMigrationsTable] - bestaat `_prisma_migrations` al? (alleen Postgres)
 * @param {boolean} [input.hasUserTable] - is het schema al aanwezig (tabel "User")? (alleen Postgres)
 * @returns {{ step: "push" | "resolve-baseline" | "migrate-deploy", command: string, reason: string }[]}
 */
export function planDbBootstrap({ provider, hasMigrationsTable = false, hasUserTable = false }) {
  if (provider !== "postgresql") {
    return [
      {
        step: "push",
        command: PUSH_COMMAND,
        reason: "SQLite (lokaal/CI): schema rechtstreeks synchroniseren, geen migratiehistorie",
      },
    ];
  }

  /** @type {{ step: "push" | "resolve-baseline" | "migrate-deploy", command: string, reason: string }[]} */
  const steps = [];

  // Alleen baselinen als het schema er al staat zónder migratiehistorie. Op een lege database
  // (geen migratietabel, geen User-tabel) draait migrate deploy de baseline gewoon zelf; op een
  // database mét historie is er niets te baselinen.
  if (!hasMigrationsTable && hasUserTable) {
    steps.push({
      step: "resolve-baseline",
      command: RESOLVE_BASELINE_COMMAND,
      reason:
        "bestaand schema zonder migratiehistorie (aangemaakt met db push) — baseline eenmalig als toegepast markeren",
    });
  }

  steps.push({
    step: "migrate-deploy",
    command: MIGRATE_DEPLOY_COMMAND,
    reason: "openstaande migraties toepassen",
  });

  return steps;
}
