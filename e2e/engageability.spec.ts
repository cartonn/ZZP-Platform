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

test("inzetbaarheid: roster toont de status en het dossier verklaart waarom", async ({ page }) => {
  await login(page, "franchise@zzp-platform.local");

  // De roster toont een inzetbaarheidsstatus per ZZP'er (mix uit de seed).
  await page.goto("/franchise/zzpers");
  await expect(page.getByText("Inzetbaar", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Nog niet inzetbaar").first()).toBeVisible();
  await shot(page, "engageability-roster");

  // Open de niet-inzetbare ZZP'er; het dossier verklaart de blokkade (verplicht document).
  await page.getByText("Sofia Janssen").first().click();
  await page.waitForURL("**/franchise/zzpers/**");
  await expect(page.getByRole("heading", { name: "Inzetbaarheid" })).toBeVisible();
  await expect(page.getByText(/ontbreekt/).first()).toBeVisible();
  await shot(page, "engageability-dossier");
});
