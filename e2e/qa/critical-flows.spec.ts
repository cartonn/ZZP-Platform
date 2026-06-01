import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// QA baseline: doorklikken van alle kritieke user-flows als een echte gebruiker.
// Dit is de onafhankelijke controle — niet gebouwd door dezelfde agent die de feature maakte.

const SHOTS = path.join("e2e", "qa", "screenshots");
const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

// ---------------------------------------------------------------------------
// Health & auth
// ---------------------------------------------------------------------------

test("health endpoint geeft status + commit", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.db).toBe(true);
  expect(body).toHaveProperty("commit");
});

test("ongeauthenticeerd → redirect naar login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("verkeerd wachtwoord → foutmelding", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "zzp@zzp-platform.local");
  await page.fill("#password", "foutwachtwoord");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await shot(page, "auth-wrong-password");
});

// ---------------------------------------------------------------------------
// FREELANCER flow: Sanne
// ---------------------------------------------------------------------------

test("freelancer: dashboard → next-actions zichtbaar", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-dashboard");
});

test("freelancer: certificaten-overzicht toont statussen", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/certificaten");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-certificaten");
});

test("freelancer: profiel bekijken", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/profiel");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-profiel");
});

test("freelancer: opdrachten bladeren", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/opdrachten");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-opdrachten");
});

test("freelancer: berichten pagina", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/berichten");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-berichten");
});

test("freelancer: notificaties pagina", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/notificaties");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-notificaties");
});

test("freelancer: beschikbaarheid pagina", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/beschikbaarheid");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-beschikbaarheid");
});

test("freelancer: documenten pagina", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/documenten");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-documenten");
});

test("freelancer: facturen pagina", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  await page.goto("/facturen");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "freelancer-facturen");
});

// ---------------------------------------------------------------------------
// CLIENT flow: Mark Jansen
// ---------------------------------------------------------------------------

test("client: dashboard toont opdrachtgever-view", async ({ page }) => {
  await login(page, "opdrachtgever@zzp-platform.local");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "client-dashboard");
});

test("client: opdrachten beheren", async ({ page }) => {
  await login(page, "opdrachtgever@zzp-platform.local");
  await page.goto("/opdrachten");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "client-opdrachten");
});

test("client: kandidaten/reacties bekijken", async ({ page }) => {
  await login(page, "opdrachtgever@zzp-platform.local");
  await page.goto("/reacties");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "client-reacties");
});

test("client: freelancers zoeken", async ({ page }) => {
  await login(page, "opdrachtgever@zzp-platform.local");
  await page.goto("/freelancers");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "client-freelancers");
});

// ---------------------------------------------------------------------------
// ADMIN flow
// ---------------------------------------------------------------------------

test("admin: dashboard toont beheerwerkplek", async ({ page }) => {
  await login(page, "admin@zzp-platform.local");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "admin-dashboard");
});

test("admin: verificatiequeue", async ({ page }) => {
  await login(page, "admin@zzp-platform.local");
  await page.goto("/admin/verificaties");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "admin-verificaties");
});

test("admin: gebruikersbeheer", async ({ page }) => {
  await login(page, "admin@zzp-platform.local");
  await page.goto("/admin/gebruikers");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "admin-gebruikers");
});

test("admin: audit log", async ({ page }) => {
  await login(page, "admin@zzp-platform.local");
  await page.goto("/admin/audit");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "admin-audit");
});

// ---------------------------------------------------------------------------
// Security: cross-role access denial
// ---------------------------------------------------------------------------

test("freelancer kan /admin niet bereiken", async ({ page }) => {
  await login(page, "zzp@zzp-platform.local");
  const res = await page.goto("/admin/verificaties");
  expect(res?.status()).toBeGreaterThanOrEqual(300);
  await shot(page, "security-freelancer-admin-blocked");
});

test("client kan /admin niet bereiken", async ({ page }) => {
  await login(page, "opdrachtgever@zzp-platform.local");
  const res = await page.goto("/admin/gebruikers");
  expect(res?.status()).toBeGreaterThanOrEqual(300);
  await shot(page, "security-client-admin-blocked");
});

// ---------------------------------------------------------------------------
// Quality anchor: geen "AI" in de UI
// ---------------------------------------------------------------------------

test("het woord AI verschijnt nergens in de zichtbare UI", async ({ page }) => {
  const pages = ["/login", "/dashboard", "/certificaten", "/opdrachten", "/profiel"];
  await login(page, "zzp@zzp-platform.local");
  for (const p of pages) {
    await page.goto(p);
    const body = await page.locator("body").innerText();
    const aiMatches = body.match(/\bAI\b/g);
    if (aiMatches) {
      await shot(page, `ai-found-${p.replace(/\//g, "-")}`);
    }
    expect(aiMatches, `"AI" gevonden op ${p}`).toBeNull();
  }
});
