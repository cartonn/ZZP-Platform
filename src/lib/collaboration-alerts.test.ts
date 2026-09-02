import { describe, expect, it } from "vitest";
import {
  assessCollaborationCredentials,
  clientCredentialAlertsFromRows,
  clientHasComplianceAction,
  describeCredentialAlert,
  shortCredentialAlert,
  summarizeClientCompliance,
  type CredentialAlert,
  type ClientCredentialAlert,
  type CollaborationAlertRow,
} from "./collaboration-alerts";
import { type FreelancerCredential } from "./matching";

const now = new Date("2026-05-26T00:00:00Z");
const inDays = (d: number) => new Date(now.getTime() + d * 86_400_000);

describe("assessCollaborationCredentials", () => {
  it("is COMPLIANT als alle vereiste certificaten geldig en niet bijna verlopen zijn", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(200) },
      { type: "DIPLOMA", status: "VERIFIED", expiresAt: null },
    ];
    const r = assessCollaborationCredentials(["VOG", "DIPLOMA"], creds, now);
    expect(r.status).toBe("COMPLIANT");
    expect(r.expiringDuringPlacement).toEqual([]);
  });

  it("is NON_COMPLIANT bij een ontbrekend vereist certificaat", () => {
    const r = assessCollaborationCredentials(["VOG"], [], now);
    expect(r.status).toBe("NON_COMPLIANT");
    expect(r.missing).toEqual(["VOG"]);
  });

  it("is NON_COMPLIANT bij een verlopen vereist certificaat", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(-1) },
    ];
    const r = assessCollaborationCredentials(["VOG"], creds, now);
    expect(r.status).toBe("NON_COMPLIANT");
    expect(r.expired).toEqual(["VOG"]);
  });

  it("waarschuwt (WARNING) als een geldig certificaat binnenkort verloopt", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(10) },
    ];
    const r = assessCollaborationCredentials(["VOG"], creds, now);
    expect(r.status).toBe("WARNING");
    expect(r.expiringSoon).toEqual(["VOG"]);
  });

  it("waarschuwt niet als een tweede, langlopend certificaat de dekking behoudt", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(10) },
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(400) },
    ];
    const r = assessCollaborationCredentials(["VOG"], creds, now);
    expect(r.status).toBe("COMPLIANT");
    expect(r.expiringSoon).toEqual([]);
  });

  it("is WARNING als een vereist certificaat nog in beoordeling is", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "SUBMITTED", expiresAt: null }];
    const r = assessCollaborationCredentials(["VOG"], creds, now);
    expect(r.status).toBe("WARNING");
    expect(r.inReview).toEqual(["VOG"]);
  });

  describe("einddatum-verankerd (expiringDuringPlacement)", () => {
    it("waarschuwt als een certificaat ná het 30-daagse venster maar vóór het einde van de opdracht verloopt", () => {
      // Verloopt over 60 dagen (buiten het venster) terwijl de plaatsing pas over 120 dagen eindigt.
      const creds: FreelancerCredential[] = [
        { type: "VOG", status: "VERIFIED", expiresAt: inDays(60) },
      ];
      const r = assessCollaborationCredentials(["VOG"], creds, now, undefined, inDays(120));
      expect(r.status).toBe("WARNING");
      expect(r.expiringDuringPlacement).toEqual(["VOG"]);
      expect(r.expiringSoon).toEqual([]); // niet in het klassieke venster
    });

    it("waarschuwt niet zonder placementEnd (klassieke gedrag blijft; het venster sloeg dit stil over)", () => {
      const creds: FreelancerCredential[] = [
        { type: "VOG", status: "VERIFIED", expiresAt: inDays(60) },
      ];
      const r = assessCollaborationCredentials(["VOG"], creds, now);
      expect(r.status).toBe("COMPLIANT");
      expect(r.expiringDuringPlacement).toEqual([]);
    });

    it("waarschuwt niet als het certificaat de plaatsing overleeft (verval ná de einddatum)", () => {
      const creds: FreelancerCredential[] = [
        { type: "VOG", status: "VERIFIED", expiresAt: inDays(200) },
      ];
      const r = assessCollaborationCredentials(["VOG"], creds, now, undefined, inDays(120));
      expect(r.status).toBe("COMPLIANT");
      expect(r.expiringDuringPlacement).toEqual([]);
    });

    it("telt niet dubbel: binnen het venster blijft het expiringSoon, niet expiringDuringPlacement", () => {
      const creds: FreelancerCredential[] = [
        { type: "VOG", status: "VERIFIED", expiresAt: inDays(10) },
      ];
      const r = assessCollaborationCredentials(["VOG"], creds, now, undefined, inDays(120));
      expect(r.expiringSoon).toEqual(["VOG"]);
      expect(r.expiringDuringPlacement).toEqual([]);
    });

    it("negeert een certificaat zonder vervaldatum (dekt de hele plaatsing)", () => {
      const creds: FreelancerCredential[] = [{ type: "VOG", status: "VERIFIED", expiresAt: null }];
      const r = assessCollaborationCredentials(["VOG"], creds, now, undefined, inDays(120));
      expect(r.status).toBe("COMPLIANT");
      expect(r.expiringDuringPlacement).toEqual([]);
    });

    it("waarschuwt niet als een tweede certificaat de plaatsing tot het einde dekt", () => {
      const creds: FreelancerCredential[] = [
        { type: "VOG", status: "VERIFIED", expiresAt: inDays(60) }, // vervalt tijdens de plaatsing
        { type: "VOG", status: "VERIFIED", expiresAt: inDays(400) }, // dekt door tot na het einde
      ];
      const r = assessCollaborationCredentials(["VOG"], creds, now, undefined, inDays(120));
      expect(r.status).toBe("COMPLIANT");
      expect(r.expiringDuringPlacement).toEqual([]);
    });

    it("geeft geen ruis op een reeds-verstreken einddatum (geen geldig certificaat vervalt vóór het verleden)", () => {
      const creds: FreelancerCredential[] = [
        { type: "VOG", status: "VERIFIED", expiresAt: inDays(60) },
      ];
      const r = assessCollaborationCredentials(["VOG"], creds, now, undefined, inDays(-10));
      expect(r.status).toBe("COMPLIANT");
      expect(r.expiringDuringPlacement).toEqual([]);
    });
  });
});

describe("clientHasComplianceAction", () => {
  const base: CredentialAlert = {
    status: "WARNING",
    missing: [],
    expired: [],
    expiringSoon: [],
    expiringDuringPlacement: [],
    inReview: [],
  };

  it("ja bij een ontbrekend certificaat (gap)", () => {
    expect(clientHasComplianceAction({ ...base, status: "NON_COMPLIANT", missing: ["VOG"] })).toBe(
      true,
    );
  });

  it("ja bij een verlopen certificaat (gap)", () => {
    expect(
      clientHasComplianceAction({ ...base, status: "NON_COMPLIANT", expired: ["INSURANCE"] }),
    ).toBe(true);
  });

  it("ja bij een binnenkort verlopend certificaat", () => {
    expect(clientHasComplianceAction({ ...base, expiringSoon: ["DIPLOMA"] })).toBe(true);
  });

  it("ja bij een certificaat dat tijdens de opdracht verloopt", () => {
    expect(clientHasComplianceAction({ ...base, expiringDuringPlacement: ["VOG"] })).toBe(true);
  });

  it("nee bij alleen in-beoordeling (verse indiening → admin is aan zet)", () => {
    expect(clientHasComplianceAction({ ...base, inReview: ["CERTIFICATE"] })).toBe(false);
  });

  it("ja als in-beoordeling samenvalt met een gat (het gat is de client-actie)", () => {
    expect(
      clientHasComplianceAction({
        ...base,
        status: "NON_COMPLIANT",
        missing: ["VOG"],
        inReview: ["CERTIFICATE"],
      }),
    ).toBe(true);
  });
});

describe("describeCredentialAlert", () => {
  const base: CredentialAlert = {
    status: "WARNING",
    missing: [],
    expired: [],
    expiringSoon: [],
    expiringDuringPlacement: [],
    inReview: [],
  };

  it("benoemt het type en de opdracht in begrijpelijk Nederlands", () => {
    const text = describeCredentialAlert("Jan", "Dakproject", { ...base, expiringSoon: ["VOG"] });
    expect(text).toBe("Certificaat van Jan verloopt binnenkort (VOG) — Dakproject");
  });

  it("meldt het einddatum-verankerde verval expliciet vóór het einde van de opdracht", () => {
    const text = describeCredentialAlert("Jan", "Dakproject", {
      ...base,
      expiringDuringPlacement: ["VOG"],
    });
    expect(text).toBe(
      "Certificaat van Jan verloopt vóór het einde van de opdracht (VOG) — Dakproject",
    );
  });

  it("shortCredentialAlert benoemt het verval tijdens de opdracht compact", () => {
    expect(shortCredentialAlert({ ...base, expiringDuringPlacement: ["VOG"] })).toBe(
      "Certificaat verloopt tijdens de opdracht (VOG)",
    );
  });
});

describe("summarizeClientCompliance", () => {
  const emptyAlert = (): ClientCredentialAlert["alert"] => ({
    status: "COMPLIANT",
    missing: [],
    expired: [],
    expiringSoon: [],
    expiringDuringPlacement: [],
    inReview: [],
  });

  const makeAlert = (
    overrides: Partial<ClientCredentialAlert> & { alert: ClientCredentialAlert["alert"] },
  ): ClientCredentialAlert => ({
    collaborationId: "collab-1",
    jobId: "job-1",
    jobTitle: "Testproject",
    freelancerName: "Jan",
    ...overrides,
  });

  it("geeft alle nullen terug bij een lege invoer", () => {
    const snap = summarizeClientCompliance([]);
    expect(snap).toEqual({
      total: 0,
      nonCompliant: 0,
      warning: 0,
      missing: 0,
      expired: 0,
      expiringSoon: 0,
      expiringDuringPlacement: 0,
      inReview: 0,
    });
  });

  it("splitst NON_COMPLIANT en WARNING correct over meerdere samenwerkingen", () => {
    const alerts: ClientCredentialAlert[] = [
      makeAlert({
        collaborationId: "c1",
        alert: { ...emptyAlert(), status: "NON_COMPLIANT", missing: ["VOG"] },
      }),
      makeAlert({
        collaborationId: "c2",
        alert: { ...emptyAlert(), status: "WARNING", expiringSoon: ["INSURANCE"] },
      }),
      makeAlert({
        collaborationId: "c3",
        alert: { ...emptyAlert(), status: "NON_COMPLIANT", expired: ["DIPLOMA"] },
      }),
    ];
    const snap = summarizeClientCompliance(alerts);
    expect(snap.total).toBe(3);
    expect(snap.nonCompliant).toBe(2);
    expect(snap.warning).toBe(1);
  });

  it("telt type-aantallen op over meerdere samenwerkingen", () => {
    const alerts: ClientCredentialAlert[] = [
      makeAlert({
        collaborationId: "c1",
        alert: { ...emptyAlert(), status: "NON_COMPLIANT", missing: ["VOG"] },
      }),
      makeAlert({
        collaborationId: "c2",
        alert: {
          ...emptyAlert(),
          status: "NON_COMPLIANT",
          missing: ["INSURANCE"],
          expired: ["DIPLOMA"],
        },
      }),
      makeAlert({
        collaborationId: "c3",
        alert: { ...emptyAlert(), status: "WARNING", expiringDuringPlacement: ["VOG"] },
      }),
    ];
    const snap = summarizeClientCompliance(alerts);
    expect(snap.missing).toBe(2);
    expect(snap.expired).toBe(1);
    expect(snap.expiringSoon).toBe(0);
    expect(snap.expiringDuringPlacement).toBe(1);
    expect(snap.inReview).toBe(0);
  });

  it("muteert de invoer niet (bevroren array)", () => {
    const alerts: ClientCredentialAlert[] = [
      makeAlert({ alert: { ...emptyAlert(), status: "WARNING", inReview: ["VOG"] } }),
    ];
    const frozen = Object.freeze(alerts);
    // Mag geen uitzondering gooien; retourwaarde is correct.
    const snap = summarizeClientCompliance(frozen);
    expect(snap.total).toBe(1);
    expect(snap.inReview).toBe(1);
  });
});

describe("clientCredentialAlertsFromRows", () => {
  const row = (o: {
    id: string;
    jobId: string;
    jobTitle: string;
    name: string | null;
    required: string[];
    creds: { type: string; status: string; expiresAt: Date | null }[];
    disputedAt?: Date | null;
    endDate?: Date | null;
  }): CollaborationAlertRow => ({
    id: o.id,
    disputedAt: o.disputedAt ?? null,
    endDate: o.endDate ?? null,
    job: {
      id: o.jobId,
      title: o.jobTitle,
      credentialRequirements: o.required.map((credentialType) => ({ credentialType })),
    },
    freelancer: { user: { name: o.name }, credentials: o.creds },
  });

  it("levert een melding op bij een ontbrekend vereist certificaat en vult alle velden", () => {
    const rows = [
      row({
        id: "collab-1",
        jobId: "job-1",
        jobTitle: "Dakproject",
        name: "Jan",
        required: ["VOG"],
        creds: [],
      }),
    ];
    const alerts = clientCredentialAlertsFromRows(rows, now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      collaborationId: "collab-1",
      jobId: "job-1",
      jobTitle: "Dakproject",
      freelancerName: "Jan",
    });
    expect(alerts[0]?.alert.status).toBe("NON_COMPLIANT");
    expect(alerts[0]?.alert.missing).toEqual(["VOG"]);
  });

  it("slaat samenwerkingen zonder vereiste certificaten en zonder gat over", () => {
    const rows = [
      row({
        id: "c-no-req",
        jobId: "j1",
        jobTitle: "Vrij",
        name: "A",
        required: [],
        creds: [],
      }),
      row({
        id: "c-compliant",
        jobId: "j2",
        jobTitle: "In orde",
        name: "B",
        required: ["VOG"],
        creds: [{ type: "VOG", status: "VERIFIED", expiresAt: inDays(300) }],
      }),
    ];
    expect(clientCredentialAlertsFromRows(rows, now)).toEqual([]);
  });

  it("waarschuwt via de einddatum: een certificaat dat vóór de plaatsing-einddatum verloopt (buiten het venster)", () => {
    const rows = [
      row({
        id: "c-placement",
        jobId: "j1",
        jobTitle: "Langlopend project",
        name: "Piet",
        required: ["VOG"],
        // Verloopt over 60 dagen (buiten het 30-daagse venster); de plaatsing loopt tot +120 dagen.
        creds: [{ type: "VOG", status: "VERIFIED", expiresAt: inDays(60) }],
        endDate: inDays(120),
      }),
    ];
    const alerts = clientCredentialAlertsFromRows(rows, now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.alert.status).toBe("WARNING");
    expect(alerts[0]?.alert.expiringDuringPlacement).toEqual(["VOG"]);
  });

  it("waarschuwt niet bij dezelfde situatie zonder einddatum (open-einde plaatsing)", () => {
    const rows = [
      row({
        id: "c-open",
        jobId: "j1",
        jobTitle: "Open-einde",
        name: "Piet",
        required: ["VOG"],
        creds: [{ type: "VOG", status: "VERIFIED", expiresAt: inDays(60) }],
        endDate: null,
      }),
    ];
    expect(clientCredentialAlertsFromRows(rows, now)).toEqual([]);
  });

  it("negeert een samenwerking in dispuut (bevroren werkproces → geen compliance-taak)", () => {
    // Een open dispuut zet disputedAt maar houdt status ACTIVE (cascade/dispute-commands.ts). Het
    // werkproces is dan bevroren (stage.ts → youAreUp:false); een compliance-ripple-next-action zou
    // de "Dispuut — bevroren"-fase op /samenwerkingen én het dashboard tegenspreken.
    const rows = [
      row({
        id: "collab-disputed",
        jobId: "job-1",
        jobTitle: "Dakproject",
        name: "Jan",
        required: ["VOG"],
        creds: [], // ontbrekend vereist certificaat → normaal NON_COMPLIANT-melding
        disputedAt: new Date("2026-05-20T00:00:00Z"),
      }),
    ];
    expect(clientCredentialAlertsFromRows(rows, now)).toEqual([]);
  });

  it("levert de melding wél op zodra het dispuut is opgeheven (disputedAt weer null)", () => {
    const rows = [
      row({
        id: "collab-resolved",
        jobId: "job-1",
        jobTitle: "Dakproject",
        name: "Jan",
        required: ["VOG"],
        creds: [],
        disputedAt: null,
      }),
    ];
    const alerts = clientCredentialAlertsFromRows(rows, now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.alert.status).toBe("NON_COMPLIANT");
  });

  it("valt terug op '—' als de ZZP'er geen naam heeft", () => {
    const rows = [
      row({
        id: "c1",
        jobId: "j1",
        jobTitle: "Klus",
        name: null,
        required: ["VOG"],
        creds: [],
      }),
    ];
    expect(clientCredentialAlertsFromRows(rows, now)[0]?.freelancerName).toBe("—");
  });
});
