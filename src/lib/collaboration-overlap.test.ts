import { describe, it, expect } from "vitest";
import { findCollaborationOverlaps, type OverlapPlacementInput } from "@/lib/collaboration-overlap";

const NOW = new Date("2026-06-01T00:00:00.000Z");

function placement(
  id: string,
  start: string | null,
  end: string | null,
  extra?: Partial<OverlapPlacementInput>,
): OverlapPlacementInput {
  return {
    id,
    jobTitle: `Opdracht ${id}`,
    clientName: `Klant ${id}`,
    startDate: start === null ? null : new Date(start),
    endDate: end === null ? null : new Date(end),
    ...extra,
  };
}

describe("findCollaborationOverlaps", () => {
  it("geeft niets terug zonder samenwerkingen of bij één", () => {
    expect(findCollaborationOverlaps([], NOW)).toEqual([]);
    expect(findCollaborationOverlaps([placement("a", "2026-06-10", "2026-06-20")], NOW)).toEqual(
      [],
    );
  });

  it("detecteert een overlap tussen twee lopende samenwerkingen", () => {
    const result = findCollaborationOverlaps(
      [placement("a", "2026-06-10", "2026-06-20"), placement("b", "2026-06-15", "2026-06-25")],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ aId: "a", bId: "b" });
    expect(result[0]!.overlapStart).toEqual(new Date("2026-06-15"));
    expect(result[0]!.overlapEnd).toEqual(new Date("2026-06-20"));
  });

  it("meldt niets bij aansluitende maar niet-overlappende periodes", () => {
    const result = findCollaborationOverlaps(
      [placement("a", "2026-06-10", "2026-06-14"), placement("b", "2026-06-15", "2026-06-25")],
      NOW,
    );
    expect(result).toEqual([]);
  });

  it("behandelt raakvlak (gelijke grens) als inclusieve overlap", () => {
    const result = findCollaborationOverlaps(
      [placement("a", "2026-06-10", "2026-06-15"), placement("b", "2026-06-15", "2026-06-25")],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.overlapStart).toEqual(new Date("2026-06-15"));
    expect(result[0]!.overlapEnd).toEqual(new Date("2026-06-15"));
  });

  it("negeert een samenwerking zonder startdatum (geen vals alarm)", () => {
    const result = findCollaborationOverlaps(
      [placement("a", null, "2026-06-20"), placement("b", "2026-06-15", "2026-06-25")],
      NOW,
    );
    expect(result).toEqual([]);
  });

  it("laat een open einde doorlopen en overlappen", () => {
    const result = findCollaborationOverlaps(
      [placement("a", "2026-06-10", null), placement("b", "2026-09-01", "2026-09-30")],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.overlapStart).toEqual(new Date("2026-09-01"));
    expect(result[0]!.overlapEnd).toEqual(new Date("2026-09-30"));
  });

  it("slaat een botsing over die volledig in het verleden ligt", () => {
    const result = findCollaborationOverlaps(
      [placement("a", "2026-04-01", "2026-04-20"), placement("b", "2026-04-10", "2026-04-25")],
      NOW,
    );
    expect(result).toEqual([]);
  });

  it("meldt een overlap die nu nog loopt ook al begon die in het verleden", () => {
    const result = findCollaborationOverlaps(
      [placement("a", "2026-05-01", "2026-06-10"), placement("b", "2026-05-15", "2026-06-30")],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.overlapEnd).toEqual(new Date("2026-06-10"));
  });

  it("levert per uniek paar precies één conflict en sorteert op overlapStart", () => {
    const result = findCollaborationOverlaps(
      [
        placement("a", "2026-07-10", "2026-07-20"),
        placement("b", "2026-06-10", "2026-06-20"),
        placement("c", "2026-06-15", "2026-07-15"),
      ],
      NOW,
    );
    // c overlapt zowel b (juni) als a (juli); b en a overlappen niet onderling.
    expect(result).toHaveLength(2);
    // Gesorteerd op overlapStart: eerst het juni-paar (b×c), dan het juli-paar (a×c).
    expect(result[0]!.overlapStart).toEqual(new Date("2026-06-15"));
    expect(result[1]!.overlapStart).toEqual(new Date("2026-07-10"));
  });

  it("is deterministisch bij gelijke overlapStart via de gecombineerde ids", () => {
    const result = findCollaborationOverlaps(
      [
        placement("z", "2026-06-10", "2026-06-20"),
        placement("a", "2026-06-10", "2026-06-20"),
        placement("m", "2026-06-10", "2026-06-20"),
      ],
      NOW,
    );
    // Drie identieke periodes → 3 paren, allemaal dezelfde overlapStart.
    expect(result).toHaveLength(3);
    const keys = result.map((r) => `${r.aId}-${r.bId}`);
    expect(keys).toEqual([...keys].sort((x, y) => x.localeCompare(y)));
  });
});
