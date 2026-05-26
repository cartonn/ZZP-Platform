// Zet de Prisma datasource-provider passend bij de omgeving.
// Lokaal draait alles op SQLite; productie (Railway) op PostgreSQL.
// Aanroep: `node scripts/use-db-provider.mjs [postgresql|sqlite]`
//  - expliciet argument wint;
//  - anders afgeleid uit DATABASE_URL (postgres:// -> postgresql);
//  - anders sqlite.
import { readFileSync, writeFileSync } from "node:fs";

const SCHEMA = "prisma/schema.prisma";
const arg = process.argv[2];
const url = process.env.DATABASE_URL ?? "";

const provider =
  arg === "postgresql" || arg === "sqlite"
    ? arg
    : /^postgres(ql)?:\/\//.test(url)
      ? "postgresql"
      : "sqlite";

const src = readFileSync(SCHEMA, "utf8");
// Vervangt alleen de datasource-provider (sqlite|postgresql); de generator
// (prisma-client-js) blijft ongemoeid.
const next = src.replace(/provider\s*=\s*"(?:sqlite|postgresql)"/, `provider = "${provider}"`);

if (next !== src) {
  writeFileSync(SCHEMA, next);
  console.log(`[db] datasource provider -> ${provider}`);
} else {
  console.log(`[db] datasource provider is al ${provider}`);
}
