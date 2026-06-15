import { describe, it, expect } from "vitest";
import { isIosSafari, installPlatform, shouldOfferInstall } from "./pwa-install";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1";
const IPAD_OS_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const DESKTOP_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

describe("isIosSafari", () => {
  it("true voor iPhone Safari", () => {
    expect(isIosSafari(IPHONE_SAFARI, false)).toBe(true);
  });
  it("false voor iPhone Chrome (CriOS — geen A2HS-deelmenu)", () => {
    expect(isIosSafari(IPHONE_CHROME, false)).toBe(false);
  });
  it("true voor iPadOS dat zich als Mac voordoet mét touch", () => {
    expect(isIosSafari(IPAD_OS_MAC, true)).toBe(true);
  });
  it("false voor een echte Mac zonder touch", () => {
    expect(isIosSafari(IPAD_OS_MAC, false)).toBe(false);
  });
  it("false voor Android Chrome", () => {
    expect(isIosSafari(ANDROID_CHROME, false)).toBe(false);
  });
  it("false voor desktop Chrome", () => {
    expect(isIosSafari(DESKTOP_MAC, false)).toBe(false);
  });
});

describe("installPlatform", () => {
  it("prompt wint van iOS als beforeinstallprompt beschikbaar is", () => {
    expect(installPlatform({ canPrompt: true, isIos: true })).toBe("prompt");
  });
  it("ios als er geen prompt is maar wel iOS Safari", () => {
    expect(installPlatform({ canPrompt: false, isIos: true })).toBe("ios");
  });
  it("none zonder route", () => {
    expect(installPlatform({ canPrompt: false, isIos: false })).toBe("none");
  });
});

describe("shouldOfferInstall", () => {
  it("true bij een route, niet standalone, niet weggeklikt", () => {
    expect(shouldOfferInstall({ platform: "prompt", standalone: false, dismissed: false })).toBe(
      true,
    );
  });
  it("false als al geïnstalleerd (standalone)", () => {
    expect(shouldOfferInstall({ platform: "prompt", standalone: true, dismissed: false })).toBe(
      false,
    );
  });
  it("false als eerder weggeklikt", () => {
    expect(shouldOfferInstall({ platform: "ios", standalone: false, dismissed: true })).toBe(false);
  });
  it("false zonder route", () => {
    expect(shouldOfferInstall({ platform: "none", standalone: false, dismissed: false })).toBe(
      false,
    );
  });
});
