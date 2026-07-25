"use server";

import { revalidatePath } from "next/cache";
import { requireRole, type Actor } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { favoriteNoteSchema } from "@/lib/favorites";
import { discoverableFreelancerWhere } from "@/lib/freelancer-visibility";
import { visibleFreelancersWhere } from "@/lib/tenancy";

/**
 * Laadt het bedrijf van de actor (ownership-anker) plus het doel-ZZP-profiel.
 *
 * `requireVisible` (default) dwingt bij het TOEVOEGEN van een favoriet exact dezelfde
 * zichtbaarheids-/tenant-grens af als elk ander opdrachtgever-gericht vind-oppervlak
 * (`discoverableFreelancerWhere` + `visibleFreelancersWhere` — spiegelt `startConversationWith-
 * Freelancer` en `inviteFreelancerToJob`): een PRIVATE profiel of een ZZP'er uit een andere
 * franchise-tenant is server-side onvindbaar → dezelfde "ZZP'er niet gevonden." als een onbestaand
 * id (anti-oracle CWE-203). Zonder deze poort kon een opdrachtgever via een gegokt id een
 * niet-zichtbaar/cross-tenant profiel favorieten en zo zijn naam, tarief, locatie en beschikbaarheid
 * op /favorieten inzien — de privacy-opt-out en tenant-isolatie die overal elders geldt, omzeild
 * (CLAUDE.md regel 1 & 2). Voor VERWIJDEREN/notitie op een reeds-eigen favoriet staat `requireVisible`
 * uit: dat verleent geen nieuwe toegang (companyId-gescoopt) en mag nooit vastlopen als het profiel
 * later privé/geschorst raakt (opruimen moet altijd kunnen).
 */
async function loadCompanyAndProfile(
  actor: Actor,
  freelancerProfileId: string,
  requireVisible = true,
) {
  const [company, profile] = await Promise.all([
    prisma.company.findUnique({ where: { userId: actor.id }, select: { id: true } }),
    prisma.freelancerProfile.findFirst({
      where: {
        id: freelancerProfileId,
        ...(requireVisible ? discoverableFreelancerWhere : {}),
        ...(requireVisible ? visibleFreelancersWhere(actor) : {}),
      },
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
  const { companyId } = await loadCompanyAndProfile(actor, freelancerProfileId, false);

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
  const { companyId } = await loadCompanyAndProfile(actor, freelancerProfileId, false);

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
