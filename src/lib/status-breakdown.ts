// Eén bron voor de statusverdelingen die de inzicht-donuts tekenen: per status een Nederlands
// label en een semantische tone. Houdt de volgorde van de segmenten vast (lege segmenten worden
// in de UI weggelaten). Pure data + één helper — los testbaar.

import type { BiTone } from "@/components/insight/bi";

export interface StatusSegmentConfig {
  status: string;
  label: string;
  tone: BiTone;
}

/** Samenwerkingen (CollaborationStatus). */
export const COLLABORATION_SEGMENTS: StatusSegmentConfig[] = [
  { status: "PROPOSED", label: "Voorgesteld", tone: "warning" },
  { status: "ACTIVE", label: "Actief", tone: "success" },
  { status: "COMPLETED", label: "Afgerond", tone: "accent" },
  { status: "CANCELLED", label: "Geannuleerd", tone: "default" },
];

/** Reacties van de ZZP'er (ApplicationStatus). */
export const APPLICATION_SEGMENTS: StatusSegmentConfig[] = [
  { status: "NEW", label: "Nieuw", tone: "accent" },
  { status: "VIEWED", label: "Bekeken", tone: "default" },
  { status: "SHORTLIST", label: "Shortlist", tone: "warning" },
  { status: "ACCEPTED", label: "Geaccepteerd", tone: "success" },
  { status: "REJECTED", label: "Afgewezen", tone: "danger" },
  { status: "WITHDRAWN", label: "Ingetrokken", tone: "default" },
];

export interface DonutDatum {
  label: string;
  value: number;
  tone: BiTone;
}

/**
 * Zet een status→aantal-record om naar donut-data in de vaste segmentvolgorde. Statussen zonder
 * tellingen krijgen 0. Onbekende statussen in het record worden genegeerd (de config is leidend).
 */
export function toDonutData(
  byStatus: Record<string, number>,
  config: StatusSegmentConfig[],
): DonutDatum[] {
  return config.map((c) => ({ label: c.label, value: byStatus[c.status] ?? 0, tone: c.tone }));
}
