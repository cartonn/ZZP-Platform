/** Presentation only: callers provide their server-derived, effective workflow status. */
export type ApprovalMark = "pending" | "approved";

export function approvalMark(
  status: string | null | undefined,
  { disputed = false }: { disputed?: boolean } = {},
): ApprovalMark | undefined {
  // A dispute freezes the workflow without rewriting its historical approval status.
  if (disputed) return undefined;
  if (["SUBMITTED", "IN_REVIEW", "AWAITING_SIGNATURE"].includes(status ?? "")) return "pending";
  if (["APPROVED", "VERIFIED", "SIGNED", "ACCEPTED"].includes(status ?? "")) return "approved";
  return undefined;
}
