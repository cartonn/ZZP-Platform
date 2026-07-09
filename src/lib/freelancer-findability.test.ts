import { describe, it, expect } from "vitest";
import { summarizeFindability } from "@/lib/freelancer-findability";

describe("summarizeFindability", () => {
  it("markeert een privé-profiel als niet vindbaar (hidden) — zichtbaarheid is de harde poort", () => {
    const s = summarizeFindability({ isPublic: false, hasSkills: true, hasAvailability: true });
    expect(s.level).toBe("hidden");
    expect(s.discoverable).toBe(false);
    expect(s.headline).toBe("Opdrachtgevers kunnen je nu niet vinden");
    expect(s.blocker).toContain("openbaar");
    expect(s.href).toBe("#zichtbaarheid");
  });

  it("prioriteert de zichtbaarheid-blokkade boven ontbrekende skills/beschikbaarheid", () => {
    const s = summarizeFindability({ isPublic: false, hasSkills: false, hasAvailability: false });
    expect(s.level).toBe("hidden");
    expect(s.href).toBe("#zichtbaarheid");
  });

  it("is 'limited' bij een openbaar profiel zonder vaardigheden", () => {
    const s = summarizeFindability({ isPublic: true, hasSkills: false, hasAvailability: true });
    expect(s.level).toBe("limited");
    expect(s.discoverable).toBe(true);
    expect(s.href).toBe("#vaardigheden");
    expect(s.blocker).toContain("vaardigheid");
  });

  it("is 'limited' bij een openbaar profiel met skills maar zonder beschikbaarheid", () => {
    const s = summarizeFindability({ isPublic: true, hasSkills: true, hasAvailability: false });
    expect(s.level).toBe("limited");
    expect(s.href).toBe("/beschikbaarheid");
    expect(s.blocker).toContain("beschikbaarheid");
  });

  it("is 'visible' wanneer alles op orde is — geen blokkade", () => {
    const s = summarizeFindability({ isPublic: true, hasSkills: true, hasAvailability: true });
    expect(s.level).toBe("visible");
    expect(s.discoverable).toBe(true);
    expect(s.blocker).toBeNull();
    expect(s.href).toBeNull();
    expect(s.headline).toBe("Je bent goed vindbaar voor opdrachtgevers");
  });

  it("geeft altijd drie factoren in vaste prioriteitsvolgorde met de juiste done-vlaggen", () => {
    const s = summarizeFindability({ isPublic: true, hasSkills: false, hasAvailability: true });
    expect(s.factors.map((f) => f.key)).toEqual(["visibility", "skills", "availability"]);
    expect(s.factors.map((f) => f.done)).toEqual([true, false, true]);
  });
});
