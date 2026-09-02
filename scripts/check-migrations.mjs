// Migratie-drift-poort. Bewaakt dat `prisma/migrations/` en `prisma/schema.prisma` hetzelfde
// PostgreSQL-schema beschrijven: wie het schema wijzigt zonder migratie, ziet dat hier — niet pas
// bij de deploy, wanneer `prisma migrate deploy` de kolom niet aanmaakt en de app op een ontbrekend
// veld crasht.
//
// Werking: `prisma migrate diff` speelt de migraties af op een shadow-database en vergelijkt het
// resultaat met het datamodel. `--exit-code` geeft 2 zodra er nog verschil is.
//
// Het schema in de repo staat op `sqlite` (lokale standaard). De migraties zijn Postgres-SQL, dus we
// vergelijken tegen een KOPIE van het schema met provider `postgresql`, in een tijdelijke map. Zo
// blijft de working tree onaangeraakt en kan het script veilig naast ander werk draaien.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SHADOW_URL = process.env.SHADOW_DATABASE_URL;
if (!SHADOW_URL) {
  console.error(
    "[check:migrations] FOUT — SHADOW_DATABASE_URL ontbreekt. Zet een lege PostgreSQL-database, bv.\n" +
      "  docker run --rm -d -p 5433:5432 -e POSTGRES_PASSWORD=shadow --name zzp-shadow postgres:16\n" +
      '  SHADOW_DATABASE_URL="postgresql://postgres:shadow@localhost:5433/postgres?schema=public" npm run db:check-migrations',
  );
  process.exit(1);
}

const workdir = mkdtempSync(join(tmpdir(), "zzp-migrations-"));
const schemaCopy = join(workdir, "schema.prisma");

try {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  writeFileSync(schemaCopy, schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"'));

  execFileSync(
    "npx",
    [
      "prisma",
      "migrate",
      "diff",
      "--from-migrations",
      "prisma/migrations",
      "--to-schema-datamodel",
      schemaCopy,
      "--shadow-database-url",
      SHADOW_URL,
      "--exit-code",
    ],
    { stdio: "inherit" },
  );
  console.log("[check:migrations] OK — migraties en schema beschrijven hetzelfde Postgres-schema.");
} catch {
  console.error(
    "\n[check:migrations] FOUT — schema.prisma en prisma/migrations lopen uiteen (of de diff kon niet " +
      "draaien; zie de uitvoer hierboven).\n" +
      "Maak voor je schemawijziging een migratie — zie prisma/manual-migrations/README.md.",
  );
  process.exit(1);
} finally {
  rmSync(workdir, { recursive: true, force: true });
}
