import { describe, expect, it } from "vitest";
import { avatarAccent } from "./avatar-accent";

describe("avatarAccent", () => {
  it("is deterministisch: hetzelfde zaad geeft dezelfde kleur", () => {
    expect(avatarAccent("Sanne de Vries")).toBe(avatarAccent("Sanne de Vries"));
  });

  it("geeft een geldige palet-klasse terug (bg-… text-…)", () => {
    for (const seed of ["Iris Hendriks", "Mark Jansen", "", null, undefined]) {
      const cls = avatarAccent(seed);
      expect(cls).toMatch(/^bg-\S+ text-\S+$/);
    }
  });

  it("verdeelt verschillende namen over meerdere kleuren (niet allemaal dezelfde)", () => {
    const names = [
      "Iris Hendriks",
      "Mark Jansen",
      "Sanne de Vries",
      "Fatima El Amrani",
      "Lars Bakker",
      "Sofia Janssen",
      "Lisa Smit",
      "Rik Plomp",
    ];
    const unique = new Set(names.map(avatarAccent));
    expect(unique.size).toBeGreaterThan(1);
  });

  it("valt voor een leeg zaad terug op een vaste kleur", () => {
    expect(avatarAccent("")).toBe(avatarAccent(null));
  });
});
