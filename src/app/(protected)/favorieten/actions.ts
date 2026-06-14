"use server";

import { revalidatePath } from "next/cache";
import { requireRole, type Actor } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { favoriteNoteSchema } from "@/lib/favorites";

/**
 * Laadt het bedrijf van de actor (ownership-anker) plus het doel-ZZP-profiel. Werpt als een van
 * beide ontbreekt, zodat een opdrachtgever zonder bedrijf of een onbestaand profiel nooit een
 * favoriet kan schrijven.
 */
async function loadCompanyAndProfile(actor: Actor, freelancerProfileId: string) {
  const [company, profile] = await Promise.all([
    prisma.company.findUnique({ where: { userId: actor.id }, select: { id: true } }),
    prisma.freelancerProfile.findUnique({
      where: { id: freelancerProfileId },
      select: { id: true },
    }),
  ]);
  if (!company) throw new Error("Geen bedrijfsprofiel gevonden.");
  if (!profile) throw new Error("ZZP'er niet gevonden.");
  return { companyId: company.id, freelancerProfileId: profile.id };
}

function revalidate(freelancerProfileId: string) {
  revalidatePath("/favorieten");
  revalidatePath(`/zzp/${freelancerProfileId}`);
}

export async function addFavorite(freelancerProfileId: string): Promise<void> {
  const actor = await requireRole("CLIENT");
  const { companyId } = await loadCompanyAndProfile(actor, freelancerProfileId);

  // Idempotent: bestaat de favoriet al, dan geen tweede rij en geen tweede auditregel.
  const existing = await prisma.favoriteFreelancer.findUnique({
    where: { companyId_freelancerProfileId: { companyId, freelancerProfileId } },
    select: { id: true },
  });
  if (existing) {
    revalidate(freelancerProfileId);
    return;
  }

  await prisma.favoriteFreelancer.create({ data: { companyId, freelancerProfileId } });
  await audit({
    actorId: actor.id,
    action: "FAVORITE_ADDED",
    entityType: "FreelancerProfile",
    entityId: freelancerProfileId,
  });
  revalidate(freelancerProfileId);
}

export async function removeFavorite(freelancerProfileId: string): Promise<void> {
  const actor = await requireRole("CLIENT");
  const { companyId } = await loadCompanyAndProfile(actor, freelancerProfileId);

  const { count } = await prisma.favoriteFreelancer.deleteMany({
    where: { companyId, freelancerProfileId },
  });
  if (count > 0) {
    await audit({
      actorId: actor.id,
      action: "FAVORITE_REMOVED",
      entityType: "FreelancerProfile",
      entityId: freelancerProfileId,
    });
  }
  revalidate(freelancerProfileId);
}

export type FavoriteNoteState = { success?: string; error?: string } | undefined;

export async function saveFavoriteNote(
  freelancerProfileId: string,
  _prev: FavoriteNoteState,
  formData: FormData,
): Promise<FavoriteNoteState> {
  const actor = await requireRole("CLIENT");
  const { companyId } = await loadCompanyAndProfile(actor, freelancerProfileId);

  const parsed = favoriteNoteSchema.safeParse(String(formData.get("note") ?? ""));
  if (!parsed.success) {
    return { error: "Notitie is te lang (max. 500 tekens)." };
  }
  const note = parsed.data || null;

  const { count } = await prisma.favoriteFreelancer.updateMany({
    where: { companyId, freelancerProfileId },
    data: { note },
  });
  if (count === 0) {
    return { error: "Deze ZZP'er staat niet in je poule." };
  }

  await audit({
    actorId: actor.id,
    action: "FAVORITE_NOTE_SAVED",
    entityType: "FreelancerProfile",
    entityId: freelancerProfileId,
  });
  revalidatePath("/favorieten");
  return { success: "Notitie opgeslagen." };
}
