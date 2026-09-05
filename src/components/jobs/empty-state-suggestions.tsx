import Link from "next/link";
import { Sparkles } from "lucide-react";
import { plural } from "@/lib/plural";
import type { RelaxationSuggestion } from "@/lib/jobs/empty-state-relaxations";

// Slimme lege staat op /opdrachten: als de gefilterde markt niks oplevert, tonen we één klik om de
// zoekopdracht te verbreden — met het exacte aantal opdrachten dat elke versoepeling oplevert. Puur
// presentatie: de suggesties (incl. tellingen en doel-URL's) komen server-side aangeleverd. Rendert
// niets zonder suggesties, zodat de aanroeper zorgeloos altijd kan meegeven.
export function EmptyStateSuggestions({ suggestions }: { suggestions: RelaxationSuggestion[] }) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3.5" aria-hidden />
        Verbreed je zoekopdracht
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((s) => (
          <Link
            key={s.kind}
            href={s.href}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <span>{s.label}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {plural(s.count, "opdracht", "opdrachten")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
