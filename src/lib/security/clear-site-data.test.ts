import { describe, expect, it } from "vitest";
import {
  CLEAR_SITE_DATA_LOGOUT,
  LOGOUT_LANDING_PATH,
  LOGOUT_MARKER_PARAM,
  LOGOUT_MARKER_VALUE,
  logoutRedirect,
  shouldClearSiteDataOnLogout,
} from "./clear-site-data";

describe("clear-site-data — headerwaarde", () => {
  it("wist cache + storage, maar bewust niet cookies (NextAuth wist de sessiecookie al)", () => {
    expect(CLEAR_SITE_DATA_LOGOUT).toBe('"cache", "storage"');
    expect(CLEAR_SITE_DATA_LOGOUT).not.toContain("cookies");
  });
});

describe("logoutRedirect", () => {
  it("voegt de marker toe aan het standaard-loginpad", () => {
    expect(logoutRedirect()).toBe(`/login?${LOGOUT_MARKER_PARAM}=${LOGOUT_MARKER_VALUE}`);
  });

  it("behoudt een bestaande querystring (bv. na wachtwoordwijziging)", () => {
    const result = logoutRedirect("/login?changed=1");
    const params = new URLSearchParams(result.split("?")[1]);
    expect(result.startsWith("/login?")).toBe(true);
    expect(params.get("changed")).toBe("1");
    expect(params.get(LOGOUT_MARKER_PARAM)).toBe(LOGOUT_MARKER_VALUE);
  });

  it("overschrijft een reeds aanwezige marker niet dubbel", () => {
    const once = logoutRedirect();
    const twice = logoutRedirect(once);
    const params = new URLSearchParams(twice.split("?")[1]);
    expect(params.getAll(LOGOUT_MARKER_PARAM)).toEqual([LOGOUT_MARKER_VALUE]);
  });

  it("valt terug op het loginpad bij een lege target", () => {
    expect(logoutRedirect("")).toBe(
      `${LOGOUT_LANDING_PATH}?${LOGOUT_MARKER_PARAM}=${LOGOUT_MARKER_VALUE}`,
    );
  });
});

describe("shouldClearSiteDataOnLogout", () => {
  it("is waar op /login met de marker", () => {
    const params = new URLSearchParams({ [LOGOUT_MARKER_PARAM]: LOGOUT_MARKER_VALUE });
    expect(shouldClearSiteDataOnLogout("/login", params)).toBe(true);
  });

  it("is waar wanneer de marker naast andere params staat", () => {
    const params = new URLSearchParams(`changed=1&${LOGOUT_MARKER_PARAM}=${LOGOUT_MARKER_VALUE}`);
    expect(shouldClearSiteDataOnLogout("/login", params)).toBe(true);
  });

  it("is onwaar zonder de marker (verlopen/onderbroken sessie → geen data-clear)", () => {
    const params = new URLSearchParams("callbackUrl=%2Fdashboard");
    expect(shouldClearSiteDataOnLogout("/login", params)).toBe(false);
  });

  it("is onwaar bij een verkeerde markerwaarde", () => {
    const params = new URLSearchParams({ [LOGOUT_MARKER_PARAM]: "0" });
    expect(shouldClearSiteDataOnLogout("/login", params)).toBe(false);
  });

  it("is onwaar op een ander pad, ook mét de marker", () => {
    const params = new URLSearchParams({ [LOGOUT_MARKER_PARAM]: LOGOUT_MARKER_VALUE });
    expect(shouldClearSiteDataOnLogout("/dashboard", params)).toBe(false);
  });
});
