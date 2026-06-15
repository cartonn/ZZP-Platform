import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { type ExpiryOverview } from "@/lib/credential-expiry-overview";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { plural } from "@/lib/plural";

const MAX_LISTED = 5;

function daysLabel(days: number): string {
  if (days < 0) return "verlopen";
  if (days === 0) return "verloopt vandaag";
  return `over ${plural(days, "dag", "dagen")}`;
}

/**
 * Vervalkalender: een rustige momentopname van wat er aan certificaten vernieuwd moet worden.
 * Verbergt zichzelf zodra er niets binnen de horizon verloopt — geen lege ruis op de pagina.
 */
export function ExpiryOverviewCard({ overview }: { overview: ExpiryOverview }) {
  if (overview.total === 0) return null;

  // De vensters zijn exclusieve buckets (within60 = 31–60, within90 = 61–90), dus toon
  // expliciete reeksen i.p.v. "binnen N dagen" — dat laatste leest cumulatief en zou misleiden.
  const chips = [
    { count: overview.expired, label: "verlopen", tone: "danger" as const },
    { count: overview.within30, label: "binnen 30 dagen", tone: "warning" as const },
    { count: overview.within60, label: "31–60 dagen", tone: "muted" as const },
    { count: overview.within90, label: "61–90 dagen", tone: "muted" as const },
  ].filter((c) => c.count > 0);

  const listed = overview.items.slice(0, MAX_LISTED);
  const remaining = overview.total - listed.length;

  return (
    <section
      className="rounded-lg border border-border bg-card p-5"
      data-testid="expiry-overview-card"
    >
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 shrink-0 text-warning" aria-hidden />
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Vervalkalender
        </h2>
      </div>

      <p className="mt-3 text-sm text-foreground">
        <span className="font-mono font-semibold">{overview.total}</span>{" "}
        {plural(overview.total, "certificaat vraagt", "certificaten vragen")} aandacht
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className={
              "inline-flex items-center rounded-md border px-2 py-0.5 text-xs " +
              (chip.tone === "danger"
                ? "border-danger/30 bg-danger/10 text-danger"
                : chip.tone === "warning"
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-border bg-muted/40 text-muted-foreground")
            }
          >
            <span className="font-mono">{chip.count}</span>&nbsp;{chip.label}
          </span>
        ))}
      </div>

      <ul className="mt-4 space-y-1.5">
        {listed.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <Link
              href={`/certificaten/${item.id}/bewerken`}
              className="focus-ring truncate text-foreground hover:underline"
              title={`${item.title} vernieuwen`}
            >
              {item.title}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {CREDENTIAL_TYPE_LABEL[item.type]}
              </span>
            </Link>
            <span
              className={
                "shrink-0 text-xs " +
                (item.window === "EXPIRED"
                  ? "text-danger"
                  : item.window === "WITHIN_30"
                    ? "text-warning"
                    : "text-muted-foreground")
              }
            >
              {daysLabel(item.days)}
            </span>
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          en nog{" "}
          {plural(remaining, "certificaat dat aandacht vraagt", "certificaten die aandacht vragen")}
        </p>
      )}
    </section>
  );
}
