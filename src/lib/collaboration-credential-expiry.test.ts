import { describe, it, expect } from "vitest";
import {
  collaborationCredentialExpiryConcerns,
  collaborationExpiredRequiredCredentials,
  COLLAB_CREDENTIAL_EXPIRY_WINDOW_DAYS,
  type CollabCredentialInput,
  type CollabRequirementInput,
} from "./collaboration-credential-expiry";

const NOW = new Date("2026-07-15T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const inDays = (n: number) => new Date(NOW.getTime() + n * DAY);

function cred(over: Partial<CollabCredentialInput> = {}): CollabCredentialInput {
  return {
    id: "cred-vog",
    title: "VOG",
    type: "VOG",
    status: "VERIFIED",
    expiresAt: inDays(10),
    ...over,
  };
}

function collab(over: Partial<CollabRequirementInput> = {}): CollabRequirementInput {
  return {
    collaborationId: "collab-1",
    companyName: "Zorggroep Noord",
    jobTitle: "Wijkverpleegkundige",
    requiredTypes: ["VOG"],
    ...over,
  };
}

describe("collaborationCredentialExpiryConcerns", () => {
  it("markeert een vereist certificaat dat binnen het venster verloopt", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab()],
      credentials: [cred({ expiresAt: inDays(10) })],
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.credentialId).toBe("cred-vog");
    expect(result[0]!.daysUntilExpiry).toBe(10);
    expect(result[0]!.collaborations).toEqual([
      {
        collaborationId: "collab-1",
        companyName: "Zorggroep Noord",
        jobTitle: "Wijkverpleegkundige",
      },
    ]);
  });

  it("negeert een verlopend certificaat dat door geen enkele samenwerking wordt vereist", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab({ requiredTypes: ["DIPLOMA"] })],
      credentials: [cred({ type: "VOG", expiresAt: inDays(5) })],
      now: NOW,
    });
    expect(result).toEqual([]);
  });

  it("negeert een certificaat dat pas ná het venster verloopt", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab()],
      credentials: [cred({ expiresAt: inDays(COLLAB_CREDENTIAL_EXPIRY_WINDOW_DAYS + 5) })],
      now: NOW,
    });
    expect(result).toEqual([]);
  });

  it("negeert een reeds verlopen certificaat (elders afgehandeld als compliance-gat)", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab()],
      credentials: [cred({ expiresAt: inDays(-1) })],
      now: NOW,
    });
    expect(result).toEqual([]);
  });

  it("negeert een niet-geverifieerd certificaat", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab()],
      credentials: [cred({ status: "SUBMITTED", expiresAt: inDays(5) })],
      now: NOW,
    });
    expect(result).toEqual([]);
  });

  it("groepeert meerdere samenwerkingen die hetzelfde certificaat vereisen in één concern", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [
        collab({ collaborationId: "collab-1", companyName: "Zorggroep Noord" }),
        collab({ collaborationId: "collab-2", companyName: "Thuiszorg West" }),
      ],
      credentials: [cred({ expiresAt: inDays(8) })],
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.collaborations.map((c) => c.collaborationId)).toEqual([
      "collab-1",
      "collab-2",
    ]);
  });

  it("sorteert op de vroegste vervaldatum eerst", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab({ requiredTypes: ["VOG", "DIPLOMA"] })],
      credentials: [
        cred({ id: "cred-vog", type: "VOG", title: "VOG", expiresAt: inDays(20) }),
        cred({ id: "cred-dip", type: "DIPLOMA", title: "Diploma", expiresAt: inDays(3) }),
      ],
      now: NOW,
    });
    expect(result.map((r) => r.credentialId)).toEqual(["cred-dip", "cred-vog"]);
  });

  it("leunt op het laatst-vervallende geverifieerde certificaat van een type", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab()],
      credentials: [
        cred({ id: "cred-old", expiresAt: inDays(3) }),
        cred({ id: "cred-new", expiresAt: inDays(60) }), // vernieuwd → buiten venster
      ],
      now: NOW,
    });
    // De compliance leunt op cred-new (laatst-vervallend) → geen zorg meer.
    expect(result).toEqual([]);
  });

  it("dedupliceert een samenwerking die een type twee keer vereist", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab({ requiredTypes: ["VOG", "VOG"] })],
      credentials: [cred({ expiresAt: inDays(5) })],
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.collaborations).toHaveLength(1);
  });

  it("klemt daysUntilExpiry op 0 bij verval binnen 24 uur", () => {
    const result = collaborationCredentialExpiryConcerns({
      collaborations: [collab()],
      credentials: [cred({ expiresAt: new Date(NOW.getTime() + 6 * 60 * 60 * 1000) })],
      now: NOW,
    });
    expect(result[0]!.daysUntilExpiry).toBe(0);
  });
});

describe("collaborationExpiredRequiredCredentials", () => {
  it("markeert een REEDS verlopen vereist certificaat zonder geldige vervanger", () => {
    const result = collaborationExpiredRequiredCredentials({
      collaborations: [collab({ requiredTypes: ["CERTIFICATE"] })],
      credentials: [
        cred({
          id: "cred-cert",
          title: "BHV",
          type: "CERTIFICATE",
          status: "EXPIRED",
          expiresAt: inDays(-3),
        }),
      ],
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.credentialId).toBe("cred-cert");
    expect(result[0]!.type).toBe("CERTIFICATE");
    expect(result[0]!.collaborations).toEqual([
      {
        collaborationId: "collab-1",
        companyName: "Zorggroep Noord",
        jobTitle: "Wijkverpleegkundige",
      },
    ]);
  });

  it("markeert ook een VERIFIED certificaat dat de vervaldatum voorbij is (nog niet door de cron omgezet)", () => {
    const result = collaborationExpiredRequiredCredentials({
      collaborations: [collab({ requiredTypes: ["CERTIFICATE"] })],
      credentials: [
        cred({
          id: "cred-cert",
          title: "BHV",
          type: "CERTIFICATE",
          status: "VERIFIED",
          expiresAt: inDays(-1),
        }),
      ],
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.credentialId).toBe("cred-cert");
  });

  it("géén zorg wanneer er nog een geldig geverifieerd certificaat van het type is", () => {
    const result = collaborationExpiredRequiredCredentials({
      collaborations: [collab({ requiredTypes: ["CERTIFICATE"] })],
      credentials: [
        cred({
          id: "cred-old",
          title: "BHV",
          type: "CERTIFICATE",
          status: "EXPIRED",
          expiresAt: inDays(-30),
        }),
        cred({
          id: "cred-new",
          title: "BHV",
          type: "CERTIFICATE",
          status: "VERIFIED",
          expiresAt: inDays(200),
        }),
      ],
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });

  it("negeert een verlopen certificaat dat door geen enkele samenwerking wordt vereist", () => {
    const result = collaborationExpiredRequiredCredentials({
      collaborations: [collab({ requiredTypes: ["DIPLOMA"] })],
      credentials: [
        cred({
          id: "cred-cert",
          title: "BHV",
          type: "CERTIFICATE",
          status: "EXPIRED",
          expiresAt: inDays(-3),
        }),
      ],
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });

  it("kiest het meest recent verlopen exemplaar als vernieuw-kandidaat en dedupt samenwerkingen", () => {
    const result = collaborationExpiredRequiredCredentials({
      collaborations: [
        collab({ collaborationId: "c1", requiredTypes: ["CERTIFICATE"] }),
        collab({ collaborationId: "c2", companyName: "Andere BV", requiredTypes: ["CERTIFICATE"] }),
      ],
      credentials: [
        cred({
          id: "cred-old",
          title: "BHV",
          type: "CERTIFICATE",
          status: "EXPIRED",
          expiresAt: inDays(-30),
        }),
        cred({
          id: "cred-recent",
          title: "BHV",
          type: "CERTIFICATE",
          status: "EXPIRED",
          expiresAt: inDays(-2),
        }),
      ],
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.credentialId).toBe("cred-recent");
    expect(result[0]!.collaborations.map((c) => c.collaborationId)).toEqual(["c1", "c2"]);
  });
});
