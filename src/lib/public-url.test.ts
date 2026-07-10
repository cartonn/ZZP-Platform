// Beveiligingsinvariant: de vertrouwde publieke origin komt uit AUTH_URL/NEXTAUTH_URL, NOOIT uit de
// client-beïnvloedbare Host/X-Forwarded-Host-header wanneer die configuratie aanwezig is. Zonder
// deze regel is host-header/reset-poisoning mogelijk (CWE-640 / OWASP A01/A07).

import { describe, it, expect } from "vitest";
import { resolvePublicOrigin } from "./public-url";

describe("resolvePublicOrigin", () => {
  it("negeert een vervalste host wanneer AUTH_URL is geconfigureerd (anti-poisoning)", () => {
    // Aanvaller zet x-forwarded-host op zijn eigen domein; die mag NIET meetellen.
    expect(resolvePublicOrigin("attacker.example", "https", "https://app.zzp-platform.nl")).toBe(
      "https://app.zzp-platform.nl",
    );
  });

  it("strip een trailing slash van de geconfigureerde origin", () => {
    expect(resolvePublicOrigin(null, null, "https://app.zzp-platform.nl/")).toBe(
      "https://app.zzp-platform.nl",
    );
  });

  it("valt (alleen zonder configuratie) terug op de request-headers", () => {
    expect(resolvePublicOrigin("localhost:3000", "http", undefined)).toBe("http://localhost:3000");
    expect(resolvePublicOrigin("localhost:3000", "http", "")).toBe("http://localhost:3000");
  });

  it("valt zonder host én zonder configuratie terug op localhost (dev)", () => {
    expect(resolvePublicOrigin(null, null, undefined)).toBe("http://localhost:3000");
  });
});
