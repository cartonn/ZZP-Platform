"use server";

// Reviewqueue-acties voor mail-intake (menselijke controle vóór er iets live gaat):
// overnemen → concept-opdracht via de bestaande opdracht-flow (publiceren blijft daar lopen,
// inclusief plan-gating en DBA-check — geen tweede publicatiepad), afwijzen (reden verplicht,
// server-side afgedwongen) en heropenen. Keten per mutatie: auth → rol → ownership →
// validatie → overgangsmap → actie → audit (CLAUDE.md regel 2 + 3).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { type MailIntakeStatus, workModeSchema } from "@/lib/enums";
import { assertMailIntakeTransition, MailIntakeTransitionError } from "@/lib/mail-intake";
import { type ResolveState } from "@/lib/actions/resolve-state";

const intakeIdSchema = z.string().trim().min(1).max(64);
const dismissReasonSchema = z
  .string()
  .trim()
  .min(3, "Geef een korte reden (min. 3 tekens).")
  .max(500, "Houd de reden onder de 500 tekens.");

/** Aanvraag van de eigen company, of null (onbekend en niet-eigen zijn ononderscheidbaar). */
async function ownIntake(actorId: string, intakeId: string) {
  const company = await prisma.company.findUnique({
    where: { userId: actorId },
    select: { id: true, tenantId: true },
  });
  if (!company) return null;
  const intake = await prisma.mailIntake.findUnique({ where: { id: intakeId } });
  if (!intake || intake.companyId !== company.id) return null;
  return { intake, company };
}

function transitionError(e: unknown): ResolveState {
  if (e instanceof MailIntakeTransitionError) {
    return { error: "Deze aanvraag is al afgehandeld." };
  }
  throw e;
}

/**
 * Neemt een NEW-aanvraag over als concept-opdracht, gevuld met de geparsede velden (met veilige
 * fallbacks binnen de opdracht-validatiegrenzen). De opdracht blijft DRAFT: publiceren gaat via
 * de bestaande flow op de opdracht-detailpagina. Redirect daarheen bij succes.
 */
export async function acceptMailIntakeState(
  _prev: ResolveState,
  formData: FormData,
): Promise<ResolveState> {
  let actor;
  try {
    actor = await requireRole("CLIENT");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsedId = intakeIdSchema.safeParse(formData.get("intakeId"));
  if (!parsedId.success) return { error: "Aanvraag niet gevonden." };
  const found = await ownIntake(actor.id, parsedId.data);
  if (!found) return { error: "Aanvraag niet gevonden." };
  const { intake, company } = found;

  try {
    assertMailIntakeTransition(intake.status as MailIntakeStatus, "ACCEPTED");
  } catch (e) {
    return transitionError(e);
  }

  // Titel/omschrijving binnen de grenzen van de opdracht-validatie (titel 3–160,
  // omschrijving 10–5000); de ruwe mail is de fallback zodat er nooit inhoud verloren gaat.
  const title = (intake.parsedTitle ?? intake.subject).trim().slice(0, 160);
  const safeTitle = title.length >= 3 ? title : "Aanvraag per e-mail";
  const description = (intake.parsedDescription ?? intake.textBody).trim().slice(0, 5000);
  const safeDescription =
    description.length >= 10
      ? description
      : `Per e-mail ontvangen aanvraag.\n\n${description}`.trim();
  const workMode = workModeSchema.safeParse(intake.parsedWorkMode);

  let jobId: string;
  try {
    jobId = await prisma.$transaction(async (tx) => {
      // TOCTOU-grendel: alleen de rij die nog NEW is muteren; een parallelle beslissing
      // verliest en krijgt de nette "al afgehandeld"-fout.
      const claimed = await tx.mailIntake.updateMany({
        where: { id: intake.id, status: "NEW" },
        data: { status: "ACCEPTED", decidedAt: new Date() },
      });
      if (claimed.count === 0) throw new MailIntakeTransitionError("ACCEPTED", "ACCEPTED");

      const job = await tx.job.create({
        data: {
          companyId: company.id,
          // Denormaliseer de tenant zoals saveJob: een franchise-aanvraag blijft binnen de tenant.
          tenantId: company.tenantId,
          status: "DRAFT",
          title: safeTitle,
          description: safeDescription,
          location: intake.parsedLocation,
          rateMin: intake.parsedRateMin,
          rateMax: intake.parsedRateMax,
          startDate: intake.parsedStartDate,
          workMode: workMode.success ? workMode.data : "HYBRID",
        },
      });
      await tx.mailIntake.update({ where: { id: intake.id }, data: { jobId: job.id } });
      await tx.auditLog.createMany({
        data: [
          auditData({
            actorId: actor.id,
            action: "JOB_CREATED",
            entityType: "Job",
            entityId: job.id,
            metadata: { source: "mail-intake", mailIntakeId: intake.id },
          }),
          auditData({
            actorId: actor.id,
            action: "MAIL_INTAKE_ACCEPTED",
            entityType: "MailIntake",
            entityId: intake.id,
            metadata: { jobId: job.id },
          }),
        ],
      });
      return job.id;
    });
  } catch (e) {
    return transitionError(e);
  }

  revalidatePath("/opdrachten/mail-intake");
  revalidatePath("/opdrachten");
  redirect(`/opdrachten/${jobId}`);
}

/** Wijst een NEW-aanvraag af; reden verplicht (server-side afgedwongen). */
export async function dismissMailIntakeState(
  _prev: ResolveState,
  formData: FormData,
): Promise<ResolveState> {
  let actor;
  try {
    actor = await requireRole("CLIENT");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsedId = intakeIdSchema.safeParse(formData.get("intakeId"));
  if (!parsedId.success) return { error: "Aanvraag niet gevonden." };
  const parsedReason = dismissReasonSchema.safeParse(formData.get("reason"));
  if (!parsedReason.success) {
    return { error: parsedReason.error.issues[0]?.message ?? "Reden is verplicht." };
  }

  const found = await ownIntake(actor.id, parsedId.data);
  if (!found) return { error: "Aanvraag niet gevonden." };
  const { intake } = found;

  try {
    assertMailIntakeTransition(intake.status as MailIntakeStatus, "DISMISSED");
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.mailIntake.updateMany({
        where: { id: intake.id, status: "NEW" },
        data: { status: "DISMISSED", dismissReason: parsedReason.data, decidedAt: new Date() },
      });
      if (claimed.count === 0) throw new MailIntakeTransitionError("DISMISSED", "DISMISSED");
      await tx.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "MAIL_INTAKE_DISMISSED",
          entityType: "MailIntake",
          entityId: intake.id,
          metadata: { reason: parsedReason.data },
        }),
      });
    });
  } catch (e) {
    return transitionError(e);
  }

  revalidatePath("/opdrachten/mail-intake");
  return { ok: true };
}

/** Heropent een afgewezen aanvraag (DISMISSED → NEW). */
export async function reopenMailIntakeState(
  _prev: ResolveState,
  formData: FormData,
): Promise<ResolveState> {
  let actor;
  try {
    actor = await requireRole("CLIENT");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsedId = intakeIdSchema.safeParse(formData.get("intakeId"));
  if (!parsedId.success) return { error: "Aanvraag niet gevonden." };
  const found = await ownIntake(actor.id, parsedId.data);
  if (!found) return { error: "Aanvraag niet gevonden." };
  const { intake } = found;

  try {
    assertMailIntakeTransition(intake.status as MailIntakeStatus, "NEW");
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.mailIntake.updateMany({
        where: { id: intake.id, status: "DISMISSED" },
        data: { status: "NEW", dismissReason: null, decidedAt: null },
      });
      if (claimed.count === 0) throw new MailIntakeTransitionError("NEW", "NEW");
      await tx.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "MAIL_INTAKE_REOPENED",
          entityType: "MailIntake",
          entityId: intake.id,
        }),
      });
    });
  } catch (e) {
    return transitionError(e);
  }

  revalidatePath("/opdrachten/mail-intake");
  return { ok: true };
}
