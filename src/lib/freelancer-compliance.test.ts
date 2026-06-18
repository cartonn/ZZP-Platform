import { describe, it, expect } from "vitest";

import {
  linkExpiryToInzet,
  type ActiveCollaborationRequirement,
} from "@/lib/freelancer-compliance";
import {
  type ExpiryItem,
  type ExpiryOverview,
  type ExpiryWindow,
} from "@/lib/credential-expiry-overview";
import { type CredentialType } from "@/lib/enums";

function makeItem(
  id: string,
  type: CredentialType,
  window: ExpiryWindow,
  days: number,
): ExpiryItem {
  return {
    id,
    title: `Certificaat ${id}`,
    type,
    expiresAt: new Date("2026-07-01T00:00:00.000Z"),
    days,
    window,
  };
}

function makeOverview(items: ExpiryItem[]): ExpiryOverview {
  return {
    items,
    expired: items.filter((i) => i.window === "EXPIRED").length,
    within30: items.filter((i) => i.window === "WITHIN_30").length,
    within60: items.filter((i) => i.window === "WITHIN_60").length,
    within90: items.filter((i) => i.window === "WITHIN_90").length,
    total: items.length,
  };
}

function collab(
  collaborationId: string,
  clientName: string,
  jobTitle: string,
  requiredTypes: CredentialType[],
): ActiveCollaborationRequirement {
  return { collaborationId, jobTitle, clientName, requiredTypes };
}

describe("linkExpiryToInzet", () => {
  it("geeft geen items terug bij geen samenwerkingen", () => {
    const overview = makeOverview([makeItem("c1", "VOG", "EXPIRED", -2)]);
    const result = linkExpiryToInzet(overview, []);
    expect(result.items).toEqual([]);
    expect(result.collaborationsAtRisk).toBe(0);
  });

  it("geeft geen items terug bij lege vervalkalender", () => {
    const result = linkExpiryToInzet(makeOverview([]), [
      collab("col1", "Acme", "Verpleegkundige", ["VOG"]),
    ]);
    expect(result.items).toEqual([]);
    expect(result.collaborationsAtRisk).toBe(0);
  });

  it("koppelt een item aan de samenwerking die het type vereist", () => {
    const overview = makeOverview([makeItem("c1", "VOG", "WITHIN_30", 10)]);
    const result = linkExpiryToInzet(overview, [
      collab("col1", "Acme", "Verpleegkundige", ["VOG"]),
    ]);
    expect(result.items).toHaveLength(1);
    const [only] = result.items;
    expect(only?.item.id).toBe("c1");
    expect(only?.affected).toEqual([
      { collaborationId: "col1", jobTitle: "Verpleegkundige", clientName: "Acme" },
    ]);
  });

  it("koppelt twee samenwerkingen die hetzelfde type vereisen, gesorteerd op clientName", () => {
    const overview = makeOverview([makeItem("c1", "VOG", "WITHIN_30", 5)]);
    const result = linkExpiryToInzet(overview, [
      collab("colB", "Zorg BV", "Nacht", ["VOG"]),
      collab("colA", "Alpha", "Dag", ["VOG"]),
    ]);
    expect(result.items[0]?.affected.map((a) => a.collaborationId)).toEqual(["colA", "colB"]);
  });

  it("sorteert affected deterministisch op clientName, dan jobTitle, dan collaborationId", () => {
    const overview = makeOverview([makeItem("c1", "VOG", "WITHIN_30", 5)]);
    const result = linkExpiryToInzet(overview, [
      collab("z3", "Acme", "Beta", ["VOG"]),
      collab("z1", "Acme", "Alpha", ["VOG"]),
      collab("z2", "Acme", "Alpha", ["VOG"]),
    ]);
    expect(result.items[0]?.affected.map((a) => a.collaborationId)).toEqual(["z1", "z2", "z3"]);
  });

  it("laat een item weg dat geen enkele eis matcht", () => {
    const overview = makeOverview([makeItem("c1", "DIPLOMA", "EXPIRED", -1)]);
    const result = linkExpiryToInzet(overview, [
      collab("col1", "Acme", "Verpleegkundige", ["VOG"]),
    ]);
    expect(result.items).toEqual([]);
    expect(result.collaborationsAtRisk).toBe(0);
  });

  it("telt alleen EXPIRED en WITHIN_30 mee in collaborationsAtRisk", () => {
    const overview = makeOverview([
      makeItem("c1", "VOG", "EXPIRED", -3),
      makeItem("c2", "DIPLOMA", "WITHIN_30", 12),
      makeItem("c3", "INSURANCE", "WITHIN_60", 45),
    ]);
    const result = linkExpiryToInzet(overview, [
      collab("colVOG", "A", "J1", ["VOG"]),
      collab("colDip", "B", "J2", ["DIPLOMA"]),
      collab("colIns", "C", "J3", ["INSURANCE"]),
    ]);
    // colVOG (EXPIRED) + colDip (WITHIN_30) tellen; colIns (WITHIN_60) niet.
    expect(result.collaborationsAtRisk).toBe(2);
  });

  it("telt een samenwerking maar één keer ook al raken meerdere items haar (distinct)", () => {
    const overview = makeOverview([
      makeItem("c1", "VOG", "EXPIRED", -1),
      makeItem("c2", "DIPLOMA", "WITHIN_30", 8),
    ]);
    // Eén samenwerking vereist beide types -> geraakt door beide urgente items, maar telt 1x.
    const result = linkExpiryToInzet(overview, [
      collab("col1", "Acme", "Verpleegkundige", ["VOG", "DIPLOMA"]),
    ]);
    expect(result.items).toHaveLength(2);
    expect(result.collaborationsAtRisk).toBe(1);
  });

  it("voegt niets toe aan de risk-telling voor een WITHIN_60-item", () => {
    const overview = makeOverview([makeItem("c1", "VOG", "WITHIN_60", 50)]);
    const result = linkExpiryToInzet(overview, [collab("col1", "Acme", "J1", ["VOG"])]);
    expect(result.items).toHaveLength(1);
    expect(result.collaborationsAtRisk).toBe(0);
  });

  it("behoudt de volgorde van overview.items (urgentst eerst)", () => {
    const overview = makeOverview([
      makeItem("first", "VOG", "EXPIRED", -5),
      makeItem("second", "DIPLOMA", "WITHIN_30", 3),
      makeItem("third", "INSURANCE", "WITHIN_90", 80),
    ]);
    const result = linkExpiryToInzet(overview, [
      collab("colA", "A", "J", ["VOG", "DIPLOMA", "INSURANCE"]),
    ]);
    expect(result.items.map((i) => i.item.id)).toEqual(["first", "second", "third"]);
  });

  it("muteert de invoer niet", () => {
    const items = [makeItem("c1", "VOG", "EXPIRED", -1)];
    const overview = makeOverview(items);
    const collaborations: ActiveCollaborationRequirement[] = [
      collab("col2", "B", "J2", ["VOG"]),
      collab("col1", "A", "J1", ["VOG"]),
    ];
    const snapshotOrder = collaborations.map((c) => c.collaborationId);
    linkExpiryToInzet(overview, collaborations);
    expect(overview.items).toBe(items);
    expect(collaborations.map((c) => c.collaborationId)).toEqual(snapshotOrder);
  });
});
