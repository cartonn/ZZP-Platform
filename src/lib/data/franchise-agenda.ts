import "server-only";
import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { type BrokerAgenda } from "@/lib/franchise/agenda";

// Server-side loader: verzamelt de operationele roster-deadlines van één bemiddelaar (FRANCHISER) en
// mapt ze naar de pure BrokerAgenda-projectie die de .ics-serialisatie voedt. Puur read-only; geen
// mutatie. Alleen de eigen tenant (roster) — nooit data van een andere bemiddeling:
//
// - Plaatsingen: ACTIEVE, niet-betwiste samenwerkingen binnen de tenant (via `job.tenantId`, zoals de
//   franchise-samenwerkingen-cockpit) met een vastgelegde einddatum die nog niet is verstreken.
// - Certificaten: VERIFIED credentials van roster-ZZP'ers (tenant-gescoopt via de freelancer) met een
//   verloopdatum die nog niet is verstreken.
//
// Beide queries zijn tenant-gescoopt en take-begrensd. Een bemiddelaar zónder tenant krijgt een lege
// agenda (fail-closed).

/** Maximaal aantal rijen per categorie — ruim voor een roster-agenda, begrenst de querykosten. */
const AGENDA_LIMIT = 500;

export async function loadBrokerAgenda(
  actor: Actor,
  now: Date = new Date(),
): Promise<BrokerAgenda> {
  const tenantId = actor.tenantId;
  if (!tenantId) return { collaborations: [], credentials: [] };

  const [collabRows, credentialRows] = await Promise.all([
    prisma.collaboration.findMany({
      where: {
        status: "ACTIVE",
        disputedAt: null,
        endDate: { not: null, gte: now },
        job: { tenantId },
      },
      orderBy: { endDate: "asc" },
      take: AGENDA_LIMIT,
      select: {
        id: true,
        endDate: true,
        freelancer: { select: { user: { select: { name: true } } } },
        company: { select: { name: true } },
      },
    }),
    prisma.credential.findMany({
      where: {
        status: "VERIFIED",
        expiresAt: { not: null, gte: now },
        freelancerProfile: { tenantId },
      },
      orderBy: { expiresAt: "asc" },
      take: AGENDA_LIMIT,
      select: {
        id: true,
        title: true,
        expiresAt: true,
        freelancerProfile: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    // endDate/expiresAt zijn door de where-clausules gegarandeerd non-null; de guard maakt dat
    // typebreed expliciet (narrowing) zonder een non-null-assertion.
    collaborations: collabRows.flatMap((c) =>
      c.endDate == null
        ? []
        : [
            {
              id: c.id,
              endDate: c.endDate,
              freelancerName: c.freelancer.user.name ?? "",
              companyName: c.company.name,
            },
          ],
    ),
    credentials: credentialRows.flatMap((c) =>
      c.expiresAt == null
        ? []
        : [
            {
              id: c.id,
              title: c.title,
              freelancerName: c.freelancerProfile.user.name ?? "",
              expiresAt: c.expiresAt,
            },
          ],
    ),
  };
}
