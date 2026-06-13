"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { addFavorite, removeFavorite } from "@/app/(protected)/favorieten/actions";

/**
 * Favoriet-schakelaar voor het publieke ZZP-profiel (alleen voor opdrachtgevers). Optimistisch:
 * de knop wisselt direct van stand; de server-actie revalideert het profiel + de poule. Bij een
 * fout draaien we de stand terug. Server-side blijft de waarheid (idempotente upsert/delete).
 */
export function FavoriteButton({
  freelancerProfileId,
  initialFavorited,
}: {
  freelancerProfileId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      try {
        if (next) await addFavorite(freelancerProfileId);
        else await removeFavorite(freelancerProfileId);
      } catch {
        setFavorited(!next); // herstel bij fout
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
        favorited ? "border-primary/40 bg-primary/10 text-primary" : "border-border hover:bg-muted",
      )}
    >
      <Star className={cn("size-4", favorited && "fill-current")} aria-hidden />
      {favorited ? "In je poule" : "Aan poule toevoegen"}
    </button>
  );
}
