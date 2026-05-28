// Skeleton voor het dashboard (de zwaarste pagina). Toont direct de layout-vorm bij
// navigatie, zodat het systeem snel aanvoelt. Route-specifiek — raakt notFound() elders niet.
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} aria-hidden />;
}

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" aria-busy="true" aria-label="Dashboard laden">
      <div className="space-y-2">
        <Bar className="h-3 w-40" />
        <Bar className="h-6 w-64" />
        <Bar className="h-3 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-5">
            <Bar className="h-3 w-24" />
            <Bar className="h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <Bar className="h-4 w-32" />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-5/6" />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <Bar className="h-4 w-40" />
        <Bar className="h-3 w-2/3" />
        <Bar className="h-3 w-1/2" />
      </div>
    </div>
  );
}
