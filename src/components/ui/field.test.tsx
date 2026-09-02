import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Field } from "./field";

// Field koppelt label, hint en foutmelding aria-technisch aan het invoerveld
// (WCAG 1.3.1 / 3.3.1 / 4.1.3). Dat is de reden dat deze primitive bestaat.

describe("Field", () => {
  it("koppelt het label aan het veld via htmlFor/id", () => {
    const html = renderToStaticMarkup(
      <Field label="Voornaam" htmlFor="voornaam">
        <input id="voornaam" />
      </Field>,
    );
    expect(html).toContain('<label for="voornaam"');
    expect(html).toContain('id="voornaam"');
    expect(html).toContain("Voornaam");
  });

  it("markeert een verplicht veld zichtbaar met een asterisk", () => {
    const html = renderToStaticMarkup(
      <Field label="E-mail" htmlFor="email" required>
        <input id="email" />
      </Field>,
    );
    expect(html).toContain("text-danger");
    expect(html).toContain("*");
  });

  it("koppelt een hint aan het veld met aria-describedby", () => {
    const html = renderToStaticMarkup(
      <Field label="KVK-nummer" htmlFor="kvk" hint="Acht cijfers">
        <input id="kvk" />
      </Field>,
    );
    expect(html).toContain('aria-describedby="kvk-hint"');
    expect(html).toContain('id="kvk-hint"');
    expect(html).toContain("Acht cijfers");
  });

  it("markeert een fout als aria-invalid en koppelt de melding", () => {
    const html = renderToStaticMarkup(
      <Field label="KVK-nummer" htmlFor="kvk" error="Ongeldig KVK-nummer">
        <input id="kvk" />
      </Field>,
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="kvk-error"');
    expect(html).toContain('id="kvk-error"');
  });

  it("kondigt de foutmelding actief aan (role=alert)", () => {
    const html = renderToStaticMarkup(
      <Field label="Naam" htmlFor="naam" error="Verplicht veld">
        <input id="naam" />
      </Field>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Verplicht veld");
  });

  it("vervangt de hint door de fout (geen twee concurrerende boodschappen)", () => {
    const html = renderToStaticMarkup(
      <Field label="KVK" htmlFor="kvk" hint="Acht cijfers" error="Ongeldig">
        <input id="kvk" />
      </Field>,
    );
    expect(html).toContain("Ongeldig");
    expect(html).not.toContain("Acht cijfers");
    expect(html).toContain('aria-describedby="kvk-error"');
  });

  it("is niet foutief zolang er geen fout is", () => {
    const html = renderToStaticMarkup(
      <Field label="Naam" htmlFor="naam" hint="Zoals in je paspoort">
        <input id="naam" />
      </Field>,
    );
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain('role="alert"');
  });

  it("behoudt een aria-describedby die het veld zelf al had", () => {
    const html = renderToStaticMarkup(
      <Field label="Datum" htmlFor="datum" error="Ongeldige datum">
        <input id="datum" aria-describedby="extern-id" />
      </Field>,
    );
    const ids = html.match(/aria-describedby="([^"]+)"/)?.[1].split(" ") ?? [];
    expect(ids).toContain("datum-error");
    expect(ids).toContain("extern-id");
  });

  it("rendert een niet-element-kind ongewijzigd (bv. een tekstwaarde)", () => {
    const html = renderToStaticMarkup(
      <Field label="Status" htmlFor="status" hint="Alleen-lezen">
        Geverifieerd
      </Field>,
    );
    expect(html).toContain("Geverifieerd");
    expect(html).toContain("Alleen-lezen");
  });
});
