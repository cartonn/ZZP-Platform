import { describe, expect, it } from "vitest";
import {
  escapeCsvField,
  toCsv,
  centsToEuroPlain,
  administrationCsv,
  vatReturnsCsv,
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
