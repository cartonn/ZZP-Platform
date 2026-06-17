import { type Metadata } from "next";
import Link from "next/link";
import { Users, MapPin, Euro, Calendar } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type Availability } from "@/lib/enums";
import { type FreelancerCredential } from "@/lib/matching";
import { computeEngageability } from "@/lib/engageability";
import {
  summarizeExpiryAlert,
  expiryAlertLabel,
  expiryAlertTone,
} from "@/lib/franchise/credential-alerts";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EngageabilityBadge } from "@/components/engageability-badge";
import { plural } from "@/lib/plural";
import { ZzperForm } from "./zzper-form";

export const metadata: Metadata = { title: "ZZP'ers · Bemiddeling" };

const WORK_MODE_LABEL: Record<string, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: "Beschikbaar",
  LIMITED: "Beperkt beschikbaar",
  UNAVAILABLE: "Niet beschikbaar",
};

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
        skills: { include: { skill: { select: { name: true } } } },
        _count: { select: { credentials: true, collaborations: true, skills: true } },
      },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const expiryAlertById = new Map(
    freelancers.map((f) => [
      f.id,
      summarizeExpiryAlert(
        f.credentials.map((c) => ({
          id: `${f.id}:${c.type}`,
          title: CREDENTIAL_TYPE_LABEL[c.type as keyof typeof CREDENTIAL_TYPE_LABEL] ?? c.type,
          type: c.type as FreelancerCredential["type"],
          status: c.status as FreelancerCredential["status"],
          expiresAt: c.expiresAt,
        })),
        now,
      ),
    ]),
  );

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
    <div className="space-y-6">
      <PageHeader
        title="ZZP'ers"
        description="De ZZP'ers in je roster — degenen die je in je bemiddeling hebt gebracht."
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
        // Zelfde kaartweergave als de opdrachtgever (/freelancers): avatar + naam + status,
        // meta, skills en een profielknop — hier rol-passend met inzetbaarheid + detail-link.
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {freelancers.map((f) => {
            const eng = engageabilityById.get(f.id)!;
            const alert = expiryAlertById.get(f.id)!;
            const alertLabel = expiryAlertLabel(alert);
            const alertTone = expiryAlertTone(alert);
            const initials = (f.user.name ?? "?")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const skillLabels = f.skills.map((s) => s.skill.name);
            return (
              <Card key={f.id} className="flex flex-col gap-3 p-4">
                {/* Kop: avatar + naam + inzetbaarheid */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{f.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.headline ?? f.user.email}
                    </p>
                  </div>
                  <span className="shrink-0">
                    <EngageabilityBadge status={eng.status} />
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {f.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {f.location} · {WORK_MODE_LABEL[f.workMode] ?? f.workMode}
                    </span>
                  )}
                  {f.hourlyRate != null && (
                    <span className="flex items-center gap-1">
                      <Euro className="h-3 w-3 shrink-0" aria-hidden />€ {f.hourlyRate} / uur
                    </span>
                  )}
                  {AVAILABILITY_LABEL[f.availability] && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                      {AVAILABILITY_LABEL[f.availability]}
                    </span>
                  )}
                </div>

                {/* Certificaat-waarschuwing + blokkade */}
                {alertLabel && alertTone && (
                  <Badge variant={alertTone} className="self-start">
                    {alertLabel}
                  </Badge>
                )}
                {eng.blockers.length > 0 && (
                  <p className="truncate text-xs text-danger">
                    {eng.blockers[0]}
                    {eng.blockers.length > 1 ? ` +${eng.blockers.length - 1}` : ""}
                  </p>
                )}

                {/* Skills */}
                {skillLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {skillLabels.slice(0, 4).map((s) => (
                      <Badge key={s} variant="muted" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                    {skillLabels.length > 4 && (
                      <Badge variant="muted" className="text-xs">
                        +{skillLabels.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {plural(f._count.credentials, "certificaat", "certificaten")} · profiel{" "}
                  {f.completeness}%
                </p>

                {/* Actie */}
                <div className="mt-auto pt-1">
                  <Button asChild variant="secondary" size="sm" className="w-full">
                    <Link href={`/franchise/zzpers/${f.id}`}>Bekijk profiel</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
