// "Aan zet"-items voor het samenwerking-detail: wat moet déze rol nú doen? Pure kern (geen DB, geen
// React) zodat de logica unit-testbaar is los van de server-component. De pagina levert de al-geladen
// tellingen aan; deze functie beslist welke handelings-zinnen in de TurnBanner komen.
//
// Kernregel (DOEL 1b, next-action-correctheid): bij een open dispuut is de cascade BEVROREN — dan zijn
// alle echte actieknoppen verborgen en toont de status-regel "werkproces bevroren". De cascade-todo's
// mogen dan NIET verschijnen (anders spreekt de banner de bevroren-kaart eronder tegen). De PROPOSED-
// todo (contract tekenen) staat los van de cascade-freeze: een dispuut kan alleen op een ACTIVE-
// samenwerking geopend worden, dus die tak is nooit tegelijk met `frozen` actief.

import { plural } from "@/lib/plural";

export interface TurnItemsInput {
  /** Collaboration.status */
  status: string;
  /** Boolean(disputedAt) — cascade bevroren. */
  frozen: boolean;
  isClient: boolean;
  isFreelancer: boolean;
  /** PROPOSED: is de plaatsing geblokkeerd door een ontbrekend/verlopen certificaat? */
  placementBlocked: boolean;
  /** PROPOSED: labels van de ontbrekende/verlopen certificaten (voor de tekst). */
  placementMissing: string;
  /** Aantal Performance met status SUBMITTED (wacht op goedkeuring opdrachtgever). */
  submittedPerformances: number;
  /** Aantal Invoice met lifecycleStatus DRAFT (concept, klaar om in te dienen door ZZP'er). */
  draftInvoices: number;
  /** Aantal Invoice met lifecycleStatus SUBMITTED (wacht op goedkeuring opdrachtgever). */
  submittedInvoices: number;
  /** Aantal Invoice met lifecycleStatus APPROVED (ZZP'er markeert ontvangst na betaling). */
  approvedInvoices: number;
}

/** De "Aan zet"-zinnen voor de huidige rol; lege array = niets te doen (of bevroren). */
export function buildCollaborationTurnItems(input: TurnItemsInput): string[] {
  const todo: string[] = [];

  if (input.status === "PROPOSED") {
    todo.push(
      input.placementBlocked
        ? `Vul het ontbrekende of verlopen certificaat aan (${input.placementMissing}) — daarna kan het contract worden ondertekend.`
        : "Onderteken het contract om de opdracht te starten.",
    );
  }

  // Bij een open dispuut is de cascade bevroren: geen cascade-actie tonen (zie modulekop).
  if (input.status === "ACTIVE" && !input.frozen) {
    if (input.isClient && input.submittedPerformances > 0)
      todo.push(
        `${plural(input.submittedPerformances, "ingediende prestatie", "ingediende prestaties")} ${input.submittedPerformances === 1 ? "wacht" : "wachten"} op je goedkeuring.`,
      );
    if (input.isFreelancer && input.draftInvoices > 0)
      todo.push(
        `${plural(input.draftInvoices, "concept-factuur", "concept-facturen")} klaar om in te dienen.`,
      );
    if (input.isClient && input.submittedInvoices > 0)
      todo.push(
        `${plural(input.submittedInvoices, "factuur", "facturen")} ${input.submittedInvoices === 1 ? "wacht" : "wachten"} op je goedkeuring.`,
      );
    if (input.isFreelancer && input.approvedInvoices > 0)
      todo.push(
        `${plural(input.approvedInvoices, "goedgekeurde factuur", "goedgekeurde facturen")}: markeer de ontvangst zodra je bent betaald.`,
      );
  }

  return todo;
}
