import { expect, test } from "@playwright/test";
import { ACCOUNTS, login, shot } from "./helpers";

test.describe("QA: Quality anchors", () => {
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
    await shot(page, "anchor-wrong-password");
  });

  test("het woord AI verschijnt nergens in de zichtbare UI", async ({ page }) => {
    await login(page, ACCOUNTS.freelancer);
    const routes = [
      "/dashboard",
      "/certificaten",
      "/opdrachten",
      "/profiel",
      "/berichten",
      "/notificaties",
      "/facturen",
      "/beschikbaarheid",
      "/documenten",
    ];
    for (const route of routes) {
      await page.goto(route);
      const body = await page.locator("body").innerText();
      const aiMatches = body.match(/\bAI\b/g);
      if (aiMatches) {
        await shot(page, `anchor-ai-found-${route.replace(/\//g, "-")}`);
      }
      expect(aiMatches, `"AI" gevonden op ${route}`).toBeNull();
    }
  });

  test("freelancer kan /admin niet bereiken (server-side)", async ({ page }) => {
    await login(page, ACCOUNTS.freelancer);
    const res = await page.goto("/admin/verificaties");
    expect(res?.status()).toBeGreaterThanOrEqual(300);
  });

  test("client kan /admin niet bereiken (server-side)", async ({ page }) => {
    await login(page, ACCOUNTS.client);
    const res = await page.goto("/admin/gebruikers");
    expect(res?.status()).toBeGreaterThanOrEqual(300);
  });
});
