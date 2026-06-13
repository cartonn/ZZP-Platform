import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { RevenueTrend } from "@/lib/revenue-trend";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkline } from "@/components/ui/sparkline";
import { formatEuro } from "@/lib/invoices";

export interface RevenueTrendCardProps {
  trend: RevenueTrend;
  /** Kaart-titel, bv. "Omzet per maand" of "Uitgaven per maand". */
  title: string;
  /** Rol-specifieke lege-staat-tekst. */
  emptyDescription: string;
}

/**
 * RevenueTrendCard — toont een 6-maands trendgrafiek (sparkline) met het
 * huidige maandbedrag, delta-badge en een compacte maandstrip.
 * Puur presentationeel server component; geen client hooks.
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
  const values = trend.series.map((m) => m.cents);

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Kopregel: titel links, delta-badge rechts */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{title}</span>
          <DeltaBadge deltaPct={trend.deltaPct} />
        </div>

        {/* Groot bedrag + maand-label */}
        <div>
          <p className="font-mono text-2xl font-semibold tabular-nums">
            {formatEuro(trend.currentCents)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">deze maand · {lastLabel}</p>
        </div>

        {/* Sparkline */}
        <Sparkline
          values={values}
          width={160}
          height={40}
          label={`${title} laatste 6 maanden`}
          className="text-primary"
        />

        {/* 6-maands strip */}
        <div className="grid grid-cols-6 gap-1">
          {trend.series.map((m) => (
            <div key={m.key} className="min-w-0 space-y-0.5 text-center">
              <p className="truncate text-xs uppercase text-muted-foreground">{m.label}</p>
              <p className="truncate font-mono text-xs tabular-nums">{formatEuro(m.cents)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaBadge({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null) {
    return <Badge variant="muted">—</Badge>;
  }
  if (deltaPct > 0) {
    return (
      <Badge variant="success" className="gap-0.5">
        <TrendingUp className="size-3" aria-hidden />
        {`+${deltaPct}%`}
      </Badge>
    );
  }
  if (deltaPct < 0) {
    return (
      <Badge variant="danger" className="gap-0.5">
        <TrendingDown className="size-3" aria-hidden />
        {`${deltaPct}%`}
      </Badge>
    );
  }
  // deltaPct === 0
  return (
    <Badge variant="muted" className="gap-0.5">
      <Minus className="size-3" aria-hidden />
      {"0%"}
    </Badge>
  );
}
