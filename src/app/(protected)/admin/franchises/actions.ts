"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { generateTempPassword } from "@/lib/onboarding/password";

const schema = z.object({
  tenantName: z.string().trim().min(2, "Franchise-naam is te kort.").max(120),
  franchiserName: z.string().trim().min(2, "Naam is te kort.").max(120),
  franchiserEmail: z.string().trim().toLowerCase().email("Ongeldig e-mailadres."),
});

export type FranchiseState =
  | { ok: true; email: string; tempPassword: string; tenantName: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/** Maakt een Franchiser-account + bijbehorende tenant (franchise). Alleen voor platform-admins. */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "franchise"
  );
}

export async function createFranchise(
  _prev: FranchiseState,
  formData: FormData,
): Promise<FranchiseState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = schema.safeParse({
    tenantName: formData.get("tenantName"),
    franchiserName: formData.get("franchiserName"),
    franchiserEmail: formData.get("franchiserEmail"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { tenantName, franchiserName, franchiserEmail } = parsed.data;

  if (await prisma.user.findUnique({ where: { email: franchiserEmail }, select: { id: true } })) {
    return { error: "Er bestaat al een account met dit e-mailadres.", fieldErrors: { franchiserEmail: "Al in gebruik." } }; // prettier-ignore
  }

  // Unieke slug (suffix bij botsing).
  const base = slugify(tenantName);
  let slug = base;
  for (let n = 2; await prisma.tenant.findUnique({ where: { slug }, select: { id: true } }); n++) {
    slug = `${base}-${n}`;
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // De Franchiser is zowel eigenaar (Tenant.ownerUserId) als lid (User.tenantId) van zijn tenant.
  const { tenant } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: franchiserName,
        email: franchiserEmail,
        passwordHash,
        role: "FRANCHISER",
        status: "ACTIVE",
        mustChangePassword: true,
      },
    });
    const tenant = await tx.tenant.create({
      data: { name: tenantName, slug, ownerUserId: user.id },
    });
    await tx.user.update({ where: { id: user.id }, data: { tenantId: tenant.id } });
    return { user, tenant };
  });

  await audit({
    actorId: actor.id,
    action: "FRANCHISE_CREATED",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { slug, owner: franchiserEmail },
  });

  return { ok: true, email: franchiserEmail, tempPassword, tenantName };
}
