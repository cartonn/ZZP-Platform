import { describe, expect, it } from "vitest";
import { isAdminPath, isPublicPath, roleForPath } from "@/lib/route-guards";

describe("isPublicPath", () => {
  it("staat de health- en readinessprobes inlogvrij toe (anders redirect de probe naar /login)", () => {
    expect(isPublicPath("/api/health")).toBe(true);
    expect(isPublicPath("/api/readiness")).toBe(true);
  });

  it("houdt beschermde routes achter de inlogmuur", () => {
    for (const p of ["/dashboard", "/admin/gebruikers", "/api/account/export", "/samenwerkingen"]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
});

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

describe("roleForPath", () => {
  it("FREELANCER-only pagina's", () => {
    for (const p of [
      "/beschikbaarheid",
      "/certificaten",
      "/certificaten/nieuw",
      "/certificaten/abc/bewerken",
      "/documenten",
      "/profiel",
      "/profiel/bewerken",
      "/reacties",
      "/facturen/nieuw",
    ]) {
      expect(roleForPath(p), p).toBe("FREELANCER");
    }
  });

  it("CLIENT-only pagina's", () => {
    for (const p of [
      "/bedrijf",
      "/kandidaten",
      "/favorieten",
      "/opdrachten/nieuw",
      "/opdrachten/abc/bewerken",
    ]) {
      expect(roleForPath(p), p).toBe("CLIENT");
    }
  });

  it("ADMIN-only academie-beheer (buiten /admin)", () => {
    for (const p of [
      "/academie/nieuw",
      "/academie/abc/bewerken",
      "/academie/abc/lessen/nieuw",
      "/academie/abc/les1/bewerken",
    ]) {
      expect(roleForPath(p), p).toBe("ADMIN");
    }
  });

  it("gedeelde ouders zijn NIET gated (null) — geen over-blokkade", () => {
    for (const p of [
      "/opdrachten", //          lijst — gedeeld (ZZP'er bladert ook)
      "/opdrachten/abc", //      detail — gedeeld
      "/facturen", //            lijst — gedeeld (ZZP'er én opdrachtgever)
      "/facturen/abc", //        detail — gedeeld
      "/samenwerkingen", //      gedeeld (beide partijen)
      "/samenwerkingen/abc", //  gedeeld
      "/academie", //            overzicht — gedeeld
      "/academie/abc", //        cursus bekijken — gedeeld
      "/academie/abc/les1", //   les bekijken — gedeeld
      "/dashboard",
      "/berichten",
      "/administratie", //       boekhouding — gedeeld
      "/notificaties",
    ]) {
      expect(roleForPath(p), p).toBeNull();
    }
  });

  it("negeert query/hash bij het matchen", () => {
    expect(roleForPath("/kandidaten?sort=naam")).toBe("CLIENT");
    expect(roleForPath("/certificaten#top")).toBe("FREELANCER");
    expect(roleForPath("/opdrachten?status=open")).toBeNull();
  });

  it("matcht niet op een toevallige prefix zonder segmentgrens", () => {
    expect(roleForPath("/bedrijfsnaam")).toBeNull();
    expect(roleForPath("/profielfoto")).toBeNull();
  });
});
