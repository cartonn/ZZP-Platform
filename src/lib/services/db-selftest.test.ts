import { describe, expect, it, vi } from "vitest";

import { detectDbProvider, runDbSelfTest, type DbSelfTestProbe } from "./db-selftest";

/** Klok die per aanroep met `stepMs` opschuift, zodat de latency-meting deterministisch is. */
function fakeClock(startMs: number, stepMs: number): () => number {
  let t = startMs;
  return () => {
    const now = t;
    t += stepMs;
    return now;
  };
}

const okProbe: DbSelfTestProbe = {
  ping: vi.fn(async () => [{ "1": 1 }]),
  checkSchema: vi.fn(async () => [{ id: "u1" }, null, { id: "c1" }]),
};

describe("detectDbProvider", () => {
  it("herkent Postgres-URLs (beide schema's), zonder de URL te lekken", () => {
    expect(detectDbProvider("postgresql://user:secret@host:5432/db")).toBe("postgresql");
    expect(detectDbProvider("postgres://user:secret@host/db")).toBe("postgresql");
    expect(detectDbProvider("  POSTGRESQL://x  ")).toBe("postgresql");
  });

  it("herkent SQLite/file-URLs", () => {
    expect(detectDbProvider("file:./dev.db")).toBe("sqlite");
    expect(detectDbProvider("sqlite://./dev.db")).toBe("sqlite");
  });

  it("valt terug op unknown bij leeg/onbekend", () => {
    expect(detectDbProvider(undefined)).toBe("unknown");
    expect(detectDbProvider(null)).toBe("unknown");
    expect(detectDbProvider("")).toBe("unknown");
    expect(detectDbProvider("mysql://host/db")).toBe("unknown");
  });
});

describe("runDbSelfTest", () => {
  it("rapporteert ok + latency + provider + pool bij een gezonde databank", async () => {
    const report = await runDbSelfTest({
      probe: okProbe,
      provider: "postgresql",
      pool: { connectionLimit: 5, pgbouncer: true },
      now: fakeClock(1000, 12),
    });

    expect(report.ok).toBe(true);
    expect(report.provider).toBe("postgresql");
    expect(report.pool).toEqual({ connectionLimit: 5, pgbouncer: true });
    expect(report.latencyMs).toBe(12);
    expect(report.steps.map((s) => s.key)).toEqual(["connectivity", "schema"]);
    expect(report.steps.every((s) => s.ok)).toBe(true);
  });

  it("faalt op de connectiviteitsstap en probeert het schema niet (geen latency)", async () => {
    const checkSchema = vi.fn();
    const report = await runDbSelfTest({
      probe: {
        ping: async () => {
          const err = new Error("connection refused: postgresql://secret@host");
          err.name = "PrismaClientInitializationError";
          throw err;
        },
        checkSchema,
      },
      provider: "postgresql",
      pool: {},
      now: fakeClock(0, 5),
    });

    expect(report.ok).toBe(false);
    expect(report.latencyMs).toBeUndefined();
    expect(report.steps).toHaveLength(1);
    const step = report.steps[0]!;
    expect(step).toMatchObject({ key: "connectivity", ok: false });
    // Alleen de error-NAAM lekt, nooit het bericht met de connection-string.
    expect(step.detail).toBe("PrismaClientInitializationError");
    expect(step.detail).not.toContain("secret");
    expect(checkSchema).not.toHaveBeenCalled();
  });

  it("faalt op de schema-stap wanneer een kern-tabel ontbreekt (mislukte db push)", async () => {
    const report = await runDbSelfTest({
      probe: {
        ping: async () => [{ "1": 1 }],
        checkSchema: async () => {
          const err = new Error('relation "User" does not exist');
          err.name = "PrismaClientKnownRequestError";
          throw err;
        },
      },
      provider: "postgresql",
      pool: {},
      now: fakeClock(500, 8),
    });

    expect(report.ok).toBe(false);
    // De connectiviteit slaagde wél → latency gemeten, connectivity-stap groen.
    expect(report.latencyMs).toBe(8);
    expect(report.steps.map((s) => [s.key, s.ok])).toEqual([
      ["connectivity", true],
      ["schema", false],
    ]);
    const schemaStep = report.steps[1]!;
    expect(schemaStep.detail).toBe("PrismaClientKnownRequestError");
    expect(schemaStep.detail).not.toContain("User");
  });

  it("levert een niet-negatieve, afgeronde latency ook bij een niet-monotone klok", async () => {
    const report = await runDbSelfTest({
      probe: okProbe,
      provider: "sqlite",
      pool: {},
      now: fakeClock(100, -50), // klok loopt terug → geklemd op 0
    });
    expect(report.latencyMs).toBe(0);
  });
});
