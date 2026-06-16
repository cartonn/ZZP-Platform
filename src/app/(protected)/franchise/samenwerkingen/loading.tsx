import { PageHeaderSkeleton, DenseListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <DenseListSkeleton rows={6} />
    </div>
  );
}
