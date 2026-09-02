import { describe, expect, it } from "vitest";
import {
  assertDrillTarget,
  assertPostgresUrl,
  assertSafeIdentifier,
  assertSafeRestoreTarget,
  buildBackupFilename,
  buildPgDumpArgs,
  buildPgRestoreArgs,
  buildPgRestoreListArgs,
  buildPublicTableCountArgs,
  buildRowCountArgs,
  buildScratchTeardownArgs,
  interpretDrill,
  isBackupFilename,
  isPostgresUrl,
  isValidArchiveListing,
  parseKeepCount,
  parsePsqlCount,
  redactDatabaseUrl,
  selectBackupsToPrune,
  selectLatestBackup,
  shouldVerifyBackup,
  UnsafeIdentifierError,
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

  it("zet uit via een expliciet bevestigende BACKUP_SKIP_VERIFY-waarde", () => {
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "1" })).toBe(false);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "true" })).toBe(false);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "yes" })).toBe(false);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "on" })).toBe(false);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "TRUE" })).toBe(false);
  });

  it("blijft aan bij een uit-achtige of dubbelzinnige waarde (geen footgun)", () => {
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "false" })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "0" })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "FALSE" })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "no" })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "off" })).toBe(true);
    expect(shouldVerifyBackup({ noVerifyFlag: false, skipVerifyEnv: "onzin" })).toBe(true);
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

describe("selectLatestBackup", () => {
  it("kiest de nieuwste geldige back-up (chronologisch via UTC-naam)", () => {
    expect(
      selectLatestBackup([
        "zzp-backup-20260101-000000.dump",
        "zzp-backup-20260901-150000.dump",
        "zzp-backup-20260301-120000.dump",
      ]),
    ).toBe("zzp-backup-20260901-150000.dump");
  });

  it("negeert vreemde bestanden en geeft undefined als er geen geldige back-up is", () => {
    expect(selectLatestBackup(["random.txt", "notes.md"])).toBeUndefined();
    expect(selectLatestBackup([])).toBeUndefined();
    expect(selectLatestBackup(["dump.sql", "zzp-backup-20260901-150000.dump", "backup.tar"])).toBe(
      "zzp-backup-20260901-150000.dump",
    );
  });
});

describe("assertDrillTarget", () => {
  it("accepteert een postgres-doel dat verschilt van de bron", () => {
    expect(
      assertDrillTarget({
        target: "postgres://u:p@scratch:5432/drill",
        source: "postgres://u:p@prod:5432/app",
      }),
    ).toBe("postgres://u:p@scratch:5432/drill");
  });

  it("weigert hard als het doel gelijk is aan de bron (geen force-ontsnapping)", () => {
    const url = "postgres://u:p@prod:5432/app";
    expect(() => assertDrillTarget({ target: url, source: url })).toThrow(UnsafeRestoreTargetError);
    // Ook wanneer alleen het wachtwoord/params verschilt maar host/db/user gelijk zijn.
    expect(() =>
      assertDrillTarget({
        target: "postgres://u:other@prod:5432/app?sslmode=require",
        source: "postgres://u:p@prod:5432/app",
      }),
    ).toThrow(/productie/i);
  });

  it("werpt bij een ontbrekend of niet-postgres doel", () => {
    expect(() => assertDrillTarget({ target: undefined, source: "postgres://h/db" })).toThrow(
      UnsupportedDatabaseError,
    );
    expect(() => assertDrillTarget({ target: "file:./dev.db", source: null })).toThrow(
      UnsupportedDatabaseError,
    );
  });
});

describe("assertSafeIdentifier", () => {
  it("accepteert PascalCase-modeltabellen", () => {
    expect(assertSafeIdentifier("User")).toBe("User");
    expect(assertSafeIdentifier("  Job  ")).toBe("Job");
    expect(assertSafeIdentifier("_Audit_Log2")).toBe("_Audit_Log2");
  });

  it("weigert injectie-/onveilige identifiers", () => {
    for (const bad of [
      'User"; DROP TABLE x;--',
      "public.User",
      "1User",
      "",
      "  ",
      "a b",
      undefined,
    ]) {
      expect(() => assertSafeIdentifier(bad as string)).toThrow(UnsafeIdentifierError);
    }
  });
});

describe("buildPublicTableCountArgs / buildRowCountArgs", () => {
  it("bouwt een kale (tuples-only) schema-tellingsquery met de URL via -d", () => {
    const args = buildPublicTableCountArgs("postgres://h/db");
    expect(args).toContain("-tA");
    expect(args[args.indexOf("-d") + 1]).toBe("postgres://h/db");
    expect(args.join(" ")).toMatch(/information_schema\.tables/);
  });

  it("haalt de (gevalideerde) tabelnaam dubbel aan in de rij-tellingsquery", () => {
    const args = buildRowCountArgs("postgres://h/db", "Job");
    expect(args.join(" ")).toContain('SELECT count(*) FROM "Job";');
  });

  it("weigert een onveilige tabelnaam vóór het bouwen van de query", () => {
    expect(() => buildRowCountArgs("postgres://h/db", 'x"; DROP TABLE y;--')).toThrow(
      UnsafeIdentifierError,
    );
  });
});

describe("buildScratchTeardownArgs", () => {
  it("dropt en herbouwt het public-schema tegen de doel-URL (wist herstelde PII)", () => {
    const args = buildScratchTeardownArgs("postgres://h/scratch");
    expect(args.join(" ")).toContain("DROP SCHEMA IF EXISTS public CASCADE");
    expect(args.join(" ")).toContain("CREATE SCHEMA public");
    expect(args[args.indexOf("-d") + 1]).toBe("postgres://h/scratch");
  });

  it("stopt bij een fout (ON_ERROR_STOP) zodat een mislukte opruiming zichtbaar wordt", () => {
    const args = buildScratchTeardownArgs("postgres://h/scratch");
    expect(args).toContain("ON_ERROR_STOP=1");
  });
});

describe("parsePsqlCount", () => {
  it("leest een niet-negatief geheel getal uit tuples-only-uitvoer", () => {
    expect(parsePsqlCount("42\n")).toBe(42);
    expect(parsePsqlCount("  7  \n")).toBe(7);
    expect(parsePsqlCount("0")).toBe(0);
    // Leidende lege regels worden overgeslagen.
    expect(parsePsqlCount("\n\n13\n")).toBe(13);
  });

  it("geeft null bij lege/onparseerbare uitvoer", () => {
    expect(parsePsqlCount("")).toBeNull();
    expect(parsePsqlCount("   \n")).toBeNull();
    expect(parsePsqlCount("ERROR: relation does not exist")).toBeNull();
    expect(parsePsqlCount("-1")).toBeNull();
    expect(parsePsqlCount(undefined)).toBeNull();
    expect(parsePsqlCount(null)).toBeNull();
  });
});

describe("interpretDrill", () => {
  it("faalt als het schema niet is hersteld (geen/onleesbare tabellen)", () => {
    expect(interpretDrill({ publicTableCount: null, rowCount: 5, verifyTable: "User" }).ok).toBe(
      false,
    );
    expect(interpretDrill({ publicTableCount: 0, rowCount: null, verifyTable: "User" })).toEqual({
      ok: false,
      detail: expect.stringMatching(/geen tabellen/),
    });
  });

  it("faalt als de verificatietabel niet te bevragen is na herstel", () => {
    const v = interpretDrill({ publicTableCount: 30, rowCount: null, verifyTable: "User" });
    expect(v.ok).toBe(false);
    expect(v.detail).toContain("User");
  });

  it("slaagt (met waarschuwing) bij een lege verificatietabel", () => {
    const v = interpretDrill({ publicTableCount: 30, rowCount: 0, verifyTable: "User" });
    expect(v.ok).toBe(true);
    expect(v.detail).toMatch(/leeg/);
  });

  it("slaagt bij hersteld schema + teruglezbare data", () => {
    const v = interpretDrill({ publicTableCount: 30, rowCount: 7, verifyTable: "User" });
    expect(v.ok).toBe(true);
    expect(v.detail).toContain("7");
  });
});
