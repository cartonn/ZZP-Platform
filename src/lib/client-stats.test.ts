import { describe, expect, it } from "vitest";
import { fillRateHint } from "@/lib/client-stats";

describe("fillRateHint", () => {
  it("beschrijft hoeveel opdrachten een plaatsing hebben", () => {
    expect(fillRateHint(3, 14)).toBe("3 van je 14 opdrachten heeft een plaatsing");
  });

  it("gebruikt enkelvoud bij één opdracht", () => {
    expect(fillRateHint(0, 1)).toBe("0 van je 1 opdracht heeft een plaatsing");
  });

  it("nodigt uit om te plaatsen wanneer er geen opdrachten zijn", () => {
    expect(fillRateHint(0, 0)).toBe("Nog geen opdrachten geplaatst");
  });
});
