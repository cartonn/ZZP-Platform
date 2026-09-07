import { describe, expect, it } from "vitest";

import {
  asciiFallbackFilename,
  contentDispositionValue,
  encodeRfc5987,
  unicodePreservingFilename,
} from "./content-disposition";

describe("asciiFallbackFilename", () => {
  it("laat veilige tekens staan", () => {
    expect(asciiFallbackFilename("factuur-2026.01.pdf")).toBe("factuur-2026.01.pdf");
  });

  it("vervangt onveilige tekens (voorkomt Content-Disposition-injectie)", () => {
    expect(asciiFallbackFilename('e"vil\r\nname .pdf')).toBe("e_vil_name_.pdf");
  });

  it("valt terug op 'bestand' bij een lege of volledig gestripte naam", () => {
    expect(asciiFallbackFilename("")).toBe("bestand");
    expect(asciiFallbackFilename("///")).toBe("bestand");
  });

  it("strip omringende underscores", () => {
    expect(asciiFallbackFilename("  spaties  ")).toBe("spaties");
  });

  it("verliest diakritische tekens (dat is de fallback-eigenschap)", () => {
    expect(asciiFallbackFilename("André.pdf")).toBe("Andr_.pdf");
  });

  it("kapt een absurd lange naam af op 200 tekens", () => {
    expect(asciiFallbackFilename("a".repeat(500)).length).toBe(200);
  });
});

describe("encodeRfc5987", () => {
  it("laat attr-chars ongewijzigd", () => {
    expect(encodeRfc5987("factuur-2026.01.pdf")).toBe("factuur-2026.01.pdf");
  });

  it("percent-codeert spaties en niet-ASCII als UTF-8-bytes (hoofdletter-hex)", () => {
    expect(encodeRfc5987("André.pdf")).toBe("Andr%C3%A9.pdf");
    expect(encodeRfc5987("mijn diploma.pdf")).toBe("mijn%20diploma.pdf");
  });

  it("percent-codeert tekens die de header kunnen breken", () => {
    // Aanhalingsteken, puntkomma, CR en LF worden allemaal %XX — nooit rauw in de header.
    expect(encodeRfc5987('a";\r\n')).toBe("a%22%3B%0D%0A");
  });
});

describe("unicodePreservingFilename", () => {
  it("behoudt diakritische tekens en spaties", () => {
    expect(unicodePreservingFilename("Diploma André Müller.pdf")).toBe("Diploma André Müller.pdf");
  });

  it("strippt control-tekens en padscheidingstekens", () => {
    expect(unicodePreservingFilename('../e"vil\r\n.pdf')).toBe(".._e_vil.pdf");
  });

  it("kapt af op 200 tekens", () => {
    expect(unicodePreservingFilename("é".repeat(500)).length).toBe(200);
  });
});

describe("contentDispositionValue", () => {
  it("geeft alleen het type zonder bestandsnaam", () => {
    expect(contentDispositionValue("inline")).toBe("inline");
    expect(contentDispositionValue("attachment")).toBe("attachment");
  });

  it("geeft alleen filename= voor een pure-ASCII naam zonder spaties (geen filename*)", () => {
    expect(contentDispositionValue("attachment", "diploma.pdf")).toBe(
      'attachment; filename="diploma.pdf"',
    );
  });

  it("voegt filename*=UTF-8'' toe bij diakritische tekens (echte naam behouden)", () => {
    expect(contentDispositionValue("inline", "Diploma André.pdf")).toBe(
      "inline; filename=\"Diploma_Andr_.pdf\"; filename*=UTF-8''Diploma%20Andr%C3%A9.pdf",
    );
  });

  it("voegt filename* toe bij een spatie (fidelity boven onderscore-fallback)", () => {
    expect(contentDispositionValue("inline", "VOG scan.pdf")).toBe(
      "inline; filename=\"VOG_scan.pdf\"; filename*=UTF-8''VOG%20scan.pdf",
    );
  });

  it("saneert een vijandige naam en voegt géén overbodige filename* toe", () => {
    // Na sanering blijft alleen ASCII over (geen spatie/diakritiek), dus filename* voegt niets toe.
    const value = contentDispositionValue("inline", '../e"vil\r\n.pdf');
    expect(value).toBe('inline; filename=".._e_vil_.pdf"');
    expect(value).not.toMatch(/[\r\n]/);
    expect(value).not.toContain("filename*");
  });

  it("codeert een vijandig teken veilig in filename* wanneer het samen met unicode meekomt", () => {
    // Een aanhalingsteken náást een diakritisch teken: filename= saneert, filename* percent-codeert.
    const value = contentDispositionValue("attachment", 'André".pdf');
    expect(value).toBe("attachment; filename=\"Andr_.pdf\"; filename*=UTF-8''Andr%C3%A9_.pdf");
    expect(value).not.toMatch(/[\r\n]/);
  });

  it("blijft bij de kale fallback als de unicode-naam niks toevoegt", () => {
    // Volledig gestripte naam → "bestand"; unicode-variant is leeg, dus geen filename*.
    expect(contentDispositionValue("attachment", "///")).toBe('attachment; filename="bestand"');
  });
});
