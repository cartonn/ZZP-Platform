import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// Minimaal niet-leeg "PDF"-bestand; validateUpload controleert mimeType + grootte, niet de inhoud.
const SAMPLE = { name: "bewijs.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test bewijsstuk") };

async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Cert Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

test("credential uploaden, verificatie aanvragen en privé-download afdwingen", async ({ page, browser }) => {
  await registerFreelancer(page, `cert-${uniq()}@test.local`);

  // Credential toevoegen met bewijsstuk.
  await page.goto("/certificaten/nieuw");
  await page.selectOption("#type", "VOG");
  await page.fill("#title", "VOG 2026");
  await page.fill("#issuer", "Justis");
  await page.fill("#issuedAt", "2026-01-15");
  await page.setInputFiles("#document", SAMPLE);
  await page.getByRole("button", { name: "Certificaat toevoegen" }).click();

  await page.waitForURL("**/certificaten");
  await expect(page.getByText("VOG 2026")).toBeVisible();
  await expect(page.getByText("Concept")).toBeVisible();
  await shot(page, "17-certificaten");

  // Verificatie aanvragen: DRAFT -> SUBMITTED (server-side via assertTransition).
  await page.getByRole("button", { name: "Verificatie aanvragen" }).click();
  await expect(page.getByRole("button", { name: "Verificatie aanvragen" })).toHaveCount(0);
  await expect(page.getByText("In beoordeling")).toBeVisible();
  await shot(page, "18-certificaten-submitted");

  // Privé-download: eigenaar mag het bewijsstuk openen (200).
  const href = await page.getByRole("link", { name: /Bewijsstuk/ }).getAttribute("href");
  expect(href).toMatch(/^\/api\/documents\//);
  const ownerResp = await page.context().request.get(href!);
  expect(ownerResp.status()).toBe(200);
  expect(ownerResp.headers()["content-type"]).toContain("application/pdf");

  // Een andere ingelogde gebruiker mag het document NIET openen (403).
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await registerFreelancer(other, `other-${uniq()}@test.local`);
  const otherResp = await ctx.request.get(href!);
  expect(otherResp.status()).toBe(403);
  await ctx.close();
});

test("document uploaden en privé downloaden", async ({ page }) => {
  await registerFreelancer(page, `doc-${uniq()}@test.local`);

  await page.goto("/documenten");
  await page.selectOption("#kind", "CONTRACT");
  await page.setInputFiles("#document", { name: "contract.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 contract") });
  await page.getByRole("button", { name: "Uploaden" }).click();

  await expect(page.getByText("Geüpload.")).toBeVisible();
  await expect(page.getByText("contract.pdf")).toBeVisible();
  await shot(page, "19-documenten");

  const href = await page.getByRole("link", { name: "Openen" }).getAttribute("href");
  const resp = await page.context().request.get(href!);
  expect(resp.status()).toBe(200);
});
