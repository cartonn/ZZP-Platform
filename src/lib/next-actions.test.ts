import { describe, it, expect } from "vitest";
import {
  rankNextActions,
  freelancerNextActions,
  clientNextActions,
  adminNextActions,
  franchiserNextActions,
  formatMissing,
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
  missingProfileItems: [] as string[],
  rejectedCredentials: 0,
  expiringCredentials: 0,
  overdueInvoices: 0,
  contractsAwaitingSignature: 0,
  messagesAwaitingReply: 0,
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

  it("gebruikt correct enkelvoud/meervoud bij verlopende certificaten", () => {
    const one = freelancerNextActions({ ...allClearFreelancer, expiringCredentials: 1 });
    expect(one[0]?.title).toContain("1 certificaat verloopt binnenkort");
    const many = freelancerNextActions({ ...allClearFreelancer, expiringCredentials: 3 });
    expect(many[0]?.title).toContain("3 certificaten verlopen binnenkort");
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
    expect(byId["freelancer-profile-private"]).toBe("/profiel/bewerken");
    expect(byId["freelancer-identity-unverified"]).toBe("/account");
    expect(byId["freelancer-credentials-rejected"]).toBe("/certificaten");
    expect(byId["freelancer-overdue-invoices"]).toBe("/facturen");
  });
});

const allClearClient = {
  companyCompleteness: 100,
  missingCompanyItems: [] as string[],
  newApplications: 0,
  draftJobs: 0,
  overdueInvoices: 0,
  collaborationCredentialAlerts: [],
  contractsAwaitingSignature: 0,
  messagesAwaitingReply: 0,
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
      missingCompanyItems: [],
      newApplications: 2,
      draftJobs: 1,
      overdueInvoices: 1,
      collaborationCredentialAlerts: ["Compliance-alert"],
      contractsAwaitingSignature: 0,
      messagesAwaitingReply: 0,
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
      missingCompanyItems: [],
      newApplications: 1,
      draftJobs: 1,
      overdueInvoices: 1,
      collaborationCredentialAlerts: [],
      contractsAwaitingSignature: 0,
      messagesAwaitingReply: 0,
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
  openDisputes: 0,
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
      openDisputes: 0,
    });
    expect(ranked.map((x) => x.id)).toEqual([
      "admin-deletion-requests",
      "admin-pending-verifications",
      "admin-pending-users",
    ]);
    expect(ranked[0]?.tone).toBe("attention");
  });

  it("ranks open disputes above pending-users (bevroren werkproces)", () => {
    const ranked = adminNextActions({ ...allClearAdmin, openDisputes: 2, pendingUsers: 1 });
    expect(ranked[0]?.id).toBe("admin-open-disputes");
    expect(ranked[0]?.href).toBe("/admin/disputen");
    expect(ranked[0]?.tone).toBe("attention");
  });

  it("uses admin hrefs", () => {
    const ranked = adminNextActions({
      deletionRequests: 1,
      pendingVerifications: 1,
      pendingUsers: 1,
      openDisputes: 0,
    });
    const byId = Object.fromEntries(ranked.map((x) => [x.id, x.href]));
    expect(byId["admin-deletion-requests"]).toBe("/admin/gebruikers?deletion=1");
    expect(byId["admin-pending-verifications"]).toBe("/admin/verificaties");
    expect(byId["admin-pending-users"]).toBe("/admin/gebruikers?status=PENDING");
  });
});

describe("contract-ondertekening als next-action", () => {
  it("freelancer krijgt een teken-actie bij een wachtend contract", () => {
    const ranked = freelancerNextActions({ ...allClearFreelancer, contractsAwaitingSignature: 1 });
    expect(ranked.map((x) => x.id)).toEqual(["freelancer-contracts-sign"]);
    expect(ranked[0]?.href).toBe("/samenwerkingen");
    expect(ranked[0]?.tone).toBe("attention");
  });

  it("client krijgt een teken-actie bij een wachtend contract", () => {
    const ranked = clientNextActions({ ...allClearClient, contractsAwaitingSignature: 2 });
    expect(ranked.map((x) => x.id)).toEqual(["client-contracts-sign"]);
    expect(ranked[0]?.href).toBe("/samenwerkingen");
  });

  it("geen teken-actie bij 0 wachtende contracten", () => {
    expect(freelancerNextActions(allClearFreelancer)).toEqual([]);
    expect(clientNextActions(allClearClient)).toEqual([]);
  });
});

describe("berichten die op antwoord wachten als next-action", () => {
  it("freelancer krijgt een berichten-actie", () => {
    const ranked = freelancerNextActions({ ...allClearFreelancer, messagesAwaitingReply: 3 });
    expect(ranked.map((x) => x.id)).toEqual(["freelancer-messages-awaiting"]);
    expect(ranked[0]?.href).toBe("/berichten");
    expect(ranked[0]?.tone).toBe("attention");
  });

  it("client krijgt een berichten-actie", () => {
    const ranked = clientNextActions({ ...allClearClient, messagesAwaitingReply: 1 });
    expect(ranked.map((x) => x.id)).toEqual(["client-messages-awaiting"]);
    expect(ranked[0]?.href).toBe("/berichten");
  });

  it("rangschikt over-vervaldatum facturen boven berichten, en berichten boven nieuwe reacties", () => {
    const ranked = clientNextActions({
      ...allClearClient,
      overdueInvoices: 1,
      messagesAwaitingReply: 1,
      newApplications: 1,
    });
    expect(ranked.map((x) => x.id)).toEqual([
      "client-overdue-invoices",
      "client-messages-awaiting",
      "client-new-applications",
    ]);
  });

  it("geen berichten-actie bij 0", () => {
    expect(freelancerNextActions(allClearFreelancer)).toEqual([]);
    expect(clientNextActions(allClearClient)).toEqual([]);
  });
});

const allClearFranchiser = {
  companies: 2,
  publishedDiensten: 3,
  rosterFreelancers: 4,
  companiesWithoutDiensten: 0,
};

describe("franchiserNextActions", () => {
  it("toont niets wanneer de franchise volledig staat", () => {
    expect(franchiserNextActions(allClearFranchiser)).toEqual([]);
  });

  it("toont bij een lege tenant de opdrachtgever- én de roster-startstap (geen zinloze dienst-stap)", () => {
    const ranked = franchiserNextActions({
      companies: 0,
      publishedDiensten: 0,
      rosterFreelancers: 0,
      companiesWithoutDiensten: 0,
    });
    // first-client (90) boven roster (70); de dienst-stap ontbreekt want er is nog geen opdrachtgever.
    expect(ranked.map((x) => x.id)).toEqual(["franchiser-first-client", "franchiser-roster-empty"]);
    expect(ranked[0]?.href).toBe("/franchise/opdrachtgevers/nieuw");
    expect(ranked[0]?.tone).toBe("info");
  });

  it("stuurt naar de eerste dienst zodra er een opdrachtgever is", () => {
    const ranked = franchiserNextActions({
      ...allClearFranchiser,
      publishedDiensten: 0,
      companiesWithoutDiensten: 2,
    });
    expect(ranked.map((x) => x.id)).toEqual(["franchiser-first-service"]);
    expect(ranked[0]?.href).toBe("/franchise/opdrachtgevers");
  });

  it("nudget opdrachtgevers-zonder-diensten zodra er al diensten lopen", () => {
    const ranked = franchiserNextActions({ ...allClearFranchiser, companiesWithoutDiensten: 1 });
    expect(ranked.map((x) => x.id)).toEqual(["franchiser-clients-without-service"]);
    expect(ranked[0]?.title).toContain("1 opdrachtgever");
  });

  it("toont eerste-dienst én roster bij een opdrachtgever zonder diensten en leeg roster, diensten bovenaan", () => {
    const ranked = franchiserNextActions({
      companies: 1,
      publishedDiensten: 0,
      rosterFreelancers: 0,
      companiesWithoutDiensten: 1,
    });
    // first-service (80) boven roster (70).
    expect(ranked.map((x) => x.id)).toEqual([
      "franchiser-first-service",
      "franchiser-roster-empty",
    ]);
  });

  it("toont alleen de roster-stap als diensten staan maar het roster leeg is", () => {
    const ranked = franchiserNextActions({ ...allClearFranchiser, rosterFreelancers: 0 });
    expect(ranked.map((x) => x.id)).toEqual(["franchiser-roster-empty"]);
    expect(ranked[0]?.href).toBe("/franchise/zzpers");
  });
});

describe("formatMissing", () => {
  it("voegt tot max items samen", () => {
    expect(formatMissing(["Uurtarief", "Talen"])).toBe("Uurtarief, Talen");
  });
  it("kapt af met '+N meer'", () => {
    expect(formatMissing(["A", "B", "C", "D", "E"])).toBe("A, B, C +2 meer");
  });
  it("leeg = lege string", () => {
    expect(formatMissing([])).toBe("");
  });
});

describe("completeness-actie toont wat te doen om 100% te halen", () => {
  it("freelancer: noemt de ontbrekende onderdelen concreet", () => {
    const ranked = freelancerNextActions({
      ...allClearFreelancer,
      completeness: 70,
      missingProfileItems: ["Uurtarief", "Talen", "Locatie"],
    });
    const a = ranked.find((x) => x.id === "freelancer-completeness");
    expect(a?.title).toBe("Profiel is 70% compleet — voeg toe: Uurtarief, Talen, Locatie");
    expect(a?.href).toBe("/profiel/bewerken");
  });

  it("freelancer: valt terug op 'vul aan' zonder lijst", () => {
    const ranked = freelancerNextActions({
      ...allClearFreelancer,
      completeness: 80,
      missingProfileItems: [],
    });
    expect(ranked.find((x) => x.id === "freelancer-completeness")?.title).toBe(
      "Profiel is 80% compleet — vul aan",
    );
  });

  it("client: noemt de ontbrekende bedrijfsonderdelen concreet", () => {
    const ranked = clientNextActions({
      ...allClearClient,
      companyCompleteness: 65,
      missingCompanyItems: ["Logo", "Website"],
    });
    expect(ranked.find((x) => x.id === "client-company-completeness")?.title).toBe(
      "Bedrijfsprofiel is 65% compleet — voeg toe: Logo, Website",
    );
  });
});
