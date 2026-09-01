import { describe, expect, it } from "vitest";
import {
  CHANGE_PASSWORD_PATH,
  CHANGE_PASSWORD_REDIRECT_STATUS,
  buildChangePasswordRedirect,
} from "@/lib/change-password-url";

describe("buildChangePasswordRedirect", () => {
  it("verwijst met 303 naar de wachtwoord-wijzigen-pagina op dezelfde origin", () => {
    const redirect = buildChangePasswordRedirect("https://app.zzp-platform.nl");
    expect(redirect.status).toBe(303);
    expect(redirect.status).toBe(CHANGE_PASSWORD_REDIRECT_STATUS);
    expect(redirect.location).toBe("https://app.zzp-platform.nl/account/wachtwoord");
  });

  it("normaliseert een trailing slash op de origin (geen dubbele slash)", () => {
    const redirect = buildChangePasswordRedirect("https://app.zzp-platform.nl/");
    expect(redirect.location).toBe("https://app.zzp-platform.nl/account/wachtwoord");
  });

  it("normaliseert meerdere trailing slashes", () => {
    const redirect = buildChangePasswordRedirect("https://app.zzp-platform.nl///");
    expect(redirect.location).toBe("https://app.zzp-platform.nl/account/wachtwoord");
  });

  it("werkt met een dev-origin met poort", () => {
    const redirect = buildChangePasswordRedirect("http://localhost:3000");
    expect(redirect.location).toBe("http://localhost:3000/account/wachtwoord");
  });

  it("houdt het pad in sync met de constante (één bron van waarheid)", () => {
    const redirect = buildChangePasswordRedirect("https://example.test");
    expect(redirect.location.endsWith(CHANGE_PASSWORD_PATH)).toBe(true);
  });
});
