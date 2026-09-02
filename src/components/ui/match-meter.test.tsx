import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { MatchMeter } from "./match-meter";

// De matchmeter maakt de score tastbaar (DESIGN.md — signatuur). Contract: altijd 10
// segmenten, altijd merk-getint, en een toegankelijke naam zodat de score ook zonder
// zicht leesbaar is. De segmentlogica zelf is getest in src/lib/meter.test.ts.
const filled = (html: string) => (html.match(/bg-primary/g) ?? []).length;
const empty = (html: string) => (html.match(/bg-muted-foreground\/25/g) ?? []).length;

describe("MatchMeter", () => {
  it("tekent altijd tien segmenten, ongeacht de score", () => {
    for (const score of [0, 37, 100]) {
      const html = renderToStaticMarkup(<MatchMeter score={score} />);
      expect(filled(html) + empty(html), `score ${score}`).toBe(10);
    }
  });

  it("vult de segmenten naar rato van de score", () => {
    expect(filled(renderToStaticMarkup(<MatchMeter score={92} />))).toBe(9);
    expect(filled(renderToStaticMarkup(<MatchMeter score={50} />))).toBe(5);
  });

  it("laat de meter bij 0 volledig leeg", () => {
    const html = renderToStaticMarkup(<MatchMeter score={0} />);
    expect(filled(html)).toBe(0);
    expect(empty(html)).toBe(10);
  });

  it("vult de meter bij 100 volledig", () => {
    const html = renderToStaticMarkup(<MatchMeter score={100} />);
    expect(filled(html)).toBe(10);
    expect(empty(html)).toBe(0);
  });

  it("klemt scores buiten 0–100 op de grenzen", () => {
    expect(filled(renderToStaticMarkup(<MatchMeter score={-20} />))).toBe(0);
    expect(filled(renderToStaticMarkup(<MatchMeter score={140} />))).toBe(10);
  });

  it("draagt een toegankelijke naam met het afgeronde percentage", () => {
    const html = renderToStaticMarkup(<MatchMeter score={87.4} />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Match 87 procent"');
  });

  it("is merk-getint (nooit grijs) zodra er iets te tonen valt", () => {
    const html = renderToStaticMarkup(<MatchMeter score={10} />);
    expect(html).toContain("bg-primary");
    expect(html).not.toContain("bg-success");
  });

  it("kent twee maten met een eigen breedte en dikte", () => {
    const sm = renderToStaticMarkup(<MatchMeter score={50} />);
    const md = renderToStaticMarkup(<MatchMeter score={50} size="md" />);
    expect(sm).toContain("w-16");
    expect(md).toContain("w-24");
    expect(md).toContain("h-1.5");
  });

  it("accepteert een extra className naast de basisvorm", () => {
    const html = renderToStaticMarkup(<MatchMeter score={50} className="ml-auto" />);
    expect(html).toContain("ml-auto");
    expect(html).toContain("items-center");
  });
});
