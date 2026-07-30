import { cn } from "@/lib/utils";
import { type TenantBranding } from "@/lib/franchise/branding";
import { BrandMark, BRAND_NAME } from "@/components/ui/brand-mark";

/**
 * Werkplek-merk: voor een franchise-lid de franchise-naam + accentkleur (white-label),
 * anders het Handslag-merk (De Schakel + naam). Gedeeld door de sidebar- en mobiele header.
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
  const name = branding?.name ?? BRAND_NAME;
  return (
    <>
      {branding?.name ? (
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          style={branding.brandColor ? { backgroundColor: branding.brandColor, color: "#fff" } : undefined} // prettier-ignore
        >
          {branding.name.charAt(0).toUpperCase()}
        </div>
      ) : (
        <BrandMark size={28} className="shrink-0" />
      )}
      <span
        className={cn(
          "truncate font-display text-sm font-semibold",
          collapsible &&
            "opacity-0 transition-opacity duration-150 group-data-[expanded=true]:opacity-100",
        )}
      >
        {name}
      </span>
    </>
  );
}
