import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("V5 landing connects visitors to registration and keeps the app protected", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Een goede opdracht begint bij handslag." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Inloggen", exact: true })).toHaveAttribute(
    "href",
    "/login",
  );
  await page.getByRole("link", { name: "Account aanmaken bij Handslag" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Account aanmaken" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("mobile V5 keeps every audience and FAQ usable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hs-hero-quote")).toHaveAttribute("data-quote-state", "complete");
  for (const audience of ["Zzp’er", "Opdrachtgever", "Bemiddelaar"]) {
    const button = page.getByRole("button", { name: audience, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-panel]")).toHaveCount(3);
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  }
  const question = page.getByText("Hoe verlopen de betalingen?", { exact: true });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details").filter({ has: question })).toHaveAttribute("open", "");
  await expect(
    page.getByText(/De opdrachtgever betaalt de zorgprofessional rechtstreeks/),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("details").filter({ has: question })).not.toHaveAttribute("open", "");
  await expect(page.getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute(
    "href",
    "/privacy",
  );
});

test("the quote finishes between both hands and survives a mobile resize", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hs-hero-quote")).toHaveAttribute("data-quote-state", "complete", {
    timeout: 15000,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.locator(".hs-hero-quote").evaluate((root) => {
        const words = [...root.querySelectorAll(".hs-hero-word")];
        const first = words[0]!.getBoundingClientRect();
        const last = words.at(-1)!.getBoundingClientRect();
        const left = root.querySelector(".hs-hero-hand-lower")!.getBoundingClientRect();
        const right = root.querySelector(".hs-hero-hand-upper")!.getBoundingClientRect();
        return (
          left.right < first.left &&
          right.right > last.right &&
          words.every((word) => getComputedStyle(word).opacity === "1")
        );
      }),
    )
    .toBe(true);
});

test("slow JavaScript starts with only the joined hands, without flashing the phrase", async ({
  page,
}) => {
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".hs-hero-hand-upper")).toBeVisible();
  await expect(page.locator(".hs-hero-hand-lower")).toBeVisible();
  for (const word of await page.locator(".hs-hero-word").all())
    await expect(word).toHaveCSS("opacity", "0");
});

test("the heading stays readable when JavaScript is disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(
      page.getByRole("heading", { level: 1, name: "Een goede opdracht begint bij handslag." }),
    ).toBeVisible();
    for (const word of await page.locator(".hs-hero-word").all())
      await expect(word).toHaveCSS("opacity", "1");
    await expect(page.locator(".hs-hero-hand-upper")).toBeHidden();
    const paymentQuestion = page.getByText("Hoe verlopen de betalingen?", { exact: true });
    await paymentQuestion.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText(/De opdrachtgever betaalt de zorgprofessional rechtstreeks/),
    ).toBeVisible();
    await expect(
      page.getByText(/Handslag biedt geen vooruitbetaling of betalingsgarantie/),
    ).toBeVisible();
    await expect(page.locator(".hs-faq-item")).toHaveCount(5);
  } finally {
    await context.close();
  }
});
