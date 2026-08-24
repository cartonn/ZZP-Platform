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

  // Stored XSS (OWASP A03 / CWE-79): een niet-http(s)-website mag nooit ongefilterd in
  // `Company.website` belanden — die waarde wordt elders als rauwe `href` gerenderd.
  const webHeader = "naam;email;rol;bedrijfsnaam;website";

  it("weigert een javascript:-website (droppt de waarde, waarschuwing, rij blijft importeerbaar)", () => {
    const csv = [
      webHeader,
      "Zorgburo;info@zorgburo.nl;Opdrachtgever;Zorgburo Noord;javascript:alert(document.cookie)",
    ].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.website).toBeNull();
    expect(row.issues.some((i) => i.level === "warning" && i.field === "website")).toBe(true);
    expect(row.importable).toBe(true); // een kapotte website blokkeert de onboarding niet
  });

  it("weigert een data:-website", () => {
    const csv = [
      webHeader,
      "Zorgburo;info@zorgburo.nl;Opdrachtgever;Zorgburo Noord;data:text/html,<script>1</script>",
    ].join("\r\n");
    expect(buildImportPreview(csv).rows[0]!.website).toBeNull();
  });

  it("behoudt een geldige https-website", () => {
    const csv = [
      webHeader,
      "Zorgburo;info@zorgburo.nl;Opdrachtgever;Zorgburo Noord;https://zorgburo.nl",
    ].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.website).toBe("https://zorgburo.nl");
    expect(row.issues.some((i) => i.field === "website")).toBe(false);
  });

  it("leeg bestand → lege preview", () => {
    expect(buildImportPreview("").summary.total).toBe(0);
    expect(buildImportPreview(header).summary.total).toBe(0);
  });
});

describe("buildImportPreview — veld-bounds & KvK/BTW-formaat (Zod-pariteit)", () => {
  const fullHeader = "naam;email;rol;bedrijfsnaam;functie;locatie;kvk;btw;website;vaardigheden";

  it("naam langer dan 120 tekens → fout (niet importeerbaar)", () => {
    const longName = "A".repeat(121);
    const csv = [fullHeader, `${longName};a@example.nl;ZZP'er;;;;;;;`].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.importable).toBe(false);
    expect(row.issues.some((i) => i.field === "name" && i.level === "error")).toBe(true);
  });

  it("bedrijfsnaam langer dan 160 tekens (opdrachtgever) → fout", () => {
    const longCo = "B".repeat(161);
    const csv = [fullHeader, `Bedrijf X;x@example.nl;Opdrachtgever;${longCo};;;;;;`].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.importable).toBe(false);
    expect(row.issues.some((i) => i.field === "companyName" && i.level === "error")).toBe(true);
  });

  it("ongeldig KvK-nummer → waarschuwing + gedropt (rij blijft importeerbaar)", () => {
    const csv = [fullHeader, "Anna;a@example.nl;ZZP'er;;;;niet-geldig-1234;;;"].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.importable).toBe(true);
    expect(row.kvkNumber).toBeNull();
    expect(row.issues.some((i) => i.field === "kvkNumber" && i.level === "warning")).toBe(true);
  });

  it("geldig KvK-nummer wordt genormaliseerd (spaties/punten weg)", () => {
    const csv = [fullHeader, "Anna;a@example.nl;ZZP'er;;;;12.34.56.78;;;"].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.kvkNumber).toBe("12345678");
    expect(row.issues.some((i) => i.field === "kvkNumber")).toBe(false);
  });

  it("ongeldig BTW-nummer → waarschuwing + gedropt", () => {
    const csv = [fullHeader, "Anna;a@example.nl;ZZP'er;;;;;garbage;not,valid;"].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.importable).toBe(true);
    expect(row.btwNumber).toBeNull();
    expect(row.issues.some((i) => i.field === "btwNumber" && i.level === "warning")).toBe(true);
  });

  it("geldig BTW-nummer wordt genormaliseerd", () => {
    const csv = [fullHeader, "Anna;a@example.nl;ZZP'er;;;;;nl123456789b01;;"].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.btwNumber).toBe("NL123456789B01");
    expect(row.issues.some((i) => i.field === "btwNumber")).toBe(false);
  });

  it("te lange functie/locatie → waarschuwing + gedropt (rij blijft importeerbaar)", () => {
    const longText = "x".repeat(121);
    const csv = [fullHeader, `Anna;a@example.nl;ZZP'er;;${longText};${longText};;;;`].join("\r\n");
    const row = buildImportPreview(csv).rows[0]!;
    expect(row.importable).toBe(true);
    expect(row.headline).toBeNull();
    expect(row.location).toBeNull();
    expect(row.issues.some((i) => i.field === "headline" && i.level === "warning")).toBe(true);
    expect(row.issues.some((i) => i.field === "location" && i.level === "warning")).toBe(true);
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
