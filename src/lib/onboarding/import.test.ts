import { describe, expect, it } from "vitest";
import {
  parseCsvRecords,
  detectDelimiter,
  mapColumns,
  parseRole,
  buildImportPreview,
  importTemplateCsv,
} from "@/lib/onboarding/import";

describe("detectDelimiter", () => {
  it("herkent puntkomma, komma en tab", () => {
    expect(detectDelimiter("naam;email;rol")).toBe(";");
    expect(detectDelimiter("naam,email,rol")).toBe(",");
    expect(detectDelimiter("naam\temail\trol")).toBe("\t");
  });
  it("negeert scheidingstekens binnen quotes", () => {
    expect(detectDelimiter('"a,b,c";email;rol')).toBe(";");
  });
});

describe("parseCsvRecords", () => {
  it("parse eenvoudige puntkomma-CSV", () => {
    const recs = parseCsvRecords("a;b;c\r\n1;2;3");
    expect(recs).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("ondersteunt gequote velden met scheidingsteken en escaped quotes", () => {
    const recs = parseCsvRecords('naam;skills\r\n"Vries, S.";"IC;BIG"\r\n"Hij zei ""hoi""";x');
    expect(recs[1]).toEqual(["Vries, S.", "IC;BIG"]);
    expect(recs[2]).toEqual(['Hij zei "hoi"', "x"]);
  });

  it("strip BOM, ondersteunt LF en negeert lege regels", () => {
    const recs = parseCsvRecords("﻿a;b\n1;2\n\n3;4\n");
    expect(recs).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("ondersteunt newline binnen een gequote veld", () => {
    const recs = parseCsvRecords('a;b\r\n"regel1\nregel2";x');
    expect(recs[1]).toEqual(["regel1\nregel2", "x"]);
  });
});

describe("mapColumns", () => {
  it("herkent aliassen ongeacht hoofdletters/spaties", () => {
    const cols = mapColumns(["Naam", " E-mail ", "ROL", "Bedrijfsnaam", "Uurtarief"]);
    expect(cols.name).toBe(0);
    expect(cols.email).toBe(1);
    expect(cols.role).toBe(2);
    expect(cols.companyName).toBe(3);
    expect(cols.hourlyRate).toBe(4);
    expect(cols.website).toBe(-1);
  });
});

describe("parseRole", () => {
  it("mapt NL/EN-synoniemen", () => {
    expect(parseRole("ZZP'er")).toBe("FREELANCER");
    expect(parseRole(" freelancer ")).toBe("FREELANCER");
    expect(parseRole("Opdrachtgever")).toBe("CLIENT");
    expect(parseRole("klant")).toBe("CLIENT");
    expect(parseRole("onzin")).toBeNull();
  });
});

describe("buildImportPreview", () => {
  const header = "naam;email;rol;bedrijfsnaam;uurtarief;vaardigheden";

  it("geldige ZZP'er + opdrachtgever zijn importeerbaar", () => {
    const csv = [
      header,
      'Sanne de Vries;sanne@example.nl;ZZP\'er;;55;"IC;BIG"',
      "Zorgburo;info@zorgburo.nl;Opdrachtgever;Zorgburo Noord;;",
    ].join("\r\n");
    const p = buildImportPreview(csv);
    expect(p.summary.total).toBe(2);
    expect(p.summary.importable).toBe(2);
    expect(p.summary.errors).toBe(0);
    expect(p.rows[0]).toMatchObject({ role: "FREELANCER", hourlyRate: 55, skills: ["IC", "BIG"] });
    expect(p.rows[1]).toMatchObject({ role: "CLIENT", companyName: "Zorgburo Noord" });
  });

  it("markeert ontbrekende naam/e-mail/rol als fout (niet importeerbaar)", () => {
    const csv = [header, ";nietvalide;;;;"].join("\r\n");
    const p = buildImportPreview(csv);
    const row = p.rows[0]!;
    expect(row.importable).toBe(false);
    expect(row.issues.some((i) => i.field === "name" && i.level === "error")).toBe(true);
    expect(row.issues.some((i) => i.field === "email" && i.level === "error")).toBe(true);
    expect(row.issues.some((i) => i.field === "role" && i.level === "error")).toBe(true);
  });

  it("opdrachtgever zonder bedrijfsnaam is een fout", () => {
    const csv = [header, "Bedrijf X;x@example.nl;Opdrachtgever;;;"].join("\r\n");
    const p = buildImportPreview(csv);
    expect(p.rows[0]!.issues.some((i) => i.field === "companyName" && i.level === "error")).toBe(
      true,
    );
    expect(p.rows[0]!.importable).toBe(false);
  });

  it("dubbel e-mailadres binnen het bestand → tweede rij fout", () => {
    const csv = [header, "Anna;dup@example.nl;ZZP'er;;;", "Bram;dup@example.nl;ZZP'er;;;"].join(
      "\r\n",
    );
    const p = buildImportPreview(csv);
    expect(p.rows[0]!.importable).toBe(true);
    expect(p.rows[1]!.importable).toBe(false);
    expect(p.summary.duplicatesInFile).toBe(1);
  });

  it("onleesbaar uurtarief is een waarschuwing, niet een fout", () => {
    const csv = [header, "Anna;a@example.nl;ZZP'er;;veel;"].join("\r\n");
    const p = buildImportPreview(csv);
    expect(p.rows[0]!.importable).toBe(true);
    expect(p.rows[0]!.hourlyRate).toBeNull();
    expect(p.rows[0]!.issues.some((i) => i.level === "warning" && i.field === "hourlyRate")).toBe(
      true,
    );
  });

  it("rijnummer verwijst naar de regel in het bestand (kop = 1)", () => {
    const csv = [header, "Anna;a@example.nl;ZZP'er;;;"].join("\r\n");
    expect(buildImportPreview(csv).rows[0]!.rowNumber).toBe(2);
  });

  it("leeg bestand → lege preview", () => {
    expect(buildImportPreview("").summary.total).toBe(0);
    expect(buildImportPreview(header).summary.total).toBe(0);
  });
});

describe("importTemplateCsv", () => {
  it("is zelf een geldige, importeerbare CSV", () => {
    const p = buildImportPreview(importTemplateCsv());
    expect(p.summary.total).toBe(2);
    expect(p.summary.importable).toBe(2);
    // De vaardigheden met ';' moeten gequote en correct teruggeparsed zijn.
    expect(p.rows[0]!.skills).toEqual(["IC", "Reanimatie", "BIG"]);
  });
});
