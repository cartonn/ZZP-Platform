import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function PrestatiesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
