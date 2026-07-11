import { Star } from "lucide-react";
import { RatingStars } from "@/components/reviews/rating-stars";
import { type ReviewAggregate } from "@/lib/reviews";
import { getTranslator } from "@/lib/i18n/server";

interface Props {
  reputation: ReviewAggregate;
}

/**
 * Compact blok dat de publieke reputatie van een opdrachtgever toont aan de ZZP'er op de
 * opdracht-detailpagina: het gemiddelde cijfer + aantal beoordelingen dat andere ZZP'ers
 * achterlieten na een afgeronde samenwerking. Spiegelbeeld van de reputatie-rating die
 * opdrachtgevers over ZZP'ers zien op /kandidaten (#700). Alleen geaggregeerd — nooit individuele
 * beoordelingen. Wordt alleen gerenderd bij ≥1 gepubliceerde beoordeling (de fetcher geeft anders
 * null), zodat een nieuwkomer niet onterecht zwak lijkt.
 */
export async function CompanyReputationBlock({ reputation }: Props) {
  const { average, count } = reputation;
  const { t } = await getTranslator();

  return (
    <section
      aria-label={t("Reputatie opdrachtgever")}
      className="space-y-2 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2">
        <Star className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">{t("Reputatie")}</h2>
        <RatingStars average={average} count={count} size="md" showValue />
      </div>
      <p className="text-sm text-muted-foreground">
        {t("Op basis van")}{" "}
        <span className="font-medium tabular-nums text-foreground">{count}</span>{" "}
        {t(count === 1 ? "beoordeling" : "beoordelingen")}{" "}
        {t("van ZZP'ers na een afgeronde samenwerking")}.
      </p>
    </section>
  );
}
