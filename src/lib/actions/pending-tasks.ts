// Actiecentrum — server-enumerator. Haalt per rol de CONCRETE openstaande items op (findMany, niet
// count) en bouwt PendingTask[] via de pure builders in tasks.ts. Hergebruikt dezelfde queries/
// drempels als het dashboard (signals.ts, profile.ts). N+1-veilig: één query per kind met take-limiet.

import "server-only";
import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { type Availability } from "@/lib/enums";
import { computeFreelancerCompleteness, computeCompanyCompleteness } from "@/lib/profile";
import { getCompletenessProfile } from "@/lib/data/freelancer-profile";
import { overdueInvoiceCount } from "@/lib/signals";
import {
  rankTasks,
  contractSignTask,
  performanceApproveTask,
  performanceResubmitTask,
  invoiceSubmitTask,
  invoiceApproveTask,
  paymentConfirmTask,
  messageReplyTask,
  profilePrivateTask,
  profileCompletenessTask,
  identityVerifyTask,
  companyCompletenessTask,
  credentialFixTask,
  adminVerifyCredentialTask,
  adminActivateUserTask,
  adminResolveDisputeTask,
  adminDeletionRequestTask,
  overdueInvoiceTask,
  applicationsReviewTask,
  draftJobsTask,
  type PendingTask,
} from "@/lib/actions/tasks";

/** Harde bovengrens per kind (voorkomt N+1/zware lijsten op /acties); "+N meer" buiten beschouwing. */
const MAX = 50;
const EXPIRY_WINDOW_MS = 30 * 86_400_000;

function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** Gesprekken met een onbeantwoord bericht van de andere partij (zelfde logica als signals). */
async function unreadConversations(userId: string): Promise<string[]> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (participants.length === 0) return [];
  const grouped = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: participants.map((p) => p.conversationId) },
      senderId: { not: userId },
    },
    _max: { createdAt: true },
  });
  const latest = new Map(grouped.map((g) => [g.conversationId, g._max.createdAt]));
  return participants
    .filter((p) => {
      const at = latest.get(p.conversationId);
      return at && (!p.lastReadAt || at.getTime() > p.lastReadAt.getTime());
    })
    .slice(0, MAX)
    .map((p) => p.conversationId);
}

export async function pendingTasks(actor: Actor): Promise<PendingTask[]> {
  if (actor.role === "FREELANCER") return rankTasks(await freelancerTasks(actor.id));
  if (actor.role === "CLIENT") return rankTasks(await clientTasks(actor.id));
  return rankTasks(await adminTasks());
}

async function freelancerTasks(userId: string): Promise<PendingTask[]> {
  const tasks: PendingTask[] = [];
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRY_WINDOW_MS);

  const [profile, account, overdue, unread] = await Promise.all([
    // Gedeelde, request-gecachte profiel-load (zie getCompletenessProfile): op het dashboard
    // deelt deze query één render met dashboardData i.p.v. het profiel tweemaal op te halen.
    getCompletenessProfile(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { identityVerifiedAt: true } }),
    overdueInvoiceCount("FREELANCER", userId),
    unreadConversations(userId),
  ]);

  if (profile) {
    if (profile.visibility === "PRIVATE") tasks.push(profilePrivateTask());
    if (!account?.identityVerifiedAt) tasks.push(identityVerifyTask());
    const { score, missing } = computeFreelancerCompleteness({
      headline: profile.headline,
      bio: profile.bio,
      hourlyRate: profile.hourlyRate,
      location: profile.location,
      availability: profile.availability as Availability,
      languages: parseLanguages(profile.languages),
      skillCount: profile.skills.length,
      industryCount: profile.industries.length,
    });
    if (score < 100)
      tasks.push(
        profileCompletenessTask(
          score,
          missing.map((m) => m.label),
        ),
      );

    const creds = await prisma.credential.findMany({
      where: {
        freelancerProfileId: profile.id,
        OR: [{ status: "REJECTED" }, { status: "VERIFIED", expiresAt: { gt: now, lte: soon } }],
      },
      select: { id: true, title: true, status: true },
      take: MAX,
    });
    for (const c of creds) {
      tasks.push(
        credentialFixTask(c.id, c.title, c.status === "REJECTED" ? "rejected" : "expiring"),
      );
    }
  }

  // Lopende/voorgestelde samenwerkingen (geen disputen — die zijn bevroren).
  const collabs = await prisma.collaboration.findMany({
    where: { freelancer: { userId }, status: { in: ["PROPOSED", "ACTIVE"] }, disputedAt: null },
    select: {
      id: true,
      status: true,
      job: { select: { title: true } },
      company: { select: { name: true } },
      performances: { where: { status: "REJECTED" }, select: { id: true }, take: 5 },
      invoices: {
        where: { lifecycleStatus: { in: ["DRAFT", "REJECTED", "APPROVED"] } },
        select: { id: true, lifecycleStatus: true },
        take: 5,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX,
  });
  for (const c of collabs) {
    if (c.status === "PROPOSED") {
      tasks.push(contractSignTask(c.id, c.job.title, c.company.name));
      continue;
    }
    for (const p of c.performances) tasks.push(performanceResubmitTask(p.id, c.id, c.job.title));
    for (const inv of c.invoices) {
      if (inv.lifecycleStatus === "APPROVED")
        tasks.push(paymentConfirmTask(inv.id, c.id, c.job.title));
      else
        tasks.push(
          invoiceSubmitTask(inv.id, c.id, c.job.title, inv.lifecycleStatus === "REJECTED"),
        );
    }
  }

  for (const conversationId of unread)
    tasks.push(messageReplyTask(conversationId, "Nieuw bericht"));
  if (overdue > 0) tasks.push(overdueInvoiceTask(overdue, "FREELANCER"));
  return tasks;
}

async function clientTasks(userId: string): Promise<PendingTask[]> {
  const tasks: PendingTask[] = [];

  const [company, overdue, unread, newApplications, draftJobs] = await Promise.all([
    prisma.company.findUnique({
      where: { userId },
      select: { description: true, location: true, website: true, industryId: true, logoKey: true },
    }),
    overdueInvoiceCount("CLIENT", userId),
    unreadConversations(userId),
    prisma.application.count({ where: { job: { company: { userId } }, status: "NEW" } }),
    prisma.job.count({ where: { company: { userId }, status: "DRAFT" } }),
  ]);

  if (company) {
    const { score, missing } = computeCompanyCompleteness({
      description: company.description,
      location: company.location,
      website: company.website,
      hasIndustry: !!company.industryId,
      hasLogo: !!company.logoKey,
    });
    if (score < 100)
      tasks.push(
        companyCompletenessTask(
          score,
          missing.map((m) => m.label),
        ),
      );
  }

  const collabs = await prisma.collaboration.findMany({
    where: { company: { userId }, status: { in: ["PROPOSED", "ACTIVE"] }, disputedAt: null },
    select: {
      id: true,
      status: true,
      job: { select: { title: true } },
      freelancer: { select: { user: { select: { name: true } } } },
      performances: { where: { status: "SUBMITTED" }, select: { id: true }, take: 5 },
      invoices: {
        where: { lifecycleStatus: "SUBMITTED", counterpartyUserId: userId },
        select: { id: true },
        take: 5,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX,
  });
  for (const c of collabs) {
    const name = c.freelancer.user.name ?? "ZZP'er";
    if (c.status === "PROPOSED") {
      tasks.push(contractSignTask(c.id, c.job.title, name));
      continue;
    }
    for (const p of c.performances)
      tasks.push(performanceApproveTask(p.id, c.id, c.job.title, name));
    for (const inv of c.invoices) tasks.push(invoiceApproveTask(inv.id, c.id, c.job.title));
  }

  for (const conversationId of unread)
    tasks.push(messageReplyTask(conversationId, "Nieuw bericht"));
  if (overdue > 0) tasks.push(overdueInvoiceTask(overdue, "CLIENT"));
  if (newApplications > 0) tasks.push(applicationsReviewTask(newApplications));
  if (draftJobs > 0) tasks.push(draftJobsTask(draftJobs));
  return tasks;
}

async function adminTasks(): Promise<PendingTask[]> {
  const tasks: PendingTask[] = [];
  const [creds, pendingUsers, disputes, deletions] = await Promise.all([
    prisma.credential.findMany({
      where: { status: "SUBMITTED" },
      select: { id: true, title: true },
      take: MAX,
    }),
    prisma.user.findMany({
      where: { status: "PENDING" },
      select: { id: true, name: true },
      take: MAX,
    }),
    prisma.collaboration.findMany({
      where: { disputedAt: { not: null } },
      select: { id: true, job: { select: { title: true } } },
      take: MAX,
    }),
    prisma.user.findMany({
      where: { deletionRequestedAt: { not: null }, anonymizedAt: null, role: { not: "ADMIN" } },
      select: { id: true, name: true },
      take: MAX,
    }),
  ]);
  for (const c of creds) tasks.push(adminVerifyCredentialTask(c.id, c.title));
  for (const u of pendingUsers) tasks.push(adminActivateUserTask(u.id, u.name ?? "Gebruiker"));
  for (const d of disputes) tasks.push(adminResolveDisputeTask(d.id, d.job.title));
  for (const u of deletions) tasks.push(adminDeletionRequestTask(u.id, u.name ?? "Gebruiker"));
  return tasks;
}
