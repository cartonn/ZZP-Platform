// Gedeelde bouwstenen voor de bemiddelaar-reizen (e2e/franchise-cockpit + franchise-cascade).
// Bewust apart: beide specs loggen in als bemiddelaar en zetten een dienst uit bij dezelfde
// seed-opdrachtgever; die stappen horen op één plek te staan.
import { type Page } from "@playwright/test";
import { clickForUrl, reloadUntilVisible } from "./_robust";

export const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

/** Wacht tot de huidige route gehydrateerd is: server-action-knoppen zijn pas dán bedraad. */
export async function hydrated(page: Page) {
  const pathname = new URL(page.url()).pathname;
  await page.waitForSelector(`html[data-hydrated="${pathname}"]`, { timeout: 15000 });
}

export async function login(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard", { waitUntil: "commit", timeout: 45000 });
}

// Seed-vaste ankers van de demo-bemiddeling "Zorgbemiddeling Noord" (prisma/seed-franchise.ts).
export const FRANCHISER_EMAIL = "franchise@zzp-platform.local";
export const EIGEN_OPDRACHTGEVER = "Verpleeghuis De Noorderbrug";
export const EIGEN_CLIENT_EMAIL = "noorderbrug@zzp-platform.local";
/** Lars Bakker is de enige seed-ZZP'er die volledig inzetbaar is (VOG + verzekering + identiteit). */
export const INZETBARE_ZZPER = "Lars Bakker";
export const INZETBARE_ZZPER_EMAIL = "zzp-noord-1@zzp-platform.local";

/**
 * Zet een dienst uit bij de eigen opdrachtgever via de cockpit-inline-vorm en geeft het job-id terug.
 * Bewust zonder startdatum en zonder vereiste certificaten: zo telt de dienst meteen als acuut
 * (`isStartAcute`) en blokkeert de compliance-gate later het contract niet.
 */
export async function zetDienstUit(page: Page, titel: string, omschrijving: string) {
  await page.goto("/franchise/opdrachtgevers");
  // `.first()` is niet cosmetisch: matcht de naam op meer dan één link, dan gooit strict mode binnen
  // clickForUrl een fout die de helper wegvangt — er wordt nooit geklikt en je krijgt een
  // misleidende URL-timeout in plaats van de echte oorzaak.
  await clickForUrl(
    page.getByRole("link", { name: new RegExp(EIGEN_OPDRACHTGEVER) }).first(),
    page,
    /\/franchise\/opdrachtgevers\/[a-z0-9]+$/,
    45000,
  );
  await hydrated(page);
  await page.getByText("Dienst uitzetten", { exact: true }).click();
  await page.getByLabel("Titel").fill(titel);
  await page.getByLabel("Omschrijving").fill(omschrijving);
  // De action eindigt met een redirect naar `?dienst=<titel>`; die URL-wissel bewijst dat de mutatie
  // rond is. Herhaald klikken is veilig: zolang de action loopt is de knop `disabled` én heet hij
  // "Uitzetten…", dus de exacte naam matcht alleen een niet-lopende submit — nooit een dubbele dienst.
  await clickForUrl(
    page.getByRole("button", { name: "Uitzetten", exact: true }),
    page,
    /[?&]dienst=/,
    45000,
  );
  // Niet op de bevestigingsmelding wachten: de action-response kan blijven hangen (#329) waardoor de
  // doelpagina in zijn laadskelet blijft staan terwijl de dienst allang bestaat. Een verse GET is de
  // waarheid — reloadUntilVisible herlaadt tot de persistente dienst-link er staat.
  const dienstLink = page.getByRole("link", { name: titel });
  await reloadUntilVisible(page, dienstLink);
  const href = await dienstLink.getAttribute("href");
  return href!.split("/").pop()!;
}
