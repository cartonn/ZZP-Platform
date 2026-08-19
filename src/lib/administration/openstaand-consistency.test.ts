import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Regressie: de /openstaand-pagina (openstaand-panel.tsx) én haar CSV-export (route.ts) moeten de
// openstaand-regel uit de canonieke bron (outstanding.ts → isInvoiceOutstanding) consumeren, nooit de
// literal statusarrays inline dupliceren. Twee kopieën lopen stil uiteen zodra OUTSTANDING_LIFECYCLE
// verandert — precies de "twee definities van hetzelfde getal"-val op de pagina die "openstaand" heet.
// (RED vóór de dedup-fix: beide bestanden bevatten toen de hand-gerolde `.filter((inv) => …)`-literal.)
const CONSUMERS = [
  "src/app/api/administratie/openstaand/route.ts",
  "src/components/administratie/openstaand-panel.tsx",
];

const REPO_ROOT = join(__dirname, "..", "..", "..");

// De precieze hand-gerolde literal-set die de cascade-tak dupliceert. Blijft die uit de bron, dan
// kan de openstaand-regel niet meer stil afwijken van de canonieke helper.
const HANDROLLED_LIFECYCLE_LITERAL = '["SUBMITTED", "APPROVED", "OVERDUE"]';

describe("openstaand-consumenten gebruiken de canonieke openstaand-regel", () => {
  for (const rel of CONSUMERS) {
    const source = readFileSync(join(REPO_ROOT, rel), "utf8");

    it(`${rel} importeert isInvoiceOutstanding uit de canonieke bron`, () => {
      expect(source).toContain("isInvoiceOutstanding");
      expect(source).toMatch(/from ["']@\/lib\/administration\/outstanding["']/);
    });

    it(`${rel} rolt de openstaand-statusregel niet zelf inline uit`, () => {
      expect(source).not.toContain(HANDROLLED_LIFECYCLE_LITERAL);
    });
  }
});
