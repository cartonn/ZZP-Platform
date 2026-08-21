import { describe, it, expect } from "vitest";
import { payerBehaviorCsv } from "@/lib/payer-behavior-csv";
import type { PayerBehaviorRow } from "@/lib/freelancer-payer-behavior";

function row(
  name: string,
  behavior: Partial<PayerBehaviorRow["behavior"]> & { tone: PayerBehaviorRow["behavior"]["tone"] },
): PayerBehaviorRow {
  return {
    companyId: name,
    name,
    behavior: {
      sampleSize: behavior.sampleSize ?? 3,
      avgDaysToPay: behavior.avgDaysToPay ?? null,
      onTimePct: behavior.onTimePct ?? null,
      tone: behavior.tone,
    },
  };
}

describe("payerBehaviorCsv", () => {
  it("schrijft een vaste kop", () => {
    const csv = payerBehaviorCsv([]);
    expect(csv.split("\r\n")[0]).toBe(
      "Opdrachtgever;Gemiddelde betaaltijd (dagen);Op tijd (%);Aantal betalingen;Beoordeling",
    );
  });

  it("zet een rij om met betaaltijd, op-tijd-percentage, aantal en oordeel", () => {
    const csv = payerBehaviorCsv([
      row("De Linde", { sampleSize: 8, avgDaysToPay: 9, onTimePct: 100, tone: "good" }),
    ]);
    expect(csv.split("\r\n")[1]).toBe("De Linde;9;100;8;Betaalt op tijd");
  });

  it("laat lege cellen voor een niet-berekenbare betaaltijd/op-tijd-percentage (geen verzonnen 0)", () => {
    const csv = payerBehaviorCsv([
      row("Zorg BV", { sampleSize: 4, avgDaysToPay: null, onTimePct: null, tone: "neutral" }),
    ]);
    expect(csv.split("\r\n")[1]).toBe("Zorg BV;;;4;Gemiddeld");
  });

  it("behoudt de aangeleverde volgorde (waarschuwing eerst, zoals op het scherm)", () => {
    const csv = payerBehaviorCsv([
      row("Traag NV", { avgDaysToPay: 45, onTimePct: 30, tone: "warning" }),
      row("Snel BV", { avgDaysToPay: 7, onTimePct: 95, tone: "good" }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[1]!.startsWith("Traag NV")).toBe(true);
    expect(lines[2]!.startsWith("Snel BV")).toBe(true);
  });

  it("beveiligt tegen CSV-formule-injectie in een bedrijfsnaam (CWE-1236)", () => {
    const csv = payerBehaviorCsv([
      row("=CMD()|malicious", { avgDaysToPay: 20, onTimePct: 70, tone: "neutral" }),
    ]);
    // De cel mag niet met een actief formule-teken beginnen.
    const firstCell = csv.split("\r\n")[1]!.split(";")[0]!.replace(/^"/, "");
    expect(firstCell.startsWith("=")).toBe(false);
  });
});
