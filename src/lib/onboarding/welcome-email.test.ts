import { describe, expect, it } from "vitest";
import { buildWelcomeEmail } from "@/lib/onboarding/welcome-email";

const base = {
  name: "Sanne de Vries",
  email: "sanne@example.nl",
  tempPassword: "Tijdelijk!23",
  loginUrl: "https://app.zzp-platform.nl/login",
};

describe("buildWelcomeEmail", () => {
  it("zet ontvanger als 'Naam <email>'", () => {
    expect(buildWelcomeEmail(base).to).toBe("Sanne de Vries <sanne@example.nl>");
  });

  it("onderwerp noemt de platformnaam", () => {
    expect(buildWelcomeEmail(base).subject).toContain("Handslag");
    expect(buildWelcomeEmail({ ...base, platformName: "Zorgburo Noord" }).subject).toContain(
      "Zorgburo Noord",
    );
  });

  it("tekst bevat e-mail, tijdelijk wachtwoord en inlog-URL", () => {
    const { text } = buildWelcomeEmail(base);
    expect(text).toContain("sanne@example.nl");
    expect(text).toContain("Tijdelijk!23");
    expect(text).toContain("https://app.zzp-platform.nl/login");
    expect(text).toContain("eigen wachtwoord");
  });

  it("HTML bevat een inlogknop en het wachtwoord", () => {
    const { html } = buildWelcomeEmail(base);
    expect(html).toBeDefined();
    expect(html!).toContain("https://app.zzp-platform.nl/login");
    expect(html!).toContain("Tijdelijk!23");
  });

  it("escapet HTML-gevaarlijke tekens in de naam", () => {
    const { html } = buildWelcomeEmail({ ...base, name: 'Jan <b>"hack"</b>' });
    expect(html!).not.toContain("<b>");
    expect(html!).toContain("&lt;b&gt;");
    expect(html!).toContain("&quot;hack&quot;");
  });

  it("levert altijd een platte-tekst variant (verplicht)", () => {
    expect(buildWelcomeEmail(base).text.length).toBeGreaterThan(0);
  });
});
