import { MessageSquare, Info } from "lucide-react";
import { BehaviorToneBadge } from "@/components/jobs/signal-chips";
import { Card, CardContent } from "@/components/ui/card";
import {
  RESPONSIVENESS_MIN_SAMPLE_SIZE,
  type ClientResponsiveness,
} from "@/lib/client-responsiveness";
import { summarizeResponsivenessReputation } from "@/lib/client-responsiveness-reputation";
import { insufficientSampleNotice } from "@/lib/sample-size";

/**
 * Reactiereputatie-spiegel voor de opdrachtgever: hetzelfde geaggregeerde reactiebereidheid-signaal
 * dat ZZP'ers over hem zien ("Pakt reacties op" / "Laat reacties liggen"), terug naar hemzelf als
 * zelfverbeter-nudge. Presentationeel — de data en het oordeel komen server-side binnen (geen
 * client-side beslissingen). Spiegelt `PaymentReputationCard`.
 */
export function ResponsivenessReputationCard({
  responsiveness,
}: {
  responsiveness: ClientResponsiveness;
}) {
  const { handledPct, oldestPendingDays, stalePending, sampleSize } = responsiveness;
  const reputation = summarizeResponsivenessReputation(responsiveness);
  // Onder de minimum-steekproef tonen we geen cijfers; wél concreet hoeveel reacties er nog nodig
  // zijn (zelfde presentatie-regel als de betaalreputatie-kaart, geen misleidend beeld).
  const sampleNotice = insufficientSampleNotice(sampleSize, RESPONSIVENESS_MIN_SAMPLE_SIZE, {
    singular: "reactie",
    plural: "reacties",
  });

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-medium">Jouw reactiereputatie</h2>
          <BehaviorToneBadge tone={reputation.tone} />
        </div>

        <p className="text-sm font-medium">{reputation.headline}</p>

        {reputation.hasStats && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {handledPct != null && (
              <span>
                <span className="font-medium tabular-nums text-foreground">{handledPct}%</span>{" "}
                opgepakt
              </span>
            )}
            {stalePending > 0 && (
              <span>
                <span className="font-medium tabular-nums text-foreground">{stalePending}</span>{" "}
                {stalePending === 1 ? "reactie" : "reacties"} te lang open
              </span>
            )}
            {stalePending === 0 && oldestPendingDays != null && (
              <span>
                oudste open{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {oldestPendingDays} {oldestPendingDays === 1 ? "dag" : "dagen"}
                </span>
              </span>
            )}
            <span className="text-xs">
              op basis van {sampleSize} {sampleSize === 1 ? "reactie" : "reacties"}
            </span>
          </div>
        )}

        {!reputation.hasStats && sampleNotice && (
          <p className="text-sm text-muted-foreground">{sampleNotice}.</p>
        )}

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {reputation.tip} {"Dit signaal zien ZZP'ers bij je opdrachten."}
        </p>
      </CardContent>
    </Card>
  );
}
