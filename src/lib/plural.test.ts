import { describe, expect, it } from "vitest";
import { plural, pluralWord } from "@/lib/plural";

describe("plural", () => {
  it("kiest enkelvoud bij 1, meervoud anders", () => {
    expect(plural(1, "reactie", "reacties")).toBe("1 reactie");
    expect(plural(3, "reactie", "reacties")).toBe("3 reacties");
    expect(plural(0, "reactie", "reacties")).toBe("0 reacties");
  });

  it("werkt voor onregelmatige meervouden", () => {
    expect(plural(1, "concept-opdracht", "concept-opdrachten")).toBe("1 concept-opdracht");
    expect(plural(2, "factuur", "facturen")).toBe("2 facturen");
  });

  it("pluralWord geeft alleen het woord", () => {
    expect(pluralWord(1, "samenwerking", "samenwerkingen")).toBe("samenwerking");
    expect(pluralWord(4, "samenwerking", "samenwerkingen")).toBe("samenwerkingen");
  });
});
