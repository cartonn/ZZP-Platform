import Link from "next/link";
import { MailOpen, ChevronRight } from "lucide-react";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { type ReceivedInvitation } from "@/lib/received-invitations";

/**
 * "Je bent uitgenodigd": de directe uitnodigingen die de ZZP'er van opdrachtgevers ontving, prominent
 * bovenaan de find-work-pagina. Een uitnodiging is de hoogst-intente lead — een opdrachtgever koos
 * jóu specifiek — en verdient meer dan een vluchtige notificatie. Elke rij verwijst direct naar de
 * opdracht om te bekijken en te reageren. Verbergt zich zonder uitnodigingen.
 */
export function ReceivedInvitationsBand({ invitations }: { invitations: ReceivedInvitation[] }) {
  if (invitations.length === 0) return null;

  return (
    <section
      aria-labelledby="uitnodigingen-kop"
      className="rounded-lg border border-primary/30 bg-primary/5"
    >
      <div className="flex items-center gap-2 border-b border-primary/20 px-5 py-3">
        <MailOpen className="size-4 text-primary" aria-hidden />
        <h2 id="uitnodigingen-kop" className="text-sm font-semibold tracking-tight">
          Je bent uitgenodigd
        </h2>
        <span className="text-xs text-muted-foreground">
          {plural(
            invitations.length,
            "opdrachtgever nodigde je uit",
            "opdrachtgevers nodigden je uit",
          )}
        </span>
      </div>
      <ul className="divide-y divide-primary/10">
        {invitations.map((inv) => (
          <li key={inv.jobId}>
            <Link
              href={`/opdrachten/${inv.jobId}`}
              className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-primary/10"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{inv.jobTitle}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {inv.companyName} · uitgenodigd op {formatDateShortNl(inv.invitedAt)}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                Bekijk &amp; reageer
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
