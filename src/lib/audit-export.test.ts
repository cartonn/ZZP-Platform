import { describe, expect, it } from "vitest";
import {
  AUDIT_EXPORT_HEADER,
  auditExportCsv,
  auditExportRows,
  type AuditExportEntry,
} from "@/lib/audit-export";

const baseEntry: AuditExportEntry = {
  createdAt: new Date("2026-06-22T08:30:00.000Z"),
  action: "INVOICE_PAID",
  entityType: "Invoice",
  entityId: "inv-1",
  actorName: "Mark Jansen",
  metadata: null,
};

describe("auditExportRows", () => {
  it("zet een regel om met ruwe code én NL-omschrijving voor actie en entiteit", () => {
    const row = auditExportRows([baseEntry])[0]!;
    expect(row).toEqual([
      "2026-06-22T08:30:00.000Z",
      "INVOICE_PAID",
      "Factuur betaald",
      "Invoice",
      "Factuur",
      "inv-1",
      "Mark Jansen",
      "",
    ]);
  });

  it("valt terug op 'systeem' als er geen actor is", () => {
    const row = auditExportRows([{ ...baseEntry, actorName: null }])[0]!;
    expect(row[6]).toBe("systeem");
  });

  it("formatteert metadata leesbaar in de Details-kolom", () => {
    const row = auditExportRows([
      { ...baseEntry, metadata: JSON.stringify({ totalCents: 12100 }) },
    ])[0]!;
    expect(row[7]).toContain("€");
  });

  it("gebruikt de leesbare fallback voor onbekende actiecodes", () => {
    const row = auditExportRows([{ ...baseEntry, action: "SOMETHING_NEW_HAPPENED" }])[0]!;
    expect(row[1]).toBe("SOMETHING_NEW_HAPPENED");
    expect(row[2]).toBe("Something new happened");
  });

  it("muteert de invoer niet", () => {
    const entries = [baseEntry];
    auditExportRows(entries);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toBe(baseEntry);
  });
});

describe("auditExportCsv", () => {
  it("begint met de kopregel en bevat één regel per gebeurtenis", () => {
    const csv = auditExportCsv([baseEntry]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(AUDIT_EXPORT_HEADER.join(";"));
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("INVOICE_PAID");
  });

  it("escapet velden met het scheidingsteken (CSV-veiligheid)", () => {
    const csv = auditExportCsv([{ ...baseEntry, actorName: "Jansen; B.V." }]);
    expect(csv).toContain('"Jansen; B.V."');
  });

  it("levert alleen de kopregel bij een lege selectie", () => {
    const csv = auditExportCsv([]);
    expect(csv).toBe(AUDIT_EXPORT_HEADER.join(";"));
  });
});
