import { describe, it, expect } from "vitest";
import {
  activePlacementImpact,
  type QueuedCredentialRef,
  type ActivePlacementRequirement,
  type CoveredCredentialType,
} from "./verification-placement-impact";

const q = (id: string, freelancerProfileId: string, type: QueuedCredentialRef["type"]) => ({
  id,
  freelancerProfileId,
  type,
});

describe("activePlacementImpact", () => {
  it("markeert een inzending die een lopende inzet met een ongedekt vereist type deblokkeert", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "VOG")];
    const placements: ActivePlacementRequirement[] = [
      { freelancerProfileId: "f1", requiredTypes: ["VOG"] },
    ];
    const impact = activePlacementImpact(queue, placements, []);
    expect(impact.get("cred1")).toBe(1);
  });

  it("telt niet mee wanneer het type al geldig geverifieerd is (geen gat)", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "VOG")];
    const placements: ActivePlacementRequirement[] = [
      { freelancerProfileId: "f1", requiredTypes: ["VOG"] },
    ];
    const covered: CoveredCredentialType[] = [{ freelancerProfileId: "f1", type: "VOG" }];
    const impact = activePlacementImpact(queue, placements, covered);
    expect(impact.has("cred1")).toBe(false);
  });

  it("telt distinct lopende inzetten die hetzelfde ongedekte type vereisen", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "VOG")];
    const placements: ActivePlacementRequirement[] = [
      { freelancerProfileId: "f1", requiredTypes: ["VOG", "DIPLOMA"] },
      { freelancerProfileId: "f1", requiredTypes: ["VOG"] },
    ];
    const impact = activePlacementImpact(queue, placements, []);
    expect(impact.get("cred1")).toBe(2);
  });

  it("dedupt een dubbel vermelde eis binnen één inzet (telt als één inzet)", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "VOG")];
    const placements: ActivePlacementRequirement[] = [
      { freelancerProfileId: "f1", requiredTypes: ["VOG", "VOG"] },
    ];
    const impact = activePlacementImpact(queue, placements, []);
    expect(impact.get("cred1")).toBe(1);
  });

  it("negeert inzetten van een andere ZZP'er", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "VOG")];
    const placements: ActivePlacementRequirement[] = [
      { freelancerProfileId: "f2", requiredTypes: ["VOG"] },
    ];
    expect(activePlacementImpact(queue, placements, []).has("cred1")).toBe(false);
  });

  it("markeert niets zonder lopende inzetten", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "VOG"), q("cred2", "f2", "DIPLOMA")];
    expect(activePlacementImpact(queue, [], []).size).toBe(0);
  });

  it("markeert alleen het matchende type, niet een ander ingediend type van dezelfde ZZP'er", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "VOG"), q("cred2", "f1", "DIPLOMA")];
    const placements: ActivePlacementRequirement[] = [
      { freelancerProfileId: "f1", requiredTypes: ["VOG"] },
    ];
    const impact = activePlacementImpact(queue, placements, []);
    expect(impact.get("cred1")).toBe(1);
    expect(impact.has("cred2")).toBe(false);
  });

  it("dekking van het ene type blokkeert de telling van een ander ongedekt type niet", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "DIPLOMA")];
    const placements: ActivePlacementRequirement[] = [
      { freelancerProfileId: "f1", requiredTypes: ["VOG", "DIPLOMA"] },
    ];
    const covered: CoveredCredentialType[] = [{ freelancerProfileId: "f1", type: "VOG" }];
    const impact = activePlacementImpact(queue, placements, covered);
    expect(impact.get("cred1")).toBe(1);
  });

  it("muteert de invoer niet", () => {
    const queue: QueuedCredentialRef[] = [q("cred1", "f1", "VOG")];
    const placements: ActivePlacementRequirement[] = [
      { freelancerProfileId: "f1", requiredTypes: ["VOG"] },
    ];
    const frozen = Object.freeze(placements);
    expect(() => activePlacementImpact(queue, frozen, [])).not.toThrow();
  });
});
