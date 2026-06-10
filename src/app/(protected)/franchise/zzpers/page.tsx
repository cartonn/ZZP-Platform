import { type Metadata } from "next";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type Availability } from "@/lib/enums";
import { type FreelancerCredential } from "@/lib/matching";
import { computeEngageability } from "@/lib/engageability";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EngageabilityBadge } from "@/components/engageability-badge";
import { plural } from "@/lib/plural";
import { ZzperForm } from "./zzper-form";

export const metadata: Metadata = { title: "ZZP'ers · Franchise" };

export default async function FranchiseZzpersPage() {
  const actor = await requireRole("FRANCHISER");
  const now = new Date();
  const [freelancers, skills] = await Promise.all([
    prisma.freelancerProfile.findMany({
      where: tenantScopeWhere(actor),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, identityVerifiedAt: true, lastLoginAt: true } },
        credentials: { select: { type: true, status: true, expiresAt: true } },
        _count: { select: { credentials: true, collaborations: true, skills: true } },
      },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const engageabilityById = new Map(
    freelancers.map((f) => [
      f.id,
      computeEngageability(
        {
          credentials: f.credentials.map(
            (c): FreelancerCredential => ({
              type: c.type as FreelancerCredential["type"],
              status: c.status as FreelancerCredential["status"],
              expiresAt: c.expiresAt,
            }),
          ),
          completeness: f.completeness,
          availability: f.availability as Availability,
          identityVerified: f.user.identityVerifiedAt != null,
          lastActiveAt: f.user.lastLoginAt,
        },
        now,
      ),
    ]),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="ZZP'ers"
        description="De ZZP'ers in je roster — degenen die je in je franchise hebt gebracht."
      />

      {/* Toevoegen ingeklapt zodat de roster (het primaire werk) bovenaan dominant blijft; open zodra
          er nog geen ZZP'ers zijn (eerste onboarding). */}
      <details open={freelancers.length === 0} className="rounded-lg border border-border bg-card">
        <summary className="cursor-pointer p-4 text-sm font-semibold tracking-tight">
          Nieuwe ZZP&apos;er toevoegen
        </summary>
        <div className="space-y-4 border-t border-border p-5 pt-4">
          <ZzperForm skills={skills} />
        </div>
      </details>

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
          {freelancers.map((f) => {
            const eng = engageabilityById.get(f.id)!;
            return (
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
                  {/* Waaróm niet-inzetbaar in één oogopslag, zodat de franchiser de blokkade ziet
                      zonder door te klikken. Eerste blokkade + telling van de rest. */}
                  {eng.blockers.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-danger">
                      {eng.blockers[0]}
                      {eng.blockers.length > 1 ? ` +${eng.blockers.length - 1}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <EngageabilityBadge status={eng.status} />
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
