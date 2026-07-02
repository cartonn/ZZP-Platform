import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("Wet DBA-check: hoog risico live + op detail", async ({ page }) => {
  const title = `DBA Opdracht ${uniq()}`;
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "DBA Opdrachtgever");
  await page.fill("#companyName", "DBA Testbedrijf B.V.");
  await page.fill("#email", `dba-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Langlopende rol binnen het team, vaste roosters.");

  // Twee kernindicatoren → HOOG (live preview, dezelfde pure functie als de server).
  await page.getByRole("checkbox", { name: /directe aansturing/ }).check();
  await page.getByRole("checkbox", { name: /structureel ingebed/ }).check();
  await expect(page.getByText("Hoog DBA-risico")).toBeVisible();
  await expect(page.getByText(/gezagsverhouding/).first()).toBeVisible();
  await shot(page, "34-dba-form");

  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // Server-berekende snapshot zichtbaar op de detailpagina (eigenaar).
  await expect(page.getByRole("heading", { name: "Wet DBA — risico" })).toBeVisible();
  await expect(page.getByText("Hoog DBA-risico")).toBeVisible();
  await expect(page.getByText(/Herzie de opdracht|modelovereenkomst/).first()).toBeVisible();
  await shot(page, "35-dba-detail");
});
