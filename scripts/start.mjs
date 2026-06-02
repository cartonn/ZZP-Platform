// Productie-start (Railway). Idempotent en veilig bij elke (her)start:
//  1. zorg dat de Prisma-provider past bij DATABASE_URL;
//  2. zet het schema op de database (db push — additief; GEEN --accept-data-loss, zodat een
//     destructieve schemawijziging de boot veilig laat falen i.p.v. productiedata te droppen);
//  3. seed referentiedata altijd + demo-data alleen als SEED_DEMO=true (demo-/testfase);
//  4. start de Next.js-server op de door Railway aangereikte PORT.
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

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
console.log(
  process.env.SEED_DEMO === "true"
    ? "[start] referentie- + demo-data seeden (SEED_DEMO=true)"
    : "[start] alleen referentiedata seeden (SEED_DEMO niet gezet)",
);
run("npx prisma db seed");

const port = process.env.PORT ?? "3000";
console.log(`[start] Next.js start op poort ${port}`);
run(`npx next start -p ${port}`);
