/**
 * Meetlus voor mail-intake: funnel van ontvangen → beoordeeld → gepubliceerd.
 * Puur (geen Prisma/Next); geeft inzicht in de doorlooptijd per stap.
 * Tijden in minuten (integer centen-patroon: geen floating-point-drift).
 */

export interface MailIntakeFunnelInput {
  receivedAt: Date;
  decidedAt: Date | null;
  status: string; // MailIntakeStatus: NEW | ACCEPTED | DISMISSED
  jobPublishedAt: Date | null;
}

export interface MailIntakeFunnel {
  total: number;
  accepted: number;
  dismissed: number;
  pending: number;
  /** null als total === 0 */
  acceptanceRatePct: number | null;
  /** mediaan minuten ontvangen → beoordeeld; null als geen beslissingen */
  medianReviewMinutes: number | null;
  /** mediaan minuten ontvangen → gepubliceerd (alleen ACCEPTED+gepubliceerde jobs); null als geen */
  medianPublishMinutes: number | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : (sorted[mid] ?? null);
}

export function buildMailIntakeFunnel(inputs: MailIntakeFunnelInput[]): MailIntakeFunnel {
  const total = inputs.length;
  const accepted = inputs.filter((i) => i.status === "ACCEPTED").length;
  const dismissed = inputs.filter((i) => i.status === "DISMISSED").length;
  const pending = inputs.filter((i) => i.status === "NEW").length;

  const reviewMinutes = inputs
    .filter((i) => i.decidedAt != null)
    .map((i) =>
      Math.max(0, Math.round((i.decidedAt!.getTime() - i.receivedAt.getTime()) / 60_000)),
    );

  const publishMinutes = inputs
    .filter((i) => i.status === "ACCEPTED" && i.jobPublishedAt != null)
    .map((i) =>
      Math.max(0, Math.round((i.jobPublishedAt!.getTime() - i.receivedAt.getTime()) / 60_000)),
    );

  return {
    total,
    accepted,
    dismissed,
    pending,
    acceptanceRatePct: total > 0 ? Math.round((accepted / total) * 100) : null,
    medianReviewMinutes: median(reviewMinutes),
    medianPublishMinutes: median(publishMinutes),
  };
}

/**
 * Leesbare doorlooptijdlabel in Nederlands: minuten → "X min" / "X uur" / "X dagen".
 * Null-safe: geeft null terug als er geen data is.
 */
export function formatDoorlooptijd(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} uur`;
  return `${Math.round(hours / 24)} dagen`;
}
