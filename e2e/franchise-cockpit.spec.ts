import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { clickForUrl, clickUntil } from "./_robust";
import {
  EIGEN_OPDRACHTGEVER,
  FRANCHISER_EMAIL,
  INZETBARE_ZZPER,
  hydrated,
  login,
  uniq,
  zetDienstUit,
} from "./franchise-helpers";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

// De seed-ZZP'er die de bemiddelaar voordraagt; hij logt zelf in om de melding te zien.
const INZETBARE_ZZPER_EMAIL = "zzp-noord-1@zzp-platform.local";
// Buiten de bemiddeling: platform-opdracht (tenantId null) + platform-opdrachtgever/ZZP'er.
const VREEMDE_DIENST_ID = "job-1";
const VREEMDE_DIENST_TITEL = "Verpleegkundige (somatiek)";
const VREEMDE_OPDRACHTGEVER = "Zorgcentrum Jansen";
const VREEMDE_ZZPER = "Sanne";

/**
 * De kernbelofte aan het bureau: zie wat dreigt onbezet te blijven, zet een dienst uit bij een eigen
 * opdrachtgever, en vul hem vanuit de eigen pool — met de matchonderbouwing erbij.
 *
 * De voordracht plaatst bewust géén reactie namens de ZZP'er (die houdt de regie): ze levert een
 * gezaghebbend voordracht-record plus een melding die hem vraagt zelf te reageren. Deze test
 * bewijst die schakel tot en met de melding aan de ZZP'er; de plaatsing die daarop volgt loopt door
 * in franchise-cascade.spec.ts.
 */
test("bemiddelaar ziet wat onbezet dreigt, zet een dienst uit en draagt uit eigen pool voor", async ({
  page,
  browser,
}) => {
  test.slow();
  await login(page, FRANCHISER_EMAIL);

  // 1. De cockpit beantwoordt "hoe vol zit ik" en "wat vraagt nu actie".
  await page.goto("/franchise/diensten");
  await expect(page.getByRole("heading", { name: "Diensten" })).toBeVisible();
  await expect(page.getByText("Vulgraad", { exact: true })).toBeVisible();
  await expect(page.getByText("Wat dreigt onbezet", { exact: true })).toBeVisible();
  await shot(page, "franchise-cockpit-diensten");

  // 2. Nieuwe dienst uitzetten bij een eigen opdrachtgever.
  const dienst = `Cockpit dienst ${uniq()}`;
  await zetDienstUit(page, dienst, "Avonddienst geriatrie; inzet vanuit de eigen flexpool.");
  await shot(page, "franchise-cockpit-dienst-uitgezet");

  // 3. De dienst staat open in de cockpit én in de "Wat dreigt onbezet"-triage (geen startdatum →
  //    acuut). Zo bewijst de test dat de kaart een verse, onbezette dienst echt oppikt.
  await page.goto("/franchise/diensten");
  const onbezetKaart = page.locator("div").filter({ hasText: /^Wat dreigt onbezet/ });
  await expect(onbezetKaart.getByRole("link", { name: dienst }).first()).toBeVisible();

  // 4. Dienst-detail: de eigen roster staat er als kandidaat, met matchscore en inzetbaarheid.
  await clickForUrl(
    page.getByRole("link", { name: new RegExp(dienst) }).first(),
    page,
    /\/franchise\/diensten\/[a-z0-9]+$/,
    45000,
  );
  await expect(page.getByRole("heading", { name: dienst })).toBeVisible();
  await expect(page.getByText("Voordragen uit je roster")).toBeVisible();
  await expect(page.getByText(INZETBARE_ZZPER, { exact: true })).toBeVisible();
  await expect(page.getByText(/^Match \d+$/).first()).toBeVisible();

  // 5. Voordragen. clickUntil mag hier: `proposeFreelancer` is idempotent (een tweede voordracht is
  //    server-side een no-op), dus het herhaal-/herlaadvangnet kan geen dubbele melding opleveren.
  const kandidaatRij = page.locator("div").filter({ hasText: new RegExp(`^${INZETBARE_ZZPER}`) });
  await hydrated(page);
  await clickUntil(
    kandidaatRij.getByRole("button", { name: "Voordragen" }).first(),
    page.getByText(/Voorgedragen · wacht op reactie ZZP'er/).first(),
    30000,
  );
  await shot(page, "franchise-cockpit-voorgedragen");

  // 6. De voordracht is geen loze UI-status: de ZZP'er krijgt de melding, met de dienst erbij.
  const zctx = await browser.newContext();
  const zpage = await zctx.newPage();
  await login(zpage, INZETBARE_ZZPER_EMAIL);
  await zpage.goto("/notificaties");
  await expect(zpage.getByText("Je bemiddelaar draagt je voor").first()).toBeVisible();
  await expect(zpage.getByText(dienst).first()).toBeVisible();
  await shot(zpage, "franchise-cockpit-voordracht-melding");

  await zctx.close();
});

/**
 * Gesloten per tenant: de bemiddelaar ziet uitsluitend de eigen bemiddeling. Een dienst,
 * opdrachtgever of ZZP'er van buiten de tenant is niet zichtbaar, en een directe URL naar een
 * vreemde dienst geeft de niet-gevonden-pagina — geen serverfout, geen data, en geen onderscheidbaar
 * "bestaat wel maar mag niet" (dat zou een existence-oracle zijn).
 */
test("bemiddelaar ziet niets van buiten de eigen bemiddeling", async ({ page }) => {
  await login(page, FRANCHISER_EMAIL);

  // Diensten: alleen tenant-diensten. De platform-opdracht job-1 hoort er niet bij.
  await page.goto("/franchise/diensten");
  await expect(page.getByRole("heading", { name: "Diensten" })).toBeVisible();
  await expect(page.getByText(VREEMDE_DIENST_TITEL)).toHaveCount(0);

  // Directe URL naar die vreemde dienst. De HTTP-status is 200 omdat `franchise/loading.tsx` de
  // shell al streamt vóór `notFound()` valt — daarom asserteren we op het gerenderde resultaat én
  // sluiten we een 5xx expliciet uit.
  const res = await page.goto(`/franchise/diensten/${VREEMDE_DIENST_ID}`);
  expect(res?.status()).toBeLessThan(500);
  // De EmptyState-titel is een <p>, geen heading — daarom op tekst, niet op rol.
  await expect(page.getByText("Niet gevonden", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Dit item bestaat niet \(meer\) of je hebt er geen toegang toe/),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: VREEMDE_DIENST_TITEL })).toHaveCount(0);
  await expect(page.getByText(VREEMDE_DIENST_TITEL)).toHaveCount(0);
  // Ook geen voordraag-oppervlak op een vreemde dienst.
  await expect(page.getByText("Voordragen uit je roster")).toHaveCount(0);
  await shot(page, "franchise-cockpit-vreemde-dienst-niet-gevonden");

  // Opdrachtgevers en roster zijn even strak gescoped als de diensten.
  await page.goto("/franchise/opdrachtgevers");
  await expect(page.getByText(EIGEN_OPDRACHTGEVER).first()).toBeVisible();
  await expect(page.getByText(VREEMDE_OPDRACHTGEVER)).toHaveCount(0);

  await page.goto("/franchise/zzpers");
  await expect(page.getByText(INZETBARE_ZZPER).first()).toBeVisible();
  await expect(page.getByText(VREEMDE_ZZPER, { exact: true })).toHaveCount(0);
});
