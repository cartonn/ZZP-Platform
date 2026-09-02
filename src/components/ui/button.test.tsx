import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Button } from "./button";

// Contracttest voor de knop-primitive (DESIGN.md §4). Node-omgeving: we renderen naar
// statische HTML en toetsen het publieke contract (element, varianten, maten, states).
const render = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("Button", () => {
  it("rendert standaard een <button> in de primary/md-vorm", () => {
    const html = render(<Button>Opslaan</Button>);
    expect(html).toMatch(/^<button/);
    expect(html).toContain("Opslaan");
    expect(html).toContain("bg-primary");
    expect(html).toContain("text-primary-foreground");
    expect(html).toContain("h-10"); // md
  });

  it("geeft elke variant zijn eigen kleurtaal", () => {
    expect(render(<Button variant="secondary">x</Button>)).toContain("border-border");
    expect(render(<Button variant="ghost">x</Button>)).toContain("hover:bg-muted");
    // Discreet destructief: rand + rode tekst, pas gevuld op hover.
    const destructive = render(<Button variant="destructive">x</Button>);
    expect(destructive).toContain("text-danger");
    expect(destructive).not.toContain("bg-danger text-white");
    // Solide danger is voorbehouden aan de bevestigingsdialoog.
    expect(render(<Button variant="danger">x</Button>)).toContain("bg-danger");
  });

  it("vertaalt de maat naar een vaste hoogte (touch target)", () => {
    expect(render(<Button size="xs">x</Button>)).toContain("h-7");
    expect(render(<Button size="sm">x</Button>)).toContain("h-8");
    expect(render(<Button size="md">x</Button>)).toContain("h-10");
  });

  it("draagt altijd de zichtbare focusring en de disabled-afhandeling", () => {
    const html = render(<Button>x</Button>);
    expect(html).toContain("focus-ring");
    expect(html).toContain("disabled:pointer-events-none");
    expect(html).toContain("disabled:opacity-50");
  });

  it("zet het disabled-attribuut door naar het element", () => {
    const html = render(<Button disabled>Bezig</Button>);
    expect(html).toContain("disabled=");
  });

  it("laat een expliciet type ongemoeid (geen impliciete submit forceren)", () => {
    expect(render(<Button type="button">x</Button>)).toContain('type="button"');
    expect(render(<Button type="submit">x</Button>)).toContain('type="submit"');
  });

  it("rendert met asChild het kind-element in plaats van een button (Radix Slot)", () => {
    const html = render(
      <Button asChild variant="secondary" size="xs">
        <a href="#opdrachten">Naar opdrachten</a>
      </Button>,
    );
    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="#opdrachten"');
    expect(html).not.toContain("<button");
    // De knopstijl reist mee naar het kind.
    expect(html).toContain("h-7");
    expect(html).toContain("bg-card");
  });

  it("laat een meegegeven className de variant overschrijven (tailwind-merge)", () => {
    const html = render(<Button className="bg-danger">x</Button>);
    expect(html).toContain("bg-danger");
    expect(html).not.toContain("bg-primary ");
  });

  it("geeft overige props (aria-label, data-*) door", () => {
    const html = render(
      <Button aria-label="Verwijder certificaat" data-testid="verwijder">
        <span aria-hidden>x</span>
      </Button>,
    );
    expect(html).toContain('aria-label="Verwijder certificaat"');
    expect(html).toContain('data-testid="verwijder"');
  });
});
