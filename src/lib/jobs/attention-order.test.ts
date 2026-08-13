import { describe, expect, it } from "vitest";
import {
  type ClientJobAttention,
  clientJobAttentionRank,
  sortJobsByAttention,
} from "./attention-order";

const NONE: ClientJobAttention = {
  fillTone: null,
  newApplications: false,
  vacancyAttention: false,
};

describe("clientJobAttentionRank", () => {
  it("geeft nul zonder enig signaal", () => {
    expect(clientJobAttentionRank(NONE)).toBe(0);
  });

  it("acuut onbezet staat als harde bovenste tier boven élke combinatie van de overige signalen", () => {
    const acuteOnly = clientJobAttentionRank({ ...NONE, fillTone: "acute" });
    const allButAcute = clientJobAttentionRank({
      fillTone: "soon",
      newApplications: true,
      vacancyAttention: true,
    });
    expect(acuteOnly).toBeGreaterThan(allButAcute);
  });

  it("nieuwe kandidaten wegen zwaarder dan een naderende (soon) start", () => {
    expect(clientJobAttentionRank({ ...NONE, newApplications: true })).toBeGreaterThan(
      clientJobAttentionRank({ ...NONE, fillTone: "soon" }),
    );
  });

  it("een naderende start weegt zwaarder dan een koud lopende vacature", () => {
    expect(clientJobAttentionRank({ ...NONE, fillTone: "soon" })).toBeGreaterThan(
      clientJobAttentionRank({ ...NONE, vacancyAttention: true }),
    );
  });

  it("telt meerdere signalen op zodat een opdracht met stapelende signalen hoger uitkomt", () => {
    const acutePlusNew = clientJobAttentionRank({
      fillTone: "acute",
      newApplications: true,
      vacancyAttention: false,
    });
    const acuteOnly = clientJobAttentionRank({ ...NONE, fillTone: "acute" });
    expect(acutePlusNew).toBeGreaterThan(acuteOnly);
  });
});

describe("sortJobsByAttention", () => {
  it("drijft opdrachten die actie vragen naar boven, gelijke rang behoudt binnenkomende volgorde", () => {
    // Binnenkomend al op updatedAt desc: [a rustig, b acuut, c rustig, d nieuwe kandidaten, e rustig]
    const jobs = [
      { id: "a", rank: 0 },
      { id: "b", rank: clientJobAttentionRank({ ...NONE, fillTone: "acute" }) },
      { id: "c", rank: 0 },
      { id: "d", rank: clientJobAttentionRank({ ...NONE, newApplications: true }) },
      { id: "e", rank: 0 },
    ];
    const ordered = sortJobsByAttention(jobs, (j) => j.rank).map((j) => j.id);
    // Acuut eerst, dan nieuwe kandidaten, dan de rustige opdrachten in hun oorspronkelijke volgorde.
    expect(ordered).toEqual(["b", "d", "a", "c", "e"]);
  });

  it("laat een lijst zonder signalen volledig ongewijzigd (stabiel)", () => {
    const jobs = [{ id: "x" }, { id: "y" }, { id: "z" }];
    expect(sortJobsByAttention(jobs, () => 0)).toEqual(jobs);
  });

  it("muteert de invoer niet", () => {
    const jobs = [
      { id: "a", rank: 0 },
      { id: "b", rank: 100 },
    ];
    const snapshot = jobs.map((j) => j.id);
    sortJobsByAttention(jobs, (j) => j.rank);
    expect(jobs.map((j) => j.id)).toEqual(snapshot);
  });
});
