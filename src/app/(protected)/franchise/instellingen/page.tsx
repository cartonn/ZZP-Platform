import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { BemiddelingHubScreen } from "@/components/franchise/bemiddeling-hub-screen";

export const metadata: Metadata = { title: "Mijn bemiddeling · ZZP Platform" };

/**
 * Bemiddeling-hub: de FRANCHISER ziet zijn eigen bureau (kopkaart + tabs: bemiddeling, facturatie)
 * binnen de app-schil. Strikt eigenaar/tenant-gescoped via de actor. Bewerken (white-label branding)
 * op /franchise/instellingen/bewerken.
 */
export default async function FranchiseInstellingenPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await requireRole("FRANCHISER");
  const { tab } = await searchParams;

  return (
    <div className="space-y-6">
      <BemiddelingHubScreen actor={actor} tab={tab} />
    </div>
  );
}
