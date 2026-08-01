// Pure kern voor de database-back-up/-herstel-helper (`scripts/backup-db.ts`,
// `scripts/restore-db.ts`). Bewust ZONDER I/O: alleen URL-inspectie, argument-opbouw,
// bestandsnaam- en retentielogica. Zo is de gevaarlijke logica (welke DB, welke vlaggen, wat
// prunen, wat over welke database heen herstellen) deterministisch te testen; de scripts doen
// enkel de child-process-uitvoering en het lezen/schrijven van bestanden.
//
// Achtergrond: RUNBOOK §5 documenteerde handmatige `pg_dump`/`pg_restore`-commando's vóór een
// risicovolle actie. Deze helper formaliseert dat tot één veilig, herhaalbaar hulpmiddel:
// weigert een niet-PostgreSQL-URL (SQLite kent geen pg_dump), redigeert wachtwoorden in logs,
// weigert blind over de bron-database te herstellen, en snoeit oude back-ups op basis van retentie.

/** Bron-database is geen PostgreSQL — pg_dump/pg_restore werken dan niet. */
export class UnsupportedDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedDatabaseError";
  }
}

/** Onveilig herstel-doel (bv. gelijk aan de bron-/productie-database zonder --force). */
export class UnsafeRestoreTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeRestoreTargetError";
  }
}

const POSTGRES_SCHEMES = ["postgres:", "postgresql:"];

/** True als de URL een PostgreSQL-connectie-URL is (postgres:// of postgresql://). */
export function isPostgresUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return POSTGRES_SCHEMES.some((scheme) => trimmed.toLowerCase().startsWith(`${scheme}//`));
}

/**
 * Bevestigt dat `url` een PostgreSQL-URL is; werpt anders een heldere fout. `label` benoemt de
 * variabele (bv. "DATABASE_URL") zodat de operator meteen weet wat er mis is.
 */
export function assertPostgresUrl(url: string | undefined | null, label = "DATABASE_URL"): string {
  if (!url || !url.trim()) {
    throw new UnsupportedDatabaseError(`${label} is niet gezet.`);
  }
  if (!isPostgresUrl(url)) {
    throw new UnsupportedDatabaseError(
      `${label} is geen PostgreSQL-URL. Back-up/herstel via pg_dump/pg_restore werkt alleen tegen ` +
        `een productie-PostgreSQL-database (SQLite lokaal kopieer je gewoon als bestand).`,
    );
  }
  return url.trim();
}

/**
 * Vervangt het wachtwoord in een connectie-URL door `***`, zodat de URL veilig gelogd kan worden.
 * Valt terug op een regex wanneer de URL niet parseerbaar is; laat niet-URL-strings ongemoeid.
 */
export function redactDatabaseUrl(url: string | undefined | null): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    // Fallback: user:pass@host → user:***@host
    return url.replace(/(:\/\/[^:/@]+:)[^@/]+@/, "$1***@");
  }
}

const BACKUP_PREFIX = "zzp-backup-";
const BACKUP_EXT = ".dump";

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

/**
 * Bouwt een sorteerbare, tijdstip-gebaseerde back-upbestandsnaam in UTC:
 * `zzp-backup-YYYYMMDD-HHMMSS.dump`. Lexicografisch sorteren = chronologisch sorteren.
 */
export function buildBackupFilename(now: Date): string {
  const stamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return `${BACKUP_PREFIX}${stamp}${BACKUP_EXT}`;
}

const BACKUP_NAME_PATTERN = new RegExp(`^${BACKUP_PREFIX}\\d{8}-\\d{6}\\${BACKUP_EXT}$`);

/** True als `name` een door deze helper gegenereerde back-upbestandsnaam is. */
export function isBackupFilename(name: string): boolean {
  return BACKUP_NAME_PATTERN.test(name);
}

/**
 * Kiest de te verwijderen back-ups zodat er `keep` nieuwste overblijven. Alleen bestanden met het
 * eigen naampatroon tellen mee (vreemde bestanden worden nooit gesnoeid). Retourneert de oudste
 * boven `keep`, oplopend op leeftijd (oudste eerst). `keep < 0` → niets snoeien.
 */
export function selectBackupsToPrune(files: string[], keep: number): string[] {
  if (keep < 0) return [];
  const backups = files.filter(isBackupFilename).sort(); // lexicografisch = chronologisch (UTC)
  if (backups.length <= keep) return [];
  // Nieuwste = laatste; behoud de laatste `keep`, snoei de rest (oudste eerst).
  return backups.slice(0, backups.length - keep);
}

/** pg_dump-argumenten: custom-format (compact + selectief herstelbaar), zonder owner/rechten. */
export function buildPgDumpArgs(params: { url: string; file: string }): string[] {
  return ["--no-owner", "--no-privileges", "--format=custom", "--file", params.file, params.url];
}

/**
 * pg_restore --list-argumenten: leest alléén de inhoudsopgave (TOC) van een custom-format archief,
 * zónder iets te herstellen (geen `--dbname`, geen schrijfactie). Wordt gebruikt als
 * integriteitscheck: een geldig, niet-afgekapt archief levert een leesbare TOC op.
 */
export function buildPgRestoreListArgs(file: string): string[] {
  return ["--list", file];
}

/**
 * Beoordeelt of de uitvoer van `pg_restore --list` een geldig, niet-leeg custom-format archief
 * beschrijft. De TOC begint met commentaarregels (`;`) gevolgd door minstens één echte
 * TOC-entry-regel (bv. `215; 1259 16385 TABLE public "User" owner`). Een afgekapte/corrupte of lege
 * dump levert géén enkele niet-commentaar-regel op → ongeldig. Puur, zodat de gevaarlijke
 * "is deze back-up bruikbaar?"-beslissing deterministisch te testen is.
 */
export function isValidArchiveListing(output: string | undefined | null): boolean {
  if (!output) return false;
  return output.split("\n").some((line) => line.trim() !== "" && !line.trimStart().startsWith(";"));
}

/**
 * Bepaalt of de zojuist geschreven back-up geverifieerd moet worden vóór de retentie-snoei.
 * Standaard AAN (een onbeproefde back-up is geen back-up). Bewust uitzetten kan via de CLI-vlag
 * `--no-verify` of `BACKUP_SKIP_VERIFY` (elke niet-lege, niet-"false"/"0"-waarde telt als aan) —
 * bv. wanneer `pg_restore` niet op het systeem staat.
 */
export function shouldVerifyBackup(params: {
  noVerifyFlag: boolean;
  skipVerifyEnv: string | undefined | null;
}): boolean {
  if (params.noVerifyFlag) return false;
  const raw = params.skipVerifyEnv?.trim().toLowerCase();
  if (raw && raw !== "false" && raw !== "0") return false;
  return true;
}

/**
 * pg_restore-argumenten: schoon herstel (`--clean --if-exists`) in de doel-database. `--dbname`
 * met de URL wijst pg_restore rechtstreeks naar de database (geen losse host/port-vlaggen nodig).
 */
export function buildPgRestoreArgs(params: { url: string; file: string }): string[] {
  return [
    "--no-owner",
    "--no-privileges",
    "--clean",
    "--if-exists",
    "--dbname",
    params.url,
    params.file,
  ];
}

/** Normaliseert een connectie-URL voor vergelijking (schema/host/pad, zonder wachtwoord/params). */
function restoreTargetKey(url: string): string {
  try {
    const parsed = new URL(url);
    const db = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.protocol}//${parsed.username}@${parsed.host}${db}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * Bevestigt dat het herstel-doel veilig is. Herstellen is destructief (`--clean`): standaard mag
 * het doel NIET gelijk zijn aan de bron-/productie-database. `force === true` heft die blokkade
 * bewust op (bv. een geplande productie-herstelactie), maar dan moet de operator het expliciet
 * kiezen. Werpt `UnsafeRestoreTargetError` als het doel ontbreekt of (zonder force) de bron raakt.
 */
export function assertSafeRestoreTarget(params: {
  target: string | undefined | null;
  source: string | undefined | null;
  force?: boolean;
}): string {
  const target = assertPostgresUrl(params.target, "herstel-doel (TARGET_DATABASE_URL/--target)");
  if (params.force) return target;
  if (params.source && restoreTargetKey(target) === restoreTargetKey(params.source)) {
    throw new UnsafeRestoreTargetError(
      "Het herstel-doel is gelijk aan DATABASE_URL (bron). Herstellen wist en overschrijft de " +
        "doel-database. Herstel naar een lege/wegwerp-database, of geef expliciet --force op als je " +
        "écht over de bron heen wilt herstellen.",
    );
  }
  return target;
}

/**
 * Leest een positief geheel getal uit een CLI-/env-waarde (retentie). Ongeldig/ontbrekend →
 * `fallback`. Nooit negatief.
 */
export function parseKeepCount(value: string | undefined | null, fallback: number): number {
  if (value === undefined || value === null || value.trim() === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return fallback;
  return n;
}
