import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { type ExpiryOverview } from "@/lib/credential-expiry-overview";
import {
  EXPIRY_CARD_MAX_LISTED,
  expiryCardHidden,
  expiryChips,
  expiryDaysLabel,
  expiryRemaining,
} from "@/lib/credential-expiry-overview-view";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { plural } from "@/lib/plural";

/**
 * Vervalkalender: een rustige momentopname van wat er aan certificaten vernieuwd moet worden.
 * Verbergt zichzelf zodra er niets binnen de horizon verloopt — geen lege ruis op de pagina.
 * De presentatielogica (chips, labels, lijst-limiet) leeft in credential-expiry-overview-view.ts.
 */
export function ExpiryOverviewCard({ overview }: { overview: ExpiryOverview }) {
  if (expiryCardHidden(overview)) return null;

  const chips = expiryChips(overview);
  const listed = overview.items.slice(0, EXPIRY_CARD_MAX_LISTED);
  const remaining = expiryRemaining(overview);

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
              {expiryDaysLabel(item.days)}
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
