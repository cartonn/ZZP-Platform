import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceBadge } from "@/components/compliance-badge";
import { AvailabilityBadge } from "@/components/availability-badge";
import { TrustBadge } from "@/components/trust/trust-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { startConversationWithFreelancer } from "@/app/(protected)/berichten/actions";
import type { FreelancerSuggestion } from "@/lib/suggestions";

interface ReplacementPanelProps {
  jobId: string;
  suggestions: FreelancerSuggestion[];
}

export function ReplacementPanel({ jobId, suggestions }: ReplacementPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium">Herplaatsing</h2>
        <p className="text-xs text-muted-foreground">
          Deze inzet is geannuleerd. Stel direct een passende, beschikbare ZZP&apos;er voor om de
          dienst opnieuw in te vullen.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Geen direct passende ZZP'ers"
          description="Open de opdracht om de werving te starten of de eisen aan te passen."
          action={{ label: "Naar de opdracht", href: `/opdrachten/${jobId}` }}
        />
      ) : (
        <ul className="divide-y divide-border">
          {suggestions.map((f) => (
            <li
              key={f.freelancerId}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Link
                  href={`/zzp/${f.freelancerId}`}
                  target="_blank"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {f.name}
                </Link>
                <TrustBadge level={f.trustLevel} />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <AvailabilityBadge status={f.availability} />
                <ComplianceBadge status={f.compliance} />
                <Badge variant="accent">Match {f.score}%</Badge>
                <form action={startConversationWithFreelancer.bind(null, jobId, f.freelancerId)}>
                  <Button type="submit" variant="secondary" size="sm">
                    Bericht sturen
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
