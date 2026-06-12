import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingStarsProps {
  average: number;
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export function RatingStars({
  average,
  count,
  size = "sm",
  showValue = false,
  className,
}: RatingStarsProps): React.JSX.Element {
  const filled = Math.round(average);
  const iconClass = size === "md" ? "size-4" : "size-3.5";
  const formatted = average.toLocaleString("nl-NL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const ariaLabel = `${formatted} van 5 sterren`;

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={ariaLabel}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            iconClass,
            i < filled ? "fill-current text-foreground" : "text-muted-foreground",
          )}
        />
      ))}
      {showValue && <span className="ml-1 text-sm tabular-nums text-foreground">{formatted}</span>}
      {showValue && count !== undefined && count > 0 && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
    </span>
  );
}
