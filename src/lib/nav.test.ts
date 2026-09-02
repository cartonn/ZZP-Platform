import { describe, expect, it } from "vitest";
import { MAX_SIDEBAR_ITEMS, groupNavItems, navForRole, splitNavItems, type NavItem } from "./nav";

const ROLES = ["FREELANCER", "CLIENT", "ADMIN", "FRANCHISER"] as const;

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
    for (const role of ROLES) {
      for (const navItem of navForRole(role)) {
        expect(navItem.section, `${role} > ${navItem.label}`).toBeTruthy();
      }
    }
  });
});

describe("splitNavItems", () => {
  it("scheidt zijbalk en 'Meer'-menu en behoudt de bronvolgorde", () => {
    const a = item("A", "Werk");
    const b = { ...item("B", "Meer"), overflow: true };
    const c = item("C", "Werk");
    const split = splitNavItems([a, b, c]);
    expect(split.sidebar.map((i) => i.label)).toEqual(["A", "C"]);
    expect(split.overflow.map((i) => i.label)).toEqual(["B"]);
  });

  it("zonder overflow-items blijft het 'Meer'-menu leeg", () => {
    const split = splitNavItems([item("A", "Werk")]);
    expect(split.overflow).toEqual([]);
    expect(split.sidebar).toHaveLength(1);
  });

  it(`elke rol houdt hoogstens ${MAX_SIDEBAR_ITEMS} items in de zijbalk`, () => {
    for (const role of ROLES) {
      const { sidebar } = splitNavItems(navForRole(role));
      expect(
        sidebar.length,
        `${role}: ${sidebar.map((i) => i.label).join(", ")}`,
      ).toBeLessThanOrEqual(MAX_SIDEBAR_ITEMS);
    }
  });

  it("verplaatste items blijven bereikbaar: elk item staat in precies één van beide lijsten", () => {
    for (const role of ROLES) {
      const all = navForRole(role);
      const { sidebar, overflow } = splitNavItems(all);
      expect(sidebar.length + overflow.length).toBe(all.length);
      const hrefs = new Set([...sidebar, ...overflow].map((i) => i.href));
      expect(hrefs.size).toBe(all.length);
    }
  });

  it("elk 'Meer'-item valt onder de sectie 'Meer' (rustige kop in het menu)", () => {
    for (const role of ROLES) {
      for (const navItem of splitNavItems(navForRole(role)).overflow) {
        expect(navItem.section, `${role} > ${navItem.label}`).toBe("Meer");
      }
    }
  });
});
