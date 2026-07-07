import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickUntil, clickUntilGone } from "./_robust";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
// Wacht tot de huidige route is gehydrateerd/gecommit (zie HydrationFlag): server-action-knoppen
// reageren pas dan. Nodig na een navigatie, vóór de eerste klik op zo'n knop. De vlag draagt de
// pathname, dus we wachten tot die de huidige URL matcht (betrouwbaar per navigatie).
const hydrated = async (p: Page) => {
  const path = new URL(p.url()).pathname;
  await p.waitForSelector(`html[data-hydrated="${path}"]`, { timeout: 10000 });
};
const SAMPLE = {
  name: "bewijs.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 bewijsstuk"),
};
// DateInput is nu een tekstveld met NL-notatie (dd-mm-jjjj); zet ISO om vóór het invullen.
const nl = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

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

async function addAndSubmitCredential(
  page: Page,
  opts: { type: string; title: string; issuedAt?: string; expiresAt?: string },
) {
  await page.goto("/certificaten/nieuw");
  await page.selectOption("#type", opts.type);
  await page.fill("#title", opts.title);
  if (opts.issuedAt) await page.fill("#issuedAt", nl(opts.issuedAt));
  if (opts.expiresAt) await page.fill("#expiresAt", nl(opts.expiresAt));
  await page.setInputFiles("#document", SAMPLE);
  await page.getByRole("button", { name: "Certificaat toevoegen" }).click();
  await page.waitForURL("**/certificaten");
  // Wacht tot de client gehydrateerd is: een server-action-form werkt pas dan; een klik
  // direct na de navigatie zou anders verloren gaan. (Deterministischer dan networkidle.)
  await hydrated(page);

  const card = page.locator("div.bg-card", { hasText: opts.title });
  await clickUntil(
    card.getByRole("button", { name: "Verificatie aanvragen" }),
    card.getByText("In beoordeling"),
  );
}

test("admin keurt goed en wijst af; ZZP'er ziet de uitkomst", async ({ page, browser }) => {
  const approveTitle = `VOG ${uniq()}`;
  const rejectTitle = `Diploma ${uniq()}`;
  await registerFreelancer(page, `verif-${uniq()}@test.local`);
  await addAndSubmitCredential(page, {
    type: "VOG",
    title: approveTitle,
    issuedAt: "2026-01-01",
    expiresAt: "2030-01-01",
  });
  await addAndSubmitCredential(page, { type: "DIPLOMA", title: rejectTitle });

  // Admin beoordeelt.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, "admin@zzp-platform.local");
  await admin.goto("/admin/verificaties");
  await hydrated(admin); // hydratie afwachten vóór server-action-kliks
  await expect(admin.getByText(approveTitle)).toBeVisible();
  await expect(admin.getByText(rejectTitle)).toBeVisible();
  // Wachttijd zichtbaar zodat de beheerder kan prioriteren (net ingediend = vandaag).
  await expect(
    admin.locator("div.bg-card", { hasText: approveTitle }).getByText("vandaag ingediend"),
  ).toBeVisible();
  await shot(admin, "20-admin-queue");

  await clickUntilGone(
    admin
      .locator("div.bg-card", { hasText: approveTitle })
      .getByRole("button", { name: "Goedkeuren" }),
    admin.getByText(approveTitle), // uit de wachtrij
  );

  // Afwijzen vereist een reden; vul die in en klik tot de kaart de wachtrij verlaat (robuust
  // tegen de pre-hydratie-race en een re-render door de voorgaande goedkeuring).
  const rejectCard = admin.locator("div.bg-card", { hasText: rejectTitle });
  await expect(async () => {
    if ((await admin.getByText(rejectTitle).count()) > 0) {
      await rejectCard
        .getByLabel("Reden van afwijzing")
        .fill("Document is onleesbaar, upload een duidelijke scan.")
        .catch(() => {});
      await rejectCard
        .getByRole("button", { name: "Afwijzen" })
        .click({ timeout: 3000 })
        .catch(() => {});
    }
    await expect(admin.getByText(rejectTitle)).toHaveCount(0, { timeout: 3000 });
  }).toPass({ timeout: 20000 });
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
  await addAndSubmitCredential(page, {
    type: "CERTIFICATE",
    title,
    issuedAt: "2019-01-01",
    expiresAt: "2020-01-01",
  });

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, "admin@zzp-platform.local");
  await admin.goto("/admin/verificaties");
  await hydrated(admin); // hydratie afwachten vóór server-action-kliks
  await clickUntilGone(
    admin.locator("div.bg-card", { hasText: title }).getByRole("button", { name: "Goedkeuren" }),
    admin.getByText(title),
  );

  // Expiry-actie zet de (verlopen) VERIFIED-credential op EXPIRED.
  await admin.getByRole("button", { name: "Verlopen certificaten verwerken" }).click();
  await expect(admin.getByText(/op verlopen gezet/)).toBeVisible();
  await adminCtx.close();

  await page.goto("/certificaten");
  await expect(
    page.locator("div.bg-card", { hasText: title }).getByText("Verlopen", { exact: true }),
  ).toBeVisible();
});
