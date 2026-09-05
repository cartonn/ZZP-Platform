import { describe, expect, it } from "vitest";
import {
  AUDIT_EXPORT_CAP,
  AUDIT_EXPORT_HEADER,
  auditExportCsv,
  auditExportFilename,
  auditExportRows,
  auditExportTruncationRow,
  isAuditExportTruncated,
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

  it("blijft byte-identiek bij een volledig register (summary zonder truncatie)", () => {
    const zonder = auditExportCsv([baseEntry]);
    const met = auditExportCsv([baseEntry], { exported: 1, total: 1 });
    expect(met).toBe(zonder);
  });

  it("voegt een sluit-rij toe zodra de export getrunceerd is", () => {
    const csv = auditExportCsv([baseEntry], { exported: 1, total: 12345 });
    const lines = csv.split("\r\n");
    // kop + 1 gebeurtenis + sluit-rij
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain("getrunceerd");
    expect(lines[2]).toContain("12345");
  });
});

describe("isAuditExportTruncated", () => {
  it("is waar zodra het totaal het geëxporteerde aantal overstijgt", () => {
    expect(isAuditExportTruncated({ exported: 100, total: 101 })).toBe(true);
  });

  it("is onwaar bij een gelijk of volledig register", () => {
    expect(isAuditExportTruncated({ exported: 100, total: 100 })).toBe(false);
    expect(isAuditExportTruncated({ exported: 0, total: 0 })).toBe(false);
  });
});

describe("auditExportTruncationRow", () => {
  it("geeft null bij een volledig register", () => {
    expect(auditExportTruncationRow({ exported: 5, total: 5 })).toBeNull();
  });

  it("noemt het geëxporteerde, totale én resterende aantal, en past de kolombreedte", () => {
    const row = auditExportTruncationRow({ exported: 10, total: 25 });
    expect(row).not.toBeNull();
    expect(row).toHaveLength(AUDIT_EXPORT_HEADER.length);
    expect(row![0]).toContain("10");
    expect(row![0]).toContain("25");
    // 25 − 10 = 15 resterend
    expect(row![0]).toContain("15");
    // De melding staat volledig in de eerste kolom; de rest is leeg (geen valse audit-gebeurtenis).
    expect(row!.slice(1).every((cell) => cell === "")).toBe(true);
  });

  it("begint niet met een formule-teken (CSV-injectie-veilig)", () => {
    const row = auditExportTruncationRow({ exported: 1, total: 2 })!;
    expect(/^[=+\-@\t\r]/.test(row[0]!)).toBe(false);
  });
});

describe("auditExportFilename", () => {
  const day = new Date("2026-09-05T10:00:00.000Z");

  it("gebruikt de datum zonder achtervoegsel bij een volledig register", () => {
    expect(auditExportFilename(day)).toBe("audit-log-2026-09-05.csv");
    expect(auditExportFilename(day, { exported: 3, total: 3 })).toBe("audit-log-2026-09-05.csv");
  });

  it("markeert een getrunceerde export in de bestandsnaam", () => {
    expect(
      auditExportFilename(day, { exported: AUDIT_EXPORT_CAP, total: AUDIT_EXPORT_CAP + 1 }),
    ).toBe("audit-log-2026-09-05-getrunceerd.csv");
  });
});
