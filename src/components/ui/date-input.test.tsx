import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { DateInput, displayToIso, isoToDisplay } from "./date-input";

// Node-omgeving (geen jsdom): we renderen naar statische HTML en toetsen de opmaak.
// De pure parse-/formatteerfuncties testen we direct; interactieve state (blur-validatie,
// picker) valt buiten SSR en wordt in e2e gedekt.

describe("displayToIso", () => {
  it("parset dd-mm-jjjj naar ISO", () => {
    expect(displayToIso("02-07-2026")).toBe("2026-07-02");
  });

  it("accepteert d-m-jjjj (enkele cijfers)", () => {
    expect(displayToIso("2-7-2026")).toBe("2026-07-02");
  });

  it("accepteert dd/mm/jjjj (schuine streep)", () => {
    expect(displayToIso("02/07/2026")).toBe("2026-07-02");
  });

  it("accepteert dd.mm.jjjj (punt)", () => {
    expect(displayToIso("02.07.2026")).toBe("2026-07-02");
  });

  it("geeft lege string terug voor lege invoer (leeg blijft leeg)", () => {
    expect(displayToIso("")).toBe("");
    expect(displayToIso("   ")).toBe("");
  });

  it("weigert onparseerbare invoer met null", () => {
    expect(displayToIso("abc")).toBeNull();
    expect(displayToIso("2026-07-02")).toBeNull(); // ISO-formaat is geen NL-invoer
    expect(displayToIso("7/2/26")).toBeNull(); // jaar moet 4 cijfers zijn
  });

  it("weigert een niet-bestaande datum (31-02) met null", () => {
    expect(displayToIso("31-02-2026")).toBeNull();
    expect(displayToIso("30-02-2026")).toBeNull();
    expect(displayToIso("00-01-2026")).toBeNull();
    expect(displayToIso("01-13-2026")).toBeNull();
  });

  it("accepteert een schrikkeldag (29-02-2028)", () => {
    expect(displayToIso("29-02-2028")).toBe("2028-02-29");
  });
});

describe("isoToDisplay", () => {
  it("zet ISO om naar dd-mm-jjjj", () => {
    expect(isoToDisplay("2026-07-02")).toBe("02-07-2026");
  });

  it("geeft lege string voor lege of ongeldige waarde", () => {
    expect(isoToDisplay("")).toBe("");
    expect(isoToDisplay(undefined)).toBe("");
    expect(isoToDisplay(null)).toBe("");
    expect(isoToDisplay("geen-datum")).toBe("");
  });
});

describe("DateInput", () => {
  it("rendert een tekstveld met NL-placeholder in plaats van een native date-veld", () => {
    const html = renderToStaticMarkup(<DateInput id="startDate" name="startDate" />);
    expect(html).toContain('type="text"');
    expect(html).toContain('placeholder="dd-mm-jjjj"');
    expect(html).toContain('id="startDate"');
    expect(html.toLowerCase()).toContain('inputmode="numeric"');
    // Geen native date-veld meer als primair invoerveld.
    expect(html).not.toContain('type="date" id="startDate"');
  });

  it("levert de waarde als ISO door aan een hidden input met de oorspronkelijke name", () => {
    const html = renderToStaticMarkup(<DateInput id="issuedAt" name="issuedAt" />);
    expect(html).toContain('type="hidden"');
    expect(html).toContain('name="issuedAt"');
  });

  it("toont geen aparte 'Formaat:'-hintregel meer (placeholder is de hint)", () => {
    const html = renderToStaticMarkup(<DateInput name="d" />);
    expect(html).not.toContain("Formaat: dd-mm-jjjj");
  });

  it("prefill: een ISO-defaultValue verschijnt als dd-mm-jjjj in het zichtbare veld", () => {
    const html = renderToStaticMarkup(<DateInput name="issuedAt" defaultValue="2026-07-02" />);
    // Zichtbaar tekstveld toont de NL-notatie...
    expect(html).toContain('value="02-07-2026"');
    // ...en het verborgen veld draagt de ongewijzigde ISO-waarde voor de server.
    expect(html).toContain('value="2026-07-02"');
  });

  it("prefill: een ISO-value (controlled) verschijnt eveneens als dd-mm-jjjj", () => {
    const html = renderToStaticMarkup(<DateInput name="d" value="2030-01-15" />);
    expect(html).toContain('value="15-01-2030"');
    expect(html).toContain('value="2030-01-15"');
  });

  it("lege prefill blijft leeg (optioneel veld blijft optioneel)", () => {
    const html = renderToStaticMarkup(<DateInput name="expiresAt" />);
    // Hidden input heeft een lege waarde; geen datum verzonnen.
    expect(html).toContain('name="expiresAt"');
    expect(html).not.toContain('value="0');
  });

  it("geeft required door aan het zichtbare veld", () => {
    const html = renderToStaticMarkup(<DateInput id="startDate" name="startDate" required />);
    // Het zichtbare tekstveld draagt required (browservalidatie blijft werken).
    expect(html).toMatch(/type="text"[^>]*required|required[^>]*type="text"/);
  });

  it("koppelt een doorgegeven aria-describedby door aan de input", () => {
    const html = renderToStaticMarkup(<DateInput name="d" aria-describedby="extern-id" />);
    const describedByMatch = html.match(/aria-describedby="([^"]+)"/);
    expect(describedByMatch).not.toBeNull();
    expect((describedByMatch?.[1] ?? "").split(" ")).toContain("extern-id");
  });
});
