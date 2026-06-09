// Geplande runner voor het acceptatie-/grace-venster (§4 Event B/B2). Een ingediende prestatie die
// de opdrachtgever niet binnen PERFORMANCE_GRACE_DAYS beoordeelt, wordt automatisch goedgekeurd via
// autoApprovePerformance (zelfde factuur-cascade + dedupeKey als handmatig). Idempotent. Staat
// standaard UIT (PERFORMANCE_GRACE_DAYS leeg/0 → geen auto-goedkeuring), want het is financieel beleid.

import { prisma } from "@/lib/db";
import { performanceGraceDays } from "@/lib/config";
import { autoApprovePerformance } from "@/lib/cascade/commands";

export interface GraceTaskResult {
  /** Of het venster geconfigureerd (en dus actief) is. */
  enabled: boolean;
  /** Aantal kandidaten dat het venster passeerde. */
  considered: number;
  /** Aantal daadwerkelijk automatisch goedgekeurd. */
  approved: number;
}

export interface GraceCandidate {
  status: string;
  submittedAt: Date | null;
  collabStatus: string;
  disputedAt: Date | null;
}

/** Begin van het venster: prestaties ingediend vóór dit moment zijn over hun grace-tijd heen. */
export function graceCutoff(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Pure beslisregel of een ingediende prestatie automatisch goedgekeurd mag worden. Alleen INGEDIEND,
 * over de grace-tijd heen, op een niet-geannuleerde en niet-betwiste samenwerking. Defensief
 * herhaald in de loop (de query filtert al), zodat de regel los unit-testbaar is.
 */
export function isGraceEligible(c: GraceCandidate, cutoff: Date): boolean {
  return (
    c.status === "SUBMITTED" &&
    c.submittedAt != null &&
    c.submittedAt.getTime() <= cutoff.getTime() &&
    c.collabStatus !== "CANCELLED" &&
    c.disputedAt == null
  );
}

export async function runPerformanceGraceTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<GraceTaskResult> {
  const days = performanceGraceDays();
  if (days <= 0) return { enabled: false, considered: 0, approved: 0 };

  const now = opts.now ?? new Date();
  const cutoff = graceCutoff(now, days);

  const rows = await prisma.performance.findMany({
    where: {
      status: "SUBMITTED",
      submittedAt: { not: null, lte: cutoff },
      collaboration: { status: { not: "CANCELLED" }, disputedAt: null },
    },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      collaboration: { select: { status: true, disputedAt: true } },
    },
  });

  let approved = 0;
  for (const r of rows) {
    const eligible = isGraceEligible(
      {
        status: r.status,
        submittedAt: r.submittedAt,
        collabStatus: r.collaboration.status,
        disputedAt: r.collaboration.disputedAt,
      },
      cutoff,
    );
    if (!eligible) continue;
    try {
      await autoApprovePerformance(r.id);
      approved += 1;
    } catch {
      // Eén falende prestatie mag de rest niet blokkeren; de volgende run pakt 'm opnieuw op.
    }
  }

  return { enabled: true, considered: rows.length, approved };
}
