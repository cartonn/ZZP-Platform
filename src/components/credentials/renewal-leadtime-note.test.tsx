import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { RenewalLeadtimeNote } from "./renewal-leadtime-note";
import { type RenewalNudge } from "@/lib/credential-renewal-leadtime";

// Node-omgeving (geen jsdom): render naar statische HTML en toets de opmaak. De beslislogica
// (wanneer/welke nudge) leeft in `renewalNudge` en wordt in credential-renewal-leadtime.test.ts gedekt.

const baseNudge: RenewalNudge = {
  urgency: "start_now",
  tone: "danger",
  message:
    "Dit duurt doorgaans 2 tot 8 weken. Vraag een nieuw bewijsstuk nu aan om inzetbaar te blijven.",
  leadTime: {
    minDays: 14,
    maxDays: 56,
    phrase: "2 tot 8 weken",
    note: "Een VOG vraag je aan via Justis.",
    source: { label: "Justis", url: "https://www.justis.nl/producten/vog" },
  },
};

describe("RenewalLeadtimeNote", () => {
  it("rendert niets zonder nudge", () => {
    expect(renderToStaticMarkup(<RenewalLeadtimeNote nudge={null} />)).toBe("");
  });

  it("toont een veilige officiële aanvraaglink wanneer de nudge een bron draagt", () => {
    const html = renderToStaticMarkup(<RenewalLeadtimeNote nudge={baseNudge} />);
    expect(html).toContain('href="https://www.justis.nl/producten/vog"');
    expect(html).toContain("Aanvragen bij Justis");
    // Externe link opent veilig in een nieuw tabblad (geen tabnabbing).
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
  });

  it("toont geen link wanneer er geen canonieke bron is", () => {
    const noSource: RenewalNudge = {
      ...baseNudge,
      leadTime: { ...baseNudge.leadTime, source: undefined },
    };
    const html = renderToStaticMarkup(<RenewalLeadtimeNote nudge={noSource} />);
    expect(html).not.toContain("Aanvragen bij");
    expect(html).not.toContain("renewal-leadtime-source");
    // De tekstuele context blijft wél staan.
    expect(html).toContain("2 tot 8 weken");
  });
});
