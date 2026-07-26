import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { type JobRateFitAssessment } from "@/lib/job-rate-fit-detail";

const TONE_STYLES: Record<
  JobRateFitAssessment["tone"],
  { icon: typeof Wallet; iconClass: string; badgeClass: string }
> = {
  good: {
    icon: TrendingUp,
    iconClass: "text-success",
    badgeClass: "text-success",
  },
  warning: {
    icon: TrendingDown,
    iconClass: "text-warning",
    badgeClass: "text-warning",
  },
  neutral: {
    icon: Wallet,
    iconClass: "text-muted-foreground",
    badgeClass: "text-muted-foreground",
  },
};

/**
 * Toont de ZZP'er op het beslismoment (opdracht-detail, vóór reageren) of het gepubliceerde budget
 * boven, onder of binnen zijn eigen richttarief valt. Presentationeel: het oordeel is server-berekend
 * (`assessJobRateFit`); deze component beslist niets en toont het als indicatie.
 */
export function JobRateFitCard({ assessment }: { assessment: JobRateFitAssessment }) {
  const { icon: Icon, iconClass, badgeClass } = TONE_STYLES[assessment.tone];
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Wallet className="size-4" aria-hidden /> Tarief-passendheid
        </p>
        {assessment.deltaEuros > 0 && (
          <span className={`text-[11px] font-medium tabular-nums ${badgeClass}`}>
            {assessment.tone === "good" ? "+" : "−"}€ {assessment.deltaEuros}/uur
          </span>
        )}
      </div>

      <p className="flex items-center gap-2 text-sm font-medium">
        <Icon className={`size-4 shrink-0 ${iconClass}`} aria-hidden />
        {assessment.headline}
      </p>

      <p className="text-xs text-muted-foreground">{assessment.detail}</p>
    </div>
  );
}
