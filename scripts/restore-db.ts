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
import {
  closeSync,
  fstatSync,
  mkdtempSync,
  openSync,
  readSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertSafeRestoreTarget,
  BackupEncryptionError,
  buildPgRestoreArgs,
  decryptBackup,
  looksEncryptedBackup,
  redactDatabaseUrl,
  resolveBackupEncryptionKey,
  UnsafeRestoreTargetError,
  UnsupportedDatabaseError,
} from "../src/lib/ops/db-backup";

/**
 * Levert een plaintext, herstelbaar bestandspad voor `file`. Is `file` een versleutelde back-up
 * (magic-header), dan wordt het ontsleuteld naar een tijdelijk bestand (0600) dat de caller in een
 * finally opruimt via `cleanup()`. Plaintext-bestanden worden ongewijzigd doorgegeven (cleanup = no-op).
 * Een versleuteld bestand zonder BACKUP_ENCRYPTION_KEY faalt hard (exit 2). `cleanup` is idempotent en
 * wordt ook op `process.exit` geregistreerd, zodat elke exit-route het tijdelijke bestand verwijdert.
 */
function resolvePlaintextBackup(
  file: string,
  logPrefix: string,
): { path: string; cleanup: () => void } {
  // Open het bestand één keer als file descriptor en doe ALLE reads op die fd — nooit een tweede
  // pad-gebaseerde toegang (dat zou een TOCTOU-race zijn, CodeQL js/file-system-race). Een ontbrekend
  // bestand werpt ENOENT, hier afgehandeld als heldere "niet gevonden"-melding.
  let fd: number;
  try {
    fd = openSync(file, "r");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`${logPrefix} back-upbestand niet gevonden: ${file}`);
      process.exit(2);
    }
    throw error;
  }

  let plaintext: Buffer;
  try {
    // Sniff alléén de eerste bytes (magic-header): een plaintext dump kan vele GB's zijn en gaat
    // rechtstreeks als pad naar pg_restore — nooit onnodig volledig in het geheugen laden.
    const head = Buffer.alloc(4);
    const headLen = readSync(fd, head, 0, 4, 0);
    if (!looksEncryptedBackup(head.subarray(0, headLen))) {
      return { path: file, cleanup: () => {} };
    }

    // Versleuteld: eerst de sleutel (voorkom dat we een groot archief inlezen om daarna op een
    // ontbrekende sleutel te falen), dan het VOLLEDIGE archief van dezelfde fd lezen + ontsleutelen.
    let key: Buffer | null;
    try {
      key = resolveBackupEncryptionKey(process.env.BACKUP_ENCRYPTION_KEY);
    } catch (error) {
      if (error instanceof BackupEncryptionError) {
        console.error(`${logPrefix} ${error.message}`);
        process.exit(2);
      }
      throw error;
    }
    if (!key) {
      console.error(
        `${logPrefix} het back-upbestand is versleuteld maar BACKUP_ENCRYPTION_KEY is niet gezet. ` +
          "Zet dezelfde sleutel als waarmee de back-up is gemaakt.",
      );
      process.exit(2);
    }

    const size = fstatSync(fd).size;
    const raw = Buffer.alloc(size);
    let read = 0;
    while (read < size) {
      const n = readSync(fd, raw, read, size - read, read);
      if (n === 0) break;
      read += n;
    }
    try {
      plaintext = decryptBackup(read < size ? raw.subarray(0, read) : raw, key);
    } catch (error) {
      if (error instanceof BackupEncryptionError) {
        console.error(`${logPrefix} ${error.message}`);
        process.exit(2);
      }
      throw error;
    }
  } finally {
    closeSync(fd);
  }
  const dir = mkdtempSync(join(tmpdir(), "zzp-restore-"));
  const tmpFile = join(dir, "backup.dump");
  writeFileSync(tmpFile, plaintext, { mode: 0o600 });
  console.log(`${logPrefix} versleutelde back-up ontsleuteld naar een tijdelijk bestand.`);
  let done = false;
  const cleanup = (): void => {
    if (done) return;
    done = true;
    rmSync(dir, { recursive: true, force: true });
  };
  process.once("exit", cleanup);
  return { path: tmpFile, cleanup };
}

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
  // Bestaanscontrole gebeurt bewust bij het daadwerkelijk openen (resolvePlaintextBackup), niet met
  // een aparte existsSync-check vooraf — dat zou een TOCTOU-race introduceren.

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

  const redactedCmd = `pg_restore ${buildPgRestoreArgs({ url: redactDatabaseUrl(target), file }).join(" ")}`;

  console.log(`[restore] doel:    ${redactDatabaseUrl(target)}`);
  console.log(`[restore] bestand: ${file}`);
  if (force) console.log("[restore] --force: herstel over de bron-database is bewust toegestaan.");

  if (dryRun) {
    console.log(`[restore] (dry-run) zou uitvoeren: ${redactedCmd}`);
    return;
  }

  // Ontsleutel een versleutelde back-up naar een tijdelijk plaintext-bestand; plaintext blijft ongewijzigd.
  const { path: restoreFile, cleanup } = resolvePlaintextBackup(file, "[restore]");
  const args = buildPgRestoreArgs({ url: target, file: restoreFile });
  try {
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
  } finally {
    cleanup();
  }
}

main();
