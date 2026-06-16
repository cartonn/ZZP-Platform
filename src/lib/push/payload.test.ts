import { describe, it, expect } from "vitest";
import { buildPushPayload, isExpiredSubscriptionStatus } from "./payload";

describe("buildPushPayload", () => {
  it("neemt titel, body en relatieve link over; tag = type", () => {
    expect(
      buildPushPayload({
        type: "PAYMENT_CONFIRMED",
        title: "Betaling ontvangen",
        body: "Factuur F-1 is betaald.",
        link: "/facturen",
      }),
    ).toEqual({
      title: "Betaling ontvangen",
      body: "Factuur F-1 is betaald.",
      url: "/facturen",
      tag: "PAYMENT_CONFIRMED",
    });
  });

  it("lege body als er geen body is", () => {
    expect(buildPushPayload({ type: "X", title: "T", body: null }).body).toBe("");
  });

  it("valt terug op /notificaties bij een ontbrekende of niet-relatieve link", () => {
    expect(buildPushPayload({ type: "X", title: "T", link: null }).url).toBe("/notificaties");
    expect(buildPushPayload({ type: "X", title: "T", link: "https://evil.example" }).url).toBe(
      "/notificaties",
    );
  });
});

describe("isExpiredSubscriptionStatus", () => {
  it("true voor 404 en 410", () => {
    expect(isExpiredSubscriptionStatus(404)).toBe(true);
    expect(isExpiredSubscriptionStatus(410)).toBe(true);
  });
  it("false voor andere statussen", () => {
    for (const s of [200, 201, 400, 401, 429, 500, 503]) {
      expect(isExpiredSubscriptionStatus(s)).toBe(false);
    }
  });
});
