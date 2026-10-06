import { describe, expect, it } from "vitest";
import { createRequire } from "module";

// Supply-chain regressiepoort op de SAMENSTELLING van de productie-dependency-tree (OWASP A06 —
// Vulnerable and Outdated Components). De harde merge-poort `audit` draait `node
// scripts/audit-production.mjs`, dat `npm audit --omit=dev` als blokkerend behandelt zodra er één
// high/critical in de PRODUCTIE-deps zit. Twee stille samenstellingsfouten kunnen die poort — en
// daarmee élke merge naar main — breken zodra de npm-advisory-feed een nieuw advies publiceert:
//
//   1. `patch-package` stond in `dependencies` i.p.v. `devDependencies`. Het is een puur build-/
//      install-tijd tool (draait in de `postinstall`-stap en past patches/next+15.5.24.patch toe),
//      maar als productie-dependency sleept het zijn kwetsbare keten
//      find-yarn-workspace-root → micromatch → braces (ReDoS/stack-exhaustion DoS, high) de
//      `--omit=dev`-audit in. In devDependencies draait de postinstall nog steeds (CI en de
//      Docker-builder doen een volledige `npm install`), maar telt de keten niet meer mee in de
//      productie-audit. Zie Dockerfile: de builder kopieert de volledige node_modules naar de
//      runtime-stage, dus niets in productie heeft patch-package zelf nodig.
//   2. `source-map-js` kwam via next → postcss binnen op 1.2.1 (event-loop DoS via indexed
//      source-map section offsets, GHSA-68fv-2mgg-jv7q, high). Een override pint het op de
//      gepatchte vloer 1.2.2.
//
// Deze test faalt zodra één van beide terugglipt — een regressie die een groene lokale run makkelijk
// mist omdat `npm audit` pas rood wordt wanneer het advies in de feed staat.

const require = createRequire(import.meta.url);
const pkg = require("../../../package.json") as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
};

/** Parseert "major.minor.patch" (pre-release-suffix + range-prefix genegeerd) naar een tripel. */
function parseSemver(version: string): [number, number, number] {
  const match = version.match(/\d+\.\d+\.\d+/);
  if (!match) throw new Error(`Onverwacht versieformaat: "${version}"`);
  const parts = match[0].split(".").map((p) => Number.parseInt(p, 10));
  return [parts[0]!, parts[1]!, parts[2]!];
}

/** true wanneer `a` >= `b` volgens semver-ordening op major → minor → patch. */
function gte(a: [number, number, number], b: [number, number, number]): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i]! > b[i]!) return true;
    if (a[i]! < b[i]!) return false;
  }
  return true;
}

describe("productie-dependency-hygiëne (merge-poort `audit`)", () => {
  it("houdt het build-tijd tool patch-package buiten de productie-dependencies", () => {
    expect(
      pkg.dependencies?.["patch-package"],
      "patch-package hoort in devDependencies, niet in dependencies: als productie-dep sleept het de " +
        "kwetsbare keten find-yarn-workspace-root → micromatch → braces de `npm audit --omit=dev` in " +
        "en breekt dat de harde merge-poort `audit`.",
    ).toBeUndefined();
  });

  it("houdt patch-package wél als devDependency (postinstall past de next-patch toe)", () => {
    expect(
      pkg.devDependencies?.["patch-package"],
      "patch-package moet een devDependency blijven zodat de postinstall (patches/next+15.5.24.patch) " +
        "bij een volledige install in CI en de Docker-builder blijft draaien.",
    ).toBeTruthy();
  });

  it("pint source-map-js op minstens de gepatchte vloer 1.2.2 (GHSA-68fv-2mgg-jv7q)", () => {
    const spec = pkg.overrides?.["source-map-js"];
    expect(
      spec,
      "verwacht een source-map-js-override: next → postcss trekt het anders op 1.2.1 binnen (high DoS).",
    ).toBeTruthy();
    expect(
      gte(parseSemver(spec!), [1, 2, 2]),
      `source-map-js-override "${spec}" ligt onder de veilige vloer 1.2.2.`,
    ).toBe(true);
  });
});
