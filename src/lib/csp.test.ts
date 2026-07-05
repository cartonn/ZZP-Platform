// Unit-tests voor de CSP-opbouw (missie A — nonce-pipeline).

import { describe, it, expect } from "vitest";
import {
  buildCsp,
  CSP_REPORT_GROUP,
  CSP_REPORT_PATH,
  generateNonce,
  reportingEndpointsHeader,
} from "@/lib/csp";

describe("generateNonce", () => {
  it("levert geldige base64 van 128 bits (24 tekens) en is per aanroep uniek", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(a).not.toBe(b);
  });
});

describe("buildCsp", () => {
  it("productie: script-src bevat nonce + strict-dynamic en geen unsafe-eval", () => {
    const csp = buildCsp({ nonce: "abc123", isDev: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("ws:");
  });

  it("productie: legacy-fallbacks aanwezig (genegeerd door moderne browsers bij nonce)", () => {
    const csp = buildCsp({ nonce: "abc123", isDev: false });
    expect(csp).toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toMatch(/script-src[^;]*https:/);
  });

  it("development: geen nonce in de policy (HMR-inline blijft werken), wel unsafe-eval + ws:", () => {
    const csp = buildCsp({ nonce: "abc123", isDev: true });
    expect(csp).not.toContain("nonce-");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("connect-src 'self' ws:");
  });

  it("kerndirectieven blijven in beide modi staan", () => {
    for (const isDev of [true, false]) {
      const csp = buildCsp({ nonce: "n", isDev });
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("worker-src 'self'");
    }
  });

  it("bevat violatie-rapportage (report-to + report-uri) in beide modi", () => {
    for (const isDev of [true, false]) {
      const csp = buildCsp({ nonce: "n", isDev });
      expect(csp).toContain(`report-to ${CSP_REPORT_GROUP}`);
      expect(csp).toContain(`report-uri ${CSP_REPORT_PATH}`);
    }
  });
});

describe("reportingEndpointsHeader", () => {
  it("koppelt de report-to-groep aan het ontvanger-endpoint", () => {
    expect(reportingEndpointsHeader()).toBe(`${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`);
  });

  it("gebruikt dezelfde groepsnaam als de report-to-directive in de policy", () => {
    const csp = buildCsp({ nonce: "n", isDev: false });
    expect(csp).toContain(`report-to ${CSP_REPORT_GROUP}`);
    expect(reportingEndpointsHeader().startsWith(`${CSP_REPORT_GROUP}=`)).toBe(true);
  });
});
