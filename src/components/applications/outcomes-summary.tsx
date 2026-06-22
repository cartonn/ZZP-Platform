import { type ApplicationOutcomes } from "@/lib/application-outcomes";
import { plural } from "@/lib/plural";
import { StatCard } from "@/components/ui/stat-card";
import { getTranslator } from "@/lib/i18n/server";

/**
 * Compacte samenvatting van de reactie-uitkomsten voor de ZZP'er: hoeveel reacties zijn bekeken,
 * staan op de shortlist en zijn geaccepteerd, plus de slaagkans. Presentationeel — alle telwerk
 * gebeurt server-side in `summarizeApplicationOutcomes`. Verbergt zichzelf bij te weinig reacties.
 */
export async function OutcomesSummary({ outcomes }: { outcomes: ApplicationOutcomes }) {
  if (outcomes.total < 3) return null;

  const { t } = await getTranslator();

  const seenSub =
    outcomes.responseRate != null
      ? `${outcomes.responseRate}% ${t("van je reacties")}`
      : `${t("van")} ${plural(outcomes.total, t("reactie"), t("reacties"))}`;

  const acceptedSub =
    outcomes.acceptanceRate != null
      ? `${outcomes.acceptanceRate}% ${t("van de beoordeelde reacties")}`
      : outcomes.collaborations > 0
        ? plural(outcomes.collaborations, t("samenwerking gestart"), t("samenwerkingen gestart"))
        : t("nog niet genoeg beoordeeld");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label={t("Verstuurd")}
        value={outcomes.total}
        sub={`${outcomes.open} ${t("lopen nog")}`}
      />
      <StatCard label={t("Bekeken")} value={outcomes.seen} sub={seenSub} />
      <StatCard
        label={t("Op shortlist")}
        value={outcomes.shortlisted}
        sub={t("kans op een voorstel")}
      />
      <StatCard
        label={t("Geaccepteerd")}
        value={outcomes.accepted}
        sub={acceptedSub}
        tone={outcomes.accepted > 0 ? "success" : "default"}
      />
    </div>
  );
}
