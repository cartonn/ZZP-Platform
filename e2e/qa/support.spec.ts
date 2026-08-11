import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// Verifieert het Support/Helpdesk-systeem: auto-antwoord vs escalatie, en de admin-wachtrij.
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

async function newTicket(page: Page, subject: string, body: string) {
  await page.goto("/support/nieuw");
  await page.fill("#subject", subject);
  await page.fill("#body", body);
  await page.getByRole("button", { name: "Vraag versturen" }).click();
  await page.waitForURL(/\/support\/[a-z0-9]+/i);
}

test.describe("QA: Support / Helpdesk", () => {
  test("nergens het woord 'AI' op het supportscherm", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await page.goto("/support");
    const body = await page.locator("body").innerText();
    expect(body.match(/\bAI\b/g)).toBeNull();
  });

  test("factuurvraag wordt direct beantwoord door de Support-assistent", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await newTicket(page, "Vraag over mijn factuur", "Is de betaling van mijn factuur al binnen?");
    await expect(page.getByText("Support-assistent")).toBeVisible();
    await expect(page.getByText("Beantwoord")).toBeVisible();
    await shot(page, "support-auto-answered");
  });

  test("privacy-verzoek wordt geëscaleerd naar de helpdesk", async ({ page }) => {
    await login(page, "zzp@zzp-platform.local");
    await newTicket(
      page,
      "AVG-verzoek",
      "Ik wil graag mijn persoonsgegevens laten verwijderen volgens de AVG.",
    );
    await expect(page.getByText("Bij de helpdesk", { exact: true })).toBeVisible();
    await expect(page.getByText(/staat bij de helpdesk/i)).toBeVisible();
    await shot(page, "support-escalated");
  });

  test("admin ziet geëscaleerde tickets in de helpdesk-wachtrij", async ({ page, browser }) => {
    // Maak eerst een geëscaleerd ticket als ZZP'er.
    await login(page, "zzp@zzp-platform.local");
    await newTicket(page, "AVG verwijderverzoek", "Verwijder mijn persoonsgegevens (AVG).");

    // Open de admin-wachtrij in een verse context. De ticket-submit hierboven kan door #329 een
    // response laten hangen; dezelfde pagina na clearCookies hergebruiken maakt de login dan
    // afhankelijk van die oude navigatie.
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    try {
      await login(adminPage, "admin@zzp-platform.local");
      await adminPage.goto("/admin/support");
      await expect(adminPage.getByRole("heading", { name: "Helpdesk" })).toBeVisible();
      await expect(adminPage.getByText("AVG verwijderverzoek").first()).toBeVisible();
      await shot(adminPage, "support-admin-queue");
    } finally {
      await adminContext.close();
    }
  });
});
