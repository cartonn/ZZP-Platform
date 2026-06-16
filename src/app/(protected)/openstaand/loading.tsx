import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function OpenstaandLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={5} />
    </div>
  );
}
