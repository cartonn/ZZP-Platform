import { describe, expect, it } from "vitest";
import {
  buildSentryInitOptions,
  resolveTracesSampleRate,
  scrubSentryEvent,
  type SentryEvent,
} from "@/lib/observability/sentry-options";

describe("resolveTracesSampleRate", () => {
  it("default 0 bij ontbrekende/lege waarde", () => {
    expect(resolveTracesSampleRate(undefined)).toBe(0);
    expect(resolveTracesSampleRate("")).toBe(0);
    expect(resolveTracesSampleRate("   ")).toBe(0);
  });

  it("parseert een geldige waarde", () => {
    expect(resolveTracesSampleRate("0.25")).toBe(0.25);
    expect(resolveTracesSampleRate("1")).toBe(1);
  });

  it("klemt op [0, 1]", () => {
    expect(resolveTracesSampleRate("-0.5")).toBe(0);
    expect(resolveTracesSampleRate("5")).toBe(1);
  });

  it("valt terug op 0 bij onzin", () => {
    expect(resolveTracesSampleRate("abc")).toBe(0);
    expect(resolveTracesSampleRate("NaN")).toBe(0);
  });
});

describe("scrubSentryEvent", () => {
  it("verwijdert gebruikersidentiteit en servernaam", () => {
    const event: SentryEvent = {
      user: { id: "u1", email: "sanne@example.com", ip_address: "1.2.3.4" },
      server_name: "instance-abc-123",
    };
    const out = scrubSentryEvent(event);
    expect(out.user).toBeUndefined();
    expect(out.server_name).toBeUndefined();
  });

  it("dropt cookies, request-body en query-string", () => {
    const event: SentryEvent = {
      request: {
        cookies: "session=secret-token",
        data: { bsn: "123456789", password: "geheim" },
        query_string: "token=abc&q=zoek",
        headers: {},
      },
    };
    const out = scrubSentryEvent(event);
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.data).toBeUndefined();
    expect(out.request?.query_string).toBeUndefined();
  });

  it("filtert headers tot een veilige allowlist (auth/cookie/forwarded eruit)", () => {
    const event: SentryEvent = {
      request: {
        headers: {
          Authorization: "Bearer geheim",
          Cookie: "session=abc",
          "X-Forwarded-For": "1.2.3.4",
          "Content-Type": "application/json",
          "x-request-id": "trace-42",
        },
      },
    };
    const out = scrubSentryEvent(event);
    expect(out.request?.headers).toEqual({
      "Content-Type": "application/json",
      "x-request-id": "trace-42",
    });
  });

  it("reduceert een absolute URL tot alleen het pad (geen querystring/host)", () => {
    const event: SentryEvent = {
      request: { url: "https://app.example.nl/facturen/42?token=geheim" },
    };
    expect(scrubSentryEvent(event).request?.url).toBe("/facturen/42");
  });

  it("kapt de querystring van een relatief pad af", () => {
    const event: SentryEvent = { request: { url: "/zoek?q=geheim#frag" } };
    expect(scrubSentryEvent(event).request?.url).toBe("/zoek");
  });

  it("muteert het originele event niet", () => {
    const event: SentryEvent = {
      user: { email: "x@y.nl" },
      request: { cookies: "s=1", headers: { Authorization: "Bearer x" } },
    };
    scrubSentryEvent(event);
    expect(event.user).toEqual({ email: "x@y.nl" });
    expect(event.request?.cookies).toBe("s=1");
  });

  it("is veilig op een leeg event", () => {
    expect(scrubSentryEvent({})).toEqual({});
  });
});

describe("buildSentryInitOptions", () => {
  it("zet sendDefaultPii op false en een beforeSend-scrubber", () => {
    const opts = buildSentryInitOptions({});
    expect(opts.sendDefaultPii).toBe(false);
    expect(opts.beforeSend).toBe(scrubSentryEvent);
    expect(opts.tracesSampleRate).toBe(0);
  });

  it("neemt DSN over en laat environment terugvallen op NODE_ENV", () => {
    const opts = buildSentryInitOptions({
      SENTRY_DSN: "https://x@o0.ingest.sentry.io/0",
      NODE_ENV: "production",
    });
    expect(opts.dsn).toBe("https://x@o0.ingest.sentry.io/0");
    expect(opts.environment).toBe("production");
  });

  it("SENTRY_ENVIRONMENT overschrijft NODE_ENV", () => {
    const opts = buildSentryInitOptions({
      NODE_ENV: "production",
      SENTRY_ENVIRONMENT: "staging",
    });
    expect(opts.environment).toBe("staging");
  });

  it("release valt terug op de commit-SHA (Railway → COMMIT_SHA)", () => {
    expect(buildSentryInitOptions({ RAILWAY_GIT_COMMIT_SHA: "abc123" }).release).toBe("abc123");
    expect(buildSentryInitOptions({ COMMIT_SHA: "def456" }).release).toBe("def456");
    expect(
      buildSentryInitOptions({ SENTRY_RELEASE: "v9", RAILWAY_GIT_COMMIT_SHA: "abc" }).release,
    ).toBe("v9");
  });

  it("laat environment/release/dsn undefined bij lege omgeving", () => {
    const opts = buildSentryInitOptions({});
    expect(opts.dsn).toBeUndefined();
    expect(opts.environment).toBeUndefined();
    expect(opts.release).toBeUndefined();
  });

  it("neemt de traces-sample-rate over uit env", () => {
    expect(buildSentryInitOptions({ SENTRY_TRACES_SAMPLE_RATE: "0.1" }).tracesSampleRate).toBe(0.1);
  });
});
