import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeleton";

export default function VerplichtingenLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
