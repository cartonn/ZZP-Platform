import { describe, expect, it } from "vitest";
import type { Env } from "@/lib/env";
import { collectSystemStatus, databaseKind, type StatusItem } from "@/lib/system-status";

// Minimale, geldige basis-env; per test overschrijven we alleen wat relevant is. We casten naar Env
// omdat de echte Zod-defaults hier niet nodig zijn voor de PURE status-afleiding.
function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    DATABASE_URL: "postgresql://user:pass@host:5432/db",
    AUTH_SECRET: "0123456789abcdef0123456789abcdef",
    STORAGE_DRIVER: "local",
    ROUTING_PROVIDER: "offline",
    SEMANTIC_MATCHER: "local",
    RATE_LIMIT_STORE: "memory",
    NODE_ENV: "production",
    EMAIL_DRIVER: "noop",
    BILLING_PROVIDER: "noop",
    UPLOAD_SCANNER: "noop",
    ...overrides,
  } as Env;
}

function itemByKey(env: Env, key: string): StatusItem {
  const status = collectSystemStatus(env);
  const item = status.groups.flatMap((g) => g.items).find((i) => i.key === key);
  if (!item) throw new Error(`geen status-item met key ${key}`);
  return item;
}

describe("databaseKind", () => {
  it("herkent PostgreSQL", () => {
    expect(databaseKind("postgresql://x")).toBe("PostgreSQL");
    expect(databaseKind("postgres://x")).toBe("PostgreSQL");
  });
  it("herkent SQLite", () => {
    expect(databaseKind("file:./dev.db")).toBe("SQLite");
    expect(databaseKind("sqlite:./x.db")).toBe("SQLite");
  });
  it("valt terug op onbekend", () => {
    expect(databaseKind("mysql://x")).toBe("onbekend");
  });
});

describe("collectSystemStatus — web-push-posture", () => {
  it("toont push als bekabeld (ok) wanneer beide VAPID-sleutels gezet zijn", () => {
    const item = itemByKey(
      makeEnv({ VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv" }),
      "web-push",
    );
    expect(item.level).toBe("ok");
    expect(item.mode).toBe("aan");
  });

  it("toont push als uit (fallback, nooit aandacht) zonder sleutels — ook in productie", () => {
    const item = itemByKey(makeEnv({ NODE_ENV: "production" }), "web-push");
    expect(item.level).toBe("fallback");
    expect(item.mode).toBe("uit");
    expect(item.detail).toMatch(/VAPID_PUBLIC_KEY/);
  });
});

describe("collectSystemStatus — semantische-matching-posture", () => {
  it("toont de lokale matcher als ok (productie-geschikte default)", () => {
    const item = itemByKey(makeEnv({ SEMANTIC_MATCHER: "local" }), "semantic-matcher");
    expect(item.level).toBe("ok");
    expect(item.mode).toBe("local");
  });

  it("markeert pgvector als aandacht in productie (geselecteerd maar niet operationeel)", () => {
    const item = itemByKey(
      makeEnv({ SEMANTIC_MATCHER: "pgvector", NODE_ENV: "production" }),
      "semantic-matcher",
    );
    expect(item.level).toBe("attention");
    expect(item.mode).toBe("pgvector");
    expect(item.detail).toMatch(/lokale fallback/);
  });

  it("toont pgvector buiten productie louter informatief (fallback, geen aandacht)", () => {
    const item = itemByKey(
      makeEnv({ SEMANTIC_MATCHER: "pgvector", NODE_ENV: "development" }),
      "semantic-matcher",
    );
    expect(item.level).toBe("fallback");
  });
});

describe("collectSystemStatus — volledig bekabelde productie", () => {
  const env = makeEnv({
    STORAGE_DRIVER: "s3",
    STORAGE_S3_SSE: "AES256",
    EMAIL_DRIVER: "resend",
    BILLING_PROVIDER: "stripe",
    UPLOAD_SCANNER: "clamav",
    RATE_LIMIT_STORE: "upstash",
    SENTRY_DSN: "https://x@sentry.io/1",
    CRON_SECRET: "s".repeat(20),
    SHARE_TOKEN_SECRET: "s".repeat(20),
    AUTH_URL: "https://app.example.nl",
    DIPLOMA_VERIFIER: "duo",
    BIG_VERIFIER: "bigregister",
    IDENTITY_VERIFIER: "idin",
    SECURITY_CONTACT: "security@example.nl",
    DATABASE_CONNECTION_LIMIT: "10",
    AUDIT_LOG_RETENTION_DAYS: "365",
    PASSWORD_BREACH_CHECK: "hibp",
    VAPID_PUBLIC_KEY: "pub",
    VAPID_PRIVATE_KEY: "priv",
  });

  it("markeert álles als ok en geeft geen aandacht-items", () => {
    const status = collectSystemStatus(env);
    expect(status.production).toBe(true);
    expect(status.counts.attention).toBe(0);
    expect(status.counts.fallback).toBe(0);
    expect(status.counts.ok).toBeGreaterThan(0);
    // Volledig bekabeld = geen boot-waarschuwingen.
    expect(status.warnings).toEqual([]);
  });
});

describe("collectSystemStatus — productie-fallbacks vragen aandacht", () => {
  const env = makeEnv(); // alle defaults op fallback, in productie

  it("SQLite in productie = aandacht", () => {
    const sqliteEnv = makeEnv({ DATABASE_URL: "file:./dev.db" });
    expect(itemByKey(sqliteEnv, "database").level).toBe("attention");
  });
  it("lokale opslag in productie = aandacht", () => {
    expect(itemByKey(env, "storage").level).toBe("attention");
  });
  it("demo-verifiers in productie zonder demo-data = aandacht (fail-closed)", () => {
    expect(itemByKey(env, "verifier-diploma").level).toBe("attention");
    expect(itemByKey(env, "verifier-big").level).toBe("attention");
    expect(itemByKey(env, "verifier-identity").level).toBe("attention");
  });
  it("noop e-mail in productie = aandacht", () => {
    expect(itemByKey(env, "email").level).toBe("attention");
  });
  it("noop billing blijft fallback (demo is een geldige eindtoestand)", () => {
    expect(itemByKey(env, "billing").level).toBe("fallback");
  });
  it("ontbrekend CRON_SECRET in productie = aandacht", () => {
    expect(itemByKey(env, "task-cron").level).toBe("attention");
  });
  it("geen Sentry blijft fallback (optioneel)", () => {
    expect(itemByKey(env, "error-monitoring").level).toBe("fallback");
  });
  it("levert de boot-waarschuwingen mee", () => {
    expect(collectSystemStatus(env).warnings.length).toBeGreaterThan(0);
  });
});

describe("collectSystemStatus — zoekmachine-indexering", () => {
  it("afgeschermd (default) = ok met privé-modus", () => {
    const item = itemByKey(makeEnv(), "search-indexing");
    expect(item.mode).toBe("afgeschermd");
    expect(item.level).toBe("ok");
  });
  it("ALLOW_INDEXING=true = ok met geïndexeerd-modus", () => {
    const item = itemByKey(makeEnv({ ALLOW_INDEXING: "true" }), "search-indexing");
    expect(item.mode).toBe("geïndexeerd");
    expect(item.level).toBe("ok");
  });
  it("voegt geen aandacht/fallback of boot-waarschuwing toe (privé is veilig)", () => {
    // Volledig bekabelde productie zonder ALLOW_INDEXING mag géén aandacht/fallback/waarschuwing
    // krijgen door dit item — privé indexeren is de bewuste, veilige pilot-default.
    const wired = makeEnv({
      STORAGE_DRIVER: "s3",
      STORAGE_S3_SSE: "AES256",
      EMAIL_DRIVER: "resend",
      BILLING_PROVIDER: "stripe",
      UPLOAD_SCANNER: "clamav",
      RATE_LIMIT_STORE: "upstash",
      SENTRY_DSN: "https://x@sentry.io/1",
      CRON_SECRET: "s".repeat(20),
      SHARE_TOKEN_SECRET: "s".repeat(20),
      AUTH_URL: "https://app.example.nl",
      DIPLOMA_VERIFIER: "duo",
      BIG_VERIFIER: "bigregister",
      IDENTITY_VERIFIER: "idin",
      SECURITY_CONTACT: "security@example.nl",
      DATABASE_CONNECTION_LIMIT: "10",
      AUDIT_LOG_RETENTION_DAYS: "365",
      PASSWORD_BREACH_CHECK: "hibp",
      VAPID_PUBLIC_KEY: "pub",
      VAPID_PRIVATE_KEY: "priv",
    });
    const status = collectSystemStatus(wired);
    expect(status.counts.attention).toBe(0);
    expect(status.counts.fallback).toBe(0);
    expect(status.warnings).toEqual([]);
  });
});

describe("collectSystemStatus — DB-connectiepool", () => {
  it("Prisma-default op Postgres in productie = aandacht", () => {
    const item = itemByKey(makeEnv(), "db-connection-pool");
    expect(item.mode).toBe("Prisma-default");
    expect(item.level).toBe("attention");
  });
  it("expliciete DATABASE_CONNECTION_LIMIT = ok en toont extra's", () => {
    const item = itemByKey(
      makeEnv({
        DATABASE_CONNECTION_LIMIT: "8",
        DATABASE_POOL_TIMEOUT: "20",
        DATABASE_PGBOUNCER: "true",
      }),
      "db-connection-pool",
    );
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("limit 8");
    expect(item.mode).toContain("pool_timeout=20");
    expect(item.mode).toContain("pgbouncer");
  });
  it("op SQLite niet van toepassing (geen aandacht)", () => {
    const item = itemByKey(makeEnv({ DATABASE_URL: "file:./dev.db" }), "db-connection-pool");
    expect(item.mode).toBe("n.v.t.");
    expect(item.level).toBe("fallback");
  });
});

describe("collectSystemStatus — onderhoudsmodus", () => {
  it("uit (default) = ok", () => {
    const item = itemByKey(makeEnv(), "maintenance-mode");
    expect(item.mode).toBe("uit");
    expect(item.level).toBe("ok");
  });
  it("aan = aandacht, met admin-bypass-modus", () => {
    const item = itemByKey(makeEnv({ MAINTENANCE_MODE: "true" }), "maintenance-mode");
    expect(item.mode).toBe("aan (admins erdoor)");
    expect(item.level).toBe("attention");
  });
  it("aan met MAINTENANCE_ALLOW_ADMIN=false = volledige afsluiting", () => {
    const item = itemByKey(
      makeEnv({ MAINTENANCE_MODE: "true", MAINTENANCE_ALLOW_ADMIN: "false" }),
      "maintenance-mode",
    );
    expect(item.mode).toBe("aan (volledig)");
    expect(item.level).toBe("attention");
  });
  it("aan in productie levert een boot-waarschuwing", () => {
    const status = collectSystemStatus(makeEnv({ MAINTENANCE_MODE: "true" }));
    expect(status.warnings.some((m) => /MAINTENANCE_MODE/.test(m))).toBe(true);
  });
});

describe("collectSystemStatus — beveiligingscontact (security.txt)", () => {
  it("SECURITY_CONTACT gezet = ok", () => {
    const item = itemByKey(
      makeEnv({ SECURITY_CONTACT: "security@example.nl" }),
      "security-contact",
    );
    expect(item.mode).toBe("gezet");
    expect(item.level).toBe("ok");
  });
  it("ontbrekend SECURITY_CONTACT = fallback (afgeleid meldpunt, geen aandacht)", () => {
    const item = itemByKey(makeEnv(), "security-contact");
    expect(item.mode).toBe("afgeleid");
    expect(item.level).toBe("fallback");
  });
});

describe("collectSystemStatus — gelekt-wachtwoord-controle", () => {
  it("standaard (noop) = fallback met mode noop", () => {
    const item = itemByKey(makeEnv({ PASSWORD_BREACH_CHECK: "noop" }), "password-breach");
    expect(item.mode).toBe("noop");
    expect(item.level).toBe("fallback");
  });
  it("hibp = ok", () => {
    const item = itemByKey(makeEnv({ PASSWORD_BREACH_CHECK: "hibp" }), "password-breach");
    expect(item.mode).toBe("hibp");
    expect(item.level).toBe("ok");
  });
});

describe("collectSystemStatus — auditlog-retentie", () => {
  it("gezet venster = ok met dagen in de modus", () => {
    const item = itemByKey(makeEnv({ AUDIT_LOG_RETENTION_DAYS: "365" }), "audit-retention");
    expect(item.mode).toBe("365 dagen");
    expect(item.level).toBe("ok");
  });
  it("te lage waarde wordt geklemd naar de vloer in de weergave", () => {
    const item = itemByKey(makeEnv({ AUDIT_LOG_RETENTION_DAYS: "3" }), "audit-retention");
    expect(item.mode).toBe("30 dagen");
    expect(item.level).toBe("ok");
  });
  it("ontbrekend = fallback (onbeperkt bewaren, geen aandacht)", () => {
    const item = itemByKey(makeEnv(), "audit-retention");
    expect(item.mode).toBe("onbeperkt bewaren");
    expect(item.level).toBe("fallback");
  });
});

describe("collectSystemStatus — buiten productie zijn fallbacks slechts informatief", () => {
  const env = makeEnv({ NODE_ENV: "development", DATABASE_URL: "file:./dev.db" });

  it("fallback i.p.v. aandacht buiten productie", () => {
    expect(itemByKey(env, "storage").level).toBe("fallback");
    expect(itemByKey(env, "email").level).toBe("fallback");
    expect(itemByKey(env, "verifier-diploma").level).toBe("fallback");
  });
  it("SQLite in dev = fallback (niet productie)", () => {
    expect(itemByKey(env, "database").level).toBe("fallback");
  });
  it("geen boot-waarschuwingen buiten productie", () => {
    expect(collectSystemStatus(env).warnings).toEqual([]);
  });
});

describe("collectSystemStatus — demo-dataset staat mock-verifiers toe", () => {
  const env = makeEnv({ SEED_DEMO: "true" });
  it("mock-verifier met SEED_DEMO=true = fallback, niet aandacht", () => {
    expect(itemByKey(env, "verifier-diploma").level).toBe("fallback");
  });
});

describe("collectSystemStatus — demo-dataset-posture (SEED_DEMO)", () => {
  it("SEED_DEMO=true in productie = aandacht met bekende-wachtwoord-toelichting", () => {
    const item = itemByKey(makeEnv({ SEED_DEMO: "true" }), "demo-data");
    expect(item.level).toBe("attention");
    expect(item.mode).toBe("aan");
    expect(item.detail).toMatch(/demo1234/);
  });
  it("geen SEED_DEMO in productie = ok", () => {
    const item = itemByKey(makeEnv(), "demo-data");
    expect(item.level).toBe("ok");
    expect(item.mode).toBe("uit");
  });
  it("SEED_DEMO=true buiten productie = ok (demo is daar de bedoeling)", () => {
    const item = itemByKey(makeEnv({ NODE_ENV: "development", SEED_DEMO: "true" }), "demo-data");
    expect(item.level).toBe("ok");
  });
});

describe("collectSystemStatus — S3 zonder expliciete SSE", () => {
  it("STORAGE_S3_SSE=none in productie = aandacht", () => {
    const env = makeEnv({ STORAGE_DRIVER: "s3", STORAGE_S3_SSE: "none" });
    expect(itemByKey(env, "storage-encryption").level).toBe("attention");
  });
  it("mode toont n.v.t. zonder S3", () => {
    expect(itemByKey(makeEnv(), "storage-encryption").mode).toBe("n.v.t.");
  });
});
