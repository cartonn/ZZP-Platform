import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Table, THead, TBody, TR, TH, TD } from "./table";

// De canonieke tabel (DESIGN.md §4): koppen als overline, hairline-scheidingen en
// cijferkolommen rechts uitgelijnd in mono. `numeric` is een eigen prop en mag nooit
// als onbekend attribuut in de HTML belanden.

describe("Table", () => {
  it("rendert een <table> op volle breedte in de tabeltekstmaat", () => {
    const html = renderToStaticMarkup(<Table />);
    expect(html).toMatch(/^<table/);
    expect(html).toContain("w-full");
    expect(html).toContain("text-sm");
  });
});

describe("TBody", () => {
  it("scheidt rijen met een hairline in plaats van randen per cel", () => {
    const html = renderToStaticMarkup(<TBody />);
    expect(html).toMatch(/^<tbody/);
    expect(html).toContain("divide-y");
    expect(html).toContain("divide-border");
  });
});

describe("TH", () => {
  it("zet de kop als gedempte overline, links uitgelijnd", () => {
    const html = renderToStaticMarkup(<TH>Opdracht</TH>);
    expect(html).toMatch(/^<th/);
    expect(html).toContain("uppercase");
    expect(html).toContain("tracking-wider");
    expect(html).toContain("text-muted-foreground");
    expect(html).toContain("text-left");
  });

  it("lijnt een numerieke kop rechts uit", () => {
    const html = renderToStaticMarkup(<TH numeric>Bedrag</TH>);
    expect(html).toContain("text-right");
    expect(html).not.toContain("text-left");
  });

  it("lekt de numeric-prop niet als HTML-attribuut", () => {
    expect(renderToStaticMarkup(<TH numeric>Uren</TH>)).not.toContain("numeric=");
  });
});

describe("TD", () => {
  it("houdt een gewone cel links en proportioneel", () => {
    const html = renderToStaticMarkup(<TD>Thuiszorg Noord</TD>);
    expect(html).toMatch(/^<td/);
    expect(html).not.toContain("font-mono");
    expect(html).not.toContain("text-right");
  });

  it("zet een numerieke cel rechts, in mono met tabulaire cijfers", () => {
    const html = renderToStaticMarkup(<TD numeric>€ 1.234,50</TD>);
    expect(html).toContain("text-right");
    expect(html).toContain("font-mono");
    expect(html).toContain("tabular-nums");
  });

  it("lekt de numeric-prop niet als HTML-attribuut", () => {
    expect(renderToStaticMarkup(<TD numeric>1</TD>)).not.toContain("numeric=");
  });

  it("geeft cel-props door (colSpan, scope via TH)", () => {
    expect(renderToStaticMarkup(<TD colSpan={3}>leeg</TD>)).toMatch(/colspan="3"/i);
    expect(renderToStaticMarkup(<TH scope="col">Naam</TH>)).toContain('scope="col"');
  });
});

describe("tabel-compositie", () => {
  it("bouwt een geldige tabelstructuur met kop- en bodyrijen", () => {
    const html = renderToStaticMarkup(
      <Table>
        <THead>
          <TR>
            <TH scope="col">Opdracht</TH>
            <TH scope="col" numeric>
              Uren
            </TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>Nachtdienst</TD>
            <TD numeric>8,00</TD>
          </TR>
        </TBody>
      </Table>,
    );
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    expect(html.indexOf("Opdracht")).toBeLessThan(html.indexOf("Nachtdienst"));
    expect(html).toContain("8,00");
  });
});
