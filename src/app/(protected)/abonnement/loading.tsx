import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={3} />
    </div>
  );
}
