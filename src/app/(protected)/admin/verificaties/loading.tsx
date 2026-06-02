import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={5} />
    </div>
  );
}
