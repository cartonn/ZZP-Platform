import { ListSkeleton } from "@/components/ui/skeleton";

export default function DienstenLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="h-8 w-32 rounded bg-muted animate-pulse" />
      <div className="flex gap-2">
        {[80, 90, 110, 100, 100].map((w, i) => (
          <div key={i} className="h-7 rounded-full bg-muted animate-pulse" style={{ width: w }} />
        ))}
      </div>
      <ListSkeleton rows={6} />
    </div>
  );
}
