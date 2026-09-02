import { describe, expect, it } from "vitest";
import {
  buildHealthPayload,
  healthHttpStatus,
  normalizeBuiltAt,
  shortCommit,
} from "@/lib/observability/health";

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

describe("normalizeBuiltAt", () => {
  it("neemt een geldige ISO-tijdstempel over (genormaliseerd)", () => {
    expect(normalizeBuiltAt("2026-09-02T10:00:00Z")).toBe("2026-09-02T10:00:00.000Z");
  });

  it("valt terug op 'onbekend' bij leeg/ontbrekend/ongeldig", () => {
    expect(normalizeBuiltAt("")).toBe("onbekend");
    expect(normalizeBuiltAt("   ")).toBe("onbekend");
    expect(normalizeBuiltAt(undefined)).toBe("onbekend");
    expect(normalizeBuiltAt(null)).toBe("onbekend");
    expect(normalizeBuiltAt("niet-een-datum")).toBe("onbekend");
  });
});

describe("buildHealthPayload", () => {
  const now = new Date("2026-07-04T03:02:20.000Z");

  it("meldt ok wanneer de DB bereikbaar is", () => {
    const payload = buildHealthPayload({
      db: true,
      commit: "abcdef1234",
      builtAt: "2026-07-01T00:00:00Z",
      now,
    });
    expect(payload).toEqual({
      status: "ok",
      db: true,
      commit: "abcdef1",
      builtAt: "2026-07-01T00:00:00.000Z",
      time: "2026-07-04T03:02:20.000Z",
    });
  });

  it("meldt 'onbekend' voor builtAt zonder Docker-build (lokaal/dev)", () => {
    const payload = buildHealthPayload({ db: true, commit: "abcdef1234", now });
    expect(payload.builtAt).toBe("onbekend");
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
