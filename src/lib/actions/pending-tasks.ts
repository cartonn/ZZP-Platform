// Actiecentrum — server-enumerator. Haalt per rol de CONCRETE openstaande items op (findMany, niet
// count) en bouwt PendingTask[] via de pure builders in tasks.ts. Hergebruikt dezelfde queries/
// drempels als het dashboard (signals.ts, profile.ts). N+1-veilig: één query per kind met take-limiet.

import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { type Availability } from "@/lib/enums";
import { computeFreelancerCompleteness, computeCompanyCompleteness } from "@/lib/profile";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import { getCompletenessProfile } from "@/lib/data/freelancer-profile";
import { overdueInvoiceCount } from "@/lib/signals";
import { summarizeAvailabilityFreshness } from "@/lib/availability";
import { type AvailabilityWindowType } from "@/lib/enums";
import { NO_SHOW_LIMIT } from "@/lib/no-show";
import { parseLanguages } from "@/lib/parse-languages";
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
  mandatoryDocumentTask,
  adminVerifyCredentialTask,
  adminActivateUserTask,
  adminResolveDisputeTask,
  adminDeletionRequestTask,
  adminJudgeNoShowTask,
  adminSuspendNoShowTask,
  noShowWarningTask,
  overdueInvoiceTask,
  applicationsReviewTask,
  availabilityRefreshTask,
  draftJobsTask,
  franchiseCredentialExpiryTask,
  franchiseLeadFollowupTask,
  type PendingTask,
} from "@/lib/actions/tasks";

/** Harde bovengrens per kind (voorkomt N+1/zware lijsten op /acties); "+N meer" buiten beschouwing. */
const MAX = 50;
const EXPIRY_WINDOW_MS = 30 * 86_400_000;

/** Gesprekken met een onbeantwoord bericht van de andere partij (zelfde logica als signals). */
interface UnreadConversation {
  id: string;
  withWhom: string; // de andere deelnemer (afzender)
  subject: string | null; // de opdracht waar het gesprek over gaat, indien gekoppeld
}

async function unreadConversations(userId: string): Promise<UnreadConversation[]> {
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
  const unreadIds = participants
    .filter((p) => {
      const at = latest.get(p.conversationId);
      return at && (!p.lastReadAt || at.getTime() > p.lastReadAt.getTime());
    })
    .slice(0, MAX)
    .map((p) => p.conversationId);
  if (unreadIds.length === 0) return [];

  // Verrijk met afzender + onderwerp zodat elke berichttaak onderscheidend is
  // (anders tonen meerdere openstaande berichten een identieke rij).
  const convos = await prisma.conversation.findMany({
    where: { id: { in: unreadIds } },
    select: {
      id: true,
      job: { select: { title: true } },
      participants: {
        where: { userId: { not: userId } },
        select: { user: { select: { name: true } } },
      },
    },
  });
  const byId = new Map(convos.map((c) => [c.id, c]));
  return unreadIds.map((id) => {
    const c = byId.get(id);
    return {
      id,
      withWhom: c?.participants[0]?.user.name ?? "Onbekende afzender",
      subject: c?.job?.title ?? null,
    };
  });
}

// Request-gecachet (React.cache): de layout (sidebar-badge) en de pagina (dashboard/acties)
// vragen dezelfde tasks op binnen één render; zo wordt het maar één keer berekend.
const computeTasks = cache(async (userId: string, role: string): Promise<PendingTask[]> => {
  if (role === "FREELANCER") return rankTasks(await freelancerTasks(userId));
  if (role === "CLIENT") return rankTasks(await clientTasks(userId));
  // Bemiddelaar: doorlopende tenant-taken (roster-compliance + lead-opvolging). De fallthrough naar
  // de admin-taken blijft uitgesloten — een FRANCHISER ziet nooit platform-brede admin-items.
  if (role === "FRANCHISER") return rankTasks(await franchiserTasks(userId));
  return rankTasks(await adminTasks());
});

export async function pendingTasks(actor: Actor): Promise<PendingTask[]> {
  return computeTasks(actor.id, actor.role);
}

/** Aantal openstaande taken — exact wat /acties toont, voor de sidebar-badge. */
export async function pendingTaskCount(userId: string, role: string): Promise<number> {
  return (await computeTasks(userId, role)).length;
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

    // Eén query voor álle certificaten: de fix-taken (afgewezen/verloopt) én de verplichte-
    // documentenstatus (VOG/verzekering) worden in-memory afgeleid — zelfde bron als de
    // inzetbaarheidskaart op het dashboard, zodat beide oppervlakken nooit tegenspreken.
    const creds = await prisma.credential.findMany({
      where: { freelancerProfileId: profile.id },
      select: { id: true, title: true, type: true, status: true, expiresAt: true },
      take: MAX,
    });
    for (const c of creds) {
      if (c.status === "REJECTED") tasks.push(credentialFixTask(c.id, c.title, "rejected"));
      else if (
        c.status === "VERIFIED" &&
        c.expiresAt !== null &&
        c.expiresAt > now &&
        c.expiresAt <= soon
      )
        tasks.push(credentialFixTask(c.id, c.title, "expiring"));
    }
    // Ontbrekend/verlopen verplicht document = taak (blokkeert inzetbaarheid). In beoordeling
    // = geen taak: daar is de admin aan zet, niet de ZZP'er.
    const mandatory = mandatoryDocuments(
      creds.map(
        (c): FreelancerCredential => ({
          type: c.type as FreelancerCredential["type"],
          status: c.status as FreelancerCredential["status"],
          expiresAt: c.expiresAt,
        }),
      ),
      now,
    );
    for (const doc of mandatory.items) {
      if (doc.state === "missing" || doc.state === "expired")
        tasks.push(
          mandatoryDocumentTask(
            doc.type,
            CREDENTIAL_TYPE_LABEL[doc.type as CredentialType],
            doc.state,
          ),
        );
    }

    // Beschikbaarheidsagenda verlopen? Alleen zinvol voor een vindbaar (niet-privé) profiel: een
    // privé-profiel krijgt al de profilePrivateTask en is toch niet vindbaar. Alleen bij een volledig
    // verlopen agenda (nooit gedeeld = onboarding, geen nudge hier).
    if (profile.visibility !== "PRIVATE") {
      const windows = await prisma.availabilityWindow.findMany({
        where: { freelancerProfileId: profile.id },
        select: { startDate: true, endDate: true, type: true },
        take: MAX,
      });
      const freshness = summarizeAvailabilityFreshness(
        windows.map((w) => ({ ...w, type: w.type as AvailabilityWindowType })),
        now,
      );
      if (freshness.status === "expired") tasks.push(availabilityRefreshTask());
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

  for (const u of unread) tasks.push(messageReplyTask(u.id, u.withWhom, u.subject));
  if (overdue > 0) tasks.push(overdueInvoiceTask(overdue, "FREELANCER"));

  // No-show-stand (productbesluit 12-6-2026): de ZZP'er ziet ongegronde registraties als
  // waarschuwing — bij de grens volgt uitschrijving (adminbeslissing). Link naar de meest
  // recente registratie zodat de reden + het oordeel direct terug te lezen zijn.
  if (profile) {
    const latestUnjustified = await prisma.noShowReport.findFirst({
      where: { freelancerProfileId: profile.id, verdict: "UNJUSTIFIED" },
      orderBy: { createdAt: "desc" },
      select: { collaborationId: true },
    });
    if (latestUnjustified) {
      const unjustified = await prisma.noShowReport.count({
        where: { freelancerProfileId: profile.id, verdict: "UNJUSTIFIED" },
      });
      tasks.push(
        noShowWarningTask(
          unjustified,
          NO_SHOW_LIMIT,
          `/samenwerkingen/${latestUnjustified.collaborationId}`,
        ),
      );
    }
  }
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

  for (const u of unread) tasks.push(messageReplyTask(u.id, u.withWhom, u.subject));
  if (overdue > 0) tasks.push(overdueInvoiceTask(overdue, "CLIENT"));
  if (newApplications > 0) tasks.push(applicationsReviewTask(newApplications));
  if (draftJobs > 0) tasks.push(draftJobsTask(draftJobs));
  return tasks;
}

async function franchiserTasks(userId: string): Promise<PendingTask[]> {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
  const tenantId = me?.tenantId ?? null;
  if (!tenantId) return [];

  const tasks: PendingTask[] = [];
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRY_WINDOW_MS);

  const [expiringCreds, dueLeads] = await Promise.all([
    // Geverifieerde, nog-geldige certificaten van tenant-ZZP'ers die binnenkort verlopen — zelfde
    // venster als de roster-compliance-zegel op het bemiddelaar-dashboard (gte now, lte soon).
    prisma.credential.findMany({
      where: {
        freelancerProfile: { tenantId },
        status: "VERIFIED",
        expiresAt: { gte: now, lte: soon },
      },
      select: {
        freelancerProfileId: true,
        freelancerProfile: { select: { user: { select: { name: true } } } },
      },
      orderBy: { expiresAt: "asc" },
      take: MAX,
    }),
    // Leads met een verstreken geplande opvolgdatum (alleen lopende acquisitie: KOUD/WARM).
    prisma.lead.count({
      where: {
        tenantId,
        status: { in: ["KOUD", "WARM"] },
        nextFollowUp: { not: null, lte: now },
      },
    }),
  ]);

  // Aggregeer per ZZP'er: één taak per professional met het aantal (bijna-)verlopende certificaten.
  const expiringByProfile = new Map<string, { name: string; count: number }>();
  for (const c of expiringCreds) {
    const entry = expiringByProfile.get(c.freelancerProfileId) ?? {
      name: c.freelancerProfile.user.name ?? "ZZP'er",
      count: 0,
    };
    entry.count += 1;
    expiringByProfile.set(c.freelancerProfileId, entry);
  }
  for (const [profileId, e] of expiringByProfile)
    tasks.push(franchiseCredentialExpiryTask(profileId, e.name, e.count));

  if (dueLeads > 0) tasks.push(franchiseLeadFollowupTask(dueLeads));
  return tasks;
}

async function adminTasks(): Promise<PendingTask[]> {
  const tasks: PendingTask[] = [];
  const [creds, pendingUsers, disputes, deletions, noShowReports, noShowAtLimit] =
    await Promise.all([
      prisma.credential.findMany({
        where: { status: "SUBMITTED" },
        select: {
          id: true,
          title: true,
          freelancerProfile: { select: { user: { select: { name: true } } } },
        },
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
      // No-show-meldingen die op een oordeel wachten (gegrond/ongegrond).
      prisma.noShowReport.findMany({
        where: { verdict: "PENDING" },
        select: {
          id: true,
          freelancer: { select: { user: { select: { name: true } } } },
          collaboration: { select: { job: { select: { title: true } } } },
        },
        orderBy: { createdAt: "asc" },
        take: MAX,
      }),
      // ZZP'ers op/over de grens van ongegronde no-shows → uitschrijf-taak (handmatig besluit).
      prisma.noShowReport.groupBy({
        by: ["freelancerProfileId"],
        where: { verdict: "UNJUSTIFIED" },
        _count: { _all: true },
        having: { freelancerProfileId: { _count: { gte: NO_SHOW_LIMIT } } },
      }),
    ]);
  for (const c of creds)
    tasks.push(
      adminVerifyCredentialTask(c.id, c.title, c.freelancerProfile.user.name ?? "Onbekend"),
    );
  for (const u of pendingUsers) tasks.push(adminActivateUserTask(u.id, u.name ?? "Gebruiker"));
  for (const d of disputes) tasks.push(adminResolveDisputeTask(d.id, d.job.title));
  for (const u of deletions) tasks.push(adminDeletionRequestTask(u.id, u.name ?? "Gebruiker"));
  for (const r of noShowReports)
    tasks.push(
      adminJudgeNoShowTask(r.id, r.freelancer.user.name ?? "ZZP'er", r.collaboration.job.title),
    );
  if (noShowAtLimit.length > 0) {
    // Alleen nog-actieve accounts: een al geschorste ZZP'er heeft geen uitschrijf-taak meer.
    const profiles = await prisma.freelancerProfile.findMany({
      where: {
        id: { in: noShowAtLimit.map((r) => r.freelancerProfileId) },
        user: { status: "ACTIVE" },
      },
      select: { id: true, user: { select: { id: true, name: true } } },
    });
    const countByProfile = new Map(
      noShowAtLimit.map((r) => [r.freelancerProfileId, r._count._all]),
    );
    for (const p of profiles)
      tasks.push(
        adminSuspendNoShowTask(
          p.user.id,
          p.user.name ?? "ZZP'er",
          countByProfile.get(p.id) ?? NO_SHOW_LIMIT,
        ),
      );
  }
  return tasks;
}
