import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Seal } from "./seal";

// Het zegel is hét vertrouwensteken (DESIGN.md — signatuur). Het mag nooit als naamloos
// plaatje in de toegankelijkheidsboom belanden, en nooit als naamloze ruis blijven staan
// wanneer het puur decoratief is.
const CHECK = "M10.6 13h7a10 10 0 0 1 10 10v4";
const BANG = "M24 14v13M24 34h.01";

describe("Seal", () => {
  it("rendert een svg met de dubbele ring", () => {
    const html = renderToStaticMarkup(<Seal />);
    expect(html).toMatch(/^<svg/);
    expect(html).toContain('viewBox="0 0 48 48"');
    // Buitenring + binnenring + vulling = drie cirkels.
    expect(html.match(/<circle/g)).toHaveLength(3);
  });

  it("toont standaard de geverifieerde toon met de originele handen", () => {
    const html = renderToStaticMarkup(<Seal />);
    expect(html).toContain("hs-seal-approved");
    expect(html).toContain(CHECK);
    expect(html).not.toContain(BANG);
  });

  it("kleurt de merk-toon met de primaire kleur, met dezelfde handen", () => {
    const html = renderToStaticMarkup(<Seal tone="brand" />);
    expect(html).toContain("text-primary");
    expect(html).toContain(CHECK);
  });

  it("wisselt bij verloop naar amber én naar een uitroepteken (niet alleen kleur)", () => {
    const html = renderToStaticMarkup(<Seal tone="expiring" />);
    expect(html).toContain("text-warning");
    expect(html).toContain(BANG);
    expect(html).not.toContain(CHECK);
  });

  it("krijgt met een label een toegankelijke naam als afbeelding", () => {
    const html = renderToStaticMarkup(<Seal label="Geverifieerd certificaat" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Geverifieerd certificaat"');
    expect(html).not.toContain("aria-hidden");
  });

  it("is zonder label decoratief en verborgen voor screenreaders", () => {
    const html = renderToStaticMarkup(<Seal />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("aria-label");
  });

  it("schaalt via vaste maten en blijft onsamendrukbaar in flex-rijen", () => {
    expect(renderToStaticMarkup(<Seal size="sm" />)).toContain("size-5");
    expect(renderToStaticMarkup(<Seal size="md" />)).toContain("size-7");
    expect(renderToStaticMarkup(<Seal size="lg" />)).toContain("size-9");
    expect(renderToStaticMarkup(<Seal />)).toContain("shrink-0");
  });

  it("accepteert een extra className zonder de toon te verliezen", () => {
    const html = renderToStaticMarkup(<Seal tone="brand" className="ml-2" />);
    expect(html).toContain("ml-2");
    expect(html).toContain("text-primary");
  });
});
