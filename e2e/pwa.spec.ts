import { expect, test } from "@playwright/test";

test("pwa: manifest, theme-color en iconen zijn aanwezig", async ({ page, request }) => {
  await page.goto("/login");

  // Next injecteert de manifest-link + de viewport-themakleur.
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveCount(1);

  // Het manifest is geldig en installeerbaar (standalone + start_url + iconen).
  const manifestRes = await request.get("/manifest.webmanifest");
  expect(manifestRes.ok()).toBeTruthy();
  const manifest = await manifestRes.json();
  expect(manifest.name).toBe("ZZP Platform");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  expect(Array.isArray(manifest.icons) && manifest.icons.length).toBeGreaterThanOrEqual(2);

  // De gegenereerde iconen worden als echte PNG geserveerd.
  const icon = await request.get("/pwa/icon/192.png");
  expect(icon.ok()).toBeTruthy();
  expect(icon.headers()["content-type"]).toContain("image/png");

  // De service worker + offline-pagina zijn publiek bereikbaar.
  const sw = await request.get("/sw.js");
  expect(sw.ok()).toBeTruthy();
  const offline = await request.get("/offline.html");
  expect(offline.ok()).toBeTruthy();
  expect(await offline.text()).toContain("offline");
});
