import { CalendarX2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ClientReliability, type ReliabilityTone } from "@/lib/client-reliability";
import { getTranslator } from "@/lib/i18n/server";

const TONE_VARIANT: Record<ReliabilityTone, "success" | "muted" | "warning" | "default"> = {
  good: "success",
  neutral: "default",
  warning: "warning",
  unknown: "muted",
};

const TONE_LABEL: Record<ReliabilityTone, string> = {
  good: "Goed",
  neutral: "Gemiddeld",
  warning: "Let op",
  unknown: "Onbekend",
};

interface Props {
  reliability: ClientReliability;
}

/**
 * Compact blok dat de annuleringsbetrouwbaarheid van een opdrachtgever toont aan de ZZP'er op de
 * opdracht-detailpagina. Spiegelbeeld van het betaalgedrag-blok. Toont alleen geaggregeerde
 * statistieken — geen individuele samenwerkingsdata.
 */
export async function ClientReliabilityBlock({ reliability }: Props) {
  const { sampleSize, cancellations, lastMinute, cancelRate, tone } = reliability;
  const { t } = await getTranslator();

  return (
    <section
      aria-label={t("Annuleringsbetrouwbaarheid opdrachtgever")}
      className="space-y-2 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2">
        <CalendarX2 className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">{t("Annuleringsgedrag")}</h2>
        <Badge variant={TONE_VARIANT[tone]}>{t(TONE_LABEL[tone])}</Badge>
      </div>

      {tone === "unknown" ? (
        <p className="text-sm text-muted-foreground">
          {t("Nog te weinig afgewikkelde samenwerkingen om iets te zeggen.")}
        </p>
      ) : cancellations === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("Geen enkele afspraak geannuleerd over")} {sampleSize}{" "}
          {t(sampleSize === 1 ? "samenwerking" : "samenwerkingen")}.
        </p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="font-medium tabular-nums text-foreground">{cancelRate}%</span>{" "}
            {t("geannuleerd")}
          </span>
          {lastMinute > 0 && (
            <span>
              {t("waarvan")}{" "}
              <span className="font-medium tabular-nums text-foreground">{lastMinute}</span>{" "}
              {t("last-minute")}
            </span>
          )}
          <span className="text-xs">
            {t("op basis van")} {sampleSize}{" "}
            {t(sampleSize === 1 ? "samenwerking" : "samenwerkingen")}
          </span>
        </div>
      )}
    </section>
  );
}
