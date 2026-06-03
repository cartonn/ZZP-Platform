import { PageHeaderSkeleton, FormSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageHeaderSkeleton />
      <FormSkeleton fields={3} />
    </div>
  );
}
