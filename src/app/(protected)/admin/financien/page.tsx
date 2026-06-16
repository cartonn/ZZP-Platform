import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { FinancienHubScreen } from "@/components/admin/financien-hub-screen";

export const metadata: Metadata = { title: "Financiën · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Financiën-hub: de ADMIN ziet platform-administratie en -facturatie (kopkaart + tabs) binnen de
 * app-schil. ADMIN-only (requireRole, en /admin/* is ook middleware-gated). De resterende
 * searchParams (status/gegenereerd) stromen door naar het actieve paneel, dat als enige server-side
 * data laadt.
 */
export default async function AdminFinancienPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const tab = first(sp.tab);

  return (
    <div className="space-y-6">
      <FinancienHubScreen tab={tab} searchParams={sp} />
    </div>
  );
}
