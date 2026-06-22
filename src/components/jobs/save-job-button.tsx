"use client";

import { useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import { toggleSavedJob } from "@/app/(protected)/opdrachten/actions";

/**
 * Bewaar-knop voor de ZZP'er op een opdracht-detail. Toggelt de bookmark via de server-action
 * en disablet zichzelf tijdens de mutatie. De server is de waarheid: `saved` komt uit de
 * SavedJob-rij, niet uit client-state.
 */
export function SaveJobButton({ jobId, saved }: { jobId: string; saved: boolean }) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "ghost"}
      size="sm"
      disabled={isPending}
      aria-pressed={saved}
      onClick={() => startTransition(() => toggleSavedJob(jobId))}
    >
      {saved ? (
        <>
          <BookmarkCheck className="size-4" aria-hidden /> {t("Bewaard")}
        </>
      ) : (
        <>
          <Bookmark className="size-4" aria-hidden /> {t("Bewaren")}
        </>
      )}
    </Button>
  );
}
