// Pure module: bepaalt of het profiel van een ZZP'er de harde facturatie-gegevens draagt die zijn
// facturen rechtsgeldig én betaalbaar maken — een proactieve tegenhanger van de per-factuur-
// compliancekaart (`invoice-legal.ts`). Waar die kaart één reeds-bestaande factuur toetst, kijkt dit
// naar het profiel zodra de ZZP'er dáádwerkelijk factureert, zodat een ontbrekend btw-id of IBAN
// wordt gesignaleerd vóór de vólgende (auto-)factuur weer onvolledig de deur uit gaat.
//
// Geen imports uit app/db — deterministisch en server-side afgeleid uit reeds opgehaalde gegevens.
// Het btw-oordeel leunt bewust op `assessInvoiceCompliance` als enige bron van waarheid (geen tweede,
// driftbare art. 35a-regel).

import { assessInvoiceCompliance } from "@/lib/invoice-legal";

export interface BillingReadinessInput {
  /** Heeft de ZZP'er ≥1 factuur daadwerkelijk uitgeschreven (issuedAt gezet)? */
  hasIssuedInvoice: boolean;
  /**
   * Bestaat er ≥1 uitgeschreven factuur met een btw-heffend regime (alles behalve EXEMPT/KOR)?
   * Bepaalt of het btw-id een harde eis is — bij uitsluitend vrijgestelde facturen niet.
   */
  hasVatChargingInvoice: boolean;
  /** Btw-identificatienummer van het profiel. */
  btwNumber?: string | null;
  /** SEPA-IBAN (betaalrekening) van het profiel. */
  iban?: string | null;
}

export type BillingGapKey = "btw" | "iban";

export interface BillingGap {
  key: BillingGapKey;
  /** Kort label voor de subtitel (kleine letter, leest als "Ontbreekt: …"). */
  label: string;
  /** Waarom dit gegeven nodig is. */
  hint: string;
}

export interface BillingReadiness {
  /** true = geen ontbrekende harde facturatie-gegevens (of er wordt nog niet gefactureerd). */
  ready: boolean;
  /** De ontbrekende harde gegevens, in vaste volgorde (btw vóór iban). */
  gaps: BillingGap[];
}

function present(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Beoordeelt de facturatie-gereedheid van een profiel. Puur en deterministisch: geen datum-
 * afhankelijke logica, geen side-effects.
 */
export function assessBillingReadiness(input: BillingReadinessInput): BillingReadiness {
  // Nog geen facturatie-activiteit → geen nudge. De aanloop (onboarding) wordt al gedekt door de
  // profiel-compleetheidstaak en de per-factuur-compliancekaart; een lege-profiel-ZZP'er die nooit
  // factureert hoeft hier geen ruis.
  if (!input.hasIssuedInvoice) return { ready: true, gaps: [] };

  const gaps: BillingGap[] = [];

  // Btw-id: leun op invoice-legal als enige bron van waarheid voor de art. 35a-eis. We voeden een
  // synthetische factuur waarvan élk niet-profielveld al voldaan is en het regime de bewezen
  // btw-heffing spiegelt; alleen het profiel-herstelbare, VERPLICHTE, niet-voldane btw-punt telt.
  // (Bij uitsluitend EXEMPT/KOR-facturen zet invoice-legal het btw-id op "recommended" → geen valse
  // "onwettig"-melding voor een vrijgestelde ondernemer.)
  const legal = assessInvoiceCompliance({
    invoiceNumber: "SYNTH",
    issuedAt: new Date(0),
    clientName: "SYNTH",
    hasDescription: true,
    hasAmounts: true,
    vatRegime: input.hasVatChargingInvoice ? "STANDARD_HIGH" : "EXEMPT",
    issuerBtw: input.btwNumber,
    // KvK is 'recommended' in invoice-legal; die surface-en we hier bewust niet (de per-factuur-kaart
    // toont 'm al). Door 'm als voldaan te voeden blijft alleen het btw-id over.
    issuerKvk: "SYNTH",
  });
  const btwMissing = legal.missing.some(
    (r) => r.key === "btw" && r.severity === "required" && r.fixTarget === "profile",
  );
  if (btwMissing) {
    gaps.push({
      key: "btw",
      label: "btw-identificatienummer",
      hint: "Verplicht op elke factuur waarop btw staat (art. 35a Wet OB).",
    });
  }

  // IBAN: geen wettelijke factuureis, maar zonder betaalrekening op de factuur kan de opdrachtgever je
  // niet betalen. Zodra je factureert hoort 'ie er dus te staan (regime-onafhankelijk).
  if (!present(input.iban)) {
    gaps.push({
      key: "iban",
      label: "betaalrekening (IBAN)",
      hint: "Zonder IBAN op de factuur kan de opdrachtgever je niet betalen.",
    });
  }

  return { ready: gaps.length === 0, gaps };
}
