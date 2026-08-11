import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { acceptAndProposeCollaboration } from "./_robust";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Rooster Opdrachtgever");
  await page.fill("#companyName", "Rooster Testbedrijf B.V.");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}
async function registerFreelancer(page: Page, email: string) {
  await page.goto("/register");
  await page.fill("#name", "Rooster Freelancer");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

const dayBox = (page: Page, code: string) =>
  page.locator(`input[name="weekdays"][value="${code}"]`);
const dayLabel = (page: Page, code: string) =>
  page.locator(`label:has(input[name="weekdays"][value="${code}"])`);

// ADR-0004: een samenwerking draagt een optioneel per-dag-weekrooster. Dit bewijst de hele keten:
// vastleggen op de detailpagina → server-side opslaan → blijft staan na herladen.
test("weekrooster op een samenwerking vastleggen blijft bewaard", async ({ page, browser }) => {
  test.slow();
  const title = `Rooster Opdracht ${uniq()}`;
  await registerClient(page, `rooster-client-${uniq()}@test.local`);

  // Opdracht aanmaken + publiceren.
  await page.goto("/opdrachten/nieuw");
  await page.fill("#title", title);
  await page.fill("#description", "Opdracht met een vaste weekindeling bij de opdrachtgever.");
  await page.selectOption("#workMode", "ONSITE");
  await page.getByRole("button", { name: "Opslaan als concept" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const jobUrl = page.url();
  await page.getByRole("button", { name: "Publiceren" }).click();
  await expect(page.getByText("Gepubliceerd")).toBeVisible();

  // ZZP'er reageert op de opdracht.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await registerFreelancer(fp, `rooster-free-${uniq()}@test.local`);
  await fp.goto(jobUrl);
  await fp.fill("#motivation", "Ik werk graag volgens een vaste weekindeling en ben beschikbaar.");
  await fp.getByRole("button", { name: "Reactie versturen" }).click();
  await fp.waitForURL("**/reacties");

  // Opdrachtgever accepteert en stelt een samenwerking voor.
  await page.goto("/kandidaten");
  await page.getByRole("button", { name: "Toon details" }).click();
  await acceptAndProposeCollaboration(page, "85");
  await page.getByRole("link", { name: "Bekijk samenwerking" }).click();
  await page.waitForURL(/\/samenwerkingen\/[a-z0-9]+$/);
  const collabUrl = page.url();

  // Het weekrooster-blok staat er; nog niets vastgelegd.
  await expect(page.getByText("Weekrooster", { exact: true })).toBeVisible();
  await expect(dayBox(page, "MON")).not.toBeChecked();

  // Kies ma + wo + vr en sla op.
  await dayLabel(page, "MON").click();
  await dayLabel(page, "WED").click();
  await dayLabel(page, "FRI").click();
  await page.getByRole("button", { name: "Weekrooster opslaan" }).click();
  await shot(page, "weekrooster-opgeslagen");

  // Herladen bewijst dat het server-side bewaard is (componentstate wordt opnieuw vanaf props gezet).
  await page.goto(collabUrl);
  await expect(dayBox(page, "MON")).toBeChecked();
  await expect(dayBox(page, "WED")).toBeChecked();
  await expect(dayBox(page, "FRI")).toBeChecked();
  await expect(dayBox(page, "TUE")).not.toBeChecked();
  await expect(dayBox(page, "SUN")).not.toBeChecked();

  // De tegenpartij (ZZP'er) ziet hetzelfde rooster op de samenwerking.
  await fp.goto(collabUrl);
  await expect(dayBox(fp, "WED")).toBeChecked();
  await expect(dayBox(fp, "TUE")).not.toBeChecked();

  await fctx.close();
});
