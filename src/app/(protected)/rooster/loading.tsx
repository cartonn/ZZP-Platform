import { PageHeaderSkeleton, DenseListSkeleton } from "@/components/ui/skeleton";

export default function RoosterLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeaderSkeleton />
      <DenseListSkeleton rows={5} />
    </div>
  );
}
