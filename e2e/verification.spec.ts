import { expect, test, type Locator, type Page, type Request } from "@playwright/test";
import path from "node:path";
import { clickUntil } from "./_robust";
import { PDFDocument } from "pdf-lib";

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
// A renderable synthetic document; these tests never claim an external authority validated it.
async function sampleDocument() {
  const document = await PDFDocument.create();
  document.addPage().drawText("Synthetic browser fixture - not an official certificate");
  return {
    name: "bewijs.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await document.save()),
  };
}

async function confirmReview(card: Locator, method: string) {
  await card.getByLabel("Controlemethode").selectOption(method);
  for (const name of ["original", "person", "authenticity", "scope"]) {
    await card.locator(`input[name="${name}"]`).check();
  }
}
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
  await page.setInputFiles("#document", await sampleDocument());
  await page.getByRole("button", { name: "Certificaat toevoegen" }).click();
  await page.waitForURL("**/certificaten");
  // Wacht tot de client gehydrateerd is: een server-action-form werkt pas dan; een klik
  // direct na de navigatie zou anders verloren gaan. (Deterministischer dan networkidle.)
  await hydrated(page);

  const card = page.locator("div.bg-card", { hasText: opts.title });
  await clickUntil(
    card.getByRole("button", { name: "Verificatie aanvragen" }),
    card.locator("span").filter({ hasText: /^In beoordeling$/ }),
  );
}

test("admin controleert checklist en wijst af via drawer; ZZP'er ziet uitkomst en VOG-retentie", async ({
  page,
  browser,
}) => {
  test.slow();
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
  const approveCard = admin.locator("div.bg-card", { hasText: approveTitle });
  await expect(approveCard.locator('[data-seal="pending"]').first()).toBeVisible();
  await expect(approveCard.locator('[data-seal="verified"]')).toHaveCount(0);
  const documentHref = (await approveCard
    .getByRole("link", { name: "Downloaden" })
    .getAttribute("href"))!;
  expect(documentHref).toMatch(/^\/api\/documents\//);
  const documentResponse = await admin.request.get(documentHref);
  expect(documentResponse.status()).toBe(200);
  expect(documentResponse.headers()["content-type"]).toContain("application/pdf");
  expect((await documentResponse.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  await approveCard.getByRole("button", { name: "Bewijsstuk bekijken" }).click();
  await expect(approveCard.locator('object[aria-label="Bewijsstuk (PDF)"]')).toHaveAttribute(
    "data",
    documentHref,
  );

  // Required controls block an incomplete decision; changing the method invalidates every check.
  await expect(approveCard.getByRole("checkbox")).toHaveCount(4);
  for (const checkbox of await approveCard.getByRole("checkbox").all()) {
    await expect(checkbox).not.toBeChecked();
    expect(await checkbox.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(
      true,
    );
  }
  await confirmReview(approveCard, "DIGITAL_VOG");
  await approveCard.getByLabel("Controlemethode").selectOption("ORIGINAL_PAPER");
  for (const checkbox of await approveCard.getByRole("checkbox").all())
    await expect(checkbox).not.toBeChecked();
  await expect(
    approveCard.getByText("Ik heb het fysieke origineel persoonlijk gezien.", { exact: true }),
  ).toBeVisible();
  await confirmReview(approveCard, "DIGITAL_VOG");
  await expect(approveCard.getByRole("link", { name: /Open validatie.nl/ })).toHaveAttribute(
    "href",
    "https://www.validatie.nl/",
  );
  await shot(admin, "20-admin-queue");
  // One approval must update the current queue without a document reload or retry click.
  let documentNavigations = 0;
  const recordNavigation = (request: Request) => {
    if (request.isNavigationRequest() && request.frame() === admin.mainFrame()) {
      documentNavigations += 1;
    }
  };
  admin.on("request", recordNavigation);
  try {
    await approveCard.getByRole("button", { name: "Goedkeuren", exact: true }).click();
    await expect(approveCard).toHaveCount(0);
    await expect(admin.getByText(rejectTitle)).toBeVisible();
    expect(documentNavigations).toBe(0);
  } finally {
    admin.off("request", recordNavigation);
  }

  // The action centre renders the same review form in its actual document drawer.
  await admin.goto("/acties");
  await hydrated(admin);
  const rejectTask = admin.locator("li", { hasText: rejectTitle });
  await expect(rejectTask).toBeVisible();
  await rejectTask.getByRole("button", { name: "Beoordelen" }).click();
  const rejectCard = admin.getByRole("dialog");
  await expect(rejectCard).toBeVisible();
  const rejectDocument = (await rejectCard
    .getByRole("link", { name: /Open bewijsstuk/ })
    .getAttribute("href"))!;
  expect((await admin.request.get(rejectDocument)).status()).toBe(200);
  await expect(rejectCard.getByLabel("Controlemethode")).toHaveValue("DUO_EXTRACT");
  await expect(rejectCard.getByLabel("Reden van afwijzing")).toHaveCount(0);
  await rejectCard.getByRole("button", { name: "Afwijzen…", exact: true }).click();
  const reason = rejectCard.getByLabel("Reden van afwijzing");
  await expect(reason).toBeVisible();
  expect(await reason.evaluate((input: HTMLTextAreaElement) => input.validity.valueMissing)).toBe(
    true,
  );
  await reason.fill("Document is onleesbaar, upload een duidelijke scan.");
  await rejectCard.getByRole("button", { name: "Bevestig afwijzing", exact: true }).click();
  await expect(rejectTask).toHaveCount(0, { timeout: 20000 });
  await expect(rejectCard).toHaveCount(0);
  await shot(admin, "20-admin-drawer-beoordeeld");
  // VOG metadata retention removes the private original after the recorded decision.
  expect((await admin.request.get(documentHref)).status()).toBe(404);
  await adminCtx.close();

  // ZZP'er ziet de uitkomsten.
  await page.goto("/certificaten");
  const approved = page.locator("div.bg-card", { hasText: approveTitle });
  await expect(approved.getByText("Geverifieerd", { exact: true })).toBeVisible();
  await expect(approved.locator('[data-approval="approved"]')).toBeVisible();
  await expect(
    approved.getByText(/bestand verwijderd, we bewaren alleen deze registratie/),
  ).toBeVisible();
  await expect(approved.getByRole("link", { name: /Bewijsstuk/ })).toHaveCount(0);
  await approved.locator("summary", { hasText: "Verificatiehistorie" }).click();
  await expect(approved.getByText(/Digitale VOG · handmatig gecontroleerd/)).toBeVisible();
  expect((await page.request.get(documentHref)).status()).toBe(404);
  const rejected = page.locator("div.bg-card", { hasText: rejectTitle });
  await expect(rejected.getByText("Afgewezen", { exact: true })).toBeVisible();
  await expect(rejected.locator('[data-approval="approved"]')).toHaveCount(0);
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

test("verlopen bewijsstuk kan ook met volledige checklist niet worden goedgekeurd", async ({
  page,
  browser,
}) => {
  test.slow();
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
  const review = admin.locator("div.bg-card", { hasText: title });
  await confirmReview(review, "ISSUER");
  await review.getByRole("button", { name: "Goedkeuren", exact: true }).click();
  await expect(review.getByRole("alert")).toContainText("Dit bewijsstuk is verlopen");
  await expect(review.locator('[data-seal="pending"]').first()).toBeVisible();
  await expect(review.locator('[data-seal="verified"]')).toHaveCount(0);
  await admin.reload();
  await expect(admin.locator("div.bg-card", { hasText: title })).toBeVisible();
  await adminCtx.close();

  await page.goto("/certificaten");
  const submitted = page.locator("div.bg-card", { hasText: title });
  await expect(submitted.getByText("In beoordeling", { exact: true })).toBeVisible();
  await expect(submitted.getByText("Geverifieerd", { exact: true })).toHaveCount(0);
  await expect(submitted.locator('[data-approval="approved"]')).toHaveCount(0);
  const retained = (await submitted
    .getByRole("link", { name: /Bewijsstuk/ })
    .getAttribute("href"))!;
  expect((await page.request.get(retained)).status()).toBe(200);
});
