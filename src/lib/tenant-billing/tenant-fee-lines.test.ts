import { describe, it, expect } from "vitest";
import {
  type TenantFeeLine,
  sortTenantFeeLines,
  tenantFeeStatusLabel,
  exportTenantFeesCsv,
} from "@/lib/tenant-billing/tenant-fee-lines";

function line(overrides: Partial<TenantFeeLine> = {}): TenantFeeLine {
  return {
    collaborationId: "c1",
    jobTitle: "Verpleegkundige VVT",
    clientName: "Zorgcentrum De Linde",
    freelancerName: "Sanne de Vries",
    feeCents: 5000,
    vatCents: 1050,
    status: "PENDING",
    recordedAt: new Date("2026-08-10T12:00:00.000Z"),
    ...overrides,
  };
}

describe("tenantFeeStatusLabel", () => {
  it("mapt de fee-status naar het NL-label", () => {
    expect(tenantFeeStatusLabel("PENDING")).toBe("Openstaand");
    expect(tenantFeeStatusLabel("INVOICED")).toBe("Gefactureerd");
  });
});

describe("sortTenantFeeLines", () => {
  it("ordent nieuwste-eerst op recordedAt", () => {
    const older = line({ collaborationId: "older", recordedAt: new Date("2026-08-01T00:00:00Z") });
    const newer = line({ collaborationId: "newer", recordedAt: new Date("2026-08-20T00:00:00Z") });
    const sorted = sortTenantFeeLines([older, newer]);
    expect(sorted.map((l) => l.collaborationId)).toEqual(["newer", "older"]);
  });

  it("breekt gelijke tijdstempels deterministisch op collaborationId (geen flappende rijen)", () => {
    const at = new Date("2026-08-10T00:00:00Z");
    const b = line({ collaborationId: "b", recordedAt: at });
    const a = line({ collaborationId: "a", recordedAt: at });
    expect(sortTenantFeeLines([b, a]).map((l) => l.collaborationId)).toEqual(["a", "b"]);
    expect(sortTenantFeeLines([a, b]).map((l) => l.collaborationId)).toEqual(["a", "b"]);
  });

  it("muteert de invoer niet", () => {
    const input = [
      line({ collaborationId: "x", recordedAt: new Date("2026-08-01T00:00:00Z") }),
      line({ collaborationId: "y", recordedAt: new Date("2026-08-05T00:00:00Z") }),
    ];
    const snapshot = input.map((l) => l.collaborationId);
    sortTenantFeeLines(input);
    expect(input.map((l) => l.collaborationId)).toEqual(snapshot);
  });
});

describe("exportTenantFeesCsv", () => {
  it("schrijft een kopregel + één rij per fee met NL-bedragen (komma-decimaal)", () => {
    const csv = exportTenantFeesCsv([line()]);
    const [header, row] = csv.split("\r\n");
    expect(header).toBe("Opdracht;Opdrachtgever;ZZP'er;Status;Fee (EUR);Btw (EUR);Vastgelegd op");
    expect(row).toBe(
      "Verpleegkundige VVT;Zorgcentrum De Linde;Sanne de Vries;Openstaand;50,00;10,50;2026-08-10",
    );
  });

  it("ordent de CSV nieuwste-eerst, identiek aan het scherm", () => {
    const older = line({
      collaborationId: "older",
      jobTitle: "Oud",
      recordedAt: new Date("2026-08-01T00:00:00Z"),
    });
    const newer = line({
      collaborationId: "newer",
      jobTitle: "Nieuw",
      recordedAt: new Date("2026-08-20T00:00:00Z"),
    });
    const rows = exportTenantFeesCsv([older, newer]).split("\r\n");
    expect(rows[1]!.startsWith("Nieuw;")).toBe(true);
    expect(rows[2]!.startsWith("Oud;")).toBe(true);
  });

  it("laat een lege ZZP'er-naam als leeg veld door", () => {
    const csv = exportTenantFeesCsv([line({ freelancerName: null })]);
    expect(csv.split("\r\n")[1]).toContain("Verpleegkundige VVT;Zorgcentrum De Linde;;Openstaand;");
  });

  it("beveiligt tegen CSV-formule-injectie in vrije-tekstvelden (CWE-1236)", () => {
    const csv = exportTenantFeesCsv([line({ jobTitle: "=CMD()", clientName: "+HACK" })]);
    const row = csv.split("\r\n")[1]!;
    // toCsv prefixt een gevaarlijke cel met een apostrof (via escapeCsvField).
    expect(row).not.toMatch(/^=CMD/);
    expect(row).toContain("'=CMD()");
    expect(row).toContain("'+HACK");
  });

  it("geeft alleen de kopregel terug bij nul fees", () => {
    expect(exportTenantFeesCsv([])).toBe(
      "Opdracht;Opdrachtgever;ZZP'er;Status;Fee (EUR);Btw (EUR);Vastgelegd op",
    );
  });
});
