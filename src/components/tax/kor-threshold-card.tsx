import { Gauge } from "lucide-react";
import { formatEuro } from "@/lib/invoices";
import { type KorProjection } from "@/lib/tax/kor-projection";
import { korThresholdView, type KorThresholdTone } from "@/lib/tax/kor-threshold-view";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const BAR_CLASS: Record<KorThresholdTone, string> = {
  neutral: "bg-primary",
  warning: "bg-warning",
  danger: "bg-danger",
};

const BADGE_VARIANT: Record<KorThresholdTone, "muted" | "warning" | "danger"> = {
  neutral: "muted",
  warning: "warning",
  danger: "danger",
};

/**
 * KOR-omzetgrensmeter: toont de ZZP'er in één beeld hoe dicht zijn jaaromzet bij de €20.000-grens
 * van de kleineondernemersregeling zit. Read-only en presentationeel — de projectie is server-berekend
 * (`korThresholdProjection`), deze kaart beslist niets.
 */
export function KorThresholdCard({
  projection,
  approaching,
}: {
  projection: KorProjection;
  approaching: boolean;
}) {
  const view = korThresholdView(projection, approaching);

  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Gauge className="size-4" aria-hidden /> KOR-omzetgrens
      </h2>
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatEuro(view.revenueCents)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {formatEuro(view.thresholdCents)}
                </span>
              </p>
              <p className="mt-0.5 text-sm font-medium">{view.headline}</p>
            </div>
            <Badge variant={BADGE_VARIANT[view.tone]}>{view.statusLabel}</Badge>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={view.fractionPct}
            aria-label="Jaaromzet ten opzichte van de KOR-grens"
          >
            <div
              className={`h-full rounded-full ${BAR_CLASS[view.tone]}`}
              style={{ width: `${view.fractionPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{view.detail}</p>
        </CardContent>
      </Card>
    </section>
  );
}
