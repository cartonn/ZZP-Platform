import { describe, expect, it } from "vitest";
import {
  sanitizeUrl,
  scrubSecretPathSegments,
  stripUrlQueries,
} from "@/lib/observability/url-scrub";

describe("scrubSecretPathSegments", () => {
  it("redigeert het reset-token na /wachtwoord-herstellen", () => {
    expect(scrubSecretPathSegments("/wachtwoord-herstellen/abc123")).toBe(
      "/wachtwoord-herstellen/[redacted]",
    );
  });

  it("behoudt het profileId maar redigeert het deel-token na /vertrouwen", () => {
    expect(scrubSecretPathSegments("/vertrouwen/prof-1/token-xyz")).toBe(
      "/vertrouwen/prof-1/[redacted]",
    );
  });

  it("laat een pad zonder geheim segment ongewijzigd", () => {
    expect(scrubSecretPathSegments("/facturen/42")).toBe("/facturen/42");
  });
});

describe("sanitizeUrl", () => {
  it("reduceert tot origin+pad zonder query/fragment", () => {
    expect(sanitizeUrl("https://app.test/facturen/42?token=geheim#frag")).toBe(
      "https://app.test/facturen/42",
    );
  });

  it("redigeert geheime pad-segmenten in de URL", () => {
    expect(sanitizeUrl("https://app.test/wachtwoord-herstellen/tok?x=1")).toBe(
      "https://app.test/wachtwoord-herstellen/[redacted]",
    );
  });

  it("valt veilig terug op de basis bij een onparseerbare waarde", () => {
    expect(sanitizeUrl("not a url?x=1")).toBe("not a url");
  });
});

describe("stripUrlQueries", () => {
  it("strip de query-string (incl. API-key) uit elke URL in vrije tekst", () => {
    expect(
      stripUrlQueries("GET https://api.geoapify.com/v1/geocode/search?text=A&apiKey=SECRET failed"),
    ).toBe("GET https://api.geoapify.com/v1/geocode/search failed");
  });

  it("laat tekst zonder URL ongemoeid", () => {
    expect(stripUrlQueries("gewoon een bericht zonder link")).toBe(
      "gewoon een bericht zonder link",
    );
  });
});
