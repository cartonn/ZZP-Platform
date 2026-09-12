import { cn } from "@/lib/utils";

type SealTone = "verified" | "pending" | "brand" | "expiring";
type SealSize = "sm" | "md" | "lg";
const SIZE: Record<SealSize, string> = { sm: "size-5", md: "size-7", lg: "size-9" };
const TONE: Record<SealTone, string> = {
  verified: "hs-seal-approved",
  pending: "hs-seal-pending",
  brand: "text-primary",
  expiring: "text-warning",
};

/** Original Handslag logo: black while awaiting approval, orange stamp after approval.
 * Expiry remains a distinct warning, never an approval signal. */
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
      viewBox="0 0 48 48"
      className={cn(SIZE[size], TONE[tone], "shrink-0", className)}
      data-seal={tone}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {tone === "pending" ? (
        <circle cx="24" cy="24" r="23" fill="white" />
      ) : (
        <>
          <circle cx="24" cy="24" r="22" fill="currentColor" opacity=".08" />
          <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle
            cx="24"
            cy="24"
            r="18.5"
            fill="none"
            stroke="currentColor"
            strokeWidth=".7"
            opacity=".45"
          />
        </>
      )}
      {tone === "expiring" ? (
        <path
          d="M24 14v13M24 34h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <path d="M10.6 13h7a10 10 0 0 1 10 10v4" />
          <path d="M37.4 35h-7a10 10 0 0 1 -10 -10v-4" />
        </g>
      )}
    </svg>
  );
}
