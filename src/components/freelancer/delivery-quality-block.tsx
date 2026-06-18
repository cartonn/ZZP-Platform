import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DELIVERY_TONE_LABEL,
  type DeliveryQuality,
  type DeliveryTone,
} from "@/lib/collaboration-quality";

const TONE_VARIANT: Record<DeliveryTone, "success" | "warning" | "muted"> = {
  EXCELLENT: "success",
  RELIABLE: "success",
  DEVELOPING: "warning",
  INSUFFICIENT: "muted",
};

interface Props {
  quality: DeliveryQuality;
}

/**
 * Compacte leverbetrouwbaarheid van een ZZP'er, getoond aan de opdrachtgever bij het beoordelen van
 * een kandidaat. Spiegelbeeld van de opdrachtgever-signalen (betaalgedrag/annuleringsgedrag/
 * reactiebereidheid) die de ZZP'er op de opdracht ziet. Geaggregeerd over alle samenwerkingen — geen
 * individuele data van een andere opdrachtgever. Verbergt zichzelf bij een te kleine steekproef
 * (geen misleidende cijfers).
 */
export function DeliveryQualityBlock({ quality }: Props) {
  if (quality.tone === "INSUFFICIENT") return null;
  const { firstTimeRightRate, approvedPerformances, correctedPerformances, avgApprovalDays, tone } =
    quality;

  return (
    <section
      aria-label="Leverbetrouwbaarheid ZZP'er"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
    >
      <span className="flex items-center gap-1.5 font-medium text-foreground">
        <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
        Leverbetrouwbaarheid
      </span>
      <Badge variant={TONE_VARIANT[tone]}>{DELIVERY_TONE_LABEL[tone]}</Badge>
      <span>
        <span className="font-medium tabular-nums text-foreground">{firstTimeRightRate}%</span> in
        één keer akkoord
      </span>
      {correctedPerformances > 0 && (
        <span>
          <span className="font-medium tabular-nums text-foreground">{correctedPerformances}</span>{" "}
          gecorrigeerd
        </span>
      )}
      {avgApprovalDays != null && (
        <span>
          gem. <span className="font-medium tabular-nums text-foreground">{avgApprovalDays}</span>{" "}
          dgn tot akkoord
        </span>
      )}
      <span>
        over {approvedPerformances} {approvedPerformances === 1 ? "prestatie" : "prestaties"}
      </span>
    </section>
  );
}
