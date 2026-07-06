import { CreditCard, Info } from "lucide-react";
import { BehaviorToneBadge } from "@/components/jobs/signal-chips";
import { Card, CardContent } from "@/components/ui/card";
import { type PaymentBehavior } from "@/lib/payment-behavior";
import { summarizePaymentReputation } from "@/lib/client-payment-reputation";

/**
 * Betaalreputatie-spiegel voor de opdrachtgever: dezelfde geaggregeerde betaalgedrag-cijfers
 * die ZZP'ers over hem zien, terug naar hemzelf als zelfverbeter-nudge. Presentationeel —
 * de data en het oordeel komen server-side binnen (geen client-side beslissingen).
 */
export function PaymentReputationCard({ behavior }: { behavior: PaymentBehavior }) {
  const { avgDaysToPay, onTimePct, sampleSize } = behavior;
  const reputation = summarizePaymentReputation(behavior);

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-medium">Jouw betaalreputatie</h2>
          <BehaviorToneBadge tone={reputation.tone} />
        </div>

        <p className="text-sm font-medium">{reputation.headline}</p>

        {reputation.hasStats && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {avgDaysToPay != null && (
              <span>
                Gemiddeld{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {avgDaysToPay} {avgDaysToPay === 1 ? "dag" : "dagen"}
                </span>{" "}
                betaaltijd
              </span>
            )}
            {onTimePct != null && (
              <span>
                <span className="font-medium tabular-nums text-foreground">{onTimePct}%</span> op
                tijd
              </span>
            )}
            <span className="text-xs">
              op basis van {sampleSize} {sampleSize === 1 ? "betaling" : "betalingen"}
            </span>
          </div>
        )}

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {reputation.tip} {"Dit signaal zien ZZP'ers bij je opdrachten."}
        </p>
      </CardContent>
    </Card>
  );
}
