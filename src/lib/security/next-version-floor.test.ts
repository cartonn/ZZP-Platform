import { describe, expect, it } from "vitest";
import { createRequire } from "module";
// Supply-chain regressiepoort op de geïnstalleerde Next.js-versie. De augustus-2026 security-release
// van Next.js dichtte TWEE Critical-kwetsbaarheden en is gepatcht in 15.5.24 (Maintenance LTS); de
// meest relevante voor dit platform is een Denial-of-Service in de App Router: een speciaal
// vervaardigd HTTP-verzoek naar een willekeurig Server Function-endpoint kan bij deserialisatie
// buitensporig CPU-gebruik veroorzaken. Dit platform draait volledig op App Router + server actions,
// dus dat pad is direct bereikbaar. Deze test faalt zodra een `next`-downgrade onder de gepatchte
// vloer (15.5.24) zou terugglippen — een stille regressie die `npm audit` niet altijd flagt zolang
// het advies nog niet in de audit-feed staat. Enige poort: de vloer, niet een exacte pin (patch-
// bumps binnen 15.5.x blijven toegestaan).
import nextPackageJson from "next/package.json";

/** Minimale, veilige Next.js-versie (augustus-2026 Critical-patch). Nooit onder deze vloor. */
const MIN_NEXT_VERSION = "15.5.24";

/** Parseert "major.minor.patch" (pre-release-suffix genegeerd) naar een numeriek tripel. */
function parseSemver(version: string): [number, number, number] {
  const core = version.split("-")[0] ?? version;
  const parts = core.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Onverwacht Next.js-versieformaat: "${version}"`);
  }
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

describe("Next.js security version floor", () => {
  it("draait op minstens de gepatchte Next.js-versie (augustus-2026 Critical-fix)", () => {
    const installed = (nextPackageJson as { version: string }).version;
    expect(
      gte(parseSemver(installed), parseSemver(MIN_NEXT_VERSION)),
      `Next.js ${installed} ligt onder de veilige vloer ${MIN_NEXT_VERSION} (App Router Server-Action DoS, augustus-2026). Bump 'next' naar >= ${MIN_NEXT_VERSION}.`,
    ).toBe(true);
  });

  it("pint dezelfde vloer in package.json (geen stille terugval in de dependency-range)", () => {
    const require = createRequire(import.meta.url);
    const pkg = require("../../../package.json") as { dependencies?: Record<string, string> };
    const spec = pkg.dependencies?.next;
    expect(spec, "verwacht een 'next'-dependency in package.json").toBeTruthy();
    // Neem de eerste versie-achtige token uit de range (bv. "15.5.24" of "^15.5.24").
    const match = spec!.match(/\d+\.\d+\.\d+/);
    expect(match, `kon geen versie uit de next-range halen: "${spec}"`).toBeTruthy();
    expect(gte(parseSemver(match![0]), parseSemver(MIN_NEXT_VERSION))).toBe(true);
  });
});
