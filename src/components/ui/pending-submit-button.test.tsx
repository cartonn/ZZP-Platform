import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import { PendingSubmitButton } from "./pending-submit-button";

// De submit-knop van elk server-action-form. Contract: submit-type, en tijdens het
// verzenden onklikbaar zodat een mutatie niet dubbel wordt uitgevoerd. We sturen
// useFormStatus rechtstreeks aan; de watchdog-herlaad is browsergedrag (e2e).
const pending = vi.hoisted(() => ({ value: false }));
/** Het disabled-attribuut zelf, los van de `disabled:`-utility-klassen. */
const isDisabled = (html: string) => /\sdisabled(=|\s|>)/.test(html.replace(/class="[^"]*"/, ""));
vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: () => ({ pending: pending.value }),
}));

describe("PendingSubmitButton", () => {
  it("rendert een submit-knop met de meegegeven tekst", () => {
    pending.value = false;
    const html = renderToStaticMarkup(<PendingSubmitButton>Indienen</PendingSubmitButton>);
    expect(html).toMatch(/^<button/);
    expect(html).toContain('type="submit"');
    expect(html).toContain("Indienen");
  });

  it("is klikbaar zolang het formulier niet verzendt", () => {
    pending.value = false;
    const html = renderToStaticMarkup(<PendingSubmitButton>Indienen</PendingSubmitButton>);
    expect(isDisabled(html)).toBe(false);
  });

  it("blokkeert zichzelf tijdens het verzenden (geen dubbele mutatie)", () => {
    pending.value = true;
    const html = renderToStaticMarkup(<PendingSubmitButton>Indienen</PendingSubmitButton>);
    expect(isDisabled(html)).toBe(true);
  });

  it("toont de geblokkeerde staat ook visueel", () => {
    pending.value = true;
    const html = renderToStaticMarkup(<PendingSubmitButton>Indienen</PendingSubmitButton>);
    expect(html).toContain("disabled:opacity-50");
    expect(html).toContain("disabled:pointer-events-none");
  });

  it("gebruikt standaard de sm-maat van de knop-primitive", () => {
    pending.value = false;
    expect(renderToStaticMarkup(<PendingSubmitButton>x</PendingSubmitButton>)).toContain("h-8");
  });

  it("geeft variant, maat en className door aan de knop", () => {
    pending.value = false;
    const html = renderToStaticMarkup(
      <PendingSubmitButton variant="secondary" size="md" className="w-full">
        Opslaan
      </PendingSubmitButton>,
    );
    expect(html).toContain("bg-card");
    expect(html).toContain("h-10");
    expect(html).toContain("w-full");
  });

  it("accepteert rijke inhoud (icoon + label)", () => {
    pending.value = false;
    const html = renderToStaticMarkup(
      <PendingSubmitButton>
        <span aria-hidden>→</span> Verstuur
      </PendingSubmitButton>,
    );
    expect(html).toContain("Verstuur");
    expect(html).toContain('aria-hidden="true"');
  });
});
