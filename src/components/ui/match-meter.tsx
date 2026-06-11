import { meterSegments } from "@/lib/meter";
import { cn } from "@/lib/utils";

/**
 * Matchmeter (DESIGN.md — Vakwerk-signatuur): 10 segmenten die de matchscore
 * tastbaar maken naast het percentage. Altijd merk-getint (nooit grijs) —
 * de score is de signatuur van het platform. Puur presentationeel; de
 * segmentlogica (incl. klemmen) zit getest in `src/lib/meter.ts`.
 */
export function MatchMeter({
  score,
  className,
  size = "sm",
}: {
  score: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const segments = meterSegments(score);
  return (
    <span
      className={cn("flex items-center gap-0.5", size === "sm" ? "w-16" : "w-24", className)}
      role="img"
      aria-label={`Match ${Math.round(score)} procent`}
    >
      {segments.map((on, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full",
            size === "md" && "h-1.5",
            on ? "bg-primary" : "bg-muted-foreground/25",
          )}
        />
      ))}
    </span>
  );
}
