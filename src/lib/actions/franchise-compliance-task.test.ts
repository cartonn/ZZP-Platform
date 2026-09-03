// Pure builder-test voor `franchiseComplianceRippleTask` (bemiddelaar-tegenhanger van
// `clientComplianceTask`): borgt de titel-varianten per alert-dimensie, de gap/warning-prioriteitsband,
// de deep-link en de company-in-subtitle — zonder DB. De cross-surface-integratie (de taak verschijnt in
// /acties) staat in pending-tasks-franchiser.test.ts.

import { describe, it, expect } from "vitest";
import { franchiseComplianceRippleTask } from "@/lib/actions/tasks";
import { P } from "@/lib/next-actions";
import { type CredentialAlert } from "@/lib/collaboration-alerts";
import { type CredentialType } from "@/lib/enums";

const alert = (partial: Partial<CredentialAlert>): CredentialAlert => ({
  status: "NON_COMPLIANT",
  missing: [],
  expired: [],
  expiringSoon: [],
  expiringDuringPlacement: [],
  inReview: [],
  ...partial,
});

const build = (a: CredentialAlert) =>
  franchiseComplianceRippleTask("collab-1", "Sanne", "Nachtdienst", "ZorgGroep Midden", a);

describe("franchiseComplianceRippleTask", () => {
  it("ontbrekend certificaat → gap-band, deep-link, company in subtitle", () => {
    const t = build(alert({ status: "NON_COMPLIANT", missing: ["VOG" as CredentialType] }));
    expect(t.kind).toBe("franchise-compliance");
    expect(t.id).toBe("franchise-compliance:collab-1");
    expect(t.href).toBe("/franchise/samenwerkingen");
    expect(t.tone).toBe("attention");
    expect(t.priority).toBe(P.franchiserComplianceRipple);
    expect(t.title).toContain("Sanne mist een vereist certificaat");
    expect(t.subtitle).toContain("ZorgGroep Midden");
    expect(t.subtitle).toContain("Nachtdienst");
  });

  it("verlopen certificaat → gap-band met verlopen-tekst", () => {
    const t = build(alert({ status: "NON_COMPLIANT", expired: ["INSURANCE" as CredentialType] }));
    expect(t.priority).toBe(P.franchiserComplianceRipple);
    expect(t.title).toContain("is verlopen");
  });

  it("binnenkort verlopend → warning-band", () => {
    const t = build(alert({ status: "WARNING", expiringSoon: ["DIPLOMA" as CredentialType] }));
    expect(t.priority).toBe(P.franchiserComplianceWarning);
    expect(t.title).toContain("verloopt binnenkort");
  });

  it("verloopt vóór het einde van de plaatsing → warning-band, plaatsing-tekst", () => {
    const t = build(
      alert({ status: "WARNING", expiringDuringPlacement: ["LICENSE" as CredentialType] }),
    );
    expect(t.priority).toBe(P.franchiserComplianceWarning);
    expect(t.title).toContain("vóór het einde van de plaatsing");
  });

  it("gap + in-beoordeling → het gat wint (titel = ontbreekt, gap-band)", () => {
    const t = build(
      alert({
        status: "NON_COMPLIANT",
        missing: ["VOG" as CredentialType],
        inReview: ["CERTIFICATE" as CredentialType],
      }),
    );
    expect(t.title).toContain("mist een vereist certificaat");
    expect(t.priority).toBe(P.franchiserComplianceRipple);
  });
});
