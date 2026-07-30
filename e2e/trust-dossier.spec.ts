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

test("vertrouwensdossier: deelblok zichtbaar op /certificaten voor ZZP'er met publiek profiel", async ({
  page,
}) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/certificaten");

  // Het deelblok is aanwezig
  const block = page.getByTestId("share-dossier-block");
  await expect(block).toBeVisible();
  await shot(page, "trust-dossier-share-block");

  // De URL is zichtbaar (profiel staat op PUBLIC in de seed)
  const urlEl = page.getByTestId("share-dossier-url");
  await expect(urlEl).toBeVisible();
  const shareUrl = await urlEl.textContent();
  expect(shareUrl).toMatch(/\/vertrouwen\//);

  // Navigeer naar de publieke URL als niet-ingelogde gebruiker
  await page.context().clearCookies();
  await page.goto(shareUrl!.trim());

  // De pagina toont de naam van de ZZP'er
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sanne");

  // Minstens één "Geverifieerd"-badge zichtbaar (seed heeft meerdere VERIFIED credentials)
  await expect(page.getByText("Geverifieerd").first()).toBeVisible();

  // Verificatieverklaring aanwezig
  await expect(page.getByText("Servergeverifieerd door Handslag")).toBeVisible();

  await shot(page, "trust-dossier-public-page");
});

test("vertrouwensdossier: ongeldige token toont neutrale melding", async ({ page }) => {
  // Navigeer met een nep-token naar een bestaand profileId-formaat
  await page.goto("/vertrouwen/clxxxxxxxxxxxxxxxxxxxxxx/0000000000000000000000000000000a");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Dit dossier is niet (meer) gedeeld",
  );
  await shot(page, "trust-dossier-invalid-token");
});
