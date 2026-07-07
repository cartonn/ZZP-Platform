"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuthorizationError, requireActor, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  ideaAudienceSchema,
  ideaStatusSchema,
  ideaThemeSchema,
  type IdeaStatus,
} from "@/lib/enums";
import { canIdeaTransition, ideaStatusRequiresReason, IDEA_STATUS_LABEL } from "@/lib/ideas";

export type IdeaFormState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

// Thema is optioneel: een lege keuze betekent "geen specifiek thema" (null).
const optionalThemeSchema = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  ideaThemeSchema.optional(),
);

const ideaSchema = z.object({
  title: z.string().trim().min(4, "Geef een korte, duidelijke titel.").max(140),
  description: z.string().trim().min(10, "Beschrijf je idee in iets meer detail.").max(4000),
  audience: ideaAudienceSchema.default("PLATFORM"),
  theme: optionalThemeSchema,
});

/** Dien een idee in. De indiener stemt er automatisch op (hij staat erachter). */
export async function createIdea(_prev: IdeaFormState, formData: FormData): Promise<IdeaFormState> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = ideaSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    audience: formData.get("audience") ?? undefined,
    theme: formData.get("theme"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }

  const idea = await prisma.idea.create({
    data: {
      authorId: actor.id,
      title: parsed.data.title,
      description: parsed.data.description,
      audience: parsed.data.audience,
      theme: parsed.data.theme ?? null,
      votes: { create: { userId: actor.id } },
    },
  });
  await audit({
    actorId: actor.id,
    action: "IDEA_CREATED",
    entityType: "Idea",
    entityId: idea.id,
    metadata: {
      title: parsed.data.title,
      audience: parsed.data.audience,
      theme: parsed.data.theme ?? null,
    },
  });

  revalidatePath("/ideeen");
  return { ok: true };
}

/** Stem op een idee, of trek je stem in als je al gestemd had (toggle). Eén stem per persoon. */
export async function toggleVote(ideaId: string): Promise<void> {
  const actor = await requireActor();
  // deleteMany is idempotent: had de gebruiker al gestemd, dan is dit een intrekking. Anders voegen
  // we de stem toe (alleen als het idee bestaat), tolerant voor dubbelklik/race op de unique key.
  const removed = await prisma.ideaVote.deleteMany({ where: { ideaId, userId: actor.id } });
  if (removed.count === 0) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { id: true } });
    if (idea) {
      try {
        await prisma.ideaVote.create({ data: { ideaId, userId: actor.id } });
      } catch (e) {
        // Alleen een race op de unieke (ideaId,userId)-sleutel negeren; al het andere doorgooien.
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      }
    }
  }
  revalidatePath("/ideeen");
}

const reasonSchema = z.string().trim().min(4, "Geef een korte reden.").max(500);

/**
 * Alleen een beheerder bepaalt de status van een idee, via de expliciete overgangsmap. Afwijzen
 * vereist een reden (server-side afgedwongen). Bij elke geldige wijziging worden de stemmers en de
 * indiener genotificeerd, zodat de mensen die het idee steunden weten wat ermee gebeurt.
 */
export async function setIdeaStatus(ideaId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const parsed = ideaStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;
  const next = parsed.data;

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { status: true, authorId: true, title: true },
  });
  if (!idea) return; // verwijderd of onbekend id — nette no-op, geen P2025
  const current = idea.status as IdeaStatus;
  if (current === next || !canIdeaTransition(current, next)) return; // ongeldige sprong → no-op

  // Reden alleen vereist (en bewaard) bij afwijzen; bij elke andere overgang wordt hij gewist.
  let declineReason: string | null = null;
  if (ideaStatusRequiresReason(next)) {
    const reason = reasonSchema.safeParse(formData.get("reason"));
    if (!reason.success) return; // geen reden → geen afwijzing (de UI vraagt erom)
    declineReason = reason.data;
  }

  await prisma.idea.update({ where: { id: ideaId }, data: { status: next, declineReason } });
  await audit({
    actorId: actor.id,
    action: "IDEA_STATUS_SET",
    entityType: "Idea",
    entityId: ideaId,
    metadata: { from: current, to: next, ...(declineReason ? { reason: declineReason } : {}) },
  });

  // Notificeer de indiener + iedereen die stemde (zonder dubbelen, en niet de beheerder zelf).
  // unbounded-allow: stemgevers van één idee; server action, geen lijst-view
  const voters = await prisma.ideaVote.findMany({ where: { ideaId }, select: { userId: true } });
  const recipients = new Set<string>([idea.authorId, ...voters.map((v) => v.userId)]);
  recipients.delete(actor.id);
  if (recipients.size > 0) {
    const body =
      next === "DECLINED" && declineReason
        ? `Status: ${IDEA_STATUS_LABEL[next]} — ${declineReason}`
        : `Status: ${IDEA_STATUS_LABEL[next]}`;
    await prisma.notification.createMany({
      data: [...recipients].map((userId) => ({
        userId,
        type: "IDEA_STATUS",
        title: `Idee bijgewerkt: ${idea.title}`,
        body,
        link: "/ideeen",
      })),
    });
  }

  revalidatePath("/ideeen");
}

const commentSchema = z.string().trim().min(2, "Schrijf een korte reactie.").max(2000);

/** Plaats een reactie op een idee. De indiener wordt genotificeerd (tenzij hij zelf reageert). */
export async function addComment(ideaId: string, formData: FormData): Promise<void> {
  const actor = await requireActor();
  const parsed = commentSchema.safeParse(formData.get("body"));
  if (!parsed.success) return;

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { authorId: true, title: true },
  });
  if (!idea) return;

  await prisma.ideaComment.create({
    data: { ideaId, authorId: actor.id, body: parsed.data },
  });
  await audit({
    actorId: actor.id,
    action: "IDEA_COMMENTED",
    entityType: "Idea",
    entityId: ideaId,
  });

  if (idea.authorId !== actor.id) {
    await prisma.notification.create({
      data: {
        userId: idea.authorId,
        type: "IDEA_COMMENT",
        title: `Nieuwe reactie op je idee: ${idea.title}`,
        body: "Iemand heeft op je idee gereageerd.",
        link: "/ideeen",
      },
    });
  }

  revalidatePath("/ideeen");
}

const categorySchema = z.object({
  audience: ideaAudienceSchema,
  theme: optionalThemeSchema,
});

/** Beheerder corrigeert de doelgroep + het thema van een idee. Audit van de wijziging. */
export async function setIdeaCategory(ideaId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const parsed = categorySchema.safeParse({
    audience: formData.get("audience"),
    theme: formData.get("theme"),
  });
  if (!parsed.success) return;

  const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { id: true } });
  if (!idea) return; // verwijderd of onbekend id — nette no-op

  await prisma.idea.update({
    where: { id: ideaId },
    data: { audience: parsed.data.audience, theme: parsed.data.theme ?? null },
  });
  await audit({
    actorId: actor.id,
    action: "IDEA_CATEGORIZED",
    entityType: "Idea",
    entityId: ideaId,
    metadata: { audience: parsed.data.audience, theme: parsed.data.theme ?? null },
  });

  revalidatePath("/ideeen");
}
