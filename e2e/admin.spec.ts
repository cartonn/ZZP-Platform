import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "admin@zzp-platform.local");
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test("admin schorst gebruiker (self-guard), sluit opdracht en ziet auditregel", async ({ page, browser }) => {
  test.slow();
  const targetName = `Target ${uniq()}`;
  const jobTitle = `Admin Opdracht ${uniq()}`;

  // Doelgebruiker (ZZP'er) registreren.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await fp.goto("/register");
  await fp.fill("#name", targetName);
  await fp.fill("#email", `admintarget-${uniq()}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");
  await fctx.close();

  // Opdrachtgever + gepubliceerde opdracht (om te modereren).
  const cctx = await browser.newContext();
  const cp = await cctx.newPage();
  await cp.goto("/register");
  await cp.getByText("Opdrachtgever", { exact: true }).click();
  await cp.fill("#name", "Admin Client");
  await cp.fill("#companyName", "Admin Testbedrijf B.V.");
  await cp.fill("#email", `adminclient-${uniq()}@test.local`);
  await cp.fill("#password", "geheim123");
  await cp.getByRole("button", { name: "Account aanmaken" }).click();
  await cp.waitForURL("**/dashboard");
  await cp.goto("/opdrachten/nieuw");
  await cp.fill("#title", jobTitle);
  await cp.fill("#description", "Te modereren opdracht voor admin-test.");
  await cp.getByRole("button", { name: "Opdracht aanmaken" }).click();
  await expect(cp.getByRole("heading", { name: jobTitle })).toBeVisible();
  await cp.getByRole("button", { name: "Publiceren" }).click();
  await expect(cp.getByText("Gepubliceerd")).toBeVisible();
  await cctx.close();

  // Admin beheert.
  await loginAdmin(page);

  // Gebruiker schorsen.
  await page.goto("/admin/gebruikers");
  await page.getByLabel("Zoeken").fill(targetName);
  await page.getByRole("button", { name: "Filteren" }).click();
  await expect(page.getByText(targetName)).toBeVisible();
  await page.getByRole("button", { name: "Schorsen" }).click(); // uniek na filteren op naam
  // Geschorst zodra de actieknop omklapt naar "Activeren" (badge "Geschorst" botst met de filter-optie).
  await expect(page.getByRole("button", { name: "Activeren" })).toBeVisible();
  await shot(page, "28-admin-gebruikers");

  // Self-guard: admin's eigen rij heeft geen actieknop.
  await page.goto("/admin/gebruikers?q=admin@zzp-platform.local");
  await expect(page.getByText("(jij)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Schorsen" })).toHaveCount(0);

  // Opdracht sluiten.
  await page.goto("/admin/opdrachten");
  await page.getByLabel("Zoeken").fill(jobTitle);
  await page.getByRole("button", { name: "Filteren" }).click();
  await expect(page.getByText(jobTitle)).toBeVisible();
  await page.getByRole("button", { name: "Sluiten" }).click(); // uniek na filteren op titel
  await expect(page.getByRole("button", { name: "Sluiten" })).toHaveCount(0); // gesloten -> actie weg

  // Auditregel zichtbaar.
  await page.goto("/admin/audit");
  await page.getByLabel("Actie").fill("USER_STATUS_CHANGED");
  await page.getByRole("button", { name: "Filteren" }).click();
  await expect(page.getByText("USER_STATUS_CHANGED").first()).toBeVisible();
  await shot(page, "29-admin-audit");
});
