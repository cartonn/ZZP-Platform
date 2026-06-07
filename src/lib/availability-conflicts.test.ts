import { describe, expect, it } from "vitest";
import {
  detectAvailabilityConflicts,
  type ConflictCollaborationInput,
  type ConflictWindowInput,
} from "@/lib/availability-conflicts";

const d = (s: string) => new Date(s);

// Vaste referentiedatum voor alle tests — deterministisch.
const NOW = d("2026-06-07T00:00:00Z");

// Hulpfuncties om beknopte testdata aan te maken.
const makeWindow = (
  id: string,
  startDate: Date,
  endDate: Date,
  type: ConflictWindowInput["type"],
): ConflictWindowInput => ({ id, startDate, endDate, type });

const makeCollab = (
  id: string,
  startDate: Date | null,
  endDate: Date | null,
  jobTitle = "Testfunctie",
  clientName = "Testopdrachtgever",
): ConflictCollaborationInput => ({ id, startDate, endDate, jobTitle, clientName });

describe("detectAvailabilityConflicts", () => {
  // 1. UNAVAILABLE-venster overlapt een actieve samenwerking met expliciete start+eind.
  it("geeft één conflict met correcte overlapStart/overlapEnd bij overlappend UNAVAILABLE-venster", () => {
    const windows = [
      makeWindow("w1", d("2026-07-01T00:00:00Z"), d("2026-07-31T00:00:00Z"), "UNAVAILABLE"),
    ];
    const collabs = [makeCollab("c1", d("2026-06-15T00:00:00Z"), d("2026-08-15T00:00:00Z"))];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    expect(result).toHaveLength(1);
    expect(result[0]!.collaborationId).toBe("c1");
    expect(result[0]!.windowId).toBe("w1");
    expect(result[0]!.windowType).toBe("UNAVAILABLE");
    expect(result[0]!.overlapStart).toEqual(d("2026-07-01T00:00:00Z"));
    expect(result[0]!.overlapEnd).toEqual(d("2026-07-31T00:00:00Z"));
  });

  // 2. AVAILABLE en LIMITED over dezelfde periode → geen conflict.
  it("geeft geen conflict voor AVAILABLE en LIMITED vensters", () => {
    const windows = [
      makeWindow("w-av", d("2026-07-01T00:00:00Z"), d("2026-07-31T00:00:00Z"), "AVAILABLE"),
      makeWindow("w-lim", d("2026-07-01T00:00:00Z"), d("2026-07-31T00:00:00Z"), "LIMITED"),
    ];
    const collabs = [makeCollab("c1", d("2026-06-15T00:00:00Z"), d("2026-08-15T00:00:00Z"))];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    expect(result).toHaveLength(0);
  });

  // 3. Venster volledig in het verleden → geen conflict.
  it("negeert vensters die volledig in het verleden liggen", () => {
    const windows = [
      // eindigt vóór NOW
      makeWindow("w1", d("2026-05-01T00:00:00Z"), d("2026-06-06T23:59:59Z"), "UNAVAILABLE"),
    ];
    const collabs = [makeCollab("c1", d("2026-05-01T00:00:00Z"), d("2026-08-01T00:00:00Z"))];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    expect(result).toHaveLength(0);
  });

  // 4. Samenwerking met endDate: null (open-einde) en een toekomstig UNAVAILABLE-venster.
  it("behandelt open-einde samenwerking (endDate null) als doorlopend — conflict met toekomstig venster", () => {
    const windows = [
      makeWindow("w1", d("2026-08-01T00:00:00Z"), d("2026-08-31T00:00:00Z"), "UNAVAILABLE"),
    ];
    const collabs = [makeCollab("c1", d("2026-06-01T00:00:00Z"), null)];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    expect(result).toHaveLength(1);
    // Overlap is gelijk aan het venster zelf (samenwerking eindigt niet voor het venster).
    expect(result[0]!.overlapStart).toEqual(d("2026-08-01T00:00:00Z"));
    expect(result[0]!.overlapEnd).toEqual(d("2026-08-31T00:00:00Z"));
  });

  // 5. Samenwerking met startDate: null → behandeld als start=now; toekomstig venster overlapt.
  it("behandelt samenwerking zonder startDate als startend op now — toekomstig venster overlapt", () => {
    const windows = [
      makeWindow("w1", d("2026-07-01T00:00:00Z"), d("2026-07-15T00:00:00Z"), "UNAVAILABLE"),
    ];
    const collabs = [makeCollab("c1", null, d("2026-09-01T00:00:00Z"))];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    expect(result).toHaveLength(1);
    expect(result[0]!.overlapStart).toEqual(d("2026-07-01T00:00:00Z"));
    expect(result[0]!.overlapEnd).toEqual(d("2026-07-15T00:00:00Z"));
  });

  // 6. Geen overlap: venster ligt strikt ná het einde van de samenwerking.
  it("geeft geen conflict als het venster strikt ná het einde van de samenwerking valt", () => {
    const windows = [
      makeWindow("w1", d("2026-09-01T00:00:00Z"), d("2026-09-30T00:00:00Z"), "UNAVAILABLE"),
    ];
    const collabs = [makeCollab("c1", d("2026-06-15T00:00:00Z"), d("2026-08-31T23:59:59Z"))];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    expect(result).toHaveLength(0);
  });

  // 7. Meerdere vensters × meerdere samenwerkingen → correct aantal en volgorde op overlapStart.
  it("verwerkt meerdere vensters en samenwerkingen correct en sorteert op overlapStart oplopend", () => {
    const windows = [
      makeWindow("w1", d("2026-09-01T00:00:00Z"), d("2026-09-30T00:00:00Z"), "UNAVAILABLE"),
      makeWindow("w2", d("2026-07-01T00:00:00Z"), d("2026-07-31T00:00:00Z"), "UNAVAILABLE"),
    ];
    const collabs = [
      makeCollab(
        "c1",
        d("2026-06-01T00:00:00Z"),
        d("2026-10-01T00:00:00Z"),
        "Opdracht A",
        "Klant A",
      ),
      makeCollab(
        "c2",
        d("2026-08-15T00:00:00Z"),
        d("2026-10-01T00:00:00Z"),
        "Opdracht B",
        "Klant B",
      ),
    ];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    // w2 × c1, w1 × c1, w1 × c2 → 3 conflicten.
    expect(result).toHaveLength(3);

    // Verwachte volgorde op overlapStart: jul (w2×c1), sep (w1×c1), sep (w1×c2 — later collabId).
    expect(result[0]!.windowId).toBe("w2");
    expect(result[0]!.collaborationId).toBe("c1");
    expect(result[0]!.overlapStart).toEqual(d("2026-07-01T00:00:00Z"));

    expect(result[1]!.windowId).toBe("w1");
    expect(result[1]!.collaborationId).toBe("c1");
    expect(result[1]!.overlapStart).toEqual(d("2026-09-01T00:00:00Z"));

    expect(result[2]!.windowId).toBe("w1");
    expect(result[2]!.collaborationId).toBe("c2");
    expect(result[2]!.overlapStart).toEqual(d("2026-09-01T00:00:00Z"));
  });

  // 8. Overlap die volledig in het verleden ligt (overlapEnd < now) → niet opgenomen.
  it("sluit overlap over als die volledig voor now valt, ook al overlapt het bereik", () => {
    // now = 2026-08-01T00:00:00Z, zodat de overlap al voorbij is
    const laterNow = d("2026-08-01T00:00:00Z");
    const windows = [
      // Venster eindigt na laterNow (mag niet gefilterd worden als "volledig verleden").
      makeWindow("w1", d("2026-07-01T00:00:00Z"), d("2026-08-15T00:00:00Z"), "UNAVAILABLE"),
    ];
    const collabs = [
      // Samenwerking eindigt vóór laterNow → overlap eindigt op 2026-07-31 < 2026-08-01
      makeCollab("c1", d("2026-06-01T00:00:00Z"), d("2026-07-31T00:00:00Z")),
    ];

    const result = detectAvailabilityConflicts(windows, collabs, laterNow);

    // overlapEnd = min(2026-07-31, 2026-08-15) = 2026-07-31 < laterNow → geen conflict.
    expect(result).toHaveLength(0);
  });

  // Extra: windowStart/windowEnd worden correct doorgegeven in het conflict-object.
  it("bevat de juiste windowStart en windowEnd van het venster zelf (niet de overlap)", () => {
    const windows = [
      makeWindow("w1", d("2026-07-01T00:00:00Z"), d("2026-07-31T00:00:00Z"), "UNAVAILABLE"),
    ];
    const collabs = [
      // Samenwerking die maar gedeeltelijk overlapt.
      makeCollab("c1", d("2026-07-10T00:00:00Z"), d("2026-08-31T00:00:00Z")),
    ];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    expect(result).toHaveLength(1);
    expect(result[0]!.windowStart).toEqual(d("2026-07-01T00:00:00Z"));
    expect(result[0]!.windowEnd).toEqual(d("2026-07-31T00:00:00Z"));
    expect(result[0]!.overlapStart).toEqual(d("2026-07-10T00:00:00Z"));
    expect(result[0]!.overlapEnd).toEqual(d("2026-07-31T00:00:00Z"));
  });

  // Extra: ties in overlapStart worden op collaborationId gesorteerd (determinisme).
  it("sorteert ties in overlapStart op collaborationId oplopend", () => {
    const windows = [
      makeWindow("w1", d("2026-07-01T00:00:00Z"), d("2026-07-31T00:00:00Z"), "UNAVAILABLE"),
    ];
    const collabs = [
      makeCollab("c-beta", d("2026-06-15T00:00:00Z"), d("2026-08-15T00:00:00Z")),
      makeCollab("c-alpha", d("2026-06-15T00:00:00Z"), d("2026-08-15T00:00:00Z")),
    ];

    const result = detectAvailabilityConflicts(windows, collabs, NOW);

    expect(result).toHaveLength(2);
    expect(result[0]!.collaborationId).toBe("c-alpha");
    expect(result[1]!.collaborationId).toBe("c-beta");
  });
});
