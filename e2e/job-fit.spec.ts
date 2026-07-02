import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("ZZP'er ziet vóór reageren z'n aansluiting en welke eis ontbreekt", async ({
  page,
  browser,
}) => {
  test.slow();
  const title = `Fit Opdracht ${uniq()}`;

  // Opdrachtgever: opdracht met vereist certificaat (VOG), publiceren.
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Fit Opdrachtgever");
  await page.fill("#companyName", "Fit Testbedrijf B.V.");
  await page.fill("#email", `fit-client-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Project waarvoor een geldige VOG vereist is.");
  await page.selectOption("#workMode", "REMOTE");
  await page
    .locator("fieldset", { hasText: "Vereiste certificaten" })
    .getByText("VOG", { exact: true })
    .click();
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er zonder VOG opent de opdracht en ziet z'n aansluiting met de ontbrekende eis.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await fp.goto("/register");
  await fp.fill("#name", "Fit Freelancer");
  await fp.fill("#email", `fit-free-${uniq()}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");

  await fp.goto(detailUrl);
  const fit = fp.locator("section", { hasText: "Jouw aansluiting" });
  await expect(fit.getByRole("heading", { name: "Jouw aansluiting" })).toBeVisible();
  await expect(fit.getByText(/Match \d+%/)).toBeVisible();
  await expect(fit.getByText("VOG")).toBeVisible();
  await expect(fit.getByText("ontbreekt")).toBeVisible();
  await expect(fit.getByRole("link", { name: "Toevoegen" })).toBeVisible();
  // Uitlegbare match-redenen: de ontbrekende VOG is een certificaat-gap.
  await expect(fit.getByText("Mist vereist certificaat")).toBeVisible();
  await shot(fp, "28-job-fit-freelancer");

  await fctx.close();
});
