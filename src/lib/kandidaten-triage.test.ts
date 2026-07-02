import { describe, expect, it } from "vitest";
import { firstName, partitionTriage } from "./kandidaten-triage";

describe("partitionTriage", () => {
  it("splitst ACCEPTED af van de nog te beslissen reacties", () => {
    const items = [
      { id: "a", status: "NEW" },
      { id: "b", status: "ACCEPTED" },
      { id: "c", status: "SHORTLIST" },
      { id: "d", status: "ACCEPTED" },
    ];
    const { active, accepted } = partitionTriage(items);
    expect(active.map((i) => i.id)).toEqual(["a", "c"]);
    expect(accepted.map((i) => i.id)).toEqual(["b", "d"]);
  });

  it("behoudt de invoervolgorde binnen elke groep", () => {
    const items = [
      { id: "1", status: "SHORTLIST" },
      { id: "2", status: "VIEWED" },
      { id: "3", status: "NEW" },
    ];
    const { active, accepted } = partitionTriage(items);
    expect(active.map((i) => i.id)).toEqual(["1", "2", "3"]);
    expect(accepted).toHaveLength(0);
  });

  it("behandelt REJECTED en WITHDRAWN als actief (blijven in de triage-lijst)", () => {
    const items = [
      { id: "r", status: "REJECTED" },
      { id: "w", status: "WITHDRAWN" },
      { id: "acc", status: "ACCEPTED" },
    ];
    const { active, accepted } = partitionTriage(items);
    expect(active.map((i) => i.id)).toEqual(["r", "w"]);
    expect(accepted.map((i) => i.id)).toEqual(["acc"]);
  });

  it("muteert de invoer niet", () => {
    const items = [{ id: "a", status: "ACCEPTED" }];
    partitionTriage(items);
    expect(items).toHaveLength(1);
  });
});

describe("firstName", () => {
  it("neemt het eerste woord uit een volledige naam", () => {
    expect(firstName("Sanne de Vries")).toBe("Sanne");
  });

  it("normaliseert dubbele spaties en randspaties", () => {
    expect(firstName("  Jan   Jansen ")).toBe("Jan");
  });

  it("valt terug op de hele waarde bij een lege naam", () => {
    expect(firstName("")).toBe("");
  });
});
