import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { credentials, freelancers, collaborations } = vi.hoisted(() => ({
  credentials: vi.fn(),
  freelancers: vi.fn(),
  collaborations: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    credential: { count: credentials },
    freelancerProfile: { count: freelancers },
    collaboration: { count: collaborations },
  },
}));

import { getPublicTrustStats, trustHighlights } from "./public-trust";

beforeEach(() => {
  vi.clearAllMocks();
  credentials.mockResolvedValue(24);
  freelancers.mockResolvedValue(15);
  collaborations.mockResolvedValue(7);
});
afterEach(() => vi.unstubAllEnvs());

describe("public counts", () => {
  it("omits demo counts without querying the demo dataset", async () => {
    vi.stubEnv("SEED_DEMO", "true");
    const stats = await getPublicTrustStats();
    expect(trustHighlights(stats)).toEqual([]);
    expect(credentials).not.toHaveBeenCalled();
    expect(freelancers).not.toHaveBeenCalled();
    expect(collaborations).not.toHaveBeenCalled();
  });

  it("uses database counts when demo seeding is disabled", async () => {
    vi.stubEnv("SEED_DEMO", "false");
    expect(await getPublicTrustStats()).toEqual({
      verifiedCredentials: 24,
      verifiedFreelancers: 15,
      completedCollaborations: 7,
    });
  });
});

describe("trustHighlights", () => {
  it("toont niets onder de betekenis-drempels", () => {
    expect(
      trustHighlights({
        verifiedCredentials: 9,
        verifiedFreelancers: 4,
        completedCollaborations: 4,
      }),
    ).toEqual([]);
  });

  it("toont een cijfer zodra het zijn drempel haalt", () => {
    const h = trustHighlights({
      verifiedCredentials: 10,
      verifiedFreelancers: 4,
      completedCollaborations: 4,
    });
    expect(h).toEqual([{ value: 10, label: "geverifieerde certificaten" }]);
  });

  it("toont alle hoogtepunten in vaste volgorde", () => {
    const h = trustHighlights({
      verifiedCredentials: 42,
      verifiedFreelancers: 12,
      completedCollaborations: 7,
    });
    expect(h.map((x) => x.label)).toEqual([
      "geverifieerde certificaten",
      "geverifieerde ZZP'ers",
      "afgeronde samenwerkingen",
    ]);
    expect(h.map((x) => x.value)).toEqual([42, 12, 7]);
  });
});
