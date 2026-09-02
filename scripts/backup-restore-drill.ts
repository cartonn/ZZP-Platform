/**
 * Database-back-up herstel-drill (PostgreSQL) — RUNBOOK §5.
 *
 * Bewijst dat een back-up ÉCHT te herstellen is — niet alleen dat de inhoudsopgave leesbaar is. De
 * back-up (`scripts/backup-db.ts`) verifieert vandaag met `pg_restore --list` (leest alléén de TOC);
 * een corrupte data-block of afgekapte object-data kan die check passeren en pas op een echt herstel
 * falen. Deze drill herstelt de (nieuwste) back-up in een WEGWERP scratch-database en leest daarna het
 * schema + de data terug. "Een onbeproefde back-up is geen back-up", nu volledig. Ná de verificatie
 * ruimt de drill de scratch-database ALTIJD op (drop `public`-schema), zodat de herstelde productie-PII
 * (namen, e-mail, IBAN/KvK, VOG/BIG/diploma-metadata) geen langlevende schaduwkopie achterlaat in een
 * tweede omgeving (AVG art. 5(1)(c)/5(1)(e)/32).
 *
 * Veilig: herstelt UITSLUITEND naar `DRILL_DATABASE_URL` (of `--target`) en weigert hard als dat de
 * bron-/productie-`DATABASE_URL` is — een drill kent bewust GEEN --force. Logt nooit het wachtwoord.
 * Inert lokaal (SQLite of geen scratch-DB): faalt dan met een heldere melding zonder iets te raken.
 *
 * Gebruik:
 *   DRILL_DATABASE_URL=postgres://... npm run db:restore-drill            # nieuwste back-up in ./backups
 *   npm run db:restore-drill -- --target postgres://... --dir /pad
 *   npm run db:restore-drill -- --file backups/zzp-backup-XXXX.dump       # specifieke back-up
 *   npm run db:restore-drill -- --table Job                               # andere verificatietabel
 *   npm run db:restore-drill -- --dry-run --target postgres://...         # toon plan, herstel niets
 *
 * Vereist de PostgreSQL-client (`pg_restore`/`psql`) op het systeem. Bedoeld als periodieke
 * ops-controle (bv. maandelijks, of na een schema-migratie).
 */
import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertDrillTarget,
  assertSafeIdentifier,
  BackupEncryptionError,
  buildPgRestoreArgs,
  buildPublicTableCountArgs,
  buildRowCountArgs,
  buildScratchTeardownArgs,
  decryptBackup,
  interpretDrill,
  looksEncryptedBackup,
  parsePsqlCount,
  redactDatabaseUrl,
  resolveBackupEncryptionKey,
  selectLatestBackup,
  UnsafeIdentifierError,
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
  // Sniff alléén de eerste bytes (magic-header): een plaintext dump kan vele GB's zijn en gaat
  // rechtstreeks als pad naar pg_restore — nooit onnodig volledig in het geheugen laden.
  const head = Buffer.alloc(4);
  const fd = openSync(file, "r");
  let headLen: number;
  try {
    headLen = readSync(fd, head, 0, 4, 0);
  } finally {
    closeSync(fd);
  }
  if (!looksEncryptedBackup(head.subarray(0, headLen))) {
    return { path: file, cleanup: () => {} };
  }
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
  let plaintext: Buffer;
  try {
    plaintext = decryptBackup(readFileSync(file), key);
  } catch (error) {
    if (error instanceof BackupEncryptionError) {
      console.error(`${logPrefix} ${error.message}`);
      process.exit(2);
    }
    throw error;
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

/**
 * Wist de herstelde data weer volledig uit de scratch-database (drop + recreate `public`-schema), zodat
 * de drill geen langlevende PII-schaduwkopie achterlaat (AVG art. 5(1)(c)/5(1)(e)/32). Draait ALTIJD ná
 * de verificatie, ongeacht de uitkomst. Best-effort met een luide waarschuwing wanneer het niet lukt: de
 * operator moet dan zelf de scratch-database opruimen — we verzwijgen een blijvende PII-kopie nooit.
 */
function tearDownScratch(target: string): void {
  const result = spawnSync("psql", buildScratchTeardownArgs(target), { encoding: "utf8" });
  if (result.error) {
    console.error(
      `[drill] LET OP: kon de scratch-database niet opruimen (${result.error.message}). De herstelde ` +
        "PRODUCTIE-DATA staat er mogelijk NOG in — ruim de scratch-database handmatig op.",
    );
    return;
  }
  if (result.status !== 0) {
    console.error(
      `[drill] LET OP: opruimen van de scratch-database eindigde met exitcode ${result.status}. De ` +
        "herstelde PRODUCTIE-DATA staat er mogelijk NOG in — controleer en ruim handmatig op.",
    );
    return;
  }
  console.log(
    "[drill] scratch-database opgeruimd (public-schema gedropt) — geen PII-kopie achtergelaten.",
  );
}

/** Draait een psql-count en geeft het getal (of null bij onbereikbaar/onparseerbaar). */
function psqlCount(args: string[]): number | null {
  const result = spawnSync("psql", args, { encoding: "utf8" });
  if (result.error) {
    const notFound = (result.error as NodeJS.ErrnoException).code === "ENOENT";
    console.error(
      notFound
        ? "[drill] psql niet gevonden. Installeer de PostgreSQL-client (postgresql-client)."
        : `[drill] psql kon niet starten: ${result.error.message}`,
    );
    process.exit(1);
  }
  if (result.status !== 0) return null;
  return parsePsqlCount(result.stdout);
}

function main(): void {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const dir = flagValue(argv, "--dir") ?? process.env.BACKUP_DIR ?? "backups";
  const table = flagValue(argv, "--table") ?? process.env.DRILL_VERIFY_TABLE ?? "User";

  let target: string;
  let verifyTable: string;
  try {
    target = assertDrillTarget({
      target: flagValue(argv, "--target") ?? process.env.DRILL_DATABASE_URL,
      source: process.env.DATABASE_URL,
    });
    verifyTable = assertSafeIdentifier(table);
  } catch (error) {
    if (
      error instanceof UnsupportedDatabaseError ||
      error instanceof UnsafeRestoreTargetError ||
      error instanceof UnsafeIdentifierError
    ) {
      console.error(`[drill] ${error.message}`);
      process.exit(2);
    }
    throw error;
  }

  // Bepaal de te testen back-up: expliciet bestand, of de nieuwste in de back-upmap.
  const explicit = flagValue(argv, "--file");
  let file: string;
  if (explicit) {
    file = explicit;
  } else {
    const names = existsSync(dir) ? readdirSync(dir) : [];
    const latest = selectLatestBackup(names);
    if (!latest) {
      console.error(
        `[drill] geen back-up gevonden in ${dir}. Draai eerst \`npm run db:backup\` of geef ` +
          "een bestand op met --file.",
      );
      process.exit(2);
    }
    file = join(dir, latest);
  }
  if (!existsSync(file)) {
    console.error(`[drill] back-upbestand niet gevonden: ${file}`);
    process.exit(2);
  }

  console.log(`[drill] doel:       ${redactDatabaseUrl(target)} (wegwerp scratch-database)`);
  console.log(`[drill] back-up:    ${file}`);
  console.log(`[drill] verificatie: schema-tabellen + rijen in "${verifyTable}"`);

  if (dryRun) {
    const redacted = buildPgRestoreArgs({ url: redactDatabaseUrl(target), file });
    console.log(`[drill] (dry-run) zou herstellen: pg_restore ${redacted.join(" ")}`);
    console.log(`[drill] (dry-run) zou daarna schema + "${verifyTable}" teruglezen via psql.`);
    console.log(
      "[drill] (dry-run) zou tot slot de scratch-database opruimen (public-schema droppen) — geen PII-kopie.",
    );
    return;
  }

  // Ontsleutel een versleutelde back-up naar een tijdelijk plaintext-bestand; plaintext blijft ongewijzigd.
  // `cleanup` verwijdert het tijdelijke bestand op elke exit-route (finally + process-exit-handler).
  const { path: restoreFile, cleanup } = resolvePlaintextBackup(file, "[drill]");
  try {
    const restoreArgs = buildPgRestoreArgs({ url: target, file: restoreFile });
    // Herstel in de scratch-database. `--clean --if-exists` wist het doel eerst → idempotent te draaien.
    const restore = spawnSync("pg_restore", restoreArgs, { stdio: "inherit" });
    if (restore.error) {
      const notFound = (restore.error as NodeJS.ErrnoException).code === "ENOENT";
      console.error(
        notFound
          ? "[drill] pg_restore niet gevonden. Installeer de PostgreSQL-client (postgresql-client)."
          : `[drill] pg_restore kon niet starten: ${restore.error.message}`,
      );
      process.exit(1);
    }
    // pg_restore geeft exitcode ≠ 0 óók bij niet-fatale waarschuwingen (bv. "table does not exist,
    // skipping" bij --clean tegen een lege DB). Dat is hier verwacht; de teruglees-verificatie hieronder
    // is de échte poort — een onvolledig herstel valt daar door de mand (niet blind hard falen).
    if (restore.status !== 0) {
      console.log(
        `[drill] pg_restore eindigde met exitcode ${restore.status} (kan een niet-fatale ` +
          "waarschuwing zijn bij --clean tegen een lege database). De teruglees-verificatie beslist.",
      );
    }

    // Teruglees-verificatie: schema (public-tabellen) + data (rijen in de verificatietabel).
    const publicTableCount = psqlCount(buildPublicTableCountArgs(target));
    const rowCount =
      publicTableCount && publicTableCount > 0
        ? psqlCount(buildRowCountArgs(target, verifyTable))
        : null;

    const verdict = interpretDrill({ publicTableCount, rowCount, verifyTable });

    // Privacy: ruim de herstelde productie-data ALTIJD op vóór we het resultaat melden — of de drill nu
    // slaagt of faalt. Zo blijft er nooit een langlevende PII-kopie in de wegwerp-database staan
    // (AVG art. 5(1)(c) minimalisatie / art. 5(1)(e) opslagbeperking / art. 32 vertrouwelijkheid).
    tearDownScratch(target);

    if (verdict.ok) {
      console.log(`[drill] GESLAAGD: ${verdict.detail}`);
      console.log("[drill] klaar. De back-up is aantoonbaar herstelbaar én teruglezbaar.");
      return;
    }
    console.error(`[drill] MISLUKT: ${verdict.detail}`);
    console.error(
      "[drill] De back-up is NIET betrouwbaar herstelbaar. Controleer de pg_dump-uitvoer, de " +
        "schijfruimte tijdens de back-up en of de scratch-database bereikbaar/leeg is.",
    );
    process.exit(1);
  } finally {
    cleanup();
  }
}

main();
