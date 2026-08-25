// "Aan zet"-items voor het samenwerking-detail: wat moet déze rol nú doen? Pure kern (geen DB, geen
// React) zodat de logica unit-testbaar is los van de server-component. De pagina levert de al-geladen
// tellingen aan; deze functie beslist welke handelings-zinnen in de TurnBanner komen.
//
// Kernregel (DOEL 1b, next-action-correctheid): bij een open dispuut is de cascade BEVROREN — dan zijn
// alle echte actieknoppen verborgen en toont de status-regel "werkproces bevroren". De cascade-todo's
// mogen dan NIET verschijnen (anders spreekt de banner de bevroren-kaart eronder tegen). De PROPOSED-
// todo (contract tekenen) staat los van de cascade-freeze: een dispuut kan alleen op een ACTIVE-
// samenwerking geopend worden, dus die tak is nooit tegelijk met `frozen` actief. De PROPOSED-tak is
// bovendien partij-bewust: bij een geblokkeerde plaatsing (ontbrekend/verlopen certificaat) krijgt
// alleen de ZZP'er de imperatief om aan te vullen; de opdrachtgever ziet een passieve "wacht op de
// ZZP'er"-regel — hij kan andermans certificaat niet uploaden (wrong-party next-action vermeden).

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
  /**
   * Aantal Invoice met lifecycleStatus OVERDUE (goedgekeurd maar te laat). Hoort net als APPROVED bij
   * de betalingsfase van de ZZP'er (spiegelt cascade/stage.ts `APPROVED || OVERDUE`, chain-steps.ts en
   * /acties `pending-tasks.ts`). Zonder dit veld toonde de TurnBanner géén actie voor een te-late
   * factuur, terwijl de status-regel en stepper op dezelfde pagina wél "markeer de betaling" vroegen.
   */
  overdueInvoices: number;
}

/** De "Aan zet"-zinnen voor de huidige rol; lege array = niets te doen (of bevroren). */
export function buildCollaborationTurnItems(input: TurnItemsInput): string[] {
  const todo: string[] = [];

  if (input.status === "PROPOSED") {
    if (input.placementBlocked) {
      // Alleen de ZZP'er kan zijn eigen certificaat aanvullen. Toon de opdrachtgever daarom een
      // passieve "wacht op de ZZP'er"-regel i.p.v. een imperatief die hij niet kan uitvoeren
      // (wrong-party next-action; consistent met de Contract-kaart en /acties). DOEL 1b.
      if (input.isClient && !input.isFreelancer) {
        todo.push(
          `Wacht tot de ZZP'er het ontbrekende of verlopen certificaat aanvult (${input.placementMissing}) — daarna kan het contract worden ondertekend.`,
        );
      } else {
        todo.push(
          `Vul het ontbrekende of verlopen certificaat aan (${input.placementMissing}) — daarna kan het contract worden ondertekend.`,
        );
      }
    } else {
      todo.push("Onderteken het contract om de opdracht te starten.");
    }
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
    // APPROVED én OVERDUE dragen dezelfde ZZP-actie (betaling markeren) — exact zoals cascade/stage.ts
    // (`APPROVED || OVERDUE`), chain-steps.ts en /acties (pending-tasks.ts). Zonder OVERDUE hier bleef
    // de TurnBanner leeg bij een te-late factuur terwijl de status-regel en stepper eronder wél
    // "markeer de betaling" toonden — screen↔screen/-acties-drift (DOEL 1b, next-action-correctheid).
    const payableInvoices = input.approvedInvoices + input.overdueInvoices;
    if (input.isFreelancer && payableInvoices > 0)
      todo.push(
        input.overdueInvoices > 0
          ? `${plural(payableInvoices, "goedgekeurde factuur", "goedgekeurde facturen")} (betaling te laat): markeer de ontvangst zodra je bent betaald.`
          : `${plural(payableInvoices, "goedgekeurde factuur", "goedgekeurde facturen")}: markeer de ontvangst zodra je bent betaald.`,
      );
  }

  return todo;
}
