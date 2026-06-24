"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";
import { clearUnavailableSavedJobs } from "@/app/(protected)/opdrachten/actions";

/**
 * Wist in één klik alle niet-meer-beschikbare bewaarde opdrachten (server-action). Disablet zichzelf
 * tijdens de mutatie; de server is de waarheid en revalideert /opgeslagen.
 */
export function ClearUnavailableButton() {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => clearUnavailableSavedJobs())}
    >
      <Trash2 className="size-4" aria-hidden /> {t("Opschonen")}
    </Button>
  );
}
