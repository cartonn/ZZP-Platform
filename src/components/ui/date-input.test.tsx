import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { DateInput } from "./date-input";

// Node-omgeving (geen jsdom): we renderen naar statische HTML en toetsen de opmaak.
// Zo blijft de test dependency-vrij en dekt hij de kern: hint zichtbaar + props doorgegeven.

describe("DateInput", () => {
  it("rendert een native date-input met NL-locale", () => {
    const html = renderToStaticMarkup(<DateInput name="startDate" />);
    expect(html).toContain('type="date"');
    expect(html).toContain('lang="nl"');
    expect(html).toContain('name="startDate"');
  });

  it("toont de formaat-hint dd-mm-jjjj", () => {
    const html = renderToStaticMarkup(<DateInput name="startDate" />);
    expect(html).toContain("Formaat: dd-mm-jjjj");
  });

  it("geeft de waarde (defaultValue) door aan de input", () => {
    const html = renderToStaticMarkup(<DateInput name="issuedAt" defaultValue="2026-07-02" />);
    expect(html).toContain('value="2026-07-02"');
  });

  it("koppelt de hint aria-technisch aan de input via aria-describedby", () => {
    const html = renderToStaticMarkup(<DateInput name="d" />);
    // De input verwijst naar het id van de hint-paragraaf.
    const describedByMatch = html.match(/aria-describedby="([^"]+)"/);
    expect(describedByMatch).not.toBeNull();
    const describedBy = describedByMatch?.[1] ?? "";
    const hintId = describedBy.split(" ").pop();
    expect(hintId).toBeTruthy();
    expect(html).toContain(`id="${hintId}"`);
  });

  it("voegt een doorgegeven aria-describedby samen met de hint", () => {
    const html = renderToStaticMarkup(<DateInput name="d" aria-describedby="extern-id" />);
    const describedByMatch = html.match(/aria-describedby="([^"]+)"/);
    expect(describedByMatch).not.toBeNull();
    expect((describedByMatch?.[1] ?? "").split(" ")).toContain("extern-id");
  });
});
