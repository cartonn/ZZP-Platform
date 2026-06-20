import Link from "next/link";
import { Award, Clock, Plus } from "lucide-react";
import { type CredentialDemand } from "@/lib/credential-demand";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { plural } from "@/lib/plural";

const MAX_LISTED = 5;

/**
 * Gevraagde certificaten: de next-action-spiegel voor de ZZP'er. Over de open opdrachten die hij mag
 * zien, welke vereiste certificaat-typen heeft hij nog niet geverifieerd — gerangschikt naar hoeveel
 * opdrachten elk zou ontsluiten. Verklaarbare matching: elke regel toont wat het oplevert.
 * Verbergt zichzelf zodra er geen gaten zijn — geen lege ruis op de pagina. Read-only.
 */
export function CredentialDemandCard({
  demand,
}: {
  demand: CredentialDemand;
}): React.JSX.Element | null {
  if (demand.gaps.length === 0) return null;

  const listed = demand.gaps.slice(0, MAX_LISTED);
  const remaining = demand.gaps.length - listed.length;

  return (
    <Card data-testid="credential-demand-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Award className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Gevraagde certificaten
          </h2>
        </div>

        <p className="mt-3 text-sm text-foreground">
          <span className="font-mono font-semibold">{demand.blockedOpportunities}</span> open{" "}
          {demand.blockedOpportunities === 1 ? "opdracht vraagt" : "opdrachten vragen"} een
          certificaat dat je nog niet geverifieerd hebt.
        </p>

        <ul className="mt-4 space-y-2.5">
          {listed.map((gap) => (
            <li key={gap.type} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Award className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate text-foreground">{CREDENTIAL_TYPE_LABEL[gap.type]}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {plural(gap.opportunityCount, "opdracht", "opdrachten")}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-2">
                {gap.state === "missing" ? (
                  <Badge variant="danger">Ontbreekt</Badge>
                ) : (
                  <Badge variant="warning">
                    <Clock className="mr-1 size-3" aria-hidden />
                    In behandeling
                  </Badge>
                )}
                {gap.state === "missing" && (
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/certificaten/nieuw">
                      <Plus className="size-4" aria-hidden />
                      Toevoegen
                    </Link>
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>

        {remaining > 0 && <p className="mt-3 text-xs text-muted-foreground">+{remaining} meer</p>}
      </CardContent>
    </Card>
  );
}
