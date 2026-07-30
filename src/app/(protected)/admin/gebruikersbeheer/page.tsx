import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { GebruikersbeheerHubScreen } from "@/components/admin/gebruikersbeheer-hub-screen";

export const metadata: Metadata = { title: "Gebruikers · Handslag" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Gebruikersbeheer-hub: de ADMIN ziet accounts, bemiddelaars en onboarding-import (kopkaart + tabs)
 * binnen de app-schil. ADMIN-only (requireRole, en /admin/* is ook middleware-gated). De resterende
 * searchParams (q/role/status/deletion) stromen door naar het actieve paneel, dat als enige
 * server-side data laadt.
 */
export default async function AdminGebruikersbeheerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const tab = first(sp.tab);

  return (
    <div className="space-y-6">
      <GebruikersbeheerHubScreen actor={actor} tab={tab} searchParams={sp} />
    </div>
  );
}
