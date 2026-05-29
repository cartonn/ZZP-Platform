import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <ListSkeleton widthClassName="max-w-3xl" rows={4} label="Reacties laden…" />;
}
