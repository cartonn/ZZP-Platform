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

test("certificaat-deling: ZZP'er kan een geverifieerd certificaat met de opdrachtgever delen", async ({
  page,
}) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/certificaten");

  // Een geverifieerd certificaat heeft een deel-knop. De VOG staat in de seed al gedeeld.
  const niet = page.getByRole("button", { name: "Niet delen" }).first();
  await expect(niet).toBeVisible();
  await shot(page, "credential-sharing");

  // Ontdelen → de knop wisselt naar "Delen met opdrachtgever".
  await niet.click();
  await expect(page.getByRole("button", { name: "Delen met opdrachtgever" }).first()).toBeVisible();
});
