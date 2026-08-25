"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { BookmarkPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { MAX_SAVED_SEARCH_NAME_LEN } from "@/lib/jobs/saved-search";
import {
  saveJobSearch,
  type SavedSearchState,
} from "@/app/(protected)/opdrachten/saved-search-actions";

/**
 * Bewaar-formulier voor de huidige zoekopdracht (actieve filters) op de marktplaats. Standaard een
 * rustige "Bewaren"-knop; bij klik klapt een compact naam-invoerveld uit. Verstuurt via de
 * server-action (`saveJobSearch`) met de canonieke query als verborgen veld. De server is de
 * waarheid: hij hernormaliseert de query en dwingt de naam-/limietregels af.
 */
export function SaveSearchForm({ query, hasSaved }: { query: string; hasSaved: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<SavedSearchState, FormData>(saveJobSearch, undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sluit + reset zodra de opslag slaagde.
  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  // Focus het naamveld zodra het formulier opent.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <BookmarkPlus className="size-3.5" aria-hidden />
        {hasSaved ? "Bewaar deze" : "Bewaar zoekopdracht"}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          name="name"
          type="text"
          required
          maxLength={MAX_SAVED_SEARCH_NAME_LEN}
          placeholder="Naam voor deze zoekopdracht"
          aria-label="Naam voor deze zoekopdracht"
          aria-invalid={state?.error ? true : undefined}
          className="h-8 w-56 text-sm"
        />
        <input type="hidden" name="query" value={query} />
        <PendingSubmitButton size="sm">Bewaren</PendingSubmitButton>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label="Annuleren"
          onClick={() => setOpen(false)}
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
