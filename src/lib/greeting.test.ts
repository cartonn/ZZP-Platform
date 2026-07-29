import { describe, expect, it } from "vitest";
import { amsterdamHour, dayPartGreeting, firstName, dashboardGreeting } from "@/lib/greeting";

describe("greeting", () => {
  it("dayPartGreeting verdeelt de dag in ochtend/middag/avond", () => {
    expect(dayPartGreeting(6)).toBe("Goedemorgen");
    expect(dayPartGreeting(11)).toBe("Goedemorgen");
    expect(dayPartGreeting(12)).toBe("Goedemiddag");
    expect(dayPartGreeting(17)).toBe("Goedemiddag");
    expect(dayPartGreeting(18)).toBe("Goedenavond");
    expect(dayPartGreeting(23)).toBe("Goedenavond");
    // De kleine uurtjes zijn avond, geen ochtend (nachtdienst-realiteit in de zorg).
    expect(dayPartGreeting(3)).toBe("Goedenavond");
  });

  it("amsterdamHour rekent UTC om naar Europe/Amsterdam (zomer- én wintertijd)", () => {
    // 29 juli = zomertijd (UTC+2): 22:30 UTC → 0:30 in Amsterdam.
    expect(amsterdamHour(new Date("2026-07-29T22:30:00Z"))).toBe(0);
    // 15 januari = wintertijd (UTC+1): 08:00 UTC → 9 uur in Amsterdam.
    expect(amsterdamHour(new Date("2026-01-15T08:00:00Z"))).toBe(9);
  });

  it("firstName pakt de voornaam en is veilig voor lege invoer", () => {
    expect(firstName("Sanne de Vries")).toBe("Sanne");
    expect(firstName("  Sanne  ")).toBe("Sanne");
    expect(firstName("")).toBeNull();
    expect(firstName("   ")).toBeNull();
    expect(firstName(null)).toBeNull();
    expect(firstName(undefined)).toBeNull();
  });

  it("dashboardGreeting bouwt de kop of valt terug op de kale naam", () => {
    expect(dashboardGreeting("Goedemorgen", "Sanne de Vries", "Werkruimte")).toBe(
      "Goedemorgen, Sanne",
    );
    expect(dashboardGreeting("Good evening", "Mark Jansen", "Werkruimte")).toBe(
      "Good evening, Mark",
    );
    expect(dashboardGreeting("Goedemiddag", null, "Werkruimte")).toBe("Werkruimte");
  });
});
