import { prisma } from "@/lib/db";
import { type UserRole } from "@/lib/enums";

/**
 * Live, geanonimiseerd activiteitssignaal voor het dashboard. Uitsluitend echte, server-side
 * getelde aggregaten — nooit namen of verzonnen cijfers. Geeft de gebruiker een gevoel van
 * platform-liquiditeit: een ZZP'er ziet de hoeveelheid werk, een opdrachtgever het aanbod.
 */
export interface ActivitySignal {
  openJobs: number;
  newJobsLast30d: number;
  availableFreelancers: number;
  verifiedFreelancers: number;
}

export async function getActivitySignal(): Promise<ActivitySignal> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [openJobs, newJobsLast30d, availableFreelancers, verifiedFreelancers] = await Promise.all([
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.job.count({ where: { status: "PUBLISHED", publishedAt: { gte: since } } }),
    prisma.freelancerProfile.count({ where: { availability: "AVAILABLE" } }),
    prisma.freelancerProfile.count({ where: { credentials: { some: { status: "VERIFIED" } } } }),
  ]);
  return { openJobs, newJobsLast30d, availableFreelancers, verifiedFreelancers };
}

export interface ActivityItem {
  value: number;
  /** NL-label achter het getal. */
  label: string;
}

/**
 * Kiest de voor de rol relevante signalen en laat nul-waarden weg (geen "0 open opdrachten" —
 * dat is een leeg-signaal, niet een live-signaal). Een ZZP'er ziet de hoeveelheid werk; een
 * opdrachtgever ziet het beschikbare aanbod. Pure functie → unit-testbaar zonder database.
 */
export function activityItems(signal: ActivitySignal, role: UserRole): ActivityItem[] {
  const items: ActivityItem[] =
    role === "CLIENT"
      ? [
          { value: signal.availableFreelancers, label: "ZZP'ers beschikbaar" },
          { value: signal.verifiedFreelancers, label: "geverifieerd" },
        ]
      : // FREELANCER (en andere rollen die opdrachten zoeken): toon de hoeveelheid werk.
        [
          { value: signal.openJobs, label: "open opdrachten" },
          { value: signal.newJobsLast30d, label: "nieuw deze maand" },
        ];
  return items.filter((i) => i.value > 0);
}
