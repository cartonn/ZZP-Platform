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

// De aflever-heartbeat wordt apart getest (met eigen prisma-mock); hier mocken we 'm zodat de
// reporter-test losstaat van de DB en we kunnen verifiëren dat capture succes/mislukking registreert.
const recordSuccess = vi.hoisted(() => vi.fn(async () => {}));
const recordFailure = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/observability/error-monitoring-delivery-heartbeat", () => ({
  recordErrorMonitoringDeliverySuccess: recordSuccess,
  recordErrorMonitoringDeliveryFailure: recordFailure,
}));

import { logger } from "@/lib/observability/logger";
import {
  __resetReporterForTests,
  __setSentryLoaderForTests,
  getErrorReporter,
  probeErrorMonitoring,
  reportBackgroundFailure,
  reportError,
} from "@/lib/observability/report";

const errorSpy = logger.error as unknown as ReturnType<typeof vi.fn>;
const warnSpy = logger.warn as unknown as ReturnType<typeof vi.fn>;
const sentryInit = vi.fn();
const sentryCaptureException = vi.fn();
const sentryCaptureMessage = vi.fn();
const sentryFlush = vi.fn(async () => true);

const ORIGINAL_DSN = process.env.SENTRY_DSN;

beforeEach(() => {
  __setSentryLoaderForTests(async () => ({
    init: sentryInit,
    captureException: sentryCaptureException,
    captureMessage: sentryCaptureMessage,
    flush: sentryFlush,
  }));
  delete process.env.SENTRY_DSN;
  errorSpy.mockClear();
  warnSpy.mockClear();
  sentryInit.mockClear();
  sentryCaptureException.mockClear();
  sentryCaptureMessage.mockClear();
  sentryFlush.mockClear();
  recordSuccess.mockClear();
  recordFailure.mockClear();
});

afterEach(() => {
  if (ORIGINAL_DSN === undefined) {
    delete process.env.SENTRY_DSN;
  } else {
    process.env.SENTRY_DSN = ORIGINAL_DSN;
  }
  __setSentryLoaderForTests();
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

describe("reportError (sentry-tak)", () => {
  beforeEach(() => {
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    __resetReporterForTests();
    errorSpy.mockClear();
    warnSpy.mockClear();
  });

  it("initialiseert één keer en stuurt fouten met een request-id-tag naar Sentry", async () => {
    await reportError(new Error("boom"), { source: "onRequestError" });
    await reportError(new Error("boom2"), { source: "onRequestError", requestId: "trace-42" });

    expect(sentryInit).toHaveBeenCalledTimes(1);
    expect(sentryCaptureException).toHaveBeenCalledTimes(2);
    expect(sentryCaptureException).toHaveBeenLastCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { request_id: "trace-42" } }),
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("werpt nooit in de sentry-tak", async () => {
    await expect(reportError("kapot")).resolves.toBeUndefined();
  });

  it("valt bij een onbeschikbare SDK terug op console en waarschuwt éénmalig", async () => {
    __setSentryLoaderForTests(async () => null);
    await reportError(new Error("boom"));
    await reportError(new Error("boom2"));
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls.filter((c) => c[0] === "sentry-unavailable")).toHaveLength(1);
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

    // Eén lokale regel + één externe capture; geen dubbele console-fallback.
    const backgroundLines = errorSpy.mock.calls.filter((c) => c[0] === "background-failure");
    const fallbackLines = errorSpy.mock.calls.filter((c) => c[0] === "unhandled-error");
    expect(backgroundLines).toHaveLength(1);
    expect(fallbackLines).toHaveLength(0);
    expect(sentryCaptureException).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls.filter((c) => c[0] === "sentry-unavailable")).toHaveLength(0);
  });
});

describe("probeErrorMonitoring", () => {
  it("rapporteert de geïnstalleerde SDK en een geslaagde flush zonder token-echo", async () => {
    const result = await probeErrorMonitoring("abc123");
    expect(result.packageInstalled).toBe(true);
    expect(result.delivered).toBe(true);
    expect(sentryCaptureMessage).toHaveBeenCalledTimes(1);
    expect(sentryFlush).toHaveBeenCalledTimes(1);
    expect(result.detail).not.toContain("abc123"); // geen token/secret-echo in het detail
  });

  it("meldt een ontbrekende SDK expliciet", async () => {
    __setSentryLoaderForTests(async () => null);
    const result = await probeErrorMonitoring("abc123");
    expect(result.packageInstalled).toBe(false);
    expect(result.delivered).toBe(false);
    expect(result.detail).toContain("@sentry/nextjs");
  });
});

describe("aflever-heartbeat-wiring (SentryErrorReporter.capture)", () => {
  it("een geslaagde capture registreert aflever-succes, geen mislukking", async () => {
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    await reportError(new Error("boom"), { source: "onRequestError" });
    expect(sentryCaptureException).toHaveBeenCalledTimes(1);
    expect(recordSuccess).toHaveBeenCalledTimes(1);
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("een ontbrekend @sentry/nextjs-pakket registreert een aflever-mislukking en valt terug op console", async () => {
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    __setSentryLoaderForTests(async () => null);
    await reportError(new Error("boom"), { source: "onRequestError" });
    expect(recordFailure).toHaveBeenCalledTimes(1);
    expect(recordSuccess).not.toHaveBeenCalled();
    // Console-fallback schreef de fout gestructureerd weg.
    expect(errorSpy.mock.calls.filter((c) => c[0] === "unhandled-error")).toHaveLength(1);
  });

  it("een werpende captureException registreert een aflever-mislukking en valt terug op console (geen worp)", async () => {
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    sentryCaptureException.mockImplementationOnce(() => {
      throw new Error("transport kapot");
    });
    await expect(reportError(new Error("boom"))).resolves.toBeUndefined();
    expect(recordFailure).toHaveBeenCalledTimes(1);
    expect(recordSuccess).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.filter((c) => c[0] === "unhandled-error")).toHaveLength(1);
  });

  it("zonder SENTRY_DSN (console-reporter) registreert de heartbeat niets", async () => {
    delete process.env.SENTRY_DSN;
    await reportError(new Error("boom"));
    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordFailure).not.toHaveBeenCalled();
  });
});
