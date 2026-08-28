// Doorlooptijd-nudge bij het vernieuwen van een bewijsstuk (ZZP'er).
//
// Een certificaat vernieuwen kost tijd bij de uitgevende instantie: een VOG aanvragen bij Justis
// duurt doorgaans 2 tot 8 weken. Een ZZP'er die pas begint als het certificaat bijna verloopt,
// verliest zijn inzetbaarheid terwijl er een geldig bewijsstuk ontbreekt. Deze pure logica bepaalt
// wanneer we hem daarop wijzen — ruim vóór het verval, op basis van de externe doorlooptijd.
//
// Pure functie, geen I/O, geen React. Server-side is de waarheid (CLAUDE.md regel 1).

import { type CredentialType, type CredentialStatus } from "@/lib/enums";

/**
 * Officiële, canonieke landelijke bron waar je dit bewijsstuk aanvraagt/vernieuwt. Alleen ingevuld
 * wanneer er één onbetwiste instantie is (bv. VOG → Justis). Types met een sterk variërend traject
 * (certificaat/licentie: uiteenlopende opleiders/instanties) krijgen bewust géén bron — een verkeerde
 * link stuurt de ZZP'er de mist in.
 */
export interface RenewalSource {
  /** Naam van de instantie, bv. "Justis". */
  label: string;
  /** Absolute https-URL naar de officiële aanvraag-/productpagina. */
  url: string;
}

/** Typische externe doorlooptijd om een nieuw bewijsstuk van dit type te verkrijgen. */
export interface RenewalLeadTime {
  /** Ondergrens in dagen (snelste realistische levering). */
  minDays: number;
  /** Bovengrens in dagen (waar je op moet plannen). */
  maxDays: number;
  /** Klaar-om-te-tonen omschrijving van de doorlooptijd, bv. "2 tot 8 weken". */
  phrase: string;
  /** Korte, feitelijke context over het aanvraagtraject. */
  note: string;
  /** Officiële aanvraagbron (één-klik naar de juiste instantie), of afwezig als die niet canoniek is. */
  source?: RenewalSource;
}

/**
 * Doorlooptijden per certificaattype. Alleen types met een reëel wachttraject staan hier; een
 * ontbrekend type levert géén nudge (bv. een verzekering verleng je doorgaans direct, een diploma
 * verloopt niet). De VOG is concreet (Justis); certificaat/licentie zijn bewust hedged omdat het
 * traject sterk varieert.
 */
export const RENEWAL_LEAD_TIMES: Partial<Record<CredentialType, RenewalLeadTime>> = {
  VOG: {
    minDays: 14,
    maxDays: 56,
    phrase: "2 tot 8 weken",
    note: "Een VOG vraag je aan via Justis; de doorlooptijd loopt op bij een papieren aanvraag.",
    source: { label: "Justis", url: "https://www.justis.nl/producten/vog" },
  },
  CERTIFICATE: {
    minDays: 7,
    maxDays: 42,
    phrase: "enkele weken",
    note: "Een hercertificering via een cursus of examen kost vaak enkele weken.",
  },
  LICENSE: {
    minDays: 7,
    maxDays: 42,
    phrase: "enkele weken",
    note: "Een licentie verlengen of hernieuwen kost vaak enkele weken.",
  },
};

/** Extra dagen ná de bovengrens van de doorlooptijd waarbinnen we alvast een rustige plan-hint tonen. */
export const RENEWAL_PLAN_AHEAD_BUFFER_DAYS = 30;

export type RenewalUrgency = "start_now" | "plan_ahead";
export type RenewalTone = "danger" | "warning" | "info";

export interface RenewalNudge {
  urgency: RenewalUrgency;
  tone: RenewalTone;
  leadTime: RenewalLeadTime;
  /** Volledige, klaar-om-te-tonen zin. */
  message: string;
}

export interface RenewalNudgeInput {
  type: CredentialType;
  status: CredentialStatus;
  /** Hele dagen tot verval (zie `daysUntilExpiry`); negatief = verlopen, `null` = geen vervaldatum. */
  daysUntilExpiry: number | null;
}

/**
 * Bepaalt of — en met welke urgentie — we de ZZP'er wijzen op de doorlooptijd van een vernieuwing.
 *
 * - `EXPIRED`: altijd `start_now` (danger) zolang het type een doorlooptijd kent — het gat is er al.
 * - `VERIFIED` met vervaldatum binnen de doorlooptijd: `start_now` (danger als het al krap is
 *   t.o.v. de ondergrens, anders warning) — nu starten, anders dreigt een gat in inzetbaarheid.
 * - `VERIFIED` net buiten de doorlooptijd (binnen de plan-buffer): `plan_ahead` (info) — rustig
 *   alvast inplannen.
 * - Anders `null`: geen doorlooptijd bekend, nog ruim op tijd, of geen relevante status.
 */
export function renewalNudge(input: RenewalNudgeInput): RenewalNudge | null {
  const { type, status, daysUntilExpiry } = input;
  const leadTime = RENEWAL_LEAD_TIMES[type];
  if (!leadTime) return null;

  if (status === "EXPIRED") {
    return {
      urgency: "start_now",
      tone: "danger",
      leadTime,
      message: `Dit duurt doorgaans ${leadTime.phrase}. Vraag zo snel mogelijk een nieuw bewijsstuk aan.`,
    };
  }

  if (status !== "VERIFIED") return null;
  if (daysUntilExpiry == null || daysUntilExpiry < 0) return null;

  const horizon = leadTime.maxDays + RENEWAL_PLAN_AHEAD_BUFFER_DAYS;
  if (daysUntilExpiry > horizon) return null;

  if (daysUntilExpiry <= leadTime.maxDays) {
    const tone: RenewalTone = daysUntilExpiry <= leadTime.minDays ? "danger" : "warning";
    return {
      urgency: "start_now",
      tone,
      leadTime,
      message: `Dit duurt doorgaans ${leadTime.phrase}. Vraag een nieuw bewijsstuk nu aan om inzetbaar te blijven.`,
    };
  }

  return {
    urgency: "plan_ahead",
    tone: "info",
    leadTime,
    message: `Houd rekening met de doorlooptijd: dit duurt doorgaans ${leadTime.phrase}.`,
  };
}
