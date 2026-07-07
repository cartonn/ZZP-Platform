/**
 * Vangrail: detecteert findMany()-aanroepen in page-bestanden zonder `take:`.
 *
 * Een `findMany` zonder `take` kan op termijn de server-memory en laadtijden
 * om zeep helpen. Elke onbegrensde lijst moet expliciet worden toegestaan met
 * een **inline marker** direct bij de query zelf:
 *
 *   // unbounded-allow: <reden waarom onbegrensd hier veilig is>
 *   const rows = await prisma.foo.findMany({ where: ... });
 *
 * De marker mag op de regel direct boven de `findMany` staan, of als
 * trailing-comment op dezelfde regel. Zo staat de reden op de plek van de code
 * zelf — geen centrale allowlist met regelnummers die bij elke ongerelateerde
 * edit verschuift.
 *
 * De test leest de broncode, zoekt `findMany(`-aanroepen en controleert of
 * `take:` aanwezig is in het bijbehorende argument-object (heuristische
 * brace-matching). Zo niet: er moet een marker met een niet-lege reden bij
 * staan, anders faalt de test. Een marker zonder bijbehorende onbegrensde
 * findMany (verweesd) of met een lege reden faalt eveneens, zodat markers niet
 * blijven slingeren.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MARKER_RE = /\/\/\s*unbounded-allow:(.*)$/;

// ---------------------------------------------------------------------------
// Hulpfuncties
// ---------------------------------------------------------------------------

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

/** Leest alle .ts/.tsx bestanden in src/app recursief. */
function walkAppDir(): Array<{ rel: string; content: string }> {
  const root = join(process.cwd(), "src", "app");
  const results: Array<{ rel: string; content: string }> = [];

  function walk(dir: string, relBase: string) {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const abs = join(dir, entry);
      const rel = relBase ? `${relBase}/${entry}` : entry;
      const stat = statSync(abs);
      if (stat.isDirectory()) {
        walk(abs, rel);
      } else if (/\.(ts|tsx)$/.test(entry)) {
        results.push({ rel, content: readFileSync(abs, "utf8") });
      }
    }
  }
  walk(root, "");
  return results;
}

/**
 * Berekent per bestand de set van 1-based regelnummers waar een onbegrensde
 * `findMany()` (zonder `take:`) begint.
 */
function unboundedFindManyLines(content: string): Set<number> {
  const lines = new Set<number>();
  const regex = /findMany\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    const before = content.slice(0, m.index);
    const lineNo = before.split("\n").length;
    const argBlock = extractFindManyArg(content, m.index + m[0].length - 1);
    // Begrensd als: letterlijke `take:` in het argument-object, of een spread van
    // pageArgs() (de gedeelde cursor-paginatie-helper die altijd take: pageSize+1 levert).
    const hasTake = /\btake\s*:/.test(argBlock) || /\.\.\.\s*pageArgs\s*\(/.test(argBlock);
    if (!hasTake) lines.add(lineNo);
  }
  return lines;
}

/**
 * Vindt alle `// unbounded-allow:`-markers. Elke marker hoort bij de
 * eerstvolgende `findMany(`-aanroep op of ná de marker-regel. Tussenliggende
 * glue-regels die prettier kan invoegen (blanco, comment, open haakjes,
 * ternary-tokens, toewijzing) worden overgeslagen. De zoektocht stopt zodra een
 * volgende marker wordt gepasseerd, zodat elke marker exact één query dekt.
 *
 * De marker mag ook trailing op de findMany-regel zelf staan; dan is dat
 * meteen de doelregel.
 */
function findMarkers(
  content: string,
): Array<{ line: number; reason: string; targetLine: number | null }> {
  const rows = content.split("\n");
  const markers: Array<{ line: number; reason: string; targetLine: number | null }> = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? "";
    const match = row.match(MARKER_RE);
    if (!match) continue;
    const line = i + 1;
    const reason = (match[1] ?? "").trim();

    // Code op de marker-regel zelf (zonder de marker-comment): trailing-marker.
    const codeOnMarkerLine = row.slice(0, row.indexOf(match[0]));

    let targetLine: number | null = null;
    if (/findMany\s*\(/.test(codeOnMarkerLine)) {
      targetLine = line;
    } else {
      // Zoek de eerstvolgende findMany(-regel eronder; stop bij de volgende marker.
      for (let j = i + 1; j < rows.length; j++) {
        const below = rows[j] ?? "";
        if (MARKER_RE.test(below)) break;
        if (/findMany\s*\(/.test(below)) {
          targetLine = j + 1;
          break;
        }
      }
    }
    markers.push({ line, reason, targetLine });
  }
  return markers;
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("onbegrensde findMany()-aanroepen in src/app", () => {
  const files = walkAppDir();

  it("elke onbegrensde findMany() heeft een `// unbounded-allow:`-marker met reden", () => {
    const violations: string[] = [];

    for (const { rel, content } of files) {
      const unbounded = unboundedFindManyLines(content);
      const markers = findMarkers(content);
      const markedTargets = new Set(
        markers.filter((mk) => mk.targetLine !== null).map((mk) => mk.targetLine as number),
      );

      for (const lineNo of unbounded) {
        if (!markedTargets.has(lineNo)) {
          violations.push(
            `${rel}:${lineNo} — onbegrensde findMany() zonder marker (voeg ` +
              `\`// unbounded-allow: <reden>\` toe, of voeg take: toe aan de query)`,
          );
        }
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
});
