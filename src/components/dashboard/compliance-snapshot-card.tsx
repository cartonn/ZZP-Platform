import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { type ClientComplianceSnapshot } from "@/lib/collaboration-alerts";
import { plural } from "@/lib/plural";

export function ComplianceSnapshotCard({ snapshot }: { snapshot: ClientComplianceSnapshot }) {
  if (snapshot.total === 0) return null;

  interface Chip {
    count: number;
    label: string;
  }

  const chips: Chip[] = [
    { count: snapshot.missing, label: "mist een certificaat" },
    { count: snapshot.expired, label: "verlopen" },
    { count: snapshot.expiringSoon, label: "verloopt binnenkort" },
    { count: snapshot.inReview, label: "in beoordeling" },
  ].filter((c) => c.count > 0);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Certificaten van je ZZP&apos;ers
        </h2>
      </div>

      <p className="mt-3 text-sm text-foreground">
        <span className="font-mono font-semibold">{snapshot.total}</span>{" "}
        {plural(snapshot.total, "samenwerking vraagt", "samenwerkingen vragen")} aandacht
      </p>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
            >
              <span className="font-mono">{chip.count}</span>&nbsp;{chip.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link
          href="/samenwerkingen"
          className="focus-ring inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Bekijk samenwerkingen
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
