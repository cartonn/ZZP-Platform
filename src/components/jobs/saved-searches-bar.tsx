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
