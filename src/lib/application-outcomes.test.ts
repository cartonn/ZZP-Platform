import { describe, expect, it } from "vitest";
import {
  APPLICATION_OUTCOME_MIN_SAMPLE,
  summarizeApplicationFunnel,
  summarizeApplicationOutcomes,
  type ApplicationOutcomeInput,
} from "@/lib/application-outcomes";

function app(
  status: ApplicationOutcomeInput["status"],
  hasCollaboration = false,
): ApplicationOutcomeInput {
  return { status, hasCollaboration };
}

describe("summarizeApplicationOutcomes", () => {
  it("geeft nullen + null-percentages terug voor een lege lijst", () => {
    const out = summarizeApplicationOutcomes([]);
    expect(out).toEqual({
      total: 0,
      open: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      seen: 0,
      collaborations: 0,
      responseRate: null,
      acceptanceRate: null,
    });
  });

  it("telt per status en rekent open = NEW + VIEWED + SHORTLIST", () => {
    const out = summarizeApplicationOutcomes([
      app("NEW"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("ACCEPTED"),
      app("REJECTED"),
    ]);
    expect(out.total).toBe(5);
    expect(out.open).toBe(3);
    expect(out.shortlisted).toBe(1);
    expect(out.accepted).toBe(1);
    expect(out.rejected).toBe(1);
  });

  it("telt 'seen' als alles behalve NEW", () => {
    const out = summarizeApplicationOutcomes([
      app("NEW"),
      app("NEW"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("ACCEPTED"),
      app("REJECTED"),
    ]);
    expect(out.seen).toBe(4);
  });

  it("telt samenwerkingen die uit reacties voortkwamen", () => {
    const out = summarizeApplicationOutcomes([
      app("ACCEPTED", true),
      app("ACCEPTED", false),
      app("REJECTED", false),
    ]);
    expect(out.collaborations).toBe(1);
  });

  it("responseRate = bekeken / totaal, afgerond, op de steekproefdrempel", () => {
    // 4 reacties (= drempel), 3 bekeken -> 75%
    const out = summarizeApplicationOutcomes([
      app("NEW"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("REJECTED"),
    ]);
    expect(out.total).toBe(APPLICATION_OUTCOME_MIN_SAMPLE);
    expect(out.responseRate).toBe(75);
  });

  it("responseRate is null onder de steekproefdrempel", () => {
    const out = summarizeApplicationOutcomes([app("VIEWED"), app("VIEWED"), app("VIEWED")]);
    expect(out.responseRate).toBeNull();
  });

  it("acceptanceRate = geaccepteerd / beoordeeld (geaccepteerd + afgewezen)", () => {
    // open reacties tellen niet mee in de noemer: 2 geaccepteerd, 2 afgewezen -> 50%
    const out = summarizeApplicationOutcomes([
      app("ACCEPTED"),
      app("ACCEPTED"),
      app("REJECTED"),
      app("REJECTED"),
      app("NEW"),
      app("SHORTLIST"),
    ]);
    expect(out.acceptanceRate).toBe(50);
  });

  it("acceptanceRate is null wanneer er te weinig beoordeelde reacties zijn", () => {
    // 10 reacties maar slechts 3 beoordeeld -> onder de drempel
    const out = summarizeApplicationOutcomes([
      app("ACCEPTED"),
      app("REJECTED"),
      app("REJECTED"),
      app("NEW"),
      app("NEW"),
      app("VIEWED"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("SHORTLIST"),
      app("SHORTLIST"),
    ]);
    expect(out.acceptanceRate).toBeNull();
    // responseRate gebruikt het totaal en haalt de drempel wél
    expect(out.responseRate).not.toBeNull();
  });

  it("rondt percentages commercieel af", () => {
    // 6 reacties, 5 bekeken -> 83.33 -> 83
    const out = summarizeApplicationOutcomes([
      app("NEW"),
      app("VIEWED"),
      app("VIEWED"),
      app("SHORTLIST"),
      app("ACCEPTED"),
      app("REJECTED"),
    ]);
    expect(out.responseRate).toBe(83);
  });

  it("respecteert een aangepaste minSample", () => {
    const out = summarizeApplicationOutcomes([app("ACCEPTED"), app("REJECTED")], 2);
    expect(out.responseRate).toBe(100);
    expect(out.acceptanceRate).toBe(50);
  });

  it("muteert de invoer niet", () => {
    const input = Object.freeze([app("ACCEPTED"), app("NEW")]);
    expect(() => summarizeApplicationOutcomes(input)).not.toThrow();
    expect(input).toHaveLength(2);
  });
});

describe("summarizeApplicationOutcomes — WITHDRAWN", () => {
  it("sluit ingetrokken reacties volledig uit de tellingen uit", () => {
    const out = summarizeApplicationOutcomes([
      app("ACCEPTED"),
      app("REJECTED"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
    ]);
    expect(out.total).toBe(2);
    expect(out.accepted).toBe(1);
    expect(out.rejected).toBe(1);
    expect(out.seen).toBe(2);
  });

  it("vertekent het responspercentage niet (noemer telt WITHDRAWN niet mee)", () => {
    // 4 actieve reacties, alle minstens bekeken => 100%; de twee WITHDRAWN tellen niet mee.
    const out = summarizeApplicationOutcomes([
      app("VIEWED"),
      app("SHORTLIST"),
      app("ACCEPTED"),
      app("REJECTED"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
    ]);
    expect(out.total).toBe(4);
    expect(out.responseRate).toBe(100);
    // decided (accepted+rejected) = 2 < default minSample (4) → geen misleidend percentage.
    expect(out.acceptanceRate).toBeNull();
  });

  it("een lijst met enkel ingetrokken reacties geeft nullen + null-percentages", () => {
    const out = summarizeApplicationOutcomes([app("WITHDRAWN"), app("WITHDRAWN")]);
    expect(out.total).toBe(0);
    expect(out.responseRate).toBeNull();
    expect(out.acceptanceRate).toBeNull();
  });
});

describe("summarizeApplicationFunnel", () => {
  it("berekent bekeken- en acceptatiequote uit een telling-per-status", () => {
    // 6 reacties: 1 NEW (niet bekeken), 1 VIEWED, 1 SHORTLIST, 1 ACCEPTED, 3 REJECTED.
    const out = summarizeApplicationFunnel({
      NEW: 1,
      VIEWED: 1,
      SHORTLIST: 1,
      ACCEPTED: 1,
      REJECTED: 3,
    });
    expect(out.total).toBe(7);
    expect(out.seen).toBe(6); // alles behalve de NEW-reactie
    expect(out.decided).toBe(4); // accepted + rejected (≥ drempel)
    expect(out.accepted).toBe(1);
    expect(out.responseRate).toBe(86); // 6/7, afgerond
    expect(out.acceptanceRate).toBe(25); // 1/4
  });

  it("negeert ingetrokken reacties in beide noemers (identiek aan summarizeApplicationOutcomes)", () => {
    const byStatus = { VIEWED: 1, SHORTLIST: 1, ACCEPTED: 1, REJECTED: 1, WITHDRAWN: 9 };
    const funnel = summarizeApplicationFunnel(byStatus);
    // Zelfde bron van waarheid: de array-variant op dezelfde verdeling geeft dezelfde quotes.
    const outcomes = summarizeApplicationOutcomes([
      app("VIEWED"),
      app("SHORTLIST"),
      app("ACCEPTED"),
      app("REJECTED"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
      app("WITHDRAWN"),
    ]);
    expect(funnel.total).toBe(4);
    expect(funnel.responseRate).toBe(outcomes.responseRate);
    expect(funnel.acceptanceRate).toBe(outcomes.acceptanceRate);
  });

  it("geeft null-quotes onder de steekproefdrempel (geen misleidende 100% uit weinig reacties)", () => {
    const out = summarizeApplicationFunnel({ VIEWED: 1, ACCEPTED: 1 });
    expect(out.total).toBe(2);
    expect(out.responseRate).toBeNull(); // 2 < minSample
    expect(out.acceptanceRate).toBeNull(); // decided = 1 < minSample
  });

  it("respecteert een aangepaste steekproefdrempel en een lege telling", () => {
    expect(summarizeApplicationFunnel({}).total).toBe(0);
    expect(summarizeApplicationFunnel({}).responseRate).toBeNull();
    // Met minSample 1 mag een enkele beoordeelde reactie wél een quote geven.
    const out = summarizeApplicationFunnel({ ACCEPTED: 1 }, 1);
    expect(out.responseRate).toBe(100); // 1/1 bekeken
    expect(out.acceptanceRate).toBe(100); // 1/1 geaccepteerd
  });

  it("gebruikt dezelfde drempelconstante als de uitkomsten-samenvatting", () => {
    // Precies op de drempel telt wél mee: 4 reacties, 3 bekeken → responseRate gevuld.
    const out = summarizeApplicationFunnel({
      NEW: 1,
      VIEWED: 1,
      SHORTLIST: 1,
      REJECTED: 1,
    });
    expect(APPLICATION_OUTCOME_MIN_SAMPLE).toBe(4);
    expect(out.total).toBe(4);
    expect(out.responseRate).toBe(75); // 3/4
  });
});
