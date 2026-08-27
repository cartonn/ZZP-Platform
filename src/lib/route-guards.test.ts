import { describe, expect, it } from "vitest";
import { isAdminPath, isPublicPath, roleForPath } from "@/lib/route-guards";

describe("isPublicPath", () => {
  it("staat de health- en readinessprobes inlogvrij toe (anders redirect de probe naar /login)", () => {
    expect(isPublicPath("/api/health")).toBe(true);
    expect(isPublicPath("/api/readiness")).toBe(true);
  });

  it("staat het metrics-endpoint inlogvrij toe (scraper heeft geen sessie, alleen CRON_SECRET-guard)", () => {
    // Regressie: zonder deze allowlist-entry redirect de middleware een sessieloze Prometheus-/
    // uptime-scraper naar /login vóór de CRON_SECRET-guard draait → het endpoint is functioneel dood.
    expect(isPublicPath("/api/metrics")).toBe(true);
  });

  it("staat de betaal-webhook inlogvrij toe (provider pingt zonder sessie; verifieert zelf via provider)", () => {
    // Regressie: stond achter de inlogmuur → een live Mollie-ping werd naar /login geredirect,
    // waardoor een betaald abonnement nooit activeerde (SUBSCRIPTION_ACTIVATED bleef uit).
    expect(isPublicPath("/api/billing/webhook")).toBe(true);
  });

  it("staat de mail-intake-webhook inlogvrij toe (inbound-mailprovider POST't zonder sessie; route is zelf secret-gated)", () => {
    // Regressie: shipte (#1254) zonder allowlist-entry → een sessieloze provider-POST werd naar
    // /login geredirect (307) vóór de secret-guard van de route draaide, waardoor de mail-intake
    // functioneel dood was in productie. Zelfde valkuil als de betaal-webhook hierboven.
    expect(isPublicPath("/api/mail-intake/webhook")).toBe(true);
  });

  it("staat de CSP-violatie-ontvanger inlogvrij toe (browser POST't zonder sessie, óók vanaf /login)", () => {
    expect(isPublicPath("/api/csp-report")).toBe(true);
  });

  it("staat de juridische pagina's inlogvrij toe (terhandstelling vóór registratie vereist)", () => {
    expect(isPublicPath("/voorwaarden")).toBe(true);
    expect(isPublicPath("/privacy")).toBe(true);
    expect(isPublicPath("/cookies")).toBe(true);
    // Alleen de exacte routes; subpaden blijven achter de inlogmuur.
    expect(isPublicPath("/privacy/intern")).toBe(false);
  });

  it("staat de client-fout-ontvanger inlogvrij toe (error-boundary POST't zonder sessie, óók bij root-layout-crash)", () => {
    expect(isPublicPath("/api/client-error")).toBe(true);
  });

  it("houdt beschermde routes achter de inlogmuur", () => {
    for (const p of [
      "/dashboard",
      "/admin/gebruikers",
      "/api/account/export",
      "/samenwerkingen",
      // De rest van /api/billing blijft beschermd: alleen de exacte webhook-route is publiek.
      "/api/billing",
      "/api/billing/webhook/extra",
      // Alleen de exacte mail-intake-webhook-route is publiek, geen subpaden of de collectie.
      "/api/mail-intake",
      "/api/mail-intake/webhook/extra",
      "/api/media/logo.png",
      // Alleen de exacte csp-report-route is publiek, geen subpaden.
      "/api/csp-report/extra",
      // Idem voor de client-fout-ontvanger: alleen de exacte route is publiek.
      "/api/client-error/extra",
      // Alleen de exacte metrics-route is publiek, geen subpaden.
      "/api/metrics/extra",
      // Het ontwerp-lab is INTERN (inloggen vereist) — niet langer publiek.
      "/ontwerp",
      "/ontwerp/01",
      "/ontwerp-lab",
      "/ontwerp-lab/layouts",
    ]) {
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
