import Link from "next/link";
import { Check, Circle, Eye, EyeOff, Search } from "lucide-react";
import { type FindabilitySummary } from "@/lib/freelancer-findability";
import { Card, CardContent } from "@/components/ui/card";

const LEVEL_ICON = {
  hidden: EyeOff,
  limited: Search,
  visible: Eye,
} as const;

const LEVEL_ACCENT: Record<FindabilitySummary["level"], string> = {
  hidden: "text-warning",
  limited: "text-muted-foreground",
  visible: "text-success",
};

/**
 * Vindbaarheid voor opdrachtgevers: beantwoordt de vraag "kan een opdrachtgever mij vinden?" op het
 * profiel van de ZZP'er. Toont de harde poort (openbaar profiel) plus de surfacing-factoren (skills,
 * beschikbaarheid) als checklist, met een gerichte fix voor de eerste blokkade. Puur presentationeel;
 * het oordeel komt server-berekend uit `summarizeFindability`. Read-only.
 */
export function FindabilityCard({
  findability,
}: {
  findability: FindabilitySummary;
}): React.JSX.Element {
  const Icon = LEVEL_ICON[findability.level];
  const accent = LEVEL_ACCENT[findability.level];

  return (
    <Card data-testid="findability-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 shrink-0 ${accent}`} aria-hidden />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Vindbaarheid voor opdrachtgevers
          </h2>
        </div>

        <p className="mt-3 text-sm font-medium text-foreground">{findability.headline}</p>

        {findability.blocker && (
          <p className="mt-1 text-sm text-muted-foreground">{findability.blocker}</p>
        )}

        <ul className="mt-4 space-y-2">
          {findability.factors.map((f) => (
            <li key={f.key} className="flex items-start gap-2 text-sm">
              {f.done ? (
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className={f.done ? "text-foreground" : "text-muted-foreground"}>
                {f.label}
                {!f.done && <span className="block text-xs">{f.hint}</span>}
              </span>
            </li>
          ))}
        </ul>

        {findability.href && (
          <Link
            href={findability.href}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Los dit op
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
