import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import {
  acceptAndProposeCollaboration,
  clickForUrl,
  clickUntil,
  reloadUntilVisible,
} from "./_robust";
import {
  EIGEN_CLIENT_EMAIL,
  EIGEN_OPDRACHTGEVER,
  FRANCHISER_EMAIL,
  INZETBARE_ZZPER,
  INZETBARE_ZZPER_EMAIL,
  hydrated,
  login,
  uniq,
  zetDienstUit,
} from "./franchise-helpers";

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

/**
 * De geldkant van "het bureau zonder Excel": alles wat de bemiddelaar in gang zet loopt door tot een
 * transactie-fee die hij in zijn eigen facturatie terugziet.
 *
 * Ná het uitzetten van de dienst doet de bemiddelaar hier zelf geen enkele mutatie meer — uren
 * indienen (ZZP'er) en goedkeuren (opdrachtgever) zijn bewust niet zijn bevoegdheid. De reis wisselt
 * daarom van account binnen dezelfde tenant en bewijst dat hij aan het eind tóch de opbrengst ziet:
 * onboarding → dienst → reactie → samenwerking → contract → uren → factuur → betaald → fee.
 */
test("van dienst tot fee: de bemiddelaar ziet de opbrengst van een eigen plaatsing", async ({
  page,
  browser,
}) => {
  test.slow();
  await login(page, FRANCHISER_EMAIL);
  const zzperNaam = INZETBARE_ZZPER;

  // 1. Dienst uitzetten bij de eigen opdrachtgever.
  const dienst = `Cascade dienst ${uniq()}`;
  const jobId = await zetDienstUit(
    page,
    dienst,
    "Dagdienst geriatrie, uurtarief, via de bemiddeling.",
  );

  // 2. De ZZP'er uit de eigen pool reageert zelf op de dienst.
  //
  // LET OP — deze stap vraagt een redelijk verse database (CI draait per run een schone Postgres).
  // Het gratis plan staat 5 reacties toe, geteld over het hele bestaan van het profiel: de telling in
  // `applications-create.ts` is `prisma.application.count({ where: { freelancerId } })` zónder
  // periodefilter. Elke run maakt een nieuwe dienst en dus een nieuwe reactie, waardoor de seed-ZZP'er
  // op een hergebruikte lokale database na 5 runs tegen dat plafond loopt. De expliciete assertie
  // hieronder zorgt dat de test dán duidelijk faalt op de limietmelding in plaats van te stranden op
  // een raadselachtige timeout.
  const fctx = await browser.newContext();
  const fp = await fctx.newPage();
  await login(fp, INZETBARE_ZZPER_EMAIL);
  await fp.goto(`/opdrachten/${jobId}`);
  await expect(fp.getByRole("heading", { name: dienst })).toBeVisible();
  await fp.fill("#motivation", "Ik ben beschikbaar voor deze dagdiensten en ken de afdeling.");
  // De knop heet tijdens de submit "Versturen…" en is dan disabled — de exacte naam matcht dus
  // alleen een niet-lopende submit; herhalen kan geen dubbele reactie opleveren.
  await clickForUrl(
    fp.getByRole("button", { name: "Reactie versturen", exact: true }),
    fp,
    /\/reacties/,
    45000,
  );
  // Geen plan-blokkade: de reactielimiet is een maandquotum, dus deze reactie hoort door te gaan.
  await expect(fp.getByText(/het maximum van \d+ reacties bereikt/)).toHaveCount(0);

  // 3. De opdrachtgever accepteert en stelt de samenwerking voor.
  const cctx = await browser.newContext();
  const cp = await cctx.newPage();
  await login(cp, EIGEN_CLIENT_EMAIL);
  // Scope op déze dienst: anders zou de eerste "Accepteren"-knop bij een willekeurige andere reactie
  // kunnen horen. Server-side gevalideerd (een vreemd id valt terug op "alle opdrachten").
  await cp.goto(`/kandidaten?job=${jobId}`);
  await expect(cp.getByText(zzperNaam).first()).toBeVisible();
  await hydrated(cp);
  await cp.getByRole("button", { name: "Toon details" }).first().click();
  await acceptAndProposeCollaboration(cp, "45");
  await clickForUrl(
    cp.getByRole("link", { name: "Bekijk samenwerking" }),
    cp,
    /\/samenwerkingen\/[a-z0-9]+$/,
    45000,
  );
  const collaborationUrl = cp.url();
  await shot(cp, "franchise-cascade-samenwerking-voorgesteld");

  // 4. De plaatsing verschijnt in het toezicht van de bemiddelaar.
  await page.goto("/franchise/samenwerkingen");
  await reloadUntilVisible(page, page.getByText(dienst).first());
  await expect(page.getByText(zzperNaam).first()).toBeVisible();
  await shot(page, "franchise-cascade-samenwerkingen");

  // 5. De ZZP'er tekent het contract → actief, en uren kunnen worden vastgelegd.
  await fp.goto(collaborationUrl);
  await hydrated(fp);
  await clickUntil(
    fp.getByRole("button", { name: "Contract ondertekenen" }),
    fp.getByText("Actief").first(),
  );
  await shot(fp, "franchise-cascade-contract-getekend");

  // 6. Uren indienen (ZZP'er).
  const urenSectie = fp.locator("section").filter({ hasText: "Uren & opleveringen" });
  await fp.fill('input[name="hours"]', "8");
  await fp.getByLabel("Periode van (bij uurtarief)").fill("06-01-2026");
  await fp.getByLabel("Periode t/m (bij uurtarief)").fill("06-01-2026");
  await fp.fill('input[name="description"]', "Dagdienst week 1");
  await clickUntil(
    fp.getByRole("button", { name: "Indienen ter goedkeuring" }),
    // exact: anders matcht de statusbadge de knoptekst weg.
    urenSectie.getByText("Ter goedkeuring", { exact: true }).first(),
  );

  // 7. Uren goedkeuren (opdrachtgever) → er ontstaat automatisch een concept-factuur.
  await cp.goto(collaborationUrl);
  await hydrated(cp);
  await clickUntil(
    cp
      .locator("section")
      .filter({ hasText: "Uren & opleveringen" })
      .getByRole("button", { name: "Goedkeuren" })
      .first(),
    cp.locator("section").filter({ hasText: "Facturen" }).getByText("Concept", { exact: true }).first(), // prettier-ignore
  );
  await shot(cp, "franchise-cascade-uren-goedgekeurd");

  // 8. Factuur indienen (ZZP'er) → goedkeuren (opdrachtgever) → betaling registreren (ZZP'er).
  const facturen = (p: Page) => p.locator("section").filter({ hasText: "Facturen" });
  await fp.goto(collaborationUrl);
  await hydrated(fp);
  await clickUntil(
    facturen(fp).getByRole("button", { name: "Indienen" }).first(),
    facturen(fp).getByText("Ingediend", { exact: true }).first(),
  );

  await cp.goto(collaborationUrl);
  await hydrated(cp);
  await clickUntil(
    facturen(cp).getByRole("button", { name: "Goedkeuren" }).first(),
    facturen(cp).getByText("Goedgekeurd", { exact: true }).first(),
  );

  await fp.goto(collaborationUrl);
  await hydrated(fp);
  await clickUntil(
    facturen(fp).getByRole("button", { name: "Betaling ontvangen" }).first(),
    facturen(fp)
      .getByText(/^(Betaald|Verwerkt)$/)
      .first(),
  );
  await shot(fp, "franchise-cascade-factuur-betaald");

  // 9. De transactie-fee over deze samenwerking staat in de facturatie van de bemiddelaar. De fee
  //     wordt vastgelegd zodra de factuur betaald is.
  // /franchise/facturatie leidt permanent om naar de Facturatie-tab van de Bemiddeling-hub.
  await page.goto("/franchise/facturatie");
  await expect(page.getByRole("link", { name: "Facturatie" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { name: "Fees per samenwerking" })).toBeVisible();
  const feeRij = page.locator("tr").filter({ hasText: dienst });
  await reloadUntilVisible(page, feeRij.first());
  await expect(feeRij.first()).toContainText(EIGEN_OPDRACHTGEVER);
  await expect(feeRij.first()).toContainText(zzperNaam);
  await expect(feeRij.first()).toContainText("Openstaand");
  // Een echt bedrag, geen placeholder.
  await expect(feeRij.first()).toContainText(/€\s?\d/);
  await expect(page.getByText("Er zijn nog geen transactie-fees geregistreerd.")).toHaveCount(0);
  await shot(page, "franchise-cascade-fee");

  // 10. Hetzelfde geld komt terug in het cijferbeeld van de bemiddeling.
  await page.goto("/inzicht");
  await expect(page.getByRole("heading", { name: "Inzicht" })).toBeVisible();
  await expect(page.getByText("Doorgezet volume")).toBeVisible();
  await shot(page, "franchise-cascade-inzicht");

  await fctx.close();
  await cctx.close();
});
