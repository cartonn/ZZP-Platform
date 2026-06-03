import { describe, expect, it } from "vitest";
import { P } from "@/lib/next-actions";
import {
  rankTasks,
  contractSignTask,
  performanceApproveTask,
  invoiceSubmitTask,
  paymentConfirmTask,
  profileCompletenessTask,
  adminDeletionRequestTask,
  adminResolveDisputeTask,
  type PendingTask,
} from "@/lib/actions/tasks";

describe("rankTasks", () => {
  it("sorteert op prioriteit aflopend, stabiel bij gelijke prioriteit", () => {
    const a = contractSignTask("c1", "Job", "Acme"); // 72
    const b = profileCompletenessTask(70, ["Uurtarief"]); // 30
    const c = adminResolveDisputeTask("c2", "Job"); // 76
    const ranked = rankTasks([a, b, c]);
    expect(ranked.map((t) => t.kind)).toEqual([
      "admin-resolve-dispute",
      "contract-sign",
      "profile-complete",
    ]);
  });

  it("lege input → lege lijst", () => {
    expect(rankTasks([])).toEqual([]);
  });

  it("muteert de invoer niet", () => {
    const input: PendingTask[] = [
      contractSignTask("c1", "J", "A"),
      paymentConfirmTask("i1", "c1", "J"),
    ];
    const snapshot = input.map((t) => t.id);
    rankTasks(input);
    expect(input.map((t) => t.id)).toEqual(snapshot);
  });
});

describe("task builders", () => {
  it("contract-sign: oneClick, attention, deep-link naar de samenwerking", () => {
    const t = contractSignTask("c1", "Senior Dev", "Acme BV");
    expect(t).toMatchObject({
      kind: "contract-sign",
      id: "contract-sign:c1",
      resolver: "oneClick",
      tone: "attention",
      priority: P.contractSign,
      href: "/samenwerkingen/c1",
      collabId: "c1",
    });
  });

  it("performance-approve: approveReject-resolver met approve-prioriteit (65)", () => {
    const t = performanceApproveTask("p1", "c1", "Job", "Sanne");
    expect(t.kind).toBe("performance-approve");
    expect(t.resolver).toBe("approveReject");
    expect(t.priority).toBe(65);
    expect(t.id).toBe("performance-approve:p1");
  });

  it("invoice-submit: afgekeurd weegt zwaarder dan een concept", () => {
    const draft = invoiceSubmitTask("i1", "c1", "Job", false);
    const rejected = invoiceSubmitTask("i2", "c1", "Job", true);
    expect(rejected.priority).toBeGreaterThan(draft.priority);
    expect(draft.title).toContain("Concept-factuur indienen");
    expect(rejected.title).toContain("opnieuw indienen");
  });

  it("profiel-compleetheid noemt de ontbrekende velden (max 3)", () => {
    const t = profileCompletenessTask(60, ["Uurtarief", "Talen", "Locatie", "Bio"]);
    expect(t.subtitle).toBe("Voeg toe: Uurtarief, Talen, Locatie");
    expect(t.resolver).toBe("drawer");
  });

  it("AVG-verwijderverzoek blijft een link (onomkeerbaar, geen één-klik)", () => {
    const t = adminDeletionRequestTask("u1", "Jan");
    expect(t.resolver).toBe("link");
    expect(t.priority).toBe(P.blocking);
  });
});
