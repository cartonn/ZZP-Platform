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
//
// Vertrouwelijkheid: een back-up bevat alle gevoelige PII (namen, e-mail, IBAN/KvK/btw, VOG/BIG/
// diploma-metadata, auditlog, berichten). Optioneel worden dumps at-rest versleuteld met AES-256-GCM
// (opt-in via `BACKUP_ENCRYPTION_KEY`) — de buffer-crypto zit hieronder als pure, testbare kern; de
// scripts doen de bestand-I/O (RUNBOOK §5, AVG art. 32).

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

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

/** Extensie-achtervoegsel van een versleutelde back-up: `zzp-backup-…-….dump.enc`. */
const BACKUP_ENC_EXT = ".enc";

const BACKUP_NAME_PATTERN = new RegExp(`^${BACKUP_PREFIX}\\d{8}-\\d{6}\\${BACKUP_EXT}$`);
const BACKUP_ENC_NAME_PATTERN = new RegExp(
  `^${BACKUP_PREFIX}\\d{8}-\\d{6}\\${BACKUP_EXT}\\${BACKUP_ENC_EXT}$`,
);

/** True als `name` een plaintext (`.dump`) back-upbestandsnaam van deze helper is. */
export function isBackupFilename(name: string): boolean {
  return BACKUP_NAME_PATTERN.test(name);
}

/** True als `name` een versleutelde (`.dump.enc`) back-upbestandsnaam van deze helper is. */
export function isEncryptedBackupFilename(name: string): boolean {
  return BACKUP_ENC_NAME_PATTERN.test(name);
}

/**
 * True als `name` een door deze helper beheerde back-up is — plaintext óf versleuteld. Retentie
 * (snoei/nieuwste) moet beide vormen meenemen, zodat het aanzetten van versleuteling de
 * retentie-boekhouding niet stilletjes splitst.
 */
export function isManagedBackupFilename(name: string): boolean {
  return isBackupFilename(name) || isEncryptedBackupFilename(name);
}

/**
 * Geeft de versleutelde bestandsnaam voor een plaintext back-up: `<naam>.dump` → `<naam>.dump.enc`.
 * De timestamp-prefix blijft intact, zodat lexicografisch sorteren chronologisch blijft.
 */
export function encryptedBackupName(name: string): string {
  return `${name}${BACKUP_ENC_EXT}`;
}

/**
 * Kiest de te verwijderen back-ups zodat er `keep` nieuwste overblijven. Alleen door deze helper
 * beheerde bestanden (plaintext óf versleuteld) tellen mee (vreemde bestanden worden nooit
 * gesnoeid). Retourneert de oudste boven `keep`, oplopend op leeftijd (oudste eerst). `keep < 0` →
 * niets snoeien.
 */
export function selectBackupsToPrune(files: string[], keep: number): string[] {
  if (keep < 0) return [];
  const backups = files.filter(isManagedBackupFilename).sort(); // lexicografisch = chronologisch (UTC)
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

/** Bevestigende waarden die een boolean-achtige env-var "aan" zetten. */
const AFFIRMATIVE_ENV_VALUES = new Set(["1", "true", "yes", "on"]);

/**
 * Bepaalt of de zojuist geschreven back-up geverifieerd moet worden vóór de retentie-snoei.
 * Standaard AAN (een onbeproefde back-up is geen back-up). Bewust uitzetten kan via de CLI-vlag
 * `--no-verify` of `BACKUP_SKIP_VERIFY` — alléén een **expliciet bevestigende** waarde
 * (`1`/`true`/`yes`/`on`, hoofdletterongevoelig) telt als skip. Elke andere waarde (leeg, `no`,
 * `off`, `false`, `0`, onzin) laat de verificatie veilig AAN staan: voor een SKIP-veiligheidstoggle
 * hoort alleen een uitdrukkelijk "ja" 'm uit te zetten, nooit een dubbelzinnige waarde.
 */
export function shouldVerifyBackup(params: {
  noVerifyFlag: boolean;
  skipVerifyEnv: string | undefined | null;
}): boolean {
  if (params.noVerifyFlag) return false;
  const raw = params.skipVerifyEnv?.trim().toLowerCase();
  if (raw && AFFIRMATIVE_ENV_VALUES.has(raw)) return false;
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

// ── Herstel-drill ─────────────────────────────────────────────────────────────────────────────
// De back-up-verificatie (`isValidArchiveListing`, via `pg_restore --list`) leest alléén de
// inhoudsopgave (TOC) van het archief — dat bewijst dat de kop leesbaar/niet-afgekapt is, niet dat
// de dump écht te herstellen is. Een corrupte data-block of afgekapte object-data kan de TOC-check
// passeren en pas op een echt herstel falen. De drill sluit dat gat: herstel de nieuwste back-up in
// een WEGWERP scratch-database en lees schema + data terug. "Een onbeproefde back-up is geen back-up",
// nu volledig. De pure kern hieronder maakt de gevaarlijke keuzes (welk bestand, welk doel, welke
// query, is de uitkomst gezond?) deterministisch testbaar; het script doet alleen de child-processen.

/**
 * Kiest de nieuwste back-up uit een lijst bestandsnamen (voor de drill: standaard test je de meest
 * recente back-up). Alleen namen met het eigen patroon tellen mee; de bestandsnaam is UTC-tijd-
 * gebaseerd, dus lexicografisch sorteren = chronologisch. Geen geldige back-up → `undefined`.
 */
export function selectLatestBackup(files: string[]): string | undefined {
  const backups = files.filter(isManagedBackupFilename).sort();
  return backups.length ? backups[backups.length - 1] : undefined;
}

/**
 * Bevestigt dat het drill-doel veilig is. Een drill herstelt destructief (`--clean`) in een
 * WEGWERP-database — het doel mag daarom NOOIT de bron-/productie-database zijn. Anders dan
 * {@link assertSafeRestoreTarget} kent de drill BEWUST géén `--force`-ontsnapping: een drill die de
 * productie kan raken is geen drill maar een incident. Werpt `UnsafeRestoreTargetError` als het doel
 * ontbreekt of de bron raakt.
 */
export function assertDrillTarget(params: {
  target: string | undefined | null;
  source: string | undefined | null;
}): string {
  const target = assertPostgresUrl(params.target, "drill-doel (DRILL_DATABASE_URL/--target)");
  if (params.source && restoreTargetKey(target) === restoreTargetKey(params.source)) {
    throw new UnsafeRestoreTargetError(
      "Het drill-doel is gelijk aan DATABASE_URL (bron/productie). Een herstel-drill wist en " +
        "overschrijft het doel — dat mag NOOIT de productie-database zijn. Wijs DRILL_DATABASE_URL " +
        "naar een lege wegwerp-database. Een drill kent bewust geen --force.",
    );
  }
  return target;
}

/**
 * Ongeldige SQL-identifier voor de drill-verificatietabel. We bouwen de count-query met een
 * ingebedde, dubbel-aangehaalde identifier; alleen een strikt patroon mag erin zodat er nooit
 * injectie via een env-/CLI-waarde ontstaat.
 */
export class UnsafeIdentifierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeIdentifierError";
  }
}

// Prisma-modeltabellen zijn PascalCase (bv. "User"); sta letters/cijfers/underscore toe, moet met
// een letter of underscore beginnen. Bewust géén punt/schema-prefix (we tellen in `public`).
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Bevestigt dat `name` een veilige, aanhaalbare SQL-identifier is; werpt anders. */
export function assertSafeIdentifier(name: string | undefined | null): string {
  const trimmed = (name ?? "").trim();
  if (!IDENTIFIER_PATTERN.test(trimmed)) {
    throw new UnsafeIdentifierError(
      `Ongeldige tabelnaam voor de drill-verificatie: ${JSON.stringify(name)}. Toegestaan: letters, ` +
        "cijfers en underscore, beginnend met een letter/underscore.",
    );
  }
  return trimmed;
}

/**
 * psql-argumenten die het aantal tabellen in het `public`-schema teruggeven. Bewijst dat het schema
 * daadwerkelijk in de scratch-database is hersteld (een leeg/mislukt herstel geeft 0). `-tA` levert
 * één kale waarde (tuples-only, unaligned) zodat de uitvoer triviaal te parsen is.
 */
export function buildPublicTableCountArgs(url: string): string[] {
  return [
    "-tA",
    "-c",
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';",
    "-d",
    url,
  ];
}

/**
 * psql-argumenten die het aantal rijen in één (aangehaalde) tabel teruggeven — het data-bewijs: de
 * herstelde tabel is echt te bevragen. De identifier wordt eerst gevalideerd + dubbel aangehaald.
 */
export function buildRowCountArgs(url: string, table: string): string[] {
  const safe = assertSafeIdentifier(table);
  return ["-tA", "-c", `SELECT count(*) FROM "${safe}";`, "-d", url];
}

/**
 * Parset de uitvoer van een `psql -tA -c "SELECT count(*) ..."` naar een niet-negatief geheel getal.
 * Onparseerbaar/leeg → `null` (de drill leest dat als "niet teruglezbaar" → fout).
 */
export function parsePsqlCount(output: string | undefined | null): number | null {
  if (output === undefined || output === null) return null;
  const first = output
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "");
  if (first === undefined) return null;
  if (!/^\d+$/.test(first)) return null;
  return Number(first);
}

/**
 * psql-argumenten die de zojuist herstelde data weer VOLLEDIG uit de scratch-database wissen: drop het
 * hele `public`-schema (met alle herstelde tabellen/PII) en maak het leeg opnieuw aan. De drill herstelt
 * een volledige productie-back-up — inclusief namen, e-mails, IBAN/KvK/btw en VOG/BIG/diploma-metadata —
 * in een wegwerp-database; zónder opruimen blijft die gevoelige kopie tot de vólgende drill (dagen/weken)
 * querybaar in een tweede, minder-bewaakte omgeving staan. Dat is een onnodige, langlevende PII-kopie
 * (AVG art. 5(1)(c) minimalisatie / art. 5(1)(e) opslagbeperking / art. 32 vertrouwelijkheid). Deze
 * teardown draait daarom ALTIJD ná de teruglees-verificatie — of die nu slaagt of faalt — zodat de drill
 * bewijst dat de back-up herstelbaar is zónder een blijvende schaduwkopie achter te laten. `ON_ERROR_STOP`
 * zorgt dat een mislukte drop een niet-nul exitcode geeft (zodat de caller kan waarschuwen i.p.v. stil PII
 * te laten staan). Puur, zodat de commando-opbouw deterministisch te testen is.
 */
export function buildScratchTeardownArgs(url: string): string[] {
  return [
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;",
    "-d",
    url,
  ];
}

/** Uitkomst van een herstel-drill-beoordeling. */
export interface DrillVerdict {
  ok: boolean;
  /** Korte, niet-gevoelige toelichting (nooit secrets/URL/wachtwoord). */
  detail: string;
}

/**
 * Beoordeelt de teruggelezen tellingen na een herstel in de scratch-database. Puur, zodat de
 * "is deze back-up écht bruikbaar?"-beslissing deterministisch te testen is.
 *
 * - `publicTableCount === null` of `=== 0` → FOUT: het schema is niet hersteld (geen tabellen).
 * - `rowCount === null` → FOUT: de verificatietabel is niet te bevragen (herstel onvolledig/corrupt).
 * - `rowCount === 0` → OK-met-waarschuwing: schema hersteld, maar de tabel is leeg (kan legitiem
 *   zijn bij een verse DB; de drill bewijst leesbaarheid, niet een specifiek recordaantal).
 * - anders → OK: schema + data teruggelezen.
 */
export function interpretDrill(params: {
  publicTableCount: number | null;
  rowCount: number | null;
  verifyTable: string;
}): DrillVerdict {
  const { publicTableCount, rowCount, verifyTable } = params;
  if (publicTableCount === null) {
    return { ok: false, detail: "Kon het aantal tabellen in het herstelde schema niet lezen." };
  }
  if (publicTableCount === 0) {
    return {
      ok: false,
      detail: "Het herstelde schema bevat geen tabellen — het herstel is mislukt of leeg.",
    };
  }
  if (rowCount === null) {
    return {
      ok: false,
      detail: `Verificatietabel "${verifyTable}" is niet te bevragen na herstel (onvolledig/corrupt).`,
    };
  }
  if (rowCount === 0) {
    return {
      ok: true,
      detail: `${publicTableCount} tabel(len) hersteld; "${verifyTable}" is leesbaar maar leeg (0 rijen).`,
    };
  }
  return {
    ok: true,
    detail: `${publicTableCount} tabel(len) hersteld; "${verifyTable}" bevat ${rowCount} rij(en).`,
  };
}

// ── At-rest-versleuteling van back-ups (AES-256-GCM) ─────────────────────────────────────────────
// Een back-up bevat alle gevoelige PII van het platform. De opslag versleutelt die at-rest zodra
// `BACKUP_ENCRYPTION_KEY` gezet is — symmetrisch, met Node's ingebouwde `crypto` (GEEN extra
// dependency). AES-256-GCM levert vertrouwelijkheid én integriteit (de auth-tag detecteert elke
// wijziging/beschadiging). De pure buffer-crypto hieronder is deterministisch testbaar; de scripts
// doen de bestand-I/O (lezen/schrijven/tijdelijk-ontsleutelen). Ontwerp bewust conservatief:
// een gezette-maar-ongeldige sleutel is een HARDE fout (nooit stil terugvallen op plaintext —
// "halve activering is gevaarlijker dan geen", CLAUDE.md §8); een afwezige sleutel = plaintext
// (huidig gedrag, pilot ongewijzigd).

/** Sleutel-/versleutelingsfout (ontbrekende/ongeldige sleutel, of een onontsleutelbaar archief). */
export class BackupEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupEncryptionError";
  }
}

// Bestandsformaat van een versleutelde back-up (bytes, in volgorde):
//   magic "ZBK1" (4) | iv (12) | auth-tag (16) | ciphertext (rest)
// Het magic-header maakt auto-detectie triviaal (restore/drill herkennen een versleuteld archief
// zonder op de bestandsextensie te hoeven vertrouwen).
const ENC_MAGIC = Buffer.from("ZBK1", "ascii");
const ENC_IV_BYTES = 12; // 96-bit nonce — de aanbevolen GCM-IV-lengte.
const ENC_TAG_BYTES = 16; // 128-bit GCM auth-tag.
const ENC_KEY_BYTES = 32; // AES-256.
const ENC_HEADER_BYTES = ENC_MAGIC.length + ENC_IV_BYTES + ENC_TAG_BYTES;

/**
 * Leest de back-up-versleutelingssleutel uit een ruwe env-waarde. Verwacht **base64** die exact
 * 32 bytes decodeert (AES-256), bv. `openssl rand -base64 32`.
 *
 * - leeg/ontbrekend → `null`: versleuteling staat uit, de back-up blijft plaintext (huidig gedrag).
 * - gezet maar geen geldige 32-byte base64 → **werpt** `BackupEncryptionError`: een operator die een
 *   sleutel zet, verwacht versleuteling; stil plaintext schrijven zou gevaarlijker zijn dan geen
 *   sleutel (CLAUDE.md §8). De caller hoort dit hard te laten falen.
 */
export function resolveBackupEncryptionKey(raw: string | undefined | null): Buffer | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  // Strikte base64: alleen base64-alfabet + optionele padding, lengte veelvoud van 4.
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) || trimmed.length % 4 !== 0) {
    throw new BackupEncryptionError(
      "BACKUP_ENCRYPTION_KEY is geen geldige base64. Genereer een sleutel met " +
        "`openssl rand -base64 32` en zet die in de secrets.",
    );
  }
  const key = Buffer.from(trimmed, "base64");
  if (key.length !== ENC_KEY_BYTES) {
    throw new BackupEncryptionError(
      `BACKUP_ENCRYPTION_KEY moet exact ${ENC_KEY_BYTES} bytes (base64) zijn voor AES-256, maar is ` +
        `${key.length} byte(s). Genereer een sleutel met \`openssl rand -base64 32\`.`,
    );
  }
  return key;
}

/** True als `blob` het magic-header van een door deze helper versleutelde back-up draagt. */
export function looksEncryptedBackup(blob: Buffer): boolean {
  return blob.length >= ENC_MAGIC.length && blob.subarray(0, ENC_MAGIC.length).equals(ENC_MAGIC);
}

/**
 * Versleutelt een plaintext back-up-buffer met AES-256-GCM. Retourneert het complete archief
 * (magic | iv | auth-tag | ciphertext). Elke aanroep gebruikt een verse, willekeurige IV.
 */
export function encryptBackup(plaintext: Buffer, key: Buffer): Buffer {
  if (key.length !== ENC_KEY_BYTES) {
    throw new BackupEncryptionError(`Versleutelsleutel moet ${ENC_KEY_BYTES} bytes zijn.`);
  }
  const iv = randomBytes(ENC_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([ENC_MAGIC, iv, tag, ciphertext]);
}

/**
 * Ontsleutelt een archief dat door {@link encryptBackup} is gemaakt. Werpt `BackupEncryptionError`
 * bij een verkeerd magic-header, een te kort/afgekapt archief, of een mislukte auth-tag-check
 * (verkeerde sleutel óf beschadigde/gemanipuleerde inhoud — GCM maakt die twee niet los).
 */
export function decryptBackup(blob: Buffer, key: Buffer): Buffer {
  if (key.length !== ENC_KEY_BYTES) {
    throw new BackupEncryptionError(`Ontsleutelsleutel moet ${ENC_KEY_BYTES} bytes zijn.`);
  }
  if (!looksEncryptedBackup(blob)) {
    throw new BackupEncryptionError(
      "Dit is geen versleutelde back-up (onbekend/ontbrekend header). Herstel het als plaintext " +
        "of controleer of je het juiste bestand opgeeft.",
    );
  }
  if (blob.length < ENC_HEADER_BYTES) {
    throw new BackupEncryptionError(
      "Versleutelde back-up is afgekapt (te kort voor iv + auth-tag).",
    );
  }
  const iv = blob.subarray(ENC_MAGIC.length, ENC_MAGIC.length + ENC_IV_BYTES);
  const tag = blob.subarray(ENC_MAGIC.length + ENC_IV_BYTES, ENC_HEADER_BYTES);
  const ciphertext = blob.subarray(ENC_HEADER_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new BackupEncryptionError(
      "Kon de back-up niet ontsleutelen: verkeerde BACKUP_ENCRYPTION_KEY of een beschadigd/" +
        "gemanipuleerd archief (de auth-tag klopt niet).",
    );
  }
}
