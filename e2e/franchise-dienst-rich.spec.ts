import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickForUrl, reloadUntilVisible } from "./_robust";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// Wacht tot de pagina op de huidige route gehydrateerd is: pas dan is de server-action van de
// inline-vorm bedraad. Een klik in de race daarvóór gaat verloren (#329-klasse) → de dienst wordt
// niet aangemaakt en verschijnt nooit. De app zet `html[data-hydrated="<pathname>"]` na hydratie.
const hydrated = async (p: Page) => {
  const pathname = new URL(p.url()).pathname;
  await p.waitForSelector(`html[data-hydrated="${pathname}"]`, { timeout: 10000 });
};

async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

// Een dienst draagt tarief, gevraagde skills en vereiste certificaten — voor matching en compliance.
// Dit zet er één uit via de (rijke) cockpit-inline-vorm en bewijst dat de eisen op de opdracht landen.
test("franchiser zet een dienst uit met tarief, skill en vereiste VOG", async ({ page }) => {
  test.slow();
  await login(page, "franchise@zzp-platform.local");

  // Naar de cockpit van de seed-opdrachtgever met afdeling Geriatrie. #329-robuust: de link-klik
  // kan in de hydratie-race verloren gaan → herhaal tot de navigatie landt (geen dubbele submit,
  // de link verdwijnt na navigatie).
  await page.goto("/franchise/opdrachtgevers");
  await clickForUrl(
    page.getByRole("link", { name: /Verpleeghuis De Noorderbrug/ }),
    page,
    /\/franchise\/opdrachtgevers\/[a-z0-9]+$/,
  );

  // Inline dienst uitzetten met de rijke velden. Wacht op hydratie zodat de form-action bedraad is
  // vóór we openen/insturen — anders gaat de submit-klik verloren in de hydratie-race.
  await hydrated(page);
  await page.getByText("Dienst uitzetten", { exact: true }).click();
  const dienst = `Rijke dienst ${uniq()}`;
  await page.getByLabel("Titel").fill(dienst);
  await page
    .getByLabel("Omschrijving")
    .fill("Nachtdienst geriatrie met duidelijke eisen en tarief.");
  await page.getByLabel("Tarief vanaf (€/uur)").fill("40");
  await page.getByLabel("Tarief tot (€/uur)").fill("55");
  await page.locator('label:has(input[name="skillIds"])').first().click();
  await page.locator('label:has(input[name="credentialTypes"][value="VOG"])').click();
  await page.getByRole("button", { name: "Uitzetten", exact: true }).click();
  // #329-robuust: de action-response kan blijven hangen terwijl de dienst server-side is aangemaakt.
  // Bevestig via de persistente dienst-link (verse GET is de waarheid) i.p.v. de vluchtige toast —
  // dat vermijdt zowel een eeuwige wachttijd als een dubbele submit op een dan-gereset formulier.
  const dienstLink = page.getByRole("link", { name: dienst });
  await reloadUntilVisible(page, dienstLink);
  await shot(page, "franchise-dienst-rich-form");

  // Open de dienst en controleer dat de eisen erop staan. De dienst-detail leeft inmiddels op de
  // franchise-route (rijke dienst-weergave voor de bemiddelaar); accepteer beide vormen.
  await clickForUrl(dienstLink, page, /\/(franchise\/diensten|opdrachten)\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: dienst })).toBeVisible();
  // De rijke velden surfacen op de dienst-detail: het tarief in de kop en de skill-/VOG-eisen via
  // de roster-matching ("Mist 1 van 1 vereiste skills" / "VOG ontbreekt" bij de kandidaten).
  await expect(page.getByText("€ 40–55/uur")).toBeVisible();
  await expect(page.getByText(/vereiste skills/).first()).toBeVisible();
  await expect(page.getByText(/VOG ontbreekt/).first()).toBeVisible();
  await shot(page, "franchise-dienst-rich-detail");
});
