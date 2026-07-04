// Data-access voor het ZZP'er-dossier in de franchise-werkplek (read-only oversight). Tenant-scoped:
// een franchiser ziet alleen het dossier van een ZZP'er in zijn eigen roster. Brengt profiel,
// overeenkomsten (met cascade-fase), urenregistraties, facturen, bestanden en het logboek samen tot
// één view, uitsluitend door bestaande helpers te componeren — geen nieuwe rekenlogica.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { tenantScopeWhere } from "@/lib/tenancy";
import {
  type Availability,
  type WorkMode,
  type CredentialType,
  type CredentialStatus,
  type CollaborationStatus,
  type ContractStatus,
  type InvoiceStatus,
} from "@/lib/enums";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";
import {
  cascadeStage,
  isPerformanceNewerThanInvoice,
  type CascadeStage,
} from "@/lib/cascade/stage";
import { type FreelancerCredential } from "@/lib/matching";
import { computeEngageability, type EngageabilityResult } from "@/lib/engageability";
import { parseLanguages } from "@/lib/parse-languages";

export interface DossierCollaboration {
  id: string;
  jobTitle: string;
  companyName: string;
  status: CollaborationStatus;
  rate: number | null; // uurtarief-snapshot in euro
  startDate: Date | null;
  endDate: Date | null;
  stage: CascadeStage;
}

export interface DossierPerformance {
  id: string;
  jobTitle: string;
  type: "HOURS" | "MILESTONE";
  status: PerformanceState;
  periodStart: Date | null;
  periodEnd: Date | null;
  hours: number | null;
  amountCents: number | null;
}

export interface DossierInvoice {
  id: string;
  number: string | null;
  status: InvoiceStatus;
  companyName: string | null;
  totalCents: number;
  issuedAt: Date | null;
  dueAt: Date | null;
}

export interface DossierCredential {
  id: string;
  type: CredentialType;
  title: string;
  status: CredentialStatus;
  expiresAt: Date | null;
  documentFilename: string | null;
}

export interface DossierLogEntry {
  id: string;
  action: string;
  createdAt: Date;
}

export interface RosterDossier {
  profile: {
    id: string;
    name: string;
    email: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    workMode: WorkMode;
    availability: Availability;
    hourlyRate: number | null;
    maxTravelMinutes: number | null;
    completeness: number;
    languages: string[];
    kvkNumber: string | null;
    btwNumber: string | null;
    skills: string[];
    industries: string[];
  };
  engageability: EngageabilityResult;
  collaborations: DossierCollaboration[];
  performances: DossierPerformance[];
  invoices: DossierInvoice[];
  credentials: DossierCredential[];
  logbook: DossierLogEntry[];
  counts: {
    collaborations: number;
    performances: number;
    invoices: number;
    credentials: number;
  };
}

/**
 * Het volledige dossier van één ZZP'er voor de eigen franchise, of `null` als de ZZP'er niet in de
 * roster van de actor zit (geen cross-tenant lek). Read-only.
 */
export async function getRosterDossier(
  actor: Actor,
  profileId: string,
): Promise<RosterDossier | null> {
  const profile = await prisma.freelancerProfile.findFirst({
    where: { id: profileId, ...tenantScopeWhere(actor) },
    include: {
      user: {
        select: { id: true, name: true, email: true, identityVerifiedAt: true, lastLoginAt: true },
      },
      skills: { include: { skill: { select: { name: true } } } },
      industries: { include: { industry: { select: { name: true } } } },
      credentials: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          status: true,
          expiresAt: true,
          document: { select: { filename: true } },
        },
      },
    },
  });
  if (!profile) return null;

  const [collabRows, performanceRows, invoiceRows, logRows] = await Promise.all([
    prisma.collaboration.findMany({
      // Tenant-scope: alleen samenwerkingen op opdrachten van de eigen franchise. Een roster-ZZP'er
      // kan via overflow ook voor een andere franchise hebben gewerkt — die mag hier niet lekken.
      where: { freelancerId: profile.id, job: { is: tenantScopeWhere(actor) } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        contractStatus: true,
        disputedAt: true,
        rate: true,
        startDate: true,
        endDate: true,
        job: { select: { title: true } },
        company: { select: { name: true } },
        performances: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, createdAt: true },
        },
        invoices: {
          where: { lifecycleStatus: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { lifecycleStatus: true, createdAt: true },
        },
      },
    }),
    prisma.performance.findMany({
      where: { collaboration: { freelancerId: profile.id, job: { is: tenantScopeWhere(actor) } } },
      orderBy: { periodStart: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        hours: true,
        amountCents: true,
        collaboration: { select: { job: { select: { title: true } } } },
      },
    }),
    prisma.invoice.findMany({
      // Alleen facturen die bij een samenwerking op een eigen-franchise-opdracht horen (geen lek van
      // facturen voor overflow-werk bij een andere franchise).
      where: {
        issuerUserId: profile.user.id,
        collaboration: { is: { job: { is: tenantScopeWhere(actor) } } },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        number: true,
        status: true,
        totalCents: true,
        issuedAt: true,
        dueAt: true,
        collaboration: { select: { company: { select: { name: true } } } },
      },
    }),
    prisma.auditLog.findMany({
      where: { entityType: "FreelancerProfile", entityId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, action: true, createdAt: true },
    }),
  ]);

  const collaborations: DossierCollaboration[] = collabRows.map((c) => ({
    id: c.id,
    jobTitle: c.job.title,
    companyName: c.company.name,
    status: c.status as CollaborationStatus,
    rate: c.rate,
    startDate: c.startDate,
    endDate: c.endDate,
    stage: cascadeStage({
      viewer: "CLIENT",
      collaborationId: c.id,
      collaborationStatus: c.status as CollaborationStatus,
      contractStatus: c.contractStatus as ContractStatus,
      disputed: c.disputedAt !== null,
      latestPerformanceStatus: (c.performances[0]?.status ?? null) as PerformanceState | null,
      latestInvoiceStatus: (c.invoices[0]?.lifecycleStatus ?? null) as InvoiceLifecycleState | null,
      performanceNewerThanInvoice: isPerformanceNewerThanInvoice(
        c.performances[0]?.createdAt ?? null,
        c.invoices[0]?.createdAt ?? null,
      ),
    }),
  }));

  const engageability = computeEngageability(
    {
      credentials: profile.credentials.map(
        (c): FreelancerCredential => ({
          type: c.type as FreelancerCredential["type"],
          status: c.status as FreelancerCredential["status"],
          expiresAt: c.expiresAt,
        }),
      ),
      completeness: profile.completeness,
      availability: profile.availability as Availability,
      identityVerified: profile.user.identityVerifiedAt != null,
      lastActiveAt: profile.user.lastLoginAt,
    },
    new Date(),
  );

  return {
    engageability,
    profile: {
      id: profile.id,
      name: profile.user.name,
      email: profile.user.email,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      workMode: profile.workMode as WorkMode,
      availability: profile.availability as Availability,
      hourlyRate: profile.hourlyRate,
      maxTravelMinutes: profile.maxTravelMinutes,
      completeness: profile.completeness,
      languages: parseLanguages(profile.languages),
      kvkNumber: profile.kvkNumber,
      btwNumber: profile.btwNumber,
      skills: profile.skills.map((s) => s.skill.name),
      industries: profile.industries.map((i) => i.industry.name),
    },
    collaborations,
    performances: performanceRows.map((p) => ({
      id: p.id,
      jobTitle: p.collaboration.job.title,
      type: p.type as "HOURS" | "MILESTONE",
      status: p.status as PerformanceState,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      hours: p.hours,
      amountCents: p.amountCents,
    })),
    invoices: invoiceRows.map((i) => ({
      id: i.id,
      number: i.number,
      status: i.status as InvoiceStatus,
      companyName: i.collaboration?.company.name ?? null,
      totalCents: i.totalCents,
      issuedAt: i.issuedAt,
      dueAt: i.dueAt,
    })),
    credentials: profile.credentials.map((c) => ({
      id: c.id,
      type: c.type as CredentialType,
      title: c.title,
      status: c.status as CredentialStatus,
      expiresAt: c.expiresAt,
      documentFilename: c.document?.filename ?? null,
    })),
    logbook: logRows.map((l) => ({ id: l.id, action: l.action, createdAt: l.createdAt })),
    counts: {
      collaborations: collabRows.length,
      performances: performanceRows.length,
      invoices: invoiceRows.length,
      credentials: profile.credentials.length,
    },
  };
}
