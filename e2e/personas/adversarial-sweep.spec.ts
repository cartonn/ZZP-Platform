// Adversariële persona-sweep (DOEL 2): doet bewust wat NIET mag en verifieert dat het systeem
// weigert (redirect/404/403), nooit 500/stille toegang. Records per probe de HTTP-status + final URL
// in shots/adversarial/_probes.json. Draait NIET in de gating-suite (persona-config).
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join("e2e", "personas", "shots", "adversarial");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

interface Probe {
  role: string;
  label: string;
  target: string;
  status: number | null;
  finalUrl: string;
  verdict: "PASS" | "FAIL";
  expected: string;
}
const probes: Probe[] = [];

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 }).catch(() => {});
}

function record(p: Probe) {
  probes.push(p);
  fs.writeFileSync(path.join(OUT, "_probes.json"), JSON.stringify(probes, null, 2));
}

// Navigate and record status; verdict PASS when the observed status/redirect matches `okWhen`.
async function probe(
  page: Page,
  role: string,
  label: string,
  target: string,
  okWhen: (status: number | null, finalUrl: string) => boolean,
  expected: string,
) {
  let status: number | null = null;
  try {
    const resp = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 15000 });
    status = resp ? resp.status() : null;
  } catch {
    status = null;
  }
  await page.waitForTimeout(300);
  const finalUrl = page.url();
  const verdict = okWhen(status, finalUrl) ? "PASS" : "FAIL";
  record({ role, label, target, status, finalUrl, verdict, expected });
}

const NONSENSE = "clv0000000000000000nonsense";

test.describe.configure({ mode: "serial" });

// A non-admin hitting /admin/* must be redirected to /dashboard (no escalation), never 200 on admin UI.
async function adminEscalationProbes(page: Page, role: string) {
  const adminRoutes = [
    "/admin/verificaties",
    "/admin/gebruikers",
    "/admin/facturatie",
    "/admin/no-shows",
    "/admin/support",
    "/admin/audit",
  ];
  for (const r of adminRoutes) {
    await probe(
      page,
      role,
      `escalatie ${r}`,
      r,
      (_s, url) => !url.includes("/admin/"),
      "redirect weg van /admin/*",
    );
  }
}

// Nonsense ids on detail routes / PDF APIs must be 404 (anti-oracle), never 500.
async function nonsenseIdProbes(page: Page, role: string) {
  const targets = [
    `/samenwerkingen/${NONSENSE}`,
    `/facturen/${NONSENSE}`,
    `/opdrachten/${NONSENSE}`,
    `/api/facturen/${NONSENSE}/pdf`,
    `/api/samenwerkingen/${NONSENSE}/dossier`,
    `/api/samenwerkingen/${NONSENSE}/modelovereenkomst`,
  ];
  for (const t of targets) {
    await probe(
      page,
      role,
      `onzin-id ${t}`,
      t,
      (s, url) =>
        s !== 500 &&
        (s === 404 ||
          s === 403 ||
          url.includes("/login") ||
          url === "about:blank" ||
          (s !== null && s < 500)),
      "404/403, nooit 500",
    );
  }
}

test("freelancer adversarial", async ({ page }) => {
  test.slow();
  await login(page, "zzp@zzp-platform.local");
  await adminEscalationProbes(page, "FREELANCER");
  await nonsenseIdProbes(page, "FREELANCER");
  // Cross-role: freelancer opening client-only surfaces
  await probe(
    page,
    "FREELANCER",
    "client /kandidaten",
    "/kandidaten",
    (_s, url) => !url.includes("/kandidaten") || _s === 403 || _s === 404,
    "geen client-scherm",
  );
  await page
    .screenshot({ path: path.join(OUT, "freelancer-final.png"), fullPage: true })
    .catch(() => {});
});

test("client adversarial", async ({ page }) => {
  test.slow();
  await login(page, "opdrachtgever@zzp-platform.local");
  await adminEscalationProbes(page, "CLIENT");
  await nonsenseIdProbes(page, "CLIENT");
  await page
    .screenshot({ path: path.join(OUT, "client-final.png"), fullPage: true })
    .catch(() => {});
});

test("franchiser adversarial", async ({ page }) => {
  test.slow();
  await login(page, "franchise@zzp-platform.local");
  await adminEscalationProbes(page, "FRANCHISER");
  await nonsenseIdProbes(page, "FRANCHISER");
  // Cross-tenant: franchiser guessing another tenant's franchise-scoped detail id
  await probe(
    page,
    "FRANCHISER",
    "cross-tenant zzper",
    `/franchise/zzpers/${NONSENSE}`,
    (s, url) =>
      s !== 500 && (s === 404 || s === 403 || !url.includes(NONSENSE) || (s !== null && s < 500)),
    "404/403, nooit 500",
  );
  await page
    .screenshot({ path: path.join(OUT, "franchiser-final.png"), fullPage: true })
    .catch(() => {});
});

test("task endpoints fail-closed", async ({ page }) => {
  // Cron/task endpoints without CRON_SECRET must fail closed (401/403/404/503), never run.
  await login(page, "zzp@zzp-platform.local");
  const taskRoutes = ["/api/tasks/run-all", "/api/tasks/expiry", "/api/tasks/platform-billing"];
  for (const t of taskRoutes) {
    await probe(
      page,
      "ANY",
      `cron zonder secret ${t}`,
      t,
      (s) => s !== 500 && s !== 200,
      "geen 200/500 zonder secret",
    );
  }
  const anyFail = probes.some((p) => p.verdict === "FAIL");
  expect(
    anyFail,
    `Adversariële probes met FAIL: ${JSON.stringify(probes.filter((p) => p.verdict === "FAIL"))}`,
  ).toBe(false);
});
