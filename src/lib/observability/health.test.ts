import { describe, expect, it } from "vitest";
import { buildHealthPayload, healthHttpStatus, shortCommit } from "@/lib/observability/health";

describe("shortCommit", () => {
  it("kort een lange SHA in tot 7 tekens", () => {
    expect(shortCommit("0123456789abcdef")).toBe("0123456");
  });

  it("valt terug op 'dev' bij lege of ontbrekende waarde", () => {
    expect(shortCommit("")).toBe("dev");
    expect(shortCommit("   ")).toBe("dev");
    expect(shortCommit(undefined)).toBe("dev");
    expect(shortCommit(null)).toBe("dev");
  });

  it("laat een korte SHA ongemoeid", () => {
    expect(shortCommit("abc")).toBe("abc");
  });
});

describe("buildHealthPayload", () => {
  const now = new Date("2026-07-04T03:02:20.000Z");

  it("meldt ok wanneer de DB bereikbaar is", () => {
    const payload = buildHealthPayload({ db: true, commit: "abcdef1234", now });
    expect(payload).toEqual({
      status: "ok",
      db: true,
      commit: "abcdef1",
      time: "2026-07-04T03:02:20.000Z",
    });
  });

  it("meldt degraded wanneer de DB onbereikbaar is", () => {
    const payload = buildHealthPayload({ db: false, commit: "abcdef1234", now });
    expect(payload.status).toBe("degraded");
    expect(payload.db).toBe(false);
  });

  it("neemt geen ruwe commit over — altijd ingekort", () => {
    const payload = buildHealthPayload({ db: true, commit: undefined, now });
    expect(payload.commit).toBe("dev");
  });
});

describe("healthHttpStatus", () => {
  it("geeft 200 bij een gezonde probe", () => {
    expect(healthHttpStatus(buildHealthPayload({ db: true, commit: "x", now: new Date() }))).toBe(
      200,
    );
  });

  it("geeft 503 bij een DB-storing", () => {
    expect(healthHttpStatus(buildHealthPayload({ db: false, commit: "x", now: new Date() }))).toBe(
      503,
    );
  });
});
