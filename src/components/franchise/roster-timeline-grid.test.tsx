import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { RosterTimelineGrid } from "./roster-timeline-grid";
import { buildRosterTimeline, type TimelineMemberInput } from "@/lib/franchise/roster-timeline";

// Node-omgeving (geen jsdom): render naar statische HTML en toets de opmaak. De afleidingslogica
// (welke cel welke toestand krijgt) leeft in `buildRosterTimeline` en wordt daar los getest; hier
// dekken we alleen dat het raster de rijen, dagkolommen en onderscheidbare celtoestanden rendert.

// Vaste `now` zodat de horizon deterministisch is.
const fixedNow = new Date("2026-09-02T12:00:00Z");

const members: TimelineMemberInput[] = [
  // Geen vensters, geen plaatsingen → elke dag AVAILABLE ("Beschikbaar").
  { id: "a", name: "Alice Vrij", windows: [], placementEnds: [] },
  // Open-einde plaatsing → elke dag PLACED ("Ingezet").
  { id: "b", name: "Bob Ingezet", windows: [], placementEnds: [null] },
];

describe("RosterTimelineGrid", () => {
  it("rendert de rosterrijen, een kolom per horizon-dag en onderscheidbare celtoestanden", () => {
    const timeline = buildRosterTimeline(members, fixedNow);
    const html = renderToStaticMarkup(<RosterTimelineGrid timeline={timeline} />);

    // Beide ZZP'ers verschijnen als rij.
    expect(html).toContain("Alice Vrij");
    expect(html).toContain("Bob Ingezet");

    // Eén dagkolom-kop per horizon-dag (scope="col" markeert alleen de dagkoppen).
    const dayHeaders = (html.match(/scope="col"/g) ?? []).length;
    expect(dayHeaders).toBe(timeline.days.length);

    // PLACED en AVAILABLE zijn onderscheidbaar via het cel-label (title/aria-label).
    expect(html).toContain('title="Ingezet"');
    expect(html).toContain('title="Beschikbaar"');
  });
});
