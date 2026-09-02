import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardTitle, CardContent } from "./card";

// Card is de basisvorm van elk paneel (DESIGN.md §4/§6): rand + gelaagde elevatie,
// vaste padding. Deze test bewaakt die maten zodat pagina's niet uit elkaar lopen.

describe("Card", () => {
  it("rendert een div met rand, kaartachtergrond en gelaagde elevatie", () => {
    const html = renderToStaticMarkup(<Card>inhoud</Card>);
    expect(html).toMatch(/^<div/);
    expect(html).toContain("rounded-lg");
    expect(html).toContain("border-border");
    expect(html).toContain("bg-card");
    expect(html).toContain("shadow-card");
    expect(html).toContain("inhoud");
  });

  it("geeft div-props door (id, aria, data-*)", () => {
    const html = renderToStaticMarkup(
      <Card id="paneel" aria-label="Certificaten" data-testid="kaart" />,
    );
    expect(html).toContain('id="paneel"');
    expect(html).toContain('aria-label="Certificaten"');
    expect(html).toContain('data-testid="kaart"');
  });

  it("laat een eigen className de standaardvorm overschrijven (tailwind-merge)", () => {
    const html = renderToStaticMarkup(<Card className="rounded-none" />);
    expect(html).toContain("rounded-none");
    expect(html).not.toContain("rounded-lg");
  });
});

describe("CardHeader", () => {
  it("scheidt de kop met een hairline en houdt de canonieke padding", () => {
    const html = renderToStaticMarkup(<CardHeader>kop</CardHeader>);
    expect(html).toContain("border-b");
    expect(html).toContain("px-5");
    expect(html).toContain("py-4");
  });
});

describe("CardTitle", () => {
  it("rendert een h2 zodat de koppenstructuur klopt voor screenreaders", () => {
    const html = renderToStaticMarkup(<CardTitle>Certificaten</CardTitle>);
    expect(html).toMatch(/^<h2/);
    expect(html).toContain("Certificaten");
    expect(html).toContain("font-semibold");
  });
});

describe("CardContent", () => {
  it("houdt de canonieke binnenmarge", () => {
    expect(renderToStaticMarkup(<CardContent>x</CardContent>)).toContain("p-5");
  });
});

describe("Card-compositie", () => {
  it("nest kop, titel en inhoud in de verwachte volgorde", () => {
    const html = renderToStaticMarkup(
      <Card>
        <CardHeader>
          <CardTitle>Openstaande facturen</CardTitle>
        </CardHeader>
        <CardContent>Geen facturen</CardContent>
      </Card>,
    );
    expect(html.indexOf("Openstaande facturen")).toBeLessThan(html.indexOf("Geen facturen"));
    expect(html).toContain("<h2");
  });
});
