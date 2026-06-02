// Productie-start (Railway). Idempotent en veilig bij elke (her)start:
//  1. zorg dat de Prisma-provider past bij DATABASE_URL;
//  2. zet het schema op de database (db push — additief; GEEN --accept-data-loss, zodat een
//     destructieve schemawijziging de boot veilig laat falen i.p.v. productiedata te droppen);
//  3. seed referentiedata voor serverstart;
//  4. start de Next.js-server op de door Railway aangereikte PORT;
//  5. seed rijke demo-data asynchroon als SEED_DEMO=true, zodat Railway-healthchecks niet wachten
//     op een lange demo-seed.
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

// seed.ts seedt referentiedata (plans/skills/industries) altijd idempotent; demo-data alleen bij
// SEED_DEMO=true. In productie (SEED_DEMO niet gezet): alleen referentiedata + een optionele
// bootstrap-admin uit BOOTSTRAP_ADMIN_EMAIL/PASSWORD. De echte data komt daar via de CSV-import.
const seedDemo = process.env.SEED_DEMO === "true";
console.log("[start] referentiedata seeden voor serverstart");
run("npx prisma db seed", {
  ...process.env,
  SEED_DEMO: "false",
});

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

const startBackgroundDemoSeed = async () => {
  if (!seedDemo) return;
  const healthy = await waitForLocalHealth(port);
  if (!healthy) {
    console.error("[start] demo-seed overgeslagen: lokale /api/health werd niet tijdig gezond");
    return;
  }
  console.log("[start] rijke demo-data seeden op de achtergrond (SEED_DEMO=true)");
  const child = spawn("npx", ["prisma", "db", "seed"], {
    env: {
      ...process.env,
      SEED_DEMO: "true",
    },
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (code === 0) {
      console.log("[start] achtergrond demo-seed afgerond");
      return;
    }
    console.error(
      `[start] achtergrond demo-seed faalde${signal ? ` door signaal ${signal}` : ` met exitcode ${code}`}`,
    );
  });
};

const port = process.env.PORT ?? "3000";
console.log(`[start] Next.js start op poort ${port}`);
const server = spawn("npx", ["next", "start", "-p", port], {
  stdio: "inherit",
});

server.on("spawn", () => {
  void startBackgroundDemoSeed();
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
