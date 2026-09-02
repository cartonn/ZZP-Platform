import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { ThemeToggle } from "./theme-toggle";
import { nextTheme, applyTheme, isTheme, type Theme } from "@/lib/theme";

// De themaknop rendert server-side in de lichte stand; het no-flash-script in de root-layout
// zet de echte stand vóór de eerste paint en de knop synchroniseert bij hydratatie.
// Hier toetsen we het render-contract plus de overgangsregel die de knop toepast
// (nextTheme + applyTheme op de root); het echte wisselen zit in e2e/qa/themes.spec.ts.

describe("ThemeToggle", () => {
  it("rendert een echte knop, geen impliciete form-submit", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toMatch(/^<button/);
    expect(html).toContain('type="button"');
  });

  it("heeft een toegankelijke naam die de dóélstand benoemt", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain('aria-label="Schakel naar donkere modus"');
    expect(html).toContain('title="Donkere modus"');
  });

  it("toont het maan-icoon decoratief (de naam zit op de knop)", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain("lucide-moon");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("lucide-sun");
  });

  it("houdt de focus zichtbaar en het raakvlak groot genoeg", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain("focus-ring");
    expect(html).toContain("size-9");
  });

  it("laat eigen labels toe (bv. voor een andere context)", () => {
    const html = renderToStaticMarkup(<ThemeToggle toDarkLabel="Donker aan" darkTitle="Donker" />);
    expect(html).toContain('aria-label="Donker aan"');
    expect(html).toContain('title="Donker"');
  });

  it("wisselt volgens de overgangsregel die de knop gebruikt", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });

  it("zet en verwijdert de dark-class op de root (wat de knop toepast)", () => {
    const gezet: Array<[string, boolean]> = [];
    const root = { classList: { toggle: (t: string, f: boolean) => void gezet.push([t, f]) } };
    applyTheme("dark", root);
    applyTheme("light", root);
    expect(gezet).toEqual([
      ["dark", true],
      ["dark", false],
    ]);
  });

  it("accepteert alleen een geldige opgeslagen keuze (rommel valt terug op de root)", () => {
    const opgeslagen: unknown[] = ["dark", "light", "paars", null, undefined, ""];
    const geldig = opgeslagen.filter((v): v is Theme => isTheme(v));
    expect(geldig).toEqual(["dark", "light"]);
  });
});
