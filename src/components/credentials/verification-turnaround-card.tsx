import { Clock, Hourglass } from "lucide-react";
import { type VerificationTurnaround } from "@/lib/verification-turnaround";
import { waitingLabel } from "@/lib/verification-queue";
import { Card, CardContent } from "@/components/ui/card";
import { plural } from "@/lib/plural";

/**
 * Geruststellend doorlooptijd-signaal voor een ZZP'er met een certificaat in beoordeling.
 * Verbergt zichzelf zodra er niets in beoordeling is — geen lege ruis. Toont de typische +
 * p90-doorlooptijd zodra er genoeg historische data is (anders alleen "in de wachtrij"), plus
 * hoe lang het langst-wachtende ingediende certificaat al wacht. Read-only, server-side afgeleid.
 */
export function VerificationTurnaroundCard({
  pendingCount,
  oldestWaitingDays,
  turnaround,
}: {
  pendingCount: number;
  oldestWaitingDays: number;
  turnaround: VerificationTurnaround | null;
}): React.JSX.Element | null {
  if (pendingCount <= 0) return null;

  return (
    <Card data-testid="verification-turnaround-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Hourglass className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In beoordeling
          </h2>
        </div>

        <p className="mt-3 text-sm text-foreground">
          <span className="font-mono font-semibold">{pendingCount}</span>{" "}
          {pendingCount === 1 ? "certificaat wacht" : "certificaten wachten"} op beoordeling.{" "}
          {turnaround ? (
            <>
              Beoordelingen duren doorgaans{" "}
              <span className="font-medium">~{plural(turnaround.typicalDays, "dag", "dagen")}</span>
              {turnaround.p90Days > turnaround.typicalDays ? (
                <>
                  , de meeste binnen{" "}
                  <span className="font-medium">{plural(turnaround.p90Days, "dag", "dagen")}</span>
                </>
              ) : null}
              . Je hoeft zelf niets te doen.
            </>
          ) : (
            <>
              Een beoordelaar bekijkt je bewijsstuk zo snel mogelijk. Je hoeft zelf niets te doen.
            </>
          )}
        </p>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          Langst wachtend: {waitingLabel(oldestWaitingDays)}.
        </p>
      </CardContent>
    </Card>
  );
}
