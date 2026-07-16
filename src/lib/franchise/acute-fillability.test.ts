import { describe, expect, it } from "vitest";
import {
  acuteFillabilityHeadline,
  summarizeAcuteFillability,
  type AcuteFillabilityItem,
} from "./acute-fillability";

const item = (readyMatches: number): AcuteFillabilityItem => ({ readyMatches });

describe("summarizeAcuteFillability", () => {
  it("lege input → alle tellers 0", () => {
    expect(summarizeAcuteFillability([])).toEqual({
      total: 0,
      fillableNow: 0,
      needsRecruiting: 0,
    });
  });

  it("telt ≥1 readyMatch als vulbaar, 0 als werving", () => {
    expect(summarizeAcuteFillability([item(0), item(2), item(1), item(0)])).toEqual({
      total: 4,
      fillableNow: 2,
      needsRecruiting: 2,
    });
  });

  it("alles vulbaar", () => {
    expect(summarizeAcuteFillability([item(3), item(1)])).toEqual({
      total: 2,
      fillableNow: 2,
      needsRecruiting: 0,
    });
  });

  it("niets vulbaar", () => {
    expect(summarizeAcuteFillability([item(0), item(0)])).toEqual({
      total: 2,
      fillableNow: 0,
      needsRecruiting: 2,
    });
  });

  it("negatieve/ontbrekende readyMatches → niet vulbaar (defensief)", () => {
    expect(
      summarizeAcuteFillability([{ readyMatches: -1 }, { readyMatches: undefined as never }]),
    ).toEqual({ total: 2, fillableNow: 0, needsRecruiting: 2 });
  });
});

describe("acuteFillabilityHeadline", () => {
  it("geen acute diensten → null", () => {
    expect(acuteFillabilityHeadline(summarizeAcuteFillability([]))).toBeNull();
  });

  it("één, vulbaar", () => {
    expect(acuteFillabilityHeadline(summarizeAcuteFillability([item(2)]))).toBe(
      "Direct vulbaar uit je roster — voordragen kan nu.",
    );
  });

  it("meerdere, allemaal vulbaar", () => {
    expect(acuteFillabilityHeadline(summarizeAcuteFillability([item(1), item(4)]))).toBe(
      "Alle 2 direct vulbaar uit je roster — voordragen kan nu.",
    );
  });

  it("één, niet vulbaar", () => {
    expect(acuteFillabilityHeadline(summarizeAcuteFillability([item(0)]))).toBe(
      "Niet uit je eigen roster te vullen — werving nodig.",
    );
  });

  it("meerdere, niets vulbaar", () => {
    expect(acuteFillabilityHeadline(summarizeAcuteFillability([item(0), item(0)]))).toBe(
      "Geen van deze 2 is uit je eigen roster te vullen — werving nodig.",
    );
  });

  it("gemengd → aantal per kant, met plural op werving", () => {
    expect(acuteFillabilityHeadline(summarizeAcuteFillability([item(2), item(0), item(0)]))).toBe(
      "1 direct vulbaar uit je roster · 2 diensten vragen werving.",
    );
  });

  it("gemengd met één werving → enkelvoud", () => {
    expect(acuteFillabilityHeadline(summarizeAcuteFillability([item(2), item(3), item(0)]))).toBe(
      "2 direct vulbaar uit je roster · 1 dienst vraagt werving.",
    );
  });
});
