import { describe, expect, it } from "vitest";
import { buildResetEmail } from "@/lib/services/reset-email";

describe("buildResetEmail", () => {
  const opts = {
    name: "Jan Jansen",
    email: "jan@voorbeeld.nl",
    resetUrl: "https://zzp-platform.nl/wachtwoord-herstellen/abc123",
  };

  it("stuurt naar het juiste adres", () => {
    expect(buildResetEmail(opts).to).toBe("jan@voorbeeld.nl");
  });

  it("onderwerp bevat 'Wachtwoord herstellen'", () => {
    expect(buildResetEmail(opts).subject).toContain("Wachtwoord herstellen");
  });

  it("tekst bevat naam en reset-URL", () => {
    const { text } = buildResetEmail(opts);
    expect(text).toContain("Jan Jansen");
    expect(text).toContain(opts.resetUrl);
  });

  it("HTML bevat escaped reset-URL als href", () => {
    const { html } = buildResetEmail(opts);
    expect(html).toContain(`href="${opts.resetUrl}"`);
  });

  it("escapet HTML-tekens in naam", () => {
    const { html } = buildResetEmail({ ...opts, name: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapet HTML-tekens in resetUrl", () => {
    const { html } = buildResetEmail({ ...opts, resetUrl: 'https://x.nl/?a=1&b=2"' });
    expect(html).not.toContain('"&');
    expect(html).toContain("&amp;");
  });

  it("tekst bevat vermelding geldigheid en één-gebruik", () => {
    const { text } = buildResetEmail(opts);
    expect(text).toContain("1 uur");
    expect(text).toContain("eenmalig");
  });
});
