import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
// KvK-nummer moet 8 cijfers zijn én uniek per bureau; leid het af van de tijd.
const kvk = () => String(Date.now()).slice(-8);

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
}

async function registerBureau(page: Page, email: string, bureauName: string) {
  await page.goto("/register");
  await page.getByText("Bemiddelingsbureau", { exact: true }).click();
  await page.fill("#bureauName", bureauName);
  await page.fill("#kvkNumber", kvk());
  await page.fill("#name", "Anna de Vries");
  await page.fill("#email", email);
  await page.fill("#password", "geheim123");
  await page.fill("#region", "Noord-Holland");
  await page.getByRole("button", { name: "Bureau aanmelden" }).click();
  await expect(page.getByText(/Aanmelding ontvangen/)).toBeVisible();
}

test("bureau meldt zich aan, ziet de wachtpagina en krijgt geen werkplek-data", async ({
  page,
}) => {
  const email = `bureau-${uniq()}@test.local`;
  const bureauName = `Zorgbemiddeling ${uniq()}`;

  await registerBureau(page, email, bureauName);
  await shot(page, "60-bureau-aanmelding");

  // Inloggen kan (het account is actief), maar de tenant staat op PENDING: elke route achter de
  // inlogmuur leidt naar de wachtpagina en de werkplek geeft geen data prijs.
  await login(page, email, "geheim123");
  await page.waitForURL("**/aanmelding");
  await expect(page.getByRole("heading", { name: "Je aanmelding wordt beoordeeld" })).toBeVisible();
  await expect(page.getByText(bureauName)).toBeVisible();
  await shot(page, "61-bureau-wachtpagina");

  await page.goto("/franchise/diensten");
  await page.waitForURL("**/aanmelding");
  await expect(page.getByRole("heading", { name: "Je aanmelding wordt beoordeeld" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Diensten/ })).toHaveCount(0);

  await page.goto("/dashboard");
  await page.waitForURL("**/aanmelding");
});

test("admin ziet de wachtrij, moet een reden opgeven bij afwijzen en kan activeren", async ({
  page,
  browser,
}) => {
  test.slow();
  const email = `bureau-${uniq()}@test.local`;
  const bureauName = `Zorgbemiddeling ${uniq()}`;

  const bureau = await browser.newPage();
  await registerBureau(bureau, email, bureauName);
  await bureau.close();

  await login(page, "admin@zzp-platform.local", "demo1234");
  await page.waitForURL("**/dashboard");
  await page.goto("/admin/franchises");
  const row = page.getByRole("listitem").filter({ hasText: bureauName });
  await expect(page.getByRole("heading", { name: "Wacht op activatie" })).toBeVisible();
  await expect(row).toContainText(email);
  await shot(page, "62-admin-wachtrij");

  // Afwijzen vraagt eerst een reden; het formulier laat niet door zonder.
  await row.getByRole("button", { name: "Afwijzen" }).click();
  await expect(row.getByRole("button", { name: "Afwijzen bevestigen" })).toBeVisible();
  await row.getByRole("button", { name: "Annuleren" }).click();
  // Wacht tot het bevestig-venster echt is ingeklapt vóór we activeren: anders kan de Activeren-klik
  // in het her-render-venster van het annuleren vallen en niet registreren — dan blijft de rij staan
  // en faalt de assertie hieronder (waargenomen CI-flake, geen productdefect).
  await expect(row.getByRole("button", { name: "Afwijzen bevestigen" })).toBeHidden();

  // Activeren haalt de aanmelding uit de wachtrij (de lijst toont alleen PENDING-tenants).
  // De rij verdwijnt pas na de server-action + revalidatePath-render; onder CI-belasting kan die
  // round-trip het standaard 5s-venster overschrijden, dus een ruimer venster (de test is `slow`).
  const activeren = row.getByRole("button", { name: "Activeren" });
  await expect(activeren).toBeEnabled();
  await activeren.click();
  await expect(row).toHaveCount(0, { timeout: 30000 });

  // Na activatie opent de werkplek voor de bemiddelaar (live gelezen, geen nieuwe sessie nodig).
  const bureauNa = await browser.newPage();
  await login(bureauNa, email, "geheim123");
  await bureauNa.waitForURL("**/dashboard");
  await bureauNa.goto("/franchise/diensten");
  await expect(bureauNa).toHaveURL(/\/franchise\/diensten/);
  await shot(bureauNa, "63-bureau-werkplek");
  await bureauNa.close();
});
