import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Sparkline } from "./sparkline";

// Kleine inline-trend (DESIGN.md — signatuur): geen assen, geen grid, de richting is de
// boodschap. De schaal-logica is getest in src/lib/sparkline.test.ts; hier bewaken we het
// render-contract: één polyline, de juiste viewBox en een correcte toegankelijkheidsstatus.
const points = (html: string) => html.match(/points="([^"]*)"/)?.[1] ?? "";

describe("Sparkline", () => {
  it("tekent één polyline uit de reeks", () => {
    const html = renderToStaticMarkup(<Sparkline values={[1, 2, 3]} />);
    expect(html).toMatch(/^<svg/);
    expect(html.match(/<polyline/g)).toHaveLength(1);
    expect(points(html).split(" ")).toHaveLength(3);
  });

  it("rendert niets bij een lege reeks (geen leeg kadertje)", () => {
    expect(renderToStaticMarkup(<Sparkline values={[]} />)).toBe("");
  });

  it("laat de laatste waarde rechts eindigen en de eerste links beginnen", () => {
    const html = renderToStaticMarkup(<Sparkline values={[10, 20, 30]} width={100} height={20} />);
    const coords = points(html).split(" ");
    expect(coords[0]?.startsWith("2,")).toBe(true);
    expect(coords[coords.length - 1]?.startsWith("98,")).toBe(true);
  });

  it("tekent een vlakke reeks als middenlijn (geen deling door nul)", () => {
    const html = renderToStaticMarkup(<Sparkline values={[5, 5, 5]} height={28} />);
    const ys = points(html)
      .split(" ")
      .map((p) => p.split(",")[1]);
    expect(new Set(ys).size).toBe(1);
    expect(ys[0]).toBe("14");
  });

  it("volgt de merkkleur en tekent geen assen of grid", () => {
    const html = renderToStaticMarkup(<Sparkline values={[1, 4, 2]} />);
    expect(html).toContain("hsl(var(--primary))");
    expect(html).toContain('fill="none"');
    expect(html).not.toContain("<line");
    expect(html).not.toContain("<rect");
  });

  it("neemt eigen afmetingen over in de viewBox", () => {
    const html = renderToStaticMarkup(<Sparkline values={[1, 2]} width={200} height={40} />);
    expect(html).toContain('viewBox="0 0 200 40"');
    expect(html).toContain('width="200"');
    expect(html).toContain('height="40"');
  });

  it("krijgt met een label een toegankelijke naam", () => {
    const html = renderToStaticMarkup(<Sparkline values={[1, 2]} label="Omzet per maand" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Omzet per maand"');
    expect(html).not.toContain("aria-hidden");
  });

  it("is zonder label decoratief en verborgen voor screenreaders", () => {
    const html = renderToStaticMarkup(<Sparkline values={[1, 2]} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });
});
