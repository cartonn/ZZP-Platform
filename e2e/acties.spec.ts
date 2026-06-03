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

test("actiecentrum: ingediende prestatie inline goedkeuren", async ({ page, browser }) => {
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

  // Client opent /acties → keurt de ingediende uren inline goed → de taak verdwijnt.
  await page.goto("/acties");
  await hydrated(page);
  const approveTask = page.locator("li", { hasText: "Keur de ingediende uren" });
  await expect(approveTask).toBeVisible({ timeout: 15000 });
  await clickUntilGone(
    approveTask.getByRole("button", { name: "Goedkeuren" }),
    page.locator("li", { hasText: "Keur de ingediende uren" }),
  );
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
