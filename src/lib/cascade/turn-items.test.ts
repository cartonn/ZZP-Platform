import { describe, expect, it } from "vitest";
import { buildCollaborationTurnItems, type TurnItemsInput } from "@/lib/cascade/turn-items";

const base: TurnItemsInput = {
  status: "ACTIVE",
  frozen: false,
  isClient: false,
  isFreelancer: false,
  placementBlocked: false,
  placementMissing: "",
  submittedPerformances: 0,
  draftInvoices: 0,
  submittedInvoices: 0,
  approvedInvoices: 0,
};

describe("buildCollaborationTurnItems", () => {
  it("PROPOSED: vraagt het contract te tekenen", () => {
    expect(buildCollaborationTurnItems({ ...base, status: "PROPOSED" })).toEqual([
      "Onderteken het contract om de opdracht te starten.",
    ]);
  });

  it("PROPOSED geblokkeerd: vraagt eerst het certificaat aan te vullen", () => {
    const todo = buildCollaborationTurnItems({
      ...base,
      status: "PROPOSED",
      placementBlocked: true,
      placementMissing: "VOG, BIG",
    });
    expect(todo[0]).toContain("VOG, BIG");
    expect(todo[0]).toContain("certificaat");
  });

  // Kern-regressie (DOEL 1b, next-action-correctheid): een geblokkeerde plaatsing kan alleen de
  // ZZP'er oplossen (eigen certificaat aanvullen). De opdrachtgever mag daarom GEEN imperatief krijgen
  // die hij niet kan uitvoeren (wrong-party next-action) — hij ziet een passieve wacht-regel.
  it("PROPOSED geblokkeerd + opdrachtgever: passieve wacht-op-de-ZZP'er-regel, geen imperatief", () => {
    const todo = buildCollaborationTurnItems({
      ...base,
      status: "PROPOSED",
      placementBlocked: true,
      isClient: true,
      isFreelancer: false,
      placementMissing: "VOG",
    });
    expect(todo.some((t) => t.includes("Wacht tot de ZZP'er") && t.includes("aanvult (VOG)"))).toBe(
      true,
    );
    expect(todo.some((t) => t.includes("Vul het ontbrekende"))).toBe(false);
  });

  it("PROPOSED geblokkeerd + ZZP'er: imperatief om het certificaat aan te vullen", () => {
    const todo = buildCollaborationTurnItems({
      ...base,
      status: "PROPOSED",
      placementBlocked: true,
      isFreelancer: true,
      isClient: false,
      placementMissing: "VOG",
    });
    expect(
      todo.some((t) => t.includes("Vul het ontbrekende of verlopen certificaat aan (VOG)")),
    ).toBe(true);
  });

  it("ACTIVE opdrachtgever: ingediende prestatie wacht op goedkeuring", () => {
    const todo = buildCollaborationTurnItems({
      ...base,
      isClient: true,
      submittedPerformances: 1,
    });
    expect(todo).toEqual(["1 ingediende prestatie wacht op je goedkeuring."]);
  });

  it("ACTIVE ZZP'er: concept-factuur klaar + goedgekeurde factuur markeren", () => {
    const todo = buildCollaborationTurnItems({
      ...base,
      isFreelancer: true,
      draftInvoices: 2,
      approvedInvoices: 1,
    });
    expect(todo.some((t) => t.includes("concept-facturen"))).toBe(true);
    expect(todo.some((t) => t.includes("goedgekeurde factuur"))).toBe(true);
  });

  // Kern-regressie (persona-sweep): bij een open dispuut (frozen) is de cascade bevroren — de
  // "Aan zet"-banner mag GEEN cascade-actie tonen, anders spreekt hij de bevroren-kaart + status-regel
  // op hetzelfde scherm tegen (DOEL 1b) terwijl de echte knop verborgen is.
  it("BEVROREN (dispuut open): toont geen enkele cascade-actie", () => {
    const todo = buildCollaborationTurnItems({
      ...base,
      frozen: true,
      isClient: true,
      submittedPerformances: 3,
      submittedInvoices: 2,
    });
    expect(todo).toEqual([]);
  });

  it("BEVROREN + ZZP'er: ook concept-/goedgekeurde-factuur-nudges vallen weg", () => {
    const todo = buildCollaborationTurnItems({
      ...base,
      frozen: true,
      isFreelancer: true,
      draftInvoices: 1,
      approvedInvoices: 1,
    });
    expect(todo).toEqual([]);
  });

  it("rol-scheiding: opdrachtgever krijgt geen ZZP'er-facturatietaken en omgekeerd", () => {
    const asClient = buildCollaborationTurnItems({
      ...base,
      isClient: true,
      draftInvoices: 1,
      approvedInvoices: 1,
      submittedInvoices: 1,
    });
    // Opdrachtgever ziet alleen de te-keuren factuur, niet de ZZP-zijdige concept/goedgekeurd.
    expect(asClient).toEqual(["1 factuur wacht op je goedkeuring."]);
  });

  it("niet-ACTIVE/niet-PROPOSED (COMPLETED): niets te doen", () => {
    expect(
      buildCollaborationTurnItems({
        ...base,
        status: "COMPLETED",
        isClient: true,
        submittedPerformances: 1,
      }),
    ).toEqual([]);
  });
});
