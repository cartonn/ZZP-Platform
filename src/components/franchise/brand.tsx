import { cn } from "@/lib/utils";
import { type TenantBranding } from "@/lib/franchise/branding";

/**
 * Werkplek-merk: voor een franchise-lid de franchise-naam + accentkleur (white-label),
 * anders het generieke "ZZP Platform". Gedeeld door de sidebar- en mobiele header.
 *
 * `collapsible` (alleen de inklapbare zijbalk-rail): de naam vervaagt mee als de rail is
 * ingeklapt en verschijnt bij hover/focus van de rail (de `group`). Het merkteken blijft staan.
 */
export function Brand({
  branding,
  collapsible = false,
}: {
  branding: TenantBranding | null;
  collapsible?: boolean;
}) {
  const name = branding?.name ?? "ZZP Platform";
  const initial = (branding?.name ?? "Z").charAt(0).toUpperCase();
  return (
    <>
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
        style={branding?.brandColor ? { backgroundColor: branding.brandColor, color: "#fff" } : undefined} // prettier-ignore
      >
        {initial}
      </div>
      <span
        className={cn(
          "truncate text-sm font-semibold",
          collapsible &&
            "opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
        )}
      >
        {name}
      </span>
    </>
  );
}
