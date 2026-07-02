import { describe, it, expect } from "vitest";
import { collaborationStatusLine } from "./collaboration-status-line";
import { type CascadeStageInput } from "./cascade/stage";

function base(overrides: Partial<CascadeStageInput> = {}): CascadeStageInput {
  return {
    viewer: "FREELANCER",
    collaborationId: "col-1",
    collaborationStatus: "ACTIVE",
    contractStatus: "SIGNED",
    disputed: false,
    latestPerformanceStatus: null,
    latestInvoiceStatus: null,
    ...overrides,
  };
}

describe("collaborationStatusLine", () => {
  it("zegt tegen de ZZP'er dat er actie nodig is wanneer hij uren moet indienen", () => {
    const line = collaborationStatusLine(base({ viewer: "FREELANCER" }));
    expect(line.youAreUp).toBe(true);
    expect(line.text).toMatch(/^Actie nodig:/);
  });

  it("zegt tegen de opdrachtgever dat hij niets hoeft te doen terwijl hij op uren wacht", () => {
    const line = collaborationStatusLine(base({ viewer: "CLIENT" }));
    expect(line.youAreUp).toBe(false);
    expect(line.text).toMatch(/Je hoeft nu niets te doen/);
  });

  it("markeert de opdrachtgever als aan zet bij een ingediende prestatie", () => {
    const line = collaborationStatusLine(
      base({ viewer: "CLIENT", latestPerformanceStatus: "SUBMITTED" }),
    );
    expect(line.youAreUp).toBe(true);
    expect(line.text).toMatch(/Actie nodig/i);
  });

  it("geeft een rustige terminale zin bij een afgeronde samenwerking", () => {
    const line = collaborationStatusLine(base({ collaborationStatus: "COMPLETED" }));
    expect(line.youAreUp).toBe(false);
    expect(line.text).toMatch(/afgerond/i);
  });

  it("meldt een bevroren werkproces bij een dispuut", () => {
    const line = collaborationStatusLine(base({ disputed: true }));
    expect(line.youAreUp).toBe(false);
    expect(line.text).toMatch(/dispuut/i);
  });

  it("herhaalt de status-badge-woorden niet (voorkomt strict-mode-botsing in de UI/e2e)", () => {
    // Een PROPOSED-samenwerking met nog niet getekend contract mag het woord "Voorgesteld" niet
    // in de status-zin herhalen — anders matcht getByText('Voorgesteld') twee elementen.
    const draft = collaborationStatusLine(
      base({ collaborationStatus: "PROPOSED", contractStatus: "DRAFT" }),
    );
    expect(draft.text).not.toMatch(/voorgesteld/i);
    const toSign = collaborationStatusLine(
      base({ collaborationStatus: "PROPOSED", contractStatus: "SENT" }),
    );
    expect(toSign.text).not.toMatch(/voorgesteld/i);
    expect(toSign.text).toMatch(/onderteken het contract/i);
  });
});
