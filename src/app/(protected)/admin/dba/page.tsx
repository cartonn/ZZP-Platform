import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { DbaPanel } from "@/components/admin/dba-panel";

export const metadata: Metadata = { title: "DBA-monitor · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminDbaPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const niveau = first(sp.niveau);

  return (
    <div className="space-y-6">
      <PageHeader
        title="DBA-monitor"
        description="Signalering van mogelijke schijnzelfstandigheid over actieve samenwerkingen. Dit is geen juridisch oordeel — het platform signaleert en informeert alleen."
      />

      <DbaPanel niveau={niveau} basePath="/admin/dba" />
    </div>
  );
}
