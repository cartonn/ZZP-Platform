import { expect, test, type Page } from "@playwright/test";

// De zijbalk is een smalle icoon-rail die uitklapt bij hover/focus en weer inklapt zodra de muis
// weg is, de focus de rail verlaat én — de kern van deze test — na het klikken op een menu-item.
// Voorheen hield het aangeklikte (nog gefocuste) item de rail open via :focus-within.

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

const railWidth = (page: Page) =>
  page.evaluate(() => Math.round(document.querySelector("aside")!.getBoundingClientRect().width));

test("zijbalk-rail klapt in na navigatie, hover en muis-weg", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  const aside = page.locator("aside").first();
  const roosterLink = aside.locator('a[href="/rooster"]');

  // De rail staat tegenwoordig standaard vastgepind open (gebruikersvoorkeur); kies eerst de
  // ingeklapte voorkeur — het hover-gedrag hieronder geldt alleen in die stand.
  await page.getByRole("button", { name: "Zijbalk inklappen" }).click();

  // Muis weg van de rail → ingeklapt in rust (icoon-rail, ~4rem).
  await page.mouse.move(900, 450);
  await expect.poll(() => railWidth(page)).toBeLessThan(100);

  // Hover klapt 'm uit (~16rem) en toont de labels.
  await aside.hover();
  await expect.poll(() => railWidth(page)).toBeGreaterThan(200);
  await expect(roosterLink).toBeVisible();

  // Kern van de fix: klik op een menu-item → navigeert → de rail klapt weer in, óók al staat de
  // cursor nog op de rail en houdt het aangeklikte item nog de focus (voorheen bleef 'm openstaan).
  await roosterLink.click();
  await page.waitForURL("**/rooster");
  await expect.poll(() => railWidth(page)).toBeLessThan(100);

  // Opnieuw uitklappen via hover en weer inklappen zodra de muis weg is.
  await aside.hover();
  await expect.poll(() => railWidth(page)).toBeGreaterThan(200);
  await page.mouse.move(900, 450);
  await expect.poll(() => railWidth(page)).toBeLessThan(100);
});
