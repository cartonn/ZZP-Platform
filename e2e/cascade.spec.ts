import { expect, test, type Page } from "@playwright/test";
import type { Browser } from "playwright-core";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Cascade Opdrachtgever");
  await page.fill("#companyName", "Cascade BV");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Cascade ZZP'er");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

/**
 * Shared setup: creates client + freelancer, posts a job, freelancer applies,
 * client accepts and proposes collaboration, returns the collaboration URL.
 */
async function setupCollaboration(
  page: Page,
  browser: Browser,
): Promise<{
  collaborationUrl: string;
  fp: Page;
  fctx: Awaited<ReturnType<Browser["newContext"]>>;
}> {
  const title = `Cascade Opdracht ${uniq()}`;
  const clientEmail = `cascade-client-${uniq()}@test.local`;
  const fpEmail = `cascade-free-${uniq()}@test.local`;

  await registerClient(page, clientEmail);

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Test cascade-opdracht voor end-to-end verificatie.");
  await page.getByRole("button", { name: "Opdracht aanmaken" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await registerFreelancer(fp, fpEmail);
  await fp.goto(detailUrl);
  await fp.fill("#motivation", "Ik pas perfect bij dit cascade-project en lever op tijd.");
  await fp.getByRole("button", { name: "Reactie versturen" }).click();
  await fp.waitForURL("**/reacties");

  // Client accepteert en stelt samenwerking voor.
  await page.goto("/kandidaten");
  await page.getByRole("button", { name: "Accepteren" }).click();
  await expect(page.getByText("Samenwerking voorstellen")).toBeVisible();
  await page.locator('input[name="rate"]').fill("85");
  await page.getByRole("button", { name: "Voorstel versturen" }).click();
  await expect(page.getByRole("link", { name: "Bekijk samenwerking" })).toBeVisible({
    timeout: 15000,
  });

  const collabLink = page.getByRole("link", { name: "Bekijk samenwerking" });
  const collaborationUrl = (await collabLink.getAttribute("href")) ?? "";
  await collabLink.click();
  await page.waitForURL("**/samenwerkingen/**");

  return { collaborationUrl, fp, fctx };
}

test("cascade A→E happy path (milestone)", async ({ page, browser }) => {
  test.slow();

  const { collaborationUrl, fp, fctx } = await setupCollaboration(page, browser as Browser);

  // --- Event A: Client ondertekent contract ---
  await expect(page.getByText("Voorgesteld")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Contract ondertekenen" }).click();
  await expect(page.getByText("Actief")).toBeVisible({ timeout: 15000 });
  await shot(page, "cascade-a-contract-signed");

  // --- Event B1: Freelancer dient milestone-prestatie in ---
  await fp.goto(collaborationUrl);
  await expect(fp.getByText("Actief")).toBeVisible({ timeout: 15000 });

  // Selecteer type MILESTONE
  await fp.selectOption('select[name="type"]', "MILESTONE");
  await fp.fill('input[name="amount"]', "1000");
  await fp.fill('input[name="milestoneTitle"]', "Fase 1");
  await fp.fill('input[name="description"]', "Eerste fase opgeleverd");
  await fp.getByRole("button", { name: "Indienen ter goedkeuring" }).click();

  // Wacht op bevestiging: badge "Ter goedkeuring" verschijnt in de prestatielijst
  await expect(fp.getByText("Ter goedkeuring")).toBeVisible({ timeout: 15000 });
  await shot(fp, "cascade-b1-performance-submitted");

  // --- Event B2: Client keurt prestatie goed ---
  await page.reload();
  await expect(page.getByText("Ter goedkeuring")).toBeVisible({ timeout: 15000 });

  // Klik de goedkeuren-knop bij de ingediende prestatie
  const perfCard = page.locator("section").filter({ hasText: "Uren & opleveringen" });
  await perfCard.getByRole("button", { name: "Goedkeuren" }).first().click();

  // Na goedkeuring verschijnt automatisch een concept-factuur
  await expect(page.getByText("Concept").first()).toBeVisible({ timeout: 15000 });
  await shot(page, "cascade-b2-invoice-created");

  // --- Event C: Freelancer dient factuur in ---
  await fp.reload();
  await expect(fp.getByText("Concept").first()).toBeVisible({ timeout: 15000 });

  const invCard = fp.locator("section").filter({ hasText: "Facturen" });
  await invCard.getByRole("button", { name: "Indienen" }).first().click();
  await expect(fp.getByText("Ingediend")).toBeVisible({ timeout: 15000 });
  await shot(fp, "cascade-c-invoice-submitted");

  // --- Event D: Client keurt factuur goed ---
  await page.reload();
  await expect(page.getByText("Ingediend")).toBeVisible({ timeout: 15000 });

  const invSection = page.locator("section").filter({ hasText: "Facturen" });
  await invSection.getByRole("button", { name: "Goedkeuren" }).first().click();
  await expect(page.getByText("Goedgekeurd")).toBeVisible({ timeout: 15000 });
  await shot(page, "cascade-d-invoice-approved");

  // --- Event E: Freelancer registreert betaling ---
  await fp.reload();
  await expect(fp.getByText("Goedgekeurd")).toBeVisible({ timeout: 15000 });

  const invSectionFp = fp.locator("section").filter({ hasText: "Facturen" });
  await invSectionFp.getByRole("button", { name: "Betaling ontvangen" }).first().click();

  // Betaald of Verwerkt — beide zijn eindstatus
  await expect(fp.getByText(/Betaald|Verwerkt/).first()).toBeVisible({ timeout: 15000 });
  await shot(fp, "cascade-e-payment-confirmed");

  await fctx.close();
});

test("cascade afkeuren prestatie en opnieuw indienen (uren)", async ({ page, browser }) => {
  test.slow();

  const { collaborationUrl, fp, fctx } = await setupCollaboration(page, browser as Browser);

  // --- Event A: Contract ondertekenen ---
  await page.getByRole("button", { name: "Contract ondertekenen" }).click();
  await expect(page.getByText("Actief")).toBeVisible({ timeout: 15000 });

  // --- Event B1: Freelancer dient uren in ---
  await fp.goto(collaborationUrl);
  await expect(fp.getByText("Actief")).toBeVisible({ timeout: 15000 });

  // Type blijft HOURS (standaard); vul uren + periode in
  await fp.fill('input[name="hours"]', "8");
  await fp.fill('input[name="periodStart"]', "2026-01-06");
  await fp.fill('input[name="periodEnd"]', "2026-01-06");
  await fp.fill('input[name="description"]', "Week 1");
  await fp.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
  await expect(fp.getByText("Ter goedkeuring")).toBeVisible({ timeout: 15000 });
  await shot(fp, "cascade-reject-b1-submitted");

  // --- Client keurt af ---
  await page.reload();
  await expect(page.getByText("Ter goedkeuring")).toBeVisible({ timeout: 15000 });

  const perfCard = page.locator("section").filter({ hasText: "Uren & opleveringen" });
  await perfCard.locator('input[name="reason"]').first().fill("Uren kloppen niet");
  await perfCard.getByRole("button", { name: "Afkeuren" }).first().click();
  await expect(page.getByText("Afgekeurd")).toBeVisible({ timeout: 15000 });
  await shot(page, "cascade-reject-rejected");

  // --- Reden is zichtbaar voor freelancer ---
  await fp.reload();
  await expect(fp.getByText("Afgekeurd")).toBeVisible({ timeout: 15000 });
  await expect(fp.getByText("Uren kloppen niet")).toBeVisible({ timeout: 15000 });
  await shot(fp, "cascade-reject-reason-visible");

  // --- Freelancer dient opnieuw in ---
  await fp.fill('input[name="hours"]', "8");
  await fp.fill('input[name="periodStart"]', "2026-01-06");
  await fp.fill('input[name="periodEnd"]', "2026-01-06");
  await fp.fill('input[name="description"]', "Week 1 (gecorrigeerd)");
  await fp.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
  await expect(fp.getByText("Ter goedkeuring")).toBeVisible({ timeout: 15000 });

  // --- Client keurt nu goed ---
  await page.reload();
  await expect(page.getByText("Ter goedkeuring")).toBeVisible({ timeout: 15000 });

  const perfCard2 = page.locator("section").filter({ hasText: "Uren & opleveringen" });
  await perfCard2.getByRole("button", { name: "Goedkeuren" }).first().click();
  await expect(page.getByText("Goedgekeurd").first()).toBeVisible({ timeout: 15000 });
  await shot(page, "cascade-reject-resubmit-approved");

  await fctx.close();
});

test("cascade dispuut bevriest werkproces", async ({ page, browser }) => {
  test.slow();

  const { collaborationUrl, fp, fctx } = await setupCollaboration(page, browser as Browser);

  // --- Contract ondertekenen ---
  await page.getByRole("button", { name: "Contract ondertekenen" }).click();
  await expect(page.getByText("Actief")).toBeVisible({ timeout: 15000 });

  // --- Freelancer dient milestone in ---
  await fp.goto(collaborationUrl);
  await expect(fp.getByText("Actief")).toBeVisible({ timeout: 15000 });
  await fp.selectOption('select[name="type"]', "MILESTONE");
  await fp.fill('input[name="amount"]', "2000");
  await fp.fill('input[name="milestoneTitle"]', "Fase A");
  await fp.fill('input[name="description"]', "Oplevering fase A");
  await fp.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
  await expect(fp.getByText("Ter goedkeuring")).toBeVisible({ timeout: 15000 });

  // --- Client keurt goed (auto-factuur aangemaakt) ---
  await page.reload();
  const perfCard = page.locator("section").filter({ hasText: "Uren & opleveringen" });
  await perfCard.getByRole("button", { name: "Goedkeuren" }).first().click();
  await expect(page.getByText("Concept").first()).toBeVisible({ timeout: 15000 });

  // --- Freelancer dient factuur in ---
  await fp.reload();
  await expect(fp.getByText("Concept").first()).toBeVisible({ timeout: 15000 });
  const invCard = fp.locator("section").filter({ hasText: "Facturen" });
  await invCard.getByRole("button", { name: "Indienen" }).first().click();
  await expect(fp.getByText("Ingediend")).toBeVisible({ timeout: 15000 });

  // --- Freelancer opent een dispuut ---
  // Open het details-element "Probleem melden / dispuut openen"
  await fp.locator("details").filter({ hasText: "Probleem melden" }).click();
  await fp.locator('input[name="reason"]').fill("Factuur klopt niet, bedrag onjuist");
  await fp.getByRole("button", { name: "Dispuut openen" }).click();

  // Wacht op bevroren-melding
  await expect(fp.getByText("Dispuut open — werkproces bevroren")).toBeVisible({ timeout: 15000 });
  await shot(fp, "cascade-dispute-frozen");

  // Goedkeuren/betaling-knoppen zijn geblokkeerd (factuur-actieknoppen verdwenen)
  await page.reload();
  await expect(page.getByText("Dispuut open — werkproces bevroren")).toBeVisible({
    timeout: 15000,
  });
  // De goedkeuren-knop voor de factuur mag niet meer aanwezig zijn
  await expect(
    page
      .locator("section")
      .filter({ hasText: "Facturen" })
      .getByRole("button", { name: "Goedkeuren" }),
  ).not.toBeVisible();
  await shot(page, "cascade-dispute-client-view");

  // --- Admin logt in en lost dispuut op ---
  const actx = await browser.newContext();
  const ap = await actx.newPage();
  await ap.goto("/login");
  await ap.fill("#email", "admin@zzp-platform.local");
  await ap.fill("#password", "demo1234");
  await ap.getByRole("button", { name: "Inloggen" }).click();
  await ap.waitForURL("**/dashboard");

  await ap.goto("/admin/disputen");
  // Dispuut staat in de lijst; klik door naar het werkproces
  await ap
    .getByRole("link", { name: /Open werkproces/ })
    .first()
    .click();
  await ap.waitForURL("**/samenwerkingen/**");
  await expect(ap.getByText("Dispuut open — werkproces bevroren")).toBeVisible({ timeout: 15000 });

  // Admin lost op
  await ap.getByRole("button", { name: "Dispuut oplossen" }).click();
  await expect(ap.getByText("Dispuut open — werkproces bevroren")).not.toBeVisible({
    timeout: 15000,
  });
  await shot(ap, "cascade-dispute-resolved");

  await actx.close();
  await fctx.close();
});
