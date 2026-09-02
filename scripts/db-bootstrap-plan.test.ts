import { describe, it, expect } from "vitest";
import {
  BASELINE_MIGRATION,
  MIGRATE_DEPLOY_COMMAND,
  PUSH_COMMAND,
  RESOLVE_BASELINE_COMMAND,
  planDbBootstrap,
  resolveDbProvider,
  resolveMigrationCommand,
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

  it("herstelt drift op een bestaande, met db push opgebouwde database: push → resolve baseline → migrate deploy", () => {
    const steps = planDbBootstrap({
      provider: "postgresql",
      hasMigrationsTable: false,
      hasUserTable: true,
    });
    // Default migrationNames = [BASELINE_MIGRATION] wanneer de caller geen mappen meegeeft.
    expect(steps.map((s) => s.step)).toEqual(["push", "resolve-migration", "migrate-deploy"]);
    expect(steps[0]!.command).toBe(PUSH_COMMAND);
    expect(steps[1]!.command).toBe(RESOLVE_BASELINE_COMMAND);
    expect(steps[1]!.command).toContain(BASELINE_MIGRATION);
  });

  it("markeert ELKE migratiemap als toegepast, in de meegegeven volgorde, ná de db push", () => {
    const steps = planDbBootstrap({
      provider: "postgresql",
      hasMigrationsTable: false,
      hasUserTable: true,
      migrationNames: ["0_baseline", "20260901120000_add_column"],
    });
    expect(steps.map((s) => s.step)).toEqual([
      "push",
      "resolve-migration",
      "resolve-migration",
      "migrate-deploy",
    ]);
    expect(steps[1]!.command).toBe(resolveMigrationCommand("0_baseline"));
    expect(steps[2]!.command).toBe(resolveMigrationCommand("20260901120000_add_column"));
  });

  it("draait de db push ZONDER --accept-data-loss (destructieve drift moet de boot luid laten falen)", () => {
    const steps = planDbBootstrap({
      provider: "postgresql",
      hasMigrationsTable: false,
      hasUserTable: true,
    });
    const push = steps.find((s) => s.step === "push");
    expect(push!.command).not.toContain("--accept-data-loss");
  });

  it("baselinet niet opnieuw zodra de migratiehistorie bestaat", () => {
    const steps = planDbBootstrap({
      provider: "postgresql",
      hasMigrationsTable: true,
      hasUserTable: true,
    });
    expect(steps.map((s) => s.step)).toEqual(["migrate-deploy"]);
  });

  it("eindigt op Postgres altijd met migrate deploy als poort — nooit stil op alleen db push", () => {
    for (const hasMigrationsTable of [false, true]) {
      for (const hasUserTable of [false, true]) {
        const steps = planDbBootstrap({ provider: "postgresql", hasMigrationsTable, hasUserTable });
        expect(steps.at(-1)!.step).toBe("migrate-deploy");
        // Een db-push-stap komt UITSLUITEND voor in het drift-herstelpad (geen migratiehistorie,
        // schema al aanwezig) en wordt daar altijd gevolgd door resolve-migration-stappen — nooit
        // als stille vervanging van migrate deploy.
        if (steps.some((s) => s.step === "push")) {
          expect(hasMigrationsTable).toBe(false);
          expect(hasUserTable).toBe(true);
          expect(steps.some((s) => s.step === "resolve-migration")).toBe(true);
        }
      }
    }
  });
});
