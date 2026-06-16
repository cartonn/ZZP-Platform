import { type ApplicationOutcomes } from "@/lib/application-outcomes";
import { plural } from "@/lib/plural";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Compacte samenvatting van de reactie-uitkomsten voor de ZZP'er: hoeveel reacties zijn bekeken,
 * staan op de shortlist en zijn geaccepteerd, plus de slaagkans. Presentationeel — alle telwerk
 * gebeurt server-side in `summarizeApplicationOutcomes`. Verbergt zichzelf bij te weinig reacties.
 */
export function OutcomesSummary({ outcomes }: { outcomes: ApplicationOutcomes }) {
  if (outcomes.total < 3) return null;

  const seenSub =
    outcomes.responseRate != null
      ? `${outcomes.responseRate}% van je reacties`
      : `van ${plural(outcomes.total, "reactie", "reacties")}`;

  const acceptedSub =
    outcomes.acceptanceRate != null
      ? `${outcomes.acceptanceRate}% van de beoordeelde reacties`
      : outcomes.collaborations > 0
        ? plural(outcomes.collaborations, "samenwerking gestart", "samenwerkingen gestart")
        : "nog niet genoeg beoordeeld";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Verstuurd" value={outcomes.total} sub={`${outcomes.open} lopen nog`} />
      <StatCard label="Bekeken" value={outcomes.seen} sub={seenSub} />
      <StatCard label="Op shortlist" value={outcomes.shortlisted} sub="kans op een voorstel" />
      <StatCard
        label="Geaccepteerd"
        value={outcomes.accepted}
        sub={acceptedSub}
        tone={outcomes.accepted > 0 ? "success" : "default"}
      />
    </div>
  );
}
