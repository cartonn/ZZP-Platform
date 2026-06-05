import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type CredentialType, type CredentialStatus, type Availability } from "@/lib/enums";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { formatDateShortNl } from "@/lib/format-date";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CredentialStatusBadge } from "@/components/credentials/credential-status-badge";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "ZZP'er · Franchise" };

const AVAIL: Record<Availability, { label: string; variant: "success" | "warning" | "muted" }> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt beschikbaar", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
  UNKNOWN: { label: "Beschikbaarheid onbekend", variant: "muted" },
};

export default async function RosterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireRole("FRANCHISER");
  const profile = await prisma.freelancerProfile.findFirst({
    where: { id, ...tenantScopeWhere(actor) },
    include: {
      user: { select: { name: true, email: true } },
      skills: { include: { skill: { select: { name: true } } } },
      credentials: {
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, title: true, status: true, expiresAt: true },
      },
      _count: { select: { collaborations: true } },
    },
  });
  if (!profile) notFound();

  const avail = AVAIL[profile.availability as Availability] ?? AVAIL.UNKNOWN;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/franchise/zzpers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Terug naar ZZP&apos;ers
      </Link>
      <PageHeader
        title={profile.user.name}
        description={`${profile.headline ?? profile.user.email}${
          profile.location ? ` · ${profile.location}` : ""
        }`}
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={avail.variant}>{avail.label}</Badge>
            {profile.hourlyRate != null && <Badge variant="muted">€{profile.hourlyRate}/uur</Badge>}
            <Badge variant="muted">Profiel {profile.completeness}%</Badge>
            <Badge variant="muted">
              {plural(profile._count.collaborations, "samenwerking", "samenwerkingen")}
            </Badge>
          </div>
          {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

          <div>
            <h2 className="mb-2 text-sm font-semibold tracking-tight">Skills</h2>
            {profile.skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen skills vastgelegd.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <Badge key={s.skillId} variant="muted">
                    {s.skill.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Certificaten</h2>
          {profile.credentials.length === 0 ? (
            <EmptyState
              title="Nog geen certificaten"
              description="De ZZP'er uploadt zelf certificaten; die worden hier zichtbaar zodra ze zijn ingediend."
            />
          ) : (
            <ul className="divide-y divide-border">
              {profile.credentials.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="font-medium">{c.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {CREDENTIAL_TYPE_LABEL[c.type as CredentialType] ?? c.type}
                      {c.expiresAt && ` · verloopt ${formatDateShortNl(c.expiresAt)}`}
                    </span>
                  </span>
                  <CredentialStatusBadge status={c.status as CredentialStatus} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
