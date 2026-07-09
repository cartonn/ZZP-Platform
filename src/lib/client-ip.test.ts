// Regressietest: het client-IP mag NOOIT uit de client-gestuurde linkerkant van X-Forwarded-For
// komen. Zonder de fix (leftmost) omzeilt een aanvaller elke IP-gebonden rate limiter door per
// request een ander eerste XFF-IP te sturen — deze tests falen dan (rood→groen).

import { describe, it, expect } from "vitest";
import {
  clientIpFrom,
  clientIpFromRequest,
  resolveTrustedProxyHops,
  DEFAULT_TRUSTED_PROXY_HOPS,
} from "./client-ip";

describe("clientIpFrom — spoof-bestendige X-Forwarded-For-parsing", () => {
  it("neemt de door de vertrouwde proxy toegevoegde (rechter) entry, NIET de client-gestuurde linker", () => {
    // Aanvaller injecteert een gespooft eerste IP; Railway appendt het echte IP rechts.
    expect(clientIpFrom("1.2.3.4, 203.0.113.9", null, 1)).toBe("203.0.113.9");
  });

  it("laat een aanvaller het gekozen IP niet variëren door de linkerkant te veranderen", () => {
    const real = "203.0.113.9";
    const a = clientIpFrom("9.9.9.9, " + real, null, 1);
    const b = clientIpFrom("8.8.8.8, " + real, null, 1);
    // Beide requests leveren hetzelfde (echte) IP → dezelfde rate-limit-bucket.
    expect(a).toBe(real);
    expect(b).toBe(real);
    expect(a).toBe(b);
  });

  it("respecteert meerdere vertrouwde hops (kiest de juiste entry vanaf rechts)", () => {
    expect(clientIpFrom("client, 203.0.113.9, 10.0.0.1", null, 2)).toBe("203.0.113.9");
  });

  it("klemt op de linkerrand als de keten korter is dan de verwachte hops", () => {
    expect(clientIpFrom("203.0.113.9", null, 3)).toBe("203.0.113.9");
  });

  it("valt terug op x-real-ip zonder x-forwarded-for", () => {
    expect(clientIpFrom(null, "192.0.2.7", 1)).toBe("192.0.2.7");
    expect(clientIpFrom("   ", "192.0.2.7", 1)).toBe("192.0.2.7");
  });

  it("geeft null als er geen enkel bruikbaar IP is", () => {
    expect(clientIpFrom(null, null, 1)).toBeNull();
    expect(clientIpFrom("", "", 1)).toBeNull();
  });

  it("negeert lege/whitespace-entries in de keten", () => {
    expect(clientIpFrom("1.1.1.1, , 203.0.113.9", null, 1)).toBe("203.0.113.9");
  });
});

describe("resolveTrustedProxyHops", () => {
  it("default 1 (Railway) bij ontbrekende of ongeldige env", () => {
    expect(resolveTrustedProxyHops(undefined)).toBe(DEFAULT_TRUSTED_PROXY_HOPS);
    expect(resolveTrustedProxyHops("abc")).toBe(1);
    expect(resolveTrustedProxyHops("0")).toBe(1); // 0 zou de client-linkerkant weer laten meetellen
    expect(resolveTrustedProxyHops("-2")).toBe(1);
  });

  it("leest een geldige waarde", () => {
    expect(resolveTrustedProxyHops("2")).toBe(2);
  });
});

describe("clientIpFromRequest", () => {
  it("kiest het rechter (vertrouwde) IP uit de request-headers", () => {
    const req = new Request("http://localhost/x", {
      headers: { "x-forwarded-for": "1.2.3.4, 203.0.113.9" },
    });
    expect(clientIpFromRequest(req)).toBe("203.0.113.9");
  });

  it("valt terug op de meegegeven fallback zonder headers", () => {
    const req = new Request("http://localhost/x");
    expect(clientIpFromRequest(req)).toBe("unknown");
    expect(clientIpFromRequest(req, "none")).toBe("none");
  });
});
