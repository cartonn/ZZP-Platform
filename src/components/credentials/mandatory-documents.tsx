import Link from "next/link";
import { Check, Clock, TriangleAlert } from "lucide-react";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type MandatoryDocState, type MandatoryDocStatus } from "@/lib/mandatory-documents";
import { Button } from "@/components/ui/button";

const STATE: Record<
  MandatoryDocState,
  { label: string; tone: "ok" | "warn" | "danger"; action: boolean }
> = {
  satisfied: { label: "Aangeleverd", tone: "ok", action: false },
  inReview: { label: "In beoordeling", tone: "warn", action: false },
  expired: { label: "Verlopen", tone: "danger", action: true },
  missing: { label: "Ontbreekt", tone: "danger", action: true },
};

/**
 * Checklist van de platformbrede verplichte documenten met hun actuele status. Maakt voor de ZZP'er
 * concreet wat hij nog moet aanleveren om opdrachten te kunnen vervullen — server-side bepaald.
 */
export function MandatoryDocuments({
  items,
  allSatisfied,
}: {
  items: MandatoryDocStatus[];
  allSatisfied: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-medium">Verplichte documenten</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Deze documenten heb je nodig om opdrachten te mogen vervullen.
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const s = STATE[item.state];
          return (
            <li key={item.type} className="flex items-center gap-2 text-sm">
              {s.tone === "ok" ? (
                <Check className="size-4 shrink-0 text-success" aria-hidden />
              ) : s.tone === "warn" ? (
                <Clock className="size-4 shrink-0 text-warning" aria-hidden />
              ) : (
                <TriangleAlert className="size-4 shrink-0 text-danger" aria-hidden />
              )}
              <span className={item.state === "satisfied" ? "" : "font-medium"}>
                {CREDENTIAL_TYPE_LABEL[item.type]}
              </span>
              <span
                className={
                  s.tone === "danger"
                    ? "text-xs text-danger"
                    : s.tone === "warn"
                      ? "text-xs text-warning"
                      : "text-xs text-muted-foreground"
                }
              >
                {s.label}
              </span>
              {s.action && (
                <Button asChild size="sm" variant="secondary" className="ml-auto">
                  <Link href="/certificaten/nieuw">Toevoegen</Link>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {allSatisfied && (
        <p className="mt-3 text-sm text-muted-foreground">
          Je hebt alle verplichte documenten aangeleverd.
        </p>
      )}
    </section>
  );
}
