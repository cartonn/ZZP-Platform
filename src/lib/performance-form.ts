// Pure mapping van een opgeslagen prestatie naar de defaultwaarden van het PerformanceForm,
// zodat een afgekeurde prestatie inline gecorrigeerd kan worden (ADR-0005). Geen I/O.
// Diensten zijn opgeslagen als lokale datetime-local-strings (zie commands.ts) en worden
// daarom letterlijk teruggezet — geen tijdzone-conversie.

import { type OrtSegment } from "@/lib/ort";

export interface StoredPerformance {
  type: string;
  hours: number | null;
  amountCents: number | null;
  milestoneTitle: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  description: string;
  ortSegments: string | null;
  shifts: string | null;
}

export type ManualOrtField =
  | "ort_normal"
  | "ort_evening"
  | "ort_night"
  | "ort_saturday"
  | "ort_sunday"
  | "ort_holiday";

export interface PerformanceFormDefaults {
  type: "HOURS" | "MILESTONE";
  hours: string;
  periodStart: string;
  periodEnd: string;
  amount: string;
  milestoneTitle: string;
  description: string;
  shifts: { start: string; end: string }[];
  manualOrt: Record<ManualOrtField, string>;
}

const SEGMENT_FIELD: Record<string, ManualOrtField> = {
  NORMAL: "ort_normal",
  EVENING: "ort_evening",
  NIGHT: "ort_night",
  SATURDAY: "ort_saturday",
  SUNDAY: "ort_sunday",
  HOLIDAY: "ort_holiday",
};

function emptyManualOrt(): Record<ManualOrtField, string> {
  return {
    ort_normal: "",
    ort_evening: "",
    ort_night: "",
    ort_saturday: "",
    ort_sunday: "",
    ort_holiday: "",
  };
}

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

/** Leidt de formulier-defaults af uit een opgeslagen prestatie. */
export function performanceFormDefaults(p: StoredPerformance): PerformanceFormDefaults {
  const type = p.type === "MILESTONE" ? "MILESTONE" : "HOURS";
  const shifts = parseJsonArray<{ start: string; end: string }>(p.shifts).filter(
    (s) => s && typeof s.start === "string" && typeof s.end === "string",
  );

  // Handmatige ORT alleen voorvullen als er géén diensten zijn (anders herleidt het formulier de
  // ORT live uit de diensten). Losse uren alleen als er ook geen ORT-segmenten zijn.
  const segments = shifts.length === 0 ? parseJsonArray<OrtSegment>(p.ortSegments) : [];
  const manualOrt = emptyManualOrt();
  for (const seg of segments) {
    const field = SEGMENT_FIELD[seg.category];
    if (field && seg.hours > 0) manualOrt[field] = String(seg.hours);
  }

  const hasOrt = shifts.length > 0 || segments.length > 0;

  return {
    type,
    hours: type === "HOURS" && !hasOrt && p.hours != null ? String(p.hours) : "",
    periodStart: p.periodStart ? p.periodStart.toISOString().slice(0, 10) : "",
    periodEnd: p.periodEnd ? p.periodEnd.toISOString().slice(0, 10) : "",
    amount: p.amountCents != null ? String(p.amountCents / 100) : "",
    milestoneTitle: p.milestoneTitle ?? "",
    description: p.description ?? "",
    shifts: shifts.map((s) => ({ start: s.start, end: s.end })),
    manualOrt,
  };
}
