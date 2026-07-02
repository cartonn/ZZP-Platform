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

test("franchise-leads: nieuwe lead vastleggen, loggen, status zetten en naar onboarding", async ({
  page,
}) => {
  await login(page, "franchise@zzp-platform.local");

  // De acquisitie-pijplijn toont de gedemde leads.
  await page.goto("/franchise/leads");
  await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
  await expect(page.getByText("Thuiszorg Het Hoge Noorden").first()).toBeVisible();
  // Elke lead toont het stilte-signaal ("X dagen geen contact" / "Vandaag nog contact gehad").
  await expect(page.getByText(/geen contact|Vandaag nog contact gehad/).first()).toBeVisible();
  await shot(page, "franchise-leads-lijst");

  // Nieuwe lead: het formulier ontvouwt pas na de klik.
  await page.getByRole("button", { name: "Nieuwe lead" }).click();
  const naam = "Woonzorg De Esdoorn";
  await page.fill("#organizationName", naam);
  await page.fill("#contactName", "Karin de Wit");
  await page.fill("#email", "k.dewit@esdoorn.nl");
  await page.getByRole("button", { name: "Lead toevoegen" }).click();

  // Na aanmaken landen we op het lead-detail.
  await expect(page.getByRole("heading", { name: naam })).toBeVisible();

  // Een notitie toevoegen aan het contactlogboek.
  await page.fill("textarea[name='body']", "Eerste belletje — interesse, stuurt vacatures door.");
  await page.getByRole("button", { name: "Notitie toevoegen" }).click();
  await expect(page.getByText("Eerste belletje").first()).toBeVisible();

  // Status van KOUD naar WARM zetten.
  await page.selectOption("select[name='status']", "WARM");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByText("Warm").first()).toBeVisible();
  await shot(page, "franchise-leads-detail");

  // "Wordt klant" leidt naar de onboarding-wizard met de naam alvast ingevuld.
  await page.getByRole("link", { name: /Wordt klant/ }).click();
  await page.waitForURL("**/franchise/opdrachtgevers/nieuw**");
  await expect(page.locator("#companyName")).toHaveValue(naam);
  await shot(page, "franchise-leads-onboarding-prefill");
});
