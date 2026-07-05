// Directe uitnodiging: de opdrachtgever nodigt een passende, openbare ZZP'er uit om op een
// specifieke gepubliceerde opdracht te reageren. Vertaalt de auto-uitnodiging-liquiditeit van
// Temper/Pidz naar onze verklaarbare matching, zonder eigen datamodel — de uitnodiging is een
// Notification naar de ZZP'er + een gezaghebbend JOB_INVITED-auditrecord (zoals flexpool-routing).
//
// Pure, getest. Server-side is de waarheid (CLAUDE.md regel 1): de eligibility-poort en de
// notificatie-inhoud worden hier deterministisch berekend en door de server-action afgedwongen.

import type { JobStatus } from "@/lib/enums";

/** Notificatietype voor een directe uitnodiging (geregistreerd in `notifications.ts`). */
export const JOB_INVITE_NOTIFICATION_TYPE = "JOB_INVITE" as const;
/** Auditactie die de verstuurde uitnodiging gezaghebbend markeert (dedup-bron). */
export const JOB_INVITED_AUDIT_ACTION = "JOB_INVITED" as const;

export interface InviteEligibilityInput {
  /** Status van de opdracht — alleen een gepubliceerde opdracht kan reacties trekken. */
  jobStatus: JobStatus;
  /** De ZZP'er reageerde al op deze opdracht (uitnodigen is dan zinloos). */
  alreadyApplied: boolean;
  /** Er staat al een JOB_INVITED-auditrecord voor dit (opdracht, ZZP'er)-paar. */
  alreadyInvited: boolean;
  /** De ZZP'er is openbaar vindbaar (visibility PUBLIC + account ACTIVE). */
  discoverable: boolean;
}

export type InviteEligibility =
  | { ok: true }
  | {
      ok: false;
      reason: "not_published" | "already_applied" | "already_invited" | "not_discoverable";
    };

/**
 * Deterministische poort: mag deze ZZP'er nu voor deze opdracht worden uitgenodigd?
 * Volgorde is bewust: eerst de opdracht-/vindbaarheidsvoorwaarden, dan de reeds-gedaan-gevallen.
 */
export function assessInviteEligibility(input: InviteEligibilityInput): InviteEligibility {
  if (input.jobStatus !== "PUBLISHED") return { ok: false, reason: "not_published" };
  if (!input.discoverable) return { ok: false, reason: "not_discoverable" };
  if (input.alreadyApplied) return { ok: false, reason: "already_applied" };
  if (input.alreadyInvited) return { ok: false, reason: "already_invited" };
  return { ok: true };
}

export interface JobInviteNotificationInput {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

export interface JobInviteNotification {
  type: typeof JOB_INVITE_NOTIFICATION_TYPE;
  title: string;
  body: string;
  link: string;
}

/** Bouwt de notificatie-inhoud voor de uitgenodigde ZZP'er (pure, één bron van waarheid). */
export function buildJobInviteNotification(
  input: JobInviteNotificationInput,
): JobInviteNotification {
  const company = input.companyName.trim() || "Een opdrachtgever";
  const title = input.jobTitle.trim() || "een opdracht";
  return {
    type: JOB_INVITE_NOTIFICATION_TYPE,
    title: "Je bent uitgenodigd om te reageren",
    body: `${company} nodigt je uit om te reageren op de opdracht "${title}".`,
    link: `/opdrachten/${input.jobId}`,
  };
}
