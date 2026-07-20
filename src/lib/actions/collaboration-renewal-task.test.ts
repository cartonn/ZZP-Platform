// Unit-tests voor de item-taak `collaborationRenewalTask` (vervolgsignaal als next-action). De
// fase/dagen komen uit de reeds-geteste pure `summarizeCollaborationRenewal`; hier borgen we dat de
// taak die correct naar titel/subtitel/toon/prioriteit/deep-link vertaalt voor beide rollen. Zo tonen
// /acties, de zijbalk-badge en de dashboard-rail exact dezelfde, met het detail consistente, actie.

import { describe, it, expect } from "vitest";
import { collaborationRenewalTask } from "@/lib/actions/tasks";
import { P } from "@/lib/next-actions";

describe("collaborationRenewalTask", () => {
  it("ending_soon → info, stabiele id + deep-link naar het detail", () => {
    const t = collaborationRenewalTask(
      "collab-1",
      "CLIENT",
      "Sanne",
      "Verpleegkundige nachtdienst",
      "ending_soon",
      5,
    );
    expect(t.kind).toBe("collaboration-renewal");
    expect(t.id).toBe("collaboration-renewal:collab-1");
    expect(t.href).toBe("/samenwerkingen/collab-1");
    expect(t.tone).toBe("info");
    expect(t.priority).toBe(P.collaborationRenewal);
    expect(t.resolver).toBe("link");
    expect(t.title).toBe("Plan een vervolg met Sanne");
    expect(t.subtitle).toBe("Verpleegkundige nachtdienst · loopt over 5 dagen af");
  });

  it("overdue → attention met verstreken-bewoording", () => {
    const t = collaborationRenewalTask(
      "collab-2",
      "FREELANCER",
      "ZorgGroep Midden B.V.",
      "Wijkverpleging",
      "overdue",
      -3,
    );
    expect(t.tone).toBe("attention");
    expect(t.title).toBe("Plan een vervolg met ZorgGroep Midden B.V.");
    expect(t.subtitle).toBe("Wijkverpleging · einddatum verstreken");
  });

  it("dag-grenzen: vandaag/morgen krijgen eigen bewoording", () => {
    expect(
      collaborationRenewalTask("c", "CLIENT", "X", "Opdracht", "ending_soon", 0).subtitle,
    ).toBe("Opdracht · loopt vandaag af");
    expect(
      collaborationRenewalTask("c", "CLIENT", "X", "Opdracht", "ending_soon", 1).subtitle,
    ).toBe("Opdracht · loopt morgen af");
    expect(
      collaborationRenewalTask("c", "CLIENT", "X", "Opdracht", "ending_soon", 2).subtitle,
    ).toBe("Opdracht · loopt over 2 dagen af");
  });

  it("draagt de rol mee (voor rol-specifieke afhandeling op het detail)", () => {
    expect(collaborationRenewalTask("c", "CLIENT", "X", "O", "ending_soon", 4)).toMatchObject({
      role: "CLIENT",
    });
    expect(collaborationRenewalTask("c", "FREELANCER", "X", "O", "ending_soon", 4)).toMatchObject({
      role: "FREELANCER",
    });
  });
});
