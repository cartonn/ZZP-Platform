import { type Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { AUDIT_PAGE_SIZE, normalizeAuditFilters } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTimeNl } from "@/lib/format-date";
import { formatAuditMetadata } from "@/lib/audit-metadata";

export const metadata: Metadata = { title: "Audit log · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const f = normalizeAuditFilters(sp);

  const where: Prisma.AuditLogWhereInput = {};
  if (f.action) where.action = { contains: f.action };
  if (f.entityType) where.entityType = { contains: f.entityType };

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: { actor: { select: { name: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));

  const pageHref = (page: number) => {
    const p = new URLSearchParams();
    if (f.action) p.set("action", f.action);
    if (f.entityType) p.set("entityType", f.entityType);
    p.set("page", String(page));
    return `/admin/audit?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Audit log" description={`${total} gebeurtenis(sen). Alleen-lezen.`} />

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <Input
          name="action"
          defaultValue={f.action ?? ""}
          placeholder="Actie (bijv. INVOICE_PAID)"
          aria-label="Actie"
        />
        <Input
          name="entityType"
          defaultValue={f.entityType ?? ""}
          placeholder="Entiteit (bijv. Credential)"
          aria-label="Entiteit"
        />
        <Button type="submit" variant="secondary">
          Filteren
        </Button>
      </form>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={ScrollText}
              title="Geen gebeurtenissen gevonden"
              description="Er zijn geen logregels die overeenkomen met de huidige filters."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {entries.map((e) => (
            <div key={e.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {e.action}
                </code>
                <span className="text-xs text-muted-foreground">
                  {formatDateTimeNl(e.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.entityType} · {e.entityId} · door {e.actor?.name ?? "systeem"}
              </p>
              {e.metadata && (
                <p className="mt-1 truncate text-xs text-muted-foreground/80">
                  {formatAuditMetadata(e.metadata)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between pt-2" aria-label="Paginering">
          {f.page > 1 ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={pageHref(f.page - 1)}>Vorige</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            Pagina {f.page} van {totalPages}
          </span>
          {f.page < totalPages ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={pageHref(f.page + 1)}>Volgende</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
