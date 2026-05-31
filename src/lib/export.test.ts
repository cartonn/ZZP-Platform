import { describe, expect, it } from "vitest";
import { csvEscape, csvRow, csvDocument } from "@/lib/export";

describe("csvEscape — basisgedrag (RFC 4180)", () => {
  it("geeft een lege string terug voor null", () => {
    expect(csvEscape(null)).toBe("");
  });

  it("geeft een lege string terug voor undefined", () => {
    expect(csvEscape(undefined)).toBe("");
  });

  it("converteert een getal naar string zonder wijzigingen", () => {
    expect(csvEscape(42)).toBe("42");
  });

  it("converteert een boolean naar string", () => {
    expect(csvEscape(true)).toBe("true");
    expect(csvEscape(false)).toBe("false");
  });

  it("laat gewone tekst ongemoeid", () => {
    expect(csvEscape("hallo wereld")).toBe("hallo wereld");
  });

  it("quotet een veld met een komma", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
  });

  it("quotet en verdubbelt interne dubbele aanhalingstekens", () => {
    expect(csvEscape('zei "hoi"')).toBe('"zei ""hoi"""');
  });

  it("quotet een veld met een newline", () => {
    expect(csvEscape("regel1\nregel2")).toBe('"regel1\nregel2"');
  });
});

describe("csvEscape — formule-injectiebeveiliging", () => {
  it("prefix '=' met apostrof", () => {
    expect(csvEscape("=1+1")).toBe("'=1+1");
  });

  it("prefix '+' met apostrof", () => {
    expect(csvEscape("+44")).toBe("'+44");
  });

  it("prefix '-' met apostrof", () => {
    expect(csvEscape("-1")).toBe("'-1");
  });

  it("prefix '@' met apostrof", () => {
    expect(csvEscape("@cmd")).toBe("'@cmd");
  });

  it("prefix TAB met apostrof (TAB veroorzaakt zelf geen RFC-quoting)", () => {
    // \t triggert de prefix maar bevat geen komma/quote/newline/CR → geen quoting
    expect(csvEscape("\thallo")).toBe("'\thallo");
  });

  it("prefix CR met apostrof en quotet daarna (CR triggert RFC-quoting)", () => {
    // Na prefix: "'\rtekst" — bevat \r, dus RFC-quoting volgt.
    // Resultaat: de string (met double-quotes) "'\rtekst"
    expect(csvEscape("\rtekst")).toBe('"\'\rtekst"');
  });

  it("beveiligt een complex hyperlink-payload: prefixed EN gequoteerd", () => {
    // Begint met '=' → apostrof-prefix → '=HYPERLINK("http://x")
    // Bevat '"' → RFC-quoting: interne " verdubbeld, gewrapped in "..."
    // Eindresultaat (als JS-string): "'=HYPERLINK(\"\"http://x\"\")"
    const payload = '=HYPERLINK("http://x")';
    // Na prefix: '=HYPERLINK("http://x") — bevat ", dus RFC-quoting
    // Na quoting: "'=HYPERLINK(""http://x"")"
    expect(csvEscape(payload)).toBe(`"'=HYPERLINK(""http://x"")"`);
  });

  it("regressie: numeriek -5 (getal, geen string) krijgt GEEN apostrof", () => {
    // Getal -5 moet exact als "-5" worden geserialiseerd, zonder apostrof.
    expect(csvEscape(-5)).toBe("-5");
  });

  it("regressie: string '-tussen-streep' begint met '-', krijgt WEL apostrof", () => {
    // Gedocumenteerd gedrag: ook strings met koppelteken als eerste teken worden
    // beschermd, omdat '-' als formule-injectieteken geldt.
    expect(csvEscape("-tussen-streep")).toBe("'-tussen-streep");
  });

  it("string die een gevaarlijk teken BEVAT maar er NIET mee begint, blijft ongewijzigd", () => {
    expect(csvEscape("a=b")).toBe("a=b");
  });
});

describe("csvEscape — gecombineerde gevallen", () => {
  it("lege string blijft leeg", () => {
    expect(csvEscape("")).toBe("");
  });

  it("string met alleen een komma wordt gequoteerd", () => {
    expect(csvEscape(",")).toBe('","');
  });
});

describe("csvRow", () => {
  it("combineert cellen met komma's", () => {
    expect(csvRow(["naam", "bedrag", 100])).toBe("naam,bedrag,100");
  });

  it("escapet cellen afzonderlijk", () => {
    expect(csvRow(["a,b", "normaal"])).toBe('"a,b",normaal');
  });

  it("verwerkt null/undefined als lege velden", () => {
    expect(csvRow([null, undefined, "x"])).toBe(",,x");
  });
});

describe("csvDocument", () => {
  it("voegt rijen samen met CRLF", () => {
    const doc = csvDocument([
      ["naam", "bedrag"],
      ["Jan", 50],
    ]);
    expect(doc).toBe("naam,bedrag\r\nJan,50");
  });

  it("escapet cellen in het hele document", () => {
    const doc = csvDocument([
      ["omschrijving", "waarde"],
      ["=SOM(A1)", 99],
    ]);
    // '=SOM(A1)' begint met '=' → apostrof-prefix
    expect(doc).toBe("omschrijving,waarde\r\n'=SOM(A1),99");
  });
});
