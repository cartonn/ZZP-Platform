import { CalendarClock } from "lucide-react";
import { formatEuro } from "@/lib/invoices";
import { type VatDeadlineSummary } from "@/lib/administration/vat-deadline";
import { Card, CardContent } from "@/components/ui/card";

const QUARTER_LABEL = ["1e", "2e", "3e", "4e"] as const;

const DEADLINE_FORMAT = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function countdownLabel(daysUntil: number): string {
  if (daysUntil < 0) {
    const late = Math.abs(daysUntil);
    return late === 1 ? "1 dag te laat" : `${late} dagen te laat`;
  }
  if (daysUntil === 0) return "uiterlijk vandaag";
  if (daysUntil === 1) return "nog 1 dag";
  return `nog ${daysUntil} dagen`;
}

const TONE: Record<
  VatDeadlineSummary["status"],
  { border: string; badge: string; badgeLabel: string }
> = {
  upcoming: {
    border: "border-border",
    badge: "bg-muted text-muted-foreground",
    badgeLabel: "Op schema",
  },
  "due-soon": {
    border: "border-amber-300 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    badgeLabel: "Binnenkort",
  },
  overdue: {
    border: "border-red-300 dark:border-red-900",
    badge: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
    badgeLabel: "Verstreken",
  },
};

/**
 * Presentationeel: toont de eerstvolgende BTW-aangifte (afgesloten kwartaal), de uiterste
 * indieningsdatum met aftelling, het saldo voor dat kwartaal en de urgentie. Puur weergave — de
 * samenvatting wordt server-side berekend (`summarizeVatDeadline`).
 */
export function VatDeadlineCard({ summary }: { summary: VatDeadlineSummary }) {
  const tone = TONE[summary.status];
  const isFreelancer = summary.party === "FREELANCER";
  const owes = summary.balanceCents > 0;
  const amountLabel = owes
    ? "Te betalen"
    : summary.balanceCents < 0
      ? "Terug te ontvangen"
      : "Saldo";

  return (
    <Card className={tone.border}>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                BTW-aangifte {QUARTER_LABEL[summary.quarter - 1]} kwartaal {summary.year}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone.badge}`}>
                {tone.badgeLabel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Uiterlijk {DEADLINE_FORMAT.format(summary.deadline)} indienen én betalen ·{" "}
              <span className={summary.status === "overdue" ? "font-medium text-red-600" : ""}>
                {countdownLabel(summary.daysUntil)}
              </span>
            </p>
          </div>
        </div>
        <div className="pl-8 sm:pl-0 sm:text-right">
          <p className="text-xs text-muted-foreground">{amountLabel}</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatEuro(Math.abs(summary.balanceCents))}
          </p>
        </div>
      </CardContent>
      <p className="px-4 pb-3 text-xs text-muted-foreground">
        {isFreelancer
          ? "Dien je BTW-aangifte op tijd in bij de Belastingdienst om een verzuimboete te voorkomen."
          : "De voorbelasting over dit kwartaal vorder je terug via je BTW-aangifte."}{" "}
        Indicatief; geen fiscaal advies.
      </p>
    </Card>
  );
}
