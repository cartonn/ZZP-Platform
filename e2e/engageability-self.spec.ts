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

test("inzetbaarheid-zelfweergave: ZZP'er ziet zijn status met herstelpad op het dashboard", async ({
  page,
}) => {
  // De demo-ZZP'er mist een verplicht document → status 'Nog niet inzetbaar' met herstelpad.
  await login(page, "zzp@zzp-platform.local");
  await expect(page.getByRole("heading", { name: "Jouw inzetbaarheid" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Naar certificaten" })).toBeVisible();
  await shot(page, "engageability-self");
});
