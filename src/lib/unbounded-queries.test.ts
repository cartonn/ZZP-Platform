/**
 * Vangrail: detecteert `findMany()`-aanroepen zonder `take:` (of cursor-paginatie).
 *
 * Een `findMany` zonder grens kan op termijn de server-memory en laadtijden om zeep helpen: bij een
 * grote opdrachtgever of tenant groeit zo'n query mee met de tabel. Elke onbegrensde lijst moet
 * daarom expliciet worden toegestaan met een **inline marker** direct bij de query zelf:
 *
 *   // unbounded-allow: <reden waarom onbegrensd hier veilig is>
 *   const rows = await prisma.foo.findMany({ where: ... });
 *
 * De marker mag op de regel direct boven de `findMany` staan, of als trailing-comment op dezelfde
 * regel. Zo staat de reden op de plek van de code zelf — geen centrale allowlist met regelnummers
 * die bij elke ongerelateerde edit verschuift.
 *
 * De test leest de broncode, zoekt `findMany(`-aanroepen en controleert of `take:` aanwezig is in
 * het bijbehorende argument-object (heuristische brace-matching). Zo niet: er moet een marker met
 * een niet-lege reden bij staan, anders faalt de test. Een marker zonder bijbehorende onbegrensde
 * findMany (verweesd) of met een lege reden faalt eveneens, zodat markers niet blijven slingeren.
 *
 * ## Bereik
 *
 * Gescand worden `src/app`, `src/lib` en `src/components` (zonder testbestanden en zonder de
 * ontwerp-galerij, die geen productiecode is). `src/lib` is te groot om in één keer te saneren;
 * de bestanden die nog niet zijn nagelopen staan in `SANITATION_BACKLOG`. Die lijst is een
 * schuldenregister dat alleen mag krimpen: een bestand dat erop staat maar géén onbegrensde query
 * meer heeft, laat de test falen — dan hoort het van de lijst af. Nieuwe bestanden staan er nooit
 * op en worden dus meteen gevangen.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MARKER_RE = /\/\/\s*unbounded-allow:(.*)$/;

/** Mappen die volledig worden gescand (relatief aan de repo-root). */
const SCAN_ROOTS = ["src/app", "src/lib", "src/components"] as const;

/** Mapnamen die geen productiecode bevatten (de ontwerp-galerij en het ontwerp-lab). */
const SKIPPED_DIRS = ["ontwerp", "ontwerp-lab"] as const;

/**
 * Nog niet gesaneerde bestanden. Elk bestand hier bevat ≥ 1 onbegrensde `findMany` zonder marker.
 * Verwijder een pad zodra het bestand is nagelopen (grens toegevoegd óf marker met reden). De lijst
 * mag groeien noch stil blijven staan met dode entries — beide laten de test falen.
 *
 * `src/lib/signals.ts` en `src/lib/actions/pending-tasks.ts` horen bij een parallel lopend pakket
 * (pakket B, 2-9-2026) en worden daar gesaneerd; ze staan hier zodat beide sporen niet in
 * hetzelfde bestand hoeven te schrijven.
 */
const SANITATION_BACKLOG: readonly string[] = [
  "src/lib/academy-data.ts",
  "src/lib/account-export.ts",
  "src/lib/actions/drawer-data.ts",
  "src/lib/actions/pending-tasks.ts",
  "src/lib/admin-user-detail.ts",
  "src/lib/application-decision-reminders-task.ts",
  "src/lib/calendar/user-deadlines.ts",
  "src/lib/calendar/user-schedule.ts",
  "src/lib/cascade/dispute-commands.ts",
  "src/lib/cascade/payment-commands.ts",
  "src/lib/client-spend-breakdown.ts",
  "src/lib/concept-invoice-reminders-task.ts",
  "src/lib/conversation-reply-reminders-task.ts",
  "src/lib/dba-monitor-task.ts",
  "src/lib/dba-overview.ts",
  "src/lib/diensten.ts",
  "src/lib/dispute-ownership.ts",
  "src/lib/dispute-reminders-task.ts",
  "src/lib/disputes.ts",
  "src/lib/dormant-clients.ts",
  "src/lib/dormant-freelancers.ts",
  "src/lib/entitlement-guard.ts",
  "src/lib/event-store.ts",
  "src/lib/expiry-task.ts",
  "src/lib/franchise/billing.ts",
  "src/lib/franchise/dienst-fill-signal.ts",
  "src/lib/franchise/dienst-suggesties.ts",
  "src/lib/franchise/dienst-voordracht.ts",
  "src/lib/franchise/dienst.ts",
  "src/lib/franchise/roster-dossier.ts",
  "src/lib/freelancer-membership.ts",
  "src/lib/freelancer-payer-behavior.ts",
  "src/lib/freelancer-revenue-breakdown.ts",
  "src/lib/hourly-rate-trend.ts",
  "src/lib/hours-criterion-reminder-task.ts",
  "src/lib/job-alerts-task.ts",
  "src/lib/job-engagement-task.ts",
  "src/lib/mail-intake-retention-task.ts",
  "src/lib/monitoring/monitor-task.ts",
  "src/lib/notification-digest-task.ts",
  "src/lib/notification-preferences-data.ts",
  "src/lib/observability/verification-delivery-heartbeat.ts",
  "src/lib/past-due-task.ts",
  "src/lib/payment-reminders-task.ts",
  "src/lib/performance-approval-reminders-task.ts",
  "src/lib/performance-grace-task.ts",
  "src/lib/performance-submission-reminders-task.ts",
  "src/lib/platform-billing/billing-data.ts",
  "src/lib/platform-billing/billing-run.ts",
  "src/lib/profit-trend.ts",
  "src/lib/push-delivery-task.ts",
  "src/lib/revenue-trend.ts",
  "src/lib/reviews-reveal-task.ts",
  "src/lib/shared-credentials.ts",
  "src/lib/signals.ts",
  "src/lib/subscription-expiry-task.ts",
  "src/lib/tenant-stats.ts",
  "src/lib/two-factor/verify-second-factor.ts",
  "src/lib/vat-reminder-task.ts",
  "src/lib/worked-hours-trend.ts",
  "src/lib/zzp-membership-task.ts",
];

// ---------------------------------------------------------------------------
// Hulpfuncties
// ---------------------------------------------------------------------------

/**
 * Vervangt de inhoud van comments door spaties (regeleinden blijven staan, dus alle offsets en
 * regelnummers kloppen nog). Nodig omdat een comment die het wóórd `findMany(` noemt anders als
 * echte query wordt geteld — een vals alarm dat alleen met een zinloze marker te sussen is.
 * Strings worden overgeslagen zodat `"// geen comment"` niets wegvreet.
 */
export function stripComments(source: string): string {
  const out = source.split("");
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") out[i++] = " ";
      continue;
    }
    if (ch === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      while (i < stop) {
        if (source[i] !== "\n") out[i] = " ";
        i++;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      // Inhoud van een gewone string blanken: `"…findMany(…)"` is tekst, geen query.
      const quote = ch;
      i++;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") {
          out[i] = " ";
          out[i + 1] = " ";
          i += 2;
          continue;
        }
        if (source[i] !== "\n") out[i] = " ";
        i++;
      }
      i++;
      continue;
    }
    if (ch === "`") {
      // Template-literal: alleen overslaan, niet blanken — er kan echte code in `${…}` staan.
      i++;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === "`") break;
        i++;
      }
      i++;
      continue;
    }
    i++;
  }
  return out.join("");
}

/** Geeft de inhoud van het argument-blok van findMany( terug (heuristisch). */
function extractFindManyArg(source: string, matchIndex: number): string {
  // Zoek de eerste `(` na `findMany`
  let depth = 0;
  let start = -1;
  for (let i = matchIndex; i < source.length; i++) {
    if (source[i] === "(") {
      if (start === -1) start = i;
      depth++;
    } else if (source[i] === ")") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return "";
}

/** Leest alle .ts/.tsx bestanden (zonder tests) onder de scan-roots, relatief aan de repo-root. */
function walkSources(): Array<{ rel: string; content: string }> {
  const results: Array<{ rel: string; content: string }> = [];

  function walk(dir: string, relBase: string) {
    // `withFileTypes` levert het bestandstype uit de directory-entry zelf. Zonder dat zou hier een
    // aparte `statSync(pad)` vóór de `readFileSync(pad)` staan: twee losse opzoekingen van hetzelfde
    // pad, waartussen dat pad iets anders kan zijn geworden (CWE-367).
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = entry.name;
      if (name === "node_modules" || name.startsWith(".")) continue;
      const abs = join(dir, name);
      const rel = `${relBase}/${name}`;
      if (entry.isDirectory()) {
        if ((SKIPPED_DIRS as readonly string[]).includes(name)) continue;
        walk(abs, rel);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) {
        results.push({ rel, content: readFileSync(abs, "utf8") });
      }
    }
  }

  for (const root of SCAN_ROOTS) {
    walk(join(process.cwd(), root), root);
  }
  return results;
}

/**
 * Berekent per bestand de set van 1-based regelnummers waar een onbegrensde `findMany()` (zonder
 * `take:`) begint. Comments tellen niet mee (zie `stripComments`).
 */
export function unboundedFindManyLines(content: string): Set<number> {
  const code = stripComments(content);
  const lines = new Set<number>();
  const regex = /findMany\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(code)) !== null) {
    const before = code.slice(0, m.index);
    const lineNo = before.split("\n").length;
    const argBlock = extractFindManyArg(code, m.index + m[0].length - 1);
    // Begrensd als: letterlijke `take:` in het argument-object, of een spread van
    // pageArgs() (de gedeelde cursor-paginatie-helper die altijd take: pageSize+1 levert).
    const hasTake = /\btake\s*:/.test(argBlock) || /\.\.\.\s*pageArgs\s*\(/.test(argBlock);
    if (!hasTake) lines.add(lineNo);
  }
  return lines;
}

/**
 * Vindt alle `// unbounded-allow:`-markers. Elke marker hoort bij de eerstvolgende `findMany(`-
 * aanroep op of ná de marker-regel. Tussenliggende glue-regels die prettier kan invoegen (blanco,
 * comment, open haakjes, ternary-tokens, toewijzing) worden overgeslagen. De zoektocht stopt zodra
 * een volgende marker wordt gepasseerd, zodat elke marker exact één query dekt.
 *
 * De marker mag ook trailing op de findMany-regel zelf staan; dan is dat meteen de doelregel.
 */
export function findMarkers(
  content: string,
): Array<{ line: number; reason: string; targetLine: number | null }> {
  const rows = content.split("\n");
  // Code zonder comments: bepaalt of een regel écht een findMany-aanroep bevat.
  const codeRows = stripComments(content).split("\n");
  const markers: Array<{ line: number; reason: string; targetLine: number | null }> = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? "";
    const match = row.match(MARKER_RE);
    if (!match) continue;
    const line = i + 1;
    const reason = (match[1] ?? "").trim();

    let targetLine: number | null = null;
    if (/findMany\s*\(/.test(codeRows[i] ?? "")) {
      // Trailing-marker: de findMany staat op de marker-regel zelf.
      targetLine = line;
    } else {
      // Zoek de eerstvolgende findMany(-regel eronder; stop bij de volgende marker.
      for (let j = i + 1; j < rows.length; j++) {
        if (MARKER_RE.test(rows[j] ?? "")) break;
        if (/findMany\s*\(/.test(codeRows[j] ?? "")) {
          targetLine = j + 1;
          break;
        }
      }
    }
    markers.push({ line, reason, targetLine });
  }
  return markers;
}

/** Regelnummers van onbegrensde findMany-aanroepen die géén marker hebben. */
export function unmarkedUnboundedLines(content: string): number[] {
  const unbounded = unboundedFindManyLines(content);
  const marked = new Set(
    findMarkers(content)
      .filter((mk) => mk.targetLine !== null)
      .map((mk) => mk.targetLine as number),
  );
  return [...unbounded].filter((line) => !marked.has(line));
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("onbegrensde findMany()-aanroepen", () => {
  const files = walkSources();
  const backlog = new Set(SANITATION_BACKLOG);

  it("scant src/app, src/lib én src/components", () => {
    for (const root of SCAN_ROOTS) {
      expect(files.some((f) => f.rel.startsWith(`${root}/`))).toBe(true);
    }
    // De ontwerp-galerij is geen productiecode en hoort buiten de scan te vallen.
    expect(files.some((f) => f.rel.includes("/ontwerp/"))).toBe(false);
    expect(files.some((f) => f.rel.endsWith(".test.ts"))).toBe(false);
  });

  it("elke onbegrensde findMany() heeft een `// unbounded-allow:`-marker met reden", () => {
    const violations: string[] = [];

    for (const { rel, content } of files) {
      if (backlog.has(rel)) continue;
      for (const lineNo of unmarkedUnboundedLines(content)) {
        violations.push(
          `${rel}:${lineNo} — onbegrensde findMany() zonder marker (voeg ` +
            `\`// unbounded-allow: <reden>\` toe, of voeg take: toe aan de query)`,
        );
      }
    }

    if (violations.length > 0) {
      expect.fail(`Onbegrensde findMany()-aanroepen zonder marker:\n${violations.join("\n")}`);
    }
  });

  it("elke marker heeft een niet-lege reden", () => {
    const violations: string[] = [];
    for (const { rel, content } of files) {
      for (const mk of findMarkers(content)) {
        if (mk.reason === "") {
          violations.push(`${rel}:${mk.line} — \`// unbounded-allow:\` zonder reden`);
        }
      }
    }
    if (violations.length > 0) {
      expect.fail(`Markers zonder reden:\n${violations.join("\n")}`);
    }
  });

  it("er zijn geen verweesde markers (marker zonder onbegrensde findMany eronder)", () => {
    const violations: string[] = [];
    for (const { rel, content } of files) {
      // Backlog-bestanden zijn nog niet nagelopen; hun markers worden bij de sanering opgeschoond.
      if (backlog.has(rel)) continue;
      const unbounded = unboundedFindManyLines(content);
      for (const mk of findMarkers(content)) {
        if (mk.targetLine === null || !unbounded.has(mk.targetLine)) {
          violations.push(
            `${rel}:${mk.line} — verweesde \`// unbounded-allow:\`-marker (geen ` +
              `onbegrensde findMany() op dezelfde of eerstvolgende regel); verwijder de marker`,
          );
        }
      }
    }
    if (violations.length > 0) {
      expect.fail(`Verweesde markers:\n${violations.join("\n")}`);
    }
  });

  it("de saneringsbacklog bevat alleen bestaande, nog-onbegrensde bestanden", () => {
    const violations: string[] = [];
    for (const rel of SANITATION_BACKLOG) {
      const abs = join(process.cwd(), rel);
      // Eén lees-poging in plaats van "bestaat het?" gevolgd door "lees het": twee losse
      // opzoekingen van hetzelfde pad zijn een check-then-use (CWE-367). Ontbreekt het bestand,
      // dan zegt de leesfout dat net zo goed.
      let source: string;
      try {
        source = readFileSync(abs, "utf8");
      } catch {
        violations.push(`${rel} — staat op de backlog maar is niet leesbaar; verwijder het pad`);
        continue;
      }
      if (unmarkedUnboundedLines(source).length === 0) {
        violations.push(
          `${rel} — is gesaneerd (geen onbegrensde findMany zonder marker meer); ` +
            `verwijder het pad uit SANITATION_BACKLOG`,
        );
      }
    }
    if (violations.length > 0) {
      expect.fail(`Achterhaalde backlog-entries:\n${violations.join("\n")}`);
    }
  });

  it("de backlog is uniek en gesorteerd (voorspelbare diffs bij het afbouwen)", () => {
    expect(new Set(SANITATION_BACKLOG).size).toBe(SANITATION_BACKLOG.length);
    expect([...SANITATION_BACKLOG]).toEqual([...SANITATION_BACKLOG].sort());
  });
});

// ---------------------------------------------------------------------------
// Zelftest van de detectie zelf: een vangrail die zijn eigen heuristiek niet test,
// vangt op termijn de verkeerde dingen.
// ---------------------------------------------------------------------------

describe("detectie-heuristiek", () => {
  it("telt een findMany zonder take als onbegrensd", () => {
    expect([
      ...unboundedFindManyLines(`const a = await prisma.x.findMany({ where: {} });`),
    ]).toEqual([1]);
  });

  it("telt een findMany met take niet mee", () => {
    expect(unboundedFindManyLines(`await prisma.x.findMany({ take: 10 });`).size).toBe(0);
  });

  it("telt een findMany met pageArgs()-spread niet mee", () => {
    expect(unboundedFindManyLines(`await prisma.x.findMany({ ...pageArgs(cursor) });`).size).toBe(
      0,
    );
  });

  it("negeert findMany in een regelcomment", () => {
    expect(unboundedFindManyLines(`// zie de company.findMany({ tenantId }) hierboven`).size).toBe(
      0,
    );
  });

  it("negeert findMany in een blokcomment maar houdt de regelnummers kloppend", () => {
    const src = ["/**", " * Eén findMany({}) voor alles.", " */", "await prisma.x.findMany({});"];
    expect([...unboundedFindManyLines(src.join("\n"))]).toEqual([4]);
  });

  it("negeert een findMany in een string", () => {
    expect(unboundedFindManyLines(`const s = "prisma.x.findMany({})";`).size).toBe(0);
  });

  it("koppelt een marker op de regel erboven aan de query", () => {
    const src = [`// unbounded-allow: kleine referentietabel`, `await prisma.x.findMany({});`];
    expect(unmarkedUnboundedLines(src.join("\n"))).toEqual([]);
  });

  it("laat een marker zonder query verweesd achter", () => {
    const src = [`// unbounded-allow: reden`, `const x = 1;`];
    expect(findMarkers(src.join("\n"))[0]?.targetLine).toBeNull();
  });

  it("laat een marker die alleen een comment-findMany dekt verweesd achter", () => {
    const src = [`// unbounded-allow: reden`, `// ooit stond hier een findMany()`];
    expect(findMarkers(src.join("\n"))[0]?.targetLine).toBeNull();
  });
});
