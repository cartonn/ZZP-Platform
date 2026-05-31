import { describe, expect, it } from "vitest";
import { canModerateUser, normalizeAuditFilters, toggleSuspension } from "@/lib/admin";

describe("canModerateUser", () => {
  it("staat moderatie van anderen toe, niet van zichzelf", () => {
    expect(canModerateUser("admin1", "user2")).toBe(true);
    expect(canModerateUser("admin1", "admin1")).toBe(false);
  });
});

describe("toggleSuspension", () => {
  it("wisselt tussen ACTIVE en SUSPENDED", () => {
    expect(toggleSuspension("ACTIVE")).toBe("SUSPENDED");
    expect(toggleSuspension("SUSPENDED")).toBe("ACTIVE");
    expect(toggleSuspension("PENDING")).toBe("SUSPENDED");
  });
});

describe("normalizeAuditFilters", () => {
  it("levert defaults bij lege input", () => {
    const f = normalizeAuditFilters({});
    expect(f).toEqual({ action: undefined, entityType: undefined, page: 1 });
  });

  it("parseert filters en clamp page >= 1", () => {
    expect(
      normalizeAuditFilters({ action: "INVOICE_PAID", entityType: "Invoice", page: "3" }),
    ).toEqual({
      action: "INVOICE_PAID",
      entityType: "Invoice",
      page: 3,
    });
    expect(normalizeAuditFilters({ page: "0" }).page).toBe(1);
    expect(normalizeAuditFilters({ page: "x" }).page).toBe(1);
  });
});
