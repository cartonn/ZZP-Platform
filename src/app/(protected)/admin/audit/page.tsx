import { type Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { normalizeAuditFilters } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AuditPanel, countAuditEntries } from "@/components/admin/audit-panel";

export const metadata: Metadata = { title: "Audit log · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const filters = normalizeAuditFilters(sp);
  const total = await countAuditEntries(filters);

  // Export behoudt de actieve filters (niet de paginering — de export omvat de hele filterselectie).
  const exportParams = new URLSearchParams();
  if (filters.action) exportParams.set("action", filters.action);
  if (filters.entityType) exportParams.set("entityType", filters.entityType);
  const exportQuery = exportParams.toString();
  const exportHref = `/admin/audit/export${exportQuery ? `?${exportQuery}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description={`${total} gebeurtenis(sen). Alleen-lezen.`}
        action={
          total > 0 ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={exportHref} prefetch={false}>
                <Download className="size-4" aria-hidden />
                Exporteer (CSV)
              </Link>
            </Button>
          ) : undefined
        }
      />

      <AuditPanel filters={filters} basePath="/admin/audit" />
    </div>
  );
}
