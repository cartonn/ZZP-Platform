import { describe, expect, it } from "vitest";
import {
  activeVerifiedCount,
  assertTransition,
  canTransition,
  credentialEditPath,
  credentialRecoveryNotice,
  daysUntilExpiry,
  expiryTransition,
  isExpired,
  isExpiringSoon,
  rosterExpiringByProfile,
  rosterExpiredByProfile,
  statusForDecision,
  supersededVerifiedCredentialIds,
  TransitionError,
} from "@/lib/credentials";

describe("canTransition / assertTransition", () => {
  it("staat geldige overgangen toe", () => {
    expect(canTransition("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransition("SUBMITTED", "VERIFIED")).toBe(true);
    expect(canTransition("SUBMITTED", "REJECTED")).toBe(true);
    expect(canTransition("VERIFIED", "EXPIRED")).toBe(true);
    expect(canTransition("REJECTED", "SUBMITTED")).toBe(true);
    expect(canTransition("EXPIRED", "SUBMITTED")).toBe(true);
  });

  it("weigert de verboden DRAFT->VERIFIED sprong", () => {
    expect(canTransition("DRAFT", "VERIFIED")).toBe(false);
    expect(() => assertTransition("DRAFT", "VERIFIED")).toThrow(TransitionError);
  });

  it("weigert overige ongeldige overgangen", () => {
    expect(canTransition("DRAFT", "REJECTED")).toBe(false);
    expect(canTransition("VERIFIED", "VERIFIED")).toBe(false);
    expect(canTransition("EXPIRED", "VERIFIED")).toBe(false);
  });

  it("assertTransition werpt niets bij geldige overgang", () => {
    expect(() => assertTransition("SUBMITTED", "VERIFIED")).not.toThrow();
  });
});

describe("statusForDecision", () => {
  it("zet VERIFIED bij goedkeuring", () => {
    expect(statusForDecision("SUBMITTED", "VERIFIED")).toBe("VERIFIED");
  });

  it("zet REJECTED bij afwijzing mét reden", () => {
    expect(statusForDecision("SUBMITTED", "REJECTED", "Onleesbaar document")).toBe("REJECTED");
  });

  it("dwingt een reden af bij afwijzing", () => {
    expect(() => statusForDecision("SUBMITTED", "REJECTED")).toThrow(/reden/i);
    expect(() => statusForDecision("SUBMITTED", "REJECTED", "   ")).toThrow(/reden/i);
  });

  it("weigert beslissen vanuit een ongeldige status", () => {
    expect(() => statusForDecision("DRAFT", "VERIFIED")).toThrow(TransitionError);
  });
});

describe("expiry", () => {
  const now = new Date("2026-05-25T12:00:00Z");
  const past = new Date("2026-01-01T00:00:00Z");
  const future = new Date("2026-12-31T00:00:00Z");

  it("alleen VERIFIED kan verlopen", () => {
    expect(isExpired({ status: "VERIFIED", expiresAt: past }, now)).toBe(true);
    expect(isExpired({ status: "SUBMITTED", expiresAt: past }, now)).toBe(false);
    expect(isExpired({ status: "DRAFT", expiresAt: past }, now)).toBe(false);
  });

  it("zonder vervaldatum verloopt nooit", () => {
    expect(isExpired({ status: "VERIFIED", expiresAt: null }, now)).toBe(false);
  });

  it("toekomstige vervaldatum is niet verlopen", () => {
    expect(isExpired({ status: "VERIFIED", expiresAt: future }, now)).toBe(false);
  });

  it("daysUntilExpiry rekent in hele dagen", () => {
    expect(daysUntilExpiry(null, now)).toBeNull();
    expect(daysUntilExpiry(new Date("2026-05-30T12:00:00Z"), now)).toBe(5);
    expect(daysUntilExpiry(past, now)).toBeLessThan(0);
  });

  it("isExpiringSoon detecteert bijna-verlopen VERIFIED credentials", () => {
    const soon = new Date("2026-06-10T12:00:00Z"); // 16 dagen
    expect(isExpiringSoon({ status: "VERIFIED", expiresAt: soon }, 30, now)).toBe(true);
    expect(isExpiringSoon({ status: "VERIFIED", expiresAt: future }, 30, now)).toBe(false);
    expect(isExpiringSoon({ status: "VERIFIED", expiresAt: past }, 30, now)).toBe(false);
    expect(isExpiringSoon({ status: "SUBMITTED", expiresAt: soon }, 30, now)).toBe(false);
  });

  it("expiryTransition geeft EXPIRED voor een verlopen VERIFIED credential", () => {
    expect(expiryTransition({ status: "VERIFIED", expiresAt: past }, now)).toBe("EXPIRED");
    expect(expiryTransition({ status: "VERIFIED", expiresAt: future }, now)).toBeNull();
    expect(expiryTransition({ status: "SUBMITTED", expiresAt: past }, now)).toBeNull();
  });
});

describe("activeVerifiedCount", () => {
  const nu = new Date("2026-05-25T12:00:00Z");
  const verleden = new Date("2026-01-01T12:00:00Z");
  const toekomst = new Date("2027-01-01T12:00:00Z");

  it("telt alleen VERIFIED certificaten", () => {
    const count = activeVerifiedCount(
      [
        { status: "VERIFIED" },
        { status: "VERIFIED", expiresAt: toekomst },
        { status: "SUBMITTED" },
        { status: "DRAFT" },
        { status: "REJECTED" },
      ],
      nu,
    );
    expect(count).toBe(2);
  });

  it("telt een verlopen VERIFIED certificaat niet mee", () => {
    const count = activeVerifiedCount(
      [
        { status: "VERIFIED", expiresAt: verleden },
        { status: "VERIFIED", expiresAt: toekomst },
        { status: "VERIFIED" }, // geen vervaldatum → verloopt nooit
      ],
      nu,
    );
    expect(count).toBe(2);
  });

  it("is 0 zonder geldige geverifieerde certificaten", () => {
    expect(activeVerifiedCount([], nu)).toBe(0);
    expect(activeVerifiedCount([{ status: "SUBMITTED" }, { status: "EXPIRED" }], nu)).toBe(0);
  });
});

describe("supersededVerifiedCredentialIds", () => {
  const now = new Date("2026-07-30T00:00:00Z");
  const soon = new Date("2026-08-09T00:00:00Z"); // +10 dagen
  const later = new Date("2027-09-01T00:00:00Z"); // ruim later
  const past = new Date("2026-07-01T00:00:00Z"); // al verlopen

  it("markeert het ouder-vervallende exemplaar als superseded bij twee geldige VERIFIED-certs van hetzelfde type", () => {
    const set = supersededVerifiedCredentialIds(
      [
        { id: "oud", type: "LICENSE", status: "VERIFIED", expiresAt: soon },
        { id: "nieuw", type: "LICENSE", status: "VERIFIED", expiresAt: later },
      ],
      now,
    );
    expect(set.has("oud")).toBe(true); // de nieuwe dekt de compliance → verval van 'oud' irrelevant
    expect(set.has("nieuw")).toBe(false); // het laatst-vervallende draagt de nudge
  });

  it("laat een onbeperkt-geldig (geen vervaldatum) exemplaar een ouder verlopend exemplaar superseden", () => {
    const set = supersededVerifiedCredentialIds(
      [
        { id: "oud", type: "BIG", status: "VERIFIED", expiresAt: soon },
        { id: "eeuwig", type: "BIG", status: "VERIFIED", expiresAt: null },
      ],
      now,
    );
    expect(set.has("oud")).toBe(true);
    expect(set.has("eeuwig")).toBe(false);
  });

  it("supersedet niet met een al-verlopen of niet-VERIFIED exemplaar (dat dekt de compliance niet)", () => {
    const set = supersededVerifiedCredentialIds(
      [
        { id: "geldig", type: "LICENSE", status: "VERIFIED", expiresAt: soon },
        { id: "verlopen", type: "LICENSE", status: "VERIFIED", expiresAt: past },
        { id: "concept", type: "LICENSE", status: "DRAFT", expiresAt: later },
      ],
      now,
    );
    expect(set.size).toBe(0); // niets dekt 'geldig' → het blijft het dragende exemplaar
  });

  it("houdt certificaten van verschillende typen los van elkaar", () => {
    const set = supersededVerifiedCredentialIds(
      [
        { id: "lic", type: "LICENSE", status: "VERIFIED", expiresAt: soon },
        { id: "big", type: "BIG", status: "VERIFIED", expiresAt: later },
      ],
      now,
    );
    expect(set.size).toBe(0); // verschillende typen → geen onderlinge dekking
  });
});

describe("rosterExpiringByProfile", () => {
  const now = new Date("2026-07-30T00:00:00Z");
  const soon = new Date("2026-08-29T00:00:00Z"); // +30 dagen (verloopvenster)
  const inWindow = new Date("2026-08-09T00:00:00Z"); // +10 dagen — binnen het venster
  const inWindowLater = new Date("2026-08-20T00:00:00Z"); // +21 dagen — binnen het venster
  const farFuture = new Date("2027-09-01T00:00:00Z"); // ruim buiten het venster
  const past = new Date("2026-07-01T00:00:00Z"); // al verlopen

  it("telt een bijna-vervallend VERIFIED-cert als één taak voor de ZZP'er", () => {
    const result = rosterExpiringByProfile(
      [
        {
          id: "c1",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: inWindow,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      soon,
    );
    expect(result).toEqual([{ profileId: "p1", name: "Sanne", count: 1 }]);
  });

  it("telt een superseded exemplaar NIET mee (nieuwer cert van hetzelfde type dekt de compliance al)", () => {
    const result = rosterExpiringByProfile(
      [
        {
          id: "oud",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: inWindow, // verloopt binnenkort
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "nieuw",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: farFuture, // vroeg vernieuwd, ruim geldig → dekt het type
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      soon,
    );
    expect(result).toEqual([]); // geen valse verloop-nudge
  });

  it("telt een onbeperkt-geldige vervanger als dekking (superseded → geen taak)", () => {
    const result = rosterExpiringByProfile(
      [
        {
          id: "oud",
          type: "BIG",
          status: "VERIFIED",
          expiresAt: inWindow,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "eeuwig",
          type: "BIG",
          status: "VERIFIED",
          expiresAt: null,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      soon,
    );
    expect(result).toEqual([]);
  });

  it("aggregeert meerdere niet-gedekte typen tot één taak met de juiste telling per ZZP'er", () => {
    const result = rosterExpiringByProfile(
      [
        {
          id: "lic",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: inWindow,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "big",
          type: "BIG",
          status: "VERIFIED",
          expiresAt: inWindowLater,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      soon,
    );
    expect(result).toEqual([{ profileId: "p1", name: "Sanne", count: 2 }]);
  });

  it("scheidt de tellingen per ZZP'er", () => {
    const result = rosterExpiringByProfile(
      [
        {
          id: "a",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: inWindow,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "b",
          type: "VOG",
          status: "VERIFIED",
          expiresAt: inWindow,
          freelancerProfileId: "p2",
          freelancerName: "Jeroen",
        },
      ],
      now,
      soon,
    );
    expect(result).toEqual([
      { profileId: "p1", name: "Sanne", count: 1 },
      { profileId: "p2", name: "Jeroen", count: 1 },
    ]);
  });

  it("negeert certificaten buiten het venster, al-verlopen exemplaren en zonder vervaldatum", () => {
    const result = rosterExpiringByProfile(
      [
        {
          id: "ver-weg",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: farFuture, // buiten het venster
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "verlopen",
          type: "VOG",
          status: "VERIFIED",
          expiresAt: past, // al verlopen — niet "verloopt binnenkort"
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "onbeperkt",
          type: "BIG",
          status: "VERIFIED",
          expiresAt: null, // verloopt nooit
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      soon,
    );
    expect(result).toEqual([]);
  });
});

describe("rosterExpiredByProfile", () => {
  const now = new Date("2026-07-30T00:00:00Z");
  const past = new Date("2026-07-01T00:00:00Z"); // al verlopen
  const morePast = new Date("2026-06-01T00:00:00Z"); // eerder verlopen
  const future = new Date("2026-09-01T00:00:00Z"); // nu geldig
  const MANDATORY = ["VOG", "INSURANCE"] as const;

  it("telt een VERIFIED-cert met een verleden vervaldatum (niet-verplicht type) als verlopen", () => {
    const result = rosterExpiredByProfile(
      [
        {
          id: "c1",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: past, // feitelijk verlopen, nog niet batch-geflipt
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      MANDATORY,
    );
    expect(result).toEqual([{ profileId: "p1", name: "Sanne", count: 1 }]);
  });

  it("telt een EXPIRED-status cert (batch-geflipt) als verlopen", () => {
    const result = rosterExpiredByProfile(
      [
        {
          id: "c1",
          type: "BIG",
          status: "EXPIRED",
          expiresAt: past,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      MANDATORY,
    );
    expect(result).toEqual([{ profileId: "p1", name: "Sanne", count: 1 }]);
  });

  it("telt een verlopen exemplaar NIET zodra een nu-geldig cert van hetzelfde type de compliance dekt", () => {
    const result = rosterExpiredByProfile(
      [
        {
          id: "oud",
          type: "BIG",
          status: "EXPIRED",
          expiresAt: past,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "nieuw",
          type: "BIG",
          status: "VERIFIED",
          expiresAt: future, // vernieuwd, nu geldig → dekt het type
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      MANDATORY,
    );
    expect(result).toEqual([]); // geen valse verleng-nudge
  });

  it("dekt met een onbeperkt-geldig vervangend cert (geen vervaldatum)", () => {
    const result = rosterExpiredByProfile(
      [
        {
          id: "oud",
          type: "BIG",
          status: "VERIFIED",
          expiresAt: past,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "eeuwig",
          type: "BIG",
          status: "VERIFIED",
          expiresAt: null,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      MANDATORY,
    );
    expect(result).toEqual([]);
  });

  it("sluit verplichte typen uit (engageability dekt VOG/verzekering al)", () => {
    const result = rosterExpiredByProfile(
      [
        {
          id: "vog",
          type: "VOG",
          status: "EXPIRED",
          expiresAt: past,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "verz",
          type: "INSURANCE",
          status: "VERIFIED",
          expiresAt: past,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      MANDATORY,
    );
    expect(result).toEqual([]);
  });

  it("telt niet-verplichte niet-gedekte typen per ZZP'er en scheidt de tellingen", () => {
    const result = rosterExpiredByProfile(
      [
        {
          id: "lic",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: past,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "big",
          type: "BIG",
          status: "EXPIRED",
          expiresAt: morePast,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "cert",
          type: "CERTIFICATE",
          status: "VERIFIED",
          expiresAt: past,
          freelancerProfileId: "p2",
          freelancerName: "Jeroen",
        },
      ],
      now,
      MANDATORY,
    );
    expect(result).toEqual([
      { profileId: "p1", name: "Sanne", count: 2 },
      { profileId: "p2", name: "Jeroen", count: 1 },
    ]);
  });

  it("negeert nu-geldige en onbeperkt-geldige certs (nog niet verlopen)", () => {
    const result = rosterExpiredByProfile(
      [
        {
          id: "geldig",
          type: "LICENSE",
          status: "VERIFIED",
          expiresAt: future,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
        {
          id: "onbeperkt",
          type: "BIG",
          status: "VERIFIED",
          expiresAt: null,
          freelancerProfileId: "p1",
          freelancerName: "Sanne",
        },
      ],
      now,
      MANDATORY,
    );
    expect(result).toEqual([]);
  });
});

describe("credentialEditPath", () => {
  it("wijst naar het bewerken-scherm van het specifieke certificaat", () => {
    expect(credentialEditPath("cred-123")).toBe("/certificaten/cred-123/bewerken");
  });
});

describe("credentialRecoveryNotice", () => {
  it("geeft een afwijs-herstelmelding (danger) bij REJECTED", () => {
    const notice = credentialRecoveryNotice("REJECTED");
    expect(notice?.tone).toBe("danger");
    expect(notice?.message).toContain("nieuw");
  });

  it("geeft een verloop-herstelmelding (warning) bij EXPIRED", () => {
    const notice = credentialRecoveryNotice("EXPIRED");
    expect(notice?.tone).toBe("warning");
    expect(notice?.message).toContain("vervaldatum");
  });

  it("geeft geen melding bij statussen die geen herstel vragen", () => {
    expect(credentialRecoveryNotice("DRAFT")).toBeNull();
    expect(credentialRecoveryNotice("SUBMITTED")).toBeNull();
    expect(credentialRecoveryNotice("VERIFIED")).toBeNull();
  });
});
