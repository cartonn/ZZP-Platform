// Eén schrijfpunt voor "nieuwe bemiddeling + bemiddelaar-account". Twee ingangen delen deze code:
// de platform-admin (/admin/franchises, status ACTIVE) en de zelfaanmelding van een bureau
// (/register, status PENDING → wacht op activatie). Zo kan er nooit één van beide paden een
// tenant aanmaken zonder eigenaar, zonder unieke slug of zonder auditregel.

import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { type TenantStatus } from "@/lib/enums";

/** URL-veilige slug uit een bureaunaam. Pure functie (los getest). */
export function slugifyTenantName(name: string): string {
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

/** Eerste vrije slug: `basis`, anders `basis-2`, `basis-3`, … `taken` beslist wat bezet is. */
export async function uniqueTenantSlug(
  name: string,
  taken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyTenantName(name);
  let slug = base;
  for (let n = 2; await taken(slug); n++) slug = `${base}-${n}`;
  return slug;
}

export interface CreateTenantInput {
  tenantName: string;
  ownerName: string;
  /** Al genormaliseerd (trim + lowercase) door het Zod-schema van de aanroeper. */
  ownerEmail: string;
  passwordHash: string;
  status: TenantStatus;
  mustChangePassword?: boolean;
  kvkNumber?: string | null;
  region?: string | null;
  contactPhone?: string | null;
  /** Auditactie die atomair met de aanmaak wordt weggeschreven. */
  auditAction: string;
  /** null = de aanmelder zelf (zelfregistratie); anders de handelende admin. */
  actorId?: string | null;
  auditMetadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreatedTenant {
  tenantId: string;
  userId: string;
  slug: string;
}

/**
 * Maakt in één transactie: het bemiddelaar-account (rol FRANCHISER), zijn tenant en de koppeling
 * User.tenantId, plus de auditregel. De Franchiser is zowel eigenaar (Tenant.ownerUserId) als lid
 * (User.tenantId) van zijn tenant. De aanroeper doet auth/rol/Zod vóór deze functie.
 */
export async function createTenantWithOwner(input: CreateTenantInput): Promise<CreatedTenant> {
  const slug = await uniqueTenantSlug(
    input.tenantName,
    async (candidate) =>
      !!(await prisma.tenant.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        name: input.ownerName,
        email: input.ownerEmail,
        passwordHash: input.passwordHash,
        role: "FRANCHISER",
        status: "ACTIVE",
        mustChangePassword: input.mustChangePassword ?? false,
      },
    });
    const tenant = await tx.tenant.create({
      data: {
        name: input.tenantName,
        slug,
        ownerUserId: user.id,
        status: input.status,
        kvkNumber: input.kvkNumber ?? null,
        region: input.region ?? null,
        contactPhone: input.contactPhone ?? null,
      },
    });
    await tx.user.update({ where: { id: user.id }, data: { tenantId: tenant.id } });
    await tx.auditLog.create({
      data: auditData({
        actorId: input.actorId ?? user.id,
        action: input.auditAction,
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: { slug, status: input.status, ...(input.auditMetadata ?? {}) },
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      }),
    });
    return { tenantId: tenant.id, userId: user.id, slug };
  });
}
