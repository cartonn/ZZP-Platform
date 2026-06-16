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

test("inzicht: ZZP'er ziet zijn cijferoverzicht", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/inzicht");
  await expect(page.getByRole("heading", { name: "Inzicht" })).toBeVisible();
  await expect(page.getByText("Omzet per maand")).toBeVisible();
  await expect(page.getByText("Activiteit")).toBeVisible();
  await shot(page, "inzicht-freelancer");
});

test("inzicht: opdrachtgever ziet uitgaven en vervulling", async ({ page }) => {
  await login(page, "opdrachtgever@zzp-platform.local");
  await page.goto("/inzicht");
  await expect(page.getByRole("heading", { name: "Inzicht" })).toBeVisible();
  await expect(page.getByText("Uitgaven")).toBeVisible();
  await expect(page.getByText("Opdrachten")).toBeVisible();
  await shot(page, "inzicht-client");
});
