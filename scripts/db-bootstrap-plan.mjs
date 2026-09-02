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
//   - SQLite (lokaal + CI) → `db push` zoals voorheen. De migraties zijn Postgres-SQL; ze op SQLite
//     draaien kan niet en hoeft niet (wegwerpdatabases zonder productiedata).
//
// INCIDENT 2-9-2026 — DRIFT BIJ DE EERSTE MIGRATE-BOOT. De bestaande productiedatabase is ooit via
// `db push` aangemaakt (geen migratiehistorie). Het EERSTE idee was: staat het schema er al (tabel
// "User") zonder `_prisma_migrations`, markeer dan alléén "0_baseline" eenmalig als toegepast en
// laat `migrate deploy` de rest doen. Dat is FOUT zodra er drift is tussen "schema staat er" en
// "schema is gelijk aan wat de migraties samen zouden opleveren" — en precies dát deed zich voor:
// de boot-preflight faalde drie weken (RATE_LIMIT_STORE=redis, zie env.ts) VOORDAT dit bootstrapplan
// ooit draaide, terwijl `main` intussen 248 commits verder was. De productie-DB heeft dus nog het
// schema van vóór die stilstand — mist kolommen/tabellen die `prisma/schema.prisma` inmiddels wél
// kent. "0_baseline" blind als toegepast markeren zonder het schema eerst bij te werken, zou die
// drift laten staan: `migrate deploy` past daarna alleen de migraties NÁ de baseline toe, ervan
// uitgaand dat de baseline al klopt — runtime-fouten op ontbrekende kolommen zouden volgen.
//
// HERSTELVOLGORDE (uitsluitend wanneer het schema er al staat zónder migratiehistorie):
//   1. `prisma db push --skip-generate` (BEWUST zonder --accept-data-loss, zie db-sync.mjs) brengt
//      het schema daadwerkelijk bij op het huidige `prisma/schema.prisma` — dicht additieve drift.
//      Een DESTRUCTIEVE wijziging laat de boot bewust hard falen (data-bescherming) i.p.v. drift
//      stilzwijgend te accepteren.
//   2. Markeer ELKE migratiemap in `prisma/migrations` als toegepast, in volgorde (oplopend, dus
//      "0_baseline" eerst) — de map-inhoud is per definitie gelijk aan het schema dat de migratie
//      zou opleveren (de CI-job "migrations" bewaakt die belofte), en na stap 1 heeft de database
//      precies dat schema. De namen komen uit de map (start.mjs leest `prisma/migrations/`), nooit
//      hardcoded — een toekomstige migratiemap wordt hierdoor automatisch meegenomen.
//   3. `migrate deploy` als bevestiging: met alle migraties al gemarkeerd is dit een no-op, maar het
//      is de POORT — verschilt de historie toch (bv. een race met een andere replica), dan faalt
//      deze stap zichtbaar i.p.v. dat de boot stil doorgaat op een twijfelachtige staat.
//   Alle VOLGENDE boots (migratiehistorie bestaat al): alleen `migrate deploy`.
//
// Bewust GEEN stille terugval naar louter `db push` zonder de resolve-stappen: dat zou het verschil
// tussen "schema is bij" en "migratie is echt toegepast" wegpoetsen en de historie corrupt maken.

import { SCHEMA_SYNC_COMMAND } from "./db-sync.mjs";

/** De naam van de baseline-migratiemap (prisma/migrations/0_baseline). */
export const BASELINE_MIGRATION = "0_baseline";

/** Zet het schema idempotent op de database; bewust ZONDER --accept-data-loss. */
export const PUSH_COMMAND = SCHEMA_SYNC_COMMAND;

/** Markeert één migratiemap als toegepast op een database die al via db push is aangemaakt. */
export function resolveMigrationCommand(migrationName) {
  return `npx prisma migrate resolve --applied ${migrationName}`;
}

/** Backwards-compat alias: markeert specifiek de baseline-map als toegepast. */
export const RESOLVE_BASELINE_COMMAND = resolveMigrationCommand(BASELINE_MIGRATION);

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
 * @param {string[]} [input.migrationNames] - namen van de mappen in `prisma/migrations`, in
 *   oplopende volgorde (start.mjs leest deze uit de map — nooit hardcoden). Alleen gebruikt in het
 *   drift-herstelpad hieronder; default `[BASELINE_MIGRATION]` voor bestaande call-sites/tests.
 * @returns {{ step: "push" | "resolve-migration" | "migrate-deploy", command: string, reason: string, transition?: boolean }[]}
 */
export function planDbBootstrap({
  provider,
  hasMigrationsTable = false,
  hasUserTable = false,
  migrationNames = [BASELINE_MIGRATION],
}) {
  if (provider !== "postgresql") {
    return [
      {
        step: "push",
        command: PUSH_COMMAND,
        reason: "SQLite (lokaal/CI): schema rechtstreeks synchroniseren, geen migratiehistorie",
      },
    ];
  }

  /** @type {{ step: "push" | "resolve-migration" | "migrate-deploy", command: string, reason: string, transition?: boolean }[]} */
  const steps = [];

  // Alleen het drift-herstelpad als het schema er al staat zónder migratiehistorie. Op een lege
  // database (geen migratietabel, geen User-tabel) draait migrate deploy alle migraties gewoon zelf
  // — geen drift mogelijk op een database die nog nooit iets anders dan Migrate heeft gezien. Op een
  // database mét historie is er niets te herstellen.
  if (!hasMigrationsTable && hasUserTable) {
    // 1. Schema daadwerkelijk bijwerken (dicht drift sinds db push stopte werken — incident
    //    2-9-2026). Loopt via syncTransitionSchema() in start.mjs — NIET de gewone syncSchema()
    //    die de SQLite-"push"-stap hierboven gebruikt. `transition: true` is de marker die start.mjs
    //    laat weten dat dit de ENE toegestane plek is waar --accept-data-loss mag (uitsluitend met
    //    DB_TRANSITION_ACCEPT_DATA_LOSS=true, en pas na het luid loggen van de Prisma-waarschuwingen
    //    — zie scripts/db-sync.mjs syncTransitionSchema). Zonder die vlag gedraagt dit zich exact als
    //    de gewone syncSchema(): begrensde retry op transiënte fouten, harde/zichtbare boot-stop op
    //    een destructieve wijziging.
    steps.push({
      step: "push",
      command: PUSH_COMMAND,
      transition: true,
      reason:
        "bestaand schema zonder migratiehistorie, mogelijk met drift sinds db push stopte werken — schema eerst daadwerkelijk bijwerken vóór de migraties als toegepast gemarkeerd worden",
    });
    // 2. Elke migratiemap als toegepast markeren, in volgorde — na stap 1 heeft de database precies
    //    het schema dat deze migraties samen zouden opleveren.
    for (const name of migrationNames) {
      steps.push({
        step: "resolve-migration",
        command: resolveMigrationCommand(name),
        reason: `migratiemap "${name}" komt overeen met het net bijgewerkte schema — als toegepast markeren`,
      });
    }
  }

  // 3. Bevestiging (en op een lege/al-gemigreerde database: de enige stap). Met alles al gemarkeerd
  //    is dit een no-op; verschilt de historie toch (bv. een race met een andere replica), dan faalt
  //    deze stap zichtbaar i.p.v. de boot stil te laten doorgaan op een twijfelachtige staat.
  steps.push({
    step: "migrate-deploy",
    command: MIGRATE_DEPLOY_COMMAND,
    reason: "openstaande migraties toepassen (of bevestigen dat alles al is toegepast)",
  });

  return steps;
}
