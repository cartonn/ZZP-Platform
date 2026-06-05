"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(2, "Naam is te kort.").max(120),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Gebruik een hex-kleur, bv. #2563eb.")
    .optional()
    .or(z.literal("")),
});

export type BrandingState = { ok?: true; error?: string; fieldErrors?: Record<string, string> } | undefined; // prettier-ignore

/** Franchiser past de white-label branding van zijn eigen franchise aan (naam + accentkleur). */
export async function updateFranchiseBranding(
  _prev: BrandingState,
  formData: FormData,
): Promise<BrandingState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    brandColor: formData.get("brandColor") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { name, brandColor } = parsed.data;

  // De Franchiser beheert exact één tenant (Tenant.ownerUserId = hijzelf).
  const tenant = await prisma.tenant.findUnique({
    where: { ownerUserId: actor.id },
    select: { id: true },
  });
  if (!tenant) return { error: "Geen franchise gevonden." };

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { name, brandColor: brandColor ? brandColor : null },
  });

  await audit({
    actorId: actor.id,
    action: "FRANCHISE_BRANDING_UPDATED",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { name, brandColor: brandColor || null },
  });

  revalidatePath("/franchise/instellingen");
  revalidatePath("/", "layout");
  return { ok: true };
}
