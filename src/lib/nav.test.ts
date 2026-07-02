import { describe, expect, it } from "vitest";
import { groupNavItems, navForRole, type NavItem } from "./nav";

const item = (label: string, section?: string): NavItem => ({
  label,
  href: `/${label.toLowerCase()}`,
  icon: "dashboard",
  section,
  enabled: true,
});

describe("groupNavItems", () => {
  it("lege lijst → geen groepen", () => {
    expect(groupNavItems([])).toEqual([]);
  });

  it("bundelt opeenvolgende items met dezelfde sectie onder één kop", () => {
    const groups = groupNavItems([item("A", "Werk"), item("B", "Werk"), item("C", "Dossier")]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.section).toBe("Werk");
    expect(groups[0]!.items.map((i) => i.label)).toEqual(["A", "B"]);
    expect(groups[1]!.section).toBe("Dossier");
    expect(groups[1]!.items.map((i) => i.label)).toEqual(["C"]);
  });

  it("behoudt de bronvolgorde en splitst een sectie die later terugkeert", () => {
    const groups = groupNavItems([item("A", "Werk"), item("B", "Zakelijk"), item("C", "Werk")]);
    // Herhaalde sectie na een andere sectie start een nieuwe groep (volgorde is leidend).
    expect(groups.map((g) => g.section)).toEqual(["Werk", "Zakelijk", "Werk"]);
  });

  it("een item zonder sectie krijgt een lege kop (geen koptekst bij render)", () => {
    const groups = groupNavItems([item("A"), item("B", "Werk")]);
    expect(groups[0]!.section).toBe("");
    expect(groups[0]!.items.map((i) => i.label)).toEqual(["A"]);
    expect(groups[1]!.section).toBe("Werk");
  });

  it("elk nav-item van elke rol heeft een sectie (geen naamloze rail meer)", () => {
    for (const role of ["FREELANCER", "CLIENT", "ADMIN", "FRANCHISER"] as const) {
      for (const navItem of navForRole(role)) {
        expect(navItem.section, `${role} > ${navItem.label}`).toBeTruthy();
      }
    }
  });
});
