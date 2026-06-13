// Flexpool slice 2 — "eerst eigen mensen": bij het publiceren van een opdracht krijgen de
// poule-leden (favoriete ZZP'ers) van de opdrachtgever als eerste een uitnodiging. Pure
// planner — de runner verzorgt DB-toegang en idempotentie. Geen geldstroom, geen sortering
// (de aanroeper levert al een deterministische volgorde via `sortFavorites` uit favorites.ts).

import { type Availability } from "@/lib/enums";

export interface PoolMember {
  userId: string; // User.id van de ZZP'er (ontvanger van de notificatie)
  freelancerProfileId: string; // FreelancerProfile.id
  availability: Availability; // scalair profielveld
  visibility: string; // "PUBLIC" | "PRIVATE"
  userStatus: string; // "ACTIVE" | "SUSPENDED" | ...
  tenantId: string | null; // gedenormaliseerde tenant van het profiel
  hasApplied: boolean; // heeft deze ZZP'er al op DEZE opdracht gereageerd?
}

export interface PoolRouteJob {
  id: string;
  title: string;
  companyName: string; // naam van de opdrachtgever, voor de notificatietekst
  tenantId: string | null; // tenant van de opdracht
  openOverflow: boolean; // is de dienst opengesteld voor andere tenants?
}

export interface PoolInvite {
  userId: string;
  freelancerProfileId: string;
  dedupeKey: string; // `pool-invite:${job.id}:${userId}`
  notificationType: "POOL_INVITE";
  title: string;
  body: string;
  link: string; // `/opdrachten/${job.id}`
}

/**
 * Berekent welke poule-leden een uitnodiging krijgen voor een zojuist gepubliceerde opdracht.
 * Vijf overslaan-regels (zie inline-commentaar); de volgorde van de invoer blijft behouden.
 * Idempotentie-dedup via dedupeKey regelt de runner.
 */
export function planPoolInvites(job: PoolRouteJob, members: readonly PoolMember[]): PoolInvite[] {
  const invites: PoolInvite[] = [];

  for (const member of members) {
    // 1. Geschorst of geanonimiseerd account mag nooit gepingd worden.
    if (member.userStatus !== "ACTIVE") continue;

    // 2. Een ZZP'er op privé staat wil niet automatisch benaderd worden —
    //    consistent met `discoverableFreelancerWhere` in de zoekquery's.
    if (member.visibility !== "PUBLIC") continue;

    // 3. Expliciet niet beschikbaar → geen uitnodiging.
    //    LIMITED / UNKNOWN / AVAILABLE mogen wél een uitnodiging ontvangen.
    if (member.availability === "UNAVAILABLE") continue;

    // 4. Al gereageerd op deze opdracht → geen dubbele uitnodiging nodig.
    if (member.hasApplied) continue;

    // 5. Tenant-zichtbaarheid: alleen uitnodigen als de dienst opengezet is (overflow)
    //    of de ZZP'er bij dezelfde tenant hoort als de opdracht.
    //    Spiegelt `freelancerCanSeeJob` in job-alerts.ts.
    if (!job.openOverflow && (member.tenantId ?? null) !== job.tenantId) continue;

    invites.push({
      userId: member.userId,
      freelancerProfileId: member.freelancerProfileId,
      dedupeKey: `pool-invite:${job.id}:${member.userId}`,
      notificationType: "POOL_INVITE",
      title: `Uit je Flexpool: ${job.companyName}`,
      body: `${job.companyName} plaatste een nieuwe dienst: "${job.title}". Je staat in hun Flexpool — je krijgt als eerste de kans om te reageren.`,
      link: `/opdrachten/${job.id}`,
    });
  }

  return invites;
}
