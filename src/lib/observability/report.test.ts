import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// De logger wordt apart getest; hier mocken we 'm zodat deze test losstaat van de echte
// implementatie en we de aanroepen kunnen inspecteren.
vi.mock("@/lib/observability/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { logger } from "@/lib/observability/logger";
import {
  __resetReporterForTests,
  getErrorReporter,
  reportBackgroundFailure,
  reportError,
} from "@/lib/observability/report";

const errorSpy = logger.error as unknown as ReturnType<typeof vi.fn>;
const warnSpy = logger.warn as unknown as ReturnType<typeof vi.fn>;

const ORIGINAL_DSN = process.env.SENTRY_DSN;

beforeEach(() => {
  __resetReporterForTests();
  delete process.env.SENTRY_DSN;
  errorSpy.mockClear();
  warnSpy.mockClear();
});

afterEach(() => {
  if (ORIGINAL_DSN === undefined) {
    delete process.env.SENTRY_DSN;
  } else {
    process.env.SENTRY_DSN = ORIGINAL_DSN;
  }
  __resetReporterForTests();
});

describe("getErrorReporter", () => {
  it("kiest de console-reporter zonder SENTRY_DSN", () => {
    expect(getErrorReporter().name).toBe("console");
  });

  it("kiest de sentry-reporter als SENTRY_DSN gezet is", () => {
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    expect(getErrorReporter().name).toBe("sentry");
  });

  it("cachet de keuze (singleton)", () => {
    const first = getErrorReporter();
    expect(getErrorReporter()).toBe(first);
  });
});

describe("reportError (console-tak)", () => {
  it("logt naam + message via logger.error", async () => {
    await reportError(new Error("boom"), { source: "test", requestPath: "/x" });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [msg, fields] = errorSpy.mock.calls[0]!;
    expect(msg).toBe("unhandled-error");
    expect(fields).toMatchObject({
      name: "Error",
      message: "boom",
      source: "test",
      requestPath: "/x",
    });
  });

  it("neemt de request-correlatie-ID mee in de logregel", async () => {
    await reportError(new Error("boom"), { source: "onRequestError", requestId: "trace-42" });
    const [, fields] = errorSpy.mock.calls[0]!;
    expect(fields).toMatchObject({ requestId: "trace-42" });
  });

  it("werpt nooit, ook niet bij een niet-Error (string)", async () => {
    await expect(reportError("kapot")).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [, fields] = errorSpy.mock.calls[0]!;
    expect(fields).toMatchObject({ message: "kapot" });
  });

  it("werpt nooit bij een willekeurige niet-Error-waarde", async () => {
    await expect(reportError({ code: 42 })).resolves.toBeUndefined();
    await expect(reportError(null)).resolves.toBeUndefined();
    await expect(reportError(undefined)).resolves.toBeUndefined();
  });
});

describe("reportError (sentry-tak, pakket niet geïnstalleerd)", () => {
  beforeEach(() => {
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    __resetReporterForTests();
    errorSpy.mockClear();
    warnSpy.mockClear();
  });

  it("valt graceful terug op de console en waarschuwt éénmalig", async () => {
    // @sentry/nextjs bestaat niet → de import faalt vanzelf.
    await reportError(new Error("boom"), { source: "onRequestError" });
    await reportError(new Error("boom2"), { source: "onRequestError" });

    // Beide calls vielen terug op de console-capture.
    expect(errorSpy).toHaveBeenCalledTimes(2);
    // De waarschuwing wordt maar één keer gelogd.
    const sentryWarnings = warnSpy.mock.calls.filter((c) => c[0] === "sentry-unavailable");
    expect(sentryWarnings).toHaveLength(1);
  });

  it("werpt nooit in de sentry-tak", async () => {
    await expect(reportError("kapot")).resolves.toBeUndefined();
  });
});

describe("reportBackgroundFailure", () => {
  it("logt altijd een gestructureerde regel met source, extra en foutdetails", async () => {
    await reportBackgroundFailure("cron:run-all", new Error("boom"), { task: "expiry" });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [msg, fields] = errorSpy.mock.calls[0]!;
    expect(msg).toBe("background-failure");
    expect(fields).toMatchObject({
      source: "cron:run-all",
      task: "expiry",
      error: { name: "Error", message: "boom" },
    });
  });

  it("logt zonder Sentry precies één keer (geen dubbele console-regel)", async () => {
    // Geen SENTRY_DSN → de externe tak wordt overgeslagen zodat de console-reporter niet dubbelt.
    await reportBackgroundFailure("cron:expiry", new Error("boom"));
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("werpt nooit, ook niet bij een niet-Error-waarde", async () => {
    await expect(reportBackgroundFailure("cron:x", "kapot")).resolves.toBeUndefined();
    await expect(reportBackgroundFailure("cron:x", null)).resolves.toBeUndefined();
    const [, fields] = errorSpy.mock.calls[0]!;
    expect(fields).toMatchObject({ source: "cron:x", error: { message: "kapot" } });
  });

  it("escaleert additioneel naar de externe reporter wanneer SENTRY_DSN gezet is", async () => {
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    __resetReporterForTests();
    errorSpy.mockClear();
    warnSpy.mockClear();

    await reportBackgroundFailure("cron:run-all", new Error("boom"), { task: "monitor" });

    // Eén lokale background-failure-regel + de Sentry-tak valt (pakket niet geïnstalleerd) terug op
    // de console-capture → in totaal twee logregels, en éénmalig de sentry-onbeschikbaar-waarschuwing.
    const backgroundLines = errorSpy.mock.calls.filter((c) => c[0] === "background-failure");
    const fallbackLines = errorSpy.mock.calls.filter((c) => c[0] === "unhandled-error");
    expect(backgroundLines).toHaveLength(1);
    expect(fallbackLines).toHaveLength(1);
    const sentryWarnings = warnSpy.mock.calls.filter((c) => c[0] === "sentry-unavailable");
    expect(sentryWarnings).toHaveLength(1);
  });
});
