import { MailCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ClientResponsiveness, type ResponsivenessTone } from "@/lib/client-responsiveness";

const TONE_VARIANT: Record<ResponsivenessTone, "success" | "muted" | "warning" | "default"> = {
  good: "success",
  neutral: "default",
  warning: "warning",
  unknown: "muted",
};

const TONE_LABEL: Record<ResponsivenessTone, string> = {
  good: "Goed",
  neutral: "Gemiddeld",
  warning: "Let op",
  unknown: "Onbekend",
};

interface Props {
  responsiveness: ClientResponsiveness;
}

function reactieWord(n: number): string {
  return n === 1 ? "reactie" : "reacties";
}

/**
 * Compact blok dat de reactiebereidheid van een opdrachtgever toont aan de ZZP'er op de
 * opdracht-detailpagina. Derde lid naast het betaalgedrag- en annuleringsgedrag-blok. Toont alleen
 * geaggregeerde tellingen — geen individuele reactie van een andere ZZP'er.
 */
export function ClientResponsivenessBlock({ responsiveness }: Props) {
  const { sampleSize, pending, handledPct, oldestPendingDays, stalePending, tone } = responsiveness;

  return (
    <section
      aria-label="Reactiebereidheid opdrachtgever"
      className="space-y-2 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2">
        <MailCheck className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">Reactiebereidheid</h2>
        <Badge variant={TONE_VARIANT[tone]}>{TONE_LABEL[tone]}</Badge>
      </div>

      {tone === "unknown" ? (
        <p className="text-sm text-muted-foreground">
          Nog te weinig reacties ontvangen om iets te zeggen.
        </p>
      ) : pending === 0 ? (
        <p className="text-sm text-muted-foreground">
          Alle {sampleSize} {reactieWord(sampleSize)} opgepakt.
        </p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="font-medium tabular-nums text-foreground">{handledPct}%</span> opgepakt
          </span>
          <span>
            <span className="font-medium tabular-nums text-foreground">{pending}</span> nog open
          </span>
          {stalePending > 0 && oldestPendingDays != null && (
            <span>
              oudste al{" "}
              <span className="font-medium tabular-nums text-foreground">{oldestPendingDays}</span>{" "}
              dagen open
            </span>
          )}
          <span className="text-xs">
            op basis van {sampleSize} {reactieWord(sampleSize)}
          </span>
        </div>
      )}
    </section>
  );
}
