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

async function waitForRedirectingServerAction(page: Page, expectedPath: string) {
  const response = await page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "POST" &&
      typeof candidate.request().headers()["next-action"] === "string",
    { timeout: 15000 },
  );
  // Next stuurt de redirect in de Server Action-headers. Zodra de router de navigatie
  // overneemt, breekt de browser de oorspronkelijke RSC-stream bewust af (ERR_ABORTED).
  // Wachten op response.finished() zou daardoor juist een gezonde redirect afkeuren.
  expect(response.status()).toBe(303);
  expect(response.headers()["x-action-redirect"]).toContain(`${expectedPath};`);
}

test("opdrachtgever maakt, publiceert en ZZP'er vindt de opdracht", async ({ page, browser }) => {
  // Lange end-to-end flow (client registreren → opdracht maken → publiceren → freelancer registreren →
  // zoeken). Onder CI-runnerbelasting overschreed het geheel het standaard 30s-budget bij de debounced
  // zoek-navigatie (`waitForURL(/[?&]q=/)` op regel ~93) — een timing-flake, geen productdefect. `slow`
  // verdrievoudigt het budget zodat de debounce + RSC-navigatie ruim binnen de deadline valt.
  test.slow();
  const title = `E2E Opdracht ${uniq()}`;
  await registerClient(page, `jobclient-${uniq()}@test.local`);

  // Aanmaken (start als concept).
  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill(
    "#description",
    "We zoeken een ervaren ontwikkelaar voor een langlopend project.",
  );
  await page.selectOption("#workMode", "REMOTE");
  await page.fill("#rateMin", "70");
  await page.fill("#rateMax", "95");
  await page.fill("#location", "Amsterdam");
  await page
    .locator("fieldset", { hasText: "Vereiste skills" })
    .getByText("Wondzorg", { exact: true })
    .click();
  await page
    .locator("fieldset", { hasText: "Vereiste certificaten" })
    .getByText("VOG", { exact: true })
    .click();
  await page.getByRole("button", { name: "Opslaan als concept" }).click();

  // Redirect naar de detailpagina (concept). Wacht op de heading, leg dán de URL vast.
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url();
  await expect(page.getByText("Concept")).toBeVisible();

  // Publiceren via statusactie. De redirect-header én de zichtbare nieuwe status vormen samen
  // de regressiepoort voor issue #329 (DB-write slaagde, maar de UI bleef pending).
  const detailPath = new URL(detailUrl).pathname;
  const publishResponse = waitForRedirectingServerAction(page, detailPath);
  await page.getByRole("button", { name: "Publiceren" }).click();
  await publishResponse;
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
  const card = fp.getByRole("link", {
    name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  });
  await expect(card).toBeVisible();
  await shot(fp, "12-job-browse");

  await card.click();
  await fp.waitForURL(detailUrl);
  await expect(fp.getByRole("heading", { name: title })).toBeVisible({ timeout: 15000 });
  await expect(
    fp.locator("section", { hasText: "Vereiste certificaten" }).getByText("VOG", { exact: true }),
  ).toBeVisible();
  await shot(fp, "13-job-detail-freelancer");

  // Niet-gepubliceerde opdracht is niet zichtbaar voor anderen: depubliceer en check 404.
  await page.goto(detailUrl);
  const unpublishResponse = waitForRedirectingServerAction(page, detailPath);
  await page.getByRole("button", { name: "Terug naar concept" }).click();
  await unpublishResponse;
  // Status is nu concept zodra de "Publiceren"-actie weer verschijnt (eenduidig).
  await expect(page.getByRole("button", { name: "Publiceren" })).toBeVisible();
  // Onder parallelle SQLite-load kan de read kort na de write nog 200 geven; poll tot 404.
  await expect.poll(async () => (await fp.goto(detailUrl))?.status(), { timeout: 10000 }).toBe(404);

  await ctx.close();
});
