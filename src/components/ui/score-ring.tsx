import { cn } from "@/lib/utils";

/**
 * Score-ring (Vakwerk/Warmte-signatuur): een rustige donut voor één percentage,
 * zoals de profielkracht op het publieke ZZP-profiel. Puur SVG, geen client-JS.
 */
export function ScoreRing({
  value,
  label,
  size = 96,
  className,
}: {
  /** 0–100. */
  value: number;
  /** Toegankelijke omschrijving, bv. "Profielkracht". */
  label: string;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (clamped / 100) * c;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label}: ${clamped}%`}
      className={cn("shrink-0", className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="stroke-success"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-foreground font-mono text-xl font-semibold"
      >
        {clamped}%
      </text>
    </svg>
  );
}
