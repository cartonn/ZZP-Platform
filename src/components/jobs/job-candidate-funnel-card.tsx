import Link from "next/link";
import { Users, Sparkle, ArrowRight } from "lucide-react";
import { type JobPipeline } from "@/lib/job-pipeline";
import { buildKandidatenHref } from "@/lib/kandidaten-filter";
import { plural } from "@/lib/plural";

/**
 * Reactie-funnel voor de eigenaar op de opdracht-detailpagina: in één blik hoeveel mensen reageerden
 * en waar ze staan (nieuw / bekeken / shortlist / geaccepteerd / afgewezen), met een directe instap
 * naar het beoordelen van déze opdracht op `/kandidaten`. Presentationeel: de tellingen zijn
 * server-side afgeleid (`summarizeJobPipelineFromCounts`); deze component beslist niets en toont geen
 * kandidaatgegevens. Rendert alleen wanneer er ten minste één actieve reactie is.
 */
export function JobCandidateFunnelCard({
  pipeline,
  jobId,
}: {
  pipeline: JobPipeline;
  jobId: string;
}) {
  if (pipeline.total === 0) return null;

  // Alleen niet-lege segmenten tonen — een rij nullen is ruis. "Nieuw" krijgt nadruk (vraagt actie).
  const segments: { label: string; value: number; className: string }[] = [
    { label: "bekeken", value: pipeline.viewed, className: "text-foreground" },
    { label: "op shortlist", value: pipeline.shortlist, className: "text-foreground" },
    { label: "geaccepteerd", value: pipeline.accepted, className: "text-success" },
    { label: "afgewezen", value: pipeline.rejected, className: "text-muted-foreground" },
  ].filter((s) => s.value > 0);

  const href = buildKandidatenHref({ job: jobId });

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="size-4" aria-hidden /> Reacties
        </p>
        <span className="text-sm text-muted-foreground">
          {plural(pipeline.total, "reactie", "reacties")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        {pipeline.newCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
            <Sparkle className="size-3.5" aria-hidden />
            {pipeline.newCount} nieuw
          </span>
        )}
        {segments.map((s) => (
          <span key={s.label} className={s.className}>
            <span className="font-medium tabular-nums">{s.value}</span> {s.label}
          </span>
        ))}
      </div>

      <Link
        href={href}
        className="focus-ring inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
      >
        Bekijk kandidaten
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>

      <p className="text-xs text-muted-foreground">Alleen zichtbaar voor jou.</p>
    </div>
  );
}
