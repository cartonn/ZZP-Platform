import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { type InzetImpact, type InzetImpactItem } from "@/lib/freelancer-compliance";
import { credentialEditPath } from "@/lib/credentials";
import { plural, pluralWord } from "@/lib/plural";

/** Venster-label per impact-item: rood "verlopen", warning "over N dagen", anders rustig muted. */
function windowLabel(item: InzetImpactItem["item"]): {
  text: string;
  tone: "danger" | "warning" | "muted";
} {
  if (item.window === "EXPIRED") return { text: "verlopen", tone: "danger" };
  if (item.window === "WITHIN_30") {
    return {
      text: item.days === 0 ? "verloopt vandaag" : `over ${plural(item.days, "dag", "dagen")}`,
      tone: "warning",
    };
  }
  return { text: `over ${plural(item.days, "dag", "dagen")}`, tone: "muted" };
}

/**
 * Certificaat-impact op inzet: de ZZP-spiegel van de vervalkalender. Toont alleen de (bijna-)vervallende
 * certificaten die een lopende samenwerking raken, met de concrete inzetten die in gevaar komen. Verbergt
 * zichzelf zodra er geen risico is — geen lege ruis op de pagina. Read-only, server-side afgeleid.
 */
export function InzetImpactCard({ impact }: { impact: InzetImpact }) {
  if (impact.items.length === 0) return null;

  return (
    <section
      className="rounded-lg border border-border bg-card p-5"
      data-testid="inzet-impact-card"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 shrink-0 text-warning" aria-hidden />
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Certificaat-impact op je inzet
        </h2>
      </div>

      <p className="mt-3 text-sm text-foreground">
        {impact.collaborationsAtRisk > 0 ? (
          <>
            <span className="font-mono font-semibold">{impact.collaborationsAtRisk}</span> lopende{" "}
            {pluralWord(impact.collaborationsAtRisk, "inzet", "inzetten")} loopt risico doordat een
            vereist certificaat (bijna) verloopt.
          </>
        ) : (
          "Een vereist certificaat verloopt binnenkort voor je lopende inzet."
        )}
      </p>

      <ul className="mt-4 space-y-3">
        {impact.items.map(({ item, affected }) => {
          const label = windowLabel(item);
          return (
            <li key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{item.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={
                      "text-xs " +
                      (label.tone === "danger"
                        ? "text-danger"
                        : label.tone === "warning"
                          ? "text-warning"
                          : "text-muted-foreground")
                    }
                  >
                    {label.text}
                  </span>
                  <Link
                    href={credentialEditPath(item.id)}
                    className="focus-ring text-xs text-primary hover:underline"
                    title={`${item.title} vernieuwen`}
                  >
                    Vernieuwen
                  </Link>
                </span>
              </div>
              <ul className="space-y-0.5 pl-3">
                {affected.map((a) => (
                  <li key={a.collaborationId}>
                    <Link
                      href={`/samenwerkingen/${a.collaborationId}`}
                      className="focus-ring text-xs text-muted-foreground hover:underline"
                    >
                      {a.jobTitle} — {a.clientName}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
