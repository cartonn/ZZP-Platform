import { describe, expect, it } from "vitest";
import {
  SECURITY_TXT_EXPIRY_DAYS,
  buildSecurityTxt,
  isSecurityContactConfigured,
  normalizeSecurityContact,
  resolveSecurityContacts,
  securityTxtExpires,
} from "./security-txt";

const NOW = new Date("2026-07-10T00:00:00.000Z");

describe("normalizeSecurityContact", () => {
  it("voegt mailto: toe aan een kaal e-mailadres", () => {
    expect(normalizeSecurityContact("security@zzp-platform.nl")).toBe(
      "mailto:security@zzp-platform.nl",
    );
    expect(normalizeSecurityContact("  security@zzp-platform.nl  ")).toBe(
      "mailto:security@zzp-platform.nl",
    );
  });

  it("laat een al-geschemede waarde ongewijzigd", () => {
    expect(normalizeSecurityContact("mailto:x@y.nl")).toBe("mailto:x@y.nl");
    expect(normalizeSecurityContact("https://example.nl/report")).toBe("https://example.nl/report");
    expect(normalizeSecurityContact("HTTPS://example.nl/report")).toBe("HTTPS://example.nl/report");
  });

  it("weigert lege of onbruikbare invoer", () => {
    expect(normalizeSecurityContact("")).toBeNull();
    expect(normalizeSecurityContact("   ")).toBeNull();
    expect(normalizeSecurityContact("geen-contact")).toBeNull();
    expect(normalizeSecurityContact("@invalid")).toBeNull();
  });
});

describe("resolveSecurityContacts", () => {
  it("gebruikt SECURITY_CONTACT (komma-gescheiden, meerdere)", () => {
    expect(
      resolveSecurityContacts("security@zzp.nl, https://zzp.nl/report", "https://app.zzp.nl"),
    ).toEqual(["mailto:security@zzp.nl", "https://zzp.nl/report"]);
  });

  it("negeert onbruikbare delen maar houdt de geldige", () => {
    expect(resolveSecurityContacts("onzin, x@y.nl", "https://app.zzp.nl")).toEqual([
      "mailto:x@y.nl",
    ]);
  });

  it("valt terug op mailto:security@<host> uit de origin", () => {
    expect(resolveSecurityContacts(undefined, "https://app.zzp-platform.nl")).toEqual([
      "mailto:security@app.zzp-platform.nl",
    ]);
    expect(resolveSecurityContacts("", "https://app.zzp-platform.nl/")).toEqual([
      "mailto:security@app.zzp-platform.nl",
    ]);
  });

  it("valt terug op localhost bij een onbruikbare origin", () => {
    expect(resolveSecurityContacts(undefined, "niet-een-url")).toEqual([
      "mailto:security@localhost",
    ]);
  });
});

describe("isSecurityContactConfigured", () => {
  it("is true zodra er een geldig contact staat", () => {
    expect(isSecurityContactConfigured("security@zzp.nl")).toBe(true);
    expect(isSecurityContactConfigured("onzin, x@y.nl")).toBe(true);
  });
  it("is false zonder (geldige) waarde", () => {
    expect(isSecurityContactConfigured(undefined)).toBe(false);
    expect(isSecurityContactConfigured("")).toBe(false);
    expect(isSecurityContactConfigured("geen-contact")).toBe(false);
  });
});

describe("securityTxtExpires", () => {
  it("berekent now + dagen als ISO 8601", () => {
    expect(securityTxtExpires(NOW, 365)).toBe("2027-07-10T00:00:00.000Z");
    expect(securityTxtExpires(NOW, 1)).toBe("2026-07-11T00:00:00.000Z");
  });
  it("klemt een ongeldige/te lage duur naar de default", () => {
    expect(securityTxtExpires(NOW, 0)).toBe(securityTxtExpires(NOW, SECURITY_TXT_EXPIRY_DAYS));
    expect(securityTxtExpires(NOW, Number.NaN)).toBe(
      securityTxtExpires(NOW, SECURITY_TXT_EXPIRY_DAYS),
    );
  });
});

describe("buildSecurityTxt", () => {
  it("rendert de verplichte RFC 9116-velden in volgorde", () => {
    const txt = buildSecurityTxt({
      contacts: ["mailto:security@zzp.nl"],
      canonicalOrigin: "https://app.zzp.nl",
      now: NOW,
    });
    expect(txt).toContain("Contact: mailto:security@zzp.nl");
    expect(txt).toContain("Expires: 2027-07-10T00:00:00.000Z");
    expect(txt).toContain("Preferred-Languages: nl, en");
    expect(txt).toContain("Canonical: https://app.zzp.nl/.well-known/security.txt");
    // Contact vóór Expires vóór Canonical.
    expect(txt.indexOf("Contact:")).toBeLessThan(txt.indexOf("Expires:"));
    expect(txt.indexOf("Expires:")).toBeLessThan(txt.indexOf("Canonical:"));
  });

  it("rendert meerdere Contact-regels", () => {
    const txt = buildSecurityTxt({
      contacts: ["mailto:security@zzp.nl", "https://zzp.nl/report"],
      canonicalOrigin: "https://app.zzp.nl",
      now: NOW,
    });
    expect(txt.match(/^Contact: /gm)).toHaveLength(2);
  });

  it("str't een trailing slash van de origin in de Canonical", () => {
    const txt = buildSecurityTxt({
      contacts: ["mailto:security@zzp.nl"],
      canonicalOrigin: "https://app.zzp.nl/",
      now: NOW,
    });
    expect(txt).toContain("Canonical: https://app.zzp.nl/.well-known/security.txt");
    expect(txt).not.toContain("app.zzp.nl//.well-known");
  });
});
