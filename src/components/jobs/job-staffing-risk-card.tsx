import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { LevelChip } from "@/components/jobs/signal-chips";
import {
  staffingRiskActionLabel,
  staffingRiskHeadline,
  type StaffingRiskSummary,
} from "@/lib/job-staffing-risk";

const TONE_DOT: Record<StaffingRiskSummary["tone"], string> = {
  neutral: "bg-muted-foreground",
  warning: "bg-warning",
  danger: "bg-danger",
};

const TONE_HINT: Record<StaffingRiskSummary["tone"], string> = {
  neutral: "text-muted-foreground",
  warning: "text-warning",
  danger: "text-danger",
};

/**
 * Toont de eigenaar van een gepubliceerde opdracht dat de startdatum nadert terwijl er nog niemand
 * is vastgelegd — met de meest gerichte volgende stap. Presentationeel: de fase is server-side
 * berekend (`summarizeStaffingRisk`); deze component beslist niets en toont geen kandidaatgegevens.
 * Rendert alleen wanneer er daadwerkelijk aandacht nodig is.
 */
export function JobStaffingRiskCard({
  summary,
  jobId,
}: {
  summary: StaffingRiskSummary;
  jobId: string;
}) {
  if (!summary.attention) return null;

  // Bij bestaande reacties leidt de doorklik naar de vergelijk-weergave van déze opdracht — de enige
  // kandidaten-route die op `?job=` scoopt (de lijst op /kandidaten toont alle opdrachten). Zonder
  // reacties (widen_reach) staat de sectie "Geschikte ZZP'ers" met uitnodigen al onder deze kaart.
  const href =
    summary.action === "widen_reach"
      ? null
      : `/kandidaten/vergelijk?job=${encodeURIComponent(jobId)}`;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarClock className="size-4" aria-hidden /> Bezetting op tijd
        </p>
        <LevelChip
          dotClass={TONE_DOT[summary.tone]}
          label={staffingRiskHeadline(summary.phase, summary.daysUntilStart)}
        />
      </div>

      <p className={`text-sm ${TONE_HINT[summary.tone]}`}>
        {staffingRiskActionLabel(summary.action)}.
      </p>

      {href && (
        <Link
          href={href}
          className="focus-ring inline-flex text-xs font-medium underline underline-offset-2"
        >
          Vergelijk de kandidaten
        </Link>
      )}

      <p className="text-xs text-muted-foreground">
        Startdatum-bewaking — alleen zichtbaar voor jou.
      </p>
    </div>
  );
}
