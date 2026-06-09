import { sparklinePoints } from "@/lib/sparkline";

/**
 * Sparkline (DESIGN.md — Vakwerk): kleine inline-trend in merkkleur, zonder
 * assen of grid — de richting is de boodschap, het getal staat ernaast.
 * Puur presentationeel; de schaal-logica zit getest in `src/lib/sparkline.ts`.
 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  label,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  label?: string;
  className?: string;
}) {
  const points = sparklinePoints(values, width, height);
  if (!points) return null;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
