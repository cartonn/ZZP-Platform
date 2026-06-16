import { PageHeaderSkeleton, FormSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FormSkeleton fields={2} />
      <ListSkeleton rows={4} />
    </div>
  );
}
