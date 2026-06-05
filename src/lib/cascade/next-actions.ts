// Cascade-"aan zet"-acties (PLATFORM_OVERHAUL.md §7). Pure logica, geen I/O: zet primitieve tellingen
// om naar NextAction-items voor het dashboard. Houdt de dashboard-strings op één geteste plek.
//
// NB: alle cascade-acties verwijzen naar /samenwerkingen — daar staat het werkproces met de knoppen
// (indienen, betaling markeren, goedkeuren). De /facturen-pagina verbergt cascade-acties bewust, dus
// een href naar /facturen zou naar een plek leiden waar de handeling niet uitvoerbaar is.

import { type NextAction } from "@/lib/next-actions";
import { plural } from "@/lib/plural";

// Prioriteiten sluiten aan op next-actions.ts: goedkeuring vragen is urgenter dan eigen indienen;
// een AFKEURING (de loop is gebroken, werk/geld blijft hangen) is urgenter dan een eerste indiening.
const P = { approve: 65, rejected: 62, payment: 58, submit: 55 } as const;

export interface FreelancerCascadeInput {
  /** Concept-facturen klaar om in te dienen (Event C). */
  draftInvoices: number;
  /** Goedgekeurde facturen waarvan de betaling nog gemarkeerd moet worden (Event E). */
  approvedInvoices: number;
  /** Afgekeurde prestaties — corrigeren en opnieuw indienen (zijpad B'). */
  rejectedPerformances: number;
  /** Afgekeurde facturen — corrigeren en opnieuw indienen (zijpad D'). */
  rejectedInvoices: number;
}

export function cascadeFreelancerActions(input: FreelancerCascadeInput): NextAction[] {
  const actions: NextAction[] = [];
  if (input.rejectedPerformances > 0) {
    actions.push({
      id: "cascade-rejected-performances",
      title: `${plural(input.rejectedPerformances, "afgekeurde urenstaat/oplevering", "afgekeurde uren/opleveringen")} — corrigeer en dien opnieuw in`,
      href: "/samenwerkingen",
      tone: "attention",
      priority: P.rejected,
    });
  }
  if (input.rejectedInvoices > 0) {
    actions.push({
      id: "cascade-rejected-invoices",
      title: `${plural(input.rejectedInvoices, "afgekeurde factuur", "afgekeurde facturen")} — corrigeer en dien opnieuw in`,
      href: "/samenwerkingen",
      tone: "attention",
      priority: P.rejected,
    });
  }
  if (input.draftInvoices > 0) {
    actions.push({
      id: "cascade-draft-invoices",
      title: `${plural(input.draftInvoices, "concept-factuur", "concept-facturen")} klaar om in te dienen`,
      href: "/samenwerkingen",
      tone: "attention",
      priority: P.submit,
    });
  }
  if (input.approvedInvoices > 0) {
    actions.push({
      id: "cascade-approved-invoices",
      title: `${plural(input.approvedInvoices, "goedgekeurde factuur", "goedgekeurde facturen")}: markeer de betaling zodra je bent betaald`,
      href: "/samenwerkingen",
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
      title: `${plural(input.invoicesToApprove, "factuur", "facturen")} ${input.invoicesToApprove === 1 ? "wacht" : "wachten"} op je goedkeuring`,
      href: "/samenwerkingen",
      tone: "attention",
      priority: P.approve,
    });
  }
  return actions;
}
