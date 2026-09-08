import { describe, it, expect, vi } from "vitest";

import {
  HibpPasswordBreachChecker,
  NoopPasswordBreachChecker,
  createPasswordBreachChecker,
  matchSuffixCount,
  passwordBreachRetryDelayMs,
  resolvePasswordBreachRetries,
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

  describe("onDelivery-aflever-heartbeat-hook", () => {
    it("meldt succes (true) bij een geldig HIBP-antwoord", async () => {
      const { impl } = fakeFetch(`${PASSWORD_HASH.slice(5)}:42`);
      const onDelivery = vi.fn();
      const checker = new HibpPasswordBreachChecker({ fetchImpl: impl, onDelivery });
      await checker.check("password");
      expect(onDelivery).toHaveBeenCalledTimes(1);
      expect(onDelivery).toHaveBeenCalledWith(true);
    });

    it("meldt mislukking (false) bij een niet-ok respons", async () => {
      const { impl } = fakeFetch("", { ok: false, status: 503 });
      const onDelivery = vi.fn();
      const checker = new HibpPasswordBreachChecker({ fetchImpl: impl, onDelivery });
      await checker.check("password");
      expect(onDelivery).toHaveBeenCalledWith(false);
    });

    it("meldt mislukking (false) bij een netwerkfout", async () => {
      const impl = vi.fn(async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch;
      const onDelivery = vi.fn();
      const checker = new HibpPasswordBreachChecker({ fetchImpl: impl, onDelivery });
      await checker.check("password");
      expect(onDelivery).toHaveBeenCalledWith(false);
    });

    it("meldt niets bij een leeg wachtwoord (geen operatie)", async () => {
      const impl = vi.fn() as unknown as typeof fetch;
      const onDelivery = vi.fn();
      const checker = new HibpPasswordBreachChecker({ fetchImpl: impl, onDelivery });
      await checker.check("");
      expect(onDelivery).not.toHaveBeenCalled();
    });

    it("een werpende hook breekt de fail-open-controle niet", async () => {
      const { impl } = fakeFetch(`${PASSWORD_HASH.slice(5)}:42`);
      const onDelivery = vi.fn(() => {
        throw new Error("heartbeat db down");
      });
      const checker = new HibpPasswordBreachChecker({ fetchImpl: impl, onDelivery });
      await expect(checker.check("password")).resolves.toEqual({
        breached: true,
        skipped: false,
        count: 42,
      });
    });
  });
});

describe("resolvePasswordBreachRetries", () => {
  it("valt terug op default (2) bij onleesbare/ontbrekende invoer", () => {
    expect(resolvePasswordBreachRetries(undefined)).toBe(2);
    expect(resolvePasswordBreachRetries("niet-een-getal")).toBe(2);
  });
  it("klemt op [0, 5]", () => {
    expect(resolvePasswordBreachRetries("0")).toBe(0);
    expect(resolvePasswordBreachRetries("-3")).toBe(0);
    expect(resolvePasswordBreachRetries("5")).toBe(5);
    expect(resolvePasswordBreachRetries("99")).toBe(5);
    expect(resolvePasswordBreachRetries("3")).toBe(3);
  });
});

describe("passwordBreachRetryDelayMs", () => {
  it("groeit exponentieel vanaf de basis en wordt geklemd op het maximum", () => {
    expect(passwordBreachRetryDelayMs(0)).toBe(250);
    expect(passwordBreachRetryDelayMs(1)).toBe(500);
    expect(passwordBreachRetryDelayMs(2)).toBe(1000);
    // 250 * 2^5 = 8000, geklemd op 4000.
    expect(passwordBreachRetryDelayMs(5)).toBe(4000);
  });
});

describe("HibpPasswordBreachChecker — retry-op-transiënte-fout", () => {
  const suffix = PASSWORD_HASH.slice(5);
  const noSleep = async () => {};

  /** Fake fetch die een reeks uitkomsten afspeelt (Error → werp; anders {ok,status,text}). */
  function scriptedFetch(steps: Array<Error | { ok?: boolean; status?: number; body?: string }>) {
    let i = 0;
    const impl = vi.fn(async () => {
      const step = steps[Math.min(i, steps.length - 1)];
      i += 1;
      if (step instanceof Error) throw step;
      return {
        ok: step.ok ?? true,
        status: step.status ?? 200,
        text: async () => step.body ?? "",
      } as unknown as Response;
    }) as unknown as typeof fetch;
    return { impl, attempts: () => i };
  }

  it("herstelt na een transiënte 5xx en levert het uiteindelijke resultaat", async () => {
    const { impl, attempts } = scriptedFetch([
      { ok: false, status: 503 },
      { ok: true, body: `${suffix}:42` },
    ]);
    const onDelivery = vi.fn();
    const checker = new HibpPasswordBreachChecker({
      fetchImpl: impl,
      retries: 2,
      sleepImpl: noSleep,
      onDelivery,
    });
    expect(await checker.check("password")).toEqual({ breached: true, skipped: false, count: 42 });
    expect(attempts()).toBe(2);
    // Alléén de einduitkomst wordt geregistreerd: één succes, geen tussentijdse mislukking.
    expect(onDelivery).toHaveBeenCalledTimes(1);
    expect(onDelivery).toHaveBeenCalledWith(true);
  });

  it("herhaalt een netwerkfout tot de retries op zijn en faalt dan open (één mislukking geregistreerd)", async () => {
    const { impl, attempts } = scriptedFetch([new Error("network down")]);
    const onDelivery = vi.fn();
    const checker = new HibpPasswordBreachChecker({
      fetchImpl: impl,
      retries: 2,
      sleepImpl: noSleep,
      onDelivery,
    });
    expect(await checker.check("password")).toEqual({ breached: false, skipped: true, count: 0 });
    // 1 initiële poging + 2 retries = 3 aanroepen.
    expect(attempts()).toBe(3);
    expect(onDelivery).toHaveBeenCalledTimes(1);
    expect(onDelivery).toHaveBeenCalledWith(false);
  });

  it("herhaalt een 429 (rate-limit) net als een 5xx", async () => {
    const { impl, attempts } = scriptedFetch([
      { ok: false, status: 429 },
      { ok: true, body: `${suffix}:7` },
    ]);
    const checker = new HibpPasswordBreachChecker({
      fetchImpl: impl,
      retries: 2,
      sleepImpl: noSleep,
    });
    expect(await checker.check("password")).toEqual({ breached: true, skipped: false, count: 7 });
    expect(attempts()).toBe(2);
  });

  it("herhaalt een niet-transiënte 4xx NIET (faalt meteen open)", async () => {
    const { impl, attempts } = scriptedFetch([{ ok: false, status: 400 }]);
    const onDelivery = vi.fn();
    const checker = new HibpPasswordBreachChecker({
      fetchImpl: impl,
      retries: 3,
      sleepImpl: noSleep,
      onDelivery,
    });
    expect(await checker.check("password")).toEqual({ breached: false, skipped: true, count: 0 });
    expect(attempts()).toBe(1);
    expect(onDelivery).toHaveBeenCalledWith(false);
  });

  it("doet geen enkele retry bij retries=0", async () => {
    const { impl, attempts } = scriptedFetch([{ ok: false, status: 503 }]);
    const checker = new HibpPasswordBreachChecker({
      fetchImpl: impl,
      retries: 0,
      sleepImpl: noSleep,
    });
    expect(await checker.check("password")).toEqual({ breached: false, skipped: true, count: 0 });
    expect(attempts()).toBe(1);
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
