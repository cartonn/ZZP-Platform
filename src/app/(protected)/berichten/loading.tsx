import { PageHeaderSkeleton, DenseListSkeleton } from "@/components/ui/skeleton";

// Segment-niveau: dekt /berichten/[id] (de (index)-route heeft een eigen, nestere loading).
// Zonder dit had het gespreksdetail geen laadstaat (route-group-boundary dekt siblings niet).
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <DenseListSkeleton rows={5} />
    </div>
  );
}
