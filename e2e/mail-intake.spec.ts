import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const intakePath = "/opdrachten/mail-intake";
const webhookPath = "/api/mail-intake/webhook";
const fixtureSecret = "e2e-only-mail-intake-local-fixtures";

async function registerClient(page: Page, email: string) {
  await page.goto("/register");
  await page.waitForSelector('html[data-hydrated="/register"]');
  await page.getByText("Opdrachtgever", { exact: true }).click();
  await page.fill("#name", "Mailintake Testpersoon");
  await page.fill("#companyName", "Mailintake Testbedrijf");
  await page.fill("#email", email);
  await page.fill("#password", "MailIntakeTest2026!");
  await page.getByRole("button", { name: "Account aanmaken" }).click();
  await page.waitForURL("**/dashboard");
}

async function openQueue(page: Page) {
  await page.goto(intakePath);
  await page.waitForSelector(`html[data-hydrated="${intakePath}"]`);
}

test("mail-intake: authenticated delivery, ownership, deduplication and a human-created draft", async ({
  page,
  browser,
  request,
}) => {
  test.setTimeout(120000);
  // This suite deliberately enables only a known synthetic webhook credential on a local server.
  // Missing configuration is a failure, not a silently skipped coverage requirement.
  expect(process.env.MAIL_INTAKE_WEBHOOK_SECRET).toBe(fixtureSecret);
  const baseURL = test.info().project.use.baseURL!;
  expect(["localhost", "127.0.0.1", "[::1]"]).toContain(new URL(baseURL).hostname);

  const token = randomUUID();
  const ownerEmail = `mail-owner-${token}@test.local`;
  const otherEmail = `mail-other-${token}@test.local`;
  const title = `Mailproef ${token}`;
  const otherTitle = `Andere mailproef ${token}`;
  const headers = { authorization: `Bearer ${fixtureSecret}` };
  const payload = {
    MessageID: `mail-${token}`,
    From: ownerEmail,
    Subject: title,
    TextBody: "Locatie: Amersfoort\nTarief: 85-95\nEen zelfstandige opdracht ter beoordeling.",
  };
  const otherContext = await browser.newContext({ baseURL });
  const other = await otherContext.newPage();
  try {
    await registerClient(page, ownerEmail);
    await registerClient(other, otherEmail);

    for (const authorization of [undefined, "Bearer incorrect-fixture-secret"]) {
      const denied = await request.post(webhookPath, {
        headers: authorization ? { authorization } : {},
        data: payload,
      });
      expect(denied.status()).toBe(401);
    }
    await openQueue(page);
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);

    for (let delivery = 0; delivery < 2; delivery++) {
      const accepted = await request.post(webhookPath, { headers, data: payload });
      expect(accepted.status()).toBe(200);
    }
    await openQueue(page);
    const queue = page.getByRole("region", { name: "Te beoordelen aanvragen" });
    await expect(queue.getByText(title, { exact: true })).toHaveCount(1);
    await expect(queue.getByText("Amersfoort", { exact: true })).toBeVisible();
    await expect(queue.getByText("€ 85–95/u", { exact: true })).toBeVisible();
    const ownerForm = queue.locator("form").filter({
      has: page.getByRole("button", { name: "Maak concept-opdracht", exact: true }),
    });
    const ownerIntakeId = await ownerForm.locator('input[name="intakeId"]').inputValue();
    expect(ownerIntakeId).not.toBe("");
    await expect(page.getByRole("link", { name: "Naar opdracht", exact: true })).toHaveCount(0);

    await openQueue(other);
    await expect(other.getByText(title, { exact: true })).toHaveCount(0);
    expect(
      (
        await request.post(webhookPath, {
          headers,
          data: { ...payload, MessageID: `other-${token}`, From: otherEmail, Subject: otherTitle },
        })
      ).status(),
    ).toBe(200);
    await openQueue(other);
    const otherForm = other.locator("form").filter({
      has: other.getByRole("button", { name: "Maak concept-opdracht", exact: true }),
    });
    // Submit another company's identifier through the real server action, not a mocked handler.
    await otherForm.evaluate((form, id) => {
      form.addEventListener("formdata", (event) => {
        (event as FormDataEvent).formData.set("intakeId", id);
      });
    }, ownerIntakeId);
    const [foreignSubmission] = await Promise.all([
      other.waitForRequest(
        (request) =>
          request.method() === "POST" &&
          new URL(request.url()).pathname === intakePath &&
          !!request.headers()["next-action"],
      ),
      otherForm.getByRole("button", { name: "Maak concept-opdracht", exact: true }).click(),
    ]);
    expect(foreignSubmission.postData()).toContain(ownerIntakeId);
    await expect(otherForm.getByRole("alert")).toHaveText("Aanvraag niet gevonden.");

    await ownerForm.getByRole("button", { name: "Maak concept-opdracht", exact: true }).click();
    await page.waitForURL(
      (url) => url.pathname !== intakePath && /^\/opdrachten\/[^/]+$/.test(url.pathname),
    );
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const draftPath = new URL(page.url()).pathname;
    await expect(page.getByText("Concept", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Publiceren", exact: true })).toBeVisible();
    // ADR-0009 permits the protected shell's soft-404; denial must still be explicit,
    // and neither rendered content nor the response body may disclose the private draft.
    const deniedDraft = await other.goto(draftPath);
    expect([200, 404]).toContain(deniedDraft?.status());
    await expect(other.getByRole("heading", { name: "Niet gevonden", exact: true })).toBeVisible();
    await expect(other.getByText(title, { exact: true })).toHaveCount(0);
    expect(await deniedDraft!.text()).not.toContain(title);

    // A provider retry after human acceptance must retain the one existing draft link.
    expect((await request.post(webhookPath, { headers, data: payload })).status()).toBe(200);
    await openQueue(page);
    await expect(queue.getByText(title, { exact: true })).toHaveCount(0);
    const handled = page.getByRole("region", { name: "Afgehandelde aanvragen" });
    await expect(handled.getByText(title, { exact: true })).toHaveCount(1);
    const draftLink = handled.getByRole("link", { name: "Naar opdracht", exact: true });
    await expect(draftLink).toHaveCount(1);
    await expect(draftLink).toHaveAttribute("href", draftPath);
    await openQueue(other);
    await expect(other.getByText(otherTitle, { exact: true })).toHaveCount(1);
    await expect(other.getByRole("link", { name: "Naar opdracht", exact: true })).toHaveCount(0);
  } finally {
    await otherContext.close();
  }
});
