import { PageHeaderSkeleton, FormSkeleton } from "@/components/ui/skeleton";

// Segment-niveau: dekt /certificaten/[id]/bewerken (de (index)-route heeft een eigen, nestere loading).
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FormSkeleton fields={5} />
    </div>
  );
}
