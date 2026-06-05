import { type TenantBranding } from "@/lib/franchise/branding";

/**
 * Werkplek-merk: voor een franchise-lid de franchise-naam + accentkleur (white-label),
 * anders het generieke "ZZP Platform". Gedeeld door de sidebar- en mobiele header.
 */
export function Brand({ branding }: { branding: TenantBranding | null }) {
  const name = branding?.name ?? "ZZP Platform";
  const initial = (branding?.name ?? "Z").charAt(0).toUpperCase();
  return (
    <>
      <div
        className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
        style={branding?.brandColor ? { backgroundColor: branding.brandColor, color: "#fff" } : undefined} // prettier-ignore
      >
        {initial}
      </div>
      <span className="truncate text-sm font-semibold">{name}</span>
    </>
  );
}
