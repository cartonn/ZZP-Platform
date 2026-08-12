import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Verifieert het compliance-dossier per samenwerking (opdrachtgever-ontzorging).
const SHOTS = path.join("e2e", "qa", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("QA: Compliance-dossier", () => {
  test("opdrachtgever ziet het dossier met secties en tijdlijn", async ({ page }) => {
    await login(page, "opdrachtgever@zzp-platform.local");
    await page.goto("/samenwerkingen/collab-1/dossier");
    await expect(page.getByRole("heading", { name: "Compliance-dossier" })).toBeVisible();
    // De zes secties (exacte titels — summaries bevatten dezelfde woorden).
    await expect(page.getByText("Wet DBA-beoordeling", { exact: true })).toBeVisible();
    await expect(page.getByText("Modelovereenkomst", { exact: true })).toBeVisible();
    await expect(page.getByText("Verificatie ZZP'er", { exact: true })).toBeVisible();
    await expect(page.getByText("Facturen & betaalstatus", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tijdlijn" })).toBeVisible();
    // Disclaimer (Besluit 2): geen goedkeuring/vrijwaring.
    await expect(page.getByText(/geen goedkeuring of vrijwaring/i)).toBeVisible();
    await shot(page, "dossier-overzicht");
  });

  test("export levert een bundel met auditeerbare inhoud", async ({ page }) => {
    await login(page, "opdrachtgever@zzp-platform.local");
    const res = await page.request.get("/api/samenwerkingen/collab-1/dossier");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Compliance-dossier");
    expect(body).toContain("Tijdlijn");
  });

  test("een vreemde opdrachtgever krijgt geen toegang tot het dossier", async ({ page }) => {
    // Maak een nieuwe opdrachtgever die collab-1 niet bezit.
    await page.goto("/register");
    await page.getByText("Opdrachtgever", { exact: true }).click();
    await page.fill("#name", "Vreemde BV");
    await page.fill("#companyName", "Vreemde BV");
    await page.fill("#email", `vreemd-${Date.now()}@test.local`);
    await page.fill("#password", "geheim123");
    await page.getByRole("button", { name: "Account aanmaken" }).click();
    await page.waitForURL("**/dashboard");

    // Anti-oracle (CWE-203): een vreemde-maar-geldige id is ononderscheidbaar van een onbekende
    // → 404 (geen 403, dat zou het bestaan verraden).
    const res = await page.request.get("/api/samenwerkingen/collab-1/dossier");
    expect(res.status()).toBe(404);
  });
});
