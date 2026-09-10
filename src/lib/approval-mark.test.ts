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
});
