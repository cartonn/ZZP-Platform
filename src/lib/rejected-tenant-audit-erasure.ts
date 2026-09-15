import { AUDIT_PII_REDACTED } from "@/lib/account-anonymization";

export const REJECTED_TENANT_APPLICATION_ACTIONS = [
  "FRANCHISE_SELF_REGISTERED",
  "FRANCHISE_REJECTED",
];

/** Only call for the erased owner's REJECTED tenant. Keep event/status evidence. */
export function scrubRejectedTenantApplicationMetadata(
  action: string,
  metadata: string | null,
): string | null {
  const fields =
    action === "FRANCHISE_SELF_REGISTERED"
      ? ["slug", "kvkNumber"]
      : action === "FRANCHISE_REJECTED"
        ? ["reason"]
        : [];
  if (!metadata || fields.length === 0) return metadata;
  let parsed: unknown;
  try {
    parsed = JSON.parse(metadata);
  } catch {
    return metadata;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return metadata;
  const object = parsed as Record<string, unknown>;
  let changed = false;
  for (const field of fields) {
    if (
      Object.hasOwn(object, field) &&
      object[field] !== null &&
      object[field] !== AUDIT_PII_REDACTED
    ) {
      object[field] = AUDIT_PII_REDACTED;
      changed = true;
    }
  }
  return changed ? JSON.stringify(object) : metadata;
}
