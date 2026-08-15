// Productie-start (Railway). Idempotent en veilig bij elke (her)start:
//  1. zorg dat de Prisma-provider past bij DATABASE_URL;
//  2. zet het schema op de database (db push — additief; GEEN --accept-data-loss, zodat een
//     destructieve schemawijziging de boot veilig laat falen i.p.v. productiedata te droppen);
//  3. start de Next.js-server op de door Railway aangereikte PORT;
//  4. seed referentie- en eventueel demo-data asynchroon nadat /api/readiness echt gezond is,
//     zodat Railway-healthchecks nooit wachten op een seed.
import { execSync, spawn } from "node:child_process";
import http from "node:http";
import { resolveDrainMs, resolveForceKillMs } from "./shutdown-config.mjs";

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
      // Signaal-levering: `server` is de `npx`-wrapper, niet direct het Next-proces. npx draait het
      // kind via `foreground-child`, dat de vólledige signaalset (alles behalve SIGKILL/SIGPROF) naar
      // de child proxyt — inclusief SIGUSR2, exact hetzelfde pad waarlangs de bestaande SIGTERM-
      // graceful-shutdown al loopt. Omdat de instrumentatie een SIGUSR2-listener registreert
      // (`registerDrainSignal`), wordt Node's default (SIGUSR2 = terminate) onderdrukt en bereikt het
      // signaal `beginDraining()` i.p.v. het proces te doden.
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
