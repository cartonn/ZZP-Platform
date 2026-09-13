import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Neutral loading shape: no inferred document title, party, signature or approval status. */
export function SigningSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 pb-8" aria-busy="true">
      <p role="status" className="text-sm text-muted-foreground">
        Je overeenkomst wordt geladen…
      </p>
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Card aria-hidden="true">
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
      <div
        className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
        aria-hidden="true"
      >
        <Card>
          <CardContent className="space-y-6">
            <Skeleton className="h-6 w-3/4" />
            {[0, 1, 2].map((section) => (
              <div key={section} className="space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
