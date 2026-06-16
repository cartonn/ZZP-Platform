import { PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
