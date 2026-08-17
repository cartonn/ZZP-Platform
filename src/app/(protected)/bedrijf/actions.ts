"use server";

import { revalidatePath } from "next/cache";
import { requireRole, assertOwnership, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  assertContentMatchesMime,
  generateStorageKey,
  getStorage,
  IMAGE_MIME_TYPES,
  UploadValidationError,
  validateUpload,
} from "@/lib/services/storage";
import { assertUploadClean } from "@/lib/services/upload-scanner";
import { companyProfileSchema } from "@/lib/validation";
import { logStorageCleanupFailure } from "@/lib/observability/storage-failure";

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
    const exists = await prisma.industry.findUnique({
      where: { id: data.industryId },
      select: { id: true },
    });
    if (!exists) return { fieldErrors: { industryId: "Onbekende branche." } };
  }

  // Optionele logo-upload via de storage-abstractie (CLAUDE.md regel 4).
  let logoKey = company.logoKey;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const buffer = Buffer.from(await logo.arrayBuffer());
    try {
      // Alleen-afbeelding allowlist: een bedrijfslogo wordt via /api/media inline aan élke ingelogde
      // gebruiker geserveerd (un-sandboxed). Een PDF (of ander niet-beeld-type) hoort hier niet thuis;
      // het client-side `accept`-attribuut mag niet de enige poort zijn (regel 1: server = waarheid).
      validateUpload(
        { filename: logo.name, mimeType: logo.type, size: logo.size },
        IMAGE_MIME_TYPES,
      );
      assertContentMatchesMime(buffer, logo.type, IMAGE_MIME_TYPES);
      // Malware-scan vóór de opslag (CLAUDE.md regel 4 — dezelfde poort als de document-/certificaat-
      // upload). Zonder deze regel omzeilt de logo-upload de scanner die #631 introduceerde: een
      // besmet bestand belandt dan onbekeken in de opslag én wordt via /api/media aan elke ingelogde
      // gebruiker geserveerd. Fail-closed bij een onbereikbare scanner (OWASP A04 insecure design).
      await assertUploadClean(buffer, { mimeType: logo.type, size: logo.size });
    } catch (e) {
      if (e instanceof UploadValidationError) return { fieldErrors: { logo: e.message } };
      throw e;
    }
    const key = generateStorageKey(logo.name);
    await getStorage().put(key, buffer, logo.type);
    const previous = company.logoKey;
    logoKey = key;
    if (previous)
      await getStorage()
        .delete(previous)
        .catch((err) => logStorageCleanupFailure("[bedrijf]", previous, err));
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
