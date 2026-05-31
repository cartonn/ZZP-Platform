// Cascade-"aan zet"-acties (PLATFORM_OVERHAUL.md §7). Pure logica, geen I/O: zet primitieve tellingen
// om naar NextAction-items voor het dashboard. Houdt de dashboard-strings op één geteste plek.

import { type NextAction } from "@/lib/next-actions";

// Prioriteiten sluiten aan op next-actions.ts: goedkeuring vragen is urgenter dan eigen indienen.
const P = { approve: 65, submit: 55, payment: 58 } as const;

export interface FreelancerCascadeInput {
  /** Concept-facturen klaar om in te dienen (Event C). */
  draftInvoices: number;
  /** Goedgekeurde facturen waarvan de betaling nog gemarkeerd moet worden (Event E). */
  approvedInvoices: number;
}

export function cascadeFreelancerActions(input: FreelancerCascadeInput): NextAction[] {
  const actions: NextAction[] = [];
  if (input.draftInvoices > 0) {
    actions.push({
      id: "cascade-draft-invoices",
      title: `${input.draftInvoices} concept-factuur(en) klaar om in te dienen`,
      href: "/facturen",
      tone: "attention",
      priority: P.submit,
    });
  }
  if (input.approvedInvoices > 0) {
    actions.push({
      id: "cascade-approved-invoices",
      title: `${input.approvedInvoices} goedgekeurde factuur(en): markeer de betaling zodra je bent betaald`,
      href: "/facturen",
      tone: "info",
      priority: P.payment,
    });
  }
  return actions;
}

export interface ClientCascadeInput {
  /** Ingediende uren/opleveringen die op goedkeuring wachten (Event B2). */
  performancesToApprove: number;
  /** Ingediende facturen die op goedkeuring wachten (Event D). */
  invoicesToApprove: number;
}

export function cascadeClientActions(input: ClientCascadeInput): NextAction[] {
  const actions: NextAction[] = [];
  if (input.performancesToApprove > 0) {
    actions.push({
      id: "cascade-performances-approve",
      title: `${input.performancesToApprove} ingediende uren/opleveringen wachten op je goedkeuring`,
      href: "/samenwerkingen",
      tone: "attention",
      priority: P.approve,
    });
  }
  if (input.invoicesToApprove > 0) {
    actions.push({
      id: "cascade-invoices-approve",
      title: `${input.invoicesToApprove} factuur(en) wachten op je goedkeuring`,
      href: "/facturen",
      tone: "attention",
      priority: P.approve,
    });
  }
  return actions;
}
