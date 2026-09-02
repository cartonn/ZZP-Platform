import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { TurnBanner } from "./turn-banner";
import { Button } from "./button";

// De "aan zet"-banier (DESIGN.md §4/§7): één boodschap, hoogstens één actie. Deze test
// bewaakt dat de banier vindbaar is als landmark en dat er geen dode of dubbele knop in staat.

describe("TurnBanner", () => {
  it("rendert een sectie met een vaste toegankelijke naam", () => {
    const html = renderToStaticMarkup(<TurnBanner title="2 urenstaten wachten op je akkoord" />);
    expect(html).toMatch(/^<section/);
    expect(html).toContain('aria-label="Aan zet"');
    expect(html).toContain("2 urenstaten wachten op je akkoord");
  });

  it("draagt de inkt-op-papier-omkering (hoog contrast)", () => {
    const html = renderToStaticMarkup(<TurnBanner title="x" />);
    expect(html).toContain("bg-foreground");
    expect(html).toContain("text-background");
  });

  it("toont de toelichting onder de titel", () => {
    const html = renderToStaticMarkup(
      <TurnBanner title="Contract ligt klaar" description="Teken vóór maandag" />,
    );
    expect(html.indexOf("Contract ligt klaar")).toBeLessThan(html.indexOf("Teken vóór maandag"));
  });

  it("laat de toelichtingsregel weg als er geen is (geen lege ruimte)", () => {
    const html = renderToStaticMarkup(<TurnBanner title="Alleen een titel" />);
    expect(html).not.toContain("opacity-75");
  });

  it("rendert precies één actie wanneer die is meegegeven", () => {
    const html = renderToStaticMarkup(
      <TurnBanner title="Urenstaat ligt klaar" action={<Button size="sm">Beoordelen</Button>} />,
    );
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain("Beoordelen");
  });

  it("rendert geen knop of actie-slot zonder actie (geen dode knop)", () => {
    const html = renderToStaticMarkup(<TurnBanner title="Niets te doen" />);
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('<div class="shrink-0">');
  });

  it("respecteert prefers-reduced-motion voor het pulserende merkpunt", () => {
    const html = renderToStaticMarkup(<TurnBanner title="x" />);
    expect(html).toContain("animate-ping");
    expect(html).toContain("motion-reduce:animate-none");
  });

  it("verbergt het decoratieve merkpunt voor screenreaders", () => {
    const html = renderToStaticMarkup(<TurnBanner title="x" />);
    expect(html).toContain('aria-hidden="true"');
  });

  it("accepteert rijke inhoud als titel en toelichting", () => {
    const html = renderToStaticMarkup(
      <TurnBanner
        title={<>Nog 3 acties</>}
        description={
          <>
            Zie <span>de lijst</span>
          </>
        }
      />,
    );
    expect(html).toContain("Nog 3 acties");
    expect(html).toContain("<span>de lijst</span>");
  });

  it("laat een extra className toe zonder de basisvorm te verliezen", () => {
    const html = renderToStaticMarkup(<TurnBanner title="x" className="mb-6" />);
    expect(html).toContain("mb-6");
    expect(html).toContain("rounded-lg");
  });
});
