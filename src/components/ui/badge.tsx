import { cn } from "@/lib/utils";

type Variant = "default" | "muted" | "accent" | "success" | "warning" | "danger";

const variants: Record<Variant, string> = {
  default: "border-border bg-card text-foreground",
  muted: "border-transparent bg-muted text-muted-foreground",
  // Merk-getint: voor de signatuur van het platform (de match-score). Volgt de palette-primary.
  accent: "border-transparent bg-primary/10 text-primary",
  success: "border-transparent bg-success/10 text-success",
  warning: "border-transparent bg-warning/15 text-warning",
  danger: "border-transparent bg-danger/10 text-danger",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
