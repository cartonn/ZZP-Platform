import { MailCheck } from "lucide-react";
import { BehaviorToneBadge } from "@/components/jobs/signal-chips";
import { type ClientResponsiveness } from "@/lib/client-responsiveness";
import { getTranslator } from "@/lib/i18n/server";

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
export async function ClientResponsivenessBlock({ responsiveness }: Props) {
  const { sampleSize, pending, handledPct, oldestPendingDays, stalePending, tone } = responsiveness;
  const { t } = await getTranslator();

  return (
    <section
      aria-label={t("Reactiebereidheid opdrachtgever")}
      className="space-y-2 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2">
        <MailCheck className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">{t("Reactiebereidheid")}</h2>
        <BehaviorToneBadge tone={tone} />
      </div>

      {tone === "unknown" ? (
        <p className="text-sm text-muted-foreground">
          {t("Nog te weinig reacties ontvangen om iets te zeggen.")}
        </p>
      ) : pending === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("Alle")} {sampleSize} {t(reactieWord(sampleSize))} {t("opgepakt")}.
        </p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="font-medium tabular-nums text-foreground">{handledPct}%</span>{" "}
            {t("opgepakt")}
          </span>
          <span>
            <span className="font-medium tabular-nums text-foreground">{pending}</span>{" "}
            {t("nog open")}
          </span>
          {stalePending > 0 && oldestPendingDays != null && (
            <span>
              {t("oudste al")}{" "}
              <span className="font-medium tabular-nums text-foreground">{oldestPendingDays}</span>{" "}
              {t("dagen open")}
            </span>
          )}
          <span className="text-xs">
            {t("op basis van")} {sampleSize} {t(reactieWord(sampleSize))}
          </span>
        </div>
      )}
    </section>
  );
}
