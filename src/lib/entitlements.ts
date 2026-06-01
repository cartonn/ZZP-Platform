// Waardegebaseerde abonnementslaag: koppelt een plan (PlanKey) aan concrete features per rol.
// Server-side waarheid (CLAUDE.md regel 1): de UI toont dit, maar toegang wordt server-side
// bepaald via hasEntitlement. Geen geldstroom via het platform (Besluit 1) — dit is een
// abonnement, geen transactiefee op de werk-geldstroom. Geen "AI" in de teksten.
//
// De DB-plankeys blijven FREE/PRO/BUSINESS (geen migratie); ze worden hier als waarde-tiers
// gepresenteerd: Gratis → Zelf-doen → Volledig Ontzorgd (ZZP'er) / Inhuurdesk (opdrachtgever).

import { type PlanKey } from "@/lib/enums";
import { type UserRole } from "@/lib/enums";

/** Feature-vlaggen die een plan kan ontsluiten (server-side gecontroleerd waar nodig). */
export const ENTITLEMENTS = [
  "UNLIMITED_APPLICATIONS", // onbeperkt reageren / opdrachten
  "ADMINISTRATIE", //          grootboek, BTW per kwartaal, debiteuren/crediteuren
  "AUTO_REMINDERS", //         automatische betalingsherinneringen + aanmaningsladder
  "IB_VOORBEREIDING", //       IB-jaaroverzicht / Ontzorgd-dashboard
  "VOLLEDIG_ONTZORGD", //      aangiftes voorbereid + proactief beheer (dienstverlening)
  "PRIORITEIT_VERIFICATIE", // snellere doorlooptijd certificaatverificatie
  "COMPLIANCE_DOSSIER", //     DBA-/modelovereenkomst-dossier per samenwerking
] as const;
export type Entitlement = (typeof ENTITLEMENTS)[number];

/** Welke entitlements horen bij elk plan (cumulatief opklimmend). */
const PLAN_ENTITLEMENTS: Record<PlanKey, readonly Entitlement[]> = {
  FREE: [],
  PRO: [
    "UNLIMITED_APPLICATIONS",
    "ADMINISTRATIE",
    "AUTO_REMINDERS",
    "IB_VOORBEREIDING",
    "COMPLIANCE_DOSSIER",
  ],
  BUSINESS: [
    "UNLIMITED_APPLICATIONS",
    "ADMINISTRATIE",
    "AUTO_REMINDERS",
    "IB_VOORBEREIDING",
    "COMPLIANCE_DOSSIER",
    "VOLLEDIG_ONTZORGD",
    "PRIORITEIT_VERIFICATIE",
  ],
};

/** Server-side check: ontsluit het gegeven plan deze feature? */
export function hasEntitlement(planKey: PlanKey, entitlement: Entitlement): boolean {
  return PLAN_ENTITLEMENTS[planKey]?.includes(entitlement) ?? false;
}

export interface TierInfo {
  /** Waarde-naam zoals getoond in de UI (niet de technische key). */
  name: string;
  tagline: string;
  /** Aanbevolen (gemarkeerde) middentier — center-stage effect. */
  highlighted: boolean;
  /** Verkoop-features in mensentaal, per rol. */
  features: readonly string[];
}

const FREELANCER_TIERS: Record<PlanKey, TierInfo> = {
  FREE: {
    name: "Gratis",
    tagline: "Om te starten en uit te proberen",
    highlighted: false,
    features: [
      "Profiel + 1 certificaat ter verificatie",
      "Tot 5 reacties op opdrachten",
      "Verklaarbare matching + opdrachten zoeken",
      "Berichten met opdrachtgevers",
    ],
  },
  PRO: {
    name: "Zelf-doen",
    tagline: "Jij houdt de regie, wij leveren de tools",
    highlighted: true,
    features: [
      "Onbeperkt reageren en samenwerken",
      "Volledige facturatie via het werkproces",
      "Administratie: grootboek, BTW per kwartaal, debiteuren",
      "Automatische betalingsherinneringen",
      "IB-jaaroverzicht ter eigen voorbereiding",
      "Onbeperkt certificaten + verificatie",
      "Modelovereenkomst-dossier + DBA-signalen",
    ],
  },
  BUSINESS: {
    name: "Volledig Ontzorgd",
    tagline: "Jij werkt, wij doen de administratie en belasting",
    highlighted: false,
    features: [
      "Alles uit Zelf-doen",
      "Ontzorgd-dashboard: BTW, reservering en uren in één beeld",
      "Kwartaal-BTW kant-en-klaar voorbereid",
      "Jaarlijkse IB-aangifte voorbereid",
      "Proactieve debiteurenbewaking namens jou",
      "Prioriteit-verificatie van certificaten",
      "Persoonlijk aanspreekpunt",
    ],
  },
};

const CLIENT_TIERS: Record<PlanKey, TierInfo> = {
  FREE: {
    name: "Gratis",
    tagline: "Incidenteel inhuren en uitproberen",
    highlighted: false,
    features: [
      "1 actieve opdracht",
      "ZZP'ers zoeken + verklaarbare matching",
      "Kandidaten ontvangen en berichten",
      "Compliance-status van kandidaten zien",
    ],
  },
  PRO: {
    name: "Zakelijk",
    tagline: "Grip op compliance en crediteuren",
    highlighted: true,
    features: [
      "Onbeperkt actieve opdrachten",
      "Crediteuren + BTW-voorbelasting per kwartaal",
      "DBA-monitoring + risicorapportage per inhuur",
      "Modelovereenkomsten-dossier per samenwerking",
      "Automatische betaalstatus-bewaking",
      "CSV-exports voor je boekhouding",
    ],
  },
  BUSINESS: {
    name: "Inhuurdesk",
    tagline: "De complete inhuuradministratie uitbesteed",
    highlighted: false,
    features: [
      "Alles uit Zakelijk",
      "Inhuuradministratie bijgehouden namens jou",
      "Geconsolideerd crediteuren- + BTW-dossier",
      "Portefeuille-brede compliance- en DBA-bewaking",
      "Betaalstatus actief bewaakt en gerapporteerd",
      "Vast aanspreekpunt",
    ],
  },
};

/** Tier-presentatie voor een plan, afhankelijk van de rol (ZZP'er vs opdrachtgever). */
export function tierInfo(planKey: PlanKey, role: UserRole): TierInfo {
  const table = role === "CLIENT" ? CLIENT_TIERS : FREELANCER_TIERS;
  return table[planKey];
}
