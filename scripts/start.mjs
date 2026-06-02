// Productie-start (Railway). Idempotent en veilig bij elke (her)start:
//  1. zorg dat de Prisma-provider past bij DATABASE_URL;
//  2. zet het schema op de database (db push — additief; GEEN --accept-data-loss, zodat een
//     destructieve schemawijziging de boot veilig laat falen i.p.v. productiedata te droppen);
//  3. start de Next.js-server op de door Railway aangereikte PORT;
//  4. seed referentie- en eventueel demo-data asynchroon nadat /api/health echt gezond is,
//     zodat Railway-healthchecks nooit wachten op een seed.
import { execSync, spawn } from "node:child_process";
import http from "node:http";

const run = (cmd, env = process.env) => execSync(cmd, { env, stdio: "inherit" });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

run("node scripts/use-db-provider.mjs");
// Bewust ZONDER --accept-data-loss: additieve wijzigingen (nieuwe kolommen/indexes) gaan door,
// maar een destructieve wijziging faalt zichtbaar i.p.v. stilzwijgend data te wissen.
run("npx prisma db push --skip-generate");

const seedDemo = process.env.SEED_DEMO === "true";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForLocalHealth(port, attempts = 90) {
  const url = `http://127.0.0.1:${port}/api/health`;
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
  const healthy = await waitForLocalHealth(port);
  if (!healthy) {
    console.error("[start] seed overgeslagen: lokale /api/health werd niet tijdig gezond");
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

server.on("spawn", () => {
  void startBackgroundSeed();
});
server.on("error", (error) => {
  console.error("[start] Next.js kon niet starten", error);
  process.exit(1);
});
server.on("exit", (code, signal) => {
  if (signal) {
    console.log(`[start] Next.js gestopt door signaal ${signal}`);
    process.exit(0);
    return;
  }
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.kill(signal);
  });
}
