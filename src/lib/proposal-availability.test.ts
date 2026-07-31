import { describe, expect, it } from "vitest";
import {
  isIsoDate,
  proposalDateConflicts,
  type UnavailableWindow,
} from "@/lib/proposal-availability";

const win = (startISO: string, endISO: string): UnavailableWindow => ({
  startISO,
  endISO,
  startLabel: startISO,
  endLabel: endISO,
});

describe("isIsoDate", () => {
  it("accepteert yyyy-mm-dd", () => {
    expect(isIsoDate("2026-08-15")).toBe(true);
  });

  it("weigert lege, ongeldige of verkeerd-geformatteerde waarden", () => {
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate(null)).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
    expect(isIsoDate("15-08-2026")).toBe(false);
    expect(isIsoDate("2026/08/15")).toBe(false);
  });
});

describe("proposalDateConflicts", () => {
  const windows = [win("2026-08-15", "2026-08-20"), win("2026-09-01", "2026-09-05")];

  it("geeft geen conflict zonder (geldige) startdatum", () => {
    expect(proposalDateConflicts("", "2026-08-18", windows)).toEqual([]);
    expect(proposalDateConflicts("onzin", "2026-08-18", windows)).toEqual([]);
  });

  it("detecteert een periode die volledig binnen een onbeschikbaar venster valt", () => {
    const hit = proposalDateConflicts("2026-08-16", "2026-08-18", windows);
    expect(hit).toHaveLength(1);
    expect(hit[0]?.startISO).toBe("2026-08-15");
  });

  it("detecteert een periode die het venster deels overlapt (start ervoor, eind erin)", () => {
    // Start vóór het venster, eindigt erin → de startdatum-only-check zou dit missen.
    const hit = proposalDateConflicts("2026-08-10", "2026-08-16", windows);
    expect(hit).toHaveLength(1);
    expect(hit[0]?.startISO).toBe("2026-08-15");
  });

  it("detecteert een periode die het venster volledig omvat", () => {
    const hit = proposalDateConflicts("2026-08-01", "2026-08-31", windows);
    expect(hit).toHaveLength(1);
    expect(hit[0]?.startISO).toBe("2026-08-15");
  });

  it("telt de inclusieve randen mee (raakvlak op de laatste dag)", () => {
    const hit = proposalDateConflicts("2026-08-20", "2026-08-25", windows);
    expect(hit).toHaveLength(1);
  });

  it("geeft geen conflict wanneer de periode net na het venster ligt", () => {
    expect(proposalDateConflicts("2026-08-21", "2026-08-25", windows)).toEqual([]);
  });

  it("behandelt een leeg einde als één dag op de startdatum", () => {
    expect(proposalDateConflicts("2026-08-16", "", windows)).toHaveLength(1);
    expect(proposalDateConflicts("2026-08-25", "", windows)).toEqual([]);
  });

  it("valt bij een omgekeerde (ongeldige) range terug op de startdatum", () => {
    // endISO < startISO: server-Zod keurt dit af; het signaal toetst dan alleen de startdatum.
    expect(proposalDateConflicts("2026-08-16", "2026-08-10", windows)).toHaveLength(1);
    expect(proposalDateConflicts("2026-08-25", "2026-08-10", windows)).toEqual([]);
  });

  it("geeft meerdere overlappende vensters gesorteerd op startISO terug", () => {
    const hit = proposalDateConflicts("2026-08-16", "2026-09-03", windows);
    expect(hit.map((w) => w.startISO)).toEqual(["2026-08-15", "2026-09-01"]);
  });

  it("negeert vensters met een ongeldig datumformaat", () => {
    const bad = [win("kapot", "2026-08-20"), win("2026-08-15", "ook-kapot")];
    expect(proposalDateConflicts("2026-08-16", "2026-08-18", bad)).toEqual([]);
  });

  it("muteert de invoer niet", () => {
    const input = [win("2026-09-01", "2026-09-05"), win("2026-08-15", "2026-08-20")];
    const snapshot = [...input];
    proposalDateConflicts("2026-08-16", "2026-09-03", input);
    expect(input).toEqual(snapshot);
  });
});
