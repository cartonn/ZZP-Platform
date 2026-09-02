// Productie-start (Railway). Idempotent en veilig bij elke (her)start:
//  1. zorg dat de Prisma-provider past bij DATABASE_URL;
//  2. breng het schema op de database — zie het BESLUIT hieronder;
//  3. start de Next.js-server op de door Railway aangereikte PORT;
//  4. seed referentie- en eventueel demo-data asynchroon nadat /api/readiness echt gezond is,
//     zodat Railway-healthchecks nooit wachten op een seed.
//
// BESLUIT (schema-bootstrap): PostgreSQL draait op **Prisma Migrate**, SQLite op `db push`.
//   - Waarom: `db push` bij elke boot gaf geen migratiehistorie, geen rollback-pad, vereiste
//     permanente DDL-rechten voor de runtime-user en liet bij meerdere replica's gelijktijdig DDL
//     lopen. `prisma migrate deploy` past uitsluitend gereviewde, versiebeheerde migraties toe,
//     houdt de historie bij in `_prisma_migrations` en serialiseert replica's via een
//     advisory lock.
//   - Baseline: de bestaande productiedatabase is met `db push` opgebouwd en heeft nog geen
//     migratiehistorie. Staat het schema er al (tabel "User") zonder `_prisma_migrations`, dan
//     markeren we `0_baseline` eenmalig als toegepast. Op een lege database draait
//     `migrate deploy` de baseline gewoon zelf.
//   - GEEN stille terugval naar `db push` als `migrate deploy` faalt: dat zou de historie corrupt
//     maken en het verschil tussen "toegepast" en "toevallig bij" wegpoetsen. Falen = boot stopt.
//   - SQLite (lokaal/CI) blijft `db push`: de migraties zijn Postgres-SQL, en die databases zijn
//     wegwerpbaar zonder productiedata.
//   De pure beslislogica staat in scripts/db-bootstrap-plan.mjs (unit-getest).
import { execSync, spawn } from "node:child_process";
import http from "node:http";
import { createRequire } from "node:module";
import { resolveDrainMs, resolveForceKillMs } from "./shutdown-config.mjs";
import { backoffDelayMs, resolveDbSyncRetry, syncSchema } from "./db-sync.mjs";
import { planDbBootstrap, resolveDbProvider } from "./db-bootstrap-plan.mjs";

const require = createRequire(import.meta.url);

const run = (cmd, env = process.env) => execSync(cmd, { env, stdio: "inherit" });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

// Automatische releasepoort vóór ELKE productiestart. Veilig default = strict/productie;
// uitsluitend een expliciet gemarkeerde demo-omgeving mag met fallbacks doorstarten. De preflight
// toont nooit secretwaarden en draait vóór schemawijzigingen of het openen van de HTTP-poort.
if (process.env.NODE_ENV === "production") {
  run(
    process.env.DEPLOYMENT_STAGE === "demo" ? "npm run preflight" : "npm run preflight -- --strict",
  );
}

run("node scripts/use-db-provider.mjs");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Kijk in de Postgres-catalogus of de migratiehistorie (`_prisma_migrations`) en het schema zelf
 * (tabel "User") al bestaan. Dat bepaalt of de baseline eenmalig gemarkeerd moet worden.
 *
 * Begrensde retry met dezelfde parameters als de schema-sync: tijdens een Railway-redeploy is de
 * database soms enkele seconden onbereikbaar en dat mag de boot niet spurious laten falen. Gebruikt
 * de al aanwezige Prisma-client (geen extra dependency); `current_schemas(false)` respecteert de
 * search_path die Prisma uit de `?schema=`-parameter van DATABASE_URL zet.
 * @returns {Promise<{ hasMigrationsTable: boolean, hasUserTable: boolean }>}
 */
async function inspectPostgresSchema() {
  const { maxRetries, baseDelayMs, maxDelayMs } = resolveDbSyncRetry(process.env);
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient();
  try {
    for (let attempt = 0; ; attempt += 1) {
      try {
        /** @type {{ table_name: string }[]} */
        const rows = await client.$queryRaw`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = ANY (current_schemas(false))
            AND table_name IN ('_prisma_migrations', 'User')
        `;
        const present = new Set(rows.map((row) => row.table_name));
        return {
          hasMigrationsTable: present.has("_prisma_migrations"),
          hasUserTable: present.has("User"),
        };
      } catch (error) {
        if (attempt >= maxRetries) throw error;
        const delay = backoffDelayMs(attempt + 1, baseDelayMs, maxDelayMs);
        console.warn(
          `[db] databasestatus nog niet op te vragen — poging ${attempt + 1}/${maxRetries} over ${delay}ms opnieuw`,
        );
        await wait(delay);
      }
    }
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

/**
 * Voer het bootstrapplan uit. Elk commando draait via `syncSchema`, dat begrensde retry doet op
 * TRANSIËNTE onbereikbaarheid en METEEN faalt op een fatale fout (destructieve wijziging, mislukte
 * migratie) — zodat een retry nooit een echt schema-/dataprobleem maskeert.
 */
async function bootstrapDatabase() {
  const provider = resolveDbProvider(process.env.DATABASE_URL);
  const inspection =
    provider === "postgresql"
      ? await inspectPostgresSchema()
      : { hasMigrationsTable: false, hasUserTable: false };
  const steps = planDbBootstrap({ provider, ...inspection });

  for (const { step, command, reason } of steps) {
    console.log(`[db] ${step}: ${reason}`);
    if (step === "resolve-baseline") {
      // Best-effort: bij twee gelijktijdig opstartende replica's markeert er één de baseline en
      // krijgt de ander "already recorded as applied". Dat is geen fout. Ging het écht mis, dan
      // faalt `migrate deploy` hierna alsnog hard op de al bestaande tabellen — dat is de poort.
      try {
        run(command);
      } catch {
        console.warn(
          "[db] baseline-markering ging niet door (mogelijk al gezet door een andere instance) — migrate deploy is de poort",
        );
      }
      continue;
    }
    await syncSchema({ log: console, command });
  }
}

await bootstrapDatabase();

const seedDemo = process.env.SEED_DEMO === "true";

async function waitForLocalReadiness(port, attempts = 90) {
  const url = `http://127.0.0.1:${port}/api/readiness`;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const ok = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return true;
    await wait(1000);
  }
  return false;
}

const startBackgroundSeed = async () => {
  const ready = await waitForLocalReadiness(port);
  if (!ready) {
    console.error("[start] seed overgeslagen: lokale /api/readiness werd niet tijdig gezond");
    return;
  }
  console.log(
    seedDemo
      ? "[start] referentie- en rijke demo-data seeden op de achtergrond (SEED_DEMO=true)"
      : "[start] referentiedata seeden op de achtergrond",
  );
  const child = spawn("npx", ["prisma", "db", "seed"], {
    env: process.env,
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (code === 0) {
      console.log("[start] achtergrond-seed afgerond");
      return;
    }
    console.error(
      `[start] achtergrond-seed faalde${signal ? ` door signaal ${signal}` : ` met exitcode ${code}`}`,
    );
  });
};

const port = process.env.PORT ?? "3000";
console.log(`[start] Next.js start op poort ${port}`);
// Next DIRECT spawnen (node op de resolved next-bin), NIET via `npx`. Reden: `start.mjs` moet de
// directe parent van het Next-proces zijn zodat afsluitsignalen rechtstreeks aankomen. De npm/npx-
// wrapper heeft géén SIGUSR2-handler en wordt door de default-dispositie beëindigd i.p.v. het signaal
// door te sturen — empirisch geverifieerd (node 22 / npm 10.9): `wrapper.kill("SIGUSR2")` sluit de
// wrapper met signal=SIGUSR2 en het kind ontvangt niets. Direct spawnen levert SIGUSR2 (drain-fase)
// én SIGTERM (close-fase) betrouwbaar bij het Next-proces af, waar de instrumentatie de handlers
// registreert. `next start` draait de server in-proces (next-start.js → startServer(), geen worker-
// fork), dus dit proces ís het proces met de readiness-/drain-handlers.
const nextBin = require.resolve("next/dist/bin/next");
const server = spawn(process.execPath, [nextBin, "start", "-p", port], {
  stdio: "inherit",
});

// Graceful shutdown met drain-venster + vangnet. Een afsluitsignaal (Railway-redeploy / operator)
// verloopt in twee fasen zodat een rolling redeploy geen verkeer verliest:
//   Fase 1 (drain): stuur SIGUSR2 → de instrumentatie zet readiness op 503 (draining) terwijl Next
//     de HTTP-server OPEN houdt en gewoon requests blijft bedienen. Zo krijgt de load balancer de
//     tijd om deze instance uit de rotatie te halen vóór de socket sluit (geen connection-reset op
//     nieuw verkeer dat nog even doorgestuurd wordt). Duur: SHUTDOWN_DRAIN_MS.
//   Fase 2 (close): stuur de echte SIGTERM/SIGINT → Next sluit de HTTP-server netjes (lopende
//     requests afronden, nieuwe weigeren). Sluit Next niet binnen SHUTDOWN_FORCE_KILL_MS, dan volgt
//     een SIGKILL zodat de deploy nooit blijft hangen.
// Een tweede signaal (operator drukt nogmaals) slaat het drain-venster over en forceert direct.
const forceKillMs = resolveForceKillMs(process.env);
const drainMs = resolveDrainMs(process.env);

let forceKillTimer = null;
let drainTimer = null;
let shuttingDown = false;
const clearForceKill = () => {
  if (forceKillTimer) {
    clearTimeout(forceKillTimer);
    forceKillTimer = null;
  }
};
const clearDrainTimer = () => {
  if (drainTimer) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
};

server.on("spawn", () => {
  void startBackgroundSeed();
});
server.on("error", (error) => {
  console.error("[start] Next.js kon niet starten", error);
  process.exit(1);
});
server.on("exit", (code, signal) => {
  clearForceKill();
  clearDrainTimer();
  if (signal) {
    console.log(`[start] Next.js gestopt door signaal ${signal}`);
    process.exit(0);
    return;
  }
  process.exit(code ?? 1);
});

// Fase 2: stuur de echte SIGTERM/SIGINT zodat Next de HTTP-server netjes sluit, met een
// force-kill-vangnet als een hangende in-flight request de afsluiting blokkeert. Neutraal log:
// readiness is in de drain-fase al op 503 gezet (of flipt bij deze SIGTERM in de no-drain-flow),
// dus deze regel meldt alleen het sluiten van de socket — niet "readiness → draining".
const closeNext = (signal) => {
  console.log(`[start] Next.js HTTP-server sluiten — lopende requests afronden`);
  server.kill(signal);
  forceKillTimer = setTimeout(() => {
    console.error(
      `[start] Next.js sloot niet af binnen ${forceKillMs}ms — geforceerd stoppen (SIGKILL)`,
    );
    server.kill("SIGKILL");
  }, forceKillMs);
  // De timer mag de event-loop niet levend houden als het proces verder klaar is.
  if (typeof forceKillTimer.unref === "function") forceKillTimer.unref();
};

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (shuttingDown) {
      // Tweede signaal: niet langer draineren/wachten, direct forceren.
      console.log("[start] tweede afsluitsignaal — Next.js wordt geforceerd gestopt (SIGKILL)");
      clearDrainTimer();
      clearForceKill();
      server.kill("SIGKILL");
      return;
    }
    shuttingDown = true;

    if (drainMs > 0) {
      // Fase 1 (drain): readiness → 503 zónder de HTTP-server te sluiten, zodat de load balancer
      // deze instance uit de rotatie haalt vóór we de socket sluiten. Next behandelt SIGUSR2 niet
      // als afsluitsignaal → de server blijft tijdens het venster gewoon requests bedienen.
      //
      // Signaal-levering: `server` is het Next-proces zélf (we spawnen node direct op de next-bin,
      // niet via npx — zie hierboven). SIGUSR2 komt dus rechtstreeks bij het proces waar de
      // instrumentatie de listener registreert (`registerDrainSignal`); die listener onderdrukt óók
      // Node's default (SIGUSR2 = terminate), zodat het signaal `beginDraining()` bereikt i.p.v. het
      // proces te doden.
      console.log(
        `[start] ${signal} ontvangen — ${drainMs}ms draineren (readiness → 503) vóór afsluiten`,
      );
      server.kill("SIGUSR2");
      drainTimer = setTimeout(() => {
        drainTimer = null;
        closeNext(signal);
      }, drainMs);
      if (typeof drainTimer.unref === "function") drainTimer.unref();
      return;
    }

    // Geen drain-venster (lokaal/tests): meteen netjes sluiten.
    console.log(`[start] ${signal} ontvangen — Next.js netjes afsluiten (readiness → draining)`);
    closeNext(signal);
  });
}
