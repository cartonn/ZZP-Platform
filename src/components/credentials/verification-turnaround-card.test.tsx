import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { VerificationTurnaroundCard } from "./verification-turnaround-card";
import { type VerificationTurnaround } from "@/lib/verification-turnaround";

// Node-omgeving (geen jsdom): render naar statische HTML en toets de opmaak. De beslislogica
// (binnen/langer dan gebruikelijk) leeft in `classifyVerificationWait` en wordt in
// verification-turnaround.test.ts gedekt.

const turnaround: VerificationTurnaround = { sampleCount: 20, typicalDays: 3, p90Days: 7 };

describe("VerificationTurnaroundCard", () => {
  it("rendert niets zonder iets in beoordeling", () => {
    expect(
      renderToStaticMarkup(
        <VerificationTurnaroundCard
          pendingCount={0}
          oldestWaitingDays={0}
          turnaround={turnaround}
        />,
      ),
    ).toBe("");
  });

  it("geeft de onvoorwaardelijke geruststelling binnen de gebruikelijke doorlooptijd", () => {
    const html = renderToStaticMarkup(
      <VerificationTurnaroundCard pendingCount={1} oldestWaitingDays={5} turnaround={turnaround} />,
    );
    expect(html).toContain('data-wait-status="on-track"');
    expect(html).toContain("Je hoeft zelf niets te doen.");
    expect(html).not.toContain("langer dan gebruikelijk");
  });

  it("wordt eerlijk zodra de wachttijd de p90 overschrijdt (geen valse geruststelling)", () => {
    const html = renderToStaticMarkup(
      <VerificationTurnaroundCard
        pendingCount={2}
        oldestWaitingDays={12}
        turnaround={turnaround}
      />,
    );
    expect(html).toContain('data-wait-status="slower"');
    expect(html).toContain("langer dan gebruikelijk");
    // De ZZP'er hoeft nog steeds niets in te dienen — alleen de onvoorwaardelijke variant verdwijnt.
    expect(html).toContain("je hoeft zelf niets te doen");
  });

  it("valt zonder betrouwbaar aggregaat terug op on_track (geen alarm op dunne data)", () => {
    const html = renderToStaticMarkup(
      <VerificationTurnaroundCard pendingCount={1} oldestWaitingDays={999} turnaround={null} />,
    );
    expect(html).toContain('data-wait-status="on-track"');
    expect(html).toContain("zo snel mogelijk");
    expect(html).not.toContain("langer dan gebruikelijk");
  });
});
