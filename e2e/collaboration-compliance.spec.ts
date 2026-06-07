import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("inzetbaarheid-gate: ontbrekend vereist certificaat blokkeert de plaatsing", async ({
  page,
  browser,
}) => {
  test.slow();
  const title = `Compliance Opdracht ${uniq()}`;

  // Opdrachtgever: opdracht met vereist certificaat (VOG), publiceren.
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Comp Opdrachtgever");
  await page.fill("#companyName", "Comp Testbedrijf B.V.");
  await page.fill("#email", `comp-client-${uniq()}@test.local`);
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
  await page.getByRole("button", { name: "Opdracht aanmaken" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er zonder VOG reageert.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await fp.goto("/register");
  await fp.fill("#name", "Comp Freelancer");
  await fp.fill("#email", `comp-free-${uniq()}@test.local`);
  await fp.fill("#password", "geheim123");
  await fp.getByRole("button", { name: "Account aanmaken" }).click();
  await fp.waitForURL("**/dashboard");
  await fp.goto(detailUrl);
  await fp.fill("#motivation", "Ik ben beschikbaar en lever de VOG voor de start aan.");
  await fp.getByRole("button", { name: "Reactie versturen" }).click();
  await fp.waitForURL("**/reacties");

  // Opdrachtgever accepteert en stelt een samenwerking voor.
  await page.goto("/kandidaten");
  await expect(page.getByText("Comp Freelancer")).toBeVisible();
  await page.getByRole("button", { name: "Accepteren" }).click();
  await expect(page.getByText("Samenwerking voorstellen")).toBeVisible();
  await page.locator('input[name="rate"]').fill("90");
  await page.getByRole("button", { name: "Voorstel versturen" }).click();
  await expect(page.getByRole("link", { name: "Bekijk samenwerking" })).toBeVisible();

  // ZZP'er: de samenwerking kan NIET starten zolang de VOG ontbreekt — ondertekenen is geblokkeerd
  // (reageren en voorstellen mocht wél; de harde grens zit bij de plaatsing, ADR-0006 C-hybride).
  await fp.goto("/samenwerkingen");
  const fcard = fp.locator("div.bg-card", { hasText: title });
  await expect(fcard.getByText("Je mist een vereist certificaat: VOG.")).toBeVisible();
  await expect(fcard.getByRole("link", { name: "Bijwerken" })).toBeVisible();
  await expect(
    fcard.getByText("Ondertekenen kan pas als je aan de certificaateisen voldoet."),
  ).toBeVisible();
  await expect(fcard.getByRole("button", { name: "Contract ondertekenen" })).toHaveCount(0);
  await shot(fp, "25-samenwerking-plaatsing-geblokkeerd");

  // Opdrachtgever ziet dezelfde compliance-waarschuwing op de voorgestelde samenwerking.
  await page.goto("/samenwerkingen");
  const ccard = page.locator("div.bg-card", { hasText: title });
  await expect(ccard.getByText("Comp Freelancer mist een vereist certificaat: VOG.")).toBeVisible();

  await fctx.close();
});
