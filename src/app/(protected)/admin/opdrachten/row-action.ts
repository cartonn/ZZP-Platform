// Pure beslissing: welke rij-actie hoort bij een opdracht-status op de admin-moderatielijst?
// Losgetrokken van de server-component zodat de zichtbaarheid per status los testbaar is.
//
// - Concept (DRAFT)      → geen "Sluiten" (nog niet live); alleen "Bekijken".
// - Gepubliceerd         → "Sluiten", maar achter een bevestigingsstap (geen one-click).
// - Gesloten (CLOSED)    → geen actie (al gesloten).

import { type JobStatus } from "@/lib/enums";

export type AdminJobRowAction = "view" | "close-confirm" | "none";

export function adminJobRowAction(status: JobStatus): AdminJobRowAction {
  if (status === "DRAFT") return "view";
  if (status === "PUBLISHED") return "close-confirm";
  return "none";
}
