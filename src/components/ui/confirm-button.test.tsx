import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { ConfirmButton } from "./confirm-button";

// Destructieve acties zitten achter een bevestiging (DESIGN.md §7). De harde eis: in de
// gesloten begintoestand bestaat er géén pad naar de server-action — geen formulier, geen
// submit-knop. Het openen/sluiten van de dialoog zelf is browsergedrag en wordt in e2e gedekt.
const noop = async () => {};
const render = () =>
  renderToStaticMarkup(
    <ConfirmButton
      action={noop}
      title="Certificaat verwijderen?"
      description="Dit kan niet ongedaan worden gemaakt."
    >
      Verwijderen
    </ConfirmButton>,
  );

describe("ConfirmButton", () => {
  it("toont in rust alleen de trigger", () => {
    const html = render();
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain("Verwijderen");
  });

  it("submit niets zonder bevestiging: geen formulier en geen submit-knop", () => {
    const html = render();
    expect(html).not.toContain("<form");
    expect(html).not.toContain('type="submit"');
  });

  it("toont de dialoog en de dialoogteksten pas na bevestigen", () => {
    const html = render();
    expect(html).not.toContain('role="alertdialog"');
    expect(html).not.toContain("Dit kan niet ongedaan worden gemaakt.");
    expect(html).not.toContain("Annuleren");
  });

  it("is een echte knop, geen impliciete form-submit", () => {
    expect(render()).toContain('type="button"');
  });

  it("kondigt aan dat de knop een dialoog opent en nu gesloten is", () => {
    const html = render();
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("gebruikt standaard de discrete destructieve trigger (niet solide rood)", () => {
    const html = render();
    expect(html).toContain("text-danger");
    expect(html).not.toContain("bg-danger text-white");
  });

  it("laat een andere trigger-variant en maat toe", () => {
    const html = renderToStaticMarkup(
      <ConfirmButton action={noop} title="T" description="D" triggerVariant="ghost" size="xs">
        Weg
      </ConfirmButton>,
    );
    expect(html).toContain("hover:bg-muted");
    expect(html).toContain("h-7");
  });

  it("geeft een icoon-only trigger een toegankelijke naam", () => {
    const html = renderToStaticMarkup(
      <ConfirmButton action={noop} title="T" description="D" aria-label="Certificaat verwijderen">
        <span aria-hidden>x</span>
      </ConfirmButton>,
    );
    expect(html).toContain('aria-label="Certificaat verwijderen"');
  });

  it("laat een extra className toe op de trigger", () => {
    const html = renderToStaticMarkup(
      <ConfirmButton action={noop} title="T" description="D" className="ml-auto">
        Weg
      </ConfirmButton>,
    );
    expect(html).toContain("ml-auto");
  });
});
