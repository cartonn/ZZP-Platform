"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { availabilityWindowSchema } from "@/lib/validation";
import { availabilityStatusSchema } from "@/lib/availability-status";

export type AvailabilityState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

export type AvailabilityStatusResult = { ok: true } | { ok: false; error: string };

/**
 * Snelle statuswijziging: zet de persistente `availability`-status op het ZZP-profiel in één klik
 * (Beschikbaar / Beperkt / Niet beschikbaar), zonder het volledige profielformulier. Volgt de
 * volledige mutatieketen: auth → rol → ownership → Zod → eigenaar-scoped write → audit.
 */
export async function setAvailabilityStatus(status: string): Promise<AvailabilityStatusResult> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { ok: false, error: e.message };
    throw e;
  }

  const parsed = availabilityStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Ongeldige status." };

  // Eigenaar-scoped write in één statement (op userId): geen los ownership-lees dat kan driften.
  const { count } = await prisma.freelancerProfile.updateMany({
    where: { userId: actor.id },
    data: { availability: parsed.data },
  });
  if (count === 0) return { ok: false, error: "Maak eerst je profiel aan." };

  await audit({
    actorId: actor.id,
    action: "AVAILABILITY_STATUS_CHANGED",
    entityType: "FreelancerProfile",
    entityId: actor.id,
    metadata: { status: parsed.data },
  });
  revalidatePath("/beschikbaarheid");
  revalidatePath("/dashboard");
  revalidatePath("/profiel");
  return { ok: true };
}

async function requireProfile(actorId: string) {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actorId },
    select: { id: true },
  });
  if (!profile) throw new Error("Maak eerst je profiel aan.");
  return profile;
}

export async function addAvailabilityWindow(
  _prev: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  const profile = await requireProfile(actor.id);

  const parsed = availabilityWindowSchema.safeParse({
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    type: formData.get("type"),
    hoursPerWeek: formData.get("hoursPerWeek") ?? "",
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const d = parsed.data;

  const window = await prisma.availabilityWindow.create({
    data: {
      freelancerProfileId: profile.id,
      startDate: d.startDate,
      endDate: d.endDate,
      type: d.type,
      hoursPerWeek: d.hoursPerWeek ?? null,
      note: d.note ?? null,
    },
  });
  await audit({
    actorId: actor.id,
    action: "AVAILABILITY_ADDED",
    entityType: "AvailabilityWindow",
    entityId: window.id,
  });
  revalidatePath("/beschikbaarheid");
  return { ok: true };
}

export async function updateAvailabilityWindow(
  _prev: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  const profile = await requireProfile(actor.id);

  const windowId = String(formData.get("windowId") ?? "");
  if (!windowId) return { error: "Venster niet gevonden." };

  const parsed = availabilityWindowSchema.safeParse({
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    type: formData.get("type"),
    hoursPerWeek: formData.get("hoursPerWeek") ?? "",
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const d = parsed.data;

  // Compound-guarded write (eigenaar-scoped in dezelfde statement): een ander profiel kan een
  // gegokt id nooit bewerken, en de ownership-check kan niet driften met de update (geen TOCTOU).
  const { count } = await prisma.availabilityWindow.updateMany({
    where: { id: windowId, freelancerProfileId: profile.id },
    data: {
      startDate: d.startDate,
      endDate: d.endDate,
      type: d.type,
      hoursPerWeek: d.hoursPerWeek ?? null,
      note: d.note ?? null,
    },
  });
  if (count === 0) return { error: "Venster niet gevonden." };

  await audit({
    actorId: actor.id,
    action: "AVAILABILITY_UPDATED",
    entityType: "AvailabilityWindow",
    entityId: windowId,
  });
  revalidatePath("/beschikbaarheid");
  return { ok: true };
}

export async function deleteAvailabilityWindow(windowId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const profile = await requireProfile(actor.id);
  const window = await prisma.availabilityWindow.findUnique({
    where: { id: windowId },
    select: { freelancerProfileId: true },
  });
  if (!window || window.freelancerProfileId !== profile.id)
    throw new Error("Venster niet gevonden.");

  await prisma.availabilityWindow.delete({ where: { id: windowId } });
  await audit({
    actorId: actor.id,
    action: "AVAILABILITY_REMOVED",
    entityType: "AvailabilityWindow",
    entityId: windowId,
  });
  revalidatePath("/beschikbaarheid");
}
