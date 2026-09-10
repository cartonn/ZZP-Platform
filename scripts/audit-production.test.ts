// Borgt dat de productie-audit-gate (`scripts/audit-production.mjs`) een echte kwetsbaarheids-
// bevinding onderscheidt van een onbereikbaar npm-audit-endpoint (registry-storing). De gate mag
// bij een storing niet-blokkerend zijn, maar moet een high/critical-bevinding ALTIJD blokkeren —
// anders zou een fail-open de security-gate omzeilen. Aanleiding: een aanhoudende npm-registry-503
// (2026-09-04) die elke PR onterecht rood maakte.

import { describe, it, expect } from "vitest";
import { classifyAudit } from "./audit-production.mjs";

const report = (v: Record<string, number>) =>
  JSON.stringify({ auditReportVersion: 2, metadata: { vulnerabilities: v } });

describe("classifyAudit", () => {
  it("blokkeert bij een high-bevinding", () => {
    const r = classifyAudit({ stdout: report({ low: 2, moderate: 0, high: 5, critical: 0 }) });
    expect(r.decision).toBe("block");
    expect(r.high).toBe(5);
  });

  it("blokkeert bij een critical-bevinding", () => {
    const r = classifyAudit({ stdout: report({ low: 0, moderate: 0, high: 0, critical: 1 }) });
    expect(r.decision).toBe("block");
    expect(r.critical).toBe(1);
  });

  it("is clean bij alleen moderate/low (geen high/critical)", () => {
    const r = classifyAudit({ stdout: report({ low: 3, moderate: 4, high: 0, critical: 0 }) });
    expect(r.decision).toBe("clean");
  });

  it("behandelt een 503-storing (error-object) als outage, niet als bevinding", () => {
    const r = classifyAudit({
      stdout: JSON.stringify({
        error: {
          code: "E503",
          summary: "503 Service Unavailable - POST https://registry.npmjs.org",
        },
      }),
      stderr: "npm error audit endpoint returned an error",
    });
    expect(r.decision).toBe("outage");
  });

  it("herkent een netwerkfout in stderr als outage", () => {
    const r = classifyAudit({ stdout: "", stderr: "npm warn audit ENOTFOUND registry.npmjs.org" });
    expect(r.decision).toBe("outage");
  });

  it("faalt fail-safe bij onverwachte, niet-herkende uitvoer", () => {
    const r = classifyAudit({ stdout: "totale onzin zonder json", stderr: "" });
    expect(r.decision).toBe("unknown");
  });

  it("laat een storing NOOIT een high/critical maskeren (rapport wint van netwerkmarker)", () => {
    // Zelfs als de uitvoer toevallig het woord 'network' bevat, telt een echt rapport met een
    // high-bevinding als BLOCK — de gate wordt niet omzeild.
    const r = classifyAudit({
      stdout: report({ low: 0, moderate: 0, high: 1, critical: 0 }),
      stderr: "some network diagnostic noise",
    });
    expect(r.decision).toBe("block");
  });
});
