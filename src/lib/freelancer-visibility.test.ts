import { describe, expect, it } from "vitest";
import { discoverableFreelancerWhere } from "@/lib/freelancer-visibility";

describe("discoverableFreelancerWhere (publiek vindbaar = PUBLIC + ACTIVE)", () => {
  it("eist zowel een publiek profiel als een actief account", () => {
    expect(discoverableFreelancerWhere).toEqual({
      visibility: "PUBLIC",
      user: { status: "ACTIVE" },
    });
  });

  it("sluit een geschorst/geanonimiseerd account uit via de account-statusfilter", () => {
    // Een geschorste ZZP'er (no-show-uitschrijving) en een geanonimiseerd account hebben beide
    // status SUSPENDED — de filter eist ACTIVE, dus geen van beide is voor opdrachtgevers vindbaar.
    expect(discoverableFreelancerWhere.user.status).toBe("ACTIVE");
    expect(discoverableFreelancerWhere.user.status).not.toBe("SUSPENDED");
  });

  it("blijft alleen-publieke profielen tonen (privé profiel blijft verborgen)", () => {
    expect(discoverableFreelancerWhere.visibility).toBe("PUBLIC");
  });
});
