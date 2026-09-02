import { afterEach, describe, expect, it, vi } from "vitest";

import { containsFilterFor, isPostgresUrl } from "./text-search";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("isPostgresUrl", () => {
  it("herkent beide PostgreSQL-prefixen", () => {
    expect(isPostgresUrl("postgres://u:p@localhost:5432/db")).toBe(true);
    expect(isPostgresUrl("postgresql://u:p@localhost:5432/db")).toBe(true);
    expect(isPostgresUrl("  postgresql://localhost/db  ")).toBe(true);
  });

  it("herkent SQLite en ontbrekende URLs als niet-PostgreSQL", () => {
    expect(isPostgresUrl("file:./ci.db")).toBe(false);
    expect(isPostgresUrl(undefined)).toBe(false);
    expect(isPostgresUrl("")).toBe(false);
    // Geen valse positief op een databasenaam die toevallig "postgres" bevat.
    expect(isPostgresUrl("file:./postgres.db")).toBe(false);
  });
});

describe("containsFilterFor", () => {
  it("stuurt op PostgreSQL mode: insensitive mee", () => {
    expect(containsFilterFor("verpleeg", true)).toEqual({
      contains: "verpleeg",
      mode: "insensitive",
    });
  });

  it("laat mode weg op SQLite (het veld bestaat daar niet en zou een validatiefout geven)", () => {
    expect(containsFilterFor("verpleeg", false)).toEqual({ contains: "verpleeg" });
    expect(containsFilterFor("verpleeg", false)).not.toHaveProperty("mode");
  });
});

describe("ciContains", () => {
  it("leidt de provider af uit DATABASE_URL — PostgreSQL", async () => {
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/zzp_ci");
    const { ciContains } = await import("./text-search");
    expect(ciContains("Verpleeg")).toEqual({ contains: "Verpleeg", mode: "insensitive" });
  });

  it("leidt de provider af uit DATABASE_URL — SQLite", async () => {
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", "file:./ci.db");
    const { ciContains } = await import("./text-search");
    expect(ciContains("Verpleeg")).toEqual({ contains: "Verpleeg" });
  });
});
