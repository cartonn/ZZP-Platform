import { Sparkles, Tag } from "lucide-react";
import { type SkillDemand } from "@/lib/skill-demand";
import { Card, CardContent } from "@/components/ui/card";
import { plural } from "@/lib/plural";

const MAX_LISTED = 6;

/**
 * Gevraagde vaardigheden: de next-action-spiegel voor de ZZP'er op zijn profiel. Over de open
 * opdrachten die hij mag zien, welke vereiste vaardigheden staan nog niet in zijn profiel —
 * gerangschikt naar hoeveel opdrachten elke zou ontsluiten. Verklaarbaar: elke regel toont wat het
 * oplevert, zodat de ZZP'er weet welke skill hem het meest oplevert om toe te voegen (het
 * skills-veld staat direct hieronder in het formulier). Verbergt zichzelf zodra er geen gaten zijn —
 * geen lege ruis op de pagina. Read-only.
 */
export function SkillDemandCard({ demand }: { demand: SkillDemand }): React.JSX.Element | null {
  if (demand.gaps.length === 0) return null;

  const listed = demand.gaps.slice(0, MAX_LISTED);
  const remaining = demand.gaps.length - listed.length;

  return (
    <Card data-testid="skill-demand-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Gevraagde vaardigheden
          </h2>
        </div>

        <p className="mt-3 text-sm text-foreground">
          <span className="font-mono font-semibold">{demand.blockedOpportunities}</span> open{" "}
          {demand.blockedOpportunities === 1 ? "opdracht vraagt" : "opdrachten vragen"} een
          vaardigheid die nog niet in je profiel staat. Voeg de passende toe bij Vaardigheden
          hieronder — dan matchen ze beter op jou.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {listed.map((gap) => (
            <li
              key={gap.skillId}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm"
            >
              <Tag className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-foreground">{gap.name}</span>
              <span className="text-xs text-muted-foreground">
                {plural(gap.opportunityCount, "opdracht", "opdrachten")}
              </span>
            </li>
          ))}
        </ul>

        {remaining > 0 && <p className="mt-3 text-xs text-muted-foreground">+{remaining} meer</p>}
      </CardContent>
    </Card>
  );
}
