import { cn } from "@/lib/utils";

/** Toggle-chip met een visueel verborgen checkbox; klik op het label schakelt 'm. */
export function CheckChip({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label
      className={cn(
        "cursor-pointer select-none rounded-full border px-3 py-1 text-sm transition-colors",
        "border-border hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-accent",
      )}
    >
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="sr-only" />
      {label}
    </label>
  );
}
