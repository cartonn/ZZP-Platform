import { expect, test, type Page } from "@playwright/test";

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerClient(page: Page, name: string, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", name);
  await page.fill("#companyName", `${name} B.V.`);
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

// RLS-intent op de app-laag: een opdrachtgever mag opdrachten van een andere opdrachtgever
// niet zien of bewerken (IDOR-weigering, server-side afgedwongen via ownership/notFound).
test("kruisgebruiker: opdrachtgever B kan opdracht van A niet zien of bewerken", async ({
  page,
  browser,
}) => {
  const title = `Authz Opdracht ${uniq()}`;
  await registerClient(page, "Authz A", `authz-a-${uniq()}@test.local`);
  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Privé concept van opdrachtgever A.");
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const detailUrl = page.url(); // concept (DRAFT), niet gepubliceerd

  const ctxB = await browser.newContext();
  const b = await ctxB.newPage();
  await registerClient(b, "Authz B", `authz-b-${uniq()}@test.local`);

  // Detail van A's concept → 404 (niet-eigenaar, niet gepubliceerd).
  const detailResp = await b.goto(detailUrl);
  expect(detailResp?.status()).toBe(404);

  // Bewerken-pagina van A's opdracht → 404 (ownership-check).
  const editResp = await b.goto(`${detailUrl}/bewerken`);
  expect(editResp?.status()).toBe(404);

  await ctxB.close();
});
