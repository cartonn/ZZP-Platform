import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { ErrorState } from "./error-state";

// Node-omgeving (geen jsdom): we renderen naar statische HTML en toetsen de opmaak. De
// klik-afhandeling van "Opnieuw proberen" (reset) en de foutrapportage draaien in de browser en
// vallen buiten SSR; die worden in e2e gedekt.

const err = (digest?: string): Error & { digest?: string } =>
  Object.assign(new Error("kapot"), digest ? { digest } : {});

const noop = () => {};

describe("ErrorState", () => {
  it("toont de standaardtekst in het Nederlands met een herstelknop en terugweg", () => {
    const html = renderToStaticMarkup(<ErrorState error={err()} reset={noop} />);
    expect(html).toContain("Er ging iets mis");
    expect(html).toContain("Opnieuw proberen");
    expect(html).toContain("Naar dashboard");
    expect(html).toContain('href="/dashboard"');
  });

  it("markeert zichzelf als alert zodat schermlezers de fout aankondigen", () => {
    const html = renderToStaticMarkup(<ErrorState error={err()} reset={noop} />);
    expect(html).toContain('role="alert"');
  });

  it("gebruikt een eigen titel, uitleg en terugweg wanneer die zijn meegegeven", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        error={err()}
        reset={noop}
        title="Samenwerking kon niet worden geladen"
        description="Probeer het opnieuw."
        back={{ label: "Naar samenwerkingen", href: "/samenwerkingen" }}
      />,
    );
    expect(html).toContain("Samenwerking kon niet worden geladen");
    expect(html).toContain("Probeer het opnieuw.");
    expect(html).toContain('href="/samenwerkingen"');
    expect(html).toContain("Naar samenwerkingen");
    expect(html).not.toContain("Er ging iets mis");
  });

  it("toont de digest als foutcode zodat support de melding kan terugvinden", () => {
    const html = renderToStaticMarkup(<ErrorState error={err("abc123")} reset={noop} />);
    expect(html).toContain("Foutcode abc123");
  });

  it("laat de foutcode weg als er geen digest is (geen lege regel)", () => {
    const html = renderToStaticMarkup(<ErrorState error={err()} reset={noop} />);
    expect(html).not.toContain("Foutcode");
  });

  it("lekt de technische foutmelding nooit naar de gebruiker", () => {
    const html = renderToStaticMarkup(<ErrorState error={err("abc123")} reset={noop} />);
    expect(html).not.toContain("kapot");
  });
});

// Aanvullend op het bovenstaande: de vorm die de foutstaat deelt met de andere primitives —
// precies één weg vooruit en één weg terug, en geen bijwerking tijdens het renderen.
describe("ErrorState — vorm en bijwerkingen", () => {
  it("biedt precies één knop (opnieuw) en één link (terugweg), geen dode knoppen", () => {
    const html = renderToStaticMarkup(<ErrorState error={err()} reset={noop} />);
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html.match(/<a /g)).toHaveLength(1);
  });

  it("zet opnieuw-proberen als primaire actie en de terugweg als secundaire", () => {
    const html = renderToStaticMarkup(<ErrorState error={err()} reset={noop} />);
    expect(html).toContain("bg-primary");
    expect(html).toContain("bg-card");
  });

  it("roept reset niet aan tijdens het renderen (alleen op klik)", () => {
    let aangeroepen = 0;
    renderToStaticMarkup(<ErrorState error={err()} reset={() => void aangeroepen++} />);
    expect(aangeroepen).toBe(0);
  });

  it("toont het waarschuwingsicoon decoratief in de danger-toon", () => {
    const html = renderToStaticMarkup(<ErrorState error={err()} reset={noop} />);
    expect(html).toContain("lucide-triangle-alert");
    expect(html).toContain("bg-danger/10");
    expect(html).toContain('aria-hidden="true"');
  });

  it("blijft binnen een leesbare kolom en accepteert een extra className", () => {
    const html = renderToStaticMarkup(<ErrorState error={err()} reset={noop} className="py-8" />);
    expect(html).toContain("max-w-md");
    expect(html).toContain("py-8");
  });
});
