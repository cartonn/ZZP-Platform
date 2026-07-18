import { describe, expect, it } from "vitest";
import {
  applicationJobAvailability,
  JOB_AVAILABILITY_MESSAGE,
  type ApplicationJobAvailabilityInput,
} from "@/lib/application-job-availability";

const base: ApplicationJobAvailabilityInput = {
  applicationStatus: "NEW",
  hasCollaboration: false,
  jobStatus: "PUBLISHED",
  activeCollaborations: 0,
};

describe("applicationJobAvailability", () => {
  it("meldt niets voor een openstaande reactie op een gewone open opdracht", () => {
    expect(applicationJobAvailability(base)).toBeNull();
  });

  it("meldt CLOSED wanneer de opdracht gesloten is", () => {
    expect(applicationJobAvailability({ ...base, jobStatus: "CLOSED" })).toBe("CLOSED");
  });

  it("meldt CLOSED voor elke open reactiestatus", () => {
    for (const applicationStatus of ["NEW", "VIEWED", "SHORTLIST"] as const) {
      expect(applicationJobAvailability({ ...base, applicationStatus, jobStatus: "CLOSED" })).toBe(
        "CLOSED",
      );
    }
  });

  it("meldt LIKELY_FILLED wanneer een open opdracht al een actieve samenwerking heeft", () => {
    expect(applicationJobAvailability({ ...base, activeCollaborations: 1 })).toBe("LIKELY_FILLED");
  });

  it("prioriteert CLOSED boven vervuld (gesloten opdracht met actieve samenwerking)", () => {
    expect(
      applicationJobAvailability({ ...base, jobStatus: "CLOSED", activeCollaborations: 2 }),
    ).toBe("CLOSED");
  });

  it("zwijgt zodra de reactie een eigen samenwerking heeft opgeleverd", () => {
    expect(
      applicationJobAvailability({ ...base, jobStatus: "CLOSED", hasCollaboration: true }),
    ).toBeNull();
    expect(
      applicationJobAvailability({
        ...base,
        hasCollaboration: true,
        activeCollaborations: 3,
      }),
    ).toBeNull();
  });

  it("zwijgt voor een reactie die al beslist of ingetrokken is", () => {
    for (const applicationStatus of ["ACCEPTED", "REJECTED", "WITHDRAWN"] as const) {
      expect(
        applicationJobAvailability({ ...base, applicationStatus, jobStatus: "CLOSED" }),
      ).toBeNull();
    }
  });

  it("meldt geen 'vervuld' voor een concept-opdracht zonder actieve samenwerking", () => {
    expect(applicationJobAvailability({ ...base, jobStatus: "DRAFT" })).toBeNull();
  });

  it("heeft een boodschap voor elk signaal", () => {
    expect(JOB_AVAILABILITY_MESSAGE.CLOSED).toMatch(/gesloten/i);
    expect(JOB_AVAILABILITY_MESSAGE.LIKELY_FILLED).toMatch(/vervuld/i);
  });
});
