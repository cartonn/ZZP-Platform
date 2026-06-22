"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";

/**
 * Taalschakelaar (NL | EN) in de bovenbalk. Zet de taalcookie via een server-action en herlaadt
 * de server-side UI in de gekozen taal. De huidige taal komt server-side binnen (`current`).
 */
export function LanguageToggle({ current, label }: { current: Locale; label: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 focus-within:ring-ring"
    >
      <Languages className="ml-1 size-3.5 text-muted-foreground" aria-hidden />
      {LOCALES.map((loc) => {
        const active = loc === current;
        return (
          <button
            key={loc}
            type="button"
            disabled={isPending || active}
            aria-pressed={active}
            onClick={() => startTransition(() => setLocale(loc))}
            className={cn(
              "focus-ring rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {LOCALE_LABEL[loc]}
          </button>
        );
      })}
    </div>
  );
}
