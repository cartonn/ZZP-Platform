/**
 * Database-herstel (PostgreSQL) — RUNBOOK §5.
 *
 * Herstelt een `pg_dump`-back-up in een DOEL-database via `pg_restore --clean --if-exists`. Herstel
 * is destructief: standaard weigert dit script over `DATABASE_URL` (de bron/productie) heen te
 * herstellen — herstel naar een lege/wegwerp-database, of geef expliciet `--force` op. Logt nooit
 * het wachtwoord.
 *
 * Gebruik:
 *   TARGET_DATABASE_URL=postgres://... npm run db:restore -- backups/zzp-backup-XXXX.dump
 *   npm run db:restore -- --target postgres://... backups/zzp-backup-XXXX.dump
 *   npm run db:restore -- --target postgres://... --force <bestand>   # bewust over de bron heen
 *   npm run db:restore -- --dry-run --target postgres://... <bestand>
 *
 * Vereist de PostgreSQL-client (`pg_restore`) op het systeem.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  assertSafeRestoreTarget,
  buildPgRestoreArgs,
  redactDatabaseUrl,
  UnsafeRestoreTargetError,
  UnsupportedDatabaseError,
} from "../src/lib/ops/db-backup";

function flagValue(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  return idx >= 0 ? argv[idx + 1] : undefined;
}

function main(): void {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const force = argv.includes("--force");
  const targetFlag = flagValue(argv, "--target");

  // Het back-upbestand is het enige positionele argument (geen leidende `--`).
  const flagsWithValue = new Set(["--target"]);
  const file = argv.find((arg, i) => {
    if (arg.startsWith("--")) return false;
    const prev = argv[i - 1];
    return !(prev && flagsWithValue.has(prev));
  });

  if (!file) {
    console.error("[restore] geef het back-upbestand op: npm run db:restore -- <bestand.dump>");
    process.exit(2);
  }
  if (!existsSync(file)) {
    console.error(`[restore] back-upbestand niet gevonden: ${file}`);
    process.exit(2);
  }

  let target: string;
  try {
    target = assertSafeRestoreTarget({
      target: targetFlag ?? process.env.TARGET_DATABASE_URL,
      source: process.env.DATABASE_URL,
      force,
    });
  } catch (error) {
    if (error instanceof UnsupportedDatabaseError || error instanceof UnsafeRestoreTargetError) {
      console.error(`[restore] ${error.message}`);
      process.exit(2);
    }
    throw error;
  }

  const args = buildPgRestoreArgs({ url: target, file });
  const redactedCmd = `pg_restore ${buildPgRestoreArgs({ url: redactDatabaseUrl(target), file }).join(" ")}`;

  console.log(`[restore] doel:    ${redactDatabaseUrl(target)}`);
  console.log(`[restore] bestand: ${file}`);
  if (force) console.log("[restore] --force: herstel over de bron-database is bewust toegestaan.");

  if (dryRun) {
    console.log(`[restore] (dry-run) zou uitvoeren: ${redactedCmd}`);
    return;
  }

  const result = spawnSync("pg_restore", args, { stdio: "inherit" });
  if (result.error) {
    const notFound = (result.error as NodeJS.ErrnoException).code === "ENOENT";
    console.error(
      notFound
        ? "[restore] pg_restore niet gevonden. Installeer de PostgreSQL-client (postgresql-client)."
        : `[restore] pg_restore kon niet starten: ${result.error.message}`,
    );
    process.exit(1);
  }
  // pg_restore geeft exitcode ≠ 0 óók bij niet-fatale waarschuwingen; meld het, faal niet blind hard.
  if (result.status !== 0) {
    console.error(
      `[restore] pg_restore eindigde met exitcode ${result.status}. Controleer de uitvoer hierboven ` +
        "(kan een niet-fatale waarschuwing zijn) en verifieer met /api/readiness + een steekproef.",
    );
    process.exit(result.status ?? 1);
  }
  console.log("[restore] klaar. Verifieer met /api/readiness + een steekproef van de data.");
}

main();
