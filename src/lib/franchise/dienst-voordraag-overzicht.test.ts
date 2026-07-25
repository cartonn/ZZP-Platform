import { describe, it, expect } from "vitest";
import {
  summarizeVoordraagOverview,
  voordraagVerdict,
  voordraagContextParts,
} from "./dienst-voordraag-overzicht";
import { READY_MATCH_MIN_SCORE } from "./dienst-fill-signal";
import { type RosterCandidate } from "./dienst-voordracht";

// Minimale RosterCandidate-fabriek — alleen de velden die de summarizer leest, de rest is decoratief.
function candidate(overrides: Partial<RosterCandidate> = {}): RosterCandidate {
  return {
    freelancerId: "f1",
    name: "Sanne",
    headline: null,
    engageabilityStatus: "ACTIEF",
    engageabilityLabel: "Inzetbaar",
    blockers: [],
    matchScore: 80,
    topReason: null,
    topGap: null,
    proposed: false,
    hasApplied: false,
    doubleBooking: { count: 0, firstTitle: null },
    proximity: null,
    ...overrides,
  };
}

describe("summarizeVoordraagOverview", () => {
  it("telt een lege lijst als nul overal", () => {
    const o = summarizeVoordraagOverview([]);
    expect(o).toEqual({
      total: 0,
      readyToPropose: 0,
      strongMatches: 0,
      alreadyEngaged: 0,
      doubleBookingRisk: 0,
      notEngageable: 0,
    });
  });

  it("markeert een inzetbare, goed-matchende, nog-niet-benaderde vakmens als direct voordraagbaar", () => {
    const o = summarizeVoordraagOverview([candidate({ matchScore: READY_MATCH_MIN_SCORE })]);
    expect(o.readyToPropose).toBe(1);
    expect(o.strongMatches).toBe(1);
    expect(o.alreadyEngaged).toBe(0);
    expect(o.doubleBookingRisk).toBe(0);
    expect(o.total).toBe(1);
  });

  it("telt een match onder de drempel niet als geschikt", () => {
    const o = summarizeVoordraagOverview([candidate({ matchScore: READY_MATCH_MIN_SCORE - 1 })]);
    expect(o.strongMatches).toBe(0);
    expect(o.readyToPropose).toBe(0);
    expect(o.total).toBe(1);
  });

  it("een INACTIEF-vakmens telt alleen als niet-inzetbaar, nooit als geschikte match", () => {
    const o = summarizeVoordraagOverview([
      candidate({ engageabilityStatus: "INACTIEF", matchScore: 95 }),
    ]);
    expect(o.notEngageable).toBe(1);
    expect(o.strongMatches).toBe(0);
    expect(o.readyToPropose).toBe(0);
  });

  it("een al-voorgedragen óf zelf-gereageerde geschikte match valt in alreadyEngaged, niet in readyToPropose", () => {
    const o = summarizeVoordraagOverview([
      candidate({ proposed: true }),
      candidate({ freelancerId: "f2", hasApplied: true }),
    ]);
    expect(o.strongMatches).toBe(2);
    expect(o.alreadyEngaged).toBe(2);
    expect(o.readyToPropose).toBe(0);
  });

  it("een dubbel-geboekte, nog-niet-benaderde geschikte match valt in doubleBookingRisk", () => {
    const o = summarizeVoordraagOverview([
      candidate({ doubleBooking: { count: 1, firstTitle: null } }),
    ]);
    expect(o.doubleBookingRisk).toBe(1);
    expect(o.readyToPropose).toBe(0);
    expect(o.strongMatches).toBe(1);
  });

  it("reeds benaderd wint van dubbele-boeking (geen dubbeltelling binnen strongMatches)", () => {
    const o = summarizeVoordraagOverview([
      candidate({ proposed: true, doubleBooking: { count: 2, firstTitle: null } }),
    ]);
    expect(o.alreadyEngaged).toBe(1);
    expect(o.doubleBookingRisk).toBe(0);
    // strongMatches splitst exact op in de drie bakken.
    expect(o.readyToPropose + o.alreadyEngaged + o.doubleBookingRisk).toBe(o.strongMatches);
  });

  it("strongMatches is altijd de som van de drie disjuncte bakken over een gemengde lijst", () => {
    const o = summarizeVoordraagOverview([
      candidate({ freelancerId: "a" }), // ready
      candidate({ freelancerId: "b", proposed: true }), // engaged
      candidate({ freelancerId: "c", doubleBooking: { count: 1, firstTitle: null } }), // risk
      candidate({ freelancerId: "d", matchScore: 10 }), // te zwak
      candidate({ freelancerId: "e", engageabilityStatus: "INACTIEF" }), // niet inzetbaar
    ]);
    expect(o.total).toBe(5);
    expect(o.strongMatches).toBe(3);
    expect(o.readyToPropose).toBe(1);
    expect(o.alreadyEngaged).toBe(1);
    expect(o.doubleBookingRisk).toBe(1);
    expect(o.notEngageable).toBe(1);
    expect(o.readyToPropose + o.alreadyEngaged + o.doubleBookingRisk).toBe(o.strongMatches);
  });
});

describe("voordraagVerdict", () => {
  it("success zodra er iets direct voordraagbaar is", () => {
    const v = voordraagVerdict(summarizeVoordraagOverview([candidate()]));
    expect(v.tone).toBe("success");
    expect(v.headline).toContain("direct voordraagbaar");
  });

  it("neutraal wanneer er wel geschikte matches zijn maar geen vrije", () => {
    const v = voordraagVerdict(summarizeVoordraagOverview([candidate({ proposed: true })]));
    expect(v.tone).toBe("default");
  });

  it("waarschuwing wanneer er geen enkele geschikte match is", () => {
    const v = voordraagVerdict(summarizeVoordraagOverview([candidate({ matchScore: 5 })]));
    expect(v.tone).toBe("warning");
    expect(v.headline).toContain("werving");
  });

  it("enkelvoud/meervoud correct in de success-kopregel", () => {
    expect(voordraagVerdict(summarizeVoordraagOverview([candidate()])).headline).toContain(
      "1 vakmens ",
    );
    expect(
      voordraagVerdict(
        summarizeVoordraagOverview([
          candidate({ freelancerId: "a" }),
          candidate({ freelancerId: "b" }),
        ]),
      ).headline,
    ).toContain("2 vakmensen");
  });
});

describe("voordraagContextParts", () => {
  it("geeft geen delen terug als er niets toe te lichten valt", () => {
    expect(voordraagContextParts(summarizeVoordraagOverview([candidate()]))).toEqual([]);
  });

  it("somt alleen de niet-nul onderdelen op", () => {
    const parts = voordraagContextParts(
      summarizeVoordraagOverview([
        candidate({ freelancerId: "a", proposed: true }),
        candidate({ freelancerId: "b", doubleBooking: { count: 1, firstTitle: null } }),
        candidate({ freelancerId: "c", engageabilityStatus: "INACTIEF" }),
      ]),
    );
    expect(parts).toContain("1 al benaderd");
    expect(parts).toContain("1 dubbele-boeking-risico");
    expect(parts).toContain("1 niet inzetbaar");
  });
});
