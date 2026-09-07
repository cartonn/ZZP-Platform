import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { DbaMitigationCard } from "./dba-mitigation-plan";
import { dbaMitigations, type DbaInput } from "@/lib/dba";

// Node-omgeving (geen jsdom): render naar statische HTML en toets de opmaak. De beslislogica
// (welke wijzigingen, welk doelniveau) leeft in `dbaMitigations` en wordt in dba.test.ts gedekt.

describe("DbaMitigationCard", () => {
  it("rendert niets zonder plan", () => {
    expect(renderToStaticMarkup(<DbaMitigationCard plan={null} />)).toBe("");
  });

  it("toont het doelniveau en één regel per voorgestelde wijziging", () => {
    // Alle hefbomen aan → HOOG → plan naar MIDDEN.
    const input: DbaInput = {
      directSupervision: true,
      embedded: true,
      fixedSchedule: true,
      noSubstitution: true,
      exclusive: true,
      weakEntrepreneurship: true,
      durationMonths: null,
    };
    const plan = dbaMitigations(input);
    expect(plan).not.toBeNull();

    const html = renderToStaticMarkup(<DbaMitigationCard plan={plan} />);
    expect(html).toContain(`Zo verlaag je het risico naar ${plan!.targetLevel}:`);
    // Elke voorgestelde wijziging verschijnt als een eigen lijst-item (React escaped de apostrof).
    const escapeApostrophe = (s: string) => s.replaceAll("'", "&#x27;");
    for (const change of plan!.changes) {
      expect(html).toContain(escapeApostrophe(change.action));
    }
    const items = html.match(/<li[ >]/g) ?? [];
    expect(items).toHaveLength(plan!.changes.length);
  });

  it("voegt de meegegeven className toe aan de root", () => {
    const plan = dbaMitigations({
      directSupervision: true,
      embedded: true,
      fixedSchedule: true,
      noSubstitution: true,
      exclusive: true,
      weakEntrepreneurship: true,
      durationMonths: null,
    });
    const html = renderToStaticMarkup(<DbaMitigationCard plan={plan} className="mt-2" />);
    expect(html).toContain("mt-2");
  });
});
