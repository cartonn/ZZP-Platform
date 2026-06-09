// Tenant-scoped detail van één dienst (Job) voor de franchisenemer: de dienst zelf + de reacties
// (kandidaten) met live match-score en compliance. Spiegelt de opdrachtgever-kandidaten-logica, maar
// dan binnen de eigen tenant. Read-only oversight; geen mutaties hier.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { scoreJobForFreelancer, computeCompliance, type ComplianceStatus } from "@/lib/matching";
import { type CredentialType, type CredentialStatus } from "@/lib/enums";

export interface DienstApplicant {
  applicationId: string;
  status: string;
  freelancerId: string;
  name: string;
  headline: string | null;
  matchScore: number;
  complianceStatus: ComplianceStatus | null;
  hired: boolean;
}

export interface DienstDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  location: string | null;
  workMode: string;
  rateMin: number | null;
  rateMax: number | null;
  companyName: string;
  departmentName: string | null;
  applicants: DienstApplicant[];
}

export async function getDienstDetail(actor: Actor, jobId: string): Promise<DienstDetail | null> {
  const tenantId = actor.tenantId;
  if (!tenantId) return null;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: { select: { name: true } },
      department: { select: { name: true } },
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
      applications: {
        include: {
          freelancer: {
            select: {
              id: true,
              headline: true,
              hourlyRate: true,
              workMode: true,
              location: true,
              maxTravelMinutes: true,
              availability: true,
              user: { select: { name: true } },
              skills: { select: { skillId: true } },
              availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
              credentials: { select: { type: true, status: true, expiresAt: true } },
            },
          },
          collaboration: { select: { id: true } },
        },
      },
    },
  });
  // Tenant-isolatie: alleen een dienst binnen de eigen franchise.
  if (!job || job.tenantId !== tenantId) return null;

  const requiredTypes = job.credentialRequirements
    .filter((r) => r.required)
    .map((r) => r.credentialType as CredentialType);

  const applicants: DienstApplicant[] = job.applications
    .map((app) => {
      const matchScore = scoreJobForFreelancer(job, app.freelancer).score;
      const complianceStatus =
        requiredTypes.length > 0
          ? computeCompliance(
              requiredTypes,
              app.freelancer.credentials.map((c) => ({
                type: c.type as CredentialType,
                status: c.status as CredentialStatus,
                expiresAt: c.expiresAt,
              })),
            ).status
          : null;
      return {
        applicationId: app.id,
        status: app.status,
        freelancerId: app.freelancer.id,
        name: app.freelancer.user.name ?? "—",
        headline: app.freelancer.headline,
        matchScore,
        complianceStatus,
        hired: app.collaboration != null,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    id: job.id,
    title: job.title,
    description: job.description,
    status: job.status,
    location: job.location,
    workMode: job.workMode,
    rateMin: job.rateMin,
    rateMax: job.rateMax,
    companyName: job.company.name,
    departmentName: job.department?.name ?? null,
    applicants,
  };
}
