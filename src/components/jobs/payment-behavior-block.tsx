import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type PaymentBehavior, type PaymentTone } from "@/lib/payment-behavior";
import { getTranslator } from "@/lib/i18n/server";

const TONE_VARIANT: Record<PaymentTone, "success" | "muted" | "warning" | "default"> = {
  good: "success",
  neutral: "default",
  warning: "warning",
  unknown: "muted",
};

const TONE_LABEL: Record<PaymentTone, string> = {
  good: "Goed",
  neutral: "Gemiddeld",
  warning: "Let op",
  unknown: "Onbekend",
};

interface Props {
  behavior: PaymentBehavior;
}

/**
 * Compact blok dat het betaalgedrag van een opdrachtgever toont aan de ZZP'er op de
 * opdracht-detailpagina. Toont alleen geaggregeerde statistieken — geen individuele
 * factuurdata.
 */
export async function PaymentBehaviorBlock({ behavior }: Props) {
  const { sampleSize, avgDaysToPay, onTimePct, tone } = behavior;
  const { t } = await getTranslator();

  return (
    <section
      aria-label={t("Betaalgedrag opdrachtgever")}
      className="space-y-2 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2">
        <CreditCard className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">{t("Betaalgedrag")}</h2>
        <Badge variant={TONE_VARIANT[tone]}>{t(TONE_LABEL[tone])}</Badge>
      </div>

      {tone === "unknown" ? (
        <p className="text-sm text-muted-foreground">
          {t("Nog te weinig betalingen om iets te zeggen.")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {avgDaysToPay != null && (
            <span>
              {t("Gemiddeld")}{" "}
              <span className="font-medium tabular-nums text-foreground">
                {avgDaysToPay} {t("dagen")}
              </span>{" "}
              {t("betaaltijd")}
            </span>
          )}
          {onTimePct != null && (
            <span>
              <span className="font-medium tabular-nums text-foreground">{onTimePct}%</span>{" "}
              {t("op tijd")}
            </span>
          )}
          <span className="text-xs">
            {t("op basis van")} {sampleSize} {t(sampleSize === 1 ? "betaling" : "betalingen")}
          </span>
        </div>
      )}
    </section>
  );
}
