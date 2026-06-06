import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

const MOBIEL = "Mobiele app met push-meldingen";

test("ideeënbox: indienen, upvote togglen en (admin) status zetten", async ({ page, browser }) => {
  test.slow();

  // --- ZZP'er: idee indienen + stemmen ---
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/ideeen");
  // Seed-idee met de meeste stemmen staat bovenaan.
  await expect(page.getByText("Donkere modus voor het hele platform")).toBeVisible();

  // Nieuw idee indienen → verschijnt (met 1 automatische stem van de indiener).
  const titel = `Sneller zoeken ${uniq()}`;
  await page.fill("#title", titel);
  await page.fill(
    "#description",
    "Een zoekbalk bovenaan om snel een opdracht of bericht te vinden.",
  );
  await page.getByRole("button", { name: "Idee indienen" }).click();
  await expect(page.getByText("Idee ingediend — bedankt.")).toBeVisible();
  await expect(page.getByText(titel)).toBeVisible();
  await shot(page, "ideeen-ingediend");

  // Upvote togglen op een idee waar deze ZZP'er nog niet op stemde.
  const card = page.locator("li", { hasText: MOBIEL });
  await card.getByRole("button", { name: "Stem op dit idee" }).click();
  await expect(card.getByRole("button", { name: "Stem intrekken" })).toBeVisible();
  await card.getByRole("button", { name: "Stem intrekken" }).click();
  await expect(card.getByRole("button", { name: "Stem op dit idee" })).toBeVisible();

  // --- Admin: status van een idee zetten ---
  const actx = await browser.newContext();
  const apage = await actx.newPage();
  await login(apage, "admin@zzp-platform.local");
  await apage.goto("/ideeen");
  const adminCard = apage.locator("li", { hasText: "Donkere modus voor het hele platform" });
  await adminCard.getByRole("combobox").selectOption("PLANNED");
  await adminCard.getByRole("button", { name: "Opslaan" }).click();
  // De statusbadge (vóór de select in de DOM) toont nu "Gepland".
  await expect(adminCard.getByText("Gepland").first()).toBeVisible();
  await shot(apage, "ideeen-admin-status");

  await actx.close();
});
