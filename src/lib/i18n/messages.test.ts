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
    expect(translate("en", "Gepubliceerd")).toBe("Published");
    expect(translate("en", "Gesloten")).toBe("Closed");
    expect(translate("en", "Niet meer beschikbaar")).toBe("No longer available");
  });

  it("valt voor een onbekende brontekst terug op de NL-tekst (nooit leeg)", () => {
    expect(translate("en", "Een nog niet vertaalde zin")).toBe("Een nog niet vertaalde zin");
  });

  it("vertaalt het documentenscherm naar het Engels", () => {
    expect(translate("en", "Document uploaden")).toBe("Upload document");
    expect(translate("en", "Nog geen documenten geüpload")).toBe("No documents uploaded yet");
    expect(translate("en", "gekoppeld aan een credential")).toBe("linked to a credential");
    expect(translate("en", "Document verwijderen?")).toBe("Delete document?");
    expect(translate("en", "Overig")).toBe("Other");
    expect(translate("en", "Geüpload.")).toBe("Uploaded.");
  });

  it("laat het documentenscherm in het Nederlands onveranderd", () => {
    expect(translate("nl", "Document uploaden")).toBe("Document uploaden");
    expect(translate("nl", "Overig")).toBe("Overig");
  });

  it("vertaalt het opdrachtgever-dashboard naar het Engels", () => {
    expect(translate("en", "Vervullingsgraad")).toBe("Fill rate");
    expect(translate("en", "Geplaatste opdrachten")).toBe("Posted assignments");
    expect(translate("en", "Voorgestelde professionals")).toBe("Suggested professionals");
    expect(translate("en", "Compliance-zegel")).toBe("Compliance seal");
    expect(translate("en", "Geen lopende diensten")).toBe("No active shifts");
    expect(translate("en", "diensten in orde")).toBe("shifts compliant");
    expect(translate("en", "In beoordeling")).toBe("In review");
  });

  it("laat het opdrachtgever-dashboard in het Nederlands onveranderd", () => {
    expect(translate("nl", "Vervullingsgraad")).toBe("Vervullingsgraad");
    expect(translate("nl", "Compliance-zegel")).toBe("Compliance-zegel");
  });

  it("vertaalt de notificatie-strings + categorielabels", () => {
    expect(translate("en", "Alles als gelezen markeren")).toBe("Mark all as read");
    expect(translate("en", "Geen notificaties")).toBe("No notifications");
    expect(translate("en", "Alleen ongelezen")).toBe("Unread only");
    expect(translate("en", "Werkproces")).toBe("Workflow");
    expect(translate("en", "Betalingen")).toBe("Payments");
    expect(translate("en", "zojuist")).toBe("just now");
    // NL blijft onveranderd (geen regressie in de standaardtaal)
    expect(translate("nl", "Werkproces")).toBe("Werkproces");
  });
});
