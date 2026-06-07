import { describe, expect, it } from "vitest";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/enums";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_VARIANT,
  canLeadTransition,
  leadStatusRequiresReason,
} from "@/lib/leads";

describe("canLeadTransition", () => {
  it("staat het oppakken van een koude lead toe (KOUD→WARM)", () => {
    expect(canLeadTransition("KOUD", "WARM")).toBe(true);
  });

  it("staat het binnenhalen toe (WARM→KLANT)", () => {
    expect(canLeadTransition("WARM", "KLANT")).toBe(true);
  });

  it("behandelt KLANT als terminaal (geen verdere overgangen)", () => {
    expect(canLeadTransition("KLANT", "WARM")).toBe(false);
    expect(canLeadTransition("KLANT", "KOUD")).toBe(false);
    expect(canLeadTransition("KLANT", "NO_DEAL")).toBe(false);
  });

  it("staat heropenen van een afgevallen lead toe (NO_DEAL→KOUD/WARM)", () => {
    expect(canLeadTransition("NO_DEAL", "KOUD")).toBe(true);
    expect(canLeadTransition("NO_DEAL", "WARM")).toBe(true);
  });

  it("verbiedt een directe sprong van koud naar klant", () => {
    expect(canLeadTransition("KOUD", "KLANT")).toBe(false);
  });

  it("een gelijke-naar-gelijke overgang is geen overgang", () => {
    for (const s of LEAD_STATUSES) expect(canLeadTransition(s, s)).toBe(false);
  });
});

describe("leadStatusRequiresReason", () => {
  it("vereist een reden bij afvallen", () => {
    expect(leadStatusRequiresReason("NO_DEAL")).toBe(true);
  });

  it("vereist geen reden bij de overige statussen", () => {
    expect(leadStatusRequiresReason("KOUD")).toBe(false);
    expect(leadStatusRequiresReason("WARM")).toBe(false);
    expect(leadStatusRequiresReason("KLANT")).toBe(false);
  });
});

describe("lead labels", () => {
  it("heeft een NL-label en een status-variant voor elke status", () => {
    for (const s of LEAD_STATUSES as readonly LeadStatus[]) {
      expect(LEAD_STATUS_LABEL[s]).toBeTruthy();
      expect(LEAD_STATUS_VARIANT[s]).toBeTruthy();
    }
  });
});
