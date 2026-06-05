import { describe, expect, it } from "vitest";
import {
  canonicalizeWeekdays,
  parseWeekdays,
  serializeWeekdays,
  formatWeekdays,
} from "@/lib/weekdays";

describe("canonicalizeWeekdays", () => {
  it("sorteert naar ISO-volgorde (maandag eerst) en ontdubbelt", () => {
    expect(canonicalizeWeekdays(["FRI", "MON", "WED", "MON"])).toEqual(["MON", "WED", "FRI"]);
  });
  it("lege invoer → lege lijst", () => {
    expect(canonicalizeWeekdays([])).toEqual([]);
  });
});

describe("parseWeekdays", () => {
  it("parseert een geldige JSON-array, canoniek geordend", () => {
    expect(parseWeekdays('["FRI","MON","WED"]')).toEqual(["MON", "WED", "FRI"]);
  });
  it("null/undefined/lege string → lege lijst", () => {
    expect(parseWeekdays(null)).toEqual([]);
    expect(parseWeekdays(undefined)).toEqual([]);
    expect(parseWeekdays("")).toEqual([]);
  });
  it("ongeldige JSON of niet-array → lege lijst (geen throw)", () => {
    expect(parseWeekdays("{niet json")).toEqual([]);
    expect(parseWeekdays('{"MON":true}')).toEqual([]);
  });
  it("filtert onbekende codes weg en ontdubbelt", () => {
    expect(parseWeekdays('["MON","XYZ","mon","MON","SUN"]')).toEqual(["MON", "SUN"]);
  });
});

describe("serializeWeekdays", () => {
  it("schrijft een canoniek geordende JSON-array", () => {
    expect(serializeWeekdays(["FRI", "MON"])).toBe('["MON","FRI"]');
  });
  it("lege lijst → null (= niet vastgelegd)", () => {
    expect(serializeWeekdays([])).toBeNull();
  });
  it("roundtrip parse∘serialize is stabiel", () => {
    const days = parseWeekdays(serializeWeekdays(["SUN", "TUE", "TUE", "MON"]));
    expect(days).toEqual(["MON", "TUE", "SUN"]);
  });
});

describe("formatWeekdays", () => {
  it("toont korte NL-labels in volgorde", () => {
    expect(formatWeekdays(["WED", "MON", "FRI"])).toBe("ma, wo, vr");
  });
  it("lege lijst → lege string", () => {
    expect(formatWeekdays([])).toBe("");
  });
});
