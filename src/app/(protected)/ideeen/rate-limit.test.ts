// Volume-rem-contract voor de idee-engagement-mutaties (createIdea/toggleVote/addComment).
//
// De ideeën-hub is het enige open UGC-oppervlak: elke ingelogde gebruiker kan ideeën plaatsen, stemmen
// en reageren, met notificatie-fan-out naar de indiener. Anders dan élke andere UGC-mutatie in de
// codebase (message/application/invite/noshow) hadden deze drie geen rate-limit — een authenticated
// account kon een scripted flood draaien (notificatie-/DB-/audit-DoS + harassment). Deze test borgt dat
// de gedeelde `ideaEngagementRateLimiter` de write blokkeert zodra de bucket leeg is, en dat een
// toegestane check gewoon doorloopt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const rateCheck = vi.hoisted(() => vi.fn(async () => ({ allowed: true }) as { allowed: boolean }));
const ideaCreate = vi.hoisted(() => vi.fn(async () => ({ id: "idea-1" })));
const voteDeleteMany = vi.hoisted(() => vi.fn(async () => ({ count: 0 })));
const voteCreate = vi.hoisted(() => vi.fn(async () => ({ id: "vote-1" })));
const ideaFindUnique = vi.hoisted(() =>
  vi.fn(async () => ({ id: "idea-1", authorId: "other-1", title: "Titel" })),
);
const commentCreate = vi.hoisted(() => vi.fn(async () => ({ id: "comment-1" })));
const notificationCreate = vi.hoisted(() => vi.fn(async () => ({ id: "not-1" })));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: class AuthorizationError extends Error {},
  requireActor: vi.fn(async () => ({ id: "actor-1", role: "FREELANCER" })),
  requireRole: vi.fn(async () => ({ id: "actor-1", role: "ADMIN" })),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => undefined) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    idea: { create: ideaCreate, findUnique: ideaFindUnique },
    ideaVote: { deleteMany: voteDeleteMany, create: voteCreate },
    ideaComment: { create: commentCreate },
    notification: { create: notificationCreate },
  },
}));
vi.mock("@/lib/rate-limit", () => ({ ideaEngagementRateLimiter: { check: rateCheck } }));

import { createIdea, toggleVote, addComment } from "./actions";

function ideaForm(): FormData {
  const fd = new FormData();
  fd.set("title", "Een duidelijke titel");
  fd.set("description", "Een idee met genoeg detail om te valideren.");
  fd.set("audience", "PLATFORM");
  return fd;
}

function commentForm(): FormData {
  const fd = new FormData();
  fd.set("body", "Een korte reactie.");
  return fd;
}

describe("idee-engagement rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateCheck.mockResolvedValue({ allowed: true });
    voteDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("createIdea geweigerd bij bereikte limiet — geen idee-write", async () => {
    rateCheck.mockResolvedValueOnce({ allowed: false });
    const res = await createIdea(undefined, ideaForm());
    expect(res?.error).toMatch(/te veel/i);
    expect(ideaCreate).not.toHaveBeenCalled();
    expect(rateCheck).toHaveBeenCalledWith("actor-1");
  });

  it("createIdea loopt door wanneer toegestaan", async () => {
    const res = await createIdea(undefined, ideaForm());
    expect(res?.ok).toBe(true);
    expect(ideaCreate).toHaveBeenCalledTimes(1);
  });

  it("toggleVote is een stille no-op bij bereikte limiet — geen stem-mutatie", async () => {
    rateCheck.mockResolvedValueOnce({ allowed: false });
    await toggleVote("idea-1");
    expect(voteDeleteMany).not.toHaveBeenCalled();
    expect(voteCreate).not.toHaveBeenCalled();
  });

  it("toggleVote loopt door wanneer toegestaan", async () => {
    await toggleVote("idea-1");
    expect(voteDeleteMany).toHaveBeenCalledTimes(1);
    expect(voteCreate).toHaveBeenCalledTimes(1);
  });

  it("addComment is een stille no-op bij bereikte limiet — geen reactie + geen notificatie", async () => {
    rateCheck.mockResolvedValueOnce({ allowed: false });
    await addComment("idea-1", commentForm());
    expect(commentCreate).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
  });

  it("addComment loopt door wanneer toegestaan — reactie + notificatie naar indiener", async () => {
    await addComment("idea-1", commentForm());
    expect(commentCreate).toHaveBeenCalledTimes(1);
    expect(notificationCreate).toHaveBeenCalledTimes(1);
  });
});
