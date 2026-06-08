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

test("academie-authoring: beheerder maakt een cursus, voegt een les toe en publiceert", async ({
  page,
}) => {
  await login(page, "admin@zzp-platform.local");

  // Nieuwe cursus aanmaken.
  await page.goto("/academie");
  await page.getByRole("link", { name: "Nieuwe cursus" }).click();
  await page.waitForURL("**/academie/nieuw");
  await page.fill("#title", "Veilig werken met gegevens");
  await page.fill("#summary", "Korte introductie over privacy en gegevensbescherming.");
  await page.getByRole("button", { name: "Cursus aanmaken" }).click();

  // Beland op het cursusdetail (concept).
  await page.waitForURL("**/academie/veilig-werken-met-gegevens");
  await expect(page.getByRole("heading", { name: "Veilig werken met gegevens" })).toBeVisible();
  await shot(page, "authoring-cursus");

  // Een les toevoegen.
  await page.getByRole("link", { name: "Nieuwe les" }).click();
  await page.waitForURL("**/lessen/nieuw");
  await page.fill("#title", "Wat is persoonsgegevens?");
  await page.fill(
    "#body",
    "Persoonsgegevens zijn alle gegevens die te herleiden zijn tot een persoon.",
  );
  await page.getByRole("button", { name: "Les toevoegen" }).click();

  // Terug op het cursusdetail; de les staat in de lijst.
  await page.waitForURL("**/academie/veilig-werken-met-gegevens");
  await expect(page.getByText("Wat is persoonsgegevens?")).toBeVisible();

  // Publiceren.
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();
});
