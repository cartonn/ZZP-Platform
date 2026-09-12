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
  expect(manifest.name).toBe("Handslag");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  expect(manifest.theme_color).toBe("#0076a8");
  expect(manifest.background_color).toBe("#eaf4fa");
  expect(Array.isArray(manifest.icons) && manifest.icons.length).toBeGreaterThanOrEqual(2);
  expect(manifest.icons.every((item: { src: string }) => item.src.includes("v=handslag-v5"))).toBe(
    true,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/pwa/icon/apple.png?v=handslag-v5",
  );

  // De gegenereerde iconen worden als echte PNG geserveerd.
  const icon = await request.get(manifest.icons[0].src);
  expect(icon.ok()).toBeTruthy();
  expect(icon.headers()["content-type"]).toContain("image/png");

  // De service worker + offline-pagina zijn publiek bereikbaar.
  const sw = await request.get("/sw.js");
  expect(sw.ok()).toBeTruthy();
  const offline = await request.get("/offline.html");
  expect(offline.ok()).toBeTruthy();
  expect(await offline.text()).toContain("offline");
  await page.goto("/offline.html");
  await expect(page.getByRole("img", { name: "Handslag" })).toBeVisible();
  const retry = page.getByRole("button", { name: "Opnieuw proberen" });
  await retry.focus();
  await expect(retry).toHaveCSS("outline-style", "solid");
  await page.screenshot({ path: test.info().outputPath("handslag-offline.png") });
});
