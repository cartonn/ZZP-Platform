/**
 * Database-back-up (PostgreSQL) — RUNBOOK §5.
 *
 * Maakt een custom-format `pg_dump` van `DATABASE_URL` in een back-upmap en snoeit oude back-ups op
 * basis van retentie. Veilig: weigert een niet-PostgreSQL-URL (SQLite kopieer je als bestand),
 * logt nooit het wachtwoord, en raakt bij het snoeien alleen de eigen back-upbestanden aan.
 *
 * De dump wordt na afloop geverifieerd met `pg_restore --list` (leest alleen de inhoudsopgave, zonder
 * te herstellen): pas als het archief leesbaar/niet-afgekapt is, wordt de retentie gesnoeid. Een
 * corrupte dump (bv. schijf vol halverwege) wordt verwijderd en snoeit nooit de goede back-ups weg —
 * "een onbeproefde back-up is geen back-up". Zet de verificatie desnoods uit met `--no-verify` /
 * `BACKUP_SKIP_VERIFY` (bv. wanneer `pg_restore` niet op het systeem staat).
 *
 * Gebruik:
 *   npm run db:backup            # dump naar ./backups (of $BACKUP_DIR), retentie $BACKUP_RETENTION (14)
 *   npm run db:backup -- --dir /pad --keep 7
 *   npm run db:backup -- --dry-run   # toon wat er zou gebeuren, schrijf niets
 *   npm run db:backup -- --no-verify # sla de pg_restore --list-integriteitscheck over
 *
 * Vereist de PostgreSQL-client (`pg_dump`/`pg_restore`) op het systeem. Inert/onschadelijk lokaal
 * (SQLite): faalt dan met een heldere melding i.p.v. iets te overschrijven.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import {
  assertPostgresUrl,
  buildBackupFilename,
  buildPgDumpArgs,
  buildPgRestoreListArgs,
  isValidArchiveListing,
  parseKeepCount,
  redactDatabaseUrl,
  selectBackupsToPrune,
  shouldVerifyBackup,
  UnsupportedDatabaseError,
} from "../src/lib/ops/db-backup";

function flagValue(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  return idx >= 0 ? argv[idx + 1] : undefined;
}

function main(): void {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const dir = flagValue(argv, "--dir") ?? process.env.BACKUP_DIR ?? "backups";
  const keep = parseKeepCount(flagValue(argv, "--keep") ?? process.env.BACKUP_RETENTION, 14);
  const verify = shouldVerifyBackup({
    noVerifyFlag: argv.includes("--no-verify"),
    skipVerifyEnv: process.env.BACKUP_SKIP_VERIFY,
  });

  let url: string;
  try {
    url = assertPostgresUrl(process.env.DATABASE_URL, "DATABASE_URL");
  } catch (error) {
    if (error instanceof UnsupportedDatabaseError) {
      console.error(`[backup] ${error.message}`);
      process.exit(2);
    }
    throw error;
  }

  const filename = buildBackupFilename(new Date());
  const outFile = join(dir, filename);
  const args = buildPgDumpArgs({ url, file: outFile });
  const redactedCmd = `pg_dump ${buildPgDumpArgs({ url: redactDatabaseUrl(url), file: outFile }).join(" ")}`;

  console.log(`[backup] database:  ${redactDatabaseUrl(url)}`);
  console.log(`[backup] doel:      ${outFile}`);
  console.log(`[backup] retentie:  ${keep} back-up(s) behouden`);
  console.log(
    `[backup] verificatie: ${verify ? "pg_restore --list vóór snoei" : "uit (--no-verify)"}`,
  );

  if (dryRun) {
    console.log(`[backup] (dry-run) zou uitvoeren: ${redactedCmd}`);
    if (verify) console.log(`[backup] (dry-run) zou verifiëren: pg_restore --list ${outFile}`);
    const existing = existsSync(dir) ? readdirSync(dir) : [];
    const toPrune = selectBackupsToPrune([...existing, filename], keep);
    if (toPrune.length) console.log(`[backup] (dry-run) zou snoeien: ${toPrune.join(", ")}`);
    return;
  }

  mkdirSync(dir, { recursive: true });
  const result = spawnSync("pg_dump", args, { stdio: "inherit" });
  if (result.error) {
    const notFound = (result.error as NodeJS.ErrnoException).code === "ENOENT";
    console.error(
      notFound
        ? "[backup] pg_dump niet gevonden. Installeer de PostgreSQL-client (postgresql-client)."
        : `[backup] pg_dump kon niet starten: ${result.error.message}`,
    );
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[backup] pg_dump faalde (exitcode ${result.status}).`);
    process.exit(result.status ?? 1);
  }

  const bytes = existsSync(outFile) ? statSync(outFile).size : 0;
  console.log(`[backup] geschreven: ${outFile} (${bytes} bytes)`);

  // Integriteitscheck vóór de retentie-snoei: een corrupte/afgekapte dump mag NOOIT goede back-ups
  // wegsnoeien. Faalt de check, dan verwijderen we de kapotte dump en stoppen zónder te snoeien.
  if (verify) {
    const listing = spawnSync("pg_restore", buildPgRestoreListArgs(outFile), { encoding: "utf8" });
    const listNotFound =
      listing.error && (listing.error as NodeJS.ErrnoException).code === "ENOENT";
    if (listNotFound) {
      console.error(
        "[backup] pg_restore niet gevonden — kan de dump niet verifiëren. Installeer de " +
          "PostgreSQL-client, of draai met --no-verify als je bewust zonder verificatie back-upt. " +
          `De dump is behouden (niet gesnoeid): ${outFile}`,
      );
      process.exit(1);
    }
    if (listing.error || listing.status !== 0 || !isValidArchiveListing(listing.stdout)) {
      if (existsSync(outFile)) unlinkSync(outFile);
      console.error(
        `[backup] VERIFICATIE MISLUKT: ${outFile} is geen geldig/volledig archief (pg_restore --list ` +
          `gaf exitcode ${listing.status ?? "n.v.t."}). De kapotte dump is verwijderd en er is NIETS ` +
          "gesnoeid — de bestaande back-ups blijven intact. Controleer schijfruimte en pg_dump-uitvoer.",
      );
      process.exit(1);
    }
    console.log("[backup] geverifieerd: geldig archief (pg_restore --list).");
  }

  const toPrune = selectBackupsToPrune(readdirSync(dir), keep);
  for (const name of toPrune) {
    unlinkSync(join(dir, name));
    console.log(`[backup] gesnoeid: ${name}`);
  }
  console.log("[backup] klaar.");
}

main();
