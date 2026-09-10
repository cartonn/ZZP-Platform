import { describe, expect, it } from "vitest";
import { navForRole } from "./nav";
import { mobileDockItems } from "./mobile-dock";

describe("mobile workspace navigation", () => {
  it.each(["FREELANCER", "CLIENT", "FRANCHISER", "ADMIN"] as const)(
    "keeps %s shortcuts within its enabled role navigation",
    (role) => {
      const items = navForRole(role);
      const dock = mobileDockItems(items);
      expect(dock).toHaveLength(4);
      expect(dock[0]?.href).toBe("/dashboard");
      expect(dock.every((item) => items.includes(item) && item.enabled && !item.overflow)).toBe(
        true,
      );
      expect(new Set(dock.map((item) => item.href)).size).toBe(4);
    },
  );
  it("omits disabled and secondary routes before filling the available slots", () => {
    const items = navForRole("CLIENT").slice(0, 5);
    const dock = mobileDockItems(
      items.map((item, i) => ({ ...item, enabled: i !== 0, overflow: i === 1 })),
    );
    expect(dock.map((item) => item.href)).toEqual(items.slice(2).map((item) => item.href));
    expect(mobileDockItems([])).toEqual([]);
  });
});
