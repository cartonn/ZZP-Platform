"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { normalizeJobFilters } from "@/lib/jobs";
import { hasActiveJobFilters } from "@/lib/jobs/active-filters";
import {
  MAX_SAVED_SEARCHES,
  jobFiltersToQueryString,
  savedSearchNameSchema,
  savedSearchQueryToRawParams,
} from "@/lib/jobs/saved-search";

export type SavedSearchState = { error?: string; ok?: boolean } | undefined;

/**
 * Bewaart de huidige zoekopdracht (filterset) van de ZZP'er.
 *
 * Keten: auth → rol (FREELANCER) → eigen profiel als anker → Zod (naam) → server-side
 * hernormalisatie van de query (server = waarheid; onbekende/ongeldige params vallen weg) →
 * limietcheck → upsert op de canonieke query (dedup/rename) → audit. Een lege filterset wordt
 * geweigerd (er valt niets zinnigs te bewaren).
 */
export async function saveJobSearch(
  _prev: SavedSearchState,
  formData: FormData,
): Promise<SavedSearchState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  if (!profile) return { error: "Geen ZZP'er-profiel gevonden." };

  const parsedName = savedSearchNameSchema.safeParse(formData.get("name") ?? "");
  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message ?? "Geef je zoekopdracht een naam." };
  }
  const name = parsedName.data;

  // Server-side waarheid: normaliseer de meegestuurde query opnieuw en hercanoniseer 'm, zodat de
  // opslag nooit ongeldige of niet-canonieke input bevat.
  const rawQuery = typeof formData.get("query") === "string" ? String(formData.get("query")) : "";
  const filters = normalizeJobFilters(savedSearchQueryToRawParams(rawQuery));
  if (!hasActiveJobFilters(filters)) {
    return { error: "Stel eerst filters in om een zoekopdracht te bewaren." };
  }
  const query = jobFiltersToQueryString(filters);

  // Zachte bovengrens (geen beveiligingsgrens): telt alleen mee wanneer dit een nieuwe query is.
  const existing = await prisma.savedJobSearch.findUnique({
    where: { freelancerProfileId_query: { freelancerProfileId: profile.id, query } },
    select: { id: true },
  });
  if (!existing) {
    const count = await prisma.savedJobSearch.count({
      where: { freelancerProfileId: profile.id },
    });
    if (count >= MAX_SAVED_SEARCHES) {
      return {
        error: `Je kunt maximaal ${MAX_SAVED_SEARCHES} zoekopdrachten bewaren. Verwijder er eerst één.`,
      };
    }
  }

  try {
    await prisma.savedJobSearch.upsert({
      where: { freelancerProfileId_query: { freelancerProfileId: profile.id, query } },
      create: { freelancerProfileId: profile.id, name, query },
      update: { name },
    });
  } catch (e) {
    // Gelijktijdige eerste-opslag van dezelfde query: het unieke paar heeft gewonnen — geen fout.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }

  await audit({
    actorId: actor.id,
    action: "JOB_SEARCH_SAVED",
    entityType: "SavedJobSearch",
    entityId: query,
  });

  revalidatePath("/opdrachten");
  return { ok: true };
}

/**
 * Verwijdert een bewaarde zoekopdracht. Eigenaar-scoped (`id` + eigen profiel) zonder existence-
 * oracle: een niet-bestaande of andermans rij is een stille no-op zonder audit.
 */
export async function deleteJobSearch(id: string): Promise<void> {
  const actor = await requireRole("FREELANCER");

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  if (!profile) throw new Error("Geen ZZP'er-profiel gevonden.");

  const { count } = await prisma.savedJobSearch.deleteMany({
    where: { id, freelancerProfileId: profile.id },
  });

  if (count > 0) {
    await audit({
      actorId: actor.id,
      action: "JOB_SEARCH_DELETED",
      entityType: "SavedJobSearch",
      entityId: id,
    });
  }

  revalidatePath("/opdrachten");
}
