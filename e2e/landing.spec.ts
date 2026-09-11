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
    const button = page.getByRole("link", { name: audience, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-current", "page");
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
    await expect(page.locator(".hv5-337")).toHaveAttribute("tabindex", "-1");
    for (const [name, key] of [
      ["Opdrachtgever", "organisation"],
      ["Bemiddelaar", "intermediary"],
      ["Zzp’er", "professional"],
    ]) {
      const link = page.getByRole("link", { name, exact: true });
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`audience=${key}`));
      await expect(link).toHaveAttribute("aria-current", "page");
      await expect(page.locator("[data-panel]")).toHaveCount(3);
      await page.reload();
      await expect(link).toHaveAttribute("aria-current", "page");
    }
  } finally {
    await context.close().catch(() => {});
  }
});

test("V5 keeps the approved light design without overwriting the saved app theme", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator(".hv5-1")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator("h1")).toHaveCSS("color", "rgb(0, 118, 168)");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  await page.getByRole("link", { name: "Handslag voor Opdrachtgevers", exact: true }).click();
  await expect(page.getByRole("link", { name: "Opdrachtgever", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goBack();
  await expect(page.getByRole("link", { name: "Zzp’er", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator(".hv5-1")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator("h1")).toHaveCSS("color", "rgb(0, 118, 168)");
});

test("V5 stays light on a dark-mode phone and preserves the app theme on navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    });
    Object.defineProperty(navigator, "maxTouchPoints", { value: 5 });
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator(".hv5-1")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator("h1")).toHaveCSS("color", "rgb(0, 118, 168)");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#ffffff");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();
  const install = page.getByRole("dialog", { name: "App installeren" });
  await expect(install).toBeVisible();
  await expect(install.locator(".bg-card")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(install.locator("p.text-card-foreground")).toHaveCSS("color", "rgb(0, 79, 115)");
  await expect(install.locator("p.text-muted-foreground")).toHaveCSS("color", "rgb(0, 79, 115)");
  await page
    .getByRole("link", { name: /Inloggen/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});
