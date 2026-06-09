import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Aan-zet-banier (DESIGN.md — Vakwerk-signatuur): hét hoge-contrastmoment van een
 * pagina. Inkt op papier (klapt automatisch om in donkere modus via de tokens):
 * wie is aan zet, wat moet er gebeuren, optioneel één actie. Maximaal één per pagina.
 */
export function TurnBanner({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg bg-foreground px-5 py-4 text-background",
        className,
      )}
      aria-label="Aan zet"
    >
      <span className="relative flex size-2.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
      </span>
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <div className="mt-0.5 text-xs opacity-75">{description}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}
