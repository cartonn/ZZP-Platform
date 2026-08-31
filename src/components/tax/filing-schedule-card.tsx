import { CalendarClock, CircleCheck, CircleDot } from "lucide-react";
import {
  type FilingSchedule,
  type FilingScheduleItem,
  type FilingScheduleUrgency,
} from "@/lib/tax-filing/filing-schedule";
import { FILING_STATUS_LABEL } from "@/lib/tax-filing/labels";
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

const TONE: Record<FilingScheduleUrgency, { badge: string; label: string }> = {
  upcoming: { badge: "bg-muted text-muted-foreground", label: "Op schema" },
  "due-soon": {
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    label: "Binnenkort",
  },
  overdue: {
    badge: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
    label: "Verstreken",
  },
};

function periodLabel(item: FilingScheduleItem): string {
  if (item.kind === "BTW" && item.quarter) {
    return `BTW-aangifte ${QUARTER_LABEL[item.quarter - 1]} kwartaal ${item.taxYear}`;
  }
  return `Inkomstenbelasting ${item.taxYear}`;
}

function FilingRow({ item }: { item: FilingScheduleItem }) {
  const tone = TONE[item.urgency];
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <CalendarClock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{periodLabel(item)}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone.badge}`}>
              {tone.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Uiterlijk {DEADLINE_FORMAT.format(item.deadline)} ·{" "}
            <span className={item.urgency === "overdue" ? "font-medium text-red-600" : ""}>
              {countdownLabel(item.daysUntil)}
            </span>
          </p>
        </div>
      </div>
      <div className="pl-8 sm:pl-4 sm:text-right">
        {item.existingStatus ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CircleCheck className="size-3.5 text-emerald-600" aria-hidden />
            {FILING_STATUS_LABEL[item.existingStatus]}
          </span>
        ) : item.needsStart ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <CircleDot className="size-3.5" aria-hidden />
            Nog niet gestart — start hieronder
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CircleDot className="size-3.5" aria-hidden />
            Nog niet gestart
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Presentationeel: de aangifte-agenda — de eerstvolgende BTW- én IB-aangifte, elk met de uiterste
 * datum, aftelling en of er al een aangifte voor dat tijdvak loopt. Puur weergave; de agenda wordt
 * server-side afgeleid (`buildFilingSchedule`) uit de canonieke deadline-libs + de aangiftehistorie.
 */
export function FilingScheduleCard({ schedule }: { schedule: FilingSchedule }) {
  return (
    <Card>
      <CardContent className="divide-y divide-border py-1">
        <FilingRow item={schedule.btw} />
        <FilingRow item={schedule.ib} />
      </CardContent>
      <p className="px-4 pb-3 text-xs text-muted-foreground">
        Dien je aangifte op tijd in om een verzuimboete te voorkomen. Indicatief; geen fiscaal
        advies.
      </p>
    </Card>
  );
}
