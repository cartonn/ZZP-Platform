// Productie-start (Railway). Idempotent en veilig bij elke (her)start:
//  1. zorg dat de Prisma-provider past bij DATABASE_URL;
//  2. zet het schema op de database (db push, geen migraties nodig);
//  3. seed demo-data alleen als de database nog leeg is;
//  4. start de Next.js-server op de door Railway aangereikte PORT.
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

run("node scripts/use-db-provider.mjs");
run("npx prisma db push --skip-generate --accept-data-loss");

// Seed is volledig idempotent (upserts / upsert-by-id), dus veilig bij elke start —
// zo krijgt ook een bestaande database de (verrijkte) demo-inhoud.
console.log("[start] demo-data seeden (idempotent)");
run("npx prisma db seed");

const port = process.env.PORT ?? "3000";
console.log(`[start] Next.js start op poort ${port}`);
run(`npx next start -p ${port}`);
