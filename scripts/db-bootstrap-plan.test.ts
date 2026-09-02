import { describe, it, expect } from "vitest";
import {
  BASELINE_MIGRATION,
  MIGRATE_DEPLOY_COMMAND,
  PUSH_COMMAND,
  RESOLVE_BASELINE_COMMAND,
  planDbBootstrap,
  resolveDbProvider,
} from "./db-bootstrap-plan.mjs";

describe("resolveDbProvider", () => {
  it("herkent Postgres-URL's (beide schema's)", () => {
    expect(resolveDbProvider("postgresql://u:p@host:5432/db?schema=public")).toBe("postgresql");
    expect(resolveDbProvider("postgres://u:p@host:5432/db")).toBe("postgresql");
  });

  it("valt terug op sqlite voor een bestands-URL of een ontbrekende waarde", () => {
    expect(resolveDbProvider("file:./dev.db")).toBe("sqlite");
    expect(resolveDbProvider(undefined)).toBe("sqlite");
    expect(resolveDbProvider("")).toBe("sqlite");
  });
});

describe("planDbBootstrap", () => {
  it("gebruikt db push op SQLite (lokaal/CI), nooit migraties", () => {
    const steps = planDbBootstrap({ provider: "sqlite" });
    expect(steps).toHaveLength(1);
    expect(steps[0]!.step).toBe("push");
    expect(steps[0]!.command).toBe(PUSH_COMMAND);
  });

  it("draait op een lege Postgres alleen migrate deploy (die past de baseline zelf toe)", () => {
    const steps = planDbBootstrap({
      provider: "postgresql",
      hasMigrationsTable: false,
      hasUserTable: false,
    });
    expect(steps.map((s) => s.step)).toEqual(["migrate-deploy"]);
    expect(steps[0]!.command).toBe(MIGRATE_DEPLOY_COMMAND);
  });

  it("markeert de baseline eenmalig op een bestaande, met db push opgebouwde database", () => {
    const steps = planDbBootstrap({
      provider: "postgresql",
      hasMigrationsTable: false,
      hasUserTable: true,
    });
    expect(steps.map((s) => s.step)).toEqual(["resolve-baseline", "migrate-deploy"]);
    expect(steps[0]!.command).toBe(RESOLVE_BASELINE_COMMAND);
    expect(steps[0]!.command).toContain(BASELINE_MIGRATION);
  });

  it("baselinet niet opnieuw zodra de migratiehistorie bestaat", () => {
    const steps = planDbBootstrap({
      provider: "postgresql",
      hasMigrationsTable: true,
      hasUserTable: true,
    });
    expect(steps.map((s) => s.step)).toEqual(["migrate-deploy"]);
  });

  it("valt op Postgres nooit terug op db push (geen stille bypass van de migratiehistorie)", () => {
    for (const hasMigrationsTable of [false, true]) {
      for (const hasUserTable of [false, true]) {
        const steps = planDbBootstrap({ provider: "postgresql", hasMigrationsTable, hasUserTable });
        expect(steps.some((s) => s.step === "push")).toBe(false);
        expect(steps.at(-1)!.step).toBe("migrate-deploy");
      }
    }
  });
});
