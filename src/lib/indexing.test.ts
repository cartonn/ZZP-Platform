import { describe, expect, it } from "vitest";
import {
  NOINDEX_DIRECTIVE,
  buildRobotsRules,
  isIndexingAllowed,
  robotsHeaderValue,
} from "@/lib/indexing";

describe("isIndexingAllowed", () => {
  it("alleen de expliciete opt-in 'true' zet indexering aan", () => {
    expect(isIndexingAllowed("true")).toBe(true);
  });
  it("valt veilig terug op afgeschermd bij elke andere waarde", () => {
    expect(isIndexingAllowed(undefined)).toBe(false);
    expect(isIndexingAllowed("")).toBe(false);
    expect(isIndexingAllowed("false")).toBe(false);
    expect(isIndexingAllowed("TRUE")).toBe(false); // hoofdlettergevoelig: geen per-ongeluk-open
    expect(isIndexingAllowed("1")).toBe(false);
    expect(isIndexingAllowed("yes")).toBe(false);
  });
});

describe("robotsHeaderValue", () => {
  it("geeft de noindex-directive tijdens de besloten fase (default)", () => {
    expect(robotsHeaderValue(undefined)).toBe(NOINDEX_DIRECTIVE);
    expect(robotsHeaderValue("false")).toBe("noindex, nofollow");
  });
  it("geeft geen header wanneer indexering is opengezet", () => {
    expect(robotsHeaderValue("true")).toBeNull();
  });
});

describe("buildRobotsRules", () => {
  it("disallowt alles tijdens de besloten fase (default)", () => {
    expect(buildRobotsRules(undefined)).toEqual({ userAgent: "*", disallow: "/" });
    expect(buildRobotsRules("false")).toEqual({ userAgent: "*", disallow: "/" });
  });
  it("staat alles toe wanneer indexering is opengezet", () => {
    expect(buildRobotsRules("true")).toEqual({ userAgent: "*", allow: "/" });
  });
  it("levert nooit tegelijk allow én disallow", () => {
    for (const flag of [undefined, "", "false", "true"]) {
      const rules = buildRobotsRules(flag);
      expect("allow" in rules && "disallow" in rules).toBe(false);
    }
  });
});
