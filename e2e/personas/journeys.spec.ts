// Persona-reizen voor de zelf-test-lus: elke persona logt in als zijn geseede demo-account en loopt
// zijn echte werk door het systeem. Elke stap maakt een screenshot + logregel (url, gelukt/niet),
// veerkrachtig: een mislukte stap stopt de reis niet, maar wordt vastgelegd (= mogelijk een gat).
// De screenshots + _log.json voeden de kritische-rechter-agents (zie .claude/workflows/persona-sweep).
import { test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join("e2e", "personas", "shots");

interface StepLog {
  step: number;
  label: string;
  url: string;
  ok: boolean;
  note?: string;
}

function persona(name: string) {
  const dir = path.join(ROOT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const log: StepLog[] = [];
  let n = 0;
  return {
    async step(page: Page, label: string, fn?: (p: Page) => Promise<unknown>) {
      n += 1;
      const id = String(n).padStart(2, "0");
      let ok = true;
      let note: string | undefined;
      if (fn) {
        try {
          await fn(page);
        } catch (e) {
          ok = false;
          note = (e as Error).message?.split("\n")[0]?.slice(0, 200);
        }
      }
      await page.waitForTimeout(500); // even laten settelen
      const url = page.url();
      const file = `${id}-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      await page.screenshot({ path: path.join(dir, file), fullPage: true }).catch(() => {});
      log.push({ step: n, label, url, ok, note });
    },
    finish() {
      fs.writeFileSync(path.join(dir, "_log.json"), JSON.stringify(log, null, 2));
    },
  };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 }).catch(() => {});
}

async function openFirst(page: Page, listRoute: string, hrefPrefix: string) {
  await page.goto(listRoute);
  const link = page.locator(`a[href^='${hrefPrefix}']`).first();
  await link.click({ timeout: 5000 });
  await page.waitForLoadState("networkidle").catch(() => {});
}

test.describe.configure({ mode: "serial" });

test("zzper journey", async ({ page }) => {
  test.slow();
  const p = persona("zzper");
  await p.step(page, "login", (pg) => login(pg, "zzp@zzp-platform.local"));
  await p.step(page, "dashboard", (pg) => pg.goto("/dashboard"));
  await p.step(page, "acties", (pg) => pg.goto("/acties"));
  await p.step(page, "opdrachten", (pg) => pg.goto("/opdrachten"));
  await p.step(page, "opdracht-detail", (pg) => openFirst(pg, "/opdrachten", "/opdrachten/"));
  await p.step(page, "reageren-knop", async (pg) => {
    await pg
      .getByRole("button", { name: /Reageren|Reactie/ })
      .first()
      .click({ timeout: 4000 });
  });
  await p.step(page, "reacties", (pg) => pg.goto("/reacties"));
  await p.step(page, "samenwerkingen", (pg) => pg.goto("/samenwerkingen"));
  await p.step(page, "samenwerking-detail", (pg) =>
    openFirst(pg, "/samenwerkingen", "/samenwerkingen/"),
  );
  await p.step(page, "facturen", (pg) => pg.goto("/facturen"));
  await p.step(page, "certificaten", (pg) => pg.goto("/certificaten"));
  await p.step(page, "profiel", (pg) => pg.goto("/profiel/bewerken"));
  await p.step(page, "inzicht-abonnement", (pg) => pg.goto("/inzicht"));
  await p.step(page, "abonnement", (pg) => pg.goto("/abonnement"));
  await p.step(page, "berichten", (pg) => pg.goto("/berichten"));
  p.finish();
});

test("opdrachtgever journey", async ({ page }) => {
  test.slow();
  const p = persona("opdrachtgever");
  await p.step(page, "login", (pg) => login(pg, "opdrachtgever@zzp-platform.local"));
  await p.step(page, "dashboard", (pg) => pg.goto("/dashboard"));
  await p.step(page, "acties", (pg) => pg.goto("/acties"));
  await p.step(page, "opdracht-nieuw", async (pg) => {
    await pg.goto("/opdrachten/nieuw");
    await pg.fill("#title", `Sweep opdracht ${Date.now()}`);
    await pg.fill("#description", "Test-opdracht door de persona-lus om de plaats-flow te lopen.");
  });
  await p.step(page, "opdracht-aanmaken", async (pg) => {
    await pg.getByRole("button", { name: "Opslaan als concept" }).click({ timeout: 5000 });
    await pg.waitForLoadState("networkidle").catch(() => {});
  });
  await p.step(page, "opdrachten", (pg) => pg.goto("/opdrachten"));
  await p.step(page, "kandidaten", (pg) => pg.goto("/kandidaten"));
  await p.step(page, "freelancers", (pg) => pg.goto("/freelancers"));
  await p.step(page, "samenwerkingen", (pg) => pg.goto("/samenwerkingen"));
  await p.step(page, "samenwerking-detail", (pg) =>
    openFirst(pg, "/samenwerkingen", "/samenwerkingen/"),
  );
  await p.step(page, "prestaties", (pg) => pg.goto("/prestaties"));
  await p.step(page, "facturen", (pg) => pg.goto("/facturen"));
  await p.step(page, "inzicht", (pg) => pg.goto("/inzicht"));
  await p.step(page, "bedrijf", (pg) => pg.goto("/bedrijf"));
  p.finish();
});

test("franchiser journey", async ({ page }) => {
  test.slow();
  const p = persona("franchiser");
  await p.step(page, "login", (pg) => login(pg, "franchise@zzp-platform.local"));
  await p.step(page, "dashboard", (pg) => pg.goto("/dashboard"));
  await p.step(page, "opdrachtgevers", (pg) => pg.goto("/franchise/opdrachtgevers"));
  await p.step(page, "opdrachtgever-detail", (pg) =>
    openFirst(pg, "/franchise/opdrachtgevers", "/franchise/opdrachtgevers/"),
  );
  await p.step(page, "zzpers", (pg) => pg.goto("/franchise/zzpers"));
  await p.step(page, "zzper-detail", (pg) =>
    openFirst(pg, "/franchise/zzpers", "/franchise/zzpers/"),
  );
  await p.step(page, "diensten", (pg) => pg.goto("/franchise/diensten"));
  await p.step(page, "samenwerkingen", (pg) => pg.goto("/franchise/samenwerkingen"));
  await p.step(page, "inzicht", (pg) => pg.goto("/inzicht"));
  await p.step(page, "leads", (pg) => pg.goto("/franchise/leads"));
  await p.step(page, "facturatie", (pg) => pg.goto("/franchise/facturatie"));
  await p.step(page, "instellingen", (pg) => pg.goto("/franchise/instellingen"));
  p.finish();
});

test("admin journey", async ({ page }) => {
  test.slow();
  const p = persona("admin");
  await p.step(page, "login", (pg) => login(pg, "admin@zzp-platform.local"));
  await p.step(page, "dashboard", (pg) => pg.goto("/dashboard"));
  await p.step(page, "verificaties", (pg) => pg.goto("/admin/verificaties"));
  await p.step(page, "dba-monitor", (pg) => pg.goto("/admin/dba"));
  await p.step(page, "helpdesk", (pg) => pg.goto("/admin/support"));
  await p.step(page, "franchises", (pg) => pg.goto("/admin/franchises"));
  await p.step(page, "facturatie", (pg) => pg.goto("/admin/facturatie"));
  await p.step(page, "facturen-genereren", async (pg) => {
    await pg.getByRole("button", { name: "Genereer facturen" }).click({ timeout: 5000 });
    await pg.waitForLoadState("networkidle").catch(() => {});
  });
  await p.step(page, "statistieken", (pg) => pg.goto("/admin/statistieken"));
  await p.step(page, "audit", (pg) => pg.goto("/admin/audit"));
  await p.step(page, "gebruikers", (pg) => pg.goto("/admin/gebruikers"));
  await p.step(page, "bewaking", (pg) => pg.goto("/admin/bewaking"));
  p.finish();
});
