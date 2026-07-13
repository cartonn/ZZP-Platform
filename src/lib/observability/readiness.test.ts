import { describe, it, expect } from "vitest";
import { evaluateReadiness } from "./readiness";

describe("evaluateReadiness", () => {
  it("rapporteert ready:true als beide probes slagen", async () => {
    const report = await evaluateReadiness({
      dbPing: async () => {},
      schemaProbe: async () => 42,
    });

    expect(report.ready).toBe(true);
    expect(report.checks).toHaveLength(2);
    expect(report.checks.every((c) => c.ok)).toBe(true);

    const db = report.checks.find((c) => c.name === "database");
    const schema = report.checks.find((c) => c.name === "schema");
    expect(db?.ok).toBe(true);
    expect(schema?.ok).toBe(true);
  });

  it("lekt geen gevoelige inhoud uit een gefaalde dbPing", async () => {
    const secret = "postgres://user:p4ssw0rd@db.internal:5432/zzp";
    const report = await evaluateReadiness({
      dbPing: async () => {
        throw new Error(`connection failed for ${secret}`);
      },
      schemaProbe: async () => 1,
    });

    expect(report.ready).toBe(false);

    const db = report.checks.find((c) => c.name === "database");
    expect(db?.ok).toBe(false);
    // De detail mag de connection-string niet bevatten.
    expect(db?.detail).not.toContain(secret);
    expect(db?.detail).not.toContain("p4ssw0rd");
    // Alleen de error-naam is toegestaan.
    expect(db?.detail).toBe("Error");
  });

  it("rapporteert ready:false als schemaProbe werpt (migratie ontbreekt)", async () => {
    const report = await evaluateReadiness({
      dbPing: async () => {},
      schemaProbe: async () => {
        throw new Error('relation "User" does not exist');
      },
    });

    expect(report.ready).toBe(false);

    const db = report.checks.find((c) => c.name === "database");
    const schema = report.checks.find((c) => c.name === "schema");
    expect(db?.ok).toBe(true);
    expect(schema?.ok).toBe(false);
    expect(schema?.detail).not.toContain("does not exist");
  });

  it("werpt zelf nooit, ook niet als beide probes falen", async () => {
    await expect(
      evaluateReadiness({
        dbPing: async () => {
          throw new Error("db down");
        },
        schemaProbe: async () => {
          throw new Error("schema down");
        },
      }),
    ).resolves.toMatchObject({ ready: false });
  });

  it("negeert de draining-check wanneer die niet is meegegeven (backward compatible)", async () => {
    const report = await evaluateReadiness({
      dbPing: async () => {},
      schemaProbe: async () => 1,
    });
    expect(report.checks).toHaveLength(2);
    expect(report.checks.some((c) => c.name === "shutdown")).toBe(false);
  });

  it("blijft ready wanneer de server niet afsluit (draining=false)", async () => {
    const report = await evaluateReadiness({
      dbPing: async () => {},
      schemaProbe: async () => 1,
      draining: false,
    });
    expect(report.ready).toBe(true);
    const shutdown = report.checks.find((c) => c.name === "shutdown");
    expect(shutdown?.ok).toBe(true);
  });

  it("is not-ready wanneer de server afsluit (draining=true), ook al is de DB gezond", async () => {
    const report = await evaluateReadiness({
      dbPing: async () => {},
      schemaProbe: async () => 1,
      draining: true,
    });
    expect(report.ready).toBe(false);
    const shutdown = report.checks.find((c) => c.name === "shutdown");
    expect(shutdown?.ok).toBe(false);
    expect(shutdown?.detail).toBe("draining");
    // De DB-checks blijven ondertussen gewoon gezond gerapporteerd.
    expect(report.checks.find((c) => c.name === "database")?.ok).toBe(true);
  });

  it("gebruikt de error-naam in detail wanneer beschikbaar", async () => {
    class TimeoutError extends Error {
      constructor() {
        super("internal timeout details");
        this.name = "TimeoutError";
      }
    }
    const report = await evaluateReadiness({
      dbPing: async () => {
        throw new TimeoutError();
      },
      schemaProbe: async () => 1,
    });

    const db = report.checks.find((c) => c.name === "database");
    expect(db?.detail).toBe("TimeoutError");
  });
});
