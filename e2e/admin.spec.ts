import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickUntil, clickUntilGone } from "./_robust";

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

test("admin schorst gebruiker (self-guard), sluit opdracht en ziet auditregel", async ({
  page,
  browser,
}) => {
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
  await cp.getByRole("button", { name: "Opslaan als concept" }).click();
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
  // Robuust (hydratie-race/#329): klik Schorsen tot de knop omklapt naar Activeren. De lijst is
  // op naam gefilterd (GET-form, werkt ook pre-hydratie) → de actieknop is uniek op de pagina.
  await clickUntil(
    page.getByRole("button", { name: "Schorsen" }),
    page.getByRole("button", { name: "Activeren" }),
  );
  await shot(page, "28-admin-gebruikers");

  // Self-guard: admin's eigen rij heeft geen actieknop.
  await page.goto("/admin/gebruikers?q=admin@zzp-platform.local");
  await expect(page.getByText("(jij)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Schorsen" })).toHaveCount(0);

  // Opdracht sluiten.
  await page.goto(`/admin/opdrachten?q=${encodeURIComponent(jobTitle)}`);
  const jobLink = page.getByRole("link", { name: jobTitle });
  await expect(jobLink).toBeVisible();
  const jobRow = page.locator("div.divide-y > div", { has: jobLink });
  const closeButton = jobRow.getByRole("button", { name: "Sluiten" });
  // Robuust tegen de #329-response-hang: klik Sluiten tot de actieknop verdwenen is. De lijst is
  // op titel gefilterd (GET-form, werkt ook pre-hydratie) → de actieknop is uniek op de pagina.
  await clickUntilGone(closeButton, closeButton);

  // Auditregel zichtbaar. De lijst toont het NL-label van de machine-actie (audit-labels.ts);
  // het filter matcht server-side op de machine-string.
  await page.goto("/admin/audit");
  await page.locator('input[name="action"]').fill("USER_STATUS_CHANGED");
  await page.getByRole("button", { name: "Filteren" }).click();
  await expect(page.getByText("Accountstatus gewijzigd").first()).toBeVisible();
  await shot(page, "29-admin-audit");
});
