import { describe, expect, it } from "vitest";
import { translate } from "./messages";

describe("translate", () => {
  it("geeft de NL-brontekst onveranderd terug bij locale 'nl'", () => {
    expect(translate("nl", "Dashboard")).toBe("Dashboard");
    expect(translate("nl", "Opdrachten")).toBe("Opdrachten");
    expect(translate("nl", "Wat-dan-ook")).toBe("Wat-dan-ook");
  });

  it("vertaalt bekende bronteksten naar het Engels", () => {
    expect(translate("en", "Opdrachten")).toBe("Assignments");
    expect(translate("en", "Rooster")).toBe("Schedule");
    expect(translate("en", "Opgeslagen")).toBe("Saved");
    expect(translate("en", "ZZP'er")).toBe("Freelancer");
  });

  it("valt voor een onbekende brontekst terug op de NL-tekst (nooit leeg)", () => {
    expect(translate("en", "Een nog niet vertaalde zin")).toBe("Een nog niet vertaalde zin");
  });
});
