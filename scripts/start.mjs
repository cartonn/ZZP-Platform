// Productie-start (Railway). Idempotent en veilig bij elke (her)start:
//  1. zorg dat de Prisma-provider op postgresql staat;
//  2. zet het schema op de database (db push, geen migraties nodig);
//  3. seed demo-data alleen als de database nog leeg is;
//  4. start de Next.js-server op de door Railway aangereikte PORT.
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

run("node scripts/use-db-provider.mjs postgresql");
run("npx prisma db push --skip-generate --accept-data-loss");

const prisma = new PrismaClient();
try {
  const users = await prisma.user.count();
  if (users === 0) {
    console.log("[start] lege database — demo-data seeden");
    run("npx prisma db seed");
  } else {
    console.log(`[start] ${users} gebruiker(s) aanwezig — seed overgeslagen`);
  }
} catch (err) {
  console.error("[start] kon database niet controleren:", err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

const port = process.env.PORT ?? "3000";
console.log(`[start] Next.js start op poort ${port}`);
run(`npx next start -p ${port}`);
