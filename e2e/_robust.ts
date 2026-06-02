// Robuuste interacties voor server-action-knoppen (`<form action={...}>`). Die reageren pas
// zodra React de route heeft gehydrateerd; een klik in de korte race daarvóór gaat verloren.
// Een echte gebruiker raakt dit nooit (die klikt niet binnen milliseconden), maar Playwright wel.
// Daarom: herhaal de klik tot het verwachte effect optreedt — alleen zolang het effect nog
// ontbreekt, zodat er geen dubbele submit gebeurt.
import { expect, type Locator, type Page } from "@playwright/test";

/** Klik `button` tot `result` zichtbaar is. */
export async function clickUntil(button: Locator, result: Locator, timeout = 20000) {
  await expect(async () => {
    if (!(await result.isVisible().catch(() => false))) {
      await button.click({ timeout: 3000 }).catch(() => {});
    }
    await expect(result).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout });
}

/** Klik `button` tot `gone` is verdwenen (bv. een kaart die de wachtrij verlaat). */
export async function clickUntilGone(button: Locator, gone: Locator, timeout = 20000) {
  await expect(async () => {
    if ((await gone.count()) > 0) {
      await button.click({ timeout: 3000 }).catch(() => {});
    }
    await expect(gone).toHaveCount(0, { timeout: 3000 });
  }).toPass({ timeout });
}

/** Klik `button` tot de URL `urlGlob` matcht (navigatie-resultaat). Klikt alleen zolang de knop
 *  nog zichtbaar is — na de navigatie is hij weg, dus geen dubbele submit op create-acties. */
export async function clickForUrl(
  button: Locator,
  page: Page,
  urlGlob: string | RegExp,
  timeout = 20000,
) {
  await expect(async () => {
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 3000 }).catch(() => {});
    }
    await page.waitForURL(urlGlob, { timeout: 3000 });
  }).toPass({ timeout });
}
