import "server-only";

import { applicationRateLimiter } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canApply } from "@/lib/applications";
import { scoreJobForFreelancer } from "@/lib/matching";
import { estimateTravelMinutesWithRouting } from "@/lib/services/routing";
import { canViewJob } from "@/lib/tenancy";
import { applicationSchema } from "@/lib/validation";
import { type Actor } from "@/lib/authz";

/** Ruwe (ongevalideerde) invoer; de helper parst zelf met `applicationSchema`. */
export type ApplicationRawInput = {
  motivation: unknown;
  proposedRate: unknown;
  availability: unknown;
};

export type CreateApplicationResult =
  | { ok: true; applicationId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Eén bron van waarheid voor het aanmaken van een reactie (Application) op een opdracht.
 * Hergebruikt door zowel het reageer-formulier op de opdrachtdetail (`createApplication`) als
 * de directe claim vanuit de rooster-kalender (`claimShift`). Voert de volledige authz-/
 * validatieketen uit: rate-limit → profiel → opdracht + zichtbaarheid → dubbel-check →
 * plan-gating → Zod → server-berekende matchscore + compliance → create → audit → notificatie.
 *
 * De aanroeper doet eerst `requireRole("FREELANCER")` en handelt daarna revalidate/redirect af;
 * deze helper raakt geen Next-cache (puur de mutatie + het resultaat).
 */
export async function createApplicationForJob(
  actor: Actor,
  jobId: string,
  raw: ApplicationRawInput,
): Promise<CreateApplicationResult> {
  // Reactie-rem: begrens massa-reageren per ZZP'er (spam richting opdrachtgevers).
  if (!(await applicationRateLimiter.check(`apply:${actor.id}`)).allowed) {
    return { ok: false, error: "Te veel reacties kort achter elkaar. Probeer het later opnieuw." };
  }

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    include: {
      skills: true,
      credentials: { select: { type: true, status: true, expiresAt: true } },
      industries: { select: { industryId: true } },
    },
  });
  if (!profile) return { ok: false, error: "Maak eerst je profiel aan." };

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      skills: true,
      credentialRequirements: true,
      company: { select: { userId: true } },
      tenant: { select: { openOverflow: true } },
    },
  });
  if (!job) return { ok: false, error: "Opdracht niet gevonden." };
  if (job.status !== "PUBLISHED")
    return { ok: false, error: "Je kunt alleen op gepubliceerde opdrachten reageren." };
  // Tenant-zichtbaarheid: een tenant-dienst is alleen reageerbaar voor de eigen roster (of als de
  // franchise hem heeft opengesteld via overflow). Niet alleen op de detailpagina afdwingen.
  if (!canViewJob(actor, job))
    return { ok: false, error: "Deze opdracht is niet zichtbaar voor jou." };

  // Een eerder ingetrokken reactie blokkeert niet: de ZZP'er mag opnieuw reageren. De bestaande rij
  // (unieke jobId+freelancerId) wordt dan hergebruikt en heropend i.p.v. een tweede te maken.
  const existing = await prisma.application.findUnique({
    where: { jobId_freelancerId: { jobId, freelancerId: profile.id } },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== "WITHDRAWN") {
    return { ok: false, error: "Je hebt al op deze opdracht gereageerd." };
  }

  // Plan-gating (server-side) alleen bij een echt nieuwe reactie. Het heropenen van een eerder
  // ingetrokken reactie hergebruikt een bestaande rij en verbruikt dus geen extra plan-slot.
  if (!existing) {
    // Zonder abonnement geldt het FREE-plan.
    const [count, subscription, freePlan] = await Promise.all([
      prisma.application.count({ where: { freelancerId: profile.id } }),
      prisma.subscription.findUnique({ where: { userId: actor.id }, include: { plan: true } }),
      prisma.plan.findUnique({ where: { key: "FREE" } }),
    ]);
    // Alleen een ACTIEF abonnement telt; anders geldt het FREE-plan (CLAUDE.md regel 1).
    const activePlanMax =
      subscription?.status === "ACTIVE" ? subscription.plan.maxApplications : undefined;
    const maxApplications = activePlanMax ?? freePlan?.maxApplications ?? 5;
    if (!canApply(maxApplications, count)) {
      return {
        ok: false,
        error: `Je hebt het maximum aantal reacties (${maxApplications}) van je plan bereikt. Upgrade je abonnement voor meer reacties.`,
      };
    }
  }

  const parsed = applicationSchema.safeParse({
    motivation: raw.motivation,
    proposedRate: raw.proposedRate ?? "",
    availability: raw.availability || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { ok: false, error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;

  // Server-berekende matchscore + compliance-snapshot (CLAUDE.md regel 1). Echte routed reistijd
  // (Geoapify) als provider actief is; anders de offline schatting — beide via één seam.
  const routedTravelMinutesToJob =
    profile.maxTravelMinutes != null &&
    profile.maxTravelMinutes > 0 &&
    profile.workMode !== "REMOTE" &&
    job.workMode !== "REMOTE"
      ? await estimateTravelMinutesWithRouting(profile.location, job.location)
      : null;
  const match = scoreJobForFreelancer(job, { ...profile, routedTravelMinutesToJob });

  // Heropen een eerder ingetrokken reactie (zelfde rij) of maak een nieuwe aan. Beide krijgen verse
  // motivatie/tarief + een opnieuw berekende matchscore en compliance-snapshot.
  const application = existing
    ? await prisma.application.update({
        where: { id: existing.id },
        data: {
          status: "NEW",
          motivation: data.motivation,
          proposedRate: data.proposedRate ?? null,
          availability: data.availability ?? null,
          matchScore: match.score,
          complianceSnapshot: JSON.stringify(match.compliance),
        },
      })
    : await prisma.application.create({
        data: {
          jobId,
          freelancerId: profile.id,
          status: "NEW",
          motivation: data.motivation,
          proposedRate: data.proposedRate ?? null,
          availability: data.availability ?? null,
          matchScore: match.score,
          complianceSnapshot: JSON.stringify(match.compliance),
        },
      });

  await audit({
    actorId: actor.id,
    action: "APPLICATION_CREATED",
    entityType: "Application",
    entityId: application.id,
    metadata: { jobId, matchScore: match.score, compliance: match.compliance.status },
  });

  // Meld de nieuwe reactie aan de opdrachtgever.
  await prisma.notification.create({
    data: {
      userId: job.company.userId,
      type: "APPLICATION_RECEIVED",
      title: "Nieuwe reactie",
      body: `Nieuwe reactie op "${job.title}".`,
      link: "/kandidaten",
    },
  });

  return { ok: true, applicationId: application.id };
}
