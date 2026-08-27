import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// RBAC-dekkingspoort voor het admin-API-oppervlak (CLAUDE.md architectuurregel 2: elke mutatie/
// toegang loopt auth → rol → ownership → …; server-side is de waarheid).
//
// De middleware-route-guard (`isAdminPath` in `src/lib/route-guards.ts`) matcht alleen de PAGINA-
// paden `/admin` en `/admin/*` — NIET `/api/admin/*` (ander prefix). Dat is bewust: de middleware
// beschermt met een *redirect* naar /dashboard, wat voor een API-route de verkeerde semantiek is
// (een API-consument hoort 403 JSON te krijgen, geen 307 naar een HTML-pagina). Gevolg is echter dat
// admin-API-routes GEEN middleware-vangnet hebben: hun enige rolpoort is de `requireRole("ADMIN")`-
// aanroep in de handler zelf. Vandaag doet elke admin-API-route dat correct — maar dat werd tot nu toe
// alleen door ontwikkelaars-discipline bewaakt. In een codebase met continue, autonome ontwikkeling is
// dat niet genoeg: een toekomstige `/api/admin/*`-route die de aanroep vergeet, zou een admin-only
// resource (facturen-export, facturatie-PDF) aan elke ingelogde gebruiker serveren zonder dat iets het
// tegenhoudt.
//
// Deze test dwingt af dat ELKE `src/app/api/admin/**/route.ts` in een van zijn geëxporteerde HTTP-
// handlers een `requireRole(...)`-poort heeft die "ADMIN" bevat. Een nieuwe admin-API-route zonder die
// poort breekt de CI in plaats van stil PII/admin-functionaliteit te lekken. Spiegelt de statische
// dekkingsgedachte van `anonymize-schema-coverage.test.ts` en `logger.pii-name-coverage.test.ts`.

/** Verwijdert //- en /* *​/-commentaar zodat een genoemde `requireRole("ADMIN")` in een comment niet
 * ten onrechte als echte poort telt. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, (_m, p1: string) => p1);
}

/**
 * True als de (comment-vrije) broncode een `requireRole(...)`-aanroep bevat waarvan de argumentenlijst
 * "ADMIN" bevat. Variadisch: `requireRole("ADMIN")`, `requireRole("ADMIN", "FRANCHISER")` en
 * `requireRole("FRANCHISER", "ADMIN")` tellen alle als afgedekt (ADMIN mag altijd).
 */
export function enforcesAdminRole(source: string): boolean {
  const src = stripComments(source);
  return /requireRole\(\s*[^)]*"ADMIN"[^)]*\)/.test(src);
}

/** Loopt de map recursief af en verzamelt alle niet-test `route.ts`-bestanden. */
function routeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...routeFiles(full));
    } else if (entry.name === "route.ts") {
      out.push(full);
    }
  }
  return out;
}

const ADMIN_API_DIR = resolve(process.cwd(), "src/app/api/admin");

describe("admin-API RBAC-dekkingspoort", () => {
  // Zelftest van de checker (rood→groen bewijs, los van de echte routes): een handler zónder poort
  // faalt, een handler mét poort (in elke argumentvolgorde) slaagt.
  it("enforcesAdminRole detecteert wél/geen ADMIN-poort", () => {
    expect(enforcesAdminRole(`export async function GET() { return Response.json({}); }`)).toBe(
      false,
    );
    expect(enforcesAdminRole(`export async function GET() { await requireActor(); }`)).toBe(false);
    // Een niet-ADMIN rolpoort dekt het admin-oppervlak niet af.
    expect(
      enforcesAdminRole(`export async function GET() { await requireRole("FRANCHISER"); }`),
    ).toBe(false);
    // Alleen in een comment genoemd → telt niet als echte poort.
    expect(enforcesAdminRole(`// await requireRole("ADMIN")\nexport async function GET() {}`)).toBe(
      false,
    );
    expect(
      enforcesAdminRole(`export async function GET() { const a = await requireRole("ADMIN"); }`),
    ).toBe(true);
    expect(
      enforcesAdminRole(
        `export async function GET() { await requireRole("ADMIN", "FRANCHISER"); }`,
      ),
    ).toBe(true);
    expect(
      enforcesAdminRole(
        `export async function GET() { await requireRole("FRANCHISER", "ADMIN"); }`,
      ),
    ).toBe(true);
  });

  const files = routeFiles(ADMIN_API_DIR);

  it("vindt daadwerkelijk admin-API-routes (geen vacuüm-pass)", () => {
    // Beschermt tegen een verplaatste map/gewijzigde glob die de poort stil zou uitschakelen.
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  it.each(files.map((f) => [f.replace(`${process.cwd()}/`, ""), f] as const))(
    '%s dwingt requireRole("ADMIN") server-side af',
    (_label, full) => {
      const src = readFileSync(full, "utf8");
      expect(
        enforcesAdminRole(src),
        `${_label} mist een requireRole("ADMIN")-poort in de handler — een admin-API-route zonder ` +
          `rolcontrole heeft geen middleware-vangnet en zou admin-only data aan elke ingelogde ` +
          `gebruiker serveren.`,
      ).toBe(true);
    },
  );
});
