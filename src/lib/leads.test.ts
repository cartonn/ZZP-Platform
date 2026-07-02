import { describe, expect, it } from "vitest";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/enums";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_VARIANT,
  LEAD_STALE_WARN_DAYS,
  canLeadTransition,
  compareLeadsForList,
  daysSinceContact,
  isLeadStale,
  leadStatusRequiresReason,
} from "@/lib/leads";

const D = (iso: string) => new Date(iso);

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

describe("daysSinceContact", () => {
  const now = D("2026-07-02T09:00:00Z");

  it("telt vanaf het laatste contactmoment als dat er is", () => {
    expect(daysSinceContact(now, D("2026-01-01T00:00:00Z"), D("2026-06-28T12:00:00Z"))).toBe(4);
  });

  it("valt terug op de aanmaakdatum zonder contactmoment", () => {
    expect(daysSinceContact(now, D("2026-06-30T23:00:00Z"), null)).toBe(2);
    expect(daysSinceContact(now, D("2026-06-30T23:00:00Z"), undefined)).toBe(2);
  });

  it("telt op dagniveau, tijdstip binnen de dag telt niet mee", () => {
    expect(daysSinceContact(now, D("2026-01-01T00:00:00Z"), D("2026-07-02T23:59:00Z"))).toBe(0);
  });

  it("klemt een toekomstige referentiedatum op nul (nooit negatief)", () => {
    expect(daysSinceContact(now, D("2026-01-01T00:00:00Z"), D("2026-07-10T00:00:00Z"))).toBe(0);
  });
});

describe("isLeadStale", () => {
  it("markeert alleen WARM-leads vanaf de drempel als stil", () => {
    expect(isLeadStale("WARM", LEAD_STALE_WARN_DAYS)).toBe(true);
    expect(isLeadStale("WARM", LEAD_STALE_WARN_DAYS - 1)).toBe(false);
  });

  it("laat andere statussen nooit stil zijn, hoe lang ook", () => {
    expect(isLeadStale("KOUD", 99)).toBe(false);
    expect(isLeadStale("KLANT", 99)).toBe(false);
    expect(isLeadStale("NO_DEAL", 99)).toBe(false);
  });
});

describe("compareLeadsForList", () => {
  const base = { createdAt: D("2026-06-01T00:00:00Z") };

  it("zet een stille warme lead vóór een verse warme lead", () => {
    const stil = { status: "WARM" as LeadStatus, daysSinceContact: 20, ...base };
    const vers = { status: "WARM" as LeadStatus, daysSinceContact: 2, ...base };
    expect(compareLeadsForList(stil, vers)).toBeLessThan(0);
    expect(compareLeadsForList(vers, stil)).toBeGreaterThan(0);
  });

  it("sorteert onder de stille warme leads de langst-stille eerst", () => {
    const a = { status: "WARM" as LeadStatus, daysSinceContact: 30, ...base };
    const b = { status: "WARM" as LeadStatus, daysSinceContact: 15, ...base };
    expect(compareLeadsForList(a, b)).toBeLessThan(0);
  });

  it("sorteert niet-stille leads op nieuwste aanmaak", () => {
    const nieuw = {
      status: "KOUD" as LeadStatus,
      daysSinceContact: 0,
      createdAt: D("2026-06-10T00:00:00Z"),
    };
    const oud = {
      status: "KOUD" as LeadStatus,
      daysSinceContact: 0,
      createdAt: D("2026-06-01T00:00:00Z"),
    };
    expect(compareLeadsForList(nieuw, oud)).toBeLessThan(0);
  });

  it("levert een stabiele totale ordening via Array.sort", () => {
    const rows = [
      { id: "vers-koud", status: "KOUD" as LeadStatus, daysSinceContact: 0, createdAt: D("2026-06-20T00:00:00Z") }, // prettier-ignore
      { id: "stil-warm", status: "WARM" as LeadStatus, daysSinceContact: 40, createdAt: D("2026-05-01T00:00:00Z") }, // prettier-ignore
      { id: "vers-warm", status: "WARM" as LeadStatus, daysSinceContact: 1, createdAt: D("2026-06-25T00:00:00Z") }, // prettier-ignore
    ];
    const order = [...rows].sort(compareLeadsForList).map((r) => r.id);
    expect(order[0]).toBe("stil-warm");
    expect(order.slice(1)).toContain("vers-koud");
    expect(order.slice(1)).toContain("vers-warm");
  });
});
