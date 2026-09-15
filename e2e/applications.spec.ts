import { expect, test, type Page, type Request } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Reactie Opdrachtgever");
  await page.fill("#companyName", "Reactie Testbedrijf B.V.");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Reactie Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

test("ZZP'er reageert en opdrachtgever beheert de kandidaat", async ({ page, browser }) => {
  test.slow();
  const title = `Reactie Opdracht ${uniq()}`;
  await registerClient(page, `reclient-${uniq()}@test.local`);

  // Maak + publiceer een opdracht met een vereist certificaat (voor compliance-demo).
  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Langlopend project, ervaren ontwikkelaar gezocht.");
  await page.selectOption("#workMode", "HYBRID");
  await page.fill("#rateMin", "70");
  await page.fill("#rateMax", "100");
  await page
    .locator("fieldset", { hasText: "Vereiste certificaten" })
    .getByText("VOG", { exact: true })
    .click();
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er (apart) reageert.
  const ctx = await browser.newContext();
  const fp = await ctx.newPage();
  await registerFreelancer(fp, `refree-${uniq()}@test.local`);
  await fp.goto(detailUrl);
  await expect(fp.getByRole("heading", { name: "Reageren op deze opdracht" })).toBeVisible();
  await fp.fill(
    "#motivation",
    "Ik heb ruime ervaring met vergelijkbare projecten en ben direct beschikbaar.",
  );
  await fp.fill("#proposedRate", "85");
  await fp.fill("#availability", "Per direct, 32 uur");
  await shot(fp, "14-apply-form");
  await fp.getByRole("button", { name: "Reactie versturen" }).click();

  await fp.waitForURL("**/reacties");
  await expect(fp.getByText(title)).toBeVisible();
  await expect(fp.getByText("Nieuw")).toBeVisible();
  await expect(fp.getByText(/Match \d+%/)).toBeVisible();
  await expect(fp.getByText("De opdrachtgever heeft je reactie nog niet bekeken.")).toBeVisible();
  await shot(fp, "15-reacties");

  // Tweede reactie op dezelfde opdracht is niet mogelijk.
  await fp.goto(detailUrl);
  await expect(fp.getByText("Je hebt op deze opdracht gereageerd.")).toBeVisible();

  // Opdrachtgever krijgt een melding van de nieuwe reactie.
  await page.goto("/notificaties");
  await expect(page.getByText("Nieuwe reactie").first()).toBeVisible();

  // Opdrachtgever beheert de kandidaat.
  await page.goto("/kandidaten");
  await expect(page.getByText("Reactie Freelancer").first()).toBeVisible();

  // Meedenken: de zijbalk toont vanaf elke pagina dat er een nieuwe reactie wacht.
  const kandidatenNav = page
    .locator('nav[aria-label="Hoofdnavigatie"]')
    .getByRole("link", { name: /Reacties/ });
  await expect(kandidatenNav).toContainText("1");
  await shot(page, "17-nav-badge");

  await expect(page.getByText("Voldoet niet")).toBeVisible(); // geen VOG -> non-compliant (in de compacte kop)
  const candidate = page.locator('[id^="app-"]').filter({ hasText: "Reactie Freelancer" });
  await candidate.getByRole("button", { name: "Toon details" }).click();
  const shortlistButton = candidate.getByRole("button", { name: "Shortlist", exact: true });
  const shortlistStatus = candidate
    .locator('[data-approval="pending"]')
    .filter({ hasText: /^Shortlist$/ });
  // One normal submission must render the server status without a document reload.
  let documentNavigations = 0;
  const recordNavigation = (request: Request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      documentNavigations += 1;
    }
  };
  page.on("request", recordNavigation);
  try {
    await shortlistButton.click();
    await expect(shortlistStatus).toBeVisible();
    await expect(shortlistButton).toBeHidden();
    expect(documentNavigations).toBe(0);
  } finally {
    page.off("request", recordNavigation);
  }
  // De rij kan na de statuswijziging open blijven staan (dan is er geen "Toon details" meer);
  // alleen uitklappen als hij dicht is.
  const noteField = page.locator('textarea[name="note"]');
  if (!(await noteField.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Toon details" }).click();
  }
  await page.fill('textarea[name="note"]', "Sterke kandidaat, uitnodigen voor gesprek.");
  await page.getByRole("button", { name: "Notitie opslaan" }).click();
  await expect(page.locator('textarea[name="note"]')).toHaveValue(
    "Sterke kandidaat, uitnodigen voor gesprek.",
  );
  await shot(page, "16-kandidaten");

  await ctx.close();
});
