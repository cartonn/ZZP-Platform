// Het merkteken van Handslag: "De Schakel" — twee ineengehaakte, gewoven ringen (de digitale
// handdruk: een afspraak die twee kanten bindt). Merkkleuren binnen het sitepalet maar bewust
// níet het interface-zegelgroen: inkt (volgt --foreground, dus leesbaar in licht én donker) +
// terracotta #b9603f (de warmte-kleur). De derde arc legt de inkt-ring bovenop bij de bovenste
// kruising — de over-onder-weving die de schakel sluit.
export const BRAND_NAME = "Handslag";
export const BRAND_TERRACOTTA = "#b9603f";

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
      viewBox="-40 -40 80 80"
      className={className}
      role="img"
      aria-label={title}
    >
      <g fill="none" strokeLinecap="round" strokeWidth={9}>
        <circle cx={-11} cy={0} r={17} stroke="hsl(var(--foreground))" />
        <circle cx={11} cy={0} r={17} stroke={BRAND_TERRACOTTA} />
        <path d="M 3.7 -8.5 A 17 17 0 0 1 -5.2 -16" stroke="hsl(var(--foreground))" />
      </g>
    </svg>
  );
}
