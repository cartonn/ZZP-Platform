import { describe, expect, it } from "vitest";
import {
  MAX_MESSAGE_LEN,
  MAX_STACK_LEN,
  parseClientError,
  scrubSecretPathSegments,
  toPagePath,
  toReportableError,
} from "@/lib/observability/client-error";

describe("toPagePath", () => {
  it("reduceert een volledige URL tot alleen het pad (geen host/query/fragment)", () => {
    expect(toPagePath("https://app.test/dossier/abc?token=SECRET#x")).toBe("/dossier/abc");
  });

  it("geeft '/' voor de root", () => {
    expect(toPagePath("https://app.test/")).toBe("/");
    expect(toPagePath("https://app.test")).toBe("/");
  });

  it("strip query/fragment uit een relatief pad", () => {
    expect(toPagePath("/dossier/abc?token=SECRET")).toBe("/dossier/abc");
    expect(toPagePath("/x#frag")).toBe("/x");
  });

  it("geeft null bij lege of niet-string invoer", () => {
    expect(toPagePath("")).toBeNull();
    expect(toPagePath("   ")).toBeNull();
    expect(toPagePath(42)).toBeNull();
    expect(toPagePath(undefined)).toBeNull();
  });

  it("redigeert het geheime reset-token in het pad", () => {
    const token = "a".repeat(43);
    expect(toPagePath(`https://app.test/wachtwoord-herstellen/${token}`)).toBe(
      "/wachtwoord-herstellen/[redacted]",
    );
    expect(toPagePath(`/wachtwoord-herstellen/${token}?x=1`)).toBe(
      "/wachtwoord-herstellen/[redacted]",
    );
  });

  it("redigeert het deel-token maar behoudt het (niet-geheime) profileId", () => {
    expect(toPagePath("https://app.test/vertrouwen/user-123/SECRETTOKEN")).toBe(
      "/vertrouwen/user-123/[redacted]",
    );
  });
});

describe("scrubSecretPathSegments", () => {
  it("laat paden zonder geheim segment ongemoeid", () => {
    expect(scrubSecretPathSegments("/dashboard")).toBe("/dashboard");
    expect(scrubSecretPathSegments("/opdrachten/abc")).toBe("/opdrachten/abc");
    expect(scrubSecretPathSegments("/")).toBe("/");
  });

  it("redigeert alle segmenten ná de te-behouden segmenten", () => {
    expect(scrubSecretPathSegments("/wachtwoord-herstellen/TOKEN")).toBe(
      "/wachtwoord-herstellen/[redacted]",
    );
    expect(scrubSecretPathSegments("/vertrouwen/id/TOKEN/extra")).toBe(
      "/vertrouwen/id/[redacted]/[redacted]",
    );
  });

  it("is veilig op een prefix zonder token-segment", () => {
    expect(scrubSecretPathSegments("/wachtwoord-herstellen")).toBe("/wachtwoord-herstellen");
    expect(scrubSecretPathSegments("/vertrouwen/id")).toBe("/vertrouwen/id");
  });
});

describe("parseClientError", () => {
  it("normaliseert een volledige payload en strip PII uit URL/stack", () => {
    const result = parseClientError({
      name: "TypeError",
      message: "x is not a function",
      stack: "TypeError: x\n  at https://app.test/_next/chunk.js?token=SECRET:1:2",
      componentStack: "  at Foo (https://app.test/page?token=SECRET)",
      url: "https://app.test/dossier/abc?token=SECRET",
      digest: "abc123",
    });
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      name: "TypeError",
      message: "x is not a function",
      path: "/dossier/abc",
      digest: "abc123",
    });
    // Query-strings met tokens zijn uit de stack én component-stack verwijderd.
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(result!.stack).toContain("https://app.test/_next/chunk.js");
    expect(result!.stack).not.toContain("?token");
  });

  it("laat geen reset-/deel-token door — niet via url, niet via de stack", () => {
    const resetToken = "R".repeat(43);
    const shareToken = "S".repeat(40);
    const result = parseClientError({
      name: "Error",
      message: "boom",
      url: `https://app.test/wachtwoord-herstellen/${resetToken}`,
      stack: `Error: boom\n  at https://app.test/vertrouwen/prof-1/${shareToken}\n  at foo`,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(resetToken);
    expect(serialized).not.toContain(shareToken);
    expect(result!.path).toBe("/wachtwoord-herstellen/[redacted]");
    expect(result!.stack).toContain("/vertrouwen/prof-1/[redacted]");
  });

  it("strip een URL-query-token uit de message zelf (niet alleen uit stack/url)", () => {
    // Een browser kan een volledige URL met token in het foutbericht echoën (bv. een gefaalde fetch
    // die de request-URL teruggeeft). Die message wordt de Sentry exception-`value` — buiten de
    // breadcrumb-scrub om — dus het token moet hier al weg zijn. AVG art. 5(1)(f).
    const result = parseClientError({
      message: "Failed to fetch https://app.test/api/x?token=SUPERSECRET123 (500)",
    });
    expect(result).not.toBeNull();
    expect(result!.message).not.toContain("SUPERSECRET123");
    expect(result!.message).not.toContain("?token");
    // Het niet-geheime deel van het bericht blijft leesbaar behouden.
    expect(result!.message).toContain("Failed to fetch");
    expect(result!.message).toContain("https://app.test/api/x");
  });

  it("redigeert een reset-token dat via een pad in de message zit", () => {
    const resetToken = "Z".repeat(43);
    const result = parseClientError({
      message: `Navigation error at https://app.test/wachtwoord-herstellen/${resetToken}`,
    });
    expect(result!.message).not.toContain(resetToken);
    expect(result!.message).toContain("/wachtwoord-herstellen/[redacted]");
  });

  it("valt terug op veilige defaults bij ontbrekende velden", () => {
    const result = parseClientError({ name: "Error" });
    expect(result).toMatchObject({
      name: "Error",
      message: "(geen bericht)",
      stack: null,
      componentStack: null,
      path: null,
      digest: null,
    });
  });

  it("accepteert een payload met alleen een message", () => {
    expect(parseClientError({ message: "boom" })).toMatchObject({
      name: "Error",
      message: "boom",
    });
  });

  it("geeft null zonder naam én bericht", () => {
    expect(parseClientError({ url: "https://app.test/x" })).toBeNull();
    expect(parseClientError({})).toBeNull();
  });

  it("geeft null voor niet-object payloads", () => {
    expect(parseClientError(null)).toBeNull();
    expect(parseClientError("boom")).toBeNull();
    expect(parseClientError([{ message: "x" }])).toBeNull();
    expect(parseClientError(42)).toBeNull();
  });

  it("kapt te lange velden af", () => {
    const result = parseClientError({
      message: "m".repeat(MAX_MESSAGE_LEN + 50),
      stack: "s".repeat(MAX_STACK_LEN + 50),
    });
    expect(result!.message.length).toBe(MAX_MESSAGE_LEN + 1); // + ellipsis
    expect(result!.message.endsWith("…")).toBe(true);
    expect(result!.stack!.length).toBe(MAX_STACK_LEN + 1);
  });
});

describe("toReportableError", () => {
  it("bouwt een echte Error met naam, bericht en stack", () => {
    const normalized = parseClientError({
      name: "RangeError",
      message: "out of range",
      stack: "RangeError: out of range\n  at foo",
    })!;
    const error = toReportableError(normalized);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RangeError");
    expect(error.message).toBe("out of range");
    expect(error.stack).toContain("at foo");
  });

  it("laat stack undefined wanneer er geen is", () => {
    const normalized = parseClientError({ message: "boom" })!;
    const error = toReportableError(normalized);
    expect(error.stack).toBeUndefined();
  });
});
