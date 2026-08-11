// Unit-tests voor de item-taak `franchiseCollaborationRenewalTask` (vervolgsignaal voor de
// bemiddelaar). De fase/dagen komen uit de reeds-geteste pure `summarizeCollaborationRenewal`; hier
// borgen we dat de taak die correct naar titel/subtitel/toon/prioriteit/deep-link vertaalt. Anders dan
// de partij-taak (`collaborationRenewalTask`) toont de bemiddelaar beide kanten (ZZP'er + opdrachtgever)
// en deep-linkt hij naar het franchise-toezichtoverzicht (er is geen bemiddelaar-detail per inzet).

import { describe, it, expect } from "vitest";
import { franchiseCollaborationRenewalTask } from "@/lib/actions/tasks";
import { P } from "@/lib/next-actions";

describe("franchiseCollaborationRenewalTask", () => {
  it("ending_soon → info, stabiele id + deep-link naar het franchise-overzicht", () => {
    const t = franchiseCollaborationRenewalTask(
      "collab-1",
      "Sanne",
      "ZorgGroep Midden",
      "Verpleegkundige nachtdienst",
      "ending_soon",
      5,
    );
    expect(t.kind).toBe("franchise-collaboration-renewal");
    expect(t.id).toBe("franchise-collaboration-renewal:collab-1");
    expect(t.href).toBe("/franchise/samenwerkingen?status=ACTIVE");
    expect(t.tone).toBe("info");
    expect(t.priority).toBe(P.franchiserCollaborationRenewal);
    expect(t.resolver).toBe("link");
    expect(t.title).toBe("Plan een vervolg: Sanne bij ZorgGroep Midden");
    expect(t.subtitle).toBe("Verpleegkundige nachtdienst · loopt over 5 dagen af");
  });

  it("overdue → attention met verstreken-bewoording", () => {
    const t = franchiseCollaborationRenewalTask(
      "collab-2",
      "Mark",
      "ZorgGroep Midden",
      "Wijkverpleging",
      "overdue",
      -3,
    );
    expect(t.tone).toBe("attention");
    expect(t.title).toBe("Plan een vervolg: Mark bij ZorgGroep Midden");
    expect(t.subtitle).toBe("Wijkverpleging · einddatum verstreken");
  });

  it("dag-grenzen: vandaag/morgen krijgen eigen bewoording", () => {
    expect(
      franchiseCollaborationRenewalTask("c", "X", "Y", "Opdracht", "ending_soon", 0).subtitle,
    ).toBe("Opdracht · loopt vandaag af");
    expect(
      franchiseCollaborationRenewalTask("c", "X", "Y", "Opdracht", "ending_soon", 1).subtitle,
    ).toBe("Opdracht · loopt morgen af");
    expect(
      franchiseCollaborationRenewalTask("c", "X", "Y", "Opdracht", "ending_soon", 2).subtitle,
    ).toBe("Opdracht · loopt over 2 dagen af");
  });

  it("prioriteit onder de open-dienst-taken, boven een koude lead", () => {
    expect(P.franchiserCollaborationRenewal).toBeLessThan(P.franchiserServiceStaleRollup);
    expect(P.franchiserCollaborationRenewal).toBeGreaterThan(P.franchiserLeadFollowup);
  });
});
