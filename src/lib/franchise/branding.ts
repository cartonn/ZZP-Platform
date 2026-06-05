import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

export interface TenantBranding {
  name: string;
  brandColor: string | null;
}

/**
 * White-label branding voor een tenant-lid (de franchise-naam + accentkleur), of `null` voor een
 * directe platformgebruiker. Request-gecachet (React.cache) zodat de layout dit per render maar
 * één keer laadt.
 */
export const getTenantBranding = cache(async (userId: string): Promise<TenantBranding | null> => {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenant: { select: { name: true, brandColor: true } } },
  });
  return u?.tenant ? { name: u.tenant.name, brandColor: u.tenant.brandColor } : null;
});
