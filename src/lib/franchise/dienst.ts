// Gedeelde dienst-creatie voor de franchise: één bron van waarheid voor het uitzetten van een
// afdeling-gekoppelde opdracht (Job), gebruikt door zowel de volledige diensten-pagina als de
// inline cockpit-route. Dicht de duplicatie tussen de twee server-acties: validatie (Zod),
// skill-/certificaat-koppeling en de tenant-check staan hier op één plek.
//
// Server-side waarheid (CLAUDE.md regel 1+2): auth/rol checkt de aanroeper; hier doen we de
// ownership (assertSameTenant), Zod-validatie, de mutatie en de audit. `status` bepaalt of de
// dienst meteen live gaat (PUBLISHED) of als concept wordt geparkeerd (DRAFT) — de snelle
// quick-add levert een concept, de expliciete route publiceert.

import { z } from "zod";
import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { ownsViaTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { credentialTypeSchema, type JobStatus } from "@/lib/enums";

/** Rijke dienstvelden (zonder afdeling — die komt uit de context/binding van de aanroeper). */
export const dienstSchema = z
  .object({
    title: z.string().trim().min(3, "Titel is te kort.").max(160),
    description: z.string().trim().min(10, "Geef een korte omschrijving.").max(5000),
    location: z.string().trim().max(120).optional(),
    workMode: z.enum(["REMOTE", "ONSITE", "HYBRID"]).default("ONSITE"),
    // Datum robuust valideren (spiegelt jobSchema.startDate): een lege waarde → geen startdatum,
    // een ongeldige/onzin-string wordt door Zod geweigerd i.p.v. als `Invalid Date` door te
    // stromen naar `prisma.job.create` (DateTime-kolom) → PrismaClientValidationError → 500.
    startDate: z
      .union([z.literal(""), z.coerce.date()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? undefined : (v as Date))),
    // Tarief optioneel, maar indien ingevuld minstens €1/uur (geen "€ 0/uur"-dienst).
    rateMin: z.coerce.number().int().min(1).max(100000).optional(),
    rateMax: z.coerce.number().int().min(1).max(100000).optional(),
  })
  .refine((d) => d.rateMin == null || d.rateMax == null || d.rateMin <= d.rateMax, {
    message: "Het minimumtarief mag niet hoger zijn dan het maximum.",
    path: ["rateMax"],
  });

export type DienstResult =
  | { ok: true; jobId: string; title: string; companyId: string }
  | { error: string; fieldErrors?: Record<string, string> };

/**
 * Zet een dienst (opdracht) uit op één afdeling binnen de eigen franchise. De aanroeper heeft de
 * rol al gecheckt; hier checken we de tenant-ownership van de afdeling, valideren we de invoer en
 * maken we de Job met optionele skills/vereiste certificaten. `status` (default PUBLISHED) bepaalt
 * concept vs. live. Retourneert een leesbaar resultaat; gooit alleen bij onverwachte fouten.
 */
export async function createFranchiseDienst(opts: {
  actor: Actor;
  departmentId: string;
  formData: FormData;
  status?: JobStatus;
}): Promise<DienstResult> {
  const { actor, departmentId, formData } = opts;
  const status: JobStatus = opts.status ?? "PUBLISHED";

  // De afdeling (en daarmee de opdrachtgever) moet in de eigen tenant zitten. Onbekend id én een
  // afdeling van een ándere tenant geven exact dezelfde melding: zo lekt het verschil "bestaat niet"
  // vs. "bestaat, andere bemiddeling" niet (geen existence-oracle, CWE-203). Spiegelt
  // `addAfdelingStep`/`removeAfdelingStep` in ../../app/(protected)/franchise/opdrachtgevers/nieuw/actions.ts.
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { companyId: true, company: { select: { tenantId: true } } },
  });
  if (!dept || !ownsViaTenant(actor, dept.company.tenantId)) {
    return { error: "Afdeling niet gevonden.", fieldErrors: { departmentId: "Onbekend." } };
  }

  const rawMin = formData.get("rateMin");
  const rawMax = formData.get("rateMax");
  const parsed = dienstSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    workMode: formData.get("workMode") || "ONSITE",
    startDate: formData.get("startDate") || undefined,
    rateMin: rawMin ? rawMin : undefined,
    rateMax: rawMax ? rawMax : undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { title, description, location, workMode, startDate, rateMin, rateMax } = parsed.data;

  // Alleen bestaande skills en geldige certificaattypes koppelen (defensief tegen gemanipuleerde input).
  const requestedSkillIds = formData.getAll("skillIds").map(String).filter(Boolean);
  const validSkills = requestedSkillIds.length
    ? await prisma.skill.findMany({
        where: { id: { in: requestedSkillIds } },
        select: { id: true },
      })
    : [];
  const skillIds = validSkills.map((s) => s.id);
  const credentialTypes = [
    ...new Set(
      formData
        .getAll("credentialTypes")
        .map(String)
        .filter((t) => credentialTypeSchema.safeParse(t).success),
    ),
  ];

  const job = await prisma.job.create({
    data: {
      companyId: dept.companyId,
      tenantId: actor.tenantId,
      departmentId,
      title,
      description,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      workMode,
      location: location ?? null,
      startDate: startDate ?? null,
      rateMin: rateMin ?? null,
      rateMax: rateMax ?? null,
      skills: skillIds.length ? { create: skillIds.map((id) => ({ skillId: id })) } : undefined,
      credentialRequirements: credentialTypes.length
        ? { create: credentialTypes.map((credentialType) => ({ credentialType })) }
        : undefined,
    },
  });

  await audit({
    actorId: actor.id,
    action: status === "PUBLISHED" ? "FRANCHISE_DIENST_PUBLISHED" : "FRANCHISE_DIENST_DRAFTED",
    entityType: "Job",
    entityId: job.id,
    metadata: {
      tenantId: actor.tenantId,
      departmentId,
      companyId: dept.companyId,
      skills: skillIds.length,
      credentials: credentialTypes.length,
      status,
    },
  });

  return { ok: true, jobId: job.id, title, companyId: dept.companyId };
}
