import { describe, it, expect } from "vitest";
import { complianceCsv } from "@/lib/collaboration-compliance-csv";
import { type ClientCredentialAlert } from "@/lib/collaboration-alerts";

const HEADER =
  "ZZP'er;Opdracht;Status;Ontbrekend;Verlopen;Verloopt binnenkort;Verloopt tijdens opdracht;In beoordeling";

function alert(over: Partial<ClientCredentialAlert> = {}): ClientCredentialAlert {
  return {
    collaborationId: "c1",
    jobId: "j1",
    jobTitle: "Nachtdienst VVT",
    freelancerName: "Sanne de Vries",
    alert: {
      status: "NON_COMPLIANT",
      missing: [],
      expired: [],
      expiringSoon: [],
      expiringDuringPlacement: [],
      inReview: [],
    },
    ...over,
  };
}

describe("complianceCsv", () => {
  it("schrijft de vaste kopregel", () => {
    expect(complianceCsv([]).split("\r\n")[0]).toBe(HEADER);
  });

  it("geeft bij geen meldingen alleen de kopregel terug", () => {
    expect(complianceCsv([])).toBe(HEADER);
  });

  it("serialiseert een ontbrekend-certificaat-melding als NON_COMPLIANT-rij", () => {
    const rows = [
      alert({
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG", "DIPLOMA"],
          expired: [],
          expiringSoon: [],
          expiringDuringPlacement: [],
          inReview: [],
        },
      }),
    ];
    const lines = complianceCsv(rows).split("\r\n");
    expect(lines[1]).toBe("Sanne de Vries;Nachtdienst VVT;Actie vereist;VOG, Diploma;;;;");
    expect(lines).toHaveLength(2);
  });

  it("mapt WARNING naar 'Let op' en vult de juiste kolommen", () => {
    const rows = [
      alert({
        freelancerName: "Job Bakker",
        alert: {
          status: "WARNING",
          missing: [],
          expired: [],
          expiringSoon: ["CERTIFICATE"],
          expiringDuringPlacement: [],
          inReview: ["INSURANCE"],
        },
      }),
    ];
    const lines = complianceCsv(rows).split("\r\n");
    // Kolommen: Ontbrekend en Verlopen leeg; Verloopt binnenkort = Certificaat; In beoordeling = Verzekering.
    expect(lines[1]).toBe("Job Bakker;Nachtdienst VVT;Let op;;;Certificaat;;Verzekering");
  });

  it("vult de 'Verloopt tijdens opdracht'-kolom (einddatum-verankerd verval)", () => {
    const rows = [
      alert({
        freelancerName: "Piet Jansen",
        alert: {
          status: "WARNING",
          missing: [],
          expired: [],
          expiringSoon: [],
          expiringDuringPlacement: ["VOG"],
          inReview: [],
        },
      }),
    ];
    const lines = complianceCsv(rows).split("\r\n");
    // Alleen de nieuwe, één-na-laatste kolom is gevuld.
    expect(lines[1]).toBe("Piet Jansen;Nachtdienst VVT;Let op;;;;VOG;");
  });

  it("behoudt de aangeleverde volgorde (de route sorteert al op triage)", () => {
    const rows = [alert({ freelancerName: "Bravo" }), alert({ freelancerName: "Alfa" })];
    const lines = complianceCsv(rows).split("\r\n");
    expect(lines[1]!.startsWith("Bravo;")).toBe(true);
    expect(lines[2]!.startsWith("Alfa;")).toBe(true);
  });

  it("beveiligt tegen formule-injectie in een opdrachttitel/naam van derden (CWE-1236)", () => {
    const rows = [
      alert({
        freelancerName: "=WEBSERVICE(1)",
        jobTitle: "Reguliere dienst",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG"],
          expired: [],
          expiringSoon: [],
          expiringDuringPlacement: [],
          inReview: [],
        },
      }),
    ];
    const lines = complianceCsv(rows).split("\r\n");
    // Cel die met '=' begint krijgt een voorloopse apostrof; geen scheidingsteken/quote/newline erin.
    expect(lines[1]).toBe("'=WEBSERVICE(1);Reguliere dienst;Actie vereist;VOG;;;;");
  });
});
