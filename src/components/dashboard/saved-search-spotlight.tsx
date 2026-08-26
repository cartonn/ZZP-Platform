import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getTranslator } from "@/lib/i18n/server";
import { type SavedSearchAlert } from "@/lib/jobs/saved-search-alerts";

// Rail-sectie: verse treffers op de opgeslagen zoekopdrachten van de ZZP'er. Puur presentationeel;
// de lijst is server-side al gefilterd (recent>0), gesorteerd en gecapt. Leeg → niets renderen,
// zodat het startscherm rustig blijft.

export async function SavedSearchSpotlight({ alerts }: { alerts: SavedSearchAlert[] }) {
  if (alerts.length === 0) return null;
  const { t } = await getTranslator();
  return (
    <section aria-label={t("Verse treffers")}>
      <h3 className="mb-2 px-1 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("Verse treffers")}
      </h3>
      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li key={alert.href}>
            <Link
              href={alert.href}
              className="focus-ring flex items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted/50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 truncate text-xs font-medium leading-snug">
                    {alert.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-success/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-success">
                    +{alert.recent}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {alert.recent}{" "}
                  {alert.recent === 1 ? t("nieuwe opdracht") : t("nieuwe opdrachten")} ·{" "}
                  {alert.total} {t("in totaal")}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
