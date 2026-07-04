// Cascade-fase per samenwerking — pure logica (geen I/O). De server berekent de inputs (laatste
// Performance-status, laatste Invoice.lifecycleStatus, contractStatus, dispuut) en deze helper
// leidt af: de menselijke fase, de voortgang (stap N van M in de keten), wie er "aan zet" is
// vanuit het perspectief van de viewer, en de primaire CTA (deep-link naar de samenwerking).
//
// Dit is het ontbrekende kernstuk: het dashboard toonde wél losse next-actions, maar niet
// "wat loopt er en hoe ver" per samenwerking. Drempels/strings sluiten aan op next-actions.ts.

import { type NextActionTone } from "@/lib/next-actions";
import { type CollaborationStatus, type ContractStatus } from "@/lib/enums";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";

export type CascadeViewer = "FREELANCER" | "CLIENT";

export interface CascadeStageInput {
  viewer: CascadeViewer;
  collaborationId: string;
  collaborationStatus: CollaborationStatus;
  contractStatus: ContractStatus;
  disputed: boolean;
  /** Status van de meest recente prestatie, of null als er nog geen is. */
  latestPerformanceStatus: PerformanceState | null;
  /** Lifecycle-status van de meest recente cascade-factuur, of null. */
  latestInvoiceStatus: InvoiceLifecycleState | null;
  /**
   * Is de meest recente prestatie nieuwer dan de meest recente factuur? Zo ja, dan hoort de factuur
   * bij een vorige cyclus en telt ze niet voor de huidige fase — de ZZP'er heeft na een betaalde
   * cyclus nieuwe uren ingediend (multi-cyclus op één ACTIVE-samenwerking; `createPerformance` gate't
   * alleen op ACTIVE). Zonder deze vlag zou een PAID-factuur van cyclus 1 de nieuwe, goed te keuren
   * uren van cyclus 2 maskeren met "Factuur betaald · niets te doen". Default false (single-cyclus).
   */
  performanceNewerThanInvoice?: boolean;
}

export interface CascadeStage {
  /** Machine-id van de fase. */
  id: string;
  /** Menselijke omschrijving vanuit het perspectief van de viewer. */
  label: string;
  /** Korte badge-tekst (past in een pill zonder de opdrachttitel te verdringen). */
  badgeLabel: string;
  /** Positie in de keten (0 = buiten de keten/terminaal-leeg). */
  step: number;
  totalSteps: number;
  /** Is de viewer nu aan zet? */
  youAreUp: boolean;
  tone: NextActionTone;
  /** Primaire actie met deep-link naar de samenwerking (alle cascade-acties staan daar). */
  cta: { label: string; href: string };
}

/** De happy-path keten: contract → uren indienen → goedkeuring → factuur indienen → goedkeuring → betaald. */
export const CASCADE_TOTAL_STEPS = 6;

export function cascadeStage(input: CascadeStageInput): CascadeStage {
  const href = `/samenwerkingen/${input.collaborationId}`;
  const isFreelancer = input.viewer === "FREELANCER";
  const total = CASCADE_TOTAL_STEPS;
  const bekijk = { label: "Bekijk samenwerking", href };

  // Terminale / overschrijvende toestanden eerst.
  if (input.collaborationStatus === "CANCELLED") {
    return { id: "cancelled", badgeLabel: "Geannuleerd", label: "Geannuleerd", step: 0, totalSteps: total, youAreUp: false, tone: "info", cta: bekijk }; // prettier-ignore
  }
  if (input.collaborationStatus === "COMPLETED") {
    return { id: "completed", badgeLabel: "Afgerond", label: "Afgerond", step: total, totalSteps: total, youAreUp: false, tone: "success", cta: bekijk }; // prettier-ignore
  }
  if (input.disputed) {
    return { id: "disputed", badgeLabel: "Dispuut", label: "Dispuut — werkproces bevroren", step: 0, totalSteps: total, youAreUp: false, tone: "attention", cta: { label: "Bekijk dispuut", href } }; // prettier-ignore
  }

  // Factuur van een vorige cyclus telt niet mee zodra er een nieuwere prestatie is (multi-cyclus).
  // Zo maskeert een betaalde cyclus-1-factuur nooit de nieuwe, nog te behandelen cyclus-2-uren; de
  // fase valt terug op de prestatie-evaluatie hieronder in plaats van op de terminale betaal-tak.
  const inv = input.performanceNewerThanInvoice ? null : input.latestInvoiceStatus;
  if (inv === "PAID" || inv === "PROCESSED") {
    return { id: "paid", badgeLabel: "Betaald", label: "Factuur betaald", step: total, totalSteps: total, youAreUp: false, tone: "success", cta: bekijk }; // prettier-ignore
  }

  // Stap 1 — contract ondertekenen. In productie kent het contract enkel de overgang DRAFT → SIGNED
  // (SENT wordt nergens gezet): een voorgestelde samenwerking (PROPOSED) is meteen ondertekenbaar en
  // élke partij kan tekenen (`assertParty` in signContract), wat de hele cascade deblokkeert. Dus is
  // voor beide viewers "aan zet" — net als de actiecentrum-taak (`contractSignTask`, aan beide
  // partijen). Voorheen viel DRAFT in een passieve "wordt nog voorbereid"-tak (youAreUp:false) die de
  // teken-CTA verborg op precies de schermen die "wat wordt van wie verwacht?" beloven, en die de
  // actiecentrum-taak tegensprak.
  if (input.contractStatus !== "SIGNED") {
    return { id: "contract-sign", badgeLabel: "Contract", label: "Contract ter ondertekening", step: 1, totalSteps: total, youAreUp: true, tone: "attention", cta: { label: "Onderteken contract", href } }; // prettier-ignore
  }

  // Stap 2 — uren/oplevering indienen (na getekend contract).
  const perf = input.latestPerformanceStatus;
  if (perf === "REJECTED") {
    return { id: "performance-rejected", badgeLabel: "Afgekeurd", label: "Uren/oplevering afgekeurd — corrigeer en dien opnieuw in", step: 2, totalSteps: total, youAreUp: isFreelancer, tone: "attention", cta: { label: isFreelancer ? "Corrigeer en dien opnieuw in" : "Bekijk samenwerking", href } }; // prettier-ignore
  }
  if (perf === null || perf === "DRAFT") {
    return { id: "performance-submit", badgeLabel: "Uren/oplevering", label: isFreelancer ? "Dien je uren/oplevering in" : "Wacht op uren/oplevering van de ZZP'er", step: 2, totalSteps: total, youAreUp: isFreelancer, tone: isFreelancer ? "attention" : "info", cta: { label: isFreelancer ? "Uren/oplevering indienen" : "Bekijk samenwerking", href } }; // prettier-ignore
  }

  // Stap 3 — prestatie goedkeuren (opdrachtgever).
  if (perf === "SUBMITTED") {
    return { id: "performance-approve", badgeLabel: "Ter goedkeuring", label: isFreelancer ? "Ingediend — wacht op goedkeuring" : "Keur de ingediende uren/oplevering", step: 3, totalSteps: total, youAreUp: !isFreelancer, tone: isFreelancer ? "info" : "attention", cta: { label: !isFreelancer ? "Beoordeel prestatie" : "Bekijk samenwerking", href } }; // prettier-ignore
  }

  // perf === "APPROVED" → factuurfase. Beoordeel de factuurstatus van de huidige cyclus (`inv`;
  // een vorige-cyclus-factuur is hierboven al genuld bij `performanceNewerThanInvoice`).
  if (inv === "REJECTED") {
    return { id: "invoice-rejected", badgeLabel: "Afgekeurd", label: "Factuur afgekeurd — corrigeer en dien opnieuw in", step: 4, totalSteps: total, youAreUp: isFreelancer, tone: "attention", cta: { label: isFreelancer ? "Corrigeer en dien opnieuw in" : "Bekijk samenwerking", href } }; // prettier-ignore
  }
  if (inv === null || inv === "DRAFT") {
    return { id: "invoice-submit", badgeLabel: "Factuur", label: isFreelancer ? "Dien je factuur in" : "Wacht op de factuur van de ZZP'er", step: 4, totalSteps: total, youAreUp: isFreelancer, tone: isFreelancer ? "attention" : "info", cta: { label: isFreelancer ? "Factuur indienen" : "Bekijk samenwerking", href } }; // prettier-ignore
  }
  if (inv === "SUBMITTED") {
    return { id: "invoice-approve", badgeLabel: "Ter goedkeuring", label: isFreelancer ? "Factuur ingediend — wacht op goedkeuring" : "Keur de ingediende factuur", step: 5, totalSteps: total, youAreUp: !isFreelancer, tone: isFreelancer ? "info" : "attention", cta: { label: !isFreelancer ? "Beoordeel factuur" : "Bekijk samenwerking", href } }; // prettier-ignore
  }
  // inv === "APPROVED" of "OVERDUE" → betaling registreren (ZZP'er, na rechtstreekse betaling; Besluit 1).
  return {
    id: "payment",
    badgeLabel: "Betaling",
    label: isFreelancer
      ? "Markeer de betaling zodra je bent betaald"
      : "Wacht op betalingsbevestiging",
    step: 6,
    totalSteps: total,
    youAreUp: isFreelancer,
    tone: inv === "OVERDUE" ? "attention" : "info",
    cta: { label: isFreelancer ? "Betaling markeren" : "Bekijk samenwerking", href },
  };
}

/**
 * Hoort de meest recente factuur bij een vorige cyclus? Waar wanneer de meest recente prestatie
 * strikt nieuwer is dan de meest recente factuur (beide op `createdAt desc`, dus index 0). De caller
 * geeft de twee `createdAt`-momenten door; ontbreekt er één, dan is er geen nieuwere cyclus (false).
 */
export function isPerformanceNewerThanInvoice(
  latestPerformanceCreatedAt: Date | null | undefined,
  latestInvoiceCreatedAt: Date | null | undefined,
): boolean {
  if (!latestPerformanceCreatedAt || !latestInvoiceCreatedAt) return false;
  return latestPerformanceCreatedAt.getTime() > latestInvoiceCreatedAt.getTime();
}
