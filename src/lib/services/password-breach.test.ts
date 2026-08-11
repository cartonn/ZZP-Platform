import { describe, it, expect, vi } from "vitest";

import {
  HibpPasswordBreachChecker,
  NoopPasswordBreachChecker,
  createPasswordBreachChecker,
  matchSuffixCount,
  sha1Hex,
} from "./password-breach";

/** Bouwt een fake `fetch` die één vaste tekst-body met status teruggeeft en de aanroep-URL vastlegt. */
function fakeFetch(body: string, init: { ok?: boolean; status?: number } = {}) {
  const calls: string[] = [];
  const impl = vi.fn(async (url: string) => {
    calls.push(url);
    return {
      ok: init.ok ?? true,
      status: init.status ?? 200,
      text: async () => body,
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8 (het klassieke HIBP-voorbeeld).
const PASSWORD_HASH = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8";

describe("sha1Hex", () => {
  it("hasht naar hoofdletter-hex (bekende vector)", async () => {
    expect(await sha1Hex("password")).toBe(PASSWORD_HASH);
  });
});

describe("matchSuffixCount", () => {
  const suffix = PASSWORD_HASH.slice(5); // "1E4C9B93F3F0682250B6CF8331B7EE68FD8"

  it("vindt de count voor het matchende suffix (case-insensitief)", () => {
    const body = `0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${suffix}:9999999\r\nXXXX:3`;
    expect(matchSuffixCount(body, suffix)).toBe(9999999);
    expect(matchSuffixCount(body.toLowerCase(), suffix.toLowerCase())).toBe(9999999);
  });

  it("geeft 0 als het suffix niet voorkomt", () => {
    expect(matchSuffixCount("0018A45C4D1DEF81644B54AB7F969B88D65:1", suffix)).toBe(0);
  });

  it("negeert padding-regels (count 0) als treffer", () => {
    expect(matchSuffixCount(`${suffix}:0`, suffix)).toBe(0);
  });

  it("is robuust tegen rommelige regels", () => {
    expect(matchSuffixCount("geen-dubbelepunt\n\n:::\n" + `${suffix}:5`, suffix)).toBe(5);
  });
});

describe("NoopPasswordBreachChecker", () => {
  it("slaat altijd over (fail-open) — elk wachtwoord passeert", async () => {
    const checker = new NoopPasswordBreachChecker();
    expect(checker.mode).toBe("noop");
    expect(await checker.check("password")).toEqual({ breached: false, skipped: true, count: 0 });
  });
});

describe("HibpPasswordBreachChecker", () => {
  it("stuurt alleen de 5-teken-prefix (k-anonimiteit), nooit het wachtwoord of de volledige hash", async () => {
    const hash = PASSWORD_HASH;
    const suffix = hash.slice(5);
    const { impl, calls } = fakeFetch(`${suffix}:42`);
    const checker = new HibpPasswordBreachChecker({ fetchImpl: impl, baseUrl: "https://x/range" });

    const result = await checker.check("password");
    expect(result).toEqual({ breached: true, skipped: false, count: 42 });
    // De URL bevat uitsluitend de prefix, niet het suffix, de volledige hash of het wachtwoord.
    expect(calls[0]).toBe(`https://x/range/${hash.slice(0, 5)}`);
    expect(calls[0]).not.toContain(suffix);
    expect(calls[0]).not.toContain("password");
  });

  it("meldt een niet-gelekt wachtwoord als niet-breached", async () => {
    const { impl } = fakeFetch("0018A45C4D1DEF81644B54AB7F969B88D65:1");
    const checker = new HibpPasswordBreachChecker({ fetchImpl: impl });
    expect(await checker.check("een-heel-uniek-wachtwoord-xyz")).toEqual({
      breached: false,
      skipped: false,
      count: 0,
    });
  });

  it("faalt open bij een niet-ok respons (HIBP-storing blokkeert de flow niet)", async () => {
    const { impl } = fakeFetch("", { ok: false, status: 503 });
    const checker = new HibpPasswordBreachChecker({ fetchImpl: impl });
    expect(await checker.check("password")).toEqual({ breached: false, skipped: true, count: 0 });
  });

  it("faalt open bij een netwerkfout/time-out", async () => {
    const impl = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const checker = new HibpPasswordBreachChecker({ fetchImpl: impl });
    expect(await checker.check("password")).toEqual({ breached: false, skipped: true, count: 0 });
  });

  it("slaat een leeg wachtwoord over zonder netwerkaanroep", async () => {
    const impl = vi.fn() as unknown as typeof fetch;
    const checker = new HibpPasswordBreachChecker({ fetchImpl: impl });
    expect(await checker.check("")).toEqual({ breached: false, skipped: true, count: 0 });
    expect(impl).not.toHaveBeenCalled();
  });
});

describe("createPasswordBreachChecker", () => {
  it("kiest de HIBP-adapter bij mode=hibp", () => {
    expect(createPasswordBreachChecker("hibp").mode).toBe("hibp");
  });
  it("valt terug op noop bij een onbekende of ontbrekende modus", () => {
    expect(createPasswordBreachChecker(undefined).mode).toBe("noop");
    expect(createPasswordBreachChecker("iets-anders").mode).toBe("noop");
  });
});
