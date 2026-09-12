import { expect, test, type Locator, type Page } from "@playwright/test";
import { login } from "./qa/helpers";

async function dashboard(page: Page) {
  await login(page, "zzp@zzp-platform.local");
  await page.waitForSelector('html[data-hydrated="/dashboard"]');
}

async function appearance(target: Locator) {
  return target.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    );
    const style = getComputedStyle(element);
    return {
      transform: style.transform,
      translate: style.translate,
      shadow: style.boxShadow,
      background: style.backgroundColor,
      color: style.color,
      filter: style.filter,
      outlineColor: style.outlineColor,
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
    };
  });
}

test.describe("desktop interactions", () => {
  test.use({ isMobile: false, hasTouch: false, viewport: { width: 1440, height: 1000 } });
  for (const theme of ["light", "dark"] as const) {
    test(`mouse controls, fixture row and selected navigation stay legible (${theme})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      await dashboard(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        1440,
      );
      // Dashboard rows depend on calendar data; exercise their real classes with an explicit browser-only fixture.
      await page.locator(".hs-work-list").evaluate((list) => {
        const row = document.createElement("a");
        row.id = "workspace-row-test-fixture";
        row.href = "#workspace-row-test-fixture";
        row.className =
          "hs-work-row focus-ring flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50";
        row.textContent = "Testrij — alleen browsertest";
        list.append(row);
      });
      const selected = page.locator('.hs-sidebar nav a[aria-current="page"]').first();
      const selectedColors = await appearance(selected);
      const controls = [
        selected,
        page.locator(".hs-action-link").first(),
        page.locator("#workspace-row-test-fixture"),
        page.locator(".hs-header-tools button:visible").first(),
      ];
      for (const control of controls) {
        await expect(control).toBeVisible();
        await control.scrollIntoViewIfNeeded();
        await page.mouse.move(1435, 995);
        const resting = await appearance(control);
        await control.hover();
        await expect.poll(() => appearance(control)).not.toEqual(resting);
        const hovering = await appearance(control);
        await page.mouse.down();
        await expect.poll(() => appearance(control)).not.toEqual(hovering);
        if (control === selected) {
          expect((await appearance(control)).color).toBe(selectedColors.color);
          expect((await appearance(control)).background).toBe(selectedColors.background);
        }
        await page.mouse.move(1435, 995);
        await page.mouse.up();
      }
      await page.keyboard.press("Tab");
      await selected.focus();
      await expect(selected).toHaveCSS("outline-style", "solid");
      expect(
        parseFloat(await selected.evaluate((el) => getComputedStyle(el).outlineWidth)),
      ).toBeGreaterThanOrEqual(2);
      await expect(selected).toBeFocused();
      await expect(selected).toHaveCSS("outline-offset", "3px");
      const focusContrast = await selected.evaluate((element) => {
        const channels = (color: string): [number, number, number] => {
          const values = color
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number);
          if (!values || values.length !== 3)
            throw new Error(`Cannot parse computed color: ${color}`);
          return [values[0]!, values[1]!, values[2]!];
        };
        const luminance = (color: string) => {
          const linear = (channel: number) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          };
          const [r, g, b] = channels(color);
          return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
        };
        let surrounding = element.parentElement!;
        while (
          getComputedStyle(surrounding).backgroundColor === "rgba(0, 0, 0, 0)" &&
          surrounding.parentElement
        ) {
          surrounding = surrounding.parentElement;
        }
        const ring = luminance(getComputedStyle(element).outlineColor);
        const canvas = luminance(getComputedStyle(surrounding).backgroundColor);
        return (Math.max(ring, canvas) + 0.05) / (Math.min(ring, canvas) + 0.05);
      });
      expect(focusContrast).toBeGreaterThanOrEqual(3);
      await page.screenshot({ path: test.info().outputPath(`desktop-${theme}-keyboard.png`) });
    });
  }

  registerFilterTest();
});

test.describe("mobile interactions", () => {
  test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });
  test("mobile actual navigation, responsive layout and editable touch sizes", async ({ page }) => {
    await dashboard(page);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      const menuButton = page.getByRole("button", { name: "Menu openen", exact: true });
      const bounds = await menuButton.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      await menuButton.tap();
      const dialog = page.getByRole("dialog", { name: "Navigatie", exact: true });
      await expect(dialog).toBeVisible();
      const active = dialog.locator('a[aria-current="page"]').first();
      const before = await appearance(active);
      await active.tap();
      await expect(dialog).toHaveCount(0);
      const dock = page.locator('.hs-mobile-dock a[aria-current="page"]').first();
      await expect(dock).toBeVisible();
      expect(before.color).not.toBe(before.background);
      await page.screenshot({ path: test.info().outputPath(`mobile-dashboard-${width}.png`) });
    }
    await page.locator('.hs-mobile-dock a[href="/acties"]').tap();
    await expect(page).toHaveURL(/\/acties$/);
    await expect(page.getByRole("heading", { name: "Acties", exact: true })).toBeVisible();
    await page.goto("/profiel/bewerken");
    const editables = page.locator(
      '.hs-app input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):visible, .hs-app textarea:visible, .hs-app select:visible',
    );
    expect(await editables.count()).toBeGreaterThan(0);
    const sizes = await editables.evaluateAll((elements) =>
      elements.map((element) => parseFloat(getComputedStyle(element).fontSize)),
    );
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
    await editables.first().tap();
    await expect(page.locator(".hs-mobile-dock")).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });

  test("touch cancellation and disabled controls on an explicitly injected primitive fixture", async ({
    page,
  }) => {
    await dashboard(page);
    // A browser-only fixture covers primitive edge cases without shipping an app route.
    await page.locator(".hs-app-main").evaluate((main) => {
      const fixture = document.createElement("section");
      fixture.id = "interaction-test-fixture";
      fixture.innerHTML =
        '<button type="button" data-hs-button="primary">Testknop</button><button type="button" data-hs-button="primary" disabled>Uitgeschakeld</button><a href="#fixture" aria-disabled="true" data-hs-button="secondary">Niet beschikbaar</a><div class="hs-surface">Statische kaart</div>';
      main.prepend(fixture);
    });
    const fixture = page.locator("#interaction-test-fixture");
    const button = fixture.getByRole("button", { name: "Testknop", exact: true });
    const resting = await appearance(button);
    const pointer = {
      pointerId: 7,
      pointerType: "touch",
      isPrimary: true,
      clientX: 40,
      clientY: 200,
      bubbles: true,
    };
    await button.dispatchEvent("pointerdown", pointer);
    await expect.poll(() => appearance(button)).not.toEqual(resting);
    await page.screenshot({ path: test.info().outputPath("touch-fixture-pressed.png") });
    await button.dispatchEvent("pointermove", { ...pointer, clientY: 225 });
    await expect.poll(() => appearance(button)).toEqual(resting);
    await button.dispatchEvent("pointerup", pointer);
    for (const cancellation of ["pointercancel", "scroll", "blur"] as const) {
      await button.dispatchEvent("pointerdown", pointer);
      await expect.poll(() => appearance(button)).not.toEqual(resting);
      if (cancellation === "pointercancel") await button.dispatchEvent(cancellation, pointer);
      else
        await page.evaluate((name) => {
          (name === "scroll" ? document : window).dispatchEvent(new Event(name));
        }, cancellation);
      await expect.poll(() => appearance(button)).toEqual(resting);
    }
    for (const inactive of [
      fixture.locator("button:disabled"),
      fixture.locator('[aria-disabled="true"]'),
      fixture.locator(".hs-surface"),
    ]) {
      const before = await appearance(inactive);
      await inactive.dispatchEvent("pointerdown", pointer);
      expect(await appearance(inactive)).toEqual(before);
      await inactive.dispatchEvent("pointerup", pointer);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await button.dispatchEvent("pointerdown", pointer);
    await expect(button).toHaveCSS("transition-duration", "0s");
    await expect(button).toHaveCSS("animation-name", "none");
    await expect(button).toHaveCSS("transform", "none");
    await button.dispatchEvent("pointerup", pointer);
  });

  test("native Chromium touch drag scrolls without activating its starting link", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Native touch drag uses Chromium's browser input protocol; WebKit tap coverage is separate.",
    );
    await dashboard(page);
    const link = page.locator(".hs-action-link").first();
    await link.evaluate((element) => element.scrollIntoView({ block: "center" }));
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    expect(y).toBeGreaterThan(175);
    expect(y).toBeLessThan(page.viewportSize()!.height - 100);
    const originalURL = page.url();
    const originalScroll = await page.evaluate(() => window.scrollY);
    const before = await appearance(link);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await expect.poll(() => appearance(link)).not.toEqual(before);
    await page.screenshot({ path: test.info().outputPath("native-touch-link-pressed.png") });
    for (let distance = 25; distance <= 175; distance += 25) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - distance }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(originalScroll + 20);
    await expect.poll(() => appearance(link)).toEqual(before);
    expect(page.url()).toBe(originalURL);
    await page.screenshot({ path: test.info().outputPath("native-touch-scroll-released.png") });
    await cdp.detach();
  });

  registerFilterTest();
});

function registerFilterTest() {
  test("existing job filter links provide feedback and preserve selected state", async ({
    page,
    isMobile,
  }) => {
    await login(page, "opdrachtgever@zzp-platform.local");
    await page.goto("/opdrachten");
    const filter = page.locator('.hs-app-main a[href^="/opdrachten?status="]').first();
    await expect(filter).toBeVisible();
    const href = await filter.getAttribute("href");
    if (isMobile) {
      expect((await filter.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await filter.tap();
    } else {
      const resting = await appearance(filter);
      await filter.hover();
      await expect.poll(() => appearance(filter)).not.toEqual(resting);
      await filter.click();
    }
    await expect(page).toHaveURL(new URL(href!, page.url()).href);
    await expect(filter).toHaveAttribute("aria-current", "page");
    const selected = await appearance(filter);
    expect(selected.color).not.toBe(selected.background);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(page.viewportSize()!.width);
  });
}
