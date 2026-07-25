import { describe, expect, it } from "vitest";
import {
  CREDENTIAL_DEMAND_HIGH_MIN,
  credentialTypeDemand,
  demandLevel,
  type OpenJobRequirementRow,
} from "@/lib/verification-impact";

describe("credentialTypeDemand", () => {
  it("telt het aantal distinct opdrachten per certificaattype", () => {
    const rows: OpenJobRequirementRow[] = [
      { jobId: "j1", credentialType: "VOG" },
      { jobId: "j2", credentialType: "VOG" },
      { jobId: "j3", credentialType: "DIPLOMA" },
    ];
    expect(credentialTypeDemand(rows)).toEqual({ VOG: 2, DIPLOMA: 1 });
  });

  it("ontdubbelt meerdere eisen van dezelfde opdracht op jobId", () => {
    const rows: OpenJobRequirementRow[] = [
      { jobId: "j1", credentialType: "VOG" },
      { jobId: "j1", credentialType: "VOG" },
    ];
    expect(credentialTypeDemand(rows)).toEqual({ VOG: 1 });
  });

  it("laat niet-gevraagde typen weg (geen 0-rijen)", () => {
    const result = credentialTypeDemand([{ jobId: "j1", credentialType: "VOG" }]);
    expect(result.DIPLOMA).toBeUndefined();
    expect(result.VOG).toBe(1);
  });

  it("geeft een lege map voor een lege invoer", () => {
    expect(credentialTypeDemand([])).toEqual({});
  });
});

describe("demandLevel", () => {
  it("classificeert geen vraag als 'none'", () => {
    expect(demandLevel(0)).toBe("none");
  });

  it("classificeert 1..HIGH_MIN-1 als 'some'", () => {
    expect(demandLevel(1)).toBe("some");
    expect(demandLevel(CREDENTIAL_DEMAND_HIGH_MIN - 1)).toBe("some");
  });

  it("classificeert vanaf HIGH_MIN als 'high'", () => {
    expect(demandLevel(CREDENTIAL_DEMAND_HIGH_MIN)).toBe("high");
    expect(demandLevel(CREDENTIAL_DEMAND_HIGH_MIN + 5)).toBe("high");
  });
});
