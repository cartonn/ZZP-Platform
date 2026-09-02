import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { CascadeStepper, type CascadeStep } from "./cascade-stepper";

// De cascade (contract → uren → factuur → betaald) is de ruggengraat van het platform.
// Contract: een geordende lijst, de huidige stap is aanwijsbaar, en elke status is ook
// zonder kleur te lezen.
const KETEN: CascadeStep[] = [
  { label: "Contract", status: "done", detail: "getekend 2 jun" },
  { label: "Uren", status: "active" },
  { label: "Factuur", status: "waiting" },
  { label: "Betaald", status: "error" },
];

describe("CascadeStepper", () => {
  it("rendert een geordende lijst met één item per stap, in volgorde", () => {
    const html = renderToStaticMarkup(<CascadeStepper steps={KETEN} />);
    expect(html).toMatch(/^<ol/);
    expect(html.match(/<li/g)).toHaveLength(4);
    expect(html.indexOf("Contract")).toBeLessThan(html.indexOf("Uren"));
    expect(html.indexOf("Uren")).toBeLessThan(html.indexOf("Factuur"));
    expect(html.indexOf("Factuur")).toBeLessThan(html.indexOf("Betaald"));
  });

  it("markeert uitsluitend de actieve stap met aria-current", () => {
    const html = renderToStaticMarkup(<CascadeStepper steps={KETEN} />);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
  });

  it("geeft een afgeronde stap de zegelgroene vulling", () => {
    const html = renderToStaticMarkup(
      <CascadeStepper steps={[{ label: "Contract", status: "done" }]} />,
    );
    expect(html).toContain("border-success");
    expect(html).toContain("bg-success");
    expect(html).toContain("lucide-check");
  });

  it("geeft de actieve stap de merkring en toont het stapnummer", () => {
    const html = renderToStaticMarkup(
      <CascadeStepper steps={[{ label: "Uren", status: "active" }]} />,
    );
    expect(html).toContain("ring-primary/15");
    expect(html).toContain("text-primary");
    expect(html).toContain(">1<");
  });

  it("houdt een wachtende stap gedempt zonder icoon", () => {
    const html = renderToStaticMarkup(
      <CascadeStepper steps={[{ label: "Factuur", status: "waiting" }]} />,
    );
    expect(html).toContain("text-muted-foreground");
    expect(html).not.toContain("lucide-check");
    expect(html).not.toContain("lucide-x");
  });

  it("markeert een foutstap met danger én een kruis-icoon", () => {
    const html = renderToStaticMarkup(
      <CascadeStepper steps={[{ label: "Betaald", status: "error" }]} />,
    );
    expect(html).toContain("border-danger");
    expect(html).toContain("text-danger");
    expect(html).toContain("lucide-x");
  });

  it("benoemt elke status ook in tekst, zodat kleur niet de enige drager is", () => {
    const html = renderToStaticMarkup(<CascadeStepper steps={KETEN} />);
    for (const woord of ["afgerond", "aan zet", "wacht", "fout"]) {
      expect(html, woord).toContain(`<span class="sr-only"> — ${woord}</span>`);
    }
  });

  it("toont de optionele toelichting onder het label", () => {
    const html = renderToStaticMarkup(<CascadeStepper steps={KETEN} />);
    expect(html).toContain("getekend 2 jun");
    expect(html.indexOf("Contract")).toBeLessThan(html.indexOf("getekend 2 jun"));
  });

  it("tekent verbindingslijnen tussen de stappen, niet vóór de eerste", () => {
    const html = renderToStaticMarkup(<CascadeStepper steps={KETEN} />);
    expect(html.match(/left-\[-50%\]/g)).toHaveLength(3);
  });

  it("kleurt de lijn naar een bereikte stap groen en naar een wachtende stap neutraal", () => {
    const html = renderToStaticMarkup(<CascadeStepper steps={KETEN} />);
    const lijnen = html.match(/left-\[-50%\][^"]*/g) ?? [];
    expect(lijnen[0]).toContain("bg-success"); // naar de actieve stap
    expect(lijnen[1]).toContain("bg-border"); // naar de wachtende stap
  });

  it("rendert een lege keten als een lege lijst zonder te breken", () => {
    const html = renderToStaticMarkup(<CascadeStepper steps={[]} />);
    expect(html).toContain("<ol");
    expect(html).not.toContain("<li");
  });
});
