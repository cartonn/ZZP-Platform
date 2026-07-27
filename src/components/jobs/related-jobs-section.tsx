import Link from "next/link";
import { MatchMeter } from "@/components/ui/match-meter";
import { type JobMatch } from "@/lib/recommendations";
import { getTranslator } from "@/lib/i18n/server";

/**
 * "Ook passend bij jouw profiel": andere open opdrachten die bij het profiel van de ZZP'er passen,
 * getoond op de opdracht-detailpagina. Dit zijn profiel-matches, geen inhoudelijk "soortgelijke"
 * opdrachten — onder een installatievacature horen geen frontend-suggesties als "soortgelijk".
 * Hergebruikt de server-berekende matchscore + sterkste reden uit `recommendedJobs`; de ZZP'er hoeft
 * niet zelf te zoeken. Verbergt zich zonder suggesties.
 *
 * `title`/`description` overschrijven de standaardkoppen zodat hetzelfde lijstblok in een andere
 * context hergebruikt kan worden (bv. een re-engagement-nudge na een afwijzing op /reacties); beide
 * zijn al vertaalde/samengestelde tekst (worden niet nogmaals door `t()` gehaald).
 */
export async function RelatedJobsSection({
  jobs,
  title,
  description,
}: {
  jobs: JobMatch[];
  title?: React.ReactNode;
  description?: React.ReactNode;
}) {
  if (jobs.length === 0) return null;
  const { t } = await getTranslator();
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title ?? t("Ook passend bij jouw profiel")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {description ?? t("Andere open opdrachten die aansluiten op jouw profiel.")}
        </p>
      </div>
      <ul className="divide-y divide-border">
        {jobs.map((j) => (
          <li key={j.jobId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <Link
                href={`/opdrachten/${j.jobId}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {j.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {j.companyName}
                {j.reason ? ` · ${t(j.reason)}` : ""}
              </p>
            </div>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-sm font-semibold tracking-tight text-primary">
                {j.score}%
              </span>
              <MatchMeter score={j.score} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
