import { CalendarClock } from "lucide-react";
import { type CompanyActivity } from "@/lib/company-activity";
import { formatMonthYearNl } from "@/lib/format-date";

interface Props {
  activity: CompanyActivity;
}

/**
 * Compacte activiteits-/anciënniteitsregel van een opdrachtgever, getoond aan de ZZP'er in het
 * "Over de opdrachtgever"-blok op de opdracht-detailpagina. Cold-start-vertrouwen: waar de
 * gedrags-/reputatieblokken (betaalgedrag/annulering/reactiebereidheid/reputatie) zich bij een
 * nieuwe opdrachtgever verbergen, blijft dit basissignaal staan. Toont alleen geaggregeerde
 * tellingen + de accountleeftijd — geen individuele data.
 */
export function CompanyActivityBlock({ activity }: Props) {
  const { memberSince, publishedJobs, completedCollaborations } = activity;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <CalendarClock className="size-3.5 text-muted-foreground" aria-hidden />
        Lid sinds {formatMonthYearNl(memberSince)}
      </span>
      {publishedJobs != null && (
        <span>
          <span className="font-medium tabular-nums text-foreground">{publishedJobs}</span>{" "}
          {publishedJobs === 1 ? "opdracht" : "opdrachten"} geplaatst
        </span>
      )}
      {completedCollaborations != null && (
        <span>
          <span className="font-medium tabular-nums text-foreground">
            {completedCollaborations}
          </span>{" "}
          afgeronde {completedCollaborations === 1 ? "samenwerking" : "samenwerkingen"}
        </span>
      )}
    </div>
  );
}
