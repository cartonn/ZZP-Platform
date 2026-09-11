import { describe, expect, it } from "vitest";
import { approvalMark } from "./approval-mark";

describe("approval marks", () => {
  it.each(["SUBMITTED", "IN_REVIEW", "AWAITING_SIGNATURE"])("marks %s as pending", (status) => {
    expect(approvalMark(status)).toBe("pending");
  });
  it.each(["APPROVED", "VERIFIED", "SIGNED", "ACCEPTED"])("seals %s as approved", (status) => {
    expect(approvalMark(status)).toBe("approved");
  });
  it.each([
    "DRAFT",
    "EXPIRED",
    "REJECTED",
    "WITHDRAWN",
    "DISPUTED",
    "ACTIVE",
    "PUBLISHED",
    "PAID",
    null,
    undefined,
  ])("does not invent approval for %s", (status) => {
    expect(approvalMark(status)).toBeUndefined();
  });

  it.each([
    "SUBMITTED",
    "IN_REVIEW",
    "AWAITING_SIGNATURE",
    "APPROVED",
    "VERIFIED",
    "SIGNED",
    "ACCEPTED",
  ])(
    "does not present %s as actionable or approved while the server freezes it in a dispute",
    (status) => {
      expect(approvalMark(status, { disputed: true })).toBeUndefined();
    },
  );

  it("restores the historical approval presentation after the server resolves the dispute", () => {
    const status = "APPROVED";
    expect(approvalMark(status, { disputed: true })).toBeUndefined();
    expect(approvalMark(status, { disputed: false })).toBe("approved");
  });
});
