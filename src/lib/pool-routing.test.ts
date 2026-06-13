import { describe, expect, it } from "vitest";

import { planPoolInvites, type PoolMember, type PoolRouteJob } from "./pool-routing";

const makeJob = (overrides: Partial<PoolRouteJob> = {}): PoolRouteJob => ({
  id: "job-1",
  title: "Verpleegkundige IC",
  companyName: "Zorggroep Noord",
  tenantId: null,
  openOverflow: false,
  ...overrides,
});

const makeMember = (overrides: Partial<PoolMember> = {}): PoolMember => ({
  userId: "user-1",
  freelancerProfileId: "profile-1",
  availability: "AVAILABLE",
  visibility: "PUBLIC",
  userStatus: "ACTIVE",
  tenantId: null,
  hasApplied: false,
  ...overrides,
});

describe("planPoolInvites", () => {
  it("geeft een lege array terug bij een lege ledenlijst", () => {
    const invites = planPoolInvites(makeJob(), []);
    expect(invites).toHaveLength(0);
  });

  it("geeft één invite terug voor een volledig geschikt lid", () => {
    const job = makeJob({ id: "job-x", title: "Dienst A", companyName: "Bedrijf B" });
    const member = makeMember({ userId: "u-1", freelancerProfileId: "p-1" });
    const invites = planPoolInvites(job, [member]);

    expect(invites).toHaveLength(1);
    const [invite] = invites;
    expect(invite).toBeDefined();
    expect(invite!.userId).toBe("u-1");
    expect(invite!.freelancerProfileId).toBe("p-1");
    expect(invite!.dedupeKey).toBe("pool-invite:job-x:u-1");
    expect(invite!.notificationType).toBe("POOL_INVITE");
    expect(invite!.title).toBe("Uit je Flexpool: Bedrijf B");
    expect(invite!.body).toContain("Bedrijf B");
    expect(invite!.body).toContain("Dienst A");
    expect(invite!.link).toBe("/opdrachten/job-x");
  });

  // --- Overslaan-regel 1: niet-ACTIVE userStatus ---

  it("slaat een SUSPENDED gebruiker over (regel 1)", () => {
    const invites = planPoolInvites(makeJob(), [makeMember({ userStatus: "SUSPENDED" })]);
    expect(invites).toHaveLength(0);
  });

  it("slaat een PENDING gebruiker over (regel 1)", () => {
    const invites = planPoolInvites(makeJob(), [makeMember({ userStatus: "PENDING" })]);
    expect(invites).toHaveLength(0);
  });

  // --- Overslaan-regel 2: visibility niet PUBLIC ---

  it("slaat een PRIVATE profiel over (regel 2)", () => {
    const invites = planPoolInvites(makeJob(), [makeMember({ visibility: "PRIVATE" })]);
    expect(invites).toHaveLength(0);
  });

  // --- Overslaan-regel 3: UNAVAILABLE beschikbaarheid ---

  it("slaat een UNAVAILABLE ZZP'er over (regel 3)", () => {
    const invites = planPoolInvites(makeJob(), [makeMember({ availability: "UNAVAILABLE" })]);
    expect(invites).toHaveLength(0);
  });

  it("nodigt een AVAILABLE ZZP'er wél uit (regel 3)", () => {
    const invites = planPoolInvites(makeJob(), [makeMember({ availability: "AVAILABLE" })]);
    expect(invites).toHaveLength(1);
  });

  it("nodigt een LIMITED ZZP'er wél uit (regel 3)", () => {
    const invites = planPoolInvites(makeJob(), [makeMember({ availability: "LIMITED" })]);
    expect(invites).toHaveLength(1);
  });

  it("nodigt een UNKNOWN ZZP'er wél uit (regel 3)", () => {
    const invites = planPoolInvites(makeJob(), [makeMember({ availability: "UNKNOWN" })]);
    expect(invites).toHaveLength(1);
  });

  // --- Overslaan-regel 4: al gereageerd ---

  it("slaat een lid over dat al heeft gereageerd (regel 4)", () => {
    const invites = planPoolInvites(makeJob(), [makeMember({ hasApplied: true })]);
    expect(invites).toHaveLength(0);
  });

  // --- Overslaan-regel 5: tenant-zichtbaarheid ---

  it("slaat een lid over van een andere tenant als openOverflow false is (regel 5)", () => {
    const invites = planPoolInvites(makeJob({ tenantId: "tenant-a", openOverflow: false }), [
      makeMember({ tenantId: "tenant-b" }),
    ]);
    expect(invites).toHaveLength(0);
  });

  it("laat een lid van een andere tenant toe als openOverflow true is (regel 5)", () => {
    const invites = planPoolInvites(makeJob({ tenantId: "tenant-a", openOverflow: true }), [
      makeMember({ tenantId: "tenant-b" }),
    ]);
    expect(invites).toHaveLength(1);
  });

  it("laat een lid met dezelfde tenantId toe als de opdracht (regel 5)", () => {
    const invites = planPoolInvites(makeJob({ tenantId: "tenant-a", openOverflow: false }), [
      makeMember({ tenantId: "tenant-a" }),
    ]);
    expect(invites).toHaveLength(1);
  });

  it("null tenantId matcht null tenantId van de opdracht (regel 5)", () => {
    const invites = planPoolInvites(makeJob({ tenantId: null, openOverflow: false }), [
      makeMember({ tenantId: null }),
    ]);
    expect(invites).toHaveLength(1);
  });

  it("slaat platform-ZZP'er (tenantId null) over voor een tenant-opdracht zonder overflow", () => {
    const invites = planPoolInvites(makeJob({ tenantId: "tenant-a", openOverflow: false }), [
      makeMember({ tenantId: null }),
    ]);
    expect(invites).toHaveLength(0);
  });

  // --- Volgorde en niet-mutatie ---

  it("behoudt de invoervolgorde bij meerdere geschikte leden", () => {
    const members = [
      makeMember({ userId: "u-1", freelancerProfileId: "p-1" }),
      makeMember({ userId: "u-2", freelancerProfileId: "p-2" }),
      makeMember({ userId: "u-3", freelancerProfileId: "p-3" }),
    ];
    const invites = planPoolInvites(makeJob(), members);
    expect(invites).toHaveLength(3);
    expect(invites.map((i) => i.userId)).toEqual(["u-1", "u-2", "u-3"]);
  });

  it("muteert de invoer-array niet", () => {
    const members = [makeMember(), makeMember({ userId: "u-2", freelancerProfileId: "p-2" })];
    const original = [...members];
    planPoolInvites(makeJob(), members);
    expect(members).toEqual(original);
  });

  // --- dedupeKey formaat ---

  it("dedupeKey heeft het formaat pool-invite:<jobId>:<userId>", () => {
    const job = makeJob({ id: "job-abc" });
    const member = makeMember({ userId: "u-xyz" });
    const [invite] = planPoolInvites(job, [member]);
    expect(invite!.dedupeKey).toBe("pool-invite:job-abc:u-xyz");
  });

  // --- Gecombineerde scenario's ---

  it("filtert geschorste leden maar stuurt geldige leden wél uit", () => {
    const members = [
      makeMember({ userId: "u-1", freelancerProfileId: "p-1", userStatus: "SUSPENDED" }),
      makeMember({ userId: "u-2", freelancerProfileId: "p-2" }),
    ];
    const invites = planPoolInvites(makeJob(), members);
    expect(invites).toHaveLength(1);
    expect(invites[0]!.userId).toBe("u-2");
  });

  it("body bevat zowel de bedrijfsnaam als de opdrachttitel", () => {
    const job = makeJob({ title: "Nachtdienst SEH", companyName: "St. Antonius" });
    const [invite] = planPoolInvites(job, [makeMember()]);
    expect(invite!.body).toContain("St. Antonius");
    expect(invite!.body).toContain("Nachtdienst SEH");
  });
});
