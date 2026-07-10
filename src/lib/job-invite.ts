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

/**
 * Bovengrens op één bulk-uitnodiging vanaf de "Geschikte ZZP'ers"-lijst. De lijst zelf is al
 * begrensd (`suggestedFreelancersForJob`, default 4), maar deze cap is een expliciete tweede rem
 * tegen massa-notificaties — onafhankelijk van de UI-limiet en van de per-uur-rate-limiter.
 */
export const MAX_BULK_JOB_INVITES = 10;

/**
 * Plant een bulk-uitnodiging: uit de gesuggereerde, server-side reeds geschikte ZZP'ers (openbaar,
 * tenant-gescoopt, gepubliceerde opdracht, nog niet gereageerd — de suggestiebron garandeert dat)
 * houdt dit de kandidaten over die nog niet zijn uitgenodigd. Ontdubbelt op id, behoudt de
 * suggestievolgorde (hoogste match eerst) en begrenst op `cap`. Deterministisch, testbaar zonder DB.
 */
export function planBulkJobInvites(
  candidateIds: readonly string[],
  alreadyInvitedIds: ReadonlySet<string>,
  cap: number = MAX_BULK_JOB_INVITES,
): string[] {
  if (cap <= 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of candidateIds) {
    if (alreadyInvitedIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Leidt de reeds uitgenodigde ZZP'er-id's af uit de `JOB_INVITED`-auditrecords van een opdracht.
 * Gezaghebbende, gedeelde bron voor zowel de "Uitgenodigd"-badge (page) als de bulk-dedup (action),
 * zodat de JSON-parse-logica niet driftgevoelig gedupliceerd wordt. Robuust tegen malforme metadata.
 */
export function parseInvitedFreelancerIds(
  logs: ReadonlyArray<{ metadata: string | null }>,
): Set<string> {
  const ids = new Set<string>();
  for (const log of logs) {
    if (!log.metadata) continue;
    try {
      const meta = JSON.parse(log.metadata) as { freelancerId?: unknown };
      if (typeof meta.freelancerId === "string") ids.add(meta.freelancerId);
    } catch {
      // Malforme metadata: overslaan — nooit de hele lijst laten crashen.
    }
  }
  return ids;
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
