// Defense-in-depth: het verplichtingen-paneel is CLIENT-only. Het gate't de rol nu zélf (naast de
// route/hub-gate), zodat een herbruikbaar servercomponent dat opdrachtgever-financiën laadt nooit
// data ophaalt/toont voor een verkeerde rol — ook niet als een toekomstige aanroeper de rol-gate
// vergeet. Bewijs rood→groen: zonder de self-gate zou een non-CLIENT `getObligationItemsForClient`
// aanroepen; met de gate valt het paneel terug op `null` vóór elke data-toegang.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const getObligationItemsForClient = vi.fn(async (_userId: string) => []);
vi.mock("@/lib/data/payment-obligations", () => ({
  getObligationItemsForClient: (userId: string) => getObligationItemsForClient(userId),
}));

import { VerplichtingenPanel } from "./verplichtingen-panel";

function actorWith(role: Actor["role"]): Actor {
  return { id: "user-1", role, status: "ACTIVE" };
}

describe("VerplichtingenPanel — rol-self-gate (defense-in-depth)", () => {
  beforeEach(() => {
    getObligationItemsForClient.mockClear();
  });

  it("rendert niets én laadt geen data voor een FREELANCER", async () => {
    const result = await VerplichtingenPanel({ actor: actorWith("FREELANCER") });
    expect(result).toBeNull();
    expect(getObligationItemsForClient).not.toHaveBeenCalled();
  });

  it("rendert niets én laadt geen data voor een ADMIN", async () => {
    const result = await VerplichtingenPanel({ actor: actorWith("ADMIN") });
    expect(result).toBeNull();
    expect(getObligationItemsForClient).not.toHaveBeenCalled();
  });

  it("laadt zelf de data voor een CLIENT en rendert het paneel (geen null)", async () => {
    const result = await VerplichtingenPanel({ actor: actorWith("CLIENT") });
    expect(result).not.toBeNull();
    expect(getObligationItemsForClient).toHaveBeenCalledWith("user-1");
  });

  it("gebruikt vooraf geladen items voor een CLIENT zonder extra query", async () => {
    const result = await VerplichtingenPanel({ actor: actorWith("CLIENT"), items: [] });
    expect(result).not.toBeNull();
    expect(getObligationItemsForClient).not.toHaveBeenCalled();
  });
});
