import { describe, expect, it } from "vitest";

import {
  BOOTSTRAP_ADMIN_MAX_PASSWORD_LENGTH,
  BOOTSTRAP_ADMIN_MIN_PASSWORD_LENGTH,
  resolveBootstrapAdminConfig,
} from "@/lib/bootstrap-admin";

const strongPassword = "z".repeat(BOOTSTRAP_ADMIN_MIN_PASSWORD_LENGTH);

describe("resolveBootstrapAdminConfig", () => {
  it("geen van beide gezet → unset (geen fout, geen admin)", () => {
    const c = resolveBootstrapAdminConfig({});
    expect(c.state).toBe("unset");
    expect(c.email).toBeNull();
    expect(c.errors).toEqual([]);
  });

  it("lege/whitespace-strings tellen als niet gezet → unset", () => {
    expect(resolveBootstrapAdminConfig({ email: "  ", password: "" }).state).toBe("unset");
    expect(resolveBootstrapAdminConfig({ email: null, password: null }).state).toBe("unset");
  });

  it("alleen e-mail gezet → partial (stille halve activering)", () => {
    const c = resolveBootstrapAdminConfig({ email: "beheer@example.nl" });
    expect(c.state).toBe("partial");
    expect(c.email).toBeNull();
    expect(c.errors).toHaveLength(1);
    expect(c.errors[0]).toContain("BOOTSTRAP_ADMIN_PASSWORD");
  });

  it("alleen wachtwoord gezet → partial", () => {
    const c = resolveBootstrapAdminConfig({ password: strongPassword });
    expect(c.state).toBe("partial");
    expect(c.errors[0]).toContain("BOOTSTRAP_ADMIN_EMAIL");
  });

  it("beide gezet + geldig → ready, met genormaliseerd (trim + lowercase) e-mailadres", () => {
    const c = resolveBootstrapAdminConfig({
      email: "  Beheer@Example.NL ",
      password: strongPassword,
    });
    expect(c.state).toBe("ready");
    expect(c.email).toBe("beheer@example.nl");
    expect(c.errors).toEqual([]);
  });

  it("ongeldig e-mailadres → invalid", () => {
    const c = resolveBootstrapAdminConfig({ email: "geen-adres", password: strongPassword });
    expect(c.state).toBe("invalid");
    expect(c.email).toBeNull();
    expect(c.errors.some((e) => /E-?MAIL/i.test(e))).toBe(true);
  });

  it("te kort wachtwoord → invalid (verwerpt en passant het demo-wachtwoord demo1234)", () => {
    const c = resolveBootstrapAdminConfig({ email: "beheer@example.nl", password: "demo1234" });
    expect(c.state).toBe("invalid");
    expect(c.errors.some((e) => e.includes("BOOTSTRAP_ADMIN_PASSWORD"))).toBe(true);
  });

  it("wachtwoord op exact de minimumlengte is geldig", () => {
    const c = resolveBootstrapAdminConfig({
      email: "beheer@example.nl",
      password: "a".repeat(BOOTSTRAP_ADMIN_MIN_PASSWORD_LENGTH),
    });
    expect(c.state).toBe("ready");
  });

  it("spaties in het wachtwoord tellen mee voor de lengte (niet weggetrimd)", () => {
    // 4 tekens + spaties tot net onder de minimumlengte → nog steeds te kort.
    const tooShort = "abc " + " ".repeat(BOOTSTRAP_ADMIN_MIN_PASSWORD_LENGTH - 5);
    expect(tooShort.length).toBe(BOOTSTRAP_ADMIN_MIN_PASSWORD_LENGTH - 1);
    expect(resolveBootstrapAdminConfig({ email: "b@example.nl", password: tooShort }).state).toBe(
      "invalid",
    );
  });

  it("te lang wachtwoord → invalid", () => {
    const c = resolveBootstrapAdminConfig({
      email: "beheer@example.nl",
      password: "a".repeat(BOOTSTRAP_ADMIN_MAX_PASSWORD_LENGTH + 1),
    });
    expect(c.state).toBe("invalid");
  });

  it("meldt beide inhoudsfouten tegelijk (e-mail én wachtwoord)", () => {
    const c = resolveBootstrapAdminConfig({ email: "fout", password: "kort" });
    expect(c.state).toBe("invalid");
    expect(c.errors).toHaveLength(2);
  });

  it("lekt de wachtwoordwaarde nooit in de foutmeldingen", () => {
    const secret = "SuperGeheimWachtwoordXYZ";
    const c = resolveBootstrapAdminConfig({ email: "fout-adres", password: secret });
    expect(c.errors.join(" ")).not.toContain(secret);
  });
});
