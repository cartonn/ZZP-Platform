import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function PrognoseLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
