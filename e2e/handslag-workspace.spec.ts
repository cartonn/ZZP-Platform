import { expect, test } from "@playwright/test";
import { login } from "./qa/helpers";

const roles = {
  freelancer: "zzp@zzp-platform.local",
  client: "opdrachtgever@zzp-platform.local",
  admin: "admin@zzp-platform.local",
  franchiser: "franchise@zzp-platform.local",
};

for (const [role, email] of Object.entries(roles)) {
  for (const theme of ["light", "dark"] as const) {
    test(`V5 workspace: ${role}, ${theme}, responsive navigation and keyboard`, async ({
      page,
    }) => {
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      await page.setViewportSize({ width: 390, height: 844 });
      await login(page, email);
      await expect(page.locator(".hs-workspace-heading h1")).toBeVisible();
      await page.waitForSelector('html[data-hydrated="/dashboard"]');

      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
          .toBeLessThanOrEqual(width);
        const skip = page.getByRole("link", { name: "Naar inhoud", exact: true });
        await skip.focus();
        await skip.press("Enter");
        await expect(page.locator("#hoofdinhoud")).toBeFocused();

        const trigger = page.getByRole("button", { name: "Menu openen", exact: true });
        await trigger.click();
        const dialog = page.getByRole("dialog", { name: "Navigatie", exact: true });
        await expect(dialog).toBeVisible();
        await expect
          .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
          .toBe(true);
        await expect(page.locator(".hs-app")).toHaveAttribute("inert", "");
        const permitted = await dialog
          .locator("a[href]")
          .evaluateAll((links) => links.map((el) => el.getAttribute("href")));
        const shortcuts = await page
          .locator(".hs-mobile-dock a")
          .evaluateAll((links) => links.map((el) => el.getAttribute("href")));
        expect(shortcuts.length).toBeGreaterThan(0);
        expect(shortcuts.every((href) => permitted.includes(href))).toBe(true);
        for (let i = 0; i < 18; i++) {
          await page.keyboard.press("Tab");
          expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
        }
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(page.locator(".hs-app")).not.toHaveAttribute("inert", "");
        const more = page.getByRole("button", { name: "Meer", exact: true });
        if (await more.count()) {
          await more.click();
          const menu = page.getByRole("menu", { name: "Meer", exact: true });
          await expect(menu).toBeVisible();
          const bounds = await menu.boundingBox();
          expect(bounds).not.toBeNull();
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
          if (width === 320) {
            await page.screenshot({ path: test.info().outputPath("mobile-menu.png") });
          }
          await page.keyboard.press("Escape");
          await expect(menu).toHaveCount(0);
        }
      }

      await page.screenshot({ path: test.info().outputPath("mobile-dashboard.png") });

      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect(page.locator(".hs-mobile-dock")).toBeHidden();
      const active = page.locator('.hs-sidebar a[aria-current="page"]').first();
      await page.keyboard.press("Tab");
      await active.focus();
      await expect(active).toBeFocused();
      await expect(active).toHaveCSS("outline-style", "solid");
      await expect(active).toHaveCSS("outline-width", "2px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        1440,
      );
      expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(theme);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/acties");
      await expect(page.getByRole("heading", { name: "Acties", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(page.locator(".hs-mobile-dock a").first()).toHaveCSS(
        "transition-duration",
        "0s",
      );
    });
  }
}
