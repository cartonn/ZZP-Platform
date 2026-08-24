import { ListChecks, ArrowRight } from "lucide-react";
import Link from "next/link";
import { type JobListingQuality } from "@/lib/job-listing-quality";

/**
 * Toont de eigenaar van een gepubliceerde opdracht concrete verbeterpunten aan de plaatsing zelf
 * (omschrijving, skills, startdatum, locatie …). Presentationeel — de kwaliteit is server-side
 * berekend (`assessJobListingQuality`, gevoed door de bestaande `assessJobQuality`); deze component
 * beslist niets. Rendert niets wanneer alle listing-onderdelen ingevuld zijn.
 */
export function JobListingQualityCard({
  quality,
  editHref,
}: {
  quality: JobListingQuality;
  editHref: string;
}) {
  if (quality.complete) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ListChecks className="size-4" aria-hidden /> Maak deze opdracht sterker
        </p>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {quality.doneCount}/{quality.total}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Een complete opdracht krijgt meer en betere reacties. Nog toe te voegen:
      </p>

      <ul className="space-y-2">
        {quality.openTips.map((tip) => (
          <li key={tip.code} className="flex items-start gap-2 text-xs">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
            <span>
              <span className="font-medium text-foreground">{tip.label}</span>
              <span className="text-muted-foreground"> — {tip.tip}</span>
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={editHref}
        className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
      >
        Opdracht bewerken
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>

      <p className="text-xs text-muted-foreground">Alleen zichtbaar voor jou.</p>
    </div>
  );
}
