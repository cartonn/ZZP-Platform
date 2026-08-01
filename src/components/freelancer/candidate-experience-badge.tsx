import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { candidateExperienceSignal } from "@/lib/candidate-experience";

/**
 * Compacte chip met de platform-brede staat van dienst van een kandidaat ("12 afgeronde klussen").
 * Alleen getoond voor een kandidaat die nog niet eerder mét déze opdrachtgever heeft samengewerkt —
 * dan draagt de sterkere gedeelde-historie-chip het signaal en zou deze stapelen. Rendert niets
 * onder de drempel of bij ontbrekende data.
 */
export function CandidateExperienceBadge({
  completedCollaborations,
  hasSharedHistory,
  className,
}: {
  completedCollaborations: number | undefined;
  hasSharedHistory: boolean;
  className?: string;
}) {
  const signal = candidateExperienceSignal(completedCollaborations ?? 0, hasSharedHistory);
  if (!signal) return null;
  return (
    <Badge variant="muted" className={className} title="Afgerond op het platform">
      <Briefcase className="mr-1 size-3" aria-hidden /> {signal.label}
    </Badge>
  );
}
