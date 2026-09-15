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
  it.each(["CLIENT", "FREELANCER"] as const)(
    "%s sees required credential guidance before signature guidance",
    (viewer) => {
      for (const viewerHasSigned of [false, true]) {
        const input = {
          ...base({ viewer, collaborationStatus: "PROPOSED", contractStatus: "DRAFT" }),
          viewerHasSigned,
          placementBlocked: true,
        };
        expect(collaborationStatusLine(input)).toEqual(
          viewer === "FREELANCER"
            ? {
                text: "Actie nodig: vul het ontbrekende of verlopen certificaat aan.",
                youAreUp: true,
              }
            : {
                text: "Je hoeft nu niets te doen — wacht tot de ZZP'er het ontbrekende of verlopen certificaat aanvult.",
                youAreUp: false,
              },
        );
        expect(collaborationStatusLine({ ...input, disputed: true }).text).toBe(
          "Er loopt een dispuut — het werkproces is bevroren tot dat is opgelost.",
        );
        expect(collaborationStatusLine({ ...input, collaborationStatus: "CANCELLED" }).text).toBe(
          "Deze samenwerking is geannuleerd.",
        );
        expect(collaborationStatusLine({ ...input, collaborationStatus: "COMPLETED" }).text).toBe(
          "Deze samenwerking is afgerond.",
        );
      }
    },
  );

  it.each(["CLIENT", "FREELANCER"] as const)(
    "%s waits for the other signature after signing, while an unsigned viewer still acts",
    (viewer) => {
      const input = base({ viewer, collaborationStatus: "PROPOSED", contractStatus: "DRAFT" });
      expect(collaborationStatusLine({ ...input, viewerHasSigned: true })).toEqual({
        text: "Je hoeft nu niets te doen — wacht op de handtekening van de andere partij.",
        youAreUp: false,
      });
      expect(collaborationStatusLine({ ...input, viewerHasSigned: false })).toEqual({
        text: "Actie nodig: onderteken het contract om te starten.",
        youAreUp: true,
      });
    },
  );

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
    // Een DRAFT-contract op een voorgestelde samenwerking is meteen ondertekenbaar: de status-zin
    // moet actief tot tekenen aanzetten (niet passief "wordt voorbereid").
    expect(draft.text).toMatch(/onderteken het contract/i);
    expect(draft.youAreUp).toBe(true);
    const toSign = collaborationStatusLine(
      base({ collaborationStatus: "PROPOSED", contractStatus: "SENT" }),
    );
    expect(toSign.text).not.toMatch(/voorgesteld/i);
    expect(toSign.text).toMatch(/onderteken het contract/i);
  });
});
