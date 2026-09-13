import { expect, type Locator, type Page } from "@playwright/test";

export const TEST_SIGNING_PASSWORD = "geheim123";

export function collaborationPath(url: string) {
  const pathname = new URL(url, "http://localhost").pathname.replace(/\/ondertekenen$/, "");
  expect(pathname).toMatch(/^\/samenwerkingen\/[a-z0-9]+$/);
  return pathname;
}

export async function collaborationFromSigningLink(link: Locator) {
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/samenwerkingen\/[a-z0-9]+\/ondertekenen$/);
  return collaborationPath(href!);
}

export async function openSigning(page: Page, url: string) {
  const pathname = `${collaborationPath(url)}/ondertekenen`;
  await page.goto(pathname);
  await expect(
    page.getByRole("heading", { name: "Een handtekening. Heldere afspraken." }),
  ).toBeVisible();
  await page.waitForSelector(`html[data-hydrated="${pathname}"]`);
  const agreement = page.getByRole("article", { name: "Volledige overeenkomst" });
  await expect(agreement).toBeVisible();
  expect(await agreement.locator("section").count()).toBeGreaterThan(0);
  const documentHash = await page.locator('input[name="documentHash"]').inputValue();
  expect(documentHash).toMatch(/^[a-f0-9]{64}$/);
  return documentHash;
}

export async function fillSigning(page: Page, name: string, password = TEST_SIGNING_PASSWORD) {
  await page.getByLabel("Je volledige naam", { exact: false }).fill(name);
  await page.locator('input[name="reviewed"]').check();
  await page.locator('input[name="consent"]').check();
  await page.locator('input[name="authority"]').check();
  await page.getByLabel("Je huidige wachtwoord", { exact: false }).fill(password);
}

export async function submitSigning(page: Page, expectedSignatures: 1 | 2, touch = false) {
  const submit = page.getByRole("button", { name: "Overeenkomst ondertekenen", exact: true });
  if (touch) await submit.tap();
  else await submit.click();
  await expect(page.getByText(`${expectedSignatures} van 2`, { exact: true })).toBeVisible({
    timeout: 20000,
  });
  await expect(
    page.getByRole("button", { name: "Overeenkomst ondertekenen", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('[data-seal="verified"]').first()).toBeVisible();
}

/** Real independent account sessions sign the same version; one signature cannot activate it. */
export async function signBothParties(
  client: Page,
  freelancer: Page,
  url: string,
  names: { clientName: string; freelancerName: string; password?: string },
) {
  const path = collaborationPath(url);
  const hash = await openSigning(client, path);
  await fillSigning(client, names.clientName, names.password);
  await submitSigning(client, 1);
  await client.goto(path);
  await expect(client.getByText("Voorgesteld", { exact: true }).first()).toBeVisible();
  expect(await openSigning(freelancer, path)).toBe(hash);
  await fillSigning(freelancer, names.freelancerName, names.password);
  await submitSigning(freelancer, 2);
  await expect(
    freelancer.getByText("Door beide partijen ondertekend", { exact: true }),
  ).toBeVisible();
  await client.goto(path);
  await freelancer.goto(path);
  await expect(client.getByText("Actief", { exact: true }).first()).toBeVisible();
  await expect(freelancer.getByText("Actief", { exact: true }).first()).toBeVisible();
}
