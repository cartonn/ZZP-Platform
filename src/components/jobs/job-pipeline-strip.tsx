import { Sparkle } from "lucide-react";
import { type JobPipeline } from "@/lib/job-pipeline";
import { plural } from "@/lib/plural";

/**
 * Compacte reactie-pijplijn voor een opdrachtgever-opdrachtkaart. Antwoordt op "welke opdracht
 * vraagt nu mijn aandacht?": nieuwe (nog niet bekeken) reacties worden uitgelicht, de rest blijft
 * rustig en muted. Geen reacties → een nette lege regel.
 */
export function JobPipelineStrip({ pipeline }: { pipeline: JobPipeline }) {
  if (pipeline.total === 0) {
    return <p className="text-xs text-muted-foreground">Nog geen reacties</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="text-muted-foreground">{plural(pipeline.total, "reactie", "reacties")}</span>
      {pipeline.newCount > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
          <Sparkle className="size-3" aria-hidden />
          {pipeline.newCount} nieuw
        </span>
      )}
      {pipeline.shortlist > 0 && (
        <span className="text-muted-foreground">{pipeline.shortlist} op shortlist</span>
      )}
      {pipeline.accepted > 0 && (
        <span className="font-medium text-success">{pipeline.accepted} geaccepteerd</span>
      )}
    </div>
  );
}
