import { type TaxFilingStatus } from "@/lib/enums";

export const FILING_STATUS_LABEL: Record<TaxFilingStatus, string> = {
  AKKOORD: "Akkoord gegeven",
  IN_BEHANDELING: "In behandeling bij het kantoor",
  VRAGEN: "Vraag van het kantoor",
  CONCEPT_KLAAR: "Concept klaar — wacht op jouw akkoord",
  INGEDIEND: "Ingediend bij de Belastingdienst",
  AANSLAG_ONTVANGEN: "Aanslag ontvangen",
  INGETROKKEN: "Ingetrokken",
};

export function filingStatusVariant(status: TaxFilingStatus): "success" | "warning" | "default" {
  if (status === "INGEDIEND" || status === "AANSLAG_ONTVANGEN") return "success";
  if (status === "CONCEPT_KLAAR" || status === "VRAGEN") return "warning";
  return "default";
}
