import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const SAMPLE = { name: "bewijs.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 bewijsstuk") };

async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Verif Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

async function addAndSubmitCredential(page: Page, opts: { type: string; title: string; issuedAt?: string; expiresAt?: string }) {
  await page.goto("/certificaten/nieuw");
  await page.selectOption("#type", opts.type);
  await page.fill("#title", opts.title);
  if (opts.issuedAt) await page.fill("#issuedAt", opts.issuedAt);
  if (opts.expiresAt) await page.fill("#expiresAt", opts.expiresAt);
  await page.setInputFiles("#document", SAMPLE);
  await page.getByRole("button", { name: "Certificaat toevoegen" }).click();
  await page.waitForURL("**/certificaten");

  const card = page.locator("div.bg-card", { hasText: opts.title });
  await card.getByRole("button", { name: "Verificatie aanvragen" }).click();
  await expect(card.getByText("In beoordeling")).toBeVisible();
}

test("admin keurt goed en wijst af; ZZP'er ziet de uitkomst", async ({ page, browser }) => {
  const approveTitle = `VOG ${uniq()}`;
  const rejectTitle = `Diploma ${uniq()}`;
  await registerFreelancer(page, `verif-${uniq()}@test.local`);
  await addAndSubmitCredential(page, { type: "VOG", title: approveTitle, issuedAt: "2026-01-01", expiresAt: "2030-01-01" });
  await addAndSubmitCredential(page, { type: "DIPLOMA", title: rejectTitle });

  // Admin beoordeelt.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, "admin@zzp-platform.local");
  await admin.goto("/admin/verificaties");
  await expect(admin.getByText(approveTitle)).toBeVisible();
  await expect(admin.getByText(rejectTitle)).toBeVisible();
  // Wachttijd zichtbaar zodat de beheerder kan prioriteren (net ingediend = vandaag).
  await expect(
    admin.locator("div.bg-card", { hasText: approveTitle }).getByText("vandaag ingediend"),
  ).toBeVisible();
  await shot(admin, "20-admin-queue");

  await admin.locator("div.bg-card", { hasText: approveTitle }).getByRole("button", { name: "Goedkeuren" }).click();
  await expect(admin.getByText(approveTitle)).toHaveCount(0); // uit de wachtrij

  const rejectCard = admin.locator("div.bg-card", { hasText: rejectTitle });
  await rejectCard.getByLabel("Reden van afwijzing").fill("Document is onleesbaar, upload een duidelijke scan.");
  await rejectCard.getByRole("button", { name: "Afwijzen" }).click();
  await expect(admin.getByText(rejectTitle)).toHaveCount(0);
  await adminCtx.close();

  // ZZP'er ziet de uitkomsten.
  await page.goto("/certificaten");
  const approved = page.locator("div.bg-card", { hasText: approveTitle });
  await expect(approved.getByText("Geverifieerd", { exact: true })).toBeVisible();
  const rejected = page.locator("div.bg-card", { hasText: rejectTitle });
  await expect(rejected.getByText("Afgewezen", { exact: true })).toBeVisible();
  await expect(rejected.getByText(/Document is onleesbaar/).first()).toBeVisible();
  await shot(page, "21-certificaten-beoordeeld");
});

test("niet-admin krijgt geen toegang tot /admin (route-gate)", async ({ page }) => {
  await registerFreelancer(page, `noadmin-${uniq()}@test.local`);
  await page.goto("/admin/verificaties");
  // Route-gate weert non-admins; ze belanden niet op de verificatiepagina.
  await expect(page).not.toHaveURL(/\/admin\/verificaties/);
  await expect(page.getByText("Beoordeel ingediende certificaten")).toHaveCount(0);
});

test("verlopen VERIFIED-certificaat wordt server-side EXPIRED", async ({ page, browser }) => {
  const title = `Oud Cert ${uniq()}`;
  await registerFreelancer(page, `expiry-${uniq()}@test.local`);
  // Reeds verstreken vervaldatum.
  await addAndSubmitCredential(page, { type: "CERTIFICATE", title, issuedAt: "2019-01-01", expiresAt: "2020-01-01" });

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, "admin@zzp-platform.local");
  await admin.goto("/admin/verificaties");
  await admin.locator("div.bg-card", { hasText: title }).getByRole("button", { name: "Goedkeuren" }).click();
  await expect(admin.getByText(title)).toHaveCount(0);

  // Expiry-actie zet de (verlopen) VERIFIED-credential op EXPIRED.
  await admin.getByRole("button", { name: "Verlopen certificaten verwerken" }).click();
  await expect(admin.getByText(/op verlopen gezet/)).toBeVisible();
  await adminCtx.close();

  await page.goto("/certificaten");
  await expect(page.locator("div.bg-card", { hasText: title }).getByText("Verlopen", { exact: true })).toBeVisible();
});
