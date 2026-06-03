import { Skeleton } from "@/components/ui/skeleton";

// Chat-skelet: matcht de gesprek-layout (terug-link + titel, dan afwisselende bel-rijen).
export default function Loading() {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex-1 space-y-3" aria-busy="true" aria-label="Laden">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="ml-auto h-12 w-3/5" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="ml-auto h-12 w-2/3" />
      </div>
    </div>
  );
}
