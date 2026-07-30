import { CalendarCheck, Info } from "lucide-react";
import { BehaviorToneBadge } from "@/components/jobs/signal-chips";
import { Card, CardContent } from "@/components/ui/card";
import { RELIABILITY_MIN_SAMPLE_SIZE, type ClientReliability } from "@/lib/client-reliability";
import { summarizeReliabilityReputation } from "@/lib/client-reliability-reputation";
import { insufficientSampleNotice } from "@/lib/sample-size";

/**
 * Betrouwbaarheidsreputatie-spiegel voor de opdrachtgever: hetzelfde geaggregeerde annulerings-
 * signaal dat ZZP'ers over hem zien (`ClientReliabilityBlock`), terug naar hemzelf als zelfverbeter-
 * nudge. Presentationeel — de data en het oordeel komen server-side binnen (geen client-side
 * beslissingen). Spiegelt de betaal- en reactiereputatie-kaart.
 */
export function ReliabilityReputationCard({ reliability }: { reliability: ClientReliability }) {
  const { cancelRate, lastMinute, sampleSize } = reliability;
  const reputation = summarizeReliabilityReputation(reliability);
  // Onder de minimum-steekproef tonen we geen cijfers; wél concreet hoeveel toezeggingen er nog nodig
  // zijn (zelfde presentatie-regel als de betaal-/leverbetrouwbaarheid-kaart, geen misleidend beeld).
  const sampleNotice = insufficientSampleNotice(sampleSize, RELIABILITY_MIN_SAMPLE_SIZE, {
    singular: "toezegging",
    plural: "toezeggingen",
  });

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <CalendarCheck className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-medium">Jouw betrouwbaarheid in afspraken</h2>
          <BehaviorToneBadge tone={reputation.tone} />
        </div>

        <p className="text-sm font-medium">{reputation.headline}</p>

        {reputation.hasStats && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {cancelRate != null && (
              <span>
                <span className="font-medium tabular-nums text-foreground">{cancelRate}%</span>{" "}
                geannuleerd
              </span>
            )}
            {lastMinute > 0 && (
              <span>
                waarvan{" "}
                <span className="font-medium tabular-nums text-foreground">{lastMinute}</span>{" "}
                last-minute
              </span>
            )}
            <span className="text-xs">
              op basis van {sampleSize} {sampleSize === 1 ? "toezegging" : "toezeggingen"}
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
