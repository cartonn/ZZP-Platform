// Regressietest voor de HTTP-status-correctheid van `notFound()`-routes (CURRENT_TASK-item #4;
// zelfde klasse als de 404-maskering-fix `5b11dd10` en de sweeps `459f49c1`/`43b9d6b2`).
//
// Probleem dat deze test bewaakt: een `page.tsx` die `notFound()` aanroept streamt onder de
// dichtstbijzijnde `loading.tsx`-Suspense-grens (eigen segment óf een voorouder-segment). Bij een
// streaming-render commit Next.js de HTTP-status **200** vóórdat `notFound()` wordt gegooid, zodat
// een ontbrekende/niet-eigen resource een zachte-404 als 200 oplevert — een bestaans-oracle/IDOR op
// gevoelige resource-op-id-routes én simpelweg de verkeerde status. De canonieke fix is de
// maskerende loading-grens weg te halen (lijstroutes krijgen hun eigen, gescoopte skeleton via een
// `(index)`-route-group, zodat de loading niet naar een `[id]`-broer lekt).
//
// De test faalt zodra iemand opnieuw een `loading.tsx` boven een `notFound()`-pagina plaatst.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const APP_ROOT = path.join(process.cwd(), "src", "app");

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

/**
 * De dichtstbijzijnde actieve `loading.tsx`-grens voor een pagina: eerst het eigen segment, dan
 * elke voorouder omhoog t/m `src/app`. Dit spiegelt de loading-overerving van de App Router — een
 * `loading.tsx` dekt zijn segment en alle geneste segmenten tot een nester segment een eigen
 * `loading.tsx` definieert.
 */
function nearestLoading(pageDir: string): string | null {
  let dir = pageDir;
  while (true) {
    const candidate = path.join(dir, "loading.tsx");
    if (existsSync(candidate)) return candidate;
    if (path.resolve(dir) === path.resolve(APP_ROOT)) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function isPageFile(file: string): boolean {
  return /(^|[/\\])page\.tsx$/.test(file);
}

/** Roept dit paginabestand `notFound()` aan? */
function callsNotFound(file: string): boolean {
  return /\bnotFound\s*\(/.test(readFileSync(file, "utf8"));
}

describe("notFound()-routes streamen niet onder een loading.tsx (HTTP 404, geen soft-200)", () => {
  const pages =
    existsSync(APP_ROOT) && statSync(APP_ROOT).isDirectory()
      ? walk(APP_ROOT).filter(isPageFile)
      : [];

  it("vindt paginabestanden om te controleren", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it("geen enkele notFound()-pagina heeft een actieve loading-grens boven zich", () => {
    const masked = pages
      .filter(callsNotFound)
      .map((page) => ({ page, loading: nearestLoading(path.dirname(page)) }))
      .filter((r) => r.loading !== null)
      .map(
        (r) =>
          `${path.relative(process.cwd(), r.page)}  <=  ${path.relative(process.cwd(), r.loading as string)}`,
      );

    expect(
      masked,
      masked.length
        ? `Deze notFound()-routes streamen onder een loading.tsx en geven daardoor HTTP 200 i.p.v. 404. ` +
            `Verplaats de lijst-loading naar een (index)-route-group of verwijder de maskerende loading:\n  ` +
            masked.join("\n  ")
        : undefined,
    ).toEqual([]);
  });
});
