"use server";

import { revalidatePath } from "next/cache";
import { requireRole, assertOwnership, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  generateStorageKey,
  getStorage,
  UploadValidationError,
  validateUpload,
} from "@/lib/services/storage";
import { companyProfileSchema } from "@/lib/validation";

export type CompanyState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function updateCompanyProfile(
  _prev: CompanyState,
  formData: FormData,
): Promise<CompanyState> {
  let actor;
  try {
    actor = await requireRole("CLIENT");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const company = await prisma.company.findUnique({ where: { userId: actor.id } });
  if (!company) return { error: "Bedrijfsprofiel niet gevonden." };
  assertOwnership(actor, company.userId);

  const parsed = companyProfileSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    website: formData.get("website") ?? "",
    location: formData.get("location") || undefined,
    industryId: formData.get("industryId") ?? "",
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;

  // Branche moet bestaan (defensief).
  if (data.industryId) {
    const exists = await prisma.industry.findUnique({ where: { id: data.industryId }, select: { id: true } });
    if (!exists) return { fieldErrors: { industryId: "Onbekende branche." } };
  }

  // Optionele logo-upload via de storage-abstractie (CLAUDE.md regel 4).
  let logoKey = company.logoKey;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      validateUpload({ filename: logo.name, mimeType: logo.type, size: logo.size });
    } catch (e) {
      if (e instanceof UploadValidationError) return { fieldErrors: { logo: e.message } };
      throw e;
    }
    const buffer = Buffer.from(await logo.arrayBuffer());
    const key = generateStorageKey(logo.name);
    await getStorage().put(key, buffer, logo.type);
    const previous = company.logoKey;
    logoKey = key;
    if (previous) await getStorage().delete(previous).catch(() => {});
  }

  await prisma.company.update({
    where: { id: company.id },
    data: {
      name: data.name,
      description: data.description ?? null,
      website: data.website ?? null,
      location: data.location ?? null,
      industryId: data.industryId ?? null,
      logoKey,
    },
  });

  await audit({
    actorId: actor.id,
    action: "COMPANY_UPDATED",
    entityType: "Company",
    entityId: company.id,
    metadata: { logoChanged: logoKey !== company.logoKey },
  });

  revalidatePath("/bedrijf");
  return { ok: true };
}
