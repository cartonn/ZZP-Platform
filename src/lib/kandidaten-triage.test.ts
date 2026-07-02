import { describe, expect, it } from "vitest";
import { firstName, partitionTriage } from "./kandidaten-triage";

describe("partitionTriage", () => {
  it("verplaatst alleen ACCEPTED-met-samenwerking naar de afgehandelde groep", () => {
    const items = [
      { id: "a", status: "NEW", hasCollaboration: false },
      { id: "b", status: "ACCEPTED", hasCollaboration: true },
      { id: "c", status: "SHORTLIST", hasCollaboration: false },
      { id: "d", status: "ACCEPTED", hasCollaboration: true },
    ];
    const { active, accepted } = partitionTriage(items);
    expect(active.map((i) => i.id)).toEqual(["a", "c"]);
    expect(accepted.map((i) => i.id)).toEqual(["b", "d"]);
  });

  it("houdt ACCEPTED-zonder-samenwerking in de actieve lijst (het propose-formulier vraagt nog actie)", () => {
    const items = [
      { id: "acc-open", status: "ACCEPTED", hasCollaboration: false },
      { id: "acc-done", status: "ACCEPTED", hasCollaboration: true },
    ];
    const { active, accepted } = partitionTriage(items);
    expect(active.map((i) => i.id)).toEqual(["acc-open"]);
    expect(accepted.map((i) => i.id)).toEqual(["acc-done"]);
  });

  it("behoudt de invoervolgorde binnen elke groep", () => {
    const items = [
      { id: "1", status: "SHORTLIST", hasCollaboration: false },
      { id: "2", status: "VIEWED", hasCollaboration: false },
      { id: "3", status: "NEW", hasCollaboration: false },
    ];
    const { active, accepted } = partitionTriage(items);
    expect(active.map((i) => i.id)).toEqual(["1", "2", "3"]);
    expect(accepted).toHaveLength(0);
  });

  it("behandelt REJECTED en WITHDRAWN als actief (blijven in de triage-lijst)", () => {
    const items = [
      { id: "r", status: "REJECTED", hasCollaboration: false },
      { id: "w", status: "WITHDRAWN", hasCollaboration: false },
      { id: "acc", status: "ACCEPTED", hasCollaboration: true },
    ];
    const { active, accepted } = partitionTriage(items);
    expect(active.map((i) => i.id)).toEqual(["r", "w"]);
    expect(accepted.map((i) => i.id)).toEqual(["acc"]);
  });

  it("muteert de invoer niet", () => {
    const items = [{ id: "a", status: "ACCEPTED", hasCollaboration: true }];
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
