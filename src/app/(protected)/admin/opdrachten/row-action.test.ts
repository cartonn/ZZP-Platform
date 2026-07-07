import { describe, it, expect } from "vitest";
import { adminJobRowAction } from "./row-action";

describe("adminJobRowAction", () => {
  it("concept toont geen Sluiten maar Bekijken", () => {
    // Regressie: eerder toonde elke rij (ook concepten) een prominente one-click "Sluiten".
    expect(adminJobRowAction("DRAFT")).toBe("view");
  });

  it("gepubliceerd toont Sluiten achter een bevestiging", () => {
    expect(adminJobRowAction("PUBLISHED")).toBe("close-confirm");
  });

  it("gesloten toont geen actie", () => {
    expect(adminJobRowAction("CLOSED")).toBe("none");
  });
});
