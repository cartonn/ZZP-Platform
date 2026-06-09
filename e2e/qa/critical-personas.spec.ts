// Kritische-persona's: adversariële e2e die misbruik probeert (IDOR, cross-rol toegang, robuustheid)
// i.p.v. de happy-path. Doel: elke verboden poging geeft 403/404/redirect — NOOIT een 500 en nooit
// data van een andere gebruiker. Aanvulling op de UX-persona-sweep (zie LOOP.md). Gebruikt de geseede
// demo-accounts + de gedeelde helpers. Draai: npx playwright test e2e/qa/critical-personas.spec.ts --project=ci
import { expect, test, type Page } from "@playwright/test";
import { login, ACCOUNTS, uniq } from "./helpers";

const FRANCHISE = "franchise@zzp-platform.local";

const ADMIN_ROUTES = [
  "/admin/gebruikers",
  "/admin/verificaties",
  "/admin/audit",
  "/admin/facturatie",
  "/admin/franchises",
];
const FRANCHISE_ROUTES = [
  "/franchise/opdrachtgevers",
  "/franchise/zzpers",
  "/franchise/facturatie",
  "/franchise/leads",
];

/**
 * Navigeer naar een route die voor de huidige rol verboden zou moeten zijn en eis: geen serverfout
 * (500); geen data van een ander (als `secret` is meegegeven mag die nooit zichtbaar zijn); en
 * toegang geweigerd — 403/404, weg-geredirect, óf de nette niet-gevonden-pagina.
 *
 * NB: `notFound()` geeft in CI (productie) een echte 404; lokaal toont Next dezelfde niet-gevonden-
 * pagina met status 200 (ook de bestaande authorization.spec faalt daardoor lokaal — CI is de waarheid).
 * Daarom telt de zichtbare niet-gevonden-pagina óók als geweigerd.
 */
async function expectDenied(page: Page, url: string, opts?: { secret?: string }) {
  const resp = await page.goto(url).catch(() => null);
  const status = resp?.status() ?? 0;
  expect(status, `geen serverfout (500) op ${url}`).toBeLessThan(500);
  if (opts?.secret) {
    await expect(
      page.getByText(opts.secret),
      `geen data van een andere gebruiker op ${url}`,
    ).toHaveCount(0);
  }
  const onRoute = new URL(page.url()).pathname === url.split("?")[0];
  const notFoundMarker = await page.getByText(/Niet gevonden|bestaat niet|geen toegang/i).count();
  expect(
    status === 403 || status === 404 || !onRoute || notFoundMarker > 0,
    `toegang tot ${url} hoort geweigerd (status ${status}, beland op ${page.url()})`,
  ).toBeTruthy();
}

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

test.describe("ZZP'er — autorisatiegrenzen", () => {
  test("risico privilege-escalatie: ZZP'er bereikt admin-beheerschermen niet", async ({ page }) => {
    await login(page, ACCOUNTS.freelancer);
    for (const r of ADMIN_ROUTES) await expectDenied(page, r);
  });

  test("risico cross-rol datalek: ZZP'er bereikt franchise-schermen niet", async ({ page }) => {
    await login(page, ACCOUNTS.freelancer);
    for (const r of FRANCHISE_ROUTES) await expectDenied(page, r);
  });

  test("robuustheid: onbestaande samenwerking-id geeft 404, geen 500", async ({ page }) => {
    await login(page, ACCOUNTS.freelancer);
    await expectDenied(page, `/samenwerkingen/bestaat-niet-${uniq()}`);
  });
});

test.describe("Opdrachtgever — autorisatiegrenzen & robuustheid", () => {
  test("risico cross-rol: opdrachtgever bereikt admin- en franchise-schermen niet", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.client);
    for (const r of [...ADMIN_ROUTES, ...FRANCHISE_ROUTES]) await expectDenied(page, r);
  });

  test("robuustheid: opdracht zonder titel publiceert niet en geeft geen 500", async ({ page }) => {
    await login(page, ACCOUNTS.client);
    await page.goto("/opdrachten/nieuw");
    await page.fill("#description", "Opdracht zonder titel — validatietest.");
    await page.getByRole("button", { name: "Opdracht aanmaken" }).click();
    await page.waitForTimeout(1500);
    // Zonder titel mag er geen opdracht-detail ontstaan; we blijven op het formulier.
    expect(new URL(page.url()).pathname).toBe("/opdrachten/nieuw");
  });

  test("robuustheid: onbestaande factuur-id geeft 404, geen 500", async ({ page }) => {
    await login(page, ACCOUNTS.client);
    await expectDenied(page, `/facturen/bestaat-niet-${uniq()}`);
  });
});

test.describe("Franchiser — scope & robuustheid", () => {
  test("risico privilege-escalatie: franchiser bereikt admin-beheerschermen niet", async ({
    page,
  }) => {
    await login(page, FRANCHISE);
    for (const r of ADMIN_ROUTES) await expectDenied(page, r);
  });

  test("robuustheid: franchise-dossier met onbestaande id geeft 404, geen 500", async ({
    page,
  }) => {
    await login(page, FRANCHISE);
    await expectDenied(page, `/franchise/zzpers/bestaat-niet-${uniq()}`);
    await expectDenied(page, `/franchise/opdrachtgevers/bestaat-niet-${uniq()}`);
  });
});

test.describe("Admin — beheer & robuustheid", () => {
  test("admin: beheerschermen laden zonder 500", async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    for (const r of ADMIN_ROUTES) {
      const resp = await page.goto(r);
      expect(resp?.status() ?? 0, `admin mag ${r} zien zonder 500`).toBeLessThan(500);
    }
  });

  test("robuustheid: admin-detail met onbestaande id geeft 404, geen 500", async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await expectDenied(page, `/admin/gebruikers/bestaat-niet-${uniq()}`);
  });
});

test.describe("Cross-rol / IDOR (twee browsercontexten)", () => {
  test("IDOR: opdrachtgever B kan concept-opdracht van A niet zien, bewerken of kandidaten openen", async ({
    page,
    browser,
  }) => {
    const title = `IDOR Opdracht ${uniq()}`;
    await registerClient(page, "IDOR A", `idor-a-${uniq()}@test.local`);
    await page.goto("/opdrachten/nieuw");
    await page.fill("#title", title);
    await page.fill("#description", "Privé concept van opdrachtgever A.");
    await page.getByRole("button", { name: "Opdracht aanmaken" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    const detailUrl = new URL(page.url()).pathname; // concept (DRAFT)

    const ctxB = await browser.newContext();
    const b = await ctxB.newPage();
    await registerClient(b, "IDOR B", `idor-b-${uniq()}@test.local`);
    await expectDenied(b, detailUrl, { secret: title });
    await expectDenied(b, `${detailUrl}/bewerken`, { secret: title });
    await expectDenied(b, `${detailUrl}/kandidaten`, { secret: title });
    await ctxB.close();
  });

  test("IDOR: ingelogde ZZP'er kan beheer-/franchise-routes niet gebruiken (geen 500, geen data)", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.freelancer);
    await expectDenied(page, "/admin/audit");
    await expectDenied(page, "/franchise/facturatie");
  });
});
