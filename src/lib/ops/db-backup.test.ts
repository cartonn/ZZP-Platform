import { describe, expect, it } from "vitest";
import {
  assertPostgresUrl,
  assertSafeRestoreTarget,
  buildBackupFilename,
  buildPgDumpArgs,
  buildPgRestoreArgs,
  buildPgRestoreListArgs,
  isBackupFilename,
  isPostgresUrl,
  isValidArchiveListing,
  parseKeepCount,
  redactDatabaseUrl,
  selectBackupsToPrune,
  shouldVerifyBackup,
  UnsafeRestoreTargetError,
  UnsupportedDatabaseError,
} from "@/lib/ops/db-backup";

describe("isPostgresUrl", () => {
  it("herkent postgres- en postgresql-schema's", () => {
    expect(isPostgresUrl("postgres://u:p@host:5432/db")).toBe(true);
    expect(isPostgresUrl("postgresql://u:p@host/db")).toBe(true);
    expect(isPostgresUrl("POSTGRESQL://u:p@host/db")).toBe(true);
    expect(isPostgresUrl("  postgres://host/db  ")).toBe(true);
  });

  it("wijst niet-postgres-URL's af", () => {
    expect(isPostgresUrl("file:./dev.db")).toBe(false);
    expect(isPostgresUrl("mysql://host/db")).toBe(false);
    expect(isPostgresUrl("")).toBe(false);
    expect(isPostgresUrl(undefined)).toBe(false);
    expect(isPostgresUrl(null)).toBe(false);
  });
});

describe("assertPostgresUrl", () => {
  it("geeft de getrimde URL terug bij een geldige postgres-URL", () => {
    expect(assertPostgresUrl("  postgres://host/db  ")).toBe("postgres://host/db");
  });

  it("werpt bij ontbrekende URL", () => {
    expect(() => assertPostgresUrl("")).toThrow(UnsupportedDatabaseError);
    expect(() => assertPostgresUrl(undefined)).toThrow(/niet gezet/);
  });

  it("werpt bij een SQLite-/niet-postgres-URL met heldere melding", () => {
    expect(() => assertPostgresUrl("file:./dev.db")).toThrow(UnsupportedDatabaseError);
    expect(() => assertPostgresUrl("file:./dev.db", "DATABASE_URL")).toThrow(/geen PostgreSQL-URL/);
  });
});

describe("redactDatabaseUrl", () => {
  it("verbergt het wachtwoord", () => {
    expect(redactDatabaseUrl("postgres://user:secret@host:5432/db")).toBe(
      "postgres://user:***@host:5432/db",
    );
  });

  it("laat een URL zonder wachtwoord ongemoeid", () => {
    expect(redactDatabaseUrl("postgres://user@host/db")).toBe("postgres://user@host/db");
  });

  it("valt terug op regex bij een niet-parseerbare URL", () => {
    expect(redactDatabaseUrl("://user:secret@host/db")).toBe("://user:***@host/db");
  });

  it("geeft lege string bij lege input", () => {
    expect(redactDatabaseUrl("")).toBe("");
    expect(redactDatabaseUrl(undefined)).toBe("");
  });
});

describe("buildBackupFilename", () => {
  it("bouwt een UTC-tijdstip-gebaseerde, sorteerbare naam", () => {
    const name = buildBackupFilename(new Date("2026-07-10T15:02:48.000Z"));
    expect(name).toBe("zzp-backup-20260710-150248.dump");
    expect(isBackupFilename(name)).toBe(true);
  });

  it("padt maand/dag/tijd met voorloopnullen", () => {
    expect(buildBackupFilename(new Date("2026-01-05T03:07:09.000Z"))).toBe(
      "zzp-backup-20260105-030709.dump",
    );
  });
});

describe("isBackupFilename", () => {
  it("herkent alleen het eigen naampatroon", () => {
    expect(isBackupFilename("zzp-backup-20260710-150248.dump")).toBe(true);
    expect(isBackupFilename("backup-20260710.dump")).toBe(false);
    expect(isBackupFilename("zzp-backup-20260710.dump")).toBe(false);
    expect(isBackupFilename("zzp-backup-20260710-150248.sql")).toBe(false);
    expect(isBackupFilename("random.txt")).toBe(false);
  });
});

describe("selectBackupsToPrune", () => {
  const files = [
    "zzp-backup-20260710-150248.dump",
    "zzp-backup-20260708-090000.dump",
    "zzp-backup-20260709-120000.dump",
    "notes.txt", // vreemd bestand: wordt nooit gesnoeid
  ];

  it("behoudt de nieuwste `keep` en snoeit de oudste (oudste eerst)", () => {
    expect(selectBackupsToPrune(files, 1)).toEqual([
      "zzp-backup-20260708-090000.dump",
      "zzp-backup-20260709-120000.dump",
    ]);
  });

  it("snoeit niets wanneer er niet meer dan `keep` back-ups zijn", () => {
    expect(selectBackupsToPrune(files, 3)).toEqual([]);
    expect(selectBackupsToPrune(files, 5)).toEqual([]);
  });

  it("raakt vreemde bestanden nooit aan, zelfs bij keep=0", () => {
    const pruned = selectBackupsToPrune(files, 0);
    expect(pruned).toContain("zzp-backup-20260708-090000.dump");
    expect(pruned).not.toContain("notes.txt");
    expect(pruned).toHaveLength(3);
  });

  it("snoeit niets bij een negatieve keep (uitgeschakeld)", () => {
    expect(selectBackupsToPrune(files, -1)).toEqual([]);
  });
});

describe("buildPgDumpArgs", () => {
  it("bouwt custom-format argumenten zonder owner/rechten", () => {
    expect(buildPgDumpArgs({ url: "postgres://host/db", file: "out.dump" })).toEqual([
      "--no-owner",
      "--no-privileges",
      "--format=custom",
      "--file",
      "out.dump",
      "postgres://host/db",
    ]);
  });
});

describe("buildPgRestoreArgs", () => {
  it("bouwt een schoon herstel (--clean --if-exists) naar --dbname", () => {
    expect(buildPgRestoreArgs({ url: "postgres://host/db", file: "in.dump" })).toEqual([
      "--no-owner",
      "--no-privileges",
      "--clean",
      "--if-exists",
      "--dbname",
      "postgres://host/db",
      "in.dump",
    ]);
  });
});

describe("buildPgRestoreListArgs", () => {
  it("leest alleen de inhoudsopgave, zonder --dbname of schrijfactie", () => {
    expect(buildPgRestoreListArgs("out.dump")).toEqual(["--list", "out.dump"]);
  });
});

describe("isValidArchiveListing", () => {
  it("herkent een geldige TOC met minstens één entry-regel", () => {
    const listing = [
      ";",
      "; Archive created at 2026-07-10 15:02:48 UTC",
      ";     dbname: app",
      ";",
      "215; 1259 16385 TABLE public User owner",
      "216; 1259 16390 TABLE public Job owner",
    ].join("\n");
    expect(isValidArchiveListing(listing)).toBe(true);
  });

  it("wijst een leeg/whitespace/alleen-commentaar (afgekapt) archief af", () => {
    expect(isValidArchiveListing("")).toBe(false);
    expect(isValidArchiveListing(undefined)).toBe(false);
    expect(isValidArchiveListing(null)).toBe(false);
    expect(isValidArchiveListing("   \n  \n")).toBe(false);
    expect(isValidArchiveListing("; alleen een commentaarkop\n;\n")).toBe(false);
    expect(isValidArchiveListing("   ; ingesprongen commentaar telt ook niet")).toBe(false);
  });
});

describe("shouldVerifyBackup", () => {
  it("verifieert standaard (een onbeproefde back-up is geen back-up)", () => {
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: undefined })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "" })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "  " })).toBe(true);
  });

  it("zet uit via de --no-verify-vlag", () => {
    expect(shouldVerifyBackup({ noVerifyFlag: true, skipVerifyEnv: undefined })).toBe(false);
  });

  it("zet uit via een aan-achtige BACKUP_SKIP_VERIFY-waarde", () => {
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "1" })).toBe(false);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "true" })).toBe(false);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "yes" })).toBe(false);
  });

  it("blijft aan bij een uit-achtige BACKUP_SKIP_VERIFY-waarde", () => {
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "false" })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "0" })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "FALSE" })).toBe(true);
  });
});

describe("assertSafeRestoreTarget", () => {
  const source = "postgres://user:pw@prod-host:5432/app";

  it("staat een ander doel dan de bron toe", () => {
    const target = "postgres://user:pw@staging-host:5432/app";
    expect(assertSafeRestoreTarget({ target, source })).toBe(target);
  });

  it("blokkeert herstel over de bron-database (zelfde host/db, ander wachtwoord telt niet mee)", () => {
    const target = "postgres://user:OTHER@prod-host:5432/app";
    expect(() => assertSafeRestoreTarget({ target, source })).toThrow(UnsafeRestoreTargetError);
    expect(() => assertSafeRestoreTarget({ target, source })).toThrow(/gelijk aan DATABASE_URL/);
  });

  it("laat herstel over de bron toe met expliciete force", () => {
    expect(assertSafeRestoreTarget({ target: source, source, force: true })).toBe(source);
  });

  it("werpt bij een ontbrekend of niet-postgres doel", () => {
    expect(() => assertSafeRestoreTarget({ target: "", source })).toThrow(UnsupportedDatabaseError);
    expect(() => assertSafeRestoreTarget({ target: "file:./x.db", source })).toThrow(
      UnsupportedDatabaseError,
    );
  });
});

describe("parseKeepCount", () => {
  it("leest een geldig positief geheel getal", () => {
    expect(parseKeepCount("7", 14)).toBe(7);
    expect(parseKeepCount("0", 14)).toBe(0);
  });

  it("valt terug bij lege, ontbrekende of ongeldige waarde", () => {
    expect(parseKeepCount(undefined, 14)).toBe(14);
    expect(parseKeepCount("", 14)).toBe(14);
    expect(parseKeepCount("  ", 14)).toBe(14);
    expect(parseKeepCount("-3", 14)).toBe(14);
    expect(parseKeepCount("3.5", 14)).toBe(14);
    expect(parseKeepCount("abc", 14)).toBe(14);
  });
});
