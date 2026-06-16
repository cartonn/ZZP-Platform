// Inzetvorm-signaal: vertaalt het reeds server-berekende DBA-risico van een dienst/opdracht
// (DbaRisk uit dba.ts: LAAG | MIDDEN | HOOG) naar één rustige guidance-regel voor bij de plaatsing
// ("geschikt voor zelfstandige inzet" vs "let op — risico op schijnzelfstandigheid").
//
// Dit is een DISPLAY-synthese van een bestaand signaal — GEEN nieuw model, geen nieuwe drempels en
// geen juridisch oordeel. De vaste DBA-disclaimer (config.ts) blijft altijd naast dit signaal staan.
// ZZP-only realiteit: er is geen payroll-/uitzendalternatief; de guidance gaat over zelfstandige inzet.

import { type DbaRisk } from "@/lib/dba";

/** Toon-niveau, één-op-één met de bestaande badge-varianten (kleur nooit het enige signaal). */
export type InzetvormTone = "success" | "warning" | "danger";

export interface InzetvormSignaal {
  tone: InzetvormTone;
  label: string;
  hint: string;
}

// Geen eigen drempels: we mappen exact de bestaande DbaRisk-niveaus. `null` = nog niet beoordeeld.
const SIGNAAL: Record<DbaRisk, InzetvormSignaal> = {
  LAAG: {
    tone: "success",
    label: "Geschikt voor zelfstandige inzet",
    hint: "De opgegeven kenmerken passen bij een zelfstandige opdracht.",
  },
  MIDDEN: {
    tone: "warning",
    label: "Let op: aandachtspunten bij zelfstandige inzet",
    hint: "Borg vrije vervanging, resultaatgerichtheid en een zelfstandige werkwijze vóór plaatsing.",
  },
  HOOG: {
    tone: "danger",
    label: "Let op: verhoogd schijnzelfstandigheidsrisico",
    hint: "Herzie de opdracht of leg de zelfstandige werkwijze vast vóór plaatsing.",
  },
};

const ONBEKEND: InzetvormSignaal = {
  tone: "warning",
  label: "Inzetvorm nog niet beoordeeld",
  hint: "Er is nog geen risico-inschatting voor deze dienst beschikbaar.",
};

/**
 * Geeft het inzetvorm-signaal voor een (al berekend) DBA-risiconiveau. `null` → onbeoordeeld.
 * Pure functie: alleen een lookup op het bestaande niveau, geen nieuwe weging.
 */
export function inzetvormSignaal(risk: DbaRisk | null | undefined): InzetvormSignaal {
  if (risk == null) return ONBEKEND;
  return SIGNAAL[risk] ?? ONBEKEND;
}
