import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { getPlatformStats } from "@/lib/admin-stats";
import { ToezichtHubScreen } from "@/components/admin/toezicht-hub-screen";

export const metadata: Metadata = { title: "Toezicht · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Toezicht-hub: de ADMIN ziet platform-overzicht (kopkaart + tabs: statistieken, platform-bewaking,
 * DBA-monitor, audit-log, verwerkingsregister) binnen de app-schil. ADMIN-only (requireRole, en
 * /admin/* is ook middleware-gated). De resterende searchParams (cursor/filter) stromen door naar
 * het actieve paneel, dat als enige server-side data laadt.
 */
export default async function AdminToezichtPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const tab = first(sp.tab);
  const stats = await getPlatformStats();

  return (
    <div className="space-y-6">
      <ToezichtHubScreen stats={stats} tab={tab} searchParams={sp} />
    </div>
  );
}
