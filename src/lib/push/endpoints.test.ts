import { describe, it, expect } from "vitest";
import { isAllowedPushEndpoint } from "./endpoints";

describe("isAllowedPushEndpoint", () => {
  it("staat de officiële push-diensten toe (exact + subdomein)", () => {
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(
      true,
    );
    expect(isAllowedPushEndpoint("https://web.push.apple.com/abc")).toBe(true);
    expect(isAllowedPushEndpoint("https://xyz.notify.windows.com/w/?token=abc")).toBe(true);
  });

  it("weigert een onbekende host (anti-SSRF/exfiltratie)", () => {
    expect(isAllowedPushEndpoint("https://attacker.example/collect")).toBe(false);
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com.attacker.example/x")).toBe(false);
  });

  it("weigert niet-https en interne adressen", () => {
    expect(isAllowedPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://localhost/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedPushEndpoint("ftp://fcm.googleapis.com/x")).toBe(false);
  });

  it("weigert onzin", () => {
    expect(isAllowedPushEndpoint("not a url")).toBe(false);
    expect(isAllowedPushEndpoint("")).toBe(false);
  });
});
