"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { hasTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { generateTempPassword } from "@/lib/onboarding/password";

const schema = z.object({
  name: z.string().trim().min(2, "Naam is te kort.").max(120),
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres."),
  headline: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  hourlyRate: z.coerce.number().int().min(0).max(100000).optional(),
});

export type ZzperState =
  | { ok: true; email: string; tempPassword: string; name: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/** Franchiser brengt een ZZP'er (FREELANCER) in zijn roster (tenant). */
export async function createZzper(_prev: ZzperState, formData: FormData): Promise<ZzperState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  if (!hasTenant(actor)) return { error: "Geen franchise gekoppeld." };

  const rawRate = formData.get("hourlyRate");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    headline: formData.get("headline") || undefined,
    location: formData.get("location") || undefined,
    hourlyRate: rawRate ? rawRate : undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { name, email, headline, location, hourlyRate } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "Er bestaat al een account met dit e-mailadres.", fieldErrors: { email: "Al in gebruik." } }; // prettier-ignore
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const tenantId = actor.tenantId;

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "FREELANCER",
      status: "ACTIVE",
      mustChangePassword: true,
      tenantId,
      freelancerProfile: {
        create: {
          headline: headline ?? null,
          location: location ?? null,
          hourlyRate: hourlyRate ?? null,
          availability: "UNKNOWN",
          visibility: "PUBLIC",
          tenantId,
        },
      },
    },
  });

  await audit({
    actorId: actor.id,
    action: "FRANCHISE_FREELANCER_ADDED",
    entityType: "FreelancerProfile",
    entityId: email,
    metadata: { tenantId, name },
  });

  revalidatePath("/franchise/zzpers");
  return { ok: true, email, tempPassword, name };
}
