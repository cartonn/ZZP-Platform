import { describe, expect, it } from "vitest";
import {
  assessCollaborationCredentials,
  clientCredentialAlertsFromRows,
  clientHasComplianceAction,
  describeCredentialAlert,
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
});

describe("clientHasComplianceAction", () => {
  const base: CredentialAlert = {
    status: "WARNING",
    missing: [],
    expired: [],
    expiringSoon: [],
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
  it("benoemt het type en de opdracht in begrijpelijk Nederlands", () => {
    const text = describeCredentialAlert("Jan", "Dakproject", {
      status: "WARNING",
      missing: [],
      expired: [],
      expiringSoon: ["VOG"],
      inReview: [],
    });
    expect(text).toBe("Certificaat van Jan verloopt binnenkort (VOG) — Dakproject");
  });
});

describe("summarizeClientCompliance", () => {
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
      inReview: 0,
    });
  });

  it("splitst NON_COMPLIANT en WARNING correct over meerdere samenwerkingen", () => {
    const alerts: ClientCredentialAlert[] = [
      makeAlert({
        collaborationId: "c1",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG"],
          expired: [],
          expiringSoon: [],
          inReview: [],
        },
      }),
      makeAlert({
        collaborationId: "c2",
        alert: {
          status: "WARNING",
          missing: [],
          expired: [],
          expiringSoon: ["INSURANCE"],
          inReview: [],
        },
      }),
      makeAlert({
        collaborationId: "c3",
        alert: {
          status: "NON_COMPLIANT",
          missing: [],
          expired: ["DIPLOMA"],
          expiringSoon: [],
          inReview: [],
        },
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
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG"],
          expired: [],
          expiringSoon: [],
          inReview: [],
        },
      }),
      makeAlert({
        collaborationId: "c2",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["INSURANCE"],
          expired: ["DIPLOMA"],
          expiringSoon: [],
          inReview: [],
        },
      }),
    ];
    const snap = summarizeClientCompliance(alerts);
    expect(snap.missing).toBe(2);
    expect(snap.expired).toBe(1);
    expect(snap.expiringSoon).toBe(0);
    expect(snap.inReview).toBe(0);
  });

  it("muteert de invoer niet (bevroren array)", () => {
    const alerts: ClientCredentialAlert[] = [
      makeAlert({
        alert: { status: "WARNING", missing: [], expired: [], expiringSoon: [], inReview: ["VOG"] },
      }),
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
  }): CollaborationAlertRow => ({
    id: o.id,
    disputedAt: o.disputedAt ?? null,
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
