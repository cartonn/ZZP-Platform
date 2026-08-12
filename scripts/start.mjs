// Productie-start (Railway). Idempotent en veilig bij elke (her)start:
//  1. zorg dat de Prisma-provider past bij DATABASE_URL;
//  2. zet het schema op de database (db push — additief; GEEN --accept-data-loss, zodat een
//     destructieve schemawijziging de boot veilig laat falen i.p.v. productiedata te droppen);
//  3. start de Next.js-server op de door Railway aangereikte PORT;
//  4. seed referentie- en eventueel demo-data asynchroon nadat /api/readiness echt gezond is,
//     zodat Railway-healthchecks nooit wachten op een seed.
import { execSync, spawn } from "node:child_process";
import http from "node:http";

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
// Bewust ZONDER --accept-data-loss: additieve wijzigingen (nieuwe kolommen/indexes) gaan door,
// maar een destructieve wijziging faalt zichtbaar i.p.v. stilzwijgend data te wissen.
run("npx prisma db push --skip-generate");

const seedDemo = process.env.SEED_DEMO === "true";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
const server = spawn("npx", ["next", "start", "-p", port], {
  stdio: "inherit",
});

// Graceful shutdown met vangnet: een afsluitsignaal (Railway-redeploy / operator) wordt doorgegeven
// aan Next zodat die de HTTP-server netjes sluit (lopende requests afronden, nieuwe weigeren) — en
// de instrumentatie zet de readiness-probe op 503. Als Next binnen het venster niet afsluit (een
// hangende in-flight request), forceren we een SIGKILL zodat de deploy nooit blijft hangen.
// Een tweede signaal (operator drukt nogmaals) forceert direct.
const clampMs = (raw, def, min, max) => {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
};
const forceKillMs = clampMs(process.env.SHUTDOWN_FORCE_KILL_MS, 25000, 1000, 120000);

let forceKillTimer = null;
let shuttingDown = false;
const clearForceKill = () => {
  if (forceKillTimer) {
    clearTimeout(forceKillTimer);
    forceKillTimer = null;
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
  if (signal) {
    console.log(`[start] Next.js gestopt door signaal ${signal}`);
    process.exit(0);
    return;
  }
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (shuttingDown) {
      // Tweede signaal: niet langer wachten, direct forceren.
      console.log("[start] tweede afsluitsignaal — Next.js wordt geforceerd gestopt (SIGKILL)");
      clearForceKill();
      server.kill("SIGKILL");
      return;
    }
    shuttingDown = true;
    console.log(`[start] ${signal} ontvangen — Next.js netjes afsluiten (readiness → draining)`);
    server.kill(signal);
    forceKillTimer = setTimeout(() => {
      console.error(
        `[start] Next.js sloot niet af binnen ${forceKillMs}ms — geforceerd stoppen (SIGKILL)`,
      );
      server.kill("SIGKILL");
    }, forceKillMs);
    // De timer mag de event-loop niet levend houden als het proces verder klaar is.
    if (typeof forceKillTimer.unref === "function") forceKillTimer.unref();
  });
}
