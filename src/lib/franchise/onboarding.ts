// Eén bron van waarheid voor de staat van een opdrachtgever-onboarding: de live samenvatting in de
// wizard én de "onboarding afmaken"-balk op de cockpit lezen dezelfde server-berekende telling, dus
// geen drift. Tenant-scoped: een franchiser ziet alleen zijn eigen opdrachtgevers.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { ownsViaTenant } from "@/lib/tenancy";

export interface OnboardingDepartment {
  id: string;
  name: string;
  location: string | null;
  dienstenCount: number;
}

export interface OnboardingState {
  companyId: string;
  companyName: string;
  contactName: string;
  email: string;
  location: string | null;
  departments: OnboardingDepartment[];
  dienstenCount: number;
  /** Onboarding is "compleet genoeg" zodra er minstens één afdeling én één dienst is. */
  isComplete: boolean;
}

/**
 * Momentopname van een opdrachtgever-onboarding voor de eigen franchise. Geeft `null` als de
 * opdrachtgever niet bestaat of buiten de tenant van de actor valt (geen lek tussen franchises).
 */
export async function getOnboardingState(
  actor: Actor,
  companyId: string,
): Promise<OnboardingState | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      location: true,
      tenantId: true,
      user: { select: { name: true, email: true } },
      departments: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, location: true, _count: { select: { jobs: true } } },
      },
    },
  });
  if (!company || !ownsViaTenant(actor, company.tenantId)) return null;

  const departments: OnboardingDepartment[] = company.departments.map((d) => ({
    id: d.id,
    name: d.name,
    location: d.location,
    dienstenCount: d._count.jobs,
  }));
  const dienstenCount = departments.reduce((sum, d) => sum + d.dienstenCount, 0);

  return {
    companyId: company.id,
    companyName: company.name,
    contactName: company.user.name,
    email: company.user.email,
    location: company.location,
    departments,
    dienstenCount,
    isComplete: departments.length > 0 && dienstenCount > 0,
  };
}
