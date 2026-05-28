import { describe, it, expect } from "vitest";
import {
  rankNextActions,
  freelancerNextActions,
  clientNextActions,
  adminNextActions,
  type NextAction,
} from "./next-actions";

function action(id: string, priority: number): NextAction {
  return { id, title: id, href: `/${id}`, tone: "info", priority };
}

describe("rankNextActions", () => {
  it("sorts by priority descending", () => {
    const ranked = rankNextActions([action("a", 10), action("b", 30), action("c", 20)]);
    expect(ranked.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("is stable: preserves input order for equal priority", () => {
    const ranked = rankNextActions([
      action("first", 50),
      action("second", 50),
      action("third", 50),
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["first", "second", "third"]);
  });

  it("mixes equal and differing priorities stably", () => {
    const ranked = rankNextActions([
      action("a", 10),
      action("b", 20),
      action("c", 20),
      action("d", 10),
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["b", "c", "a", "d"]);
  });

  it("returns an empty array for no input", () => {
    expect(rankNextActions([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [action("a", 10), action("b", 20)];
    const snapshot = input.map((x) => x.id);
    rankNextActions(input);
    expect(input.map((x) => x.id)).toEqual(snapshot);
  });
});

const allClearFreelancer = {
  profilePrivate: false,
  identityVerified: true,
  completeness: 100,
  rejectedCredentials: 0,
  expiringCredentials: 0,
  overdueInvoices: 0,
};

describe("freelancerNextActions", () => {
  it("returns [] when all clear", () => {
    expect(freelancerNextActions(allClearFreelancer)).toEqual([]);
  });

  it("ranks profile-private highest", () => {
    const ranked = freelancerNextActions({
      ...allClearFreelancer,
      profilePrivate: true,
      identityVerified: false,
      completeness: 40,
      rejectedCredentials: 2,
      expiringCredentials: 1,
      overdueInvoices: 3,
    });
    expect(ranked[0]?.id).toBe("freelancer-profile-private");
    expect(ranked[0]?.tone).toBe("attention");
  });

  it("orders compliance/blocking above cosmetic completeness", () => {
    const ranked = freelancerNextActions({
      ...allClearFreelancer,
      identityVerified: false,
      completeness: 50,
      rejectedCredentials: 1,
    });
    expect(ranked.map((x) => x.id)).toEqual([
      "freelancer-identity-unverified",
      "freelancer-credentials-rejected",
      "freelancer-completeness",
    ]);
  });

  it("treats completeness === 100 as complete (threshold < 100)", () => {
    expect(freelancerNextActions({ ...allClearFreelancer, completeness: 100 })).toEqual([]);
    expect(
      freelancerNextActions({ ...allClearFreelancer, completeness: 99 }).map((x) => x.id),
    ).toEqual(["freelancer-completeness"]);
  });

  it("uses app hrefs", () => {
    const ranked = freelancerNextActions({
      ...allClearFreelancer,
      profilePrivate: true,
      identityVerified: false,
      rejectedCredentials: 1,
      overdueInvoices: 1,
    });
    const byId = Object.fromEntries(ranked.map((x) => [x.id, x.href]));
    expect(byId["freelancer-profile-private"]).toBe("/profiel");
    expect(byId["freelancer-identity-unverified"]).toBe("/account");
    expect(byId["freelancer-credentials-rejected"]).toBe("/certificaten");
    expect(byId["freelancer-overdue-invoices"]).toBe("/facturen");
  });
});

const allClearClient = {
  companyCompleteness: 100,
  newApplications: 0,
  draftJobs: 0,
  overdueInvoices: 0,
  collaborationCredentialAlerts: [],
};

describe("clientNextActions", () => {
  it("returns [] when all clear", () => {
    expect(clientNextActions(allClearClient)).toEqual([]);
  });

  it("expands each collaboration credential alert into its own action", () => {
    const ranked = clientNextActions({
      ...allClearClient,
      collaborationCredentialAlerts: ["Alert A", "Alert B", "Alert C"],
    });
    expect(ranked).toHaveLength(3);
    expect(ranked.map((x) => x.title)).toEqual(["Alert A", "Alert B", "Alert C"]);
    expect(ranked.map((x) => x.id)).toEqual([
      "client-collaboration-alert-0",
      "client-collaboration-alert-1",
      "client-collaboration-alert-2",
    ]);
    expect(ranked.every((x) => x.href === "/samenwerkingen")).toBe(true);
    expect(ranked.every((x) => x.tone === "attention")).toBe(true);
  });

  it("ranks compliance ripple above the rest", () => {
    const ranked = clientNextActions({
      companyCompleteness: 50,
      newApplications: 2,
      draftJobs: 1,
      overdueInvoices: 1,
      collaborationCredentialAlerts: ["Compliance-alert"],
    });
    expect(ranked[0]?.id).toBe("client-collaboration-alert-0");
    expect(ranked.map((x) => x.id)).toEqual([
      "client-collaboration-alert-0",
      "client-overdue-invoices",
      "client-new-applications",
      "client-company-completeness",
      "client-draft-jobs",
    ]);
  });

  it("uses app hrefs", () => {
    const ranked = clientNextActions({
      companyCompleteness: 80,
      newApplications: 1,
      draftJobs: 1,
      overdueInvoices: 1,
      collaborationCredentialAlerts: [],
    });
    const byId = Object.fromEntries(ranked.map((x) => [x.id, x.href]));
    expect(byId["client-company-completeness"]).toBe("/bedrijf");
    expect(byId["client-new-applications"]).toBe("/kandidaten");
    expect(byId["client-draft-jobs"]).toBe("/opdrachten");
    expect(byId["client-overdue-invoices"]).toBe("/facturen");
  });
});

const allClearAdmin = {
  deletionRequests: 0,
  pendingVerifications: 0,
  pendingUsers: 0,
};

describe("adminNextActions", () => {
  it("returns [] when all clear", () => {
    expect(adminNextActions(allClearAdmin)).toEqual([]);
  });

  it("ranks AVG deletion requests highest", () => {
    const ranked = adminNextActions({
      deletionRequests: 1,
      pendingVerifications: 5,
      pendingUsers: 3,
    });
    expect(ranked.map((x) => x.id)).toEqual([
      "admin-deletion-requests",
      "admin-pending-verifications",
      "admin-pending-users",
    ]);
    expect(ranked[0]?.tone).toBe("attention");
  });

  it("uses admin hrefs", () => {
    const ranked = adminNextActions({
      deletionRequests: 1,
      pendingVerifications: 1,
      pendingUsers: 1,
    });
    const byId = Object.fromEntries(ranked.map((x) => [x.id, x.href]));
    expect(byId["admin-deletion-requests"]).toBe("/admin/gebruikers?deletion=1");
    expect(byId["admin-pending-verifications"]).toBe("/admin/verificaties");
    expect(byId["admin-pending-users"]).toBe("/admin/gebruikers?status=PENDING");
  });
});
