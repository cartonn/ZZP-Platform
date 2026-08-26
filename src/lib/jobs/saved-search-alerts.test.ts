import { describe, it, expect } from "vitest";
import {
  buildSavedSearchAlerts,
  MAX_SAVED_SEARCH_ALERTS,
  type SavedSearchAlert,
} from "@/lib/jobs/saved-search-alerts";

describe("buildSavedSearchAlerts", () => {
  it("slaat rijen zonder count over (onlyEligible → null)", () => {
    const rows = [{ name: "Zonder count", query: "onlyEligible=1" }];
    const counts = new Map([["onlyEligible=1", null]]);
    expect(buildSavedSearchAlerts(rows, counts)).toEqual([]);
  });

  it("slaat rijen zonder verse treffers over (recent === 0)", () => {
    const rows = [{ name: "Geen verse", query: "q=react" }];
    const counts = new Map([["q=react", { total: 5, recent: 0 }]]);
    expect(buildSavedSearchAlerts(rows, counts)).toEqual([]);
  });

  it("neemt verse treffers mee met correcte href", () => {
    const rows = [{ name: "Verse", query: "q=react" }];
    const counts = new Map([["q=react", { total: 5, recent: 2 }]]);
    const result = buildSavedSearchAlerts(rows, counts);
    expect(result).toHaveLength(1);
    const alert = result[0] as SavedSearchAlert;
    expect(alert.name).toBe("Verse");
    expect(alert.recent).toBe(2);
    expect(alert.total).toBe(5);
    expect(alert.href.startsWith("/opdrachten")).toBe(true);
    expect(alert.href).toBe("/opdrachten?q=react");
  });

  it("geeft de kale marktplaats-href voor een lege query", () => {
    const rows = [{ name: "Alles", query: "" }];
    const counts = new Map([["", { total: 8, recent: 3 }]]);
    const result = buildSavedSearchAlerts(rows, counts);
    expect(result[0]?.href).toBe("/opdrachten");
  });

  it("sorteert op recent desc, dan total desc, dan naam nl-asc", () => {
    // Raakt alle drie de tie-breakers binnen de cap (4 rijen):
    // - "Beta" heeft het meeste recent → eerst (recent desc).
    // - "Alpha", "Gamma" en "Charlie" delen recent=2; "Alpha" heeft hoger total → vóór de rest.
    // - "Gamma" en "Charlie" delen recent=2 én total=3 → naam-asc: "Charlie" vóór "Gamma".
    const rows = [
      { name: "Gamma", query: "q=gamma" },
      { name: "Beta", query: "q=beta" },
      { name: "Charlie", query: "q=charlie" },
      { name: "Alpha", query: "q=alpha" },
    ];
    const counts = new Map([
      ["q=gamma", { total: 3, recent: 2 }],
      ["q=beta", { total: 4, recent: 5 }],
      ["q=charlie", { total: 3, recent: 2 }],
      ["q=alpha", { total: 9, recent: 2 }],
    ]);
    const result = buildSavedSearchAlerts(rows, counts);
    expect(result.map((a) => a.name)).toEqual(["Beta", "Alpha", "Charlie", "Gamma"]);
  });

  it("capt op MAX_SAVED_SEARCH_ALERTS", () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({
      name: `Zoek ${i}`,
      query: `q=${i}`,
    }));
    const counts = new Map(
      rows.map((r, i) => [r.query, { total: 10 - i, recent: 6 - i }] as const),
    );
    const result = buildSavedSearchAlerts(rows, counts);
    expect(result).toHaveLength(MAX_SAVED_SEARCH_ALERTS);
    expect(MAX_SAVED_SEARCH_ALERTS).toBe(4);
  });

  it("geeft [] voor lege input", () => {
    expect(buildSavedSearchAlerts([], new Map())).toEqual([]);
  });
});
