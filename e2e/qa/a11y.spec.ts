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
    await page.waitForSelector('html[data-hydrated="/dashboard"]', { timeout: 10000 });

    // De skip-link is het EERSTE focusbare element in de DOM-/tab-volgorde (WCAG 2.4.1).
    // (We checken de DOM-volgorde i.p.v. een Tab-toets: headless-Chromium verplaatst de
    // document-focus niet betrouwbaar op de eerste Tab.)
    const firstTabbableIsSkip = await page.evaluate(() => {
      const first = document.querySelector(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      return first?.getAttribute("href") === "#hoofdinhoud";
    });
    expect(firstTabbableIsSkip).toBe(true);

    // Activeren (toetsenbord) zet de focus op de hoofdinhoud — niet alleen scrollen.
    const skip = page.getByRole("link", { name: "Naar inhoud" });
    await skip.focus();
    await expect(skip).toBeFocused();
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
