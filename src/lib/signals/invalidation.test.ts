import { describe, expect, it } from "vitest";

import {
  planHasWork,
  planSignalInvalidation,
  SIGNAL_INVALIDATION,
  type SignalSubject,
} from "./invalidation";

describe("SIGNAL_INVALIDATION (de tabel)", () => {
  it("kent elk cascade-event een onderwerp toe — geen stille gaten in de hoofdstroom", () => {
    // De hoofdcascade is het pad waar "wie is aan zet" per stap verschuift; ontbreekt hier een type,
    // dan loopt de badge van beide partijen tot de TTL achter.
    const cascade = [
      "CONTRACT_SIGNED",
      "PERFORMANCE_SUBMITTED",
      "PERFORMANCE_APPROVED",
      "PERFORMANCE_REJECTED",
      "INVOICE_SUBMITTED",
      "INVOICE_APPROVED",
      "INVOICE_REJECTED",
      "PAYMENT_MARKED",
      "PAYMENT_CONFIRMED",
    ];
    for (const type of cascade) expect(SIGNAL_INVALIDATION[type], type).toBeDefined();
  });

  it("gebruikt alleen bekende onderwerpen", () => {
    const allowed: SignalSubject[] = [
      "collaboration",
      "invoice",
      "performance",
      "credential",
      "user",
    ];
    for (const subject of Object.values(SIGNAL_INVALIDATION)) {
      expect(allowed).toContain(subject);
    }
  });
});

describe("planSignalInvalidation", () => {
  it("groepeert per onderwerp en dedupt id's", () => {
    const plan = planSignalInvalidation([
      { type: "CONTRACT_SIGNED", subjectId: "col1" },
      { type: "DISPUTE_OPENED", subjectId: "col1" },
      { type: "INVOICE_APPROVED", subjectId: "inv1" },
      { type: "PAYMENT_CONFIRMED", subjectId: "inv1" },
      { type: "PERFORMANCE_SUBMITTED", subjectId: "perf1" },
      { type: "CREDENTIAL_VERIFIED", subjectId: "cred1" },
      { type: "VAT_REMINDER", subjectId: "user1" },
    ]);
    expect(plan.collaborationIds).toEqual(["col1"]);
    expect(plan.invoiceIds).toEqual(["inv1"]);
    expect(plan.performanceIds).toEqual(["perf1"]);
    expect(plan.credentialIds).toEqual(["cred1"]);
    expect(plan.userIds).toEqual(["user1"]);
    expect(plan.unmapped).toBe(0);
  });

  it("telt onbekende types als unmapped in plaats van ze te raden", () => {
    const plan = planSignalInvalidation([
      { type: "IETS_NIEUWS", subjectId: "x" },
      { type: "CONTRACT_SIGNED", subjectId: "" },
    ]);
    expect(plan.unmapped).toBe(2);
    expect(planHasWork(plan)).toBe(false);
  });

  it("is leeg zonder events", () => {
    const plan = planSignalInvalidation([]);
    expect(planHasWork(plan)).toBe(false);
    expect(plan.unmapped).toBe(0);
  });

  it("meldt werk zodra er één bruikbaar event is", () => {
    expect(planHasWork(planSignalInvalidation([{ type: "CONTRACT_SIGNED", subjectId: "c" }]))).toBe(
      true,
    );
  });
});
