import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { type CollaborationRenewalPhase, renewalHeadline } from "@/lib/collaboration-renewal";
import { formatDateShortNl } from "@/lib/format-date";

export interface RenewalNudgeProps {
  phase: CollaborationRenewalPhase;
  daysRemaining: number | null;
  endDate: Date;
  viewer: "CLIENT" | "FREELANCER";
  jobId: string;
  counterparty: string;
}

/**
 * Rustige, adviserende nudge onder de status-regel: de samenwerking nadert (of passeerde) de
 * einddatum — plan tijdig een vervolg. Rolafhankelijke actie: de opdrachtgever plaatst een
 * vervolgopdracht (voorgevuld vanuit deze opdracht), de ZZP'er houdt zijn beschikbaarheid actueel.
 * Geen blokkade — puur handelingsperspectief.
 */
export function RenewalNudge({
  phase,
  daysRemaining,
  endDate,
  viewer,
  jobId,
  counterparty,
}: RenewalNudgeProps) {
  if (phase !== "ending_soon" && phase !== "overdue") return null;

  const overdue = phase === "overdue";
  const context = overdue
    ? `De einddatum (${formatDateShortNl(endDate)}) is verstreken.`
    : `Einddatum ${formatDateShortNl(endDate)}.`;

  const body =
    viewer === "CLIENT"
      ? `Wil je ${counterparty} langer inzetten? Plan op tijd een vervolg zodat de inzet niet stilvalt.`
      : `Loopt deze inzet door? Houd je beschikbaarheid actueel en stem een vervolg af met ${counterparty}.`;

  const cta =
    viewer === "CLIENT"
      ? { href: `/opdrachten/nieuw?from=${jobId}`, label: "Plaats een vervolgopdracht" }
      : { href: "/beschikbaarheid", label: "Werk je beschikbaarheid bij" };

  return (
    <div
      className={`flex flex-wrap items-start gap-3 rounded-md border px-3 py-2.5 text-sm ${
        overdue ? "border-warning/40 bg-warning/10" : "border-primary/30 bg-primary/5"
      }`}
    >
      <CalendarClock
        className={`mt-0.5 size-4 shrink-0 ${overdue ? "text-warning" : "text-primary"}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-medium text-foreground">
          {renewalHeadline(phase, daysRemaining)} · {context}
        </p>
        <p className="text-muted-foreground">{body}</p>
      </div>
      <Link
        href={cta.href}
        className="shrink-0 whitespace-nowrap text-sm font-medium text-primary hover:underline"
      >
        {cta.label}
      </Link>
    </div>
  );
}
