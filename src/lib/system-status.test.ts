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

describe("collectSystemStatus — S3 zonder expliciete SSE", () => {
  it("STORAGE_S3_SSE=none in productie = aandacht", () => {
    const env = makeEnv({ STORAGE_DRIVER: "s3", STORAGE_S3_SSE: "none" });
    expect(itemByKey(env, "storage-encryption").level).toBe("attention");
  });
  it("mode toont n.v.t. zonder S3", () => {
    expect(itemByKey(makeEnv(), "storage-encryption").mode).toBe("n.v.t.");
  });
});
