import { TrendingUp } from "lucide-react";
import type { RevenueTrend } from "@/lib/revenue-trend";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BarSeries, TrendBadge } from "@/components/insight/bi";
import { formatEuro } from "@/lib/invoices";

export interface RevenueTrendCardProps {
  trend: RevenueTrend;
  /** Kaart-titel, bv. "Omzet per maand" of "Uitgaven per maand". */
  title: string;
  /** Rol-specifieke lege-staat-tekst. */
  emptyDescription: string;
}

/**
 * RevenueTrendCard — toont een 6-maands trend als staafdiagram (BI-kit) met het huidige
 * maandbedrag en een delta-badge. Puur presentationeel server component; geen client hooks.
 */
export function RevenueTrendCard({ trend, title, emptyDescription }: RevenueTrendCardProps) {
  if (!trend.hasData) {
    return (
      <Card>
        <EmptyState icon={TrendingUp} title="Nog geen trend" description={emptyDescription} />
      </Card>
    );
  }

  const lastLabel = trend.series.at(-1)?.label ?? "";

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Kopregel: titel links, delta-badge rechts */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{title}</span>
          <TrendBadge deltaPct={trend.deltaPct} />
        </div>

        {/* Groot bedrag + maand-label */}
        <div>
          <p className="font-mono text-2xl font-semibold tabular-nums">
            {formatEuro(trend.currentCents)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">deze maand · {lastLabel}</p>
        </div>

        {/* 6-maands staafdiagram */}
        <BarSeries
          data={trend.series.map((m) => ({ key: m.key, label: m.label, value: m.cents }))}
          formatValue={formatEuro}
          label={`${title} laatste 6 maanden`}
        />
      </CardContent>
    </Card>
  );
}
