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

// De gedemde dienst uit de seed (Zorgbemiddeling Noord → afdeling Geriatrie).
const DIENST_ID = "dienst-noord-nacht";
const DIENST_TITEL = /Nachtdienst verpleegkundige/;

// Zet de "diensten openstellen"-schakelaar op de franchise-instellingen. De pagina (fpage) is al
// ingelogd als Franchiser; dit togglet alleen en bevestigt de opslag.
async function setOverflow(page: Page, on: boolean) {
  await page.goto("/franchise/instellingen");
  const box = page.getByRole("checkbox");
  if ((await box.isChecked()) !== on) await box.setChecked(on);
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByText("Opgeslagen.")).toBeVisible();
}

test("franchise kan diensten openstellen voor directe ZZP'ers (en weer sluiten)", async ({
  browser,
}) => {
  // Franchiser-sessie; begin met een gegarandeerd dichte franchise.
  const fctx = await browser.newContext();
  const fpage = await fctx.newPage();
  await login(fpage, "franchise@zzp-platform.local");
  await setOverflow(fpage, false);

  // Directe ZZP'er (tenantId null) in een eigen sessie.
  const zctx = await browser.newContext();
  const zpage = await zctx.newPage();
  await login(zpage, "zzp@zzp-platform.local");

  // Gesloten per tenant: de tenant-dienst is onzichtbaar — detail (notFound) én browse-lijst.
  // De browse-lijst checken we via de zoekfilter zodat het niet van paginering/volume afhangt.
  await zpage.goto(`/opdrachten/${DIENST_ID}`);
  await expect(zpage.getByRole("heading", { name: DIENST_TITEL })).toHaveCount(0);
  await zpage.goto("/opdrachten?q=verpleegkundige");
  await expect(zpage.getByText(DIENST_TITEL)).toHaveCount(0);
  await shot(zpage, "franchise-overflow-dicht");

  // Franchiser stelt de diensten open voor het hele platform.
  await setOverflow(fpage, true);
  await shot(fpage, "franchise-instellingen-open");

  // Dezelfde dienst wordt nu wél zichtbaar voor de directe ZZP'er — detail én lijst.
  await zpage.goto(`/opdrachten/${DIENST_ID}`);
  await expect(zpage.getByRole("heading", { name: DIENST_TITEL })).toBeVisible();
  await zpage.goto("/opdrachten?q=verpleegkundige");
  await expect(zpage.getByText(DIENST_TITEL).first()).toBeVisible();
  await shot(zpage, "franchise-overflow-open");

  // Weer sluiten → de isolatie herstelt direct.
  await setOverflow(fpage, false);
  await zpage.goto(`/opdrachten/${DIENST_ID}`);
  await expect(zpage.getByRole("heading", { name: DIENST_TITEL })).toHaveCount(0);

  await fctx.close();
  await zctx.close();
});
