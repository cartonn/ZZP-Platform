import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { type JobCollaborationConflict } from "@/lib/job-collaboration-conflict";
import { formatDateShortNl } from "@/lib/format-date";

/**
 * Waarschuwt de ZZP'er op de opdracht-detail dat de startdatum binnen de looptijd van een al lopende
 * samenwerking valt. Presentationeel: het signaal is server-berekend
 * (`assessJobCollaborationConflict`) en beslist niets — de ZZP'er kan gewoon reageren, dit is een
 * geheugensteuntje tegen dubbelboeking met een bestaande verbintenis.
 */
export function JobCollaborationConflictCard({ conflict }: { conflict: JobCollaborationConflict }) {
  const period = conflict.endDate
    ? `${formatDateShortNl(conflict.startDate)} – ${formatDateShortNl(conflict.endDate)}`
    : `vanaf ${formatDateShortNl(conflict.startDate)}`;

  return (
    <div className="space-y-1.5 rounded-lg border border-danger/40 bg-danger/5 p-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-danger">
        <CalendarClock className="size-4" aria-hidden />
        Botst met een lopende samenwerking
      </p>
      <p className="text-sm text-foreground">
        De startdatum valt binnen je lopende samenwerking{" "}
        <span className="font-medium">{conflict.jobTitle}</span> bij{" "}
        <span className="font-medium">{conflict.clientName}</span> ({period}).
      </p>
      <p className="text-xs text-muted-foreground">
        Je kunt nog steeds reageren.{" "}
        <Link href="/samenwerkingen" className="font-medium underline underline-offset-2">
          Bekijk je samenwerkingen
        </Link>{" "}
        om te controleren of dit te combineren is.
      </p>
    </div>
  );
}
