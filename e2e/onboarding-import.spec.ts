import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// E2e voor de admin CSV-onboarding-import + geforceerde wachtwoordwijziging.
// Draait alleen in een interactieve sessie mét browser (Edge-channel); in CI/routine overgeslagen.

const SHOTS = path.join("e2e", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "admin@zzp-platform.local");
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

test("admin importeert ZZP'er + opdrachtgever via CSV en ziet controle-overzicht", async ({
  page,
}) => {
  test.slow();
  const stamp = uniq();
  const freelancerEmail = `import-zzp-${stamp}@test.local`;
  const clientEmail = `import-client-${stamp}@test.local`;

  // CSV met één geldige ZZP'er, één geldige opdrachtgever en één foute rij (geen e-mail).
  const csv = [
    "naam;email;rol;bedrijfsnaam;uurtarief;vaardigheden",
    `Geimporteerde Zorgverlener;${freelancerEmail};ZZP'er;;55;"IC;BIG"`,
    `Geimporteerd Zorgburo;${clientEmail};Opdrachtgever;Zorgburo Import;;`,
    `Foute Rij;;ZZP'er;;;`,
  ].join("\r\n");

  await loginAdmin(page);
  await page.goto("/admin/import");
  await expect(page.getByRole("heading", { name: "Onboarding importeren" })).toBeVisible();

  // Upload in-memory (geen bestand op schijf nodig).
  await page.locator("#csv").setInputFiles({
    name: "onboarding.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf-8"),
  });
  await page.getByRole("button", { name: /Controleer bestand/ }).click();

  // Controle-overzicht: twee aanmaken, één fout (samenvattingschips als badges).
  await expect(page.getByText("3 rijen")).toBeVisible();
  await expect(page.locator("span", { hasText: /^2 aanmaken$/ })).toBeVisible();
  await expect(page.locator("span", { hasText: /^1 fout$/ })).toBeVisible();
  await expect(page.getByText(freelancerEmail)).toBeVisible();
  await shot(page, "20-import-preview");

  // Bevestigen → resultaat met tijdelijke inloggegevens op het scherm.
  await page.getByRole("button", { name: /Bevestig import/ }).click();
  await expect(page.getByText("2 aangemaakt")).toBeVisible();
  await expect(page.getByText("Tijdelijke inloggegevens")).toBeVisible();
  await expect(page.getByText(freelancerEmail)).toBeVisible();
  await shot(page, "21-import-resultaat");

  // Het tijdelijke wachtwoord van de ZZP'er uit de resultaattabel halen.
  const row = page.locator("tr", { hasText: freelancerEmail });
  const tempPassword = (await row.locator("td.font-mono").innerText()).trim();
  expect(tempPassword.length).toBeGreaterThanOrEqual(12);

  // De geïmporteerde gebruiker verschijnt in het gebruikersoverzicht.
  await page.goto(`/admin/gebruikers?q=${encodeURIComponent(freelancerEmail)}`);
  await expect(page.getByText(freelancerEmail)).toBeVisible();

  // --- Geforceerde wachtwoordwijziging bij eerste login -------------------
  const ctx = await page.context().browser()!.newContext();
  const userPage = await ctx.newPage();
  await userPage.goto("/login");
  await userPage.fill("#email", freelancerEmail);
  await userPage.fill("#password", tempPassword);
  await userPage.getByRole("button", { name: "Inloggen" }).click();
  // Wacht tot de login-POST is afgerond (server-redirect naar een beschermde route).
  await userPage.waitForLoadState("networkidle");

  // Middleware dwingt elke beschermde route naar de wachtwoord-wijzigpagina tot het eigen
  // wachtwoord is ingesteld. Expliciet /dashboard openen moet dus op de wijzigpagina eindigen.
  await userPage.goto("/dashboard");
  await expect(userPage).toHaveURL(/\/account\/wachtwoord/);
  await expect(userPage.getByRole("heading", { name: "Wachtwoord wijzigen" })).toBeVisible();
  await shot(userPage, "22-forced-password-change");

  // Eigen wachtwoord instellen → uitgelogd → opnieuw inloggen werkt.
  const newPassword = "EigenWachtwoord!9";
  await userPage.fill("#currentPassword", tempPassword);
  await userPage.fill("#newPassword", newPassword);
  await userPage.fill("#confirmPassword", newPassword);
  await userPage.getByRole("button", { name: "Wachtwoord wijzigen" }).click();
  await userPage.waitForURL(/\/login/);

  await userPage.fill("#email", freelancerEmail);
  await userPage.fill("#password", newPassword);
  await userPage.getByRole("button", { name: "Inloggen" }).click();
  await userPage.waitForURL("**/dashboard");
  await expect(userPage).toHaveURL(/\/dashboard/);
  await ctx.close();
});

test("import weigert een niet-CSV-bestand", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/admin/import");
  await page.locator("#csv").setInputFiles({
    name: "niet-csv.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("dit is geen csv", "utf-8"),
  });
  // De wizard weigert een niet-CSV al client-side: de controleknop blijft uitgeschakeld
  // (de server-side extensie-/MIME-poort in actions.ts blijft de harde grens).
  await expect(page.getByRole("button", { name: /Controleer bestand/ })).toBeDisabled();
});
