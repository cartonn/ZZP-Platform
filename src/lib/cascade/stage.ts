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
}

export interface CascadeStage {
  /** Machine-id van de fase. */
  id: string;
  /** Menselijke omschrijving vanuit het perspectief van de viewer. */
  label: string;
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
    return { id: "cancelled", label: "Geannuleerd", step: 0, totalSteps: total, youAreUp: false, tone: "info", cta: bekijk }; // prettier-ignore
  }
  if (input.collaborationStatus === "COMPLETED") {
    return { id: "completed", label: "Afgerond", step: total, totalSteps: total, youAreUp: false, tone: "success", cta: bekijk }; // prettier-ignore
  }
  if (input.disputed) {
    return { id: "disputed", label: "Dispuut — werkproces bevroren", step: 0, totalSteps: total, youAreUp: false, tone: "attention", cta: { label: "Bekijk dispuut", href } }; // prettier-ignore
  }
  if (input.latestInvoiceStatus === "PAID" || input.latestInvoiceStatus === "PROCESSED") {
    return { id: "paid", label: "Factuur betaald", step: total, totalSteps: total, youAreUp: false, tone: "success", cta: bekijk }; // prettier-ignore
  }

  // Stap 1 — contract ondertekenen.
  if (input.contractStatus !== "SIGNED") {
    if (input.contractStatus === "SENT") {
      // Beide partijen kunnen tekenen (assertParty); dus voor beide viewers "aan zet".
      return { id: "contract-sign", label: "Contract ter ondertekening", step: 1, totalSteps: total, youAreUp: true, tone: "attention", cta: { label: "Onderteken contract", href } }; // prettier-ignore
    }
    return { id: "contract-draft", label: "Voorgesteld — in afwachting van het contract", step: 1, totalSteps: total, youAreUp: false, tone: "info", cta: bekijk }; // prettier-ignore
  }

  // Stap 2 — uren/oplevering indienen (na getekend contract).
  const perf = input.latestPerformanceStatus;
  if (perf === "REJECTED") {
    return { id: "performance-rejected", label: "Uren/oplevering afgekeurd — corrigeer en dien opnieuw in", step: 2, totalSteps: total, youAreUp: isFreelancer, tone: "attention", cta: { label: isFreelancer ? "Corrigeer en dien opnieuw in" : "Bekijk samenwerking", href } }; // prettier-ignore
  }
  if (perf === null || perf === "DRAFT") {
    return { id: "performance-submit", label: isFreelancer ? "Dien je uren/oplevering in" : "Wacht op uren/oplevering van de ZZP'er", step: 2, totalSteps: total, youAreUp: isFreelancer, tone: isFreelancer ? "attention" : "info", cta: { label: isFreelancer ? "Uren/oplevering indienen" : "Bekijk samenwerking", href } }; // prettier-ignore
  }

  // Stap 3 — prestatie goedkeuren (opdrachtgever).
  if (perf === "SUBMITTED") {
    return { id: "performance-approve", label: isFreelancer ? "Ingediend — wacht op goedkeuring" : "Keur de ingediende uren/oplevering", step: 3, totalSteps: total, youAreUp: !isFreelancer, tone: isFreelancer ? "info" : "attention", cta: { label: !isFreelancer ? "Beoordeel prestatie" : "Bekijk samenwerking", href } }; // prettier-ignore
  }

  // perf === "APPROVED" → factuurfase. Beoordeel de factuurstatus.
  const inv = input.latestInvoiceStatus;
  if (inv === "REJECTED") {
    return { id: "invoice-rejected", label: "Factuur afgekeurd — corrigeer en dien opnieuw in", step: 4, totalSteps: total, youAreUp: isFreelancer, tone: "attention", cta: { label: isFreelancer ? "Corrigeer en dien opnieuw in" : "Bekijk samenwerking", href } }; // prettier-ignore
  }
  if (inv === null || inv === "DRAFT") {
    return { id: "invoice-submit", label: isFreelancer ? "Dien je factuur in" : "Wacht op de factuur van de ZZP'er", step: 4, totalSteps: total, youAreUp: isFreelancer, tone: isFreelancer ? "attention" : "info", cta: { label: isFreelancer ? "Factuur indienen" : "Bekijk samenwerking", href } }; // prettier-ignore
  }
  if (inv === "SUBMITTED") {
    return { id: "invoice-approve", label: isFreelancer ? "Factuur ingediend — wacht op goedkeuring" : "Keur de ingediende factuur", step: 5, totalSteps: total, youAreUp: !isFreelancer, tone: isFreelancer ? "info" : "attention", cta: { label: !isFreelancer ? "Beoordeel factuur" : "Bekijk samenwerking", href } }; // prettier-ignore
  }
  // inv === "APPROVED" of "OVERDUE" → betaling registreren (ZZP'er, na rechtstreekse betaling; Besluit 1).
  return {
    id: "payment",
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
