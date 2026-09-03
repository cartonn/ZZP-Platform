import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickUntilGone } from "./_robust";

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
  // Wachten-zonder-herladen wérkt hier niet, en dat is gemeten, niet vermoed: in een
  // productiebuild (`npm run start`, zoals e2e-shard draait) geeft de activatie-POST binnen ~70ms
  // status 200 en landt de mutatie server-side — maar de response-body komt nooit (Playwright:
  // "No data found for resource with given identifier"). De action-stream blijft open en leeg, dus
  // `useActionState` blijft op pending ("Bezig…") en de `revalidatePath` bereikt de client nooit.
  // Gevolg: noch "rij weg" noch "… is geactiveerd" verschijnt ooit, en een poll die bewust niet
  // herlaadt loopt gegarandeerd af. Dat is issue #329, en in de productiebuild deterministisch —
  // vandaar dat dit lokaal in dev groen is en in e2e-shard 3× op rij rood.
  //
  // De remedie is de bestaande `clickUntilGone`: die kapt de hangende response af (window.stop) en
  // haalt met een verse GET de serverwaarheid op. Herladen is hier aantoonbaar veilig — de mutatie
  // is al geland vóór de reload (gemeten: rij weg na reload), dus er wordt geen lopende POST
  // afgebroken. Er wordt alleen herklikt zolang de rij er ná die verse GET nog staat, dus geen
  // dubbele activatie; en mocht dat toch gebeuren, dan weigert `updateMany where status PENDING`
  // de tweede beslissing sowieso.
  await clickUntilGone(row.getByRole("button", { name: "Activeren" }), row, 30000);
  await expect(row).toHaveCount(0);

  // Na activatie opent de werkplek voor de bemiddelaar (live gelezen, geen nieuwe sessie nodig).
  const bureauNa = await browser.newPage();
  await login(bureauNa, email, "geheim123");
  await bureauNa.waitForURL("**/dashboard");
  await bureauNa.goto("/franchise/diensten");
  await expect(bureauNa).toHaveURL(/\/franchise\/diensten/);
  await shot(bureauNa, "63-bureau-werkplek");
  await bureauNa.close();
});
