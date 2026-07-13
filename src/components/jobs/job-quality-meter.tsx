import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { type JobQuality } from "@/lib/job-quality";

const LEVEL_COPY: Record<JobQuality["level"], { title: string; className: string }> = {
  strong: { title: "Sterke plaatsing", className: "text-success" },
  ok: { title: "Bijna compleet", className: "text-primary" },
  thin: { title: "Nog te mager", className: "text-warning" },
};

/**
 * Live kwaliteitsmeter voor het opdracht-formulier. Presentationeel: de score en de tips
 * komen uit de pure `assessJobQuality`, die het formulier bij elke wijziging herberekent.
 * Coacht de opdrachtgever naar een complete, aantrekkelijke plaatsing (meer/betere reacties)
 * zonder de zichtbaarheid te beïnvloeden — het is puur advies.
 */
export function JobQualityMeter({ quality }: { quality: JobQuality }) {
  const level = LEVEL_COPY[quality.level];

  return (
    <section
      aria-label="Kwaliteit van de plaatsing"
      className="space-y-3 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Kwaliteit van de plaatsing</h3>
        <span className={`text-sm font-semibold tabular-nums ${level.className}`}>
          {quality.score}%
        </span>
      </div>

      <Progress value={quality.score} />

      <p className="text-xs text-muted-foreground">
        <span className={`font-medium ${level.className}`}>{level.title}</span> —{" "}
        {quality.doneCount} van {quality.applicableCount} punten op orde. Completere opdrachten
        krijgen meer en betere reacties.
      </p>

      {quality.tips.length > 0 ? (
        <ul className="space-y-1.5">
          {quality.tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-foreground">
              <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Alles op orde — klaar om te publiceren.
        </p>
      )}
    </section>
  );
}
