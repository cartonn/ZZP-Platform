// Configureerbare bedrijfsregels (PLATFORM_OVERHAUL.md §0B + §6). Drempels en tarieven leven
// hier, niet hardcoded verspreid door de code. Bedragen/tarieven in gehele eenheden (centen,
// basispunten) — nooit floats voor geld.

import { z } from "zod";

// --- BTW-regimes ------------------------------------------------------------
// Tarieven in basispunten (bps): 2100 = 21%. Zo blijft alles integer-rekenen.
export const VAT_REGIMES = [
  "STANDARD_HIGH", // 21% — standaard B2B-dienst
  "STANDARD_LOW", //  9%  — verlaagd tarief
  "ZERO", //          0%  — nultarief
  "REVERSE_CHARGE", // btw verlegd (acquirer rekent zelf af; uitschrijver 0)
  "EXEMPT", //        vrijgesteld
] as const;
export type VatRegime = (typeof VAT_REGIMES)[number];
export const vatRegimeSchema = z.enum(VAT_REGIMES);

export const VAT_RATE_BPS: Record<VatRegime, number> = {
  STANDARD_HIGH: 2100,
  STANDARD_LOW: 900,
  ZERO: 0,
  REVERSE_CHARGE: 0,
  EXEMPT: 0,
};

/** Of er bij dit regime daadwerkelijk BTW op de factuur wordt berekend. */
export function regimeChargesVat(regime: VatRegime): boolean {
  return VAT_RATE_BPS[regime] > 0;
}

// --- Facturatie-defaults (configureerbaar) ---------------------------------
export const DEFAULT_VAT_REGIME: VatRegime = "STANDARD_HIGH";
export const DEFAULT_PAYMENT_TERM_DAYS = 30;

// --- Platformfee (Besluit 4 — OPEN, default UIT) ---------------------------
export const FEE_PAYERS = ["CLIENT", "FREELANCER"] as const;
export type FeePayer = (typeof FEE_PAYERS)[number];
export const FEE_TRIGGERS = ["AFTER_PAYMENT", "AT_CONTRACT"] as const;
export type FeeTrigger = (typeof FEE_TRIGGERS)[number];

export interface PlatformFeeConfig {
  enabled: boolean;
  percentageBps: number; //  % van de opdrachtwaarde in bps (250 = 2,5%)
  fixedCents: number; //     vast bedrag i.p.v. percentage (0 = uit)
  payer: FeePayer;
  trigger: FeeTrigger;
  vatRegime: VatRegime; //   BTW over de fee
}

/** Default: fee volledig UIT (Besluit 4). Mechaniek staat klaar, wordt niet toegepast. */
export const PLATFORM_FEE: PlatformFeeConfig = {
  enabled: false,
  percentageBps: 0,
  fixedCents: 0,
  payer: "CLIENT",
  trigger: "AFTER_PAYMENT",
  vatRegime: "STANDARD_HIGH",
};

// --- Tenant-billing (franchise-monetisatie, ADR-0006 blok E) ----------------
// 3+1 hybride model: een maandabonnement per vestiging (tenant) + een lichte transactie-fee per
// gevulde samenwerking. AANGEZET met een hybride staffel (lage drempel, fee daalt per plan). De fee
// wordt bij betaling idempotent als PENDING geregistreerd (record-fee.ts) en getoond op
// /franchise/facturatie. Bedragen zijn config-driven en door de eigenaar bij te stellen. Resterend
// MENSENWERK (MENSENWERK.md §3): definitieve prijzen, betaalprovider/incasso, BTW-classificatie door
// de belastingadviseur (bemiddelaar i.p.v. principaal) vóór er daadwerkelijk gefactureerd wordt, en
// het aparte ZZP-abonnement (per gebruiker, vereist provider).
export interface TenantPlanConfig {
  key: string;
  label: string;
  monthlyPriceCents: number; // abonnement per vestiging per maand (0 = nog niet bepaald)
  feePercentageBps: number; //  transactie-fee als % van de samenwerkingswaarde (bps)
  feeFixedCents: number; //     of een vast bedrag per gevulde samenwerking (heeft voorrang als > 0)
}

export interface TenantBillingConfig {
  enabled: boolean;
  vatRegime: VatRegime; //      BTW over abonnement + fee (B2B-dienst, classificatie = mensenwerk)
  defaultPlanKey: string;
  plans: Record<string, TenantPlanConfig>;
}

/**
 * Hybride staffel (excl. btw, 21% komt erbovenop): instap gratis met de hoogste fee, hogere plannen
 * met een vast vestiging-abonnement en een lagere fee — zo blijft de drempel laag en schaalt de
 * verdienste mee met het succes van de franchise. Bedragen door de eigenaar bij te stellen.
 *   FREE  — € 0 /mnd  + 2,5% per samenwerking
 *   GROEI — € 99 /mnd + 1,75%
 *   PRO   — € 199 /mnd + 1,0%
 */
export const TENANT_BILLING: TenantBillingConfig = {
  enabled: true,
  vatRegime: "STANDARD_HIGH",
  defaultPlanKey: "FREE",
  plans: {
    FREE: { key: "FREE", label: "Gratis", monthlyPriceCents: 0, feePercentageBps: 250, feeFixedCents: 0 }, // prettier-ignore
    GROEI: { key: "GROEI", label: "Groei", monthlyPriceCents: 9900, feePercentageBps: 175, feeFixedCents: 0 }, // prettier-ignore
    PRO: { key: "PRO", label: "Pro", monthlyPriceCents: 19900, feePercentageBps: 100, feeFixedCents: 0 }, // prettier-ignore
  },
};

// --- ZZP-platformabonnement (PIDZ-model) ------------------------------------
// Een maandbijdrage per ZZP'er, maar alleen in maanden waarin de ZZP'er werk heeft (≥1 goedgekeurde
// prestatie). De geplande taak (zzp-membership-task) registreert de bijdrage idempotent als PENDING;
// er wordt nog NIETS geïncasseerd (betaalprovider = mensenwerk). Bedrag excl. btw, bij te stellen.
export interface ZzpMembershipConfig {
  enabled: boolean;
  monthlyPriceCents: number; // bijdrage per actieve maand, excl. btw
  vatRegime: VatRegime;
}

export const ZZP_MEMBERSHIP: ZzpMembershipConfig = {
  enabled: true,
  monthlyPriceCents: 4000, // € 40 per actieve maand (excl. btw)
  vatRegime: "STANDARD_HIGH",
};

// --- Reminder-cascade (tijden in dagen, configureerbaar) -------------------
export const REMINDERS = {
  /** Concept-factuur door ZZP'er nog niet ingediend (na Event B2). */
  conceptInvoiceDays: [0, 3, 7] as const,
  /** Betaaltermijn opdrachtgever (na Event D): dagen vóór/na vervaldag. */
  paymentBeforeDueDays: [5, 1] as const,
  /**
   * E-mail-fallback (digest): ongelezen in-app-notificaties ouder dan dit aantal uren worden
   * gebundeld in één e-mail per gebruiker. De wachttijd geeft de app-route eerst de kans;
   * wie dagelijks inlogt krijgt nooit digest-mail.
   */
  notificationDigestMinAgeHours: 24,
} as const;

// --- Acceptatie-/grace-venster voor ingediende prestaties (§4 Event B/B2) ---
// Een ingediende prestatie die de opdrachtgever niet binnen dit aantal dagen beoordeelt, wordt
// automatisch goedgekeurd (zodat de ZZP'er kan factureren ondanks een stille opdrachtgever).
// Dit is een FINANCIEEL beleid (auto-goedkeuring genereert een concept-factuur) en staat daarom
// standaard UIT: alleen actief wanneer de eigenaar PERFORMANCE_GRACE_DAYS > 0 zet. 0/leeg = uit.
export function parseGraceDays(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** Geconfigureerd grace-venster in dagen; 0 = uitgeschakeld (geen auto-goedkeuring). */
export function performanceGraceDays(): number {
  return parseGraceDays(process.env.PERFORMANCE_GRACE_DAYS);
}

// --- Annuleringstermijn (productbesluit eigenaar 12-6-2026) ----------------
// De opdrachtgever annuleert kosteloos zolang de startdatum nog minstens dit aantal dagen weg is;
// korter op de start (of na de start) ontstaat een betalingsverplichting. Symmetrisch geregistreerd:
// ook de ZZP'er annuleert met verplichte reden, maar zonder kostenregel (dat pad loopt via
// herplaatsing/no-show-registratie).
export const CANCELLATION_FREE_DAYS = 7;

// --- Rechtsvermoeden werknemerschap (wetsvoorstel VBAR, aangenomen 21-4-2026) ----------------
// Bij een uurtarief onder €38 (prijspeil 2025) kan de werkende een rechtsvermoeden van loondienst
// inroepen (art. 7:610a BW zoals gewijzigd). Verwachte inwerkingtreding: 1-1-2027.
// Bron: Wet toelating terbeschikkingstelling van arbeidskrachten / VBAR, Staatsblad 2026.
// Geen juridisch advies — dit is een signaaldrempel.
export const RECHTSVERMOEDEN_DREMPEL_CENTS = 3800; // €38 in centen

// --- Marktband (tarief vs. markt) — anonimiseringsdrempel -------------------
// Minimaal dit aantal peer-tarieven vereist voordat we een marktband tonen.
// Voorkomt dat een ZZP'er het tarief van één collega kan herleiden.
export const MARKET_RATE_MIN_SAMPLE = 3;
// Bovengrens op het aantal peer-tarieven dat we per band ophalen: een ruime
// steekproef voor een representatieve mediaan/spreiding mét harde geheugengrens.
export const MARKET_RATE_SAMPLE_CAP = 5000;

// --- DBA-monitoring drempels & teksten (§6, configureerbaar) ----------------
export const DBA_THRESHOLDS = {
  durationSignalMonths: 6, //        eerste duursignaal
  durationStrongSignalMonths: 12, //  sterker duursignaal
  revenueConcentrationPct: 80, //     >80% omzet bij één opdrachtgever
} as const;

/** Vaste disclaimer bij elk DBA-signaal (Besluit 2 — geen juridisch advies/garantie). */
export const DBA_DISCLAIMER =
  "Dit is een signaal ter informatie en geen juridisch advies; het platform beoordeelt niet of " +
  "aan de wet wordt voldaan. De eindverantwoordelijkheid ligt bij opdrachtgever en ZZP'er.";

// --- Betaalstatus-bevestiging (Besluit 0B punt 2, configureerbaar) ----------
export const PAYMENT_CONFIRMATION = {
  /** Default: ZZP'er bevestigt ontvangst → bevestigd. Beide partijen = strenger. */
  requireBothParties: false,
} as const;

// --- ORT / onregelmatigheidstoeslagen (zorg) — CONFIGUREERBAAR per CAO -------
// Toeslag bovenop het basisuurtarief, per tijdscategorie. Percentages in basispunten (bps):
// 2200 = +22%. Dit zijn VOORBEELDWAARDEN (CAO-achtig); de echte percentages verschillen per CAO
// en worden bij voorkeur per opdrachtgever/contract overschreven. NORMAL = geen toeslag.
export const ORT_CATEGORIES = ["EVENING", "NIGHT", "SATURDAY", "SUNDAY", "HOLIDAY"] as const;
export type OrtCategory = (typeof ORT_CATEGORIES)[number];

/** Nederlandse labels voor de UI. */
export const ORT_CATEGORY_LABEL: Record<OrtCategory, string> = {
  EVENING: "Avond",
  NIGHT: "Nacht",
  SATURDAY: "Zaterdag",
  SUNDAY: "Zondag",
  HOLIDAY: "Feestdag",
};

export const DEFAULT_ORT_RATES_BPS: Record<OrtCategory, number> = {
  EVENING: 2200, //   +22%
  NIGHT: 4900, //     +49%
  SATURDAY: 5200, //  +52%
  SUNDAY: 7200, //    +72%
  HOLIDAY: 10000, //  +100%
};

// Tijdvensters voor automatische ORT-categorisatie uit diensttijden (uur, lokale tijd).
// Avond = [eveningStartHour, nightStartHour); Nacht = [nightStartHour, 24) ∪ [0, nightEndHour).
// Configureerbaar per CAO; dit zijn gangbare zorg-grenzen. Weekend/feestdag gaan via de datum.
export const ORT_TIME_WINDOWS = {
  eveningStartHour: 18, // avondtoeslag vanaf 18:00
  nightStartHour: 22, //  nachttoeslag vanaf 22:00
  nightEndHour: 6, //     nacht loopt door tot 06:00
} as const;

// --- Aanmaningsladder (dunning) — dagen NÁ de vervaldag (configureerbaar) ----
// Het platform int niet (Besluit 1): dit zijn herinneringen/signalen, geen incasso. Per niveau
// wordt eenmalig een signaal gevuurd zodra dat niveau is bereikt. Drempels in dagen-na-vervaldag.
export const DUNNING_STAGES = [
  { level: "REMINDER", daysOverdue: 0, label: "Betalingsherinnering" },
  { level: "FIRST_NOTICE", daysOverdue: 14, label: "Eerste aanmaning" },
  { level: "SECOND_NOTICE", daysOverdue: 30, label: "Tweede aanmaning" },
  { level: "FINAL_NOTICE", daysOverdue: 45, label: "Laatste aanmaning" },
] as const;
export type DunningLevel = (typeof DUNNING_STAGES)[number]["level"];
/** Vanaf dit niveau wordt het platform (admins) geïnformeerd. */
export const DUNNING_ESCALATION_LEVEL: DunningLevel = "FINAL_NOTICE";

// --- ORT sector-/klantprofielen (rulesets) ----------------------------------
// ORT verschilt per zorg-CAO: VVT, GGZ, GHZ (gehandicaptenzorg) en Jeugdzorg hanteren elk
// eigen toeslagen. Een samenwerking kiest een profiel (Collaboration.ortProfile); ontbreekt dat,
// dan valt de berekening terug op DEFAULT. Een opdrachtgever kan altijd een MAATWERK-profiel met
// eigen percentages afspreken — dat overschrijft het sectorprofiel op contractniveau.
// LET OP: dit zijn VOORBEELDWAARDEN per CAO-categorie. Vóór livegang valideren met de klant tegen
// de geldende CAO; het platform claimt geen juridische juistheid van deze percentages.
export const ORT_SECTORS = ["DEFAULT", "VVT", "GGZ", "GHZ", "JEUGD"] as const;
export type OrtSector = (typeof ORT_SECTORS)[number];

/** Nederlandse labels voor de UI (sectorkeuze in de samenwerking). */
export const ORT_SECTOR_LABEL: Record<OrtSector, string> = {
  DEFAULT: "Standaard (geen specifieke CAO)",
  VVT: "VVT — Verpleeg-, Verzorgingshuizen & Thuiszorg",
  GGZ: "GGZ — Geestelijke gezondheidszorg",
  GHZ: "GHZ — Gehandicaptenzorg",
  JEUGD: "Jeugdzorg",
};

/**
 * Toeslagpercentages (bps) per sector. VOORBEELDWAARDEN — per CAO valideren met de klant.
 * DEFAULT = DEFAULT_ORT_RATES_BPS, zodat er één bron van waarheid blijft voor de fallback.
 */
export const ORT_SECTOR_PROFILES: Record<OrtSector, Record<OrtCategory, number>> = {
  DEFAULT: DEFAULT_ORT_RATES_BPS,
  VVT: {
    EVENING: 2200, //   +22%
    NIGHT: 4400, //     +44%
    SATURDAY: 4900, //  +49%
    SUNDAY: 6000, //    +60%
    HOLIDAY: 10000, //  +100%
  },
  GGZ: {
    EVENING: 2200,
    NIGHT: 5200, //     +52%
    SATURDAY: 5200,
    SUNDAY: 7500, //    +75%
    HOLIDAY: 10000,
  },
  GHZ: {
    EVENING: 2200,
    NIGHT: 4900, //     +49%
    SATURDAY: 4900,
    SUNDAY: 7200, //    +72%
    HOLIDAY: 10000,
  },
  JEUGD: {
    EVENING: 2500, //   +25%
    NIGHT: 5000, //     +50%
    SATURDAY: 5000,
    SUNDAY: 7500,
    HOLIDAY: 10000,
  },
};
