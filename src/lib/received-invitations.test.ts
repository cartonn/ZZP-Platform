import { describe, it, expect } from "vitest";
import {
  selectOpenInvitations,
  MAX_RECEIVED_INVITATIONS,
  INVITATION_AGING_DAYS,
  invitationAgeDays,
  invitationAgeLabel,
  type InvitationJobRef,
  type RawInvitation,
} from "@/lib/received-invitations";

function jobs(...refs: InvitationJobRef[]): Map<string, InvitationJobRef> {
  return new Map(refs.map((r) => [r.id, r]));
}

const ref = (
  id: string,
  title = `Titel ${id}`,
  companyName = `Bedrijf ${id}`,
): InvitationJobRef => ({
  id,
  title,
  companyName,
});

describe("selectOpenInvitations", () => {
  it("mapt ruwe uitnodigingen naar toonbare items met opdracht + opdrachtgever", () => {
    const invites: RawInvitation[] = [{ jobId: "j1", invitedAt: new Date("2026-07-10T09:00:00Z") }];
    const result = selectOpenInvitations(
      invites,
      jobs(ref("j1", "Nachtdienst", "ZorgGroep")),
      new Set(),
    );
    expect(result).toEqual([
      {
        jobId: "j1",
        jobTitle: "Nachtdienst",
        companyName: "ZorgGroep",
        invitedAt: new Date("2026-07-10T09:00:00Z"),
      },
    ]);
  });

  it("ontdubbelt per opdracht en houdt het meest recente uitnodigingsmoment", () => {
    const invites: RawInvitation[] = [
      { jobId: "j1", invitedAt: new Date("2026-07-01T09:00:00Z") },
      { jobId: "j1", invitedAt: new Date("2026-07-05T09:00:00Z") },
    ];
    const result = selectOpenInvitations(invites, jobs(ref("j1")), new Set());
    expect(result).toHaveLength(1);
    expect(result[0]?.invitedAt).toEqual(new Date("2026-07-05T09:00:00Z"));
  });

  it("sluit opdrachten uit waarop de ZZP'er al reageerde", () => {
    const invites: RawInvitation[] = [
      { jobId: "j1", invitedAt: new Date("2026-07-05T09:00:00Z") },
      { jobId: "j2", invitedAt: new Date("2026-07-06T09:00:00Z") },
    ];
    const result = selectOpenInvitations(invites, jobs(ref("j1"), ref("j2")), new Set(["j1"]));
    expect(result.map((r) => r.jobId)).toEqual(["j2"]);
  });

  it("sluit opdrachten uit die niet meer gepubliceerd zijn (ontbreken in de jobs-map)", () => {
    const invites: RawInvitation[] = [
      { jobId: "j1", invitedAt: new Date("2026-07-05T09:00:00Z") },
      { jobId: "closed", invitedAt: new Date("2026-07-06T09:00:00Z") },
    ];
    const result = selectOpenInvitations(invites, jobs(ref("j1")), new Set());
    expect(result.map((r) => r.jobId)).toEqual(["j1"]);
  });

  it("sorteert nieuwste uitnodiging eerst, opdracht-id als tiebreaker", () => {
    const same = new Date("2026-07-05T09:00:00Z");
    const invites: RawInvitation[] = [
      { jobId: "b", invitedAt: same },
      { jobId: "a", invitedAt: same },
      { jobId: "c", invitedAt: new Date("2026-07-08T09:00:00Z") },
    ];
    const result = selectOpenInvitations(invites, jobs(ref("a"), ref("b"), ref("c")), new Set());
    expect(result.map((r) => r.jobId)).toEqual(["c", "a", "b"]);
  });

  it("begrenst op de cap (nieuwste eerst)", () => {
    const invites: RawInvitation[] = Array.from({ length: 10 }, (_, i) => ({
      jobId: `j${i}`,
      invitedAt: new Date(2026, 6, i + 1),
    }));
    const refs = invites.map((inv) => ref(inv.jobId));
    const result = selectOpenInvitations(invites, jobs(...refs), new Set(), 3);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.jobId)).toEqual(["j9", "j8", "j7"]);
  });

  it("cap <= 0 levert een lege lijst", () => {
    const invites: RawInvitation[] = [{ jobId: "j1", invitedAt: new Date() }];
    expect(selectOpenInvitations(invites, jobs(ref("j1")), new Set(), 0)).toEqual([]);
  });

  it("lege invoer levert een lege lijst", () => {
    expect(selectOpenInvitations([], jobs(), new Set())).toEqual([]);
  });

  it("MAX_RECEIVED_INVITATIONS is de standaard-cap", () => {
    const invites: RawInvitation[] = Array.from(
      { length: MAX_RECEIVED_INVITATIONS + 4 },
      (_, i) => ({
        jobId: `j${i}`,
        invitedAt: new Date(2026, 6, i + 1),
      }),
    );
    const refs = invites.map((inv) => ref(inv.jobId));
    const result = selectOpenInvitations(invites, jobs(...refs), new Set());
    expect(result).toHaveLength(MAX_RECEIVED_INVITATIONS);
  });
});

describe("invitationAgeDays", () => {
  it("telt hele dagen sinds de uitnodiging (naar beneden afgerond)", () => {
    const now = new Date("2026-07-22T12:00:00Z");
    expect(invitationAgeDays(new Date("2026-07-22T09:00:00Z"), now)).toBe(0); // vandaag
    expect(invitationAgeDays(new Date("2026-07-21T09:00:00Z"), now)).toBe(1); // ~1,1 dag → 1
    expect(invitationAgeDays(new Date("2026-07-15T12:00:00Z"), now)).toBe(7);
  });

  it("klemt een uitnodiging 'uit de toekomst' (klok-scheefstand) op 0", () => {
    const now = new Date("2026-07-22T12:00:00Z");
    expect(invitationAgeDays(new Date("2026-07-23T12:00:00Z"), now)).toBe(0);
  });
});

describe("invitationAgeLabel", () => {
  it("gebruikt grove, menselijke buckets zonder schijnprecisie", () => {
    expect(invitationAgeLabel(0)).toBe("vandaag uitgenodigd");
    expect(invitationAgeLabel(1)).toBe("gisteren uitgenodigd");
    expect(invitationAgeLabel(4)).toBe("4 dagen geleden uitgenodigd");
    expect(invitationAgeLabel(INVITATION_AGING_DAYS)).toBe("5 dagen geleden uitgenodigd");
  });
});
