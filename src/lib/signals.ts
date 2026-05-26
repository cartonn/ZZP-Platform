// Nav-signalen: per rol berekent de server welke navigatie-items nú actie vragen.
// "Meedenken" zit hier: de gebruiker ziet vanaf elke pagina wat openstaat, zonder
// dat-ie het dashboard hoeft te openen. Server-side is de waarheid (deterministisch,
// zelfde drempels als het dashboard). De UI toont alleen wat hier wordt geteld.

import { prisma } from "@/lib/db";
import { type UserRole } from "@/lib/enums";

export type BadgeTone = "attention" | "info";

export interface NavBadge {
  count: number;
  /** attention = vraagt actie (opvallend), info = neutrale telling (rustig). */
  tone: BadgeTone;
}

/** Badges per nav-href. Alleen items met openstaande actie staan erin. */
export type NavBadges = Record<string, NavBadge>;

/** Ruwe tellingen die de server ophaalt; key bepaalt href + toon. */
interface SignalCounts {
  credentialAlerts?: number; // FREELANCER: afgewezen + verloopt binnenkort
  newApplications?: number; // CLIENT: nieuwe reacties
  draftJobs?: number; // CLIENT: concept-opdrachten
  pendingVerifications?: number; // ADMIN: wacht op verificatie
  unreadMessages?: number; // FREELANCER + CLIENT: gesprekken met ongelezen berichten
  overdueInvoices?: number; // FREELANCER + CLIENT: facturen over de vervaldatum
}

const SIGNAL_HREF: Record<keyof SignalCounts, string> = {
  credentialAlerts: "/certificaten",
  newApplications: "/kandidaten",
  draftJobs: "/opdrachten",
  pendingVerifications: "/admin/verificaties",
  unreadMessages: "/berichten",
  overdueInvoices: "/facturen",
};

const SIGNAL_TONE: Record<keyof SignalCounts, BadgeTone> = {
  credentialAlerts: "attention",
  newApplications: "attention",
  draftJobs: "info",
  pendingVerifications: "attention",
  unreadMessages: "info",
  overdueInvoices: "attention",
};

const EXPIRY_WINDOW_MS = 30 * 86_400_000; // 30 dagen, gelijk aan het dashboard

/** Pure mapping van ruwe tellingen → badges (filtert 0 weg). Testbaar zonder DB. */
export function buildBadges(counts: SignalCounts): NavBadges {
  const out: NavBadges = {};
  for (const key of Object.keys(counts) as (keyof SignalCounts)[]) {
    const count = counts[key] ?? 0;
    if (count > 0) out[SIGNAL_HREF[key]] = { count, tone: SIGNAL_TONE[key] };
  }
  return out;
}

interface ParticipantRead {
  conversationId: string;
  lastReadAt: Date | null;
}

/**
 * Aantal gesprekken met een ongelezen bericht van de andere partij. Pure functie:
 * `latestForeign` geeft per gesprek de tijd van het laatste bericht van iemand anders.
 */
export function countUnreadConversations(
  participants: readonly ParticipantRead[],
  latestForeign: ReadonlyMap<string, Date | null>,
): number {
  let unread = 0;
  for (const p of participants) {
    const at = latestForeign.get(p.conversationId);
    if (!at) continue;
    if (!p.lastReadAt || at.getTime() > p.lastReadAt.getTime()) unread++;
  }
  return unread;
}

/**
 * Facturen die actie vragen: expliciet OVERDUE óf verzonden en over de vervaldatum.
 * Vanuit de ZZP'er (herinneren) of de opdrachtgever (betalen). Eén indexed count.
 */
export async function overdueInvoiceCount(role: UserRole, userId: string): Promise<number> {
  if (role === "ADMIN") return 0;
  const party = role === "FREELANCER" ? { freelancer: { userId } } : { company: { userId } };
  return prisma.invoice.count({
    where: {
      collaboration: party,
      OR: [{ status: "OVERDUE" }, { status: "SENT", dueAt: { lt: new Date() } }],
    },
  });
}

/** Twee begrensde queries (geen N+1): deelnemerschap + laatste vreemde bericht per gesprek. */
async function unreadConversationCount(userId: string): Promise<number> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (participants.length === 0) return 0;

  const grouped = await prisma.message.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: participants.map((p) => p.conversationId) }, senderId: { not: userId } },
    _max: { createdAt: true },
  });
  const latestForeign = new Map<string, Date | null>(grouped.map((g) => [g.conversationId, g._max.createdAt]));
  return countUnreadConversations(participants, latestForeign);
}

export async function navBadges(role: UserRole, userId: string): Promise<NavBadges> {
  if (role === "FREELANCER") {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) return {};
    const now = new Date();
    const soon = new Date(now.getTime() + EXPIRY_WINDOW_MS);
    const [rejected, expiring, unreadMessages, overdueInvoices] = await Promise.all([
      prisma.credential.count({ where: { freelancerProfileId: profile.id, status: "REJECTED" } }),
      prisma.credential.count({
        where: { freelancerProfileId: profile.id, status: "VERIFIED", expiresAt: { gt: now, lte: soon } },
      }),
      unreadConversationCount(userId),
      overdueInvoiceCount("FREELANCER", userId),
    ]);
    return buildBadges({ credentialAlerts: rejected + expiring, unreadMessages, overdueInvoices });
  }

  if (role === "CLIENT") {
    const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
    if (!company) return {};
    const [newApplications, draftJobs, unreadMessages, overdueInvoices] = await Promise.all([
      prisma.application.count({ where: { job: { companyId: company.id }, status: "NEW" } }),
      prisma.job.count({ where: { companyId: company.id, status: "DRAFT" } }),
      unreadConversationCount(userId),
      overdueInvoiceCount("CLIENT", userId),
    ]);
    return buildBadges({ newApplications, draftJobs, unreadMessages, overdueInvoices });
  }

  const pendingVerifications = await prisma.credential.count({ where: { status: "SUBMITTED" } });
  return buildBadges({ pendingVerifications });
}
