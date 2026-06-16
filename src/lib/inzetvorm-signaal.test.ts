import { describe, it, expect } from "vitest";
import { inzetvormSignaal } from "@/lib/inzetvorm-signaal";
import { DBA_RISK_LEVELS } from "@/lib/dba";

describe("inzetvormSignaal", () => {
  it("LAAG → groene 'geschikt voor zelfstandige inzet'", () => {
    const s = inzetvormSignaal("LAAG");
    expect(s.tone).toBe("success");
    expect(s.label).toBe("Geschikt voor zelfstandige inzet");
    expect(s.hint).toBeTruthy();
  });

  it("MIDDEN → waarschuwing met aandachtspunten", () => {
    const s = inzetvormSignaal("MIDDEN");
    expect(s.tone).toBe("warning");
    expect(s.label).toContain("Let op");
    expect(s.hint).toBeTruthy();
  });

  it("HOOG → verhoogd schijnzelfstandigheidsrisico", () => {
    const s = inzetvormSignaal("HOOG");
    expect(s.tone).toBe("danger");
    expect(s.label).toBe("Let op: verhoogd schijnzelfstandigheidsrisico");
    expect(s.hint).toBeTruthy();
  });

  it("null/undefined → onbeoordeeld signaal (geen crash)", () => {
    for (const r of [null, undefined] as const) {
      const s = inzetvormSignaal(r);
      expect(s.tone).toBe("warning");
      expect(s.label).toBe("Inzetvorm nog niet beoordeeld");
    }
  });

  it("dekt elk bestaand DbaRisk-niveau met een label + hint", () => {
    for (const level of DBA_RISK_LEVELS) {
      const s = inzetvormSignaal(level);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.hint.length).toBeGreaterThan(0);
      expect(["success", "warning", "danger"]).toContain(s.tone);
    }
  });
});
