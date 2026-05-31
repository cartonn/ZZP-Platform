import { describe, expect, it } from "vitest";
import {
  escapeCsvField,
  toCsv,
  centsToEuroPlain,
  administrationCsv,
  vatReturnsCsv,
  platformInvoicesCsv,
  type PlatformInvoiceCsvRow,
} from "@/lib/administration/csv";

describe("escapeCsvField", () => {
  it("laat gewone tekst ongemoeid", () => {
    expect(escapeCsvField("DEBITEUREN")).toBe("DEBITEUREN");
  });
  it("quote en verdubbelt quotes bij speciale tekens", () => {
    expect(escapeCsvField("a;b")).toBe('"a;b"');
    expect(escapeCsvField('zei "hoi"')).toBe('"zei ""hoi"""');
    expect(escapeCsvField("regel\nbreak")).toBe('"regel\nbreak"');
  });
});

describe("centsToEuroPlain", () => {
  it("rekent centen om naar euro met punt-decimaal", () => {
    expect(centsToEuroPlain(101640)).toBe("1016.40");
    expect(centsToEuroPlain(5)).toBe("0.05");
    expect(centsToEuroPlain(-12600)).toBe("-126.00");
    expect(centsToEuroPlain(0)).toBe("0.00");
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

describe("vatReturnsCsv", () => {
  it("bouwt een kop + kwartaalregels", () => {
    const csv = vatReturnsCsv([
      { year: 2026, quarter: 1, payableCents: 12600, deductibleCents: 0, balanceCents: 12600 },
      { year: 2026, quarter: 2, payableCents: 0, deductibleCents: 0, balanceCents: 0 },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("jaar;kwartaal;af_te_dragen;voorbelasting;saldo");
    expect(lines[1]).toBe("2026;Q1;126.00;0.00;126.00");
    expect(lines[2]).toBe("2026;Q2;0.00;0.00;0.00");
  });
});

describe("administrationCsv", () => {
  it("bouwt een kop + gesorteerde regels", () => {
    const csv = administrationCsv([
      {
        occurredAt: new Date("2026-02-10"),
        account: "DEBITEUREN",
        debitCents: 0,
        creditCents: 72600,
        invoiceId: "i1",
        correlationId: "c1",
      },
      {
        occurredAt: new Date("2026-02-01"),
        account: "DEBITEUREN",
        debitCents: 72600,
        creditCents: 0,
        invoiceId: "i1",
        correlationId: "c1",
      },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("datum;rekening;debet;credit;factuur;correlatie");
    expect(lines[1]).toBe("2026-02-01;DEBITEUREN;726.00;0.00;i1;c1"); // eerst de oudere datum
    expect(lines[2]).toBe("2026-02-10;DEBITEUREN;0.00;726.00;i1;c1");
  });
});

describe("platformInvoicesCsv", () => {
  const baseRow = (): PlatformInvoiceCsvRow => ({
    date: new Date("2026-03-15"),
    partyInvoiceNumber: "2026-0001",
    freelancerName: "Sanne de Vries",
    clientName: "Zorg BV",
    jobTitle: "Thuiszorg Q1",
    subtotalCents: 300000,
    vatCents: 63000,
    totalCents: 363000,
    lifecycleStatus: "PROCESSED",
    dueAt: new Date("2026-03-29"),
  });

  it("bevat de verwachte kop", () => {
    const csv = platformInvoicesCsv([baseRow()]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "datum;factuurnummer;zzper;opdrachtgever;opdracht;subtotaal_excl;btw;totaal_incl;status;vervaldatum",
    );
  });

  it("vertaalt lifecycleStatus naar leesbaar label", () => {
    const csv = platformInvoicesCsv([baseRow()]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toContain("Verwerkt");
  });

  it("gebruikt subtotalCents als subtotaal en vatCents als btw", () => {
    const csv = platformInvoicesCsv([baseRow()]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe(
      "2026-03-15;2026-0001;Sanne de Vries;Zorg BV;Thuiszorg Q1;3000.00;630.00;3630.00;Verwerkt;2026-03-29",
    );
  });

  it("valt terug op totalCents als subtotalCents ontbreekt", () => {
    const row: PlatformInvoiceCsvRow = { ...baseRow(), subtotalCents: null, vatCents: null };
    const csv = platformInvoicesCsv([row]);
    const lines = csv.split("\r\n");
    // subtotaal = totalCents, btw = 0
    expect(lines[1]).toContain("3630.00;0.00;3630.00");
  });

  it("laat datum en vervaldatum leeg als null", () => {
    const row: PlatformInvoiceCsvRow = { ...baseRow(), date: null, dueAt: null };
    const csv = platformInvoicesCsv([row]);
    const lines = csv.split("\r\n");
    expect(lines[1]?.startsWith(";2026-0001")).toBe(true);
    expect(lines[1]?.endsWith(";Verwerkt;")).toBe(true);
  });

  it("sorteert chronologisch op datum", () => {
    const rows: PlatformInvoiceCsvRow[] = [
      { ...baseRow(), date: new Date("2026-04-01"), partyInvoiceNumber: "2026-0002" },
      { ...baseRow(), date: new Date("2026-01-01"), partyInvoiceNumber: "2026-0001" },
    ];
    const csv = platformInvoicesCsv(rows);
    const lines = csv.split("\r\n");
    expect(lines[1]).toContain("2026-0001");
    expect(lines[2]).toContain("2026-0002");
  });

  it("geeft een lege CSV met alleen de kop bij geen rijen", () => {
    const csv = platformInvoicesCsv([]);
    expect(csv).toBe(
      "datum;factuurnummer;zzper;opdrachtgever;opdracht;subtotaal_excl;btw;totaal_incl;status;vervaldatum",
    );
  });
});
