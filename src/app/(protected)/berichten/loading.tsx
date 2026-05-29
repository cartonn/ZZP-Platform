import { ListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <ListSkeleton widthClassName="max-w-2xl" rows={5} label="Berichten laden…" />;
}
