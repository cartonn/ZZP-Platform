import { expect, test, type Page } from "@playwright/test";

// Toegankelijkheid: landmarks + een werkende skip-to-content link (WCAG 2.4.1).
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("A11y: landmarks + skip-link", () => {
  test("skip-link is het eerste focusbare element en springt naar de hoofdinhoud", async ({
    page,
  }) => {
    await login(page, "zzp@zzp-platform.local");

    // Eerste Tab focust de (visueel verborgen) skip-link.
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Naar inhoud" });
    await expect(skip).toBeFocused();

    // Activeren zet de focus op de hoofdinhoud.
    await skip.press("Enter");
    await expect(page.locator("main#hoofdinhoud")).toBeFocused();
  });

  test("kernlandmarks aanwezig (banner, navigatie, main)", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await expect(page.locator("main#hoofdinhoud")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Hoofdnavigatie" })).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
  });
});
