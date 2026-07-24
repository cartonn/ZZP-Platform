"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { parseCsvShifts } from "@/lib/diensten";
import { createPerformance, submitPerformance } from "@/lib/cascade/commands";
import { toSafeActionError } from "@/lib/safe-action-error";
import { segmentShifts, dutchHolidays, type Shift } from "@/lib/shift";
import { resolveOrtRates } from "@/lib/ort";
import { prisma } from "@/lib/db";

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** Maximum aantal diensten per CSV-import om timeouts en notificatie-spam te voorkomen. */
const MAX_IMPORT_SIZE = 100;

export async function importDienstenAction(
  _prev: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const actor = await requireActor();
  if (actor.role !== "FREELANCER") {
    return { imported: 0, skipped: 0, errors: ["Alleen ZZP'ers kunnen diensten importeren."] };
  }

  const collaborationId = String(formData.get("collaborationId") ?? "").trim();
  const csvText = String(formData.get("csv") ?? "").trim();

  if (!collaborationId) return { imported: 0, skipped: 0, errors: ["Selecteer een samenwerking."] };
  if (!csvText) return { imported: 0, skipped: 0, errors: ["Voer CSV-tekst in met diensten."] };

  // Laad samenwerking om ORT-profiel te lezen en te valideren dat de ZZP'er eigenaar is.
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: {
      status: true,
      rate: true,
      ortProfile: true,
      ortCustomRates: true,
      freelancer: { select: { userId: true } },
      company: { select: { userId: true } },
    },
  });
  // Onbekend id én andermans samenwerking geven exact dezelfde afhandeling: een geknutseld/gegokt
  // `collaborationId` van een ander mag niet via een afwijkende melding het bestaan van die
  // samenwerking prijsgeven (CWE-203 existence-oracle). Fail-closed, ononderscheidbaar.
  if (!col || col.freelancer.userId !== actor.id) {
    return { imported: 0, skipped: 0, errors: ["Samenwerking niet gevonden."] };
  }
  if (col.status !== "ACTIVE") {
    return {
      imported: 0,
      skipped: 0,
      errors: ["De samenwerking moet actief zijn om diensten te importeren."],
    };
  }

  const rateCents = col.rate != null ? col.rate * 100 : null;
  const rates = resolveOrtRates({ ortProfile: col.ortProfile, ortCustomRates: col.ortCustomRates });

  const { shifts: parsedShifts, errors: parseErrors } = parseCsvShifts(csvText);

  if (parsedShifts.length > MAX_IMPORT_SIZE) {
    return {
      imported: 0,
      skipped: 0,
      errors: [
        `Maximaal ${MAX_IMPORT_SIZE} diensten per import toegestaan. Dit bestand bevat ${parsedShifts.length} geldige regels. Splits het bestand op in kleinere batches.`,
      ],
    };
  }

  const errors: string[] = parseErrors.map((e) => `Regel ${e.line}: ${e.message}`);
  let imported = 0;
  let skipped = 0;

  for (const parsed of parsedShifts) {
    try {
      const shift: Shift = { start: parsed.start, end: parsed.end };
      const years = new Set([parsed.start.getFullYear(), parsed.end.getFullYear()]);
      const holidays = new Set<string>();
      for (const y of years) for (const k of dutchHolidays(y)) holidays.add(k);

      const ortSegments = segmentShifts([shift], { rates, holidays });
      const totalHours = ortSegments.reduce((s, x) => s + x.hours, 0);

      // Gebruik de dienstperiode als de periodStart/End.
      const periodStart = new Date(parsed.start);
      periodStart.setHours(0, 0, 0, 0);
      const periodEnd = new Date(parsed.end);
      periodEnd.setHours(23, 59, 59, 999);

      const perfId = await createPerformance(actor, {
        collaborationId,
        type: "HOURS",
        hours: totalHours,
        rateCents,
        ortSegments,
        periodStart,
        periodEnd,
        description:
          parsed.description || `Geïmporteerde dienst ${parsed.start.toLocaleDateString("nl-NL")}`,
      });

      await submitPerformance(actor, perfId);
      imported++;
    } catch (e) {
      const msg = toSafeActionError(e, "Onbekende fout.");
      errors.push(`Dienst ${parsed.start.toLocaleDateString("nl-NL")}: ${msg}`);
      skipped++;
    }
  }

  if (imported > 0) {
    revalidatePath("/diensten");
    revalidatePath(`/samenwerkingen/${collaborationId}`);
  }

  return { imported, skipped, errors };
}
