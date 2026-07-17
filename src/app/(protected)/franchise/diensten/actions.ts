"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertSameTenant } from "@/lib/tenancy";
import { assertJobTransition, JobTransitionError } from "@/lib/jobs";
import { type JobStatus, jobStatusSchema } from "@/lib/enums";
import { candidateEngageability, PROPOSAL_ACTION } from "@/lib/franchise/dienst-voordracht";
import { z } from "zod";

/**
 * Statusovergang van een tenant-dienst dóór de franchiser die hem uitzette. Voorheen kon alleen de
 * onboarded opdrachtgever (company-owner) of een ADMIN een dienst sluiten/heropenen — de franchiser
 * die de dienst publiceerde kon hem nergens meer terugtrekken (doodlopende live dienst). Tenant-scoped
 * (assertSameTenant), via de expliciete overgangsmap (assertJobTransition), geaudit.
 */
export async function setDienstStatus(jobId: string, target: string): Promise<void> {
  const actor = await requireRole("FRANCHISER");
  // safeParse (geen throwing .parse): een geknutselde POST met een `target` buiten de enum mag geen
  // ongevangen ZodError → generieke 500 opleveren, maar een nette afwijzing (DOEL 2 robuustheid,
  // consistent met leads/zzpers die formulierinvoer ook zo afhandelen). Server-side waarheid.
  const parsedTarget = jobStatusSchema.safeParse(target);
  if (!parsedTarget.success) throw new Error("Ongeldige doelstatus.");
  const targetStatus = parsedTarget.data;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { tenantId: true, status: true, publishedAt: true },
  });
  if (!job) throw new Error("Dienst niet gevonden.");
  assertSameTenant(actor, job.tenantId);

  const from = job.status as JobStatus;
  try {
    assertJobTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof JobTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: targetStatus,
      publishedAt: targetStatus === "PUBLISHED" && !job.publishedAt ? new Date() : job.publishedAt,
    },
  });
  await audit({
    actorId: actor.id,
    action: "FRANCHISE_DIENST_STATUS_SET",
    entityType: "Job",
    entityId: jobId,
    metadata: { from, to: targetStatus },
  });
  revalidatePath(`/franchise/diensten/${jobId}`);
  revalidatePath("/franchise/diensten");
}

const proposeSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
});

export type ProposeState = { ok: true; already: boolean } | { error: string } | undefined;

/**
 * De bemiddelaar draagt een eigen roster-ZZP'er voor op een open dienst binnen de eigen tenant.
 * Dit plaatst GEEN reactie namens de ZZP'er (die behoudt de regie): het maakt een gezaghebbend
 * voordracht-auditrecord + een notificatie die de ZZP'er vraagt zelf te reageren. Keten: auth → rol
 * (FRANCHISER) → ownership (dienst binnen eigen tenant + ZZP'er in eigen roster) → Zod → inzetbaarheid
 * (INACTIEF geweigerd) → idempotentie (dubbel voordragen = no-op) → actie + audit + notificatie.
 */
export async function proposeFreelancer(
  _prev: ProposeState,
  formData: FormData,
): Promise<ProposeState> {
  const actor = await requireRole("FRANCHISER");
  const tenantId = actor.tenantId;
  if (!tenantId) return { error: "Geen bemiddeling gekoppeld." };

  const parsed = proposeSchema.safeParse({
    jobId: formData.get("jobId"),
    freelancerId: formData.get("freelancerId"),
  });
  if (!parsed.success) return { error: "Ongeldige voordracht." };
  const { jobId, freelancerId } = parsed.data;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, status: true, tenantId: true },
  });
  // Tenant-isolatie: alleen een dienst binnen de eigen franchise.
  if (!job || job.tenantId !== tenantId) return { error: "Dienst niet gevonden." };
  if (job.status !== "PUBLISHED") {
    return { error: "Je kunt alleen voordragen op een gepubliceerde dienst." };
  }

  // Ownership: de ZZP'er moet in het eigen roster (tenant) zitten.
  const freelancer = await prisma.freelancerProfile.findFirst({
    where: { id: freelancerId, tenantId },
    select: {
      id: true,
      completeness: true,
      availability: true,
      credentials: { select: { type: true, status: true, expiresAt: true } },
      user: { select: { id: true, identityVerifiedAt: true, lastLoginAt: true } },
    },
  });
  if (!freelancer) return { error: "ZZP'er niet in je roster." };

  // Inzetbaarheid server-side afdwingen: een niet-inzetbare ZZP'er kan niet worden voorgedragen.
  const eng = candidateEngageability(freelancer);
  if (eng.status === "INACTIEF") {
    return { error: `Nog niet inzetbaar: ${eng.blockers[0] ?? "verplicht document ontbreekt"}.` };
  }

  // Idempotentie: een tweede voordracht voor dezelfde dienst is een no-op (geen dubbele notificatie).
  const already = await prisma.auditLog.findFirst({
    where: {
      action: PROPOSAL_ACTION,
      entityType: "Job",
      entityId: jobId,
      metadata: { contains: `"freelancerId":"${freelancerId}"` },
    },
    select: { id: true },
  });
  if (already) {
    revalidatePath(`/franchise/diensten/${jobId}`);
    return { ok: true, already: true };
  }

  await audit({
    actorId: actor.id,
    action: PROPOSAL_ACTION,
    entityType: "Job",
    entityId: jobId,
    metadata: { freelancerId, tenantId },
  });

  // Notificatie naar de ZZP'er — hij houdt de regie en reageert zelf op de dienst.
  await prisma.notification.create({
    data: {
      userId: freelancer.user.id,
      type: "JOB_PROPOSAL",
      title: "Je bemiddelaar draagt je voor",
      body: `Je bemiddelaar draagt je voor de dienst "${job.title}" voor — reageer nu.`,
      link: `/opdrachten/${jobId}`,
    },
  });

  revalidatePath(`/franchise/diensten/${jobId}`);
  return { ok: true, already: false };
}
