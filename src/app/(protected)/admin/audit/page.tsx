import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { normalizeAuditFilters } from "@/lib/admin";
import { PageHeader } from "@/components/ui/page-header";
import { AuditPanel, countAuditEntries } from "@/components/admin/audit-panel";

export const metadata: Metadata = { title: "Audit log · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const filters = normalizeAuditFilters(sp);
  const total = await countAuditEntries(filters);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description={`${total} gebeurtenis(sen). Alleen-lezen.`} />

      <AuditPanel filters={filters} basePath="/admin/audit" />
    </div>
  );
}
