import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Badge } from "./badge";

// De badge draagt de status-taal van het hele platform (DESIGN.md §7): elke toestand
// heeft één token. Deze test bevriest dat contract zodat een variant niet stilletjes
// van kleur verschiet of verdwijnt.

describe("Badge", () => {
  it("rendert een span met de gedeelde chipvorm", () => {
    const html = renderToStaticMarkup(<Badge>Concept</Badge>);
    expect(html).toMatch(/^<span/);
    expect(html).toContain("Concept");
    expect(html).toContain("rounded-full");
    expect(html).toContain("text-xs");
    expect(html).toContain("font-medium");
    expect(html).toContain("px-2.5");
  });

  it("valt zonder variant terug op default (rand + kaartachtergrond)", () => {
    const html = renderToStaticMarkup(<Badge>Status</Badge>);
    expect(html).toContain("border-border");
    expect(html).toContain("bg-card");
  });

  it("koppelt elke variant aan zijn eigen semantische token", () => {
    const tokens: Array<[React.ComponentProps<typeof Badge>["variant"], string]> = [
      ["muted", "bg-muted"],
      ["accent", "bg-primary/10"],
      ["success", "bg-success/10"],
      ["warning", "bg-warning/15"],
      ["danger", "bg-danger/10"],
    ];
    for (const [variant, token] of tokens) {
      const html = renderToStaticMarkup(<Badge variant={variant}>x</Badge>);
      expect(html, `variant ${variant}`).toContain(token);
    }
  });

  it("geeft de niet-default varianten een transparante rand (geen dubbele lijn)", () => {
    for (const variant of ["muted", "accent", "success", "warning", "danger"] as const) {
      expect(renderToStaticMarkup(<Badge variant={variant}>x</Badge>)).toContain(
        "border-transparent",
      );
    }
  });

  it("laat een eigen className de variantkleur overschrijven (tailwind-merge)", () => {
    const html = renderToStaticMarkup(
      <Badge variant="success" className="bg-danger/10">
        Afgekeurd
      </Badge>,
    );
    expect(html).toContain("bg-danger/10");
    expect(html).not.toContain("bg-success/10");
  });

  it("geeft overige span-props door (titel, data-attributen)", () => {
    const html = renderToStaticMarkup(
      <Badge title="Verloopt binnen 30 dagen" data-testid="chip">
        Verloopt
      </Badge>,
    );
    expect(html).toContain('title="Verloopt binnen 30 dagen"');
    expect(html).toContain('data-testid="chip"');
  });
});
