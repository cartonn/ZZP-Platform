import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Disputen · ZZP Platform" };

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : "—";
}

export default async function AdminDisputenPage() {
  await requireRole("ADMIN");

  const disputed = await prisma.collaboration.findMany({
    where: { disputedAt: { not: null } },
    orderBy: { disputedAt: "asc" },
    include: {
      job: { select: { title: true } },
      company: { select: { name: true } },
      freelancer: { select: { user: { select: { name: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Disputen"
        description="Samenwerkingen met een open dispuut. Het werkproces is bevroren tot het platform bemiddelt en het dispuut oplost."
      />

      {disputed.length === 0 ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="Geen open disputen"
            description="Er zijn op dit moment geen bevroren samenwerkingen."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {disputed.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{c.job.title}</p>
                  <span className="text-xs text-muted-foreground">sinds {fmt(c.disputedAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.freelancer.user.name} ↔ {c.company.name}
                </p>
                {c.disputeReason && <p className="text-sm text-danger">{c.disputeReason}</p>}
                <Link
                  href={`/samenwerkingen/${c.id}`}
                  className="inline-flex text-sm font-medium underline underline-offset-4"
                >
                  Open werkproces om te bemiddelen →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
