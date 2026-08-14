import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { redact } from "./logger";

const REDACTED = "[redacted]";

// Elk Prisma-schemaveld waarvan de naam op `Name`/`Naam` eindigt is een kandidaat voor persoons-PII.
// Deze test dwingt af dat elk zo'n veld óf door de logger/Sentry-scrub wordt geredacteerd, óf hier
// bewust als niet-persoons-PII is uitgezonderd. Zo breekt een TOEKOMSTIG naamveld de CI-poort in
// plaats van stil ongeredacteerd naar logs/Sentry te lekken (AVG art. 5(1)(f) — les auditronde
// 2026-08-14: de exacte-sleutellijst miste `verifiedLegalName`/`organizationName` e.d.).

// Bewust niet-PII (geen natuurlijk persoon): een documentnaam en een vaste fiscale-partner-bedrijfsnaam.
// Uitbreiden vereist een expliciete, gemotiveerde keuze — precies het doel van deze poort.
const KNOWN_NON_PII_NAME_FIELDS = new Set(["filename", "partnername"]);

function schemaNameFields(): string[] {
  const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
  const fields = new Set<string>();
  for (const line of schema.split("\n")) {
    // Prisma-modelvelden zijn camelCase en beginnen met een kleine letter; model-/enum-/type-namen
    // beginnen met een hoofdletter en vallen zo buiten deze match.
    const m = /^\s*([a-z][A-Za-z0-9]*(?:Name|Naam))\s+\S/.exec(line);
    if (m) fields.add(m[1]!);
  }
  return [...fields];
}

describe("logger PII-naamdekking (schema ↔ redactie)", () => {
  it("vindt ten minste de bekende naamvelden in het schema (extractie werkt)", () => {
    const fields = schemaNameFields();
    expect(fields).toContain("verifiedLegalName");
    expect(fields).toContain("organizationName");
    expect(fields).toContain("contactName");
  });

  it("redacteert elk PII-naamveld uit het schema (of het staat op de expliciete niet-PII-lijst)", () => {
    const leaked: string[] = [];
    for (const field of schemaNameFields()) {
      if (KNOWN_NON_PII_NAME_FIELDS.has(field.toLowerCase())) continue;
      if (redact({ [field]: "Jan de Vries" })[field] !== REDACTED) leaked.push(field);
    }
    expect(
      leaked,
      `Niet-geredacteerde naamvelden (voeg toe aan REDACT_KEY_EXACT in logger.ts, of aan ` +
        `KNOWN_NON_PII_NAME_FIELDS als het echt geen persoons-PII is): ${leaked.join(", ")}`,
    ).toEqual([]);
  });
});
