import { describe, expect, it } from "vitest";
import {
  START_FIT_LABEL,
  START_FIT_SHORT_LABEL,
  START_FIT_VARIANT,
  classifyStartFit,
} from "@/lib/candidate-availability";
import { type WindowLike } from "@/lib/availability";

const d = (s: string) => new Date(s);
const start = d("2026-06-15T00:00:00Z");

const shared: WindowLike[] = [
  { startDate: d("2026-06-01"), endDate: d("2026-06-30"), type: "AVAILABLE" },
  { startDate: d("2026-08-01"), endDate: d("2026-09-01"), type: "LIMITED" },
];

describe("classifyStartFit", () => {
  it("unknown zonder startdatum", () => {
    expect(classifyStartFit(shared, null)).toBe("unknown");
    expect(classifyStartFit(shared, undefined)).toBe("unknown");
  });

  it("unknown als de ZZP'er geen agenda heeft gedeeld", () => {
    expect(classifyStartFit([], start)).toBe("unknown");
  });

  it("available als een inzetbaar venster de startdatum dekt", () => {
    expect(classifyStartFit(shared, start)).toBe("available");
  });

  it("limited als alleen een beperkt venster de startdatum dekt", () => {
    expect(classifyStartFit(shared, d("2026-08-15T00:00:00Z"))).toBe("limited");
  });

  it("blocked als een onbeschikbaar venster de startdatum dekt", () => {
    const withBlock: WindowLike[] = [
      ...shared,
      { startDate: d("2026-06-10"), endDate: d("2026-06-20"), type: "UNAVAILABLE" },
    ];
    expect(classifyStartFit(withBlock, start)).toBe("blocked");
  });

  it("none als er wel een agenda is maar geen venster de startdatum dekt", () => {
    expect(classifyStartFit(shared, d("2026-07-15T00:00:00Z"))).toBe("none");
  });

  it("dekt de startdatum inclusief de laatste dag van het venster", () => {
    const upToStart: WindowLike[] = [
      { startDate: d("2026-06-01"), endDate: d("2026-06-15"), type: "AVAILABLE" },
    ];
    expect(classifyStartFit(upToStart, start)).toBe("available");
  });
});

describe("label- en variant-maps", () => {
  it("hebben voor elke niet-unknown status een label en variant", () => {
    for (const fit of ["available", "limited", "blocked", "none"] as const) {
      expect(START_FIT_LABEL[fit]).toBeTruthy();
      expect(START_FIT_SHORT_LABEL[fit]).toBeTruthy();
      expect(START_FIT_VARIANT[fit]).toBeTruthy();
    }
  });

  it("available is groen (success), de rest niet", () => {
    expect(START_FIT_VARIANT.available).toBe("success");
    expect(START_FIT_VARIANT.blocked).toBe("danger");
  });
});
