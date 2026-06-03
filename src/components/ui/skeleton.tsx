import { cn } from "@/lib/utils";

// Gedeelde laad-skeletten. Tonen direct de paginavorm bij navigatie, zodat het systeem
// snel aanvoelt. De puls staat uit bij prefers-reduced-motion (motion-reduce + de globale
// guard in globals.css). Skeletten zijn decoratief: aria-hidden, met aria-busy op de wrapper.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-muted motion-reduce:animate-none", className)}
      aria-hidden
    />
  );
}

// Kop-skelet (titel + subtitel), matcht de <header> die elke pagina opent.
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-3 w-72" />
    </div>
  );
}

// Lijst-skelet: N card-rijen in dezelfde vorm als de meeste lijstpagina's (space-y-3).
export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Laden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// Formulier-skelet: N label+veld-paren plus een knop in één card, voor bewerk-/nieuw-pagina's.
export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div
      className={cn("space-y-4 rounded-lg border border-border bg-card p-5", className)}
      aria-busy="true"
      aria-label="Laden"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-32" />
    </div>
  );
}
