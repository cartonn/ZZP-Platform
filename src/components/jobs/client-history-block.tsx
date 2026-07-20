import { Handshake } from "lucide-react";
import { formatMonthYearNl } from "@/lib/format-date";
import {
  freelancerClientHistoryLabel,
  type FreelancerClientHistory,
} from "@/lib/freelancer-client-history";
import { getTranslator } from "@/lib/i18n/server";

interface Props {
  history: FreelancerClientHistory;
  companyName: string;
}

/**
 * Compact blok dat toont dat de ZZP'er al eerder een samenwerking met déze opdrachtgever heeft
 * afgerond — een sterk, laag-risico vertrouwenssignaal bij de beslissing om te reageren.
 * Symmetrisch met het "eerder samengewerkt"-signaal dat de opdrachtgever ziet op /kandidaten.
 * Alleen geaggregeerd (telling + laatste afronddatum) — nooit tarief- of andere partij-gegevens.
 * Wordt alleen gerenderd bij ≥1 afgeronde samenwerking (de fetcher geeft anders null).
 */
export async function ClientHistoryBlock({ history, companyName }: Props) {
  const { t } = await getTranslator();
  const last = formatMonthYearNl(history.lastCompletedAt);

  return (
    <section
      aria-label={t("Eerder samengewerkt met deze opdrachtgever")}
      className="space-y-2 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2">
        <Handshake className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">{t(freelancerClientHistoryLabel(history.count))}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("Je hebt al eerder voor")}{" "}
        <span className="font-medium text-foreground">{companyName}</span>{" "}
        {history.count === 1
          ? t("gewerkt")
          : t("gewerkt — een bekende opdrachtgever waarmee je vaker samenwerkte")}
        . {t("Laatst afgerond in")} <span className="tabular-nums">{last}</span>.
      </p>
    </section>
  );
}
