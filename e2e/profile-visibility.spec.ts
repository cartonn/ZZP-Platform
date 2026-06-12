import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("privéprofiel waarschuwt de ZZP'er dat opdrachtgevers hem niet kunnen vinden", async ({
  page,
}) => {
  await page.goto("/register");
  await page.fill("#name", "Privacy Freelancer");
  await page.fill("#email", `privacy-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/profiel/bewerken");
  await page.locator('input[name="visibility"][value="PRIVATE"]').check();
  await page.getByRole("button", { name: "Profiel opslaan" }).click();
  await expect(page.getByText(/opgeslagen|bijgewerkt/i).first()).toBeVisible({ timeout: 15000 });

  await page.goto("/dashboard");
  await expect(
    page.getByText("Je profiel staat op privé — opdrachtgevers kunnen je niet vinden"),
  ).toBeVisible();
  await shot(page, "32-private-profile-warning");
});
