import { describe, expect, it } from "vitest";
import { isAdminPath } from "@/lib/route-guards";

describe("isAdminPath", () => {
  it("matcht het admin-paneel", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/gebruikers")).toBe(true);
    expect(isAdminPath("/admin/verificaties?status=PENDING")).toBe(true);
  });

  it("matcht NIET de boekhoudpagina /administratie (segmentgrens)", () => {
    // De bug: "/administratie".startsWith("/admin") === true → niet-admins werden
    // onterecht naar /dashboard gestuurd.
    expect(isAdminPath("/administratie")).toBe(false);
    expect(isAdminPath("/administratie/2026")).toBe(false);
  });

  it("matcht geen ongerelateerde paden", () => {
    expect(isAdminPath("/dashboard")).toBe(false);
    expect(isAdminPath("/facturen")).toBe(false);
    expect(isAdminPath("/")).toBe(false);
  });
});
