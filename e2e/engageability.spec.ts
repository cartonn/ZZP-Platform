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

  // De roster toont een inzetbaarheidsstatus per ZZP'er. De sortering/paginering (LIST_PAGE_SIZE)
  // kan een status buiten de eerste pagina houden; het statusfilter bewijst beide kanten.
  // Span-gescopet: dezelfde teksten bestaan óók als (verborgen) <option> in het statusfilter.
  await page.goto("/franchise/zzpers?status=ACTIEF");
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Inzetbaar$/ })
      .first(),
  ).toBeVisible();
  await page.goto("/franchise/zzpers?status=INACTIEF");
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Nog niet inzetbaar$/ })
      .first(),
  ).toBeVisible();
  await shot(page, "engageability-roster");

  // Open de niet-inzetbare ZZP'er; het dossier verklaart de blokkade (verplicht document).
  // Klik de dossier-link van de rij (de naam-tekst zelf is niet altijd het klikdoel). Sluit de
  // CSV-export-link (/franchise/zzpers/export) uit — die downloadt en navigeert niet.
  await page.locator('a[href^="/franchise/zzpers/"]:not([href*="/zzpers/export"])').first().click();
  await page.waitForURL("**/franchise/zzpers/**");
  await expect(page.getByRole("heading", { name: "Inzetbaarheid" })).toBeVisible();
  await expect(page.getByText(/ontbreekt/).first()).toBeVisible();
  await shot(page, "engageability-dossier");
});
