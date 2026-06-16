import { Skeleton } from "@/components/ui/skeleton";

// Skeleton voor het dashboard (de zwaarste pagina). Toont direct de layout-vorm bij
// navigatie, zodat het systeem snel aanvoelt. Route-specifiek — raakt notFound() elders niet.
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Dashboard laden">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-3 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
