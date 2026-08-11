import { expect, test } from "@playwright/test";
import type { Browser } from "playwright-core";
import { clickUntil, clickUntilGone } from "../_robust";
import { shot, uniq } from "./helpers";

// ---------------------------------------------------------------------------
// LIFECYCLE TEST — de volledige multi-role cascade als echte gebruikers.
//
// Simuleert de complete reis die het platform faciliteert:
//
//   CLIENT plaatst opdracht → publiceert
//   FREELANCER bladert, solliciteert
//   CLIENT accepteert, stelt samenwerking voor
//   FREELANCER tekent contract (cascade Event A: contract actief)
//   FREELANCER dient urenstaat in (cascade Event B1)
//   CLIENT keurt uren goed (cascade Event B2 → concept-factuur)
//   FREELANCER dient factuur in (cascade Event C)
//   CLIENT keurt factuur goed (cascade Event D)
//   CLIENT registreert betaling (cascade Event E)
//   ADMIN controleert audit trail
//
// Elke stap wordt vanuit de juiste rol uitgevoerd. Tussen de stappen wisselen
// we van browser-context — net als echte gebruikers die los van elkaar werken.
// ---------------------------------------------------------------------------

test.describe("QA: Complete lifecycle cascade", () => {
  test("opdracht → sollicitatie → samenwerking → prestatie → factuur → betaling", async ({
    page,
    browser,
  }) => {
    // Ex-quarantaine (15-6 → 10-8-2026): de "samenwerking voorstellen"-hang was de bekende
    // #329-klasse — de server-action-response kan in productie blijven hangen terwijl de mutatie
    // slaagde. De kale .click()'s op de voorstel- en tekenstap zijn vervangen door clickUntil
    // (_robust.ts), dat bij een hangende response herlaadt en de werkelijke status toont.
    test.slow(); // multi-context, volledige cascade

    const title = `QA Lifecycle ${uniq()}`;

    // =====================================================================
    // STAP 1 — CLIENT registreert en plaatst een opdracht
    // =====================================================================
    const clientEmail = `qa-client-${uniq()}@test.local`;
    await page.goto("/register");
    await page.getByText("Opdrachtgever", { exact: true }).click();
    await page.fill("#name", "QA Opdrachtgever");
    await page.fill("#companyName", "QA Testbedrijf");
    await page.fill("#email", clientEmail);
    await page.fill("#password", "geheim123");
    await page.getByRole("button", { name: "Account aanmaken" }).click();
    await page.waitForURL("**/dashboard");
    await shot(page, "lifecycle-01-client-registered");

    // Opdracht aanmaken
    await page.goto("/opdrachten/nieuw");
    await page.fill("#title", title);
    await page.fill("#description", "Lifecycle-test: volledige cascade van opdracht tot betaling.");
    await page.getByRole("button", { name: "Opslaan als concept" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    const jobUrl = page.url();
    await shot(page, "lifecycle-02-job-created");

    // Publiceren
    await page.getByRole("button", { name: "Publiceren" }).click();
    await expect(page.getByText("Gepubliceerd")).toBeVisible();
    await shot(page, "lifecycle-03-job-published");

    // =====================================================================
    // STAP 2 — FREELANCER registreert en solliciteert
    // =====================================================================
    const fpEmail = `qa-freelancer-${uniq()}@test.local`;
    const fctx = await (browser as Browser).newContext();
    const fp = await fctx.newPage();

    await fp.goto("/register");
    await fp.fill("#name", "QA Freelancer");
    await fp.fill("#email", fpEmail);
    await fp.fill("#password", "geheim123");
    await fp.getByRole("button", { name: "Account aanmaken" }).click();
    await fp.waitForURL("**/dashboard");
    await shot(fp, "lifecycle-04-freelancer-registered");

    // Solliciteren op de opdracht
    await fp.goto(jobUrl);
    await fp.fill("#motivation", "Ervaren in lifecycle-testing. Beschikbaar per direct.");
    await fp.getByRole("button", { name: "Reactie versturen" }).click();
    await fp.waitForURL("**/reacties");
    await shot(fp, "lifecycle-05-application-sent");

    // =====================================================================
    // STAP 3 — CLIENT accepteert en stelt samenwerking voor
    // =====================================================================
    await page.goto("/kandidaten");
    await page.getByRole("button", { name: "Toon details" }).click();
    // Robuust tegen de #329-response-hang: klik Accepteren tot de knop weg is (status toegepast).
    await clickUntilGone(
      page.getByRole("button", { name: "Accepteren" }),
      page.getByRole("button", { name: "Accepteren" }),
    );
    // De rij kan open blijven staan; alleen uitklappen als het voorstelformulier er nog niet is.
    if (
      !(await page
        .getByText("Samenwerking voorstellen")
        .isVisible()
        .catch(() => false))
    ) {
      await page.getByRole("button", { name: "Toon details" }).click();
    }
    await expect(page.getByText("Samenwerking voorstellen")).toBeVisible();
    await page.locator('input[name="rate"]').fill("75");
    // Robuust tegen de #329-response-hang: herhaal/refresh tot de "Geaccepteerd"-sectie er is.
    await clickUntil(
      page.getByRole("button", { name: "Voorstel versturen" }),
      page.getByRole("button", { name: /Geaccepteerd/ }),
    );
    // Met een samenwerking verhuist de kandidaat naar de ingeklapte sectie "Geaccepteerd".
    await page.getByRole("button", { name: /Geaccepteerd/ }).click();
    await expect(page.getByRole("link", { name: "Bekijk samenwerking" })).toBeVisible({
      timeout: 15000,
    });
    await shot(page, "lifecycle-06-collaboration-proposed");

    // Navigeer naar samenwerking
    const collabLink = page.getByRole("link", { name: "Bekijk samenwerking" });
    const collabUrl = (await collabLink.getAttribute("href")) ?? "";
    await collabLink.click();
    await page.waitForURL("**/samenwerkingen/**");

    // =====================================================================
    // STAP 4 — CLIENT tekent contract (Event A: contract actief)
    // =====================================================================
    await clickUntil(
      page.getByRole("button", { name: "Contract ondertekenen" }),
      page.getByText("Actief").first(),
    );
    await shot(page, "lifecycle-07-contract-signed");

    // =====================================================================
    // STAP 5 — FREELANCER dient urenstaat in (Event B1)
    // =====================================================================
    await fp.goto(collabUrl);
    await expect(fp.getByText("Actief")).toBeVisible({ timeout: 15000 });

    // Vul urenstaat in
    await fp.fill('input[name="hours"]', "40");
    await fp.fill('input[name="description"]', "Week 1 — lifecycle QA");
    await fp.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
    await expect(fp.getByText("Ter goedkeuring").first()).toBeVisible({ timeout: 15000 });
    await shot(fp, "lifecycle-08-performance-submitted");

    // =====================================================================
    // STAP 6 — CLIENT keurt uren goed (Event B2 → concept-factuur)
    // =====================================================================
    await page.reload();
    await expect(page.getByText("Ter goedkeuring").first()).toBeVisible({ timeout: 15000 });

    const perfSection = page.locator("section").filter({ hasText: "Uren & opleveringen" });
    await perfSection.getByRole("button", { name: "Goedkeuren" }).first().click();
    await expect(page.getByText("Goedgekeurd").first()).toBeVisible({ timeout: 15000 });
    await shot(page, "lifecycle-09-performance-approved");

    // Concept-factuur moet automatisch aangemaakt zijn
    await expect(page.getByText("Concept").first()).toBeVisible({ timeout: 15000 });
    await shot(page, "lifecycle-10-invoice-concept");

    // =====================================================================
    // STAP 7 — FREELANCER dient factuur in (Event C)
    // =====================================================================
    await fp.reload();
    await expect(fp.getByText("Concept").first()).toBeVisible({ timeout: 15000 });

    const invSection = fp.locator("section").filter({ hasText: "Facturen" });
    await invSection.getByRole("button", { name: "Indienen" }).first().click();
    await expect(fp.getByText("Ingediend")).toBeVisible({ timeout: 15000 });
    await shot(fp, "lifecycle-11-invoice-submitted");

    // =====================================================================
    // STAP 8 — CLIENT keurt factuur goed (Event D)
    // =====================================================================
    await page.reload();
    const invSectionClient = page.locator("section").filter({ hasText: "Facturen" });
    await invSectionClient.getByRole("button", { name: "Goedkeuren" }).first().click();
    await expect(page.getByText("Goedgekeurd").first()).toBeVisible({ timeout: 15000 });
    await shot(page, "lifecycle-12-invoice-approved");

    // =====================================================================
    // STAP 9 — CLIENT registreert betaling (Event E)
    // =====================================================================
    // De knop heet aan de opdrachtgever-kant "Markeer als betaald"; robuust tegen #329.
    await clickUntil(
      invSectionClient.getByRole("button", { name: "Markeer als betaald" }).first(),
      page.getByText("Betaald").first(),
    );
    await shot(page, "lifecycle-13-payment-registered");

    // =====================================================================
    // STAP 10 — Verificatie: factuur zichtbaar voor freelancer
    // =====================================================================
    await fp.reload();
    await expect(fp.getByText("Betaald").first()).toBeVisible({ timeout: 15000 });
    await shot(fp, "lifecycle-14-freelancer-sees-paid");

    // =====================================================================
    // STAP 11 — ADMIN controleert audit trail
    // =====================================================================
    const actx = await (browser as Browser).newContext();
    const ap = await actx.newPage();
    await ap.goto("/login");
    await ap.fill("#email", "admin@zzp-platform.local");
    await ap.fill("#password", "demo1234");
    await ap.getByRole("button", { name: "Inloggen" }).click();
    await ap.waitForURL("**/dashboard");

    await ap.goto("/admin/audit");
    await expect(ap.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(ap, "lifecycle-15-admin-audit");

    await actx.close();
    await fctx.close();
  });
});
