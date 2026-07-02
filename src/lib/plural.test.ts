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

  it("plural bevat al het telwoord — een count-prefix zou dubbel tellen", () => {
    // Regressie: `${n} ${plural(n, ...)}` gaf UI als "3 3 aanvragen".
    // plural() bevat het getal zelf, dus de aanroeper mag het niet nogmaals plakken.
    expect(plural(3, "aanvraag", "aanvragen")).toBe("3 aanvragen");
    expect(plural(13, "samenwerking", "samenwerkingen")).toBe("13 samenwerkingen");
    // Voor een "0/3 lessen"-teller hoort pluralWord (zonder getal), niet plural.
    expect(`0/3 ${pluralWord(3, "les", "lessen")}`).toBe("0/3 lessen");
    expect(`0/3 ${plural(3, "les", "lessen")}`).not.toBe("0/3 lessen");
  });
});
