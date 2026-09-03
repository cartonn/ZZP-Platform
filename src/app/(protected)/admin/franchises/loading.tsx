import { PageHeaderSkeleton, FormSkeleton, DenseListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FormSkeleton fields={3} />
      <DenseListSkeleton rows={3} />
    </div>
  );
}
