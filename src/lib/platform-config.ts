// Platform-configuratie: DBA-drempelwaarden uit de database lezen/schrijven.
// Singleton-rij (id = "singleton"). Valt terug op de statische standaarden uit
// config.ts als er nog geen rij bestaat.

import { prisma } from "@/lib/db";
import { DBA_THRESHOLDS } from "@/lib/config";

export interface DbaThresholds {
  durationSignalMonths: number;
  durationStrongSignalMonths: number;
  revenueConcentrationPct: number;
}

/**
 * Lees DBA-drempelwaarden uit de database. Valt terug op statische defaults
 * (config.ts) als er nog geen configuratierij bestaat.
 */
export async function getDbaThresholds(): Promise<DbaThresholds> {
  const cfg = await prisma.platformConfig.findUnique({ where: { id: "singleton" } });
  return {
    durationSignalMonths: cfg?.dbaMinDurationMonths ?? DBA_THRESHOLDS.durationSignalMonths,
    durationStrongSignalMonths:
      cfg?.dbaStrongDurationMonths ?? DBA_THRESHOLDS.durationStrongSignalMonths,
    revenueConcentrationPct:
      cfg?.dbaRevenueConcentrationPct ?? DBA_THRESHOLDS.revenueConcentrationPct,
  };
}

/**
 * Sla DBA-drempelwaarden op in de database (upsert op de singleton-rij).
 */
export async function saveDbaThresholds(thresholds: DbaThresholds, actorId: string): Promise<void> {
  await prisma.platformConfig.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      dbaMinDurationMonths: thresholds.durationSignalMonths,
      dbaStrongDurationMonths: thresholds.durationStrongSignalMonths,
      dbaRevenueConcentrationPct: thresholds.revenueConcentrationPct,
      updatedBy: actorId,
    },
    update: {
      dbaMinDurationMonths: thresholds.durationSignalMonths,
      dbaStrongDurationMonths: thresholds.durationStrongSignalMonths,
      dbaRevenueConcentrationPct: thresholds.revenueConcentrationPct,
      updatedBy: actorId,
    },
  });
}
