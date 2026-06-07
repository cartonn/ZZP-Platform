import { type Metadata } from "next";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { plural } from "@/lib/plural";
import { ZzperForm } from "./zzper-form";

export const metadata: Metadata = { title: "ZZP'ers · Franchise" };

const AVAIL_LABEL: Record<string, string> = {
  AVAILABLE: "Beschikbaar",
  LIMITED: "Beperkt",
  UNAVAILABLE: "Niet beschikbaar",
  UNKNOWN: "Onbekend",
};

export default async function FranchiseZzpersPage() {
  const actor = await requireRole("FRANCHISER");
  const [freelancers, skills] = await Promise.all([
    prisma.freelancerProfile.findMany({
      where: tenantScopeWhere(actor),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { credentials: true, collaborations: true, skills: true } },
      },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="ZZP'ers"
        description="De ZZP'ers in je roster — degenen die je in je franchise hebt gebracht."
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Nieuwe ZZP&apos;er</h2>
          <ZzperForm skills={skills} />
        </CardContent>
      </Card>

      {freelancers.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nog geen ZZP'ers"
            description="Voeg hierboven je eerste ZZP'er toe — daarna vult hij zelf zijn profiel en certificaten aan."
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {freelancers.map((f) => (
            <Link
              key={f.id}
              href={`/franchise/zzpers/${f.id}`}
              className="focus-ring flex items-center justify-between gap-3 p-4 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{f.user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {f.headline ?? f.user.email}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {plural(f._count.skills, "skill", "skills")} ·{" "}
                  {plural(f._count.credentials, "certificaat", "certificaten")} · profiel{" "}
                  {f.completeness}%
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={f.availability === "AVAILABLE" ? "success" : "muted"}>
                  {AVAIL_LABEL[f.availability] ?? f.availability}
                </Badge>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
