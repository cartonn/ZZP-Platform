import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Job Opdrachtgever");
  await page.fill("#companyName", "Jobs Testbedrijf B.V.");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Job Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

test("opdrachtgever maakt, publiceert en ZZP'er vindt de opdracht", async ({ page, browser }) => {
  const title = `E2E Opdracht ${uniq()}`;
  await registerClient(page, `jobclient-${uniq()}@test.local`);

  // Aanmaken (start als concept).
  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "We zoeken een ervaren ontwikkelaar voor een langlopend project.");
  await page.selectOption("#workMode", "REMOTE");
  await page.fill("#rateMin", "70");
  await page.fill("#rateMax", "95");
  await page.fill("#location", "Amsterdam");
  await page.locator("fieldset", { hasText: "Vereiste skills" }).getByText("TypeScript", { exact: true }).click();
  await page.locator("fieldset", { hasText: "Vereiste certificaten" }).getByText("VOG", { exact: true }).click();
  await page.getByRole("button", { name: "Opdracht aanmaken" }).click();

  // Redirect naar de detailpagina (concept). Wacht op de heading, leg dán de URL vast.
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await expect(page.getByText("Concept")).toBeVisible();

  // Publiceren via statusactie.
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();
  await shot(page, "11-job-detail-client");

  // Beheeroverzicht toont de opdracht.
  await page.goto("/opdrachten");
  await expect(page.getByText(title)).toBeVisible();
  await shot(page, "10-client-jobs");

  // ZZP'er (apart, anoniem -> registreert) vindt de gepubliceerde opdracht via zoeken.
  const ctx = await browser.newContext();
  const fp = await ctx.newPage();
  await registerFreelancer(fp, `jobfree-${uniq()}@test.local`);
  await fp.goto("/opdrachten");
  await fp.getByLabel("Zoeken").fill(title);
  await fp.waitForURL(/[?&]q=/); // wacht tot de debounced zoekopdracht is toegepast
  const card = fp.getByRole("link", { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
  await expect(card).toBeVisible();
  await shot(fp, "12-job-browse");

  await card.click();
  await fp.waitForURL(detailUrl);
  await expect(fp.getByRole("heading", { name: title })).toBeVisible({ timeout: 15000 });
  await expect(fp.getByText("VOG")).toBeVisible(); // vereist certificaat zichtbaar
  await shot(fp, "13-job-detail-freelancer");

  // Niet-gepubliceerde opdracht is niet zichtbaar voor anderen: depubliceer en check 404.
  await page.goto(detailUrl);
  await page.getByRole("button", { name: "Terug naar concept" }).click();
  await expect(page.getByText("Concept")).toBeVisible();
  const resp = await fp.goto(detailUrl);
  expect(resp?.status()).toBe(404);

  await ctx.close();
});
