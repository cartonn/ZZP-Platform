"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { TENANT_FEE_PERCENT_MIN, TENANT_FEE_PERCENT_MAX } from "@/lib/tenant-fee";

const schema = z.object({
  name: z.string().trim().min(2, "Naam is te kort.").max(120),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Gebruik een hex-kleur, bv. #2563eb.")
    .optional()
    .or(z.literal("")),
  feePercent: z
    .number({ invalid_type_error: "Vul een geldig percentage in." })
    .min(TENANT_FEE_PERCENT_MIN, `Minimaal ${TENANT_FEE_PERCENT_MIN}%.`)
    .max(TENANT_FEE_PERCENT_MAX, `Maximaal ${TENANT_FEE_PERCENT_MAX}%.`)
    .refine((v) => Math.round(v * 10) === v * 10, {
      message: "Maximaal één decimaal, bv. 12,5.",
    }),
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

  // Accepteer zowel punt als komma als decimaalscheiding (nl-NL invoer).
  const rawFee = String(formData.get("feePercent") ?? "0")
    .trim()
    .replace(",", ".");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    brandColor: formData.get("brandColor") ?? "",
    feePercent: rawFee === "" ? 0 : Number(rawFee),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { name, brandColor, feePercent } = parsed.data;
  const openOverflow = formData.get("openOverflow") === "on";

  // De Franchiser beheert exact één tenant (Tenant.ownerUserId = hijzelf).
  const tenant = await prisma.tenant.findUnique({
    where: { ownerUserId: actor.id },
    select: { id: true, feePercent: true },
  });
  if (!tenant) return { error: "Geen bemiddeling gevonden." };

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { name, brandColor: brandColor ? brandColor : null, feePercent, openOverflow },
  });

  await audit({
    actorId: actor.id,
    action: "FRANCHISE_BRANDING_UPDATED",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { name, brandColor: brandColor || null, openOverflow },
  });

  // Aparte audit-regel als het fee-percentage daadwerkelijk wijzigt (financiële beslissing).
  if (feePercent !== tenant.feePercent) {
    await audit({
      actorId: actor.id,
      action: "FRANCHISE_FEE_PERCENT_UPDATED",
      entityType: "Tenant",
      entityId: tenant.id,
      metadata: { from: tenant.feePercent, to: feePercent },
    });
  }

  revalidatePath("/franchise/instellingen");
  revalidatePath("/", "layout");
  return { ok: true };
}
