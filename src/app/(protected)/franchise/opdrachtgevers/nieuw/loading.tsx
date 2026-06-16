import { FormSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)_210px]">
        <div className="h-40 animate-pulse rounded bg-muted" />
        <FormSkeleton fields={4} />
        <div className="hidden h-40 animate-pulse rounded bg-muted lg:block" />
      </div>
    </div>
  );
}
