import Link from "next/link";
import { Download, ScrollText } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ciContains } from "@/lib/db/text-search";
import { AUDIT_PAGE_SIZE, auditExportHref, type AuditFilters } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatDateTimeNl } from "@/lib/format-date";
import { formatAuditMetadata } from "@/lib/audit-metadata";
import { auditActionLabel, auditEntityLabel } from "@/lib/audit-labels";
import { withParams } from "@/components/admin/base-path";

/**
 * Audit-log-paneel: alleen-lezen, gepagineerd en filterbaar op actie/entiteit. Filters + pagina
 * komen als prop binnen (de host leest searchParams); de filter-form en paginatie wijzen naar
 * `basePath` zodat het paneel zowel op /admin/audit als binnen de toezicht-hub werkt. Het GET-form
 * behoudt de basePath-query (bv. ?tab=audit) via verborgen velden. Rendert geen eigen paginakop.
 *
 * @param filters  genormaliseerde audit-filters (action/entityType/page) uit de searchParams.
 * @param basePath pad waarheen filter- en paginatie-links wijzen; mag al een query bevatten.
 */
export async function AuditPanel({
  filters,
  basePath,
}: {
  filters: AuditFilters;
  basePath: string;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.action) where.action = ciContains(filters.action);
  if (filters.entityType) where.entityType = ciContains(filters.entityType);

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include: { actor: { select: { name: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));

  // Verborgen velden voor het GET-form: de query die al in basePath zit (bv. tab=audit) moet
  // behouden blijven na het filteren, anders verlaat het form de hub-tab.
  const [formAction, formQuery] = basePath.split("?");
  const carryParams = formQuery ? Array.from(new URLSearchParams(formQuery).entries()) : [];

  const pageHref = (page: number) => {
    const params: Record<string, string | number> = {};
    if (filters.action) params.action = filters.action;
    if (filters.entityType) params.entityType = filters.entityType;
    params.page = page;
    return withParams(basePath, params);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{total} gebeurtenis(sen). Alleen-lezen.</p>
        {total > 0 && (
          <Button asChild variant="secondary" size="sm">
            <Link href={auditExportHref(filters)} prefetch={false}>
              <Download className="size-4" aria-hidden />
              Exporteer (CSV)
            </Link>
          </Button>
        )}
      </div>

      <form
        method="get"
        action={formAction}
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        {carryParams.map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <Input
          name="action"
          defaultValue={filters.action ?? ""}
          placeholder="Actie (bijv. INVOICE_PAID)"
          aria-label="Actie"
        />
        <Input
          name="entityType"
          defaultValue={filters.entityType ?? ""}
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
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {auditActionLabel(e.action)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTimeNl(e.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {auditEntityLabel(e.entityType)} · {e.entityId} · door {e.actor?.name ?? "systeem"}
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
          {filters.page > 1 ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={pageHref(filters.page - 1)}>Vorige</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            Pagina {filters.page} van {totalPages}
          </span>
          {filters.page < totalPages ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={pageHref(filters.page + 1)}>Volgende</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
