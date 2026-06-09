import { cn } from "@/lib/utils";

type SealTone = "verified" | "brand" | "expiring";
type SealSize = "sm" | "md" | "lg";

const SIZE: Record<SealSize, string> = {
  sm: "size-5",
  md: "size-7",
  lg: "size-9",
};

const TONE: Record<SealTone, string> = {
  verified: "text-success",
  brand: "text-primary",
  expiring: "text-warning",
};

/**
 * Het zegel — hét vertrouwensteken van het platform (DESIGN.md — Vakwerk-signatuur):
 * cirkel met dubbele ring en een vinkje (of uitroepteken bij `expiring`). Gebruik
 * `verified` voor geverifieerd, `brand` als merkmarkering, `expiring` bij verloop.
 * Decoratief tenzij `label` is gezet (dan met toegankelijke naam).
 */
export function Seal({
  tone = "verified",
  size = "md",
  label,
  className,
}: {
  tone?: SealTone;
  size?: SealSize;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 30 30"
      className={cn(SIZE[size], TONE[tone], "shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="15" cy="15" r="14" fill="currentColor" opacity="0.14" />
      <circle cx="15" cy="15" r="13.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle
        cx="15"
        cy="15"
        r="10.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      {tone === "expiring" ? (
        <path
          d="M15 9v7M15 20h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="m9.8 15.6 3.4 3.4 7-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
