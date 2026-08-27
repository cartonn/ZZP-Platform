import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { multiApplyLabel, type MultiApplyJob } from "@/lib/candidate-multi-apply";

/**
 * Compacte chip die toont dat deze kandidaat ook op andere opdrachten van dezelfde opdrachtgever
 * reageerde — een hoog-intentie/veelzijdigheidssignaal dat helpt de persoon op de best passende rol
 * te plaatsen en niet dubbel te tellen. De titels van de andere opdrachten staan in de tooltip zodat
 * de kop compact blijft; de deeplinks staan in de uitgeklapte rij-inhoud. Rendert niets zonder breedte.
 */
export function CandidateMultiApplyBadge({
  otherJobs,
  className,
}: {
  otherJobs: readonly MultiApplyJob[];
  className?: string;
}) {
  if (otherJobs.length < 1) return null;
  return (
    <Badge
      variant="muted"
      className={className}
      title={`Reageerde ook op: ${otherJobs.map((job) => job.title).join(", ")}`}
    >
      <Layers className="mr-1 size-3" aria-hidden /> {multiApplyLabel(otherJobs.length)}
    </Badge>
  );
}
