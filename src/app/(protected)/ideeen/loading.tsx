import { PageHeaderSkeleton, FormSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeaderSkeleton />
      <FormSkeleton fields={2} />
      <ListSkeleton rows={4} />
    </div>
  );
}
