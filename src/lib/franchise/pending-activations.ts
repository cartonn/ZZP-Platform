// Aanmeldingen van bureaus die op activatie wachten. Eigen module (niet in signals.ts/pending-tasks.ts)
// zodat de admin-pagina de telling direct kan tonen; de koppeling aan de next-action-engine volgt later.

import { prisma } from "@/lib/db";

export interface PendingActivation {
  id: string;
  name: string;
  kvkNumber: string | null;
  region: string | null;
  contactPhone: string | null;
  createdAt: Date;
  contactName: string | null;
  contactEmail: string;
}

/** Aantal bemiddelingen met status PENDING. Server-side waarheid voor "Volgende acties". */
export async function countPendingActivations(): Promise<number> {
  return prisma.tenant.count({ where: { status: "PENDING" } });
}

/** Wachtrij (oudste eerst — first in, first out, zoals de verificatiequeue). */
export async function listPendingActivations(): Promise<PendingActivation[]> {
  // unbounded-allow: admin-wachtrij van PENDING-tenants; bewust geen take — de beheerder moet elke
  // wachtende aanmelding zien (een cap zou er stilletjes overslaan) en de status is per definitie
  // tijdelijk, dus de rij blijft klein (elke activatie/afwijzing haalt 'm eruit).
  const rows = await prisma.tenant.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      kvkNumber: true,
      region: true,
      contactPhone: true,
      createdAt: true,
      owner: { select: { name: true, email: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    kvkNumber: t.kvkNumber,
    region: t.region,
    contactPhone: t.contactPhone,
    createdAt: t.createdAt,
    contactName: t.owner.name,
    contactEmail: t.owner.email,
  }));
}
