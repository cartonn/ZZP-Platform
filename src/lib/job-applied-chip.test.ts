import { describe, expect, it } from "vitest";

import { appliedJobChip, appliedJobChipFor, pickApplicationStatus } from "./job-applied-chip";

describe("pickApplicationStatus", () => {
  it("geeft null bij geen reacties", () => {
    expect(pickApplicationStatus([])).toBeNull();
  });

  it("negeert WITHDRAWN volledig", () => {
    expect(pickApplicationStatus(["WITHDRAWN"])).toBeNull();
    expect(pickApplicationStatus(["WITHDRAWN", "WITHDRAWN"])).toBeNull();
  });

  it("kiest de enige meetellende status", () => {
    expect(pickApplicationStatus(["NEW"])).toBe("NEW");
    expect(pickApplicationStatus(["REJECTED"])).toBe("REJECTED");
  });

  it("kiest de verst gevorderde/positieve status bij meerdere reacties", () => {
    // Een levende SHORTLIST wint van een oude afwijzing, ongeacht volgorde.
    expect(pickApplicationStatus(["REJECTED", "SHORTLIST"])).toBe("SHORTLIST");
    expect(pickApplicationStatus(["SHORTLIST", "REJECTED"])).toBe("SHORTLIST");
    // ACCEPTED is het sterkst.
    expect(pickApplicationStatus(["VIEWED", "ACCEPTED", "REJECTED"])).toBe("ACCEPTED");
    // NEW wint van REJECTED, VIEWED wint van NEW.
    expect(pickApplicationStatus(["REJECTED", "NEW"])).toBe("NEW");
    expect(pickApplicationStatus(["NEW", "VIEWED"])).toBe("VIEWED");
  });

  it("negeert WITHDRAWN maar houdt de meetellende status", () => {
    expect(pickApplicationStatus(["WITHDRAWN", "NEW"])).toBe("NEW");
  });
});

describe("appliedJobChip", () => {
  it("mapt elke meetellende status naar label + toon", () => {
    expect(appliedJobChip("NEW")).toEqual({ label: "Gereageerd", tone: "info" });
    expect(appliedJobChip("VIEWED")).toEqual({ label: "Gereageerd · bekeken", tone: "info" });
    expect(appliedJobChip("SHORTLIST")).toEqual({ label: "Op shortlist", tone: "positive" });
    expect(appliedJobChip("ACCEPTED")).toEqual({ label: "Geaccepteerd", tone: "success" });
    expect(appliedJobChip("REJECTED")).toEqual({ label: "Afgewezen", tone: "muted" });
  });

  it("geeft null voor WITHDRAWN (ingetrokken = geen chip)", () => {
    expect(appliedJobChip("WITHDRAWN")).toBeNull();
  });
});

describe("appliedJobChipFor", () => {
  it("geeft null zonder meetellende reactie", () => {
    expect(appliedJobChipFor([])).toBeNull();
    expect(appliedJobChipFor(["WITHDRAWN"])).toBeNull();
  });

  it("levert de chip van de meest relevante status", () => {
    expect(appliedJobChipFor(["NEW"])).toEqual({ label: "Gereageerd", tone: "info" });
    expect(appliedJobChipFor(["REJECTED", "ACCEPTED"])).toEqual({
      label: "Geaccepteerd",
      tone: "success",
    });
  });
});
