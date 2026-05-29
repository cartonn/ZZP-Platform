import { cn } from "@/lib/utils";

/** Eén skeleton-balk. Puur decoratief, dus aria-hidden. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} aria-hidden />;
}

/**
 * Herbruikbare laad-skeleton voor lijstpagina's: een titelblok + een aantal kaartrijen.
 * Matcht de structuur van de echte pagina zodat er geen layout-shift optreedt bij het laden.
 */
export function ListSkeleton({
  rows = 5,
  label = "Laden…",
  widthClassName = "max-w-3xl",
}: {
  rows?: number;
  label?: string;
  widthClassName?: string;
}) {
  return (
    <div className={cn("mx-auto space-y-6", widthClassName)} aria-busy="true" aria-label={label}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
