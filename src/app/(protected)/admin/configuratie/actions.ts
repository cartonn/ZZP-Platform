"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { getDbaThresholds, saveDbaThresholds } from "@/lib/platform-config";

const dbaThresholdsSchema = z.object({
  durationSignalMonths: z
    .number({ invalid_type_error: "Voer een geldig getal in." })
    .int("Voer een heel getal in.")
    .min(1, "Minimaal 1 maand.")
    .max(60, "Maximaal 60 maanden."),
  durationStrongSignalMonths: z
    .number({ invalid_type_error: "Voer een geldig getal in." })
    .int("Voer een heel getal in.")
    .min(1, "Minimaal 1 maand.")
    .max(60, "Maximaal 60 maanden."),
  revenueConcentrationPct: z
    .number({ invalid_type_error: "Voer een geldig getal in." })
    .int("Voer een heel getal in.")
    .min(1, "Minimaal 1%.")
    .max(100, "Maximaal 100%."),
});

export type ConfigFormState =
  | { success?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function updateDbaThresholds(
  _prev: ConfigFormState,
  formData: FormData,
): Promise<ConfigFormState> {
  const actor = await requireRole("ADMIN");

  const parsed = dbaThresholdsSchema.safeParse({
    durationSignalMonths: Number(formData.get("durationSignalMonths")),
    durationStrongSignalMonths: Number(formData.get("durationStrongSignalMonths")),
    revenueConcentrationPct: Number(formData.get("revenueConcentrationPct")),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) {
      if (v && v[0]) fieldErrors[k] = v[0];
    }
    return { error: "Controleer de ingevoerde waarden.", fieldErrors };
  }

  const previous = await getDbaThresholds();
  await saveDbaThresholds(parsed.data, actor.id);
  await audit({
    actorId: actor.id,
    action: "PLATFORM_CONFIG_UPDATED",
    entityType: "PlatformConfig",
    entityId: "singleton",
    metadata: { previous, updated: parsed.data },
  });

  revalidatePath("/admin/configuratie");
  return { success: true };
}
