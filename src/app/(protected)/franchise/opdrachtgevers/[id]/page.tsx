import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { plural } from "@/lib/plural";
import { DepartmentForm } from "./department-form";
import { removeDepartment } from "../actions";

export const metadata: Metadata = { title: "Opdrachtgever · Franchise" };

export default async function OpdrachtgeverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireRole("FRANCHISER");
  const company = await prisma.company.findFirst({
    where: { id, ...tenantScopeWhere(actor) },
    include: {
      user: { select: { name: true, email: true } },
      departments: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { jobs: true } } },
      },
    },
  });
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/franchise/opdrachtgevers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Terug naar opdrachtgevers
      </Link>
      <PageHeader
        title={company.name}
        description={`${company.user.name} · ${company.user.email}${
          company.location ? ` · ${company.location}` : ""
        }`}
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Afdelingen</h2>
          {company.departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen afdelingen. Voeg er hieronder een toe.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {company.departments.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="font-medium">{d.name}</span>
                    {d.location && <span className="text-muted-foreground"> · {d.location}</span>}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {plural(d._count.jobs, "dienst", "diensten")}
                    </span>
                  </span>
                  <form action={removeDepartment.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="xs">
                      Verwijderen
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border pt-4">
            <DepartmentForm companyId={company.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
