import { type Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type Availability } from "@/lib/enums";
import { type FreelancerCredential } from "@/lib/matching";
import { computeEngageability, type EngageabilityStatus } from "@/lib/engageability";
import {
  summarizeExpiryAlert,
  expiryAlertLabel,
  expiryAlertTone,
} from "@/lib/franchise/credential-alerts";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { plural } from "@/lib/plural";
import { ZzperForm } from "./zzper-form";

export const metadata: Metadata = { title: "ZZP'ers · Bemiddeling" };

// Kanban-kolommen op inzetbaarheidsstatus (Actief → Aandacht → Inactief).
const ENG_COLUMNS: { status: EngageabilityStatus; label: string }[] = [
  { status: "ACTIEF", label: "Inzetbaar" },
  { status: "AANDACHT", label: "Aandacht" },
  { status: "INACTIEF", label: "Nog niet inzetbaar" },
];

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
        <div className="grid gap-4 lg:grid-cols-3">
          {ENG_COLUMNS.map((col) => {
            const colFreelancers = freelancers.filter(
              (f) => engageabilityById.get(f.id)!.status === col.status,
            );
            return (
              <div key={col.status} className="rounded-xl bg-muted/40 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm font-medium">{col.label}</span>
                  <span className="rounded-full bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground shadow-card">
                    {colFreelancers.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colFreelancers.length === 0 ? (
                    <p className="px-1 py-8 text-center text-xs text-muted-foreground">
                      Geen ZZP&apos;ers
                    </p>
                  ) : (
                    colFreelancers.map((f) => {
                      const eng = engageabilityById.get(f.id)!;
                      const alert = expiryAlertById.get(f.id)!;
                      const alertLabel = expiryAlertLabel(alert);
                      const alertTone = expiryAlertTone(alert);
                      return (
                        <Link
                          key={f.id}
                          href={`/franchise/zzpers/${f.id}`}
                          className="focus-ring hover:shadow-card-hover block rounded-lg border border-border bg-card p-3 shadow-card transition-all hover:-translate-y-0.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-sm font-medium">{f.user.name}</p>
                            {alertLabel && alertTone && (
                              <Badge variant={alertTone} className="shrink-0">
                                {alertLabel}
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {f.headline ?? f.user.email}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {plural(f._count.skills, "skill", "skills")} · profiel {f.completeness}%
                          </p>
                          {eng.blockers.length > 0 && (
                            <p className="mt-1 truncate text-xs text-danger">
                              {eng.blockers[0]}
                              {eng.blockers.length > 1 ? ` +${eng.blockers.length - 1}` : ""}
                            </p>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
