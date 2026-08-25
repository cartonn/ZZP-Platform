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

  it("redacteert PII-dragende velden in extra (door de call-site meegegeven context)", () => {
    const event: SentryEvent = {
      extra: {
        path: "/facturen",
        naam: "Sanne de Vries",
        nested: { phone: "0612345678", note: "mail jan@firma.nl" },
      },
    };
    const out = scrubSentryEvent(event);
    // niet-gevoelige debug-context blijft intact
    expect(out.extra?.path).toBe("/facturen");
    // exacte PII-sleutel → volledig geredacteerd
    expect(out.extra?.naam).toBe("[redacted]");
    // secret-/contact-substring ("phone") → geredacteerd, ook genest
    expect((out.extra?.nested as Record<string, unknown>).phone).toBe("[redacted]");
    // vrije tekst met een e-mailadres wordt gemaskeerd (geen sleutel-treffer, wel waarde-patroon)
    expect((out.extra?.nested as Record<string, unknown>).note).toBe("mail j***@firma.nl");
  });

  it("maskeert een e-mailwaarde in contexts en muteert het origineel niet", () => {
    const event: SentryEvent = { contexts: { session: { email: "sanne@example.com" } } };
    const out = scrubSentryEvent(event);
    expect((out.contexts?.session as Record<string, unknown>).email).toBe("s***@example.com");
    // origineel onaangetast (pure functie)
    expect((event.contexts?.session as Record<string, unknown>).email).toBe("sanne@example.com");
  });

  it("strip de query-string (o.a. een API-key) uit de URL van een http-breadcrumb", () => {
    // Regressie: de Sentry-SDK legt standaard een http/fetch-breadcrumb aan met de VOLLEDIGE URL.
    // De Geoapify-`apiKey` staat in die query-string; zonder breadcrumb-scrub lekt hij naar Sentry.
    const event: SentryEvent = {
      breadcrumbs: [
        {
          category: "http",
          type: "http",
          data: {
            method: "GET",
            url: "https://api.geoapify.com/v1/geocode/search?text=Amsterdam&apiKey=SECRET_KEY_123",
            status_code: 200,
          },
        },
      ],
    };
    const out = scrubSentryEvent(event);
    const crumb = (out.breadcrumbs as Array<{ data: Record<string, unknown> }>)[0]!;
    expect(crumb.data.url).toBe("https://api.geoapify.com/v1/geocode/search");
    expect(JSON.stringify(out)).not.toContain("SECRET_KEY_123");
    // niet-gevoelige velden blijven intact
    expect(crumb.data.method).toBe("GET");
    expect(crumb.data.status_code).toBe(200);
  });

  it("redigeert een geheim reset-token in een navigatie-breadcrumb (token-in-pad)", () => {
    const event: SentryEvent = {
      breadcrumbs: [
        {
          category: "navigation",
          message: "navigating to https://app.example.nl/wachtwoord-herstellen/abc123def456",
          data: { to: "https://app.example.nl/wachtwoord-herstellen/abc123def456" },
        },
      ],
    };
    const out = scrubSentryEvent(event);
    const crumb = (
      out.breadcrumbs as Array<{ message: string; data: Record<string, unknown> }>
    )[0]!;
    expect(JSON.stringify(out)).not.toContain("abc123def456");
    expect(crumb.data.to).toBe("https://app.example.nl/wachtwoord-herstellen/[redacted]");
    expect(crumb.message).toContain("[redacted]");
  });

  it("redacteert PII op sleutelnaam in breadcrumb-data en muteert het origineel niet", () => {
    const event: SentryEvent = {
      breadcrumbs: [{ category: "console", data: { email: "sanne@example.com", level: "warn" } }],
    };
    const out = scrubSentryEvent(event);
    const crumb = (out.breadcrumbs as Array<{ data: Record<string, unknown> }>)[0]!;
    expect(crumb.data.email).toBe("s***@example.com");
    expect(crumb.data.level).toBe("warn");
    // origineel onaangetast (pure functie)
    expect((event.breadcrumbs as Array<{ data: Record<string, unknown> }>)[0]!.data.email).toBe(
      "sanne@example.com",
    );
  });

  it("laat een event zonder breadcrumbs en niet-array breadcrumbs ongemoeid", () => {
    expect(scrubSentryEvent({}).breadcrumbs).toBeUndefined();
    // defensief: een onverwacht type mag niet crashen
    const weird: SentryEvent = { breadcrumbs: "oops" as unknown };
    expect(scrubSentryEvent(weird).breadcrumbs).toBe("oops");
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
