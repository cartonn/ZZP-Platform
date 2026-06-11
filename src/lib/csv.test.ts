import { describe, expect, it } from "vitest";
import { detectDelimiter, parseCsvRecords, escapeCsvField, toCsv } from "@/lib/csv";

describe("detectDelimiter", () => {
  it("herkent puntkomma, komma en tab", () => {
    expect(detectDelimiter("a;b;c")).toBe(";");
    expect(detectDelimiter("a,b,c")).toBe(",");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
  });
  it("negeert scheidingstekens binnen quotes", () => {
    expect(detectDelimiter('"a,b,c";x;y')).toBe(";");
  });
});

describe("parseCsvRecords", () => {
  it("parse eenvoudige puntkomma-CSV", () => {
    expect(parseCsvRecords("a;b\r\n1;2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  it("ondersteunt gequote velden, embedded scheidingsteken en escaped quotes", () => {
    const recs = parseCsvRecords('naam;skills\r\n"Vries, S.";"IC;BIG"\r\n"zei ""hoi""";x');
    expect(recs[1]).toEqual(["Vries, S.", "IC;BIG"]);
    expect(recs[2]).toEqual(['zei "hoi"', "x"]);
  });
  it("strip BOM, ondersteunt LF en negeert lege regels", () => {
    expect(parseCsvRecords("﻿a;b\n1;2\n\n3;4\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });
  it("ondersteunt newline binnen een gequote veld", () => {
    expect(parseCsvRecords('a;b\r\n"regel1\nregel2";x')[1]).toEqual(["regel1\nregel2", "x"]);
  });
  it("respecteert een expliciet scheidingsteken", () => {
    expect(parseCsvRecords("a;b,c\n1;2,3", ";")).toEqual([
      ["a", "b,c"],
      ["1", "2,3"],
    ]);
  });
});

describe("escapeCsvField", () => {
  it("laat gewone tekst ongemoeid", () => {
    expect(escapeCsvField("DEBITEUREN")).toBe("DEBITEUREN");
  });
  it("quote en verdubbelt quotes bij speciale tekens", () => {
    expect(escapeCsvField("a;b")).toBe('"a;b"');
    expect(escapeCsvField('zei "hoi"')).toBe('"zei ""hoi"""');
    expect(escapeCsvField("regel\nbreak")).toBe('"regel\nbreak"');
  });
  it("respecteert een ander scheidingsteken", () => {
    expect(escapeCsvField("a,b", ",")).toBe('"a,b"');
    expect(escapeCsvField("a;b", ",")).toBe("a;b");
  });
});

describe("toCsv", () => {
  it("voegt rijen samen met ; en CRLF", () => {
    expect(
      toCsv([
        ["a", "b"],
        [1, 2],
      ]),
    ).toBe("a;b\r\n1;2");
  });
});

describe("escapeCsvField — formule-injectie", () => {
  it("voegt apostrof toe bij = als eerste teken", () => {
    expect(escapeCsvField("=1+1")).toBe("'=1+1");
  });

  it("voegt apostrof toe bij + als eerste teken", () => {
    expect(escapeCsvField("+31 6")).toBe("'+31 6");
  });

  it("voegt apostrof toe bij @ als eerste teken", () => {
    expect(escapeCsvField("@cmd")).toBe("'@cmd");
  });

  it("voegt apostrof toe bij TAB als eerste teken", () => {
    expect(escapeCsvField("\tx")).toBe("'\tx");
  });

  it("voegt apostrof toe bij CR als eerste teken en quote vanwege \\r", () => {
    expect(escapeCsvField("\rx")).toBe('"\'\rx"');
  });

  it("neutraliseert =HYPERLINK-payload met apostrof en quotes de inhoud", () => {
    expect(escapeCsvField('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
  });

  it("laat negatief geheel getal ongewijzigd", () => {
    expect(escapeCsvField("-5")).toBe("-5");
  });

  it("laat negatief decimaal getal met punt ongewijzigd", () => {
    expect(escapeCsvField("-1016.40")).toBe("-1016.40");
  });

  it("laat negatief decimaal getal met komma ongewijzigd", () => {
    expect(escapeCsvField("-1016,40")).toBe("-1016,40");
  });

  it("voegt apostrof toe bij - gevolgd door niet-cijfer (geen gewoon negatief getal)", () => {
    expect(escapeCsvField("- nacht")).toBe("'- nacht");
  });

  it("laat gevaarlijk teken niet aan het begin ongemoeid", () => {
    expect(escapeCsvField("a=b")).toBe("a=b");
  });

  it("toCsv beschermt =1+1 maar laat -5 ongemoeid in dezelfde rij", () => {
    const result = toCsv([["=1+1", -5]]);
    expect(result).toBe("'=1+1;-5");
  });
});
