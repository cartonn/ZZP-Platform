import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("public landing connects visitors to registration and keeps the app protected", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Goed werk",
  );
  await expect(page).toHaveURL(/\/$/);
  await page
    .getByRole("link", { name: "Start als zorgprofessional", exact: true })
    .click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByRole("heading", { name: "Account aanmaken" }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("mobile landing has no horizontal overflow and explains payments accessibly", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await page.getByText("Menu", { exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobiele navigatie" }),
  ).toBeVisible();
  const question = page
    .locator("summary")
    .filter({ hasText: "Hoe worden facturen betaald?" });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(/De opdrachtgever betaalt de zzp’er rechtstreeks/),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Start als opdrachtgever", exact: true })
    .click();
  await expect(page).toHaveURL(/\/register$/);
});
