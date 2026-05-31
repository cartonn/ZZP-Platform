import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const shot = (p: Page, n: string) =>
  p.screenshot({ path: path.join("e2e", "screenshots", n + ".png"), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("identiteitsverificatie + vertrouwensniveau op publiek profiel", async ({ page }) => {
  await page.goto("/register");
  await page.fill("#name", "Trust Freelancer");
  await page.fill("#email", `trust-${uniq()}@test.local`);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Identiteitsverificatie" })).toBeVisible();

  // Afwijkende naam → fout.
  await page.fill("#legalName", "Iemand Anders");
  await page.getByRole("button", { name: "Verifieer identiteit (iDIN)" }).click();
  await expect(page.getByText(/komt niet overeen/)).toBeVisible();

  // Kloppende naam → geverifieerd.
  await page.fill("#legalName", "Trust Freelancer");
  await page.getByRole("button", { name: "Verifieer identiteit (iDIN)" }).click();
  await expect(page.getByText(/Geverifieerd op/)).toBeVisible();
  await shot(page, "40-account-identity");

  // Vertrouwensniveau zichtbaar op het publieke profiel (identiteit, 0 certs → "Deels geverifieerd").
  await page.goto("/profiel");
  const link = page.getByRole("link", { name: /Bekijk publiek profiel/ });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  await page.goto(href!);
  await expect(page.getByRole("heading", { name: "Trust Freelancer" })).toBeVisible();
  await expect(page.getByText("Deels geverifieerd")).toBeVisible();
});
