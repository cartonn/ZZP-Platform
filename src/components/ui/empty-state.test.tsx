import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { FileText } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "./button";

// De gedeelde lege staat (DESIGN.md §4): één rustige vorm voor "hier is nog niets", met
// hooguit één volgende actie — en die verwijst altijd ergens heen (geen dode knoppen).

describe("EmptyState", () => {
  it("toont de titel gecentreerd zonder eigen rand (past binnen én buiten een Card)", () => {
    const html = renderToStaticMarkup(<EmptyState title="Nog geen facturen" />);
    expect(html).toContain("Nog geen facturen");
    expect(html).toContain("text-center");
    expect(html).not.toContain("border-border");
  });

  it("toont de optionele uitleg onder de titel", () => {
    const html = renderToStaticMarkup(
      <EmptyState title="Nog geen facturen" description="Facturen verschijnen na goedkeuring." />,
    );
    expect(html.indexOf("Nog geen facturen")).toBeLessThan(
      html.indexOf("Facturen verschijnen na goedkeuring."),
    );
    expect(html).toContain("text-muted-foreground");
  });

  it("laat de uitlegregel volledig weg als er geen uitleg is", () => {
    const html = renderToStaticMarkup(<EmptyState title="Leeg" />);
    expect(html).not.toContain("max-w-sm");
  });

  it("rendert het icoon decoratief in een zachte cirkel", () => {
    const html = renderToStaticMarkup(<EmptyState icon={FileText} title="Leeg" />);
    expect(html).toContain("rounded-full");
    expect(html).toContain("lucide-file-text");
    expect(html).toContain('aria-hidden="true"');
  });

  it("rendert zonder icoon geen lege cirkel", () => {
    expect(renderToStaticMarkup(<EmptyState title="Leeg" />)).not.toContain("size-11");
  });

  it("rendert de actie als één echte link met bestemming", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title="Nog geen opdrachten"
        action={{ label: "Zoek opdrachten", href: "/opdrachten" }}
      />,
    );
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('href="/opdrachten"');
    expect(html).toContain("Zoek opdrachten");
    // Geen losse button die nergens heen gaat.
    expect(html).not.toContain("<button");
  });

  it("rendert geen actie-element zonder actie", () => {
    const html = renderToStaticMarkup(<EmptyState title="Leeg" />);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("<button");
  });

  it("biedt een extra slot voor een client-side actie (bv. filters wissen)", () => {
    const html = renderToStaticMarkup(
      <EmptyState title="Geen resultaten">
        <Button size="sm" variant="secondary">
          Filters wissen
        </Button>
      </EmptyState>,
    );
    expect(html).toContain("Filters wissen");
    expect(html).toContain("<button");
  });

  it("combineert een primaire actie met het extra slot in de juiste volgorde", () => {
    const html = renderToStaticMarkup(
      <EmptyState title="Leeg" action={{ label: "Nieuw", href: "/nieuw" }}>
        <span>extra</span>
      </EmptyState>,
    );
    expect(html.indexOf("Nieuw")).toBeLessThan(html.indexOf("extra"));
  });

  it("laat een extra className toe", () => {
    expect(renderToStaticMarkup(<EmptyState title="Leeg" className="py-6" />)).toContain("py-6");
  });
});
