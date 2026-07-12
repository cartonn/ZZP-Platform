import { describe, expect, it } from "vitest";
import {
  buildRosterCandidates,
  type RosterFreelancerSource,
} from "@/lib/franchise/dienst-voordracht";
import { type JobMatchSource } from "@/lib/matching";

const NOW = new Date("2026-07-04T12:00:00Z");
const RECENT = new Date("2026-07-01T12:00:00Z");

// Alle verplichte documenten (VOG + INSURANCE) verified → inzetbaar (geen blockers).
const okCredentials = [
  { type: "VOG", status: "VERIFIED", expiresAt: null },
  { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
];

const job: JobMatchSource = {
  title: "Wijkverpleegkundige",
  description: "Zorg aan huis in de wijk.",
  skills: [
    { skillId: "skill-verpleging", required: true },
    { skillId: "skill-wijkzorg", required: false },
  ],
  credentialRequirements: [{ credentialType: "VOG", required: true }],
  rateMin: 40,
  rateMax: 60,
  workMode: "ONSITE",
  location: "Utrecht",
  industryId: "ind-zorg",
};

function freelancer(over: Partial<RosterFreelancerSource>): RosterFreelancerSource {
  return {
    id: "f-x",
    headline: "Verpleegkundige",
    bio: "Ervaren in de wijkzorg.",
    completeness: 90,
    availability: "AVAILABLE",
    hourlyRate: 50,
    workMode: "ONSITE",
    location: "Utrecht",
    maxTravelMinutes: null,
    user: { name: "Zzp X", identityVerifiedAt: NOW, lastLoginAt: RECENT },
    skills: [],
    industries: [{ industryId: "ind-zorg" }],
    availabilityWindows: [],
    credentials: okCredentials,
    activeCollaborations: [],
    ...over,
  };
}

// Dienst-context zonder startdatum ⇒ geen dubbele-boeking-signaal (dat is los getest in
// roster-double-booking.test.ts); houdt de bestaande rangschik-/markering-asserties zuiver.
const DIENST = { jobId: "dienst-1", startDate: null, viewerTenantId: "tenant-1" };

describe("buildRosterCandidates", () => {
  it("rangschikt op aflopende matchscore voor déze dienst", () => {
    const strong = freelancer({
      id: "f-strong",
      user: { name: "Sterke Match", identityVerifiedAt: NOW, lastLoginAt: RECENT },
      skills: [{ skillId: "skill-verpleging" }, { skillId: "skill-wijkzorg" }],
    });
    const weak = freelancer({
      id: "f-weak",
      user: { name: "Zwakke Match", identityVerifiedAt: NOW, lastLoginAt: RECENT },
      skills: [],
    });

    const result = buildRosterCandidates(job, [weak, strong], new Set(), new Set(), DIENST, NOW);

    expect(result.map((c) => c.freelancerId)).toEqual(["f-strong", "f-weak"]);
    expect(result[0]!.matchScore).toBeGreaterThan(result[1]!.matchScore);
  });

  it("plaatst een niet-inzetbare (INACTIEF) ZZP'er onderaan, ook bij hoge match", () => {
    const inactiefButPerfect = freelancer({
      id: "f-inactief",
      user: { name: "Aaa Perfect", identityVerifiedAt: NOW, lastLoginAt: RECENT },
      skills: [{ skillId: "skill-verpleging" }, { skillId: "skill-wijkzorg" }],
      credentials: [], // verplichte documenten ontbreken → INACTIEF
    });
    const engageableModest = freelancer({
      id: "f-actief",
      user: { name: "Bbb Modest", identityVerifiedAt: NOW, lastLoginAt: RECENT },
      skills: [{ skillId: "skill-verpleging" }],
    });

    const result = buildRosterCandidates(
      job,
      [inactiefButPerfect, engageableModest],
      new Set(),
      new Set(),
      DIENST,
      NOW,
    );

    expect(result[0]!.freelancerId).toBe("f-actief");
    expect(result[1]!.freelancerId).toBe("f-inactief");
    expect(result[1]!.engageabilityStatus).toBe("INACTIEF");
    // Ondanks de perfecte skill-overlap staat de niet-voordraagbare onderaan.
    expect(result[1]!.matchScore).toBeGreaterThan(0);
  });

  it("toont troef (topReason) en minpunt (topGap) uit de matchmotor", () => {
    const c = freelancer({
      id: "f-reason",
      skills: [{ skillId: "skill-verpleging" }],
      availability: "UNAVAILABLE", // levert een minpunt op
    });

    const candidate = buildRosterCandidates(job, [c], new Set(), new Set(), DIENST, NOW)[0]!;

    expect(candidate.topReason).toBeTruthy();
    expect(candidate.topGap).toBeTruthy();
  });

  it("zet de compliance-kloof altijd als eerste minpunt (ook boven een skills-kloof)", () => {
    // Mist het vereiste VOG-certificaat én skills — de compliance-kloof moet als topGap bovenaan
    // staan, zodat de bemiddelaar de blokkade meteen ziet i.p.v. de skills-kloof eerst.
    const c = freelancer({
      id: "f-noncompliant",
      skills: [], // levert óók een skills-kloof op
      credentials: [{ type: "INSURANCE", status: "VERIFIED", expiresAt: null }], // VOG ontbreekt
    });

    const candidate = buildRosterCandidates(job, [c], new Set(), new Set(), DIENST, NOW)[0]!;

    expect(candidate.topGap).toBe("Mist vereist certificaat");
  });

  it("markeert reeds voorgedragen en reeds gereageerde ZZP'ers", () => {
    const a = freelancer({ id: "f-proposed" });
    const b = freelancer({ id: "f-applied" });
    const c = freelancer({ id: "f-fresh" });

    const result = buildRosterCandidates(
      job,
      [a, b, c],
      new Set(["f-proposed"]),
      new Set(["f-applied"]),
      DIENST,
      NOW,
    );
    const by = Object.fromEntries(result.map((r) => [r.freelancerId, r]));

    expect(by["f-proposed"]!.proposed).toBe(true);
    expect(by["f-proposed"]!.hasApplied).toBe(false);
    expect(by["f-applied"]!.hasApplied).toBe(true);
    expect(by["f-fresh"]!.proposed).toBe(false);
    expect(by["f-fresh"]!.hasApplied).toBe(false);
  });

  it("breekt gelijke matchscores op naam (deterministisch)", () => {
    const zoe = freelancer({
      id: "f-zoe",
      user: { name: "Zoë", identityVerifiedAt: NOW, lastLoginAt: RECENT },
      skills: [{ skillId: "skill-verpleging" }],
    });
    const anna = freelancer({
      id: "f-anna",
      user: { name: "Anna", identityVerifiedAt: NOW, lastLoginAt: RECENT },
      skills: [{ skillId: "skill-verpleging" }],
    });

    const result = buildRosterCandidates(job, [zoe, anna], new Set(), new Set(), DIENST, NOW);

    expect(result[0]!.matchScore).toBe(result[1]!.matchScore);
    expect(result.map((c) => c.name)).toEqual(["Anna", "Zoë"]);
  });

  it("markeert een dubbele-boeking wanneer een actieve samenwerking de dienst-startdatum overlapt", () => {
    const dienst = {
      jobId: "dienst-1",
      startDate: new Date("2026-08-10T00:00:00Z"),
      viewerTenantId: "tenant-1",
    };
    const overlapper = freelancer({
      id: "f-overlap",
      activeCollaborations: [
        {
          collaborationId: "col-1",
          jobId: "dienst-anders",
          jobTitle: "Nachtdienst IC",
          tenantId: "tenant-1",
          startDate: new Date("2026-08-01T00:00:00Z"),
          endDate: new Date("2026-08-31T00:00:00Z"),
        },
      ],
    });
    const vrij = freelancer({
      id: "f-vrij",
      user: { name: "Vrij Persoon", identityVerifiedAt: NOW, lastLoginAt: RECENT },
      activeCollaborations: [],
    });

    const result = buildRosterCandidates(
      job,
      [overlapper, vrij],
      new Set(),
      new Set(),
      dienst,
      NOW,
    );
    const by = Object.fromEntries(result.map((r) => [r.freelancerId, r]));

    expect(by["f-overlap"]!.doubleBooking.count).toBe(1);
    expect(by["f-overlap"]!.doubleBooking.firstTitle).toBe("Nachtdienst IC");
    expect(by["f-vrij"]!.doubleBooking.count).toBe(0);
  });

  it("berekent het reistijd-signaal naar de dienst-locatie (zelfde plaats ⇒ dichtbij)", () => {
    const c = freelancer({ id: "f-lokaal", location: "Utrecht" });
    const candidate = buildRosterCandidates(job, [c], new Set(), new Set(), DIENST, NOW)[0]!;
    expect(candidate.proximity).not.toBeNull();
    expect(candidate.proximity!.level).toBe("near");
    expect(candidate.proximity!.minutes).toBe(0);
  });

  it("markeert een ZZP'er verderop als grotere reistijd (Utrecht-dienst, kandidaat in Groningen)", () => {
    const c = freelancer({ id: "f-ver", location: "Groningen" });
    const candidate = buildRosterCandidates(job, [c], new Set(), new Set(), DIENST, NOW)[0]!;
    expect(candidate.proximity!.level).toBe("far");
    expect(candidate.proximity!.minutes).toBeGreaterThan(75);
  });

  it("toont geen reistijd-signaal bij een volledig remote dienst", () => {
    const remoteJob: JobMatchSource = { ...job, workMode: "REMOTE" };
    const c = freelancer({ id: "f-remote", location: "Utrecht" });
    const candidate = buildRosterCandidates(remoteJob, [c], new Set(), new Set(), DIENST, NOW)[0]!;
    expect(candidate.proximity).toBeNull();
  });

  it("toont geen reistijd-signaal wanneer de kandidaat-plaats onbekend is", () => {
    const c = freelancer({ id: "f-onbekend", location: null });
    const candidate = buildRosterCandidates(job, [c], new Set(), new Set(), DIENST, NOW)[0]!;
    expect(candidate.proximity).toBeNull();
  });
});
