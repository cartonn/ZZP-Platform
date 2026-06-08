import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test("academie: ZZP'er volgt een cursus en rondt een les af", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");

  await page.goto("/academie");
  await expect(page.getByRole("heading", { name: "Academie" })).toBeVisible();
  await expect(page.getByText("Goed van start als ZZP'er")).toBeVisible();
  await shot(page, "academie-lijst");

  // Open de cursus en start.
  await page.getByText("Goed van start als ZZP'er").click();
  await page.waitForURL("**/academie/goed-van-start");
  await expect(page.getByRole("link", { name: /Beginnen|Verdergaan/ })).toBeVisible();

  // Open de tweede les (de eerste is in de seed al voltooid) en rond hem af.
  await page.getByText("2. Een profiel dat opvalt").click();
  await page.waitForURL("**/academie/goed-van-start/**");
  await page.getByRole("button", { name: "Markeer als voltooid" }).click();
  await expect(page.getByRole("button", { name: "Markeer als niet voltooid" })).toBeVisible();
  await shot(page, "academie-les");
});
