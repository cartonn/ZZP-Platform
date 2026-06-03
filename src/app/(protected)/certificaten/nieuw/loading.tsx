import { PageHeaderSkeleton, FormSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeaderSkeleton />
      <FormSkeleton fields={5} />
    </div>
  );
}
