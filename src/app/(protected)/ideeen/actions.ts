"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuthorizationError, requireActor, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ideaStatusSchema, type IdeaStatus } from "@/lib/enums";
import { canIdeaTransition } from "@/lib/ideas";

export type IdeaFormState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

const ideaSchema = z.object({
  title: z.string().trim().min(4, "Geef een korte, duidelijke titel.").max(140),
  description: z.string().trim().min(10, "Beschrijf je idee in iets meer detail.").max(4000),
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
      votes: { create: { userId: actor.id } },
    },
  });
  await audit({
    actorId: actor.id,
    action: "IDEA_CREATED",
    entityType: "Idea",
    entityId: idea.id,
    metadata: { title: parsed.data.title },
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

/** Alleen een beheerder bepaalt de status van een idee, via de expliciete overgangsmap. */
export async function setIdeaStatus(ideaId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");
  const parsed = ideaStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;
  const next = parsed.data;

  const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { status: true } });
  if (!idea) return; // verwijderd of onbekend id — nette no-op, geen P2025
  const current = idea.status as IdeaStatus;
  if (current === next || !canIdeaTransition(current, next)) return; // ongeldige sprong → no-op

  await prisma.idea.update({ where: { id: ideaId }, data: { status: next } });
  await audit({
    actorId: actor.id,
    action: "IDEA_STATUS_SET",
    entityType: "Idea",
    entityId: ideaId,
    metadata: { from: current, to: next },
  });
  revalidatePath("/ideeen");
}
