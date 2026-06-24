import { describe, expect, it } from "vitest";
import { assertImportRole, IMPORT_ROLE } from "@/lib/import-role";

describe("assertImportRole", () => {
  it("accepteert de toegestane importrollen", () => {
    expect(assertImportRole("FREELANCER")).toBe("FREELANCER");
    expect(assertImportRole("CLIENT")).toBe("CLIENT");
  });

  it("weigert ADMIN (mass-assignment-bescherming)", () => {
    expect(() => assertImportRole("ADMIN")).toThrow();
  });

  it("weigert onbekende of lege rollen", () => {
    expect(() => assertImportRole("FRANCHISER")).toThrow();
    expect(() => assertImportRole("")).toThrow();
    expect(() => assertImportRole("freelancer")).toThrow(); // hoofdlettergevoelig
  });
});

describe("IMPORT_ROLE schema", () => {
  it("safeParse faalt netjes bij een ongeldige rol", () => {
    const ok = IMPORT_ROLE.safeParse("CLIENT");
    const bad = IMPORT_ROLE.safeParse("ADMIN");
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});
