// Robuuste interacties voor server-action-knoppen (`<form action={...}>`). Die reageren pas
// zodra React de route heeft gehydrateerd; een klik in de korte race daarvóór gaat verloren.
// Een echte gebruiker raakt dit nooit (die klikt niet binnen milliseconden), maar Playwright wel.
// Daarom: herhaal de klik tot het verwachte effect optreedt — alleen zolang het effect nog
// ontbreekt, zodat er geen dubbele submit gebeurt.
import { expect, type Locator, type Page } from "@playwright/test";

// Stand 5-9-2026 (issue #329): de "hangende action-response" is bij de wortel gefixt — het was een
// verloren render-fase-ping in de door Next gebundelde React-canary, teruggezet via
// patches/next+15.5.24.patch (zie docs/decisions/0012). De herlaad-vangnetten hieronder zijn daar
// dus niet meer voor nodig; e2e/bureau-registratie.spec.ts bewijst dat met één gewone klik in de
// productiebuild. Ze blijven staan voor de losstaande pre-hydratatie-klikrace (herklik) en kunnen in
// een vervolg worden teruggebracht tot "herklik zonder reload".

/** Verse GET van de huidige pagina, ook als er nog een (hangende) navigatie/POST openstaat:
 *  eerst window.stop() (kapt de hangende response af), dan een reload met korte timeout.
 *  Historisch vangnet voor issue #329 (zie kop van dit bestand). */
export async function freshen(page: Page) {
  await page.evaluate(() => window.stop()).catch(() => {});
  await page.reload({ waitUntil: "domcontentloaded", timeout: 8000 }).catch(() => {});
}

/** Klik `button` tot `result` zichtbaar is. Is er al geklikt maar blijft het effect uit, dan
 *  herladen we eerst: de action-response kan in productie blijven hangen terwijl de mutatie
 *  server-side slaagde (issue #329) — een verse GET toont de werkelijke status en voorkomt
 *  zowel een eeuwige wachttijd als een dubbele submit. */
export async function clickUntil(button: Locator, result: Locator, timeout = 20000) {
  const page = button.page();
  let clicked = false;
  await expect(async () => {
    if (!(await result.isVisible().catch(() => false))) {
      if (clicked) await freshen(page);
      if (!(await result.isVisible().catch(() => false))) {
        await button.click({ timeout: 3000 }).catch(() => {});
        clicked = true;
      }
    }
    await expect(result).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout });
}

/** Klik `button` tot `gone` is verdwenen (bv. een kaart die de wachtrij verlaat). Zelfde
 *  herlaad-vangnet als clickUntil (issue #329). */
export async function clickUntilGone(button: Locator, gone: Locator, timeout = 20000) {
  const page = button.page();
  let clicked = false;
  await expect(async () => {
    if ((await gone.count()) > 0) {
      if (clicked) await freshen(page);
      if ((await gone.count()) > 0) {
        await button.click({ timeout: 3000 }).catch(() => {});
        clicked = true;
      }
    }
    await expect(gone).toHaveCount(0, { timeout: 3000 });
  }).toPass({ timeout });
}

/** Klik `button` tot de URL `urlGlob` matcht (navigatie-resultaat). Klikt alleen zolang de knop
 *  nog zichtbaar is — na de navigatie is hij weg, dus geen dubbele submit op create-acties.
 *
 *  `waitUntil: "commit"` is hier essentieel: de standaard ("load") wacht op het load-event van de
 *  doelpagina, en dat blijft uit zolang een server-action-/RSC-response hangt (issue #329). De
 *  navigatie is dan wél gebeurd — de URL klopt, de pagina staat in zijn laadskelet — maar
 *  `waitForURL` liep alsnog af. Dat maakte elke clickForUrl een tijdbom (bekende flake op
 *  franchise-roster-dossier). Het aankomst-criterium blijft ongewijzigd: de URL moet matchen; de
 *  asserties ná deze helper wachten zelf op de inhoud. */
export async function clickForUrl(
  button: Locator,
  page: Page,
  urlGlob: string | RegExp,
  timeout = 20000,
) {
  await expect(async () => {
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 3000 }).catch(() => {});
    }
    await page.waitForURL(urlGlob, { timeout: 3000, waitUntil: "commit" });
  }).toPass({ timeout });
}

/** Vul `input` tot de URL `urlPattern` matcht (debounced filter-/zoekvelden die de router pushen).
 *
 *  Waarom dit nodig is: een zoekveld is een *controlled* client-component (`value={q}` +
 *  `onChange` → debounce → `router.push`). `fill()` zet de waarde in de DOM en vuurt een
 *  input-event, maar zolang React de route nog niet heeft gehydrateerd luistert er niemand: de
 *  onChange komt nooit aan, en de hydratatie zet het veld daarna terug op de servertoestand
 *  (leeg). De typoefening is dan spoorloos verdwenen en `waitForURL(/[?&]q=/)` loopt af — de
 *  bewezen flake in jobs/browse-match (zelfde SHA 1× pass, 1× fail in `e2e-postgres`). Een echte
 *  gebruiker raakt dit niet; die typt niet binnen milliseconden na navigatie.
 *
 *  Aanpak, gelijk aan `clickForUrl`: herhaal de invoer tot het verwachte effect (de URL) er is.
 *  We wissen eerst en vullen dan opnieuw, zodat een herhaling gegarandeerd een échte
 *  waardewijziging — en dus een nieuwe debounce-push — oplevert, ook als de React-state door een
 *  eerdere poging al op `value` zou staan. Staat de URL al goed, dan raken we het veld niet meer
 *  aan (geen overbodige extra push). `waitUntil: "commit"` om dezelfde reden als in
 *  `clickForUrl`: de navigatie telt zodra de URL er is; een hangende RSC-response (issue #329)
 *  mag het aankomst-signaal niet gijzelen. */
export async function fillForUrl(
  page: Page,
  input: Locator,
  value: string,
  urlPattern: string | RegExp,
  timeout = 20000,
) {
  const matches = () =>
    typeof urlPattern === "string" ? page.url().includes(urlPattern) : urlPattern.test(page.url());
  await input.waitFor({ state: "visible", timeout: 10000 });
  await expect(async () => {
    if (!matches()) {
      await input.fill("", { timeout: 3000 }).catch(() => {});
      await input.fill(value, { timeout: 3000 });
    }
    // Ruim boven de debounce (350ms) plus een render-tik, zodat een poging niet vroegtijdig faalt.
    await page.waitForURL(urlPattern, { timeout: 4000, waitUntil: "commit" });
  }).toPass({ timeout });
  await expect(input).toHaveValue(value);
}

/**
 * Op /kandidaten (rij al uitgeklapt): accepteer de kandidaat en verstuur een samenwerkingsvoorstel.
 * Robuust tegen de #329-response-hang en tegen het open-blijven van de rij na de statuswijziging.
 * Eindigt met de "Geaccepteerd"-sectie geopend en de "Bekijk samenwerking"-link zichtbaar.
 */
export async function acceptAndProposeCollaboration(page: Page, rate: string) {
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
  await page.locator('input[name="rate"]').fill(rate);
  await clickUntil(
    page.getByRole("button", { name: "Voorstel versturen" }),
    page.getByRole("button", { name: /Geaccepteerd/ }),
  );
  // Met een samenwerking verhuist de kandidaat naar de ingeklapte sectie "Geaccepteerd"; open die.
  await page.getByRole("button", { name: /Geaccepteerd/ }).click();
  await expect(page.getByRole("link", { name: "Bekijk samenwerking" })).toBeVisible({
    timeout: 15000,
  });
}

/** Wacht tot `locator` zichtbaar is, met een page-reload tussen pogingen: na een server-actie
 *  kan de UI-update uitblijven terwijl de mutatie slaagde (issue #329) — de verse GET is de
 *  waarheid. Voor asserties direct na een actie of na een goto op een tweede context. */
export async function reloadUntilVisible(page: Page, locator: Locator, timeout = 20000) {
  await expect(async () => {
    if (!(await locator.isVisible().catch(() => false))) {
      await freshen(page);
    }
    await expect(locator).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout });
}
