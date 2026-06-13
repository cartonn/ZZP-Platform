import { describe, expect, it } from "vitest";
import { parseLanguages, parseLanguagesText } from "@/lib/parse-languages";

describe("parseLanguages", () => {
  it("geeft een lege lijst bij null of lege tekst", () => {
    expect(parseLanguages(null)).toEqual([]);
    expect(parseLanguages("")).toEqual([]);
  });

  it("parseert een geldige JSON-array-string", () => {
    expect(parseLanguages('["Nederlands","Engels"]')).toEqual(["Nederlands", "Engels"]);
  });

  it("geeft een lege lijst bij ongeldige JSON", () => {
    expect(parseLanguages("Nederlands, Engels")).toEqual([]);
    expect(parseLanguages("{")).toEqual([]);
  });

  it("geeft een lege lijst wanneer de JSON geen array is", () => {
    expect(parseLanguages('{"taal":"Nederlands"}')).toEqual([]);
    expect(parseLanguages('"Nederlands"')).toEqual([]);
  });

  it("dwingt niet-string-elementen af naar tekst", () => {
    expect(parseLanguages("[1,2]")).toEqual(["1", "2"]);
  });
});

describe("parseLanguagesText", () => {
  it("voegt de talen samen met een komma", () => {
    expect(parseLanguagesText('["Nederlands","Engels"]')).toBe("Nederlands, Engels");
  });

  it("geeft lege tekst bij null of ongeldige invoer", () => {
    expect(parseLanguagesText(null)).toBe("");
    expect(parseLanguagesText("geen-json")).toBe("");
  });
});
