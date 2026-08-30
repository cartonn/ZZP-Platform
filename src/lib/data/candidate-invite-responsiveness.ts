import "server-only";
import { prisma } from "@/lib/db";
import {
  summarizeCandidateInviteResponsiveness,
  type CandidateInviteResponsiveness,
  type InviteResponse,
} from "@/lib/candidate-invite-responsiveness";
import { JOB_INVITED_AUDIT_ACTION } from "@/lib/job-invite";

// Alleen recente uitnodigingen wegen mee: een reactiesnelheid van jaren terug zegt weinig over nu,
// en het begrenst de query temporeel.
const LOOKBACK_DAYS = 365;
// Ruime cap op het aantal opgehaalde JOB_INVITED-auditrecords. De lijst voorgestelde ZZP'ers is
// klein (≤ 4, `suggestedFreelancersForJob`), dus dit is ruim voldoende en begrenst de query.
const MAX_INVITE_LOGS = 400;

/**
 * Berekent per ZZP'er het positieve reactiesnelheid-signaal op uitnodigingen, voor een (kleine) set
 * voorgestelde ZZP'ers op een opdracht. Drie begrensde queries: (1) de gezaghebbende `JOB_INVITED`-
 * auditrecords voor exact deze ZZP'ers binnen het terugkijkvenster, (2) welke van die uitgenodigde
 * opdrachten van de *kijkende* opdrachtgever (`companyId`) zijn, (3) hun niet-ingetrokken reacties op
 * precies díe opdrachten. Geeft uitsluitend geaggregeerde tellingen terug — geen individuele reactie
 * van een andere ZZP'er lekt naar de opdrachtgever (privacy by design).
 *
 * **Scoping op de kijkende opdrachtgever (`companyId`) is niet optioneel.** De teller/noemer moet
 * uitsluitend uitnodigingen van déze opdrachtgever meetellen. Zonder die filter aggregeerde het
 * signaal álle uitnodigingen die de ZZP'er platform-breed ontving — óók van concurrerende
 * opdrachtgevers en (voor een franchise) van andere tenants — en lekte de badge-tooltip
 * ("reageerde op X van de Y uitnodigingen") die cross-partij/cross-tenant tellingen aan één
 * opdrachtgever. OWASP A01 (Broken Access Control) + AVG art. 5(1)(c) (dataminimalisatie).
 */
export async function getCandidateInviteResponsiveness(
  freelancerIds: string[],
  companyId: string,
  now: Date = new Date(),
): Promise<Map<string, CandidateInviteResponsiveness>> {
  const unique = [...new Set(freelancerIds)];
  if (unique.length === 0 || !companyId) return new Map();

  const cutoff = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const logs = await prisma.auditLog.findMany({
    where: {
      action: JOB_INVITED_AUDIT_ACTION,
      createdAt: { gte: cutoff },
      // Filter op DB-niveau tot enkel de records van déze ZZP'ers; de freelancerId zit in de
      // JSON-metadata (`{"freelancerId":"..."}`). Begrensd door `unique.length` (≤ 4).
      OR: unique.map((id) => ({ metadata: { contains: `"freelancerId":"${id}"` } })),
    },
    select: { entityId: true, metadata: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: MAX_INVITE_LOGS,
  });

  const relevant = new Set(unique);
  const invites: { freelancerId: string; jobId: string; invitedAt: Date }[] = [];
  const jobIds = new Set<string>();
  for (const log of logs) {
    if (!log.metadata || !log.entityId) continue;
    try {
      const meta = JSON.parse(log.metadata) as { freelancerId?: unknown };
      if (typeof meta.freelancerId === "string" && relevant.has(meta.freelancerId)) {
        invites.push({
          freelancerId: meta.freelancerId,
          jobId: log.entityId,
          invitedAt: log.createdAt,
        });
        jobIds.add(log.entityId);
      }
    } catch {
      // Malforme metadata overslaan — nooit de hele berekening laten crashen.
    }
  }
  if (invites.length === 0) return new Map();

  // Scope op de kijkende opdrachtgever: houd enkel de uitnodigingen over op opdrachten van déze
  // `companyId`. Zo tellen uitnodigingen van andere opdrachtgevers/tenants nooit mee in de X/Y die de
  // badge-tooltip toont (geen cross-partij/cross-tenant lek).
  const ownJobs = await prisma.job.findMany({
    where: { id: { in: [...jobIds] }, companyId },
    select: { id: true },
  });
  const ownJobIds = new Set(ownJobs.map((j) => j.id));
  const scopedInvites = invites.filter((inv) => ownJobIds.has(inv.jobId));
  if (scopedInvites.length === 0) return new Map();

  const applications = await prisma.application.findMany({
    where: {
      freelancerId: { in: unique },
      jobId: { in: [...ownJobIds] },
      status: { not: "WITHDRAWN" },
    },
    select: { freelancerId: true, jobId: true, createdAt: true },
  });

  // Vroegste reactie per (freelancerId, jobId): de reactie op de uitnodiging.
  const earliest = new Map<string, Date>();
  for (const a of applications) {
    const key = `${a.freelancerId}::${a.jobId}`;
    const prev = earliest.get(key);
    if (!prev || a.createdAt < prev) earliest.set(key, a.createdAt);
  }

  const byFreelancer = new Map<string, InviteResponse[]>();
  for (const inv of scopedInvites) {
    const respondedAt = earliest.get(`${inv.freelancerId}::${inv.jobId}`) ?? null;
    // Een reactie telt alleen als hij ná de uitnodiging kwam.
    const validResponse = respondedAt && respondedAt >= inv.invitedAt ? respondedAt : null;
    const list = byFreelancer.get(inv.freelancerId) ?? [];
    list.push({ invitedAt: inv.invitedAt, respondedAt: validResponse });
    byFreelancer.set(inv.freelancerId, list);
  }

  const result = new Map<string, CandidateInviteResponsiveness>();
  for (const [freelancerId, responses] of byFreelancer) {
    result.set(freelancerId, summarizeCandidateInviteResponsiveness(responses));
  }
  return result;
}
