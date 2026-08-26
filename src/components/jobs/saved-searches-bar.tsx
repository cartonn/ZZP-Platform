import Link from "next/link";
import { Search, X } from "lucide-react";
import { savedSearchHref } from "@/lib/jobs/saved-search";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { SaveSearchForm } from "@/components/jobs/save-search-form";
import { deleteJobSearch } from "@/app/(protected)/opdrachten/saved-search-actions";

export interface SavedSearchItem {
  id: string;
  name: string;
  query: string;
  /**
   * Aantal nu-passende, zichtbare opdrachten voor deze bewaarde filterset — dezelfde telling die de
   * marktplaats in de kop toont wanneer je de zoekopdracht opent (geen drift). `null` betekent "niet
   * betrouwbaar te tellen" (de zoekopdracht bevat de inzetbaarheids-verfijning `onlyEligible`, die de
   * pagina per-ZZP'er in het geheugen versmalt) → dan tonen we geen teller.
   */
  matchCount?: number | null;
}

/**
 * Balk met de bewaarde zoekopdrachten van de ZZP'er op de marktplaats. Elke bewaarde zoekopdracht
 * is een pill die de filterset opnieuw toepast (`/opdrachten?<query>`), met een los verwijder-knopje
 * (bevestiging). Rechts staat het bewaar-formulier — alleen zinvol wanneer er nu actieve filters
 * staan (`canSave`). Rendert niets wanneer er geen bewaarde zoekopdrachten zijn én er niets te
 * bewaren valt (rustige pagina). De server is de waarheid: de lijst komt uit de SavedJobSearch-rijen.
 */
export function SavedSearchesBar({
  searches,
  canSave,
  currentQuery,
}: {
  searches: SavedSearchItem[];
  canSave: boolean;
  currentQuery: string;
}) {
  if (searches.length === 0 && !canSave) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {searches.length > 0 && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Search className="size-3.5" aria-hidden />
          Bewaarde zoekopdrachten
        </span>
      )}
      {searches.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card py-1 pl-2.5 pr-1 text-sm"
        >
          <Link
            href={savedSearchHref(s.query)}
            className="focus-ring max-w-[14rem] truncate rounded-sm font-medium text-foreground underline-offset-2 hover:underline"
            title={s.name}
          >
            {s.name}
          </Link>
          {typeof s.matchCount === "number" && (
            <span
              className={
                "ml-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums " +
                (s.matchCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")
              }
              title={
                s.matchCount > 0
                  ? `${s.matchCount} passende ${s.matchCount === 1 ? "opdracht" : "opdrachten"} nu`
                  : "Nu geen passende opdrachten"
              }
              aria-label={`${s.matchCount} passende ${
                s.matchCount === 1 ? "opdracht" : "opdrachten"
              }`}
            >
              {s.matchCount}
            </span>
          )}
          <ConfirmButton
            action={deleteJobSearch.bind(null, s.id)}
            triggerVariant="ghost"
            size="xs"
            title="Zoekopdracht verwijderen?"
            description={`"${s.name}" wordt uit je bewaarde zoekopdrachten verwijderd. Je kunt 'm later opnieuw bewaren.`}
            confirmLabel="Verwijderen"
            aria-label={`Verwijder zoekopdracht ${s.name}`}
          >
            <X className="size-3.5" aria-hidden />
          </ConfirmButton>
        </span>
      ))}
      {canSave && <SaveSearchForm query={currentQuery} hasSaved={searches.length > 0} />}
    </div>
  );
}
