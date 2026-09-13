import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { acceptAndProposeCollaboration, clickForUrl, clickUntil } from "./_robust";
import {
  collaborationFromSigningLink,
  fillSigning,
  openSigning,
  submitSigning,
  TEST_SIGNING_PASSWORD,
} from "./signing-helpers";

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const clientName = "Sophie van de Berg";
const freelancerName = "Sam de Vries";

async function register(page: Page, role: "client" | "freelancer", token: string) {
  await page.goto("/register");
  await page.waitForSelector('html[data-hydrated="/register"]');
  if (role === "client") await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", role === "client" ? clientName : freelancerName);
  if (role === "client") await page.fill("#companyName", "Ondertekenproef Testbedrijf B.V.");
  await page.fill("#email", `signing-${role}-${token}@test.local`);
  await page.fill("#password", TEST_SIGNING_PASSWORD);
  await clickForUrl(page.getByRole("button", { name: "Account aanmaken" }), page, "**/dashboard");
}

/** Fresh synthetic users create their own collaboration through the normal product flow. */
async function propose(client: Page, freelancer: Page) {
  const token = unique();
  const title = `Ondertekenproef ${token}`;
  await register(client, "client", token);
  await client.goto("/opdrachten/nieuw");
  await client.fill("#title", title);
  await client.fill(
    "#description",
    "Een zelfstandige testopdracht met heldere schriftelijke afspraken.",
  );
  await client.selectOption("#workMode", "REMOTE");
  await clickUntil(
    client.getByRole("button", { name: "Opslaan als concept" }),
    client.getByRole("heading", { name: title }),
  );
  const jobUrl = client.url();
  await clickUntil(
    client.getByRole("button", { name: "Publiceren" }),
    client.getByText("Gepubliceerd"),
  );
  await register(freelancer, "freelancer", token);
  await freelancer.goto(jobUrl);
  await freelancer.fill(
    "#motivation",
    "Ik heb de opdracht gelezen en werk graag zelfstandig aan dit project.",
  );
  await clickForUrl(
    freelancer.getByRole("button", { name: "Reactie versturen" }),
    freelancer,
    "**/reacties",
  );
  await client.goto("/kandidaten");
  await client.getByRole("button", { name: "Toon details" }).click();
  await acceptAndProposeCollaboration(client, "85");
  await client.goto("/samenwerkingen");
  return collaborationFromSigningLink(
    client
      .locator("div.bg-card", { hasText: title })
      .getByRole("link", { name: "Contract ondertekenen" }),
  );
}

async function assertMobileLayout(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  const inputs = page.locator('input[name="signerName"], input[name="password"]');
  await expect(inputs).toHaveCount(2);
  for (const input of await inputs.all()) {
    expect(
      await input.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ).toBeGreaterThanOrEqual(16);
  }
  const submit = page.getByRole("button", { name: "Overeenkomst ondertekenen", exact: true });
  expect((await submit.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const restingShadow = await inputs
    .first()
    .evaluate((element) => getComputedStyle(element).boxShadow);
  await page.keyboard.press("Tab");
  await inputs.first().focus();
  await expect(inputs.first()).toBeFocused();
  expect(await inputs.first().evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  expect(await inputs.first().evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(
    restingShadow,
  );
}

test.describe("Handslag ordinary electronic signatures on mobile", () => {
  test.use({ isMobile: true, hasTouch: true, contextOptions: { reducedMotion: "reduce" } });
  for (const width of [320, 390]) {
    for (const theme of ["light", "dark"] as const) {
      test(`two parties, private immutable evidence and touch flow ${width}px ${theme}`, async ({
        page,
        browser,
        request,
      }) => {
        test.setTimeout(180000);
        await page.setViewportSize({ width, height: 844 });
        await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
        const context = await browser.newContext({
          baseURL: test.info().project.use.baseURL,
          viewport: { width, height: 844 },
          isMobile: true,
          hasTouch: true,
          reducedMotion: "reduce",
          colorScheme: theme,
        });
        await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
        const freelancer = await context.newPage();
        try {
          const collaborationUrl = await propose(page, freelancer);
          const documentHash = await openSigning(page, collaborationUrl);
          await expect(page.getByText("0 van 2", { exact: true })).toBeVisible();
          await expect(page.locator('input[name="consent"]')).not.toBeChecked();
          await expect(page.locator('input[name="reviewed"]')).not.toBeChecked();
          await expect(page.locator('input[name="authority"]')).not.toBeChecked();
          await expect(page.locator('[data-seal="verified"]')).toHaveCount(0);
          expect(
            await page.evaluate(() => document.documentElement.classList.contains("dark")),
          ).toBe(theme === "dark");
          await assertMobileLayout(page, width);

          const pdfUrl = (await page
            .getByRole("link", { name: "Open document als PDF" })
            .getAttribute("href"))!;
          const originalUrl = `${pdfUrl}?original=1`;
          const original = await page.request.get(originalUrl);
          expect(original.status()).toBe(200);
          expect(original.headers()["content-type"]).toContain("application/pdf");
          expect(original.headers()["cache-control"]).toContain("no-store");
          const originalBytes = await original.body();
          expect(originalBytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
          // Middleware rejects anonymous access before the private PDF route runs.
          // Do not follow the redirect: the public login page legitimately returns 200.
          const anonymous = await request.get(pdfUrl, { maxRedirects: 0 });
          expect(anonymous.status()).toBe(307);
          const loginLocation = anonymous.headers().location;
          expect(loginLocation).toBeTruthy();
          expect(new URL(loginLocation!, anonymous.url()).pathname).toBe("/login");
          expect(anonymous.headers()["content-type"] ?? "").not.toContain("application/pdf");
          expect((await anonymous.body()).subarray(0, 5).toString("latin1")).not.toBe("%PDF-");
          await page.screenshot({
            path: `e2e/screenshots/handslag-signing-${width}-${theme}-read.png`,
            fullPage: true,
          });

          // A rejected reauthentication must not add a signature or activate the collaboration.
          await fillSigning(page, clientName, "onjuist-testwachtwoord");
          await page.getByRole("button", { name: "Overeenkomst ondertekenen", exact: true }).tap();
          const error = page.getByRole("alert").filter({ hasText: "Je wachtwoord klopt niet" });
          await expect(error).toBeVisible();
          await expect(error).toBeFocused();
          await expect(page.getByText("0 van 2", { exact: true })).toBeVisible();
          await expect(page.locator('[data-seal="verified"]')).toHaveCount(0);
          await fillSigning(page, clientName);
          await page.locator('input[name="consent"]').tap();
          await expect(page.locator('input[name="consent"]')).not.toBeChecked();
          expect(
            await page
              .locator('input[name="consent"]')
              .evaluate((input: HTMLInputElement) => input.validity.valueMissing),
          ).toBe(true);
          await page.locator('input[name="consent"]').tap();
          await submitSigning(page, 1, true);
          await page.screenshot({
            path: `e2e/screenshots/handslag-signing-${width}-${theme}-first-signature.png`,
            fullPage: true,
          });
          await page.goto(collaborationUrl);
          await expect(page.getByText("Voorgesteld", { exact: true }).first()).toBeVisible();

          // The second account signs precisely the persisted version, independently.
          expect(await openSigning(freelancer, collaborationUrl)).toBe(documentHash);
          await fillSigning(freelancer, freelancerName);
          await submitSigning(freelancer, 2, true);
          await expect(
            freelancer.getByText("Door beide partijen ondertekend", { exact: true }),
          ).toBeVisible();
          await freelancer.screenshot({
            path: `e2e/screenshots/handslag-signing-${width}-${theme}-complete.png`,
            fullPage: true,
          });
          expect(
            await freelancer.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);

          const persistedOriginal = await freelancer.request.get(originalUrl);
          expect(persistedOriginal.status()).toBe(200);
          expect(await persistedOriginal.body()).toEqual(originalBytes);
          const evidenceResponse = await freelancer.request.get(`${pdfUrl}?format=json`);
          expect(evidenceResponse.status()).toBe(200);
          const evidence = await evidenceResponse.json();
          expect(evidence.documentHash).toBe(documentHash);
          expect(evidence.pdfHash).toBe(createHash("sha256").update(originalBytes).digest("hex"));
          expect(evidence.signatures).toHaveLength(2);
          expect(
            evidence.signatures.map((signature: { party: string }) => signature.party).sort(),
          ).toEqual(["CLIENT", "FREELANCER"]);
          expect(
            new Set(evidence.signatures.map((signature: { actorId: string }) => signature.actorId))
              .size,
          ).toBe(2);
          expect(
            evidence.signatures
              .map((signature: { signerName: string }) => signature.signerName)
              .sort(),
          ).toEqual([freelancerName, clientName].sort());
          expect(JSON.stringify(evidence)).not.toContain(TEST_SIGNING_PASSWORD);
          expect(evidence.status).toBe("ACTIVE");
          const receipt = await freelancer.request.get(pdfUrl);
          expect(receipt.status()).toBe(200);
          expect(receipt.headers()["content-type"]).toContain("application/pdf");
          expect((await receipt.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");
          await page.goto(collaborationUrl);
          await expect(page.getByText("Actief", { exact: true }).first()).toBeVisible();
        } finally {
          await context.close();
        }
      });
    }
  }
});
