import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type JobStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { plural } from "@/lib/plural";
import { DepartmentForm } from "./department-form";
import { DienstInlineForm } from "./dienst-inline-form";
import { removeDepartment } from "../actions";

export const metadata: Metadata = { title: "Opdrachtgever · Bemiddeling" };

export default async function OpdrachtgeverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireRole("FRANCHISER");
  const [company, skills, orphanJobs] = await Promise.all([
    prisma.company.findFirst({
      where: { id, ...tenantScopeWhere(actor) },
      include: {
        user: { select: { name: true, email: true } },
        departments: {
          orderBy: { createdAt: "asc" },
          include: {
            jobs: {
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                title: true,
                status: true,
                _count: { select: { applications: true } },
              },
            },
          },
        },
      },
    }),
    // unbounded-allow: skills-referentielijst voor formulier
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // Diensten zonder afdeling: blijven bestaan (en zichtbaar/matchbaar) nadat hun afdeling is
    // verwijderd (onDelete: SetNull). Apart tonen zodat ze niet stil uit de cockpit verdwijnen.
    // unbounded-allow: opdrachten per opdrachtgever voor formulier
    prisma.job.findMany({
      where: { companyId: id, departmentId: null, ...tenantScopeWhere(actor) },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, _count: { select: { applications: true } } },
    }),
  ]);
  if (!company) notFound();

  // Onboarding "afmaken"-balk zolang er nog geen afdeling óf nog geen dienst is — zelfde regel als
  // de wizard (getOnboardingState). Linkt terug naar de juiste wizard-stap.
  const totalDiensten = company.departments.reduce((sum, d) => sum + d.jobs.length, 0);
  const onboardingIncomplete = company.departments.length === 0 || totalDiensten === 0;
  const resumeStap = company.departments.length === 0 ? "afdelingen" : "diensten";

  return (
    <div className="space-y-6">
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

      {onboardingIncomplete && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-accent/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Onboarding nog niet afgerond —{" "}
            {company.departments.length === 0
              ? "voeg een afdeling toe"
              : "zet een eerste dienst uit"}
            .
          </span>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/franchise/opdrachtgevers/nieuw?stap=${resumeStap}&company=${company.id}`}>
              Onboarding afmaken
            </Link>
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="space-y-5 p-5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Afdelingen &amp; diensten</h2>
            <p className="text-xs text-muted-foreground">
              Richt per afdeling de diensten in die je voor deze opdrachtgever uitzet.
            </p>
          </div>

          {company.departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen afdelingen. Voeg er hieronder een toe.
            </p>
          ) : (
            <ul className="space-y-4">
              {company.departments.map((d) => {
                const openCount = d.jobs.filter((j) => j.status === "PUBLISHED").length;
                return (
                  <li key={d.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.location ? `${d.location} · ` : ""}
                          {plural(d.jobs.length, "dienst", "diensten")}
                          {d.jobs.length > 0 && ` · ${openCount} open`}
                        </p>
                      </div>
                      <ConfirmButton
                        action={removeDepartment.bind(null, d.id)}
                        triggerVariant="ghost"
                        size="xs"
                        title="Afdeling verwijderen?"
                        description={
                          d.jobs.length > 0
                            ? `Deze afdeling heeft ${plural(d.jobs.length, "dienst", "diensten")}. Die blijven bestaan, maar verliezen hun koppeling met deze afdeling.`
                            : "De afdeling wordt definitief verwijderd."
                        }
                        confirmLabel="Verwijderen"
                      >
                        Verwijderen
                      </ConfirmButton>
                    </div>

                    {d.jobs.length > 0 && (
                      <ul className="mt-3 divide-y divide-border border-t border-border">
                        {d.jobs.map((j) => (
                          <li key={j.id} className="flex items-center justify-between gap-3 py-2">
                            <Link
                              href={`/franchise/diensten/${j.id}`}
                              className="focus-ring min-w-0 truncate text-sm hover:underline"
                            >
                              {j.title}
                            </Link>
                            <span className="flex shrink-0 items-center gap-2">
                              {j._count.applications > 0 && (
                                <Badge variant="muted">
                                  {plural(j._count.applications, "reactie", "reacties")}
                                </Badge>
                              )}
                              <JobStatusBadge status={j.status as JobStatus} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <DienstInlineForm departmentId={d.id} skills={skills} />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-border pt-4">
            <DepartmentForm companyId={company.id} />
          </div>
        </CardContent>
      </Card>

      {orphanJobs.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Diensten zonder afdeling</h2>
              <p className="text-xs text-muted-foreground">
                Deze diensten hoorden bij een verwijderde afdeling. Ze zijn nog actief en zichtbaar
                voor je roster — koppel ze aan een afdeling of sluit ze als ze niet meer nodig zijn.
              </p>
            </div>
            <ul className="divide-y divide-border border-t border-border">
              {orphanJobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-2">
                  <Link
                    href={`/franchise/diensten/${j.id}`}
                    className="focus-ring min-w-0 truncate text-sm hover:underline"
                  >
                    {j.title}
                  </Link>
                  <span className="flex shrink-0 items-center gap-2">
                    {j._count.applications > 0 && (
                      <Badge variant="muted">
                        {plural(j._count.applications, "reactie", "reacties")}
                      </Badge>
                    )}
                    <JobStatusBadge status={j.status as JobStatus} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
