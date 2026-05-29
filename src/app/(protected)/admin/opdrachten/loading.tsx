import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <ListSkeleton widthClassName="max-w-4xl" rows={6} label="Opdrachten laden…" />;
}
