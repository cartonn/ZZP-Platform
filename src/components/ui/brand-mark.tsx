// The two original Handslag paths, shared with the V5 landing page.
export const BRAND_NAME = "Handslag";
export const BRAND_TERRACOTTA = "#d97757";

export function BrandMark({
  size = 28,
  className,
  title = BRAND_NAME,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="6 7 36 34"
      className={className}
      role="img"
      aria-label={title}
    >
      <g fill="none" stroke="hsl(var(--brand-hand))" strokeLinecap="round" strokeWidth={4}>
        <path d="M10.6 13h7a10 10 0 0 1 10 10v4" />
        <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4" />
      </g>
    </svg>
  );
}
