import { describe, expect, it } from "vitest";
import { ALERTABLE_INCIDENT_SEVERITIES, openHealthIncidentWhere } from "./health-incident-open";
import { INCIDENT_SEVERITIES } from "@/lib/enums";

describe("openHealthIncidentWhere", () => {
  it("filtert op status OPEN en de gevraagde severity", () => {
    expect(openHealthIncidentWhere("CRITICAL")).toEqual({
      status: "OPEN",
      severity: "CRITICAL",
    });
    expect(openHealthIncidentWhere("WARN")).toEqual({
      status: "OPEN",
      severity: "WARN",
    });
  });

  it("telt bewust NIET ACKNOWLEDGED/RESOLVED mee (een mens heeft het opgepakt)", () => {
    // De where bevat alleen status: "OPEN" — de andere twee statussen vallen er per definitie buiten.
    expect(openHealthIncidentWhere("CRITICAL").status).toBe("OPEN");
  });
});

describe("ALERTABLE_INCIDENT_SEVERITIES", () => {
  it("bevat alleen de page-waardige severities (geen INFO)", () => {
    expect([...ALERTABLE_INCIDENT_SEVERITIES]).toEqual(["CRITICAL", "WARN"]);
    expect(ALERTABLE_INCIDENT_SEVERITIES).not.toContain("INFO");
  });

  it("gebruikt alleen severities die het enum echt kent (geen drift)", () => {
    for (const severity of ALERTABLE_INCIDENT_SEVERITIES) {
      expect(INCIDENT_SEVERITIES).toContain(severity);
    }
  });
});
