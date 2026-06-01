import { describe, expect, it } from "vitest";
import {
  detectAuthAnomalies,
  classifyCves,
  highestSeverity,
  THRESHOLDS,
  type AuditRow,
} from "@/lib/monitoring/detectors";

const now = new Date("2026-06-01T14:30:00Z");

function row(action: string, ip: string | null, createdAt = now): AuditRow {
  return { action, actorId: null, ipAddress: ip, metadata: null, createdAt };
}

describe("detectAuthAnomalies — login bursts", () => {
  it("geen finding onder de drempel", () => {
    const rows = Array.from({ length: THRESHOLDS.loginBurstPerIp - 1 }, () =>
      row("USER_LOGIN_FAILED", "1.2.3.4"),
    );
    expect(detectAuthAnomalies(rows, now)).toHaveLength(0);
  });

  it("WARN op een burst van mislukte logins per IP", () => {
    const rows = Array.from({ length: THRESHOLDS.loginBurstPerIp }, () =>
      row("USER_LOGIN_FAILED", "1.2.3.4"),
    );
    const f = detectAuthAnomalies(rows, now);
    expect(f).toHaveLength(1);
    expect(f[0]?.code).toBe("LOGIN_BURST");
    expect(f[0]?.severity).toBe("WARN");
    expect(f[0]?.dedupeKey).toContain("1.2.3.4");
  });

  it("CRITICAL bij een zeer grote burst", () => {
    const rows = Array.from({ length: THRESHOLDS.loginBurstCritical }, () =>
      row("AUTH_RATE_LIMITED", "9.9.9.9"),
    );
    expect(detectAuthAnomalies(rows, now)[0]?.severity).toBe("CRITICAL");
  });

  it("telt per IP, niet over IP's heen", () => {
    const rows = [
      ...Array.from({ length: 3 }, () => row("USER_LOGIN_FAILED", "1.1.1.1")),
      ...Array.from({ length: 3 }, () => row("USER_LOGIN_FAILED", "2.2.2.2")),
    ];
    expect(detectAuthAnomalies(rows, now)).toHaveLength(0); // elk 3 < drempel 5
  });
});

describe("detectAuthAnomalies — reset flood + rolwijzigingen", () => {
  it("WARN op wachtwoord-reset-flood", () => {
    const rows = Array.from({ length: THRESHOLDS.passwordResetFlood }, () =>
      row("PASSWORD_RESET_REQUESTED", "5.5.5.5"),
    );
    const f = detectAuthAnomalies(rows, now);
    expect(f.some((x) => x.code === "PASSWORD_RESET_FLOOD")).toBe(true);
  });

  it("WARN op een burst van rolwijzigingen", () => {
    const rows = Array.from({ length: THRESHOLDS.roleChangeBurst }, () =>
      row("ROLE_CHANGED", null),
    );
    const f = detectAuthAnomalies(rows, now);
    expect(f.some((x) => x.code === "ROLE_CHANGE_BURST")).toBe(true);
  });

  it("idempotentie: dezelfde input → dezelfde dedupeKeys", () => {
    const rows = Array.from({ length: 6 }, () => row("USER_LOGIN_FAILED", "1.2.3.4"));
    const a = detectAuthAnomalies(rows, now).map((f) => f.dedupeKey);
    const b = detectAuthAnomalies(rows, now).map((f) => f.dedupeKey);
    expect(a).toEqual(b);
  });
});

describe("classifyCves", () => {
  it("alleen high/critical worden findings", () => {
    const f = classifyCves(
      [
        { name: "a", severity: "low" },
        { name: "b", severity: "high" },
        { name: "c", severity: "critical" },
      ],
      "20260601",
    );
    expect(f).toHaveLength(2);
    expect(f.find((x) => x.evidence.package === "c")?.severity).toBe("CRITICAL");
    expect(f.find((x) => x.evidence.package === "b")?.severity).toBe("WARN");
  });
});

describe("highestSeverity", () => {
  it("kiest de zwaarste", () => {
    expect(highestSeverity([])).toBeNull();
    expect(
      highestSeverity([
        { source: "AUTH", severity: "WARN", code: "x", summary: "", evidence: {}, dedupeKey: "1" },
        {
          source: "AUTH",
          severity: "CRITICAL",
          code: "y",
          summary: "",
          evidence: {},
          dedupeKey: "2",
        },
      ]),
    ).toBe("CRITICAL");
  });
});
