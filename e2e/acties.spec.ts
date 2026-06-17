import { expect, test, type Page } from "@playwright/test";
import type { Browser } from "playwright-core";
import path from "node:path";
import { clickUntil, clickUntilGone, clickForUrl } from "./_robust";

// Verifieert de kernbelofte van het Actiecentrum: op /acties klik je een actie aan, het werk wordt
// daar meteen gedaan (echte server-actie, geen demo), en de afgehandelde taak verdwijnt vanzelf —
// auto-advance via revalidate. Getest voor zowel één-klik (contract tekenen) als goedkeuren
// (ingediende prestatie). Hergebruikt de robuuste klik-helpers (pre-hydratie-race).

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const hydrated = async (p: Page) => {
  const pathname = new URL(p.url()).pathname;
  await p.waitForSelector(`html[data-hydrated="${pathname}"]`, { timeout: 10000 });
};

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Acties Opdrachtgever");
  await page.fill("#companyName", "Acties BV");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Acties ZZP'er");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

/** Client + freelancer + opdracht + reactie + geaccepteerd voorstel → een VOORGESTELDE samenwerking. */
async function setupCollaboration(
  page: Page,
  browser: Browser,
): Promise<{
  collaborationUrl: string;
  fp: Page;
  fctx: Awaited<ReturnType<Browser["newContext"]>>;
}> {
  const title = `Acties Opdracht ${uniq()}`;
  await registerClient(page, `acties-client-${uniq()}@test.local`);

  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Test-opdracht voor het Actiecentrum (end-to-end).");
  await clickUntil(
    page.getByRole("button", { name: "Opdracht aanmaken" }),
    page.getByRole("heading", { name: title }),
  );
  const detailUrl = page.url();
  await clickUntil(
    page.getByRole("button", { name: "Publiceren" }),
    page.getByText("Gepubliceerd"),
  );

  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await registerFreelancer(fp, `acties-free-${uniq()}@test.local`);
  await fp.goto(detailUrl);
  await fp.fill("#motivation", "Ik pas perfect bij deze opdracht en lever op tijd.");
  await clickForUrl(fp.getByRole("button", { name: "Reactie versturen" }), fp, "**/reacties");

  await page.goto("/kandidaten");
  await clickUntil(
    page.getByRole("button", { name: "Accepteren" }),
    page.getByText("Samenwerking voorstellen"),
  );
  await page.locator('input[name="rate"]').fill("85");
  await clickUntil(
    page.getByRole("button", { name: "Voorstel versturen" }),
    page.getByRole("link", { name: "Bekijk samenwerking" }),
  );

  await page.goto("/samenwerkingen");
  await hydrated(page);
  const detailLink = page
    .locator("div.bg-card", { hasText: title })
    .locator('a[href^="/samenwerkingen/"]')
    .first();
  const collaborationUrl = (await detailLink.getAttribute("href")) ?? "";

  return { collaborationUrl, fp, fctx };
}

test("actiecentrum: contract tekenen lost de taak op en advanced", async ({ page, browser }) => {
  test.slow();
  const { collaborationUrl, fctx } = await setupCollaboration(page, browser as Browser);

  // Het te-tekenen contract verschijnt als afhandelbare taak in het Actiecentrum.
  await page.goto("/acties");
  await hydrated(page);
  const signTask = page.locator("li", { hasText: "Contract ondertekenen" });
  await expect(signTask).toBeVisible({ timeout: 15000 });
  await shot(page, "acties-gevuld");

  // Inline ondertekenen → na revalidate verdwijnt de taak (auto-advance, geen navigatie nodig).
  await clickUntilGone(
    signTask.getByRole("button", { name: "Onderteken" }),
    page.locator("li", { hasText: "Contract ondertekenen" }),
  );

  // De actie deed écht het werk: de samenwerking is nu actief.
  await page.goto(collaborationUrl);
  await expect(page.getByText("Actief")).toBeVisible({ timeout: 15000 });

  await fctx.close();
});

test("actiecentrum: ingediende prestatie beoordelen + goedkeuren via drawer", async ({
  page,
  browser,
}) => {
  test.slow();
  const { collaborationUrl, fp, fctx } = await setupCollaboration(page, browser as Browser);

  // Voorwaarde: contract actief, daarna dient de freelancer uren in.
  await page.goto(collaborationUrl);
  await clickUntil(
    page.getByRole("button", { name: "Contract ondertekenen" }),
    page.getByText("Actief"),
  );

  await fp.goto(collaborationUrl);
  await expect(fp.getByText("Actief")).toBeVisible({ timeout: 15000 });
  // Type blijft HOURS (standaard). Wacht op hydratie zodat de controlled inputs stabiel zijn,
  // dan één keer invullen + indienen (zelfde bewezen patroon als cascade.spec — geen herhaal-lus
  // die dubbele prestaties zou aanmaken).
  await hydrated(fp);
  await fp.fill('input[name="hours"]', "8");
  await fp.fill('input[name="periodStart"]', "2026-01-06");
  await fp.fill('input[name="periodEnd"]', "2026-01-06");
  await fp.fill('input[name="description"]', "Week 1");
  await fp.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
  await expect(fp.getByText("Ter goedkeuring").first()).toBeVisible({ timeout: 15000 });

  // Client opent /acties → "Beoordelen" opent de drawer met de urendetails (eerst inzien).
  await page.goto("/acties");
  await hydrated(page);
  const approveTask = page.locator("li", { hasText: "Keur de ingediende uren" });
  await expect(approveTask).toBeVisible({ timeout: 15000 });
  await approveTask.getByRole("button", { name: "Beoordelen" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();

  // De urenstaat is als echte PDF te openen + wordt geserveerd (geauthenticeerd, application/pdf, %PDF).
  const pdfLink = drawer.getByRole("link", { name: /Open urenstaat/ });
  await expect(pdfLink).toBeVisible();
  const pdfResp = await page.request.get((await pdfLink.getAttribute("href"))!);
  expect(pdfResp.status()).toBe(200);
  expect(pdfResp.headers()["content-type"]).toContain("application/pdf");
  expect((await pdfResp.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  // Pas na inzien goedkeuren → drawer sluit, taak verdwijnt (auto-advance).
  await drawer.getByRole("button", { name: "Goedkeuren" }).click();
  await expect(page.locator("li", { hasText: "Keur de ingediende uren" })).toHaveCount(0, {
    timeout: 15000,
  });
  await shot(page, "acties-na-goedkeuren");

  await fctx.close();
});

test("actiecentrum: identiteit inline verifiëren via de drawer", async ({ page }) => {
  test.slow();
  // registerFreelancer registreert met naam "Acties ZZP'er"; de iDIN-verifier vereist een match.
  const legalName = "Acties ZZP'er";
  await registerFreelancer(page, `acties-ident-${uniq()}@test.local`);

  await page.goto("/acties");
  await hydrated(page);
  const task = page.locator("li", { hasText: "Verifieer je identiteit" });
  await expect(task).toBeVisible({ timeout: 15000 });

  // Open de drawer en handel de actie ter plekke af (geen navigatie weg van /acties).
  await task.getByRole("button", { name: "Afronden" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await drawer.getByLabel("Juridische naam").fill(legalName);
  await drawer.getByRole("button", { name: "Verifieer identiteit (iDIN)" }).click();

  // Auto-advance: na succes sluit de drawer en verdwijnt de taak uit de lijst.
  await expect(page.locator("li", { hasText: "Verifieer je identiteit" })).toHaveCount(0, {
    timeout: 15000,
  });
  await shot(page, "acties-drawer-identiteit");
});

test("actiecentrum: dashboard-zone handelt inline af + advanced", async ({ page, browser }) => {
  test.slow();
  await setupCollaboration(page, browser as Browser);

  // Het actiecentrum toont het te-tekenen contract als inline-actie (de dashboard-rail linkt
  // hiernaartoe; inline-afhandeling leeft op /acties).
  await page.goto("/acties");
  await hydrated(page);
  const signRow = page.locator("li", { hasText: "Contract ondertekenen" });
  await expect(signRow).toBeVisible({ timeout: 15000 });
  await shot(page, "acties-dashboard-zone");

  // Inline ondertekenen vanaf het dashboard → de taak verdwijnt (auto-advance via revalidate).
  await clickUntilGone(
    signRow.getByRole("button", { name: "Onderteken" }),
    page.locator("li", { hasText: "Contract ondertekenen" }),
  );
});

test("actiecentrum: factuur beoordelen — PDF openen + goedkeuren", async ({ page, browser }) => {
  test.slow();
  const { collaborationUrl, fp, fctx } = await setupCollaboration(page, browser as Browser);

  // Contract actief.
  await page.goto(collaborationUrl);
  await clickUntil(
    page.getByRole("button", { name: "Contract ondertekenen" }),
    page.getByText("Actief"),
  );

  // Freelancer dient uren in.
  await fp.goto(collaborationUrl);
  await expect(fp.getByText("Actief")).toBeVisible({ timeout: 15000 });
  await hydrated(fp);
  await fp.fill('input[name="hours"]', "8");
  await fp.fill('input[name="periodStart"]', "2026-01-06");
  await fp.fill('input[name="periodEnd"]', "2026-01-06");
  await fp.fill('input[name="description"]', "Week 1");
  await fp.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
  await expect(fp.getByText("Ter goedkeuring").first()).toBeVisible({ timeout: 15000 });

  // Client keurt de prestatie goed via het Actiecentrum (bewezen drawer-flow) → concept-factuur.
  await page.goto("/acties");
  await hydrated(page);
  const perfTask = page.locator("li", { hasText: "Keur de ingediende uren" });
  await expect(perfTask).toBeVisible({ timeout: 15000 });
  await perfTask.getByRole("button", { name: "Beoordelen" }).click();
  const perfDrawer = page.getByRole("dialog");
  await expect(perfDrawer).toBeVisible();
  await perfDrawer.getByRole("button", { name: "Goedkeuren" }).click();
  await expect(page.locator("li", { hasText: "Keur de ingediende uren" })).toHaveCount(0, {
    timeout: 15000,
  });

  // Freelancer dient de factuur in (wacht eerst tot de concept-factuur zichtbaar is, zoals cascade.spec).
  await fp.reload();
  await expect(fp.getByText("Concept").first()).toBeVisible({ timeout: 15000 });
  const invCard = fp.locator("section").filter({ hasText: "Facturen" });
  // Resultaat scopen tot de factuur-sectie: een losse getByText("Ingediend") matcht elders op de
  // pagina (substring) waardoor clickUntil zou denken dat het al klaar is en niet zou klikken.
  await clickUntil(
    invCard.getByRole("button", { name: "Indienen" }).first(),
    invCard.getByText("Ingediend"),
  );

  // Client opent /acties → factuur beoordelen → de factuur-PDF.
  await page.goto("/acties");
  await hydrated(page);
  const task = page.locator("li", { hasText: "Keur de ingediende factuur" });
  await expect(task).toBeVisible({ timeout: 15000 });
  await task.getByRole("button", { name: "Beoordelen" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  const pdfLink = drawer.getByRole("link", { name: /Open factuur/ });
  await expect(pdfLink).toBeVisible();

  // De factuur-PDF wordt echt geserveerd (geauthenticeerd, application/pdf, %PDF-header).
  const href = await pdfLink.getAttribute("href");
  const resp = await page.request.get(href!);
  expect(resp.status()).toBe(200);
  expect(resp.headers()["content-type"]).toContain("application/pdf");
  const body = await resp.body();
  expect(body.subarray(0, 5).toString("latin1")).toBe("%PDF-");

  // Pas na inzien goedkeuren → de taak verdwijnt (auto-advance).
  await drawer.getByRole("button", { name: "Goedkeuren" }).click();
  await expect(page.locator("li", { hasText: "Keur de ingediende factuur" })).toHaveCount(0, {
    timeout: 15000,
  });
  await shot(page, "acties-factuur-pdf");

  await fctx.close();
});
