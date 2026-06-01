"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchPlatform } from "@/app/(protected)/search/actions";
import { groupResultsByType, isSearchableQuery, type SearchResult } from "@/lib/search";

// ---------------------------------------------------------------------------
// Globale snelzoeker (⌘K / Ctrl+K). Opent via keydown of CustomEvent.
// ---------------------------------------------------------------------------

/** Geeft de flat lijst van resultaten in gerankte volgorde (groep voor groep). */
function flattenResults(results: SearchResult[]): SearchResult[] {
  const groups = groupResultsByType(results);
  return groups.flatMap((g) => g.items);
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ------------------------------------------------------------------
  // Openen / sluiten
  // ------------------------------------------------------------------
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setLoading(false);
    setHighlightedIndex(0);
  }, []);

  // Luister op ⌘K / Ctrl+K en het globale CustomEvent "open-command-palette".
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onCustomEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeydown);
    window.addEventListener("open-command-palette", onCustomEvent);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("open-command-palette", onCustomEvent);
    };
  }, []);

  // Focus het invoerveld zodra het dialoog opent.
  useEffect(() => {
    if (open) {
      // Kleine vertraging om de DOM te laten renderen.
      const id = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Escape sluit het dialoog.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // ------------------------------------------------------------------
  // Zoeken met debounce en out-of-order bescherming
  // ------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!isSearchableQuery(query)) {
      setResults([]);
      setLoading(false);
      setHighlightedIndex(0);
      return;
    }

    setLoading(true);
    const thisRequest = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchPlatform(query);
        // Verouderde reactie negeren.
        if (thisRequest !== requestIdRef.current) return;
        setResults(data);
        setHighlightedIndex(0);
      } catch {
        if (thisRequest !== requestIdRef.current) return;
        setResults([]);
      } finally {
        if (thisRequest === requestIdRef.current) setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ------------------------------------------------------------------
  // Navigatie
  // ------------------------------------------------------------------
  const flat = flattenResults(results);

  function navigate(result: SearchResult) {
    router.push(result.href);
    close();
  }

  function onKeydownInPalette(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (flat.length > 0 ? Math.min(i + 1, flat.length - 1) : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flat[highlightedIndex];
      if (target) navigate(target);
    }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!open) return null;

  const groups = groupResultsByType(results);
  const searchable = isSearchableQuery(query);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Snelzoeker">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Snelzoeker sluiten"
        onClick={close}
        className="absolute inset-0 bg-black/40"
      />

      {/* Palette panel */}
      <div className="relative mx-auto mt-[10vh] w-full max-w-lg rounded-lg border border-border bg-background shadow-xl">
        {/* Zoekbalk */}
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeydownInPalette}
            placeholder="Zoek opdrachten, samenwerkingen, facturen…"
            className="h-12 border-0 bg-transparent px-0 text-sm shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Resultaten */}
        <div
          id="command-palette-results"
          role="listbox"
          aria-label="Zoekresultaten"
          className="max-h-[calc(80vh-6rem)] overflow-y-auto"
        >
          {loading && <div className="px-4 py-3 text-sm text-muted-foreground">Zoeken…</div>}

          {!loading && !searchable && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Typ minimaal 2 tekens om te zoeken.
            </div>
          )}

          {!loading && searchable && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Geen resultaten voor &ldquo;{query}&rdquo;.
            </div>
          )}

          {!loading && groups.length > 0 && (
            <div className="py-2">
              {groups.map((group) => (
                <div key={group.type}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const idx = flat.indexOf(item);
                    const highlighted = idx === highlightedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={highlighted}
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors focus:outline-none ${
                          highlighted ? "bg-muted" : "hover:bg-muted/60"
                        }`}
                      >
                        <span className="truncate text-sm font-medium">{item.title}</span>
                        {item.subtitle && (
                          <span className="truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span>↑↓ navigeren</span>
          <span>↵ openen</span>
          <span>esc sluiten</span>
        </div>
      </div>
    </div>
  );
}
